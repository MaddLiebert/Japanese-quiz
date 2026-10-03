import test from 'node:test';
import assert from 'node:assert/strict';
import { HEIAN_STREAK, streakCopy, isHeianEra } from './streakCopy.js';

const KANJI = /[\u4e00-\u9fff]/;

test('isHeianEra: hanya "heian"', () => {
  assert.equal(isHeianEra('heian'), true);
  assert.equal(isHeianEra('showa'), false);
  assert.equal(isHeianEra(undefined), false);
});

test('streakCopy(heian): teks kana (nyala & padam)', () => {
  const T = streakCopy('heian', 'id');
  assert.equal(T.title, 'ひのたま');
  assert.equal(T.unit, 'ひ');
  assert.equal(T.bonusOn, 'ごわり まし');
  assert.equal(T.bonusOff, 'ひ は きえて いる');
  assert.equal(T.sigilOn, '灯');
  assert.equal(T.sigilOff, '消');
  assert.equal(T.candleLit, 'ひ が ともって いる');
  assert.equal(T.candleOut, 'ひ が きえて いる');
});

test('label utama Heian BEBAS kanji (kana saja)', () => {
  const T = HEIAN_STREAK;
  for (const k of ['title', 'unit', 'bonusOn', 'bonusOff', 'candleLit', 'candleOut']) {
    assert.ok(!KANJI.test(T[k]), `"${k}" tidak boleh kanji: ${T[k]}`);
  }
  // segel nyala/padam = tepat 1 kanji (hiasan)
  assert.equal(T.sigilOn.length, 1);
  assert.equal(T.sigilOff.length, 1);
  assert.ok(KANJI.test(T.sigilOn) && KANJI.test(T.sigilOff));
});

test('streakCopy: era lain → teks lama (Heian tidak bocor)', () => {
  const id = streakCopy('showa', 'id');
  assert.equal(id.title, 'Streak Belajar');
  assert.equal(id.bonusOn, '+5% Bonus Aktif');
  assert.equal(id.unit, null);
  assert.equal(id.sigilOn, '炎');

  const en = streakCopy('edo', 'en');
  assert.equal(en.title, 'Study Streak');
  assert.equal(en.bonusOff, 'Bonus Inactive');
});

test('streakCopy: Heian tidak bergantung bahasa', () => {
  assert.deepEqual(streakCopy('heian', 'id'), streakCopy('heian', 'en'));
});
