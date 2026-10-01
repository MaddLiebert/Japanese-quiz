import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QUEST_DEFS, questDef, dateKey, emptyQuests, ensureToday,
  bumpEvent, questProgress, questBoard, canClaim, markClaimed, SIDE_SOURCES,
  WEEKLY_QUEST_DEFS, weeklyQuestDef, weekStart, weekKey, emptyWeekly,
  ensureWeek, weekBump, weekProgress, weekBoard, canClaimWeek, markWeekClaimed,
} from './quests.js';

test('dateKey: format lokal YYYY-MM-DD (bukan UTC)', () => {
  assert.equal(dateKey(new Date(2026, 9, 1)), '2026-10-01'); // bulan 0-index
  assert.equal(dateKey(new Date(2026, 0, 5)), '2026-01-05');
});

test('emptyQuests: counters nol semua + claimed kosong', () => {
  assert.deepEqual(emptyQuests('2026-10-01'), {
    date: '2026-10-01',
    counters: { correct: 0, session: 0, side: 0 },
    claimed: [],
  });
});

test('ensureToday: tanggal beda → reset penuh (harian)', () => {
  const stale = { date: '2026-09-30', counters: { correct: 99, session: 9, side: 3 }, claimed: ['rajin_menjawab'] };
  assert.deepEqual(ensureToday(stale, '2026-10-01'), emptyQuests('2026-10-01'));
});

test('ensureToday: tanggal sama → apa adanya; rusak/kosong → reset', () => {
  const ok = { date: '2026-10-01', counters: { correct: 5, session: 1, side: 0 }, claimed: ['x'] };
  assert.deepEqual(ensureToday(ok, '2026-10-01'), ok);
  assert.deepEqual(ensureToday(null, '2026-10-01'), emptyQuests('2026-10-01'));
  assert.deepEqual(ensureToday({}, '2026-10-01'), emptyQuests('2026-10-01'));
});

test('bumpEvent: naikkan counter yang tepat, immutable, kind tak dikenal diabaikan', () => {
  const q0 = emptyQuests('2026-10-01');
  const q1 = bumpEvent(q0, 'correct', '2026-10-01');
  assert.equal(q1.counters.correct, 1);
  assert.equal(q0.counters.correct, 0);            // tidak memutasi input
  assert.equal(bumpEvent(q1, 'session', '2026-10-01').counters.session, 1);
  assert.equal(bumpEvent(q1, 'nope', '2026-10-01').counters.correct, 1);
});

test('bumpEvent: ganti hari otomatis reset lalu naik', () => {
  const stale = { date: '2026-09-30', counters: { correct: 50, session: 0, side: 0 }, claimed: [] };
  assert.equal(bumpEvent(stale, 'correct', '2026-10-01').counters.correct, 1);
});

test('questProgress + canClaim: selesai tapi belum diklaim → boleh klaim', () => {
  const def = questDef('rajin_menjawab');
  let q = emptyQuests('2026-10-01');
  for (let i = 0; i < def.target; i++) q = bumpEvent(q, 'correct', '2026-10-01');
  const p = questProgress(q, def, '2026-10-01');
  assert.equal(p.done, true);
  assert.equal(p.claimed, false);
  assert.equal(canClaim(q, 'rajin_menjawab', '2026-10-01'), true);
  // progress di-clamp ke target
  assert.equal(p.current, def.target);
});

test('markClaimed: sekali saja; id ganda diabaikan; sudah klaim → tak bisa klaim lagi', () => {
  let q = emptyQuests('2026-10-01');
  q = bumpEvent(bumpEvent(q, 'session', '2026-10-01'), 'session', '2026-10-01');
  const q1 = markClaimed(q, 'tuntas_sesi', '2026-10-01');
  const q2 = markClaimed(q1, 'tuntas_sesi', '2026-10-01');
  assert.deepEqual(q1.claimed, ['tuntas_sesi']);
  assert.deepEqual(q2.claimed, ['tuntas_sesi']);   // tidak dobel
  assert.equal(canClaim(q1, 'tuntas_sesi', '2026-10-01'), false);
});

test('questBoard: 3 misi, semua punya current/target/done/claimed + reward > 0', () => {
  const board = questBoard(emptyQuests('2026-10-01'), '2026-10-01');
  assert.equal(board.length, 3);
  for (const q of board) {
    assert.equal(typeof q.done, 'boolean');
    assert.ok(q.target > 0 && q.xp > 0 && q.medaru > 0);
  }
});

