import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, getToken, setToken } from '../lib/api.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [fragrances, setFragrances] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [toast, setToastState] = useState({ text: '', visible: false });
  const [sourceModal, setSourceModal] = useState({ open: false, prefill: '' });
  const toastTimeout = useRef(null);

  // ── Catalog: always load from API ─────────────────────────────────
  useEffect(() => {
    api('/api/fragrances')
      .then(d => setFragrances(d.fragrances))
      .catch(e => console.error('[catalog]', e));
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
  const showToast = useCallback((text) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToastState({ text, visible: true });
    toastTimeout.current = setTimeout(() => setToastState(s => ({ ...s, visible: false })), 2800);
  }, []);

  // ── Source modal ──────────────────────────────────────────────────
  const openSourceModal = useCallback((prefill = '') => setSourceModal({ open: true, prefill }), []);
  const closeSourceModal = useCallback(() => setSourceModal({ open: false, prefill: '' }), []);

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
    toast, showToast,
    sourceModal, openSourceModal, closeSourceModal,
  }), [user, authLoading, login, signup, logout, saveQuizResult, fragrances, wishlistIds, toggleWishlist, refreshWishlist, toast, showToast, sourceModal, openSourceModal, closeSourceModal]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
