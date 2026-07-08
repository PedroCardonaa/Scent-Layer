import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { MagicCard } from './ui/MagicCard.jsx';
import { ScentTile } from './ScentTile.jsx';
import { fromPriceCents, formatMoney } from '../lib/pricing.js';
import { slugify } from '../lib/slug.js';
import { getCompareIds, toggleCompare, subscribeCompare } from '../lib/compare.js';
import { useLongPress } from '../hooks/useLongPress.js';

export function ProductCard({ fragrance: p }) {
  const { wishlistIds, toggleWishlist, openSampleModal, openSourceModal, addToCart, openCart, showToast, reviewSummary } = useApp();
  const navigate = useNavigate();
  const saved = wishlistIds.includes(p.id);
  const rating = reviewSummary?.[p.id];
  const label = `${p.name}, ${p.brand}`;
  const detailHref = `/fragrance/${p.id}`;

  // Compare selection lives in a tiny shared store (lib/compare.js) so
  // the card buttons and the floating tray stay in sync.
  const [compareIds, setCompareIds] = useState(getCompareIds());
  useEffect(() => subscribeCompare((ids) => setCompareIds([...ids])), []);
  const comparing = compareIds.includes(p.id);

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

  // Long-press (~600ms hold) on the card image = quick add 5ml to cart.
  // Saves three taps versus clicking the card, picking a size, hitting
  // "Add to Cart". The card link's onClick checks justFired() so a
  // completed long-press doesn't also navigate to the detail page.
  const { progress, justFired, handlers } = useLongPress({
    onLongPress: quickAddToCart,
    duration: 600,
  });

  function handleCardClick(e) {
    if (justFired()) {
      // Long-press fired, swallow the click so we don't navigate.
      e.preventDefault();
      e.stopPropagation();
    }
  }

  return (
    <MagicCard className="product-card" spotlightColor="rgba(201,169,110,0.22)" spotlightSize={240}>
      <Link to={detailHref} className="product-card-link" aria-label={`Open details for ${label}`} onClick={handleCardClick}>
        <div className="product-img" {...handlers}>
          {/* Product photography removed for the clean-commerce
              restyle — a family-tinted ScentTile stands in. */}
          <ScentTile fragrance={p} />
          {p.badge && <div className="product-badge">{p.badge}</div>}

          {/* Long-press fill ring, animates as the user holds the card.
              Sits above the photo but below the action buttons. */}
          {progress > 0 && (
            <div className="product-longpress" aria-hidden="true">
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="25" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
                <circle
                  cx="28" cy="28" r="25"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 25}`}
                  strokeDashoffset={`${2 * Math.PI * 25 * (1 - progress)}`}
                  transform="rotate(-90 28 28)"
                />
                <ShoppingBag size={18} x={19} y={19} strokeWidth={1.5} color="var(--gold)" />
              </svg>
              <span className="product-longpress-label">Hold to add</span>
            </div>
          )}

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
            <button
              type="button"
              className={`product-action-btn ${comparing ? 'comparing' : ''}`}
              onClick={stop(() => toggleCompare(p.id))}
              title={comparing ? 'Remove from comparison' : 'Add to comparison'}
              aria-label={comparing ? 'Remove from comparison' : 'Add to comparison'}
              aria-pressed={comparing}
            >⇄</button>
          </div>
        </div>
        <div className="product-info">
          <p className="product-brand">{p.brand}</p>
          <h3 className="product-name">{p.name}</h3>
          {rating && rating.count > 0 && (
            <p className="product-rating" aria-label={`Rated ${rating.avg} out of 5 by ${rating.count} wearers`}>
              <span className="product-rating-star" aria-hidden="true">★</span>
              {rating.avg} <span className="product-rating-count">({rating.count})</span>
            </p>
          )}
          <p className="product-price">from {formatMoney(fromPriceCents(p.id))}</p>
          {/* Top notes as chips linking into /notes/:slug. Spans with
              programmatic navigation — a real <a> can't nest inside
              the card's wrapping <Link>. */}
          <p className="product-notes-preview">
            {String(p.top || '').split(',').map(n => n.trim()).filter(Boolean).slice(0, 3).map(note => (
              <span
                key={note}
                role="link"
                tabIndex={0}
                className="note-chip"
                onClick={stop(() => navigate(`/notes/${slugify(note)}`))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); navigate(`/notes/${slugify(note)}`); } }}
              >
                {note}
              </span>
            ))}
          </p>
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
