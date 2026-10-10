// slang.test.js — penjaga modul murni A6 若者言葉 (features/slang/slang.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A6. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SLANG, SLANG_NUANCES, slangById, checkSlang, slangByLevel,
  friendOnlySlang, validateSlang, validateSlangBank,
} from './slang.js';

test('slangById: dikenal → objek; tak dikenal → null', () => {
  assert.equal(slangById('yabai').jp, 'やばい');
  assert.equal(slangById('nope'), null);
});

test('checkSlang: benar via id ATAU teks jp', () => {
  const item = slangById('emoi');
  assert.equal(checkSlang(item, 'emoi').ok, true);
  assert.equal(checkSlang(item, 'エモい').ok, true);
  assert.equal(checkSlang(item, 'yabai').ok, false);
  assert.equal(checkSlang(item, 'emoi').correct, 'emoi');
});

test('checkSlang: item null → ok false, tidak crash', () => {
  assert.equal(checkSlang(null, 'yabai').ok, false);
});

test('slangByLevel: memuat level ≤ n; tak dikenal → semua', () => {
  const lv2 = slangByLevel(2);
  assert.ok(lv2.some((s) => s.level === 1));
  assert.ok(lv2.some((s) => s.level === 2));
  assert.ok(lv2.every((s) => s.level <= 2));
  assert.ok(!lv2.some((s) => s.level === 3));
  assert.equal(slangByLevel('x').length, SLANG.length);
});

test('nuansa: やばい = "serba bisa" (makna tergantung konteks)', () => {
  assert.equal(slangById('yabai').nuance_id, 'serba bisa');
  assert.ok(SLANG_NUANCES.includes('serba bisa'));
});

test('kesopanan: semua slang ditandai friend_only + punya caution_id', () => {
  assert.ok(friendOnlySlang().length > 0);
  for (const s of SLANG) {
    assert.equal(s.friend_only, true, `${s.id} harus friend_only`);
    assert.ok(s.caution_id, `${s.id} wajib caution_id`);
  }
});

test('bank: valid semua', () => {
  assert.deepEqual(validateSlangBank(SLANG), []);
});

test('validateSlang: menolak entri rusak', () => {
  assert.equal(validateSlang(null).ok, false);
  assert.equal(validateSlang({ id: 'x', jp: 'あ', reading: 'あ', meaning_id: 'a', nuance_id: 'ngawur', level: 1 }).ok, false);
  assert.equal(validateSlang({ id: 'y', jp: 'あ', reading: 'あ', meaning_id: 'a', nuance_id: 'net', level: 1, friend_only: true }).ok, false); // tanpa caution
});

test('bank: id unik & semua kelas nuansa dipakai', () => {
  const ids = SLANG.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const n of SLANG_NUANCES) {
    assert.ok(SLANG.some((s) => s.nuance_id === n), `nuansa ${n} tak terpakai`);
  }
});
