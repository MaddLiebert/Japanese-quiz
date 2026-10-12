import test from 'node:test';
import assert from 'node:assert/strict';
import { rankMedal } from './medals.js';

test('rankMedal: 3 teratas dapat medali, sisanya nomor', () => {
  assert.equal(rankMedal(0), '🥇');
  assert.equal(rankMedal(1), '🥈');
  assert.equal(rankMedal(2), '🥉');
  assert.equal(rankMedal(3), '4');
  assert.equal(rankMedal(99), '100');
});
