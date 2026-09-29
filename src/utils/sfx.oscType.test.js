import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeOscType,
  ratioSlashParams, tieSnapParams,
  shadowRustleParams, worldCutSwingParams, bansouWaterParams, shadowSwallowParams,
} from './sfx.js';

// Bug ketangkap di verifikasi browser T6 (lolos dari unit test — pelajaran
// Nobara T6): nama tipe FILTER bocor ke OscillatorNode.type. Chrome menulis
// warning console tiap pemutaran ("'bandpass' is not a valid enum value of
// type OscillatorType") dan assignment-nya diabaikan (osc tetap sine).
// OscillatorNode hanya menerima bentuk gelombang dasar.

const VALID = ['sine', 'square', 'sawtooth', 'triangle'];

test('sanitizeOscType: bentuk gelombang dasar dibiarkan apa adanya', () => {
  for (const t of VALID) assert.equal(sanitizeOscType(t), t);
});

test('sanitizeOscType: nama filter & nilai asing → fallback sine (bunyi efektif lama)', () => {
  for (const t of ['bandpass', 'lowpass', 'highpass', 'notch', 'peaking', 'lowshelf', 'highshelf', 'allpass']) {
    assert.equal(sanitizeOscType(t), 'sine', `${t} harus fallback`);
  }
  assert.equal(sanitizeOscType(undefined), 'sine');
  assert.equal(sanitizeOscType(null), 'sine');
  assert.equal(sanitizeOscType(42), 'sine');
});

test('param sweep yang memakai nama filter aman utk OscillatorNode', () => {
  for (const fn of [ratioSlashParams, tieSnapParams, shadowRustleParams,
    worldCutSwingParams, bansouWaterParams, shadowSwallowParams]) {
    const p = fn();
    const oscType = sanitizeOscType(p.type);
    assert.ok(VALID.includes(oscType), `${fn.name}: '${p.type}' bocor ke osc.type`);
  }
});
