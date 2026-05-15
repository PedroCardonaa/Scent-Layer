import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { sendSourceNotification } from '../services/email.js';

const router = Router();

const SAMPLE_SIZES = ['2ml', '5ml', '10ml', '30ml'];

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  fragrance: z.string().max(300).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
  kind: z.enum(['sample', 'bottle']).default('sample'),
  size: z.string().max(50).optional().nullable(),
}).refine(
  (d) => d.kind !== 'sample' || (d.size && SAMPLE_SIZES.includes(d.size)),
  { message: `Sample requests must pick a size from ${SAMPLE_SIZES.join(', ')}`, path: ['size'] }
);

router.post('/', async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    const request = await prisma.sourceRequest.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        fragrance: data.fragrance ?? null,
        message: data.message ?? null,
        kind: data.kind,
        size: data.size ?? null,
      },
    });
    sendSourceNotification(request).catch(e => console.error('[email]', e));
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
