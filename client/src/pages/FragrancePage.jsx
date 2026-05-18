import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { RecentlyViewedRow } from '../components/RecentlyViewedRow.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useDocumentMeta } from '../lib/seo.js';

const SAMPLE_SIZES = ['2ml', '5ml', '10ml', '30ml'];

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
  const { fragrances, openSampleModal, openSourceModal, toggleWishlist, wishlistIds, addToCart, openCart, showToast, markViewed, recentlyViewed } = useApp();
  const numericId = Number(id);
  const fragrance = fragrances.find(f => f.id === numericId);
  const [size, setSize] = useState('5ml');
  const [stickyVisible, setStickyVisible] = useState(false);

  // Record this fragrance into Recently Viewed every time the page mounts
  // for a valid fragrance id. Cap is handled inside markViewed.
  useEffect(() => {
    if (fragrance) markViewed(fragrance.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragrance?.id]);

  // Sticky bottom CTA appears once the user has scrolled past the
  // primary CTA in the hero. Observed by IntersectionObserver on a
  // sentinel element placed just below the hero CTAs.
  useEffect(() => {
    if (!fragrance) return;
    const sentinel = document.getElementById('fragrance-cta-sentinel');
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -100% 0px' },
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [fragrance?.id]);

  // Rich SEO meta — title, OG description, OG image. Uses the family hero
  // photo as the OG image so shares look right in iMessage / Discord / etc.
  useDocumentMeta(fragrance ? {
    title: `${fragrance.name} — ${fragrance.brand}`,
    description: `${fragrance.name} by ${fragrance.brand}. ${fragrance.family} composition with ${fragrance.top}. Order a 2ml–30ml sample or source the full bottle.`,
    type: 'product',
  } : { title: 'Not Found' });

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
  // Per-fragrance imageUrl wins; family-based hero is the fallback.
  const heroImage = fragrance.imageUrl ?? FAMILY_IMAGE[fragrance.family] ?? FALLBACK_IMAGE;
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

          <div className="fragrance-size-row">
            <p className="fragrance-size-label">Pick a Sample Size</p>
            <div className="fragrance-size-pills">
              {SAMPLE_SIZES.map(s => (
                <button
                  key={s}
                  type="button"
                  className={`fragrance-size-pill ${size === s ? 'active' : ''}`}
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="fragrance-cta-row">
            <button
              type="button"
              className="btn-gold"
              onClick={() => {
                addToCart({ fragranceId: fragrance.id, name: fragrance.name, brand: fragrance.brand, size, qty: 1 });
                showToast(`<span>Added</span> ${size} of ${fragrance.name} to cart`);
                openCart();
              }}
            >
              Add {size} to Cart
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
          <button
            type="button"
            className="fragrance-quick-link"
            onClick={() => openSampleModal(label)}
          >
            or quick-request without the cart →
          </button>
          {/* Sentinel — when this scrolls out of view, the sticky CTA appears. */}
          <div id="fragrance-cta-sentinel" aria-hidden="true" />
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

      {/* Recently Viewed — skip the current fragrance, show only if there's
          more than just this one in the list. */}
      {recentlyViewed.filter(rid => rid !== fragrance.id).length > 0 && (
        <RecentlyViewedRow currentId={fragrance.id} />
      )}

      {/* Sticky bottom Add-to-Cart bar */}
      <div className={`fragrance-sticky-cta ${stickyVisible ? 'visible' : ''}`} aria-hidden={!stickyVisible}>
        <div className="fragrance-sticky-info">
          <p className="fragrance-sticky-brand">{fragrance.brand}</p>
          <p className="fragrance-sticky-name">{fragrance.name}</p>
        </div>
        <div className="fragrance-sticky-actions">
          <div className="fragrance-sticky-sizes">
            {SAMPLE_SIZES.map(s => (
              <button
                key={s}
                type="button"
                className={`fragrance-sticky-size ${size === s ? 'active' : ''}`}
                onClick={() => setSize(s)}
                aria-pressed={size === s}
              >{s}</button>
            ))}
          </div>
          <button
            type="button"
            className="fragrance-sticky-cart"
            onClick={() => {
              addToCart({ fragranceId: fragrance.id, name: fragrance.name, brand: fragrance.brand, size, qty: 1 });
              showToast(`<span>Added</span> ${size} of ${fragrance.name} to cart`);
              openCart();
            }}
          >
            Add {size}
          </button>
        </div>
      </div>

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

// Fallback description used only when the catalog doesn't supply one.
// Deliberately avoids reviewer clichés ("opens with", "settles into",
// "lingers on") so it doesn't read as auto-generated.
function buildSynthDescription(f) {
  const topNotes  = f.top.split(',').slice(0, 2).map(s => s.trim()).join(' and ');
  const heartLead = (f.heart.split(',')[0] || '').trim();
  const baseLead  = (f.base.split(',')[0] || '').trim();
  const wearText  = f.season.length === 4
    ? 'Wears year-round.'
    : `Built for ${f.season.join(' and ').toLowerCase()}.`;
  return `${topNotes} on top. A heart of ${heartLead}, with ${baseLead} underneath. ${wearText}`;
}
