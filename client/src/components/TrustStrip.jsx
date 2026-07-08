import { Link } from 'react-router-dom';

/**
 * Compact trust strip under the homepage hero. Answers the three
 * doubts every first-time decant buyer has — is it real, is it fresh,
 * will it arrive — in one row, each linking to the page that proves it.
 */
const ITEMS = [
  {
    to: '/faq',
    title: 'Authenticated bottles',
    sub: 'Every decant drawn from a sealed retail bottle we verified',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    to: '/faq',
    title: 'Hand-decanted to order',
    sub: 'Filled when you order, never sitting pre-poured on a shelf',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="8" y="8" width="8" height="13" rx="2" />
        <path d="M10 8V5h4v3" />
        <rect x="10.5" y="2" width="3" height="3" rx="1" />
        <path d="M10 14h4" />
      </svg>
    ),
  },
  {
    to: '/shipping',
    title: 'Ships in 48h, tracked',
    sub: 'Free US shipping over $50, flat $5.95 below',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7h11v10H3z" />
        <path d="M14 10h4l3 3v4h-7" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
];

export function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Why buy from Scent Layer">
      {ITEMS.map(item => (
        <Link key={item.title} to={item.to} className="trust-item">
          <span className="trust-icon">{item.icon}</span>
          <span className="trust-copy">
            <strong>{item.title}</strong>
            <span>{item.sub}</span>
          </span>
        </Link>
      ))}
    </section>
  );
}
