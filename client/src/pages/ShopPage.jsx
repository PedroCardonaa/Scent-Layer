import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

const SIZES = [
  { ml: 5,   sprays: 85   },
  { ml: 10,  sprays: 175  },
  { ml: 30,  sprays: 510  },
  { ml: 50,  sprays: 850  },
  { ml: 100, sprays: 1700 },
];

const LIFESTYLE = [
  { maxDays: 7,    duration: '1 week',   context: 'Your weekend getaway bottle.',       tip: 'Perfect for a short trip — toss it in your carry-on and travel light.' },
  { maxDays: 14,   duration: '2 weeks',  context: 'Your vacation companion.',           tip: 'Great for a two-week holiday. Use it freely without worrying about running out.' },
  { maxDays: 30,   duration: '1 month',  context: 'Your monthly rotation pick.',        tip: 'Solid for a month of daily wear. Ideal if you rotate between a few bottles.' },
  { maxDays: 60,   duration: '2 months', context: 'Your seasonal signature.',           tip: 'Lasts a full season. A smart buy if this is your go-to scent for the next few months.' },
  { maxDays: 90,   duration: '3 months', context: 'Your quarter-year daily driver.',    tip: 'Three months of wear — this is the sweet spot for a scent you love but don\'t overdo.' },
  { maxDays: 180,  duration: '6 months', context: 'Your long-haul signature scent.',    tip: 'Half a year of daily use. Best value when you\'ve found your true signature.' },
  { maxDays: 365,  duration: '~1 year',  context: 'Your year-round staple.',            tip: 'A full year of wear. This is your forever bottle — the one you reach for every single day.' },
  { maxDays: 9999, duration: '1+ years', context: 'Your investment bottle.',            tip: 'At this rate it lasts over a year. Perfect if you prefer a light, subtle application.' },
];

const FAMILY_OPTS = ['Fresh','Floral','Woody','Oriental','Gourmand'];
const SEASON_OPTS = ['Spring','Summer','Fall','Winter'];
const TIME_OPTS   = ['Morning','Daytime','Evening','Night'];
const MOOD_OPTS   = ['Romantic','Confident','Relaxed','Bold','Minimal'];

