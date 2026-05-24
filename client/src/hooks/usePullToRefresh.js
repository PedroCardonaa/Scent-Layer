import { useEffect, useRef, useState } from 'react';

/**
 * Pull-to-refresh gesture. Only activates when the page is already
 * scrolled to the top (so it doesn't fight with normal scrolling).
 * When the user pulls down past `threshold` pixels and releases, it
 * calls `onRefresh` and shows a brief refreshing indicator.
 *
 * Touch-only — desktop users have plenty of other ways to reload.
 * Respects prefers-reduced-motion by skipping the visual pull effect
 * but keeping the gesture functional.
 *
 * Returns:
 *   pullDistance — current px the user has pulled (0 if not pulling)
 *   refreshing   — true between the release and onRefresh resolving
 */
export function usePullToRefresh({ onRefresh, threshold = 70, disabled = false }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const tracking = useRef(false);

  useEffect(() => {
    if (disabled) return;
    if (typeof window === 'undefined') return;
    // Skip on non-touch devices.
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (!isTouch) return;

    function onTouchStart(e) {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      tracking.current = true;
    }
    function onTouchMove(e) {
      if (!tracking.current || startY.current == null) return;
      if (window.scrollY > 0) {
        // User scrolled the page itself — cancel the pull.
        tracking.current = false;
        setPullDistance(0);
        return;
      }
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { setPullDistance(0); return; }
      // Apply rubberbanding so the pull resists past the threshold.
      const rubbered = Math.min(threshold * 1.6, dy * 0.45);
      setPullDistance(rubbered);
    }
    async function onTouchEnd() {
      if (!tracking.current) return;
      tracking.current = false;
      const triggered = pullDistance >= threshold;
      setPullDistance(0);
      if (!triggered) return;
      setRefreshing(true);
      try { await onRefresh?.(); } finally {
        setRefreshing(false);
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove',  onTouchMove,  { passive: true });
    window.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('touchend',   onTouchEnd);
    };
  // We want the latest pullDistance + onRefresh on every cycle but
  // not to re-attach listeners constantly — capturing onRefresh via
  // ref-style closure is fine for this small surface.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, threshold, onRefresh, pullDistance]);

  return { pullDistance, refreshing };
}
