import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  HEIAN_SCENES, totalDuration, sceneStartTimes, sceneAtTime,
  absoluteLineTimes, audioCues, voiceCues, ambienceTimeline, validateScenes,
  sceneOpacityAt, visibleSceneIndices, XFADE,
} from './scenes.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../../..');

test('scenes: valid (id unik, durasi>0, timing terjemahan setelah teks Jepang)', () => {
  assert.deepEqual(validateScenes(), []);
});

test('scenes: 4 babak sesuai konsep (capital → court → kana → change)', () => {
  assert.deepEqual(HEIAN_SCENES.map((s) => s.id), ['capital', 'court', 'kana', 'change']);
});

test('scenes: total durasi dalam rentang 20–40 detik', () => {
  const d = totalDuration();
  assert.ok(d >= 20 && d <= 40, `durasi ${d}s di luar 20–40s`);
});

test('scenes: teks Jepang persis sesuai spec', () => {
  const flat = HEIAN_SCENES.flatMap((s) => s.lines.map((l) => l.jp));
  for (const jp of ['794年', '都は、平安京へ。', '貴族たちは、宮廷に文化を咲かせた。',
    'かなは、日本の言葉を記す新たな道を開いた。', 'そして、時代は変わる。', '平安時代', 'ようこそ、平安へ。']) {
    assert.ok(flat.includes(jp), `teks hilang: ${jp}`);
  }
});

test('scenes: setiap terjemahan muncul setelah teks Jepangnya (bukan sekaligus)', () => {
  for (const s of HEIAN_SCENES) {
    for (const l of s.lines) {
      if (l.translationAt != null) {
        assert.ok(l.translationAt > l.at, `${s.id}/${l.id}: terjemahan harus menyusul`);
        assert.ok(l.translation != null, `${s.id}/${l.id}: ada translationAt tapi translation kosong`);
      }
    }
  }
});

test('timeline: start time kumulatif & monoton', () => {
  const starts = sceneStartTimes();
  assert.deepEqual(starts, [0, 9, 17, 26.5]);
  for (let i = 1; i < starts.length; i += 1) assert.ok(starts[i] > starts[i - 1]);
});

test('sceneAtTime: memetakan detik → indeks scene dengan benar (termasuk batas)', () => {
  assert.equal(sceneAtTime(HEIAN_SCENES, -5), 0);
  assert.equal(sceneAtTime(HEIAN_SCENES, 0), 0);
  assert.equal(sceneAtTime(HEIAN_SCENES, 8.9), 0);
  assert.equal(sceneAtTime(HEIAN_SCENES, 9), 1);
  assert.equal(sceneAtTime(HEIAN_SCENES, 16.9), 1);
  assert.equal(sceneAtTime(HEIAN_SCENES, 17), 2);
  assert.equal(sceneAtTime(HEIAN_SCENES, 26.5), 3);
  assert.equal(sceneAtTime(HEIAN_SCENES, 999), 3, 'di luar rentang → dijepit ke scene terakhir');
});

test('absoluteLineTimes: menggeser waktu relatif scene ke absolut', () => {
  const t = absoluteLineTimes(HEIAN_SCENES[0], 0);
  assert.equal(t[0].at, 0.5);
  assert.equal(t[1].at, 3.2);
  assert.equal(t[1].translationAt, 5.4);
  // scene 2 mulai di 9s → barisnya bergeser
  const t2 = absoluteLineTimes(HEIAN_SCENES[1], 9);
  assert.equal(t2[0].at, 9.8);
  assert.equal(t2[0].translationAt, 12.4);
});

