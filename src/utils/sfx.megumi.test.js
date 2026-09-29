import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  MEGUMI_TECHNIQUE_FILES, MEGUMI_LEAD_S, playMegumiTechnique,
  MEGUMI_TECHNIQUE_SFX_LAYERS, megumiTechniqueSfxLayers, playMegumiTechniqueLayers,
  gyokukenParams, clawSwipeParams, orochiHissParams, orochiRumbleParams,
  bansouWaterParams, bansouTrumpetParams, kosouRoarParams, kosouSlashParams,
  makoraChantParams, makoraRoarParams, adaptFlashParams, swordUnsheatheParams,
  wheelShatterParams, shadowSwallowParams,
  playGyokuken, playClawSwipe, playOrochiHiss, playOrochiRumble,
  playBansouWater, playBansouTrumpet, playKosouRoar, playKosouSlash,
  playMakoraChant, playMakoraRoar, playAdaptFlash, playSwordUnsheathe,
  playWheelShatter, playShadowSwallow,
} from './sfx.js';
import { VOICES } from '../features/audio/voices.js';
import { MEGUMI_CAST_VOICE } from '../features/effects/megumiFx.js';

test('MEGUMI_TECHNIQUE_FILES: 6 klip, path valid, file ada di disk', () => {
  const keys = ['gyokuken', 'nue', 'orochi', 'bansou', 'kosou', 'mahoraga'];
  assert.deepEqual(Object.keys(MEGUMI_TECHNIQUE_FILES).sort(), keys.slice().sort());
  for (const [k, p] of Object.entries(MEGUMI_TECHNIQUE_FILES)) {
    assert.equal(p, `/voices/megumi/${k}.mp3`);
    assert.ok(existsSync('public' + p), `klip hilang: ${p}`);
  }
});

test('playMegumiTechnique: node (tanpa window) -> no-op 0, jurus tak dikenal aman', () => {
  for (const k of Object.keys(MEGUMI_TECHNIQUE_FILES)) assert.equal(playMegumiTechnique(k), 0);
  assert.equal(playMegumiTechnique('zzz'), 0);
  assert.equal(playMegumiTechnique(null), 0);
});

test('semua aset suara Megumi (3 kalah + 6 jurus) ada di disk', () => {
  for (const p of [...VOICES.megumi.files.wrong, ...VOICES.megumi.clips]) {
    assert.ok(existsSync('public' + p), `klip hilang: ${p}`);
  }
});

test('MEGUMI_LEAD_S: skip lead-silence hasil ukur (bansou 0.35, kosou 0.41); mahoraga TIDAK di-skip', () => {
  assert.equal(MEGUMI_LEAD_S.bansou, 0.35);
  assert.equal(MEGUMI_LEAD_S.kosou, 0.41);
  assert.equal(MEGUMI_LEAD_S.mahoraga, undefined, 'chant = anchor timeline, jangan di-skip');
  assert.equal(MEGUMI_LEAD_S.gyokuken, undefined);
  // klip lain lead <= 0.24s (pola Sukuna: tanpa skip)
  assert.ok(MEGUMI_LEAD_S.nue === undefined && MEGUMI_LEAD_S.orochi === undefined);
});

test('MEGUMI_CAST_VOICE.dur = durasi klip mahoraga (single source: megumiFx)', () => {
  assert.equal(MEGUMI_CAST_VOICE.dur, 4.959);
});

test('MEGUMI_TECHNIQUE_SFX_LAYERS: tiap jurus ≥2 lapis (spec)', () => {
  const keys = ['gyokuken', 'nue', 'orochi', 'bansou', 'kosou', 'mahoraga', 'adapt', 'sword', 'shatter', 'wrong'];
  assert.deepEqual(Object.keys(MEGUMI_TECHNIQUE_SFX_LAYERS).sort(), keys.slice().sort());
  for (const k of keys) {
    const layers = MEGUMI_TECHNIQUE_SFX_LAYERS[k];
    assert.ok(Array.isArray(layers) && layers.length >= 1, `${k} harus punya lapis`);
    for (const fn of layers) assert.match(fn, /^play[A-Z]/, `${k}: ${fn} harus play*`);
  }
  // 5 jurus streak wajib >= 2 lapis (spec: "SFX wajib tiap jurus, min 2 lapis")
  for (const k of ['gyokuken', 'nue', 'orochi', 'bansou', 'kosou', 'mahoraga']) {
    assert.ok(MEGUMI_TECHNIQUE_SFX_LAYERS[k].length >= 2, `${k} harus >= 2 lapis`);
  }
  assert.deepEqual(MEGUMI_TECHNIQUE_SFX_LAYERS.gyokuken, ['playGyokuken', 'playClawSwipe']);
  assert.deepEqual(MEGUMI_TECHNIQUE_SFX_LAYERS.nue, ['playNueScream', 'playNueThunder', 'playShadowRustle']);
  assert.deepEqual(MEGUMI_TECHNIQUE_SFX_LAYERS.orochi, ['playOrochiHiss', 'playOrochiRumble']);
  assert.deepEqual(MEGUMI_TECHNIQUE_SFX_LAYERS.bansou, ['playBansouWater', 'playBansouTrumpet']);
  assert.deepEqual(MEGUMI_TECHNIQUE_SFX_LAYERS.kosou, ['playKosouRoar', 'playKosouSlash']);
  assert.deepEqual(MEGUMI_TECHNIQUE_SFX_LAYERS.mahoraga, ['playMakoraChant', 'playWheelCreak', 'playGiantStep', 'playMakoraRoar']);
  assert.deepEqual(MEGUMI_TECHNIQUE_SFX_LAYERS.adapt, ['playAdaptFlash']);
  assert.deepEqual(MEGUMI_TECHNIQUE_SFX_LAYERS.sword, ['playSwordUnsheathe']);
  assert.deepEqual(MEGUMI_TECHNIQUE_SFX_LAYERS.shatter, ['playWheelShatter']);
  assert.deepEqual(MEGUMI_TECHNIQUE_SFX_LAYERS.wrong, ['playShadowSwallow']);
});

