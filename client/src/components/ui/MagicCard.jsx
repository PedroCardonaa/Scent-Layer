import { useRef, useState } from 'react';
import { cn } from '../../lib/cn.js';

/**
 * Magic UI-style spotlight card. Tracks the cursor inside the element and
 * paints a soft radial glow at the pointer position. Fades the spotlight
 * on mouse leave.
 */
export function MagicCard({
  children,
  className,
  spotlightColor = 'rgba(201,169,110,0.18)',
  spotlightSize = 220,
}) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  function onMove(e) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={cn('relative overflow-hidden', className)}
    >
      <div
        className="pointer-events-none absolute inset-0 z-[2] transition-opacity duration-300"
        style={{
          background: `radial-gradient(${spotlightSize}px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 60%)`,
          opacity: active ? 1 : 0,
          mixBlendMode: 'plus-lighter',
        }}
      />
      {children}
    </div>
  );
}
