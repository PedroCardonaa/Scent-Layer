import { NavLink, useLocation } from 'react-router-dom';
import { Home, Store, Sparkles, ShoppingBag, User } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

/**
 * Sticky mobile bottom nav — visible only ≤900px (hidden on desktop via CSS).
 * Five anchored shortcuts: Home, Shop, Tools, Cart, Profile.
 *
 * The Cart "tab" doesn't navigate — it opens the side drawer. Same UX
 * pattern as the existing nav cart button.
 *
 * Hidden on the Story page (the only chrome-less brand-moment surface
 * where this would compete with the manifesto).
 */
export function MobileBottomNav() {
  const { cartCount, openCart, user } = useApp();
  const { pathname } = useLocation();

  if (pathname === '/story') return null;

  const profileHref = user ? '/profile' : '/login';

  return (
    <nav className="mobile-bottom-nav" aria-label="Quick navigation">
      <NavLink to="/" end className="mbn-item">
        <Home size={18} strokeWidth={1.5} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/shop" className="mbn-item">
        <Store size={18} strokeWidth={1.5} />
        <span>Shop</span>
      </NavLink>
      <NavLink to="/tools" className="mbn-item">
        <Sparkles size={18} strokeWidth={1.5} />
        <span>Tools</span>
      </NavLink>
      <button type="button" className="mbn-item" onClick={openCart} aria-label={`Open cart (${cartCount} items)`}>
        <span className="mbn-cart-wrap">
          <ShoppingBag size={18} strokeWidth={1.5} />
          {cartCount > 0 && <span className="mbn-cart-badge">{cartCount}</span>}
        </span>
        <span>Cart</span>
      </button>
      <NavLink to={profileHref} className="mbn-item">
        <User size={18} strokeWidth={1.5} />
        <span>{user ? 'Profile' : 'Sign In'}</span>
      </NavLink>
    </nav>
  );
}
