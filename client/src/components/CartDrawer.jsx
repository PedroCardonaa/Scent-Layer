import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';
import { trackEvent } from '../lib/analytics.js';

/**
 * Cart drawer slides in from the right. Two stages within the same panel:
 *   - 'browse': shows line items, qty controls, remove buttons, totals
 *   - 'checkout': name/email/address form; submitting fires the multi-
 *                 item order to /api/source with kind:'cart'
 *
 * Pricing isn't shown because we don't have it yet — once you wire
 * sample prices into the catalog (or per-size config), drop the prices
 * into the line items and the total line lights up automatically.
 */
export function CartDrawer() {
  const { cartItems, cartOpen, closeCart, updateCartQty, removeFromCart, clearCart, showToast, user } = useApp();
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

  async function placeOrder() {
    if (!form.name.trim() || !form.email.trim()) {
      showToast('Please fill in your name and email');
      return;
    }
    if (cartItems.length === 0) return;
    setSubmitting(true);
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
      trackEvent('cart_checkout', { units: totalUnits, items: cartItems.length });
      clearCart();
      closeCart();
      showToast(`<span>Order placed.</span> ${totalUnits} sample${totalUnits !== 1 ? 's' : ''} — we'll confirm by email.`);
    } catch (e) {
      showToast(e.message || 'Could not place order');
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
              {cartItems.map(it => (
                <li key={it.id} className="cart-item">
                  <div className="cart-item-info">
                    {it.brand && <p className="cart-item-brand">{it.brand}</p>}
                    <p className="cart-item-name">{it.name}</p>
                    <p className="cart-item-size">{it.size}</p>
                  </div>
                  <div className="cart-item-controls">
                    <div className="cart-qty">
                      <button type="button" onClick={() => updateCartQty(it.id, it.qty - 1)} disabled={it.qty <= 1} aria-label="Decrease quantity">−</button>
                      <span aria-label={`Quantity ${it.qty}`}>{it.qty}</span>
                      <button type="button" onClick={() => updateCartQty(it.id, it.qty + 1)} disabled={it.qty >= 20} aria-label="Increase quantity">+</button>
                    </div>
                    <button type="button" className="cart-remove" onClick={() => removeFromCart(it.id)} aria-label={`Remove ${it.name}`}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="cart-foot">
              <div className="cart-summary">
                <span>Total samples</span>
                <span className="cart-summary-val">{totalUnits}</span>
              </div>
              <p className="cart-foot-note">Pricing is confirmed by email after you place the order. No charge until you accept the quote.</p>
              <button type="button" className="cart-checkout-btn" onClick={() => setStage('checkout')}>
                Checkout
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
                  placeholder="Anything we should know — concentration preferences, gift wrapping, etc."
                  value={form.message}
                  onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </label>
            </div>
            <footer className="cart-foot">
              <button type="button" className="cart-checkout-btn" onClick={placeOrder} disabled={submitting}>
                {submitting ? 'Placing order…' : `Place order · ${totalUnits} sample${totalUnits !== 1 ? 's' : ''}`}
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
