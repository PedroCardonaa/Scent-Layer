import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useDocumentMeta } from '../lib/seo.js';

/**
 * Public shared wishlist. The ids live in the URL itself
 * (/wishlist/shared?ids=1,4,22) so sharing needs no account, no
 * database row, and no expiry logic — the link IS the list. Renders
 * whatever subset of the ids exists in the current catalog.
 */
export function SharedWishlistPage() {
  const { fragrances } = useApp();
  const [params] = useSearchParams();

  const items = useMemo(() => {
    const ids = (params.get('ids') || '')
      .split(',')
      .map(s => Number(s.trim()))
      .filter(Number.isInteger);
    // Keep the sharer's order.
    return ids
      .map(id => fragrances.find(f => f.id === id))
      .filter(Boolean);
  }, [params, fragrances]);

  useDocumentMeta({
    title: 'A Shared Wishlist',
    description: 'Fragrances someone wants to try, shared from their Scent Layer wishlist.',
  });

  return (
    <>
      <Nav />
      <div className="shared-wl">
        <header className="shared-wl-head">
          <p className="shared-wl-eyebrow">Shared Wishlist</p>
          <h1 className="shared-wl-title">
            {items.length > 0
              ? `${items.length} fragrance${items.length !== 1 ? 's' : ''} someone wants to try.`
              : 'This wishlist is empty.'}
          </h1>
          <p className="shared-wl-sub">
            {items.length > 0
              ? 'Samples start small — a 2ml is the easiest gift in the world to get right.'
              : 'The link may be incomplete. Ask them to share it again.'}
          </p>
        </header>

        {items.length > 0 ? (
          <div className="shop-product-grid shared-wl-grid">
            {items.map(p => <ProductCard key={p.id} fragrance={p} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0 64px' }}>
            <Link to="/shop" className="btn-dark">Browse the catalog</Link>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
