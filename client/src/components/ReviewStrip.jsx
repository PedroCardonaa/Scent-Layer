import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const LABELS = {
  LOVED:    'Loved',
  LIKED:    'Liked',
  CONFLICT: 'Skin conflict',
  HATED:    'Not for me',
};

/**
 * Verified-wearer review summary for a single fragrance. Public — no
 * auth needed. Shows a rating breakdown + the most recent text snippet.
 * Hidden entirely when there are no reviews so a brand-new catalog
 * doesn't read as "0 people liked this" by default.
 */
export function ReviewStrip({ fragranceId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api(`/api/reviews/by-fragrance/${fragranceId}`)
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { /* silent — show nothing if API down */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fragranceId]);

  if (loading) return null;
  if (!data || data.total === 0) return null;

  return (
    <section className="fragrance-pyramid" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div className="review-strip">
        <div className="review-strip-stat">
          <span className="review-strip-pct">{data.positivePct ?? 0}%</span>
          <span className="review-strip-label">loved or liked it</span>
        </div>
        <div className="review-strip-counts">
          {Object.entries(LABELS).map(([k, label]) => (
            <span key={k} className="review-strip-bucket">
              <span className="review-strip-bucket-n">{data.breakdown[k] ?? 0}</span>
              <span className="review-strip-bucket-l">{label}</span>
            </span>
          ))}
        </div>
        <div className="review-strip-label">{data.total} verified wearer{data.total === 1 ? '' : 's'}</div>
      </div>
      {data.recent && data.recent[0]?.text && (
        <p className="review-snippet">{data.recent[0].text}</p>
      )}
    </section>
  );
}
