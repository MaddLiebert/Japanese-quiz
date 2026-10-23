import test from 'node:test';
import assert from 'node:assert/strict';
import { bumpDaily, accuracySeries, DAILY_LOG_KEEP_DAYS } from './dailyLog.js';

test('bumpDaily: hitung a/c per tanggal, tanggal lain tidak tersentuh', () => {
  let log = bumpDaily(undefined, '2026-10-23', true);
  log = bumpDaily(log, '2026-10-23', false);
  log = bumpDaily(log, '2026-10-22', true);
  assert.deepEqual(log['2026-10-23'], { a: 2, c: 1 });
  assert.deepEqual(log['2026-10-22'], { a: 1, c: 1 });
});

test('bumpDaily: entri lebih tua dari KEEP hari dibuang', () => {
  let log = { '2026-01-01': { a: 5, c: 5 } };
  log = bumpDaily(log, '2026-10-23', true);
  assert.equal(log['2026-01-01'], undefined);
  assert.equal(Object.keys(log).length, 1);
  assert.equal(DAILY_LOG_KEEP_DAYS, 30);
});

test('accuracySeries: 7 hari urut lama→baru, hari kosong = null (bukan 0%)', () => {
  const log = { '2026-10-23': { a: 4, c: 3 }, '2026-10-21': { a: 2, c: 2 } };
  const s = accuracySeries(log, 3, new Date('2026-10-23T12:00:00'));
  assert.equal(s.length, 3);
  assert.deepEqual(s.map((r) => r.day), ['2026-10-21', '2026-10-22', '2026-10-23']);
  assert.equal(s[0].accuracy, 100);
  assert.equal(s[1].accuracy, null);
  assert.equal(s[2].accuracy, 75);
});
