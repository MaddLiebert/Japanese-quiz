import test from 'node:test';
import assert from 'node:assert/strict';
import { setActiveVoice, getActiveVoiceKey, streakTierIndex, STREAK_TIER_BY_LEVEL, answerFeedbackKind } from './sfx.js';

test('default tanpa pack: tidak ada voice (chime dasar)', () => {
  setActiveVoice(null);
  assert.equal(getActiveVoiceKey(), null);
});

test('setActiveVoice mengubah voice & null = tanpa pack', () => {
  setActiveVoice('dummy');
  assert.equal(getActiveVoiceKey(), 'dummy');
  setActiveVoice('taiko');
  assert.equal(getActiveVoiceKey(), 'taiko');
  setActiveVoice(null);
  assert.equal(getActiveVoiceKey(), null);
});

test('sfx.js tetap mengekspor streakGongParams (gong audible tidak boleh hilang)', async () => {
  const mod = await import('./sfx.js');
  assert.equal(typeof mod.streakGongParams, 'function');
  const p = mod.streakGongParams(1);
  assert.ok(p.base >= 180, 'base harus audible (>=180Hz)');
});

test('STREAK_TIER_BY_LEVEL memetakan 12 milestone → 6 tier (50 & 100 sendiri)', () => {
  assert.deepEqual(STREAK_TIER_BY_LEVEL, [0, 0, 1, 1, 2, 2, 3, 4, 4, 4, 4, 5]);
  assert.equal(STREAK_TIER_BY_LEVEL[6], 3);   // level 7  = streak 50
  assert.equal(STREAK_TIER_BY_LEVEL[11], 5);  // level 12 = streak 100
});

test('streakTierIndex: level → indeks tier (clamp + pecahan)', () => {
  assert.equal(streakTierIndex(1), 0);     // streak 3  → tier 1
  assert.equal(streakTierIndex(2.7), 0);   // floor 2   → tier 1
  assert.equal(streakTierIndex(7), 3);     // streak 50 → tier 4
  assert.equal(streakTierIndex(12), 5);    // streak 100 → tier 6
  assert.equal(streakTierIndex(0), 0);     // clamp bawah
  assert.equal(streakTierIndex(99), 5);    // clamp atas
});

test('answerFeedbackKind: voice Hina hanya di milestone & saat salah', () => {
  assert.equal(answerFeedbackKind('wrong', false), 'wrong');
  assert.equal(answerFeedbackKind('wrong', true), 'wrong');
  assert.equal(answerFeedbackKind('correct', true), 'streak');   // tepat di milestone
  assert.equal(answerFeedbackKind('correct', false), 'correct'); // benar biasa → suara dasar
});
