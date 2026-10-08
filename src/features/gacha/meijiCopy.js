// ─────────────────────────────────────────────────────────────────────────────
// Teks UI "tempat gacha" — KHUSUS era Meiji 明治 (福引 fukubiki · 福箱 fukubako).
//
// Konsep: gacha Meiji = 福引 (undian berhadiah ala department store Meiji) —
// tarik くじ dari kotak 福箱, sejalan dengan nama gacha di eraNames.js
// ('福引') dan PRD docs/tema/meiji.md §8/§16. Seperti Edo, Meiji memakai
// KANJI + furigana (era cetak & modern; pemain Lv 50 sudah bisa kanji), bukan
// kana seperti Heian.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

export const MEIJI_GACHA = {
  kicker: '運試し',                              // uji keberuntungan
  title: '福引',                                 // fukubiki — undian berhadiah Meiji
  titleSub: 'ふくびき · fukubiki',                // furigana + romaji (lapisan belajar)
  tagline: '福箱から、くじを引く。',               // tarik くじ dari kotak 福.
  pull1: '引く 1本',                              // tarik 1 batang
  pull10: '引く 10本',                            // tarik 10 batang
  contents: '福箱の中身',                          // isi kotak 福
  ownedSuffix: '所持',                            // dimiliki
  toBackpack: '引いたくじは すぐ 鞄 へ',            // hasil masuk 鞄 (kaban)
  resultTitle: '引きの結果',                       // hasil tarikan
  skip: '飛ばす',                                 // lewati
  close: '閉じる',                                // tutup
  watermark: '福',                                // 福 — kotak undian
};

export const isMeiji = (eraId) => eraId === 'meiji';

// Salinan baru tiap panggilan (konstanta tak bisa dirusak pemanggil).
export const gachaCopyMeiji = () => ({ ...MEIJI_GACHA });
