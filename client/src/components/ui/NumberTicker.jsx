import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn.js';

/**
 * Lightweight Magic UI-style number ticker.
 * Animates from the previous value to the next over `duration` ms with ease-out.
 * Skips animation on the first paint to avoid a 0 → value jump on mount.
 */
export function NumberTicker({ value, duration = 600, className }) {
  const [display, setDisplay] = useState(value);
  const startRef = useRef(null);
  const fromRef = useRef(value);
  const firstRef = useRef(true);

  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    let raf;
    startRef.current = null;
    const step = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const t = Math.min(1, (ts - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) raf = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const rounded = Math.round(display);
  return <span className={cn('tabular-nums', className)}>{rounded.toLocaleString()}</span>;
}
