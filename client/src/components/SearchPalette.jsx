import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command as CommandPrimitive } from 'cmdk';
import { useApp } from '../context/AppContext.jsx';
import { slugify } from '../lib/slug.js';
import { trackEvent } from '../lib/analytics.js';

/**
 * Cmd/Ctrl+K search palette. The single fastest path into the catalog ,
 * type a fragrance, brand, family, or note and hit Enter. Also exposes
 * "Surprise me", which picks one fragrance using the user's taste
 * signals if available, random otherwise.
 *
 * Mounted globally in App.jsx; toggles open via the keyboard shortcut
 * or the small magnifier button in the Nav. No new top-nav menu item.
 */
export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { fragrances, wardrobeItems, myReviews } = useApp();
  const navigate = useNavigate();

  // ── Global Cmd/Ctrl+K to open, Esc to close ───────────────────────
  useEffect(() => {
    function onKey(e) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen(v => !v);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Listen for a global custom event so the Nav button (or anything
  // else) can open the palette without prop-drilling.
  useEffect(() => {
    function onOpen() { setOpen(true); }
    window.addEventListener('sl-open-search', onOpen);
    return () => window.removeEventListener('sl-open-search', onOpen);
  }, []);

  // Lock body scroll while the palette is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Reset query when closed so the next open starts clean.
  useEffect(() => { if (!open) setQuery(''); }, [open]);

  // ── Derived lists ────────────────────────────────────────────────
  // Brands, distinct list from the catalog.
  const brands = useMemo(() => {
    const set = new Set(fragrances.map(f => f.brand));
    return Array.from(set).sort();
  }, [fragrances]);

  // Top 20 most-used notes in the catalog, surface these as shortcuts
  // since they're the most likely to have a useful /notes/:slug page.
  const topNotes = useMemo(() => {
    const counts = new Map();
    for (const f of fragrances) {
      for (const field of [f.top, f.heart, f.base]) {
        for (const n of String(field || '').split(',').map(s => s.trim()).filter(Boolean)) {
          counts.set(n, (counts.get(n) || 0) + 1);
        }
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([n]) => n);
  }, [fragrances]);

  // ── Surprise Me ──────────────────────────────────────────────────
  // For signed-in users with reviews, bias toward the most-LOVED
  // family. For everyone else, pure random across the catalog.
  function surpriseMe() {
    if (fragrances.length === 0) return;
    let pool = fragrances;
    const loved = myReviews.filter(r => r.rating === 'LOVED');
    const ownedIds = new Set(wardrobeItems.map(w => w.fragranceId));
    if (loved.length > 0) {
      const lovedFamilies = new Set(loved.map(r => r.fragrance?.family).filter(Boolean));
      const matching = fragrances.filter(f => lovedFamilies.has(f.family) && !ownedIds.has(f.id));
      if (matching.length > 0) pool = matching;
    } else {
      // Even without reviews, skip anything already owned.
      const filtered = fragrances.filter(f => !ownedIds.has(f.id));
      if (filtered.length > 0) pool = filtered;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    trackEvent('surprise_me_pick', { fragrance_id: pick.id });
    setOpen(false);
    navigate(`/fragrance/${pick.id}`);
  }

  // ── Render ───────────────────────────────────────────────────────
  if (!open) return null;

  // cmdk does its own matching off the `value` prop on each Item. We
  // pass a richly-tagged value so a query for "saffron" matches the
  // fragrance's note string, a query for "le labo" matches by brand,
  // etc. No need for our own filter function.
  return (
    <div className="search-palette-overlay" onClick={() => setOpen(false)}>
      <div
        className="search-palette"
        role="dialog"
        aria-label="Search"
        onClick={(e) => e.stopPropagation()}
      >
        <CommandPrimitive className="search-palette-cmd" label="Search">
          <div className="search-palette-input-row">
            <span className="search-palette-icon" aria-hidden="true">⌕</span>
            <CommandPrimitive.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search a fragrance, brand, family, or note…"
              className="search-palette-input"
            />
            <span className="search-palette-shortcut" aria-hidden="true">ESC</span>
          </div>

          <CommandPrimitive.List className="search-palette-list">
            <CommandPrimitive.Empty className="search-palette-empty">
              No matches. Try a brand or a single note like "saffron".
            </CommandPrimitive.Empty>

            <CommandPrimitive.Group heading="Fragrances" className="search-palette-group">
              {fragrances.slice(0, 80).map(f => {
                const value = [f.name, f.brand, f.family, f.top, f.heart, f.base].join(' ');
                return (
                  <CommandPrimitive.Item
                    key={`f-${f.id}`}
                    value={value}
                    onSelect={() => { setOpen(false); navigate(`/fragrance/${f.id}`); }}
                    className="search-palette-item"
                  >
                    <span className="search-palette-item-name">{f.name}</span>
                    <span className="search-palette-item-meta">{f.brand} · {f.family}</span>
                  </CommandPrimitive.Item>
                );
              })}
            </CommandPrimitive.Group>

            <CommandPrimitive.Group heading="Brands" className="search-palette-group">
              {brands.map(b => (
                <CommandPrimitive.Item
                  key={`b-${b}`}
                  value={`brand ${b}`}
                  onSelect={() => { setOpen(false); navigate(`/brand/${slugify(b)}`); }}
                  className="search-palette-item"
                >
                  <span className="search-palette-item-name">{b}</span>
                  <span className="search-palette-item-meta">Brand</span>
                </CommandPrimitive.Item>
              ))}
            </CommandPrimitive.Group>

            <CommandPrimitive.Group heading="Notes" className="search-palette-group">
              {topNotes.map(n => (
                <CommandPrimitive.Item
                  key={`n-${n}`}
                  value={`note ${n}`}
                  onSelect={() => { setOpen(false); navigate(`/notes/${slugify(n)}`); }}
                  className="search-palette-item"
                >
                  <span className="search-palette-item-name">{n}</span>
                  <span className="search-palette-item-meta">Note</span>
                </CommandPrimitive.Item>
              ))}
            </CommandPrimitive.Group>
          </CommandPrimitive.List>

          <div className="search-palette-footer">
            <button type="button" className="search-palette-surprise" onClick={surpriseMe}>
              ✦ Surprise me
            </button>
            <span className="search-palette-hint">↵ to open · ↑↓ to move</span>
          </div>
        </CommandPrimitive>
      </div>
    </div>
  );
}
