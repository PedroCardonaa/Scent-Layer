import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { sendSourceNotification } from '../services/email.js';

const router = Router();

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  fragrance: z.string().max(300).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
});

router.post('/', async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    const request = await prisma.sourceRequest.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        fragrance: data.fragrance ?? null,
        message: data.message ?? null,
      },
    });
    // Fire-and-forget the email so DB save isn't blocked by SMTP latency.
    sendSourceNotification(request).catch(e => console.error('[email]', e));
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
