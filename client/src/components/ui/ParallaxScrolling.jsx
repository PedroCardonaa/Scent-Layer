import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Layered parallax hero. Originally a 21st.dev / Osmo template — adapted
 * for the Scent Layer editorial palette. Drives four parallax layers via
 * GSAP ScrollTrigger on native browser scroll.
 *
 * (Earlier versions of this component initialized Lenis for smooth-scroll
 * but it intercepted the wheel and made the page feel locked. Dropped —
 * native scroll works correctly with ScrollTrigger and feels less stuck.)
 *
 * Honors `prefers-reduced-motion: reduce` by skipping the animation entirely.
 *
 * Props
 *   title       — large italic word centered over the layers (default: "Scent")
 *   eyebrow     — small caps label beneath the title
 *   layers      — optional override for the 3 image URLs (back → front)
 */
export function ParallaxScrolling({
  title = 'Scent',
  eyebrow = 'About Scent Layer',
  layers,
}) {
  const parallaxRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const triggerElement = parallaxRef.current?.querySelector('[data-parallax-layers]');
    if (!triggerElement) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerElement,
        start: '0% 0%',
        end: '100% 0%',
        scrub: 0,
      },
    });

    const layerSpec = [
      { layer: '1', yPercent: 70 },
      { layer: '2', yPercent: 55 },
      { layer: '3', yPercent: 40 },
      { layer: '4', yPercent: 10 },
    ];

    layerSpec.forEach((spec, idx) => {
      tl.to(
        triggerElement.querySelectorAll(`[data-parallax-layer="${spec.layer}"]`),
        { yPercent: spec.yPercent, ease: 'none' },
        idx === 0 ? undefined : '<',
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
      gsap.killTweensOf(triggerElement);
    };
  }, []);

  // TODO(scent-layer): replace the three layer images below with brand
  // photography — bottles, botanicals, atmospheric textures. The current
  // URLs are Osmo's demo CDN assets and shouldn't ship to production.
  const defaultLayers = [
    'https://cdn.prod.website-files.com/671752cd4027f01b1b8f1c7f/6717795be09b462b2e8ebf71_osmo-parallax-layer-3.webp',
    'https://cdn.prod.website-files.com/671752cd4027f01b1b8f1c7f/6717795b4d5ac529e7d3a562_osmo-parallax-layer-2.webp',
    'https://cdn.prod.website-files.com/671752cd4027f01b1b8f1c7f/6717795bb5aceca85011ad83_osmo-parallax-layer-1.webp',
  ];
  const [back, mid, front] = layers ?? defaultLayers;

  return (
    <div className="parallax" ref={parallaxRef}>
      <section className="parallax__header">
        <div className="parallax__visuals">
          <div className="parallax__black-line-overflow" aria-hidden="true" />
          <div data-parallax-layers className="parallax__layers">
            <img src={back}  loading="eager" width="800" data-parallax-layer="1" alt="" className="parallax__layer-img" />
            <img src={mid}   loading="eager" width="800" data-parallax-layer="2" alt="" className="parallax__layer-img" />
            <div data-parallax-layer="3" className="parallax__layer-title">
              <div>
                {eyebrow && <p className="parallax__eyebrow">{eyebrow}</p>}
                <h2 className="parallax__title">{title}</h2>
              </div>
            </div>
            <img src={front} loading="eager" width="800" data-parallax-layer="4" alt="" className="parallax__layer-img" />
          </div>
          <div className="parallax__fade" aria-hidden="true" />
        </div>
      </section>
      <section className="parallax__content" aria-hidden="true">
        <span className="parallax__mark">✦</span>
      </section>
    </div>
  );
}
