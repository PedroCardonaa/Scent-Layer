// Tiny slug helper used by note and brand landing-page links so a note
// like "Pink Pepper" maps to /notes/pink-pepper and a brand like
// "Maison Margiela" maps to /brand/maison-margiela. Case-insensitive
// match on the receiving side so collection lookups don't need to
// store normalized copies.

export function slugify(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/&/g, 'and')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Used by NotePage / BrandPage to title-case a slug back into a heading
// (e.g. "pink-pepper" → "Pink Pepper") when there's no entry in the
// editorial catalog. The note catalog itself stores the canonical name.
export function unslugify(slug) {
  if (!slug) return '';
  return String(slug)
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Split a catalog field like "Bergamot, Saffron, Pink Pepper" into
// trimmed, deduped entries. Used everywhere note tags are rendered.
export function parseNotes(field) {
  if (!field) return [];
  return field
    .split(',')
    .map(n => n.trim())
    .filter(Boolean);
}
