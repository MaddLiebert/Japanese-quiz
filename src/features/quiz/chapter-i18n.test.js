import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CHAPTERS = JSON.parse(readFileSync(join(ROOT, 'src/data/mondai-chapters.json'), 'utf8')).chapters;

test('setiap chapter punya title_en', () => {
  const missing = CHAPTERS.filter((c) => !c.title_en?.trim()).map((c) => c.chapter);
  assert.deepEqual(missing, [], `chapter tanpa title_en: ${missing.join(', ')}`);
});

test('setiap chapter punya objectives_en sepanjang objectives', () => {
  const bad = CHAPTERS.filter((c) => !Array.isArray(c.objectives_en) || c.objectives_en.length !== c.objectives.length)
    .map((c) => c.chapter);
  assert.deepEqual(bad, [], `chapter objectives_en tidak sejajar: ${bad.join(', ')}`);
});

test('title_en tetap mempertahankan prefix "Dai N Ka"', () => {
  const bad = CHAPTERS.filter((c) => !/^Dai \d+ Ka/.test(c.title_en)).map((c) => c.chapter);
  assert.deepEqual(bad, [], `prefix hilang: ${bad.join(', ')}`);
});

test('options_en (kalau ada) selalu sejajar panjang dgn options', () => {
  const bad = [];
  for (const c of CHAPTERS) {
    for (const q of c.questions) {
      if (q.options_en && q.options_en.length !== q.options.length) bad.push(q.id);
    }
  }
  assert.deepEqual(bad, [], `options_en tidak sejajar: ${bad.join(', ')}`);
});
