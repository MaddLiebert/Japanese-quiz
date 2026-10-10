// claw.test.js — penjaga logika クレーンゲーム (A5). Lihat SPEC §A5.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLAW_PRICE_1X, CLAW_PRICE_10X, CLAW_DUPLICATE_REFUND,
  clawPrice, rollClaw, clawRefund, validateClawPricing,
} from './claw.js';

test('harga: 1x & 10x; 10x lebih murah per-undian', () => {
  assert.equal(clawPrice(1), CLAW_PRICE_1X);
  assert.equal(clawPrice(10), CLAW_PRICE_10X);
  assert.deepEqual(validateClawPricing(), []);
});

test('rollClaw: jumlah sesuai count & semua id dari pool', () => {
  const pool = ['a', 'b', 'c'];
  const out = rollClaw(pool, 10, () => 0.5);
  assert.equal(out.length, 10);
  assert.ok(out.every((id) => pool.includes(id)));
});

test('rollClaw: rng 0 → elemen pertama; rng ~1 → elemen terakhir (tak overflow)', () => {
  assert.deepEqual(rollClaw(['a', 'b', 'c'], 1, () => 0), ['a']);
  assert.deepEqual(rollClaw(['a', 'b', 'c'], 1, () => 0.999999), ['c']);
  assert.deepEqual(rollClaw(['a', 'b', 'c'], 1, () => 1), ['c']);
});

test('rollClaw: pool kosong / count ≤ 0 → []', () => {
  assert.deepEqual(rollClaw([], 5), []);
  assert.deepEqual(rollClaw(['a'], 0), []);
  assert.deepEqual(rollClaw(null, 3), []);
});

test('clawRefund: duplikat (sudah dimiliki) → refund per duplikat', () => {
  const owned = { a: {} };
  assert.equal(clawRefund(['a', 'a', 'b'], owned), 2 * CLAW_DUPLICATE_REFUND);
  assert.equal(clawRefund(['b', 'c'], ['b']), CLAW_DUPLICATE_REFUND);
  assert.equal(clawRefund([], owned), 0);
});
