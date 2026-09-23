import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HINA_CHEER_TEXT, HINA_CHEER_ROMAJI, HINA_CHEER_SOUND,
  HINA_CHEER_PASS_PCT, isHinaCheerScore,
} from './hinaResultCheer.js';

test('teks sorakan DISAMAKAN dengan klip suara (sugoi sugoi)', () => {
  assert.equal(HINA_CHEER_TEXT, 'すごいすごい！');
  assert.equal(HINA_CHEER_ROMAJI, 'SUGOI SUGOI!');
});

test('klip suara menunjuk ke streak_2 Hina (「すごいすごい！」)', () => {
  assert.equal(HINA_CHEER_SOUND, '/voices/hina/streak_2.mp3');
  assert.match(HINA_CHEER_SOUND, /^\/voices\/hina\/[a-z0-9_]+\.mp3$/);
});

test('isHinaCheerScore: hanya nilai bagus (>= 80%)', () => {
  assert.equal(HINA_CHEER_PASS_PCT, 80);
  assert.equal(isHinaCheerScore(15, 15), true);   // 100%
  assert.equal(isHinaCheerScore(4, 5), true);     // 80% (batas)
  assert.equal(isHinaCheerScore(3, 5), false);    // 60%
  assert.equal(isHinaCheerScore(0, 5), false);
  assert.equal(isHinaCheerScore(0, 0), false);    // hindari bagi nol
  assert.equal(isHinaCheerScore(5, 0), false);
});
