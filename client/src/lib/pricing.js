// Client-side sample pricing — per-fragrance, derived from real
// full-bottle retail prices. Mirrors server/src/services/stripe.js so
// the cart shows the exact figures Stripe will charge. KEEP IN SYNC.
//
// Model (competitive with the decant market: Scent Split, DecantX,
// MicroPerfumes):
//   price(size) = retailPerMl × ml × markup(size) + vialFee(size)
//   rounded UP to the nearest $0.50, with a per-size floor.
//
// Smaller sizes carry a higher markup (more labor per ml), bigger
// sizes reward commitment. The vial fee covers the atomizer, label,
// and fill labor. Floors keep budget fragrances (e.g. Lattafa) from
// pricing below packaging cost.

// ── Real full-bottle retail prices (US, most common size) ─────────
// { bottle ml, retail price in cents }. Source of the per-ml cost.
export const BOTTLE_PRICES = {
  1:  { ml: 100, cents: 49500 },  // Creed Aventus
  2:  { ml: 70,  cents: 32500 },  // MFK Baccarat Rouge 540
  3:  { ml: 100, cents: 23000 },  // Byredo Blanche
  4:  { ml: 100, cents: 31000 },  // Le Labo Santal 33
  5:  { ml: 100, cents: 16500 },  // Margiela Jazz Club
  6:  { ml: 100, cents: 17500 },  // Dior Sauvage EDP
  7:  { ml: 90,  cents: 14500 },  // YSL Black Opium
  8:  { ml: 50,  cents: 25000 },  // Tom Ford Tobacco Vanille
  9:  { ml: 100, cents: 44500 },  // Creed Silver Mountain Water
  10: { ml: 100, cents: 15500 },  // Tom Ford Ombre Leather
  11: { ml: 100, cents: 16500 },  // Viktor & Rolf Flowerbomb
  12: { ml: 50,  cents: 25000 },  // Tom Ford Neroli Portofino
  13: { ml: 100, cents: 31000 },  // Le Labo Rose 31
  14: { ml: 100, cents: 13500 },  // Escentric Molecules Molecule 01
  15: { ml: 75,  cents: 12500 },  // Armani Acqua di Giò Profumo
  16: { ml: 80,  cents: 13500 },  // Carolina Herrera Good Girl
  17: { ml: 75,  cents: 20000 },  // Chanel Coromandel
  18: { ml: 50,  cents: 25000 },  // Tom Ford Oud Wood
  19: { ml: 75,  cents: 18500 },  // Diptyque Philosykos
  20: { ml: 75,  cents: 18500 },  // Diptyque Tam Dao
  21: { ml: 75,  cents: 18500 },  // Diptyque Do Son
  22: { ml: 50,  cents: 30500 },  // Frederic Malle Portrait of a Lady
  23: { ml: 50,  cents: 25000 },  // Frederic Malle Musc Ravageur
  24: { ml: 50,  cents: 31000 },  // Frederic Malle Carnal Flower
  25: { ml: 100, cents: 36000 },  // Amouage Interlude Man
  26: { ml: 100, cents: 36000 },  // Amouage Reflection Man
  27: { ml: 100, cents: 25000 },  // Penhaligon's Halfeti
  28: { ml: 75,  cents: 33500 },  // Penhaligon's Tragedy of Lord George
  29: { ml: 125, cents: 39500 },  // Parfums de Marly Layton
  30: { ml: 125, cents: 37000 },  // Parfums de Marly Herod
  31: { ml: 125, cents: 37000 },  // Parfums de Marly Pegasus
  32: { ml: 100, cents: 29000 },  // Xerjoff Naxos
  33: { ml: 100, cents: 27000 },  // Xerjoff Erba Pura
  34: { ml: 100, cents: 25000 },  // Nishane Hacivat
  35: { ml: 100, cents: 25000 },  // Nishane Ani
  36: { ml: 100, cents: 39500 },  // Roja Elysium
  37: { ml: 90,  cents: 38000 },  // Initio Side Effect
  38: { ml: 90,  cents: 41500 },  // Initio Oud for Greatness
  39: { ml: 100, cents: 26500 },  // Vilhelm Mango Skin
  40: { ml: 50,  cents: 32500 },  // Kilian Black Phantom
  41: { ml: 50,  cents: 29500 },  // Kilian Angels' Share
  42: { ml: 50,  cents: 29500 },  // Kilian Love, Don't Be Shy
  43: { ml: 75,  cents: 30000 },  // Memo Paris Marfa
  44: { ml: 100, cents: 3500  },  // Lattafa Khamrah
  45: { ml: 100, cents: 3000  },  // Lattafa Asad
  46: { ml: 50,  cents: 56000 },  // SHL 777 O Hira
  47: { ml: 50,  cents: 21000 },  // D.S. & Durga Debaser
  48: { ml: 50,  cents: 21000 },  // D.S. & Durga Bowmakers
  49: { ml: 50,  cents: 11000 },  // Imaginary Authors Memoirs of a Trespasser
  50: { ml: 100, cents: 25000 },  // BDK Gris Charnel
  51: { ml: 100, cents: 25000 },  // BDK Rouge Smoking
  52: { ml: 100, cents: 19500 },  // ELdO Like This
  53: { ml: 100, cents: 15500 },  // Terre d'Hermès
  54: { ml: 85,  cents: 16000 },  // Hermès Twilly Eau Ginger
  55: { ml: 100, cents: 17200 },  // Bleu de Chanel EDP
  56: { ml: 100, cents: 13500 },  // Guerlain L'Homme Idéal Cologne
  57: { ml: 120, cents: 18000 },  // Mancera Cedrat Boise
  58: { ml: 100, cents: 31000 },  // Le Labo Another 13
  59: { ml: 100, cents: 23000 },  // Byredo Gypsy Water
  60: { ml: 100, cents: 23000 },  // Byredo Bal d'Afrique
  61: { ml: 100, cents: 16500 },  // Margiela By the Fireplace
};

