/**
 * Google Analytics 4 integration.
 *
 * Loads gtag.js lazily — only after the user has explicitly granted analytics
 * consent via the cookie banner. Without consent the GA script never loads
 * and no cookies are written, which keeps us GDPR / CCPA friendly by default.
 *
 * Usage from app code:
 *   import { initGA, trackPageView } from './lib/analytics.js';
 *   initGA();                       // safe to call multiple times; no-ops if already loaded
 *   trackPageView('/shop');         // logs a page_view event
 *
 * Config:
 *   client/.env(.local): VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 *   If absent, every function in this module is a no-op — useful for local dev.
 */

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
let loaded = false;

/**
 * Inject the gtag.js script + configure GA. Idempotent.
 * Only call after the user has granted analytics consent.
 */
export function initGA() {
  if (loaded) return;
  if (!MEASUREMENT_ID) {
    if (import.meta.env.DEV) console.info('[analytics] VITE_GA_MEASUREMENT_ID not set — GA disabled');
    return;
  }
  loaded = true;

  // 1. Load the gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // 2. Init dataLayer + gtag stub
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());

  // 3. Configure with anonymized IP + manual page_view (we send these ourselves
  //    on route change instead of relying on the auto-page_view since we're an
  //    SPA where URL changes don't reload the page).
  window.gtag('config', MEASUREMENT_ID, {
    anonymize_ip: true,
    send_page_view: false,
  });
}

/**
 * Fire a page_view event. Safe to call even before initGA — it just no-ops
 * if gtag isn't loaded yet.
 */
export function trackPageView(path, title) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
  });
}

/**
 * Fire a custom event. Use sparingly — sample order submits, layer analysis
 * completions, that kind of thing.
 */
export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', name, params);
}
