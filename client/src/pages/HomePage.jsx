import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { BackToTop } from '../components/BackToTop.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { HeroBottle, SotwBottle } from '../components/BottleSvg.jsx';
import { NewsletterStrip } from '../components/NewsletterStrip.jsx';
import { ExitIntentModal } from '../components/ExitIntentModal.jsx';
import { Marquee } from '../components/ui/Marquee.jsx';
import { BorderBeam } from '../components/ui/BorderBeam.jsx';
import { ProductRevealCard } from '../components/ui/ProductRevealCard.jsx';
import { GlowCard } from '../components/ui/GlowCard.jsx';
import { QuizMatchCard } from '../components/QuizMatchCard.jsx';
import { BasedOnSampledRow } from '../components/BasedOnSampledRow.jsx';
import { TodaysEdit } from '../components/TodaysEdit.jsx';
import { TheVault } from '../components/TheVault.jsx';
import { WishlistRecsRow } from '../components/WishlistRecsRow.jsx';
import { RecentlyViewedRow } from '../components/RecentlyViewedRow.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useScrollReveal } from '../hooks/useScrollReveal.js';
import { useDocumentMeta } from '../lib/seo.js';
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

  useDocumentMeta({
    title: 'Wear Your Story',
    description: 'Curated niche and designer fragrance samples. Discover your scent in 2ml, 5ml, 10ml, or 30ml decants, authenticated, decanted, delivered. Source full bottles at a discount.',
  });

  // Theme is now centralized in AppContext, page no longer touches body.dark.

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
      <Nav />

      <section className="hero">
        <div className="hero-left">
          <p className="hero-eyebrow">Samples From 2ml · Niche &amp; Designer</p>
          <h1 className="hero-title">Try before<br/><em>you commit</em><br/>to the bottle.</h1>
          <p className="hero-sub">Sample any niche or designer fragrance in 2ml, 5ml, 10ml, or 30ml, authentic, decanted from full bottles. Find your signature without gambling $300 on a guess.</p>
          <div className="hero-actions">
            <Link to="/shop" className="btn-dark">Browse &amp; Sample</Link>
            <Link to="/profile#personalize" className="btn-ghost">Find My Scent</Link>
          </div>
        </div>
      </section>

      <NewsletterStrip />

      <TodaysEdit />

      <TheVault />

      {/* Personalization rows, render only when there's data to show.
          Each component returns null for empty states so we don't end
          up with three empty section headers on the homepage for new
          guests. */}
      <QuizMatchCard />
      <BasedOnSampledRow />
      <RecentlyViewedRow />
      <WishlistRecsRow />

      <section className="sotw">
        <div>
          <div className="sotw-badge"><div className="sotw-dot" /><span className="sotw-label">Scent of the Week</span></div>
          <h2 className="sotw-title">Baccarat Rouge 540</h2>
          <p className="sotw-brand">Maison Francis Kurkdjian</p>
          <p className="sotw-desc">The fragrance that redefined modern luxury. An incandescent amber floral, jasmine and saffron over a cedar and ambergris base that glows for hours on skin.</p>
          <div className="sotw-notes">
            <span className="sotw-note">Jasmine</span><span className="sotw-note">Saffron</span><span className="sotw-note">Ambergris</span><span className="sotw-note">Cedar</span>
          </div>
          <button className="btn-dark" type="button" onClick={() => openSampleModal('Baccarat Rouge 540, Maison Francis Kurkdjian')}>Order a 2ml Sample</button>
          <button type="button" className="source-link" style={{ display: 'inline-block', width: 'auto', marginLeft: 12, borderTop: 'none', padding: 0, color: 'rgba(245,240,232,0.45)' }} onClick={() => openSourceModal('Baccarat Rouge 540, Maison Francis Kurkdjian')}>or full bottle →</button>
        </div>
        <div className="sotw-card-wrap">
          <ProductRevealCard
            fragrance={{
              name: 'Baccarat Rouge 540',
              brand: 'Maison Francis Kurkdjian',
              family: 'Oriental',
              top: 'Jasmine, Saffron',
              heart: 'Amberwood, Ambergris',
              base: 'Fir Resin, Cedar',
              season: ['Fall', 'Winter'],
            }}
            description="The fragrance that redefined modern luxury. An incandescent amber floral, jasmine and saffron over a cedar and ambergris base that glows for hours on skin."
            onOrderSample={() => openSampleModal('Baccarat Rouge 540, Maison Francis Kurkdjian')}
            onSourceBottle={() => openSourceModal('Baccarat Rouge 540, Maison Francis Kurkdjian')}
          />
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
        <div className="tools-grid tools-grid--glow">
          <GlowCard customSize glowColor="gold" className="tool-glow">
            <Link to="/tools" className="tool-glow-content">
              <span className="tool-icon">◈</span>
              <h3 className="tool-name">Layer Builder</h3>
              <p className="tool-desc">Combine 2 to 4 fragrances and get an AI analysis of how they interact, blend name, character, and wear occasions.</p>
              <span className="tool-arrow">Try it →</span>
            </Link>
          </GlowCard>
          <GlowCard customSize glowColor="gold" className="tool-glow">
            <Link to="/shop#finder" className="tool-glow-content">
              <span className="tool-icon">⌕</span>
              <h3 className="tool-name">Scent Finder</h3>
              <p className="tool-desc">Filter by notes family, season, time of day, or mood. Don't know the name, find it by feeling instead.</p>
              <span className="tool-arrow">Explore →</span>
            </Link>
          </GlowCard>
          <GlowCard customSize glowColor="gold" className="tool-glow">
            <Link to="/profile#personalize" className="tool-glow-content">
              <span className="tool-icon">✦</span>
              <h3 className="tool-name">Scent Quiz</h3>
              <p className="tool-desc">Answer 5 questions about your personality, lifestyle, and preferences, get a curated recommendation.</p>
              <span className="tool-arrow">Personalize →</span>
            </Link>
          </GlowCard>
          <GlowCard customSize glowColor="gold" className="tool-glow">
            <Link to="/shop#calc" className="tool-glow-content">
              <span className="tool-icon">⏱</span>
              <h3 className="tool-name">Spray Calculator</h3>
              <p className="tool-desc">Pick a bottle size and your daily sprays, find out exactly how long it lasts and what lifestyle it fits.</p>
              <span className="tool-arrow">Calculate →</span>
            </Link>
          </GlowCard>
        </div>
      </section>

      <section className="fotm">
        <div className="fotm-inner">
          <div className="fotm-left">
            <p className="fotm-badge">Coming Soon</p>
            <h2 className="fotm-title">The Monthly<br/><em className="gradient-em">Scent Club.</em></h2>
            <p className="fotm-body">Every month, one bottle. Sourced, authenticated, and delivered to your door at a members-only price. Niche and designer picks you'd never find on your own, curated for those who take fragrance seriously.</p>
            <div className="fotm-perks">
              <div className="fotm-perk"><div><strong>Monthly drop</strong><span>One full-size bottle, sourced exclusively for members</span></div></div>
              <div className="fotm-perk"><div><strong>Members pricing</strong><span>Significantly below retail, always</span></div></div>
              <div className="fotm-perk"><div><strong>Authenticated</strong><span>Every bottle verified before it ships</span></div></div>
              <div className="fotm-perk"><div><strong>Personalized</strong><span>Picks informed by your quiz results and preferences</span></div></div>
            </div>
            <div className="fotm-form">
              <input className="fotm-input" id="fotmEmail" placeholder="Your email address" type="email" />
              <button className="fotm-btn" type="button" onClick={() => joinWaitlist('fotm', 'fotmEmail')}>Join the Waitlist</button>
            </div>
            <p className="fotm-note">Be first to know when we launch. No spam, just the drop announcement.</p>
          </div>
          <div className="fotm-right">
            <div className="fotm-card">
              <div className="fotm-card-label">October Drop, Preview</div>
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

      <BackToTop />
      <ExitIntentModal />
    </>
  );
}
