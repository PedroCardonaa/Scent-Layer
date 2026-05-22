import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

/**
 * Three pills below the cart CTA: I own this · I have a sample · Backup
 * needed. Toggling a pill upserts/removes a row in WardrobeItem. Signed
 * out users get a gentle prompt to sign in instead of a broken button.
 */
const PILLS = [
  { status: 'OWNED',   label: 'I own this' },
  { status: 'SAMPLED', label: 'I have a sample' },
  { status: 'BACKUP',  label: 'Backup needed' },
];

export function WardrobePills({ fragranceId }) {
  const { user, wardrobeItems, setWardrobeStatus, removeWardrobeStatus } = useApp();

  if (!user) {
    return (
      <div className="wardrobe-section">
        <p className="wardrobe-row-label">My Wardrobe</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--fg-soft)' }}>
          <Link to="/login" style={{ color: 'var(--gold)' }}>Sign in</Link> to track what you own, what you've sampled, and what needs a backup.
        </p>
      </div>
    );
  }

  function isActive(status) {
    return wardrobeItems.some(i => i.fragranceId === fragranceId && i.status === status);
  }

  function toggle(status) {
    if (isActive(status)) removeWardrobeStatus(fragranceId, status);
    else setWardrobeStatus(fragranceId, status);
  }

  return (
    <div className="wardrobe-section">
      <p className="wardrobe-row-label">My Wardrobe</p>
      <div className="wardrobe-buttons">
        {PILLS.map(p => (
          <button
            key={p.status}
            type="button"
            className={`wardrobe-pill ${isActive(p.status) ? 'active' : ''}`}
            onClick={() => toggle(p.status)}
            aria-pressed={isActive(p.status)}
          >
            {isActive(p.status) && <span className="wardrobe-pill-dot" />}
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
