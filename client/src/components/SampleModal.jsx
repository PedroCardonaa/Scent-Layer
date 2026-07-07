import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';
import { trackEvent } from '../lib/analytics.js';
import { unitPriceCents, formatMoney } from '../lib/pricing.js';

const SAMPLE_SIZES = [
  { ml: '2ml',  label: '~30 sprays',  desc: 'Try it once or twice' },
  { ml: '5ml',  label: '~85 sprays',  desc: 'A weekend with it' },
  { ml: '10ml', label: '~175 sprays', desc: 'A month of daily wear' },
  { ml: '30ml', label: '~510 sprays', desc: 'Your travel signature' },
];

export function SampleModal() {
  const { sampleModal, closeSampleModal, openSourceModal, showToast } = useApp();
  const { open, prefill } = sampleModal;
  const overlayRef = useRef(null);

  const [form, setForm] = useState({ name: '', email: '', perfume: '', message: '' });
  const [size, setSize] = useState('5ml');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(f => ({ ...f, perfume: prefill || '' }));
      setSize('5ml');
    }
  }, [open, prefill]);

  function onOverlayClick(e) {
    if (e.target === overlayRef.current) closeSampleModal();
  }

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) {
      showToast('Please fill in your name and email');
      return;
    }
    if (!form.perfume.trim()) {
      showToast('Tell us which fragrance you want to sample');
      return;
    }
    setSubmitting(true);
    try {
      await api('/api/source', {
        method: 'POST',
        body: {
          kind: 'sample',
          size,
          name: form.name,
          email: form.email,
          fragrance: form.perfume,
          message: form.message || null,
        },
      });
      trackEvent('sample_order', { size, fragrance: form.perfume });
      closeSampleModal();
      showToast(`<span>Sample ordered!</span> ${size} of ${form.perfume}, we'll confirm by email.`);
      setForm({ name: '', email: '', perfume: '', message: '' });
    } catch (e) {
      showToast(e.message || 'Failed to send');
    } finally {
      setSubmitting(false);
    }
  }

  function switchToBottle() {
    closeSampleModal();
    setTimeout(() => openSourceModal(prefill), 50);
  }

  return (
    <div ref={overlayRef} className={`modal-overlay ${open ? 'open' : ''}`} onClick={onOverlayClick}>
      <div className="modal sample-modal">
        <button className="modal-close" onClick={closeSampleModal} type="button" aria-label="Close">✕</button>
        <p className="modal-label">Order a Sample</p>
        <h3 className="modal-title">{prefill ? `Sample: ${prefill}` : 'Order a Fragrance Sample'}</h3>
        <p className="modal-sub">Try before you commit. Authentic samples decanted from full bottles, same juice, smaller pour.</p>

        <p className="sample-size-label">Pick a Size</p>
        <div className="sample-sizes">
          {SAMPLE_SIZES.map(s => (
            <button
              key={s.ml}
              type="button"
              className={`sample-size ${size === s.ml ? 'active' : ''}`}
              onClick={() => setSize(s.ml)}
            >
              <span className="sample-size-ml">{s.ml}</span>
              <span className="sample-size-price">{formatMoney(unitPriceCents(s.ml))}</span>
              <span className="sample-size-sprays">{s.label}</span>
              <span className="sample-size-desc">{s.desc}</span>
            </button>
          ))}
        </div>

        <input className="modal-input" placeholder="Your name"  value={form.name}    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
        <input className="modal-input" placeholder="Your email" value={form.email}   onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
        <input className="modal-input" placeholder="Fragrance name & brand" value={form.perfume} onChange={(e) => setForm(f => ({ ...f, perfume: e.target.value }))} />
        <textarea className="modal-textarea" placeholder="Anything else? (concentration preference, multiple sizes, etc.)" value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} />
        <button className="modal-submit" onClick={submit} disabled={submitting} type="button">
          {submitting ? 'Sending…' : `Order ${size} Sample · ${formatMoney(unitPriceCents(size))}`}
        </button>
        <p className="modal-note">We'll confirm your order and ship times within 24 hours.</p>
        <button type="button" className="modal-switch" onClick={switchToBottle}>
          Or source a full bottle →
        </button>
      </div>
    </div>
  );
}
