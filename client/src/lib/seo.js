import { useEffect } from 'react';

/**
 * Tiny per-page meta-tag manager. We don't ship react-helmet, a 9-line
 * effect handles the whole job for an SPA of this size.
 *
 * Updates on mount: document.title, meta[description], Open Graph and
 * Twitter Card tags. Restores the previous values on unmount so the
 * previous page's metadata doesn't bleed across after navigation.
 */
const DEFAULT_TITLE = 'Scent Layer, Niche & Designer Fragrance Samples';
const DEFAULT_DESC  = 'Sample niche and designer fragrances in 2ml, 5ml, 10ml, and 30ml. Authentic decants from real bottles. Source full bottles at a discount.';
const DEFAULT_IMAGE = '/og.jpg'; // placeholder, replace with real OG asset

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!value) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    // Parse selector like meta[name="x"] or meta[property="x"] and apply
    const m = selector.match(/^meta\[(name|property)="([^"]+)"\]$/);
    if (m) el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function useDocumentMeta({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
} = {}) {
  useEffect(() => {
    const prevTitle = document.title;
    const fullTitle = title ? `${title} · Scent Layer` : DEFAULT_TITLE;
    document.title = fullTitle;

    const canonicalUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:type"]', 'content', type);
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('meta[property="og:site_name"]', 'content', 'Scent Layer');
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', image);

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, image, url, type]);
}
