import test from 'node:test';
import assert from 'node:assert/strict';
import { breathPhase, breathScale, breathStopped, BREATH_PERIOD_MS } from './breathing.js';

test('breathPhase: 0..1 dan periodik (~6s)', () => {
  for (const t of [0, 1000, 3000, 6000]) {
    const p = breathPhase(t);
    assert.ok(p >= 0 && p <= 1, `t=${t} → ${p}`);
  }
  assert.equal(breathPhase(0), breathPhase(BREATH_PERIOD_MS));
});

test('breathPhase: puncak di tengah periode', () => {
  assert.ok(breathPhase(BREATH_PERIOD_MS / 2) > 0.99);
});

test('breathScale: halus di sekitar 1 (±5%)', () => {
  for (const t of [0, 1500, 3000, 4500, 6000]) {
    const s = breathScale(t);
    assert.ok(Math.abs(s - 1) <= 0.05, `t=${t} → ${s}`);
  }
});

test('breathStopped: ikut flag frozen', () => {
  assert.equal(breathStopped(true), true);
  assert.equal(breathStopped(false), false);
});
