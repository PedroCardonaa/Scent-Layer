import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { StreamText } from '../components/StreamText.jsx';
import { WhyThisRec } from '../components/WhyThisRec.jsx';
import { WardrobeInsight } from '../components/WardrobeInsight.jsx';
import { useThinkingStages } from '../hooks/useThinkingStages.js';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';
import { trackEvent } from '../lib/analytics.js';

function ReferralBlock({ showToast }) {
  async function joinWaitlist() {
    const el = document.getElementById('profileReferralEmail');
    const email = el?.value?.trim();
    if (!email || !email.includes('@')) { showToast('Please enter a valid email'); return; }
    try {
      await api('/api/waitlist', { method: 'POST', body: { email, type: 'referral' } });
      if (el) el.value = '';
      showToast('<span>You\'re on the list!</span> We\'ll send your link at launch.');
    } catch (e) { showToast(e.message); }
  }
  return (
    <section className="referral">
      <div className="referral-inner">
        <h2 className="referral-title">Refer a friend,<br/><em className="gradient-em">both smell better.</em></h2>
        <p className="referral-body">When we launch, every referral earns you and your friend a discount on your first sourcing order. The more people you bring in, the more you save.</p>
        <div className="referral-form">
          <input className="fotm-input" id="profileReferralEmail" placeholder="Your email, we'll send your referral link at launch" type="email" />
          <button className="fotm-btn" type="button" onClick={joinWaitlist}>Reserve My Spot</button>
        </div>
        <p className="fotm-note">Launch pricing and referral details coming soon.</p>
      </div>
    </section>
  );
}

const QUIZ_COLORS = ['#7a5c40','#4a6855','#9a7030','#503868','#5a4a70','#3a5858','#6a4830','#485a3a'];

const QUESTIONS = [
  { q: "How do you want people to feel when you walk into the room?", options: ["Intrigued, they can't quite place it","Impressed, undeniably confident","Comforted, warm and approachable","Captivated, romantic and mysterious"] },
  { q: "What's your go-to setting?", options: ["Outdoors, fresh air, open spaces","The office, sharp, put-together","A dinner out, dressed up, present","Late nights, dim light, good music"] },
  { q: "Which texture speaks to you?", options: ["Silk, smooth and clean","Leather, dark and structured","Velvet, rich and soft","Linen, light and effortless"] },
  { q: "Pick a season for your signature scent:", options: ["Spring, green and floral","Summer, citrus and light","Fall, spiced and warm","Winter, deep and smoky"] },
  { q: "How long do you want your scent to last?", options: ["All day, I want presence","A few hours, subtle is fine","I'll reapply, I like control","As long as possible, leave a trail"] }
];

const TABS = [
  { key: 'wishlist',    label: 'Wishlist' },
  { key: 'wardrobe',    label: 'My Wardrobe' },
  { key: 'blends',      label: 'My Blends' },
  { key: 'reviews',     label: 'My Reviews' },
  { key: 'personalize', label: 'Find My Scent' },
];

