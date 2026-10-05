import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDO_SCENES, XFADE, MOUNT_PAD, voiceCues } from './scenes.js';
import {
  totalDuration, sceneStartTimes, sceneAtTime, audioCues,
  ambienceTimeline, validateScenes, sceneOpacityAt, visibleSceneIndices,
} from '../../timeline.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');

test('scenes Edo: valid (id unik, durasi>0, terjemahan setelah teks Jepang)', () => {
  assert.deepEqual(validateScenes(EDO_SCENES), []);
});

test('scenes Edo: 5 babak sesuai PRD §10 (map→capital→print→night→change)', () => {
  assert.deepEqual(EDO_SCENES.map((s) => s.id), ['map', 'capital', 'print', 'night', 'change']);
});

test('scenes Edo: total durasi 60–90 detik (spesifikasi cinematic)', () => {
  const d = totalDuration(EDO_SCENES);
  assert.ok(d >= 60 && d <= 90, `durasi ${d}s di luar 60–90s`);
});

test('scenes Edo: teks Jepang sesuai spec (江戸時代, 浮世絵, 提灯, 江戸)', () => {
  const flat = EDO_SCENES.flatMap((s) => s.lines.map((l) => l.jp));
  for (const jp of ['江戸時代', '浮世絵、刷る。', '昼は市、夜は提灯。', 'ようこそ、江戸へ。']) {
    assert.ok(flat.includes(jp), `teks hilang: ${jp}`);
  }
});

test('scenes Edo: babak 1 (map) sengaja TANPA teks (murni visual)', () => {
  assert.equal(EDO_SCENES[0].lines.length, 0);
});

test('scenes Edo: tiap terjemahan menyusul teks Jepangnya', () => {
  for (const s of EDO_SCENES) {
    for (const l of s.lines) {
      if (l.translationAt != null) {
        assert.ok(l.translationAt > l.at, `${s.id}/${l.id}: terjemahan harus menyusul`);
        assert.ok(l.translation != null, `${s.id}/${l.id}: ada translationAt tapi translation kosong`);
      }
    }
  }
});

test('scenes Edo: start time kumulatif & monoton', () => {
  const starts = sceneStartTimes(EDO_SCENES);
  assert.equal(starts[0], 0);
  for (let i = 1; i < starts.length; i += 1) assert.ok(starts[i] > starts[i - 1]);
});

test('scenes Edo: sceneAtTime menjepit di luar rentang', () => {
  assert.equal(sceneAtTime(EDO_SCENES, -5), 0);
  assert.equal(sceneAtTime(EDO_SCENES, 999), EDO_SCENES.length - 1);
});

test('scenes Edo: audioCues punya beberapa SFX per scene, terurut', () => {
  const cues = audioCues(EDO_SCENES);
  assert.ok(cues.length >= EDO_SCENES.length * 3, 'harus ada beberapa SFX per scene');
  for (let i = 1; i < cues.length; i += 1) assert.ok(cues[i].at >= cues[i - 1].at, 'cue harus terurut');
  // SFX khas Edo.
  assert.ok(cues.some((c) => c.sfx === 'woodKnock'), 'ada ketukan kayu 木');
  assert.ok(cues.some((c) => c.sfx === 'shamisen'), 'ada shamisen 三味線');
  assert.ok(cues.some((c) => c.sfx === 'marketCry'), 'ada sorak pasar');
});

test('scenes Edo: mood per scene (market/print/night/festival)', () => {
  const tl = ambienceTimeline(EDO_SCENES);
  assert.deepEqual(tl.map((x) => x.mood), ['market', 'market', 'print', 'night', 'festival']);
});

test('voiceCues Edo: satu per BARIS ber-voice (7), terurut, waktu = at baris', () => {
  const vc = voiceCues();
  // 7 klip narasi Nacht (babak 1 map sengaja tanpa teks → tanpa voice).
  assert.equal(vc.length, 7, `harus 7 voice cue, dapat ${vc.length}`);
  for (let i = 1; i < vc.length; i += 1) assert.ok(vc[i].at >= vc[i - 1].at, 'voice cue harus terurut');
  for (const v of vc) { assert.ok(v.path, `${v.id} tanpa path`); assert.ok(v.at >= 0); }
  // Waktu absolut = start scene + at baris.
  const byId = Object.fromEntries(vc.map((v) => [v.id, v]));
  assert.equal(byId['voice:capital:era'].at, 10.6);
  assert.equal(byId['voice:capital:bridge'].at, 13.6);
  assert.equal(byId['voice:night:lantern'].at, 36.7);
  assert.equal(byId['voice:change:welcome'].at, 56.6);
});

test('voiceCues Edo: tiap file voice benar-benar ada di public/', () => {
  for (const v of voiceCues()) {
    const rel = v.path.replace(/^\//, '');   // '/voices/...' → 'voices/...'
    const full = join(ROOT, 'public', rel);
    assert.ok(existsSync(full), `file voice hilang: ${v.path} (→ ${full})`);
  }
});

test('scenes Edo: cross-fade di-center (bukan cut keras)', () => {
  const starts = sceneStartTimes(EDO_SCENES);
  assert.equal(sceneOpacityAt(EDO_SCENES, 0, 3), 1);
  const mid = starts[1];
  assert.ok(Math.abs(sceneOpacityAt(EDO_SCENES, 0, mid, XFADE) - 0.5) < 0.05);
  assert.ok(Math.abs(sceneOpacityAt(EDO_SCENES, 1, mid, XFADE) - 0.5) < 0.05);
});

test('scenes Edo: visibleSceneIndices hanya scene sekitar jam', () => {
  assert.deepEqual(visibleSceneIndices(EDO_SCENES, 3, XFADE, MOUNT_PAD), [0]);
  const vis = visibleSceneIndices(EDO_SCENES, sceneStartTimes(EDO_SCENES)[1], XFADE, MOUNT_PAD);
  assert.ok(vis.includes(0) && vis.includes(1));
});

test('validateScenes: menangkap durasi & urutan timing salah', () => {
  const bad = [{ id: 'x', duration: 0, lines: [{ id: 'a', jp: 'あ', at: 1, translationAt: 0.5, translation: 't' }] }];
  const errs = validateScenes(bad);
  assert.ok(errs.some((e) => /durasi/.test(e)));
  assert.ok(errs.some((e) => /SETELAH/.test(e)));
});
