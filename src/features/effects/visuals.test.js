import test from 'node:test';
import assert from 'node:assert/strict';
import { VISUALS, getVisual } from './visuals.js';

test('VISUALS punya ink, hina, dummy & gojo', () => {
  assert.deepEqual(Object.keys(VISUALS).sort(), ['dummy', 'gojo', 'hina', 'ink']);
});

test('getVisual fallback null', () => {
  assert.equal(getVisual('nope'), null);
  assert.equal(getVisual('ink')?.label, 'Washi Ink');
  assert.equal(getVisual('hina')?.label, 'Hina Reaction');
  assert.equal(getVisual('dummy')?.component, 'dummy');
  assert.equal(getVisual('gojo')?.component, 'gojo');
});
