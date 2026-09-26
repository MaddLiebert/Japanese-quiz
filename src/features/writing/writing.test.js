import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  strokeHex, strokeDataPath, isWritable, writingGroups,
  WRITE_XP_PER_STROKE, writeXpFor,
} from './writing.js';

// Modul writing.js sengaja TIDAK import JSON (biar aman di node & Vite sekaligus);
// test memuat dataset sendiri lalu meneruskannya sebagai parameter.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const DATA = {
  hiragana: readJSON('src/data/hiragana.json'),
  katakana: readJSON('src/data/katakana.json'),
  kanji: readJSON('src/data/kanji.json'),
};

test('strokeHex: 5 digit hex dari code point', () => {
  assert.equal(strokeHex('あ'), '03042');
  assert.equal(strokeHex('一'), '04e00');
  assert.equal(strokeHex('ん'), '03093');
  assert.equal(strokeHex('駅'), '099c5');
});

test('strokeHex: karakter >1 code point / kosong → null', () => {
  assert.equal(strokeHex('きゃ'), null);
  assert.equal(strokeHex(''), null);
  assert.equal(strokeHex(null), null);
});

test('strokeDataPath: path public absolut', () => {
  assert.equal(strokeDataPath('あ'), '/strokes/03042.json');
  assert.equal(strokeDataPath('一'), '/strokes/04e00.json');
  assert.equal(strokeDataPath('きゃ'), null);
});

test('isWritable: hanya karakter 1 code point', () => {
  assert.equal(isWritable({ char: 'あ' }), true);
  assert.equal(isWritable({ char: 'ア' }), true);
  assert.equal(isWritable({ char: '一' }), true);
  assert.equal(isWritable({ char: 'きゃ' }), false);
  assert.equal(isWritable(null), false);
});

test('writeXpFor: kana 10 XP, kanji 15 XP, per karakter (bukan per goresan)', () => {
  assert.equal(WRITE_XP_PER_STROKE.kana, 10);
  assert.equal(WRITE_XP_PER_STROKE.kanji, 15);
  assert.equal(writeXpFor({ type: 'seion' }), 10);
  assert.equal(writeXpFor({ type: 'dakuon' }), 10);
  assert.equal(writeXpFor({ type: 'kanji' }), 15);
  assert.equal(writeXpFor(null), 10);
});

test('writingGroups: memisah script & hanya 1 code point, urut row/category', () => {
  const groups = writingGroups(DATA);
  const keys = groups.map((g) => g.key);
  // Hiragana 16 row + Katakana 11 row + Kanji 7 kategori = 34 grup
  assert.equal(groups.length, 34);
  assert.ok(keys.includes('hiragana:a'));
  assert.ok(keys.includes('katakana:a'));
  assert.ok(keys.includes('kanji:NumbersKanji'));

  const hiraA = groups.find((g) => g.key === 'hiragana:a');
  assert.deepEqual(hiraA.items.map((i) => i.char), ['あ', 'い', 'う', 'え', 'お']);

  const kanjiNums = groups.find((g) => g.key === 'kanji:NumbersKanji');
  assert.ok(kanjiNums.items.length > 0);
  for (const it of kanjiNums.items) assert.equal(it.type, 'kanji');

  // Tidak ada item yoon yang ikut (2 code point)
  for (const g of groups) for (const it of g.items) assert.equal([...it.char].length, 1);
});

test('writingGroups: setiap item punya strokePath valid', () => {
  for (const g of writingGroups(DATA)) {
    for (const it of g.items) {
      assert.match(it.strokePath, /^\/strokes\/[0-9a-f]{5}\.json$/);
    }
  }
});

test('writingGroups: total item = 71 hiragana + 46 katakana + 86 kanji = 203', () => {
  const total = writingGroups(DATA).reduce((n, g) => n + g.items.length, 0);
  assert.equal(total, 203);
});

test('writingGroups: argumen kosong → [] (aman, tidak melempar)', () => {
  assert.deepEqual(writingGroups(), []);
  assert.deepEqual(writingGroups({}), []);
});
