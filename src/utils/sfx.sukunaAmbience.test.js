import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sukunaBgmPlan, sukunaBellParams,
  sukunaTaikoParams, sukunaMotifParams, playSukunaTaiko, playSukunaMotif,
} from './sfx.js';
import {
  startSukunaDomainBgm, stopSukunaDomainBgm, duckSukunaAmbience, stopAllSukunaAmbience,
} from './sukunaAmbience.js';

// ── Rencana BGM 伏魔御廚子 "mencekam khas Sukuna" (kritik user 28/09 v3) ─────

test('sukunaBgmPlan: level 0.20, fadeIn 1600ms, fadeOut 900ms (spec persis)', () => {
  const p = sukunaBgmPlan();
  assert.deepEqual(p, sukunaBgmPlan(), 'deterministik');
  assert.equal(p.level, 0.20);
  assert.equal(p.fadeInMs, 1600);
  assert.equal(p.fadeOutMs, 900);
});

test('sukunaBgmPlan: drone 55/110Hz + sub 41.2Hz + pad + konten mid (kedengaran di speaker HP)', () => {
  const p = sukunaBgmPlan();
  assert.deepEqual(p.drone.freqs, [55, 110, 41.2]);
  assert.ok(p.pad.freqs.length >= 2, 'pad minimal 2 lapis');
  assert.ok(p.pad.lfoHz > 0 && p.pad.lfoHz <= 0.5, 'LFO pelan');
  for (const f of [...p.drone.freqs, ...p.pad.freqs]) {
    assert.ok(f >= 30 && f <= 2000, `freq ${f} audible`);
  }
  const mid = [...p.drone.freqs, ...p.pad.freqs].filter((f) => f >= 150);
  assert.ok(mid.length >= 2, 'ada konten mid');
});

test('sukunaBgmPlan: organ gelap tritone A1/E2/A2 (sumber "mencekam" khas Sukuna)', () => {
  const p = sukunaBgmPlan();
  assert.deepEqual(p.organ.freqs, [55, 82.41, 110]);   // 82.41 = E2 (tritone gelap)
  assert.ok(p.organ.filterHz <= 400, 'lowpass gelap');
  assert.ok(p.organ.swellHz > 0 && p.organ.swellHz <= 0.2, 'swell pelan (napas)');
  assert.ok(p.organ.gain > 0 && p.organ.gain <= 0.4);
});

test('sukunaBgmPlan: taiko loop 16 step × 0.5 dtk + aksen berat tiap 2 dtk', () => {
  const p = sukunaBgmPlan();
  assert.equal(p.taiko.loopSteps, 16);
  assert.equal(p.taiko.stepS, 0.5);
  assert.ok(p.taiko.steps.length >= 6, 'pola taiko cukup padat');
  for (const s of p.taiko.steps) assert.ok(s >= 0 && s < 16, `step ${s} dalam loop`);
  for (const s of p.taiko.accents) assert.ok(p.taiko.steps.includes(s), `aksen ${s} harus bagian pola`);
});

test('sukunaBgmPlan: motif koto hirajoshi turun (A B C E F) — "tanda bahaya"', () => {
  const p = sukunaBgmPlan();
  assert.ok(p.motif.notes.length >= 6, 'motif cukup panjang');
  assert.ok(p.motif.stepEvery >= 1);
  // hirajoshi: A(220) B(246.94) C(261.63) E(329.63) F(349.23) — semua di set
  const allowed = new Set([220, 246.94, 261.63, 329.63, 349.23]);
  for (const n of p.motif.notes) assert.ok(allowed.has(n), `nada ${n} bukan hirajoshi`);
});

test('sukunaBgmPlan: bel kuil tiap 4000ms (irama ritual) + bisikan', () => {
  const p = sukunaBgmPlan();
  assert.equal(p.bellEveryMs, 4000);
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

test('sukunaTaikoParams: pukulan membrane (turun cepat) + aksen = pukulan ganda', () => {
  const one = sukunaTaikoParams(false);
  assert.ok(one.hit.fromHz > one.hit.toHz, 'nada turun = hentakan');
  assert.ok(one.hit.gain > 0 && one.hit.dur > 0);
  assert.equal(one.hit2, undefined, 'tanpa aksen = satu pukulan');
  const acc = sukunaTaikoParams(true);
  assert.ok(acc.hit2 && acc.hit2.delayMs > 0, 'aksen = pukulan kedua menyusul');
});

test('sukunaMotifParams: petikan koto (bend turun + lowpass menutup)', () => {
  const p = sukunaMotifParams();
  assert.ok(p.bend < 0, 'bend turun (koto)');
  assert.ok(p.filterHz > 0 && p.filterCloseS > 0, 'filter menutup cepat');
  assert.ok(p.overtoneGain > 0 && p.overtoneGain < 0.4, 'oktaf tipis');
});

test('playSukunaTaiko / playSukunaMotif: no-op aman di node (0, tanpa throw)', () => {
  assert.equal(playSukunaTaiko(), 0);
  assert.equal(playSukunaTaiko(true, 1.5, null), 0);
  assert.equal(playSukunaMotif(220), 0);
  assert.equal(playSukunaMotif(NaN, 2, null), 0);
});

// ── Modul ambience: aman di node (semua no-op) ──────────────────────────────

test('sukunaAmbience: semua fungsi no-op aman di node (false, tanpa throw)', () => {
  assert.equal(startSukunaDomainBgm(), false);
  assert.equal(stopSukunaDomainBgm(), false);
  assert.equal(duckSukunaAmbience(500), false);
  assert.equal(stopAllSukunaAmbience(), false);
});
