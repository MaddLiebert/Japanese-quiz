import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import * as SFX_MODULE from './sfx.js';
import {
  YUJI_TECHNIQUE_FILES, playYujiTechnique,
  impactDoubleParams, kickWhooshParams, blackSparkParams,
  bloodCompressParams, bloodPierceParams, possessWhooshParams,
  slashParams, fugaRoarParams, fugaCrackleParams,
  playImpactDouble, playKickWhoosh, playBlackSpark, playBloodCompress,
  playBloodPierce, playPossessWhoosh, playSlash, playFugaRoar, playFuga,
  keiteikenThumpParams, manjigeriSpinParams, manjigeriCrackParams,
  kokusenCrackleParams, kokusenThunderParams, senketsuJetParams, kaiSnipParams,
  fugaBoomParams, sukunaBellParams, sukunaHeartParams, sukunaDreadParams, fireIgniteParams,
  TECHNIQUE_SFX_LAYERS, techniqueSfxLayers,
  playKeiteikenThump, playManjigeriSpin, playManjigeriCrack, playKokusenCrackle,
  playKokusenThunder, playSenketsuJet, playKaiSnip, playFugaBoom, playSukunaDread, playFireIgnite,
} from './sfx.js';
import { VOICES } from '../features/audio/voices.js';
import { yujiGifPaths } from '../features/effects/yujiGifs.js';

const SFX_EXPORTS = new Set(Object.keys(SFX_MODULE));

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

test('TECHNIQUE_SFX_LAYERS: SEMUA teknik punya >= 2 lapis sfx (biar hidup)', () => {
  const techs = ['keiteiken', 'manjigeri', 'kokusen', 'senketsu', 'kai', 'hachi', 'fuga', 'takeover'];
  for (const t of techs) {
    const layers = techniqueSfxLayers(t);
    assert.ok(Array.isArray(layers) && layers.length >= 2, `${t} minimal 2 lapis (dapat ${layers.length})`);
  }
  assert.deepEqual(techniqueSfxLayers('ngawur'), [], 'teknik tak dikenal -> kosong');
  // registry harus menunjuk fungsi player yang benar-benar ada (bukan string hantu)
  for (const [tech, layers] of Object.entries(TECHNIQUE_SFX_LAYERS)) {
    for (const fn of layers) assert.ok(SFX_EXPORTS.has(fn), `${tech}: ${fn} tidak diekspor sfx.js`);
  }
});

test('kokusen: crackle petir + thunder rumble (黒閃 petir merah)', () => {
  const c = kokusenCrackleParams();
  assert.ok(c.bursts >= 3, 'petir berderak beberapa kali');
  assert.ok(c.baseHz >= 2500, 'crackle nyaring');
  assert.ok(c.gain > 0 && c.gain <= 0.16, 'jangan menutupi voice');
  const th = kokusenThunderParams();
  assert.ok(th.toHz < th.fromHz, 'thunder turun (guntur)');
  assert.ok(th.dur >= 0.8, 'guntur panjang');
  assert.ok(th.gain > c.gain, 'guntur lebih dominan dari crackle');
});

test('keiteiken/manjigeri: lapisan impact + angin tendangan', () => {
  const k = keiteikenThumpParams();
  assert.ok(k.toHz < k.fromHz, 'thump turun (bantingan)');
  assert.ok(k.gain >= 0.2, 'harus kerasa');
  const spin = manjigeriSpinParams();
  assert.ok(spin.toHz > spin.fromHz, 'putaran naik');
  const crack = manjigeriCrackParams();
  assert.ok(crack.gain >= spin.gain, 'hantaman lebih keras dari angin');
});

test('senketsu jet + kai snip + fuga boom: lapisan tambahan', () => {
  const jet = senketsuJetParams();
  assert.ok(jet.noiseGain >= 0.12, 'jet darah berdesis');
  const thin = kaiSnipParams(false);
  const heavy = kaiSnipParams(true);
  assert.ok(heavy.dur > thin.dur && heavy.gain > thin.gain, '捌 lebih berat');
  const boom = fugaBoomParams();
  assert.ok(boom.toHz < 60 && boom.dur >= 1.0, 'ledakan api panjang & rendah');
});

test('Sukuna masuk lebih MENCEKAM: bel + detak jantung + drone', () => {
  const bell = sukunaBellParams();
  assert.ok(bell.partials.length >= 4, 'bel butuh partial inharmonik');
  assert.ok(bell.dur >= 2.5, 'gaung bel panjang (mencekam)');
  assert.ok(bell.baseHz >= 60 && bell.baseHz <= 160, 'nada bel rendah');
  const heart = sukunaHeartParams();
  assert.equal(heart.beats.length, 2, 'lub-dub');
  assert.ok(heart.beats[0].gain > heart.beats[1].gain, 'detak pertama lebih kuat');
  const dread = sukunaDreadParams();
  assert.ok(dread.dur >= 2.0, 'drone panjang');
  assert.ok(dread.subGain >= 0.25, 'sub-bass dalam');
});

test('api takeover: auman api naik + bara meletup (fireIgnite)', () => {
  const p = fireIgniteParams();
  assert.ok(p.toHz > p.fromHz, 'auman api naik');
  assert.ok(p.gain > 0 && p.gain <= 0.3, 'auman jangan pecah');
  assert.ok(p.pops >= 4, 'bara meletup beberapa kali');
  assert.ok(p.popGain > 0 && p.popGain < p.gain, 'letupan jangan menutupi auman');
});

test('player lapisan baru no-op di node (0, tanpa throw)', () => {
  assert.equal(playKeiteikenThump(), 0);
  assert.equal(playManjigeriSpin(), 0);
  assert.equal(playManjigeriCrack(), 0);
  assert.equal(playKokusenCrackle(), 0);
  assert.equal(playKokusenThunder(), 0);
  assert.equal(playSenketsuJet(), 0);
  assert.equal(playKaiSnip(false), 0);
  assert.equal(playFugaBoom(), 0);
  assert.equal(playSukunaDread(), 0);
  assert.equal(playFireIgnite(), 0);
});
