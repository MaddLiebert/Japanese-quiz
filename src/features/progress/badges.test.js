import test from 'node:test';
import assert from 'node:assert/strict';
import { pickBadges, BADGE_DISPLAY_MAX } from './badges.js';

test('pickBadges: tanpa pilihan user → 4 badge pertama yang terbuka', () => {
  const all = ['a', 'b', 'c', 'd', 'e', 'f'];
  assert.deepEqual(pickBadges(all, []), ['a', 'b', 'c', 'd']);
});

test('pickBadges: pilihan user menang (tetap maks 4)', () => {
  const all = ['a', 'b', 'c', 'd', 'e'];
  assert.deepEqual(pickBadges(all, ['e', 'c']), ['e', 'c']);
  assert.deepEqual(pickBadges(all, ['e', 'c', 'a', 'b', 'd']), ['e', 'c', 'a', 'b']);
});

test('pickBadges: kurang dari 4 → tampil seadanya (tanpa placeholder)', () => {
  assert.deepEqual(pickBadges(['a', 'b'], []), ['a', 'b']);
  assert.deepEqual(pickBadges([], []), []);
});

test('pickBadges: input kotor aman (null / bukan array)', () => {
  assert.deepEqual(pickBadges(null, null), []);
  assert.deepEqual(pickBadges(undefined, ['x']), ['x']);
  assert.deepEqual(pickBadges(['a'], 'bukan-array'), ['a']);
});

test('pickBadges: max bisa diatur; BADGE_DISPLAY_MAX = 4 (aturan produk)', () => {
  assert.equal(BADGE_DISPLAY_MAX, 4);
  assert.deepEqual(pickBadges(['a', 'b', 'c'], [], 2), ['a', 'b']);
});
