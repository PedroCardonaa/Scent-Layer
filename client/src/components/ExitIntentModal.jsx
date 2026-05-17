import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';
import { trackEvent } from '../lib/analytics.js';

const SESSION_KEY = 'sl_exit_intent_shown';

/**
 * Exit-intent capture for returning visitors.
 *
 * Fires once per session when:
 *   - visitCount >= 2  (returning visitors only — first-time browsers are spared)
 *   - cursor crosses the top edge of the viewport with upward velocity
 *
 * Anyone who closes it, submits it, or has already seen it this session
 * won't see it again. Mobile gets a 30-second-on-page fallback trigger
 * since you can't mouse-leave a touch screen.
 */
export function ExitIntentModal() {
  const { visitCount, showToast } = useApp();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const lastY = useRef(Infinity);
  const armed = useRef(false);

  const close = useCallback(() => {
    setOpen(false);
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (visitCount < 2) return;
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') return;
    } catch { /* noop */ }

    // Arm after a small delay so the cursor leaving the tab on initial
    // page-load doesn't immediately trigger.
    const armTimer = setTimeout(() => { armed.current = true; }, 3000);

    const onMouseMove = (e) => { lastY.current = e.clientY; };
    const onMouseOut = (e) => {
      if (!armed.current) return;
      // Real mouse-leave events have null relatedTarget on the document boundary.
      if (e.relatedTarget !== null && e.relatedTarget !== undefined) return;
      // Cursor moving upward past the top edge → exit intent.
      if (e.clientY <= 0 && lastY.current > e.clientY) {
        setOpen(true);
      }
    };

    // Touch fallback: 30 seconds dwell time triggers the same prompt.
    const touchTimer = setTimeout(() => {
      if (!armed.current) return;
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        setOpen(true);
      }
    }, 33000);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseout', onMouseOut);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseout', onMouseOut);
      clearTimeout(armTimer);
      clearTimeout(touchTimer);
    };
  }, [visitCount]);

  async function submit(e) {
    e.preventDefault();
    if (!email.includes('@')) { showToast('Please enter a valid email'); return; }
    setSubmitting(true);
    try {
      await api('/api/waitlist', { method: 'POST', body: { email, type: 'general' } });
      trackEvent('newsletter_signup', { source: 'exit_intent' });
      close();
      showToast('<span>Locked in.</span> First-drop access reserved.');
    } catch (err) {
      showToast(err.message || 'Could not save your email');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`exit-intent-overlay ${open ? 'open' : ''}`} role="dialog" aria-hidden={!open}>
      <div className="exit-intent-modal">
        <button type="button" className="exit-intent-close" onClick={close} aria-label="Close">✕</button>
        <p className="exit-intent-eyebrow">Before you go</p>
        <h2 className="exit-intent-title">
          Reserve the<br/><em className="gradient-em">first drop.</em>
        </h2>
        <p className="exit-intent-body">
          We're launching soon with a curated first batch of niche and designer samples.
          Members on the list get first access — and the inaugural 2ml sample on us.
        </p>
        <form onSubmit={submit} className="exit-intent-form">
          <input
            className="exit-intent-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            autoFocus={open}
          />
          <button type="submit" className="exit-intent-btn" disabled={submitting}>
            {submitting ? 'Saving…' : 'Reserve My Spot'}
          </button>
        </form>
        <button type="button" className="exit-intent-dismiss" onClick={close}>
          No thanks, I'll find my way
        </button>
      </div>
    </div>
  );
}
