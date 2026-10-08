import test from 'node:test';
import assert from 'node:assert/strict';
import { looseAmount, looseIndices, LOOSE_MAX, LOOSE_SAFE_STREAK } from './looseType.js';

test('looseAmount: streak 0 > 0; streak 30 = 0', () => {
  assert.ok(looseAmount(0) > 0);
  assert.equal(looseAmount(30), 0);
  assert.equal(looseAmount(100), 0);
});

test('looseAmount: menurun seiring streak', () => {
  assert.ok(looseAmount(5) < looseAmount(0));
  assert.equal(looseAmount(0), LOOSE_MAX);
  assert.equal(LOOSE_SAFE_STREAK, 30);
});

test('looseIndices: deterministik via seed', () => {
  const a = looseIndices(6, 0.35, 42);
  const b = looseIndices(6, 0.35, 42);
  assert.deepEqual(a, b);
});

test('looseIndices: minimal 1 index kalau amount > 0', () => {
  assert.equal(looseIndices(6, 0.01, 1).length, 1);
});

test('looseIndices: [] kalau amount 0 atau count 0', () => {
  assert.deepEqual(looseIndices(6, 0, 1), []);
  assert.deepEqual(looseIndices(0, 0.3, 1), []);
});

test('looseIndices: index selalu valid & unik', () => {
  const idx = looseIndices(5, 0.35, 7);
  assert.equal(new Set(idx).size, idx.length);
  for (const i of idx) assert.ok(i >= 0 && i < 5);
});
