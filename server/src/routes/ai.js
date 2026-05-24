import { Router } from 'express';
import { z } from 'zod';
import { structuredCall } from '../services/anthropic.js';
import { aiLimiter } from '../middleware/rate-limit.js';

const router = Router();

// Every AI endpoint is rate-limited so a runaway script can't drain
// the Anthropic budget. 30 requests / 10 min / IP.
router.use(aiLimiter);

const VOICE = `You write fragrance copy for Scent Layer, a sampling and concierge sourcing platform. Customers order 2ml / 5ml / 10ml / 30ml decants before committing to full bottles.

Voice — match this exactly:
- Short sentences. Verb-first when possible.
- Name notes by name (saffron, bergamot, tobacco). Never as categories ("florals", "woods", "spices").
- Specific contexts ("after rain", "with cashmere", "past midnight"). Never abstractions ("moments", "experiences", "journeys").
- Cite real fragrances by name and brand when relevant.

Banned constructions — do not use any of these:
- Opening verbs: "opens with", "settles into", "lingers on", "emerges as", "blossoms into", "unfolds", "dances"
- Adjectives: magnificent, delightful, enchanting, mesmerizing, captivating, luxurious, sensual (use specific ones instead)
- Marketing words: "embark", "embrace", "elevate", "journey", "experience", "indulge", "discover yourself"
- No exclamation points anywhere.
- No three-word listicles ("warm, smoky, sensual").

When you describe how a fragrance develops, describe what literally happens in literal time ("ten minutes in", "an hour later", "by the end of the night") instead of using motion verbs as metaphor.

When relevant, gently nudge toward sampling first (especially for polarizing or expensive scents) rather than committing to full bottles blind. Never push purchase — sourcing happens on request.`;

// ─── User context — wardrobe + reviews — fed to every endpoint ────────
// Optional. When provided, the AI gets a short summary of what the user
// owns, has sampled, and how they rated past samples. Lets the model
// avoid recommending things they already own and lean into the notes
// they've already endorsed.
const wardrobeShape = z.object({
  name: z.string(),
  brand: z.string(),
  status: z.enum(['OWNED', 'SAMPLED', 'BACKUP']),
});
const reviewShape = z.object({
  name: z.string(),
  brand: z.string(),
  rating: z.enum(['LOVED', 'LIKED', 'CONFLICT', 'HATED']),
  text: z.string().max(400).optional(),
});
const userContextShape = z.object({
  wardrobe: z.array(wardrobeShape).max(60).optional(),
  reviews:  z.array(reviewShape).max(40).optional(),
}).optional();

function formatUserContext(ctx) {
  if (!ctx) return '';
  const parts = [];
  if (ctx.wardrobe?.length) {
    const owned   = ctx.wardrobe.filter(w => w.status === 'OWNED');
    const sampled = ctx.wardrobe.filter(w => w.status === 'SAMPLED');
    if (owned.length) {
      parts.push(`This person already owns: ${owned.map(w => `${w.name} (${w.brand})`).join(', ')}. Do NOT recommend any of these.`);
    }
    if (sampled.length) {
      parts.push(`They have sampled: ${sampled.map(w => `${w.name} (${w.brand})`).join(', ')}.`);
    }
  }
  if (ctx.reviews?.length) {
    const loved    = ctx.reviews.filter(r => r.rating === 'LOVED');
    const liked    = ctx.reviews.filter(r => r.rating === 'LIKED');
    const conflict = ctx.reviews.filter(r => r.rating === 'CONFLICT' || r.rating === 'HATED');
    if (loved.length) {
      parts.push(`They LOVED: ${loved.map(r => `${r.name} (${r.brand})${r.text ? ` — "${r.text.slice(0, 120)}"` : ''}`).join('; ')}. Lean into the qualities of these.`);
    }
    if (liked.length) {
      parts.push(`They liked: ${liked.map(r => `${r.name} (${r.brand})`).join(', ')}.`);
    }
    if (conflict.length) {
      parts.push(`These did NOT work on their skin: ${conflict.map(r => `${r.name} (${r.brand})`).join(', ')}. Avoid recommending fragrances with very similar profiles.`);
    }
  }
  if (parts.length === 0) return '';
  return `\n\nPERSONAL CONTEXT (use this to personalize the recommendation):\n${parts.join('\n')}\n`;
}

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
    const { fragrances, userContext } = z.object({
      fragrances: z.array(fragranceShape).min(2).max(4),
      userContext: userContextShape,
    }).parse(req.body);
    const list = fragrances.map((f, i) =>
      `${i + 1}. ${f.name} — ${f.brand} (${f.family})\n   Top: ${f.top}\n   Heart: ${f.heart}\n   Base: ${f.base}`
    ).join('\n\n');

    const result = await structuredCall({
      system: VOICE,
      user: `Analyze how these ${fragrances.length} fragrances layer together when worn on the same skin:\n\n${list}\n${formatUserContext(userContext)}\nReturn the analysis in the structured tool call.`,
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
          reasoning: { type: 'string', description: 'One sentence explaining WHY this analysis came out the way it did. If user context was provided, reference it ("Because you sampled Santal 33 and rated it LOVED, I leaned into the woody-iris register"). If not, name the strongest note interaction driving the result.' },
        },
        required: ['blendName', 'tags', 'character', 'topNotes', 'heartNotes', 'baseNotes', 'occasions', 'tip', 'reasoning'],
      },
    });
    res.json(result);
  } catch (err) { next(err); }
});

