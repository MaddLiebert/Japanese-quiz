import test from 'node:test';
import assert from 'node:assert/strict';
import { reelTickParams, fanfareParams } from './sfx.js';

test('reelTickParams: klik pendek & pelan (tidak nyaring)', () => {
  const { freq, dur, gain } = reelTickParams();
  assert.ok(freq >= 400 && freq <= 4000, `freq ${freq} di luar rentang audible`);
  assert.ok(dur > 0 && dur <= 0.1, `dur ${dur} terlalu panjang untuk tick`);
  assert.ok(gain > 0 && gain <= 0.3, `gain ${gain} terlalu keras untuk tick`);
});

test('fanfareParams: special = 5 nada, legendary = 4, rare = 3, common = 2', () => {
  assert.equal(fanfareParams('special').notes.length, 5);
  assert.equal(fanfareParams('legendary').notes.length, 4);
  assert.equal(fanfareParams('rare').notes.length, 3);
  assert.equal(fanfareParams('common').notes.length, 2);
});

test('fanfareParams: rarity tak dikenal diperlakukan seperti common', () => {
  assert.deepEqual(fanfareParams('ngawur').notes, fanfareParams('common').notes);
});

test('fanfareParams: nada naik (fanfare menang, bukan menurun)', () => {
  for (const r of ['common', 'rare', 'legendary', 'special']) {
    const { notes } = fanfareParams(r);
    for (let i = 1; i < notes.length; i++) {
      assert.ok(notes[i] > notes[i - 1], `${r}: nada ke-${i} tidak naik`);
    }
  }
});

test('fanfareParams: semua nada di rentang audible speaker (>= 400 Hz)', () => {
  for (const r of ['common', 'rare', 'legendary', 'special']) {
    for (const n of fanfareParams(r).notes) {
      assert.ok(n >= 400 && n <= 4000, `${r}: nada ${n}Hz di luar rentang`);
    }
  }
});

test('fanfareParams: durasi & gain sehat', () => {
  for (const r of ['common', 'rare', 'legendary', 'special']) {
    const { dur, gap, gain } = fanfareParams(r);
    assert.ok(dur > 0.05 && dur <= 0.5, `${r}: dur ${dur} tidak sehat`);
    assert.ok(gap >= 0 && gap <= 0.3, `${r}: gap ${gap} tidak sehat`);
    assert.ok(gain > 0 && gain <= 1, `${r}: gain ${gain} tidak sehat`);
  }
});
