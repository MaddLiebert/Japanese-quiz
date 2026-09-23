import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HINA_RIBBON_COLORS, hinaRibbonColors,
  HINA_RIBBON_KINDS, hinaRibbonSegments,
  HINA_RIBBON_VIEWBOX, HINA_RIBBON_STROKE,
} from './hinaRibbon.js';

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

test('hinaRibbonSegments: front/back/bow ada, tiap jenis unik', () => {
  const seen = new Set();
  for (const k of HINA_RIBBON_KINDS) {
    const s = hinaRibbonSegments(k);
    assert.ok(s.front.startsWith('M'), 'front harus path M...');
    assert.ok(s.back.startsWith('M'), 'back harus path M...');
    assert.ok(s.bow.startsWith('M'), 'bow harus path M...');
    assert.notEqual(s.front, s.back);
    seen.add(`${s.front}|${s.back}|${s.bow}`);
  }
  assert.equal(seen.size, 3, 'tiap jenis punya geometri berbeda');
});

test('hinaRibbonSegments: fallback = correct', () => {
  assert.deepEqual(hinaRibbonSegments('nope'), hinaRibbonSegments('correct'));
});

test('konstanta: viewBox & stroke wajar', () => {
  assert.match(HINA_RIBBON_VIEWBOX, /^0 0 \d+ \d+$/);
  assert.ok(HINA_RIBBON_STROKE.width > HINA_RIBBON_STROKE.highlight);
  assert.ok(HINA_RIBBON_STROKE.highlight > 0);
});
