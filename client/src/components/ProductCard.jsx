import { useApp } from '../context/AppContext.jsx';
import { ProductBottle } from './BottleSvg.jsx';

export function ProductCard({ fragrance: p }) {
  const { wishlistIds, toggleWishlist, openSourceModal } = useApp();
  const saved = wishlistIds.includes(p.id);
  return (
    <div className="product-card">
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
            onClick={() => openSourceModal(`${p.name} — ${p.brand}`)}
            title="Source this"
            aria-label="Source this"
          >↗</button>
        </div>
      </div>
      <div className="product-info">
        <p className="product-brand">{p.brand}</p>
        <h3 className="product-name">{p.name}</h3>
        <p className="product-notes-preview">{p.top}</p>
        <div className="product-footer">
          <span className="product-family">{p.family} · {p.type}</span>
          <button type="button" className="source-btn" onClick={() => openSourceModal(`${p.name} — ${p.brand}`)}>Source It</button>
        </div>
      </div>
    </div>
  );
}
