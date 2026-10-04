// ─────────────────────────────────────────────────────────────────────────────
// Teks mata uang "medaru" per-era. Era Heian 平安 memakai istilah & KANA yang
// benar untuk zaman itu; era Edo 江戸 memakai 両 ryō; era lain tetap "MEDARU"
// (tampilan lama, tidak diubah).
//
// Konsep Heian: koin tembaga/emas 文 (mon) — satuan uang klasik Jepang
// (和同開珎 wadōkaichin dst.). Pemain belum bisa kanji → label pakai KANA,
// jadi "もん" (bukan "文"). Ini sejalan dengan eraNames.js (yang memakai kanji
// hanya sebagai hiasan/nama pendek di tempat tertentu).
//
// Konsep Edo: 両 (ryō) — mata uang zaman Edo. Edo sudah zaman cetak & pemain
// sudah bisa kanji → label pakai KANJI, furigana di `aria` untuk aksesibilitas.
// Lihat PRD: docs/tema/edo.md §8.
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

const LEGACY = (id) => ({
  name: 'MEDARU',
  nameShort: 'MEDARU',
  aria: id ? 'Medaru' : 'Medaru',
});

export const isHeianEra = (eraId) => eraId === 'heian';
export const isEdoEra = (eraId) => eraId === 'edo';

// Teks mata uang untuk era aktif. Heian → kana; Edo → 両; era lain → "MEDARU".
export const medaruCopy = (eraId, language) => {
  if (isHeianEra(eraId)) return { ...HEIAN_MEDARU };
  if (isEdoEra(eraId)) return { ...EDO_MEDARU };
  return LEGACY(language === 'id');
};
