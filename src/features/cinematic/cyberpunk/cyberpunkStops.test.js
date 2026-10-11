// cyberpunkStops.test.js — penjaga peta 電脳 「家」 (5 titik). PRD §7.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CYBERPUNK_STOPS, CYBERPUNK_LAST_STOP, CYBERPUNK_CHECKPOINT_STOP,
  cyberpunkStopById, cyberpunkStopByFeature, validateCyberpunkStops,
} from './cyberpunkStops.js';

test('validateCyberpunkStops: bersih', () => {
  assert.deepEqual(validateCyberpunkStops(), []);
});

test('peta 電脳 = 5 titik (bukan 8 seperti era lain)', () => {
  assert.equal(CYBERPUNK_STOPS.length, 5);
  assert.deepEqual(CYBERPUNK_STOPS.map((s) => s.id), ['mon', 'machi', 'tobira', 'uchi', 'wakare']);
  assert.deepEqual(CYBERPUNK_STOPS.map((s) => s.jp), ['門', '街', '扉', '内', '別れ']);
});

test('checkpoint 終 = 扉 (titik ke-3), BUKAN perhentian terakhir', () => {
  assert.equal(CYBERPUNK_CHECKPOINT_STOP.id, 'tobira');
  assert.equal(CYBERPUNK_CHECKPOINT_STOP.feature, 'checkpoint');
  assert.equal(CYBERPUNK_CHECKPOINT_STOP.last, undefined, '終 bukan penutup');
  assert.notEqual(CYBERPUNK_LAST_STOP.id, 'tobira');
});

test('penutup = 別れ (last:true) — TAMAT, bukan checkpoint', () => {
  assert.equal(CYBERPUNK_LAST_STOP.id, 'wakare');
  assert.equal(CYBERPUNK_LAST_STOP.last, true);
  assert.notEqual(CYBERPUNK_LAST_STOP.feature, 'checkpoint');
});

test('setiap titik punya fitur app (gate/street/checkpoint/story/end)', () => {
  assert.equal(cyberpunkStopByFeature('gate').id, 'mon');
  assert.equal(cyberpunkStopByFeature('street').id, 'machi');
  assert.equal(cyberpunkStopByFeature('checkpoint').id, 'tobira');
  assert.equal(cyberpunkStopByFeature('story').id, 'uchi');
  assert.equal(cyberpunkStopByFeature('end').id, 'wakare');
  assert.equal(cyberpunkStopById('tobira').jp, '扉');
  assert.equal(cyberpunkStopById('nope'), null);
});

test('penutup TIDAK boleh checkpoint → validator menangkap', () => {
  const bad = CYBERPUNK_STOPS.map((s) => (s.id === 'wakare' ? { ...s, feature: 'checkpoint', last: true } : s));
  assert.ok(validateCyberpunkStops(bad).some((e) => /TIDAK boleh jadi checkpoint/.test(e)));
});
