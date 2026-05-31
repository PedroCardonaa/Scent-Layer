import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { ToggleTheme } from './ui/ToggleTheme.jsx';
import { ToggleSound } from './ui/ToggleSound.jsx';
import { NavWordmark } from './NavWordmark.jsx';

/**
 * Nav reads its own theme class from the global effectiveTheme so it
 * always matches the body. The legacy `theme` prop is still accepted
 * for callers that haven't been updated, but if omitted (preferred),
 * the Nav follows the user's chosen theme.
 */
export function Nav({ theme: themeOverride, children }) {
  const [open, setOpen] = useState(false);
  const { wishlistIds, user, effectiveTheme, cartCount, openCart } = useApp();
  const { pathname } = useLocation();
  const theme = themeOverride ?? effectiveTheme;

  useEffect(() => { setOpen(false); document.body.style.overflow = ''; }, [pathname]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; }, [open]);

  const profileHref = user ? '/profile' : '/login';
  const profileLabel = user ? '♡ Wishlist' : '♡ Sign In';

  return (
    <>
      <nav className={theme}>
        <NavWordmark theme={theme} />
        {children ?? (
          <ul className="nav-links">
            <li><NavLink to="/shop">Shop</NavLink></li>
            <li><NavLink to="/tools">Tools</NavLink></li>
            <li><NavLink to="/explore">Explore</NavLink></li>
            <li><NavLink to="/about">About</NavLink></li>
            <li><NavLink to="/profile">{user ? 'Wishlist' : 'Sign In'}</NavLink></li>
          </ul>
        )}
        <div className="nav-right">
          <button
            type="button"
            className="nav-search"
            onClick={() => window.dispatchEvent(new Event('sl-open-search'))}
            aria-label="Open search"
            title="Search (Cmd/Ctrl+K)"
          >
            <span aria-hidden="true">⌕</span>
            <span className="nav-search-label">Search</span>
            <span className="nav-search-kbd">⌘K</span>
          </button>
          <ToggleSound />
          <ToggleTheme />
          <button type="button" className="nav-cart" onClick={openCart} aria-label={`Cart (${cartCount} items)`}>
            <ShoppingBag size={16} strokeWidth={1.5} />
            {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
          </button>
          <Link to={profileHref} className="nav-profile">
            {profileLabel} <span className="wishlist-count">{wishlistIds.length}</span>
          </Link>
        </div>
        <button
          className={`nav-hamburger ${open ? 'open' : ''}`}
          onClick={() => setOpen(v => !v)}
          aria-label="Menu"
          type="button"
        >
          <span /><span /><span />
        </button>
      </nav>

      <div className={`nav-drawer ${theme} ${open ? 'open' : ''}`}>
        <Link to="/" onClick={() => setOpen(false)}>Home</Link>
        <Link to="/shop" onClick={() => setOpen(false)}>Shop</Link>
        <Link to="/tools" onClick={() => setOpen(false)}>Tools</Link>
        <Link to="/explore" onClick={() => setOpen(false)}>Explore</Link>
        <Link to="/about" onClick={() => setOpen(false)}>About</Link>
        <Link to={profileHref} className="drawer-wishlist" onClick={() => setOpen(false)}>
          {user ? '♡ My Wishlist' : '♡ Sign In'}
        </Link>
        <button type="button" className="drawer-cart" onClick={() => { setOpen(false); openCart(); }}>
          Cart {cartCount > 0 && `(${cartCount})`}
        </button>
        <div className="drawer-theme-toggle"><ToggleTheme /></div>
      </div>
    </>
  );
}
