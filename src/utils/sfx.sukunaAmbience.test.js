import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sukunaBgmPlan, sukunaBellParams,
} from './sfx.js';
import {
  startSukunaDomainBgm, stopSukunaDomainBgm, duckSukunaAmbience, stopAllSukunaAmbience,
} from './sukunaAmbience.js';
import { SUKUNA_HITSUME_INTERVAL_MS } from '../features/effects/sukunaFx.js';

// ── Rencana BGM 伏魔御廚子 (spec: level 0.20, fadeIn 1600, bel tiap 4 dtk) ────

test('sukunaBgmPlan: level 0.20, fadeIn 1600ms, fadeOut 900ms (spec persis)', () => {
  const p = sukunaBgmPlan();
  assert.deepEqual(p, sukunaBgmPlan(), 'deterministik');
  assert.equal(p.level, 0.20);
  assert.equal(p.fadeInMs, 1600);
  assert.equal(p.fadeOutMs, 900);
});

test('sukunaBgmPlan: drone 55/110Hz + pad + konten mid (kedengaran di speaker HP)', () => {
  const p = sukunaBgmPlan();
  assert.deepEqual(p.drone.freqs, [55, 110]);
  assert.ok(p.pad.freqs.length >= 2, 'pad minimal 2 lapis');
  assert.ok(p.pad.lfoHz > 0 && p.pad.lfoHz <= 0.5, 'LFO pelan');
  for (const f of [...p.drone.freqs, ...p.pad.freqs]) {
    assert.ok(f >= 30 && f <= 2000, `freq ${f} audible`);
  }
  const mid = [...p.drone.freqs, ...p.pad.freqs].filter((f) => f >= 150);
  assert.ok(mid.length >= 2, 'ada konten mid');
});

test('sukunaBgmPlan: bel kuil tiap 4000ms (= interval 必中, spec) + bisikan', () => {
  const p = sukunaBgmPlan();
  assert.equal(p.bellEveryMs, 4000);
  assert.equal(p.bellEveryMs, SUKUNA_HITSUME_INTERVAL_MS, 'bel = irama 必中');
  assert.equal(p.whisper.filterType, 'bandpass');
  assert.ok(p.whisper.filterHz >= 300 && p.whisper.filterHz <= 1200, 'bandpass 300–1200Hz (spec)');
  assert.ok(p.whisper.gain > 0 && p.whisper.gain <= 0.1, 'bisikan pelan');
  assert.ok(p.whisper.modHz > 0 && p.whisper.modHz <= 0.3, 'modulasi pelan');
});

test('sukunaBellParams: bel inharmonik (dipakai loop bel ambience)', () => {
  const p = sukunaBellParams();
  assert.ok(Array.isArray(p.partials) && p.partials.length >= 3, 'partial inharmonik');
  assert.ok(p.baseHz > 0 && p.dur >= 2, 'bel panjang');
  assert.ok(p.gain > 0);
});

// ── Modul ambience: aman di node (semua no-op) ──────────────────────────────

test('sukunaAmbience: semua fungsi no-op aman di node (false, tanpa throw)', () => {
  assert.equal(startSukunaDomainBgm(), false);
  assert.equal(stopSukunaDomainBgm(), false);
  assert.equal(duckSukunaAmbience(500), false);
  assert.equal(stopAllSukunaAmbience(), false);
});
