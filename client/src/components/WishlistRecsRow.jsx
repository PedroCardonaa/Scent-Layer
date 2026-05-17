import { useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ProductCard } from './ProductCard.jsx';

/**
 * "Based on your wishlist" recommendations.
 *
 * Looks at the user's saved fragrances, picks the families they've shown
 * interest in, surfaces 3 other fragrances from those families that aren't
 * already on the wishlist. Renders nothing if the wishlist is empty.
 */
export function WishlistRecsRow() {
  const { fragrances, wishlistIds } = useApp();
  const recommendations = useMemo(() => {
    if (wishlistIds.length === 0) return [];

    const wishlist = fragrances.filter(f => wishlistIds.includes(f.id));
    if (wishlist.length === 0) return [];

    // Tally the families the user has shown interest in (most common first).
    const familyCount = new Map();
    wishlist.forEach(f => {
      familyCount.set(f.family, (familyCount.get(f.family) ?? 0) + 1);
    });

    // Candidates: fragrances not on the wishlist whose family appears in
    // the user's interest set. Score by how often that family is repped.
    const scored = fragrances
      .filter(f => !wishlistIds.includes(f.id) && familyCount.has(f.family))
      .map(f => ({ f, score: familyCount.get(f.family) ?? 0 }))
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 3).map(({ f }) => f);
  }, [fragrances, wishlistIds]);

  if (recommendations.length === 0) return null;

  return (
    <section className="wishlist-recs-section">
      <div className="wishlist-recs-head">
        <p className="wishlist-recs-label">Because you saved</p>
        <h2 className="wishlist-recs-title">
          More from the <em className="gradient-em">{recommendations[0]?.family ?? 'families'} family</em> you like.
        </h2>
      </div>
      <div className="wishlist-recs-grid">
        {recommendations.map(f => <ProductCard key={f.id} fragrance={f} />)}
      </div>
    </section>
  );
}
