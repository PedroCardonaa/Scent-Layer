import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { useApp } from '../context/AppContext.jsx';

// One curated Unsplash hero photo per fragrance family. Replace with real
// brand-commissioned imagery once available. All four URLs are verified
// stock photos of perfume bottles / atmospheric fragrance still life.
const FAMILY_IMAGE = {
  Fresh:    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&h=1200&fit=crop&q=80',
  Floral:   'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&h=1200&fit=crop&q=80',
  Woody:    'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1200&h=1200&fit=crop&q=80',
  Oriental: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1200&h=1200&fit=crop&q=80',
  Gourmand: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=1200&h=1200&fit=crop&q=80',
};

const FALLBACK_IMAGE = FAMILY_IMAGE.Floral;

export function FragrancePage() {
  const { id } = useParams();
  const { fragrances, openSampleModal, openSourceModal, toggleWishlist, wishlistIds } = useApp();
  const numericId = Number(id);
  const fragrance = fragrances.find(f => f.id === numericId);

  // SEO basics — set <title> while on this page
  useEffect(() => {
    if (fragrance) {
      const prev = document.title;
      document.title = `${fragrance.name} — ${fragrance.brand} · Scent Layer`;
      return () => { document.title = prev; };
    }
  }, [fragrance]);

  // Similar = same family, exclude self, up to 3. If fewer, fill with same-mood matches.
  const similar = useMemo(() => {
    if (!fragrance) return [];
    const sameFamily = fragrances.filter(f => f.id !== fragrance.id && f.family === fragrance.family);
    if (sameFamily.length >= 3) return sameFamily.slice(0, 3);
    // Fall back: pad with mood overlap
    const moodMatches = fragrances.filter(f =>
      f.id !== fragrance.id &&
      f.family !== fragrance.family &&
      f.mood?.some(m => fragrance.mood?.includes(m))
    );
    return [...sameFamily, ...moodMatches].slice(0, 3);
  }, [fragrance, fragrances]);

  if (fragrances.length === 0) {
    return (
      <>
        <Nav />
        <div className="fragrance-empty"><p>Loading…</p></div>
      </>
    );
  }

  if (!fragrance) {
    return (
      <>
        <Nav />
        <div className="fragrance-empty">
          <p className="fragrance-empty-eyebrow">Not found</p>
          <h1 className="fragrance-empty-title">This fragrance isn't in the catalog yet.</h1>
          <p className="fragrance-empty-body">Maybe it's something we can source. <button type="button" className="link-cta" onClick={() => openSourceModal('')}>Request it →</button></p>
          <Link to="/shop" className="btn-dark" style={{ marginTop: 24 }}>Browse the Catalog</Link>
        </div>
        <Footer />
      </>
    );
  }

  const label = `${fragrance.name} — ${fragrance.brand}`;
  const saved = wishlistIds.includes(fragrance.id);
  const heroImage = FAMILY_IMAGE[fragrance.family] ?? FALLBACK_IMAGE;
  const synthDescription = fragrance.description ?? buildSynthDescription(fragrance);

  return (
    <>
      <Nav />

      {/* Breadcrumb */}
      <nav className="fragrance-crumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/shop">Catalog</Link>
        <span aria-hidden="true">/</span>
        <span>{fragrance.name}</span>
      </nav>

      {/* Hero */}
      <section className="fragrance-hero">
        <div className="fragrance-hero-image">
          <img src={heroImage} alt={`${fragrance.name} fragrance bottle`} loading="eager" />
          {fragrance.badge && <div className="fragrance-badge">{fragrance.badge}</div>}
        </div>
        <div className="fragrance-hero-body">
          <p className="fragrance-brand">{fragrance.brand}</p>
          <h1 className="fragrance-name">{fragrance.name}</h1>
          <p className="fragrance-meta">
            <span className="fragrance-family">{fragrance.family}</span>
            <span className="fragrance-meta-sep">·</span>
            <span className="fragrance-type">{fragrance.type}</span>
          </p>

          <p className="fragrance-composition">{synthDescription}</p>

          <div className="fragrance-attr-grid">
            <Attribute label="Season" values={fragrance.season} />
            <Attribute label="Time" values={fragrance.time} />
            <Attribute label="Mood" values={fragrance.mood} />
          </div>

          <div className="fragrance-cta-row">
            <button
              type="button"
              className="btn-gold"
              onClick={() => openSampleModal(label)}
            >
              Order a Sample · From 2ml
            </button>
            <button
              type="button"
              className="btn-ghost fragrance-cta-secondary"
              onClick={() => openSourceModal(label)}
            >
              Source Full Bottle
            </button>
            <button
              type="button"
              className={`fragrance-wishlist-btn ${saved ? 'saved' : ''}`}
              onClick={() => toggleWishlist(fragrance.id)}
              aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
              title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              {saved ? '♥' : '♡'}
            </button>
          </div>
        </div>
      </section>

      {/* Notes pyramid */}
      <section className="fragrance-pyramid">
        <p className="fragrance-section-label">The Pyramid</p>
        <h2 className="fragrance-section-title">Built in <em className="gradient-em">three acts.</em></h2>
        <div className="pyramid-grid">
          <NoteAct num="01" label="Top" sub="First 15 minutes" notes={fragrance.top} />
          <NoteAct num="02" label="Heart" sub="The character" notes={fragrance.heart} />
          <NoteAct num="03" label="Base" sub="Hours into wear" notes={fragrance.base} />
        </div>
      </section>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="fragrance-similar">
          <p className="fragrance-section-label">If you like {fragrance.name}</p>
          <h2 className="fragrance-section-title">You might also <em className="gradient-em">love these.</em></h2>
          <div className="fragrance-similar-grid">
            {similar.map(f => <ProductCard key={f.id} fragrance={f} />)}
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}

function Attribute({ label, values = [] }) {
  if (!values || values.length === 0) return null;
  return (
    <div className="fragrance-attr">
      <p className="fragrance-attr-label">{label}</p>
      <p className="fragrance-attr-value">{values.join(' · ')}</p>
    </div>
  );
}

function NoteAct({ num, label, sub, notes }) {
  return (
    <div className="note-act">
      <span className="note-act-num">{num}</span>
      <p className="note-act-label">{label}</p>
      <p className="note-act-sub">{sub}</p>
      <p className="note-act-notes">{notes}</p>
    </div>
  );
}

// Build a brief editorial description from the notes pyramid when the
// catalog doesn't supply one. Keeps the page from feeling sparse.
function buildSynthDescription(f) {
  const family = f.family.toLowerCase();
  const opener = f.top.split(',').slice(0, 2).join(' and ').trim();
  const heart = f.heart.split(',').slice(0, 2).join(' and ').trim();
  const base = f.base.split(',').slice(0, 2).join(' and ').trim();
  return `A ${family} composition. Opens with ${opener}, settles into a heart of ${heart}, and lingers on a base of ${base}. Suited for ${f.season.join(', ').toLowerCase()} wear, ${f.time.join(', ').toLowerCase()}.`;
}
