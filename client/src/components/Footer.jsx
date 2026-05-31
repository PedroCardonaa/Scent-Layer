import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';

/**
 * Editorial footer, last thing every user sees on every page.
 *   - Top: brand restatement (italic serif quote) on the left, inline
 *     newsletter signup on the right
 *   - Middle: three column nav grid (Shop, Read, Account)
 *   - Bottom: copyright + legal + contact + social
 *
 * Theme-adaptive, mobile collapses columns into a stacked layout.
 */
export function Footer() {
  const { showToast } = useApp();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function joinNewsletter(e) {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes('@')) {
      showToast('Please enter a valid email');
      return;
    }
    setSubmitting(true);
    try {
      await api('/api/waitlist', { method: 'POST', body: { email: value, type: 'general' } });
      setEmail('');
      showToast('<span>You\'re on the list.</span> No spam, just the next drop.');
    } catch (err) {
      showToast(err.message || 'Could not subscribe');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* ── Hero strip, brand restatement + newsletter ─────────────── */}
        <div className="footer-hero">
          <div className="footer-hero-left">
            <p className="footer-eyebrow">The Promise</p>
            <p className="footer-quote">
              <em>"Try it before you</em> commit to it.<em>"</em>
            </p>
            <p className="footer-sub">
              Authentic decants in 2, 5, 10, and 30ml. Concierge sourcing on request.
              No boutique markup. No gatekeeping.
            </p>
          </div>
          <div className="footer-hero-right">
            <p className="footer-eyebrow">The Newsletter</p>
            <p className="footer-news-lead">
              New picks, layering essays, the occasional drop. About once a month.
            </p>
            <form className="footer-news-form" onSubmit={joinNewsletter}>
              <input
                type="email"
                className="footer-news-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                aria-label="Email for the newsletter"
                required
              />
              <button
                type="submit"
                className="footer-news-btn"
                disabled={submitting || !email.trim()}
              >{submitting ? 'Adding…' : 'Subscribe'}</button>
            </form>
            <p className="footer-news-fine">No spam. Unsubscribe in one click.</p>
          </div>
        </div>

        {/* ── Column nav ───────────────────────────────────────────── */}
        <nav className="footer-cols" aria-label="Footer">
          <div className="footer-col">
            <h4 className="footer-col-head">Shop</h4>
            <ul>
              <li><Link to="/shop">All Fragrances</Link></li>
              <li><Link to="/shop#sets">Discovery Sets</Link></li>
              <li><Link to="/shop#calc">Spray Calculator</Link></li>
              <li><Link to="/shop#finder">Scent Finder</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-head">Read</h4>
            <ul>
              <li><Link to="/explore">Editorial Lists</Link></li>
              <li><Link to="/explore#occasions">Occasion Pairings</Link></li>
              <li><Link to="/explore#101">Fragrance 101</Link></li>
              <li><Link to="/story">The Story</Link></li>
              <li><Link to="/about">About Scent Layer</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-head">Account</h4>
            <ul>
              <li><Link to="/profile">My Wardrobe</Link></li>
              <li><Link to="/profile#blends">My Blends</Link></li>
              <li><Link to="/profile#reviews">My Reviews</Link></li>
              <li><Link to="/profile#personalize">Find My Scent</Link></li>
              <li><Link to="/tools">AI Tools</Link></li>
            </ul>
          </div>
        </nav>

        {/* ── Wordmark divider ─────────────────────────────────────── */}
        <div className="footer-divider">
          <span className="footer-divider-mark">
            <em>scent</em>
            <span className="footer-divider-dot" />
            layer
          </span>
        </div>

        {/* ── Bottom row ───────────────────────────────────────────── */}
        <div className="footer-bottom">
          <p className="footer-copy">© {new Date().getFullYear()} Scent Layer. All rights reserved.</p>
          <div className="footer-meta">
            <Link to="/privacy">Privacy</Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms">Terms</Link>
            <span aria-hidden="true">·</span>
            <a href="mailto:scentlayer@gmail.com">scentlayer@gmail.com</a>
            <span aria-hidden="true">·</span>
            <a href="https://instagram.com" target="_blank" rel="noreferrer noopener">Instagram</a>
            <span aria-hidden="true">·</span>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer noopener">TikTok</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
