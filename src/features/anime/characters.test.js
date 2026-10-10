// characters.test.js — penjaga modul murni A16 必殺技 (features/anime/characters.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A16. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHARACTERS, characterById, charactersOf, characterVoice, characterEffect,
  characterHissatsu, characterFranchise, characterCredit,
  validateCharacters, validateCharacterData,
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

test('validateCharacterData: franchise rilis TANPA karakter → error; soon → diabaikan', () => {
  const errs = validateCharacterData([], FRANCHISES);
  // Hanya franchise 'live' yang wajib punya tokoh (dunia 'soon' = teaser).
  const liveCount = FRANCHISES.filter((f) => f.status !== 'soon').length;
  assert.equal(errs.length, liveCount);
  for (const f of FRANCHISES.filter((x) => x.status !== 'soon')) {
    assert.ok(errs.some((e) => e.includes(f.id)));
  }
  // Dunia 'soon' tidak menuntut karakter.
  for (const f of FRANCHISES.filter((x) => x.status === 'soon')) {
    assert.ok(!errs.some((e) => e.includes(f.id)));
  }
});

test('bank: tiap franchise RILIS punya ≥1 karakter & id unik', () => {
  const ids = CHARACTERS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const f of FRANCHISES.filter((x) => x.status !== 'soon')) {
    assert.ok(charactersOf(f.id).length >= 1, `franchise ${f.id} tanpa karakter`);
  }
});

// ── REVISI §6.4: karakter dunia ORISINAL tetap fiktif; dunia lisensi boleh IP
//    nyata (kredit ditanggung franchise). ────────────────────────────────────
test('§6.4 (orisinal): karakter dunia non-lisensi bebas nama berhak cipta', () => {
  const terlarang = ['gojo', 'sukuna', 'yuji', 'megumi', 'nobara', 'nanami', 'toji', 'yuta', 'naruto', 'luffy', 'goku', 'ichigo'];
  const orisinal = CHARACTERS.filter((c) => !franchiseById(c.fr)?.licensed);
  const blob = JSON.stringify(orisinal).toLowerCase();
  const found = terlarang.filter((n) => blob.includes(n));
  assert.deepEqual(found, [], `nama berhak cipta ditemukan: ${found.join(', ')}`);
});

test('JJK = wadah 8 karakter; kredit ditanggung franchise', () => {
  const jjk = charactersOf('jjk');
  assert.equal(jjk.length, 8, 'JJK memuat 8 tokoh');
  for (const c of jjk) {
    assert.equal(franchiseById(c.fr).licensed, true);
    assert.ok(characterCredit(c.id), `${c.id}: kredit franchise ada`);
  }
  assert.equal(characterFranchise('jjk_gojo').kanji, '呪術廻戦');
  assert.equal(characterCredit('hoshi_hikari'), null, 'dunia orisinal tanpa kredit');
});
