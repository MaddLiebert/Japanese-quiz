// animeStops.test.js — penjaga Peta 多元 (8 perhentian). Lihat PRD docs/tema/anime.md §7.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANIME_STOPS, ANIME_LAST_STOP, animeStopById, animeStopByFeature, validateAnimeStops,
} from './animeStops.js';

test('ada 8 perhentian (0..7)', () => {
  assert.equal(ANIME_STOPS.length, 8);
  assert.equal(ANIME_STOPS[0].id, 'kaimaku');
  assert.equal(ANIME_STOPS[7].id, 'saishukai');
});

test('validateAnimeStops: bersih', () => {
  assert.deepEqual(validateAnimeStops(), []);
});

test('tiap perhentian field lengkap + nomor berurutan', () => {
  ANIME_STOPS.forEach((s, i) => {
    assert.equal(s.n, i);
    for (const k of ['jp', 'romaji', 'theme', 'theme_id', 'lesson_jp', 'lesson_id', 'moment', 'moment_id', 'vibe', 'feature']) {
      assert.ok(s[k], `${s.id} tanpa ${k}`);
    }
  });
});

test('checkpoint = perhentian terakhir (最終回) & ditandai last', () => {
  assert.equal(ANIME_LAST_STOP.id, 'saishukai');
  assert.equal(ANIME_LAST_STOP.feature, 'checkpoint');
  assert.equal(ANIME_LAST_STOP.last, true);
});

test('lookup by id & feature', () => {
  assert.equal(animeStopById('maho')?.jp, '魔法');
  assert.equal(animeStopById('nope'), null);
  assert.equal(animeStopByFeature('checkpoint')?.id, 'saishukai');
  assert.equal(animeStopByFeature('nope'), null);
});

test('semua feature unik (tiap perhentian menaut ke fitur berbeda)', () => {
  const feats = ANIME_STOPS.map((s) => s.feature);
  assert.equal(new Set(feats).size, feats.length);
});

test('validateAnimeStops menangkap duplikat id', () => {
  const bad = ANIME_STOPS.map((s, i) => (i === 1 ? { ...s, id: 'kaimaku' } : s));
  assert.ok(validateAnimeStops(bad).some((e) => /duplikat/.test(e)));
});
