// ─────────────────────────────────────────────────────────────────────────────
// Teks UI "tempat gacha" — KHUSUS era Edo 江戸 (深川 Fukagawa · 富くじ tomikuji).
//
// Konsep: gacha Edo = 富くじ (lotre 木札 kayu dari 富箱) — sejalan dengan nama
// gacha di eraNames.js dan PRD docs/tema/edo.md §8/§11. Beda dari Heian
// (kana, pemain belum bisa kanji), Edo memakai KANJI + furigana karena era
// cetak (pemain sudah bisa kanji di Lv 20).
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

export const EDO_GACHA = {
  kicker: '運試し',                              // uji keberuntungan
  title: '富くじ',                                // tomikuji — lotre Edo
  titleSub: 'とみくじ · tomikuji',                // furigana + romaji (lapisan belajar)
  tagline: '木札を引く。福か、運か。',              // tarik 木札. hoki atau bukan?
  pull1: '引く 1枚',                              // tarik 1 keping
  pull10: '引く 10枚',                            // tarik 10 keping
  contents: '木札の中身',                          // isi 木札
  ownedSuffix: '所持',                            // dimiliki
  toBackpack: '引いた木札は すぐ 風呂敷 へ',         // hasil masuk 風呂敷 (furoshiki)
  resultTitle: '引きの結果',                       // hasil tarikan
  skip: '飛ばす',                                 // lewati
  close: '閉じる',                                // tutup
  watermark: '富',                                // 富 — kotak lotre
};

export const isEdo = (eraId) => eraId === 'edo';

// Salinan baru tiap panggilan (konstanta tak bisa dirusak pemanggil).
export const gachaCopyEdo = () => ({ ...EDO_GACHA });
