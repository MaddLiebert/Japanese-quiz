// ─────────────────────────────────────────────────────────────────────────────
// Teks UI "tempat gacha" — KHUSUS era Heian 平安 (kana, karena pemain belum
// bisa kanji). Era lain → teks lama (Shōwa), jadi tema Heian tetap berdiri
// sendiri dan TIDAK bocor ke era lain.
//
// Konsep: gacha Heian = 貝合わせ kai-awase (permainan mencocokkan kerang khas
// bangsawan istana) — sejalan dengan nama gacha di eraNames.js.
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

// Label utama Heian = KANA saja (pemain belum bisa kanji). Kanji hanya muncul
// di `titleSub` sebagai lapisan "belajar" opsional.
export const HEIAN_GACHA = {
  kicker: 'うらない',                            // ramalan
  title: 'かいあわせ',                            // kai-awase — cocokkan kerang
  titleSub: '貝合わせ · kai-awase',               // kanji + romaji (lapisan belajar)
  tagline: 'かいを ひく。きょうか、だいきちか。',      // tarik kerang. sial atau hoki?
  pull1: 'ひく 1まい',                            // tarik 1 keping
  pull10: 'ひく 10まい',                          // tarik 10 keping
  contents: 'かいの なかみ',                       // isi kerang
  ownedSuffix: 'もっている',                       // dimiliki
  toBackpack: 'とった かい は すぐ たんす へ',       // hasil masuk たんす (箪笥)
  resultTitle: 'ひいた けっか',                     // hasil tarikan
  skip: 'とばす',                                 // lewati
  close: 'とじる',                                // tutup
  watermark: '貝',                                // kerang
};

// Teks lama (era selain Heian) — sama seperti sebelumnya, tidak diubah.
const LEGACY = (id) => ({
  kicker: id ? 'Mesin Keberuntungan' : 'Fortune Machine',
  title: id ? 'Gashapon Berkarat' : 'Rusty Gashapon',
  titleSub: '',
  tagline: id ? 'Tarik tuasnya. Ampas atau Jackpot?' : 'Pull the lever. Scrap or Jackpot?',
  pull1: id ? 'TARIK 1X' : 'PULL 1X',
  pull10: id ? 'TARIK 10X' : 'PULL 10X',
  contents: id ? 'Isi Gashapon' : 'Gashapon Contents',
  ownedSuffix: id ? 'dimiliki' : 'owned',
  toBackpack: id ? 'Hasil tarikan langsung masuk Tas Punggung' : 'Pulls go straight to your Backpack',
  resultTitle: id ? 'Hasil Tarikan' : 'Pull Result',
  skip: id ? 'Lewati' : 'Skip',
  close: id ? 'TUTUP' : 'CLOSE',
  watermark: '玉',
});

export const isHeian = (eraId) => eraId === 'heian';

// Teks "tempat gacha" untuk era aktif.
// Heian → kana (HEIAN_GACHA). Era lain → teks lama sesuai bahasa.
export const gachaCopy = (eraId, language) =>
  (isHeian(eraId) ? { ...HEIAN_GACHA } : LEGACY(language === 'id'));
