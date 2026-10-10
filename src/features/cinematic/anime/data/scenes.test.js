// scenes.test.js — penjaga cinematic 多元 (T5). Lihat PRD docs/tema/anime.md §10.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ANIME_SCENES, XFADE, MOUNT_PAD, voiceCues } from './scenes.js';
import {
  totalDuration, sceneStartTimes, sceneAtTime, audioCues,
  ambienceTimeline, validateScenes, sceneOpacityAt, visibleSceneIndices,
} from '../../timeline.js';

test('scenes 多元: valid (id unik, durasi>0, terjemahan setelah teks Jepang)', () => {
  assert.deepEqual(validateScenes(ANIME_SCENES), []);
});

test('scenes 多元: 5 babak sesuai PRD §10 (tear→burst→montage→worlds→finale)', () => {
  assert.deepEqual(ANIME_SCENES.map((s) => s.id), ['tear', 'burst', 'montage', 'worlds', 'finale']);
});

test('scenes 多元: total durasi 60–90 detik (spesifikasi cinematic)', () => {
  const d = totalDuration(ANIME_SCENES);
  assert.ok(d >= 60 && d <= 90, `durasi ${d}s di luar 60–90s`);
});

test('scenes 多元: babak 1 (tear) sengaja TANPA teks (murni visual)', () => {
  assert.equal(ANIME_SCENES[0].lines.length, 0);
});

test('scenes 多元: teks Jepang sesuai spec (頁の向こう, 世界, 物語, どの世界, 多元, ようこそ)', () => {
  const flat = ANIME_SCENES.flatMap((s) => s.lines.map((l) => l.jp));
  for (const jp of ['頁の向こうに、世界がある。', 'ここは時代じゃない。世界だ。', 'いくつもの物語が、待っている。', 'どの世界へ、行く？', '世界が、増えていく。', '多元 — 世界が増える', 'ようこそ、多元へ。']) {
    assert.ok(flat.includes(jp), `teks hilang: ${jp}`);
  }
});

test('scenes 多元: tiap terjemahan menyusul teks Jepangnya', () => {
  for (const s of ANIME_SCENES) {
    for (const l of s.lines) {
      if (l.translationAt != null) {
        assert.ok(l.translationAt > l.at, `${s.id}/${l.id}: terjemahan harus menyusul`);
        assert.ok(l.translation != null, `${s.id}/${l.id}: ada translationAt tapi translation kosong`);
      }
    }
  }
});

test('scenes 多元: start time kumulatif & monoton', () => {
  const starts = sceneStartTimes(ANIME_SCENES);
  assert.equal(starts[0], 0);
  for (let i = 1; i < starts.length; i += 1) assert.ok(starts[i] > starts[i - 1]);
});

test('scenes 多元: sceneAtTime menjepit di luar rentang', () => {
  assert.equal(sceneAtTime(ANIME_SCENES, -5), 0);
  assert.equal(sceneAtTime(ANIME_SCENES, 999), ANIME_SCENES.length - 1);
});

test('scenes 多元: audioCues punya beberapa SFX per scene, terurut', () => {
  const cues = audioCues(ANIME_SCENES);
  assert.ok(cues.length >= ANIME_SCENES.length * 3, 'harus ada beberapa SFX per scene');
  for (let i = 1; i < cues.length; i += 1) assert.ok(cues[i].at >= cues[i - 1].at, 'cue harus terurut');
  // SFX khas 多元 (baru di mesin audio).
  assert.ok(cues.some((c) => c.sfx === 'pageTear'), 'ada sobekan kertas 紙を破る');
  assert.ok(cues.some((c) => c.sfx === 'popChord'), 'ada city-pop');
  assert.ok(cues.some((c) => c.sfx === 'doki'), 'ada ドキドキ');
  assert.ok(cues.some((c) => c.sfx === 'portal'), 'ada portal 異世界');
  assert.ok(cues.some((c) => c.sfx === 'fanfarePop'), 'ada fanfare penutup');
});

test('scenes 多元: mood per scene (burst/adventure/youth/horror/finale)', () => {
  const tl = ambienceTimeline(ANIME_SCENES);
  assert.deepEqual(tl.map((x) => x.mood), ['burst', 'adventure', 'youth', 'horror', 'finale']);
});

test('voiceCues 多元: satu per BARIS ber-voice (7), terurut, waktu = at baris', () => {
  const vc = voiceCues();
  // 7 klip narasi Saku (babak 1 tear sengaja tanpa teks → tanpa voice).
  assert.equal(vc.length, 7, `harus 7 voice cue, dapat ${vc.length}`);
  for (let i = 1; i < vc.length; i += 1) assert.ok(vc[i].at >= vc[i - 1].at, 'voice cue harus terurut');
  for (const v of vc) { assert.ok(v.path, `${v.id} tanpa path`); assert.ok(v.at >= 0); }
  // Waktu absolut = start scene + at baris (sesuai PRD §10).
  const byId = Object.fromEntries(vc.map((v) => [v.id, v]));
  assert.equal(byId['voice:burst:world'].at, 9.6);
  assert.equal(byId['voice:burst:turn'].at, 12.4);
  assert.equal(byId['voice:montage:stories'].at, 23.0);
  assert.equal(byId['voice:worlds:choose'].at, 38.8);
  assert.equal(byId['voice:finale:grow'].at, 54.6);
  assert.equal(byId['voice:finale:era'].at, 58.6);
  assert.equal(byId['voice:finale:welcome'].at, 61.4);
});

test('voiceCues 多元: file voice menunjuk /voices/anime/ (T12 belum digenerate)', () => {
  // T12 (generate mp3 + split) = tugas TERAKHIR; PRD §14 R7 bilang tema tetap
  // jalan tanpa voice. Jadi di sini kita HANYA cek path menunjuk folder yang
  // benar — BUKAN keberadaan file.
  for (const v of voiceCues()) {
    assert.ok(v.path.startsWith('/voices/anime/'), `path tidak di /voices/anime/: ${v.path}`);
    assert.ok(v.path.endsWith('.mp3'), `path bukan mp3: ${v.path}`);
  }
});

test('scenes 多元: cross-fade di-center (bukan cut keras)', () => {
  const starts = sceneStartTimes(ANIME_SCENES);
  assert.equal(sceneOpacityAt(ANIME_SCENES, 0, 3), 1);
  const mid = starts[1];
  assert.ok(Math.abs(sceneOpacityAt(ANIME_SCENES, 0, mid, XFADE) - 0.5) < 0.05);
  assert.ok(Math.abs(sceneOpacityAt(ANIME_SCENES, 1, mid, XFADE) - 0.5) < 0.05);
});

test('scenes 多元: visibleSceneIndices hanya scene sekitar jam', () => {
  assert.deepEqual(visibleSceneIndices(ANIME_SCENES, 3, XFADE, MOUNT_PAD), [0]);
  const vis = visibleSceneIndices(ANIME_SCENES, sceneStartTimes(ANIME_SCENES)[1], XFADE, MOUNT_PAD);
  assert.ok(vis.includes(0) && vis.includes(1));
});
