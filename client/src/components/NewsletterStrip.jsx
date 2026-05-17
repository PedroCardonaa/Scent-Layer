import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';
import { trackEvent } from '../lib/analytics.js';

/**
 * Slim, high-visibility newsletter capture for the top of the homepage.
 * Posts to the existing /api/waitlist endpoint with type:'general' so it
 * shares the same database table as the bottom-of-page waitlist.
 */
export function NewsletterStrip() {
  const { showToast } = useApp();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email.includes('@')) { showToast('Please enter a valid email'); return; }
    setSubmitting(true);
    try {
      await api('/api/waitlist', { method: 'POST', body: { email, type: 'general' } });
      trackEvent('newsletter_signup', { source: 'newsletter_strip' });
      setDone(true);
      setEmail('');
      showToast('<span>You\'re on the list.</span> First drop, first access.');
    } catch (err) {
      showToast(err.message || 'Could not save your email');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="newsletter-strip">
      <div className="newsletter-strip-inner">
        <div className="newsletter-strip-left">
          <p className="newsletter-strip-eyebrow">Pre-launch — early access</p>
          <h2 className="newsletter-strip-title">
            Get the first <em className="gradient-em">drop</em> in your inbox.
          </h2>
          <p className="newsletter-strip-sub">One email, only when the catalog opens. No spam between now and then.</p>
        </div>
        <form className="newsletter-strip-form" onSubmit={submit}>
          {done ? (
            <div className="newsletter-strip-success">
              <span className="newsletter-strip-success-icon">✦</span>
              <span>You're in. Check your inbox at launch.</span>
            </div>
          ) : (
            <>
              <input
                className="newsletter-strip-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
              <button className="newsletter-strip-btn" type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Notify Me'}
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
