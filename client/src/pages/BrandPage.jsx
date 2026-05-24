import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useDocumentMeta } from '../lib/seo.js';
import { slugify } from '../lib/slug.js';
import { SchemaJsonLd, buildCollectionSchema, buildBreadcrumbSchema } from '../components/SchemaJsonLd.jsx';

/**
 * /brand/:slug, every fragrance from a single brand. SEO target
 * ("all Le Labo fragrances") and an internal-link target, clicking
 * any brand name on a card or fragrance page lands here. NOT in the
 * main nav.
 */
export function BrandPage() {
  const { slug } = useParams();
  const { fragrances } = useApp();

  // Find the matching brand by slugifying every brand in the catalog
  // and matching against the URL slug. Case-insensitive, diacritic-
  // insensitive, punctuation-tolerant, see lib/slug.js.
  const { brand, items } = useMemo(() => {
    if (!slug) return { brand: null, items: [] };
    const matches = fragrances.filter(f => slugify(f.brand) === slug);
    if (matches.length === 0) return { brand: null, items: [] };
    return { brand: matches[0].brand, items: matches };
  }, [fragrances, slug]);

  useDocumentMeta({
    title: brand ? `${brand}, every fragrance in the catalog` : 'Brand not found',
    description: brand
      ? `Every ${brand} fragrance available for sampling on Scent Layer.`
      : 'Brand not found in the Scent Layer catalog.',
  });

  if (!brand) {
    return (
      <>
        <Nav />
        <div className="note-hero">
          <p className="note-eyebrow">Not found</p>
          <h1 className="note-title">No fragrances yet from this <em>brand.</em></h1>
          <p className="note-blurb">Try a different brand, or <Link to="/shop">browse the full catalog</Link>.</p>
        </div>
        <Footer />
      </>
    );
  }

  // Quick stats, the eyebrow gets number of fragrances and a couple
  // of dominant family / mood signals so the page header carries some
  // information density beyond the title.
  const families = items.reduce((acc, f) => {
    acc[f.family] = (acc[f.family] ?? 0) + 1;
    return acc;
  }, {});
  const topFamilies = Object.entries(families)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  const schemaPayload = {
    '@context': 'https://schema.org/',
    '@graph': [
      buildCollectionSchema({ brand, count: items.length, slug }),
      buildBreadcrumbSchema([
        { name: 'Home',    url: '/' },
        { name: 'Catalog', url: '/shop' },
        { name: 'Brands',  url: '/shop' },
        { name: brand,     url: `/brand/${slug}` },
      ]),
    ],
  };

  return (
    <>
      <Nav />
      <SchemaJsonLd data={schemaPayload} id="sl-jsonld-brand" />

      <nav className="fragrance-crumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/shop">Catalog</Link>
        <span aria-hidden="true">/</span>
        <span>Brands</span>
        <span aria-hidden="true">/</span>
        <span>{brand}</span>
      </nav>

      <section className="note-hero">
        <p className="note-eyebrow">Brand</p>
        <h1 className="note-title"><em>{brand}</em></h1>
        <p className="note-blurb">
          {items.length} {items.length === 1 ? 'fragrance' : 'fragrances'} in the catalog
          {topFamilies.length > 0 ? ` · ${topFamilies.join(' · ')}` : ''}.
        </p>
      </section>

      <section className="note-grid-section">
        <div className="note-grid">
          {items.map(f => <ProductCard key={f.id} fragrance={f} />)}
        </div>
      </section>

      <Footer />
    </>
  );
}
