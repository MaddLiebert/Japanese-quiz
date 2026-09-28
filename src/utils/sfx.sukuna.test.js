import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  SUKUNA_TECHNIQUE_FILES, playSukunaTechnique,
  SUKUNA_TECHNIQUE_SFX_LAYERS, sukunaTechniqueSfxLayers, playSukunaTechniqueLayers,
  webCrackParams, nueScreamParams, nueThunderParams, shadowRustleParams,
  furubeChantParams, wheelCreakParams, giantStepParams, chantDroneParams,
  inkBurnParams, riserTensionParams, worldCutSwingParams, spaceTearParams,
  worldCutBoomParams, silenceAfterParams,
  playWebCrack, playNueScream, playNueThunder, playShadowRustle,
  playFurubeChant, playWheelCreak, playGiantStep, playChantDrone,
  playInkBurn, playRiserTension, playWorldCutSwing, playSpaceTear,
  playWorldCutBoom, playSilenceAfter,
} from './sfx.js';
import { VOICES } from '../features/audio/voices.js';

test('SUKUNA_TECHNIQUE_FILES: 6 klip, path valid, file ada di disk', () => {
  const keys = ['kumo_no_ito', 'nue', 'furube', 'ryuurin', 'sekai_zangeki', 'ryouiki_tenkai'];
  assert.deepEqual(Object.keys(SUKUNA_TECHNIQUE_FILES).sort(), keys.slice().sort());
  for (const [k, p] of Object.entries(SUKUNA_TECHNIQUE_FILES)) {
    assert.equal(p, `/voices/sukuna/${k}.mp3`);
    assert.ok(existsSync('public' + p), `klip hilang: ${p}`);
  }
});

test('playSukunaTechnique: node (tanpa window) -> no-op 0, jurus tak dikenal aman', () => {
  for (const k of Object.keys(SUKUNA_TECHNIQUE_FILES)) assert.equal(playSukunaTechnique(k), 0);
  assert.equal(playSukunaTechnique('zzz'), 0);
  assert.equal(playSukunaTechnique(null), 0);
});

test('semua aset suara Sukuna (2 kalah + 6 jurus) ada di disk', () => {
  for (const p of [...VOICES.sukuna.files.wrong, ...VOICES.sukuna.clips]) {
    assert.ok(existsSync('public' + p), `klip hilang: ${p}`);
  }
});

test('SUKUNA_TECHNIQUE_SFX_LAYERS: tiap jurus ≥2 lapis (spec)', () => {
  const keys = ['kumo_no_ito', 'nue', 'furube', 'ryuurin', 'sekai_zangeki', 'domain'];
  assert.deepEqual(Object.keys(SUKUNA_TECHNIQUE_SFX_LAYERS).sort(), keys.slice().sort());
  for (const k of keys) {
    const layers = SUKUNA_TECHNIQUE_SFX_LAYERS[k];
    assert.ok(Array.isArray(layers) && layers.length >= 2, `${k} harus >= 2 lapis`);
    for (const fn of layers) assert.match(fn, /^play[A-Z]/, `${k}: ${fn} harus play*`);
  }
  assert.deepEqual(SUKUNA_TECHNIQUE_SFX_LAYERS.kumo_no_ito, ['playSlash', 'playWebCrack']);
  assert.deepEqual(SUKUNA_TECHNIQUE_SFX_LAYERS.nue, ['playNueScream', 'playNueThunder', 'playShadowRustle']);
  assert.deepEqual(SUKUNA_TECHNIQUE_SFX_LAYERS.furube, ['playFurubeChant', 'playWheelCreak', 'playGiantStep']);
  assert.deepEqual(SUKUNA_TECHNIQUE_SFX_LAYERS.ryuurin, ['playChantDrone', 'playInkBurn', 'playRiserTension']);
  assert.deepEqual(SUKUNA_TECHNIQUE_SFX_LAYERS.sekai_zangeki, ['playWorldCutSwing', 'playSpaceTear', 'playWorldCutBoom', 'playSilenceAfter']);
  assert.deepEqual(SUKUNA_TECHNIQUE_SFX_LAYERS.domain, ['playSukunaDread', 'playSukunaBell', 'playDomainBoom']);
});

test('sukunaTechniqueSfxLayers: aman untuk jurus tak dikenal', () => {
  assert.deepEqual(sukunaTechniqueSfxLayers('zzz'), []);
  assert.equal(sukunaTechniqueSfxLayers('nue').length, 3);
});

test('playSukunaTechniqueLayers: memutar SEMUA lapis registry (node no-op tapi terhitung)', () => {
  assert.equal(playSukunaTechniqueLayers('kumo_no_ito'), 2);
  assert.equal(playSukunaTechniqueLayers('nue'), 3);
  assert.equal(playSukunaTechniqueLayers('furube'), 3);
  assert.equal(playSukunaTechniqueLayers('ryuurin'), 3);
  assert.equal(playSukunaTechniqueLayers('sekai_zangeki'), 4);
  assert.equal(playSukunaTechniqueLayers('domain'), 3);
  assert.equal(playSukunaTechniqueLayers('zzz'), 0);
});

