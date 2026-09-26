import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  poemTranslation, translatedLine, translatedTitle, hasFullTranslation,
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
  assert.equal(translatedLine(t, 'p', 0), 'satu');
  assert.equal(translatedLine(t, 'p', 9), '');
  assert.equal(translatedLine(t, 'x', 0), '');
  assert.equal(translatedTitle(t, 'p'), 'Judul');
  assert.equal(translatedTitle(t, 'x'), '');
});

test('hasFullTranslation: butuh jumlah baris persis & tak kosong', () => {
  const poem = { id: 'p', lines: [{}, {}] };
  assert.equal(hasFullTranslation({ p: { lines_id: ['a', 'b'] } }, poem), true);
  assert.equal(hasFullTranslation({ p: { lines_id: ['a'] } }, poem), false);
  assert.equal(hasFullTranslation({ p: { lines_id: ['a', ''] } }, poem), false);
  assert.equal(hasFullTranslation({}, poem), false);
});

test('poem-translations.json: SEMUA puisi punya terjemahan lengkap + judul', () => {
  assert.equal(Object.keys(TR).length, POEMS.length);
  for (const p of POEMS) {
    assert.ok(hasFullTranslation(TR, p), `terjemahan ${p.id} tidak lengkap`);
    assert.ok(translatedTitle(TR, p.id), `judul terjemahan ${p.id} kosong`);
  }
});
