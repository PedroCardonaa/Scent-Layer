// Tiny event bus for the spray system. Any component can call
// triggerSpray({ x, y, direction }) and the globally-mounted
// SprayCanvas will paint a particle burst at those screen coords.
//
// Direction is a hint for the emission cone:
//   'up'        — straight up (default)
//   'up-right'  — up and slightly right (matches the angled bottle nozzle)
//   'up-left'
//   'right'

const EVENT = 'scent-spray';

export function triggerSpray({ x, y, direction = 'up' } = {}) {
  if (typeof window === 'undefined') return;
  if (typeof x !== 'number' || typeof y !== 'number') return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { x, y, direction } }));
}

export function onSpray(handler) {
  if (typeof window === 'undefined') return () => {};
  function listener(e) { handler(e.detail); }
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
