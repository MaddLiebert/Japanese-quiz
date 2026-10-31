// ─────────────────────────────────────────────────────────────────────────────
// Mode SULIT kuis Kotoba: soal KANJI, jawaban HIRAGANA (bacaan).
//
// Alasan: mode gampang/lumayan menampilkan kata dalam kana lalu menanyakan arti,
// jadi kanji kotoba tidak pernah dilatih. Di mode sulit, kata ditampilkan dalam
// bentuk kanji (食べる) dan opsinya adalah bacaan kana (たべる) — satu soal
// melatih pengenalan kanji SEKALIGUS hafalan kotoba.
//
// Modul murni (tanpa React / tanpa import JSON): peta kanji dikirim sebagai
// parameter, sesuai aturan repo untuk modul yang diuji `node --test`.
// ─────────────────────────────────────────────────────────────────────────────
import { shuffle, buildKotobaReadingOptions } from './questionBuilder.js';

export const KOTOBA_READING_MODE = 'kotoba-reading';

// Item kotoba kana + entri peta → item siap tanya (char = kanji, reading = kana).
// Mengembalikan null kalau kata itu tidak punya bentuk kanji umum (コーヒー, ドア).
export function toReadingItem(item, kanjiMap) {
  const entry = kanjiMap?.[item?.id];
  if (!entry?.k || !entry?.r) return null;
  return {
    ...item,
    char: entry.k,        // tampil di kartu soal: KANJI
    reading: entry.r,     // jawaban benar: HIRAGANA
    kana: item.char,      // bentuk kana asli (untuk reveal)
    quizMode: KOTOBA_READING_MODE,
  };
}

// Saring pool kotoba → hanya yang punya bentuk kanji.
export function readingPool(items, kanjiMap) {
  const out = [];
  for (const item of items || []) {
    const converted = toReadingItem(item, kanjiMap);
    if (converted) out.push(converted);
  }
  return out;
}

// Susun seluruh soal satu sesi (target + opsi) untuk mode kanji → hiragana.
// Satu bentuk kanji hanya boleh jadi satu soal: 道 dipakai dua entri kotoba
// (みち "jalan" & みち "jalanan"), dan dua soal identik membingungkan.
//
// `fallbackItems` (opsional, seluruh dataset kotoba): kategori kecil seperti
// Angka hanya berisi 2 kata — tanpa cadangan, soal cuma punya 2 opsi.
export function buildKotobaReadingQuiz({ items, kanjiMap, optionCount = 4, fallbackItems = [], rng = Math.random }) {
  const pool = readingPool(items, kanjiMap);
  const fallbackPool = fallbackItems.length ? readingPool(fallbackItems, kanjiMap) : pool;
  const usedForms = new Set();
  const targets = [];
  for (const item of shuffle(pool, rng)) {
    if (usedForms.has(item.char)) continue;
    usedForms.add(item.char);
    targets.push(item);
  }
  return targets.map((item) => ({
    target: item,
    options: buildKotobaReadingOptions(item, pool, optionCount, rng, fallbackPool),
  }));
}
