import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { getCompareIds, subscribeCompare, toggleCompare, clearCompare } from '../lib/compare.js';

/**
 * Floating tray that appears once the user has picked 2+ fragrances to
 * compare from the product grid. One tap opens the AI Compare tool
 * with the selection preloaded via the URL.
 */
export function CompareTray() {
  const { fragrances } = useApp();
  const navigate = useNavigate();
  const [ids, setIds] = useState(getCompareIds());

  useEffect(() => subscribeCompare(setIds), []);

  if (ids.length < 2) return null;

  const picked = ids
    .map(id => fragrances.find(f => f.id === id))
    .filter(Boolean);

  function go() {
    navigate(`/tools?compare=${ids.join(',')}#compare`);
  }

  return (
    <div className="compare-tray" role="region" aria-label="Compare selection">
      <div className="compare-tray-chips">
        {picked.map(f => (
          <button
            key={f.id}
            type="button"
            className="compare-tray-chip"
            onClick={() => toggleCompare(f.id)}
            title={`Remove ${f.name}`}
          >
            {f.name} ✕
          </button>
        ))}
      </div>
      <div className="compare-tray-actions">
        <button type="button" className="compare-tray-go" onClick={go}>
          Compare {ids.length} →
        </button>
        <button type="button" className="compare-tray-clear" onClick={clearCompare} aria-label="Clear comparison">
          Clear
        </button>
      </div>
    </div>
  );
}
