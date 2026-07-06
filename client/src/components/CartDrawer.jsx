import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';
import { trackEvent } from '../lib/analytics.js';
import { ScentTile } from './ScentTile.jsx';
import { unitPriceCents, cartSubtotalCents, formatMoney } from '../lib/pricing.js';

/**
 * Cart drawer slides in from the right. Two stages within the same panel:
 *   - 'browse': shows line items, qty controls, remove buttons, totals
 *   - 'checkout': name/email/address form; submitting fires the multi-
 *                 item order to /api/source with kind:'cart'
 *
 * Pricing isn't shown because we don't have it yet, once you wire
 * sample prices into the catalog (or per-size config), drop the prices
 * into the line items and the total line lights up automatically.
 */
export function CartDrawer() {
  const { cartItems, cartOpen, closeCart, updateCartQty, removeFromCart, clearCart, showToast, user, fragrances } = useApp();
  const [stage, setStage] = useState('browse');
  const [form, setForm] = useState({
    name: user?.email?.split('@')[0] ?? '',
    email: user?.email ?? '',
    address: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // When the user logs in mid-session, prefill the email
  useEffect(() => {
    if (user?.email) setForm(f => ({ ...f, email: f.email || user.email }));
  }, [user]);

  // Reset to browse view whenever the drawer closes
  useEffect(() => {
    if (!cartOpen) setStage('browse');
  }, [cartOpen]);

  // Esc closes the drawer
  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeCart(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cartOpen, closeCart]);

  const totalUnits = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotalCents = cartSubtotalCents(cartItems);

  async function placeOrder() {
    if (cartItems.length === 0) return;
    setSubmitting(true);
    try {
      // Real payments path, Stripe Checkout. Server returns the hosted
      // Checkout URL; we redirect. Shipping + email collection happens
      // on Stripe. The webhook persists the Order and fires the
      // confirmation email.
      // If the user signed up via a referral link, they have a promo
      // code cached in localStorage — pass it through so Stripe applies
      // the discount automatically.
      const { getPromoCode } = await import('../lib/referral.js');
      const r = await api('/api/payments/checkout', {
        method: 'POST',
        auth: true,
        body: {
          items: cartItems.map(it => ({
            fragranceId: it.fragranceId,
            name: it.name,
            brand: it.brand ?? '',
            size: it.size,
            qty: it.qty,
          })),
          address: form.message || form.address || undefined,
          promoCode: getPromoCode() || undefined,
        },
      });
      trackEvent('cart_checkout', { units: totalUnits, items: cartItems.length });
      if (r?.url) {
        window.location.href = r.url;
        return;
      }
      throw new Error('Checkout URL missing');
    } catch (e) {
      // Stripe not configured? Fall back to the legacy request flow so
      // the cart still works on environments without payments wired up.
      if (e?.status === 503) {
        try {
          await api('/api/source', {
            method: 'POST',
            body: {
              kind: 'cart',
              name: form.name,
              email: form.email,
              address: form.address || null,
              message: form.message || null,
              items: cartItems.map(it => ({
                fragranceId: it.fragranceId,
                name: it.name,
                brand: it.brand ?? null,
                size: it.size,
                qty: it.qty,
              })),
            },
          });
          clearCart();
          closeCart();
          showToast(`<span>Order placed.</span> ${totalUnits} sample${totalUnits !== 1 ? 's' : ''}, we'll confirm by email.`);
        } catch (err) {
          showToast(err.message || 'Could not place order');
        }
      } else {
        showToast(e.message || 'Could not start checkout');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={`cart-scrim ${cartOpen ? 'open' : ''}`} onClick={closeCart} aria-hidden={!cartOpen} />
      <aside
        className={`cart-drawer ${cartOpen ? 'open' : ''}`}
        role="dialog"
        aria-label="Cart"
        aria-hidden={!cartOpen}
      >
        <header className="cart-head">
          <p className="cart-eyebrow">Your Cart</p>
          <h2 className="cart-title">
            {totalUnits === 0 ? 'Empty' : `${totalUnits} item${totalUnits !== 1 ? 's' : ''}`}
          </h2>
          <button type="button" className="cart-close" onClick={closeCart} aria-label="Close">✕</button>
        </header>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <p className="cart-empty-icon">◇</p>
            <p className="cart-empty-text">Nothing in the cart yet.</p>
            <p className="cart-empty-sub">Browse the catalog and add samples in 2ml, 5ml, 10ml, or 30ml.</p>
            <button type="button" className="cart-empty-cta" onClick={closeCart}>Continue browsing</button>
          </div>
        ) : stage === 'browse' ? (
          <>
            <ul className="cart-items">
              {cartItems.map(it => {
                const frag = fragrances.find(f => f.id === it.fragranceId);
                const lineCents = unitPriceCents(it.size) * it.qty;
                return (
                  <li key={it.id} className="cart-item">
                    <div className="cart-item-thumb">
                      <ScentTile fragrance={frag || it} showInitial={false} />
                    </div>
                    <div className="cart-item-main">
                      <div className="cart-item-top">
                        <div className="cart-item-info">
                          {it.brand && <p className="cart-item-brand">{it.brand}</p>}
                          <p className="cart-item-name">{it.name}</p>
                          <p className="cart-item-size">{it.size} sample</p>
                        </div>
                        <button type="button" className="cart-remove-x" onClick={() => removeFromCart(it.id)} aria-label={`Remove ${it.name}`}>✕</button>
                      </div>
                      <div className="cart-item-bottom">
                        <div className="cart-qty">
                          <button type="button" onClick={() => updateCartQty(it.id, it.qty - 1)} disabled={it.qty <= 1} aria-label="Decrease quantity">−</button>
                          <span aria-label={`Quantity ${it.qty}`}>{it.qty}</span>
                          <button type="button" onClick={() => updateCartQty(it.id, it.qty + 1)} disabled={it.qty >= 20} aria-label="Increase quantity">+</button>
                        </div>
                        <span className="cart-item-price">{formatMoney(lineCents)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <footer className="cart-foot">
              <div className="cart-summary">
                <span>Subtotal</span>
                <span className="cart-summary-val">{formatMoney(subtotalCents)}</span>
              </div>
              <p className="cart-foot-note">Shipping calculated at checkout. Secure payment via Stripe.</p>
              <button type="button" className="cart-checkout-btn" onClick={() => setStage('checkout')}>
                Checkout · {formatMoney(subtotalCents)}
              </button>
            </footer>
          </>
        ) : (
          <>
            <div className="cart-checkout">
              <p className="cart-checkout-eyebrow">Almost there</p>
              <h3 className="cart-checkout-title">Where should we send <em className="gradient-em">these?</em></h3>
              <p className="cart-checkout-sub">We'll confirm pricing and ship time within 24 hours.</p>

              <label className="cart-field">
                <span className="cart-field-label">Name</span>
                <input
                  className="cart-input"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label className="cart-field">
                <span className="cart-field-label">Email</span>
                <input
                  className="cart-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </label>
              <label className="cart-field">
                <span className="cart-field-label">Shipping address <span className="cart-field-optional">(optional)</span></span>
                <textarea
                  className="cart-textarea"
                  placeholder="Street, city, postcode, country"
                  value={form.address}
                  onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </label>
              <label className="cart-field">
                <span className="cart-field-label">Notes <span className="cart-field-optional">(optional)</span></span>
                <textarea
                  className="cart-textarea"
                  placeholder="Anything we should know, concentration preferences, gift wrapping, etc."
                  value={form.message}
                  onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </label>
            </div>
            <footer className="cart-foot">
              <button type="button" className="cart-checkout-btn" onClick={placeOrder} disabled={submitting}>
                {submitting ? 'Starting checkout…' : `Pay ${formatMoney(subtotalCents)}`}
              </button>
              <button type="button" className="cart-back-btn" onClick={() => setStage('browse')}>
                ← Back to cart
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
