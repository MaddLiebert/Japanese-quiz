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

test('voice hina terdaftar dengan 4 correct / 3 wrong / 6 streak', () => {
  const v = VOICES.hina;
  assert.ok(v, 'VOICES.hina harus ada');
  assert.equal(v.files.correct.length, 4);
  assert.equal(v.files.wrong.length, 3);
  assert.equal(v.files.streak.length, 6);
});

test('semua file hina ada di /voices/hina/ dan path unik', () => {
  const all = [
    ...VOICES.hina.files.correct,
    ...VOICES.hina.files.wrong,
    ...VOICES.hina.files.streak,
  ];
  assert.equal(all.length, 13);
  assert.equal(new Set(all).size, 13, 'tidak boleh ada path duplikat');
  for (const p of all) assert.match(p, /^\/voices\/hina\/[a-z]+_\d+\.mp3$/);
});

test('getVoice("hina") mengembalikan voice hina', () => {
  assert.equal(getVoice('hina'), VOICES.hina);
});
