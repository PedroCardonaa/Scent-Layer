import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api, getToken, setToken } from '../lib/api.js';
import { FALLBACK_CATALOG } from '../lib/fallback-catalog.js';
import { FALLBACK_SETS } from '../lib/discovery-sets.js';
import { initGA, trackEvent } from '../lib/analytics.js';
import { playWhoosh, playChime } from '../lib/sound.js';
import { captureRefFromUrl, getStoredRef, clearStoredRef, setPromoCode } from '../lib/referral.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [fragrances, setFragrances] = useState([]);
  const [sets, setSets] = useState(FALLBACK_SETS);
  // null = unknown (not yet checked), true = reachable, false = down.
  // Drives the thin "preview mode" banner so users understand why
  // checkout / auth buttons may not work.
  const [apiReachable, setApiReachable] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);
  // Wardrobe: array of { id, fragranceId, status, sizeMl, notes, fragrance }
  const [wardrobeItems, setWardrobeItems] = useState([]);
  // Saved blends: array of { id, name, fragrances, result, createdAt }
  const [savedBlends, setSavedBlends] = useState([]);
  // User's own reviews
  const [myReviews, setMyReviews] = useState([]);
  const [sourceModal, setSourceModal] = useState({ open: false, prefill: '' });
  const [sampleModal, setSampleModal] = useState({ open: false, prefill: '' });
  const [giftModal,   setGiftModal]   = useState({ open: false, fragrance: null });

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
    playWhoosh();
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

  // ── Recently Viewed ──────────────────────────────────────────────
  // Tracks last 5 fragrance IDs the user has opened. Newest first,
  // duplicates removed. Persisted to localStorage. Used by the home
  // page and fragrance detail page to pull users back to things they
  // were considering.
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const parsed = JSON.parse(localStorage.getItem('sl_recently_viewed') || '[]');
      return Array.isArray(parsed) ? parsed.filter(n => typeof n === 'number') : [];
    } catch { return []; }
  });

  const markViewed = useCallback((id) => {
    if (typeof id !== 'number') return;
    setRecentlyViewed(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, 5);
      try { localStorage.setItem('sl_recently_viewed', JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);
  // Visit counter, bumped once per app mount. Used to gate "returning visitor"
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
  // theme, what's actually applied to body.dark, collapses 'system' down
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

  // ── Discovery Sets, prefer API, fall back to static ──────────────
  useEffect(() => {
    api('/api/sets')
      .then(d => { if (Array.isArray(d.sets) && d.sets.length > 0) setSets(d.sets); })
      .catch(() => { /* fallback already in state */ });
  }, []);

  // ── Add a Discovery Set to the cart ───────────────────────────────
  // Expands the set into N individual line items at the set's size.
  // The discount is applied at the line-item level so checkout payload
  // shape stays unchanged. We pass `setSlug` through on each item so
  // the cart drawer can group them visually.
  const addSetToCart = useCallback((set, catalog) => {
    if (!set || !Array.isArray(set.fragranceIds)) return;
    set.fragranceIds.forEach(id => {
      const f = catalog.find(c => c.id === id);
      if (!f) return;
      // Defer to the regular addToCart so merging logic + analytics fire.
      // We can't call addToCart directly (it's defined below), instead we
      // dispatch by reading setCartItems straight here.
      setCartItems(prev => {
        const existingIdx = prev.findIndex(it => it.fragranceId === id && it.size === set.size);
        if (existingIdx !== -1) {
          const next = [...prev];
          next[existingIdx] = { ...next[existingIdx], qty: Math.min(20, next[existingIdx].qty + 1) };
          return next;
        }
        return [...prev, {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
          fragranceId: id,
          name: f.name,
          brand: f.brand,
          size: set.size,
          qty: 1,
          setSlug: set.slug,
          setName: set.name,
          discountPct: set.discountPct,
        }];
      });
    });
    trackEvent('add_set_to_cart', { set: set.slug, count: set.fragranceIds.length });
  }, []);

  // ── Catalog: prefer the API, fall back to the static catalog ──────
  // The fallback keeps the UI populated when the backend isn't reachable
  // (local dev without the server running, DB unseeded, frontend-only
  // Vercel deploys, etc). API wins whenever it returns >0 rows.
  const refreshCatalog = useCallback(async () => {
    try {
      const d = await api('/api/fragrances');
      if (Array.isArray(d.fragrances) && d.fragrances.length > 0) {
        setFragrances(d.fragrances);
      }
    } catch (e) {
      console.warn('[catalog] refresh failed ,', e.message);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFragrances(FALLBACK_CATALOG); // immediate paint
    api('/api/fragrances')
      .then(d => {
        if (cancelled) return;
        if (Array.isArray(d.fragrances) && d.fragrances.length > 0) {
          setFragrances(d.fragrances);
        }
        setApiReachable(true);
      })
      .catch(e => {
        console.warn('[catalog] using fallback catalog ,', e.message);
        if (!cancelled) setApiReachable(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Review summaries: one bulk fetch for star ratings on cards ────
  // { [fragranceId]: { avg, count } }. Empty object when the API is
  // down — cards simply render without a rating row.
  const [reviewSummary, setReviewSummary] = useState({});
  useEffect(() => {
    api('/api/reviews/summary')
      .then(d => { if (d?.summaries) setReviewSummary(d.summaries); })
      .catch(() => { /* no ratings shown */ });
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

  // ── Sample modal (primary, samples-first messaging) ──────────────
  const openSampleModal = useCallback((prefill = '') => setSampleModal({ open: true, prefill }), []);
  const closeSampleModal = useCallback(() => setSampleModal({ open: false, prefill: '' }), []);

  // ── Gift modal ────────────────────────────────────────────────────
  const openGiftModal  = useCallback((fragrance) => setGiftModal({ open: true, fragrance }), []);
  const closeGiftModal = useCallback(() => setGiftModal({ open: false, fragrance: null }), []);

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
    // Attribute the signup to an inviter if a ?ref=slug landed at any
    // point in this session, then ask the server to issue a Stripe
    // promo coupon. The promo code is cached in localStorage so the
    // cart auto-applies it at checkout.
    try {
      const refSlug = getStoredRef();
      if (refSlug) {
        const r = await api('/api/referrals/attribute', { method: 'POST', auth: true, body: { code: refSlug } });
        if (r?.ok) {
          clearStoredRef();
          try {
            const coup = await api('/api/referrals/issue-coupon', { method: 'POST', auth: true, body: {} });
            if (coup?.code) {
              setPromoCode(coup.code);
              showToast(`<span>Welcome.</span> ${coup.percentOff || 15}% off applied at checkout.`);
            }
          } catch { /* coupon optional */ }
        }
      }
    } catch { /* attribution failed, swallow */ }
    await refreshWishlist();
    return d.user;
  }, [refreshWishlist, showToast]);

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
        if (!isSaved) { trackEvent('wishlist_add', { fragrance_id: id }); playChime(); }
        showToast(isSaved ? 'Removed from wishlist' : '<span>Saved</span> to wishlist ♡');
      } catch (e) { showToast(e.message); }
    } else {
      const next = isSaved ? wishlistIds.filter(x => x !== id) : [...wishlistIds, id];
      setWishlistIds(next);
      localStorage.setItem('sl_wishlist_local', JSON.stringify(next));
      if (!isSaved) { trackEvent('wishlist_add', { fragrance_id: id, guest: true }); playChime(); }
      showToast(isSaved ? 'Removed from wishlist' : '<span>Saved</span> to wishlist ♡');
    }
  }, [user, wishlistIds, showToast]);

  // ── Wardrobe (owned / sampled / backup) ───────────────────────────
  const refreshWardrobe = useCallback(async () => {
    if (!getToken()) { setWardrobeItems([]); return; }
    try {
      const d = await api('/api/wardrobe', { auth: true });
      setWardrobeItems(d.items || []);
    } catch (e) { console.error('[wardrobe]', e); }
  }, []);

  const setWardrobeStatus = useCallback(async (fragranceId, status, opts = {}) => {
    if (!user) { showToast('Sign in to track your wardrobe'); return; }
    try {
      const d = await api('/api/wardrobe', {
        method: 'POST', auth: true,
        body: { fragranceId, status, sizeMl: opts.sizeMl, notes: opts.notes },
      });
      setWardrobeItems(prev => {
        // Replace existing (fragranceId, status) or append
        const idx = prev.findIndex(i => i.fragranceId === fragranceId && i.status === status);
        if (idx !== -1) { const next = [...prev]; next[idx] = d.item; return next; }
        return [d.item, ...prev];
      });
      trackEvent('wardrobe_add', { fragrance_id: fragranceId, status });
      showToast(`<span>Added</span> to your ${status.toLowerCase()} list`);
    } catch (e) { showToast(e.message); }
  }, [user, showToast]);

  const removeWardrobeStatus = useCallback(async (fragranceId, status) => {
    if (!user) return;
    try {
      await api(`/api/wardrobe/${fragranceId}/${status}`, { method: 'DELETE', auth: true });
      setWardrobeItems(prev => prev.filter(i => !(i.fragranceId === fragranceId && i.status === status)));
    } catch (e) { showToast(e.message); }
  }, [user, showToast]);

  // ── Saved Blends ──────────────────────────────────────────────────
  const refreshBlends = useCallback(async () => {
    if (!getToken()) { setSavedBlends([]); return; }
    try {
      const d = await api('/api/blends', { auth: true });
      setSavedBlends(d.blends || []);
    } catch (e) { console.error('[blends]', e); }
  }, []);

  const saveBlend = useCallback(async ({ name, fragrances, result }) => {
    if (!user) { showToast('Sign in to save your blends'); return null; }
    try {
      const d = await api('/api/blends', {
        method: 'POST', auth: true,
        body: { name, fragrances, result },
      });
      setSavedBlends(prev => [d.blend, ...prev]);
      trackEvent('blend_save', { count: fragrances.length });
      showToast(`<span>Saved</span> "${name}" to My Blends`);
      return d.blend;
    } catch (e) { showToast(e.message); return null; }
  }, [user, showToast]);

  const deleteBlend = useCallback(async (id) => {
    try {
      await api(`/api/blends/${id}`, { method: 'DELETE', auth: true });
      setSavedBlends(prev => prev.filter(b => b.id !== id));
    } catch (e) { showToast(e.message); }
  }, [showToast]);

  const renameBlend = useCallback(async (id, name) => {
    try {
      const d = await api(`/api/blends/${id}`, { method: 'PATCH', auth: true, body: { name } });
      setSavedBlends(prev => prev.map(b => b.id === id ? d.blend : b));
    } catch (e) { showToast(e.message); }
  }, [showToast]);

  // ── AI user context, sent to every AI endpoint ───────────────────
  // Summarizes the user's wardrobe + recent reviews so the model can
  // exclude things they already own and lean into what they loved.
  // Trimmed aggressively so prompts stay small.
  const buildUserContext = useCallback(() => {
    if (!user) return undefined;
    const wardrobe = wardrobeItems.slice(0, 30).map(i => ({
      name:   i.fragrance?.name ?? '',
      brand:  i.fragrance?.brand ?? '',
      status: i.status,
    })).filter(w => w.name && w.brand);
    const reviews = myReviews.slice(0, 20).map(r => ({
      name:   r.fragrance?.name ?? '',
      brand:  r.fragrance?.brand ?? '',
      rating: r.rating,
      text:   r.text ? r.text.slice(0, 200) : undefined,
    })).filter(r => r.name && r.brand);
    if (wardrobe.length === 0 && reviews.length === 0) return undefined;
    return { wardrobe, reviews };
  }, [user, wardrobeItems, myReviews]);

  // ── Reviews (the user's own) ──────────────────────────────────────
  const refreshMyReviews = useCallback(async () => {
    if (!getToken()) { setMyReviews([]); return; }
    try {
      const d = await api('/api/reviews/mine', { auth: true });
      setMyReviews(d.items || []);
    } catch (e) { console.error('[reviews]', e); }
  }, []);

  const submitReview = useCallback(async ({ fragranceId, rating, text, sizeMl }) => {
    if (!user) { showToast('Sign in to leave a review'); return; }
    try {
      const d = await api('/api/reviews', {
        method: 'POST', auth: true,
        body: { fragranceId, rating, text, sizeMl },
      });
      setMyReviews(prev => {
        const idx = prev.findIndex(r => r.fragranceId === fragranceId);
        if (idx !== -1) { const next = [...prev]; next[idx] = d.review; return next; }
        return [d.review, ...prev];
      });
      trackEvent('review_submit', { fragrance_id: fragranceId, rating });
      showToast('<span>Review saved.</span> Thanks for the read.');
    } catch (e) { showToast(e.message); }
  }, [user, showToast]);

  // Load all per-user data once the user is known.
  useEffect(() => {
    if (user) {
      refreshWardrobe();
      refreshBlends();
      refreshMyReviews();
    } else {
      setWardrobeItems([]);
      setSavedBlends([]);
      setMyReviews([]);
    }
  }, [user, refreshWardrobe, refreshBlends, refreshMyReviews]);

  const value = useMemo(() => ({
    user, authLoading, login, signup, logout, saveQuizResult,
    fragrances,
    wishlistIds, toggleWishlist, refreshWishlist,
    showToast,
    sourceModal, openSourceModal, closeSourceModal,
    sampleModal, openSampleModal, closeSampleModal,
    giftModal, openGiftModal, closeGiftModal,
    visitCount,
    themePref, setThemePref, effectiveTheme,
    analyticsConsent, setAnalyticsConsent,
    cartItems, cartCount, cartOpen, addToCart, removeFromCart, updateCartQty, clearCart, openCart, closeCart,
    recentlyViewed, markViewed,
    sets, addSetToCart,
    refreshCatalog, apiReachable,
    wardrobeItems, setWardrobeStatus, removeWardrobeStatus, refreshWardrobe,
    savedBlends, saveBlend, deleteBlend, renameBlend, refreshBlends,
    myReviews, submitReview, refreshMyReviews,
    buildUserContext,
    reviewSummary,
  }), [user, authLoading, login, signup, logout, saveQuizResult, fragrances, wishlistIds, toggleWishlist, refreshWishlist, showToast, sourceModal, openSourceModal, closeSourceModal, sampleModal, openSampleModal, closeSampleModal, visitCount, themePref, setThemePref, effectiveTheme, analyticsConsent, setAnalyticsConsent, cartItems, cartCount, cartOpen, addToCart, removeFromCart, updateCartQty, clearCart, openCart, closeCart, recentlyViewed, markViewed, sets, addSetToCart, wardrobeItems, setWardrobeStatus, removeWardrobeStatus, refreshWardrobe, savedBlends, saveBlend, deleteBlend, renameBlend, refreshBlends, myReviews, submitReview, refreshMyReviews, buildUserContext, refreshCatalog, apiReachable, giftModal, openGiftModal, closeGiftModal, reviewSummary]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
