import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GOJO_GIFS, pickGojoGif, gojoGifForAnswer,
  gojoGifPaths, preloadGojoGifs, gojoCastGif,
  GOJO_GIF_MS, gojoGifHoldMs,
} from './gojoGifs.js';

test('GOJO_GIFS: murasaki 1, ryoiki 1, wrong 2 (aset user di public/effects)', () => {
  assert.equal(GOJO_GIFS.murasaki.length, 1);
  assert.equal(GOJO_GIFS.ryoiki.length, 1);
  assert.equal(GOJO_GIFS.wrong.length, 2);
});

test('semua path unik & menunjuk ke /effects/*.gif', () => {
  const all = [...GOJO_GIFS.murasaki, ...GOJO_GIFS.ryoiki, ...GOJO_GIFS.wrong];
  assert.equal(new Set(all).size, 4, 'tidak boleh duplikat');
  for (const p of all) assert.match(p, /^\/effects\/.+\.gif$/);
});

test('pickGojoGif deterministik & null untuk kind lain', () => {
  assert.equal(pickGojoGif('murasaki', () => 0), '/effects/murasaki.gif');
  assert.equal(pickGojoGif('ryoiki', () => 0), '/effects/ryoiki tenkai.gif');
  assert.equal(pickGojoGif('wrong', () => 0), '/effects/Gojo kalah gif.gif');
  assert.equal(pickGojoGif('wrong', () => 0.99), '/effects/gojo kalah gif 2.gif');
  assert.equal(pickGojoGif('ao'), null);
});

test('gojoGifForAnswer: salah → kalah; murasaki → murasaki; ao/aka → null', () => {
  assert.equal(gojoGifForAnswer('wrong', null, () => 0), '/effects/Gojo kalah gif.gif');
  assert.equal(gojoGifForAnswer('correct', 'murasaki', () => 0), '/effects/murasaki.gif');
  // ao/aka: visualnya sudah bola plasma di pinggir — tanpa GIF.
  assert.equal(gojoGifForAnswer('correct', 'ao', () => 0), null);
  assert.equal(gojoGifForAnswer('correct', 'aka', () => 0), null);
  assert.equal(gojoGifForAnswer('correct', null, () => 0), null);
});

test('gojoCastGif: GIF ryoiki tenkai untuk cinematic cast', () => {
  assert.equal(gojoCastGif(), '/effects/ryoiki tenkai.gif');
});

test('gojoGifPaths: 4 path unik (semua GIF untuk preload)', () => {
  const paths = gojoGifPaths();
  assert.equal(paths.length, 4);
  assert.equal(new Set(paths).size, 4);
});

test('GOJO_GIF_MS: durasi putaran GIF terukur (ms)', () => {
  assert.equal(GOJO_GIF_MS['/effects/murasaki.gif'], 1000);
  assert.equal(GOJO_GIF_MS['/effects/Gojo kalah gif.gif'], 1400);
  assert.equal(GOJO_GIF_MS['/effects/gojo kalah gif 2.gif'], 3500);
  assert.equal(GOJO_GIF_MS['/effects/ryoiki tenkai.gif'], 6800);
});

test('gojoGifHoldMs: hold minimal 1 putaran GIF (tak kepotong di tengah)', () => {
  // GIF panjang (3.5s) → hold naik dari 2.2s ke 3.5s
  assert.equal(gojoGifHoldMs('/effects/gojo kalah gif 2.gif', 2200), 3500);
  // GIF pendek (1s) → hold dasar menang
  assert.equal(gojoGifHoldMs('/effects/murasaki.gif', 2200), 2200);
  // tanpa GIF / src aneh → hold dasar apa adanya
  assert.equal(gojoGifHoldMs(null, 2200), 2200);
  assert.equal(gojoGifHoldMs('/effects/zzz.gif', 1800), 1800);
  // clamp: tidak pernah > 8s (GIF panjang maupun hold dasar besar)
  assert.equal(gojoGifHoldMs('/effects/ryoiki tenkai.gif', 100), 6800);
  assert.equal(gojoGifHoldMs('/effects/ryoiki tenkai.gif', 9000), 8000, 'hold dasar besar di-clamp 8s');
});

test('preloadGojoGifs: menyentuh semua path lewat loader (injectable)', () => {
  const seen = [];
  const loader = () => ({ set src(v) { seen.push(v); }, decode: () => Promise.resolve(), decoding: 'auto' });
  const n = preloadGojoGifs(loader);
  assert.equal(n, 4);
  assert.equal(seen.length, 4);
  assert.deepEqual(seen.sort(), gojoGifPaths().sort());
});
