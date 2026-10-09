// ─────────────────────────────────────────────────────────────────────────────
// Teks UI "tempat gacha" — KHUSUS era Shōwa 昭和 (ガチャガチャ gachagacha).
//
// Konsep: gacha Shōwa = ガチャガチャ (mesin kapsul, lahir 1965) — putar tuas →
// kapsul keluar. Sejalan dengan nama gacha di eraNames.js ('ガチャガチャ') dan
// PRD docs/tema/showa.md §8/§16. Seperti Edo/Meiji, Shōwa memakai KANJI +
// KATAKANA (era modern; pemain Lv 100 sudah mahir), bukan kana seperti Heian.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

export const SHOWA_GACHA = {
  kicker: '運試し',                              // uji keberuntungan
  title: 'ガチャガチャ',                          // gachagacha — mesin kapsul Shōwa
  titleSub: 'がちゃがちゃ · gachagacha',          // furigana + romaji (lapisan belajar)
  tagline: 'カプセルを回す。当たりか、はずれか。',   // putar kapsul. jackpot atau bukan?
  pull1: '回す 1回',                              // putar 1x
  pull10: '回す 10回',                            // putar 10x
  contents: 'カプセルの中身',                      // isi kapsul
  ownedSuffix: '所持',                            // dimiliki
  toBackpack: '出たカプセルは すぐ ランドセル へ',    // hasil masuk ランドセル (tas sekolah)
  resultTitle: '排出の結果',                       // hasil keluaran
  skip: '飛ばす',                                 // lewati
  close: '閉じる',                                // tutup
  watermark: '玉',                                // 玉 — kapsul gacha
};

export const isShowa = (eraId) => eraId === 'showa';

// Salinan baru tiap panggilan (konstanta tak bisa dirusak pemanggil).
export const gachaCopyShowa = () => ({ ...SHOWA_GACHA });
