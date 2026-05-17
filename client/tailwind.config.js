/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  corePlugins: {
    // shared.css already provides a reset; don't double-stomp it
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        cream: '#f5f0e8',
        'warm-white': '#faf8f4',
        ink: '#1a1612',
        taupe: '#8b7d6b',
        gold: '#c9a96e',
        'gold-light': '#e8d5a8',
        blush: '#e8d5c4',
        deep: '#2d2420',
        deep2: '#1a1210',
        muted: '#b0a090',
      },
      fontFamily: {
        serif: ['"Italiana"', 'serif'],
        sans: ['"Manrope"', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'marquee': {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(calc(-100% - var(--marquee-gap, 1rem)))' },
        },
        'marquee-reverse': {
          from: { transform: 'translateX(calc(-100% - var(--marquee-gap, 1rem)))' },
          to:   { transform: 'translateX(0)' },
        },
        'border-beam': {
          to: { 'offset-distance': '100%' },
        },
        'gradient-shift': {
          from: { 'background-position': '0% 50%' },
          to:   { 'background-position': '200% 50%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease',
        'marquee': 'marquee var(--marquee-duration, 40s) linear infinite',
        'marquee-reverse': 'marquee-reverse var(--marquee-duration, 40s) linear infinite',
      },
    },
  },
  plugins: [],
};
