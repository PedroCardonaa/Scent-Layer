import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { StreamText } from '../components/StreamText.jsx';
import { WhyThisRec } from '../components/WhyThisRec.jsx';
import { WardrobeInsight } from '../components/WardrobeInsight.jsx';
import { WardrobeStats } from '../components/WardrobeStats.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { useThinkingStages } from '../hooks/useThinkingStages.js';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';
import { trackEvent } from '../lib/analytics.js';
import { getFragranceImage } from '../lib/fragrance-images.js';
import { FROM_PRICE_CENTS, formatMoney } from '../lib/pricing.js';

function ReferralBlock({ showToast }) {
  const { user } = useApp();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    api('/api/referrals/me', { auth: true })
      .then(d => { if (!cancelled) setInfo(d); })
      .catch(() => { /* silent, fall back to waitlist UI */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  async function copyLink() {
    if (!info?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(info.shareUrl);
      showToast('<span>Link copied.</span> Send it to whoever has bad taste in fragrance.');
    } catch {
      showToast('Could not copy. Long-press to copy manually.');
    }
  }

  async function shareLink() {
    if (!info?.shareUrl) return;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Scent Layer',
          text: 'Sample niche and designer fragrances before committing. Use my link for 15% off your first order.',
          url: info.shareUrl,
        });
        return;
      } catch { /* fall through to copy */ }
    }
    copyLink();
  }

  if (loading) return null;

  // Signed-in users get the real referral panel. Signed-out viewers
  // (which won't normally see ProfilePage anyway, but just in case)
  // fall back to the waitlist UI from before.
  if (info?.code) {
    return (
      <section className="referral">
        <div className="referral-inner">
          <h2 className="referral-title">Refer a friend,<br/><em className="gradient-em">both smell better.</em></h2>
          <p className="referral-body">Send your link to a friend. They get <strong>15% off</strong> their first order. You get credit toward future bottles.</p>
          <div className="referral-link-row">
            <code className="referral-link-text">{info.shareUrl}</code>
            <button type="button" className="referral-link-btn" onClick={copyLink}>Copy</button>
            <button type="button" className="referral-link-btn" onClick={shareLink}>Share</button>
          </div>
          <p className="fotm-note">{info.redemptions || 0} friend{info.redemptions === 1 ? '' : 's'} have used your link so far.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="referral">
      <div className="referral-inner">
        <h2 className="referral-title">Refer a friend,<br/><em className="gradient-em">both smell better.</em></h2>
        <p className="referral-body">Sign in to get your personal referral link. Friends save 15% on their first order.</p>
      </div>
    </section>
  );
}

const QUIZ_COLORS = ['#7a5c40','#4a6855','#9a7030','#503868','#5a4a70','#3a5858','#6a4830','#485a3a'];

