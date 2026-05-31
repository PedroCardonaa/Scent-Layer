import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { stripe } from '../services/stripe.js';

const router = Router();

// Cheap unique-slug generator. 6 chars, base36, biased away from
// look-alikes (no 0, O, 1, I, l). Collision risk for ~60M codes is
// roughly 0.1%, fine at our scale and we retry on collision below.
function generateSlug() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

/**
 * GET /api/referrals/me
 * Returns the signed-in user's referral code + redemption stats.
 * Lazily generates the code on first hit so existing accounts get
 * one without a migration.
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    let user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, referralCode: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.referralCode) {
      // Generate + persist a unique slug. Retry on collision.
      for (let i = 0; i < 8; i++) {
        const slug = generateSlug();
        try {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { referralCode: slug },
            select: { id: true, referralCode: true },
          });
          break;
        } catch (e) {
          if (e?.code === 'P2002') continue; // unique violation, try another
          throw e;
        }
      }
    }

    const redemptions = await prisma.user.count({ where: { referredById: req.userId } });
    res.json({
      code: user.referralCode,
      redemptions,
      shareUrl: `${process.env.SITE_URL || 'https://scentlayer.example'}/?ref=${user.referralCode}`,
    });
  } catch (err) { next(err); }
});

/**
 * POST /api/referrals/attribute
 * Optional auth. Called by the signup flow to attribute a new user to
 * the inviter encoded in their ?ref= cookie. Idempotent, only sets
 * referredById once.
 */
router.post('/attribute', requireAuth, async (req, res, next) => {
  try {
    const { code } = z.object({ code: z.string().min(4).max(16) }).parse(req.body);
    const inviter = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!inviter || inviter.id === req.userId) {
      return res.json({ ok: false, reason: 'invalid' });
    }
    // Only set once. Re-attribution silently ignored.
    const current = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { referredById: true },
    });
    if (current?.referredById) return res.json({ ok: false, reason: 'already_attributed' });

    await prisma.user.update({
      where: { id: req.userId },
      data: { referredById: inviter.id },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

/**
 * POST /api/referrals/issue-coupon
 * Creates a one-shot Stripe Coupon for the referred user and returns
 * the promo code they can apply at checkout. 15% off, single use,
 * 90-day expiry. Idempotent per (user, code) via metadata.
 */
router.post('/issue-coupon', requireAuth, async (req, res, next) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Payments not configured' });

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, referredById: true },
    });
    if (!user?.referredById) return res.status(400).json({ error: 'No referrer on file' });

    // Generate a deterministic promo string so re-hits don't create
    // duplicates. Stripe's idempotency is via the Idempotency-Key
    // header; we'll just check for existing first.
    const promoLabel = `WELCOME-${user.id.slice(-6).toUpperCase()}`;
    const existing = await stripe.promotionCodes.list({ code: promoLabel, limit: 1 });
    if (existing.data?.[0]) {
      return res.json({ code: existing.data[0].code, percentOff: 15 });
    }

    const coupon = await stripe.coupons.create({
      percent_off: 15,
      duration: 'once',
      max_redemptions: 1,
      name: 'Scent Layer welcome discount',
      metadata: { userId: user.id, referredById: user.referredById },
    });
    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: promoLabel,
      max_redemptions: 1,
      expires_at: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
      metadata: { userId: user.id, referredById: user.referredById },
    });
    res.json({ code: promo.code, percentOff: 15 });
  } catch (err) { next(err); }
});

export default router;
