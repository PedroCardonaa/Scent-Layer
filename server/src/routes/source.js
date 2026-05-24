import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { sendSourceNotification, sendCustomerConfirmation } from '../services/email.js';
import { submitLimiter } from '../middleware/rate-limit.js';

const router = Router();

const SAMPLE_SIZES = ['2ml', '5ml', '10ml', '30ml'];

// Line-item shape for cart orders.
const lineItemSchema = z.object({
  fragranceId: z.number().int().optional().nullable(),
  name: z.string().min(1).max(200),
  brand: z.string().max(200).optional().nullable(),
  size: z.string().max(50),
  qty: z.number().int().min(1).max(20).default(1),
});

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  fragrance: z.string().max(300).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  kind: z.enum(['sample', 'bottle', 'cart']).default('sample'),
  size: z.string().max(50).optional().nullable(),
  items: z.array(lineItemSchema).max(40).optional().nullable(),
})
  .refine(
    (d) => d.kind !== 'sample' || (d.size && SAMPLE_SIZES.includes(d.size)),
    { message: `Sample requests must pick a size from ${SAMPLE_SIZES.join(', ')}`, path: ['size'] }
  )
  .refine(
    (d) => d.kind !== 'cart' || (Array.isArray(d.items) && d.items.length > 0),
    { message: 'Cart orders must include at least one item', path: ['items'] }
  );

router.post('/', submitLimiter, async (req, res, next) => {
  try {
    const data = schema.parse(req.body);

    // For cart orders, synthesize the `fragrance` summary so the founder's
    // notification email subject line has a useful preview.
    let fragranceSummary = data.fragrance;
    if (data.kind === 'cart' && Array.isArray(data.items)) {
      const totalQty = data.items.reduce((sum, it) => sum + it.qty, 0);
      const firstName = data.items[0]?.name ?? 'cart';
      fragranceSummary = data.items.length === 1
        ? `${data.items[0].name} (${data.items[0].size} × ${data.items[0].qty})`
        : `${totalQty} items, ${firstName} +${data.items.length - 1} more`;
    }

    const request = await prisma.sourceRequest.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        fragrance: fragranceSummary ?? null,
        message: data.message ?? null,
        address: data.address ?? null,
        kind: data.kind,
        size: data.size ?? null,
        items: data.kind === 'cart' ? data.items : undefined,
      },
    });
    // Fire-and-forget both emails so DB save isn't blocked by SMTP latency.
    sendSourceNotification(request).catch(e => console.error('[email:notify]', e));
    sendCustomerConfirmation(request).catch(e => console.error('[email:confirm]', e));
    res.json({ ok: true, id: request.id });
  } catch (err) { next(err); }
});

export default router;
