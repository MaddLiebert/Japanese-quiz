import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  YUJI_GIFS, pickYujiGif, yujiGifForAnswer, yujiTakeoverGif,
  YUJI_GIF_MS, YUJI_CLIP_MS, yujiGifHoldMs, yujiAnswerHoldMs,
  yujiGifPaths, preloadYujiGifs,
} from './yujiGifs.js';

test('YUJI_GIFS: 6 kind sesuai aset (wrong 3 meme, sisanya 1)', () => {
  assert.equal(YUJI_GIFS.keiteiken.length, 1);
  assert.equal(YUJI_GIFS.kokusen.length, 1);
  assert.equal(YUJI_GIFS.fuga.length, 1);
  assert.equal(YUJI_GIFS.takeover.length, 1);
  assert.equal(YUJI_GIFS.wrong.length, 3);
  assert.equal(YUJI_GIFS.zakome.length, 1);
});

test('semua path unik & menunjuk ke /effects/*.gif', () => {
  const all = yujiGifPaths();
  assert.equal(all.length, 8);
  assert.equal(new Set(all).size, 8);
  for (const p of all) assert.match(p, /^\/effects\/.+\.gif$/);
});

test('semua GIF ada di disk (public/effects)', () => {
  for (const p of yujiGifPaths()) assert.ok(existsSync('public' + p), `GIF hilang: ${p}`);
});

test('pickYujiGif deterministik & null untuk kind lain', () => {
  assert.equal(pickYujiGif('kokusen', () => 0), '/effects/kokusen.gif');
  assert.equal(pickYujiGif('wrong', () => 0), '/effects/yuji kuso.gif');
  assert.equal(pickYujiGif('wrong', () => 0.99), '/effects/yuji shimata.gif');
  assert.equal(pickYujiGif('senketsu'), null);
});

test('yujiGifForAnswer: salah -> 3 meme; salah pas takeover -> zakome', () => {
  assert.equal(yujiGifForAnswer('wrong', null, false, 0, () => 0), '/effects/yuji kuso.gif');
  assert.equal(yujiGifForAnswer('wrong', null, true, 2, () => 0), '/effects/zakome.gif');
});

test('yujiGifForAnswer: keiteiken/manjigeri -> keiteiken.gif; kokusen; fuga combo 3', () => {
  assert.equal(yujiGifForAnswer('correct', 'keiteiken', false, 0, () => 0), '/effects/keiteiken.gif');
  assert.equal(yujiGifForAnswer('correct', 'manjigeri', false, 0, () => 0), '/effects/keiteiken.gif');
  assert.equal(yujiGifForAnswer('correct', 'kokusen', false, 0, () => 0), '/effects/kokusen.gif');
  assert.equal(yujiGifForAnswer('correct', 'fuga', true, 3, () => 0), '/effects/fuga.gif');
});

test('yujiGifForAnswer: senketsu & teknik tak dikenal -> null (CSS yang bicara)', () => {
  assert.equal(yujiGifForAnswer('correct', 'senketsu', false, 0, () => 0), null);
  assert.equal(yujiGifForAnswer('correct', null, false, 0, () => 0), null);
});

test('yujiTakeoverGif: GIF sukuna transform', () => {
  assert.equal(yujiTakeoverGif(), '/effects/sukuna transform.gif');
});

test('YUJI_GIF_MS & YUJI_CLIP_MS = hasil ukur (JANGAN ditebak)', () => {
  assert.equal(YUJI_GIF_MS['/effects/keiteiken.gif'], 1000);
  assert.equal(YUJI_GIF_MS['/effects/yuji shimata.gif'], 5070);
  assert.equal(YUJI_GIF_MS['/effects/sukuna transform.gif'], 2300);
  assert.equal(YUJI_GIF_MS['/effects/zakome.gif'], 720);
  assert.equal(YUJI_CLIP_MS.fuga, 1488);
  assert.equal(YUJI_CLIP_MS.kai, 705);
  assert.equal(YUJI_CLIP_MS.keiteiken, 1306);
});

test('yujiGifHoldMs: min 1 putaran GIF, clamp 8s', () => {
  assert.equal(yujiGifHoldMs('/effects/yuji kuso.gif', 2200), 4100);
  assert.equal(yujiGifHoldMs('/effects/keiteiken.gif', 2200), 2200);
  assert.equal(yujiGifHoldMs(null, 2200), 2200);
  assert.equal(yujiGifHoldMs('/effects/zzz.gif', 1800), 1800);
  assert.equal(yujiGifHoldMs('/effects/yuji shimata.gif', 99999), 8000);
});

test('yujiAnswerHoldMs: efek hidup >= klip suara + 400ms (pelajaran Gojo)', () => {
  assert.ok(yujiAnswerHoldMs('fuga', '/effects/fuga.gif', 1488) >= 1488 + 400);
  assert.equal(yujiAnswerHoldMs('fuga', '/effects/fuga.gif', 1488), 3900);   // GIF 3.9s menang
  assert.equal(yujiAnswerHoldMs('senketsu', null, 1384), 1784);             // tanpa GIF -> klip+400
  assert.equal(yujiAnswerHoldMs('keiteiken', '/effects/keiteiken.gif', 0), 1706);  // fallback terukur
  assert.equal(yujiAnswerHoldMs('kokusen', '/effects/kokusen.gif', 0), 3600);
});

test('preloadYujiGifs: menyentuh semua path lewat loader (injectable)', () => {
  const seen = [];
  const loader = () => ({ set src(v) { seen.push(v); }, decode: () => Promise.resolve(), decoding: 'auto' });
  const n = preloadYujiGifs(loader);
  assert.equal(n, 8);
  assert.deepEqual(seen.sort(), yujiGifPaths().sort());
});
