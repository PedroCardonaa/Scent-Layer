import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const fragrances = await prisma.fragrance.findMany({ orderBy: { id: 'asc' } });
    res.json({ fragrances });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    const fragrance = await prisma.fragrance.findUnique({ where: { id } });
    if (!fragrance) return res.status(404).json({ error: 'Not found' });
    res.json({ fragrance });
  } catch (err) { next(err); }
});

export default router;
