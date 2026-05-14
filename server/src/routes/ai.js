import { Router } from 'express';
import { z } from 'zod';
import { structuredCall } from '../services/anthropic.js';

const router = Router();

const VOICE = `You are the AI fragrance expert for Scent Layer, a luxury fragrance discovery and sourcing platform. Write in an editorial, evocative tone — confident, warm, never corny. Match the brand voice of niche perfumery copy: short sentences, sensory verbs, no marketing speak, no exclamation points. Be specific about notes and occasions. Never recommend purchasing; the platform sources bottles on request.`;

// ─── LAYER BUILDER ─────────────────────────────────────────────────────
const fragranceShape = z.object({
  name: z.string(),
  brand: z.string(),
  family: z.string(),
  top: z.string(),
  heart: z.string(),
  base: z.string(),
});

router.post('/layer', async (req, res, next) => {
  try {
    const { fragrances } = z.object({ fragrances: z.array(fragranceShape).min(2).max(4) }).parse(req.body);
    const list = fragrances.map((f, i) =>
      `${i + 1}. ${f.name} — ${f.brand} (${f.family})\n   Top: ${f.top}\n   Heart: ${f.heart}\n   Base: ${f.base}`
    ).join('\n\n');

    const result = await structuredCall({
      system: VOICE,
      user: `Analyze how these ${fragrances.length} fragrances layer together when worn on the same skin:\n\n${list}\n\nReturn the analysis in the structured tool call.`,
      toolName: 'layer_analysis',
      maxTokens: 1024,
      schema: {
        type: 'object',
        properties: {
          blendName: { type: 'string', description: 'A 2-3 word evocative name for the blend, e.g. "Amber Dusk" or "Forest Signal".' },
          tags: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 5, description: 'Single-word descriptors of the blend\'s feel (e.g. Warm, Smoky, Confident).' },
          character: { type: 'string', description: '2-3 sentences describing the blend\'s overall character and how the notes interact.' },
          topNotes: { type: 'string', description: 'Comma-separated dominant top notes from the combined opening (e.g. "Citrus, Pepper Spark").' },
          heartNotes: { type: 'string', description: 'Comma-separated dominant heart notes that emerge as the top fades.' },
          baseNotes: { type: 'string', description: 'Comma-separated dominant base notes that linger.' },
          occasions: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 6, description: 'Short occasion phrases (e.g. "Date Night", "Winter Evenings").' },
          tip: { type: 'string', description: 'One concrete application tip — which one to spray first, where, and why.' },
        },
        required: ['blendName', 'tags', 'character', 'topNotes', 'heartNotes', 'baseNotes', 'occasions', 'tip'],
      },
    });
    res.json(result);
  } catch (err) { next(err); }
});

// ─── COMPARE ───────────────────────────────────────────────────────────
router.post('/compare', async (req, res, next) => {
  try {
    const { a, b } = z.object({ a: fragranceShape, b: fragranceShape }).parse(req.body);
    const result = await structuredCall({
      system: VOICE,
      user: `Compare these two fragrances for someone deciding between them:\n\nA) ${a.name} — ${a.brand} (${a.family})\n   Top: ${a.top}\n   Heart: ${a.heart}\n   Base: ${a.base}\n\nB) ${b.name} — ${b.brand} (${b.family})\n   Top: ${b.top}\n   Heart: ${b.heart}\n   Base: ${b.base}\n\nWrite a single-paragraph verdict (4-6 sentences) that names each by their full name, contrasts what they do best, and ends with concrete guidance on when to reach for each. No bullet points.`,
      toolName: 'compare_verdict',
      maxTokens: 700,
      schema: {
        type: 'object',
        properties: { verdict: { type: 'string', description: 'The full comparison paragraph.' } },
        required: ['verdict'],
      },
    });
    res.json(result);
  } catch (err) { next(err); }
});

// ─── SIMILAR ───────────────────────────────────────────────────────────
router.post('/similar', async (req, res, next) => {
  try {
    const { fragrance } = z.object({ fragrance: z.string().min(2).max(120) }).parse(req.body);
    const result = await structuredCall({
      system: VOICE,
      user: `Someone loves the fragrance "${fragrance}". Recommend exactly 3 alternative fragrances that share its DNA. Mix tiers: one obvious crowd-pleaser, one understated niche option, one ambitious next-level pick. For each, name the actual brand and fragrance, explain the connection in 2-3 sentences, and call out the specific shared notes or qualities.`,
      toolName: 'similar_recommendations',
      maxTokens: 900,
      schema: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Fragrance name only (no brand).' },
                brand: { type: 'string' },
                rank: { type: 'string', description: 'Short label: "Best Match", "Great Alternative", or "Worth Exploring".' },
                why: { type: 'string', description: '2-3 sentences explaining the connection.' },
                match: { type: 'string', description: 'Short phrase naming the specific shared notes/qualities (e.g. "Amberwood core, long-lasting sillage").' },
              },
              required: ['name', 'brand', 'rank', 'why', 'match'],
            },
          },
        },
        required: ['recommendations'],
      },
    });
    res.json(result);
  } catch (err) { next(err); }
});

// ─── QUIZ ──────────────────────────────────────────────────────────────
router.post('/quiz', async (req, res, next) => {
  try {
    const { questions, answers } = z.object({
      questions: z.array(z.string()).min(3).max(8),
      answers: z.array(z.string()).min(3).max(8),
    }).parse(req.body);
    const pairs = questions.map((q, i) => `Q${i + 1}: ${q}\n→ ${answers[i] ?? '(skipped)'}`).join('\n\n');
    const result = await structuredCall({
      system: VOICE,
      user: `Based on these quiz answers, recommend ONE signature fragrance for this person. Pick a real, well-known fragrance (designer or niche — anything from Creed, Le Labo, Byredo, MFK, Dior, YSL, Tom Ford, Maison Margiela, Armani, Carolina Herrera, Viktor & Rolf, Escentric Molecules, Frederic Malle, Diptyque, Chanel, Guerlain, etc.). Write the description so it directly references their answers — make it feel personalized, not generic.\n\n${pairs}`,
      toolName: 'quiz_recommendation',
      maxTokens: 700,
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The fragrance name only.' },
          brand: { type: 'string' },
          description: { type: 'string', description: '4-6 sentences explaining why this fragrance matches their answers. Speak directly to them.' },
          tags: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 5 },
          why: { type: 'string', description: 'One-sentence summary of the core reasoning.' },
        },
        required: ['name', 'brand', 'description', 'tags', 'why'],
      },
    });
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
