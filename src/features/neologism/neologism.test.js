import test from 'node:test';
import assert from 'node:assert/strict';
import { NEOLOGISMS, checkNeologism, remainingKanji, neologismById } from './neologism.js';

test('checkNeologism: cocok saat kanji benar & urut', () => {
  const item = neologismById('philosophy');
  assert.equal(checkNeologism(item, ['哲', '学']).ok, true);
});

test('checkNeologism: urutan salah → false', () => {
  const item = neologismById('philosophy');
  assert.equal(checkNeologism(item, ['学', '哲']).ok, false);
});

test('checkNeologism: kata lain → false', () => {
  const item = neologismById('science');
  assert.equal(checkNeologism(item, ['自', '由']).ok, false);
});

test('checkNeologism: item null → tidak crash', () => {
  assert.deepEqual(checkNeologism(null, ['哲']), { ok: false, exact: false });
});

test('remainingKanji: buang kanji yang sudah terpakai', () => {
  const item = neologismById('freedom');
  assert.deepEqual(remainingKanji(item, ['自']), ['由', '民', '権']);
});

test('tiap neologisme punya answer dari pool-nya sendiri', () => {
  for (const n of NEOLOGISMS) {
    for (const k of [...n.answer]) assert.ok(n.pool.includes(k), `${n.id}: ${k} tak di pool`);
  }
});
