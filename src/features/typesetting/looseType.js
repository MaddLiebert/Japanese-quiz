// looseType.js — M5 活字 lepas (UI punya "fisik"). Modul MURNI.
// Kalimat di UI = blok 活字. Kalau streak putus, beberapa blok miring/lepas →
// pemain "kencangkan" (review) untuk merapikan. Hanya visual + review prompt;
// TIDAK memblokir belajar.
// Spec: docs/tema/meiji-mekanik.md §M5.

// streak 0 (putus) → 0.35 blok lepas; streak tinggi → 0.
export const LOOSE_MAX = 0.35;
export const LOOSE_SAFE_STREAK = 30;

export const looseAmount = (streakDays) => {
  const s = Number(streakDays) || 0;
  if (s >= LOOSE_SAFE_STREAK) return 0;
  if (s <= 0) return LOOSE_MAX;
  return (1 - s / LOOSE_SAFE_STREAK) * LOOSE_MAX;
};

// Index blok yang miring (deterministik via seed). Jumlah = ceil(count*amount),
// minimal 1 kalau amount > 0.
const mulberry32 = (seed) => {
  let a = (Number(seed) || 0) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const looseIndices = (count, amount, seed = 1) => {
  const n = Number(count) || 0;
  const amt = Number(amount) || 0;
  if (n <= 0 || amt <= 0) return [];
  const k = Math.max(1, Math.ceil(n * amt));
  const rnd = mulberry32(seed);
  const idx = [...Array(n).keys()].map((i) => ({ i, k: rnd() }));
  idx.sort((a, b) => a.k - b.k);
  return idx.slice(0, Math.min(k, n)).map((x) => x.i).sort((a, b) => a - b);
};

export default looseAmount;
