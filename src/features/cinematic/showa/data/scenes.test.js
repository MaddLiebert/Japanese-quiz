import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SHOWA_SCENES, XFADE, MOUNT_PAD, voiceCues } from './scenes.js';
import {
  totalDuration, sceneStartTimes, sceneAtTime, audioCues,
  ambienceTimeline, validateScenes, sceneOpacityAt, visibleSceneIndices,
} from '../../timeline.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');

test('scenes Shōwa: valid (id unik, durasi>0, terjemahan setelah teks Jepang)', () => {
  assert.deepEqual(validateScenes(SHOWA_SCENES), []);
});

test('scenes Shōwa: 5 babak sesuai PRD §10 (ruins→yamichi→build→tower→change)', () => {
  assert.deepEqual(SHOWA_SCENES.map((s) => s.id), ['ruins', 'yamichi', 'build', 'tower', 'change']);
});

test('scenes Shōwa: total durasi 60–90 detik (spesifikasi cinematic)', () => {
  const d = totalDuration(SHOWA_SCENES);
  assert.ok(d >= 60 && d <= 90, `durasi ${d}s di luar 60–90s`);
});

test('scenes Shōwa: teks Jepang sesuai spec (昭和時代, 灰, コンクリート, 塔, 昭和)', () => {
  const flat = SHOWA_SCENES.flatMap((s) => s.lines.map((l) => l.jp));
  for (const jp of ['昭和時代', '灰の中でも、人は生きる。', 'コンクリートを打って、町を作る。', '塔が立つ。速い車が走る。', '昭和 — 灰からの町', 'ようこそ、昭和へ。']) {
    assert.ok(flat.includes(jp), `teks hilang: ${jp}`);
  }
});

test('scenes Shōwa: babak 1 (ruins) sengaja TANPA teks (murni visual)', () => {
  assert.equal(SHOWA_SCENES[0].lines.length, 0);
});

test('scenes Shōwa: tiap terjemahan menyusul teks Jepangnya', () => {
  for (const s of SHOWA_SCENES) {
    for (const l of s.lines) {
      if (l.translationAt != null) {
        assert.ok(l.translationAt > l.at, `${s.id}/${l.id}: terjemahan harus menyusul`);
        assert.ok(l.translation != null, `${s.id}/${l.id}: ada translationAt tapi translation kosong`);
      }
    }
  }
});

test('scenes Shōwa: start time kumulatif & monoton', () => {
  const starts = sceneStartTimes(SHOWA_SCENES);
  assert.equal(starts[0], 0);
  for (let i = 1; i < starts.length; i += 1) assert.ok(starts[i] > starts[i - 1]);
});

test('scenes Shōwa: sceneAtTime menjepit di luar rentang', () => {
  assert.equal(sceneAtTime(SHOWA_SCENES, -5), 0);
  assert.equal(sceneAtTime(SHOWA_SCENES, 999), SHOWA_SCENES.length - 1);
});

test('scenes Shōwa: audioCues punya beberapa SFX per scene, terurut', () => {
  const cues = audioCues(SHOWA_SCENES);
  assert.ok(cues.length >= SHOWA_SCENES.length * 3, 'harus ada beberapa SFX per scene');
  for (let i = 1; i < cues.length; i += 1) assert.ok(cues[i].at >= cues[i - 1].at, 'cue harus terurut');
  // SFX khas Shōwa (baru di mesin audio).
  assert.ok(cues.some((c) => c.sfx === 'pileDriver'), 'ada tiang pancang beton 杭打ち');
  assert.ok(cues.some((c) => c.sfx === 'shinkansen'), 'ada kereta cepat 新幹線');
  assert.ok(cues.some((c) => c.sfx === 'cicada'), 'ada 蝉 cicada');
  assert.ok(cues.some((c) => c.sfx === 'schoolChime'), 'ada チャイム sekolah');
});

