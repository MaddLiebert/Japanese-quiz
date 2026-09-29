import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  NANAMI_TECHNIQUE_SFX_LAYERS, nanamiTechniqueSfxLayers, playNanamiTechniqueLayers,
  playRatioSlash, playCriticalDing, playOonataSweep, playJufuFlutter,
  playWallCrack, playRubbleCrash, playTieSnap, playWatchTick,
  playOvertimeRiser, playContractBreak,
  ratioSlashParams, criticalDingParams, oonataSweepParams, jufuFlutterParams,
  wallCrackParams, rubbleCrashParams, tieSnapParams, watchTickParams,
  overtimeRiserParams, contractBreakParams,
  NANAMI_TECHNIQUE_FILES, NANAMI_LEAD_S, playNanamiTechnique,
} from './sfx.js';
import { VOICES } from '../features/audio/voices.js';

test('NANAMI_TECHNIQUE_SFX_LAYERS: tiap jurus >= 2 lapis (spec 十劃呪法)', () => {
  const keys = ['shichisan', 'oonata', 'garagara', 'kokusen', 'jikangai', 'ult', 'contract', 'wrong'];
  assert.deepEqual(Object.keys(NANAMI_TECHNIQUE_SFX_LAYERS).sort(), keys.slice().sort());
  for (const k of keys) {
    const layers = NANAMI_TECHNIQUE_SFX_LAYERS[k];
    assert.ok(Array.isArray(layers) && layers.length >= 1, `${k} harus punya lapis`);
    for (const fn of layers) assert.match(fn, /^play[A-Z]/, `${k}: ${fn} harus play*`);
  }
  // jurus streak wajib >= 2 lapis (identitas 3 lapis: core → body → edge)
  for (const k of ['shichisan', 'oonata', 'garagara', 'kokusen', 'jikangai', 'ult']) {
    assert.ok(NANAMI_TECHNIQUE_SFX_LAYERS[k].length >= 2, `${k} harus >= 2 lapis`);
  }
  assert.deepEqual(NANAMI_TECHNIQUE_SFX_LAYERS.shichisan, ['playRatioSlash', 'playCriticalDing']);
  assert.deepEqual(NANAMI_TECHNIQUE_SFX_LAYERS.oonata, ['playOonataSweep', 'playJufuFlutter']);
  assert.deepEqual(NANAMI_TECHNIQUE_SFX_LAYERS.garagara, ['playWallCrack', 'playRubbleCrash']);
  assert.deepEqual(NANAMI_TECHNIQUE_SFX_LAYERS.kokusen, ['playKokusenCrackle', 'playKokusenThunder']);
  assert.deepEqual(NANAMI_TECHNIQUE_SFX_LAYERS.jikangai, ['playWatchTick', 'playTieSnap', 'playOvertimeRiser']);
  assert.deepEqual(NANAMI_TECHNIQUE_SFX_LAYERS.ult, ['playWatchTick', 'playTieSnap', 'playOvertimeRiser', 'playDomainBoom']);
  assert.deepEqual(NANAMI_TECHNIQUE_SFX_LAYERS.contract, ['playContractBreak']);
  assert.deepEqual(NANAMI_TECHNIQUE_SFX_LAYERS.wrong, ['playContractBreak']);
});

test('nanamiTechniqueSfxLayers: aman untuk jurus tak dikenal', () => {
  assert.deepEqual(nanamiTechniqueSfxLayers('zzz'), []);
  assert.equal(nanamiTechniqueSfxLayers('jikangai').length, 3);
});

test('playNanamiTechniqueLayers: node no-op 0 (semua player return 0), hitung lapis valid', () => {
  assert.equal(playNanamiTechniqueLayers('shichisan'), 2);
  assert.equal(playNanamiTechniqueLayers('oonata'), 2);
  assert.equal(playNanamiTechniqueLayers('garagara'), 2);
  assert.equal(playNanamiTechniqueLayers('jikangai'), 3);
  assert.equal(playNanamiTechniqueLayers('ult'), 4);
  assert.equal(playNanamiTechniqueLayers('zzz'), 0);
});

test('semua player SFX Nanami baru: node no-op 0 (guard window)', () => {
  for (const fn of [playRatioSlash, playCriticalDing, playOonataSweep, playJufuFlutter,
    playWallCrack, playRubbleCrash, playTieSnap, playWatchTick,
    playOvertimeRiser, playContractBreak]) {
    assert.equal(fn(), 0, `${fn.name} harus no-op di node`);
  }
});

