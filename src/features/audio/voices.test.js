import test from 'node:test';
import assert from 'node:assert/strict';
import { VOICES, getVoice, pickFile } from './voices.js';

test('getVoice fallback ke taiko untuk key tak dikenal', () => {
  assert.equal(getVoice('zzz'), VOICES.taiko);
  assert.equal(getVoice('dummy'), VOICES.dummy);
});

test('taiko & dummy tidak punya file (murni synth)', () => {
  assert.deepEqual(VOICES.taiko.files.correct, []);
  assert.deepEqual(VOICES.dummy.files.streak, []);
  assert.equal(VOICES.taiko.synth.correct, 'gong');
});

test('pickFile: kosong → null, list → salah satu isi', () => {
  assert.equal(pickFile([]), null);
  assert.equal(pickFile(null), null);
  assert.equal(pickFile(undefined), null);
  assert.ok(['a.mp3', 'b.mp3'].includes(pickFile(['a.mp3', 'b.mp3'])));
});

test('pickFile deterministik dengan rng inject', () => {
  assert.equal(pickFile(['a', 'b', 'c'], () => 0), 'a');
  assert.equal(pickFile(['a', 'b', 'c'], () => 0.99), 'c');
});
