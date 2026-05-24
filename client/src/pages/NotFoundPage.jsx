import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useDocumentMeta } from '../lib/seo.js';

/**
 * Editorial 404, catches any unmatched route. Offers obvious exits
 * (catalog, home) plus the source modal in case the user was looking
 * for a specific fragrance we don't have indexed yet.
 */
export function NotFoundPage() {
  const { openSourceModal } = useApp();
  useDocumentMeta({
    title: 'Not Found',
    description: 'The page you were looking for isn\'t here. Browse the catalog instead, or request something we can source.',
  });
  return (
    <>
      <Nav />
      <main className="notfound-page">
        <p className="notfound-eyebrow">404 · Not Found</p>
        <h1 className="notfound-title">
          The page you were after<br/><em className="gradient-em">isn't on the shelf.</em>
        </h1>
        <p className="notfound-body">
          You might have followed an old link, or the page moved during a rewrite.
          The catalog is where most things live. Or, if you were chasing a specific
          fragrance, we can probably source it.
        </p>
        <div className="notfound-actions">
          <Link to="/shop" className="btn-gold">Browse the Catalog</Link>
          <button type="button" className="btn-ghost notfound-ghost" onClick={() => openSourceModal('')}>
            Request a Fragrance
          </button>
        </div>
        <Link to="/" className="notfound-home">← Back to home</Link>
      </main>
      <Footer />
    </>
  );
}
