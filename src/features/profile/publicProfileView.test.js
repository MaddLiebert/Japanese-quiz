// publicProfileView.test.js — logika murni Profil LENGKAP 訪問.
// Membuktikan: peta status server → radar 8 subjek (lewat buildSubjectMastery
// yang sudah ada), normalisasi angka (tak pernah NaN), dan aturan sertifikat.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  statusMapToItemProgress, buildPublicMastery, fullStats,
  hasCertificate, publicBadgeList, hasFullProfile,
} from './publicProfileView.js';

test('statusMapToItemProgress: { id: status } → { id: { status } } (buang nilai kosong)', () => {
  const out = statusMapToItemProgress({ a: 'mastered', b: 'learning', c: '', d: null });
  assert.deepEqual(out, { a: { status: 'mastered' }, b: { status: 'learning' } });
  assert.deepEqual(statusMapToItemProgress(null), {});
  assert.deepEqual(statusMapToItemProgress('x'), {});
});

test('buildPublicMastery: radar 8 subjek dari status map + dataset', () => {
  const datasets = {
    hiragana: [{ id: 'h1' }, { id: 'h2' }],
    katakana: [], kanji: [], kotoba: [], grammar: [], mondai: [], poems: [], n5exam: [],
  };
  const radar = buildPublicMastery({ h1: 'mastered', h2: 'learning' }, datasets);
  assert.equal(radar.length, 8);
  const hira = radar.find((r) => r.subject === 'Hiragana');
  // (1.0 + 0.33) / 2 = 0.665 → 67%
  assert.equal(hira.score, 67);
  // subjek tanpa data → 0, bukan NaN
  assert.equal(radar.find((r) => r.subject === 'Kanji').score, 0);
});

test('fullStats: semua angka dinormalkan (absen/kotor → 0, bukan NaN)', () => {
  const s = fullStats({ winRate: '87.5', totalAnswered: 120, maxStreak: null, accuracy: undefined });
  assert.equal(s.winRate, 87.5);
  assert.equal(s.totalAnswered, 120);
  assert.equal(s.maxStreak, 0);
  assert.equal(s.accuracy, 0);
  assert.equal(fullStats(null).totalAnswered, 0);
  assert.ok(Number.isFinite(fullStats({}).winRate));
});

test('hasCertificate: hanya true bila n5Exam.passed', () => {
  assert.equal(hasCertificate({ n5Exam: { passed: true } }), true);
  assert.equal(hasCertificate({ n5Exam: { passed: false } }), false);
  assert.equal(hasCertificate({}), false);
  assert.equal(hasCertificate(null), false);
});

test('publicBadgeList: badge terpasang dulu, lalu cap terbuka, dibatasi limit', () => {
  const full = { achievements: ['a', 'b', 'c', 'd'], selectedBadges: ['c', 'a'] };
  assert.deepEqual(publicBadgeList(full), ['c', 'a', 'b', 'd']);
  assert.deepEqual(publicBadgeList(full, 2), ['c', 'a']);
  // selectedBadges berisi id yang belum terbuka → diabaikan (tak boleh tampil)
  assert.deepEqual(publicBadgeList({ achievements: ['a'], selectedBadges: ['zz'] }), ['a']);
  assert.deepEqual(publicBadgeList(null), []);
});

test('hasFullProfile: true hanya bila row.full_data objek', () => {
  assert.equal(hasFullProfile({ full_data: {} }), true);
  assert.equal(hasFullProfile({ full_data: null }), false);
  assert.equal(hasFullProfile({}), false);
  assert.equal(hasFullProfile(null), false);
});
