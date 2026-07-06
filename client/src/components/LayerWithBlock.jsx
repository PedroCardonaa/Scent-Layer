import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';
import { ScentTile } from './ScentTile.jsx';

/**
 * "Layer with these" block, renders at the bottom of every fragrance
 * page. Fetches 3 partner picks from /api/layer-with/:id (cached
 * server-side per source fragrance). Two click actions on each card:
 *   - Sample, opens the modal for the partner
 *   - Sample as a pair, adds both 5ml samples to cart in one shot
 *
 * Returns null while loading or on error; the rest of the page is
 * unaffected.
 */
export function LayerWithBlock({ fragrance }) {
  const { fragrances, addToCart, openCart, showToast, openSampleModal } = useApp();
  const [partners, setPartners] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fragrance?.id) return;
    setLoading(true);
    setPartners(null);
    api(`/api/layer-with/${fragrance.id}`)
      .then(r => setPartners(r.partners))
      .catch(() => { /* silent, the block just doesn't render */ })
      .finally(() => setLoading(false));
  }, [fragrance?.id]);

  if (!partners || partners.length === 0) return null;

  function sampleAsPair(partner) {
    addToCart({ fragranceId: fragrance.id, name: fragrance.name, brand: fragrance.brand, size: '5ml', qty: 1 });
    addToCart({ fragranceId: partner.id,   name: partner.name,   brand: partner.brand,   size: '5ml', qty: 1 });
    showToast(`<span>Paired.</span> ${fragrance.name} + ${partner.name} added.`);
    openCart();
  }

  return (
    <section className="layer-with">
      <p className="fragrance-section-label">Layers Well With</p>
      <h2 className="fragrance-section-title">Three to wear it <em className="gradient-em">alongside.</em></h2>

      <div className="layer-with-grid">
        {partners.map(p => {
          const inCatalog = fragrances.find(f => f.id === p.id);
          return (
            <article key={p.id} className="layer-with-card">
              <Link to={`/fragrance/${p.id}`} className="layer-with-card-img" aria-label={`Open ${p.name}`}>
                <ScentTile fragrance={inCatalog || p} />
              </Link>
              <div className="layer-with-card-body">
                <p className="layer-with-card-brand">{p.brand}</p>
                <Link to={`/fragrance/${p.id}`} className="layer-with-card-name">{p.name}</Link>
                <p className="layer-with-card-match">✦ {p.match}</p>
                <p className="layer-with-card-why">{p.why}</p>
                <div className="layer-with-card-actions">
                  <button
                    type="button"
                    className="sample-btn"
                    onClick={() => openSampleModal(`${p.name}, ${p.brand}`)}
                  >Sample {p.name}</button>
                  <button
                    type="button"
                    className="layer-with-pair-btn"
                    onClick={() => sampleAsPair(p)}
                  >Sample as a pair →</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
