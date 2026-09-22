import test from 'node:test';
import assert from 'node:assert/strict';
import { VISUALS, getVisual } from './visuals.js';

test('VISUALS punya ink & dummy', () => {
  assert.deepEqual(Object.keys(VISUALS).sort(), ['dummy', 'ink']);
});

test('getVisual fallback null', () => {
  assert.equal(getVisual('nope'), null);
  assert.equal(getVisual('ink')?.label, 'Washi Ink');
  assert.equal(getVisual('dummy')?.component, 'dummy');
});
