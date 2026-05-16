import { motion } from 'framer-motion';
import { MonitorCog, MoonStar, Sun } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useApp } from '../../context/AppContext.jsx';

/**
 * 21st.dev segmented theme switcher.
 *
 * Adapted from the original (which used next-themes) to read/write through
 * our AppContext instead, so we don't pull in another theme library.
 * Three options: system / light / dark. The selection persists to
 * localStorage and the actual body.dark class is managed centrally in
 * AppContext (including listening for OS prefers-color-scheme changes
 * while in 'system' mode).
 */

const THEME_OPTIONS = [
  { Icon: MonitorCog, value: 'system', label: 'System theme' },
  { Icon: Sun,        value: 'light',  label: 'Light theme' },
  { Icon: MoonStar,   value: 'dark',   label: 'Dark theme' },
];

export function ToggleTheme() {
  const { themePref, setThemePref } = useApp();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      role="radiogroup"
      aria-label="Theme"
      className="theme-toggle"
    >
      {THEME_OPTIONS.map(({ Icon, value, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={themePref === value}
          aria-label={label}
          onClick={() => setThemePref(value)}
          className={cn('theme-toggle-btn', themePref === value && 'is-active')}
        >
          {themePref === value && (
            <motion.div
              layoutId="theme-toggle-pill"
              transition={{ type: 'spring', bounce: 0.1, duration: 0.75 }}
              className="theme-toggle-pill"
              aria-hidden="true"
            />
          )}
          <Icon className="theme-toggle-icon" />
        </button>
      ))}
    </motion.div>
  );
}
