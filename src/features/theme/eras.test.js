import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ERAS, DEFAULT_ERA, getEra, eraForLevel, isEraUnlocked, unlockedEras, nextEra,
} from './eras.js';

test('eraForLevel: level rendah → Heian', () => {
  assert.equal(eraForLevel(1).id, 'heian');
  assert.equal(eraForLevel(19).id, 'heian');
});

test('eraForLevel: naik tepat di ambang level', () => {
  assert.equal(eraForLevel(20).id, 'edo');
  assert.equal(eraForLevel(50).id, 'meiji');
  assert.equal(eraForLevel(100).id, 'showa');
  assert.equal(eraForLevel(150).id, 'anime');
  assert.equal(eraForLevel(300).id, 'cyberpunk');
});

test('eraForLevel: level sangat tinggi tetap era terakhir', () => {
  assert.equal(eraForLevel(9999).id, 'cyberpunk');
});

test('eraForLevel: input aneh → fallback Heian', () => {
  assert.equal(eraForLevel(undefined).id, 'heian');
  assert.equal(eraForLevel(null).id, 'heian');
  assert.equal(eraForLevel(NaN).id, 'heian');
});

test('isEraUnlocked', () => {
  assert.equal(isEraUnlocked('heian', 1), true);
  assert.equal(isEraUnlocked('edo', 1), false);
  assert.equal(isEraUnlocked('edo', 20), true);
  assert.equal(isEraUnlocked('tidak-ada', 999), false);
});

test('unlockedEras bertambah sesuai level', () => {
  assert.equal(unlockedEras(1).length, 1);
  assert.equal(unlockedEras(20).length, 2);
  assert.equal(unlockedEras(300).length, ERAS.length);
});

test('nextEra: era berikutnya atau null', () => {
  assert.equal(nextEra(1).id, 'edo');
  assert.equal(nextEra(20).id, 'meiji');
  assert.equal(nextEra(9999), null);
});

test('DEFAULT_ERA = heian & ada di ERAS', () => {
  assert.equal(DEFAULT_ERA, 'heian');
  assert.ok(getEra(DEFAULT_ERA));
});