test('megumiTechniqueSfxLayers: aman untuk jurus tak dikenal', () => {
  assert.deepEqual(megumiTechniqueSfxLayers('zzz'), []);
  assert.equal(megumiTechniqueSfxLayers('nue').length, 3);
});

test('playMegumiTechniqueLayers: memutar SEMUA lapis registry (node no-op tapi terhitung)', () => {
  assert.equal(playMegumiTechniqueLayers('gyokuken'), 2);
  assert.equal(playMegumiTechniqueLayers('nue'), 3);
  assert.equal(playMegumiTechniqueLayers('orochi'), 2);
  assert.equal(playMegumiTechniqueLayers('bansou'), 2);
  assert.equal(playMegumiTechniqueLayers('kosou'), 2);
  assert.equal(playMegumiTechniqueLayers('mahoraga'), 4);
  assert.equal(playMegumiTechniqueLayers('adapt'), 1);
  assert.equal(playMegumiTechniqueLayers('sword'), 1);
  assert.equal(playMegumiTechniqueLayers('shatter'), 1);
  assert.equal(playMegumiTechniqueLayers('wrong'), 1);
  assert.equal(playMegumiTechniqueLayers('zzz'), 0);
});

test('gyokukenParams: lolongan 420→180Hz + noise growl', () => {
  const p = gyokukenParams();
  assert.ok(p.fromHz === 420 && p.toHz === 180);
  assert.ok(p.gain > 0 && p.noiseGain > 0);
});

test('clawSwipeParams: 3 whoosh cakar 2200→600Hz, cepat', () => {
  const p = clawSwipeParams();
  assert.equal(p.swipes, 3);
  assert.ok(p.fromHz === 2200 && p.toHz === 600);
  assert.ok(p.gapMs > 0 && p.dur <= 0.2);
});

test('orochiHissParams: desis 3 lapis 4000→800Hz panjang', () => {
  const p = orochiHissParams();
  assert.equal(p.layers, 3);
  assert.ok(p.fromHz === 4000 && p.toHz === 800);
  assert.ok(p.dur >= 1);
});

test('orochiRumbleParams: rumble 38→22Hz berat', () => {
  const p = orochiRumbleParams();
  assert.ok(p.fromHz === 38 && p.toHz === 22);
  assert.ok(p.gain > 0.3);
});

test('bansouWaterParams & bansouTrumpetParams: semburan air + terompet gajah', () => {
  const w = bansouWaterParams();
  assert.ok(w.fromHz === 1600 && w.toHz === 300);
  const t = bansouTrumpetParams();
  assert.ok(t.fromHz === 300 && t.toHz === 140);
});

test('kosouRoarParams: auman harimau 260→90Hz', () => {
  const p = kosouRoarParams();
  assert.ok(p.fromHz === 260 && p.toHz === 90);
});

test('kosouSlashParams: 3 tebasan 2600→500Hz + ekor boom 60Hz', () => {
  const p = kosouSlashParams();
  assert.equal(p.slashes, 3);
  assert.ok(p.fromHz === 2600 && p.toHz === 500);
  assert.ok(p.boom && p.boom.fromHz === 60 && p.boom.toHz === 26);
});

test('makoraChantParams: drone ritual 55Hz + bel inharmonik', () => {
  const p = makoraChantParams();
  assert.equal(p.droneHz, 55);
  assert.deepEqual(p.bellPartials, [1, 2.76, 5.4]);
  assert.ok(p.droneGain > 0 && p.bellGain > 0);
});

test('makoraRoarParams: auman raksasa 70→30Hz', () => {
  const p = makoraRoarParams();
  assert.ok(p.fromHz === 70 && p.toHz === 30);
  assert.ok(p.gain > 0.4);
});

test('adaptFlashParams: chime gelap + shimmer naik (momen 適応)', () => {
  const p = adaptFlashParams();
  assert.ok(p.chimeHz > 0 && p.chimeGain > 0);
  assert.ok(p.shimmerToHz > p.shimmerFromHz, 'shimmer naik (menyerap)');
});

test('swordUnsheatheParams: tarikan logam 1200→400Hz (cabut 八握剣)', () => {
  const p = swordUnsheatheParams();
  assert.ok(p.fromHz === 1200 && p.toHz === 400);
});

test('wheelShatterParams: pecahan 3000Hz + boom 80→24Hz (輪砕け)', () => {
  const p = wheelShatterParams();
  assert.equal(p.shardHz, 3000);
  assert.ok(p.shards >= 3);
  assert.ok(p.boom && p.boom.fromHz === 80 && p.boom.toHz === 24);
});

test('shadowSwallowParams: whoosh turun 500→80Hz (bayangan nelan)', () => {
  const p = shadowSwallowParams();
  assert.ok(p.fromHz === 500 && p.toHz === 80);
});

test('semua player Megumi no-op di node (0, tanpa throw)', () => {
  const players = [
    playGyokuken, playClawSwipe, playOrochiHiss, playOrochiRumble,
    playBansouWater, playBansouTrumpet, playKosouRoar, playKosouSlash,
    playMakoraChant, playMakoraRoar, playAdaptFlash, playSwordUnsheathe,
    playWheelShatter, playShadowSwallow,
  ];
  for (const fn of players) assert.equal(fn(), 0, fn.name);
});
