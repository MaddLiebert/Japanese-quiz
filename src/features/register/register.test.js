// register.test.js — penjaga modul murni A2 タメ口↔敬語 (features/register/register.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A2. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REGISTER_PAIRS, REGISTER_MODES, DEFAULT_REGISTER_MODE, REGISTER_HINTS,
  isRegisterMode, registerMode, registerById, registerTarget, checkRegister,
  toPolite, toCasual, registerByLevel, validateRegisterPair, validateRegisterBank,
} from './register.js';

const pair = registerById('taberu'); // 食べる ↔ 食べます

test('mode: dua arah valid; tak dikenal → default', () => {
  assert.deepEqual(REGISTER_MODES, ['polite', 'casual']);
  assert.equal(isRegisterMode('polite'), true);
  assert.equal(isRegisterMode('ngawur'), false);
  assert.equal(registerMode('ngawur'), DEFAULT_REGISTER_MODE);
});

test('registerById: dikenal → objek; tak dikenal → null', () => {
  assert.equal(registerById('taberu').polite, '食べます');
  assert.equal(registerById('nope'), null);
});

test('registerTarget: pilih sisi sesuai mode', () => {
  assert.equal(registerTarget(pair, 'polite'), '食べます');
  assert.equal(registerTarget(pair, 'casual'), '食べる');
  assert.equal(registerTarget(null, 'polite'), null);
});

test('checkRegister: benar saat cocok target (dua arah)', () => {
  assert.equal(checkRegister(pair, 'polite', '食べます').ok, true);
  assert.equal(checkRegister(pair, 'casual', '食べる').ok, true);
});

test('checkRegister: salah saat tidak cocok / kosong / mode salah arah', () => {
  assert.equal(checkRegister(pair, 'polite', '食べる').ok, false);
  assert.equal(checkRegister(pair, 'polite', '').ok, false);
  assert.equal(checkRegister(pair, 'polite', null).ok, false);
  // reveal selalu kasih target yang benar
  assert.equal(checkRegister(pair, 'casual', 'salah').target, '食べる');
});

test('checkRegister: guess di-trim (spasi tak dihitung salah)', () => {
  assert.equal(checkRegister(pair, 'polite', '  食べます  ').ok, true);
});

test('checkRegister: item null → ok false, tidak crash', () => {
  const res = checkRegister(null, 'polite', '食べます');
  assert.equal(res.ok, false);
  assert.equal(res.target, null);
});

test('toPolite / toCasual: lookup dua arah; tak dikenal → null', () => {
  assert.equal(toPolite('食べる'), '食べます');
  assert.equal(toCasual('食べます'), '食べる');
  assert.equal(toPolite('ngawur'), null);
  assert.equal(toCasual('ngawur'), null);
});

test('toPolite/toCasual: round-trip konsisten untuk seluruh bank', () => {
  for (const p of REGISTER_PAIRS) {
    assert.equal(toPolite(p.casual), p.polite);
    assert.equal(toCasual(p.polite), p.casual);
  }
});

test('registerByLevel: level ≤ n; level tak dikenal → semua', () => {
  const lv1 = registerByLevel(1);
  assert.ok(lv1.length > 0);
  assert.ok(lv1.every((p) => p.level <= 1));
  assert.ok(registerByLevel(3).length >= lv1.length);
  assert.equal(registerByLevel('x').length, REGISTER_PAIRS.length);
});

test('hints: pola konjugasi tersedia (untuk mode Jiplak)', () => {
  assert.ok(REGISTER_HINTS.length > 0);
  assert.ok(REGISTER_HINTS.some((h) => h.from === 'だ' && h.to === 'です'));
});

test('bank: valid semua (id unik, casual/polite unik, tiap pasangan valid)', () => {
  assert.deepEqual(validateRegisterBank(REGISTER_PAIRS), []);
});

test('validateRegisterPair: menolak pasangan rusak', () => {
  assert.equal(validateRegisterPair(null).ok, false);
  assert.equal(validateRegisterPair({ id: 'x', casual: 'あ', polite: 'あ', meaning_id: 'a', level: 1 }).ok, false); // casual==polite
  assert.equal(validateRegisterPair({ id: 'y', casual: 'あ', meaning_id: 'a', level: 1 }).ok, false); // polite kosong
});

test('validateRegisterBank: menangkap duplikat casual (lookup ambigu)', () => {
  const bad = [
    { id: 'a', casual: '同じ', polite: 'A', meaning_id: 'x', level: 1 },
    { id: 'b', casual: '同じ', polite: 'B', meaning_id: 'y', level: 1 },
  ];
  assert.ok(validateRegisterBank(bad).some((e) => e.includes('casual duplikat')));
});
