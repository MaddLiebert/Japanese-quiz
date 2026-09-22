import test from 'node:test';
import assert from 'node:assert/strict';
import { streakGongParams } from './sfx.js';

const LEVELS = [1, 2, 3, 5, 7, 10, 12];

test('base frequency ada di rentang audible speaker (180-400 Hz)', () => {
  for (const l of LEVELS) {
    const { base } = streakGongParams(l);
    assert.ok(base >= 180 && base <= 400, `level ${l}: base ${base}Hz di luar 180-400`);
  }
});

test('semua partial ada di rentang audible dan ada konten >= 500 Hz', () => {
  for (const l of LEVELS) {
    const { partials } = streakGongParams(l);
    assert.ok(partials.length >= 2, `level ${l}: partial terlalu sedikit`);
    for (const p of partials) {
      assert.ok(p.freq >= 180 && p.freq <= 5000, `level ${l}: partial ${p.freq}Hz di luar rentang`);
      assert.ok(p.gain > 0 && p.gain <= 0.6, `level ${l}: gain partial ${p.gain} tidak sehat`);
    }
    assert.ok(partials.some(p => p.freq >= 500), `level ${l}: tidak ada partial >= 500Hz (bakal senyap)`);
  }
});

test('total energi cukup keras tapi tidak clipping', () => {
  for (const l of LEVELS) {
    const { partials } = streakGongParams(l);
    const sum = partials.reduce((a, p) => a + p.gain, 0);
    assert.ok(sum >= 0.4 && sum <= 1.2, `level ${l}: total gain ${sum.toFixed(3)} di luar 0.4-1.2`);
  }
});

test('durasi wajar', () => {
  for (const l of LEVELS) {
    const { dur } = streakGongParams(l);
    assert.ok(dur >= 0.8 && dur <= 3.5, `level ${l}: dur ${dur} di luar 0.8-3.5s`);
  }
});

test('intensitas non-menurun saat streak naik (partial & dur)', () => {
  let prevCount = 0;
  let prevDur = 0;
  for (const l of LEVELS) {
    const { partials, dur } = streakGongParams(l);
    assert.ok(partials.length >= prevCount, `level ${l}: jumlah partial turun`);
    assert.ok(dur >= prevDur, `level ${l}: dur turun`);
    prevCount = partials.length;
    prevDur = dur;
  }
});

test('transient strike makin terang saat tier tinggi', () => {
  const low = streakGongParams(1).strike;
  const high = streakGongParams(12).strike;
  assert.ok(high.freq >= low.freq, 'frekuensi strike harus naik');
  assert.ok(high.gain >= low.gain, 'gain strike harus naik');
});
