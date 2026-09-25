// ─────────────────────────────────────────────────────────────────────────────
// Bonus XP dari streak belajar harian.
// Aturan produk: streak aktif (>= 1 hari) = +5% XP tiap jawaban benar.
// Dipakai ProgressContext.addXp + label di Home ("+5% Bonus Aktif").
// ─────────────────────────────────────────────────────────────────────────────

export const STREAK_BONUS_RATE = 0.05;

// Label satuan hari — ikut bahasa UI (id: "hari", en: "day"/"days").
export const streakUnit = (count, language) => {
  const n = Number(count) || 0;
  if (language === 'id') return 'hari';
  return n === 1 ? 'day' : 'days';
};

export const isStreakActive = (progress) => ((progress && progress.streak) || 0) > 0;

// Bulatkan ke bilangan bulat supaya XP selalu rapi (10 → 11, 35 → 37).
export const applyStreakBonus = (amount, progress) => {
  const base = Number(amount) || 0;
  if (!isStreakActive(progress)) return base;
  return Math.round(base * (1 + STREAK_BONUS_RATE));
};
