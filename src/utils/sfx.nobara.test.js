import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  NOBARA_TECHNIQUE_FILES, NOBARA_LEAD_S, playNobaraTechnique,
  NOBARA_TECHNIQUE_SFX_LAYERS, nobaraTechniqueSfxLayers, playNobaraTechniqueLayers,
  nailShotParams, nailThudParams, nailBurstParams, chainBurstParams,
  resonanceWaveParams, blackFlashParams,
  playNailShot, playNailThud, playNailBurst, playChainBurst,
  playHammerStrike, playResonanceWave, playBlackFlash, playStrawRustle,
} from './sfx.js';
import { VOICES } from '../features/audio/voices.js';

test('NOBARA_TECHNIQUE_FILES: 4 klip, path valid, file ada di disk', () => {
  const keys = ['kanzashi', 'tomonari', 'kokusen', 'ult'];
  assert.deepEqual(Object.keys(NOBARA_TECHNIQUE_FILES).sort(), keys.slice().sort());
  for (const [k, p] of Object.entries(NOBARA_TECHNIQUE_FILES)) {
    assert.equal(p, `/voices/nobara/${k}.mp3`);
    assert.ok(existsSync('public' + p), `klip hilang: ${p}`);
  }
});

test('playNobaraTechnique: node (tanpa window) -> no-op 0, jurus tak dikenal aman', () => {
  for (const k of Object.keys(NOBARA_TECHNIQUE_FILES)) assert.equal(playNobaraTechnique(k), 0);
  assert.equal(playNobaraTechnique('zzz'), 0);
  assert.equal(playNobaraTechnique(null), 0);
});

test('semua aset suara Nobara (3 kalah + 7 klip) ada di disk', () => {
  for (const p of [...VOICES.nobara.files.wrong, ...VOICES.nobara.clips]) {
    assert.ok(existsSync('public' + p), `klip hilang: ${p}`);
  }
});

test('NOBARA_LEAD_S: lead-silence terukur; klip pendek TIDAK di-skip (>0.24 baru skip)', () => {
  assert.equal(NOBARA_LEAD_S.kanzashi, 0.12);
  assert.equal(NOBARA_LEAD_S.tomonari, 0.16);
  assert.equal(NOBARA_LEAD_S.kokusen, 0.16);
  assert.equal(NOBARA_LEAD_S.ult, 0.30);
  assert.ok(NOBARA_LEAD_S.kanzashi <= 0.24 && NOBARA_LEAD_S.tomonari <= 0.24 && NOBARA_LEAD_S.kokusen <= 0.24);
});

test('NOBARA_TECHNIQUE_SFX_LAYERS: tiap jurus >= 2 lapis (spec)', () => {
  const keys = ['kanzashi', 'ren', 'jigen', 'tomonari', 'kokusen', 'ult', 'wrong'];
  assert.deepEqual(Object.keys(NOBARA_TECHNIQUE_SFX_LAYERS).sort(), keys.slice().sort());
  for (const k of keys) {
    const layers = NOBARA_TECHNIQUE_SFX_LAYERS[k];
    assert.ok(Array.isArray(layers) && layers.length >= 1, `${k} harus punya lapis`);
    for (const fn of layers) assert.match(fn, /^play[A-Z]/, `${k}: ${fn} harus play*`);
  }
  // jurus streak wajib >= 2 lapis
  for (const k of ['kanzashi', 'ren', 'jigen', 'tomonari', 'kokusen', 'ult']) {
    assert.ok(NOBARA_TECHNIQUE_SFX_LAYERS[k].length >= 2, `${k} harus >= 2 lapis`);
  }
  assert.deepEqual(NOBARA_TECHNIQUE_SFX_LAYERS.kanzashi, ['playNailShot', 'playNailBurst']);
  assert.deepEqual(NOBARA_TECHNIQUE_SFX_LAYERS.ren, ['playNailShot', 'playChainBurst']);
  assert.deepEqual(NOBARA_TECHNIQUE_SFX_LAYERS.jigen, ['playNailThud', 'playChainBurst']);
  assert.deepEqual(NOBARA_TECHNIQUE_SFX_LAYERS.tomonari, ['playStrawRustle', 'playHammerStrike', 'playResonanceWave']);
  assert.deepEqual(NOBARA_TECHNIQUE_SFX_LAYERS.kokusen, ['playBlackFlash', 'playDomainBoom']);
  assert.deepEqual(NOBARA_TECHNIQUE_SFX_LAYERS.ult, ['playNailShot', 'playHammerStrike', 'playChainBurst', 'playResonanceWave']);
});

test('nobaraTechniqueSfxLayers: aman untuk jurus tak dikenal', () => {
  assert.deepEqual(nobaraTechniqueSfxLayers('zzz'), []);
  assert.equal(nobaraTechniqueSfxLayers('tomonari').length, 3);
});

test('playNobaraTechniqueLayers: node no-op 0 (semua player return 0), hitung lapis valid', () => {
  assert.equal(playNobaraTechniqueLayers('kanzashi'), 2);
  assert.equal(playNobaraTechniqueLayers('tomonari'), 3);
  assert.equal(playNobaraTechniqueLayers('ult'), 4);
  assert.equal(playNobaraTechniqueLayers('zzz'), 0);
});

test('semua player SFX Nobara: node no-op 0 (guard window)', () => {
  for (const fn of [playNailShot, playNailThud, playNailBurst, playChainBurst,
    playHammerStrike, playResonanceWave, playBlackFlash, playStrawRustle]) {
    assert.equal(fn(), 0, `${fn.name} harus no-op di node`);
  }
});

test('params SFX Nobara: murni & deterministik (identitas 釘と爆発)', () => {
  assert.deepEqual(nailShotParams(), nailShotParams());
  assert.deepEqual(nailBurstParams(), nailBurstParams());
  assert.deepEqual(chainBurstParams(), chainBurstParams());
  assert.deepEqual(blackFlashParams(), blackFlashParams());
  // paku melesat = sweep tinggi→rendah (swish tajam)
  assert.ok(nailShotParams().fromHz > nailShotParams().toHz);
  // TUK = rendah (logam kena paku)
  assert.ok(nailThudParams().toHz < 200);
  // 黒閃 = bass drop dalam (< 30Hz ujungnya)
  assert.ok(blackFlashParams().toHz < 30);
  // resonansi = berlapis (riak)
  assert.ok(resonanceWaveParams().waves >= 3);
  // chain = 3 ledakan beruntun
  assert.equal(chainBurstParams().bursts, 3);
});
