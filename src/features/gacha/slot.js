// ─────────────────────────────────────────────────────────────────────────────
// Logika murni mesin slot gacha (tanpa React / DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

export const REEL_COUNT = 3;
export const STRIP_LEN = 24;                  // simbol per strip (cukup panjang agar tetap ngebut di durasi panjang)
export const REEL_MS = [3000, 4000, 5000];    // durasi spin tiap reel (ms) — berhenti berurutan, total ~5.8s
export const TICK_MS = 70;                    // interval bunyi tick (ms)
// Easing ease-in-out: reel berakselerasi dari diam lalu melambat berhenti (mulus, tanpa lonjakan).
export const REEL_EASE = [0.42, 0, 0.58, 1];
// Tinggi fade gradien di tepi jendela reel (px) — memberi kesan kedalaman/kecepatan
// TANPA filter blur animasi (blur per-frame pada strip panjang = berat, bikin patah-patah).
export const REEL_FADE = 30;

// Simbol acak yang dilewati saat reel muter (bukan ikon pack).
export const SYMBOL_POOL = ['🍥', '🎴', '🏮', '⚡', '🌊', '🔥', '❄️', '🌸', '🎐', '🪷'];

// Deretan simbol satu reel: acak dari pool, ELEMEN TERAKHIR = target.
export function buildStrip(targetIcon, pool = SYMBOL_POOL, length = STRIP_LEN, rng = Math.random) {
  if (length < 1) throw new Error('length minimal 1');
  const strip = [];
  for (let i = 0; i < length - 1; i++) {
    strip.push(pool[Math.floor(rng() * pool.length)]);
  }
  strip.push(targetIcon);
  return strip;
}

// Strip untuk SEMUA reel. targetIcons lebih sedikit → dipakai berulang (modulo).
export function buildStrips(targetIcons, pool = SYMBOL_POOL, length = STRIP_LEN, rng = Math.random) {
  return Array.from({ length: REEL_COUNT }, (_, i) =>
    buildStrip(targetIcons[i % targetIcons.length], pool, length, rng)
  );
}

// Ikon target per reel dari hasil gacha. `iconOf(result)` → string ikon.
export function reelTargetIcons(results, iconOf) {
  const list = Array.isArray(results) ? results : [];
  if (list.length === 0) return Array(REEL_COUNT).fill(SYMBOL_POOL[0]);
  return Array.from({ length: REEL_COUNT }, (_, i) => iconOf(list[i % list.length]));
}

// Rarity tertinggi dari daftar rarity (untuk menentukan fanfare).
const RARITY_RANK = { common: 0, rare: 1, legendary: 2 };
export function maxRarity(rarities) {
  return (rarities || []).reduce(
    (best, r) => ((RARITY_RANK[r] ?? 0) > (RARITY_RANK[best] ?? 0) ? r : best),
    'common'
  );
}

// Total durasi animasi spin (reel terakhir + jeda reveal).
export function totalSpinMs() {
  return REEL_MS[REEL_COUNT - 1] + 400;
}