// ── Size model: markup + vial fee + floor per sample size ─────────
export const SIZE_MODEL = {
  '2ml':  { ml: 2,  markup: 1.40, vialCents: 150, floorCents: 400  },
  '5ml':  { ml: 5,  markup: 1.30, vialCents: 200, floorCents: 600  },
  '10ml': { ml: 10, markup: 1.25, vialCents: 250, floorCents: 1000 },
  '30ml': { ml: 30, markup: 1.15, vialCents: 400, floorCents: 2500 },
};

// Legacy flat prices — the fallback when a fragrance isn't in the
// table (free-text sample requests for fragrances we don't list).
export const SAMPLE_PRICES_CENTS = {
  '2ml':  600,
  '5ml':  1200,
  '10ml': 2200,
  '30ml': 5500,
};

/**
 * Unit price in cents for a sample of `size` of fragrance `fragranceId`.
 * Falls back to the flat table when the fragrance is unknown.
 */
export function unitPriceCents(size, fragranceId) {
  const m = SIZE_MODEL[size] ?? SIZE_MODEL['5ml'];
  const bottle = BOTTLE_PRICES[fragranceId];
  if (!bottle) return SAMPLE_PRICES_CENTS[size] ?? SAMPLE_PRICES_CENTS['5ml'];
  const perMl = bottle.cents / bottle.ml;
  const raw = perMl * m.ml * m.markup + m.vialCents;
  // Round UP to the nearest 50¢, respect the per-size floor.
  return Math.max(m.floorCents, Math.ceil(raw / 50) * 50);
}

/** Cheapest size (2ml) for "from $X" labels. */
export function fromPriceCents(fragranceId) {
  return unitPriceCents('2ml', fragranceId);
}

// Generic minimum, for copy in contexts with no specific fragrance.
export const FROM_PRICE_CENTS = Math.min(...Object.values(SAMPLE_PRICES_CENTS));

export function formatMoney(cents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(cents / 100) ? 0 : 2,
  }).format(cents / 100);
}

// Total cents for a cart-items array of { size, qty, fragranceId }.
export function cartSubtotalCents(items) {
  return items.reduce((sum, it) => sum + unitPriceCents(it.size, it.fragranceId) * it.qty, 0);
}
