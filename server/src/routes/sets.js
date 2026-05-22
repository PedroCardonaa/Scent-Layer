import { Router } from 'express';

const router = Router();

/**
 * Discovery Sets are curated 3-pack bundles. They're not a database
 * model — they're static editorial content that ships with the API
 * (and is mirrored as a client fallback). When the user adds a set
 * to their cart, the client expands it into individual line items
 * priced at the set discount.
 *
 * To add a new set: append to SETS below, keep `slug` URL-safe and
 * unique, reference real fragrance IDs from prisma/seed.js, and pick
 * a size + discount that makes sense for the audience.
 */
const SETS = [
  {
    slug: 'niche-starter',
    name: 'The Niche Starter',
    eyebrow: 'For someone new to niche',
    hook: 'The three fragrances people always ask you to name. Sample all three before deciding which one is yours.',
    fragranceIds: [1, 2, 4],                  // Aventus, BR540, Santal 33
    size: '5ml',
    discountPct: 15,
    bg: 'linear-gradient(160deg,#2a1a14,#4a2820)',
    audience: 'New to niche fragrance',
  },
  {
    slug: 'cold-weather-three',
    name: 'Cold Weather Three',
    eyebrow: 'For October through March',
    hook: 'Tobacco, rum, leather. Built for low light, heavy coats, the kind of room with a fire in it.',
    fragranceIds: [8, 5, 10],                 // Tobacco Vanille, Jazz Club, Ombre Leather
    size: '5ml',
    discountPct: 15,
    bg: 'linear-gradient(160deg,#1a1208,#3a2812)',
    audience: 'For winter and evenings',
  },
  {
    slug: 'office-safe',
    name: 'Office Safe',
    eyebrow: 'For Monday morning',
    hook: 'Clean, confident, invisible to anyone who isn\'t standing next to you. Wear daily without anyone calling HR.',
    fragranceIds: [9, 3, 14],                 // Silver Mountain Water, Blanche, Molecule 01
    size: '5ml',
    discountPct: 15,
    bg: 'linear-gradient(160deg,#1a2028,#2a3a48)',
    audience: 'For work and daily wear',
  },
  {
    slug: 'date-night',
    name: 'Date Night, Their Place',
    eyebrow: 'For when you stay',
    hook: 'Three scents that work in the close-up — when they lean in, hand you a drink, sit on the same couch.',
    fragranceIds: [2, 4, 7],                  // BR540, Santal 33, Black Opium
    size: '5ml',
    discountPct: 15,
    bg: 'linear-gradient(160deg,#2a141c,#4a1c30)',
    audience: 'For evenings out and in',
  },
  {
    slug: 'fresh-summer',
    name: 'Bright Spring & Summer',
    eyebrow: 'For warm weather',
    hook: 'Mediterranean light and clean cotton. Citrus that doesn\'t turn sour an hour in. Built for heat.',
    fragranceIds: [12, 15, 9],                // Neroli Portofino, Acqua di Giò Profumo, Silver Mountain Water
    size: '5ml',
    discountPct: 15,
    bg: 'linear-gradient(160deg,#1a2820,#304838)',
    audience: 'For spring and summer',
  },
  {
    slug: 'florals-not-perfume',
    name: 'Florals That Don\'t Smell Like Perfume',
    eyebrow: 'For people who don\'t wear florals',
    hook: 'Three florals that get pulled away from anything sentimental — cumin, peony, jasmine handled with restraint.',
    fragranceIds: [13, 3, 11],                // Rose 31, Blanche, Flowerbomb
    size: '5ml',
    discountPct: 15,
    bg: 'linear-gradient(160deg,#2a1a28,#3a283a)',
    audience: 'For floral skeptics',
  },
];

router.get('/', (_req, res) => {
  res.json({ sets: SETS });
});

router.get('/:slug', (req, res) => {
  const set = SETS.find(s => s.slug === req.params.slug);
  if (!set) return res.status(404).json({ error: 'Set not found' });
  res.json({ set });
});

export default router;
