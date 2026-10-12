import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeBundles, mergeItemProgress, MERGE_VERSION } from './merge.js';

test('mergeBundles: remote lebih baru → menang; progress & badges dari remote', () => {
  const local = { updatedAt: 100, username: 'Lokal', progress: { xp: 10 }, itemProgress: {}, achievements: [], selectedBadges: ['a'] };
  const remote = { updatedAt: 200, username: 'Remote', progress: { xp: 99 }, itemProgress: {}, achievements: [], selectedBadges: ['b'] };
  const { winner, bundle } = mergeBundles(local, remote);
  assert.equal(winner, 'remote');
  assert.equal(bundle.progress.xp, 99);
  assert.equal(bundle.username, 'Remote');
  assert.deepEqual(bundle.selectedBadges, ['b']);
  assert.equal(bundle.updatedAt, 200);
});

test('mergeBundles: lokal lebih baru → menang; medaru boleh TURUN (snapshot utuh, bukan max)', () => {
  const local = { updatedAt: 300, username: 'Lokal', progress: { xp: 5, medaru: 0 }, itemProgress: [], achievements: [], selectedBadges: [] };
  const remote = { updatedAt: 100, username: 'Remote', progress: { xp: 500, medaru: 9999 }, itemProgress: {}, achievements: [], selectedBadges: [] };
  const { winner, bundle } = mergeBundles(local, remote);
  assert.equal(winner, 'local');
  // Walau remote XP/medaru lebih besar, snapshot lokal yang menang dipakai apa adanya.
  assert.equal(bundle.progress.xp, 5);
  assert.equal(bundle.progress.medaru, 0);
});

test('mergeBundles: seri → utamakan lokal, username fallback ke yang non-kosong', () => {
  const local = { updatedAt: 50, username: '', progress: { xp: 1 }, itemProgress: {}, achievements: [], selectedBadges: [] };
  const remote = { updatedAt: 50, username: 'Remote', progress: { xp: 2 }, itemProgress: {}, achievements: [], selectedBadges: [] };
  const { winner, bundle } = mergeBundles(local, remote);
  assert.equal(winner, 'equal');
  assert.equal(bundle.progress.xp, 1);       // seri → lokal
  assert.equal(bundle.username, 'Remote');   // tapi username diambil dari yang ada
});

test('mergeBundles: itemProgress & achievements digabung (union), bukan ditimpa', () => {
  const local = {
    updatedAt: 10, username: 'A',
    progress: { xp: 1 },
    itemProgress: { hira_a: { lastReviewed: '2026-01-01', correctCount: 1 } },
    achievements: ['novice'],
    selectedBadges: [],
  };
  const remote = {
    updatedAt: 20, username: 'A',
    progress: { xp: 2 },
    itemProgress: { kata_b: { lastReviewed: '2026-02-01', correctCount: 3 } },
    achievements: ['warrior'],
    selectedBadges: [],
  };
  const { bundle } = mergeBundles(local, remote);
  assert.deepEqual(Object.keys(bundle.itemProgress).sort(), ['hira_a', 'kata_b']);
  assert.deepEqual([...bundle.achievements].sort(), ['novice', 'warrior']);
  assert.equal(bundle.version, MERGE_VERSION);
});

test('mergeItemProgress: per-item ambil lastReviewed terbaru', () => {
  const a = { x: { lastReviewed: '2026-01-01', correctCount: 1 } };
  const b = { x: { lastReviewed: '2026-03-01', correctCount: 9 }, y: { ts: 5 } };
  const out = mergeItemProgress(a, b);
  assert.equal(out.x.correctCount, 9);       // versi lebih baru menang
  assert.equal(out.y.ts, 5);                  // kunci baru ikut masuk
});

test('mergeItemProgress: item lawan lebih tua → punya kita dipertahankan', () => {
  const mine = { x: { lastReviewed: '2026-05-01', correctCount: 7 } };
  const theirs = { x: { lastReviewed: '2026-01-01', correctCount: 1 } };
  assert.equal(mergeItemProgress(mine, theirs).x.correctCount, 7);
});

test('mergeBundles: input kosong/null tidak meledak', () => {
  const { winner, bundle } = mergeBundles(null, undefined);
  assert.equal(winner, 'equal');
  assert.deepEqual(bundle.progress, {});
  assert.deepEqual(bundle.itemProgress, {});
  assert.deepEqual(bundle.achievements, []);
});
