import test from 'node:test';
import assert from 'node:assert/strict';
import { pickFootprint, markSeen, companionStats } from './footprints.js';

test('pickFootprint: lastHour 2 → rule lateNight', () => {
  const fp = pickFootprint({ lastHour: 2 });
  assert.equal(fp.id, 'lateNight');
});

test('pickFootprint: aturan yang sudah tampil dilewati', () => {
  const fp = pickFootprint({ lastHour: 2 }, ['lateNight']);
  assert.notEqual(fp?.id, 'lateNight');
});

test('pickFootprint: streak ≥30 → rule streak', () => {
  const fp = pickFootprint({ lastHour: 12, streak: 30, gapDays: 0 });
  assert.equal(fp.id, 'streak');
});

test('pickFootprint: gapDays ≥3 → comeback', () => {
  const fp = pickFootprint({ lastHour: 12, gapDays: 4 });
  assert.equal(fp.id, 'comeback');
});

test('pickFootprint: tidak ada yang cocok → null', () => {
  assert.equal(pickFootprint({ lastHour: 12, streak: 1, gapDays: 0 }), null);
});

test('pickFootprint: stats aneh → tidak crash', () => {
  assert.equal(pickFootprint({ lastHour: 'x', streak: null, gapDays: undefined }), null);
});

test('markSeen: menambah id (idempoten)', () => {
  assert.deepEqual(markSeen([], 'lateNight'), ['lateNight']);
  assert.deepEqual(markSeen(['lateNight'], 'lateNight'), ['lateNight']);
});

test('companionStats: hitung gapDays dari lastActiveDate nyata', () => {
  const s = companionStats(
    { streak: 12, daysActive: 47, lastActiveDate: '2026-10-01' },
    { hour: 2, todayStr: '2026-10-05' },
  );
  assert.equal(s.lastHour, 2);
  assert.equal(s.gapDays, 4);
  assert.equal(s.streak, 12);
});

test('companionStats: tanpa lastActiveDate → gapDays 0', () => {
  const s = companionStats({ streak: 3 }, { hour: 12, todayStr: '2026-10-05' });
  assert.equal(s.gapDays, 0);
  assert.equal(s.lastHour, 12);
});

test('companionStats → pickFootprint: comeback saat gap ≥ 3', () => {
  const s = companionStats(
    { lastActiveDate: '2026-10-01' },
    { hour: 12, todayStr: '2026-10-05' },
  );
  assert.equal(pickFootprint(s).id, 'comeback');
});
