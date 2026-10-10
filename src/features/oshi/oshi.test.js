// oshi.test.js — penjaga modul murni A4 推し (features/oshi/oshi.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A4. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { OSHI_REACTIONS, setOshi, clearOshi, hasOshi, oshiReaction } from './oshi.js';

test('setOshi: menyimpan id karakter', () => {
  assert.equal(setOshi({ level: 150 }, 'hoshi_hikari').oshiId, 'hoshi_hikari');
});

test('setOshi: id kosong/null → oshiId null (lepas 推し)', () => {
  assert.equal(setOshi({ oshiId: 'x' }, '').oshiId, null);
  assert.equal(setOshi({ oshiId: 'x' }, null).oshiId, null);
});

test('setOshi: immutable (tidak merusak state asli)', () => {
  const s = { level: 150 };
  setOshi(s, 'a');
  assert.equal(s.oshiId, undefined);
});

test('clearOshi / hasOshi', () => {
  assert.equal(hasOshi({ oshiId: 'a' }), true);
  assert.equal(hasOshi({}), false);
  assert.equal(clearOshi({ oshiId: 'a' }).oshiId, null);
});

test('oshiReaction: teks untuk event dikenal; tak dikenal → null', () => {
  assert.equal(oshiReaction('correct').jp, 'いいね！');
  assert.equal(oshiReaction('graduate').id_text, 'Ayo pergi bersama.');
  assert.equal(oshiReaction('nope'), null);
});

test('OSHI_REACTIONS: 4 event dengan jp + id_text', () => {
  assert.deepEqual(Object.keys(OSHI_REACTIONS).sort(), ['correct', 'graduate', 'streak', 'wrong']);
  for (const r of Object.values(OSHI_REACTIONS)) {
    assert.ok(r.jp && r.id_text);
  }
});
