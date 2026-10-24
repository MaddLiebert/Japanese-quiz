import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  MODE_JP, shuffleTokens, buildPool, isCorrectOrder,
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

test('bank: block jp punya t + kanji field (kanji opsional, t wajib)', () => {
  for (const it of ITEMS) {
    assert.ok(Array.isArray(it.langs.jp.blocks), `${it.id} tanpa blocks`);
    assert.equal(it.langs.jp.blocks.length, it.langs.jp.tokens.length);
    for (const b of it.langs.jp.blocks) {
      assert.ok(typeof b.t === 'string' && b.t.length > 0, `${it.id} block tanpa t`);
      assert.ok('kanji' in b, `${it.id} block tanpa field kanji`);
      assert.equal(b.t, (b.kanji ?? b.t).length > 0 ? b.t : b.t);
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

test('buildPool: semua token jawaban + pengecoh masuk, key unik, pengecoh ditandai', () => {
  const blocks = [{ t: 'あした', kanji: '明日' }, { t: 'に', kanji: null }, { t: 'いきます', kanji: '行きます' }];
  const { answer, pool, answerKeys } = buildPool(blocks, ['は'], lcg(3));
  assert.equal(answer.length, 3);
  assert.equal(pool.length, 4);
  assert.equal(new Set(pool.map((b) => b.key)).size, 4);
  assert.deepEqual(answerKeys, ['a0', 'a1', 'a2']);
  const dist = pool.filter((b) => b.isDistractor);
  assert.equal(dist.length, 1);
  assert.equal(dist[0].text, 'は');
});

test('buildPool: token kembar tetap terpisah jadi dua balok', () => {
  const blocks = [{ t: 'に', kanji: null }, { t: 'に', kanji: null }, { t: 'いきます', kanji: '行きます' }];
  const { pool } = buildPool(blocks, []);
  assert.equal(pool.filter((b) => b.text === 'に').length, 2);
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

test('buildScrambleQuestion easy: prompt = arti id, balok = hiragana', () => {
  const item = ITEMS[0];
  const q = buildScrambleQuestion(item, { language: 'id', difficulty: 'easy', rng: lcg(1) });
  assert.equal(q.mode, MODE_JP);
  assert.equal(q.difficulty, 'easy');
  assert.equal(q.prompt, item.langs.id.display, item.langs.id.display);
  // easy → balok = token hiragana apa adanya (bukan kanji)
  for (const b of q.blocks) {
    if (b.isDistractor) continue;
    assert.ok(item.langs.jp.tokens.includes(b.text), `${b.text} bukan token`);
  }
});

test('buildScrambleQuestion hard: kata ber-kanji ditampil kanji, partikel tetap kana', () => {
  const mk = {
    langs: {
      jp: {
        blocks: [{ t: 'あした', kanji: '明日' }, { t: 'に', kanji: null }, { t: 'いきます', kanji: '行きます' }],
        tokens: ['あした', 'に', 'いきます'],
        display: 'あしたにいきます。', romaji: 'ashita ni ikimasu',
      },
      id: { display: 'Besok pergi.', tokens: ['Besok', 'pergi'] },
      en: { display: 'Tomorrow go.', tokens: ['Tomorrow', 'go'] },
    },
    id: 'mk', grammarId: 'g', category: 'Kata Kerja',
  };
  const q = buildScrambleQuestion(mk, { language: 'id', difficulty: 'hard', rng: lcg(4) });
  const texts = q.blocks.filter((b) => !b.isDistractor).map((b) => b.text);
  assert.ok(texts.includes('明日'), 'kanji bermakna wajib tampil di hard');
  assert.ok(texts.includes('に'), 'partikel tanpa kanji tetap hiragana');
  assert.ok(!texts.includes('あした'), 'token ber-kanji tak boleh kana');
});

test('buildScrambleQuestion medium: pakai furigana pasangan kanji/kana', () => {
  const mk = {
    langs: {
      jp: {
        blocks: [{ t: 'あした', kanji: '明日' }, { t: 'に', kanji: null }, { t: 'いきます', kanji: '行きます' }],
        tokens: ['あした', 'に', 'いきます'], display: 'あしたにいきます。', romaji: 'ashita ni ikimasu',
      },
      id: { display: 'Besok pergi.', tokens: ['Besok', 'pergi'] },
      en: { display: 'Tomorrow go.', tokens: ['Tomorrow', 'go'] },
    },
    id: 'mk', grammarId: 'g', category: 'Kata Kerja',
  };
  const q = buildScrambleQuestion(mk, { language: 'id', difficulty: 'medium', rng: lcg(4) });
  assert.equal(q.furigana.length, 3);
  assert.deepEqual(
    q.furigana.map((f) => [f.kanji, f.kana]),
    [['明日', 'あした'], ['に', 'に'], ['行きます', 'いきます']],
  );
});

test('buildScrambleSession: semua jp mode, jumlah tepat, difficulty diteruskan', () => {
  const session = buildScrambleSession(ITEMS, { language: 'id', count: 10, difficulty: 'hard', rng: lcg(9) });  // eslint-disable-line no-undef
  // langsung pakai import buildScrambleSession
  const s2 = buildScrambleSession(ITEMS, { language: 'en', count: 12, difficulty: 'hard', rng: lcg(9) });
  assert.equal(s2.length, 12);
  assert.ok(s2.every((q) => q.mode === MODE_JP && q.difficulty === 'hard'));
  assert.ok(s2.every((q) => q.prompt.length > 0));
});
