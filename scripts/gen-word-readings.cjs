// scripts/gen-word-readings.cjs — hasilkan src/features/speaking/wordReadings.js
// dari JMdict (jmdict-simplified, CC BY-SA 4.0).
//
// Tujuan: fitur Speaking menilai ucapan dengan target KANA, sementara Web Speech
// API Jepang SERING mengembalikan KANJI (ほん → 本). Peta kecil di kanaReadings.js
// hanya menutup ~40 kata; generator ini membangun kamus kata ber-kanji → bacaan
// kana secara menyeluruh, DIBATASI pada bacaan yang memang ada di dataset app
// (agar file tetap kecil & PWA ringan).
//
// Pakai:  node scripts/gen-word-readings.cjs   (butuh .hermes/_jmdict.json)
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const JM = JSON.parse(fs.readFileSync(path.join(root, '.hermes', '_jmdict.json'), 'utf8'));

const toHira = (s) => [...String(s)].map((ch) => {
  const c = ch.codePointAt(0);
  if (c >= 0x30a1 && c <= 0x30f6) return String.fromCodePoint(c - 0x60);
  return ch;
}).join('');

const KANJI = /[\u4e00-\u9faf\u3400-\u4dbf]/;
const KANA_ONLY = /^[\u3041-\u309f\u30a1-\u30f6\u309d\u309e\u30fd\u30feー]+$/;

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', p), 'utf8'));

// ── Bacaan target app: kana dari kotoba, kana, kanji, puisi ──────────────────
const targets = new Set();
const add = (s) => { const h = toHira(s); if (h && KANA_ONLY.test(h)) targets.add(h); };
for (const x of readJson('kotoba.json')) add(x.char);
for (const x of readJson('hiragana.json')) add(x.char);
for (const x of readJson('katakana.json')) add(x.char);
for (const x of readJson('kanji.json')) {
  for (const part of String(x.onyomi || '').split('、')) add(part.split(/[（(]/)[0]);
  for (const part of String(x.kunyomi || '').split('、')) {
    add(part.split(/[（(]/)[0].replace(/^-+|-+$/g, ''));
    add(part.replace(/[（()）]/g, '').replace(/^-+|-+$/g, ''));
  }
}
for (const p of readJson('poems.json')) {
  for (const line of (p.lines || [])) for (const s of (line.segments || [])) add(s.r || s.t);
}

// ── Bangun kamus ────────────────────────────────────────────────────────────
const map = Object.create(null);
for (const w of JM.words) {
  const forms = [...new Set((w.kanji || []).map((k) => k.text).filter((t) => KANJI.test(t)))];
  if (!forms.length) continue;
  const kana = [...new Set((w.kana || []).map((k) => ({ r: toHira(k.text), common: !!k.common })))]
    .filter((k) => KANA_ONLY.test(k.r));
  if (!kana.length) continue;
  // Utamakan bacaan UMUM bila ada — kurangi salah-lolos (mis. 境 → きょう).
  const commons = kana.filter((k) => k.common).map((k) => k.r);
  const pool = commons.length ? commons : kana.map((k) => k.r);
  for (const form of forms) {
    const rel = [...new Set(pool.filter((r) => targets.has(r)))];
    if (!rel.length) continue;
    const set = map[form] || (map[form] = new Set());
    for (const r of rel) set.add(r);
  }
}

const out = {};
for (const k of Object.keys(map).sort((a, b) => a.localeCompare(b, 'ja'))) {
  out[k] = [...map[k]].sort((a, b) => a.localeCompare(b, 'ja'));
}

const header = `// wordReadings.js — KAMUS KATA BER-KANJI → BACAAN KANA (AUTO-GENERATED).
//
// JANGAN edit manual. Regenerasi:  node scripts/gen-word-readings.cjs
// Sumber: JMdict via jmdict-simplified (CC BY-SA 4.0) — hanya bacaan yang
// dipakai dataset app, agar berkas tetap kecil.
//
// Dipakai kanaReadings.js: hasil ASR Jepang yang berupa KANJI (本) diperluas
// jadi kandidat bacaan kana (ほん) sebelum dicocokkan ke target latihan kana.
export const WORD_KANJI_READINGS = ${JSON.stringify(out)};
`;
const dest = path.join(root, 'src', 'features', 'speaking', 'wordReadings.js');
fs.writeFileSync(dest, header, 'utf8');
console.log('kata:', Object.keys(out).length, '| ukuran:', (fs.statSync(dest).size / 1024).toFixed(1), 'KB');

// ── Laporan cakupan ─────────────────────────────────────────────────────────
const byReading = new Map();
for (const [k, rs] of Object.entries(out)) for (const r of rs) {
  if (!byReading.has(r)) byReading.set(r, []);
  byReading.get(r).push(k);
}
const kotoba = readJson('kotoba.json');
const miss = kotoba.filter((x) => !KANJI.test(x.char) && !byReading.has(x.char)).map((x) => x.char);
console.log('kotoba:', kotoba.length, '| ada bentuk kanji:', kotoba.length - miss.length, '| belum:', miss.length);
for (const t of ['ほん', 'くるま', 'みず', 'げんき', 'おかね', 'たべる', 'きょう', 'がっこう', 'すし', 'はは', 'かお', 'いち', 'ひと']) {
  console.log('  ', t, '->', (byReading.get(t) || []).slice(0, 6).join('、') || '(tidak ada)');
}
