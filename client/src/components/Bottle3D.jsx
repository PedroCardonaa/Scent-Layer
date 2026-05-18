import { useEffect, useRef, useState } from 'react';
import { triggerSpray } from '../lib/spray.js';

/**
 * CSS 3D perfume bottle. Built from layered divs with perspective +
 * preserve-3d so we get genuine depth without shipping three.js.
 *
 * Interaction:
 *   - Idle: gentle float + subtle Y rotation
 *   - Hover: scales up slightly + tilts toward cursor
 *   - Click/tap: cap lifts, atomizer presses, a burst is dispatched via
 *     triggerSpray() so the global SprayCanvas can render the mist
 *
 * Position the nozzle's center on screen with getBoundingClientRect so
 * the canvas knows where to spawn particles.
 */
export function Bottle3D() {
  const wrapRef = useRef(null);
  const nozzleRef = useRef(null);
  const [spraying, setSpraying] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [usedOnce, setUsedOnce] = useState(false);

  // Track mouse over the bottle area for subtle parallax tilt.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      setTilt({ x: dy * -8, y: dx * 14 });
    }
    function onLeave() { setTilt({ x: 0, y: 0 }); }
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  function spray() {
    if (spraying) return;
    setSpraying(true);
    setUsedOnce(true);

    // Wait for the cap to start rising before firing the burst so the
    // mist appears to come out of the bottle, not the cap.
    setTimeout(() => {
      const nozzle = nozzleRef.current;
      if (nozzle) {
        const r = nozzle.getBoundingClientRect();
        triggerSpray({
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          direction: 'up-right',
        });
      }
    }, 220);

    // Reset the animation state.
    setTimeout(() => setSpraying(false), 1400);
  }

  function handleKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      spray();
    }
  }

  return (
    <div className="bottle3d-stage" ref={wrapRef}>
      <div
        className={`bottle3d ${spraying ? 'spraying' : ''}`}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
        role="button"
        tabIndex={0}
        aria-label="Tap to spray"
        onClick={spray}
        onKeyDown={handleKey}
      >
        {/* Cap — lifts off when spraying */}
        <div className="bottle3d-cap">
          <div className="bottle3d-cap-face bottle3d-cap-front" />
          <div className="bottle3d-cap-face bottle3d-cap-back" />
          <div className="bottle3d-cap-face bottle3d-cap-left" />
          <div className="bottle3d-cap-face bottle3d-cap-right" />
          <div className="bottle3d-cap-face bottle3d-cap-top" />
        </div>

        {/* Atomizer collar */}
        <div className="bottle3d-collar" />

        {/* Nozzle — origin point for the spray burst */}
        <div className="bottle3d-nozzle" ref={nozzleRef} />

        {/* Bottle body — front + back + sides give it real depth */}
        <div className="bottle3d-body">
          <div className="bottle3d-body-face bottle3d-body-front">
            <div className="bottle3d-liquid" />
            <div className="bottle3d-label">
              <span className="bottle3d-label-brand">Scent Layer</span>
              <span className="bottle3d-label-rule" />
              <span className="bottle3d-label-line">No. 01 — Édition</span>
            </div>
            <div className="bottle3d-shine" />
          </div>
          <div className="bottle3d-body-face bottle3d-body-back" />
          <div className="bottle3d-body-face bottle3d-body-left" />
          <div className="bottle3d-body-face bottle3d-body-right" />
          <div className="bottle3d-body-face bottle3d-body-top" />
          <div className="bottle3d-body-face bottle3d-body-bottom" />
        </div>

        {/* Soft floor shadow */}
        <div className="bottle3d-shadow" />
      </div>

      <p className={`bottle3d-hint ${usedOnce ? 'used' : ''}`}>Tap to spray</p>
    </div>
  );
}
