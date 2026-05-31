import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';
import { trackEvent } from '../lib/analytics.js';

/**
 * Gift modal, opened from any fragrance page's "Send as gift" CTA.
 * Collects sender + recipient + optional note, then redirects to
 * Stripe Checkout. The webhook handles the rest: persisting the
 * GiftOrder, emailing the recipient, marking the slug.
 *
 * Reuses the same modal styling as SampleModal so it fits the bottom-
 * sheet pattern on mobile.
 */
export function GiftModal() {
  const { giftModal, closeGiftModal, user, showToast } = useApp();
  const [form, setForm] = useState({
    senderName:    '',
    senderEmail:   '',
    recipientName: '',
    recipientEmail:'',
    message:       '',
  });
  const [submitting, setSubmitting] = useState(false);
  const open = giftModal?.open ?? false;

  // Pre-fill sender info if signed in
  useEffect(() => {
    if (user?.email) setForm(f => ({ ...f, senderEmail: f.senderEmail || user.email }));
  }, [user]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') closeGiftModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeGiftModal]);

  if (!open) return null;
  const fragrance = giftModal?.fragrance;
  if (!fragrance) return null;

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.senderName.trim() || !form.senderEmail.trim() || !form.recipientName.trim() || !form.recipientEmail.trim()) {
      showToast('Please fill in all names and emails');
      return;
    }
    setSubmitting(true);
    try {
      const r = await api('/api/gifts/checkout', {
        method: 'POST',
        body: {
          senderName:    form.senderName.trim(),
          senderEmail:   form.senderEmail.trim(),
          recipientName: form.recipientName.trim(),
          recipientEmail:form.recipientEmail.trim(),
          message:       form.message.trim() || undefined,
          items: [{
            fragranceId: fragrance.id,
            name:        fragrance.name,
            brand:       fragrance.brand,
            size:        '5ml',
            qty:         1,
          }],
        },
      });
      trackEvent('gift_checkout', { fragrance_id: fragrance.id });
      if (r?.url) {
        window.location.href = r.url;
        return;
      }
      showToast('Could not start checkout');
    } catch (err) {
      if (err?.status === 503) {
        showToast('Gifting is in private beta. Reach out via the contact email.');
      } else {
        showToast(err.message || 'Could not start checkout');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={closeGiftModal} role="dialog" aria-label="Send as a gift">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={closeGiftModal} aria-label="Close">✕</button>
        <p className="modal-label">Send as a gift</p>
        <h2 className="modal-title">{fragrance.name} <em>by {fragrance.brand}</em></h2>
        <p className="modal-sub">5ml decant, beautifully boxed. They get an email with a private reveal page and your note inside.</p>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input className="modal-input" placeholder="Your name" value={form.senderName} onChange={(e) => update('senderName', e.target.value)} required />
            <input className="modal-input" type="email" placeholder="Your email" value={form.senderEmail} onChange={(e) => update('senderEmail', e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input className="modal-input" placeholder="Their name" value={form.recipientName} onChange={(e) => update('recipientName', e.target.value)} required />
            <input className="modal-input" type="email" placeholder="Their email" value={form.recipientEmail} onChange={(e) => update('recipientEmail', e.target.value)} required />
          </div>
          <textarea
            className="modal-input"
            placeholder="A short note (optional). They'll read this with the reveal."
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
            rows={3}
            maxLength={800}
            style={{ resize: 'vertical', minHeight: 70, fontFamily: 'inherit' }}
          />
          <button type="submit" className="btn-gold" style={{ width: '100%', marginTop: 8 }} disabled={submitting}>
            {submitting ? 'Preparing your gift…' : 'Continue to Checkout'}
          </button>
        </form>
      </div>
    </div>
  );
}
