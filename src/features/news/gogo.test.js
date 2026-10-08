import test from 'node:test';
import assert from 'node:assert/strict';
import { isGogoWindow, gogoHeadline, canShowGogo } from './gogo.js';

test('isGogoWindow: 00–04 nyata', () => {
  assert.equal(isGogoWindow(2), true);
  assert.equal(isGogoWindow(0), true);
  assert.equal(isGogoWindow(3), true);
  assert.equal(isGogoWindow(4), false);
  assert.equal(isGogoWindow(12), false);
});

test('gogoHeadline: dari stats nyata', () => {
  const h = gogoHeadline({ daysActive: 47, kanjiMastered: 30, streak: 12 });
  assert.match(h, /47/);
  assert.match(h, /30/);
});

test('canShowGogo: maks 1×/hari', () => {
  assert.equal(canShowGogo('2026-10-07', '2026-10-08'), true);
  assert.equal(canShowGogo('2026-10-08', '2026-10-08'), false);
  assert.equal(canShowGogo(null, '2026-10-08'), true);
});
