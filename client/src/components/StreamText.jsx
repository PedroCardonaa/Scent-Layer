import { useEffect, useState } from 'react';

/**
 * Character-streams a string into the DOM so AI-drafted text reads as
 * being written in real time rather than dumped. Gates against
 * prefers-reduced-motion (jumps straight to full text). Calls onDone
 * once the full string is visible so callers can reveal follow-on
 * controls like "Why this rec?" only after the streaming completes.
 *
 * The character chunk size + interval are tuned so it feels brisk ,
 * not painfully slow but visibly drafted. ~50ms per beat at 3 chars
 * per beat lands around 60 chars/sec, faster than a person types but
 * slow enough to register as motion.
 */
export function StreamText({ text, speed = 50, chunk = 3, onDone, className, as: Tag = 'span' }) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    if (!text) { setShown(''); return; }

    // Respect prefers-reduced-motion, jump to full text.
    const reduce = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setShown(text);
      onDone?.();
      return;
    }

    let cancelled = false;
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      if (cancelled) return;
      i = Math.min(text.length, i + chunk);
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        onDone?.();
      }
    }, speed);

    return () => { cancelled = true; clearInterval(id); };
  // We intentionally re-run on text identity change only, chunk/speed
  // are usually constants chosen per-callsite.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <Tag className={className}>{shown}</Tag>;
}
