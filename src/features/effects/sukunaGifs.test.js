import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  SUKUNA_GIFS, pickSukunaGif, sukunaGifForAnswer,
  SUKUNA_GIF_MS, SUKUNA_CLIP_MS, sukunaGifHoldMs, sukunaAnswerHoldMs,
  sukunaGifPaths, preloadSukunaGifs,
} from './sukunaGifs.js';

test('SUKUNA_GIFS: 3 kind sesuai aset user (ryoiki / mahoraga / kalah)', () => {
  assert.equal(SUKUNA_GIFS.ryoiki.length, 1);
  assert.equal(SUKUNA_GIFS.mahoraga.length, 1);
  assert.equal(SUKUNA_GIFS.wrong.length, 1);
});

test('semua path unik & menunjuk ke /effects/*.gif', () => {
  const all = sukunaGifPaths();
  assert.equal(all.length, 3);
  assert.equal(new Set(all).size, 3);
  for (const p of all) assert.match(p, /^\/effects\/.+\.gif$/);
});

test('semua GIF ada di disk (public/effects)', () => {
  for (const p of sukunaGifPaths()) assert.ok(existsSync('public' + p), `GIF hilang: ${p}`);
});

test('pickSukunaGif deterministik & null untuk kind lain', () => {
  assert.equal(pickSukunaGif('wrong', () => 0), '/effects/sukuna kalah.gif');
  assert.equal(pickSukunaGif('ryoiki', () => 0), '/effects/ryoiki.gif');
  assert.equal(pickSukunaGif('mahoraga', () => 0), '/effects/mahoraga.gif');
  assert.equal(pickSukunaGif('kumo_no_ito'), null);
});

test('sukunaGifForAnswer: salah → kalah; furube → mahoraga; lain null', () => {
  assert.equal(sukunaGifForAnswer('wrong'), '/effects/sukuna kalah.gif');
  assert.equal(sukunaGifForAnswer('correct', 'furube'), '/effects/mahoraga.gif');
  assert.equal(sukunaGifForAnswer('correct', 'kumo_no_ito'), null);
  assert.equal(sukunaGifForAnswer('correct', 'nue'), null);
  assert.equal(sukunaGifForAnswer('correct', 'ryuurin'), null);
  assert.equal(sukunaGifForAnswer('correct', 'sekai_zangeki'), null);
});

test('durasi GIF terukur & semua klip Sukuna punya fallback ms', () => {
  assert.deepEqual(SUKUNA_GIF_MS, {
    '/effects/ryoiki.gif': 1400,
    '/effects/mahoraga.gif': 2300,
    '/effects/sukuna kalah.gif': 1800,
  });
  for (const k of ['kumo_no_ito', 'nue', 'furube', 'ryuurin', 'sekai_zangeki', 'ryouiki_tenkai', 'gambare', 'bakana']) {
    assert.ok(Number.isFinite(SUKUNA_CLIP_MS[k]) && SUKUNA_CLIP_MS[k] > 0, k);
  }
});

test('sukunaGifHoldMs: max(base, 1 putaran GIF) & clamp 8s', () => {
  assert.equal(sukunaGifHoldMs('/effects/ryoiki.gif', 0), 1400);
  assert.equal(sukunaGifHoldMs('/effects/ryoiki.gif', 2000), 2000);
  assert.equal(sukunaGifHoldMs('/effects/mahoraga.gif', 0), 2300);
  assert.equal(sukunaGifHoldMs(null, 0), 0);
  assert.equal(sukunaGifHoldMs('/effects/ryoiki.gif', 99999), 8000);
});

test('sukunaAnswerHoldMs: klip suara menang (klip + 400ms), fallback ke tabel', () => {
  // furube 1920ms terukur → 2320 (GIF 2300 kalah) — efek tidak selesai sebelum suara
  assert.equal(sukunaAnswerHoldMs('furube', '/effects/mahoraga.gif'), 2320);
  // clipMs asli dari elemen <audio> menang
  assert.equal(sukunaAnswerHoldMs('kumo_no_ito', null, 5000), 5400);
  // tanpa klip & tanpa gif → base saja
  assert.equal(sukunaAnswerHoldMs('zzz', null, 0, 700), 700);
});

test('preloadSukunaGifs: pakai loader injectable, sekali per sesi', () => {
  const made = [];
  const n = preloadSukunaGifs(() => { const o = { src: '', decode: () => Promise.resolve() }; made.push(o); return o; });
  assert.equal(n, 3);
  assert.equal(made.length, 3);
  for (const p of sukunaGifPaths()) assert.ok(made.some((m) => m.src === p), p);
});
