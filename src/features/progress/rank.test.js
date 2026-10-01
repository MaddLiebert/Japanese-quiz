import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RANKS, TOP_RANK, TOP_RANK_XP,
  getRankInfo, getRankName, isTopRank, getNextRank, rankProgress, rankLabel,
} from './rank.js';

test('RANKS: 4 pangkat, tier menaik, ambang XP naik, hanya 1 puncak', () => {
  assert.equal(RANKS.length, 4);
  assert.deepEqual(RANKS.map((r) => r.key), ['Kouhai', 'Senpai', 'Sensei', 'Shogun']);
  assert.deepEqual(RANKS.map((r) => r.tier), [0, 1, 2, 3]);
  for (let i = 1; i < RANKS.length; i++) {
    assert.ok(RANKS[i].minXp > RANKS[i - 1].minXp, 'ambang XP harus naik');
  }
  assert.equal(RANKS.filter((r) => r.top).length, 1);
  assert.equal(TOP_RANK.key, 'Shogun');
  assert.equal(TOP_RANK_XP, 20000);
});

test('setiap rank punya kanji + glyph + accent + tagline dua bahasa', () => {
  for (const r of RANKS) {
    assert.ok(r.kanji, `kanji kosong: ${r.key}`);
    assert.ok(r.glyph, `glyph kosong: ${r.key}`);
    assert.match(r.accent, /^#[0-9a-f]{6}$/i, `accent bukan hex: ${r.key}`);
    assert.ok(r.tagline && r.tagline_en, `tagline kurang: ${r.key}`);
  }
});

test('getRankInfo: batas ambang tepat (inklusif di minXp)', () => {
  assert.equal(getRankInfo(0).key, 'Kouhai');
  assert.equal(getRankInfo(4999).key, 'Kouhai');
  assert.equal(getRankInfo(5000).key, 'Senpai');
  assert.equal(getRankInfo(9999).key, 'Senpai');
  assert.equal(getRankInfo(10000).key, 'Sensei');
  assert.equal(getRankInfo(19999).key, 'Sensei');
  assert.equal(getRankInfo(20000).key, 'Shogun');
  assert.equal(getRankInfo(999999).key, 'Shogun');
});

test('getRankInfo: input aneh → rank dasar (tanpa throw)', () => {
  assert.equal(getRankInfo(undefined).key, 'Kouhai');
  assert.equal(getRankInfo(null).key, 'Kouhai');
  assert.equal(getRankInfo(-50).key, 'Kouhai');
  assert.equal(getRankInfo(NaN).key, 'Kouhai');
  assert.equal(getRankInfo('abc').key, 'Kouhai');
});

test('getRankName: STRING (kontrak gate startsWith)', () => {
  assert.equal(getRankName(0), 'Kouhai');
  assert.equal(getRankName(20000), 'Shogun');
  assert.ok(getRankName(20000).startsWith('Shogun'));
});

test('isTopRank: true hanya di ambang puncak ke atas', () => {
  assert.equal(isTopRank(0), false);
  assert.equal(isTopRank(19999), false);
  assert.equal(isTopRank(20000), true);
  assert.equal(isTopRank(50000), true);
  assert.equal(isTopRank(undefined), false);
});

test('getNextRank: rank berikutnya, null di puncak', () => {
  assert.equal(getNextRank(0).key, 'Senpai');
  assert.equal(getNextRank(5000).key, 'Sensei');
  assert.equal(getNextRank(10000).key, 'Shogun');
  assert.equal(getNextRank(20000), null);
});

test('rankProgress: pct menuju rank berikutnya, benar di tepi', () => {
  const p0 = rankProgress(0);
  assert.equal(p0.current.key, 'Kouhai');
  assert.equal(p0.next.key, 'Senpai');
  assert.equal(p0.pct, 0);
  assert.equal(p0.remaining, 5000);

  const pHalf = rankProgress(2500);   // separuh jalan Kouhai → Senpai
  assert.equal(pHalf.pct, 50);
  assert.equal(pHalf.remaining, 2500);

  const pEdge = rankProgress(4999);
  assert.equal(pEdge.pct, 100);
  assert.equal(pEdge.remaining, 1);

  const pNext = rankProgress(5000);   // baru naik → reset ke 0
  assert.equal(pNext.current.key, 'Senpai');
  assert.equal(pNext.pct, 0);
});

test('rankProgress: di puncak → isMax, pct 100, tanpa next', () => {
  const max = rankProgress(20000);
  assert.equal(max.isMax, true);
  assert.equal(max.next, null);
  assert.equal(max.pct, 100);
  assert.equal(max.remaining, 0);
});

test('rankLabel: "Rank 漢字"', () => {
  assert.equal(rankLabel(0), 'Kouhai 後輩');
  assert.equal(rankLabel(20000), 'Shogun 将軍');
});
