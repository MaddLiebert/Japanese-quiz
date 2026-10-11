// scenes.test.js — penjaga cinematic 電脳 (T5). Lihat PRD docs/tema/cyberpunk.md §10.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CYBER_SCENES, XFADE, MOUNT_PAD, voiceCues } from './scenes.js';
import {
  totalDuration, sceneStartTimes, sceneAtTime, audioCues,
  ambienceTimeline, validateScenes, sceneOpacityAt, visibleSceneIndices,
} from '../../timeline.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');

test('scenes 電脳: valid (id unik, durasi>0, terjemahan setelah teks Jepang)', () => {
  assert.deepEqual(validateScenes(CYBER_SCENES), []);
});

test('scenes 電脳: 5 babak (gate→city→peak→endless→home)', () => {
  assert.deepEqual(CYBER_SCENES.map((s) => s.id), ['gate', 'city', 'peak', 'endless', 'home']);
});

test('scenes 電脳: total durasi 60–90 detik (spesifikasi cinematic)', () => {
  const d = totalDuration(CYBER_SCENES);
  assert.ok(d >= 60 && d <= 90, `durasi ${d}s di luar 60–90s`);
});

test('scenes 電脳: babak 1 (gate) sengaja TANPA teks (murni visual glitch)', () => {
  assert.equal(CYBER_SCENES[0].lines.length, 0);
});

test('scenes 電脳: tema 「常夜」 — puncak peradaban, malam tanpa akhir', () => {
  const flat = CYBER_SCENES.flatMap((s) => s.lines.map((l) => l.jp));
  for (const jp of [
    'ようこそ、常夜へ。', '眠らない街。', 'これが、文明の果て。',
    '光の塔、空を穿つ。', 'だが、夜は明けない。', '終わらない夜。',
    'それでも、家がある。', '電脳 — 常夜の果て', 'ようこそ、電脳へ。',
  ]) {
    assert.ok(flat.includes(jp), `teks hilang: ${jp}`);
  }
});

test('scenes 電脳: tiap terjemahan menyusul teks Jepangnya', () => {
  for (const s of CYBER_SCENES) {
    for (const l of s.lines) {
      if (l.translationAt != null) {
        assert.ok(l.translationAt > l.at, `${s.id}/${l.id}: terjemahan harus menyusul`);
        assert.ok(l.translation != null, `${s.id}/${l.id}: ada translationAt tapi translation kosong`);
      }
    }
  }
});

test('scenes 電脳: start time kumulatif & monoton', () => {
  const starts = sceneStartTimes(CYBER_SCENES);
  assert.equal(starts[0], 0);
  for (let i = 1; i < starts.length; i += 1) assert.ok(starts[i] > starts[i - 1]);
});

test('scenes 電脳: sceneAtTime menjepit di luar rentang', () => {
  assert.equal(sceneAtTime(CYBER_SCENES, -5), 0);
  assert.equal(sceneAtTime(CYBER_SCENES, 999), CYBER_SCENES.length - 1);
});

test('scenes 電脳: audioCues punya beberapa SFX per scene, terurut', () => {
  const cues = audioCues(CYBER_SCENES);
  assert.ok(cues.length >= CYBER_SCENES.length * 3, 'harus ada beberapa SFX per scene');
  for (let i = 1; i < cues.length; i += 1) assert.ok(cues[i].at >= cues[i - 1].at, 'cue harus terurut');
  // SFX khas 電脳 (baru di mesin audio).
  assert.ok(cues.some((c) => c.sfx === 'glitchBurst'), 'ada glitch RGB-split');
  assert.ok(cues.some((c) => c.sfx === 'neonHum'), 'ada dengung neon');
  assert.ok(cues.some((c) => c.sfx === 'dataRush'), 'ada aliran data (puncak peradaban)');
  assert.ok(cues.some((c) => c.sfx === 'powerDown'), 'ada daya turun (malam tanpa akhir)');
  assert.ok(cues.some((c) => c.sfx === 'hologram'), 'ada hologram');
});

test('scenes 電脳: mood per scene (neon/peak/endless)', () => {
  const tl = ambienceTimeline(CYBER_SCENES);
  assert.deepEqual(tl.map((x) => x.mood), ['neon', 'neon', 'peak', 'endless', 'neon']);
});

test('voiceCues 電脳: satu per BARIS ber-voice (9), terurut, file ADA', () => {
  const vc = voiceCues();
  assert.equal(vc.length, 9, `harus 9 voice cue, dapat ${vc.length}`);
  for (let i = 1; i < vc.length; i += 1) assert.ok(vc[i].at >= vc[i - 1].at, 'voice cue harus terurut');
  for (const v of vc) {
    assert.ok(v.path.startsWith('/voices/cyberpunk/'), `${v.id}: path harus di /voices/cyberpunk/`);
    const abs = join(ROOT, 'public', v.path.replace(/^\//, ''));
    assert.ok(existsSync(abs), `file voice hilang: ${v.path}`);
  }
});

test('sceneOpacityAt & visibleSceneIndices: jendela cross-fade wajar', () => {
  const t0 = sceneStartTimes(CYBER_SCENES)[1];
  // Di tengah scene 1 → opasitas penuh.
  assert.ok(sceneOpacityAt(CYBER_SCENES, 1, t0 + CYBER_SCENES[1].duration / 2, XFADE) > 0.9);
  const vis = visibleSceneIndices(CYBER_SCENES, t0, XFADE, MOUNT_PAD);
  assert.ok(vis.includes(0) && vis.includes(1), 'dua scene beririsan saat cross-fade');
});
