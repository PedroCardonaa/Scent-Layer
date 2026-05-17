import { useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ProductCard } from './ProductCard.jsx';

/**
 * Renders the user's last-5 viewed fragrances as a horizontal row.
 * Renders nothing if there's <2 entries available (a one-item row is
 * pointless and the user already sees that fragrance elsewhere).
 *
 * Used on:
 *   - HomePage  (returning visitors land back on what they were considering)
 *   - FragrancePage (above the Similar Scents row when navigating between
 *     details; `currentId` is excluded so users don't see themselves in
 *     their own Recently Viewed list)
 */
export function RecentlyViewedRow({ currentId, heading }) {
  const { fragrances, recentlyViewed } = useApp();
  const items = useMemo(() => {
    return recentlyViewed
      .filter(id => id !== currentId)
      .map(id => fragrances.find(f => f.id === id))
      .filter(Boolean)
      .slice(0, 4);
  }, [recentlyViewed, fragrances, currentId]);

  if (items.length < 2) return null;

  return (
    <section className="recently-viewed-section">
      <div className="recently-viewed-head">
        <p className="recently-viewed-label">Recently Viewed</p>
        <h2 className="recently-viewed-title">{heading ?? <>Pick up <em className="gradient-em">where you left off.</em></>}</h2>
      </div>
      <div className="recently-viewed-grid">
        {items.map(f => <ProductCard key={f.id} fragrance={f} />)}
      </div>
    </section>
  );
}
