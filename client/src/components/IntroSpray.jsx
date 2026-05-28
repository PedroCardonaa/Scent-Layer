import { useEffect, useRef, useState } from 'react';

/**
 * Full-screen intro overlay. SVG glass bottle (BDK Parfums silhouette)
 * + canvas particle spray. Played once per session (gating handled by
 * App.jsx via sessionStorage), dismissable by click / tap / Esc.
 *
 * Timeline (ms from mount):
 *   0,700     bottle drifts up + fades in
 *   700,1400  cap rises and tilts
 *   1400,1900 pump anticipates → snaps down → recovers
 *   1700      single radial spray burst fires from the nozzle
 *   2300+     continuous settle mist drizzles in from the top
 *   2400+     wordmark + caption fade in
 *   2600,3600 bottle fades and sinks
 *   ~5000     auto-finish, overlay fades out, onFinish() fires
 *
 * Replaces the previous three.js implementation, dropping ~243KB gzip
 * of R3F + drei + three since this version is canvas + SVG only.
 */

// Hardcoded design choices (the source files had a TweaksPanel for
// live editing; in prod we just bake in the picks).
const PALETTE = 'blush';
const DENSITY = 1.0;
const DURATION_MS = 5000;
const SHOW_WORDMARK = true;
const CAPTION = 'preparing your collection';

// ─── Spray palettes ────────────────────────────────────────────────
// First = base tone (70%), second = highlight, third = bright spark.
const PALETTES = {
  amber:    ['232,205,150', '245,235,210', '255,250,235'],
  blush:    ['247,168,160', '255,200,180', '255,235,230'],
  rose:     ['232,170,170', '245,220,220', '255,240,240'],
  emerald:  ['150,200,170', '210,235,220', '240,250,245'],
  smoke:    ['200,195,185', '230,225,215', '250,248,240'],
};

// ─── Spray controller — owns the particle array + emit modes ──────
// 'burst' fires ONCE when the bottle sprays (radial cone, ~520 particles).
// 'settle' is the continuous low-density drizzle that runs from the
// burst peak until the overlay fades.
class SprayController {
  constructor() {
    this.particles = [];
    this.settleOn = false;
    this.settleRate = 1.4;     // particles/frame when settling
    this.density = DENSITY;
    this.palette = PALETTE;
    this.nozzleX = 0.5;
    this.nozzleY = 0.42;
  }
  setNozzle(xRel, yRel) { this.nozzleX = xRel; this.nozzleY = yRel; }
  startSettle() { this.settleOn = true; }
  stopSettle() { this.settleOn = false; }

