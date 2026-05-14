export function ProductBottle() {
  return (
    <svg className="product-bottle-img" viewBox="0 0 120 260" fill="none">
      <rect x="42" y="8" width="36" height="22" rx="4" fill="#2d2420" opacity="0.85"/>
      <rect x="46" y="4" width="28" height="10" rx="3" fill="#1a1612" opacity="0.7"/>
      <rect x="48" y="30" width="24" height="20" rx="2" fill="rgba(201,169,110,0.35)"/>
      <rect x="22" y="50" width="76" height="190" rx="8" fill="rgba(255,255,255,0.18)"/>
      <rect x="30" y="66" width="12" height="140" rx="6" fill="white" opacity="0.12"/>
    </svg>
  );
}

export function HeroBottle() {
  return (
    <svg viewBox="0 0 120 260" fill="none">
      <rect x="42" y="8" width="36" height="22" rx="4" fill="#2d2420" opacity="0.85"/>
      <rect x="46" y="4" width="28" height="10" rx="3" fill="#1a1612" opacity="0.7"/>
      <rect x="48" y="30" width="24" height="20" rx="2" fill="url(#ng)"/>
      <rect x="22" y="50" width="76" height="190" rx="8" fill="url(#bg)"/>
      <rect x="30" y="66" width="12" height="140" rx="6" fill="white" opacity="0.12"/>
      <rect x="30" y="110" width="60" height="80" rx="4" fill="rgba(245,240,232,0.15)"/>
      <rect x="38" y="125" width="44" height="2" rx="1" fill="rgba(245,240,232,0.5)"/>
      <rect x="44" y="160" width="32" height="1" rx="0.5" fill="rgba(201,169,110,0.6)"/>
      <defs>
        <linearGradient id="bg" x1="22" y1="50" x2="98" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d4c5b0"/><stop offset="40%" stopColor="#e8ddd0"/><stop offset="100%" stopColor="#b8a890"/>
        </linearGradient>
        <linearGradient id="ng" x1="48" y1="30" x2="72" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c8b89a"/><stop offset="100%" stopColor="#a89878"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function SotwBottle() {
  return (
    <svg width="110" height="220" viewBox="0 0 120 260" fill="none">
      <rect x="42" y="8" width="36" height="22" rx="4" fill="#1a1612" opacity="0.9"/>
      <rect x="46" y="4" width="28" height="10" rx="3" fill="#0d0a08" opacity="0.8"/>
      <rect x="48" y="30" width="24" height="20" rx="2" fill="rgba(201,169,110,0.4)"/>
      <rect x="22" y="50" width="76" height="190" rx="8" fill="rgba(201,169,110,0.15)"/>
      <rect x="30" y="66" width="12" height="140" rx="6" fill="white" opacity="0.08"/>
      <rect x="30" y="105" width="60" height="85" rx="3" fill="rgba(201,169,110,0.1)"/>
      <rect x="38" y="120" width="44" height="1.5" rx="0.75" fill="rgba(201,169,110,0.7)"/>
      <rect x="44" y="132" width="32" height="1" rx="0.5" fill="rgba(245,240,232,0.3)"/>
      <rect x="40" y="155" width="40" height="1" rx="0.5" fill="rgba(201,169,110,0.4)"/>
    </svg>
  );
}
