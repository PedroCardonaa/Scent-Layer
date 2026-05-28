import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';
import { useThinkingStages } from '../hooks/useThinkingStages.js';
import { StreamText } from './StreamText.jsx';

/**
 * Wardrobe Insight, an editorial reading of the user's collection,
 * plus one "contrast pick" they don't already own. Renders at the top
 * of the My Wardrobe profile tab. Cached client-side in sessionStorage
 * keyed off a content hash of the wardrobe + reviews, so we don't
 * re-charge for unchanged collections within the same session.
 */

// Tiny string hash so the cache key is short.
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}

export function WardrobeInsight() {
  const { user, wardrobeItems, myReviews, fragrances, openSampleModal } = useApp();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stage = useThinkingStages(loading, [
    'Reading your collection',
    'Looking for patterns',
    'Picking a contrast',
    'Drafting your reading',
  ]);

  // Build a stable content key, includes status + rating so adding a
  // sample or rating something invalidates the cache. Stays in
  // sessionStorage to survive tab navigation within the session.
  const contentKey = useMemo(() => {
    if (!user || wardrobeItems.length === 0) return null;
    const wardrobeSig = wardrobeItems
      .map(w => `${w.fragranceId}:${w.status}`)
      .sort()
      .join('|');
    const reviewSig = myReviews
      .map(r => `${r.fragranceId}:${r.rating}`)
      .sort()
      .join('|');
    return `sl-wi-${hash(`${wardrobeSig}#${reviewSig}`)}`;
  }, [user, wardrobeItems, myReviews]);

  useEffect(() => {
    if (!contentKey) { setResult(null); return; }

    // Hit the session cache first.
    try {
      const cached = sessionStorage.getItem(contentKey);
      if (cached) {
        setResult(JSON.parse(cached));
        return;
      }
    } catch { /* private mode */ }

    // No cache, fetch fresh.
    setLoading(true);
    setError(null);
    const payload = {
      wardrobe: wardrobeItems.slice(0, 30).map(w => ({
        name:  w.fragrance?.name  ?? '',
        brand: w.fragrance?.brand ?? '',
        status: w.status,
      })).filter(w => w.name && w.brand),
      reviews: myReviews.slice(0, 20).map(r => ({
        name:  r.fragrance?.name  ?? '',
        brand: r.fragrance?.brand ?? '',
        rating: r.rating,
      })).filter(r => r.name && r.brand),
      catalog: fragrances.map(f => ({
        id: f.id, name: f.name, brand: f.brand, family: f.family,
      })),
    };

    api('/api/ai/wardrobe-insight', { method: 'POST', body: payload, auth: true })
      .then(r => {
        setResult(r);
        try { sessionStorage.setItem(contentKey, JSON.stringify(r)); } catch { /* noop */ }
      })
      .catch(e => setError(e.message || 'Could not read your wardrobe'))
      .finally(() => setLoading(false));
  }, [contentKey, wardrobeItems, myReviews, fragrances]);

  if (!user || wardrobeItems.length === 0) return null;
  if (error) return null; // fail silently; the wardrobe still renders

  return (
    <div className="wardrobe-insight">
      <p className="wardrobe-insight-eyebrow">Your collection, read</p>

      {loading && !result && (
        <p className="wardrobe-insight-loading">{stage || 'Reading'}…</p>
      )}

      {result && (
        <>
          <StreamText as="p" className="wardrobe-insight-text" text={result.reading} />
          {result.contrast && (
            <div className="wardrobe-insight-contrast">
              <p className="wardrobe-insight-contrast-label">A contrast pick worth sampling</p>
              <div className="wardrobe-insight-contrast-card">
                <div>
                  <Link to={`/fragrance/${result.contrast.id}`} className="wardrobe-insight-contrast-name">
                    {result.contrast.name}
                  </Link>
                  <p className="wardrobe-insight-contrast-brand">{result.contrast.brand}</p>
                  <p className="wardrobe-insight-contrast-why">{result.contrast.why}</p>
                </div>
                <button
                  type="button"
                  className="sample-btn"
                  onClick={() => openSampleModal(`${result.contrast.name}, ${result.contrast.brand}`)}
                >
                  Order Sample
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