test('scenes Shōwa: mood per scene (ruins/yamichi/danchi/city/expo)', () => {
  const tl = ambienceTimeline(SHOWA_SCENES);
  assert.deepEqual(tl.map((x) => x.mood), ['ruins', 'yamichi', 'danchi', 'city', 'expo']);
});

test('voiceCues Shōwa: satu per BARIS ber-voice (7), terurut, waktu = at baris', () => {
  const vc = voiceCues();
  // 7 klip narasi Nacht (babak 1 ruins sengaja tanpa teks → tanpa voice).
  assert.equal(vc.length, 7, `harus 7 voice cue, dapat ${vc.length}`);
  for (let i = 1; i < vc.length; i += 1) assert.ok(vc[i].at >= vc[i - 1].at, 'voice cue harus terurut');
  for (const v of vc) { assert.ok(v.path, `${v.id} tanpa path`); assert.ok(v.at >= 0); }
  // Waktu absolut = start scene + at baris.
  const byId = Object.fromEntries(vc.map((v) => [v.id, v]));
  assert.equal(byId['voice:yamichi:era'].at, 10.6);
  assert.equal(byId['voice:yamichi:survive'].at, 13.6);
  assert.equal(byId['voice:build:concrete'].at, 24.8);
  assert.equal(byId['voice:tower:rise'].at, 38.7);
  assert.equal(byId['voice:change:turn'].at, 52.6);
  assert.equal(byId['voice:change:welcome'].at, 59.6);
});

test('voiceCues Shōwa: file voice menunjuk /voices/showa/ (T11 belum digenerate)', () => {
  // T11 (generate mp3 + split) = tugas TERAKHIR; PRD §14 R7 bilang tema tetap
  // jalan tanpa voice. Jadi di sini kita HANYA cek path menunjuk folder yang
  // benar — BUKAN keberadaan file (itu tugas test T11 nanti).
  for (const v of voiceCues()) {
    assert.ok(v.path.startsWith('/voices/showa/'), `path tidak di /voices/showa/: ${v.path}`);
    assert.ok(v.path.endsWith('.mp3'), `path bukan mp3: ${v.path}`);
  }
});

test('voiceCues Shōwa: T11 SELESAI — tiap file voice ADA di public/voices/showa/', () => {
  // Aset Nacht 昭和 (7 klip) di-split dari voice-source/showa/nacht.mp3.
  // Lihat docs/voice-cinematic-showa.md.
  for (const v of voiceCues()) {
    const full = join(ROOT, 'public', v.path.replace(/^\//, ''));
    assert.ok(existsSync(full), `file voice hilang: ${v.path} (harus di ${full})`);
  }
});

test('scenes Shōwa: cross-fade di-center (bukan cut keras)', () => {
  const starts = sceneStartTimes(SHOWA_SCENES);
  assert.equal(sceneOpacityAt(SHOWA_SCENES, 0, 3), 1);
  const mid = starts[1];
  assert.ok(Math.abs(sceneOpacityAt(SHOWA_SCENES, 0, mid, XFADE) - 0.5) < 0.05);
  assert.ok(Math.abs(sceneOpacityAt(SHOWA_SCENES, 1, mid, XFADE) - 0.5) < 0.05);
});

test('scenes Shōwa: visibleSceneIndices hanya scene sekitar jam', () => {
  assert.deepEqual(visibleSceneIndices(SHOWA_SCENES, 3, XFADE, MOUNT_PAD), [0]);
  const vis = visibleSceneIndices(SHOWA_SCENES, sceneStartTimes(SHOWA_SCENES)[1], XFADE, MOUNT_PAD);
  assert.ok(vis.includes(0) && vis.includes(1));
});

test('validateScenes: menangkap durasi & urutan timing salah', () => {
  const bad = [{ id: 'x', duration: 0, lines: [{ id: 'a', jp: 'あ', at: 1, translationAt: 0.5, translation: 't' }] }];
  const errs = validateScenes(bad);
  assert.ok(errs.some((e) => /durasi/.test(e)));
  assert.ok(errs.some((e) => /SETELAH/.test(e)));
});
