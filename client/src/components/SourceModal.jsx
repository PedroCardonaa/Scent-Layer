import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';
import { trackEvent } from '../lib/analytics.js';

export function SourceModal() {
  const { sourceModal, closeSourceModal, showToast } = useApp();
  const { open, prefill } = sourceModal;
  const overlayRef = useRef(null);

  const [form, setForm] = useState({ name: '', email: '', perfume: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setForm(f => ({ ...f, perfume: prefill || '' }));
  }, [open, prefill]);

  function onOverlayClick(e) {
    if (e.target === overlayRef.current) closeSourceModal();
  }

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) {
      showToast('Please fill in your name and email');
      return;
    }
    setSubmitting(true);
    try {
      await api('/api/source', {
        method: 'POST',
        body: { kind: 'bottle', name: form.name, email: form.email, fragrance: form.perfume || null, message: form.message || null },
      });
      trackEvent('source_request', { fragrance: form.perfume || '' });
      closeSourceModal();
      showToast('<span>Request sent!</span> We\'ll be in touch within 24hrs.');
      setForm({ name: '', email: '', perfume: '', message: '' });
    } catch (e) {
      showToast(e.message || 'Failed to send');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div ref={overlayRef} className={`modal-overlay ${open ? 'open' : ''}`} onClick={onOverlayClick}>
      <div className="modal">
        <button className="modal-close" onClick={closeSourceModal} type="button" aria-label="Close">✕</button>
        <p className="modal-label">Source a Bottle</p>
        <h3 className="modal-title">{prefill ? `Source: ${prefill}` : 'Request a Fragrance'}</h3>
        <p className="modal-sub">Tell us what you're looking for and we'll get back to you with availability and pricing.</p>
        <input className="modal-input" placeholder="Your name"  value={form.name}    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
        <input className="modal-input" placeholder="Your email" value={form.email}   onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
        <input className="modal-input" placeholder="Fragrance name & brand" value={form.perfume} onChange={(e) => setForm(f => ({ ...f, perfume: e.target.value }))} />
        <textarea className="modal-textarea" placeholder="Any details — size, concentration, budget…" value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} />
        <button className="modal-submit" onClick={submit} disabled={submitting} type="button">
          {submitting ? 'Sending…' : 'Send Request'}
        </button>
        <p className="modal-note">We'll respond within 24 hours with sourcing options and pricing.</p>
      </div>
    </div>
  );
}
