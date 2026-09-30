import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  TOJI_GIFS, pickTojiGif, tojiGifForAnswer,
  TOJI_GIF_MS, TOJI_CLIP_MS, TOJI_WRONG_HOLD_MAX, tojiGifHoldMs, tojiGifPaths,
} from './tojiGifs.js';
import { VOICES } from '../audio/voices.js';

test('TOJI_GIFS: kategori wrong, 2 GIF, file ada di disk', () => {
  assert.deepEqual(Object.keys(TOJI_GIFS).sort(), ['wrong']);
  assert.equal(TOJI_GIFS.wrong.length, 2, 'salah = 2 GIF kalah');
  for (const list of Object.values(TOJI_GIFS)) {
    for (const p of list) assert.ok(existsSync('public' + p), `GIF hilang: ${p}`);
  }
});

test('pickTojiGif: deterministik dgn rng injectable, aman untuk kind tak dikenal', () => {
  assert.equal(pickTojiGif('wrong', () => 0), '/effects/toji_kalah_1.gif');
  assert.equal(pickTojiGif('wrong', () => 0.99), '/effects/toji_kalah_2.gif');
  assert.equal(pickTojiGif('zzz'), null);
  assert.equal(pickTojiGif(null), null);
});

test('tojiGifForAnswer: salah → GIF kalah acak · lain null (SVG/CSS murni)', () => {
  assert.ok(tojiGifForAnswer('wrong'));
  assert.equal(tojiGifForAnswer('correct', 'shakkontou'), null, '釈魂刀 = SVG murni');
  assert.equal(tojiGifForAnswer('correct', null), null);
});

test('TOJI_GIF_MS: durasi hasil ukur PIL 30/09 (bukan tebakan)', () => {
  assert.equal(TOJI_GIF_MS['/effects/toji_kalah_1.gif'], 4400);
  assert.equal(TOJI_GIF_MS['/effects/toji_kalah_2.gif'], 1800);
});

test('TOJI_CLIP_MS cocok dgn hasil ukur PyAV klip voice Toji', () => {
  assert.equal(TOJI_CLIP_MS.cast, 4540, 'cast full = 4,54s (sinkron cinematic)');
  assert.equal(TOJI_CLIP_MS.shakkontou, 2088);
  assert.equal(TOJI_CLIP_MS.wrong_1, 1120);
  assert.equal(TOJI_CLIP_MS.wrong_2, 3984);
  assert.equal(TOJI_CLIP_MS.wrong_3, 2976);
  // setiap klip jurus/kalah ada di VOICES.toji (clips + wrong)
  const known = new Set(
    [...VOICES.toji.clips, ...VOICES.toji.files.wrong]
      .map((p) => p.split('/').pop().replace('.mp3', '')),
  );
  for (const k of Object.keys(TOJI_CLIP_MS)) {
    if (k === 'cast') continue; // cast diputar playTojiCast (bukan bagian clips/wrong)
    assert.ok(known.has(k), `klip tak terdaftar: ${k}`);
  }
});

test('tojiGifHoldMs: max(hold, 1 putaran GIF), cap salah 4600ms (cover klip 3,98s)', () => {
  assert.equal(tojiGifHoldMs(null, 500), 500);
  assert.equal(tojiGifHoldMs('/effects/toji_kalah_2.gif', 300), 1800);
  assert.equal(tojiGifHoldMs('/effects/toji_kalah_1.gif', 300), 4400);
  // salah: klip wrong_2 3984+400 = 4384 → 4384 (di bawah cap 4600)
  assert.equal(tojiGifHoldMs('/effects/toji_kalah_2.gif', 4384, true), 4384);
  // cap: tidak pernah lebih dari 4600
  assert.equal(tojiGifHoldMs('/effects/toji_kalah_1.gif', 9000, true), 4600);
  assert.equal(TOJI_WRONG_HOLD_MAX, 4600);
});

test('tojiGifPaths: flat & unik', () => {
  const paths = tojiGifPaths();
  assert.equal(paths.length, 2);
  assert.equal(new Set(paths).size, 2);
  for (const p of paths) assert.ok(p.startsWith('/effects/toji_'));
});
