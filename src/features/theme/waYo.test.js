// waYo.test.js — M2 和魂洋才 (rasio 和/洋 per perhentian).
// Lihat spec: docs/tema/meiji-mekanik.md §M2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WA_YO, waYoFor, waYoMix, waYoCss, DEFAULT_WA_YO } from './waYo.js';

test('waYoFor: rasio tiap perhentian sesuai tabel', () => {
  assert.deepEqual(waYoFor('yokohama'), { wa: 40, yo: 60 });
  assert.deepEqual(waYoFor('rokumeikan'), { wa: 15, yo: 85 });
  assert.deepEqual(waYoFor('shimbunsha'), { wa: 75, yo: 25 });
  assert.deepEqual(waYoFor('hakurankai'), { wa: 50, yo: 50 });
});

test('waYoFor: stop tak dikenal → default 50/50 (tidak melempar)', () => {
  assert.deepEqual(waYoFor('tidak-ada'), DEFAULT_WA_YO);
  assert.deepEqual(waYoFor(undefined), DEFAULT_WA_YO);
  assert.deepEqual(waYoFor(null), DEFAULT_WA_YO);
});

test('waYoFor: mengembalikan salinan (bukan referensi tabel)', () => {
  const a = waYoFor('ginza');
  a.wa = 999;
  assert.equal(waYoFor('ginza').wa, 35, 'tabel WA_YO tidak boleh termutasi');
});

test('waYoMix: rokumeikan paling Barat (ratio 和 rendah)', () => {
  const m = waYoMix('rokumeikan');
  assert.equal(m.wa, 15);
  assert.equal(m.yo, 85);
  assert.equal(m.ratio, 0.15);
});

test('waYoMix: shimbunsha paling Jepang (ratio 和 tinggi)', () => {
  const m = waYoMix('shimbunsha');
  assert.equal(m.ratio, 0.75);
});

test('waYoMix: total wa+yo selalu 100 di tabel', () => {
  for (const [id, v] of Object.entries(WA_YO)) {
    assert.equal(v.wa + v.yo, 100, `${id} harus berjumlah 100`);
  }
});

test('waYoCss: mengembalikan CSS var string untuk --wa-ratio/--yo-ratio', () => {
  const css = waYoCss('rokumeikan');
  assert.equal(css['--wa-ratio'], '0.15');
  assert.equal(css['--yo-ratio'], '0.85');
});

test('waYoCss: default saat stop tak dikenal', () => {
  const css = waYoCss('entah');
  assert.equal(css['--wa-ratio'], '0.5');
  assert.equal(css['--yo-ratio'], '0.5');
});
