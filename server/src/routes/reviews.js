import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

const RATINGS = ['LOVED', 'LIKED', 'CONFLICT', 'HATED'];
const upsertSchema = z.object({
  fragranceId: z.number().int(),
  rating:      z.enum(RATINGS),
  text:        z.string().max(2000).optional(),
  sizeMl:      z.number().int().min(1).max(200).optional(),
});

/**
 * GET /api/reviews/by-fragrance/:id
 * Public. Returns the rating breakdown + the most recent review text
 * snippets for a given fragrance. The breakdown is what powers the
 * eyebrow stat on FragrancePage ("89% loved it · 122 verified wearers").
 */
router.get('/by-fragrance/:id', async (req, res, next) => {
  try {
    const fragranceId = Number(req.params.id);
    if (!Number.isInteger(fragranceId)) return res.status(400).json({ error: 'Invalid id' });

    const rows = await prisma.review.findMany({
      where: { fragranceId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, rating: true, text: true, sizeMl: true, createdAt: true },
    });
    const breakdown = { LOVED: 0, LIKED: 0, CONFLICT: 0, HATED: 0 };
    rows.forEach(r => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });
    const total = rows.length;
    const positivePct = total > 0
      ? Math.round(((breakdown.LOVED + breakdown.LIKED) / total) * 100)
      : null;
    // Only ship the most recent 12 with text so payloads stay small.
    const recent = rows.filter(r => r.text && r.text.trim()).slice(0, 12);
    res.json({ total, breakdown, positivePct, recent });
  } catch (err) { next(err); }
});

/**
 * GET /api/reviews/mine
 * Auth required. Returns every review the user has written, joined
 * with the fragrance. Used by the profile page so the user can see /
 * edit their own past reviews.
 */
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.review.findMany({
      where: { userId: req.userId },
      include: { fragrance: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ items });
  } catch (err) { next(err); }
});

/**
 * POST /api/reviews
 * Auth required. Upserts the user's review for a fragrance, each user
 * gets one review per fragrance, re-posting updates it. Returns the saved
 * row with the fragrance attached.
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = upsertSchema.parse(req.body);
    const review = await prisma.review.upsert({
      where: { userId_fragranceId: { userId: req.userId, fragranceId: data.fragranceId } },
      update: { rating: data.rating, text: data.text, sizeMl: data.sizeMl },
      create: { userId: req.userId, ...data },
      include: { fragrance: true },
    });
    res.json({ review });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/reviews/:fragranceId
 * Auth required. Removes the user's review of a specific fragrance.
 */
router.delete('/:fragranceId', requireAuth, async (req, res, next) => {
  try {
    const fragranceId = Number(req.params.fragranceId);
    if (!Number.isInteger(fragranceId)) return res.status(400).json({ error: 'Invalid id' });
    await prisma.review.deleteMany({ where: { userId: req.userId, fragranceId } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
