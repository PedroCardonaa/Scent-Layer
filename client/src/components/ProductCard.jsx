import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { ProductBottle } from './BottleSvg.jsx';
import { MagicCard } from './ui/MagicCard.jsx';
import { getFragranceImage } from '../lib/fragrance-images.js';

export function ProductCard({ fragrance: p }) {
  const { wishlistIds, toggleWishlist, openSampleModal, openSourceModal, addToCart, openCart, showToast } = useApp();
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

  function quickAddToCart() {
    addToCart({ fragranceId: p.id, name: p.name, brand: p.brand, size: '5ml', qty: 1 });
    showToast(`<span>Added</span> 5ml of ${p.name} to cart`);
    openCart();
  }

  return (
    <MagicCard className="product-card" spotlightColor="rgba(201,169,110,0.22)" spotlightSize={240}>
      <Link to={detailHref} className="product-card-link" aria-label={`Open details for ${label}`}>
        <div className="product-img product-img-photo">
          {/* Real bottle photography overlaid on the family-tinted bg.
              If the image fails the gradient + SVG bottle is still
              visible underneath as a graceful fallback. */}
          <div className={`product-bg ${p.bg}`} />
          <ProductBottle />
          <img
            className="product-photo"
            src={getFragranceImage(p)}
            alt={`${p.name} by ${p.brand}`}
            loading="lazy"
            decoding="async"
          />
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
              onClick={stop(quickAddToCart)}
              title="Quick add 5ml to cart"
              aria-label="Quick add 5ml to cart"
            >
              <ShoppingBag size={14} strokeWidth={1.5} />
            </button>
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
