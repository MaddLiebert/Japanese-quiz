import test from 'node:test';
import assert from 'node:assert/strict';
import { THREADS, addNode, linkedNote, threadById } from './threads.js';

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
