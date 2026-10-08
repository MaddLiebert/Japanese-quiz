// ─────────────────────────────────────────────────────────────────────────────
// Bank soal 活字組み (M1). MURNI — array biasa, tanpa import JSON attribute,
// supaya bisa diimpor Vite MAUPUN `node --test`. Logika ada di ./typesetting.js.
//
// Tiap soal: { id, parts[], distractors[], level, translation }
//   parts        = blok BENAR, urut (SOV). Blok partikel ditandai pos:'particle'.
//   distractors  = blok PALSU yang mirip (partikel salah, konjugasi salah).
//   level        = 1 jiplak · 2 ingat · 3 buta (tanpa furigana).
//
// Konvensi id blok: '<qid>-p<n>' (benar) / '<qid>-d<n>' (distraktor).
// Kosakata & pola selaras src/data/grammar.json (level N5).

export const TYPESETTING_BANK = [
  // ── Level 1 — jiplak (furigana tampak, terjemahan tampak) ──────────────────
  {
    id: 't-001', level: 1,
    translation: 'Saya membaca koran setiap pagi.',
    parts: [
      { id: 't-001-p1', jp: '私', pos: 'noun', reading: 'わたし' },
      { id: 't-001-p2', jp: 'は', pos: 'particle', reading: 'は' },
      { id: 't-001-p3', jp: '毎朝', pos: 'noun', reading: 'まいあさ' },
      { id: 't-001-p4', jp: '新聞', pos: 'noun', reading: 'しんぶん' },
      { id: 't-001-p5', jp: 'を', pos: 'particle', reading: 'を' },
      { id: 't-001-p6', jp: '読む', pos: 'verb', reading: 'よむ' },
    ],
    distractors: [
      { id: 't-001-d1', jp: 'が', pos: 'particle', reading: 'が' },
      { id: 't-001-d2', jp: '読んだ', pos: 'verb', reading: 'よんだ' },
    ],
  },
  {
    id: 't-002', level: 1,
    translation: 'Kucing memakan ikan.',
    parts: [
      { id: 't-002-p1', jp: '猫', pos: 'noun', reading: 'ねこ' },
      { id: 't-002-p2', jp: 'が', pos: 'particle', reading: 'が' },
      { id: 't-002-p3', jp: '魚', pos: 'noun', reading: 'さかな' },
      { id: 't-002-p4', jp: 'を', pos: 'particle', reading: 'を' },
      { id: 't-002-p5', jp: '食べた', pos: 'verb', reading: 'たべた' },
    ],
    distractors: [
      { id: 't-002-d1', jp: 'は', pos: 'particle', reading: 'は' },
      { id: 't-002-d2', jp: '食べる', pos: 'verb', reading: 'たべる' },
    ],
  },
  {
    id: 't-003', level: 1,
    translation: 'Saya pergi ke sekolah.',
    parts: [
      { id: 't-003-p1', jp: '学校', pos: 'noun', reading: 'がっこう' },
      { id: 't-003-p2', jp: 'へ', pos: 'particle', reading: 'へ' },
      { id: 't-003-p3', jp: '行きます', pos: 'verb', reading: 'いきます' },
    ],
    distractors: [
      { id: 't-003-d1', jp: 'を', pos: 'particle', reading: 'を' },
      { id: 't-003-d2', jp: '行く', pos: 'verb', reading: 'いく' },
    ],
  },
  {
    id: 't-004', level: 1,
    translation: 'Kemarin hujan.',
    parts: [
      { id: 't-004-p1', jp: '昨日', pos: 'noun', reading: 'きのう' },
      { id: 't-004-p2', jp: 'は', pos: 'particle', reading: 'は' },
      { id: 't-004-p3', jp: '雨', pos: 'noun', reading: 'あめ' },
      { id: 't-004-p4', jp: 'でした', pos: 'aux', reading: 'でした' },
    ],
    distractors: [
      { id: 't-004-d1', jp: 'が', pos: 'particle', reading: 'が' },
      { id: 't-004-d2', jp: 'です', pos: 'aux', reading: 'です' },
    ],
  },

  // ── Level 2 — ingat (furigana tampak, terjemahan disembunyikan) ────────────
  {
    id: 't-005', level: 2,
    translation: 'Saya sedang belajar bahasa Jepang.',
    parts: [
      { id: 't-005-p1', jp: '私', pos: 'noun', reading: 'わたし' },
      { id: 't-005-p2', jp: 'は', pos: 'particle', reading: 'は' },
      { id: 't-005-p3', jp: '日本語', pos: 'noun', reading: 'にほんご' },
      { id: 't-005-p4', jp: 'を', pos: 'particle', reading: 'を' },
      { id: 't-005-p5', jp: '勉強しています', pos: 'verb', reading: 'べんきょうしています' },
    ],
    distractors: [
      { id: 't-005-d1', jp: 'が', pos: 'particle', reading: 'が' },
      { id: 't-005-d2', jp: '勉強しました', pos: 'verb', reading: 'べんきょうしました' },
    ],
  },
  {
    id: 't-006', level: 2,
    translation: 'Orang itu adalah guru.',
    parts: [
      { id: 't-006-p1', jp: 'あの', pos: 'adj', reading: 'あの' },
      { id: 't-006-p2', jp: '人', pos: 'noun', reading: 'ひと' },
      { id: 't-006-p3', jp: 'は', pos: 'particle', reading: 'は' },
      { id: 't-006-p4', jp: '先生', pos: 'noun', reading: 'せんせい' },
      { id: 't-006-p5', jp: 'です', pos: 'aux', reading: 'です' },
    ],
    distractors: [
      { id: 't-006-d1', jp: 'が', pos: 'particle', reading: 'が' },
      { id: 't-006-d2', jp: 'でした', pos: 'aux', reading: 'でした' },
    ],
  },
  {
    id: 't-007', level: 2,
    translation: 'Saya membaca buku di perpustakaan.',
    parts: [
      { id: 't-007-p1', jp: '図書館', pos: 'noun', reading: 'としょかん' },
      { id: 't-007-p2', jp: 'で', pos: 'particle', reading: 'で' },
      { id: 't-007-p3', jp: '本', pos: 'noun', reading: 'ほん' },
      { id: 't-007-p4', jp: 'を', pos: 'particle', reading: 'を' },
      { id: 't-007-p5', jp: '読みます', pos: 'verb', reading: 'よみます' },
    ],
    distractors: [
      { id: 't-007-d1', jp: 'に', pos: 'particle', reading: 'に' },
      { id: 't-007-d2', jp: '読む', pos: 'verb', reading: 'よむ' },
    ],
  },
  {
    id: 't-008', level: 2,
    translation: 'Ada anjing besar.',
    parts: [
      { id: 't-008-p1', jp: '大きい', pos: 'adj', reading: 'おおきい' },
      { id: 't-008-p2', jp: '犬', pos: 'noun', reading: 'いぬ' },
      { id: 't-008-p3', jp: 'が', pos: 'particle', reading: 'が' },
      { id: 't-008-p4', jp: 'います', pos: 'verb', reading: 'います' },
    ],
    distractors: [
      { id: 't-008-d1', jp: '小さい', pos: 'adj', reading: 'ちいさい' },
      { id: 't-008-d2', jp: 'あります', pos: 'verb', reading: 'あります' },
    ],
  },

  // ── Level 3 — buta (tanpa furigana) ────────────────────────────────────────
  {
    id: 't-009', level: 3,
    translation: 'Saya ingin menjadi wartawan.',
    parts: [
      { id: 't-009-p1', jp: '私', pos: 'noun', reading: 'わたし' },
      { id: 't-009-p2', jp: 'は', pos: 'particle', reading: 'は' },
      { id: 't-009-p3', jp: '新聞記者', pos: 'noun', reading: 'しんぶんきしゃ' },
      { id: 't-009-p4', jp: 'に', pos: 'particle', reading: 'に' },
      { id: 't-009-p5', jp: 'なりたい', pos: 'aux', reading: 'なりたい' },
    ],
    distractors: [
      { id: 't-009-d1', jp: 'を', pos: 'particle', reading: 'を' },
      { id: 't-009-d2', jp: 'なった', pos: 'aux', reading: 'なった' },
    ],
  },
  {
    id: 't-010', level: 3,
    translation: 'Pada era Meiji, jalur kereta dibuka.',
    parts: [
      { id: 't-010-p1', jp: '明治', pos: 'noun', reading: 'めいじ' },
      { id: 't-010-p2', jp: '時代', pos: 'noun', reading: 'じだい' },
      { id: 't-010-p3', jp: 'に', pos: 'particle', reading: 'に' },
      { id: 't-010-p4', jp: '鉄道', pos: 'noun', reading: 'てつどう' },
      { id: 't-010-p5', jp: 'が', pos: 'particle', reading: 'が' },
      { id: 't-010-p6', jp: '開通した', pos: 'verb', reading: 'かいつうした' },
    ],
    distractors: [
      { id: 't-010-d1', jp: 'で', pos: 'particle', reading: 'で' },
      { id: 't-010-d2', jp: '開通する', pos: 'verb', reading: 'かいつうする' },
    ],
  },
  {
    id: 't-011', level: 3,
    translation: 'Dia pergi ke kantor naik kereta setiap hari.',
    parts: [
      { id: 't-011-p1', jp: '彼', pos: 'noun', reading: 'かれ' },
      { id: 't-011-p2', jp: 'は', pos: 'particle', reading: 'は' },
      { id: 't-011-p3', jp: '毎日', pos: 'noun', reading: 'まいにち' },
      { id: 't-011-p4', jp: '電車', pos: 'noun', reading: 'でんしゃ' },
      { id: 't-011-p5', jp: 'で', pos: 'particle', reading: 'で' },
      { id: 't-011-p6', jp: '会社', pos: 'noun', reading: 'かいしゃ' },
      { id: 't-011-p7', jp: 'へ', pos: 'particle', reading: 'へ' },
      { id: 't-011-p8', jp: '行く', pos: 'verb', reading: 'いく' },
    ],
    distractors: [
      { id: 't-011-d1', jp: 'を', pos: 'particle', reading: 'を' },
      { id: 't-011-d2', jp: '来る', pos: 'verb', reading: 'くる' },
    ],
  },
  {
    id: 't-012', level: 3,
    translation: 'Buku ini sangat menarik.',
    parts: [
      { id: 't-012-p1', jp: 'この', pos: 'adj', reading: 'この' },
      { id: 't-012-p2', jp: '本', pos: 'noun', reading: 'ほん' },
      { id: 't-012-p3', jp: 'は', pos: 'particle', reading: 'は' },
      { id: 't-012-p4', jp: 'とても', pos: 'adv', reading: 'とても' },
      { id: 't-012-p5', jp: '面白かった', pos: 'adj', reading: 'おもしろかった' },
    ],
    distractors: [
      { id: 't-012-d1', jp: 'が', pos: 'particle', reading: 'が' },
      { id: 't-012-d2', jp: '面白い', pos: 'adj', reading: 'おもしろい' },
    ],
  },
];

export default TYPESETTING_BANK;
