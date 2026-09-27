import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyExamRecord, mergeExamRecord, n5BadgesFor, gradeLabel, certificateNo,
  N5_YUUSHUU_MIN, N5_KANPEKI_TOTAL,
} from './certificate.js';

test('emptyExamRecord: semua nol, belum lulus', () => {
  const r = emptyExamRecord();
  assert.equal(r.attempts, 0);
  assert.equal(r.bestTotal, 0);
  assert.equal(r.passed, false);
  assert.equal(r.passedAt, null);
});

test('mergeExamRecord: percobaan pertama gagal → attempts 1, belum lulus', () => {
  const r = mergeExamRecord(emptyExamRecord(), { total: 60, lkrScaled: 40, listeningScaled: 20, passed: false, at: '2026-09-27' });
  assert.equal(r.attempts, 1);
  assert.equal(r.bestTotal, 60);
  assert.equal(r.passed, false);
  assert.equal(r.lastTotal, 60);
  assert.equal(r.lastPassed, false);
});

test('mergeExamRecord: lulus → passed true + passedAt terisi', () => {
  const r = mergeExamRecord(emptyExamRecord(), { total: 100, lkrScaled: 70, listeningScaled: 30, passed: true, at: '2026-09-27T10:00:00Z' });
  assert.equal(r.passed, true);
  assert.equal(r.passedAt, '2026-09-27T10:00:00Z');
  assert.equal(r.bestTotal, 100);
});

test('mergeExamRecord: best diambil maksimum, passed lengket (tidak dicabut)', () => {
  let r = mergeExamRecord(emptyExamRecord(), { total: 150, lkrScaled: 100, listeningScaled: 50, passed: true, at: '2026-09-27' });
  r = mergeExamRecord(r, { total: 70, lkrScaled: 50, listeningScaled: 20, passed: false, at: '2026-09-28' });
  assert.equal(r.attempts, 2);
  assert.equal(r.bestTotal, 150);       // tetap rekor tertinggi
  assert.equal(r.passed, true);         // tidak dicabut
  assert.equal(r.passedAt, '2026-09-27'); // tetap tanggal lulus pertama
  assert.equal(r.lastTotal, 70);        // run terakhir tetap tercatat
  assert.equal(r.lastPassed, false);
});

test('n5BadgesFor: bertingkat sesuai rekor terbaik', () => {
  assert.deepEqual(n5BadgesFor(emptyExamRecord()), []);
  assert.deepEqual(n5BadgesFor({ passed: true, bestTotal: 90 }), ['n5_gokaku']);
  assert.deepEqual(n5BadgesFor({ passed: true, bestTotal: N5_YUUSHUU_MIN }), ['n5_gokaku', 'n5_yuushuu']);
  assert.deepEqual(n5BadgesFor({ passed: true, bestTotal: N5_KANPEKI_TOTAL }), ['n5_gokaku', 'n5_yuushuu', 'n5_kanpeki']);
  // belum lulus walau skor tinggi (mustahil, tapi jaga invariant): tidak ada badge lulus
  assert.deepEqual(n5BadgesFor({ passed: false, bestTotal: 170 }), []);
});

test('gradeLabel: 合格 / 優良 / 満点', () => {
  assert.equal(gradeLabel({ passed: true, bestTotal: 90 }, 'id'), '合格 (Lulus)');
  assert.equal(gradeLabel({ passed: true, bestTotal: 145 }, 'id'), '優良 (Distingsi)');
  assert.equal(gradeLabel({ passed: true, bestTotal: 180 }, 'id'), '満点 (Sempurna)');
  assert.equal(gradeLabel({ passed: false, bestTotal: 50 }, 'id'), '不合格 (Belum Lulus)');
});

test('certificateNo: kosong bila belum lulus, terisi & stabil bila lulus', () => {
  assert.equal(certificateNo(emptyExamRecord(), 'Saku'), '');
  const rec = { passed: true, bestTotal: 120, passedAt: '2026-09-27T10:00:00Z' };
  const a = certificateNo(rec, 'Saku');
  const b = certificateNo(rec, 'Saku');
  assert.equal(a, b);                       // deterministik
  assert.match(a, /^N5-2026-\d{6}$/);
  assert.notEqual(certificateNo(rec, 'Lain'), a); // nama beda → nomor beda
});
