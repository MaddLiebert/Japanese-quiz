import test from 'node:test';
import assert from 'node:assert/strict';
import { MIC_BAR_COUNT, spectrumBars, displayHeights } from './micSpectrum.js';

test('spectrumBars: data kosong/null → semua nol sepanjang barCount', () => {
  assert.deepEqual(spectrumBars(null), new Array(MIC_BAR_COUNT).fill(0));
  assert.deepEqual(spectrumBars([], 4), [0, 0, 0, 0]);
  assert.equal(spectrumBars([1, 2, 3], 8).length, 8);
});

test('spectrumBars: nilai ekstrem → 0 atau 1', () => {
  assert.deepEqual(spectrumBars([0, 0, 0, 0], 2), [0, 0]);
  assert.deepEqual(spectrumBars([255, 255, 255, 255], 2), [1, 1]);
});

test('spectrumBars: rata-rata per band (band beda → bar beda)', () => {
  assert.deepEqual(spectrumBars([255, 255, 0, 0], 2), [1, 0]);
  assert.deepEqual(spectrumBars([0, 255, 0, 255], 2), [0.5, 0.5]);
});

test('spectrumBars: barCount tak wajar → minimal 1 bar', () => {
  assert.equal(spectrumBars([1, 2], 0).length, 1);
  assert.equal(spectrumBars([1, 2], -3).length, 1);
  assert.equal(spectrumBars([1, 2], NaN).length, 1);
});

test('displayHeights: minimum, clamp, dan input bukan array', () => {
  assert.deepEqual(displayHeights([0, 0.5, 1], 10), [10, 50, 100]);
  assert.deepEqual(displayHeights([1.5, -1], 8), [100, 8]);
  assert.deepEqual(displayHeights(null, 8), []);
});
