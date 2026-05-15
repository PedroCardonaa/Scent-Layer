import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { HeroBottle, SotwBottle } from '../components/BottleSvg.jsx';
import { Marquee } from '../components/ui/Marquee.jsx';
import { BorderBeam } from '../components/ui/BorderBeam.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useScrollReveal } from '../hooks/useScrollReveal.js';
import { api } from '../lib/api.js';

const FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'niche', label: 'Niche', match: (p) => p.type === 'niche' },
  { key: 'designer', label: 'Designer', match: (p) => p.type === 'designer' },
  { key: 'Fresh', label: 'Fresh', match: (p) => p.family === 'Fresh' },
  { key: 'Oriental', label: 'Oriental', match: (p) => p.family === 'Oriental' },
  { key: 'Woody', label: 'Woody', match: (p) => p.family === 'Woody' },
];

export function HomePage() {
  const { fragrances, openSampleModal, openSourceModal, showToast } = useApp();
  const [filter, setFilter] = useState('all');
  const visible = useMemo(() => {
    const fn = FILTERS.find(f => f.key === filter)?.match ?? (() => true);
    return fragrances.filter(fn).slice(0, 8);
  }, [fragrances, filter]);

  useScrollReveal('.product-card,.tool-card,.note-card,.mission-value,.proof-card,.reveal', [visible.length]);

  useEffect(() => { document.body.classList.remove('dark'); }, []);

  async function joinWaitlist(type, inputId) {
    const el = document.getElementById(inputId);
    const email = el?.value?.trim();
    if (!email || !email.includes('@')) { showToast('Please enter a valid email'); return; }
    try {
      await api('/api/waitlist', { method: 'POST', body: { email, type } });
      if (el) el.value = '';
      showToast('<span>You\'re on the list!</span> We\'ll be in touch at launch.');
    } catch (e) { showToast(e.message); }
  }

  return (
    <>
      <div className="demo-banner">✦ Live Demo<span>·</span>Scent Layer — Coming Soon<span>·</span>Sample Niche & Designer Fragrances From 2ml</div>
      <Nav theme="light" />

      <section className="hero">
        <div className="hero-left">
          <p className="hero-eyebrow">Samples From 2ml · Niche &amp; Designer</p>
          <h1 className="hero-title">Try before<br/><em>you commit</em><br/>to the bottle.</h1>
          <p className="hero-sub">Sample any niche or designer fragrance in 2ml, 5ml, 10ml, or 30ml — authentic, decanted from full bottles. Find your signature without gambling $300 on a guess.</p>
          <div className="hero-actions">
            <Link to="/shop" className="btn-dark">Browse &amp; Sample</Link>
            <Link to="/profile#personalize" className="btn-ghost">Find My Scent</Link>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-orb orb-1" />
          <div className="hero-orb orb-2" />
          <div className="hero-bottle"><HeroBottle /></div>
        </div>
      </section>

      <section className="sotw">
        <div>
          <div className="sotw-badge"><div className="sotw-dot" /><span className="sotw-label">Scent of the Week</span></div>
          <h2 className="sotw-title">Baccarat Rouge 540</h2>
          <p className="sotw-brand">Maison Francis Kurkdjian</p>
          <p className="sotw-desc">The fragrance that redefined modern luxury. An incandescent amber floral — jasmine and saffron over a cedar and ambergris base that glows for hours on skin.</p>
          <div className="sotw-notes">
            <span className="sotw-note">Jasmine</span><span className="sotw-note">Saffron</span><span className="sotw-note">Ambergris</span><span className="sotw-note">Cedar</span>
          </div>
          <button className="btn-dark" type="button" onClick={() => openSampleModal('Baccarat Rouge 540 — Maison Francis Kurkdjian')}>Order a 2ml Sample</button>
          <button type="button" className="source-link" style={{ display: 'inline-block', width: 'auto', marginLeft: 12, borderTop: 'none', padding: 0, color: 'rgba(245,240,232,0.45)' }} onClick={() => openSourceModal('Baccarat Rouge 540 — Maison Francis Kurkdjian')}>or full bottle →</button>
        </div>
        <div className="sotw-visual">
          <SotwBottle />
          <BorderBeam size={260} duration={9} colorFrom="#c9a96e" colorTo="#e8d5a8" />
        </div>
      </section>

      <div className="marquee-wrapper">
        <Marquee duration="40s" gap="2.25rem" pauseOnHover repeat={4} className="py-2">
          {['2ml · 5ml · 10ml · 30ml','Niche Fragrances','Designer Houses','Samples From 2ml','Creed · Byredo · Le Labo','MFK · Maison Margiela','Authenticated · Decanted','Or Source Full Bottles'].map((t, j) => (
            <span key={j} className="marquee-item"><span className="marquee-dot" />{t}</span>
          ))}
        </Marquee>
        <Marquee duration="55s" gap="2.25rem" reverse pauseOnHover repeat={4} className="py-2 opacity-50">
          {['Editorial Decants','Sample First','Then Commit','Le Labo · Byredo','Tom Ford · Dior','Frederic Malle · Diptyque','Hand-Decanted','Glass Atomizers'].map((t, j) => (
            <span key={j} className="marquee-item"><span className="marquee-dot" />{t}</span>
          ))}
        </Marquee>
      </div>

      <section className="section" id="collection">
        <div className="section-header">
          <div><p className="section-label">The Collection</p><h2 className="section-title">Niche &amp; <em>designer</em><br/>favorites.</h2></div>
          <Link to="/shop" className="section-link">View All →</Link>
        </div>
        <div className="filter-bar">
          {FILTERS.map(f => (
            <button key={f.key} type="button" className={`filter-pill ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
          ))}
        </div>
        <div className="product-grid">
          {visible.map(p => <ProductCard key={p.id} fragrance={p} />)}
        </div>
      </section>

      <section className="tools-promo">
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div><p className="section-label">Tools</p><h2 className="section-title">Built to help you<br/><em>find your scent.</em></h2></div>
        </div>
        <div className="tools-grid">
          <Link to="/tools" className="tool-card"><span className="tool-icon">◈</span><h3 className="tool-name">Layer Builder</h3><p className="tool-desc">Combine 2–4 fragrances and get an AI analysis of how they interact — blend name, character, and wear occasions.</p><span className="tool-arrow">Try it →</span></Link>
          <Link to="/shop#finder" className="tool-card"><span className="tool-icon">⌕</span><h3 className="tool-name">Scent Finder</h3><p className="tool-desc">Filter by notes family, season, time of day, or mood. Don't know the name — find it by feeling instead.</p><span className="tool-arrow">Explore →</span></Link>
          <Link to="/profile#personalize" className="tool-card"><span className="tool-icon">✦</span><h3 className="tool-name">Scent Quiz</h3><p className="tool-desc">Answer 5 questions about your personality, lifestyle, and preferences — get a curated recommendation.</p><span className="tool-arrow">Personalize →</span></Link>
          <Link to="/shop#calc" className="tool-card"><span className="tool-icon">⏱</span><h3 className="tool-name">Spray Calculator</h3><p className="tool-desc">Pick a bottle size and your daily sprays — find out exactly how long it lasts and what lifestyle it fits.</p><span className="tool-arrow">Calculate →</span></Link>
        </div>
      </section>

      <section className="social-proof">
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div><p className="section-label">Early Feedback</p><h2 className="section-title">What people<br/><em>are saying.</em></h2></div>
        </div>
        <div className="proof-grid">
          <div className="proof-card reveal"><div className="proof-stars">★★★★★</div><p className="proof-quote">"Found my signature scent in 5 minutes using the quiz. Never would have discovered Santal 33 on my own — now I get compliments every single day."</p><p className="proof-name">Marcus T. — Miami</p></div>
          <div className="proof-card reveal"><div className="proof-stars">★★★★★</div><p className="proof-quote">"The Layer Builder is genius. I combined Aventus and Tobacco Vanille and the analysis was spot on — it's become my winter evening blend."</p><p className="proof-name">Sofia R. — New York</p></div>
          <div className="proof-card reveal"><div className="proof-stars">★★★★★</div><p className="proof-quote">"Sampled three niche fragrances in 5ml decants before committing. Saved myself $400 on a Baccarat Rouge bottle that wasn't actually my thing. Layered Santal 33 instead — sourced the full bottle through them."</p><p className="proof-name">Jordan K. — Los Angeles</p></div>
        </div>
      </section>

      <section className="mission">
        <div className="mission-inner">
          <p className="section-label" style={{ color: 'var(--gold)', marginBottom: 28 }}>Our Mission</p>
          <blockquote className="mission-quote">"Fragrance is the fastest way to change how you <em className="gradient-em">carry yourself.</em>"</blockquote>
          <p className="mission-body">Scent Layer exists for one reason — to help you smell better and feel more confident. We curate the fragrances worth wearing, help you understand how they work, and source them for you at a price that makes sense. No boutique markup. No gatekeeping. Just the right scent for the right person.</p>
          <div className="mission-values">
            <div className="mission-value"><span className="mission-value-label">Curated</span></div>
            <div className="mission-value"><span className="mission-value-label">Sampled</span></div>
            <div className="mission-value"><span className="mission-value-label">Sourced</span></div>
            <div className="mission-value"><span className="mission-value-label">Authenticated</span></div>
          </div>
        </div>
      </section>

      <section className="notes-section">
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div><p className="section-label" style={{ color: 'var(--gold)' }}>The Architecture</p><h2 className="section-title" style={{ color: 'var(--cream)' }}>Every scent is<br/><em className="gradient-em">built in layers.</em></h2></div>
        </div>
        <div className="notes-grid">
          <div className="note-card"><span className="note-num">01</span><h3 className="note-name">Top Notes</h3><p className="note-desc">The opening act — bright, citrus, light florals. What you smell in the first 15 minutes.</p></div>
          <div className="note-card"><span className="note-num">02</span><h3 className="note-name">Heart Notes</h3><p className="note-desc">The soul of the fragrance. Florals, spices, green accords that emerge as the top fades.</p></div>
          <div className="note-card"><span className="note-num">03</span><h3 className="note-name">Base Notes</h3><p className="note-desc">What lingers for hours — woods, resins, musks that define your signature trail.</p></div>
          <div className="note-card"><span className="note-num">04</span><h3 className="note-name">Your Skin</h3><p className="note-desc">Every fragrance transforms uniquely on your chemistry. That's the final layer.</p></div>
        </div>
      </section>

      <section className="source-cta section">
        <p className="section-label" style={{ textAlign: 'center' }}>Try anything from 2ml — or skip straight to the full bottle.</p>
        <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 16 }}>Know what you<br/><em>want?</em></h2>
        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--taupe)', maxWidth: 460, margin: '0 auto 40px', lineHeight: 1.8 }}>Order a sample of any fragrance — designer, niche, or anything we don't list. Found your signature already? We'll source the full bottle at a discount.</p>
        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button type="button" className="btn-dark" onClick={() => openSampleModal('')}>Order a Sample</button>
          <button type="button" className="btn-ghost" onClick={() => openSourceModal('')}>Source a Full Bottle</button>
        </div>
      </section>

      <section className="fotm">
        <div className="fotm-inner">
          <div className="fotm-left">
            <p className="fotm-badge">Coming Soon</p>
            <h2 className="fotm-title">The Monthly<br/><em className="gradient-em">Scent Club.</em></h2>
            <p className="fotm-body">Every month, one bottle. Sourced, authenticated, and delivered to your door at a members-only price. Niche and designer picks you'd never find on your own — curated for those who take fragrance seriously.</p>
            <div className="fotm-perks">
              <div className="fotm-perk"><div><strong>Monthly drop</strong><span>One full-size bottle, sourced exclusively for members</span></div></div>
              <div className="fotm-perk"><div><strong>Members pricing</strong><span>Significantly below retail — always</span></div></div>
              <div className="fotm-perk"><div><strong>Authenticated</strong><span>Every bottle verified before it ships</span></div></div>
              <div className="fotm-perk"><div><strong>Personalized</strong><span>Picks informed by your quiz results and preferences</span></div></div>
            </div>
            <div className="fotm-form">
              <input className="fotm-input" id="fotmEmail" placeholder="Your email address" type="email" />
              <button className="fotm-btn" type="button" onClick={() => joinWaitlist('fotm', 'fotmEmail')}>Join the Waitlist</button>
            </div>
            <p className="fotm-note">Be first to know when we launch. No spam — just the drop announcement.</p>
          </div>
          <div className="fotm-right">
            <div className="fotm-card">
              <div className="fotm-card-label">October Drop — Preview</div>
              <div className="fotm-card-name">Tobacco Vanille</div>
              <div className="fotm-card-brand">Tom Ford Private Blend</div>
              <div className="fotm-card-notes">Tobacco · Vanilla · Tonka Bean</div>
              <div className="fotm-card-divider" />
              <div className="fotm-card-row"><span>Retail price</span><span className="fotm-strike">$295</span></div>
              <div className="fotm-card-row"><span>Member price</span><span className="fotm-price">Members only</span></div>
              <div className="fotm-card-footer">Join the waitlist to unlock pricing</div>
              <BorderBeam size={300} duration={10} colorFrom="#c9a96e" colorTo="#e8d5a8" />
              <BorderBeam size={300} duration={10} delay={5} colorFrom="#e8d5a8" colorTo="#c9a96e" />
            </div>
          </div>
        </div>
      </section>

      <section className="sourcing-detail">
        <div className="sourcing-header">
          <p className="section-label" style={{ color: 'var(--gold)' }}>Samples &amp; Authenticity</p>
          <h2 className="section-title" style={{ color: 'var(--cream)' }}>Authentic decants.<br/><em>Real bottles. Smaller pour.</em></h2>
        </div>
        <div className="sourcing-grid">
          <div className="sourcing-step reveal"><div className="sourcing-step-num">01</div><h3 className="sourcing-step-title">You order a sample</h3><p className="sourcing-step-desc">Pick a fragrance and a size — 2ml, 5ml, 10ml, or 30ml. Same juice as the boutique counter, just decanted into a wearable pour.</p></div>
          <div className="sourcing-step reveal"><div className="sourcing-step-num">02</div><h3 className="sourcing-step-title">We decant from authenticated stock</h3><p className="sourcing-step-desc">Every sample is poured from a verified bottle we've checked ourselves — batch codes, fill levels, packaging. No reformulations, no fakes.</p></div>
          <div className="sourcing-step reveal"><div className="sourcing-step-num">03</div><h3 className="sourcing-step-title">It ships to you</h3><p className="sourcing-step-desc">Glass atomizers, labeled with name and date filled. Shipped the same week. Try three at once and live with them for a few weeks.</p></div>
          <div className="sourcing-step reveal"><div className="sourcing-step-num">04</div><h3 className="sourcing-step-title">Love it? Get the bottle.</h3><p className="sourcing-step-desc">If you find your signature, we source the full bottle at a discount — typically 20–40% below retail. Or just reorder the sample size you wear most.</p></div>
        </div>
        <div className="auth-strip">
          <div className="auth-item"><div><strong>Decanted from authentics</strong><span>Every bottle batch-coded and verified before we pour</span></div></div>
          <div className="auth-divider" />
          <div className="auth-item"><div><strong>Sealed glass atomizers</strong><span>Labeled, dated, and pressure-tested before shipping</span></div></div>
          <div className="auth-divider" />
          <div className="auth-item"><div><strong>Satisfaction guaranteed</strong><span>Something off? We make it right — no questions</span></div></div>
        </div>
      </section>

      <section className="referral">
        <div className="referral-inner">
          <h2 className="referral-title">Refer a friend,<br/><em className="gradient-em">both smell better.</em></h2>
          <p className="referral-body">When we launch, every referral earns you and your friend a discount on your first sourcing order. The more people you bring in, the more you save. Fragrance is better shared anyway.</p>
          <div className="referral-form">
            <input className="fotm-input" id="referralEmail" placeholder="Your email — we'll send your referral link at launch" type="email" />
            <button className="fotm-btn" type="button" onClick={() => joinWaitlist('referral', 'referralEmail')}>Reserve My Spot</button>
          </div>
          <p className="fotm-note">Launch pricing and referral details coming soon.</p>
        </div>
      </section>

      <section className="waitlist">
        <div className="waitlist-inner">
          <p className="waitlist-eyebrow">We're launching soon</p>
          <h2 className="waitlist-title">Get notified<br/><em>first.</em></h2>
          <p className="waitlist-sub">Join the waitlist for early access, launch pricing, and the first monthly drop announcement.</p>
          <div className="waitlist-form">
            <input className="waitlist-input" id="waitlistEmail" placeholder="Your email address" type="email" />
            <button className="waitlist-btn" type="button" onClick={() => joinWaitlist('general', 'waitlistEmail')}>Notify Me</button>
          </div>
          <p className="waitlist-note">No spam. One email when we launch.</p>
        </div>
      </section>

      <Footer />
    </>
  );
}