export function ProfilePage() {
  const {
    user, authLoading, logout, fragrances, wishlistIds, toggleWishlist,
    openSampleModal, openSourceModal, showToast, saveQuizResult,
  } = useApp();

  const [tab, setTab] = useState(() => {
    if (typeof window === 'undefined') return 'wishlist';
    const hash = window.location.hash.slice(1);
    return TABS.some(t => t.key === hash) ? hash : 'wishlist';
  });

  function selectTab(key) {
    setTab(key);
    try { history.replaceState(null, '', `#${key}`); } catch { /* noop */ }
  }

  if (authLoading) return (<><Nav/><div className="profile-gate"><p>Loading…</p></div></>);

  if (!user) {
    return (
      <>
        <Nav />
        <div className="profile-gate">
          <div className="profile-gate-icon">✦</div>
          <h1 className="profile-gate-title">Sign in to access your <em>profile.</em></h1>
          <p className="profile-gate-sub">Your wishlist, wardrobe, saved blends, and reviews all live in your account so they follow you between devices.</p>
          <div className="profile-gate-actions">
            <Link to="/signup" className="btn-dark">Create Account</Link>
            <Link to="/login" className="btn-ghost">Sign In</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />

      <div className="profile-hero">
        <div>
          <p className="profile-hero-label">My Profile</p>
          <h1 className="profile-hero-title">Your collection &amp;<br/><em>personal picks.</em></h1>
          <p className="profile-hero-email">{user.email}</p>
          <button type="button" className="logout-link" onClick={logout}>Sign out</button>
        </div>
        <button type="button" className="personalize-btn" onClick={() => selectTab('personalize')}>
          <span className="personalize-icon">✦</span>Personalize My Scent
        </button>
      </div>

      <div className="profile-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            className={`profile-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => selectTab(t.key)}
          >{t.label}</button>
        ))}
      </div>

      <div className="profile-layout single">
        {tab === 'wishlist' && (
          <WishlistPanel
            fragrances={fragrances}
            wishlistIds={wishlistIds}
            toggleWishlist={toggleWishlist}
            openSampleModal={openSampleModal}
            openSourceModal={openSourceModal}
          />
        )}

        {tab === 'wardrobe'    && <WardrobePanel />}
        {tab === 'blends'      && <BlendsPanel />}
        {tab === 'reviews'     && <ReviewsPanel openSampleModal={openSampleModal} />}
        {tab === 'personalize' && (
          <QuizPanel
            savedResult={user.quizResult}
            onSave={async (r) => { await saveQuizResult(r); showToast('<span>Result saved</span> to your profile'); }}
            openSampleModal={openSampleModal}
            openSourceModal={openSourceModal}
          />
        )}
      </div>

      <ReferralBlock showToast={showToast} />
    </>
  );
}

