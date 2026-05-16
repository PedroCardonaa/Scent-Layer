import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { ProductBottle } from './BottleSvg.jsx';
import { MagicCard } from './ui/MagicCard.jsx';

export function ProductCard({ fragrance: p }) {
  const { wishlistIds, toggleWishlist, openSampleModal, openSourceModal } = useApp();
  const saved = wishlistIds.includes(p.id);
  const label = `${p.name} — ${p.brand}`;
  const detailHref = `/fragrance/${p.id}`;

  // Helper: when an inline action button is clicked, prevent the wrapping
  // Link from navigating. Lets the user click Wishlist / Order Sample / etc.
  // without bouncing into the detail page.
  const stop = (fn) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <MagicCard className="product-card" spotlightColor="rgba(201,169,110,0.22)" spotlightSize={240}>
      <Link to={detailHref} className="product-card-link" aria-label={`Open details for ${label}`}>
        <div className="product-img">
          <div className={`product-bg ${p.bg}`} />
          <ProductBottle />
          {p.badge && <div className="product-badge">{p.badge}</div>}
          <div className="product-actions">
            <button
              type="button"
              className={`product-action-btn ${saved ? 'wishlisted' : ''}`}
              onClick={stop(() => toggleWishlist(p.id))}
              title="Save to wishlist"
              aria-label="Save to wishlist"
            >♡</button>
            <button
              type="button"
              className="product-action-btn"
              onClick={stop(() => openSampleModal(label))}
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
            <button type="button" className="sample-btn" onClick={stop(() => openSampleModal(label))}>Order Sample</button>
          </div>
          <button type="button" className="source-link" onClick={stop(() => openSourceModal(label))}>or source a full bottle →</button>
        </div>
      </Link>
    </MagicCard>
  );
}
