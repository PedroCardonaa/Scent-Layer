import { useMemo } from 'react';
import { ProductCard } from './ProductCard.jsx';
import { useApp } from '../context/AppContext.jsx';

/**
 * Homepage row that surfaces fragrances similar to ones the user has
 * sampled. Picks 4 from the catalog that share family + at least one
 * mood/season with the user's most-recent sampled fragrances, while
 * excluding anything they already own or have already sampled.
 *
 * Returns null for guests and for users with no SAMPLED entries —
 * preventing an empty "Based on what you sampled" header from ever
 * showing up. That's the whole point of restrained personalization:
 * the section only exists when it earns its place.
 */
export function BasedOnSampledRow() {
  const { user, fragrances, wardrobeItems } = useApp();

  const picks = useMemo(() => {
    if (!user || wardrobeItems.length === 0) return [];
    const sampled = wardrobeItems.filter(w => w.status === 'SAMPLED');
    if (sampled.length === 0) return [];

    // Exclude anything already in their wardrobe (any status).
    const wardrobeIds = new Set(wardrobeItems.map(w => w.fragranceId));

    // Score every other fragrance by family match + mood/season overlap
    // with the user's sampled set.
    const sampledFamilies = new Set(sampled.map(w => w.fragrance?.family).filter(Boolean));
    const sampledMoods    = new Set(sampled.flatMap(w => w.fragrance?.mood    ?? []));
    const sampledSeasons  = new Set(sampled.flatMap(w => w.fragrance?.season  ?? []));

    return fragrances
      .filter(f => !wardrobeIds.has(f.id))
      .map(f => {
        let score = 0;
        if (sampledFamilies.has(f.family)) score += 3;
        score += (f.mood    ?? []).filter(m => sampledMoods.has(m)).length;
        score += (f.season  ?? []).filter(s => sampledSeasons.has(s)).length;
        return { fragrance: f, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(x => x.fragrance);
  }, [user, fragrances, wardrobeItems]);

  if (picks.length === 0) return null;

  return (
    <section className="recently-viewed-section" aria-label="Based on what you sampled">
      <div className="recently-viewed-head">
        <p className="recently-viewed-label">Tuned to your taste</p>
        <h2 className="recently-viewed-title">Based on what <em className="gradient-em">you sampled.</em></h2>
      </div>
      <div className="recently-viewed-grid">
        {picks.map(f => <ProductCard key={f.id} fragrance={f} />)}
      </div>
    </section>
  );
}
