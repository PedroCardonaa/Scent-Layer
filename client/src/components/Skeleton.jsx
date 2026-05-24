/**
 * Generic shimmer-style placeholder. Used everywhere the page is waiting
 * on an async fetch so the layout doesn't flash empty before hydration.
 *
 * Pure CSS, animation runs off the .skeleton class. Width/height props
 * let callers shape it without inline-style sprawl.
 */
export function Skeleton({ width, height = 16, rounded = 4, className = '', style }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: rounded, ...style }}
      aria-hidden="true"
    />
  );
}

// Pre-baked variants for the most common shapes on this site.
export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-card-img" />
      <div className="skeleton-card-body">
        <Skeleton width="40%" height={10} />
        <Skeleton width="80%" height={18} />
        <Skeleton width="60%" height={12} />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3, lastWidth = '70%' }) {
  return (
    <div className="skeleton-text" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? lastWidth : '100%'} height={12} />
      ))}
    </div>
  );
}
