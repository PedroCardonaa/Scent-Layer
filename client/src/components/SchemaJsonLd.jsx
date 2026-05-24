import { useEffect } from 'react';

/**
 * Injects a <script type="application/ld+json"> tag into <head> with
 * structured data for the current page. Removes the tag on unmount so
 * SPA route changes don't leak stale schema between pages.
 *
 * Pass the data object (a plain JSON-LD payload). The component handles
 * stringification and tag lifecycle.
 *
 * Used by FragrancePage (Product), NotePage (Article), BrandPage
 * (CollectionPage). Powers rich-snippet eligibility in Google.
 */
export function SchemaJsonLd({ data, id = 'sl-jsonld' }) {
  useEffect(() => {
    if (!data) return;
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
    return () => { script?.remove(); };
  }, [data, id]);
  return null;
}

// ── Helpers — return ready-to-render data objects ──────────────────

const SITE_ORIGIN = typeof window !== 'undefined' && window.location?.origin
  ? window.location.origin
  : 'https://scentlayer.example';

/** Product schema for an individual fragrance. */
export function buildProductSchema({ fragrance, imageUrl }) {
  if (!fragrance) return null;
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: `${fragrance.name} — ${fragrance.brand}`,
    image: imageUrl,
    description: fragrance.description ?? `${fragrance.name} by ${fragrance.brand}. ${fragrance.family} fragrance with ${fragrance.top}.`,
    brand: { '@type': 'Brand', name: fragrance.brand },
    category: `Fragrance / ${fragrance.family}`,
    sku: `SL-${fragrance.id}`,
    offers: {
      '@type': 'Offer',
      url: `${SITE_ORIGIN}/fragrance/${fragrance.id}`,
      priceCurrency: 'USD',
      // Sample-from price — the lowest size in the cart.
      price: '12.00',
      availability: 'https://schema.org/InStock',
    },
  };
}

/** Article schema for a /notes/:slug page. */
export function buildArticleSchema({ noteName, blurb, slug }) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Article',
    headline: `${noteName} — fragrances featuring ${noteName.toLowerCase()}`,
    description: blurb ?? `Every fragrance in the Scent Layer catalog with ${noteName.toLowerCase()}.`,
    author: { '@type': 'Organization', name: 'Scent Layer Editorial' },
    publisher: { '@type': 'Organization', name: 'Scent Layer' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_ORIGIN}/notes/${slug}` },
  };
}

/** CollectionPage schema for a /brand/:slug page. */
export function buildCollectionSchema({ brand, count, slug }) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'CollectionPage',
    name: `${brand} — every fragrance in the catalog`,
    description: `${count} ${brand} fragrances available for sampling on Scent Layer.`,
    url: `${SITE_ORIGIN}/brand/${slug}`,
  };
}

/**
 * BreadcrumbList schema. Pass an array of {name, url} pairs in order.
 * Use SITE_ORIGIN-relative URLs are accepted — they'll get prefixed.
 */
export function buildBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${SITE_ORIGIN}${it.url}`,
    })),
  };
}
