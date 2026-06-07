import { useApp } from '../context/AppContext.jsx';
import { cartSubtotalCents, formatMoney } from '../lib/pricing.js';

/**
 * Slim sticky bar on mobile showing item count + subtotal + a tap
 * target that opens the cart drawer. Only renders when the cart has
 * items. Sits above the mobile bottom nav (CSS handles the offset).
 * Hidden on desktop (the nav cart icon is always visible there).
 */
export function MiniCartBar() {
  const { cartItems, cartCount, openCart, cartOpen } = useApp();

  if (cartCount === 0 || cartOpen) return null;
  const subtotal = cartSubtotalCents(cartItems);

  return (
    <button type="button" className="mini-cart-bar" onClick={openCart} aria-label="Open cart">
      <span className="mini-cart-left">
        <span className="mini-cart-count">{cartCount}</span>
        <span className="mini-cart-label">in your cart</span>
      </span>
      <span className="mini-cart-right">
        <span className="mini-cart-total">{formatMoney(subtotal)}</span>
        <span className="mini-cart-cta">Checkout →</span>
      </span>
    </button>
  );
}
