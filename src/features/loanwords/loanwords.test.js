// loanwords.test.js — penjaga modul murni A7 カタカナ (features/loanwords/loanwords.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A7. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOANWORDS, LOAN_LANGS, LOAN_LANG_LABELS, loanById, checkLoan, loansByLang,
  falseFriends, validateLoan, validateLoanBank,
} from './loanwords.js';

test('loanById: dikenal → objek; tak dikenal → null', () => {
  assert.equal(loanById('majikku').jp, 'マジック');
  assert.equal(loanById('nope'), null);
});

test('checkLoan: benar via id ATAU teks jp', () => {
  const item = loanById('doragon');
  assert.equal(checkLoan(item, 'doragon').ok, true);
  assert.equal(checkLoan(item, 'ドラゴン').ok, true);
  assert.equal(checkLoan(item, 'majikku').ok, false);
  assert.equal(checkLoan(item, 'doragon').correct, 'doragon');
});

test('checkLoan: item null → ok false, tidak crash', () => {
  assert.equal(checkLoan(null, 'doragon').ok, false);
});

test('loansByLang: filter bahasa asal; tak dikenal → []', () => {
  const de = loansByLang('de');
  assert.ok(de.some((l) => l.jp === 'アルバイト'));
  assert.ok(de.every((l) => l.origin_lang === 'de'));
  assert.deepEqual(loansByLang('xx'), []);
});

test('bahasa asal: bukan cuma Inggris (パン ← Portugis)', () => {
  assert.equal(loanById('pan').origin_lang, 'pt');
  assert.equal(loanById('arubaito').origin_lang, 'de');
});

test('false friend: マンション = apartemen, bukan mansion', () => {
  const m = loanById('manshon');
  assert.equal(m.false_friend, true);
  assert.ok(m.trap_id);
  assert.ok(falseFriends().length >= 1);
});

test('bank: valid semua', () => {
  assert.deepEqual(validateLoanBank(LOANWORDS), []);
});

test('validateLoan: menolak entri rusak', () => {
  assert.equal(validateLoan(null).ok, false);
  assert.equal(validateLoan({ id: 'x', jp: 'ア', origin: 'a', origin_lang: 'xx', meaning_id: 'm' }).ok, false); // lang asing
  assert.equal(validateLoan({ id: 'y', jp: 'イ', origin: 'b', origin_lang: 'en', meaning_id: 'm', false_friend: true }).ok, false); // tanpa trap
});

test('bank: id unik & semua bahasa asal terwakili', () => {
  const ids = LOANWORDS.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const lang of LOAN_LANGS) {
    assert.ok(loansByLang(lang).length > 0, `bahasa ${lang} kosong`);
    assert.ok(LOAN_LANG_LABELS[lang], `label bahasa ${lang} tak ada`);
  }
});
