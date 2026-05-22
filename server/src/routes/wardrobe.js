import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const STATUSES = ['OWNED', 'SAMPLED', 'BACKUP'];
const upsertSchema = z.object({
  fragranceId: z.number().int(),
  status:      z.enum(STATUSES),
  sizeMl:      z.number().int().min(1).max(200).optional(),
  notes:       z.string().max(500).optional(),
});

/**
 * GET /api/wardrobe
 * Returns every wardrobe entry for the authenticated user with the
 * full Fragrance joined in so the client can render in one round trip.
 */
router.get('/', async (req, res, next) => {
  try {
    const items = await prisma.wardrobeItem.findMany({
      where: { userId: req.userId },
      include: { fragrance: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ items });
  } catch (err) { next(err); }
});

/**
 * POST /api/wardrobe
 * Idempotent upsert keyed on (userId, fragranceId, status). Re-posting
 * the same combination updates sizeMl/notes rather than creating a
 * duplicate row. Returns the full item with fragrance attached.
 */
router.post('/', async (req, res, next) => {
  try {
    const data = upsertSchema.parse(req.body);
    const item = await prisma.wardrobeItem.upsert({
      where: { userId_fragranceId_status: { userId: req.userId, fragranceId: data.fragranceId, status: data.status } },
      update: { sizeMl: data.sizeMl, notes: data.notes },
      create: { userId: req.userId, ...data },
      include: { fragrance: true },
    });
    res.json({ item });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/wardrobe/:fragranceId/:status
 * Removes a single status entry for a fragrance. Used when the user
 * toggles e.g. "I no longer own this" or moves between buckets.
 */
router.delete('/:fragranceId/:status', async (req, res, next) => {
  try {
    const fragranceId = Number(req.params.fragranceId);
    const status = String(req.params.status);
    if (!Number.isInteger(fragranceId)) return res.status(400).json({ error: 'Invalid id' });
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await prisma.wardrobeItem.deleteMany({
      where: { userId: req.userId, fragranceId, status },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
