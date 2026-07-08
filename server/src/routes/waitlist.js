import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { stripe } from '../services/stripe.js';

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

// ── WELCOME10 ─────────────────────────────────────────────────────
// A 10%-off-once promotion code handed to list signups. Lazily
// ensured in Stripe on the first signup after boot so no manual
// dashboard setup is needed. If Stripe isn't configured we simply
// don't advertise a code.
let welcomeEnsured = false;
async function ensureWelcomeCode() {
  if (!stripe) return null;
  if (welcomeEnsured) return 'WELCOME10';
  try {
    try {
      await stripe.coupons.retrieve('WELCOME10');
    } catch {
      await stripe.coupons.create({ id: 'WELCOME10', percent_off: 10, duration: 'once' });
    }
    const codes = await stripe.promotionCodes.list({ code: 'WELCOME10', limit: 1 });
    if (!codes.data?.length) {
      await stripe.promotionCodes.create({ coupon: 'WELCOME10', code: 'WELCOME10' });
    }
    welcomeEnsured = true;
    return 'WELCOME10';
  } catch (e) {
    console.error('[waitlist] could not ensure WELCOME10 promo', e.message);
    return null;
  }
}

router.post('/', async (req, res, next) => {
  try {
    const { email, type } = schema.parse(req.body);
    await prisma.waitlistSignup.create({ data: { email: email.toLowerCase(), type } });
    // Per-fragrance alerts are utility signups, not marketing lists —
    // only the marketing buckets earn the welcome discount.
    const promoCode = type.startsWith('fragrance-') ? null : await ensureWelcomeCode();
    res.json({ ok: true, promoCode });
  } catch (err) { next(err); }
});

export default router;
