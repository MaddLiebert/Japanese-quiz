import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEIAN_SFX_PARAMS, heianSfxParams, AMBIENCE_PLANS, ambiencePlan,
  playCinematicSfx, setHeianMood, startHeianAmbience, stopHeianAmbience,
  isAudioRunning, ambienceActive, ambienceMood,
} from './heianHistoryAudio.js';

test('SFX params: lengkap, bernilai wajar, deterministik', () => {
  const keys = ['brushSweep', 'brushStroke', 'inkDrip', 'taiko', 'wind', 'courtBell', 'koto', 'gong', 'dread', 'heartbeat', 'shimmer'];
  for (const k of keys) {
    const p = heianSfxParams(k);
    assert.ok(p, `params hilang: ${k}`);
    assert.ok(p.kind, `${k} tanpa kind`);
  }
  assert.equal(heianSfxParams('tidakAda'), null);
  // Deterministik: objek stabil antar panggilan.
  assert.deepEqual(HEIAN_SFX_PARAMS.taiko, heianSfxParams('taiko'));
});

test('SFX params: gain & durasi dalam rentang aman (tidak memekakkan)', () => {
  for (const [k, p] of Object.entries(HEIAN_SFX_PARAMS)) {
    if (p.gain != null) assert.ok(p.gain > 0 && p.gain <= 0.5, `${k}: gain ${p.gain} di luar (0,0.5]`);
    if (p.dur != null) assert.ok(p.dur > 0 && p.dur <= 4, `${k}: dur ${p.dur} di luar (0,4]`);
  }
});

test('ambience plans: 4 mood, level rendah (di bawah voice), fade wajar', () => {
  for (const mood of ['calm', 'court', 'kana', 'dark']) {
    const p = ambiencePlan(mood);
    assert.ok(p, `plan hilang: ${mood}`);
    assert.ok(p.level > 0 && p.level <= 0.15, `${mood}: level ambience terlalu keras (${p.level})`);
    assert.ok(p.fadeInMs >= 800 && p.fadeOutMs >= 300);
    assert.ok(p.drone.freqs.length >= 2);
    assert.ok(p.pad.freqs.length >= 2);
  }
  // Mood tak dikenal → fallback calm.
  assert.deepEqual(ambiencePlan('xxx'), AMBIENCE_PLANS.calm);
});

test('audio: no-op di node (tanpa window) — tidak throw, tidak berbunyi', () => {
  assert.equal(playCinematicSfx('taiko'), 0);
  assert.equal(playCinematicSfx('tidakAda'), 0);
  assert.equal(setHeianMood('court'), false);
  assert.equal(startHeianAmbience('calm'), false);
  assert.equal(stopHeianAmbience(), false);
  assert.equal(isAudioRunning(), false);
  assert.equal(ambienceActive(), false);
  assert.equal(ambienceMood(), null);
});
