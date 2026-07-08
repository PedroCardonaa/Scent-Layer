import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { BackToTop } from '../components/BackToTop.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { TrustStrip } from '../components/TrustStrip.jsx';
import { DiscoverySets } from '../components/DiscoverySets.jsx';
import { ExitIntentModal } from '../components/ExitIntentModal.jsx';
import { QuizMatchCard } from '../components/QuizMatchCard.jsx';
import { BasedOnSampledRow } from '../components/BasedOnSampledRow.jsx';
import { TodaysEdit } from '../components/TodaysEdit.jsx';
import { WishlistRecsRow } from '../components/WishlistRecsRow.jsx';
import { RecentlyViewedRow } from '../components/RecentlyViewedRow.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useScrollReveal } from '../hooks/useScrollReveal.js';
import { useDocumentMeta } from '../lib/seo.js';
import { api } from '../lib/api.js';

/**
 * Homepage, commerce-first and deliberately SHORT. The order is:
 * hero → trust strip → buyable product grid → starter sets → one
 * editorial block (Today's Edit) → personalization rows (render only
 * with data) → Scent Club (the single email capture) → footer.
 *
 * Removed on purpose (they tripled the scroll length): the newsletter
 * strip and waitlist section (both duplicated the Scent Club email
 * capture), the SOTW spotlight and Vault rail (both duplicated the
 * grid + Today's Edit), the marquees (decoration), and the tools promo
 * (Tools lives in the nav).
 */

const FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'niche', label: 'Niche', match: (p) => p.type === 'niche' },
  { key: 'designer', label: 'Designer', match: (p) => p.type === 'designer' },
  { key: 'Fresh', label: 'Fresh', match: (p) => p.family === 'Fresh' },
  { key: 'Oriental', label: 'Oriental', match: (p) => p.family === 'Oriental' },
  { key: 'Woody', label: 'Woody', match: (p) => p.family === 'Woody' },
];

export function HomePage() {
  const { fragrances, showToast } = useApp();
  const [filter, setFilter] = useState('all');
  const visible = useMemo(() => {
    const fn = FILTERS.find(f => f.key === filter)?.match ?? (() => true);
    return fragrances.filter(fn).slice(0, 8);
  }, [fragrances, filter]);

  useScrollReveal('.product-card,.reveal', [visible.length]);

  useDocumentMeta({
    title: 'Wear Your Story',
    description: 'Curated niche and designer fragrance samples. Discover your scent in 2ml, 5ml, 10ml, or 30ml decants, authenticated, decanted, delivered. Source full bottles at a discount.',
  });

  async function joinWaitlist(type, inputId) {
    const el = document.getElementById(inputId);
    const email = el?.value?.trim();
    if (!email || !email.includes('@')) { showToast('Please enter a valid email'); return; }
    try {
      const r = await api('/api/waitlist', { method: 'POST', body: { email, type } });
      if (el) el.value = '';
      showToast(r?.promoCode
        ? `<span>You're on the list!</span> Take ${r.promoCode} for 10% off your first order.`
        : '<span>You\'re on the list!</span> We\'ll be in touch at launch.');
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

      <TrustStrip />

      {/* Products first — the shelf is the pitch. */}
      <section className="section section-tight" id="collection">
        <div className="section-header">
          <div><p className="section-label">The Collection</p><h2 className="section-title">Niche &amp; designer favorites.</h2></div>
          <Link to="/shop" className="section-link">View all 61 →</Link>
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

      <DiscoverySets />

      <TodaysEdit />

      {/* Personalization rows, render only when there's data to show. */}
      <QuizMatchCard />
      <BasedOnSampledRow />
      <RecentlyViewedRow />
      <WishlistRecsRow />

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
            <p className="fotm-note">Joining gets you 10% off your first sample order. No spam.</p>
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
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <BackToTop />
      <ExitIntentModal />
    </>
  );
}
