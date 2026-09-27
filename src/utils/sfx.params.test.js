import test from 'node:test';
import assert from 'node:assert/strict';
import { streakGongParams, domainBoomParams } from './sfx.js';

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

// ── Dentuman domain 領域展開 (cinematic) ────────────────────────────────────

test('domainBoomParams: sweep turun, angka sehat', () => {
  for (const kind of ['cast', 'bang']) {
    const p = domainBoomParams(kind);
    assert.ok(p.freqStart > p.freqEnd, `${kind}: sweep harus turun`);
    assert.ok(p.freqStart <= 400 && p.freqEnd >= 20, `${kind}: freq di rentang wajar`);
    assert.ok(p.dur >= 0.5 && p.dur <= 2, `${kind}: durasi wajar`);
    assert.ok(p.gain > 0 && p.gain <= 0.8, `${kind}: gain sehat`);
    assert.ok(p.noiseGain >= 0 && p.noiseGain <= 0.4, `${kind}: noise sehat`);
    // v2 (user tuning): dentuman kurang nendang. Lapisan punch mid wajib ada
    // supaya "thump" kedengaran di speaker HP/laptop (bukan cuma sub-bass).
    assert.ok(p.punchGain > 0 && p.punchGain <= 0.5, `${kind}: punch mid sehat`);
    assert.ok(p.punchFreq >= 120 && p.punchFreq <= 400, `${kind}: punch di mid-low`);
    assert.ok(p.punchDur > 0 && p.punchDur <= 0.5, `${kind}: punch pendek (thump)`);
  }
});

test('domainBoomParams: bang lebih besar dari cast', () => {
  const c = domainBoomParams('cast');
  const b = domainBoomParams('bang');
  assert.ok(b.gain > c.gain, 'bang lebih keras');
  assert.ok(b.dur > c.dur, 'bang lebih panjang');
  assert.ok(b.freqStart > c.freqStart, 'bang lebih "meledak"');
});

test('domainBoomParams: cast v2 lebih keras dari v1 (keluhan user)', () => {
  const c = domainBoomParams('cast');
  assert.ok(c.gain >= 0.45, 'cast dinaikkan dari 0.34 → terdengar di HP');
  assert.ok(c.punchGain >= 0.15, 'punch mid ikut dinaikkan');
  assert.ok(c.noiseGain >= 0.09, 'desis ruang ikut dinaikkan');
});
