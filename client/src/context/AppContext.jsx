import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api, getToken, setToken } from '../lib/api.js';
import { FALLBACK_CATALOG } from '../lib/fallback-catalog.js';
import { initGA, trackEvent } from '../lib/analytics.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [fragrances, setFragrances] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [sourceModal, setSourceModal] = useState({ open: false, prefill: '' });
  const [sampleModal, setSampleModal] = useState({ open: false, prefill: '' });

  // ── Cart ──────────────────────────────────────────────────────────
  // Each item is { id, fragranceId, name, brand, size, qty }. `id` is
  // a uuid so the same fragrance can appear at multiple sizes as separate
  // line items. Identical fragrance+size combos increment qty instead.
  // Persisted to localStorage so the cart survives reloads for guests.
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('sl_cart') || '[]'); }
    catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('sl_cart', JSON.stringify(cartItems)); }
    catch { /* noop */ }
  }, [cartItems]);

  const cartCount = cartItems.reduce((sum, it) => sum + it.qty, 0);

  const addToCart = useCallback(({ fragranceId, name, brand, size, qty = 1 }) => {
    setCartItems(prev => {
      // Merge identical (fragranceId, size) pairs by incrementing qty.
      const existingIdx = prev.findIndex(
        it => it.fragranceId === fragranceId && it.size === size
      );
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], qty: Math.min(20, next[existingIdx].qty + qty) };
        return next;
      }
      return [...prev, {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        fragranceId, name, brand, size, qty,
      }];
    });
    trackEvent('add_to_cart', { fragrance_id: fragranceId, size, qty });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCartItems(prev => prev.filter(it => it.id !== id));
  }, []);

  const updateCartQty = useCallback((id, qty) => {
    const q = Math.max(1, Math.min(20, Math.floor(qty)));
    setCartItems(prev => prev.map(it => it.id === id ? { ...it, qty: q } : it));
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  // Visit counter — bumped once per app mount. Used to gate "returning visitor"
  // UX like the exit-intent popup so first-time browsers don't get hit on entry.
  const [visitCount] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const prev = parseInt(localStorage.getItem('sl_visit_count') || '0', 10) || 0;
    const next = prev + 1;
    try { localStorage.setItem('sl_visit_count', String(next)); } catch { /* noop */ }
    return next;
  });

  // ── Theme ─────────────────────────────────────────────────────────
  // User preference is one of 'system' | 'light' | 'dark'. The "effective"
  // theme — what's actually applied to body.dark — collapses 'system' down
  // to whatever the OS reports via prefers-color-scheme.
  const [themePref, setThemePrefState] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    return localStorage.getItem('sl_theme') || 'system';
  });

  const setThemePref = useCallback((pref) => {
    setThemePrefState(pref);
    try { localStorage.setItem('sl_theme', pref); } catch { /* noop */ }
  }, []);

  // Resolve preference → applied class, and re-resolve when the OS pref changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const apply = () => {
      const effective = themePref === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : themePref;
      document.body.classList.toggle('dark', effective === 'dark');
    };
    apply();
    if (themePref !== 'system') return; // only listen when in system mode
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [themePref]);

  // Convenience: a derived effective theme for components that need to know
  // whether they're in dark or light right now (e.g., Nav).
  const effectiveTheme = (() => {
    if (themePref !== 'system') return themePref;
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  })();

  // ── Analytics consent ─────────────────────────────────────────────
  // null = user hasn't decided yet → show banner.
  // 'granted' = user accepted → load GA.
  // 'denied' = user rejected → never load GA, never show banner again.
  const [analyticsConsent, setAnalyticsConsentState] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sl_analytics_consent'); // 'granted' | 'denied' | null
  });

  const setAnalyticsConsent = useCallback((value) => {
    setAnalyticsConsentState(value);
    try { localStorage.setItem('sl_analytics_consent', value); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (analyticsConsent === 'granted') initGA();
  }, [analyticsConsent]);

  // ── Catalog: prefer the API, fall back to the static catalog ──────
  // The fallback keeps the UI populated when the backend isn't reachable
  // (local dev without the server running, DB unseeded, frontend-only
  // Vercel deploys, etc). API wins whenever it returns >0 rows.
  useEffect(() => {
    let cancelled = false;
    setFragrances(FALLBACK_CATALOG); // immediate paint
    api('/api/fragrances')
      .then(d => {
        if (cancelled) return;
        if (Array.isArray(d.fragrances) && d.fragrances.length > 0) {
          setFragrances(d.fragrances);
        }
      })
      .catch(e => {
        console.warn('[catalog] using fallback catalog —', e.message);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Auth bootstrap ────────────────────────────────────────────────
  useEffect(() => {
    if (!getToken()) { setAuthLoading(false); loadLocalWishlist(); return; }
    api('/api/auth/me', { auth: true })
      .then(d => { setUser(d.user); return refreshWishlist(); })
      .catch(() => { setToken(null); loadLocalWishlist(); })
      .finally(() => setAuthLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadLocalWishlist() {
    try {
      setWishlistIds(JSON.parse(localStorage.getItem('sl_wishlist_local') || '[]'));
    } catch { setWishlistIds([]); }
  }

  const refreshWishlist = useCallback(async () => {
    try {
      const d = await api('/api/wishlist', { auth: true });
      setWishlistIds(d.ids);
    } catch (e) { console.error('[wishlist]', e); }
  }, []);

  // ── Toast ─────────────────────────────────────────────────────────
  // Existing callers pass small HTML strings (e.g. `<span>Saved</span> to wishlist`).
  // We render that as innerHTML inside a Sonner toast so callers keep their old API.
  const showToast = useCallback((text) => {
    toast(<span dangerouslySetInnerHTML={{ __html: text }} />);
  }, []);

  // ── Source modal (full bottles, secondary) ────────────────────────
  const openSourceModal = useCallback((prefill = '') => setSourceModal({ open: true, prefill }), []);
  const closeSourceModal = useCallback(() => setSourceModal({ open: false, prefill: '' }), []);

  // ── Sample modal (primary — samples-first messaging) ──────────────
  const openSampleModal = useCallback((prefill = '') => setSampleModal({ open: true, prefill }), []);
  const closeSampleModal = useCallback(() => setSampleModal({ open: false, prefill: '' }), []);

  // ── Auth ──────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const d = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    setToken(d.token); setUser(d.user); await refreshWishlist();
    trackEvent('login');
    return d.user;
  }, [refreshWishlist]);

  const signup = useCallback(async (email, password) => {
    const d = await api('/api/auth/signup', { method: 'POST', body: { email, password } });
    setToken(d.token); setUser(d.user);
    trackEvent('sign_up');
    // Migrate any guest wishlist on signup
    try {
      const local = JSON.parse(localStorage.getItem('sl_wishlist_local') || '[]');
      for (const id of local) {
        await api(`/api/wishlist/${id}`, { method: 'POST', auth: true }).catch(() => {});
      }
      localStorage.removeItem('sl_wishlist_local');
    } catch { /* ignore */ }
    await refreshWishlist();
    return d.user;
  }, [refreshWishlist]);

  const logout = useCallback(() => {
    setToken(null); setUser(null); loadLocalWishlist();
  }, []);

  const saveQuizResult = useCallback(async (result) => {
    if (!user) return;
    const d = await api('/api/auth/me/quiz', { method: 'PUT', auth: true, body: result });
    setUser(d.user);
  }, [user]);

  // ── Wishlist toggle ────────────────────────────────────────────────
  const toggleWishlist = useCallback(async (id) => {
    const isSaved = wishlistIds.includes(id);
    if (user) {
      try {
        if (isSaved) await api(`/api/wishlist/${id}`, { method: 'DELETE', auth: true });
        else        await api(`/api/wishlist/${id}`, { method: 'POST',   auth: true });
        setWishlistIds(p => isSaved ? p.filter(x => x !== id) : [...p, id]);
        if (!isSaved) trackEvent('wishlist_add', { fragrance_id: id });
        showToast(isSaved ? 'Removed from wishlist' : '<span>Saved</span> to wishlist ♡');
      } catch (e) { showToast(e.message); }
    } else {
      const next = isSaved ? wishlistIds.filter(x => x !== id) : [...wishlistIds, id];
      setWishlistIds(next);
      localStorage.setItem('sl_wishlist_local', JSON.stringify(next));
      if (!isSaved) trackEvent('wishlist_add', { fragrance_id: id, guest: true });
      showToast(isSaved ? 'Removed from wishlist' : '<span>Saved</span> to wishlist ♡');
    }
  }, [user, wishlistIds, showToast]);

  const value = useMemo(() => ({
    user, authLoading, login, signup, logout, saveQuizResult,
    fragrances,
    wishlistIds, toggleWishlist, refreshWishlist,
    showToast,
    sourceModal, openSourceModal, closeSourceModal,
    sampleModal, openSampleModal, closeSampleModal,
    visitCount,
    themePref, setThemePref, effectiveTheme,
    analyticsConsent, setAnalyticsConsent,
    cartItems, cartCount, cartOpen, addToCart, removeFromCart, updateCartQty, clearCart, openCart, closeCart,
  }), [user, authLoading, login, signup, logout, saveQuizResult, fragrances, wishlistIds, toggleWishlist, refreshWishlist, showToast, sourceModal, openSourceModal, closeSourceModal, sampleModal, openSampleModal, closeSampleModal, visitCount, themePref, setThemePref, effectiveTheme, analyticsConsent, setAnalyticsConsent, cartItems, cartCount, cartOpen, addToCart, removeFromCart, updateCartQty, clearCart, openCart, closeCart]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
