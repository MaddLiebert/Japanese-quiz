import test from 'node:test';
import assert from 'node:assert/strict';
import { glitchChance, glitchIntensity, shouldGlitch, glitchAllowed, GLITCH_MIN_LEVEL, glitchChanceAnime, glitchIntensityAnime, GLITCH_MIN_LEVEL_ANIME } from './glitch.js';

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

// ── 多元 A9: varian PALING KUAT ──────────────────────────────────────────────
test('glitchChanceAnime: 0 di bawah 150; 0.20 di Lv 300', () => {
  assert.equal(glitchChanceAnime(149), 0);
  assert.equal(glitchChanceAnime(150), 0);
  assert.equal(glitchChanceAnime(300), 0.20);
  assert.ok(glitchChanceAnime(200) > 0 && glitchChanceAnime(200) < 0.20);
});

test('glitchChanceAnime: plafon lebih tinggi dari Meiji (0.20 > 0.12)', () => {
  // "Paling kuat" = plafon (Lv 300), bukan tiap level: ramp anime lebih pendek
  // (150→300) dari Meiji (50→300), jadi di level menengah Meiji bisa lebih besar.
  assert.equal(glitchChanceAnime(300), 0.20);
  assert.ok(glitchChanceAnime(300) > glitchChance(300)); // 0.20 > 0.12
  assert.equal(glitchChance(300), 0.12);
});

test('glitchIntensityAnime: 0..1 (300 = 1 = permanen)', () => {
  assert.equal(glitchIntensityAnime(150), 0);
  assert.equal(glitchIntensityAnime(300), 1);
  assert.equal(glitchIntensityAnime(100), 0);
});

test('GLITCH_MIN_LEVEL_ANIME = 150 (gerbang 多元)', () => {
  assert.equal(GLITCH_MIN_LEVEL_ANIME, 150);
});
