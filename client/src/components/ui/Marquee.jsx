import { cn } from '../../lib/cn.js';

/**
 * Magic UI-style horizontal marquee.
 * Edge-faded via a mask gradient, pauses on hover, supports reverse direction,
 * and stamps the children N times so the loop is seamless.
 */
export function Marquee({
  children,
  reverse = false,
  pauseOnHover = false,
  repeat = 4,
  className,
  duration,
  gap,
}) {
  return (
    <div
      className={cn(
        'group relative flex w-full overflow-hidden',
        // Mask the left/right edges so items fade in/out instead of hard-cutting
        '[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]',
        className,
      )}
      style={{
        '--marquee-duration': duration,
        '--marquee-gap': gap,
      }}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex shrink-0 items-center pr-[var(--marquee-gap,1rem)]',
            reverse ? 'animate-marquee-reverse' : 'animate-marquee',
            pauseOnHover && 'group-hover:[animation-play-state:paused]',
          )}
          aria-hidden={i > 0 ? 'true' : undefined}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
