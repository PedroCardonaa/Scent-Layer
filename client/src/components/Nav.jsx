import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export function Nav({ theme = 'light', children }) {
  const [open, setOpen] = useState(false);
  const { wishlistIds, user } = useApp();
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); document.body.style.overflow = ''; }, [pathname]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; }, [open]);

  const profileHref = user ? '/profile' : '/login';
  const profileLabel = user ? '♡ Wishlist' : '♡ Sign In';

  return (
    <>
      <nav className={theme}>
        <Link to="/" className="nav-logo">Scent Layer</Link>
        {children ?? (
          <ul className="nav-links">
            <li><NavLink to="/shop">Shop</NavLink></li>
            <li><NavLink to="/tools">Tools</NavLink></li>
            <li><NavLink to="/explore">Explore</NavLink></li>
            <li><NavLink to="/profile">{user ? 'Wishlist' : 'Sign In'}</NavLink></li>
          </ul>
        )}
        <Link to={profileHref} className="nav-profile">
          {profileLabel} <span className="wishlist-count">{wishlistIds.length}</span>
        </Link>
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
        <Link to={profileHref} className="drawer-wishlist" onClick={() => setOpen(false)}>
          {user ? '♡ My Wishlist' : '♡ Sign In'}
        </Link>
      </div>
    </>
  );
}
