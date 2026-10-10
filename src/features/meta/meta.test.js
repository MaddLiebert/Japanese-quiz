// meta.test.js — penjaga modul murni A8 メタ/4th-wall (features/meta/meta.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A8. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { META_MOMENTS, pickMeta, fillMeta } from './meta.js';

test('pickMeta: sessionEnd + answered ≥10 → tsuzuku', () => {
  const m = pickMeta({ sessionEnd: true, answered: 12 });
  assert.equal(m.id, 'tsuzuku');
});

test('pickMeta: answered <10 → bukan tsuzuku', () => {
  const m = pickMeta({ sessionEnd: true, answered: 3 });
  assert.notEqual(m?.id, 'tsuzuku');
});

test('pickMeta: id yang sudah tampil dilewati', () => {
  const m = pickMeta({ sessionEnd: true, answered: 12 }, ['tsuzuku']);
  assert.notEqual(m?.id, 'tsuzuku');
});

test('pickMeta: streak ≥20 → narrator', () => {
  assert.equal(pickMeta({ streak: 25 }).id, 'narrator');
});

test('pickMeta: tak ada yang layak → null', () => {
  assert.equal(pickMeta({ sessionEnd: false, answered: 0, dayStreak: 0, streak: 0 }), null);
});

test('pickMeta: stats kosong tidak crash', () => {
  assert.equal(pickMeta(), null);
});

test('fillMeta: isi placeholder {n} dari dayStreak', () => {
  const ep = META_MOMENTS.find((m) => m.id === 'episode');
  const filled = fillMeta(ep, { dayStreak: 3 });
  assert.equal(filled.jp, '第3話');
  assert.equal(filled.id_text, 'Episode 3');
});

test('fillMeta: null → null', () => {
  assert.equal(fillMeta(null, {}), null);
});
