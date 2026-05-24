// Generates client/public/sitemap.xml from the catalog before vite
// builds. Hooked into the build script via `prebuild`. Read the
// fallback catalog so we never miss an entry — the server catalog
// only contains seeded fragrances, this list is the source of truth
// for what the frontend will render.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { FALLBACK_CATALOG } from '../src/lib/fallback-catalog.js';
import { NOTE_CATALOG } from '../src/lib/notes-catalog.js';
import { slugify } from '../src/lib/slug.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORIGIN = process.env.VITE_SITE_ORIGIN || 'https://scentlayer.example';
const today  = new Date().toISOString().split('T')[0];

const urls = [];

function addUrl(loc, priority = '0.5', changefreq = 'weekly') {
  urls.push({ loc: `${ORIGIN}${loc}`, lastmod: today, priority, changefreq });
}

// Core routes — the surfaces every visitor lands on.
addUrl('/',         '1.0',  'daily');
addUrl('/shop',     '0.9',  'daily');
addUrl('/tools',    '0.7',  'weekly');
addUrl('/explore',  '0.6',  'weekly');
addUrl('/about',    '0.6',  'monthly');
addUrl('/story',    '0.5',  'monthly');
addUrl('/privacy',  '0.3',  'yearly');
addUrl('/terms',    '0.3',  'yearly');

// Every fragrance detail page.
for (const f of FALLBACK_CATALOG) {
  addUrl(`/fragrance/${f.id}`, '0.8', 'weekly');
}

// Every note landing page (top 20 most-used + every editorial note).
const noteSet = new Set(Object.keys(NOTE_CATALOG));
for (const f of FALLBACK_CATALOG) {
  for (const field of [f.top, f.heart, f.base]) {
    for (const n of String(field || '').split(',').map(s => s.trim()).filter(Boolean)) {
      const slug = slugify(n);
      if (slug) noteSet.add(slug);
    }
  }
}
for (const slug of noteSet) {
  addUrl(`/notes/${slug}`, '0.6', 'monthly');
}

// Every brand landing page.
const brandSet = new Set(FALLBACK_CATALOG.map(f => slugify(f.brand)));
for (const slug of brandSet) {
  addUrl(`/brand/${slug}`, '0.6', 'monthly');
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

const outPath = resolve(__dirname, '..', 'public', 'sitemap.xml');
writeFileSync(outPath, xml, 'utf8');
console.log(`[sitemap] Wrote ${urls.length} URLs to ${outPath}`);
