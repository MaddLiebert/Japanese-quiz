import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGENDARY_BADGES, isLegendary, badgeCircleClass } from './badgeSeal.js';

test('hanya badge 満 (n5_kanpeki) yang legendaris', () => {
  assert.equal(isLegendary('n5_kanpeki'), true);
  // Badge N5 lain tetap biasa — jangan sampai ikut berkilau.
  assert.equal(isLegendary('n5_gokaku'), false);
  assert.equal(isLegendary('n5_yuushuu'), false);
  // Badge umum juga biasa.
  assert.equal(isLegendary('zenith'), false);
  assert.equal(isLegendary('hiragana_origin'), false);
});

test('isLegendary aman untuk input kosong/null', () => {
  assert.equal(isLegendary(undefined), false);
  assert.equal(isLegendary(null), false);
  assert.equal(isLegendary(''), false);
});

test('badgeCircleClass: legendaris pakai animasi emas + overflow terlihat', () => {
  const c = badgeCircleClass('n5_kanpeki');
  assert.ok(c.includes('badge-legendary'));
  assert.ok(c.includes('overflow-visible'));
  assert.ok(!c.includes('border-shu'));
});

test('badgeCircleClass: badge biasa pakai shu (merah cap) & overflow tersembunyi', () => {
  const c = badgeCircleClass('n5_gokaku');
  assert.ok(c.includes('border-shu'));
  assert.ok(c.includes('overflow-hidden'));
  assert.ok(!c.includes('badge-legendary'));
});

test('LEGENDARY_BADGES hanya berisi n5_kanpeki', () => {
  assert.deepEqual([...LEGENDARY_BADGES], ['n5_kanpeki']);
});
