// ─────────────────────────────────────────────────────────────────────────────
// A10 名刺 (Profil = kartu tukar) — MURNI: tanpa React, tanpa DOM.
// Profil 多元 = 名刺 (kartu tukar ala 推し活): nama, 推し, 戦闘力, lencana.
// Hanya MEMBACA data yang sudah ada (user_progress_v2). Rarity naik dengan level.
// Spec: docs/tema/anime-mekanik.md §A10 · nama UI PRD §8.
//
// 戦闘力 (power) = "power level" — trope anime; di sini = level pemain.

export const MEISHI_RARITIES = ['R', 'SR', 'SSR', 'UR'];

// Rarity kartu dari level. 150 = gerbang 多元 → SR; 200 → SSR; 300 → UR.
export const meishiRarity = (p) => {
  const lv = Number(p?.level) || 1;
  if (lv >= 300) return 'UR';
  if (lv >= 200) return 'SSR';
  if (lv >= 150) return 'SR';
  return 'R';
};

// Bangun data 名刺 dari progress. Stabil (deterministik): input sama → output sama.
export const buildMeishi = (progress = {}) => ({
  name: progress.playerName || '旅人',
  oshi: progress.oshiId || null,
  power: Number(progress.level) || 1,               // 戦闘力
  badges: Array.isArray(progress.badges) ? [...progress.badges] : [],
  since: progress.firstSeen || null,
  rarity: meishiRarity(progress),
});

export default buildMeishi;
