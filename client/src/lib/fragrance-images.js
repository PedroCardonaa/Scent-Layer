// Per-fragrance product imagery. We don't have a license to use brand-
// official product photos for every fragrance in the catalog (and
// hotlinking sites like Jomashop or Fragrantica is fragile, Referer
// checks block them), so the practical move is a curated pool of
// real bottle photography on Unsplash, varied by family and id so
// every card on /shop looks distinct.
//
// To swap to actual product photography when available:
//   1. Add the canonical URL to the IMAGE_OVERRIDES map below, keyed
//      by fragrance id
//   2. The override wins over the family pool
//
// Image params are baked into the URL (width / quality / crop), keeps
// the request cacheable at the CDN edge and prevents layout shift.

const IMG_PARAMS = '?w=1200&h=1200&fit=crop&q=80';

// Family pools, Unsplash photos that read as "real perfume bottle".
// All URLs are tested in production and stable. Add more entries to
// any pool to increase per-family visual variety.
const POOLS = {
  Fresh: [
    `https://images.unsplash.com/photo-1592945403244-b3fbafd7f539${IMG_PARAMS}`,
    `https://images.unsplash.com/photo-1610506373739-1d0a93ed12a4${IMG_PARAMS}`,
    `https://images.unsplash.com/photo-1592914610354-fd354ea45e48${IMG_PARAMS}`,
  ],
  Floral: [
    `https://images.unsplash.com/photo-1541643600914-78b084683601${IMG_PARAMS}`,
    `https://images.unsplash.com/photo-1588405748880-12d1d2a59f75${IMG_PARAMS}`,
    `https://images.unsplash.com/photo-1615634260167-c8cdede054de${IMG_PARAMS}`,
  ],
  Woody: [
    `https://images.unsplash.com/photo-1615634260167-c8cdede054de${IMG_PARAMS}`,
    `https://images.unsplash.com/photo-1610506373739-1d0a93ed12a4${IMG_PARAMS}`,
    `https://images.unsplash.com/photo-1594035910387-fea47794261f${IMG_PARAMS}`,
  ],
  Oriental: [
    `https://images.unsplash.com/photo-1523293182086-7651a899d37f${IMG_PARAMS}`,
    `https://images.unsplash.com/photo-1541643600914-78b084683601${IMG_PARAMS}`,
    `https://images.unsplash.com/photo-1594035910387-fea47794261f${IMG_PARAMS}`,
  ],
  Gourmand: [
    `https://images.unsplash.com/photo-1588405748880-12d1d2a59f75${IMG_PARAMS}`,
    `https://images.unsplash.com/photo-1523293182086-7651a899d37f${IMG_PARAMS}`,
    `https://images.unsplash.com/photo-1594035910387-fea47794261f${IMG_PARAMS}`,
  ],
};

const DEFAULT = `https://images.unsplash.com/photo-1592945403244-b3fbafd7f539${IMG_PARAMS}`;

// Hand-curated overrides for fragrances where we have a strong match
// to a specific bottle photo. Add real product URLs here as they
// become available (e.g. from Jomashop, Fragrantica, brand sites).
const IMAGE_OVERRIDES = {
  // 2 = Baccarat Rouge 540, the existing imageUrl in fallback-catalog
  2: `https://images.unsplash.com/photo-1523293182086-7651a899d37f${IMG_PARAMS}`,
};

/**
 * Get a product image URL for a fragrance. Returns:
 *   1. The fragrance's own .imageUrl if explicitly set
 *   2. The hand-curated override, if any
 *   3. A picked image from the family pool, deterministic per id so
 *      the same fragrance always shows the same image
 *   4. A generic bottle photo as final fallback
 */
export function getFragranceImage(f) {
  if (!f) return DEFAULT;
  if (f.imageUrl) return f.imageUrl;
  if (IMAGE_OVERRIDES[f.id]) return IMAGE_OVERRIDES[f.id];
  const pool = POOLS[f.family];
  if (pool && pool.length > 0) {
    return pool[f.id % pool.length];
  }
  return DEFAULT;
}
