// characters.test.js — penjaga modul murni A16 必殺技 (features/anime/characters.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A16. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHARACTERS, characterById, charactersOf, characterVoice, characterEffect,
  characterHissatsu, validateCharacters, validateCharacterData,
} from './characters.js';
import { FRANCHISES, franchiseById } from './franchises.js';

test('characterById: dikenal → objek; tak dikenal → null', () => {
  assert.equal(characterById('hoshi_hikari').name, 'Hikari');
  assert.equal(characterById('nope'), null);
});

test('charactersOf: filter per franchise', () => {
  const hoshi = charactersOf('hoshi');
  assert.ok(hoshi.length >= 1);
  assert.ok(hoshi.every((c) => c.fr === 'hoshi'));
  assert.deepEqual(charactersOf('nope'), []);
});

test('characterVoice / characterEffect: key per karakter; tak dikenal → null', () => {
  assert.equal(characterVoice('hoshi_hikari'), 'hoshi_hikari');
  assert.equal(characterEffect('hoshi_hikari'), 'hoshi');
  assert.equal(characterVoice('nope'), null);
  assert.equal(characterEffect('nope'), null);
});

test('characterHissatsu: jurus andalan (jp + id)', () => {
  assert.deepEqual(characterHissatsu('kage_kuro'), { jp: '影分身', id: 'Klona Bayangan' });
  assert.equal(characterHissatsu('nope'), null);
});

test('validateCharacters: [] saat semua voice/effect terdaftar', () => {
  const voices = Object.fromEntries(CHARACTERS.map((c) => [c.voice, {}]));
  const visuals = Object.fromEntries(CHARACTERS.map((c) => [c.effect, {}]));
  assert.deepEqual(validateCharacters(voices, visuals), []);
});

test('validateCharacters: melaporkan voice/effect yang hilang (aset menyusul)', () => {
  const errs = validateCharacters({}, {});
  assert.equal(errs.length, CHARACTERS.length * 2);
  assert.ok(errs.some((e) => e.includes("voice 'hoshi_hikari' tak terdaftar")));
  assert.ok(errs.some((e) => e.includes("effect 'hoshi' tak terdaftar")));
});

test('validateCharacters: mendeteksi sebagian registry saja', () => {
  const visuals = Object.fromEntries(CHARACTERS.map((c) => [c.effect, {}]));
  const errs = validateCharacters({}, visuals); // voice kosong → hanya error voice
  assert.equal(errs.length, CHARACTERS.length);
  assert.ok(errs.every((e) => e.includes('voice')));
});

test('validateCharacterData: data karakter valid semua (fr menunjuk franchise ada)', () => {
  assert.deepEqual(validateCharacterData(CHARACTERS, FRANCHISES), []);
});

test('validateCharacterData: menangkap fr yang bukan franchise terdaftar', () => {
  const bad = [{ id: 'x', name: 'X', kanji: 'X', voice: 'v', effect: 'e', hissatsu_jp: 'j', hissatsu_id: 'J', fr: 'nope' }];
  assert.ok(validateCharacterData(bad, FRANCHISES).some((e) => e.includes("fr 'nope'")));
});

test('validateCharacterData: menangkap franchise tanpa karakter', () => {
  const errs = validateCharacterData([], FRANCHISES);
  assert.equal(errs.length, FRANCHISES.length);
  for (const f of FRANCHISES) assert.ok(errs.some((e) => e.includes(f.id)));
});

test('bank: tiap franchise punya ≥1 karakter & id unik', () => {
  const ids = CHARACTERS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const f of FRANCHISES) {
    assert.ok(charactersOf(f.id).length >= 1, `franchise ${f.id} tanpa karakter`);
  }
});

test('hak cipta §6.4: tidak ada nama karakter berhak cipta', () => {
  const terlarang = ['gojo', 'sukuna', 'yuji', 'megumi', 'nobara', 'nanami', 'toji', 'yuta', 'naruto', 'luffy', 'goku', 'ichigo'];
  const blob = JSON.stringify(CHARACTERS).toLowerCase();
  const found = terlarang.filter((n) => blob.includes(n));
  assert.deepEqual(found, [], `nama berhak cipta ditemukan: ${found.join(', ')}`);
});
