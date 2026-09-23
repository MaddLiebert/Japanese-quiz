import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HINA_RIBBON_COLORS, hinaRibbonColors,
  HINA_RIBBON_KINDS, hinaRibbonSegments,
  HINA_RIBBON_VIEWBOX, HINA_RIBBON_STROKE,
} from './hinaRibbon.js';

const nums = (path) => (path.match(/-?\d+/g) || []).map(Number);

test('hinaRibbonColors: 3 jenis + fallback ke correct', () => {
  assert.deepEqual(Object.keys(HINA_RIBBON_COLORS).sort(), ['correct', 'streak', 'wrong']);
  assert.equal(hinaRibbonColors('nope'), HINA_RIBBON_COLORS.correct);
  for (const k of HINA_RIBBON_KINDS) {
    const c = hinaRibbonColors(k);
    for (const key of ['base', 'light', 'edge']) {
      assert.match(c[key], /^#[0-9a-f]{6}$/i, `${k}.${key} harus hex 6 digit`);
    }
  }
});

test('hinaRibbonSegments: 4 potongan ada, tiap jenis unik', () => {
  const seen = new Set();
  for (const k of HINA_RIBBON_KINDS) {
    const s = hinaRibbonSegments(k);
    for (const key of ['frontA', 'back', 'frontB', 'bow']) {
      assert.ok(s[key].startsWith('M'), `${k}.${key} harus path M...`);
    }
    seen.add(`${s.frontA}|${s.back}|${s.frontB}|${s.bow}`);
  }
  assert.equal(seen.size, 3, 'tiap jenis punya geometri berbeda');
});

test('stub kiri nyembul ke luar tepi (x negatif)', () => {
  for (const k of HINA_RIBBON_KINDS) {
    const xs = nums(hinaRibbonSegments(k).frontA);
    assert.ok(Math.min(...xs) <= -30, `${k}.frontA harus nyembul ke kiri (x <= -30)`);
  }
});

test('stub kanan nyembul ke luar tepi (x > 400)', () => {
  for (const k of HINA_RIBBON_KINDS) {
    const xs = nums(hinaRibbonSegments(k).frontB);
    assert.ok(Math.max(...xs) >= 430, `${k}.frontB harus nyembul ke kanan (x >= 430)`);
  }
});

test('kedua stub di TINGGI SAMA (biar terbaca satu pita)', () => {
  for (const k of HINA_RIBBON_KINDS) {
    const s = hinaRibbonSegments(k);
    // ambil y (bilangan kedua tiap pasangan) dari titik awal frontA & frontB
    const yA = nums(s.frontA)[1];
    const yB = nums(s.frontB)[1];
    assert.equal(yA, yB, `${k}: tinggi stub kiri & kanan harus sama`);
  }
});

test('hinaRibbonSegments: fallback = correct', () => {
  assert.deepEqual(hinaRibbonSegments('nope'), hinaRibbonSegments('correct'));
});

test('konstanta: viewBox & stroke wajar', () => {
  assert.match(HINA_RIBBON_VIEWBOX, /^0 0 \d+ \d+$/);
  assert.ok(HINA_RIBBON_STROKE.width > HINA_RIBBON_STROKE.highlight);
  assert.ok(HINA_RIBBON_STROKE.highlight > 0);
});
