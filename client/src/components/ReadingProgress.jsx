import { useEffect, useState } from 'react';

/**
 * Hairline gold progress bar fixed to the top of the viewport, tracking
 * how far the user has scrolled through the current page. Auto-hides
 * if the page is too short to need it (under 1.5 viewports).
 *
 * Pure CSS bar driven by a single state value — cheap, no observers
 * needed beyond a passive scroll listener.
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    function compute() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max < window.innerHeight * 0.5) { // less than 1.5 viewports
        setEnabled(false);
        return;
      }
      setEnabled(true);
      const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      setProgress(pct);
    }
    compute();
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute);
      window.removeEventListener('resize', compute);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="reading-progress" aria-hidden="true">
      <div className="reading-progress-fill" style={{ width: `${progress}%` }} />
    </div>
  );
}
