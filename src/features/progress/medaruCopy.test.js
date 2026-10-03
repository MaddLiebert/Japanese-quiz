import test from 'node:test';
import assert from 'node:assert/strict';
import { HEIAN_MEDARU, medaruCopy, isHeianEra } from './medaruCopy.js';

const KANJI = /[\u4e00-\u9fff]/;

test('isHeianEra: hanya "heian"', () => {
  assert.equal(isHeianEra('heian'), true);
  assert.equal(isHeianEra('edo'), false);
  assert.equal(isHeianEra(undefined), false);
});

test('medaruCopy(heian): nama pakai KANA (もん), bukan "MEDARU"', () => {
  const T = medaruCopy('heian', 'id');
  assert.equal(T.name, 'もん');
  assert.equal(T.nameShort, 'もん');
});

test('label Heian BEBAS kanji (pemain belum bisa kanji)', () => {
  for (const k of ['name', 'nameShort', 'aria']) {
    assert.ok(!KANJI.test(HEIAN_MEDARU[k]), `"${k}" tidak boleh kanji: ${HEIAN_MEDARU[k]}`);
  }
});

test('medaruCopy: era lain → "MEDARU" (Heian tidak bocor)', () => {
  assert.equal(medaruCopy('showa', 'id').name, 'MEDARU');
  assert.equal(medaruCopy('showa', 'en').name, 'MEDARU');
  assert.equal(medaruCopy('edo', 'en').nameShort, 'MEDARU');
});

test('medaruCopy: Heian tidak bergantung bahasa', () => {
  assert.deepEqual(medaruCopy('heian', 'id'), medaruCopy('heian', 'en'));
});
