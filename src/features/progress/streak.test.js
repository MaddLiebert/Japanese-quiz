import test from 'node:test';
import assert from 'node:assert/strict';
import { STREAK_BONUS_RATE, isStreakActive, applyStreakBonus, streakUnit } from './streak.js';

test('isStreakActive: streak > 0 aktif; 0 / kosong / null tidak aktif', () => {
  assert.equal(isStreakActive({ streak: 1 }), true);
  assert.equal(isStreakActive({ streak: 7 }), true);
  assert.equal(isStreakActive({ streak: 0 }), false);
  assert.equal(isStreakActive({}), false);
  assert.equal(isStreakActive(null), false);
  assert.equal(isStreakActive(undefined), false);
});

test('applyStreakBonus: streak mati → XP apa adanya (tanpa bonus)', () => {
  assert.equal(applyStreakBonus(10, { streak: 0 }), 10);
  assert.equal(applyStreakBonus(35, null), 35);
  assert.equal(applyStreakBonus(0, { streak: 5 }), 0); // timeout 0 XP tetap 0
});

test('applyStreakBonus: streak aktif → +5% dibulatkan ke bilangan bulat', () => {
  assert.equal(applyStreakBonus(10, { streak: 2 }), 11); // 10.5 → 11
  assert.equal(applyStreakBonus(20, { streak: 1 }), 21);
  assert.equal(applyStreakBonus(35, { streak: 9 }), 37); // 36.75 → 37
});

test('STREAK_BONUS_RATE = 5% (sinkron dengan label di Home)', () => {
  assert.equal(STREAK_BONUS_RATE, 0.05);
});

test('streakUnit: bahasa id selalu "hari"; en pakai day/days sesuai jumlah', () => {
  assert.equal(streakUnit(1, 'id'), 'hari');
  assert.equal(streakUnit(7, 'id'), 'hari');
  assert.equal(streakUnit(1, 'en'), 'day');
  assert.equal(streakUnit(2, 'en'), 'days');
  assert.equal(streakUnit(0, 'en'), 'days');
});