test('SIDE_SOURCES + defs: konsisten (event misi ada di counters)', () => {
  assert.deepEqual(SIDE_SOURCES, ['writing', 'speaking', 'review', 'poem']);
  for (const d of QUEST_DEFS) {
    assert.ok(['correct', 'session', 'side'].includes(d.event), d.id);
  }
});

// ── Tier MINGGUAN 週課 ───────────────────────────────────────────────────────

test('weekStart: kembali ke Senin minggu berjalan', () => {
  // 2026-10-01 = Kamis → Senin 2026-09-28
  assert.equal(weekKey(new Date(2026, 9, 1)), '2026-09-28');
  // 2026-10-04 = Minggu → Senin 2026-09-28 (minggu yang sama)
  assert.equal(weekKey(new Date(2026, 9, 4)), '2026-09-28');
  // 2026-10-05 = Senin → minggu baru
  assert.equal(weekKey(new Date(2026, 9, 5)), '2026-10-05');
});

test('weekStart: Senin tetap Senin (no shift)', () => {
  assert.equal(weekKey(new Date(2026, 8, 28)), '2026-09-28'); // 28 Sep = Senin
});

test('ensureWeek: minggu beda → reset; sama → apa adanya; rusak → reset', () => {
  const stale = { week: '2026-09-21', counters: { correct: 50, session: 5 }, claimed: ['mingguan_tekun'] };
  assert.deepEqual(ensureWeek(stale, '2026-09-28'), emptyWeekly('2026-09-28'));
  const ok = { week: '2026-09-28', counters: { correct: 30, session: 2 }, claimed: ['x'] };
  assert.deepEqual(ensureWeek(ok, '2026-09-28'), ok);
  assert.deepEqual(ensureWeek(null, '2026-09-28'), emptyWeekly('2026-09-28'));
});

test('weekBump: naikkan counter, immutable, kind asing diabaikan, ganti minggu reset', () => {
  const w0 = emptyWeekly('2026-09-28');
  const w1 = weekBump(w0, 'correct', '2026-09-28');
  assert.equal(w1.counters.correct, 1);
  assert.equal(w0.counters.correct, 0);
  assert.equal(weekBump(w1, 'nope', '2026-09-28').counters.correct, 1);
  const stale = { week: '2026-09-21', counters: { correct: 99, session: 9 }, claimed: [] };
  assert.equal(weekBump(stale, 'correct', '2026-09-28').counters.correct, 1);
});

test('weekProgress + canClaimWeek: selesai tapi belum klaim → boleh klaim (clamp target)', () => {
  const def = weeklyQuestDef('mingguan_tekun');
  let w = emptyWeekly('2026-09-28');
  for (let i = 0; i < def.target + 5; i++) w = weekBump(w, 'correct', '2026-09-28');
  const p = weekProgress(w, def, '2026-09-28');
  assert.equal(p.done, true);
  assert.equal(p.current, def.target);   // clamp
  assert.equal(canClaimWeek(w, 'mingguan_tekun', '2026-09-28'), true);
});

test('markWeekClaimed: sekali saja; id ganda diabaikan', () => {
  let w = emptyWeekly('2026-09-28');
  for (let i = 0; i < 10; i++) w = weekBump(w, 'session', '2026-09-28');
  const w1 = markWeekClaimed(w, 'mingguan_konsisten', '2026-09-28');
  const w2 = markWeekClaimed(w1, 'mingguan_konsisten', '2026-09-28');
  assert.deepEqual(w1.claimed, ['mingguan_konsisten']);
  assert.deepEqual(w2.claimed, ['mingguan_konsisten']);
  assert.equal(canClaimWeek(w1, 'mingguan_konsisten', '2026-09-28'), false);
});

test('weekBoard: 2 misi mingguan, semua punya current/target/done/claimed + reward > 0', () => {
  const board = weekBoard(emptyWeekly('2026-09-28'), '2026-09-28');
  assert.equal(board.length, 2);
  assert.equal(WEEKLY_QUEST_DEFS.length, 2);
  for (const q of board) {
    assert.equal(typeof q.done, 'boolean');
    assert.ok(q.target > 0 && q.xp > 0 && q.medaru > 0);
  }
});
