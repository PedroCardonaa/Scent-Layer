import { useState } from 'react';

/**
 * Inline "Why this rec?" expandable. The link is small and quiet —
 * users who don't care never see the reasoning, users who do can
 * see the one sentence the model wrote about what drove the result.
 *
 * Renders nothing if no reasoning string is provided (e.g. an older
 * cached response). Stays out of the way.
 */
export function WhyThisRec({ reasoning, label = 'Why this rec?' }) {
  const [open, setOpen] = useState(false);
  if (!reasoning) return null;

  return (
    <div className="why-rec">
      <button
        type="button"
        className="why-rec-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        {open ? '✕' : '?'} {label}
      </button>
      {open && (
        <p className="why-rec-text">
          <span className="why-rec-marker" aria-hidden="true">✦</span>
          {reasoning}
        </p>
      )}
    </div>
  );
}
