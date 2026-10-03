// ─────────────────────────────────────────────────────────────────────────────
// Teks mata uang "medaru" per-era. Era Heian 平安 memakai istilah & KANA yang
// benar untuk zaman itu; era lain tetap "MEDARU" (tampilan lama, tidak diubah).
//
// Konsep Heian: koin tembaga/emas 文 (mon) — satuan uang klasik Jepang
// (和同開珎 wadōkaichin dst.). Pemain belum bisa kanji → label pakai KANA,
// jadi "もん" (bukan "文"). Ini sejalan dengan eraNames.js (yang memakai kanji
// hanya sebagai hiasan/nama pendek di tempat tertentu).
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

export const HEIAN_MEDARU = {
  name: 'もん',           // 文 (mon) — satuan uang klasik
  nameShort: 'もん',      // label ringkas untuk chip di top-bar
  aria: 'もん',           // dibaca pembaca layar sebelum angka
};

const LEGACY = (id) => ({
  name: 'MEDARU',
  nameShort: 'MEDARU',
  aria: id ? 'Medaru' : 'Medaru',
});

export const isHeianEra = (eraId) => eraId === 'heian';

// Teks mata uang untuk era aktif. Heian → kana; era lain → "MEDARU".
export const medaruCopy = (eraId, language) =>
  (isHeianEra(eraId) ? { ...HEIAN_MEDARU } : LEGACY(language === 'id'));
