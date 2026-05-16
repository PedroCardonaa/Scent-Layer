import { useEffect, useRef } from 'react';

/**
 * 21st.dev spotlight-card adapted for Scent Layer.
 *
 * Differences from the original:
 *   - Pseudo-element CSS lives in styles/glow-card.css instead of being
 *     injected as a <style> tag per instance
 *   - Added a 'gold' preset that stays inside the editorial palette
 *     (hue 36 ± 12, saturation 50, lightness 65) rather than a full
 *     rainbow rotation
 *   - JSX (no TypeScript)
 */

const glowColorMap = {
  blue:   { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green:  { base: 120, spread: 200 },
  red:    { base: 0,   spread: 200 },
  orange: { base: 30,  spread: 200 },
  // Editorial gold: narrow hue range, muted saturation, warm lightness
  gold:   { base: 36,  spread: 12, saturation: 55, lightness: 62 },
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96',
};

export function GlowCard({
  children,
  className = '',
  glowColor = 'gold',
  size = 'md',
  width,
  height,
  customSize = false,
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    const syncPointer = (e) => {
      const { clientX: x, clientY: y } = e;
      const el = cardRef.current;
      if (!el) return;
      el.style.setProperty('--x', x.toFixed(2));
      el.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
      el.style.setProperty('--y', y.toFixed(2));
      el.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
    };
    document.addEventListener('pointermove', syncPointer);
    return () => document.removeEventListener('pointermove', syncPointer);
  }, []);

  const { base, spread, saturation, lightness } = glowColorMap[glowColor];

  const sizeClasses = customSize ? '' : sizeMap[size];

  const inlineStyles = {
    '--base': base,
    '--spread': spread,
    '--radius': '14',
    '--border': '2',
    '--backdrop': 'hsl(0 0% 60% / 0.05)',
    '--backup-border': 'var(--backdrop)',
    '--size': '200',
    '--outer': '1',
    '--border-size': 'calc(var(--border, 2) * 1px)',
    '--spotlight-size': 'calc(var(--size, 150) * 1px)',
    '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
    backgroundImage: `radial-gradient(
      var(--spotlight-size) var(--spotlight-size) at
      calc(var(--x, 0) * 1px)
      calc(var(--y, 0) * 1px),
      hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)),
      transparent
    )`,
    backgroundColor: 'var(--backdrop, transparent)',
    backgroundSize: 'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
    backgroundPosition: '50% 50%',
    backgroundAttachment: 'fixed',
    border: 'var(--border-size) solid var(--backup-border)',
    position: 'relative',
    touchAction: 'none',
  };

  // Per-preset saturation / lightness overrides (used by 'gold')
  if (saturation !== undefined) inlineStyles['--saturation'] = saturation;
  if (lightness  !== undefined) inlineStyles['--lightness']  = lightness;

  if (width  !== undefined) inlineStyles.width  = typeof width  === 'number' ? `${width}px`  : width;
  if (height !== undefined) inlineStyles.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      ref={cardRef}
      data-glow
      style={inlineStyles}
      className={[
        sizeClasses,
        !customSize ? 'aspect-[3/4]' : '',
        'rounded-2xl',
        'relative',
        'grid',
        'grid-rows-[1fr_auto]',
        'shadow-[0_1rem_2rem_-1rem_black]',
        'p-4',
        'gap-4',
        'backdrop-blur-[5px]',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div data-glow />
      {children}
    </div>
  );
}
