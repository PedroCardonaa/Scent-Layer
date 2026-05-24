import { useEffect, useRef } from 'react';
import { onSpray } from '../lib/spray.js';

/**
 * Full-viewport canvas that paints particle bursts whenever something
 * calls triggerSpray(). Pointer-events: none so it never intercepts
 * clicks. Sits above page content but below modals / nav.
 *
 * The particles use 'lighter' composite blending for a glowing additive
 * look. Each particle fades in fast (~80ms), peaks, then fades out over
 * ~1.6,2.2s with a slow rise and dispersion, reads as fragrance mist
 * rather than smoke.
 *
 * On reduced-motion preference, we render a single, short, soft puff
 * instead of the full burst so the UI still acknowledges the click.
 */
export function SprayCanvas() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(0);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

    function resize() {
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onMq = (e) => { reducedMotionRef.current = e.matches; };
    mq.addEventListener?.('change', onMq);

    function loop() {
      ctx.clearRect(0, 0, w, h);
      const parts = particlesRef.current;
      ctx.globalCompositeOperation = 'lighter';

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += 16;
        const t = p.age / p.life;
        if (t >= 1) { parts.splice(i, 1); continue; }

        // Position: velocity decays over life. Cone particles also get
        // a slight upward buoyancy so they read as rising mist. Burst
        // particles expand radially with no gravity.
        p.vx *= 0.985;
        p.vy = p.buoyant === false ? p.vy * 0.985 : p.vy * 0.985 - 0.012;
        p.x += p.vx;
        p.y += p.vy;

        // Alpha: fast ramp-up, slow decay
        const ramp = Math.min(1, t * 8);
        const decay = 1 - t;
        const alpha = p.maxAlpha * ramp * decay * decay;

        // Radius grows as the particle disperses
        const r = p.r * (1 + t * 2.2);

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, `rgba(${p.color},${alpha})`);
        grad.addColorStop(0.5, `rgba(${p.color},${alpha * 0.35})`);
        grad.addColorStop(1, `rgba(${p.color},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    function spawn({ x, y, direction = 'up' }) {
      const reduced = reducedMotionRef.current;
      const isBurst = direction === 'burst';
      const count = reduced
        ? (isBurst ? 80 : 18)
        : (isBurst ? 420 : 110);

      // Direction → base angle (radians). 0 = right, -PI/2 = up.
      const baseAngle = (() => {
        switch (direction) {
          case 'up-right': return -Math.PI / 2 + 0.35;
          case 'up-left':  return -Math.PI / 2 - 0.35;
          case 'right':    return 0;
          case 'burst':    return 0; // unused, burst picks per-particle
          default:         return -Math.PI / 2;
        }
      })();

      // Distance the spray needs to travel to fill the viewport, used
      // to set particle speed on 'burst' mode so the mist actually
      // reaches the edges.
      const reach = Math.hypot(w, h) / 2;

      for (let i = 0; i < count; i++) {
        // Cone spread, narrow at first, wider further out
        const angle = isBurst
          ? Math.random() * Math.PI * 2
          : baseAngle + (Math.random() - 0.5) * 0.9;

        const speed = isBurst
          // Speed scales with viewport so the spray fills the screen
          // in ~1.4s regardless of size. Random factor adds depth.
          ? (reach / 90) * (0.5 + Math.random() * 1.1)
          : (reduced ? 1 + Math.random() * 1.2 : 2.5 + Math.random() * 5.5);

        // Slight initial offset so the burst doesn't look like a single point
        const ox = (Math.random() - 0.5) * (isBurst ? 16 : 6);
        const oy = (Math.random() - 0.5) * (isBurst ? 16 : 6);

        // Palette: warm amber/cream mist. Mostly the brand gold,
        // sprinkled with cream for the "light catching" highlights.
        const tone = Math.random();
        const color = tone < 0.65
          ? '232,205,150'   // warm amber gold
          : tone < 0.9
            ? '245,235,210' // soft cream
            : '255,250,235'; // bright cream highlight

        particlesRef.current.push({
          x: x + ox,
          y: y + oy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          // Burst particles are larger so the mist reads at viewport scale
          r: isBurst ? (24 + Math.random() * 36) : (8 + Math.random() * 16),
          color,
          maxAlpha: isBurst
            ? (0.22 + Math.random() * 0.28)
            : (0.18 + Math.random() * 0.22),
          age: 0,
          life: reduced
            ? (isBurst ? 1400 : 800)
            : (isBurst ? (2400 + Math.random() * 1200) : (1600 + Math.random() * 800)),
          // Burst particles have no buoyancy, they expand radially
          buoyant: !isBurst,
        });
      }
    }

    const off = onSpray(spawn);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      mq.removeEventListener?.('change', onMq);
      off();
    };
  }, []);

  return <canvas ref={canvasRef} className="spray-canvas" aria-hidden="true" />;
}
