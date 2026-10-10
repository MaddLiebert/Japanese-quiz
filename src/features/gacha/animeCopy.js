// ─────────────────────────────────────────────────────────────────────────────
// Teks UI "tempat gacha" — KHUSUS era 多元 Anime Multiverse (クレーンゲーム).
//
// Konsep: gacha 多元 = クレーンゲーム (UFO catcher arcade) — cakar menjatuhkan
// figur/kapsul. Sejalan dengan nama gacha di eraNames.js ('クレーンゲーム') dan
// PRD docs/tema/anime.md §8/§16. Seperti Shōwa, 多元 memakai KANJI + KATAKANA
// (bahasa pop; pemain Lv 150 sudah lewat N5), bukan kana seperti Heian.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

export const ANIME_GACHA = {
  kicker: '運試し',                              // uji keberuntungan
  title: 'クレーンゲーム',                        // crane game — UFO catcher
  titleSub: 'くれーんげーむ · crane game',        // furigana + romaji (lapisan belajar)
  tagline: 'アームを動かして、景品をつかめ。',      // gerakkan cakar, rebut hadiahnya
  pull1: 'アーム 1回',                            // cakar 1x
  pull10: 'アーム 10回',                          // cakar 10x
  contents: '景品の中身',                          // isi hadiah
  ownedSuffix: '所持',                            // dimiliki
  toBackpack: 'とった景品は すぐ リュック へ',      // hasil masuk リュック (ransel)
  resultTitle: '獲得の結果',                       // hasil tangkapan
  skip: 'スキップ',                               // lewati
  close: 'とじる',                                // tutup
  watermark: '景',                                // 景 — hadiah (arcade prize)
};

export const isAnime = (eraId) => eraId === 'anime';

// Salinan baru tiap panggilan (konstanta tak bisa dirusak pemanggil).
export const gachaCopyAnime = () => ({ ...ANIME_GACHA });
