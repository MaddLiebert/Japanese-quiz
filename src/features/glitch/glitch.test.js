import test from 'node:test';
import assert from 'node:assert/strict';
import { glitchChance, glitchIntensity, shouldGlitch, glitchAllowed, GLITCH_MIN_LEVEL } from './glitch.js';

test('glitchChance: naik dengan level', () => {
  assert.ok(glitchChance(50) < glitchChance(200));
  assert.ok(glitchChance(300) <= 0.12);
});

test('glitchChance: 0 di bawah minLevel', () => {
  assert.equal(glitchChance(10), 0);
  assert.equal(glitchChance(49, GLITCH_MIN_LEVEL), 0);
});

test('glitchIntensity: 0..1', () => {
  assert.equal(glitchIntensity(10), 0);
  assert.equal(glitchIntensity(300), 1);
});

test('shouldGlitch: deterministik dgn rng tetap', () => {
  assert.equal(shouldGlitch(300, 0.0), true);   // chance 0.12 > 0
  assert.equal(shouldGlitch(300, 0.5), false);
  assert.equal(shouldGlitch(10, 0.0), false);   // di bawah minLevel
});

test('glitchAllowed: mati di reduced-motion / toggle off', () => {
  assert.equal(glitchAllowed({ reducedMotion: true, enabled: true }), false);
  assert.equal(glitchAllowed({ reducedMotion: false, enabled: false }), false);
  assert.equal(glitchAllowed({ reducedMotion: false, enabled: true }), true);
});
