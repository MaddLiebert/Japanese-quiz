import test from 'node:test';
import assert from 'node:assert/strict';
import { QUIET_ROUTES, isQuietRoute } from './effectGate.js';

test('isQuietRoute: Ujian N5 → senyap', () => {
  assert.equal(isQuietRoute('/n5-exam'), true);
});

test('isQuietRoute: normalisasi trailing slash / query / hash', () => {
  assert.equal(isQuietRoute('/n5-exam/'), true);
  assert.equal(isQuietRoute('/n5-exam?x=1'), true);
  assert.equal(isQuietRoute('/n5-exam#section'), true);
});

test('isQuietRoute: rute lain → tidak senyap', () => {
  assert.equal(isQuietRoute('/'), false);
  assert.equal(isQuietRoute('/practice'), false);
  assert.equal(isQuietRoute('/death-quiz'), false);
  assert.equal(isQuietRoute('/mondai'), false);
});

test('isQuietRoute: input kosong/asing → tidak senyap (aman default)', () => {
  assert.equal(isQuietRoute(''), false);
  assert.equal(isQuietRoute(undefined), false);
  assert.equal(isQuietRoute(null), false);
});

test('QUIET_ROUTES: berisi tepat /n5-exam', () => {
  assert.deepEqual(QUIET_ROUTES, ['/n5-exam']);
});