// ─── COMPARE ───────────────────────────────────────────────────────────
router.post('/compare', async (req, res, next) => {
  try {
    const { a, b, userContext } = z.object({
      a: fragranceShape,
      b: fragranceShape,
      userContext: userContextShape,
    }).parse(req.body);
    const result = await structuredCall({
      system: VOICE,
      user: `Compare these two fragrances for someone deciding between them:\n\nA) ${a.name} — ${a.brand} (${a.family})\n   Top: ${a.top}\n   Heart: ${a.heart}\n   Base: ${a.base}\n\nB) ${b.name} — ${b.brand} (${b.family})\n   Top: ${b.top}\n   Heart: ${b.heart}\n   Base: ${b.base}\n${formatUserContext(userContext)}\nWrite a single-paragraph verdict (4-6 sentences) that names each by their full name, contrasts what they do best, and ends with concrete guidance on when to reach for each. If the choice is close or the fragrances are polarizing on skin, suggest sampling both before committing. No bullet points.`,
      toolName: 'compare_verdict',
      maxTokens: 700,
      schema: {
        type: 'object',
        properties: {
          verdict: { type: 'string', description: 'The full comparison paragraph.' },
          reasoning: { type: 'string', description: 'One sentence explaining how you weighed the two. If user context was provided, reference it ("Because you LOVED Santal 33, I tilted toward the woodier of the two"). If not, name the deciding axis.' },
        },
        required: ['verdict', 'reasoning'],
      },
    });
    res.json(result);
  } catch (err) { next(err); }
});

// ─── SIMILAR ───────────────────────────────────────────────────────────
router.post('/similar', async (req, res, next) => {
  try {
    const { fragrance, userContext } = z.object({
      fragrance: z.string().min(2).max(120),
      userContext: userContextShape,
    }).parse(req.body);
    const result = await structuredCall({
      system: VOICE,
      user: `Someone loves the fragrance "${fragrance}". Recommend exactly 3 alternative fragrances that share its DNA. Mix tiers: one obvious crowd-pleaser, one understated niche option, one ambitious next-level pick. For each, name the actual brand and fragrance, explain the connection in 2-3 sentences, and call out the specific shared notes or qualities.${formatUserContext(userContext)}`,
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
          reasoning: { type: 'string', description: 'One sentence explaining what about the source fragrance drove the three picks (which notes / structure / vibe you triangulated on). If user context was provided, reference it.' },
        },
        required: ['recommendations', 'reasoning'],
      },
    });
    res.json(result);
  } catch (err) { next(err); }
});

// ─── DESCRIBE ──────────────────────────────────────────────────────────
// Free-form text → 3 catalog matches with reasoning. Reads the catalog
// the user provides (rather than letting the model invent fragrances
// from training data) so every pick links to a real /fragrance/:id
// page on the site. The catalog is trimmed to id/name/brand/family +
// notes per entry to keep the prompt cheap — at 61 fragrances that's
// well under 4K tokens of context.
const catalogShape = z.array(z.object({
  id:     z.number().int(),
  name:   z.string(),
  brand:  z.string(),
  family: z.string(),
  top:    z.string().optional(),
  heart:  z.string().optional(),
  base:   z.string().optional(),
})).min(1).max(120);

