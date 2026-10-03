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

// ── Era Heian 平安 — 貝合わせ (cocokkan kerang) ──────────────────────────────
// Mesin slot 3-reel adalah bahasa Shōwa. Di Heian, "undian" = kai-awase:
// sepasang kerang 貝 dicocokkan. Jadi tampilan gacha Heian memakai 3 pasang
// kerang (6 slot), bukan 3 reel — dua kerang sepasang yang berhenti bersamaan.
// Semua konstanta di bawah HANYA dipakai saat era === 'heian'.
export const HEIAN_SHELL_PAIRS = 3;              // 3 pasang kerang (meniru 3 reel)
export const HEIAN_SHELL_SLOTS = 6;              // 3 pasang × 2 keping
export const HEIAN_SHELL_MS = [2000, 3200, 4600]; // tiap PASANG berhenti berurutan (ms)
export const HEIAN_SHELL_TICK_MS = 90;           // bunyi kerang beradu (ms)
export const HEIAN_SHELL_EASE = [0.33, 0, 0.2, 1]; // ease-out lembut (kerang mengambang, bukan snap)
export const HEIAN_SHELL_FADE = 26;              // fade tepi jendela kerang (px)

// Simbol yang lewat di keping kerang saat masih "mengambang" — motif Heian:
// bunga 花, kana かな, bulan 月, gerbang 門, tinta 墨.
export const HEIAN_SHELL_POOL = ['flower', 'flower2', 'cloudMoon', 'bell', 'sprout', 'waves', 'brush'];

// Strip untuk SATU keping kerang Heian (acak dari pool, elemen terakhir = target).
export function buildShellStrip(targetIcon, pool = HEIAN_SHELL_POOL, length = STRIP_LEN, rng = Math.random) {
  return buildStrip(targetIcon, pool, length, rng);
}

// Strip untuk SEMUA keping kerang Heian. targetIcons = satu ikon per PASANG;
// tiap pasang diulang 2× supaya dua kerang dalam satu pasangan menampilkan
// hasil yang sama (itulah "mencocokkan"). Pasangan ke-i = keping 2i & 2i+1.
export function buildShellStrips(targetIcons, pool = HEIAN_SHELL_POOL, length = STRIP_LEN, rng = Math.random) {
  return Array.from({ length: HEIAN_SHELL_SLOTS }, (_, k) => {
    const pairIdx = Math.floor(k / 2);
    const target = targetIcons[pairIdx % targetIcons.length];
    return buildShellStrip(target, pool, length, rng);
  });
}

// Simbol acak yang dilewati saat reel muter (bukan ikon pack).
export const SYMBOL_POOL = ['flower', 'flower2', 'sprout', 'tree', 'waves', 'fire', 'snowflake', 'moon', 'bell', 'cloudMoon'];

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
const RARITY_RANK = { common: 0, rare: 1, legendary: 2, special: 3 };
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
