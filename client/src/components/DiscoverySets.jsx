import { useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';

/**
 * Discovery Sets strip — curated 3-pack bundles displayed near the top
 * of /shop. Each card shows the set's hook, the three fragrances in it,
 * and a single "Sample The Set" CTA that drops all three into the cart
 * at the set's discount.
 *
 * The discount is applied at the line-item level inside addSetToCart
 * (see AppContext) so the checkout payload format is unchanged.
 */
export function DiscoverySets() {
  const { sets, fragrances, addSetToCart, openCart, showToast } = useApp();

  // Hydrate each set's fragranceIds with the matching catalog entries
  // so we can render names + brands inline.
  const enriched = useMemo(() => {
    return sets.map(s => ({
      ...s,
      items: s.fragranceIds
        .map(id => fragrances.find(f => f.id === id))
        .filter(Boolean),
    })).filter(s => s.items.length > 0);
  }, [sets, fragrances]);

  if (enriched.length === 0) return null;

  function handleAdd(set) {
    addSetToCart(set, fragrances);
    showToast(`<span>${set.name}</span> added — 3 samples in cart`);
    setTimeout(() => openCart(), 250);
  }

  return (
    <section className="sets-section" id="sets">
      <div className="sets-header">
        <div>
          <p className="sets-eyebrow">Discovery Sets</p>
          <h2 className="sets-title">Curated 3-packs.<br/><em>Save 15% versus à la carte.</em></h2>
          <p className="sets-sub">Three samples, picked together, priced together. The fastest way to taste a category without committing to any one bottle.</p>
        </div>
      </div>

      <div className="sets-grid">
        {enriched.map(set => (
          <article key={set.slug} className="set-card">
            <div className="set-card-visual" style={{ background: set.bg }}>
              <p className="set-card-eyebrow">{set.eyebrow}</p>
              <h3 className="set-card-name">{set.name}</h3>
              <p className="set-card-audience">{set.audience}</p>
            </div>
            <div className="set-card-body">
              <p className="set-card-hook">{set.hook}</p>
              <ul className="set-card-items">
                {set.items.map((f, i) => (
                  <li key={f.id} className="set-card-item">
                    <span className="set-card-item-num">0{i + 1}</span>
                    <span className="set-card-item-info">
                      <span className="set-card-item-name">{f.name}</span>
                      <span className="set-card-item-brand">{f.brand}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="set-card-meta">
                <span className="set-card-size">3 × {set.size}</span>
                <span className="set-card-discount">{set.discountPct}% off</span>
              </div>
              <button type="button" className="set-card-btn" onClick={() => handleAdd(set)}>
                Sample The Set
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
