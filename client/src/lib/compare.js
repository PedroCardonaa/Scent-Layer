// Tiny shared store for the compare tray. localStorage-backed so the
// selection survives navigation, with a subscriber list so the cards
// and the floating tray stay in sync without threading AppContext.

const KEY = 'sl-compare-ids';
const MAX = 4;
const listeners = new Set();

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter(n => Number.isInteger(n)).slice(0, MAX) : [];
  } catch { return []; }
}

let ids = typeof window !== 'undefined' ? read() : [];

function write(next) {
  ids = next.slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* private mode */ }
  listeners.forEach(fn => fn(ids));
}

export function getCompareIds() { return ids; }

export function toggleCompare(id) {
  if (ids.includes(id)) write(ids.filter(x => x !== id));
  else if (ids.length < MAX) write([...ids, id]);
  return ids;
}

export function clearCompare() { write([]); }

export function subscribeCompare(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
