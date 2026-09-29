import test from 'node:test';
import assert from 'node:assert/strict';
import { VISUALS, getVisual } from './visuals.js';

test('VISUALS punya ink, hina, dummy, gojo, yuji, sukuna, megumi, nobara & nanami', () => {
  assert.deepEqual(Object.keys(VISUALS).sort(), ['dummy', 'gojo', 'hina', 'ink', 'megumi', 'nanami', 'nobara', 'sukuna', 'yuji']);
});

test('getVisual fallback null', () => {
  assert.equal(getVisual('nope'), null);
  assert.equal(getVisual('ink')?.label, 'Washi Ink');
  assert.equal(getVisual('hina')?.label, 'Hina Reaction');
  assert.equal(getVisual('dummy')?.component, 'dummy');
  assert.equal(getVisual('gojo')?.component, 'gojo');
  assert.equal(getVisual('yuji')?.component, 'yuji');
  assert.match(getVisual('yuji')?.label, /Yuji/);
  assert.equal(getVisual('sukuna')?.component, 'sukuna');
  assert.match(getVisual('sukuna')?.label, /Sukuna/);
  assert.equal(getVisual('megumi')?.component, 'megumi');
  assert.match(getVisual('megumi')?.label, /Megumi/);
  assert.equal(getVisual('nobara')?.component, 'nobara');
  assert.match(getVisual('nobara')?.label, /Nobara/);
  assert.equal(getVisual('nanami')?.component, 'nanami');
  assert.match(getVisual('nanami')?.label, /Nanami/);
});
