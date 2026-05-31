import { useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';

/**
 * Wardrobe Stats — a record-collection year-end summary derived from
 * the user's existing wardrobe entries. No new schema; everything
 * comes from wardrobeItems already in context.
 *
 *   - Family distribution (horizontal bars)
 *   - Season coverage gaps ("Light on Spring picks")
 *   - Dominant mood signal ("Confident, mostly")
 *
 * Renders nothing for users with fewer than 3 wardrobe entries; below
 * that, the stats read as noise.
 */

const FAMILIES = ['Fresh', 'Floral', 'Woody', 'Oriental', 'Gourmand'];
const SEASONS  = ['Spring', 'Summer', 'Fall', 'Winter'];

export function WardrobeStats() {
  const { wardrobeItems } = useApp();

  const stats = useMemo(() => {
    const items = wardrobeItems.filter(w => w.fragrance);
    if (items.length < 3) return null;

    // Family breakdown
    const familyCounts = {};
    for (const w of items) {
      const f = w.fragrance.family;
      if (f) familyCounts[f] = (familyCounts[f] || 0) + 1;
    }
    const totalFam = items.length || 1;
    const familyData = FAMILIES.map(name => ({
      name,
      count: familyCounts[name] || 0,
      pct: Math.round(((familyCounts[name] || 0) / totalFam) * 100),
    })).filter(f => f.count > 0).sort((a, b) => b.count - a.count);

    // Season coverage — count distinct items whose season array includes each season
    const seasonCounts = {};
    for (const w of items) {
      for (const s of (w.fragrance.season || [])) {
        seasonCounts[s] = (seasonCounts[s] || 0) + 1;
      }
    }
    const minSeason = SEASONS.reduce((min, s) =>
      (seasonCounts[s] || 0) < (seasonCounts[min] || 0) ? s : min, SEASONS[0]);
    const seasonGap = (seasonCounts[minSeason] || 0) <= 1
      ? `Light on ${minSeason} picks.`
      : null;

    // Dominant mood
    const moodCounts = {};
    for (const w of items) {
      for (const m of (w.fragrance.mood || [])) {
        moodCounts[m] = (moodCounts[m] || 0) + 1;
      }
    }
    const dominantMood = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    return { familyData, seasonGap, dominantMood, total: items.length };
  }, [wardrobeItems]);

  if (!stats) return null;

  return (
    <section className="wardrobe-stats" aria-label="Your wardrobe by the numbers">
      <p className="wardrobe-stats-eyebrow">By the numbers</p>

      <div className="wardrobe-stats-grid">
        <div className="wardrobe-stats-block">
          <p className="wardrobe-stats-label">Distribution</p>
          <ul className="wardrobe-stats-bars">
            {stats.familyData.map(f => (
              <li key={f.name} className="wardrobe-stats-bar">
                <span className="wardrobe-stats-bar-name">{f.name}</span>
                <span className="wardrobe-stats-bar-track">
                  <span className="wardrobe-stats-bar-fill" style={{ width: `${f.pct}%` }} />
                </span>
                <span className="wardrobe-stats-bar-pct">{f.pct}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="wardrobe-stats-block wardrobe-stats-block-stack">
          <div>
            <p className="wardrobe-stats-label">Mood signal</p>
            <p className="wardrobe-stats-big">
              {stats.dominantMood ? `${stats.dominantMood}` : 'Mixed'}
            </p>
            <p className="wardrobe-stats-caption">
              {stats.dominantMood ? `${stats.dominantMood}, mostly.` : 'No single read.'}
            </p>
          </div>
          {stats.seasonGap && (
            <div>
              <p className="wardrobe-stats-label">Gap</p>
              <p className="wardrobe-stats-big">{stats.seasonGap.replace('.', '')}</p>
              <p className="wardrobe-stats-caption">Worth filling in.</p>
            </div>
          )}
          <div>
            <p className="wardrobe-stats-label">Total</p>
            <p className="wardrobe-stats-big">{stats.total}</p>
            <p className="wardrobe-stats-caption">fragrance{stats.total === 1 ? '' : 's'} tracked.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
