import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shuffle, buildOptions } from './questionBuilder.js';

// Data asli dibaca manual di test (aturan repo: modul murni dilarang import JSON).
const read = (name) =>
  JSON.parse(readFileSync(new URL(`../../data/${name}.json`, import.meta.url), 'utf8'));

const hiragana = read('hiragana');
const katakana = read('katakana');
const kotoba = read('kotoba');
const grammar = read('grammar');
const kanji = read('kanji');

const DATASETS = { hiragana, katakana, kotoba, grammar, kanji };

// LCG deterministik — supaya urutan acak stabil di test.
const lcg = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

test('shuffle: permutasi, array baru, input tidak berubah', () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];
  const out = shuffle(input);
  assert.notEqual(out, input);
  assert.deepEqual([...out].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(input, [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('shuffle: deterministik dengan rng yang sama', () => {
  const input = Array.from({ length: 20 }, (_, i) => i);
  const a = shuffle(input, lcg(42));
  const b = shuffle(input, lcg(42));
  assert.deepEqual(a, b);
});

test('buildOptions: 4 opsi, id unik, jawaban benar ikut masuk', () => {
  const item = kotoba[0];
  const options = buildOptions(item, kotoba, 4, DATASETS);
  assert.equal(options.length, 4);
  assert.equal(new Set(options.map((o) => o.id)).size, 4);
  assert.ok(options.some((o) => o.id === item.id));
});

test('buildOptions: item kana → semua opsi script & type sama', () => {
  const item = hiragana[0];
  const options = buildOptions(item, hiragana, 4, DATASETS);
  for (const o of options) {
    assert.equal(o.script, 'hiragana');
    assert.equal(o.type, 'seion');
  }
});

test('buildOptions: item kotoba → opsi punya meaning', () => {
  const item = kotoba[5];
  const options = buildOptions(item, kotoba, 4, DATASETS);
  for (const o of options) {
    assert.equal(typeof o.meaning, 'string');
    assert.ok(o.meaning.length > 0);
  }
});

test('buildOptions: item grammar → opsi punya char & answer', () => {
  const item = grammar[0];
  const options = buildOptions(item, grammar, 4, DATASETS);
  for (const o of options) {
    assert.equal(typeof o.char, 'string');
    assert.equal(typeof o.answer, 'string');
  }
});

test('buildOptions: item kanji → opsi punya onyomi & kunyomi', () => {
  const item = kanji[0];
  const options = buildOptions(item, kanji, 4, DATASETS);
  for (const o of options) {
    assert.equal(typeof o.onyomi, 'string');
    assert.equal(typeof o.kunyomi, 'string');
  }
});

test('buildOptions: tidak ada opsi dengan teks/arti kembar pada grammar', () => {
  // Grammar 'に' punya 5 variasi di grammar.json (g_ni_freq, g_ni_time, dst).
  // Semua opsi yang dihasilkan harus memiliki char unik (tidak ada 2 opsi bertuliskan 'に').
  const niItem = grammar.find((g) => g.char === 'に');
  const options = buildOptions(niItem, grammar, 4, DATASETS);
  const chars = options.map((o) => o.char);
  assert.equal(new Set(chars).size, 4, `Opsi grammar harus unik: ${chars.join(', ')}`);
});

test('buildOptions: tidak ada opsi dengan arti kembar pada kotoba', () => {
  // Misal 'v_ani' ('Older brother') vs 'v_oniisan' ('Older brother')
  const aniItem = kotoba.find((k) => k.id === 'v_ani');
  const options = buildOptions(aniItem, kotoba, 4, DATASETS);
  const meaningsEn = options.map((o) => o.meaning?.toLowerCase());
  const meaningsId = options.map((o) => o.meaning_id?.toLowerCase()).filter(Boolean);
  assert.equal(new Set(meaningsEn).size, 4, `Arti EN harus unik: ${meaningsEn.join(', ')}`);
  assert.equal(new Set(meaningsId).size, meaningsId.length, `Arti ID harus unik: ${meaningsId.join(', ')}`);
});

test('buildOptions: tidak ada opsi dengan romaji kembar pada kana (ji/di, zu/du)', () => {
  const jiItem = hiragana.find((h) => h.id === 'hira_ji');
  const options = buildOptions(jiItem, hiragana, 4, DATASETS);
  const romajis = options.map((o) => o.romaji);
  assert.equal(new Set(romajis).size, 4, `Romaji kana harus unik: ${romajis.join(', ')}`);
});
