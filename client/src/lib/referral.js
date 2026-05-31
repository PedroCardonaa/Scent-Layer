// Referral attribution helpers. The flow:
//
//   1. User arrives with /?ref=slug, captureRefFromUrl() stashes the
//      slug in localStorage and strips the query so the URL stays
//      clean.
//   2. On signup, the AppContext signup() flow reads the slug back
//      via getStoredRef() and POSTs it to /api/referrals/attribute.
//   3. After attribution, the server can issue a Stripe Coupon via
//      /api/referrals/issue-coupon, which we cache as the promo code
//      the cart auto-applies at checkout.
//
// All localStorage operations are guarded so private-mode browsers
// just don't get attribution; nothing throws.

const REF_KEY   = 'sl_ref_slug';
const PROMO_KEY = 'sl_promo_code';

export function captureRefFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('ref');
  if (!slug) return null;
  try { localStorage.setItem(REF_KEY, slug); } catch { /* noop */ }
  // Strip ?ref= from the URL bar without losing the rest.
  params.delete('ref');
  const next = window.location.pathname + (params.toString() ? `?${params}` : '') + window.location.hash;
  window.history.replaceState({}, '', next);
  return slug;
}

export function getStoredRef() {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(REF_KEY); } catch { return null; }
}
export function clearStoredRef() {
  try { localStorage.removeItem(REF_KEY); } catch { /* noop */ }
}

export function setPromoCode(code) {
  try { localStorage.setItem(PROMO_KEY, code); } catch { /* noop */ }
}
export function getPromoCode() {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(PROMO_KEY); } catch { return null; }
}
export function clearPromoCode() {
  try { localStorage.removeItem(PROMO_KEY); } catch { /* noop */ }
}