test('params SFX Nanami: murni & deterministik (identitas 十劃呪法)', () => {
  assert.deepEqual(ratioSlashParams(), ratioSlashParams());
  assert.deepEqual(criticalDingParams(), criticalDingParams());
  assert.deepEqual(oonataSweepParams(), oonataSweepParams());
  assert.deepEqual(jufuFlutterParams(), jufuFlutterParams());
  assert.deepEqual(wallCrackParams(), wallCrackParams());
  assert.deepEqual(rubbleCrashParams(), rubbleCrashParams());
  assert.deepEqual(tieSnapParams(), tieSnapParams());
  assert.deepEqual(watchTickParams(), watchTickParams());
  assert.deepEqual(overtimeRiserParams(), overtimeRiserParams());
  assert.deepEqual(contractBreakParams(), contractBreakParams());
  // tebasan 7:3 = gesekan presisi (sweep cepat tinggi→rendah)
  assert.ok(ratioSlashParams().fromHz > ratioSlashParams().toHz);
  assert.ok(ratioSlashParams().dur <= 0.2, 'tebasan presisi harus pendek');
  // ding kristal = nada tinggi bersih (bukan noise)
  assert.ok(criticalDingParams().hz >= 1000, 'ding harus tinggi');
  // sapuan 大鉈 = golok berat (durasi lebih panjang dari tebasan)
  assert.ok(oonataSweepParams().dur > ratioSlashParams().dur);
  // 呪符 = kertas berterbangan (berlapis)
  assert.ok(jufuFlutterParams().layers >= 3);
  // dinding retak = crackle beruntun
  assert.ok(wallCrackParams().bursts >= 3);
  // puing menghantam = boom rendah + noise
  assert.ok(rubbleCrashParams().toHz < 60);
  // dasi lepas = kain (bandpass, bukan logam)
  assert.equal(tieSnapParams().type, 'bandpass');
  // jam = tick pendek dua nada
  assert.ok(watchTickParams().hz >= 800);
  // riser lembur = naik (from < to)
  assert.ok(overtimeRiserParams().fromHz < overtimeRiserParams().toHz);
  // kontrak batal = turun gelap (from > to) + sub
  assert.ok(contractBreakParams().fromHz > contractBreakParams().toHz);
});

test('NANAMI_TECHNIQUE_FILES: 5 klip jurus, path valid, file ada di disk', () => {
  const keys = ['shichisan', 'oonata', 'garagara', 'kokusen', 'jikangai'];
  assert.deepEqual(Object.keys(NANAMI_TECHNIQUE_FILES).sort(), keys.slice().sort());
  for (const [k, p] of Object.entries(NANAMI_TECHNIQUE_FILES)) {
    assert.equal(p, `/voices/nanami/${k}.mp3`);
    assert.ok(existsSync('public' + p), `klip hilang: ${p}`);
  }
});

test('playNanamiTechnique: node (tanpa window) -> no-op 0, jurus tak dikenal aman', () => {
  for (const k of Object.keys(NANAMI_TECHNIQUE_FILES)) assert.equal(playNanamiTechnique(k), 0);
  assert.equal(playNanamiTechnique('zzz'), 0);
  assert.equal(playNanamiTechnique(null), 0);
});

test('NANAMI_LEAD_S: lead-silence terukur; klip pendek TIDAK di-skip (>0.24 baru skip)', () => {
  assert.equal(NANAMI_LEAD_S.shichisan, 0.18);
  assert.equal(NANAMI_LEAD_S.oonata, 0.14);
  assert.equal(NANAMI_LEAD_S.garagara, 0.10);
  assert.equal(NANAMI_LEAD_S.kokusen, 0.16);
  assert.equal(NANAMI_LEAD_S.jikangai, 0.14);
  assert.ok(NANAMI_LEAD_S.shichisan <= 0.24 && NANAMI_LEAD_S.kokusen <= 0.24 && NANAMI_LEAD_S.jikangai <= 0.24);
});

test('semua aset suara Nanami (3 kalah + 5 klip) ada di disk', () => {
  for (const p of [...VOICES.nanami.files.wrong, ...VOICES.nanami.clips]) {
    assert.ok(existsSync('public' + p), `klip hilang: ${p}`);
  }
});

test('VOICES.nanami: pola Gojo (correct/streak KOSONG, clips 5 jurus, wrong 3 kalah)', () => {
  assert.deepEqual(VOICES.nanami.files.correct, []);
  assert.deepEqual(VOICES.nanami.files.streak, []);
  assert.equal(VOICES.nanami.files.wrong.length, 3);
  assert.equal(VOICES.nanami.clips.length, 5);
  assert.deepEqual(VOICES.nanami.clips, [
    '/voices/nanami/shichisan.mp3', '/voices/nanami/oonata.mp3',
    '/voices/nanami/garagara.mp3', '/voices/nanami/kokusen.mp3',
    '/voices/nanami/jikangai.mp3',
  ]);
  assert.deepEqual(VOICES.nanami.files.wrong, [
    '/voices/nanami/wrong_1.mp3', '/voices/nanami/wrong_2.mp3', '/voices/nanami/wrong_3.mp3',
  ]);
});
