// Client-side fallback for Discovery Sets. Mirrors server/src/routes/sets.js.
// Real source of truth is the API — this is the offline / unseeded /
// frontend-only deploy fallback so the /shop page never lands empty.
//
// Each set expands into N individual cart items at the set discount when
// the user clicks "Sample The Set". The cart already handles per-item
// pricing; the discount is applied client-side at add time so the
// existing checkout payload format stays unchanged.

export const FALLBACK_SETS = [
  {
    slug: 'niche-starter',
    name: 'The Niche Starter',
    eyebrow: 'For someone new to niche',
    hook: 'The three fragrances people always ask you to name. Sample all three before deciding which one is yours.',
    fragranceIds: [1, 2, 4],
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
    fragranceIds: [8, 5, 10],
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
    fragranceIds: [9, 3, 14],
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
    fragranceIds: [2, 4, 7],
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
    fragranceIds: [12, 15, 9],
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
    fragranceIds: [13, 3, 11],
    size: '5ml',
    discountPct: 15,
    bg: 'linear-gradient(160deg,#2a1a28,#3a283a)',
    audience: 'For floral skeptics',
  },
];
