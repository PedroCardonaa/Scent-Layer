import { useEffect, useId, useState } from 'react';

/**
 * Magic UI-style animated beam. Renders a gradient particle traveling along an
 * SVG path that connects `fromRef` to `toRef`, both of which must live inside
 * `containerRef`. The component absorbs window resizes via ResizeObserver.
 */
export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  duration = 4,
  delay = 0,
  pathColor = 'rgba(201,169,110,0.18)',
  pathWidth = 1,
  gradientStartColor = '#c9a96e',
  gradientStopColor = '#e8d5a8',
  curvature = 0,
  reverse = false,
}) {
  const id = useId();
  const [svgDims, setSvgDims] = useState({ width: 0, height: 0 });
  const [pathD, setPathD] = useState('');
  const [coords, setCoords] = useState({ x1: 0, x2: 0 });

  useEffect(() => {
    const update = () => {
      const container = containerRef.current;
      const from = fromRef.current;
      const to = toRef.current;
      if (!container || !from || !to) return;
      const c = container.getBoundingClientRect();
      const f = from.getBoundingClientRect();
      const t = to.getBoundingClientRect();
      setSvgDims({ width: c.width, height: c.height });
      const x1 = f.left + f.width / 2 - c.left;
      const y1 = f.top + f.height / 2 - c.top;
      const x2 = t.left + t.width / 2 - c.left;
      const y2 = t.top + t.height / 2 - c.top;
      setCoords({ x1, x2 });
      const cy = (y1 + y2) / 2 - curvature;
      setPathD(`M ${x1},${y1} Q ${(x1 + x2) / 2},${cy} ${x2},${y2}`);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, [containerRef, fromRef, toRef, curvature]);

  if (!svgDims.width || !pathD) return null;

  const animFrom1 = reverse ? coords.x2 + 100 : coords.x1 - 100;
  const animTo1   = reverse ? coords.x1 - 100 : coords.x2 + 100;
  const animFrom2 = reverse ? coords.x2 + 200 : coords.x1;
  const animTo2   = reverse ? coords.x1       : coords.x2 + 200;

  return (
    <svg
      width={svgDims.width}
      height={svgDims.height}
      viewBox={`0 0 ${svgDims.width} ${svgDims.height}`}
      fill="none"
      className="pointer-events-none absolute left-0 top-0"
      aria-hidden="true"
    >
      <path d={pathD} stroke={pathColor} strokeWidth={pathWidth} strokeLinecap="round" />
      <path d={pathD} stroke={`url(#${id})`} strokeWidth={pathWidth} strokeLinecap="round" />
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="0">
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
          <animate attributeName="x1" values={`${animFrom1};${animTo1}`} dur={`${duration}s`} begin={`${delay}s`} repeatCount="indefinite" />
          <animate attributeName="x2" values={`${animFrom2};${animTo2}`} dur={`${duration}s`} begin={`${delay}s`} repeatCount="indefinite" />
        </linearGradient>
      </defs>
    </svg>
  );
}
