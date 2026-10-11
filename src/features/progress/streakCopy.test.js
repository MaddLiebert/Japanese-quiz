import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEIAN_STREAK, EDO_STREAK, MEIJI_STREAK, CYBERPUNK_STREAK, STREAK_BY_ERA, streakCopy, isHeianEra,
} from './streakCopy.js';

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

test('TIAP ERA punya sigil sendiri (Heian/Edo/Meiji/電脳 beda) — anti Shōwa bocor', () => {
  const sigils = [HEIAN_STREAK.sigil, EDO_STREAK.sigil, MEIJI_STREAK.sigil, CYBERPUNK_STREAK.sigil];
  assert.deepEqual(sigils, ['candle', 'lantern', 'gaslight', 'hologram']);
  assert.equal(new Set(sigils).size, 4, 'sigil tiap era harus unik');
});

test('電脳 punya copy sendiri (接続/hologram), bukan legacy 炎', () => {
  const T = streakCopy('cyberpunk', 'id');
  assert.equal(T.title, '接続');
  assert.equal(T.sigil, 'hologram');
  assert.equal(T.unit, '日');
  assert.notEqual(T.sigilOn, '炎');
  assert.notEqual(T.title, 'Streak Belajar');
  // bebas bahasa (seperti era lain)
  assert.deepEqual(streakCopy('cyberpunk', 'id'), streakCopy('cyberpunk', 'en'));
});

test('Meiji punya copy sendiri (tidak mewarisi era lain / legacy 炎)', () => {
  const T = streakCopy('meiji', 'id');
  assert.equal(T.title, '瓦斯灯');
  assert.equal(T.sigil, 'gaslight');
  assert.notEqual(T.sigilOn, '炎');
  assert.notEqual(T.title, 'Streak Belajar');
});

test('Edo punya copy sendiri (提灯), bukan legacy', () => {
  const T = streakCopy('edo', 'id');
  assert.equal(T.title, '提灯');
  assert.equal(T.sigil, 'lantern');
  assert.notEqual(T.sigilOn, '炎');
});

test('STREAK_BY_ERA: berisi heian/edo/meiji/cyberpunk', () => {
  assert.deepEqual(Object.keys(STREAK_BY_ERA).sort(), ['cyberpunk', 'edo', 'heian', 'meiji']);
});

test('streakCopy: era yang belum didesain → teks lama (炎/灰, ID/EN)', () => {
  const id = streakCopy('showa', 'id');
  assert.equal(id.title, 'Streak Belajar');
  assert.equal(id.bonusOn, '+5% Bonus Aktif');
  assert.equal(id.unit, null);
  assert.equal(id.sigilOn, '炎');
  assert.equal(id.sigil, 'legacy');

  const en = streakCopy('anime', 'en');
  assert.equal(en.title, 'Study Streak');
  assert.equal(en.bonusOff, 'Bonus Inactive');
});

test('streakCopy: era ber-copy tidak bergantung bahasa', () => {
  for (const era of ['heian', 'edo', 'meiji', 'cyberpunk']) {
    assert.deepEqual(streakCopy(era, 'id'), streakCopy(era, 'en'));
  }
});

test('streakCopy: mengembalikan salinan (tabel tidak termutasi)', () => {
  const a = streakCopy('meiji', 'id');
  a.title = 'X';
  assert.equal(streakCopy('meiji', 'id').title, '瓦斯灯');
});
