// glitch.js — M9 GLITCH (kebocoran cyberpunk). Modul MURNI & deterministik.
// Meiji = era paling dekat masa depan (asal Nacht/Saku = AI cyberpunk) → celah
// paling tipis. Sesekali UI berkedip ke cyberpunk. Makin tinggi level, makin
// sering. Efek visual = CSS/React di lapisan tipis di atas modul ini.
// Spec: docs/tema/meiji-mekanik.md §M9.

export const GLITCH_MIN_LEVEL = 50;

// Frekuensi 0..0.12 — naik dengan level, 0 di bawah minLevel.
export const glitchChance = (level, minLevel = GLITCH_MIN_LEVEL) => {
  const lv = Number(level) || 0;
  if (lv < minLevel) return 0;
  const t = Math.min(1, (lv - minLevel) / (300 - minLevel)); // 50 → 0 .. 300 → 1
  return t * 0.12;
};

// Intensitas 0..1 — untuk besaran efek (neon 1 frame, dsb).
export const glitchIntensity = (level, minLevel = GLITCH_MIN_LEVEL) => {
  const lv = Number(level) || 0;
  if (lv < minLevel) return 0;
  return Math.min(1, (lv - minLevel) / (300 - minLevel));
};

// Deterministik dgn rng (0..1). rng < chance → glitch.
export const shouldGlitch = (level, rng = 1, minLevel = GLITCH_MIN_LEVEL) =>
  (Number(rng) || 0) < glitchChance(level, minLevel);

// Hormati prefers-reduced-motion + toggle pengaturan.
export const glitchAllowed = ({ reducedMotion = false, enabled = true } = {}) =>
  enabled && !reducedMotion;

// ── Varian 多元 Anime Multiverse — kebocoran PALING KUAT ────────────────────
// 多元 = era paling dekat rumah Nacht/Saku (Cyberpunk). Di Lv 300 glitch jadi
// PERMANEN (bukan lagi "bocor", tapi "terbuka"). Frekuensi 0..0.20 (Meiji 0..0.12).
export const GLITCH_MIN_LEVEL_ANIME = 150;

export const glitchChanceAnime = (level, minLevel = GLITCH_MIN_LEVEL_ANIME) => {
  const lv = Number(level) || 0;
  if (lv < minLevel) return 0;
  const t = Math.min(1, (lv - minLevel) / (300 - minLevel)); // 150 → 0 .. 300 → 1
  return t * 0.20;
};

export const glitchIntensityAnime = (level, minLevel = GLITCH_MIN_LEVEL_ANIME) => {
  const lv = Number(level) || 0;
  if (lv < minLevel) return 0;
  return Math.min(1, (lv - minLevel) / (300 - minLevel));
};

// ── 電脳 Cyberpunk — glitch PERMANEN (bukan lagi kebocoran) ──────────────────
// Lima era sebelumnya: glitch cuma BOCOR sesekali (peluang). Di Lv 300 (era 電脳,
// rumah Nacht/Saku) glitch jadi PERMANEN — bukan "kebetulan muncul", tapi "terbuka
// selamanya". Helper ini memutuskan itu; tetap hormati reduced-motion/toggle lewat
// glitchAllowed(). Frekuensi = 1 (selalu), intensitas = 1 (penuh).
export const CYBERPUNK_PERMANENT_LEVEL = 300;

export const glitchPermanent = (level, minLevel = CYBERPUNK_PERMANENT_LEVEL) =>
  (Number(level) || 0) >= minLevel;

// Peluang glitch 電脳: 1 (selalu) saat permanen, else 0 (era ini tak pernah
// "bocor pelan" — sebelum Lv 300 glitch 電脳 belum ada sama sekali).
export const glitchChanceCyberpunk = (level) => (glitchPermanent(level) ? 1 : 0);

export default glitchChance;