test('webCrackParams: 4 derik 1800→900Hz + ekor drone 40Hz', () => {
  const p = webCrackParams();
  assert.equal(p.bursts, 4);
  assert.ok(p.fromHz === 1800 && p.toHz === 900, 'derik turun 1800→900');
  assert.equal(p.droneHz, 40);
  assert.ok(p.gain > 0 && p.droneGain > 0);
});

test('nueScreamParams: jeritan 900→300Hz', () => {
  const p = nueScreamParams();
  assert.ok(p.fromHz === 900 && p.toHz === 300);
  assert.ok(p.dur > 0.2 && p.gain > 0);
});

test('nueThunderParams: guntur 130→28Hz LEBIH BERAT dari kokusen (150→34)', () => {
  const p = nueThunderParams();
  assert.equal(p.fromHz, 130);
  assert.equal(p.toHz, 28);
  assert.ok(p.gain > 0.3, 'lebih berat dari kokusen');
  assert.ok(p.dur >= 1);
});

test('shadowRustleParams: noise bandpass = desir bayangan', () => {
  const p = shadowRustleParams();
  assert.equal(p.type, 'bandpass');
  assert.ok(p.fromHz > p.toHz, 'desir menyapu turun');
  assert.ok(p.gain > 0 && p.dur > 0);
});

test('furubeChantParams: drone ritual 55Hz + bel inharmonik', () => {
  const p = furubeChantParams();
  assert.equal(p.droneHz, 55);
  assert.ok(Array.isArray(p.bellPartials) && p.bellPartials.length >= 3, 'bel inharmonik');
  assert.ok(p.dur >= 1.2, 'ritual panjang');
});

test('wheelCreakParams: grind 200→90Hz (roda muter)', () => {
  const p = wheelCreakParams();
  assert.equal(p.fromHz, 200);
  assert.equal(p.toHz, 90);
});

test('giantStepParams: hentakan 45→24Hz (kaki raksasa)', () => {
  const p = giantStepParams();
  assert.equal(p.fromHz, 45);
  assert.equal(p.toHz, 24);
  assert.ok(p.gain > 0.2);
});

test('chantDroneParams: drone 58Hz +4Hz tiap streak (progresif!)', () => {
  const a = chantDroneParams(21);
  const b = chantDroneParams(22);
  const c = chantDroneParams(50);
  assert.equal(a.baseHz, 58);
  assert.equal(a.hz, 58, 'streak 21 = base');
  assert.equal(b.hz, 62, 'streak 22 = +4Hz');
  assert.ok(c.hz > b.hz, 'makin deket World Cut makin tegang');
  assert.ok(c.hz <= 58 + 4 * 20, 'clamp wajar');
  assert.equal(chantDroneParams(NaN).hz, 58);
});

test('inkBurnParams: crackle 2600Hz + boom 70→30Hz', () => {
  const p = inkBurnParams();
  assert.equal(p.crackleHz, 2600);
  assert.equal(p.boomFromHz, 70);
  assert.equal(p.boomToHz, 30);
  assert.ok(p.crackleGain > 0 && p.boomGain > 0);
});

test('riserTensionParams: riser naik terus', () => {
  const p = riserTensionParams();
  assert.ok(p.toHz > p.fromHz, 'naik');
  assert.ok(p.dur >= 0.6);
});

test('worldCutSwingParams: noise sweep 1200→200Hz', () => {
  const p = worldCutSwingParams();
  assert.equal(p.fromHz, 1200);
  assert.equal(p.toHz, 200);
  assert.equal(p.type, 'bandpass');
});

test('spaceTearParams: glitch/bitcrush 2 frame', () => {
  const p = spaceTearParams();
  assert.equal(p.frames, 2);
  assert.ok(p.hz > 0 && p.dur > 0 && p.gain > 0);
});

test('worldCutBoomParams: boom 60→22Hz (terberat di app)', () => {
  const p = worldCutBoomParams();
  assert.equal(p.fromHz, 60);
  assert.equal(p.toHz, 22);
  assert.ok(p.gain >= 0.45, 'paling berat');
});

test('silenceAfterParams: hening 0.4s (dramatis)', () => {
  const p = silenceAfterParams();
  assert.equal(p.ms, 400);
});

test('semua player Sukuna no-op di node (0, tanpa throw)', () => {
  assert.equal(playWebCrack(), 0);
  assert.equal(playNueScream(), 0);
  assert.equal(playNueThunder(), 0);
  assert.equal(playShadowRustle(), 0);
  assert.equal(playFurubeChant(), 0);
  assert.equal(playWheelCreak(), 0);
  assert.equal(playGiantStep(), 0);
  assert.equal(playChantDrone(21), 0);
  assert.equal(playInkBurn(), 0);
  assert.equal(playRiserTension(), 0);
  assert.equal(playWorldCutSwing(), 0);
  assert.equal(playSpaceTear(), 0);
  assert.equal(playWorldCutBoom(), 0);
  assert.equal(playSilenceAfter(), 0);
});
