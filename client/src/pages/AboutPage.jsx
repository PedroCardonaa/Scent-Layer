import { useEffect } from 'react';
import { Nav } from '../components/Nav.jsx';
import { Footer } from '../components/Footer.jsx';
import { ParallaxScrolling } from '../components/ui/ParallaxScrolling.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

export function AboutPage() {
  const { openSampleModal, openSourceModal } = useApp();

  // Theme is now centralized in AppContext, page no longer touches body.dark.
  useScrollReveal('.reveal,.sourcing-step,.mission-value');

  return (
    <>
      <Nav />

      <ParallaxScrolling title="Scent" eyebrow="About Scent Layer" />

      <section className="mission">
        <div className="mission-inner">
          <p className="section-label" style={{ color: 'var(--gold)', marginBottom: 28 }}>Our Mission</p>
          <blockquote className="mission-quote">"Fragrance is the fastest way to change how you <em className="gradient-em">carry yourself.</em>"</blockquote>
          <p className="mission-body">Scent Layer exists for one reason, to help you smell better and feel more confident. We curate the fragrances worth wearing, help you understand how they work, and source them for you at a price that makes sense. No boutique markup. No gatekeeping. Just the right scent for the right person.</p>
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
          <div className="note-card"><span className="note-num">01</span><h3 className="note-name">Top Notes</h3><p className="note-desc">The opening act, bright, citrus, light florals. What you smell in the first 15 minutes.</p></div>
          <div className="note-card"><span className="note-num">02</span><h3 className="note-name">Heart Notes</h3><p className="note-desc">The soul of the fragrance. Florals, spices, green accords that emerge as the top fades.</p></div>
          <div className="note-card"><span className="note-num">03</span><h3 className="note-name">Base Notes</h3><p className="note-desc">What lingers for hours, woods, resins, musks that define your signature trail.</p></div>
          <div className="note-card"><span className="note-num">04</span><h3 className="note-name">Your Skin</h3><p className="note-desc">Every fragrance transforms uniquely on your chemistry. That's the final layer.</p></div>
        </div>
      </section>

      <section className="sourcing-detail">
        <div className="sourcing-header">
          <p className="section-label" style={{ color: 'var(--gold)' }}>Samples &amp; Authenticity</p>
          <h2 className="section-title" style={{ color: 'var(--fg)' }}>Authentic decants.<br/><em className="gradient-em">Real bottles. Smaller pour.</em></h2>
        </div>
        <div className="sourcing-grid">
          <div className="sourcing-step reveal"><div className="sourcing-step-num">01</div><h3 className="sourcing-step-title">You order a sample</h3><p className="sourcing-step-desc">Pick a fragrance and a size, 2ml, 5ml, 10ml, or 30ml. Same juice as the boutique counter, just decanted into a wearable pour.</p></div>
          <div className="sourcing-step reveal"><div className="sourcing-step-num">02</div><h3 className="sourcing-step-title">We decant from authenticated stock</h3><p className="sourcing-step-desc">Every sample is poured from a verified bottle we've checked ourselves, batch codes, fill levels, packaging. No reformulations, no fakes.</p></div>
          <div className="sourcing-step reveal"><div className="sourcing-step-num">03</div><h3 className="sourcing-step-title">It ships to you</h3><p className="sourcing-step-desc">Glass atomizers, labeled with name and date filled. Shipped the same week. Try three at once and live with them for a few weeks.</p></div>
          <div className="sourcing-step reveal"><div className="sourcing-step-num">04</div><h3 className="sourcing-step-title">Love it? Get the bottle.</h3><p className="sourcing-step-desc">If you find your signature, we source the full bottle at a discount, typically 20 to 40% below retail. Or just reorder the sample size you wear most.</p></div>
        </div>
        <div className="auth-strip">
          <div className="auth-item"><div><strong>Decanted from authentics</strong><span>Every bottle batch-coded and verified before we pour</span></div></div>
          <div className="auth-divider" />
          <div className="auth-item"><div><strong>Sealed glass atomizers</strong><span>Labeled, dated, and pressure-tested before shipping</span></div></div>
          <div className="auth-divider" />
          <div className="auth-item"><div><strong>Satisfaction guaranteed</strong><span>Something off? We make it right, no questions</span></div></div>
        </div>
      </section>

      <section className="source-cta section">
        <p className="section-label" style={{ textAlign: 'center', color: 'var(--gold)' }}>Ready when you are.</p>
        <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 16, color: 'var(--fg)' }}>Try anything <em className="gradient-em">from 2ml.</em></h2>
        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--fg-soft)', maxWidth: 460, margin: '0 auto 40px', lineHeight: 1.8 }}>Browse the catalog, take the quiz, or order a sample of something we don't list, designer, niche, whatever you're chasing.</p>
        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button type="button" className="btn-gold" onClick={() => openSampleModal('')}>Order a Sample</button>
          <button type="button" className="btn-ghost" style={{ color: 'var(--fg)', borderColor: 'var(--hairline)' }} onClick={() => openSourceModal('')}>Source a Full Bottle</button>
        </div>
      </section>

      <Footer />
    </>
  );
}
