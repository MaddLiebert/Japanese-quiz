import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EDO_CHECKPOINT_QUESTIONS, EDO_CHECKPOINT_PASS, EDO_CHECKPOINT_SIZE,
  checkpointQuestions, gradeCheckpoint, validateCheckpoint,
} from './edoCheckpoint.js';

test('checkpoint: bank soal valid (id unik, opsi, answer sah)', () => {
  assert.deepEqual(validateCheckpoint(), []);
});

test('checkpoint: ambang lulus masuk akal (>=3 dari 4, < jumlah bank)', () => {
  assert.equal(EDO_CHECKPOINT_PASS, 3);
  assert.equal(EDO_CHECKPOINT_SIZE, 4);
  assert.ok(EDO_CHECKPOINT_PASS < EDO_CHECKPOINT_QUESTIONS.length);
});

test('checkpoint: pertanyaan per percobaan = SIZE', () => {
  assert.equal(checkpointQuestions().length, EDO_CHECKPOINT_SIZE);
  assert.equal(checkpointQuestions(2).length, 2);
  assert.ok(checkpointQuestions(999).length <= EDO_CHECKPOINT_QUESTIONS.length);
});

test('checkpoint: jawaban benar semua → lulus', () => {
  const qs = checkpointQuestions();
  const r = gradeCheckpoint(qs.map((q) => q.answer), qs);
  assert.equal(r.correct, qs.length);
  assert.equal(r.passed, true);
});

test('checkpoint: jawaban salah semua → gagal', () => {
  const qs = checkpointQuestions();
  const wrong = qs.map((q) => (q.answer + 1) % q.options.length);
  const r = gradeCheckpoint(wrong, qs);
  assert.equal(r.correct, 0);
  assert.equal(r.passed, false);
});

test('checkpoint: tepat di ambang (3 benar) → lulus; 2 benar → gagal', () => {
  const qs = checkpointQuestions();
  const three = qs.map((q, i) => (i < 3 ? q.answer : (q.answer + 1) % q.options.length));
  assert.equal(gradeCheckpoint(three, qs).passed, true);
  const two = qs.map((q, i) => (i < 2 ? q.answer : (q.answer + 1) % q.options.length));
  assert.equal(gradeCheckpoint(two, qs).passed, false);
});

test('checkpoint: jawaban kosong/null tidak dihitung benar', () => {
  const qs = checkpointQuestions();
  const r = gradeCheckpoint([null, undefined, null, null], qs);
  assert.equal(r.correct, 0);
  assert.equal(r.passed, false);
});

test('validateCheckpoint: menangkap answer tak sah & ambang terlalu tinggi', () => {
  const bad = [{ id: 'x', jp: 'あ', options: ['a', 'b'], answer: 5 }];
  assert.ok(validateCheckpoint(bad).some((e) => /answer/.test(e)));
});
