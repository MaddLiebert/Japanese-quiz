import test from 'node:test';
import assert from 'node:assert/strict';
import { rememberAnswer, quoteAnswer, hasAnswer, questionById } from './questions.js';

test('QUESTIONS: ada pertanyaan "why"', () => {
  assert.equal(questionById('why').jp.includes('なぜ'), true);
});

test('rememberAnswer + quoteAnswer: round-trip', () => {
  const a = rememberAnswer({}, 'why', 'karena kamu ingin belajar');
  assert.equal(hasAnswer(a, 'why'), true);
  assert.match(quoteAnswer(a, 'why'), /karena kamu ingin belajar/);
});

test('quoteAnswer: null kalau belum dijawab', () => {
  assert.equal(quoteAnswer({}, 'why'), null);
  assert.equal(hasAnswer({}, 'why'), false);
});

test('rememberAnswer: pure (input tak berubah)', () => {
  const orig = {};
  rememberAnswer(orig, 'why', 'x');
  assert.deepEqual(orig, {});
});
