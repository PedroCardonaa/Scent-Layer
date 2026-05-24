import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useDocumentMeta } from '../lib/seo.js';
import { NOTE_CATALOG } from '../lib/notes-catalog.js';
import { slugify, unslugify, parseNotes } from '../lib/slug.js';
import { SchemaJsonLd, buildArticleSchema, buildBreadcrumbSchema } from '../components/SchemaJsonLd.jsx';

/**
 * /notes/:slug — single-note landing page. Doubles as an SEO surface
 * ("best fragrances with oud", "what is saffron in perfumery") and an
 * editorial entry point that users hit by clicking a note tag on any
 * fragrance page. NOT exposed in the main nav — discovered via links.
 */
export function NotePage() {
  const { slug } = useParams();
  const { fragrances } = useApp();

  const entry = NOTE_CATALOG[slug];
  const displayName = entry?.name ?? unslugify(slug);
  const eyebrow = entry?.eyebrow ?? 'Note';
  const blurb = entry?.blurb ?? null;
  const pairs = entry?.pairs ?? [];

  // Match fragrances that contain this note anywhere in top/heart/base.
  // Case-insensitive substring of the slugified candidate note.
  const matches = useMemo(() => {
    if (!slug) return [];
    return fragrances.filter(f => {
      const all = [...parseNotes(f.top), ...parseNotes(f.heart), ...parseNotes(f.base)];
      return all.some(n => slugify(n) === slug);
    });
  }, [fragrances, slug]);

  useDocumentMeta({
    title: `${displayName} — fragrances with ${displayName.toLowerCase()}`,
    description: blurb
      ? blurb.slice(0, 160)
      : `Every fragrance in the Scent Layer catalog featuring ${displayName.toLowerCase()}.`,
  });

  const schemaPayload = {
    '@context': 'https://schema.org/',
    '@graph': [
      buildArticleSchema({ noteName: displayName, blurb, slug }),
      buildBreadcrumbSchema([
        { name: 'Home',         url: '/' },
        { name: 'Catalog',      url: '/shop' },
        { name: 'Notes',        url: '/shop' },
        { name: displayName,    url: `/notes/${slug}` },
      ]),
    ],
  };

  return (
    <>
      <Nav />
      <SchemaJsonLd data={schemaPayload} id="sl-jsonld-note" />

      <nav className="fragrance-crumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/shop">Catalog</Link>
        <span aria-hidden="true">/</span>
        <span>Notes</span>
        <span aria-hidden="true">/</span>
        <span>{displayName}</span>
      </nav>

      <section className="note-hero">
        <p className="note-eyebrow">{eyebrow}</p>
        <h1 className="note-title"><em>{displayName}</em></h1>
        {blurb && <p className="note-blurb drop-cap">{blurb}</p>}
        {pairs.length > 0 && (
          <p className="note-pairs">
            <span className="note-pairs-label">Pairs with</span>
            {pairs.map((p, i) => (
              <Link key={p} to={`/notes/${slugify(p)}`} className="note-pair-link">
                {p}{i < pairs.length - 1 ? ' · ' : ''}
              </Link>
            ))}
          </p>
        )}
      </section>

      <section className="note-grid-section">
        {matches.length === 0 ? (
          <div className="note-empty">
            <p className="note-empty-eyebrow">No matches yet</p>
            <h2 className="note-empty-title">Nothing in the catalog uses <em>{displayName}</em> — yet.</h2>
            <p className="note-empty-body">Try a different note, or <Link to="/shop">browse the full catalog</Link>.</p>
          </div>
        ) : (
          <>
            <p className="note-grid-label">
              {matches.length} {matches.length === 1 ? 'fragrance' : 'fragrances'} with {displayName.toLowerCase()}
            </p>
            <div className="note-grid">
              {matches.map(f => <ProductCard key={f.id} fragrance={f} />)}
            </div>
          </>
        )}
      </section>

      <Footer />
    </>
  );
}
