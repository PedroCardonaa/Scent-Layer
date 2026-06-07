import { Link } from 'react-router-dom';

/**
 * Consistent branded empty state: a soft bottle-outline mark, an
 * editorial line, a one-line sub, and a clear next-action button.
 * Used across wardrobe / blends / reviews so every empty surface
 * reads the same and always points somewhere useful.
 *
 * `action` is either { to, label } for a Link, or { onClick, label }
 * for a button.
 */
export function EmptyState({ title, sub, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state-mark" aria-hidden="true">
        <svg viewBox="0 0 40 56" width="40" height="56" fill="none">
          <rect x="8" y="20" width="24" height="30" rx="3" stroke="currentColor" strokeWidth="1.4" />
          <rect x="15" y="14" width="10" height="6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M16 8 h8 v6 h-8 z" stroke="currentColor" strokeWidth="1.2" />
          <line x1="14" y1="34" x2="26" y2="34" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
      </span>
      <p className="empty-state-title">{title}</p>
      {sub && <p className="empty-state-sub">{sub}</p>}
      {action && (
        action.to ? (
          <Link to={action.to} className="empty-state-cta">{action.label}</Link>
        ) : (
          <button type="button" className="empty-state-cta" onClick={action.onClick}>{action.label}</button>
        )
      )}
    </div>
  );
}
