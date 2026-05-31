import { Link } from 'react-router-dom';
import { useRef, useState } from 'react';

/**
 * Animated wordmark in the nav. A miniature of the intro bottle (same
 * BDK silhouette) followed by the brand text. On hover, a tiny CSS
 * puff of three particles drifts up and right from the nozzle and
 * dissipates. Click returns to home.
 *
 * Tiny scope, high recognition value — the same bottle the user just
 * saw fill the screen during the intro now lives in the corner of
 * every page.
 */
export function NavWordmark({ theme }) {
  const [puff, setPuff] = useState(0);
  const cooldownRef = useRef(0);

  function handleEnter() {
    const now = performance.now();
    if (now - cooldownRef.current < 1100) return;
    cooldownRef.current = now;
    setPuff(p => p + 1);
  }

  return (
    <Link to="/" className={`nav-wordmark ${theme}`} onMouseEnter={handleEnter} aria-label="Scent Layer, home">
      <span className="nav-bottle" aria-hidden="true">
        <svg viewBox="0 0 24 38" width="24" height="38">
          <defs>
            <linearGradient id="navLiquid" x1="0" y1="14" x2="0" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#f7a86b" />
              <stop offset="60%"  stopColor="#fbc6c0" />
              <stop offset="100%" stopColor="#ff7fb0" />
            </linearGradient>
            <linearGradient id="navCap" x1="0" y1="2" x2="0" y2="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#3a3530" />
              <stop offset="60%"  stopColor="#0a0908" />
              <stop offset="100%" stopColor="#221d18" />
            </linearGradient>
          </defs>
          {/* Body */}
          <rect x="4" y="14" width="16" height="20" rx="1" fill="url(#navLiquid)" />
          <rect x="4" y="14" width="16" height="20" rx="1" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
          {/* Collar */}
          <rect x="8.5" y="12" width="7" height="1.4" fill="#c9a96e" />
          {/* Neck */}
          <rect x="10" y="10" width="4" height="2" fill="rgba(247,168,107,0.45)" />
          {/* Cap */}
          <path d="M 8 10 L 8 5 Q 8 2.5, 12 2.5 Q 16 2.5, 16 5 L 16 10 Z" fill="url(#navCap)" />
          {/* Cap highlight */}
          <ellipse cx="11" cy="4.5" rx="2.3" ry="1.2" fill="rgba(255,250,240,0.55)" />
        </svg>
        {/* Tiny puff cloud, re-renders on hover via key change */}
        {puff > 0 && (
          <span className="nav-bottle-puff" key={puff} aria-hidden="true">
            <i /><i /><i />
          </span>
        )}
      </span>
      <span className="nav-wordmark-text">
        <em>scent</em>
        <span className="nav-wordmark-dot" />
        layer
      </span>
    </Link>
  );
}
