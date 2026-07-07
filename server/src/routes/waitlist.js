import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

const router = Router();

const schema = z.object({
  email: z.string().email().max(200),
  // Fixed buckets plus per-fragrance alert signups ("fragrance-<id>",
  // used by the restock/price-alert capture on fragrance pages).
  type: z.union([
    z.enum(['fotm', 'referral', 'general']),
    z.string().regex(/^fragrance-\d{1,6}$/),
  ]),
});

router.post('/', async (req, res, next) => {
  try {
    const { email, type } = schema.parse(req.body);
    await prisma.waitlistSignup.create({ data: { email: email.toLowerCase(), type } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
