import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

/**
 * Thin strip shown only when the backend is confirmed unreachable
 * (catalog fetch failed). Lets users understand why auth / checkout
 * may not work, instead of buttons silently failing. Dismissable for
 * the session. Never shows while status is unknown (null) or healthy.
 */
export function ApiStatusBanner() {
  const { apiReachable } = useApp();
  const [dismissed, setDismissed] = useState(false);

  if (apiReachable !== false || dismissed) return null;

  return (
    <div className="api-banner" role="status">
      <span className="api-banner-dot" aria-hidden="true" />
      <span className="api-banner-text">
        Preview mode, browsing works, but ordering and accounts are offline right now.
      </span>
      <button
        type="button"
        className="api-banner-x"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >✕</button>
    </div>
  );
}
