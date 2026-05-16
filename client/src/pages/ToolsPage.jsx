import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '../components/ui/Command.jsx';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';

const SLOT_COLORS = ['#7a5c40', '#4a6855', '#9a7030', '#503868'];

export function ToolsPage() {
  const { fragrances } = useApp();
  const { hash } = useLocation();
  const [tab, setTab] = useState(() => {
    if (hash === '#compare') return 'compare';
    if (hash === '#similar') return 'similar';
    return 'builder';
  });

  // Theme is now centralized in AppContext — page no longer touches body.dark.

  return (
    <>
      <Nav>
        <div className="tools-nav">
          <button type="button" className={`tool-tab ${tab === 'builder' ? 'active' : ''}`} onClick={() => setTab('builder')}>Layer Builder</button>
          <button type="button" className={`tool-tab ${tab === 'compare' ? 'active' : ''}`} onClick={() => setTab('compare')}>Compare</button>
          <button type="button" className={`tool-tab ${tab === 'similar' ? 'active' : ''}`} onClick={() => setTab('similar')}>Similar Scents</button>
        </div>
      </Nav>

      {tab === 'builder' && <LayerBuilder fragrances={fragrances} />}
      {tab === 'compare' && <Compare    fragrances={fragrances} />}
      {tab === 'similar' && <Similar />}
    </>
  );
}