// Quiz now ships with atmospheric mood photography per question and
// richer, more specific question copy. The result endpoint is
// unchanged, the experience is denser.
const QUESTIONS = [
  {
    q: "How do you want people to feel when you walk into the room?",
    sub: "There's no wrong answer, just the one that's most you.",
    bg: "https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=1600&h=900&fit=crop&q=80",
    options: [
      "Intrigued, they can't quite place it",
      "Impressed, undeniably confident",
      "Comforted, warm and approachable",
      "Captivated, romantic and mysterious",
    ],
  },
  {
    q: "What's your default setting?",
    sub: "Where do you spend the bulk of your week.",
    bg: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1600&h=900&fit=crop&q=80",
    options: [
      "Outdoors, fresh air, open spaces",
      "The office, sharp, put-together",
      "A dinner out, dressed up, present",
      "Late nights, dim light, good music",
    ],
  },
  {
    q: "Which texture speaks to you?",
    sub: "Trust the gut answer.",
    bg: "https://images.unsplash.com/photo-1582038944307-46f17d0cb84e?w=1600&h=900&fit=crop&q=80",
    options: [
      "Silk, smooth and clean",
      "Leather, dark and structured",
      "Velvet, rich and soft",
      "Linen, light and effortless",
    ],
  },
  {
    q: "Pick a season for your signature scent.",
    sub: "Even if you wear it year-round, the season is the soul.",
    bg: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=1600&h=900&fit=crop&q=80",
    options: [
      "Spring, green and floral",
      "Summer, citrus and light",
      "Fall, spiced and warm",
      "Winter, deep and smoky",
    ],
  },
  {
    q: "How long do you want your scent to last?",
    sub: "Projection and longevity are independent. Pick what matters more.",
    bg: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&h=900&fit=crop&q=80",
    options: [
      "All day, I want presence",
      "A few hours, subtle is fine",
      "I'll reapply, I like control",
      "As long as possible, leave a trail",
    ],
  },
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
function WishlistPanel({ fragrances, wishlistIds, toggleWishlist, openSampleModal }) {
  const { addToCart, openCart, showToast } = useApp();
  const items = useMemo(() => fragrances.filter(c => wishlistIds.includes(c.id)), [fragrances, wishlistIds]);

  function quickAdd(p) {
    addToCart({ fragranceId: p.id, name: p.name, brand: p.brand, size: '5ml', qty: 1 });
    showToast(`<span>Added</span> 5ml of ${p.name}`);
    openCart();
  }

  return (
    <div className="profile-panel">
      <p className="profile-panel-label">Saved Fragrances</p>
      <h2 className="profile-panel-title">My Wishlist</h2>
      <p className="profile-panel-sub">Everything you've saved, ready to sample. Add to cart in a tap.</p>
      {items.length === 0 ? (
        <div className="wishlist-empty">
          <div className="wishlist-empty-icon">♡</div>
          <p className="wishlist-empty-text">Your wishlist is empty</p>
          <p className="wishlist-empty-sub">Tap the heart on any fragrance to save it here</p>
          <Link to="/shop" className="btn-dark" style={{ marginTop: 20, display: 'inline-block' }}>Browse the catalog</Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map((p) => (
            <article key={p.id} className="wl-card">
              <Link to={`/fragrance/${p.id}`} className="wl-card-thumb" aria-label={`Open ${p.name}`}>
                <img src={getFragranceImage(p)} alt={`${p.name} by ${p.brand}`} loading="lazy" />
                <button
                  type="button"
                  className="wl-card-heart"
                  onClick={(e) => { e.preventDefault(); toggleWishlist(p.id); }}
                  aria-label="Remove from wishlist"
                  title="Remove"
                >♥</button>
              </Link>
              <div className="wl-card-body">
                <Link to={`/fragrance/${p.id}`} className="wl-card-brand-link">
                  <p className="wl-card-brand">{p.brand}</p>
                  <p className="wl-card-name">{p.name}</p>
                </Link>
                <p className="wl-card-price">from {formatMoney(FROM_PRICE_CENTS)}</p>
                <div className="wl-card-actions">
                  <button type="button" className="wl-card-add" onClick={() => quickAdd(p)}>Add 5ml</button>
                  <button type="button" className="wl-card-sample" onClick={() => openSampleModal(`${p.name}, ${p.brand}`)}>Other sizes</button>
                </div>
              </div>
            </article>
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
        <EmptyState
          title="Your wardrobe is empty"
          sub="Mark what you own, what you've sampled, and what needs a backup. It starts with one fragrance."
          action={{ to: '/shop', label: 'Browse the catalog' }}
        />
      </div>
    );
  }

  return (
    <div className="profile-panel">
      <p className="profile-panel-label">Your Fragrance Inventory</p>
      <h2 className="profile-panel-title">My Wardrobe</h2>
      <p className="profile-panel-sub">A snapshot of what you wear. Use it to plan rotations and reorders.</p>
      <WardrobeStats />
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
        <EmptyState
          title="No saved blends yet"
          sub="Combine 2 to 4 fragrances in the Layer Builder, then save the ones worth keeping. They land here."
          action={{ to: '/tools', label: 'Open Layer Builder' }}
        />
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
        <EmptyState
          title="No reviews yet"
          sub="Mark something sampled in your wardrobe and a review form appears here. Your verdicts tune every recommendation."
          action={{ to: '/shop', label: 'Find something to sample' }}
        />
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
          <div
            className="quiz-question quiz-question-rich"
            style={{ '--quiz-bg': `url(${QUESTIONS[step].bg})` }}
            key={step}
          >
            <div className="quiz-question-overlay" aria-hidden="true" />
            <div className="quiz-question-content">
              <p className="quiz-q-num">0{step + 1}</p>
              <p className="quiz-q-text">{QUESTIONS[step].q}</p>
              {QUESTIONS[step].sub && (
                <p className="quiz-q-sub">{QUESTIONS[step].sub}</p>
              )}
              <div className="quiz-options">
                {QUESTIONS[step].options.map(o => (
                  <button key={o} type="button" className="quiz-option" onClick={() => selectAnswer(o)}>{o}</button>
                ))}
              </div>
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
