import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const fragranceShape = z.object({
  id:     z.number().int().optional(),
  name:   z.string(),
  brand:  z.string(),
  family: z.string().optional(),
  top:    z.string().optional(),
  heart:  z.string().optional(),
  base:   z.string().optional(),
});

const saveSchema = z.object({
  name:       z.string().min(1).max(80),
  fragrances: z.array(fragranceShape).min(2).max(4),
  result:     z.record(z.any()), // full layer_analysis tool response
});

/**
 * GET /api/blends
 * Returns every saved blend for the authenticated user, newest first.
 */
router.get('/', async (req, res, next) => {
  try {
    const blends = await prisma.savedBlend.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ blends });
  } catch (err) { next(err); }
});

/**
 * POST /api/blends
 * Persists a blend the user composed in the Layer Builder. We store
 * both the input recipe (so we could re-run the analysis later if the
 * model improves) and the result verbatim (so the "My Blends" tab
 * doesn't have to re-hit Anthropic every render).
 */
router.post('/', async (req, res, next) => {
  try {
    const data = saveSchema.parse(req.body);
    const blend = await prisma.savedBlend.create({
      data: {
        userId:     req.userId,
        name:       data.name,
        fragrances: data.fragrances,
        result:     data.result,
      },
    });
    res.json({ blend });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/blends/:id
 * Rename a saved blend. Only the owner can update.
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(1).max(80) }).parse(req.body);
    const id = String(req.params.id);
    const found = await prisma.savedBlend.findUnique({ where: { id } });
    if (!found || found.userId !== req.userId) return res.status(404).json({ error: 'Not found' });
    const blend = await prisma.savedBlend.update({ where: { id }, data: { name } });
    res.json({ blend });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/blends/:id
 * Only the owner can delete.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const found = await prisma.savedBlend.findUnique({ where: { id } });
    if (!found || found.userId !== req.userId) return res.status(404).json({ error: 'Not found' });
    await prisma.savedBlend.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
