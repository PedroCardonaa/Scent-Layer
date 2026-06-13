import { useEffect, useRef, useState } from 'react';
import { playPuff } from '../lib/sound.js';

/**
 * Full-screen intro overlay. A cinematic perfume still (generated hero
 * image) sits behind a live canvas mist that drifts and settles, so the
 * frozen plume in the photo reads as living fragrance in the air. Played
 * once per session (gating handled by App.jsx via sessionStorage),
 * dismissable by click / tap / Esc.
 *
 * Timeline (ms from mount):
 *   0          hero image fades in + begins a slow Ken Burns zoom (CSS)
 *   ~500       soft pump cue (playPuff)
 *   600+       settle mist begins drizzling fine champagne motes
 *   900        skip hint appears
 *   1400       wordmark + caption + progress fade in
 *   ~4500      auto-finish, overlay fades out, onFinish() fires
 *
 * Reduced motion: no particle mist, HUD shown immediately, quick finish.
 */

const DURATION_MS = 4500;
const SHOW_WORDMARK = true;
const CAPTION = 'preparing your collection';

// ─── Mist palette ──────────────────────────────────────────────────
// Champagne → blush motes tuned to sit on the warm photo without
// fighting the painted plume. base (70%), highlight, bright spark.
const MIST = ['247,200,170', '255,225,200', '255,242,228'];

// ─── Mist controller — a low-density settling drizzle ──────────────
// No directional burst: the hero photo already carries the spray. This
// just keeps a faint, living haze of motes drifting down over the frame.
class MistController {
  constructor() {
    this.particles = [];
    this.settleOn = false;
    this.settleRate = 1.2;     // particles/frame when settling
  }
  startSettle() { this.settleOn = true; }
  stopSettle() { this.settleOn = false; }

  emitSettle(w) {
    if (!this.settleOn) return;
    const target = this.settleRate;
    let n = Math.floor(target);
    if (Math.random() < target - n) n++;
    for (let i = 0; i < n; i++) {
      const tone = Math.random();
      const color = tone < 0.7 ? MIST[0] : tone < 0.95 ? MIST[1] : MIST[2];
      this.particles.push({
        x: Math.random() * w,
        y: -20 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.3 + Math.random() * 0.9,
        r: 6 + Math.random() * 18,
        color,
        maxAlpha: 0.06 + Math.random() * 0.12,
        age: 0,
        life: 6500 + Math.random() * 4500,
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
      p.wobble += 0.02;
      p.vx = Math.sin(p.wobble) * 0.35;
      p.vy = Math.min(p.vy + 0.0015, 1.2);
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
      const ramp = Math.min(1, t * 6);
      const decay = (1 - t) * (1 - t);
      const alpha = p.maxAlpha * ramp * decay;
      if (alpha <= 0.001) continue;
      const r = p.r * (1 + t * 0.8);
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

// ─── Mist canvas — owns the controller + RAF loop ──────────────────
function MistCanvas({ controllerRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const ctrl = controllerRef.current || (controllerRef.current = new MistController());

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

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [controllerRef]);

  return <canvas ref={canvasRef} className="intro-canvas" />;
}

// ─── Main overlay ──────────────────────────────────────────────────
export function IntroSpray({ onFinish }) {
  const hudRef       = useRef(null);
  const skipHintRef  = useRef(null);
  const mistCtrlRef  = useRef(null);

  const [fading, setFading] = useState(false);
  const finishedRef = useRef(false);

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFading(true);
    mistCtrlRef.current?.stopSettle();
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

  // Timeline — schedules the mist, audio cue, HUD reveal, and finish.
  useEffect(() => {
    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const timers = [];

    if (reduce) {
      // No drifting mist; reveal HUD straight away and finish quickly.
      hudRef.current?.classList.add('show');
      skipHintRef.current?.classList.add('show');
      timers.push(setTimeout(finish, 1600));
      return () => timers.forEach(clearTimeout);
    }

    timers.push(setTimeout(() => playPuff(), 500));
    timers.push(setTimeout(() => mistCtrlRef.current?.startSettle(), 600));
    timers.push(setTimeout(() => skipHintRef.current?.classList.add('show'), 900));
    timers.push(setTimeout(() => hudRef.current?.classList.add('show'), 1400));
    timers.push(setTimeout(finish, DURATION_MS));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className={`intro-spray ${fading ? 'fading' : ''}`}
      onClick={finish}
      role="dialog"
      aria-label="Scent Layer intro"
    >
      <div className="intro-hero" aria-hidden="true" />
      <MistCanvas controllerRef={mistCtrlRef} />

      <div className="intro-hero-scrim" aria-hidden="true" />
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
