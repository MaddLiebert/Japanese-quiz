import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEIJI_SCENES, XFADE, MOUNT_PAD, voiceCues } from './scenes.js';
import {
  totalDuration, sceneStartTimes, sceneAtTime, audioCues,
  ambienceTimeline, validateScenes, sceneOpacityAt, visibleSceneIndices,
} from '../../timeline.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');

test('scenes Meiji: valid (id unik, durasi>0, terjemahan setelah teks Jepang)', () => {
  assert.deepEqual(validateScenes(MEIJI_SCENES), []);
});

test('scenes Meiji: 5 babak sesuai PRD §10 (port→ginza→print→rail→change)', () => {
  assert.deepEqual(MEIJI_SCENES.map((s) => s.id), ['port', 'ginza', 'print', 'rail', 'change']);
});

test('scenes Meiji: total durasi 60–90 detik (spesifikasi cinematic)', () => {
  const d = totalDuration(MEIJI_SCENES);
  assert.ok(d >= 60 && d <= 90, `durasi ${d}s di luar 60–90s`);
});

test('scenes Meiji: teks Jepang sesuai spec (明治時代, 活字, 電信, 文明開化, 明治)', () => {
  const flat = MEIJI_SCENES.flatMap((s) => s.lines.map((l) => l.jp));
  for (const jp of ['明治時代', '活字を組んで、刷る。', '煙と電信が、国をつなぐ。', '明治 — 文明開化', 'ようこそ、明治へ。']) {
    assert.ok(flat.includes(jp), `teks hilang: ${jp}`);
  }
});

test('scenes Meiji: babak 1 (port) sengaja TANPA teks (murni visual)', () => {
  assert.equal(MEIJI_SCENES[0].lines.length, 0);
});

test('scenes Meiji: tiap terjemahan menyusul teks Jepangnya', () => {
  for (const s of MEIJI_SCENES) {
    for (const l of s.lines) {
      if (l.translationAt != null) {
        assert.ok(l.translationAt > l.at, `${s.id}/${l.id}: terjemahan harus menyusul`);
        assert.ok(l.translation != null, `${s.id}/${l.id}: ada translationAt tapi translation kosong`);
      }
    }
  }
});

test('scenes Meiji: start time kumulatif & monoton', () => {
  const starts = sceneStartTimes(MEIJI_SCENES);
  assert.equal(starts[0], 0);
  for (let i = 1; i < starts.length; i += 1) assert.ok(starts[i] > starts[i - 1]);
});

test('scenes Meiji: sceneAtTime menjepit di luar rentang', () => {
  assert.equal(sceneAtTime(MEIJI_SCENES, -5), 0);
  assert.equal(sceneAtTime(MEIJI_SCENES, 999), MEIJI_SCENES.length - 1);
});

test('scenes Meiji: audioCues punya beberapa SFX per scene, terurut', () => {
  const cues = audioCues(MEIJI_SCENES);
  assert.ok(cues.length >= MEIJI_SCENES.length * 3, 'harus ada beberapa SFX per scene');
  for (let i = 1; i < cues.length; i += 1) assert.ok(cues[i].at >= cues[i - 1].at, 'cue harus terurut');
  // SFX khas Meiji.
  assert.ok(cues.some((c) => c.sfx === 'pressClack'), 'ada mesin cetak 活字');
  assert.ok(cues.some((c) => c.sfx === 'steamWhistle'), 'ada peluit uap 汽笛');
  assert.ok(cues.some((c) => c.sfx === 'telegraph'), 'ada telegraf 電信');
});

test('scenes Meiji: mood per scene (port/city/press/city/diet)', () => {
  const tl = ambienceTimeline(MEIJI_SCENES);
  assert.deepEqual(tl.map((x) => x.mood), ['port', 'city', 'press', 'city', 'diet']);
});

test('voiceCues Meiji: satu per BARIS ber-voice (7), terurut, waktu = at baris', () => {
  const vc = voiceCues();
  // 7 klip narasi Saku (babak 1 port sengaja tanpa teks → tanpa voice).
  assert.equal(vc.length, 7, `harus 7 voice cue, dapat ${vc.length}`);
  for (let i = 1; i < vc.length; i += 1) assert.ok(vc[i].at >= vc[i - 1].at, 'voice cue harus terurut');
  for (const v of vc) { assert.ok(v.path, `${v.id} tanpa path`); assert.ok(v.at >= 0); }
  // Waktu absolut = start scene + at baris.
  const byId = Object.fromEntries(vc.map((v) => [v.id, v]));
  assert.equal(byId['voice:ginza:era'].at, 10.6);
  assert.equal(byId['voice:ginza:brick'].at, 13.6);
  assert.equal(byId['voice:print:type'].at, 23.8);
  assert.equal(byId['voice:rail:steam'].at, 36.7);
  assert.equal(byId['voice:change:turn'].at, 49.6);
  assert.equal(byId['voice:change:welcome'].at, 56.6);
});

test('voiceCues Meiji: file voice menunjuk /voices/meiji/ (pola sama era lain)', () => {
  for (const v of voiceCues()) {
    assert.ok(v.path.startsWith('/voices/meiji/'), `path tidak di /voices/meiji/: ${v.path}`);
    assert.ok(v.path.endsWith('.mp3'), `path bukan mp3: ${v.path}`);
  }
});

test('voiceCues Meiji: tiap file voice benar-benar ada di public/', () => {
  for (const v of voiceCues()) {
    const rel = v.path.replace(/^\//, '');   // '/voices/...' → 'voices/...'
    const full = join(ROOT, 'public', rel);
    assert.ok(existsSync(full), `file voice hilang: ${v.path} (→ ${full})`);
  }
});

test('scenes Meiji: cross-fade di-center (bukan cut keras)', () => {
  const starts = sceneStartTimes(MEIJI_SCENES);
  assert.equal(sceneOpacityAt(MEIJI_SCENES, 0, 3), 1);
  const mid = starts[1];
  assert.ok(Math.abs(sceneOpacityAt(MEIJI_SCENES, 0, mid, XFADE) - 0.5) < 0.05);
  assert.ok(Math.abs(sceneOpacityAt(MEIJI_SCENES, 1, mid, XFADE) - 0.5) < 0.05);
});

test('scenes Meiji: visibleSceneIndices hanya scene sekitar jam', () => {
  assert.deepEqual(visibleSceneIndices(MEIJI_SCENES, 3, XFADE, MOUNT_PAD), [0]);
  const vis = visibleSceneIndices(MEIJI_SCENES, sceneStartTimes(MEIJI_SCENES)[1], XFADE, MOUNT_PAD);
  assert.ok(vis.includes(0) && vis.includes(1));
});

test('validateScenes: menangkap durasi & urutan timing salah', () => {
  const bad = [{ id: 'x', duration: 0, lines: [{ id: 'a', jp: 'あ', at: 1, translationAt: 0.5, translation: 't' }] }];
  const errs = validateScenes(bad);
  assert.ok(errs.some((e) => /durasi/.test(e)));
  assert.ok(errs.some((e) => /SETELAH/.test(e)));
});