router.post('/describe', async (req, res, next) => {
  try {
    const { description, catalog, userContext } = z.object({
      description: z.string().min(8).max(600),
      catalog: catalogShape,
      userContext: userContextShape,
    }).parse(req.body);

    const list = catalog.map(f =>
      `[id:${f.id}] ${f.name} — ${f.brand} (${f.family}) | top: ${f.top || '?'} | heart: ${f.heart || '?'} | base: ${f.base || '?'}`
    ).join('\n');

    const result = await structuredCall({
      system: VOICE,
      user: `Someone described a fragrance they smelled — or want to smell — like this:\n\n"${description}"\n\nPick the THREE closest matches from the catalog below. Match on note overlap, structural similarity, mood, and what the description literally says. If the description mentions something specific (a place, a memory, a person, a feeling), let that anchor your reasoning. ONLY pick from the catalog — return the exact id, name, and brand for each pick.\n\nCATALOG:\n${list}${formatUserContext(userContext)}`,
      toolName: 'describe_matches',
      maxTokens: 1100,
      schema: {
        type: 'object',
        properties: {
          matches: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            items: {
              type: 'object',
              properties: {
                id:    { type: 'integer', description: 'The exact catalog id of the matching fragrance.' },
                name:  { type: 'string',  description: 'Fragrance name only.' },
                brand: { type: 'string' },
                rank:  { type: 'string',  description: 'Short label: "Closest Match", "Strong Match", "Worth Considering".' },
                why:   { type: 'string',  description: '2-3 sentences linking the description to this fragrance. Reference specific words from the description.' },
                match: { type: 'string',  description: 'Short phrase naming the shared notes/qualities (e.g. "Smoky birch + vanilla core").' },
              },
              required: ['id', 'name', 'brand', 'rank', 'why', 'match'],
            },
          },
          reasoning: { type: 'string', description: 'One sentence on what about the description you triangulated on. If user context was provided, reference it.' },
        },
        required: ['matches', 'reasoning'],
      },
    });
    res.json(result);
  } catch (err) { next(err); }
});

// ─── QUIZ ──────────────────────────────────────────────────────────────
router.post('/quiz', async (req, res, next) => {
  try {
    const { questions, answers, userContext } = z.object({
      questions: z.array(z.string()).min(3).max(8),
      answers: z.array(z.string()).min(3).max(8),
      userContext: userContextShape,
    }).parse(req.body);
    const pairs = questions.map((q, i) => `Q${i + 1}: ${q}\n→ ${answers[i] ?? '(skipped)'}`).join('\n\n');
    const result = await structuredCall({
      system: VOICE,
      user: `Based on these quiz answers, recommend ONE primary signature fragrance for this person PLUS three alternates they should also try as samples to compare. Pick real, well-known fragrances (designer or niche — anything from Creed, Le Labo, Byredo, MFK, Dior, YSL, Tom Ford, Maison Margiela, Armani, Carolina Herrera, Viktor & Rolf, Escentric Molecules, Frederic Malle, Diptyque, Chanel, Guerlain, etc.). Write the primary description so it directly references their answers — make it feel personalized, not generic. The three alternates should be meaningfully different from each other so they get a range to sample, but all genuinely matching the answers. Do not repeat the primary in the alternates.\n\n${pairs}${formatUserContext(userContext)}`,
      toolName: 'quiz_recommendation',
      maxTokens: 1200,
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The primary fragrance name only.' },
          brand: { type: 'string' },
          description: { type: 'string', description: '4-6 sentences explaining why this fragrance matches their answers. Speak directly to them.' },
          tags: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 5 },
          why: { type: 'string', description: 'One-sentence summary of the core reasoning.' },
          alternates: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            description: 'Three additional fragrances they should also sample. Each meaningfully different from the primary and each other.',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                brand: { type: 'string' },
                why: { type: 'string', description: '1-2 sentences on why this alternate suits them.' },
                match: { type: 'string', description: 'Short phrase naming the shared quality (e.g. "Same warm woody base, lighter projection").' },
              },
              required: ['name', 'brand', 'why', 'match'],
            },
          },
          reasoning: { type: 'string', description: 'One sentence saying WHICH of their answers most drove the primary pick. If user context was provided, reference it too ("Plus you sampled Santal 33 and rated it LOVED, which reinforced the woody direction").' },
        },
        required: ['name', 'brand', 'description', 'tags', 'why', 'alternates', 'reasoning'],
      },
    });
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
