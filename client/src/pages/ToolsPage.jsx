import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '../components/ui/Command.jsx';
import { StreamText } from '../components/StreamText.jsx';
import { WhyThisRec } from '../components/WhyThisRec.jsx';
import { useThinkingStages } from '../hooks/useThinkingStages.js';
import { useApp } from '../context/AppContext.jsx';
import { useDocumentMeta } from '../lib/seo.js';
import { api } from '../lib/api.js';
import { trackEvent } from '../lib/analytics.js';

const SLOT_COLORS = ['#7a5c40', '#4a6855', '#9a7030', '#503868'];

export function ToolsPage() {
  const { fragrances } = useApp();
  const { hash } = useLocation();
  const [tab, setTab] = useState(() => {
    if (hash === '#compare') return 'compare';
    if (hash === '#similar') return 'similar';
    if (hash === '#describe') return 'describe';
    return 'builder';
  });

  // Theme is now centralized in AppContext, page no longer touches body.dark.

  useDocumentMeta({
    title: 'AI Fragrance Tools, Layer Builder, Compare, Similar Scents',
    description: 'AI-powered tools to find your signature scent. Layer fragrances, compare options side-by-side, or discover alternatives to something you already love.',
  });

  return (
    <>
      <Nav />

      <div className="tools-subnav">
        <div className="tools-subnav-inner">
          <p className="tools-subnav-label">AI Tools</p>
          <div className="tools-nav">
            <button type="button" className={`tool-tab ${tab === 'builder' ? 'active' : ''}`} onClick={() => setTab('builder')}>Layer Builder</button>
            <button type="button" className={`tool-tab ${tab === 'compare' ? 'active' : ''}`} onClick={() => setTab('compare')}>Compare</button>
            <button type="button" className={`tool-tab ${tab === 'similar' ? 'active' : ''}`} onClick={() => setTab('similar')}>Similar Scents</button>
            <button type="button" className={`tool-tab ${tab === 'describe' ? 'active' : ''}`} onClick={() => setTab('describe')}>Describe</button>
          </div>
        </div>
      </div>

      {tab === 'builder'  && <LayerBuilder fragrances={fragrances} />}
      {tab === 'compare'  && <Compare    fragrances={fragrances} />}
      {tab === 'similar'  && <Similar />}
      {tab === 'describe' && <Describe   fragrances={fragrances} />}
    </>
  );
}

