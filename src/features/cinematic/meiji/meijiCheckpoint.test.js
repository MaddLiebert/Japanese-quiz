import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MEIJI_CHECKPOINT_QUESTIONS, MEIJI_CHECKPOINT_PASS, MEIJI_CHECKPOINT_SIZE,
  checkpointQuestions, gradeCheckpoint, validateCheckpoint,
} from './meijiCheckpoint.js';

test('checkpoint: bank soal valid (id unik, opsi, answer sah)', () => {
  assert.deepEqual(validateCheckpoint(), []);
});

test('checkpoint: ambang lulus masuk akal (>=4 dari 5, < jumlah bank)', () => {
  assert.equal(MEIJI_CHECKPOINT_PASS, 4);
  assert.equal(MEIJI_CHECKPOINT_SIZE, 5);
  assert.ok(MEIJI_CHECKPOINT_PASS < MEIJI_CHECKPOINT_QUESTIONS.length);
});

test('checkpoint: pertanyaan per percobaan = SIZE', () => {
  assert.equal(checkpointQuestions().length, MEIJI_CHECKPOINT_SIZE);
  assert.equal(checkpointQuestions(2).length, 2);
  assert.ok(checkpointQuestions(999).length <= MEIJI_CHECKPOINT_QUESTIONS.length);
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

test('checkpoint: tepat di ambang (4 benar) → lulus; 3 benar → gagal', () => {
  const qs = checkpointQuestions();
  const four = qs.map((q, i) => (i < 4 ? q.answer : (q.answer + 1) % q.options.length));
  assert.equal(gradeCheckpoint(four, qs).passed, true);
  const three = qs.map((q, i) => (i < 3 ? q.answer : (q.answer + 1) % q.options.length));
  assert.equal(gradeCheckpoint(three, qs).passed, false);
});

test('checkpoint: jawaban kosong/null tidak dihitung benar', () => {
  const qs = checkpointQuestions();
  const r = gradeCheckpoint([null, undefined, null, null, null], qs);
  assert.equal(r.correct, 0);
  assert.equal(r.passed, false);
});

test('checkpoint: fokus grammar + reading (ada soal partikel & arti kata)', () => {
  const ids = MEIJI_CHECKPOINT_QUESTIONS.map((q) => q.id);
  assert.ok(ids.some((id) => id.startsWith('particle')), 'ada soal partikel (grammar)');
  assert.ok(ids.some((id) => id.startsWith('reading')), 'ada soal bacaan (reading)');
});

test('validateCheckpoint: menangkap answer tak sah & ambang terlalu tinggi', () => {
  const bad = [{ id: 'x', jp: 'あ', options: ['a', 'b'], answer: 5 }];
  assert.ok(validateCheckpoint(bad).some((e) => /answer/.test(e)));
});
