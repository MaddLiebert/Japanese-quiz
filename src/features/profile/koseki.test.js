import test from 'node:test';
import assert from 'node:assert/strict';
import { buildKoseki, correctEntry, correctionsFor, KOSEKI_KEY } from './koseki.js';

test('buildKoseki: entri stabil dari progress', () => {
  const k = buildKoseki({ firstSeen: '2026-01-01', daysActive: 47, level: 50, xp: 12345, firstMistakeKanji: '水' });
  assert.equal(k.since, '2026-01-01');
  assert.equal(k.days, 47);
  assert.equal(k.firstMistake, '水');
  const ids = k.entries.map((e) => e.id);
  assert.deepEqual(ids, ['since', 'days', 'level', 'xp', 'mistake']);
});

test('buildKoseki: input sama → output sama (deterministik)', () => {
  const a = buildKoseki({ level: 10, xp: 100 });
  const b = buildKoseki({ level: 10, xp: 100 });
  assert.deepEqual(a, b);
});

test('buildKoseki: progress kosong → tidak crash', () => {
  const k = buildKoseki();
  assert.deepEqual(k.entries, []);
  assert.equal(k.days, 0);
});

test('correctEntry: menambah 1 koreksi (pure)', () => {
  const k = buildKoseki({ level: 50 });
  const k2 = correctEntry(k, 'level', 'bukan 50, tapi 49');
  assert.equal(correctionsFor(k2, 'level').length, 1);
  assert.equal(correctionsFor(k, 'level').length, 0, 'asli tak boleh berubah');
  assert.equal(KOSEKI_KEY, 'app_koseki_v1');
});
