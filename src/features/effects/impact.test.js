// impact.test.js — penjaga modul murni A12 impact frame (features/effects/impact.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A12. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { IMPACT_MAX_STREAK, impactIntensity, impactFrame, impactAllowed } from './impact.js';

test('impactIntensity: 0..1 (10 = maksimum)', () => {
  assert.equal(impactIntensity(0), 0);
  assert.equal(impactIntensity(5), 0.5);
  assert.equal(impactIntensity(IMPACT_MAX_STREAK), 1);
  assert.equal(impactIntensity(99), 1);       // dijepit
  assert.equal(impactIntensity(-3), 0);       // dijepit
  assert.equal(impactIntensity('x'), 0);      // aman
});

test('impactFrame: none → burst → flash', () => {
  assert.equal(impactFrame(0), 'none');
  assert.equal(impactFrame(4), 'none');
  assert.equal(impactFrame(5), 'burst');
  assert.equal(impactFrame(9), 'burst');
  assert.equal(impactFrame(10), 'flash');
  assert.equal(impactFrame(50), 'flash');
});

test('impactAllowed: hormati reduced-motion & toggle', () => {
  assert.equal(impactAllowed({ reducedMotion: true, enabled: true }), false);
  assert.equal(impactAllowed({ reducedMotion: false, enabled: false }), false);
  assert.equal(impactAllowed({ reducedMotion: false, enabled: true }), true);
  assert.equal(impactAllowed(), true);        // default: aktif
});
