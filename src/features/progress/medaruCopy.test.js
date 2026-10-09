import test from 'node:test';
import assert from 'node:assert/strict';
import { HEIAN_MEDARU, EDO_MEDARU, MEIJI_MEDARU, SHOWA_MEDARU, medaruCopy, isHeianEra, isEdoEra, isMeijiEra, isShowaEra } from './medaruCopy.js';

const KANJI = /[\u4e00-\u9fff]/;

test('isHeianEra / isEdoEra: hanya era yang cocok', () => {
  assert.equal(isHeianEra('heian'), true);
  assert.equal(isHeianEra('edo'), false);
  assert.equal(isHeianEra(undefined), false);

  assert.equal(isEdoEra('edo'), true);
  assert.equal(isEdoEra('heian'), false);
  assert.equal(isEdoEra(null), false);
});

test('isMeijiEra: hanya "meiji" yang dianggap Meiji', () => {
  assert.equal(isMeijiEra('meiji'), true);
  assert.equal(isMeijiEra('edo'), false);
  assert.equal(isMeijiEra(undefined), false);
  assert.equal(isMeijiEra(null), false);
});

test('isShowaEra: hanya "showa" yang dianggap Shōwa', () => {
  assert.equal(isShowaEra('showa'), true);
  assert.equal(isShowaEra('meiji'), false);
  assert.equal(isShowaEra(undefined), false);
  assert.equal(isShowaEra(null), false);
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

test('medaruCopy(edo): nama pakai 両 (ryō), bukan "MEDARU"', () => {
  const T = medaruCopy('edo', 'id');
  assert.equal(T.name, '両');
  assert.equal(T.nameShort, '両');
  // aria memuat furigana → tetap informatif untuk pembaca layar.
  assert.ok(/りょう/.test(T.aria), 'aria harus memuat furigana りょう');
});

test('medaruCopy(meiji): nama pakai 円 (en), bukan "MEDARU"', () => {
  const T = medaruCopy('meiji', 'id');
  assert.equal(T.name, '円');
  assert.equal(T.nameShort, '円');
  // aria memuat furigana → tetap informatif untuk pembaca layar.
  assert.ok(/えん/.test(T.aria), 'aria harus memuat furigana えん');
  assert.deepEqual(MEIJI_MEDARU, medaruCopy('meiji', 'en'));
});

test('medaruCopy(showa): nama pakai 円 (en, 新円 1946), bukan "MEDARU"', () => {
  const T = medaruCopy('showa', 'id');
  assert.equal(T.name, '円');
  assert.equal(T.nameShort, '円');
  assert.ok(/えん/.test(T.aria), 'aria harus memuat furigana えん');
  assert.deepEqual(SHOWA_MEDARU, medaruCopy('showa', 'en'));
});

test('medaruCopy: era lain → "MEDARU" (Heian/Edo/Meiji/Shōwa tidak bocor)', () => {
  assert.equal(medaruCopy('cyberpunk', 'id').name, 'MEDARU');
  assert.equal(medaruCopy('cyberpunk', 'en').name, 'MEDARU');
  assert.equal(medaruCopy('anime', 'en').nameShort, 'MEDARU');
});

test('medaruCopy: Heian & Edo tidak bergantung bahasa', () => {
  assert.deepEqual(medaruCopy('heian', 'id'), medaruCopy('heian', 'en'));
  assert.deepEqual(medaruCopy('edo', 'id'), medaruCopy('edo', 'en'));
  assert.deepEqual(medaruCopy('meiji', 'id'), medaruCopy('meiji', 'en'));
  assert.deepEqual(medaruCopy('showa', 'id'), medaruCopy('showa', 'en'));
  assert.deepEqual(EDO_MEDARU, medaruCopy('edo', 'id'));
});

test('medaruCopy: hasil selalu salinan baru (tidak bisa merusak konstanta)', () => {
  const a = medaruCopy('edo', 'id');
  a.name = 'X';
  assert.equal(EDO_MEDARU.name, '両');
});
