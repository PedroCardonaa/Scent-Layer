import { useApp } from '../context/AppContext.jsx';

/**
 * Cookie / analytics consent banner.
 *
 * Renders only when the user hasn't made a decision (analyticsConsent === null).
 * Once they accept or decline, the choice is persisted and the banner won't
 * show again. Declining means GA is never loaded; no cookies dropped.
 *
 * Positioned bottom-left as an editorial card so it doesn't dominate the
 * page like a typical EU cookie wall.
 */
export function CookieConsent() {
  const { analyticsConsent, setAnalyticsConsent } = useApp();
  if (analyticsConsent !== null) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-label="Cookie consent">
      <p className="cookie-consent-eyebrow">A note on cookies</p>
      <p className="cookie-consent-body">
        We use cookies (Google Analytics) to understand which fragrances and tools resonate with people.
        It helps us pick what to source next. You can decline — nothing else on the site depends on it.
      </p>
      <div className="cookie-consent-actions">
        <button type="button" className="cookie-consent-accept" onClick={() => setAnalyticsConsent('granted')}>
          Accept
        </button>
        <button type="button" className="cookie-consent-decline" onClick={() => setAnalyticsConsent('denied')}>
          Decline
        </button>
      </div>
    </div>
  );
}
