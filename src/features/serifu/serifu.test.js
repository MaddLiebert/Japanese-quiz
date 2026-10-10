// serifu.test.js — penjaga modul murni A3 セリフ組み (features/serifu/serifu.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A3. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SERIFU, SERIFU_POS, POS_COLORS, posColor, isSmallBlock,
  serifuById, bubblesOf, buildPool, correctOrder, checkOrder, bubbleAmount,
  isComplete, validateBubble, validateSerifu, validateSerifuBank,
} from './serifu.js';
import { buildPool as tsBuildPool } from '../typesetting/typesetting.js';

const scene = serifuById('s-001');
const bubble = scene.bubbles[0];            // saku: おはよう ！
const order = correctOrder(bubble);          // ['p1','p2']

test('serifuById: dikenal → objek; tak dikenal → null', () => {
  assert.equal(serifuById('s-001').scene_jp, '教室、朝。');
  assert.equal(serifuById('nope'), null);
});

test('bubblesOf: daftar balon; adegan null → []', () => {
  assert.equal(bubblesOf(scene).length, 2);
  assert.deepEqual(bubblesOf(null), []);
});

test('posColor: kelas kata → token; tak dikenal → sumi', () => {
  assert.equal(posColor('greeting'), 'sora');
  assert.equal(posColor('particle'), 'sakura');
  assert.equal(posColor('ngawur'), 'sumi');
});

test('isSmallBlock: partikel & tanda baca = blok kecil', () => {
  assert.equal(isSmallBlock('particle'), true);
  assert.equal(isSmallBlock('punct'), true);
  assert.equal(isSmallBlock('noun'), false);
});

test('buildPool: deterministik & = inti typesetting Meiji (DRY)', () => {
  const a = buildPool(bubble, 42).map((b) => b.id);
  const b = buildPool(bubble, 42).map((b) => b.id);
  assert.deepEqual(a, b);
  // Delegasi ke modul Meiji: hasil identik.
  assert.deepEqual(a, tsBuildPool(bubble, 42).map((x) => x.id));
});

test('buildPool: berisi semua blok (benar + distraktor), tanpa duplikat', () => {
  const pool = buildPool(bubble, 7);
  const ids = pool.map((b) => b.id);
  assert.equal(ids.length, bubble.parts.length + bubble.distractors.length);
  assert.equal(new Set(ids).size, ids.length);
});

test('checkOrder: benar saat urut benar', () => {
  const res = checkOrder(bubble, order);
  assert.equal(res.ok, true);
  assert.equal(res.wrongAt, -1);
});

test('checkOrder: salah saat ada distraktor (wrongAt = posisi salah)', () => {
  const res = checkOrder(bubble, ['d1', 'p2']);
  assert.equal(res.ok, false);
  assert.equal(res.wrongAt, 0);
});

test('checkOrder: salah saat urutan tertukar', () => {
  const s2 = serifuById('s-002').bubbles[0]; // p1..p4
  const ord = correctOrder(s2);
  const swapped = [...ord];
  [swapped[1], swapped[2]] = [swapped[2], swapped[1]];
  const res = checkOrder(s2, swapped);
  assert.equal(res.ok, false);
  assert.equal(res.wrongAt, 1);
});

test('checkOrder: salah saat kurang blok', () => {
  assert.equal(checkOrder(bubble, order.slice(0, -1)).ok, false);
});

test('bubbleAmount: 0 benar, >0 salah (maks 1)', () => {
  assert.equal(bubbleAmount(bubble, order), 0);
  const bad = bubbleAmount(bubble, ['d1', 'p2']);
  assert.ok(bad > 0 && bad <= 1);
});

test('isComplete: true hanya kalau jumlah blok cocok', () => {
  assert.equal(isComplete(bubble, order), true);
  assert.equal(isComplete(bubble, ['p1']), false);
});

test('bank: valid semua', () => {
  assert.deepEqual(validateSerifuBank(SERIFU), []);
});

test('validateBubble: menolak balon rusak', () => {
  assert.equal(validateBubble(null).ok, false);
  assert.equal(validateBubble({ who: 'x', parts: [] }).ok, false);           // parts < 1
  assert.equal(validateBubble({ who: 'x', parts: [{ id: 'a', jp: 'あ', pos: 'ngawur' }] }).ok, false); // pos asing
  assert.equal(validateBubble({
    who: 'x',
    parts: [{ id: 'a', jp: 'あ', pos: 'noun' }, { id: 'a', jp: 'い', pos: 'noun' }],
  }).ok, false);                                                              // id duplikat
});

test('validateSerifu: menangkap id blok duplikat LINTAS balon', () => {
  const bad = {
    id: 's-x', scene_jp: 'x', translation: 'x',
    bubbles: [
      { who: 'a', parts: [{ id: 'dup', jp: 'あ', pos: 'noun' }], distractors: [] },
      { who: 'b', parts: [{ id: 'dup', jp: 'い', pos: 'noun' }], distractors: [] },
    ],
  };
  assert.equal(validateSerifu(bad).ok, false);
  assert.ok(validateSerifu(bad).errors.some((e) => e.includes('lintas balon')));
});

test('bank: id adegan unik & tiap balon punya who', () => {
  const ids = SERIFU.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of SERIFU) {
    for (const b of s.bubbles) assert.ok(b.who, `${s.id}: balon tanpa who`);
  }
});

test('pos yang dipakai bank semua terdaftar di SERIFU_POS', () => {
  for (const s of SERIFU) {
    for (const b of s.bubbles) {
      for (const blk of [...b.parts, ...b.distractors]) {
        assert.ok(SERIFU_POS.includes(blk.pos), `${s.id}: pos '${blk.pos}' tak terdaftar`);
        assert.ok(POS_COLORS[blk.pos], `${s.id}: warna untuk '${blk.pos}' tak ada`);
      }
    }
  }
});
