import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  MODE_JP, MODE_TR, shuffleTokens, buildPool, isCorrectOrder,
  normalizeSentence, pickScrambleItems, buildScrambleQuestion, buildScrambleSession,
} from './scramble.js';

// Data asli dibaca manual di test (aturan repo: modul murni dilarang import JSON).
const bank = JSON.parse(
  readFileSync(new URL('../../data/sentenceScramble.json', import.meta.url), 'utf8'),
);
const ITEMS = bank.items;

// LCG deterministik — urutan acak stabil di test.
const lcg = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

test('bank: minimal 100 soal, id unik, tiap soal punya 3 bahasa', () => {
  assert.ok(ITEMS.length >= 100, `bank cuma ${ITEMS.length} soal`);
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length);
  for (const it of ITEMS) {
    for (const lang of ['jp', 'id', 'en']) {
      assert.ok(Array.isArray(it.langs[lang].tokens), `${it.id}.${lang}.tokens bukan array`);
      assert.ok(it.langs[lang].tokens.length >= 2, `${it.id}.${lang} token < 2`);
      assert.equal(typeof it.langs[lang].display, 'string');
      assert.ok(it.langs[lang].display.length > 0);
    }
    assert.equal(typeof it.langs.jp.romaji, 'string');
    assert.ok(it.langs.jp.romaji.length > 0, `${it.id} tanpa romaji`);
  }
});

test('bank: pengecoh tidak boleh kembar dengan token jawaban', () => {
  for (const it of ITEMS) {
    for (const lang of ['jp', 'id', 'en']) {
      const answer = new Set(it.langs[lang].tokens.map((t) => t.toLowerCase()));
      for (const d of it.distractors[lang]) {
        assert.ok(
          !answer.has(d.toLowerCase()),
          `${it.id}.${lang}: pengecoh "${d}" kembar dengan token jawaban`,
        );
      }
    }
  }
});

test('bank: token Jepang menyusun ulang kalimat aslinya', () => {
  for (const it of ITEMS) {
    assert.equal(
      normalizeSentence(it.langs.jp.tokens.join('')),
      normalizeSentence(it.langs.jp.display),
      `${it.id}: token jp tidak menyusun ulang display`,
    );
  }
});

test('shuffleTokens: permutasi, array baru, input tetap', () => {
  const input = ['a', 'b', 'c', 'd'];
  const out = shuffleTokens(input);
  assert.notEqual(out, input);
  assert.deepEqual([...out].sort(), ['a', 'b', 'c', 'd']);
  assert.deepEqual(input, ['a', 'b', 'c', 'd']);
});

test('buildPool: semua token jawaban + pengecoh masuk, key unik', () => {
  const { pool, answer, answerKeys } = buildPool(['に', 'に', 'いきます'], ['は', 'が']);
  assert.equal(answer.length, 3);
  assert.equal(pool.length, 5);
  assert.equal(new Set(pool.map((b) => b.key)).size, 5);
  assert.equal(answerKeys.length, 3);
  // token kembar tetap terpisah jadi dua balok
  assert.equal(pool.filter((b) => b.text === 'に').length, 2);
});

test('buildPool: pengecoh ditandai isDistractor', () => {
  const { pool } = buildPool(['あ'], ['い']);
  assert.equal(pool.filter((b) => b.isDistractor).length, 1);
  assert.equal(pool.filter((b) => !b.isDistractor).length, 1);
});

test('isCorrectOrder: hanya urutan persis yang benar', () => {
  const keys = ['a0', 'a1', 'a2'];
  assert.equal(isCorrectOrder(['a0', 'a1', 'a2'], keys), true);
  assert.equal(isCorrectOrder(['a1', 'a0', 'a2'], keys), false);
  assert.equal(isCorrectOrder(['a0', 'a1'], keys), false);
  assert.equal(isCorrectOrder(['a0', 'a1', 'a2', 'd0'], keys), false);
  assert.equal(isCorrectOrder(null, keys), false);
});

test('normalizeSentence: abaikan tanda baca & spasi', () => {
  assert.equal(normalizeSentence('いきます。'), normalizeSentence('いきます'));
  assert.equal(normalizeSentence('a b, c!'), normalizeSentence('abc'));
});

test('pickScrambleItems: hormati jumlah & kategori', () => {
  const picked = pickScrambleItems(ITEMS, { count: 7, rng: lcg(7) });
  assert.equal(picked.length, 7);
  assert.equal(new Set(picked.map((i) => i.id)).size, 7);

  const onlyParticles = pickScrambleItems(ITEMS, { categories: ['Particles'], count: 100 });
  assert.ok(onlyParticles.length > 0);
  for (const it of onlyParticles) assert.equal(it.category, 'Particles');
});

test('buildScrambleQuestion mode jp: prompt = arti, balok = kana', () => {
  const item = ITEMS[0];
  const q = buildScrambleQuestion(item, { language: 'id', mode: MODE_JP, rng: lcg(1) });
  assert.equal(q.mode, MODE_JP);
  assert.equal(q.prompt, item.langs.id.display);
  assert.deepEqual(
    q.blocks.filter((b) => !b.isDistractor).map((b) => b.text).sort(),
    [...item.langs.jp.tokens].sort(),
  );
  assert.equal(q.answerTokens.length, item.langs.jp.tokens.length);
});

test('buildScrambleQuestion mode tr: prompt = kalimat Jepang, balok = terjemahan', () => {
  const item = ITEMS[0];
  const q = buildScrambleQuestion(item, { language: 'en', mode: MODE_TR, rng: lcg(2) });
  assert.equal(q.mode, MODE_TR);
  assert.equal(q.prompt, item.langs.jp.display);
  assert.equal(q.promptRomaji, item.langs.jp.romaji);
  assert.deepEqual(
    q.blocks.filter((b) => !b.isDistractor).map((b) => b.text).sort(),
    [...item.langs.en.tokens].sort(),
  );
});

test('buildScrambleQuestion: answerKeys menunjuk balok jawaban di kolam', () => {
  const item = ITEMS[3];
  for (const mode of [MODE_JP, MODE_TR]) {
    const q = buildScrambleQuestion(item, { language: 'id', mode, rng: lcg(3) });
    const byKey = new Map(q.blocks.map((b) => [b.key, b]));
    const texts = q.answerKeys.map((k) => byKey.get(k)?.text);
    assert.deepEqual(texts, q.answerTokens);
  }
});

test('buildScrambleSession: dua-duanya ada (jp & tr), jumlah tepat', () => {
  const session = buildScrambleSession(ITEMS, { language: 'id', count: 10, rng: lcg(9) });
  assert.equal(session.length, 10);
  assert.ok(session.some((q) => q.mode === MODE_JP));
  assert.ok(session.some((q) => q.mode === MODE_TR));
  assert.equal(new Set(session.map((q) => q.id)).size, 10);
});

test('buildScrambleSession mix=false: semua mode jp', () => {
  const session = buildScrambleSession(ITEMS, { count: 6, mix: false, rng: lcg(11) });
  assert.ok(session.every((q) => q.mode === MODE_JP));
});

test('buildScrambleSession: bahasa en memakai token Inggris', () => {
  const session = buildScrambleSession(ITEMS, {
    language: 'en', count: 4, mix: false, rng: lcg(5),
  });
  for (const q of session) {
    assert.equal(q.language, 'en');
  }
});
