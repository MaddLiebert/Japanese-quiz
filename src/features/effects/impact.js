// ─────────────────────────────────────────────────────────────────────────────
// A12 集中線 & ベタフラッシュ (Impact frame) — MURNI: tanpa React, tanpa DOM.
// Momen "wow" (streak, jawaban benar berturut, lulus) = impact frame ala manga:
// 集中線 (garis radial) + ベタフラッシュ (kedip penuh 1 frame). Tanda tangan visual
// 多元. Efek visual = CSS/React di lapisan tipis di atas modul ini.
// Spec: docs/tema/anime-mekanik.md §A12.

export const IMPACT_MAX_STREAK = 10; // streak saat ベタフラッシュ penuh

// Intensitas 0..1 dari streak.
export const impactIntensity = (streak) => Math.min(1, Math.max(0, (Number(streak) || 0) / IMPACT_MAX_STREAK));

// frame: 'none' | 'burst' (集中線) | 'flash' (ベタフラッシュ) — untuk memilih efek CSS.
export const impactFrame = (streak) => {
  const i = impactIntensity(streak);
  if (i >= 1) return 'flash';
  if (i >= 0.5) return 'burst';
  return 'none';
};

// Hormati reduced-motion + toggle pengaturan.
export const impactAllowed = ({ reducedMotion = false, enabled = true } = {}) => enabled && !reducedMotion;

export default impactFrame;
