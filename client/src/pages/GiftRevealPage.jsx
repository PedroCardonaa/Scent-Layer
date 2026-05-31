import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { api } from '../lib/api.js';
import { useDocumentMeta } from '../lib/seo.js';

/**
 * Gift reveal page at /gift/:slug, public, the link recipients land on
 * after opening the gift email. Shows the sender's note + the
 * fragrances chosen for them + a soft CTA pointing to the catalog.
 *
 * Fetches the gift detail from /api/gifts/:slug. The first GET also
 * marks openedAt on the GiftOrder so the sender can see the recipient
 * has read it.
 */
export function GiftRevealPage() {
  const { slug } = useParams();
  const [gift, setGift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api(`/api/gifts/${slug}`)
      .then(g => { if (!cancelled) setGift(g); })
      .catch(e => { if (!cancelled) setError(e.message || 'Could not load gift'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  useDocumentMeta({
    title: gift ? `${gift.senderName} sent you a gift` : 'A gift from Scent Layer',
    description: 'A Scent Layer gift waiting to be opened.',
  });

  return (
    <>
      <Nav />
      <main className="gift-reveal">
        {loading && <p style={{ color: 'var(--fg-soft)', fontStyle: 'italic' }}>Opening your gift…</p>}
        {error && (
          <div className="gift-reveal-card">
            <p className="gift-reveal-eyebrow">Gift not found</p>
            <h1 className="gift-reveal-title">This link <em>has expired</em> or never existed.</h1>
            <p className="gift-reveal-fine">If you got here from an email, the sender may have cancelled. Otherwise, the catalog is a good place to start.</p>
            <Link to="/shop" className="btn-gold" style={{ marginTop: 20, display: 'inline-block' }}>Browse Scents</Link>
          </div>
        )}
        {gift && (
          <div className="gift-reveal-card">
            <p className="gift-reveal-eyebrow">A gift for you</p>
            <h1 className="gift-reveal-title">
              {gift.senderName} picked you some <em>scent.</em>
            </h1>
            <p className="gift-reveal-from">From {gift.senderName}</p>

            {gift.message && (
              <blockquote className="gift-reveal-message">
                "{gift.message}"
              </blockquote>
            )}

            <p className="gift-reveal-fine" style={{ marginTop: 8 }}>What they chose for you:</p>
            <ul className="gift-reveal-items">
              {(gift.items || []).map((it, i) => (
                <li key={i}>
                  <strong>{it.name}</strong>
                  <span>{it.brand} · {it.size}</span>
                </li>
              ))}
            </ul>

            <p className="gift-reveal-fine">
              Your samples will ship to you within the week. Reply to the email if you'd like
              to send the address yourself, or your gift will route to the email on file.
            </p>

            <Link to="/shop" className="btn-gold" style={{ marginTop: 28, display: 'inline-block' }}>
              Explore the catalog
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
