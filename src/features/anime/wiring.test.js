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

test('voice 多元 = PUNYA KLIP SENDIRI (bukan generik) + synth tetap fallback', () => {
  for (const c of CHARACTERS) {
    const v = VOICES[c.voice];
    assert.ok(v, `VOICES.${c.voice} hilang`);
    // Karakter 多元 sekarang punya suara sendiri (9 klip TTS) — bukan KOSONG.
    assert.equal(v.files.correct.length, 3, `${c.voice}: 3 klip correct`);
    assert.equal(v.files.wrong.length, 3, `${c.voice}: 3 klip wrong`);
    assert.equal(v.files.streak.length, 3, `${c.voice}: 3 klip streak`);
    assert.ok(v.synth?.correct, `${c.voice}: synth tetap jadi fallback`);
  }
});

test('visual 多元 terdaftar (siluet generik)', () => {
  for (const c of CHARACTERS) {
    assert.ok(VISUALS[c.effect], `VISUALS.${c.effect} hilang`);
  }
});
