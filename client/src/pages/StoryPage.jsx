import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../lib/seo.js';

/**
 * Brand-manifesto page — adapted from a 21st.dev "Digital Serenity" landing.
 *
 * Kept from the original:
 *   - Slow word-by-word reveal driven by data-delay attributes
 *   - Mouse-following soft glow
 *   - Click ripple effects
 *   - Animated grid pattern + corner detail dots + floating particles
 *
 * Adapted for Scent Layer:
 *   - Palette: slate → cream/gold/deep2
 *   - Typography: mono+ultralight → Lora serif (display) + Inter (eyebrow/UI)
 *   - Copy: meditation → brand voice
 *   - Chrome-less: tiny logo top-left, "Continue to the catalog" bottom CTA.
 *     No Nav; no Footer. The whole page is a moment of pause.
 */
export function StoryPage() {
  useDocumentMeta({
    title: 'The Story',
    description: 'A moment of pause. Find the fragrance that speaks before you do — Scent Layer.',
  });

  const [mouseGlow, setMouseGlow] = useState({ left: '0px', top: '0px', opacity: 0 });
  const [ripples, setRipples] = useState([]);
  const floatingElementsRef = useRef([]);
  const scrolledRef = useRef(false);

  // Word-by-word reveal — runs once after a small delay so users see the
  // animation rather than a fully-rendered page.
  useEffect(() => {
    const t = setTimeout(() => {
      document.querySelectorAll('.story-word').forEach((word) => {
        const delay = parseInt(word.getAttribute('data-delay')) || 0;
        setTimeout(() => {
          if (word) word.style.animation = 'story-word-appear 0.8s ease-out forwards';
        }, delay);
      });
    }, 500);
    return () => clearTimeout(t);
  }, []);

  // Cursor glow + ripple on click
  useEffect(() => {
    const onMove = (e) => setMouseGlow({ left: `${e.clientX}px`, top: `${e.clientY}px`, opacity: 1 });
    const onLeave = () => setMouseGlow((p) => ({ ...p, opacity: 0 }));
    const onClick = (e) => {
      const id = Date.now() + Math.random();
      setRipples((r) => [...r, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setRipples((r) => r.filter((d) => d.id !== id)), 1000);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('click', onClick);
    };
  }, []);

  // Word hover gold shimmer
  useEffect(() => {
    const els = document.querySelectorAll('.story-word');
    const onEnter = (e) => { if (e.target) e.target.style.textShadow = '0 0 24px rgba(201, 169, 110, 0.5)'; };
    const onOut   = (e) => { if (e.target) e.target.style.textShadow = 'none'; };
    els.forEach((el) => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onOut); });
    return () => els.forEach((el) => { el.removeEventListener('mouseenter', onEnter); el.removeEventListener('mouseleave', onOut); });
  }, []);

  // Start floating particles after first scroll
  useEffect(() => {
    const elements = document.querySelectorAll('.story-float');
    floatingElementsRef.current = Array.from(elements);
    const onScroll = () => {
      if (scrolledRef.current) return;
      scrolledRef.current = true;
      floatingElementsRef.current.forEach((el, idx) => {
        setTimeout(() => {
          if (el) {
            el.style.animationPlayState = 'running';
            el.style.opacity = '';
          }
        }, (parseFloat(el.style.animationDelay || '0') * 1000) + idx * 100);
      });
    };
    window.addEventListener('scroll', onScroll);
    // Also auto-start after 5s so people who don't scroll still see the effect
    const autoStart = setTimeout(onScroll, 5000);
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(autoStart);
    };
  }, []);

  return (
    <div className="story-page">
      {/* Decorative SVG grid + detail dots */}
      <svg className="story-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="storyGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(201, 169, 110, 0.08)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#storyGrid)" />
        <line x1="0" y1="20%" x2="100%" y2="20%" className="story-line" style={{ animationDelay: '0.5s' }} />
        <line x1="0" y1="80%" x2="100%" y2="80%" className="story-line" style={{ animationDelay: '1s' }} />
        <line x1="20%" y1="0" x2="20%" y2="100%" className="story-line" style={{ animationDelay: '1.5s' }} />
        <line x1="80%" y1="0" x2="80%" y2="100%" className="story-line" style={{ animationDelay: '2s' }} />
        <line x1="50%" y1="0" x2="50%" y2="100%" className="story-line" style={{ animationDelay: '2.5s', opacity: 0.05 }} />
        <line x1="0" y1="50%" x2="100%" y2="50%" className="story-line" style={{ animationDelay: '3s', opacity: 0.05 }} />
        <circle cx="20%" cy="20%" r="2" className="story-dot" style={{ animationDelay: '3s' }} />
        <circle cx="80%" cy="20%" r="2" className="story-dot" style={{ animationDelay: '3.2s' }} />
        <circle cx="20%" cy="80%" r="2" className="story-dot" style={{ animationDelay: '3.4s' }} />
        <circle cx="80%" cy="80%" r="2" className="story-dot" style={{ animationDelay: '3.6s' }} />
        <circle cx="50%" cy="50%" r="1.5" className="story-dot" style={{ animationDelay: '4s' }} />
      </svg>

      {/* Tiny logo top-left so users don't feel trapped */}
      <Link to="/" className="story-logo" aria-label="Scent Layer — home">Scent Layer</Link>

      {/* Corner accents */}
      <div className="story-corner story-corner--tl" style={{ animationDelay: '4s' }}><span /></div>
      <div className="story-corner story-corner--tr" style={{ animationDelay: '4.2s' }}><span /></div>
      <div className="story-corner story-corner--bl" style={{ animationDelay: '4.4s' }}><span /></div>
      <div className="story-corner story-corner--br" style={{ animationDelay: '4.6s' }}><span /></div>

      {/* Floating particles (start on scroll/dwell) */}
      <div className="story-float" style={{ top: '25%', left: '15%', animationDelay: '0.5s' }} />
      <div className="story-float" style={{ top: '60%', left: '85%', animationDelay: '1s' }} />
      <div className="story-float" style={{ top: '40%', left: '10%', animationDelay: '1.5s' }} />
      <div className="story-float" style={{ top: '75%', left: '90%', animationDelay: '2s' }} />

      {/* Main content */}
      <div className="story-content">
        <div className="story-top">
          <h2 className="story-eyebrow">
            <span className="story-word" data-delay="0">Scent</span>
            <span className="story-word" data-delay="300">first.</span>
          </h2>
          <div className="story-divider" />
        </div>

        <div className="story-center">
          <h1 className="story-headline">
            <div className="story-headline-row">
              <span className="story-word" data-delay="700">Find</span>
              <span className="story-word" data-delay="850">the</span>
              <span className="story-word" data-delay="1000">fragrance,</span>
            </div>
            <div className="story-subheadline">
              <span className="story-word" data-delay="1400">that</span>
              <span className="story-word" data-delay="1550">speaks</span>
              <span className="story-word" data-delay="1700">before</span>
              <span className="story-word" data-delay="1850">you</span>
              <span className="story-word" data-delay="2000">do.</span>
              <span className="story-word" data-delay="2200">One</span>
              <span className="story-word" data-delay="2350">note</span>
              <span className="story-word" data-delay="2500">tells</span>
              <span className="story-word" data-delay="2650">a</span>
              <span className="story-word" data-delay="2800">story</span>
              <span className="story-word" data-delay="2950">words</span>
              <span className="story-word" data-delay="3100">cannot.</span>
            </div>
          </h1>
          <div className="story-line-left"  style={{ animation: 'story-word-appear 1s ease-out forwards', animationDelay: '3.6s' }} />
          <div className="story-line-right" style={{ animation: 'story-word-appear 1s ease-out forwards', animationDelay: '3.8s' }} />
        </div>

        <div className="story-bottom">
          <div className="story-divider" />
          <h2 className="story-eyebrow">
            <span className="story-word" data-delay="3400">Sample.</span>
            <span className="story-word" data-delay="3600">Discover.</span>
            <span className="story-word" data-delay="3800">Commit.</span>
          </h2>
          <div className="story-dots" style={{ animation: 'story-word-appear 1s ease-out forwards', animationDelay: '4.4s' }}>
            <span /><span /><span />
          </div>
          <Link to="/shop" className="story-cta" style={{ animation: 'story-word-appear 1s ease-out forwards', animationDelay: '4.8s' }}>
            Continue to the catalog →
          </Link>
        </div>
      </div>

      {/* Mouse-following glow */}
      <div
        className="story-glow"
        style={{ left: mouseGlow.left, top: mouseGlow.top, opacity: mouseGlow.opacity }}
      />

      {/* Click ripples */}
      {ripples.map((r) => (
        <div key={r.id} className="story-ripple" style={{ left: `${r.x}px`, top: `${r.y}px` }} />
      ))}
    </div>
  );
}
