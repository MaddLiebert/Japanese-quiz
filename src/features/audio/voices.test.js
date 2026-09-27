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

test('voice hina: correct kosong (Hina benar hanya di streak), 3 wrong / 6 streak + overlay', () => {
  const v = VOICES.hina;
  assert.ok(v, 'VOICES.hina harus ada');
  assert.deepEqual(v.files.correct, [], 'Hina tidak bunyi di jawaban benar biasa');
  assert.equal(v.files.wrong.length, 3);
  assert.equal(v.files.streak.length, 6);
  assert.deepEqual(v.overlays.correct, ['/voices/hina/rightanswer.mp3']);
  assert.deepEqual(v.overlays.wrong, ['/voices/hina/wronganswer.mp3']);
});

test('semua path hina unik & menunjuk ke /voices/hina/', () => {
  const v = VOICES.hina;
  const all = [
    ...v.files.correct, ...v.files.wrong, ...v.files.streak,
    ...v.overlays.correct, ...v.overlays.wrong,
  ];
  assert.equal(all.length, 11);   // 0 correct + 3 wrong + 6 streak + 1 + 1 overlay
  assert.equal(new Set(all).size, 11, 'tidak boleh ada path duplikat');
  for (const p of all) assert.match(p, /^\/voices\/hina\/[a-z0-9_]+\.mp3$/);
});

test('getVoice("hina") mengembalikan voice hina', () => {
  assert.equal(getVoice('hina'), VOICES.hina);
});

test('voice gojo: 4 klip kalah (wrong) + 4 klip teknik/cast (clips)', () => {
  const v = VOICES.gojo;
  assert.ok(v, 'VOICES.gojo harus ada');
  assert.deepEqual(v.files.correct, [], 'teknik diputar deterministik, bukan random');
  assert.equal(v.files.wrong.length, 4, '4 klip "gojo kalah"');
  assert.deepEqual(v.files.streak, [], '茈 tanpa klip — GIF yang bicara');
  assert.equal(v.clips.length, 4, 'ao, aka, Murasaki, ryoiki tenkai');
  for (const p of [...v.files.wrong, ...v.clips]) assert.match(p, /^\/voices\/gojo\/.+\.mp3$/);
  assert.equal(new Set([...v.files.wrong, ...v.clips]).size, 8, 'tidak boleh duplikat');
  assert.equal(getVoice('gojo'), VOICES.gojo);
});


test('voice JJK placeholder: 7 key terdaftar & reachable (bukan fallback taiko)', () => {
  const keys = ['nobara', 'yuji', 'megumi', 'nanami', 'yuta', 'toji', 'sukuna'];
  for (const k of keys) {
    assert.ok(VOICES[k], `VOICES.${k} harus ada`);
    assert.equal(getVoice(k), VOICES[k], `getVoice('${k}') harus voice-nya sendiri`);
  }
});


test('voice nobara: 3 correct + 3 wrong + 3 streak, path unik & valid', () => {
  const v = VOICES.nobara;
  assert.ok(v, 'VOICES.nobara harus ada');
  assert.equal(v.files.correct.length, 3);
  assert.equal(v.files.wrong.length, 3);
  assert.equal(v.files.streak.length, 3);
  const all = [...v.files.correct, ...v.files.wrong, ...v.files.streak];
  assert.equal(new Set(all).size, 9, 'tidak boleh ada path duplikat');
  for (const p of all) assert.match(p, /^\/voices\/nobara\/[a-z0-9_]+\.mp3$/);
});


test('voice yuji: 3 klip kalah (wrong) + 8 klip teknik (clips) — pola Gojo', () => {
  const v = VOICES.yuji;
  assert.ok(v, 'VOICES.yuji harus ada');
  assert.deepEqual(v.files.correct, [], 'teknik diputar deterministik, bukan random');
  assert.equal(v.files.wrong.length, 3, '3 klip kalah: kuso/madada/shimata');
  assert.deepEqual(v.files.streak, [], '宿儺の器 = teks doang, tanpa klip streak');
  assert.equal(v.clips.length, 8, 'keiteiken, manjigeri, kokusen, senketsu, kai, hachi, fuga, zakome');
  for (const p of [...v.files.wrong, ...v.clips]) assert.match(p, /^\/voices\/yuji\/[a-z0-9_]+\.mp3$/);
  assert.equal(new Set([...v.files.wrong, ...v.clips]).size, 11, 'tidak boleh duplikat');
  assert.equal(getVoice('yuji'), VOICES.yuji);
});


test('voice megumi: 3 correct + 3 wrong + 3 streak, path unik & valid', () => {
  const v = VOICES.megumi;
  assert.ok(v, 'VOICES.megumi harus ada');
  assert.equal(v.files.correct.length, 3);
  assert.equal(v.files.wrong.length, 3);
  assert.equal(v.files.streak.length, 3);
  const all = [...v.files.correct, ...v.files.wrong, ...v.files.streak];
  assert.equal(new Set(all).size, 9, 'tidak boleh ada path duplikat');
  for (const p of all) assert.match(p, /^\/voices\/megumi\/[a-z0-9_]+\.mp3$/);
});


test('voice nanami: 3 correct + 3 wrong + 3 streak, path unik & valid', () => {
  const v = VOICES.nanami;
  assert.ok(v, 'VOICES.nanami harus ada');
  assert.equal(v.files.correct.length, 3);
  assert.equal(v.files.wrong.length, 3);
  assert.equal(v.files.streak.length, 3);
  const all = [...v.files.correct, ...v.files.wrong, ...v.files.streak];
  assert.equal(new Set(all).size, 9, 'tidak boleh ada path duplikat');
  for (const p of all) assert.match(p, /^\/voices\/nanami\/[a-z0-9_]+\.mp3$/);
});


test('voice yuta: 3 correct + 3 wrong + 3 streak, path unik & valid', () => {
  const v = VOICES.yuta;
  assert.ok(v, 'VOICES.yuta harus ada');
  assert.equal(v.files.correct.length, 3);
  assert.equal(v.files.wrong.length, 3);
  assert.equal(v.files.streak.length, 3);
  const all = [...v.files.correct, ...v.files.wrong, ...v.files.streak];
  assert.equal(new Set(all).size, 9, 'tidak boleh ada path duplikat');
  for (const p of all) assert.match(p, /^\/voices\/yuta\/[a-z0-9_]+\.mp3$/);
});


test('voice toji: 3 correct + 3 wrong + 3 streak, path unik & valid', () => {
  const v = VOICES.toji;
  assert.ok(v, 'VOICES.toji harus ada');
  assert.equal(v.files.correct.length, 3);
  assert.equal(v.files.wrong.length, 3);
  assert.equal(v.files.streak.length, 3);
  const all = [...v.files.correct, ...v.files.wrong, ...v.files.streak];
  assert.equal(new Set(all).size, 9, 'tidak boleh ada path duplikat');
  for (const p of all) assert.match(p, /^\/voices\/toji\/[a-z0-9_]+\.mp3$/);
});


test('voice sukuna: 3 correct + 3 wrong + 3 streak, path unik & valid', () => {
  const v = VOICES.sukuna;
  assert.ok(v, 'VOICES.sukuna harus ada');
  assert.equal(v.files.correct.length, 3);
  assert.equal(v.files.wrong.length, 3);
  assert.equal(v.files.streak.length, 3);
  const all = [...v.files.correct, ...v.files.wrong, ...v.files.streak];
  assert.equal(new Set(all).size, 9, 'tidak boleh ada path duplikat');
  for (const p of all) assert.match(p, /^\/voices\/sukuna\/[a-z0-9_]+\.mp3$/);
});
