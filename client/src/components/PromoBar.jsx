import { useEffect, useState } from 'react';

/**
 * Thin dismissible promo strip pinned above the fixed nav. Dismissal
 * persists in localStorage. The bar publishes its height through the
 * --promo-h CSS variable; the nav (top) and body (padding-top) read it
 * so the whole layout shifts together and snaps back on dismiss.
 */
const KEY = 'sl-promo-dismissed-v1';
const BAR_H = '34px';

export function PromoBar() {
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem(KEY); } catch { return true; }
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--promo-h', visible ? BAR_H : '0px');
    return () => document.documentElement.style.setProperty('--promo-h', '0px');
  }, [visible]);

  if (!visible) return null;

  function dismiss() {
    try { localStorage.setItem(KEY, '1'); } catch { /* private mode */ }
    setVisible(false);
  }

  return (
    <div className="promo-bar" role="status">
      <span className="promo-bar-text">
        Free US shipping on orders over <strong>$50</strong>
      </span>
      <button type="button" className="promo-bar-x" onClick={dismiss} aria-label="Dismiss">✕</button>
    </div>
  );
}
