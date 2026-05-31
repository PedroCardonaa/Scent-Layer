import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { setSoundEnabled, soundEnabled, playChime } from '../../lib/sound.js';

/**
 * Tiny sound toggle that lives next to the theme toggle in the nav.
 * Off by default, persisted to localStorage.sl_sound_pref. Toggling
 * ON plays a short chime so the user can hear what they just enabled.
 */
export function ToggleSound() {
  const [on, setOn] = useState(false);

  // Sync from storage on mount
  useEffect(() => { setOn(soundEnabled()); }, []);

  function toggle() {
    const next = !on;
    setSoundEnabled(next);
    setOn(next);
    if (next) {
      // Small delay so the audio context resumes before the chime fires.
      setTimeout(() => playChime(), 30);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="sound-toggle"
      aria-label={on ? 'Mute interface sounds' : 'Enable interface sounds'}
      title={on ? 'Sound on' : 'Sound off'}
    >
      {on ? <Volume2 size={14} strokeWidth={1.6} /> : <VolumeX size={14} strokeWidth={1.6} />}
    </button>
  );
}
