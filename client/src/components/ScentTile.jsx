/**
 * ScentTile — the product-photo replacement for the clean-commerce
 * restyle. Product photography is removed site-wide; every product
 * visual is a soft family-tinted tile with a minimal line-art bottle
 * and the brand initial. Uniform, deliberate, loads instantly.
 */

// Family → [background tint, line color]. Neutral commerce pastels,
// desaturated so the tiles read as a system rather than candy.
const FAMILY_TINTS = {
  Fresh:    ['#e9f2f9', '#4a7ba6'],
  Floral:   ['#f9edf2', '#a65c7d'],
  Woody:    ['#f2eee7', '#8a6f4d'],
  Oriental: ['#f7efe3', '#a67f3f'],
  Gourmand: ['#f6efe9', '#96603c'],
};
const DEFAULT_TINT = ['#eef0f3', '#5f6368'];

function BottleGlyph({ stroke }) {
  return (
    <svg viewBox="0 0 64 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* cap */}
      <rect x="24" y="4" width="16" height="12" rx="2.5" stroke={stroke} strokeWidth="2.5" />
      {/* neck */}
      <path d="M27 16 v6 h10 v-6" stroke={stroke} strokeWidth="2.5" />
      {/* body */}
      <rect x="14" y="22" width="36" height="66" rx="7" stroke={stroke} strokeWidth="2.5" />
      {/* label line */}
      <line x1="24" y1="58" x2="40" y2="58" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ScentTile({ fragrance, showInitial = true, className = '' }) {
  const [bg, line] = FAMILY_TINTS[fragrance?.family] || DEFAULT_TINT;
  return (
    <div className={`scent-tile ${className}`} style={{ background: bg }} aria-hidden="true">
      <BottleGlyph stroke={line} />
      {showInitial && fragrance?.brand && (
        <span className="scent-tile-initial">{fragrance.brand}</span>
      )}
    </div>
  );
}