// ─── LAYER BUILDER ─────────────────────────────────────────────────────
function LayerBuilder({ fragrances }) {
  const { openSampleModal } = useApp();
  const [slots, setSlots] = useState([{ id: 1, scent: null, query: '' }, { id: 2, scent: null, query: '' }]);
  const [nextId, setNextId] = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filledCount = slots.filter(s => s.scent).length;
  const canAdd = slots.length < 4;
  const canAnalyze = filledCount >= 2 && !loading;

  function addSlot() {
    if (slots.length >= 4) return;
    setSlots(s => [...s, { id: nextId, scent: null, query: '' }]);
    setNextId(n => n + 1);
  }
  function removeSlot(id) {
    setSlots(s => s.filter(x => x.id !== id));
    setResult(null);
  }
  function selectScent(id, scent) {
    setSlots(s => s.map(x => x.id === id ? { ...x, scent, query: '' } : x));
    setResult(null);
  }
  function updateQuery(id, query) {
    setSlots(s => s.map(x => x.id === id ? { ...x, query } : x));
  }

  async function analyze() {
    setLoading(true); setResult(null); setError(null);
    try {
      const payload = slots.filter(s => s.scent).map(s => ({
        name: s.scent.name, brand: s.scent.brand, family: s.scent.family,
        top: s.scent.top, heart: s.scent.heart, base: s.scent.base,
      }));
      const r = await api('/api/ai/layer', { method: 'POST', body: { fragrances: payload } });
      setResult(r);
    } catch (e) {
      setError(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="tool-hero">
        <p className="tool-hero-label">Layer Builder</p>
        <h1 className="tool-hero-title">Compose your<br/><em>signature blend.</em></h1>
        <p className="tool-hero-sub">Add 2–4 fragrances to see how their notes interact. Get an AI-powered analysis of the harmony, character, and perfect occasions for your combination.</p>
      </div>
      <div className="builder-layout">
        <div className="builder-panel">
          <p className="panel-label">Your Fragrances</p>
          <h2 className="panel-title">Build your layer</h2>
          {slots.map((slot, i) => (
            <SlotInput
              key={slot.id}
              slot={slot}
              index={i}
              fragrances={fragrances}
              onSelect={(s) => selectScent(slot.id, s)}
              onRemove={() => removeSlot(slot.id)}
              onQuery={(q) => updateQuery(slot.id, q)}
            />
          ))}
          {canAdd && <button type="button" className="add-slot-btn" onClick={addSlot}>+ Add Another Fragrance</button>}
          <button type="button" className="analyze-btn" onClick={analyze} disabled={!canAnalyze}>
            {loading ? 'Analyzing…' : 'Analyze My Blend'}
          </button>
        </div>
        <div className="builder-panel">
          {!result && !loading && !error && (
            <div className="result-empty">
              <div className="result-empty-icon">◈</div>
              <p className="result-empty-text">Your blend analysis will appear here</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--fg-faint)' }}>Add at least two fragrances to begin</p>
            </div>
          )}
          {loading && (
            <div className="thinking">
              <p className="thinking-label">Analyzing your blend</p>
              <div className="dots"><div className="dot"/><div className="dot"/><div className="dot"/></div>
            </div>
          )}
          {error && <p className="error-text">{error}</p>}
          {result && (
            <div className="result-content">
              <div className="result-blend-name"><em>{result.blendName}</em></div>
              <div className="result-tags">{result.tags.map(t => <span key={t} className="result-tag">{t}</span>)}</div>
              <div className="result-section"><p className="result-section-title">The Character</p><p className="result-text">{result.character}</p></div>
              <div className="result-section">
                <p className="result-section-title">How It Layers</p>
                <div className="note-layers">
                  <div className="note-layer"><div className="note-layer-label">Top</div><div className="note-layer-val">{result.topNotes}</div></div>
                  <div className="note-layer"><div className="note-layer-label">Heart</div><div className="note-layer-val">{result.heartNotes}</div></div>
                  <div className="note-layer"><div className="note-layer-label">Base</div><div className="note-layer-val">{result.baseNotes}</div></div>
                </div>
              </div>
              <div className="result-section">
                <p className="result-section-title">Wear It For</p>
                <div className="occasions">{result.occasions.map(o => <span key={o} className="occasion-tag">{o}</span>)}</div>
              </div>
              <div className="result-section"><p className="result-section-title">Pro Tip</p><p className="result-text">{result.tip}</p></div>
              <div className="result-section">
                <p className="result-section-title">Sample The Blend</p>
                <p className="result-text" style={{ marginBottom: 12 }}>Order samples of each component before committing to full bottles.</p>
                <div className="blend-samples">
                  {slots.filter(s => s.scent).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="blend-sample-btn"
                      onClick={() => openSampleModal(`${s.scent.name} — ${s.scent.brand}`)}
                    >
                      <span className="blend-sample-name">{s.scent.name}</span>
                      <span className="blend-sample-cta">Sample →</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SlotInput({ slot, index, fragrances, onSelect, onRemove, onQuery }) {
  // Open when the input is focused; close on click outside or on selection.
  // The dropdown shows every catalog item that matches the (substring) query —
  // when the query is empty we show the full catalog so the user can browse
  // by scrolling. cmdk still owns keyboard nav + ARIA semantics.
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const q = slot.query.trim().toLowerCase();
  const matches = q
    ? fragrances.filter(c =>
        [c.name, c.brand, c.top, c.heart, c.base, c.family]
          .join(' ').toLowerCase().includes(q)
      )
    : fragrances;

  function handleSelect(c) {
    onSelect(c);
    setOpen(false);
  }

  return (
    <div className={`scent-slot ${slot.scent ? 'filled' : ''}`}>
      <div className="slot-header">
        <span className="slot-num">Layer {index + 1}</span>
        <button type="button" className="slot-remove" onClick={onRemove} aria-label="Remove layer">✕</button>
      </div>
      {slot.scent ? (
        <div className="filled-scent">
          <div className="slot-dot" style={{ background: SLOT_COLORS[index % 4] }} />
          <div>
            <div className="filled-name">{slot.scent.name}</div>
            <div className="filled-notes-preview">{slot.scent.brand} · {slot.scent.top}</div>
          </div>
        </div>
      ) : (
        <div ref={wrapperRef}>
          <Command shouldFilter={false} className="relative">
            <CommandInput
              value={slot.query}
              onValueChange={onQuery}
              onFocus={() => setOpen(true)}
              placeholder="Click to browse — or type a fragrance, brand, or note"
            />
            {open && (
              <CommandList className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[320px] overflow-y-auto bg-deep border border-gold/30 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
                {matches.length === 0 ? (
                  <div className="px-4 py-4 text-[0.74rem] text-cream/40 italic font-serif">
                    No matches in the catalog. Try "Aventus", "Le Labo", or a note like "oud".
                  </div>
                ) : (
                  matches.map(c => (
                    <CommandItem
                      key={c.id}
                      value={String(c.id)}
                      onSelect={() => handleSelect(c)}
                    >
                      <span className="text-cream">{c.name} — {c.brand}</span>
                      <span className="text-[0.65rem] text-cream/50">{c.top}</span>
                    </CommandItem>
                  ))
                )}
              </CommandList>
            )}
          </Command>
        </div>
      )}
    </div>
  );
}

// ─── COMPARE ───────────────────────────────────────────────────────────
function Compare({ fragrances }) {
  const [aId, setAId] = useState(null);
  const [bId, setBId] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fragrances.length >= 2 && aId == null) { setAId(fragrances[0].id); setBId(fragrances[1].id); }
  }, [fragrances, aId]);

  const a = fragrances.find(f => f.id === aId);
  const b = fragrances.find(f => f.id === bId);
  const { showToast, openSampleModal, openSourceModal } = useApp();

  async function run() {
    if (aId === bId) { showToast('Pick two different fragrances'); return; }
    setLoading(true); setVerdict(null); setError(null);
    try {
      const shape = (f) => ({ name: f.name, brand: f.brand, family: f.family, top: f.top, heart: f.heart, base: f.base });
      const r = await api('/api/ai/compare', { method: 'POST', body: { a: shape(a), b: shape(b) } });
      setVerdict(r.verdict);
    } catch (e) {
      setError(e.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="tool-hero" id="compare">
        <p className="tool-hero-label">Compare</p>
        <h1 className="tool-hero-title">Side by side,<br/><em>note by note.</em></h1>
        <p className="tool-hero-sub">Pick two fragrances and see exactly how they stack up — notes, seasons, occasions, and which one wins for each situation.</p>
      </div>
      <div className="compare-layout">
        <div className="compare-selectors">
          <div>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>First Fragrance</p>
            <select className="compare-select" value={aId ?? ''} onChange={(e) => setAId(Number(e.target.value))}>
              {fragrances.map(f => <option key={f.id} value={f.id}>{f.name} — {f.brand}</option>)}
            </select>
          </div>
          <div className="compare-vs">vs</div>
          <div>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Second Fragrance</p>
            <select className="compare-select" value={bId ?? ''} onChange={(e) => setBId(Number(e.target.value))}>
              {fragrances.map(f => <option key={f.id} value={f.id}>{f.name} — {f.brand}</option>)}
            </select>
          </div>
          <button type="button" className="compare-btn" onClick={run} disabled={loading || !a || !b}>
            {loading ? 'Analyzing…' : 'Compare These Fragrances'}
          </button>
        </div>
        {a && b && (verdict || loading || error) && (
          <div className="compare-result">
            <div className="compare-card">
              <div className="compare-card-brand">{a.brand}</div>
              <div className="compare-card-name">{a.name}</div>
              <CompareRows fragrance={a} />
              <div className="compare-card-actions">
                <button type="button" className="sample-btn" onClick={() => openSampleModal(`${a.name} — ${a.brand}`)}>Order Sample</button>
                <button type="button" className="source-link" style={{ marginTop: 10 }} onClick={() => openSourceModal(`${a.name} — ${a.brand}`)}>or full bottle →</button>
              </div>
            </div>
            <div className="compare-card">
              <div className="compare-card-brand">{b.brand}</div>
              <div className="compare-card-name">{b.name}</div>
              <CompareRows fragrance={b} />
              <div className="compare-card-actions">
                <button type="button" className="sample-btn" onClick={() => openSampleModal(`${b.name} — ${b.brand}`)}>Order Sample</button>
                <button type="button" className="source-link" style={{ marginTop: 10 }} onClick={() => openSourceModal(`${b.name} — ${b.brand}`)}>or full bottle →</button>
              </div>
            </div>
            <div className="compare-verdict">
              <p className="compare-verdict-label">AI Verdict</p>
              <p className="compare-verdict-text">
                {loading ? 'Analyzing…' : error ? <span className="error-text">{error}</span> : verdict}
              </p>
              {verdict && !loading && (
                <p className="compare-verdict-hint">Still on the fence? Sample both in 5ml decants before deciding — that's what they're for.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CompareRows({ fragrance: p }) {
  return (
    <>
      <div className="compare-row"><span className="compare-row-label">Top</span><span className="compare-row-val">{p.top}</span></div>
      <div className="compare-row"><span className="compare-row-label">Heart</span><span className="compare-row-val">{p.heart}</span></div>
      <div className="compare-row"><span className="compare-row-label">Base</span><span className="compare-row-val">{p.base}</span></div>
      <div className="compare-row"><span className="compare-row-label">Family</span><span className="compare-row-val">{p.family}</span></div>
      <div className="compare-row"><span className="compare-row-label">Season</span><span className="compare-row-val">{p.season.join(', ')}</span></div>
      <div className="compare-row"><span className="compare-row-label">Time</span><span className="compare-row-val">{p.time.join(', ')}</span></div>
      <div className="compare-row"><span className="compare-row-label">Mood</span><span className="compare-row-val">{p.mood.join(', ')}</span></div>
    </>
  );
}

// ─── SIMILAR ───────────────────────────────────────────────────────────
function Similar() {
  const { openSampleModal, openSourceModal } = useApp();
  const [input, setInput] = useState('');
  const [echo, setEcho] = useState('');
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function find() {
    const val = input.trim();
    if (!val) return;
    setLoading(true); setRecs(null); setError(null); setEcho(val);
    try {
      const r = await api('/api/ai/similar', { method: 'POST', body: { fragrance: val } });
      setRecs(r.recommendations);
    } catch (e) {
      setError(e.message || 'Could not find alternatives');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="tool-hero" id="similar">
        <p className="tool-hero-label">Similar Scents</p>
        <h1 className="tool-hero-title">Love one?<br/><em>Discover more.</em></h1>
        <p className="tool-hero-sub">Type any fragrance you already love — mainstream or niche — and get curated alternatives that share its DNA.</p>
      </div>
      <div className="similar-layout">
        <p className="similar-hint">Works with any fragrance — try "Bleu de Chanel", "Dior Sauvage", "YSL Black Opium", or any scent you already wear.</p>
        <div className="similar-search-row">
          <input
            className="similar-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') find(); }}
            placeholder="Enter a fragrance you love…"
          />
          <button type="button" className="similar-submit" onClick={find} disabled={loading || !input.trim()}>
            {loading ? 'Finding…' : 'Find Similar'}
          </button>
        </div>

        {loading && (
          <div className="thinking">
            <p className="thinking-label">Finding your alternatives</p>
            <div className="dots"><div className="dot"/><div className="dot"/><div className="dot"/></div>
          </div>
        )}
        {error && <p className="error-text">{error}</p>}
        {recs && (
          <div className="similar-result">
            <h3 className="similar-result-title">If you love <em>{echo}</em>, try these:</h3>
            <div className="similar-cards">
              {recs.map((r, i) => {
                const label = `${r.name} — ${r.brand}`;
                return (
                  <div key={i} className="similar-card">
                    <p className="similar-card-rank">{r.rank}</p>
                    <h3 className="similar-card-name">{r.name}</h3>
                    <p className="similar-card-brand">{r.brand}</p>
                    <p className="similar-card-why">{r.why}</p>
                    <p className="similar-card-match">✦ {r.match}</p>
                    <div className="similar-card-actions">
                      <button type="button" className="sample-btn" onClick={() => openSampleModal(label)}>Order Sample</button>
                      <button type="button" className="source-link" style={{ marginTop: 10 }} onClick={() => openSourceModal(label)}>or full bottle →</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
