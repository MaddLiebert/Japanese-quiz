import test from 'node:test';
import assert from 'node:assert/strict';
import { SEASON_FACTOR, quizTimer, isStandardTime, standardTimeNotice } from './temporal.js';

test('quizTimer: sebelum standar pakai faktor musim (gugur=2 → 8)', () => {
  assert.equal(quizTimer(7, 2, false), 8);
  assert.equal(SEASON_FACTOR[2], 1.15);
});

test('quizTimer: sesudah standar = base (adil)', () => {
  assert.equal(quizTimer(7, 2, true), 7);
});

test('quizTimer: musim tak dikenal → faktor 1.0', () => {
  assert.equal(quizTimer(7, 99, false), 7);
});

test('isStandardTime: aktif dari perhentian 鉄道 (index 4)', () => {
  assert.equal(isStandardTime(0), false);
  assert.equal(isStandardTime(4), true);
  assert.equal(isStandardTime(7), true);
});

test('standardTimeNotice: teks penjelasan ada', () => {
  assert.match(standardTimeNotice('id'), /Jam standar/);
  assert.match(standardTimeNotice('en'), /Standard time/);
});
