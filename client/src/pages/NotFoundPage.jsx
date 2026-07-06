import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useDocumentMeta } from '../lib/seo.js';
import { ScentTile } from '../components/ScentTile.jsx';
import { trackEvent } from '../lib/analytics.js';

/**
 * Editorial 404. Voice-led, not generic. The "Surprise Me" CTA picks a
 * random fragrance from the catalog (or one matching the user's loved
 * family if logged in) so the page is a useful re-entry, not a dead
 * end. The shelf metaphor doubles as a brand statement.
 */
export function NotFoundPage() {
  const { fragrances, wardrobeItems, myReviews } = useApp();
  const navigate = useNavigate();

  useDocumentMeta({
    title: 'This fragrance is out of print.',
    description: 'The page you were looking for isn\'t here. Let\'s find what comes close.',
  });

  // Show a soft "you might like" pick at the bottom — biased toward
  // LOVED families if logged in, random otherwise. Same logic as
  // Surprise Me in the search palette, just inline.
  const pick = useMemo(() => {
    if (!fragrances.length) return null;
    let pool = fragrances;
    const loved = myReviews.filter(r => r.rating === 'LOVED');
    const ownedIds = new Set(wardrobeItems.map(w => w.fragranceId));
    if (loved.length > 0) {
      const lovedFamilies = new Set(loved.map(r => r.fragrance?.family).filter(Boolean));
      const matching = fragrances.filter(f => lovedFamilies.has(f.family) && !ownedIds.has(f.id));
      if (matching.length > 0) pool = matching;
    } else {
      const filtered = fragrances.filter(f => !ownedIds.has(f.id));
      if (filtered.length > 0) pool = filtered;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }, [fragrances, wardrobeItems, myReviews]);

  function surpriseMe() {
    if (!pick) { navigate('/shop'); return; }
    trackEvent('404_surprise_me', { fragrance_id: pick.id });
    navigate(`/fragrance/${pick.id}`);
  }

  return (
    <>
      <Nav />
      <main className="notfound-page">
        <p className="notfound-eyebrow">404, out of print</p>
        <h1 className="notfound-title">
          This fragrance<br/><em className="gradient-em">isn't on our shelf.</em>
        </h1>
        <p className="notfound-body">
          You followed an old link, or you typed a path we don't carry.
          Either way, let's find what comes close.
        </p>
        <div className="notfound-actions">
          <button type="button" className="btn-gold" onClick={surpriseMe}>
            ✦ Surprise Me
          </button>
          <Link to="/shop" className="notfound-secondary">Browse the catalog</Link>
        </div>

        {pick && (
          <aside className="notfound-pick">
            <p className="notfound-pick-label">Or start here, picked for you</p>
            <Link to={`/fragrance/${pick.id}`} className="notfound-pick-card">
              <div className="notfound-pick-img">
                <ScentTile fragrance={pick} showInitial={false} />
              </div>
              <div className="notfound-pick-info">
                <p className="notfound-pick-brand">{pick.brand}</p>
                <h3 className="notfound-pick-name">{pick.name}</h3>
                <p className="notfound-pick-family">{pick.family}</p>
              </div>
            </Link>
          </aside>
        )}

        <Link to="/" className="notfound-home">← Back to home</Link>
      </main>
      <Footer />
    </>
  );
}
