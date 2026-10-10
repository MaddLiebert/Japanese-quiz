// ─────────────────────────────────────────────────────────────────────────────
// A5 クレーンゲーム (crane game) — logika undian karakter 多元. MURNI: tanpa
// React/DOM, RNG disuntik → bisa dites deterministik.
// Spec: docs/tema/anime-mekanik.md §A5 · PRD docs/tema/anime.md §8.
//
// Pool = karakter dari franchise yang DIMILIKI (lihat ProgressContext.characterPool).
// Menang = dapat 1 figur karakter (masuk koleksi). Duplikat → refund koin.
// ─────────────────────────────────────────────────────────────────────────────

export const CLAW_PRICE_1X = 150;
export const CLAW_PRICE_10X = 1350;
export const CLAW_DUPLICATE_REFUND = 30;

export const clawPrice = (count = 1) => (count >= 10 ? CLAW_PRICE_10X : CLAW_PRICE_1X);

// Undi `count` id dari `pool` (boleh berulang — duplikat = refund). rng → [0,1).
// Pool kosong → []. Aman kalau count ≤ 0.
export const rollClaw = (pool, count = 1, rng = Math.random) => {
  const src = Array.isArray(pool) ? pool.filter(Boolean) : [];
  if (src.length === 0 || count <= 0) return [];
  const out = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.min(src.length - 1, Math.floor(rng() * src.length));
    out.push(src[idx]);
  }
  return out;
};

// Hitung refund dari hasil undian: id yang SUDAH dimiliki (owned = objek/array).
export const clawRefund = (results, owned) => {
  const has = (id) => (Array.isArray(owned) ? owned.includes(id) : !!(owned && owned[id]));
  return results.filter((id) => has(id)).length * CLAW_DUPLICATE_REFUND;
};

// Validasi ringan: harga 10x harus LEBIH MURAH per-undian dari 1x (insentif).
export const validateClawPricing = () => {
  const errors = [];
  if (!(CLAW_PRICE_10X < CLAW_PRICE_1X * 10)) errors.push('harga 10x harus lebih murah dari 10× harga 1x');
  if (CLAW_DUPLICATE_REFUND < 0) errors.push('refund tidak boleh negatif');
  return errors;
};
