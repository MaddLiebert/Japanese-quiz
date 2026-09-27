import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  YUJI_TECHNIQUE_FILES, playYujiTechnique,
  impactDoubleParams, kickWhooshParams, blackSparkParams,
  bloodCompressParams, bloodPierceParams, possessWhooshParams,
  slashParams, fugaRoarParams, fugaCrackleParams,
  playImpactDouble, playKickWhoosh, playBlackSpark, playBloodCompress,
  playBloodPierce, playPossessWhoosh, playSlash, playFugaRoar, playFuga,
} from './sfx.js';
import { VOICES } from '../features/audio/voices.js';
import { yujiGifPaths } from '../features/effects/yujiGifs.js';

test('YUJI_TECHNIQUE_FILES: 8 klip, path valid, file ada di disk', () => {
  const keys = ['keiteiken', 'manjigeri', 'kokusen', 'senketsu', 'kai', 'hachi', 'fuga', 'zakome'];
  assert.deepEqual(Object.keys(YUJI_TECHNIQUE_FILES).sort(), keys.slice().sort());
  for (const [k, p] of Object.entries(YUJI_TECHNIQUE_FILES)) {
    assert.equal(p, `/voices/yuji/${k}.mp3`);
    assert.ok(existsSync('public' + p), `klip hilang: ${p}`);
  }
});

test('playYujiTechnique: node (tanpa window) -> no-op 0, teknik tak dikenal aman', () => {
  for (const k of Object.keys(YUJI_TECHNIQUE_FILES)) assert.equal(playYujiTechnique(k), 0);
  assert.equal(playYujiTechnique('zzz'), 0);
  assert.equal(playYujiTechnique(null), 0);
});

test('semua aset Yuji (11 klip + 8 GIF) ada di disk', () => {
  for (const p of [...VOICES.yuji.files.wrong, ...VOICES.yuji.clips]) {
    assert.ok(existsSync('public' + p), `klip hilang: ${p}`);
  }
  for (const p of yujiGifPaths()) assert.ok(existsSync('public' + p), `gif hilang: ${p}`);
});

test('impactDoubleParams: 2 hit, jeda 0,1s, hit ke-2 lebih kuat (逕庭拳)', () => {
  const p = impactDoubleParams();
  assert.equal(p.gapMs, 100);
  assert.ok(p.hit2.gain > p.hit1.gain, 'dor kedua lebih kuat');
  assert.ok(p.hit1.dur > 0 && p.hit2.dur > 0);
});

test('kickWhooshParams: angin turun (tendangan)', () => {
  const p = kickWhooshParams();
  assert.ok(p.toHz < p.fromHz);
  assert.ok(p.gain > 0 && p.gain <= 0.3);
});

test('blackSparkParams: BZZT tinggi + boom rendah (黒閃)', () => {
  const p = blackSparkParams();
  assert.ok(p.fromHz >= 1500, 'buzz nyaring');
  assert.ok(p.boom.toHz < p.boom.fromHz, 'boom sweep turun');
  assert.ok(p.boom.gain > 0);
});

test('bloodCompress (naik) & bloodPierce (turun tajam) — 穿血', () => {
  const c = bloodCompressParams();
  const p = bloodPierceParams();
  assert.ok(c.toHz > c.fromHz, 'compress = makin tinggi');
  assert.ok(p.toHz < p.fromHz, 'pierce = turun');
  assert.ok(p.dur <= 0.3, 'pierce cepat/tajam');
});

test('possessWhooshParams: aura gelap naik + sub bass (takeover)', () => {
  const p = possessWhooshParams();
  assert.ok(p.toHz > p.fromHz);
  assert.ok(p.subGain > 0, 'bass rendah khas kerasukan');
  assert.ok(p.dur >= 0.8, 'takeover kerasa megah');
});

test('slashParams: tipis vs berat (解/捌)', () => {
  const thin = slashParams(false);
  const heavy = slashParams(true);
  assert.ok(heavy.gain > thin.gain, '捌 lebih berat');
  assert.ok(heavy.dur > thin.dur, '捌 lebih panjang');
  assert.ok(heavy.noiseGain > thin.noiseGain);
});

test('fugaRoarParams & fugaCrackleParams: api mengaum + bara (開)', () => {
  const roar = fugaRoarParams();
  const crackle = fugaCrackleParams();
  assert.ok(roar.toHz > roar.fromHz, 'auman naik');
  assert.ok(roar.gain > 0 && roar.gain <= 0.5);
  assert.ok(crackle.hz >= 1500, 'crackle nyaring tipis');
  assert.ok(crackle.gain > 0 && crackle.gain <= 0.15, 'crackle jangan menutupi');
});

test('semua player Yuji no-op di node (0, tanpa throw)', () => {
  assert.equal(playImpactDouble(), 0);
  assert.equal(playKickWhoosh(), 0);
  assert.equal(playBlackSpark(), 0);
  assert.equal(playBloodCompress(), 0);
  assert.equal(playBloodPierce(), 0);
  assert.equal(playPossessWhoosh(), 0);
  assert.equal(playSlash(false), 0);
  assert.equal(playSlash(true), 0);
  assert.equal(playFugaRoar(), 0);
  assert.equal(playFuga(), 0);
});
