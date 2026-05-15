import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';

const QUIZ_COLORS = ['#7a5c40','#4a6855','#9a7030','#503868','#5a4a70','#3a5858','#6a4830','#485a3a'];

const QUESTIONS = [
  { q: "How do you want people to feel when you walk into the room?", options: ["Intrigued — they can't quite place it","Impressed — undeniably confident","Comforted — warm and approachable","Captivated — romantic and mysterious"] },
  { q: "What's your go-to setting?", options: ["Outdoors — fresh air, open spaces","The office — sharp, put-together","A dinner out — dressed up, present","Late nights — dim light, good music"] },
  { q: "Which texture speaks to you?", options: ["Silk — smooth and clean","Leather — dark and structured","Velvet — rich and soft","Linen — light and effortless"] },
  { q: "Pick a season for your signature scent:", options: ["Spring — green and floral","Summer — citrus and light","Fall — spiced and warm","Winter — deep and smoky"] },
  { q: "How long do you want your scent to last?", options: ["All day — I want presence","A few hours — subtle is fine","I'll reapply — I like control","As long as possible — leave a trail"] }
];

export function ProfilePage() {
  const { user, authLoading, logout, fragrances, wishlistIds, toggleWishlist, openSampleModal, openSourceModal, showToast, saveQuizResult } = useApp();

  useEffect(() => { document.body.classList.remove('dark'); }, []);

  if (authLoading) return (<><Nav theme="light"/><div className="profile-gate"><p>Loading…</p></div></>);

  if (!user) {
    return (
      <>
        <Nav theme="light" />
        <div className="profile-gate">
          <div className="profile-gate-icon">✦</div>
          <h1 className="profile-gate-title">Sign in to access your <em>profile.</em></h1>
          <p className="profile-gate-sub">Your wishlist and quiz result live in your account so they follow you between devices. Anything you saved before signing in will come with you.</p>
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
      <Nav theme="light" />

      <div className="profile-hero">
        <div>
          <p className="profile-hero-label">My Profile</p>
          <h1 className="profile-hero-title">Your wishlist &amp;<br/><em>personalized picks.</em></h1>
          <p className="profile-hero-email">{user.email}</p>
          <button type="button" className="logout-link" onClick={logout}>Sign out</button>
        </div>
        <button type="button" className="personalize-btn" onClick={() => document.getElementById('personalize')?.scrollIntoView({ behavior: 'smooth' })}>
          <span className="personalize-icon">✦</span>Personalize My Scent
        </button>
      </div>

      <div className="profile-layout">
        <WishlistPanel fragrances={fragrances} wishlistIds={wishlistIds} toggleWishlist={toggleWishlist} openSampleModal={openSampleModal} openSourceModal={openSourceModal} />
        <QuizPanel
          savedResult={user.quizResult}
          onSave={async (r) => { await saveQuizResult(r); showToast('<span>Result saved</span> to your profile'); }}
          openSampleModal={openSampleModal}
          openSourceModal={openSourceModal}
        />
      </div>
    </>
  );
}

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
                <button type="button" className="wishlist-action sample" onClick={() => openSampleModal(`${p.name} — ${p.brand}`)}>Sample</button>
                <button type="button" className="wishlist-action source" onClick={() => openSourceModal(`${p.name} — ${p.brand}`)} title="Source the full bottle">Bottle</button>
                <button type="button" className="wishlist-action remove" onClick={() => toggleWishlist(p.id)} aria-label="Remove">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuizPanel({ savedResult, onSave, openSampleModal, openSourceModal }) {
  const [phase, setPhase] = useState(savedResult ? 'result' : 'start');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(savedResult ?? null);
  const [error, setError] = useState(null);

  function start() {
    setPhase('asking'); setStep(0); setAnswers([]); setResult(null); setError(null);
  }
  function retake() {
    start();
  }

  async function selectAnswer(answer) {
    const next = [...answers, answer];
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }
    setPhase('thinking');
    try {
      const r = await api('/api/ai/quiz', { method: 'POST', body: { questions: QUESTIONS.map(q => q.q), answers: next } });
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
            Tell us how you want to smell, feel, and be remembered — we'll find your match.
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

      {phase === 'thinking' && (
        <div className="quiz-thinking">
          <div className="quiz-thinking-icon">◈</div>
          <p className="quiz-thinking-text">Crafting your recommendation…</p>
        </div>
      )}

      {phase === 'result' && result && (
        <div className="quiz-result">
          <div className="quiz-progress">
            <div className="quiz-progress-bar"><div className="quiz-progress-fill" style={{ width: '100%' }} /></div>
            <p className="quiz-progress-label">Your recommendation</p>
          </div>
          <p className="quiz-result-intro">Your signature scent is:</p>
          <h3 className="quiz-result-title"><em>{result.name}</em></h3>
          <p className="quiz-result-brand">{result.brand}</p>
          <p className="quiz-result-desc">{result.description}</p>
          <div className="quiz-result-tags">
            {(result.tags ?? []).map(t => <span key={t} className="quiz-result-tag">{t}</span>)}
          </div>
          <div className="quiz-result-actions">
            <button type="button" className="btn-dark" onClick={() => openSampleModal(`${result.name} — ${result.brand}`)}>Order a Sample</button>
            <button type="button" className="quiz-retake" onClick={() => openSourceModal(`${result.name} — ${result.brand}`)}>Source full bottle</button>
            <button type="button" className="quiz-retake" onClick={retake}>Retake quiz</button>
          </div>

          {Array.isArray(result.alternates) && result.alternates.length > 0 && (
            <div className="quiz-alternates">
              <p className="quiz-alternates-label">Also worth sampling</p>
              <p className="quiz-alternates-sub">Order all three as 2ml decants and live with them for a couple of weeks before deciding. That's the best way to find your real signature.</p>
              <div className="quiz-alternates-list">
                {result.alternates.map((alt, i) => {
                  const label = `${alt.name} — ${alt.brand}`;
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
