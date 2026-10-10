// episode.test.js — penjaga modul murni A11 デイリー (features/quests/episode.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A11. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EPISODE_TITLES, episodeNumber, episodeTitle, dailyEpisode } from './episode.js';

test('episodeNumber: dayIndex 0 → 1, 2 → 3 (minimal 1)', () => {
  assert.equal(episodeNumber(0), 1);
  assert.equal(episodeNumber(2), 3);
  assert.equal(episodeNumber(-5), 1);
  assert.equal(episodeNumber('x'), 1);
});

test('episodeTitle: bersiklus', () => {
  assert.equal(episodeTitle(0), EPISODE_TITLES[0]);
  assert.equal(episodeTitle(8), EPISODE_TITLES[0]);           // 8 % 8 = 0
  assert.equal(episodeTitle(9), EPISODE_TITLES[1]);
  assert.ok(EPISODE_TITLES.includes(episodeTitle(3)));
});

test('episodeTitle: indeks negatif aman (tidak undefined)', () => {
  assert.equal(episodeTitle(-1), EPISODE_TITLES[EPISODE_TITLES.length - 1]);
});

test('dailyEpisode: { n, title }', () => {
  const e = dailyEpisode(2);
  assert.equal(e.n, 3);
  assert.equal(e.title, EPISODE_TITLES[2]);
});

test('EPISODE_TITLES: 8 judul, unik', () => {
  assert.equal(EPISODE_TITLES.length, 8);
  assert.equal(new Set(EPISODE_TITLES).size, 8);
});