test('audioCues: banyak SFX per scene, waktu absolut terurut, voice terpisah', () => {
  const cues = audioCues();
  assert.ok(cues.length >= HEIAN_SCENES.length * 3, 'harus ada beberapa SFX per scene');
  for (let i = 1; i < cues.length; i += 1) assert.ok(cues[i].at >= cues[i - 1].at, 'cue harus terurut');
  assert.ok(cues.some((c) => c.sfx === 'brushSweep'), 'ada sapuan kuas');
  assert.ok(cues.some((c) => c.sfx === 'taiko'), 'ada taiko');
  assert.ok(cues.some((c) => c.sfx === 'gong'), 'ada gong');
  for (const c of cues) { assert.ok(c.sfx); assert.ok(c.at >= 0); }
});

test('voiceCues: satu per BARIS ber-voice, terurut, waktu = at baris', () => {
  const vc = voiceCues();
  // 7 klip (semua baris punya aset).
  assert.equal(vc.length, 7, `harus 7 voice cue, dapat ${vc.length}`);
  for (let i = 1; i < vc.length; i += 1) assert.ok(vc[i].at >= vc[i - 1].at, 'voice cue harus terurut');
  for (const v of vc) { assert.ok(v.path, `${v.id} tanpa path`); assert.ok(v.at >= 0); }
  // Waktu absolut = start scene + at baris.
  const byId = Object.fromEntries(vc.map((v) => [v.id, v]));
  assert.equal(byId['voice:capital:year'].at, 0.5);
  assert.equal(byId['voice:court:court'].at, 9.8);
  assert.equal(byId['voice:change:era'].at, 31.9);
  assert.equal(byId['voice:change:welcome'].at, 34.5);
});

test('voiceCues: tiap file voice benar-benar ada di public/', () => {
  for (const v of voiceCues()) {
    const rel = v.path.replace(/^\//, '');   // '/voices/...' → 'voices/...'
    const full = join(ROOT, 'public', rel);
    assert.ok(existsSync(full), `file voice hilang: ${v.path} (→ ${full})`);
  }
});

test('ambienceTimeline: satu mood per scene, mulai di batas scene', () => {
  const tl = ambienceTimeline();
  assert.deepEqual(tl.map((x) => x.mood), ['calm', 'court', 'kana', 'dark']);
  assert.deepEqual(tl.map((x) => x.at), [0, 9, 17, 26.5]);
});

test('sceneOpacityAt: cross-fade di-center (bukan cut keras)', () => {
  const starts = sceneStartTimes();
  // Jauh di tengah scene 0 → opasitas 1.
  assert.equal(sceneOpacityAt(HEIAN_SCENES, 0, 4), 1);
  // Tepat di batas scene 0→1: keduanya ±0.5 (saling menembus).
  const mid = starts[1];
  assert.ok(Math.abs(sceneOpacityAt(HEIAN_SCENES, 0, mid) - 0.5) < 0.05);
  assert.ok(Math.abs(sceneOpacityAt(HEIAN_SCENES, 1, mid) - 0.5) < 0.05);
  // Scene terakhir memudar di ujungnya.
  const end = totalDuration();
  assert.ok(sceneOpacityAt(HEIAN_SCENES, HEIAN_SCENES.length - 1, end) <= 0.01);
});

test('visibleSceneIndices: hanya scene di sekitar jam yang di-mount', () => {
  // Tengah scene 0 → hanya scene 0.
  assert.deepEqual(visibleSceneIndices(HEIAN_SCENES, 4), [0]);
  // Di batas 0→1 (dalam jendela fade) → 0 dan 1.
  const vis = visibleSceneIndices(HEIAN_SCENES, 9);
  assert.ok(vis.includes(0) && vis.includes(1));
  assert.ok(XFADE > 0);
});

test('validateScenes: menangkap durasi & urutan timing yang salah', () => {
  const bad = [{ id: 'x', duration: 0, lines: [{ id: 'a', jp: 'あ', at: 1, translationAt: 0.5, translation: 't' }] }];
  const errs = validateScenes(bad);
  assert.ok(errs.some((e) => /durasi/.test(e)));
  assert.ok(errs.some((e) => /SETELAH/.test(e)));
});
