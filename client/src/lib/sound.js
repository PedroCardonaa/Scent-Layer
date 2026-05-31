// Subtle, opt-in audio cues. Built with the Web Audio API so we don't
// ship any .mp3/.wav assets — every sound is synthesized live from
// short exponential envelopes layered with a touch of harmonic
// content. Total code: ~3KB gzipped.
//
// Off by default. The Sound toggle in the theme/preference panel
// flips localStorage.sl_sound_pref; everything else just checks
// soundEnabled() before firing.
//
// Three cues:
//   - whoosh: soft airy slide, fires on add-to-cart
//   - chime:  two-note bell, fires on wishlist save
//   - puff:   single short tone, fires on intro spray fire

const STORAGE_KEY = 'sl_sound_pref';

let _ctx = null;
function ctx() {
  if (typeof window === 'undefined') return null;
  if (_ctx) return _ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  _ctx = new Ctor();
  return _ctx;
}

export function soundEnabled() {
  if (typeof window === 'undefined') return false;
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

export function setSoundEnabled(on) {
  try { localStorage.setItem(STORAGE_KEY, on ? '1' : '0'); } catch { /* noop */ }
  // Resume the audio context on first opt-in (user-gesture-driven).
  if (on) {
    const c = ctx();
    if (c?.state === 'suspended') c.resume();
  }
}

// ─── Envelope helper, exponential attack-decay ────────────────────
function tone(c, { freq, type = 'sine', dur = 0.25, peak = 0.18, attack = 0.005, decay = 0.22, detune = 0 }) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  if (detune) osc.detune.value = detune;
  const now = c.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + dur);
}

// ─── Cues ─────────────────────────────────────────────────────────
export function playWhoosh() {
  if (!soundEnabled()) return;
  const c = ctx();
  if (!c) return;
  // Two-layer airy slide: low triangle slides up + filtered noise pulse.
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(820, now + 0.18);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  osc.connect(gain).connect(c.destination);
  osc.start(now); osc.stop(now + 0.25);
}

export function playChime() {
  if (!soundEnabled()) return;
  const c = ctx();
  if (!c) return;
  // Two-note bell, A5 → E6, slight harmonic.
  tone(c, { freq: 880,    type: 'sine', dur: 0.5,  peak: 0.10, decay: 0.35 });
  tone(c, { freq: 1318.5, type: 'sine', dur: 0.4,  peak: 0.07, attack: 0.085, decay: 0.30 });
  tone(c, { freq: 880,    type: 'triangle', dur: 0.6, peak: 0.04, decay: 0.55 });
}

export function playPuff() {
  if (!soundEnabled()) return;
  const c = ctx();
  if (!c) return;
  tone(c, { freq: 620, type: 'sine', dur: 0.18, peak: 0.09, decay: 0.16 });
  tone(c, { freq: 940, type: 'sine', dur: 0.14, peak: 0.05, attack: 0.025, decay: 0.12 });
}
