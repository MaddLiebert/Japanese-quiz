import test from 'node:test';
import assert from 'node:assert/strict';
import { MIC_BAR_COUNT, spectrumBars, displayHeights, peakLevel, euclideanLevel, synthBars } from './micSpectrum.js';

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

test('peakLevel: puncak bar, aman untuk input kosong/aneh', () => {
  assert.equal(peakLevel([0, 0.4, 0.9, 0.2]), 0.9);
  assert.equal(peakLevel([0, 0, 0]), 0);
  assert.equal(peakLevel([2, -1]), 1);       // clamp ≤ 1
  assert.equal(peakLevel([]), 0);
  assert.equal(peakLevel(null), 0);
  assert.equal(peakLevel(undefined), 0);
});

test('euclideanLevel: RMS energi, 0 saat senyap, naik saat keras', () => {
  assert.equal(euclideanLevel([0, 0, 0, 0]), 0);
  assert.equal(euclideanLevel([255, 255, 255, 255]), 1);
  const quiet = euclideanLevel([20, 20, 20, 20]);
  const loud = euclideanLevel([200, 200, 200, 200]);
  assert.ok(loud > quiet, 'sinyal lebih keras harus level lebih tinggi');
  assert.equal(euclideanLevel(null), 0);
  assert.equal(euclideanLevel([]), 0);
});

test('synthBars: level 0 → semua nol; level naik → bar naik (deterministik)', () => {
  const silent = synthBars(0, MIC_BAR_COUNT);
  assert.equal(silent.length, MIC_BAR_COUNT);
  assert.deepEqual(silent, new Array(MIC_BAR_COUNT).fill(0));

  const mid = synthBars(0.5, MIC_BAR_COUNT);
  const loud = synthBars(1, MIC_BAR_COUNT);
  // Rata-rata naik seiring level.
  const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  assert.ok(avg(mid) > 0 && avg(loud) > avg(mid), 'bar harus ikut naik saat level naik');
  // Semua bar dalam 0..1.
  for (const v of loud) assert.ok(v >= 0 && v <= 1, `bar di luar 0..1: ${v}`);
  // Deterministik: level sama → hasil sama.
  assert.deepEqual(synthBars(0.7, 8), synthBars(0.7, 8));
  // Input aneh aman.
  assert.deepEqual(synthBars(NaN, 4), [0, 0, 0, 0]);
  assert.equal(synthBars(0.5, 0).length, 1);
});
