import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  MEGUMI_GIFS, pickMegumiGif, megumiGifForAnswer,
  MEGUMI_GIF_MS, MEGUMI_CLIP_MS, megumiGifHoldMs, megumiAnswerHoldMs,
  megumiGifPaths, preloadMegumiGifs,
} from './megumiGifs.js';
import { VOICES } from '../audio/voices.js';

test('MEGUMI_GIFS: 3 kategori, file ada di disk', () => {
  assert.deepEqual(Object.keys(MEGUMI_GIFS).sort(), ['bansou', 'mahoraga', 'wrong']);
  assert.equal(MEGUMI_GIFS.wrong.length, 3, 'salah = 3 GIF kalah');
  for (const list of Object.values(MEGUMI_GIFS)) {
    for (const p of list) assert.ok(existsSync('public' + p), `GIF hilang: ${p}`);
  }
});

test('pickMegumiGif: deterministik dgn rng injectable, aman untuk kind tak dikenal', () => {
  assert.equal(pickMegumiGif('bansou', () => 0), '/effects/megumi_bansou.gif');
  assert.equal(pickMegumiGif('zzz'), null);
  assert.equal(pickMegumiGif(null), null);
  // rng 0.99 → elemen terakhir daftar wrong
  assert.equal(pickMegumiGif('wrong', () => 0.99), '/effects/megumi_tsugi_de_kimeru.gif');
});

test('megumiGifForAnswer: salah → GIF kalah · bansou → cut-in · lain null', () => {
  assert.ok(megumiGifForAnswer('wrong', null));
  assert.equal(megumiGifForAnswer('correct', 'bansou'), '/effects/megumi_bansou.gif');
  assert.equal(megumiGifForAnswer('correct', 'gyokuken'), null, '玉犬 = SVG murni');
  assert.equal(megumiGifForAnswer('correct', 'orochi'), null);
  assert.equal(megumiGifForAnswer('correct', 'kosou'), null);
  assert.equal(megumiGifForAnswer('correct', null), null);
});

test('MEGUMI_GIF_MS: durasi hasil ukur PIL 29/09 (bukan tebakan)', () => {
  assert.equal(MEGUMI_GIF_MS['/effects/megumi_bansou.gif'], 2000);
  assert.equal(MEGUMI_GIF_MS['/effects/megumi_mahoraga.gif'], 3900);
  assert.equal(MEGUMI_GIF_MS['/effects/megumi_chi.gif'], 1800);
  assert.equal(MEGUMI_GIF_MS['/effects/megumi_hazushita.webp'], 6940);
  assert.equal(MEGUMI_GIF_MS['/effects/megumi_tsugi_de_kimeru.gif'], 4000);
});

test('MEGUMI_CLIP_MS cocok dgn hasil ukur RMS klip voice Megumi', () => {
  assert.equal(MEGUMI_CLIP_MS.mahoraga, 4959, 'chant = 4.959s');
  assert.equal(MEGUMI_CLIP_MS.bansou, 1405);
  assert.equal(MEGUMI_CLIP_MS.kosou, 1057);
  assert.equal(MEGUMI_CLIP_MS.chi, 615);
  // setiap klip jurus/kalah ada di VOICES.megumi (klip + wrong)
  const known = new Set(
    [...VOICES.megumi.clips, ...VOICES.megumi.files.wrong]
      .map((p) => p.split('/').pop().replace('.mp3', '')),
  );
  for (const k of Object.keys(MEGUMI_CLIP_MS)) assert.ok(known.has(k), `klip tak terdaftar: ${k}`);
});

test('megumiGifHoldMs: max(hold, 1 putaran GIF), cap 8s; salah cap 2.6s', () => {
  assert.equal(megumiGifHoldMs(null, 500), 500);
  assert.equal(megumiGifHoldMs('/effects/megumi_bansou.gif', 300), 2000);
  assert.equal(megumiGifHoldMs('/effects/megumi_bansou.gif', 9000), 8000);
  // salah: hazushita 6940 → dipotong 2600
  assert.equal(megumiGifHoldMs('/effects/megumi_hazushita.webp', 0, true), 2600);
});

test('megumiAnswerHoldMs: klip suara menang (efek tak selesai sebelum suara)', () => {
  // bansou: klip 1405 + 400 = 1805 vs GIF 2000 → 2000
  assert.equal(megumiAnswerHoldMs('bansou', '/effects/megumi_bansou.gif', 0, 0), 2000);
  // tanpa GIF, klip 1057 + 400 = 1457
  assert.equal(megumiAnswerHoldMs('gyokuken', null, 0, 0), 1457);
  // clipMs live (dari audio element) menang atas tabel terukur
  assert.equal(megumiAnswerHoldMs('gyokuken', null, 3000, 0), 3400);
  // salah dibatasi 2600 walau klip 1602+400=2002 & GIF 6940
  assert.equal(megumiAnswerHoldMs('hazushita', '/effects/megumi_hazushita.webp', 0, 0, true), 2600);
});

test('megumiGifPaths & preloadMegumiGifs: 5 path unik, loader injectable', () => {
  const paths = megumiGifPaths();
  assert.equal(paths.length, 5);
  assert.equal(new Set(paths).size, 5, 'tidak ada duplikat');
  const made = [];
  const n = preloadMegumiGifs(() => { const o = { set src(v) { made.push(v); }, decoding: '', decode: () => Promise.resolve() }; return o; });
  assert.equal(n, 5);
  assert.equal(made.length, 5);
});