// ─── LAYER BUILDER ─────────────────────────────────────────────────────
function LayerBuilder({ fragrances }) {
  const { openSampleModal, user, saveBlend, buildUserContext, wardrobeItems } = useApp();
  // Pre-fill slots with the user's two most-recently SAMPLED fragrances
  // so signed-in users with a wardrobe land on a useful starting point
  // instead of two empty slots. Falls back to empty slots for guests.
  const sampledSeed = (() => {
    const sampled = wardrobeItems.filter(w => w.status === 'SAMPLED').slice(0, 2);
    if (sampled.length >= 2) {
      return sampled.map((w, i) => ({ id: i + 1, scent: w.fragrance, query: '' }));
    }
    return [{ id: 1, scent: null, query: '' }, { id: 2, scent: null, query: '' }];
  })();
  const [slots, setSlots] = useState(sampledSeed);
  const [nextId, setNextId] = useState(sampledSeed.length + 1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Save-blend state, name input + "already saved" flag so the
  // button can switch into a success state after the user saves.
  const [blendName, setBlendName] = useState('');
  const [savedBlendId, setSavedBlendId] = useState(null);

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
      const r = await api('/api/ai/layer', {
        method: 'POST',
        body: { fragrances: payload, userContext: buildUserContext() },
      });
      trackEvent('layer_analyze', { count: payload.length });
      setResult(r);
      setBlendName(r?.blendName ?? '');
      setSavedBlendId(null);
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
        <p className="tool-hero-sub">Add 2 to 4 fragrances to see how their notes interact. Get an AI-powered analysis of the harmony, character, and perfect occasions for your combination.</p>
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
          {loading && <LayerThinking active={loading} user={user} />}
          {error && <p className="error-text">{error}</p>}
          {result && (
            <div className="result-content">
              <div className="result-blend-name"><em>{result.blendName}</em></div>
              <div className="result-tags">{result.tags.map(t => <span key={t} className="result-tag">{t}</span>)}</div>
              <WhyThisRec reasoning={result.reasoning} />

              {/* Save this blend → My Blends */}
              <div className="save-blend-row">
                <p className="save-blend-row-label">Save This Blend</p>
                {!user ? (
                  <p style={{ fontSize: '0.78rem', color: 'var(--fg-soft)' }}>
                    <a href="/login" style={{ color: 'var(--gold)' }}>Sign in</a> to save blends to your profile under "My Blends".
                  </p>
                ) : savedBlendId ? (
                  <p style={{ fontSize: '0.78rem', color: 'var(--gold)' }}>
                    ✓ Saved. Open <a href="/profile#blends" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>My Blends</a> any time.
                  </p>
                ) : (
                  <div className="save-blend-form">
                    <input
                      type="text"
                      className="save-blend-input"
                      value={blendName}
                      onChange={(e) => setBlendName(e.target.value)}
                      maxLength={80}
                      placeholder="Name this blend"
                    />
                    <button
                      type="button"
                      className="save-blend-btn"
                      disabled={!blendName.trim()}
                      onClick={async () => {
                        const payload = slots.filter(s => s.scent).map(s => ({
                          id: s.scent.id,
                          name: s.scent.name, brand: s.scent.brand, family: s.scent.family,
                          top: s.scent.top, heart: s.scent.heart, base: s.scent.base,
                        }));
                        const saved = await saveBlend({ name: blendName.trim(), fragrances: payload, result });
                        if (saved) setSavedBlendId(saved.id);
                      }}
                    >Save Blend</button>
                  </div>
                )}
              </div>

              <div className="result-section"><p className="result-section-title">The Character</p><StreamText as="p" className="result-text" text={result.character} /></div>
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
                      onClick={() => openSampleModal(`${s.scent.name}, ${s.scent.brand}`)}
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

/**
 * Thinking presentations, one per AI tool. Each rotates a tool-specific
 * sequence of status messages while the request is in flight, so the
 * wait reads as deliberate reasoning instead of a frozen UI. The
 * messages reference user context if the caller is signed in.
 */
function LayerThinking({ active, user }) {
  const stages = user ? [
    'Reading the recipe',
    'Pulling notes',
    'Cross-referencing your wardrobe',
    'Drafting the analysis',
  ] : [
    'Reading the recipe',
    'Pulling notes',
    'Mapping how they layer',
    'Drafting the analysis',
  ];
  const label = useThinkingStages(active, stages);
  return (
    <div className="thinking">
      <p className="thinking-label">{label || 'Analyzing your blend'}</p>
      <div className="dots"><div className="dot"/><div className="dot"/><div className="dot"/></div>
    </div>
  );
}

function CompareThinking({ active, user }) {
  const stages = user ? [
    'Reading both fragrances',
    'Weighing what each does best',
    'Considering your wardrobe',
    'Drafting the verdict',
  ] : [
    'Reading both fragrances',
    'Comparing top to base',
    'Weighing what each does best',
    'Drafting the verdict',
  ];
  const label = useThinkingStages(active, stages);
  return (
    <div className="thinking" style={{ marginTop: 24 }}>
      <p className="thinking-label">{label || 'Comparing'}</p>
      <div className="dots"><div className="dot"/><div className="dot"/><div className="dot"/></div>
    </div>
  );
}

function SimilarThinking({ active }) {
  const stages = [
    'Triangulating the DNA',
    'Scanning the catalog',
    'Shortlisting alternatives',
    'Writing the picks',
  ];
  const label = useThinkingStages(active, stages);
  return (
    <div className="thinking">
      <p className="thinking-label">{label || 'Finding alternatives'}</p>
      <div className="dots"><div className="dot"/><div className="dot"/><div className="dot"/></div>
    </div>
  );
}

function SlotInput({ slot, index, fragrances, onSelect, onRemove, onQuery }) {
  // Open when the input is focused; close on click outside or on selection.
  // The dropdown shows every catalog item that matches the (substring) query ,
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
              placeholder="Click to browse, or type a fragrance, brand, or note"
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
                      <span className="text-cream">{c.name}, {c.brand}</span>
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
  const { user, showToast, openSampleModal, openSourceModal, buildUserContext, wardrobeItems, myReviews } = useApp();
  const [aId, setAId] = useState(null);
  const [bId, setBId] = useState(null);
  // Stores the full result object (verdict + reasoning) rather than
  // just the verdict string so we can render WhyThisRec.
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fragrances.length < 2 || aId != null) return;
    // Pre-fill with the user's last sampled + their most-recent LOVED
    // review (or another sampled if no loved yet). Cleaner starting point
    // than the first two alphabetical entries in the catalog.
    const sampled = wardrobeItems.filter(w => w.status === 'SAMPLED');
    const loved   = myReviews.filter(r => r.rating === 'LOVED');
    const lastSampledId = sampled[0]?.fragranceId;
    const lastLovedId   = loved.find(r => r.fragranceId !== lastSampledId)?.fragranceId;
    const otherSampledId = sampled.find(w => w.fragranceId !== lastSampledId)?.fragranceId;

    const pickA = lastSampledId ?? fragrances[0].id;
    const pickB = lastLovedId ?? otherSampledId ?? fragrances.find(f => f.id !== pickA)?.id;
    setAId(pickA);
    setBId(pickB);
  }, [fragrances, aId, wardrobeItems, myReviews]);

  const a = fragrances.find(f => f.id === aId);
  const b = fragrances.find(f => f.id === bId);

  async function run() {
    if (aId === bId) { showToast('Pick two different fragrances'); return; }
    setLoading(true); setResult(null); setError(null);
    try {
      const shape = (f) => ({ name: f.name, brand: f.brand, family: f.family, top: f.top, heart: f.heart, base: f.base });
      const r = await api('/api/ai/compare', {
        method: 'POST',
        body: { a: shape(a), b: shape(b), userContext: buildUserContext() },
      });
      trackEvent('compare_run', { a: a.name, b: b.name });
      setResult(r);
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
        <p className="tool-hero-sub">Pick two fragrances and see exactly how they stack up, notes, seasons, occasions, and which one wins for each situation.</p>
      </div>
      <div className="compare-layout">
        <div className="compare-selectors">
          <div>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>First Fragrance</p>
            <select className="compare-select" value={aId ?? ''} onChange={(e) => setAId(Number(e.target.value))}>
              {fragrances.map(f => <option key={f.id} value={f.id}>{f.name}, {f.brand}</option>)}
            </select>
          </div>
          <div className="compare-vs">vs</div>
          <div>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Second Fragrance</p>
            <select className="compare-select" value={bId ?? ''} onChange={(e) => setBId(Number(e.target.value))}>
              {fragrances.map(f => <option key={f.id} value={f.id}>{f.name}, {f.brand}</option>)}
            </select>
          </div>
          <button type="button" className="compare-btn" onClick={run} disabled={loading || !a || !b}>
            {loading ? 'Analyzing…' : 'Compare These Fragrances'}
          </button>
        </div>
        {a && b && (result || loading || error) && (
          <div className="compare-result">
            <div className="compare-card">
              <div className="compare-card-brand">{a.brand}</div>
              <div className="compare-card-name">{a.name}</div>
              <CompareRows fragrance={a} />
              <div className="compare-card-actions">
                <button type="button" className="sample-btn" onClick={() => openSampleModal(`${a.name}, ${a.brand}`)}>Order Sample</button>
                <button type="button" className="source-link" style={{ marginTop: 10 }} onClick={() => openSourceModal(`${a.name}, ${a.brand}`)}>or full bottle →</button>
              </div>
            </div>
            <div className="compare-card">
              <div className="compare-card-brand">{b.brand}</div>
              <div className="compare-card-name">{b.name}</div>
              <CompareRows fragrance={b} />
              <div className="compare-card-actions">
                <button type="button" className="sample-btn" onClick={() => openSampleModal(`${b.name}, ${b.brand}`)}>Order Sample</button>
                <button type="button" className="source-link" style={{ marginTop: 10 }} onClick={() => openSourceModal(`${b.name}, ${b.brand}`)}>or full bottle →</button>
              </div>
            </div>
            <div className="compare-verdict">
              <p className="compare-verdict-label">AI Verdict</p>
              {loading && <CompareThinking active={loading} user={user} />}
              {error && <p className="error-text">{error}</p>}
              {result && !loading && (
                <>
                  <StreamText as="p" className="compare-verdict-text" text={result.verdict} />
                  <WhyThisRec reasoning={result.reasoning} />
                  <p className="compare-verdict-hint">Still on the fence? Sample both in 5ml decants before deciding, that's what they're for.</p>
                </>
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
  const { openSampleModal, openSourceModal, buildUserContext } = useApp();
  const [input, setInput] = useState('');
  const [echo, setEcho] = useState('');
  // Store the full result (recommendations + reasoning) so we can render
  // the "Why these picks?" expandable.
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function find() {
    const val = input.trim();
    if (!val) return;
    setLoading(true); setResult(null); setError(null); setEcho(val);
    try {
      const r = await api('/api/ai/similar', {
        method: 'POST',
        body: { fragrance: val, userContext: buildUserContext() },
      });
      trackEvent('similar_search', { query: val });
      setResult(r);
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
        <p className="tool-hero-sub">Type any fragrance you already love, mainstream or niche, and get curated alternatives that share its DNA.</p>
      </div>
      <div className="similar-layout">
        <p className="similar-hint">Works with any fragrance, try "Bleu de Chanel", "Dior Sauvage", "YSL Black Opium", or any scent you already wear.</p>
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

        {loading && <SimilarThinking active={loading} />}
        {error && <p className="error-text">{error}</p>}
        {result && (
          <div className="similar-result">
            <h3 className="similar-result-title">If you love <em>{echo}</em>, try these:</h3>
            <WhyThisRec reasoning={result.reasoning} label="Why these picks?" />
            <div className="similar-cards">
              {result.recommendations.map((r, i) => {
                const label = `${r.name}, ${r.brand}`;
                return (
                  <div key={i} className="similar-card">
                    <p className="similar-card-rank">{r.rank}</p>
                    <h3 className="similar-card-name">{r.name}</h3>
                    <p className="similar-card-brand">{r.brand}</p>
                    <StreamText as="p" className="similar-card-why" text={r.why} />
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

// ─── DESCRIBE ──────────────────────────────────────────────────────────
// Free-form text input → 3 catalog matches. The model only picks from
// the catalog we pass it, so every result lands on a real /fragrance/
// page on click. Reuses the thinking-stream + WhyThisRec infra so the
// wait reads as deliberate reasoning rather than a frozen UI.
function Describe({ fragrances }) {
  const { openSampleModal, openSourceModal, buildUserContext } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function find() {
    const val = input.trim();
    if (val.length < 8) return;
    setLoading(true); setResult(null); setError(null); setSubmitted(val);
    try {
      // Trim catalog payload to the fields the model actually uses.
      const catalog = fragrances.map(f => ({
        id: f.id, name: f.name, brand: f.brand, family: f.family,
        top: f.top, heart: f.heart, base: f.base,
      }));
      const r = await api('/api/ai/describe', {
        method: 'POST',
        body: { description: val, catalog, userContext: buildUserContext() },
      });
      trackEvent('describe_search');
      setResult(r);
    } catch (e) {
      setError(e.message || 'Could not find matches');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="tool-hero" id="describe">
        <p className="tool-hero-label">Describe a Scent</p>
        <h1 className="tool-hero-title">Smelled it once,<br/><em>never knew what it was.</em></h1>
        <p className="tool-hero-sub">Describe a fragrance in your own words, a note, a place, a memory, a vibe, and we'll triangulate the three closest matches from the catalog.</p>
      </div>
      <div className="similar-layout">
        <p className="similar-hint">Examples: "smoky, like a campfire but with vanilla underneath" · "I smelled this at a hotel bar in November, leather and rum" · "clean, like ironed linen and morning sun".</p>
        <div className="similar-search-row">
          <textarea
            className="similar-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                find();
              }
            }}
            placeholder="Describe what you smelled, or what you want to smell like…"
            rows={3}
            style={{ resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }}
            maxLength={600}
          />
          <button type="button" className="similar-submit" onClick={find} disabled={loading || input.trim().length < 8}>
            {loading ? 'Matching…' : 'Find Matches'}
          </button>
        </div>

        {loading && <DescribeThinking active={loading} />}
        {error && <p className="error-text">{error}</p>}
        {result && (
          <div className="similar-result">
            <h3 className="similar-result-title">From <em>"{submitted.length > 60 ? submitted.slice(0, 60) + '…' : submitted}"</em></h3>
            <WhyThisRec reasoning={result.reasoning} label="Why these picks?" />
            <div className="similar-cards">
              {result.matches.map((m) => {
                const f = fragrances.find(x => x.id === m.id);
                const label = `${m.name}, ${m.brand}`;
                return (
                  <div key={m.id} className="similar-card">
                    <p className="similar-card-rank">{m.rank}</p>
                    <h3
                      className="similar-card-name"
                      style={f ? { cursor: 'none' } : undefined}
                      onClick={() => f && navigate(`/fragrance/${f.id}`)}
                    >{m.name}</h3>
                    <p className="similar-card-brand">{m.brand}</p>
                    <StreamText as="p" className="similar-card-why" text={m.why} />
                    <p className="similar-card-match">✦ {m.match}</p>
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

function DescribeThinking({ active }) {
  const stages = [
    'Reading your description',
    'Scanning the catalog',
    'Matching against notes',
    'Triangulating the three closest',
  ];
  const label = useThinkingStages(active, stages);
  return (
    <div className="thinking">
      <p className="thinking-label">{label || 'Matching'}</p>
      <div className="dots"><div className="dot"/><div className="dot"/><div className="dot"/></div>
    </div>
  );
}
