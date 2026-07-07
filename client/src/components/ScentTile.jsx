/**
 * ScentTile — the product-photo replacement for the clean-commerce
 * restyle. Every product visual is a family-tinted tile holding a
 * filled glass bottle. The bottle SHAPE, the LIQUID color, the CAP,
 * and the FILL LEVEL are all picked deterministically from the
 * fragrance id, so each of the 61 fragrances keeps its own consistent
 * bottle everywhere it appears — the grid reads like a shelf of
 * distinct bottles, not one repeated icon. Zero images, zero deps.
 */

// ── Family palettes ───────────────────────────────────────────────
// bg: soft two-tone tile gradient. liquids: hand-tuned [top, bottom]
// juice gradients — the per-id pick cycles through them so two Fresh
// fragrances side by side still read differently.
const FAMILIES = {
  Fresh: {
    bg: ['#eaf3fa', '#dcebf6'],
    liquids: [
      ['#a8d8ef', '#4d94c4'],
      ['#bde4db', '#4aa08c'],
      ['#b9d9f2', '#5b7fc9'],
      ['#cfeae4', '#66b3a1'],
    ],
  },
  Floral: {
    bg: ['#faeef3', '#f4dfe8'],
    liquids: [
      ['#f6c6d8', '#d4688f'],
      ['#f2b8c6', '#c14e73'],
      ['#f8d3e6', '#b96fa0'],
      ['#efc0d0', '#a35577'],
    ],
  },
  Woody: {
    bg: ['#f3efe8', '#eae2d4'],
    liquids: [
      ['#e0c39a', '#8a6238'],
      ['#d8b98f', '#6f4f2a'],
      ['#e6cfa8', '#96713d'],
      ['#d2ae85', '#7d5a33'],
    ],
  },
  Oriental: {
    bg: ['#f8f0e2', '#f1e3cb'],
    liquids: [
      ['#f0c088', '#b06a26'],
      ['#eab473', '#9c5a1e'],
      ['#f3cd96', '#c07c30'],
      ['#e8ab68', '#8a4d1a'],
    ],
  },
  Gourmand: {
    bg: ['#f7f0e9', '#efe1d3'],
    liquids: [
      ['#e3b590', '#8f5330'],
      ['#dba87e', '#7a452a'],
      ['#eec49b', '#a2603a'],
      ['#d69c72', '#6e3d22'],
    ],
  },
};
const DEFAULT_FAMILY = {
  bg: ['#eef0f3', '#e3e6ea'],
  liquids: [['#c4cbd4', '#7a828e']],
};

const CAPS = ['#1b1d22', '#2e2620', '#b08d4a', '#3a3f4a'];

// ── Bottle shapes ─────────────────────────────────────────────────
// All bodies are rounded rects (viewBox 0 0 120 200) so the liquid is
// a simple inset rect — no clipPaths, no per-instance SVG defs ids.
// { body, neck, cap, label? }
const SHAPES = [
  { // tall column
    body: { x: 38, y: 56, w: 44, h: 130, rx: 9 },
    neck: { x: 52, y: 40, w: 16, h: 16 },
    cap:  { x: 47, y: 18, w: 26, h: 24, rx: 5 },
  },
  { // wide flask (BR540 energy)
    body: { x: 22, y: 74, w: 76, h: 112, rx: 10 },
    neck: { x: 52, y: 56, w: 16, h: 18 },
    cap:  { x: 44, y: 26, w: 32, h: 32, rx: 15 },
    label: true,
  },
  { // rounded shoulders
    body: { x: 30, y: 66, w: 60, h: 120, rx: 24 },
    neck: { x: 52, y: 50, w: 16, h: 16 },
    cap:  { x: 46, y: 24, w: 28, h: 28, rx: 13 },
  },
  { // slim cylinder
    body: { x: 42, y: 52, w: 36, h: 134, rx: 17 },
    neck: { x: 53, y: 38, w: 14, h: 14 },
    cap:  { x: 49, y: 16, w: 22, h: 24, rx: 10 },
  },
  { // squat square
    body: { x: 26, y: 96, w: 68, h: 90, rx: 12 },
    neck: { x: 51, y: 74, w: 18, h: 22 },
    cap:  { x: 44, y: 46, w: 32, h: 30, rx: 7 },
    label: true,
  },
];

