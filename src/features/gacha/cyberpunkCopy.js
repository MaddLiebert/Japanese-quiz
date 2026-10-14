// ─────────────────────────────────────────────────────────────────────────────
// Teks UI "tempat gacha" — KHUSUS era 電脳 Cyberpunk (ハック hack).
//
// Konsep: gacha 電脳 = ハック (membobol data) — bukan mesin fisik seperti
// ガチャガチャ Shōwa atau クレーンゲーム 多元, melainkan pembobolan berkas.
// Sejalan dengan nama gacha di eraNames.js ('ハック') dan PRD
// docs/tema/cyberpunk.md §8.1 + §16. Era paling MODERN → KANJI + KATAKANA
// (paling banyak kata serapan), bukan kana seperti Heian.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

export const CYBERPUNK_GACHA = {
  kicker: '侵入',                                 // penyusupan / intrusi
  title: 'ハック',                                // hakku — membobol data (undian)
  titleSub: 'はっく · hack',                      // furigana + romaji (lapisan belajar)
  tagline: 'データを割れ。当たりか、ノイズか。',     // bobol data. jackpot atau noise?
  pull1: 'ハック 1回',                             // bobol 1x
  pull10: 'ハック 10回',                           // bobol 10x
  contents: 'アーカイブの中身',                     // isi arsip (inventori 電脳 = アーカイブ)
  ownedSuffix: '所持',                             // dimiliki
  toBackpack: '抜いたデータは すぐ アーカイブ へ',    // hasil masuk アーカイブ (arsip)
  resultTitle: '侵入の結果',                        // hasil intrusi
  skip: 'スキップ',                                // lewati
  close: '閉じる',                                 // tutup
  watermark: '電',                                 // 電 — data/elektrik (tema 電脳)
};

export const isCyberpunk = (eraId) => eraId === 'cyberpunk';

// Salinan baru tiap panggilan (konstanta tak bisa dirusak pemanggil).
export const gachaCopyCyberpunk = () => ({ ...CYBERPUNK_GACHA });
