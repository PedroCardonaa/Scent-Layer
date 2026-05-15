import { useApp } from '../context/AppContext.jsx';
import { ProductBottle } from './BottleSvg.jsx';
import { MagicCard } from './ui/MagicCard.jsx';

export function ProductCard({ fragrance: p }) {
  const { wishlistIds, toggleWishlist, openSampleModal, openSourceModal } = useApp();
  const saved = wishlistIds.includes(p.id);
  const label = `${p.name} — ${p.brand}`;
  return (
    <MagicCard className="product-card" spotlightColor="rgba(201,169,110,0.22)" spotlightSize={240}>
      <div className="product-img">
        <div className={`product-bg ${p.bg}`} />
        <ProductBottle />
        {p.badge && <div className="product-badge">{p.badge}</div>}
        <div className="product-actions">
          <button
            type="button"
            className={`product-action-btn ${saved ? 'wishlisted' : ''}`}
            onClick={() => toggleWishlist(p.id)}
            title="Save to wishlist"
            aria-label="Save to wishlist"
          >♡</button>
          <button
            type="button"
            className="product-action-btn"
            onClick={() => openSampleModal(label)}
            title="Order a sample"
            aria-label="Order a sample"
          >↗</button>
        </div>
      </div>
      <div className="product-info">
        <p className="product-brand">{p.brand}</p>
        <h3 className="product-name">{p.name}</h3>
        <p className="product-notes-preview">{p.top}</p>
        <div className="product-footer">
          <span className="product-family">{p.family} · {p.type}</span>
          <button type="button" className="sample-btn" onClick={() => openSampleModal(label)}>Order Sample</button>
        </div>
        <button type="button" className="source-link" onClick={() => openSourceModal(label)}>or source a full bottle →</button>
      </div>
    </MagicCard>
  );
}
