// Logika murni fitur Writing — tanpa DOM, tanpa React, TANPA import JSON.
// Data dilewatkan sebagai parameter: node ESM wajib import attribute untuk JSON
// (`with { type: 'json' }`) sedangkan Vite tidak — supaya modul ini bisa dites
// `node --test` DAN dipakai browser tanpa trik, data masuk lewat argumen saja.
// Data goresan: public/strokes/<hex>.json hasil scripts/vendor-stroke-data.mjs
import { writeLevel, DEFAULT_WRITE_LEVEL } from './writeQuiz.js';

// XP per karakter yang diselesaikan (bukan per goresan — biar tidak eksploitatif).
// Angka ada di WRITE_LEVELS (writeQuiz.js) supaya level & XP tidak pernah beda sumber.
export const WRITE_XP = (level = DEFAULT_WRITE_LEVEL) => writeLevel(level).xp;

// 'あ' → '03042' (5 digit hex). Hanya untuk 1 code point; lainnya null.
export const strokeHex = (char) => {
  if (!char || typeof char !== 'string') return null;
  const points = [...char.normalize('NFC')];
  if (points.length !== 1) return null;
  return points[0].codePointAt(0).toString(16).padStart(5, '0');
};

// 'あ' → '/strokes/03042.json' | null
export const strokeDataPath = (char) => {
  const hex = strokeHex(char);
  return hex ? `/strokes/${hex}.json` : null;
};

// Karakter bisa dilatih tulis kalau 1 code point.
export const isWritable = (item) => Boolean(item && strokeHex(item.char));

// XP untuk menyelesaikan 1 karakter pada level tertentu.
export const writeXpFor = (item, level = DEFAULT_WRITE_LEVEL) => {
  const xp = WRITE_XP(level);
  return item?.type === 'kanji' ? xp.kanji : xp.kana;
};

// Susun grup latihan dari dataset yang ada.
// Hiragana/Katakana dikelompokkan per `row`; Kanji per `category`.
// Item yoon (2 code point) DIBUANG karena tidak bisa ditulis dalam 1 kotak.
// data: { hiragana: [...], katakana: [...], kanji: [...] }
export const writingGroups = ({ hiragana = [], katakana = [], kanji = [] } = {}) => {
  const groups = [];
  const push = (script, key, items) => {
    const writable = items.filter(isWritable).map((it) => ({
      ...it,
      script,
      strokePath: strokeDataPath(it.char),
    }));
    if (writable.length > 0) groups.push({ key: `${script}:${key}`, script, row: key, items: writable });
  };

  const byRow = (data, script) => {
    const rows = [...new Set(data.map((d) => d.row))];
    for (const row of rows) push(script, row, data.filter((d) => d.row === row));
  };

  byRow(hiragana, 'hiragana');
  byRow(katakana, 'katakana');

  const cats = [...new Set(kanji.map((d) => d.category))];
  for (const cat of cats) push('kanji', cat, kanji.filter((d) => d.category === cat));

  return groups;
};