export function ShopPage() {
  const { fragrances } = useApp();
  const [params] = useSearchParams();

  // Spray calc state
  const [bottleSprays, setBottleSprays] = useState(510);
  const [perDay, setPerDay] = useState(4);

  // Finder state
  const [filters, setFilters] = useState(() => ({
    family: params.get('filter') && FAMILY_OPTS.includes(params.get('filter')) ? [params.get('filter')] : [],
    season: [],
    time: [],
    mood: [],
  }));
  const [search, setSearch] = useState('');

  useEffect(() => { document.body.classList.add('dark'); return () => document.body.classList.remove('dark'); }, []);

  const days = Math.floor(bottleSprays / Math.max(1, perDay));
  const lifestyle = LIFESTYLE.find(l => days <= l.maxDays) ?? LIFESTYLE[LIFESTYLE.length - 1];

  const filteredFragrances = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fragrances.filter(p => {
      if (filters.family.length && !filters.family.includes(p.family)) return false;
      if (filters.season.length && !filters.season.some(s => p.season.includes(s))) return false;
      if (filters.time.length   && !filters.time.some(t => p.time.includes(t)))     return false;
      if (filters.mood.length   && !filters.mood.some(m => p.mood.includes(m)))     return false;
      if (q) {
        const hay = [p.name, p.brand, p.top, p.heart, p.base, p.family, ...p.mood, ...p.season].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [fragrances, filters, search]);

  useScrollReveal('.shop-product-grid .product-card', [filteredFragrances.length]);

  function toggle(group, val) {
    setFilters(prev => {
      const arr = prev[group];
      return { ...prev, [group]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }
  function clearAll() {
    setFilters({ family: [], season: [], time: [], mood: [] });
    setSearch('');
  }

  const activeChips = Object.entries(filters).flatMap(([group, vals]) => vals.map(v => ({ group, v })));

  return (
    <>
      <Nav theme="dark" />

      <div className="shop-hero">
        <p className="shop-hero-label">The Collection</p>
        <h1 className="shop-hero-title">Niche &amp; designer<br/><em>fragrances. Sampled.</em></h1>
        <p className="shop-hero-sub">Order any fragrance as a 2ml, 5ml, 10ml, or 30ml sample. Authentic decants. Sourcing the full bottle is optional — sampling first is encouraged.</p>
      </div>

      <section className="calc-section" id="calc">
        <div className="calc-header">
          <div>
            <h2 className="calc-title">How long will<br/><em>this sample last?</em></h2>
            <p className="calc-sub">Pick a size and your daily sprays — we'll tell you exactly what to expect. Most signature picks start at 5ml or 10ml.</p>
          </div>
        </div>
        <div className="calc-body">
          <div className="calc-controls">
            <div className="calc-row">
              <span className="calc-row-label">Bottle Size</span>
              <div className="size-pills">
                {SIZES.map(s => (
                  <button
                    key={s.ml}
                    type="button"
                    className={`size-pill ${bottleSprays === s.sprays ? 'active' : ''}`}
                    onClick={() => setBottleSprays(s.sprays)}
                  >
                    <span className="ml">{s.ml}ml</span>
                    <span className="approx">~{s.sprays} sprays</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="calc-row">
              <span className="calc-row-label">Sprays Per Day</span>
              <div className="spray-slider-wrap">
                <input type="range" className="spray-slider" min="1" max="10" value={perDay} onChange={(e) => setPerDay(Number(e.target.value))} />
                <div>
                  <div className="spray-val">{perDay}</div>
                  <div className="spray-val-label">sprays/day</div>
                </div>
              </div>
            </div>
          </div>
          <div className="calc-result-panel">
            <div className="calc-duration">{lifestyle.duration}</div>
            <div className="calc-context">{lifestyle.context}</div>
            <div className="calc-breakdown">
              <div className="calc-stat"><div className="calc-stat-val">{bottleSprays.toLocaleString()}</div><div className="calc-stat-label">Total Sprays</div></div>
              <div className="calc-stat"><div className="calc-stat-val">{days.toLocaleString()}</div><div className="calc-stat-label">Days</div></div>
              <div className="calc-stat"><div className="calc-stat-val">{perDay}</div><div className="calc-stat-label">Per Day</div></div>
            </div>
            <div className="calc-lifestyle">{lifestyle.tip}</div>
          </div>
        </div>
      </section>

      <div className="finder-strip" id="finder">
        <p className="finder-strip-title">⌕ Scent Finder — Filter by feel, not name</p>
        <div className="finder-filters">
          <FilterGroup label="Notes Family" options={FAMILY_OPTS} selected={filters.family} onToggle={(v) => toggle('family', v)} />
          <FilterGroup label="Season"       options={SEASON_OPTS} selected={filters.season} onToggle={(v) => toggle('season', v)} />
          <FilterGroup label="Time of Day"  options={TIME_OPTS}   selected={filters.time}   onToggle={(v) => toggle('time', v)} />
          <FilterGroup label="Mood"         options={MOOD_OPTS}   selected={filters.mood}   onToggle={(v) => toggle('mood', v)} />
        </div>
        <div className="finder-search-row">
          <input className="finder-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, brand, or note…" />
          <button type="button" className="finder-clear" onClick={clearAll}>Clear All</button>
        </div>
        <div className="active-filters">
          {activeChips.map(({ group, v }) => (
            <div key={`${group}-${v}`} className="active-chip">{v}<button type="button" onClick={() => toggle(group, v)}>✕</button></div>
          ))}
        </div>
        <p className="result-count">{filteredFragrances.length} fragrance{filteredFragrances.length !== 1 ? 's' : ''} found</p>
      </div>

      <div className="shop-grid-section">
        <div className="shop-product-grid">
          {filteredFragrances.length === 0
            ? <div className="no-results">No fragrances match — try broadening your filters.</div>
            : filteredFragrances.map(p => <ProductCard key={p.id} fragrance={p} />)}
        </div>
      </div>

      <Footer />
    </>
  );
}

function FilterGroup({ label, options, selected, onToggle }) {
  return (
    <div>
      <p className="finder-group-label">{label}</p>
      <div className="chips">
        {options.map(o => (
          <div key={o} className={`chip ${selected.includes(o) ? 'active' : ''}`} onClick={() => onToggle(o)}>{o}</div>
        ))}
      </div>
    </div>
  );
}
