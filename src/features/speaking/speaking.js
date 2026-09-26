// speaking.js — logika murni fitur Speaking (tanpa DOM/React/import JSON).
// Data dilewatkan sebagai parameter (pola sama dengan features/writing/writing.js).
import { readingsFromKanji } from './speechMatch.js';

// ── Level kesulitan (bebas dipilih, TANPA gating) ───────────────────────────
// SATU-SATUNYA sumber perilaku tampilan + pengali XP per level:
// guide  = semua petunjuk tampil (teks + bacaan + arti), XP ×1
// recall = hanya teks Jepang (bacaan & arti disembunyikan), XP ×1.5
// blind  = teks disembunyikan, arti jadi petunjuk, XP ×2
export const SPEAK_LEVELS = {
  guide:  { key: 'guide',  label: 'Pandu', xpMult: 1,   showText: true,  showReading: true,  showMeaning: true },
  recall: { key: 'recall', label: 'Ingat', xpMult: 1.5, showText: true,  showReading: false, showMeaning: false },
  blind:  { key: 'blind',  label: 'Buta',  xpMult: 2,   showText: false, showReading: false, showMeaning: true },
};
export const DEFAULT_SPEAK_LEVEL = 'guide';

// Level tak dikenal / kosong → guide (normalisasi, tidak throw).
export const speakLevel = (level) => SPEAK_LEVELS[level] || SPEAK_LEVELS[DEFAULT_SPEAK_LEVEL];

// XP dasar per jenis konten — SATU-SATUNYA sumber angka (dipakai UI & test).
export const SPEAK_XP = { hiragana: 8, katakana: 8, kotoba: 10, kanji: 12, 'poem-line': 5, poem: 25 };

// XP final = dasar × pengali level (dibulatkan). Item tanpa kind → 0.
export const speakXpFor = (item, level) => {
  if (!item || !item.kind) return 0;
  const base = SPEAK_XP[item.kind] ?? 0;
  return base ? Math.round(base * speakLevel(level).xpMult) : 0;
};

// XP satu baris puisi pada level tertentu (dipakai PoemSession).
export const lineXpFor = (level) => speakXpFor({ kind: 'poem-line' }, level);

// Jenis prompt yang tampil saat teks disembunyikan (level Buta):
// - kana (hiragana/katakana): 'audio' — romaji = bacaan itu sendiri, jadi
//   menampilkannya bikin latihan bohong; user mendengar lalu menirukan.
// - lainnya (kotoba/kanji/puisi): 'meaning' — arti bahasa Indonesia/Inggris.
export const speakPromptKind = (item, level) => {
  if (!speakLevel(level).showText) {
    const kind = item?.kind;
    return kind === 'hiragana' || kind === 'katakana' ? 'audio' : 'meaning';
  }
  return 'text';
};

// Teks permukaan satu baris puisi (gabungan t).
export const lineText = (line) =>
  (line?.segments || []).map((s) => s?.t || '').join('');

// Bacaan satu baris puisi (r kalau ada, kalau tidak pakai t).
export const lineReading = (line) =>
  (line?.segments || []).map((s) => s?.r || s?.t || '').join('');

// Item latihan dari dataset kana (hiragana/katakana).
export const kanaSpeakItems = (data, script) =>
  (data || []).map((d) => ({
    id: d.id,
    kind: script,
    display: d.char,
    surface: d.char,
    readings: [d.char],
    meaning: d.romaji,
    sub: d.type,
    row: d.row,
  }));

export const kotobaSpeakItems = (data) =>
  (data || []).map((d) => ({
    id: d.id,
    kind: 'kotoba',
    display: d.char,
    surface: d.char,
    readings: [d.char],
    meaning: d.meaning,
    meaningId: d.meaning_id,
    category: d.category,
  }));

export const kanjiSpeakItems = (data) =>
  (data || []).map((d) => ({
    id: d.id,
    kind: 'kanji',
    display: d.char,
    surface: d.char,
    readings: readingsFromKanji(d),
    meaning: d.meaning,
    meaningId: d.meaning_id,
    category: d.category,
  }));

// Baris-baris puisi → item latihan (XP per baris; SRS per puisi saat selesai).
export const poemLineItems = (poem) =>
  (poem?.lines || []).map((line, i) => ({
    id: `${poem.id}_l${i}`,
    kind: 'poem-line',
    display: lineText(line),
    surface: lineText(line),
    readings: [lineReading(line)],
    segments: line.segments || [],
  }));

// Filter kana per tipe (seion/dakuon/handakuon/yoon) — 'all' mengembalikan semua.
export const filterKanaByType = (data, type) =>
  !type || type === 'all' ? (data || []) : (data || []).filter((d) => d.type === type);
