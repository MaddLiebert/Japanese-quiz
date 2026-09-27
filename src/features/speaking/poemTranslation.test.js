import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  poemTranslation, translatedLine, translatedTitle, hasFullTranslation,
  POEM_TYPES, poemTypeLabel,
} from './poemTranslation.js';

// Modul murni tidak meng-import JSON; test memuat sendiri (pola fitur speaking).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const POEMS = JSON.parse(readFileSync(join(ROOT, 'src/data/poems.json'), 'utf8'));
const TR = JSON.parse(readFileSync(join(ROOT, 'src/data/poem-translations.json'), 'utf8'));

test('poemTranslation: entri & null-safe', () => {
  assert.deepEqual(poemTranslation({ a: { lines_id: ['x'] } }, 'a'), { lines_id: ['x'] });
  assert.equal(poemTranslation({}, 'a'), null);
  assert.equal(poemTranslation(null, 'a'), null);
});

test('translatedLine & translatedTitle: index-based, fallback kosong', () => {
  const t = { p: { title_id: 'Judul', lines_id: ['satu', 'dua'] } };
  assert.equal(translatedLine(t, 'p', 0, 'id'), 'satu');
  assert.equal(translatedLine(t, 'p', 9, 'id'), '');
  assert.equal(translatedLine(t, 'x', 0, 'id'), '');
  assert.equal(translatedTitle(t, 'p', 'id'), 'Judul');
  assert.equal(translatedTitle(t, 'x', 'id'), '');
});

test('translatedLine/Title: pilih bahasa aktif, fallback ke bahasa lain', () => {
  const t = { p: { title_id: 'Judul', title_en: 'Title', lines_id: ['satu'], lines_en: ['one'] } };
  // bahasa EN → pakai *_en
  assert.equal(translatedLine(t, 'p', 0, 'en'), 'one');
  assert.equal(translatedTitle(t, 'p', 'en'), 'Title');
  // bahasa ID → pakai *_id
  assert.equal(translatedLine(t, 'p', 0, 'id'), 'satu');
  assert.equal(translatedTitle(t, 'p', 'id'), 'Judul');
  // hanya ada ID, minta EN → fallback ke ID (bukan kosong)
  const onlyId = { p: { title_id: 'Judul', lines_id: ['satu'] } };
  assert.equal(translatedLine(onlyId, 'p', 0, 'en'), 'satu');
  assert.equal(translatedTitle(onlyId, 'p', 'en'), 'Judul');
});

test('hasFullTranslation: butuh jumlah baris persis & tak kosong (per bahasa)', () => {
  const poem = { id: 'p', lines: [{}, {}] };
  assert.equal(hasFullTranslation({ p: { lines_id: ['a', 'b'] } }, poem, 'id'), true);
  assert.equal(hasFullTranslation({ p: { lines_id: ['a'] } }, poem, 'id'), false);
  assert.equal(hasFullTranslation({ p: { lines_id: ['a', ''] } }, poem, 'id'), false);
  assert.equal(hasFullTranslation({ p: { lines_en: ['a', 'b'] } }, poem, 'en'), true);
  assert.equal(hasFullTranslation({ p: { lines_id: ['a', 'b'] } }, poem, 'en'), false, 'EN kosong saat minta EN');
  assert.equal(hasFullTranslation({}, poem, 'id'), false);
});

test('poemTypeLabel: EN & ID, fallback ke tipe mentah', () => {
  assert.equal(poemTypeLabel('haiku', 'id'), 'Haiku');
  assert.equal(poemTypeLabel('haiku', 'en'), 'Haiku');
  assert.equal(poemTypeLabel('free', 'id'), 'Bebas');
  assert.equal(poemTypeLabel('free', 'en'), 'Free Verse');
  assert.equal(poemTypeLabel('unknown', 'en'), 'unknown');
  assert.equal(poemTypeLabel(null, 'en'), '');
  assert.deepEqual(Object.keys(POEM_TYPES).sort(), ['free', 'haiku', 'tanka']);
});

test('poem-translations.json: SEMUA puisi punya terjemahan ID lengkap + judul', () => {
  assert.equal(Object.keys(TR).length, POEMS.length);
  for (const p of POEMS) {
    assert.ok(hasFullTranslation(TR, p, 'id'), `terjemahan ID ${p.id} tidak lengkap`);
    assert.ok(translatedTitle(TR, p.id, 'id'), `judul ID ${p.id} kosong`);
  }
});

test('poem-translations.json: SEMUA puisi punya terjemahan EN lengkap + judul', () => {
  for (const p of POEMS) {
    assert.ok(hasFullTranslation(TR, p, 'en'), `terjemahan EN ${p.id} tidak lengkap`);
    assert.ok(translatedTitle(TR, p.id, 'en'), `judul EN ${p.id} kosong`);
  }
});