function pick(arr, seed) {
  return arr[Math.abs(seed) % arr.length];
}

function Bottle({ id, liquid, cap }) {
  const s = SHAPES[Math.abs(id) % SHAPES.length];
  const [liqTop, liqBottom] = liquid;
  // Fill level 62%–82%, stepped by id so it's stable per fragrance.
  const fill = 0.62 + ((id * 13) % 5) * 0.05;
  const inset = 5;
  const liqH = (s.body.h - inset * 2) * fill;
  const liqY = s.body.y + inset + (s.body.h - inset * 2) - liqH;
  const liqRx = Math.max(4, s.body.rx - inset);
  const gradId = `sl-liq-${id}`;

  return (
    <svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={liqTop} />
          <stop offset="100%" stopColor={liqBottom} />
        </linearGradient>
      </defs>

      {/* glass body */}
      <rect
        x={s.body.x} y={s.body.y} width={s.body.w} height={s.body.h} rx={s.body.rx}
        fill="rgba(255,255,255,0.45)"
        stroke="rgba(17,17,20,0.22)" strokeWidth="2"
      />
      {/* liquid */}
      <rect
        x={s.body.x + inset} y={liqY} width={s.body.w - inset * 2} height={liqH} rx={liqRx}
        fill={`url(#${gradId})`}
      />
      {/* glass highlight */}
      <rect
        x={s.body.x + inset + 3} y={s.body.y + inset + 4}
        width={Math.max(4, s.body.w * 0.1)} height={s.body.h - inset * 2 - 10}
        rx={3} fill="rgba(255,255,255,0.5)"
      />
      {/* label chip on the wider shapes */}
      {s.label && (
        <g>
          <rect
            x={s.body.x + s.body.w / 2 - 17} y={s.body.y + s.body.h * 0.42}
            width={34} height={26} rx={3}
            fill="rgba(255,255,255,0.92)" stroke="rgba(17,17,20,0.12)" strokeWidth="1"
          />
          <line
            x1={s.body.x + s.body.w / 2 - 9} y1={s.body.y + s.body.h * 0.42 + 13}
            x2={s.body.x + s.body.w / 2 + 9} y2={s.body.y + s.body.h * 0.42 + 13}
            stroke="rgba(17,17,20,0.4)" strokeWidth="1.5" strokeLinecap="round"
          />
        </g>
      )}
      {/* neck */}
      <rect
        x={s.neck.x} y={s.neck.y} width={s.neck.w} height={s.neck.h}
        fill="rgba(255,255,255,0.55)" stroke="rgba(17,17,20,0.22)" strokeWidth="2"
      />
      {/* cap */}
      <rect
        x={s.cap.x} y={s.cap.y} width={s.cap.w} height={s.cap.h} rx={s.cap.rx}
        fill={cap}
      />
      {/* cap glint */}
      <rect
        x={s.cap.x + 4} y={s.cap.y + 3} width={4} height={s.cap.h - 8} rx={2}
        fill="rgba(255,255,255,0.28)"
      />
    </svg>
  );
}

export function ScentTile({ fragrance, showInitial = true, className = '' }) {
  const fam = FAMILIES[fragrance?.family] || DEFAULT_FAMILY;
  const id = Number(fragrance?.id) || 0;
  const liquid = pick(fam.liquids, id * 7 + 3);
  const cap = pick(CAPS, id * 3 + 1);
  const [bg1, bg2] = fam.bg;

  return (
    <div
      className={`scent-tile ${className}`}
      style={{ background: `linear-gradient(160deg, ${bg1} 0%, ${bg2} 100%)` }}
      aria-hidden="true"
    >
      <Bottle id={id} liquid={liquid} cap={cap} />
      {showInitial && fragrance?.brand && (
        <span className="scent-tile-initial">{fragrance.brand}</span>
      )}
    </div>
  );
}
