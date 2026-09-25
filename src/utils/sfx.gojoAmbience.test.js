import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ballAppearParams, murasakiRiserParams, curseTickParams, curseReadyParams,
  domainCollapseParams, domainCueParams, domainBgmPlan, ballHumPlan,
  playBallSound, playMurasakiRiser, playCurseTick, playCurseReady,
  playDomainCollapse, playDomainCue, getAudioContext,
} from './sfx.js';
import {
  startDomainBgm, stopDomainBgm, setBallHum, stopBallHum, duckAmbience, stopAllAmbience,
} from './gojoAmbience.js';
import { GOJO_ULT_THRESHOLD } from '../features/effects/gojoFx.js';

// ── Bola 蒼/赫 ──────────────────────────────────────────────────────────────

test('ballAppearParams: ao naik (hisap), aka turun (ledak)', () => {
  const ao = ballAppearParams('ao');
  const aka = ballAppearParams('aka');
  assert.ok(ao.to > ao.from, 'ao harus naik');
  assert.ok(aka.to < aka.from, 'aka harus turun');
  for (const p of [ao, aka]) {
    assert.ok(p.dur > 0.2 && p.dur <= 1, 'durasi wajar');
    assert.ok(p.gain > 0 && p.gain <= 0.3, 'gain sehat (jangan menutupi voice)');
    assert.ok(p.airGain >= 0 && p.airGain <= 0.15, 'desis sehat');
  }
});

test('ballAppearParams: teknik lain / null → null', () => {
  assert.equal(ballAppearParams('murasaki'), null);
  assert.equal(ballAppearParams(null), null);
  assert.equal(ballAppearParams('zzz'), null);
});

// ── 茈 (riser + impact) ─────────────────────────────────────────────────────

test('murasakiRiserParams: riser naik berakhir tepat di tabrakan (0.42s)', () => {
  const p = murasakiRiserParams();
  assert.ok(p.to > p.from, 'riser harus naik');
  assert.ok(Math.abs(p.dur - 0.42) < 0.001, 'dur = durasi slide bola (0.42s)');
  assert.ok(p.filterTo > p.filterFrom, 'filter ikut membuka');
  assert.ok(p.impact.freqStart > p.impact.freqEnd, 'impact sweep turun');
  assert.ok(p.impact.gain > 0 && p.impact.gain <= 0.5, 'impact sehat');
});

// ── Bar 呪力 ────────────────────────────────────────────────────────────────

test('curseTickParams: pitch naik seiring charge, mentok di penuh (20)', () => {
  const freqs = [];
  for (let c = 1; c <= 20; c++) freqs.push(curseTickParams(c).freq);
  for (let i = 1; i < freqs.length; i++) assert.ok(freqs[i] > freqs[i - 1], `tick ${i} harus naik`);
  assert.equal(curseTickParams(20).freq, curseTickParams(999).freq, 'tidak lebih tinggi dari penuh');
  assert.equal(curseTickParams(20).freq, curseTickParams(GOJO_ULT_THRESHOLD).freq, 'batas = GOJO_ULT_THRESHOLD');
  for (const bad of [0, -5, NaN, null, undefined, 'x']) {
    assert.ok(Number.isFinite(curseTickParams(bad).freq), `input ${String(bad)} aman`);
  }
});

test('curseReadyParams: 2 nada naik, gain pelan (bukan fanfare gacha)', () => {
  const p = curseReadyParams();
  assert.equal(p.notes.length, 2);
  assert.ok(p.notes[1] > p.notes[0]);
  assert.ok(p.gain > 0 && p.gain <= 0.3);
});

// ── Domain padam & cue 六眼 ─────────────────────────────────────────────────

test('domainCollapseParams: sweep turun; timeout lebih panjang & lebih pelan', () => {
  const w = domainCollapseParams('wrong');
  const t = domainCollapseParams('timeout');
  for (const p of [w, t]) assert.ok(p.freqStart > p.freqEnd, 'sweep turun');
  assert.ok(t.dur > w.dur, 'timeout lebih panjang (padam alami)');
  assert.ok(t.gain < w.gain, 'timeout lebih pelan (bukan hukuman)');
});

