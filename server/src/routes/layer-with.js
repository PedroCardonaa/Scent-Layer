import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { structuredCall } from '../services/anthropic.js';
import { aiLimiter } from '../middleware/rate-limit.js';

const router = Router();

// Cache reuse, AI calls only fire once per source fragrance ever,
// then served from DB. New fragrance = new call. Catalog edits to an
// existing fragrance don't invalidate the cache; if you want fresh
// recs after editing the catalog, delete the row manually.

const VOICE_SHORT = `You write fragrance copy for Scent Layer. Short sentences. Verb-first when possible. Notes named directly. No "opens with", "settles into", "lingers on". No exclamation points.`;

/**
 * GET /api/layer-with/:id
 * Returns 3 catalog fragrances that layer well with the given source.
 * Cached forever per fragrance id, regenerated only on cache miss.
 */
router.get('/:id', aiLimiter, async (req, res, next) => {
  try {
    const fragranceId = Number(req.params.id);
    if (!Number.isInteger(fragranceId)) return res.status(400).json({ error: 'Invalid id' });

    // Cache hit, return immediately. No AI call, no rate-limit hit
    // for the user even if many people visit the same fragrance page.
    const cached = await prisma.layerSuggestion.findUnique({ where: { fragranceId } });
    if (cached) return res.json({ partners: cached.partners, cached: true });

    // Need the source + the catalog to feed the model.
    const source = await prisma.fragrance.findUnique({ where: { id: fragranceId } });
    if (!source) return res.status(404).json({ error: 'Fragrance not found' });

    const catalog = await prisma.fragrance.findMany({
      where: { id: { not: fragranceId } },
      select: { id: true, name: true, brand: true, family: true, top: true, heart: true, base: true },
    });
    if (catalog.length === 0) return res.status(503).json({ error: 'Catalog empty' });

    const sourceLine = `${source.name}, ${source.brand} (${source.family})\n   Top: ${source.top}\n   Heart: ${source.heart}\n   Base: ${source.base}`;
    const catalogList = catalog.map(f =>
      `[id:${f.id}] ${f.name}, ${f.brand} (${f.family}) | top: ${f.top} | heart: ${f.heart} | base: ${f.base}`
    ).join('\n');

    const result = await structuredCall({
      system: VOICE_SHORT,
      user: `Pick EXACTLY 3 fragrances from the catalog that layer well with this source:\n\nSOURCE:\n${sourceLine}\n\nCATALOG (you must pick from this list, return their exact ids):\n${catalogList}\n\nFor each pick: explain in 1-2 sentences how the pair would actually wear together (which note overlaps, which contrasts), and name the shared/contrasting axis in a short phrase.`,
      toolName: 'layer_partners',
      maxTokens: 800,
      schema: {
        type: 'object',
        properties: {
          partners: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            items: {
              type: 'object',
              properties: {
                id:    { type: 'integer', description: 'Exact catalog id from the list.' },
                name:  { type: 'string',  description: 'Fragrance name only.' },
                brand: { type: 'string' },
                why:   { type: 'string',  description: '1-2 sentences on how the pair wears together.' },
                match: { type: 'string',  description: 'Short phrase naming the shared/contrasting axis (e.g. "Smoky woods amplify the rum").' },
              },
              required: ['id', 'name', 'brand', 'why', 'match'],
            },
          },
        },
        required: ['partners'],
      },
    });

    await prisma.layerSuggestion.create({
      data: {
        fragranceId,
        partners: result.partners,
        result,
      },
    });

    res.json({ partners: result.partners, cached: false });
  } catch (err) { next(err); }
});

export default router;
