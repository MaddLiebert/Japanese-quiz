import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEATH_START_LIVES,
  DEATH_TIMER_S,
  DEATH_XP_PER_CORRECT,
  DEATH_XP_PENALTY,
  DEATH_UNLOCK_XP,
  isDeathQuizUnlocked,
  allQuizItems,
  refillDeathQueue,
  drawNextDeathItem,
  applyDeathPenalty,
} from './deathQuiz.js';

// Data asli dibaca manual di test (aturan repo: modul murni dilarang import JSON).
const read = (name) =>
  JSON.parse(readFileSync(new URL(`../../data/${name}.json`, import.meta.url), 'utf8'));

const DATASETS = {
  hiragana: read('hiragana'),
  katakana: read('katakana'),
  kotoba: read('kotoba'),
  grammar: read('grammar'),
  kanji: read('kanji'),
};

// LCG deterministik — supaya urutan acak stabil di test.
const lcg = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

test('isDeathQuizUnlocked: rank Shogun → true', () => {
  assert.equal(isDeathQuizUnlocked('Shogun 👹'), true);
});

test('isDeathQuizUnlocked: rank di bawah Shogun → false', () => {
  assert.equal(isDeathQuizUnlocked('Sensei 📜'), false);
  assert.equal(isDeathQuizUnlocked('Senpai 🗡️'), false);
  assert.equal(isDeathQuizUnlocked('Kouhai 🐣'), false);
});

test('isDeathQuizUnlocked: input aneh → false (tidak throw)', () => {
  assert.equal(isDeathQuizUnlocked(null), false);
  assert.equal(isDeathQuizUnlocked(undefined), false);
  assert.equal(isDeathQuizUnlocked(12345), false);
  assert.equal(isDeathQuizUnlocked(''), false);
});

test('konstanta desain terkunci', () => {
  assert.equal(DEATH_START_LIVES, 3);
  assert.equal(DEATH_TIMER_S, 7);
  assert.equal(DEATH_XP_PER_CORRECT, 40);
  assert.equal(DEATH_XP_PENALTY, 300);
  assert.equal(DEATH_UNLOCK_XP, 20000);
});

test('applyDeathPenalty: 25000 → 24700', () => {
  assert.equal(applyDeathPenalty(25000), 24700);
});

test('applyDeathPenalty: clamp di 0 (300/100/0 → 0)', () => {
  assert.equal(applyDeathPenalty(300), 0);
  assert.equal(applyDeathPenalty(100), 0);
  assert.equal(applyDeathPenalty(0), 0);
});

test('applyDeathPenalty: input aneh → 0 (tidak throw)', () => {
  assert.equal(applyDeathPenalty(NaN), 0);
  assert.equal(applyDeathPenalty(-50), 0);
  assert.equal(applyDeathPenalty(undefined), 0);
});

test('allQuizItems: 1165 item, urutan pool hiragana→katakana→kotoba→grammar→kanji', () => {
  const items = allQuizItems(DATASETS);
  assert.equal(items.length, 1165);
  assert.equal(items.length, 104 + 46 + 876 + 53 + 86);
  assert.equal(items[0].id, DATASETS.hiragana[0].id);
  assert.equal(items[104].id, DATASETS.katakana[0].id);
  assert.equal(items[1164].id, DATASETS.kanji[DATASETS.kanji.length - 1].id);
});

test('refillDeathQueue: isi sama (multiset), array baru, input tidak berubah', () => {
  const items = DATASETS.hiragana.slice(0, 30);
  const before = JSON.stringify(items);
  const queue = refillDeathQueue(items, lcg(7));
  assert.notEqual(queue, items);
  assert.deepEqual([...queue].map((i) => i.id).sort(), [...items].map((i) => i.id).sort());
  assert.equal(JSON.stringify(items), before);
});

test('drawNextDeathItem: queue menyusut 1 tiap draw + item selalu valid', () => {
  let state = { queue: refillDeathQueue(DATASETS.hiragana, lcg(11)), lastId: null };
  const len0 = state.queue.length;
  const r1 = drawNextDeathItem(state, DATASETS.hiragana, lcg(11));
  assert.ok(r1.item && r1.item.id);
  assert.equal(r1.queue.length, len0 - 1);
  const r2 = drawNextDeathItem(r1, DATASETS.hiragana, lcg(11));
  assert.ok(r2.item && r2.item.id);
  assert.equal(r2.queue.length, len0 - 2);
});

test('endless: 2.500 draw dari 100 item — tidak pernah throw/undefined (refill otomatis)', () => {
  const sample = DATASETS.hiragana.slice(0, 100);
  let state = { queue: [], lastId: null };
  const rng = lcg(99);
  for (let i = 0; i < 2500; i++) {
    state = drawNextDeathItem(state, sample, rng);
    assert.ok(state.item && state.item.id, `draw #${i} kosong`);
  }
});

test('tidak ada dua soal id sama berurutan, termasuk di batas refill (seeded)', () => {
  const sample = DATASETS.katakana.slice(0, 10);
  let state = { queue: [], lastId: null };
  const rng = lcg(123);
  let prev = null;
  for (let i = 0; i < 25; i++) {
    state = drawNextDeathItem(state, sample, rng);
    if (prev) assert.notEqual(state.item.id, prev, `duplikat berurutan di draw #${i}`);
    prev = state.item.id;
  }
});
