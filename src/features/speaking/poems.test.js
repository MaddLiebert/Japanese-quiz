import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasKanji } from './speechMatch.js';
import { lineReading } from './speaking.js';

// Modul murni tidak meng-import JSON; test memuat sendiri (pola fitur writing).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const POEMS = JSON.parse(readFileSync(join(ROOT, 'src/data/poems.json'), 'utf8'));

const KANA_ONLY = /^[\u3041-\u309f\u30a0-\u30ffー]+$/;

test('poems.json: ada 8 puisi, id unik, field wajib lengkap', () => {
  assert.equal(POEMS.length, 8);
  assert.equal(new Set(POEMS.map((p) => p.id)).size, 8);
  for (const p of POEMS) {
    assert.ok(p.id && p.title && p.author && p.type, `puisi ${p.id} kurang field`);
    assert.ok(p.meaning && p.meaning_id, `puisi ${p.id} kurang arti`);
    assert.ok(Array.isArray(p.lines) && p.lines.length >= 3, `puisi ${p.id} baris < 3`);
  }
});

test('setiap segmen berkanji WAJIB punya furigana kana', () => {
  for (const p of POEMS) {
    for (const line of p.lines) {
      for (const seg of line.segments || []) {
        if (hasKanji(seg.t)) {
          assert.ok(seg.r, `${p.id}: segmen "${seg.t}" tidak punya furigana`);
          assert.ok(KANA_ONLY.test(seg.r), `${p.id}: furigana "${seg.r}" bukan kana murni`);
        }
      }
    }
  }
});

test('bacaan tiap baris murni kana (tidak ada kanji yang lolos)', () => {
  for (const p of POEMS) {
    for (const line of p.lines) {
      const reading = lineReading(line);
      assert.ok(reading.length > 0, `${p.id}: ada baris kosong`);
      assert.ok(KANA_ONLY.test(reading), `${p.id}: bacaan "${reading}" mengandung non-kana`);
    }
  }
});

test('titleReading & authorReading murni kana', () => {
  for (const p of POEMS) {
    assert.ok(KANA_ONLY.test(p.titleReading), `${p.id}: titleReading bukan kana`);
    assert.ok(KANA_ONLY.test(p.authorReading), `${p.id}: authorReading bukan kana`);
  }
});
