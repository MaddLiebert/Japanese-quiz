// ─────────────────────────────────────────────────────────────────────────────
// Teks mata uang "medaru" per-era. Era Heian 平安 memakai istilah & KANA yang
// benar untuk zaman itu; era Edo 江戸 memakai 両 ryō; era Meiji 明治 memakai
// 円 en (Yen lahir 1871, New Currency Act); era lain tetap "MEDARU" (tampilan
// lama, tidak diubah).
//
// Konsep Heian: koin tembaga/emas 文 (mon) — satuan uang klasik Jepang
// (和同開珎 wadōkaichin dst.). Pemain belum bisa kanji → label pakai KANA,
// jadi "もん" (bukan "文"). Ini sejalan dengan eraNames.js (yang memakai kanji
// hanya sebagai hiasan/nama pendek di tempat tertentu).
//
// Konsep Edo: 両 (ryō) — mata uang zaman Edo. Edo sudah zaman cetak & pemain
// sudah bisa kanji → label pakai KANJI, furigana di `aria` untuk aksesibilitas.
// Lihat PRD: docs/tema/edo.md §8.
//
// Konsep Meiji: 円 (en) — Yen modern (1871). Meiji = zaman modern, label KANJI
// + furigana di `aria`. Lihat PRD: docs/tema/meiji.md §8/§13.
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

export const HEIAN_MEDARU = {
  name: 'もん',           // 文 (mon) — satuan uang klasik
  nameShort: 'もん',      // label ringkas untuk chip di top-bar
  aria: 'もん',           // dibaca pembaca layar sebelum angka
};

export const EDO_MEDARU = {
  name: '両',             // ryō — mata uang Edo
  nameShort: '両',        // label ringkas untuk chip di top-bar
  aria: '両 りょう',       // kanji + furigana untuk pembaca layar
};

// Meiji 明治: 円 (en) — Yen modern (1871). Kanji + furigana di aria.
export const MEIJI_MEDARU = {
  name: '円',             // en — mata uang Meiji (New Currency Act 1871)
  nameShort: '円',        // label ringkas untuk chip di top-bar
  aria: '円 えん',         // kanji + furigana untuk pembaca layar
};

// Shōwa 昭和: 円 (en) — yen bertahan (新円 1946). Kanji + furigana di aria.
export const SHOWA_MEDARU = {
  name: '円',             // en — yen Shōwa (新円 1946)
  nameShort: '円',        // label ringkas untuk chip di top-bar
  aria: '円 えん',         // kanji + furigana untuk pembaca layar
};

// 多元 Anime Multiverse: コイン (koin) — mata uang arcade/ゲーセン.
// Kanji + katakana (bahasa pop), furigana こいん di aria. Lihat PRD §8.
export const ANIME_MEDARU = {
  name: 'コイン',          // koin — mata uang arcade
  nameShort: 'コイン',     // label ringkas untuk chip di top-bar
  aria: 'コイン こいん',    // katakana + furigana untuk pembaca layar
};

// 電脳 Cyberpunk: クレジット (kurejitto) — kredit data, mata uang era terakhir.
// Katakana (era paling maju = paling banyak serapan). Lihat PRD cyberpunk §8.2.
export const CYBERPUNK_MEDARU = {
  name: 'クレジット',        // kredit — mata uang cyberpunk
  nameShort: 'クレジット',    // label ringkas untuk chip di top-bar
  aria: 'クレジット くれじっと', // katakana + furigana untuk pembaca layar
};

const LEGACY = (id) => ({
  name: 'MEDARU',
  nameShort: 'MEDARU',
  aria: id ? 'Medaru' : 'Medaru',
});

export const isHeianEra = (eraId) => eraId === 'heian';
export const isEdoEra = (eraId) => eraId === 'edo';
export const isMeijiEra = (eraId) => eraId === 'meiji';
export const isShowaEra = (eraId) => eraId === 'showa';
export const isAnimeEra = (eraId) => eraId === 'anime';
export const isCyberpunkEra = (eraId) => eraId === 'cyberpunk';

// Teks mata uang untuk era aktif. Heian → kana; Edo → 両; Meiji → 円;
// Shōwa → 円; 多元 → コイン; 電脳 → クレジット; era lain → "MEDARU".
export const medaruCopy = (eraId, language) => {
  if (isHeianEra(eraId)) return { ...HEIAN_MEDARU };
  if (isEdoEra(eraId)) return { ...EDO_MEDARU };
  if (isMeijiEra(eraId)) return { ...MEIJI_MEDARU };
  if (isShowaEra(eraId)) return { ...SHOWA_MEDARU };
  if (isAnimeEra(eraId)) return { ...ANIME_MEDARU };
  if (isCyberpunkEra(eraId)) return { ...CYBERPUNK_MEDARU };
  return LEGACY(language === 'id');
};
