// temporal.js — M7 時刻 (waktu: musiman → standar). Modul MURNI.
// Nyata: sebelum Meiji, jam Jepang TEMPORAL (siang dibagi 6, panjang berubah
// tiap musim). Meiji baru pakai jam 24 tetap. Mekanik: timer kuis Meiji awalnya
// tidak konsisten (ikut "musim"), lalu tetap & adil setelah perhentian 鉄道.
// Spec: docs/tema/meiji-mekanik.md §M7.

// "musim" 0..3 (app) → panjang hari relatif. semi/panas/gugur/dingin.
export const SEASON_FACTOR = [0.85, 1.0, 1.15, 1.0];

// Sebelum 鉄道: timer = base * factor (tidak adil). Setelah: base (adil).
export const quizTimer = (baseS, season = 0, standardTime = false) => {
  const base = Number.isFinite(baseS) ? baseS : 0;
  if (standardTime) return base;
  const f = SEASON_FACTOR[season] ?? 1.0;
  return Math.round(base * f);
};

// Progressi: apakah jam standar sudah diberlakukan (dibuka di perhentian 鉄道).
export const isStandardTime = (stopIndex) => Number.isFinite(stopIndex) && stopIndex >= 4;

// Penjelasan in-story (WAJIB saat transisi) — supaya pemain paham, bukan bug.
export const standardTimeNotice = (language = 'id') => (language === 'en'
  ? 'Standard time adopted. Clocks across the land now tick as one.'
  : 'Jam standar diberlakukan. Seluruh negeri kini berdetak serempak.');

export default quizTimer;
