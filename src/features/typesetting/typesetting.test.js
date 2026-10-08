import test from 'node:test';
import assert from 'node:assert/strict';
import {
  POS_COLORS, posColor, isSmallBlock,
  TYPESETTING_LEVELS, DEFAULT_TYPESETTING_LEVEL, typesettingLevel, typesettingXp,
  buildPool, correctOrder, checkOrder, misprintAmount, isComplete, isCorrectBlock,
  pickQuestions, validateQuestion,
} from './typesetting.js';
import { TYPESETTING_BANK } from './typesettingBank.js';

// Ambil satu soal uji deterministik dari bank.
const q = TYPESETTING_BANK.find((x) => x.id === 't-001');
const order = correctOrder(q);

test('posColor: kelas kata → token warna; tak dikenal → sumi', () => {
  assert.equal(posColor('particle'), 'ai');
  assert.equal(posColor('noun'), 'renga');
  assert.equal(posColor('verb'), 'shu');
  assert.equal(posColor('ngawur'), 'sumi');
  assert.equal(POS_COLORS.aux, 'nezumi');
});

test('isSmallBlock: hanya partikel yang jadi blok kecil', () => {
  assert.equal(isSmallBlock('particle'), true);
  assert.equal(isSmallBlock('noun'), false);
});

test('typesettingLevel / typesettingXp: normalisasi level tak dikenal', () => {
  assert.equal(typesettingLevel(3).showReading, false);
  assert.equal(typesettingLevel(99).key, DEFAULT_TYPESETTING_LEVEL);
  assert.equal(typesettingXp(1), TYPESETTING_LEVELS[1].xp);
  assert.ok(typesettingXp(3) > typesettingXp(1)); // level tinggi = XP lebih besar
});

test('buildPool: deterministik (seed sama → urutan sama)', () => {
  const a = buildPool(q, 42).map((b) => b.id);
  const b = buildPool(q, 42).map((b) => b.id);
  assert.deepEqual(a, b);
});

test('buildPool: seed beda → urutan beda (biasanya)', () => {
  const a = buildPool(q, 1).map((b) => b.id);
  const b = buildPool(q, 999).map((b) => b.id);
  assert.notDeepEqual(a, b);
});

test('buildPool: berisi SEMUA blok benar + distraktor, tanpa duplikat', () => {
  const pool = buildPool(q, 7);
  const ids = pool.map((b) => b.id);
  assert.equal(ids.length, q.parts.length + q.distractors.length);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of q.parts) assert.ok(ids.includes(p.id));
});

test('buildPool: mengembalikan salinan (tidak merusak soal asli)', () => {
  const pool = buildPool(q, 7);
  pool[0].jp = 'RUSAK';
  assert.notEqual(q.parts[0].jp, 'RUSAK');
});

test('checkOrder: benar saat urut benar', () => {
  assert.deepEqual(checkOrder(q, order), { ok: true, misprintAt: -1 });
});

test('checkOrder: salah saat ada distraktor di posisi mana pun', () => {
  const withDistractor = [...order];
  withDistractor[1] = 't-001-d1';            // が menggantikan は
  const res = checkOrder(q, withDistractor);
  assert.equal(res.ok, false);
  assert.equal(res.misprintAt, 1);
});

test('checkOrder: salah saat urutan tertukar', () => {
  const swapped = [...order];
  [swapped[2], swapped[3]] = [swapped[3], swapped[2]]; // 新聞 ↔ 毎朝
  const res = checkOrder(q, swapped);
  assert.equal(res.ok, false);
  assert.equal(res.misprintAt, 2);
});

test('checkOrder: salah saat kurang blok', () => {
  assert.equal(checkOrder(q, order.slice(0, -1)).ok, false);
});

test('misprintAmount: 0 untuk susunan benar, > 0 untuk salah', () => {
  assert.equal(misprintAmount(q, order), 0);
  const withDistractor = [...order];
  withDistractor[1] = 't-001-d1';
  assert.ok(misprintAmount(q, withDistractor) > 0);
  assert.ok(misprintAmount(q, withDistractor) <= 1);
});

test('misprintAmount: semua salah → 1 (maksimum)', () => {
  const allWrong = order.map(() => 't-001-d1');
  assert.equal(misprintAmount(q, allWrong), 1);
});

test('isComplete: true hanya kalau jumlah blok cocok', () => {
  assert.equal(isComplete(q, order), true);
  assert.equal(isComplete(q, order.slice(0, 3)), false);
});

test('isCorrectBlock: memisahkan blok benar vs distraktor', () => {
  assert.equal(isCorrectBlock(q, 't-001-p1'), true);
  assert.equal(isCorrectBlock(q, 't-001-d1'), false);
});

test('pickQuestions: filter per level; level kosong → fallback semua', () => {
  const lv1 = pickQuestions(TYPESETTING_BANK, 1);
  assert.ok(lv1.length > 0);
  assert.ok(lv1.every((x) => x.level === 1));
  const none = pickQuestions(TYPESETTING_BANK, 99);
  assert.equal(none.length, TYPESETTING_BANK.length);
});

test('validateQuestion: bank soal valid semua', () => {
  for (const item of TYPESETTING_BANK) {
    const res = validateQuestion(item);
    assert.equal(res.ok, true, `${item.id}: ${res.errors.join(', ')}`);
  }
});

test('validateQuestion: menolak soal rusak', () => {
  assert.equal(validateQuestion(null).ok, false);
  assert.equal(validateQuestion({ id: 'x', parts: [{ id: 'a', jp: 'あ', pos: 'noun' }] }).ok, false); // < 2 blok
  assert.equal(validateQuestion({
    id: 'y',
    parts: [{ id: 'a', jp: 'あ', pos: 'noun' }, { id: 'a', jp: 'い', pos: 'noun' }],
  }).ok, false); // id duplikat
});

test('bank: id soal unik & tiap level terwakili', () => {
  const ids = TYPESETTING_BANK.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const lv of [1, 2, 3]) {
    assert.ok(pickQuestions(TYPESETTING_BANK, lv).some((x) => x.level === lv));
  }
});