test('domainCueParams: eyes = shimmer tinggi halus; kind lain → null', () => {
  const p = domainCueParams('eyes');
  assert.equal(p.notes.length, 2);
  assert.ok(Math.min(...p.notes) >= 1000, 'di oktaf atas (halus, bukan bass)');
  assert.ok(p.gain <= 0.1, 'sangat pelan — hanya aksen');
  assert.equal(domainCueParams('zzz'), null);
});

// ── Rencana ambience (dipakai gojoAmbience.js) ──────────────────────────────

test('domainBgmPlan: drone + pad lengkap, level kedengaran, fade wajar', () => {
  const p = domainBgmPlan();
  assert.deepEqual(p, domainBgmPlan(), 'deterministik');
  // v2 (user tuning): level lama 0.085 terlalu pelan di speaker asli — harus jelas kedengaran.
  assert.ok(p.level >= 0.12 && p.level <= 0.3, 'level cukup kedengaran, tetap di bawah voice');
  assert.ok(p.fadeInMs >= 500 && p.fadeInMs <= 3000);
  assert.ok(p.fadeOutMs >= 300 && p.fadeOutMs <= 2000);
  assert.ok(p.drone.freqs.length >= 2, 'drone minimal 2 lapis');
  assert.ok(p.pad.freqs.length >= 2, 'pad minimal 2 lapis');
  assert.ok(p.pad.lfoHz > 0 && p.pad.lfoHz <= 0.5, 'LFO pelan');
  for (const f of [...p.drone.freqs, ...p.pad.freqs]) {
    assert.ok(f >= 30 && f <= 2000, `freq ${f} audible`);
  }
  // Konten mid ≥150Hz wajib ada — speaker HP/laptop tidak memutar 55Hz dengan baik,
  // jadi BGM yang isinya sub-bass doang akan "hilang" (keluhan user v1).
  const mid = [...p.drone.freqs, ...p.pad.freqs].filter((f) => f >= 150);
  assert.ok(mid.length >= 2, 'ada konten mid → kedengaran di speaker HP');
});

test('ballHumPlan: {} → {}; ao = desir tinggi, aka = gemuruh + crackle', () => {
  assert.deepEqual(ballHumPlan({}), {});
  const ao = ballHumPlan({ ao: true });
  assert.deepEqual(Object.keys(ao), ['ao']);
  const aka = ballHumPlan({ aka: true });
  assert.deepEqual(Object.keys(aka), ['aka']);
  assert.ok(ao.ao.osc.freq > aka.aka.osc.freq, 'ao lebih tinggi dari aka');
  assert.equal(ao.ao.noise.filterType, 'highpass');
  assert.equal(aka.aka.noise.filterType, 'bandpass');
  for (const l of [ao.ao, aka.aka]) {
    assert.ok(l.level > 0 && l.level <= 0.08, 'hum sangat pelan');
    assert.ok(l.tremolo.hz > 0 && l.tremolo.hz < 2, 'tremolo lambat');
  }
});

// ── Pemutar: aman di node ───────────────────────────────────────────────────

test('pemutar baru & getAudioContext aman di node (0 / null, tanpa throw)', () => {
  assert.equal(getAudioContext(), null);
  assert.equal(playBallSound('ao'), 0);
  assert.equal(playMurasakiRiser(), 0);
  assert.equal(playCurseTick(3), 0);
  assert.equal(playCurseReady(), 0);
  assert.equal(playDomainCollapse('wrong'), 0);
  assert.equal(playDomainCue('eyes'), 0);
  assert.equal(playBallSound('zzz'), 0);
  assert.equal(playDomainCue('zzz'), 0);
});

// ── Modul ambience: aman di node (semua no-op) ──────────────────────────────

test('gojoAmbience: semua fungsi no-op aman di node (false, tanpa throw)', () => {
  assert.equal(startDomainBgm(), false);
  assert.equal(stopDomainBgm(), false);
  assert.equal(setBallHum({ ao: true, aka: true }), false);
  assert.equal(stopBallHum(), false);
  assert.equal(duckAmbience(500), false);
  assert.equal(stopAllAmbience(), false);
});
