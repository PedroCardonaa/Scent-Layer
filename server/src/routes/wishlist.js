import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.userId },
      include: { fragrance: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ wishlist: items.map(i => i.fragrance), ids: items.map(i => i.fragranceId) });
  } catch (err) { next(err); }
});

router.post('/:fragranceId', async (req, res, next) => {
  try {
    const fragranceId = Number(req.params.fragranceId);
    if (!Number.isInteger(fragranceId)) return res.status(400).json({ error: 'Invalid id' });
    await prisma.wishlistItem.upsert({
      where: { userId_fragranceId: { userId: req.userId, fragranceId } },
      update: {},
      create: { userId: req.userId, fragranceId },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/:fragranceId', async (req, res, next) => {
  try {
    const fragranceId = Number(req.params.fragranceId);
    if (!Number.isInteger(fragranceId)) return res.status(400).json({ error: 'Invalid id' });
    await prisma.wishlistItem.deleteMany({ where: { userId: req.userId, fragranceId } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
