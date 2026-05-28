import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { getFragranceImage } from '../lib/fragrance-images.js';

/**
 * Today's Edit, one editorial pick rotating per day. Deterministic
 * (hash of today's date, catalog index) so every visitor sees the same
 * pick on the same day. Picks rotate every 24h without any content
 * management work.
 *
 * The editorial blurb is generated from a small per-day prefix list so
 * the copy reads like a real editor's pick rather than auto-templated.
 * Renders between the hero and the personalization rows on /.
 */

// Per-weekday opener so the pick frames itself in context. Short. The
// catalog description does the heavy work.
const WEEKDAY_OPENERS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// Per-family one-line "vibe lead" so the same catalog blurb reads
// fresh in the editorial context.
const FAMILY_LEADS = {
  Fresh:    'For the cleaner side of today.',
  Floral:   'For the floral mood.',
  Woody:    'A grounded read for today.',
  Oriental: 'For something with weight.',
  Gourmand: 'On the warmer end today.',
};

// Tiny string hash so the rotation is stable. Returns positive int.
function hashDateString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function TodaysEdit() {
  const { fragrances, openSampleModal } = useApp();

  const pick = useMemo(() => {
    if (!fragrances.length) return null;
    const today = new Date();
    const isoDay = today.toISOString().slice(0, 10);  // YYYY-MM-DD
    const idx = hashDateString(isoDay) % fragrances.length;
    const f = fragrances[idx];
    const opener = WEEKDAY_OPENERS[today.getDay()];
    const lead   = FAMILY_LEADS[f.family] ?? 'Today\'s pick.';
    return { fragrance: f, opener, lead };
  }, [fragrances]);

  if (!pick) return null;
  const { fragrance: f, opener, lead } = pick;

  return (
    <section className="todays-edit" aria-label="Today's Edit">
      <div className="todays-edit-inner">
        <div className="todays-edit-image">
          <img
            src={getFragranceImage(f)}
            alt={`${f.name} by ${f.brand}`}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="todays-edit-body">
          <p className="todays-edit-eyebrow">Today's Edit, {opener}</p>
          <h2 className="todays-edit-title">
            Wear: <em>{f.name}.</em>
          </h2>
          <p className="todays-edit-brand">{f.brand}, {f.family}</p>
          <p className="todays-edit-lead">{lead}</p>
          {f.description && <p className="todays-edit-desc">{f.description}</p>}
          <div className="todays-edit-actions">
            <Link to={`/fragrance/${f.id}`} className="todays-edit-link">
              Read full review →
            </Link>
            <button
              type="button"
              className="btn-gold"
              onClick={() => openSampleModal(`${f.name}, ${f.brand}`)}
            >
              Order Sample
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
