import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { ScentTile } from './ScentTile.jsx';

/**
 * The Vault, a horizontal scroller of hand-picked editor favorites with
 * a one-line take on each. Curated by fragrance id + a short note;
 * threads real catalog entries so cards link to live detail pages.
 *
 * Renders on the homepage. If a picked id isn't in the catalog it's
 * silently skipped, so the rail never shows a broken card.
 */
const PICKS = [
  { id: 4,  take: 'The one strangers stop you to ask about.' },
  { id: 8,  take: 'Winter in a bottle. Pipe tobacco and a fire that didn\'t need lighting.' },
  { id: 22, take: 'Rose and patchouli dosed past politeness. A reference, not a fragrance.' },
  { id: 2,  take: 'Polarizing. Never forgettable. The one everyone argues about.' },
  { id: 20, take: 'A temple at altitude. Bone-dry sandalwood, quiet smoke.' },
  { id: 1,  take: 'The most-copied fragrance of the decade, for good reason.' },
  { id: 29, take: 'Every business-hotel lobby, distilled. Loud, well-mannered, hard to dislike.' },
  { id: 24, take: 'Tuberose at its loudest. Green, narcotic, unforgettable. Sample first.' },
];

export function TheVault() {
  const { fragrances, openSampleModal } = useApp();

  const picks = useMemo(() => {
    return PICKS
      .map(p => ({ ...p, fragrance: fragrances.find(f => f.id === p.id) }))
      .filter(p => p.fragrance);
  }, [fragrances]);

  if (picks.length < 3) return null;

  return (
    <section className="vault" aria-label="The Vault, editor picks">
      <div className="vault-head">
        <p className="vault-eyebrow">The Vault</p>
        <h2 className="vault-title">What we'd <em>actually</em> wear.</h2>
        <p className="vault-sub">No algorithm. Just the bottles the team keeps reaching for.</p>
      </div>
      <div className="vault-rail">
        {picks.map(({ id, take, fragrance: f }) => (
          <article key={id} className="vault-card">
            <Link to={`/fragrance/${id}`} className="vault-card-thumb" aria-label={`Open ${f.name}`}>
              <ScentTile fragrance={f} />
            </Link>
            <div className="vault-card-body">
              <p className="vault-card-brand">{f.brand}</p>
              <Link to={`/fragrance/${id}`} className="vault-card-name">{f.name}</Link>
              <p className="vault-card-take">{take}</p>
              <button type="button" className="vault-card-btn" onClick={() => openSampleModal(`${f.name}, ${f.brand}`)}>
                Sample it
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
