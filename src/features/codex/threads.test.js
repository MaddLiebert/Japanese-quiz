import test from 'node:test';
import assert from 'node:assert/strict';
import { THREADS, addNode, linkedNote, threadById, ANIME_THREADS } from './threads.js';

test('threadById: menemukan thread, null kalau tak ada', () => {
  assert.equal(threadById('light').label_jp, '灯り');
  assert.equal(threadById('nope'), null);
});

test('addNode: menambah node baru & menandai linked kalau sudah ada isi', () => {
  const { threads, linked, added } = addNode(THREADS, 'light', '石油灯 (meiji)');
  assert.equal(added, true);
  assert.equal(linked, true); // sudah ada node sebelumnya → つながり
  const t = threads.find((x) => x.id === 'light');
  assert.ok(t.chain.includes('石油灯 (meiji)'));
});

test('addNode: idempoten (node sama tidak ditambah 2×)', () => {
  const once = addNode(THREADS, 'road', '鉄道 (meiji)').threads;
  const twice = addNode(once, 'road', '鉄道 (meiji)');
  assert.equal(twice.added, false);
  const t = twice.threads.find((x) => x.id === 'road');
  assert.equal(t.chain.filter((c) => c === '鉄道 (meiji)').length, 1);
});

test('addNode: tidak memutasi tabel asli', () => {
  const before = THREADS.find((t) => t.id === 'money').chain.length;
  addNode(THREADS, 'money', '円 (showa)');
  assert.equal(THREADS.find((t) => t.id === 'money').chain.length, before);
});

test('addNode: thread tak dikenal → tidak crash, added false', () => {
  const res = addNode(THREADS, 'nope', 'x');
  assert.equal(res.added, false);
});

test('linkedNote: teks untuk thread valid; null kalau tak ada', () => {
  assert.match(linkedNote('light'), /つながり/);
  assert.equal(linkedNote('nope'), null);
});

// ── 多元 A13: node lanjutan + thread 英雄 ─────────────────────────────────────
test('threads 多元: chain lama lanjut ke node (anime)', () => {
  assert.equal(THREADS.find((t) => t.id === 'light').chain.at(-1), 'ネオン (anime)');
  assert.equal(THREADS.find((t) => t.id === 'money').chain.at(-1), 'コイン (anime)');
  assert.equal(THREADS.find((t) => t.id === 'road').chain.at(-1), 'ロケット (anime)');
  assert.equal(THREADS.find((t) => t.id === 'news').chain.at(-1), 'ネット (anime)');
});

test('ANIME_THREADS: thread 英雄 (samurai → tentara → ヒーロー)', () => {
  const hero = ANIME_THREADS.find((t) => t.id === 'hero');
  assert.equal(hero.label_jp, '英雄');
  assert.deepEqual(hero.chain, ['武士 (edo)', '軍人 (meiji)', 'ヒーロー (anime)']);
});

test('addNode: idempoten pada node 多元 yang sudah ada', () => {
  const res = addNode(THREADS, 'light', 'ネオン (anime)');
  assert.equal(res.added, false);
});