  fireBurst(w, h) {
    const reach = Math.hypot(w, h) / 2;
    const ox = w * this.nozzleX;
    const oy = h * this.nozzleY;
    const count = Math.floor(520 * this.density);
    const pal = PALETTES[this.palette] || PALETTES.amber;

    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
      const speed = (reach / 80) * (0.45 + Math.random() * 1.3);
      const wobble = (Math.random() - 0.5) * 0.4;

      const tone = Math.random();
      const color = tone < 0.65 ? pal[0] : tone < 0.92 ? pal[1] : pal[2];

      this.particles.push({
        x: ox + (Math.random() - 0.5) * 14,
        y: oy + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed + wobble,
        vy: Math.sin(angle) * speed,
        r: 22 + Math.random() * 40,
        color,
        maxAlpha: 0.18 + Math.random() * 0.28,
        age: 0,
        life: 2200 + Math.random() * 1600,
        kind: 'burst',
        gravityOn: 700 + Math.random() * 600,
      });
    }
  }

  emitSettle(w) {
    if (!this.settleOn) return;
    const target = this.settleRate * this.density;
    let n = Math.floor(target);
    if (Math.random() < target - n) n++;
    const pal = PALETTES[this.palette] || PALETTES.amber;
    for (let i = 0; i < n; i++) {
      const tone = Math.random();
      const color = tone < 0.7 ? pal[0] : tone < 0.95 ? pal[1] : pal[2];
      this.particles.push({
        x: Math.random() * w,
        y: -20 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.3 + Math.random() * 0.9,
        r: 6 + Math.random() * 18,
        color,
        maxAlpha: 0.08 + Math.random() * 0.14,
        age: 0,
        life: 6500 + Math.random() * 4500,
        kind: 'settle',
        wobble: Math.random() * Math.PI * 2,
      });
    }
  }

  step(dtMs, w, h) {
    this.emitSettle(w);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dtMs;
      if (p.age >= p.life || p.y > h + 80) { this.particles.splice(i, 1); continue; }
      if (p.kind === 'burst') {
        p.vx *= 0.975;
        p.vy *= 0.975;
        if (p.age > p.gravityOn) {
          p.vy += 0.018;
          p.vx += (Math.random() - 0.5) * 0.04;
        }
      } else {
        p.wobble += 0.02;
        p.vx = Math.sin(p.wobble) * 0.35;
        p.vy = Math.min(p.vy + 0.0015, 1.2);
      }
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  draw(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const t = p.age / p.life;
      const ramp = Math.min(1, t * (p.kind === 'burst' ? 12 : 6));
      const decay = (1 - t) * (1 - t);
      const alpha = p.maxAlpha * ramp * decay;
      if (alpha <= 0.001) continue;
      const r = p.r * (1 + t * (p.kind === 'burst' ? 2.4 : 0.8));
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      grad.addColorStop(0,   `rgba(${p.color},${alpha})`);
      grad.addColorStop(0.5, `rgba(${p.color},${alpha * 0.35})`);
      grad.addColorStop(1,   `rgba(${p.color},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ─── Bottle SVG — BDK Parfums silhouette ───────────────────────────
// Wide rectangular flask, glossy black domed cap, hairline gold collar,
// square paper label, vertical specular highlight. Cap + pump live in
// separate <g> elements so the animation timeline can transform them.
function Bottle({ bodyRef, capRef, pumpRef }) {
  return (
    <svg viewBox="0 0 200 460" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="liquid" x1="0" y1="190" x2="0" y2="410" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f7a86b" />
          <stop offset="45%" stopColor="#f9b89a" />
          <stop offset="62%" stopColor="#fbc6c0" />
          <stop offset="100%" stopColor="#ff7fb0" />
        </linearGradient>
        <linearGradient id="centerHi" x1="100" y1="190" x2="100" y2="410" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
          <stop offset="45%"  stopColor="rgba(255,255,255,0.55)" />
          <stop offset="60%"  stopColor="rgba(255,255,255,0.65)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id="leftEdge" x1="30" y1="0" x2="58" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(255,250,240,0.6)" />
          <stop offset="40%"  stopColor="rgba(255,250,240,0.15)" />
          <stop offset="100%" stopColor="rgba(255,250,240,0)" />
        </linearGradient>
        <linearGradient id="rightEdge" x1="142" y1="0" x2="170" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)" />
          <stop offset="60%"  stopColor="rgba(80,30,50,0.18)" />
          <stop offset="100%" stopColor="rgba(80,30,50,0.35)" />
        </linearGradient>
        <linearGradient id="capGloss" x1="0" y1="60" x2="0" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#3a3530" />
          <stop offset="15%"  stopColor="#1a1612" />
          <stop offset="60%"  stopColor="#0a0908" />
          <stop offset="100%" stopColor="#221d18" />
        </linearGradient>
        <radialGradient id="capDomeHi" cx="0.4" cy="0.25" r="0.55">
          <stop offset="0%"   stopColor="rgba(255,250,240,0.85)" />
          <stop offset="30%"  stopColor="rgba(255,250,240,0.25)" />
          <stop offset="100%" stopColor="rgba(255,250,240,0)" />
        </radialGradient>
        <linearGradient id="capSpec" x1="78" y1="0" x2="84" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(255,250,240,0)" />
          <stop offset="50%"  stopColor="rgba(255,250,240,0.55)" />
          <stop offset="100%" stopColor="rgba(255,250,240,0)" />
        </linearGradient>
        <linearGradient id="collar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#e8cd96" />
          <stop offset="45%"  stopColor="#c9a96e" />
          <stop offset="100%" stopColor="#7a5a30" />
        </linearGradient>
        <linearGradient id="stem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#5a4530" />
          <stop offset="100%" stopColor="#1f160e" />
        </linearGradient>
      </defs>

      {/* ──────────── BODY ──────────── */}
      <g ref={bodyRef}>
        <rect x="32" y="190" width="136" height="220" rx="6" fill="url(#liquid)" />
        <rect x="32" y="190" width="136" height="220" rx="6" fill="none"
              stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        <rect x="78"  y="190" width="44"  height="220" fill="url(#centerHi)" />
        <rect x="32"  y="190" width="28"  height="220" rx="6" fill="url(#leftEdge)" />
        <rect x="140" y="190" width="28"  height="220" rx="6" fill="url(#rightEdge)" />
        <path d="M 32 196 L 50 196 L 38 210 Z" fill="rgba(255,250,240,0.32)" />
        <path d="M 168 196 L 150 196 L 162 210 Z" fill="rgba(0,0,0,0.18)" />
        <line x1="42" y1="191" x2="158" y2="191" stroke="rgba(255,250,240,0.55)" strokeWidth="0.8" />
        <rect x="46"  y="200" width="2.5" height="200" rx="1" fill="rgba(255,250,240,0.5)" />
        <rect x="153" y="208" width="1.2" height="190"        fill="rgba(255,250,240,0.22)" />
        <rect x="32"  y="402" width="136" height="8"   rx="6" fill="rgba(120,40,70,0.18)" />

        {/* Label */}
        <g>
          <rect x="60" y="280" width="80" height="92" fill="#f7f3ec" />
          <rect x="60" y="280" width="80" height="92" fill="none" stroke="#0a0908" strokeWidth="0.6" />
          <text x="100" y="320" textAnchor="middle" fontFamily="Lora, serif" fontStyle="italic" fontWeight="600" fontSize="20"  fill="#0a0908">scent</text>
          <text x="100" y="340" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="6.5" letterSpacing="3"   fontWeight="500" fill="#0a0908">LAYER</text>
          <text x="100" y="356" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="4.5" letterSpacing="2.5" fill="rgba(10,9,8,0.65)">PARIS</text>
        </g>

        {/* Neck */}
        <rect x="84" y="174" width="32"   height="18" fill="rgba(247,168,107,0.45)" stroke="rgba(255,250,240,0.3)" strokeWidth="0.5" />
        <rect x="85" y="174" width="1.5"  height="18" fill="rgba(255,250,240,0.5)" />
        {/* Collar */}
        <rect x="80" y="170"   width="40" height="6"   rx="0.5" fill="url(#collar)" />
        <rect x="80" y="170"   width="40" height="1.2"          fill="rgba(255,245,220,0.65)" />
        <rect x="80" y="174.5" width="40" height="1"            fill="rgba(0,0,0,0.3)" />

        {/* Pump assembly */}
        <rect x="94" y="140" width="12"  height="30" fill="url(#stem)" />
        <rect x="94" y="140" width="1.2" height="30" fill="rgba(255,230,180,0.35)" />
        <g ref={pumpRef}>
          <rect x="84" y="128" width="32" height="14"  rx="1.5" fill="#1a1612" />
          <rect x="84" y="128" width="32" height="2.5"          fill="rgba(255,240,210,0.18)" />
          <rect x="84" y="139" width="32" height="2"            fill="rgba(0,0,0,0.55)" />
          <rect x="96" y="133" width="8"  height="1.8" rx="0.9" fill="rgba(255,200,130,0.4)" />
        </g>
      </g>

      {/* ──────────── CAP ──────────── */}
      <g ref={capRef}>
        <path
          d="M 70 168 L 70 140 Q 70 100, 100 100 Q 130 100, 130 140 L 130 168 Q 130 170, 128 170 L 72 170 Q 70 170, 70 168 Z"
          fill="url(#capGloss)" stroke="rgba(0,0,0,0.6)" strokeWidth="0.4"
        />
        <ellipse cx="90" cy="118" rx="22" ry="14" fill="url(#capDomeHi)" />
        <rect x="78" y="118" width="4" height="46" rx="2" fill="url(#capSpec)" />
        <path d="M 122 118 Q 132 130 130 168 L 130 168 Q 130 170 128 170 L 118 170 Z" fill="rgba(0,0,0,0.45)" />
        <ellipse cx="94" cy="107" rx="6" ry="2" fill="rgba(255,250,240,0.55)" />
        <rect x="70" y="168" width="60" height="1.2" fill="rgba(255,250,240,0.35)" />
      </g>
    </svg>
  );
}

// ─── Spray canvas — owns the controller + RAF loop ─────────────────
function SprayCanvas({ controllerRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const ctrl = controllerRef.current || (controllerRef.current = new SprayController());

    let w = 0, h = 0;
    function resize() {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      w = window.innerWidth; h = window.innerHeight;
      canvas.width  = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let last = performance.now();
    function loop(now) {
      const dt = Math.min(40, now - last);
      last = now;
      ctrl.step(dt, w, h);
      ctrl.draw(ctx, w, h);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    ctrl._getViewport = () => ({ w, h });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [controllerRef]);

  return <canvas ref={canvasRef} className="intro-canvas" />;
}

// ─── Main overlay ──────────────────────────────────────────────────
export function IntroSpray({ onFinish }) {
  const bottleWrapRef = useRef(null);
  const bodyRef = useRef(null);
  const capRef  = useRef(null);
  const pumpRef = useRef(null);
  const hudRef       = useRef(null);
  const skipHintRef  = useRef(null);
  const sprayCtrlRef = useRef(null);

  const [fading, setFading] = useState(false);
  const finishedRef = useRef(false);

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFading(true);
    sprayCtrlRef.current?.stopSettle();
    setTimeout(() => onFinish?.(), 620);
  }

  // Esc to skip
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') finish();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Timeline — one RAF loop drives bottle entry, cap rise, pump press,
  // spray fire, bottle fade, HUD reveal, and auto-finish at DURATION_MS.
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    let burstFired = false;
    let settleStarted = false;
    let hudShown = false;
    let skipShown = false;

    function tick() {
      const e = performance.now() - t0;
      const wrap = bottleWrapRef.current;
      const cap  = capRef.current;
      const pump = pumpRef.current;
      if (!wrap || !cap || !pump) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // Bottle entry: 0→700ms fade + rise
      const entry  = clamp(e / 700, 0, 1);
      const entryE = easeOutCubic(entry);
      const riseY  = (1 - entryE) * 60;
      const scale  = 0.92 + entryE * 0.08;
      const idleY  = e > 700 ? Math.sin((e - 700) / 900) * 6 : 0;

      // Cap rise: 700→1400ms + drift away
      const capT = clamp((e - 700) / 700, 0, 1);
      const capE = easeOutCubic(capT);
      const driftT = clamp((e - 1400) / 1400, 0, 1);
      const capLiftY  = -(capE * 90 + driftT * 220);
      const capDriftX = driftT * 110;
      const capTilt   = capE * 8 + driftT * 18;
      const capOpacity = 1 - driftT * driftT;
      cap.setAttribute('transform', `translate(${capDriftX} ${capLiftY}) rotate(${capTilt} 100 135)`);
      cap.style.opacity = String(capOpacity);

      // Pump anticipation + snap + release
      const antiT    = clamp((e - 1400) / 200, 0, 1);
      const pressT   = clamp((e - 1600) / 150, 0, 1);
      const releaseT = clamp((e - 1900) / 220, 0, 1);
      const pumpY = -antiT * 4 + pressT * 10 - releaseT * 6;
      pump.setAttribute('transform', `translate(0 ${pumpY})`);

      // Fire spray ONCE at snap
      if (!burstFired && e >= 1700) {
        burstFired = true;
        const ctrl = sprayCtrlRef.current;
        if (ctrl) {
          const rect = pump.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top  + rect.height / 2;
          const vp = ctrl._getViewport ? ctrl._getViewport() : { w: window.innerWidth, h: window.innerHeight };
          ctrl.setNozzle(cx / vp.w, cy / vp.h);
          ctrl.fireBurst(vp.w, vp.h);
        }
      }

      // Settle drizzle
      if (!settleStarted && e >= 2300) {
        settleStarted = true;
        sprayCtrlRef.current?.startSettle();
      }

      // Bottle fade + sink
      const fadeT  = clamp((e - 2600) / 1000, 0, 1);
      const bottleOpacity = (1 - fadeT) * (e < 700 ? entryE : 1);
      const sinkY  = fadeT * 30;
      wrap.style.transform = `translateY(${riseY + idleY + sinkY}px) scale(${scale})`;
      wrap.style.opacity   = String(bottleOpacity);

      if (!hudShown && e >= 2400) {
        hudShown = true;
        hudRef.current?.classList.add('show');
      }
      if (!skipShown && e >= 900) {
        skipShown = true;
        skipHintRef.current?.classList.add('show');
      }

      if (!finishedRef.current && e >= DURATION_MS) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`intro-spray ${fading ? 'fading' : ''}`}
      onClick={finish}
      role="dialog"
      aria-label="Scent Layer intro"
    >
      <SprayCanvas controllerRef={sprayCtrlRef} />

      <div className="intro-stage">
        <div ref={bottleWrapRef} className="intro-bottle-wrap" style={{ opacity: 0 }}>
          <Bottle bodyRef={bodyRef} capRef={capRef} pumpRef={pumpRef} />
        </div>
      </div>

      <div className="intro-vignette" aria-hidden="true" />

      <div ref={hudRef} className="intro-hud">
        {SHOW_WORDMARK && (
          <div className="intro-wordmark">
            scent<span className="intro-wordmark-dot" />layer
          </div>
        )}
        <div className="intro-caption">{CAPTION}</div>
        <div className="intro-progress"><i /></div>
      </div>

      <div ref={skipHintRef} className="intro-skip-hint">
        tap to enter
        <span className="intro-skip-key">esc</span>
      </div>
    </div>
  );
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function easeOutCubic(t)  { return 1 - Math.pow(1 - t, 3); }
