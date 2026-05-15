import { cn } from '../../lib/cn.js';

/**
 * Magic UI-style rotating border beam. Drops absolutely inside a positioned
 * parent and traces a glowing gradient around the parent's border-radius.
 *
 * The parent MUST have `position: relative` and a `border-radius` (even 0 is fine).
 */
export function BorderBeam({
  size = 200,
  duration = 8,
  delay = 0,
  colorFrom = '#c9a96e',
  colorTo = '#e8d5a8',
  borderWidth = 1,
  className,
}) {
  return (
    <div
      className={cn(
        // Hollow border ring that the beam traces
        'pointer-events-none absolute inset-0 rounded-[inherit]',
        '[border:calc(var(--bb-w)*1px)_solid_transparent]',
        '[mask-clip:padding-box,border-box]',
        '[mask-composite:intersect]',
        '[mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]',
        className,
      )}
      style={{
        '--bb-w': borderWidth,
      }}
    >
      <div
        className="absolute aspect-square"
        style={{
          width: `${size}px`,
          offsetPath: `rect(0 auto auto 0 round ${borderWidth}px)`,
          offsetDistance: '0%',
          animation: `border-beam ${duration}s linear infinite`,
          animationDelay: `${-delay}s`,
          background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
        }}
      />
    </div>
  );
}
