import test from 'node:test';
import assert from 'node:assert/strict';
import { HINA_GIFS, pickHinaGif, hinaGifForAnswer, hinaGifPaths, preloadHinaGifs } from './hinaGifs.js';

test('HINA_GIFS punya 4 correct & 4 wrong', () => {
  assert.equal(HINA_GIFS.correct.length, 4);
  assert.equal(HINA_GIFS.wrong.length, 4);
});

test('semua path unik & menunjuk ke /effects/HinaRight|Wrong', () => {
  const all = [...HINA_GIFS.correct, ...HINA_GIFS.wrong];
  assert.equal(new Set(all).size, 8, 'tidak boleh duplikat');
  for (const p of all) assert.match(p, /^\/effects\/Hina(?:Right|Wrong)[0-9]*\.webp$/);
});

test('pickHinaGif deterministik & null untuk kind lain', () => {
  assert.equal(pickHinaGif('correct', () => 0), '/effects/HinaRight.webp');
  assert.equal(pickHinaGif('wrong', () => 0.99), '/effects/HinaWrong3.webp');
  assert.equal(pickHinaGif('streak'), null);
});

test('hinaGifForAnswer: GIF mengikuti kapan Hina BUNYI', () => {
  // salah → Hina wrong bunyi → GIF wrong
  assert.equal(hinaGifForAnswer('wrong', false, () => 0), '/effects/HinaWrong.webp');
  // benar tepat milestone → Hina streak bunyi → GIF correct
  assert.equal(hinaGifForAnswer('correct', true, () => 0), '/effects/HinaRight.webp');
  // benar biasa → Hina DIAM → tanpa GIF
  assert.equal(hinaGifForAnswer('correct', false, () => 0), null);
});

test('hinaGifPaths: 8 path unik (semua GIF untuk preload)', () => {
  const paths = hinaGifPaths();
  assert.equal(paths.length, 8);
  assert.equal(new Set(paths).size, 8);
});

test('preloadHinaGifs: menyentuh semua path lewat loader (injectable)', () => {
  const seen = [];
  const loader = () => ({ set src(v) { seen.push(v); }, decode: () => Promise.resolve(), decoding: 'auto' });
  const n = preloadHinaGifs(loader);
  assert.equal(n, 8);
  assert.equal(seen.length, 8);
  assert.deepEqual(seen.sort(), hinaGifPaths().sort());
});
