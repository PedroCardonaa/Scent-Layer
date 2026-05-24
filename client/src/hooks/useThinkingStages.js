import { useEffect, useState } from 'react';

/**
 * Rotates through a list of "thinking" status messages while an AI
 * call is in flight. The intent is to make the wait feel deliberate ,
 * the model is reasoning, weighing your wardrobe, considering options ,
 * rather than canned. Without this, even a real 6-second API call can
 * read as "instant and predetermined" because the UI is static during
 * it.
 *
 * Each stage holds for `interval` ms, then advances. Loops at the end.
 *
 * Usage:
 *   const stage = useThinkingStages(loading, [
 *     'Reading your answers',
 *     'Cross-referencing your wardrobe',
 *     'Drafting your match',
 *   ]);
 */
export function useThinkingStages(active, stages, interval = 900) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) { setIndex(0); return; }
    setIndex(0);
    const id = setInterval(() => {
      setIndex(i => (i + 1) % stages.length);
    }, interval);
    return () => clearInterval(id);
  }, [active, interval, stages.length]);

  return active ? stages[index] : null;
}
