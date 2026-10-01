import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEATH_METER_PER_CHARGE,
  DEATH_MAX_CHARGES,
  DEATH_MUGEN_BONUS_S,
  DEATH_COMBO_BONUS_PER,
  DEATH_SKILLS,
  deathSkillById,
  deathInitialSkillState,
  deathSkillOnCorrect,
  deathSkillOnWrong,
  deathSkillCanCast,
  deathSkillSpend,
  deathComboBonus,
  deathSkillCastLabel,
} from './deathSkills.js';

// ── Konstanta tuning ─────────────────────────────────────────────────────────
test('konstanta tuning masuk akal', () => {
  assert.equal(DEATH_METER_PER_CHARGE, 5);
  assert.ok(DEATH_MAX_CHARGES >= 1);
  assert.ok(DEATH_MUGEN_BONUS_S > 0);
  assert.ok(DEATH_COMBO_BONUS_PER > 0);
});

// ── Katalog skill ────────────────────────────────────────────────────────────
test('katalog punya 3 skill aktif dengan field lengkap', () => {
  assert.equal(DEATH_SKILLS.length, 3);
  for (const s of DEATH_SKILLS) {
    assert.ok(typeof s.id === 'string' && s.id.length > 0, 'id wajib');
    assert.ok(typeof s.name === 'string' && s.name.length > 0, 'name wajib');
    assert.ok(typeof s.name_en === 'string' && s.name_en.length > 0, 'name_en wajib');
    assert.ok(typeof s.icon === 'string' && s.icon.length > 0, 'icon wajib');
  }
});

test('deathSkillById mengembalikan skill / null', () => {
  assert.equal(deathSkillById('rikugan')?.id, 'rikugan');
  assert.equal(deathSkillById('mugen')?.id, 'mugen');
  assert.equal(deathSkillById('hanten')?.id, 'hanten');
  assert.equal(deathSkillById('ngawur'), null);
  assert.equal(deathSkillById(undefined), null);
});

// ── State skill ──────────────────────────────────────────────────────────────
test('state awal bersih', () => {
  assert.deepEqual(deathInitialSkillState(), { combo: 0, meter: 0, charges: 0 });
});

test('jawaban benar: combo naik, meter ngisi', () => {
  let s = deathInitialSkillState();
  s = deathSkillOnCorrect(s);
  assert.equal(s.combo, 1);
  assert.equal(s.meter, 1);
  assert.equal(s.charges, 0);
});

test('meter penuh setelah 5 benar → +1 charge, meter reset', () => {
  let s = deathInitialSkillState();
  for (let i = 0; i < DEATH_METER_PER_CHARGE; i++) s = deathSkillOnCorrect(s);
  assert.equal(s.combo, DEATH_METER_PER_CHARGE);
  assert.equal(s.charges, 1);
  assert.equal(s.meter, 0);
});

test('salah: combo & meter reset, TAPI charge banked tetap', () => {
  let s = deathInitialSkillState();
  for (let i = 0; i < DEATH_METER_PER_CHARGE; i++) s = deathSkillOnCorrect(s); // 1 charge
  s = deathSkillOnCorrect(s); // combo 6, meter 1
  s = deathSkillOnWrong(s);
  assert.equal(s.combo, 0);
  assert.equal(s.meter, 0);
  assert.equal(s.charges, 1, 'charge hasil kerja keras tidak boleh hilang');
});

test('charge dibatasi DEATH_MAX_CHARGES', () => {
  let s = deathInitialSkillState();
  const rounds = DEATH_METER_PER_CHARGE * (DEATH_MAX_CHARGES + 3);
  for (let i = 0; i < rounds; i++) s = deathSkillOnCorrect(s);
  assert.equal(s.charges, DEATH_MAX_CHARGES);
});

test('saat charge mentok, meter tidak terus menumpuk', () => {
  let s = deathInitialSkillState();
  for (let i = 0; i < DEATH_METER_PER_CHARGE * DEATH_MAX_CHARGES; i++) s = deathSkillOnCorrect(s);
  assert.equal(s.charges, DEATH_MAX_CHARGES);
  assert.equal(s.meter, 0);
});

// ── Cast skill ───────────────────────────────────────────────────────────────
test('deathSkillCanCast: butuh minimal 1 charge', () => {
  const empty = deathInitialSkillState();
  assert.equal(deathSkillCanCast(empty, 'rikugan'), false);
  const full = { combo: 5, meter: 0, charges: 1 };
  assert.equal(deathSkillCanCast(full, 'rikugan'), true);
  assert.equal(deathSkillCanCast(full, 'mugen'), true);
  assert.equal(deathSkillCanCast(full, 'hanten'), true);
});

test('deathSkillSpend mengurangi 1 charge, tidak pernah negatif', () => {
  const s = { combo: 0, meter: 0, charges: 2 };
  assert.equal(deathSkillSpend(s).charges, 1);
  const zero = { combo: 0, meter: 0, charges: 0 };
  assert.equal(deathSkillSpend(zero).charges, 0);
});

test('deathSkillSpend tidak mengubah combo/meter', () => {
  const s = { combo: 7, meter: 3, charges: 2 };
  const out = deathSkillSpend(s);
  assert.equal(out.combo, 7);
  assert.equal(out.meter, 3);
});

// ── Bonus combo ──────────────────────────────────────────────────────────────
test('deathComboBonus proporsional combo terbaik', () => {
  assert.equal(deathComboBonus(0), 0);
  assert.equal(deathComboBonus(3), 3 * DEATH_COMBO_BONUS_PER);
  assert.equal(deathComboBonus(12), 12 * DEATH_COMBO_BONUS_PER);
});

test('deathComboBonus aman untuk input aneh', () => {
  assert.equal(deathComboBonus(-5), 0);
  assert.equal(deathComboBonus(NaN), 0);
  assert.equal(deathComboBonus(undefined), 0);
  assert.equal(deathComboBonus(null), 0);
});

// ── Label cast (UI) ──────────────────────────────────────────────────────────
test('deathSkillCastLabel mengembalikan teks ID & EN non-kosong', () => {
  const id = deathSkillCastLabel('rikugan', true);
  const en = deathSkillCastLabel('rikugan', false);
  assert.ok(typeof id === 'string' && id.length > 0);
  assert.ok(typeof en === 'string' && en.length > 0);
  assert.notEqual(id, en);
});
