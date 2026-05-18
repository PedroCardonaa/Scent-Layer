import { useEffect, useState } from 'react';

/**
 * Fixed-position arrow that appears once the user has scrolled past
 * `threshold` pixels. Clicking smooth-scrolls back to the top.
 * Hidden on touch devices by CSS so it doesn't collide with the
 * mobile bottom-nav.
 */
export function BackToTop({ threshold = 600 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > threshold);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <button
      type="button"
      className={`back-to-top ${visible ? 'visible' : ''}`}
      onClick={scrollTop}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 11V3M3 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="back-to-top-label">Top</span>
    </button>
  );
}
