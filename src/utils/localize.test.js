import test from 'node:test';
import assert from 'node:assert/strict';
import { localized, localizedEn, localizedArray } from './localize.js';

test('localized: mode id → field dasar (Indonesia)', () => {
  const o = { questionText: 'Pertanyaan 1', questionText_en: 'Question 1' };
  assert.equal(localized(o, 'questionText', 'id'), 'Pertanyaan 1');
});

test('localized: mode en → field _en', () => {
  const o = { questionText: 'Pertanyaan 1', questionText_en: 'Question 1' };
  assert.equal(localized(o, 'questionText', 'en'), 'Question 1');
  assert.equal(localizedEn(o, 'questionText'), 'Question 1');
});

test('localized: fallback ke field dasar kalau _en tidak ada', () => {
  const o = { questionText: 'Pertanyaan 1' };
  assert.equal(localized(o, 'questionText', 'en'), 'Pertanyaan 1');
  // _en kosong string juga fallback
  assert.equal(localized({ a: 'id', a_en: '' }, 'a', 'en'), 'id');
});

test('localized: objek null/undefined aman → string kosong', () => {
  assert.equal(localized(null, 'x', 'en'), '');
  assert.equal(localized(undefined, 'x', 'id'), '');
  assert.equal(localizedEn(null, 'x'), '');
});

test('localized: bahasa tak dikenal diperlakukan seperti en', () => {
  const o = { t: 'id', t_en: 'en' };
  assert.equal(localized(o, 't', undefined), 'en');
  assert.equal(localized(o, 't', 'fr'), 'en');
});

test('localizedArray: mode id → array dasar', () => {
  const o = { objectives: ['a', 'b'], objectives_en: ['A', 'B'] };
  assert.deepEqual(localizedArray(o, 'objectives', 'id'), ['a', 'b']);
});

test('localizedArray: mode en → array _en kalau panjang cocok', () => {
  const o = { objectives: ['a', 'b'], objectives_en: ['A', 'B'] };
  assert.deepEqual(localizedArray(o, 'objectives', 'en'), ['A', 'B']);
});

test('localizedArray: _en panjang beda → fallback ke dasar', () => {
  const o = { objectives: ['a', 'b'], objectives_en: ['A'] };
  assert.deepEqual(localizedArray(o, 'objectives', 'en'), ['a', 'b']);
});

test('localizedArray: field hilang / bukan array → array kosong', () => {
  assert.deepEqual(localizedArray({}, 'objectives', 'en'), []);
  assert.deepEqual(localizedArray({ objectives: 'bukan array' }, 'objectives', 'en'), []);
  assert.deepEqual(localizedArray(null, 'objectives', 'en'), []);
});
