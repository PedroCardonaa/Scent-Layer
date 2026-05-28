import { useCallback, useRef, useState } from 'react';

/**
 * Long-press / hold-to-trigger hook. Returns a set of handlers to spread
 * onto an element plus a `progress` value (0..1) callers can use to
 * render a fill / ring animation while the user is holding.
 *
 * Works for touch (mobile) and pointer (mouse / pen). Cancels on move
 * past `cancelDistance` or on release before `duration`.
 *
 * Designed to coexist with click handlers: a short click never triggers
 * the long-press path. The element's onClick still fires normally on
 * release-before-threshold.
 */
export function useLongPress({
  onLongPress,
  duration = 600,
  cancelDistance = 8,
  disabled = false,
}) {
  const timerRef     = useRef(null);
  const startPosRef  = useRef(null);
  const firedRef     = useRef(false);
  const tickRef      = useRef(null);
  const [progress, setProgress] = useState(0);

  const cancel = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (tickRef.current)  { cancelAnimationFrame(tickRef.current); tickRef.current = null; }
    startPosRef.current = null;
    setProgress(0);
  }, []);

  const start = useCallback((e) => {
    if (disabled) return;
    // Only handle primary button presses (mouse) — secondary clicks
    // (context menu) shouldn't start a hold.
    if (e.button != null && e.button !== 0) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX;
    const y = e.clientY ?? e.touches?.[0]?.clientY;
    startPosRef.current = { x, y, t: performance.now() };
    firedRef.current = false;

    const tick = () => {
      if (!startPosRef.current) return;
      const elapsed = performance.now() - startPosRef.current.t;
      setProgress(Math.min(1, elapsed / duration));
      if (elapsed < duration) {
        tickRef.current = requestAnimationFrame(tick);
      }
    };
    tickRef.current = requestAnimationFrame(tick);

    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      setProgress(1);
      onLongPress?.(e);
      // Brief hold on the full progress before resetting so the user
      // sees the completion frame.
      setTimeout(() => setProgress(0), 180);
    }, duration);
  }, [disabled, duration, onLongPress]);

  const move = useCallback((e) => {
    if (!startPosRef.current) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX;
    const y = e.clientY ?? e.touches?.[0]?.clientY;
    const dx = x - startPosRef.current.x;
    const dy = y - startPosRef.current.y;
    if (Math.hypot(dx, dy) > cancelDistance) cancel();
  }, [cancel, cancelDistance]);

  const end = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickRef.current) cancelAnimationFrame(tickRef.current);
    setProgress(0);
    startPosRef.current = null;
  }, []);

  /** Returns true if the most recent press fired the long-press handler.
      Callers can use this in click handlers to suppress the normal
      onClick when long-press already triggered. */
  const justFired = useCallback(() => {
    const fired = firedRef.current;
    firedRef.current = false;
    return fired;
  }, []);

  return {
    progress,
    justFired,
    handlers: {
      onPointerDown:   start,
      onPointerMove:   move,
      onPointerUp:     end,
      onPointerCancel: cancel,
      onPointerLeave:  cancel,
    },
  };
}
