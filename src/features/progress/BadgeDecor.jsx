// Dekorasi visual badge legendaris (JSX) — cincin berputar + percikan ✦.
// Logika murni (isLegendary, badgeCircleClass) ada di badgeSeal.js agar teruji.

// Ditaruh DI DALAM lingkaran badge legendaris (yang sudah `relative`).
export const LegendaryDecor = () => (
  <>
    <span className="kin-ring" aria-hidden="true" />
    <span className="kin-spark" style={{ top: -1, right: 6 }} aria-hidden="true">✦</span>
    <span className="kin-spark" style={{ bottom: -1, left: 6, animationDelay: '0.8s' }} aria-hidden="true">✦</span>
  </>
);