// ─── WISHLIST PANEL ─────────────────────────────────────────────────
function WishlistPanel({ fragrances, wishlistIds, toggleWishlist, openSampleModal, openSourceModal }) {
  const items = useMemo(() => fragrances.filter(c => wishlistIds.includes(c.id)), [fragrances, wishlistIds]);
  return (
    <div className="profile-panel">
      <p className="profile-panel-label">Saved Fragrances</p>
      <h2 className="profile-panel-title">My Wishlist</h2>
      <p className="profile-panel-sub">Fragrances you've saved. Order any as a sample, or skip straight to a full bottle.</p>
      {items.length === 0 ? (
        <div className="wishlist-empty">
          <div className="wishlist-empty-icon">♡</div>
          <p className="wishlist-empty-text">Your wishlist is empty</p>
          <p className="wishlist-empty-sub">Browse the shop and save fragrances you love</p>
          <Link to="/shop" className="btn-dark" style={{ marginTop: 20, display: 'inline-block' }}>Browse Shop</Link>
        </div>
      ) : (
        <div className="wishlist-list">
          {items.map((p, i) => (
            <div key={p.id} className="wishlist-item">
              <div className="wishlist-item-dot" style={{ background: QUIZ_COLORS[i % 8] }} />
              <div className="wishlist-item-info">
                <p className="wishlist-item-brand">{p.brand}</p>
                <p className="wishlist-item-name">{p.name}</p>
                <p className="wishlist-item-notes">{p.top}</p>
              </div>
              <div className="wishlist-item-actions">
                <button type="button" className="wishlist-action sample" onClick={() => openSampleModal(`${p.name}, ${p.brand}`)}>Sample</button>
                <button type="button" className="wishlist-action source" onClick={() => openSourceModal(`${p.name}, ${p.brand}`)} title="Source the full bottle">Bottle</button>
                <button type="button" className="wishlist-action remove" onClick={() => toggleWishlist(p.id)} aria-label="Remove">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WARDROBE PANEL ─────────────────────────────────────────────────
function WardrobePanel() {
  const { wardrobeItems, removeWardrobeStatus } = useApp();

  const owned   = wardrobeItems.filter(i => i.status === 'OWNED');
  const sampled = wardrobeItems.filter(i => i.status === 'SAMPLED');
  const backup  = wardrobeItems.filter(i => i.status === 'BACKUP');

  if (wardrobeItems.length === 0) {
    return (
      <div className="profile-panel">
        <p className="profile-panel-label">Your Fragrance Inventory</p>
        <h2 className="profile-panel-title">My Wardrobe</h2>
        <p className="profile-panel-sub">Track what you own, what you've sampled, and what you want a backup of. Open any fragrance and use the wardrobe pills to mark it.</p>
        <div className="wardrobe-empty">
          <div className="wardrobe-empty-icon">◈</div>
          <p className="wardrobe-empty-text">Your wardrobe is empty</p>
          <p className="wardrobe-empty-sub">Open any fragrance page to add it</p>
          <Link to="/shop" className="btn-dark" style={{ marginTop: 20, display: 'inline-block' }}>Browse Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-panel">
      <p className="profile-panel-label">Your Fragrance Inventory</p>
      <h2 className="profile-panel-title">My Wardrobe</h2>
      <p className="profile-panel-sub">A snapshot of what you wear. Use it to plan rotations and reorders.</p>
      <WardrobeInsight />
      <div className="wardrobe-grid">
        <WardrobeColumn label="Owned"   items={owned}   onRemove={removeWardrobeStatus} status="OWNED" />
        <WardrobeColumn label="Sampled" items={sampled} onRemove={removeWardrobeStatus} status="SAMPLED" />
        <WardrobeColumn label="Backup"  items={backup}  onRemove={removeWardrobeStatus} status="BACKUP" />
      </div>
    </div>
  );
}

function WardrobeColumn({ label, items, onRemove, status }) {
  return (
    <div className="wardrobe-column">
      <p className="wardrobe-col-label">
        <span>{label}</span>
        <span className="wardrobe-col-count">{items.length}</span>
      </p>
      {items.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: 'var(--fg-dim)', fontSize: '0.78rem' }}>None yet.</p>
      ) : items.map(item => (
        <div key={item.id} className="wardrobe-item">
          <Link to={`/fragrance/${item.fragranceId}`} className="wardrobe-item-info" style={{ textDecoration: 'none', flex: 1 }}>
            <div className="wardrobe-item-name">{item.fragrance?.name ?? `#${item.fragranceId}`}</div>
            <div className="wardrobe-item-brand">{item.fragrance?.brand}{item.sizeMl ? ` · ${item.sizeMl}ml` : ''}</div>
          </Link>
          <button type="button" className="wardrobe-item-remove" onClick={() => onRemove(item.fragranceId, status)} aria-label="Remove">✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── BLENDS PANEL ───────────────────────────────────────────────────
function BlendsPanel() {
  const { savedBlends, deleteBlend, renameBlend } = useApp();

  if (savedBlends.length === 0) {
    return (
      <div className="profile-panel">
        <p className="profile-panel-label">Layer Builder Recipes</p>
        <h2 className="profile-panel-title">My Blends</h2>
        <p className="profile-panel-sub">Save any blend from the Layer Builder and it appears here, recipe, analysis, and tags intact.</p>
        <div className="wardrobe-empty">
          <div className="wardrobe-empty-icon">◈</div>
          <p className="wardrobe-empty-text">You haven't saved any blends yet</p>
          <p className="wardrobe-empty-sub">Open the Layer Builder and combine 2 to 4 fragrances</p>
          <Link to="/tools" className="btn-dark" style={{ marginTop: 20, display: 'inline-block' }}>Open Layer Builder</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-panel">
      <p className="profile-panel-label">Layer Builder Recipes</p>
      <h2 className="profile-panel-title">My Blends</h2>
      <p className="profile-panel-sub">Every blend you've saved, recipe, analysis, occasions. Click rename to give it a personal title.</p>
      <div className="blends-grid">
        {savedBlends.map(b => (
          <BlendCard key={b.id} blend={b} onDelete={deleteBlend} onRename={renameBlend} />
        ))}
      </div>
    </div>
  );
}

function BlendCard({ blend, onDelete, onRename }) {
  const { result, fragrances, createdAt, name } = blend;
  const recipe = Array.isArray(fragrances)
    ? fragrances.map(f => `${f.name}, ${f.brand}`).join(' · ')
    : '';
  const tags = Array.isArray(result?.tags) ? result.tags : [];

  function handleRename() {
    const next = prompt('Rename this blend', name);
    if (next && next.trim() && next.trim() !== name) onRename(blend.id, next.trim());
  }
  function handleDelete() {
    if (confirm(`Delete "${name}"?`)) onDelete(blend.id);
  }

  return (
    <article className="blend-card">
      <div className="blend-card-head">
        <h3 className="blend-card-name">{name}</h3>
        <span className="blend-card-date">
          {createdAt ? new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
        </span>
      </div>
      {tags.length > 0 && (
        <div className="blend-card-tags">
          {tags.map(t => <span key={t} className="blend-card-tag">{t}</span>)}
        </div>
      )}
      {result?.character && <p className="blend-card-character">{result.character}</p>}
      {recipe && (
        <p className="blend-card-recipe">
          <strong>Recipe:</strong> {recipe}
        </p>
      )}
      <div className="blend-card-actions">
        <button type="button" className="blend-card-btn" onClick={handleRename}>Rename</button>
        <button type="button" className="blend-card-btn danger" onClick={handleDelete}>Delete</button>
      </div>
    </article>
  );
}

// ─── REVIEWS PANEL ──────────────────────────────────────────────────
function ReviewsPanel({ openSampleModal }) {
  const { myReviews, fragrances, submitReview, wardrobeItems } = useApp();

  // Surface any fragrance the user has SAMPLED but not yet reviewed ,
  // that's exactly the pool we want them to write about.
  const sampledIds = wardrobeItems.filter(i => i.status === 'SAMPLED').map(i => i.fragranceId);
  const reviewedIds = myReviews.map(r => r.fragranceId);
  const toReview = sampledIds
    .filter(id => !reviewedIds.includes(id))
    .map(id => fragrances.find(f => f.id === id))
    .filter(Boolean);

  return (
    <div className="profile-panel">
      <p className="profile-panel-label">Your Verdicts</p>
      <h2 className="profile-panel-title">My Reviews</h2>
      <p className="profile-panel-sub">Tell us how each sample wore on your skin. Reviews show on the public fragrance pages and help us tune your recommendations.</p>

      {toReview.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p className="profile-panel-label" style={{ color: 'var(--gold)' }}>Waiting on your review</p>
          {toReview.map(f => (
            <ReviewForm key={f.id} fragrance={f} onSubmit={submitReview} />
          ))}
        </div>
      )}

      {myReviews.length === 0 && toReview.length === 0 ? (
        <div className="wardrobe-empty">
          <div className="wardrobe-empty-icon">◇</div>
          <p className="wardrobe-empty-text">No reviews yet</p>
          <p className="wardrobe-empty-sub">Once you've sampled something, mark it sampled in your wardrobe and a review form appears here</p>
        </div>
      ) : (
        <div style={{ marginTop: 24 }}>
          <p className="profile-panel-label" style={{ color: 'var(--gold)' }}>Your past reviews</p>
          {myReviews.map(r => (
            <ReviewSummaryRow key={r.id} review={r} onSubmit={submitReview} openSampleModal={openSampleModal} />
          ))}
        </div>
      )}
    </div>
  );
}

const RATING_LABELS = {
  LOVED:    'Loved it',
  LIKED:    'Liked it',
  CONFLICT: 'Skin conflict',
  HATED:    'Not for me',
};

function ReviewForm({ fragrance, onSubmit, existing }) {
  const [rating, setRating] = useState(existing?.rating ?? null);
  const [text, setText] = useState(existing?.text ?? '');

  function handleSubmit() {
    if (!rating) return;
    onSubmit({
      fragranceId: fragrance.id,
      rating,
      text: text.trim() || undefined,
    });
  }

  return (
    <div className="review-form" style={{ borderTop: '1px solid var(--hairline)', paddingTop: 20, marginTop: 20 }}>
      <p style={{ fontFamily: 'Lora, serif', fontSize: '1.05rem', color: 'var(--fg)' }}>
        {fragrance.name} <span style={{ color: 'var(--fg-dim)', fontSize: '0.78rem' }}>, {fragrance.brand}</span>
      </p>
      <div className="review-rating-row" style={{ marginTop: 12 }}>
        {Object.entries(RATING_LABELS).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`review-rating-btn ${rating === k ? 'active' : ''}`}
            onClick={() => setRating(k)}
          >{label}</button>
        ))}
      </div>
      <textarea
        className="review-text"
        placeholder="Optional, how did it sit on your skin? Any context."
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
      />
      <button
        type="button"
        className="save-blend-btn"
        onClick={handleSubmit}
        disabled={!rating}
        style={{ marginTop: 10 }}
      >{existing ? 'Update Review' : 'Save Review'}</button>
    </div>
  );
}

function ReviewSummaryRow({ review, onSubmit, openSampleModal }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <div>
        <ReviewForm fragrance={review.fragrance} onSubmit={(data) => { onSubmit(data); setEditing(false); }} existing={review} />
        <button type="button" className="blend-card-btn" onClick={() => setEditing(false)} style={{ marginTop: 8 }}>Cancel</button>
      </div>
    );
  }
  return (
    <div className="wardrobe-item" style={{ alignItems: 'flex-start', padding: '16px 0' }}>
      <div style={{ flex: 1 }}>
        <div className="wardrobe-item-name">{review.fragrance?.name}</div>
        <div className="wardrobe-item-brand">{review.fragrance?.brand} · {RATING_LABELS[review.rating]}</div>
        {review.text && <p style={{ fontSize: '0.82rem', color: 'var(--fg-soft)', marginTop: 6, lineHeight: 1.7 }}>{review.text}</p>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="blend-card-btn" onClick={() => setEditing(true)}>Edit</button>
        <button type="button" className="blend-card-btn" onClick={() => openSampleModal(`${review.fragrance?.name}, ${review.fragrance?.brand}`)}>Reorder</button>
      </div>
    </div>
  );
}

// ─── QUIZ PANEL ─────────────────────────────────────────────────────
function QuizPanel({ savedResult, onSave, openSampleModal, openSourceModal }) {
  const { buildUserContext } = useApp();
  const [phase, setPhase] = useState(savedResult ? 'result' : 'start');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(savedResult ?? null);
  const [error, setError] = useState(null);

  function start() {
    setPhase('asking'); setStep(0); setAnswers([]); setResult(null); setError(null);
  }
  function retake() { start(); }

  async function selectAnswer(answer) {
    const next = [...answers, answer];
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }
    setPhase('thinking');
    try {
      const r = await api('/api/ai/quiz', {
        method: 'POST',
        body: { questions: QUESTIONS.map(q => q.q), answers: next, userContext: buildUserContext() },
      });
      trackEvent('quiz_complete', { result: r.name });
      setResult(r);
      setPhase('result');
      onSave(r).catch(() => {});
    } catch (e) {
      setError(e.message || 'Quiz failed');
      setPhase('asking');
    }
  }

  return (
    <div className="profile-panel" id="personalize">
      <p className="profile-panel-label">Scent Personalization</p>
      <h2 className="profile-panel-title">Find Your Signature</h2>
      <p className="profile-panel-sub">5 questions. A curated recommendation built for you.</p>

      {phase === 'start' && (
        <div className="quiz-start">
          <div className="quiz-start-icon">✦</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--taupe)', maxWidth: 300, margin: '0 auto 28px', lineHeight: 1.8 }}>
            Tell us how you want to smell, feel, and be remembered, we'll find your match.
          </p>
          <button type="button" className="quiz-btn-start" onClick={start}>Begin the Quiz</button>
        </div>
      )}

      {phase === 'asking' && (
        <>
          <div className="quiz-progress">
            <div className="quiz-progress-bar"><div className="quiz-progress-fill" style={{ width: `${(step / QUESTIONS.length) * 100}%` }} /></div>
            <p className="quiz-progress-label">Question {step + 1} of {QUESTIONS.length}</p>
          </div>
          <div className="quiz-question">
            <p className="quiz-q-num">0{step + 1}</p>
            <p className="quiz-q-text">{QUESTIONS[step].q}</p>
            <div className="quiz-options">
              {QUESTIONS[step].options.map(o => (
                <button key={o} type="button" className="quiz-option" onClick={() => selectAnswer(o)}>{o}</button>
              ))}
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
        </>
      )}

      {phase === 'thinking' && <QuizThinking />}

      {phase === 'result' && result && (
        <div className="quiz-result">
          <div className="quiz-progress">
            <div className="quiz-progress-bar"><div className="quiz-progress-fill" style={{ width: '100%' }} /></div>
            <p className="quiz-progress-label">Your recommendation</p>
          </div>
          <p className="quiz-result-intro">Your signature scent is:</p>
          <h3 className="quiz-result-title"><em>{result.name}</em></h3>
          <p className="quiz-result-brand">{result.brand}</p>
          <StreamText as="p" className="quiz-result-desc" text={result.description} />
          <WhyThisRec reasoning={result.reasoning} />
          <div className="quiz-result-tags">
            {(result.tags ?? []).map(t => <span key={t} className="quiz-result-tag">{t}</span>)}
          </div>
          <div className="quiz-result-actions">
            <button type="button" className="btn-dark" onClick={() => openSampleModal(`${result.name}, ${result.brand}`)}>Order a Sample</button>
            <button type="button" className="quiz-retake" onClick={() => openSourceModal(`${result.name}, ${result.brand}`)}>Source full bottle</button>
            <button type="button" className="quiz-retake" onClick={retake}>Retake quiz</button>
          </div>

          {Array.isArray(result.alternates) && result.alternates.length > 0 && (
            <div className="quiz-alternates">
              <p className="quiz-alternates-label">Also worth sampling</p>
              <p className="quiz-alternates-sub">Order all three as 2ml decants and live with them for a couple of weeks before deciding. That's the best way to find your real signature.</p>
              <div className="quiz-alternates-list">
                {result.alternates.map((alt, i) => {
                  const label = `${alt.name}, ${alt.brand}`;
                  return (
                    <div key={i} className="quiz-alt-card">
                      <div className="quiz-alt-info">
                        <p className="quiz-alt-brand">{alt.brand}</p>
                        <h4 className="quiz-alt-name">{alt.name}</h4>
                        <p className="quiz-alt-why">{alt.why}</p>
                        <p className="quiz-alt-match">✦ {alt.match}</p>
                      </div>
                      <div className="quiz-alt-actions">
                        <button type="button" className="sample-btn" onClick={() => openSampleModal(label)}>Order Sample</button>
                        <button type="button" className="source-link" style={{ borderTop: 'none', padding: '4px 0 0' }} onClick={() => openSourceModal(label)}>or full bottle →</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Rotates four "thinking" stages while the quiz API call is in flight.
 * Makes the wait feel deliberate, the model is actually reading the
 * answers, cross-referencing the wardrobe, weighing options, rather
 * than canned. ~3.6 seconds full rotation; loops if the call takes
 * longer.
 */
function QuizThinking() {
  const { user } = useApp();
  const stages = user ? [
    'Reading your answers',
    'Cross-referencing your wardrobe',
    'Weighing the options',
    'Drafting your match',
  ] : [
    'Reading your answers',
    'Mapping your preferences',
    'Weighing the catalog',
    'Drafting your match',
  ];
  const label = useThinkingStages(true, stages);
  return (
    <div className="quiz-thinking">
      <div className="quiz-thinking-icon">◈</div>
      <p className="quiz-thinking-text">{label || 'Crafting your recommendation'}…</p>
    </div>
  );
}
