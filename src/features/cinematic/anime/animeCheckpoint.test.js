// animeCheckpoint.test.js — penjaga gerbang 最終回 多元. Lihat PRD docs/tema/anime.md §7.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANIME_CHECKPOINT_STOP, ANIME_CHECKPOINT_ROUTE, ANIME_CHECKPOINT_PASS,
  ANIME_CHECKPOINT_PASS_LKR, ANIME_CHECKPOINT_PASS_LISTENING, ANIME_CHECKPOINT_MIN_KANJI,
  ANIME_CHECKPOINT_END, ANIME_CHECKPOINT_CONTINUED,
  isAnimeCheckpointUnlocked, gradeAnimeCheckpoint, validateAnimeCheckpoint,
} from './animeCheckpoint.js';

test('validateAnimeCheckpoint: bersih', () => {
  assert.deepEqual(validateAnimeCheckpoint(), []);
});

test('checkpoint = 最終回, route ke ujian N5', () => {
  assert.equal(ANIME_CHECKPOINT_STOP.id, 'saishukai');
  assert.equal(ANIME_CHECKPOINT_STOP.feature, 'checkpoint');
  assert.equal(ANIME_CHECKPOINT_ROUTE, '/n5-exam');
});

test('ambang lulus = N5 resmi (total 80, LKR 38, listening 19)', () => {
  assert.equal(ANIME_CHECKPOINT_PASS, 80);
  assert.equal(ANIME_CHECKPOINT_PASS_LKR, 38);
  assert.equal(ANIME_CHECKPOINT_PASS_LISTENING, 19);
  assert.equal(ANIME_CHECKPOINT_MIN_KANJI, 30);
});

test('gerbang buka mengikuti aturan N5 (rank Shogun + ≥30 kanji)', () => {
  assert.equal(isAnimeCheckpointUnlocked('Shogun', 30), true);
  assert.equal(isAnimeCheckpointUnlocked('Shogun', 29), false);
  assert.equal(isAnimeCheckpointUnlocked('Kouhai', 30), false);
});

test('verdict lulus: nilai maksimum lulus, nilai rendah gagal', () => {
  const pass = gradeAnimeCheckpoint({ lkrRaw: 120, lkrTotal: 120, listeningRaw: 60, listeningTotal: 60 });
  assert.equal(pass.passed, true);
  const fail = gradeAnimeCheckpoint({ lkrRaw: 10, lkrTotal: 120, listeningRaw: 5, listeningTotal: 60 });
  assert.equal(fail.passed, false);
});

test('momen akhir: つづく → 完', () => {
  assert.equal(ANIME_CHECKPOINT_CONTINUED, 'つづく');
  assert.equal(ANIME_CHECKPOINT_END, '完');
});
