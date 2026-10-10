// wiring.test.js — penjaga E15: karakter 多元 (A16) benar-benar TERHUBUNG ke
// registry voice & visual yang dipakai app. Kalau key di characters.js berubah
// tanpa menambah entri registry, test ini gagal (bukan sekadar lulus di unit
// test terisolasi). Lihat SPEC: docs/tema/anime-mekanik.md §A16.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS, validateCharacters, validateCharacterData } from './characters.js';
import { FRANCHISES } from './franchises.js';
import { VOICES } from '../audio/voices.js';
import { VISUALS } from '../effects/visuals.js';

test('tiap karakter 多元 punya voice & effect TERDAFTAR di registry app', () => {
  assert.deepEqual(validateCharacters(VOICES, VISUALS), []);
});

test('data karakter konsisten dengan franchise (fr → franchise ada)', () => {
  assert.deepEqual(validateCharacterData(CHARACTERS, FRANCHISES), []);
});

test('voice 多元 = fallback synth (aset menyusul, tidak error)', () => {
  for (const c of CHARACTERS) {
    const v = VOICES[c.voice];
    assert.ok(v, `VOICES.${c.voice} hilang`);
    assert.deepEqual(v.files.correct, [], `${c.voice}: files.correct harus kosong sampai aset siap`);
    assert.ok(v.synth?.correct, `${c.voice}: butuh fallback synth`);
  }
});

test('visual 多元 terdaftar (siluet generik)', () => {
  for (const c of CHARACTERS) {
    assert.ok(VISUALS[c.effect], `VISUALS.${c.effect} hilang`);
  }
});
