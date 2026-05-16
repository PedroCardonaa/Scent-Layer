import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api, getToken, setToken } from '../lib/api.js';
import { FALLBACK_CATALOG } from '../lib/fallback-catalog.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [fragrances, setFragrances] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [sourceModal, setSourceModal] = useState({ open: false, prefill: '' });
  const [sampleModal, setSampleModal] = useState({ open: false, prefill: '' });
  // Visit counter — bumped once per app mount. Used to gate "returning visitor"
  // UX like the exit-intent popup so first-time browsers don't get hit on entry.
  const [visitCount] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const prev = parseInt(localStorage.getItem('sl_visit_count') || '0', 10) || 0;
    const next = prev + 1;
    try { localStorage.setItem('sl_visit_count', String(next)); } catch { /* noop */ }
    return next;
  });

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
    return d.user;
  }, [refreshWishlist]);

  const signup = useCallback(async (email, password) => {
    const d = await api('/api/auth/signup', { method: 'POST', body: { email, password } });
    setToken(d.token); setUser(d.user);
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
        showToast(isSaved ? 'Removed from wishlist' : '<span>Saved</span> to wishlist ♡');
      } catch (e) { showToast(e.message); }
    } else {
      const next = isSaved ? wishlistIds.filter(x => x !== id) : [...wishlistIds, id];
      setWishlistIds(next);
      localStorage.setItem('sl_wishlist_local', JSON.stringify(next));
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
  }), [user, authLoading, login, signup, logout, saveQuizResult, fragrances, wishlistIds, toggleWishlist, refreshWishlist, showToast, sourceModal, openSourceModal, closeSourceModal, sampleModal, openSampleModal, closeSampleModal, visitCount]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
