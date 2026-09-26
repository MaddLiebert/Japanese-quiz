import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasKanji } from './speechMatch.js';
import { lineReading, POEM_THEMES } from './speaking.js';

// Modul murni tidak meng-import JSON; test memuat sendiri (pola fitur writing).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const POEMS = JSON.parse(readFileSync(join(ROOT, 'src/data/poems.json'), 'utf8'));

const KANA_ONLY = /^[\u3041-\u309f\u30a0-\u30ffー]+$/;
// Bacaan baris boleh memuat tanda baca & spasi (puisi panjang), tapi BUKAN kanji/latin/digit.
const NON_KANA_CHARS = /[\u4e00-\u9faf\u3400-\u4dbfA-Za-z0-9]/;

// Daftar tema diambil dari POEM_THEMES (satu sumber kebenaran dengan UI).
const THEMES = POEM_THEMES.filter((t) => t.key !== 'all' && t.key !== 'classic').map((t) => t.key);

test('poems.json: 19 puisi (7 klasik + 12 bertema), id unik, field wajib lengkap', () => {
  assert.equal(POEMS.length, 19);
  assert.equal(new Set(POEMS.map((p) => p.id)).size, 19);
  assert.equal(POEMS.filter((p) => p.theme).length, 12);
  assert.equal(POEMS.filter((p) => !p.theme).length, 7);
  for (const p of POEMS) {
    assert.ok(p.id && p.title && p.author && p.type, `puisi ${p.id} kurang field`);
    assert.ok(p.meaning && p.meaning_id, `puisi ${p.id} kurang arti`);
    assert.ok(Array.isArray(p.lines) && p.lines.length >= 3, `puisi ${p.id} baris < 3`);
  }
});

test('puisi bertema: 4 tema × 3, tiap puisi panjang (≥12 baris) + sumber Aozora', () => {
  for (const theme of THEMES) {
    const list = POEMS.filter((p) => p.theme === theme);
    assert.equal(list.length, 3, `tema ${theme} harus 3 puisi, dapat ${list.length}`);
    for (const p of list) {
      assert.ok(p.lines.length >= 12, `${p.id} hanya ${p.lines.length} baris (<12)`);
      assert.ok(
        /^https:\/\/www\.aozora\.gr\.jp\//.test(p.source || ''),
        `${p.id} kurang sumber Aozora`,
      );
    }
  }
});

test('雨ニモマケズ: versi lengkap (≥30 baris, bukan kutipan)', () => {
  const ameni = POEMS.find((p) => p.id === 'poem_kenji_amenimomakezu');
  assert.ok(ameni, 'poem_kenji_amenimomakezu hilang');
  assert.ok(ameni.lines.length >= 30, `hanya ${ameni.lines.length} baris`);
  assert.equal(ameni.excerpt, false);
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

test('bacaan tiap baris tanpa kanji & latin (tanda baca boleh)', () => {
  for (const p of POEMS) {
    for (const line of p.lines) {
      const reading = lineReading(line);
      assert.ok(reading.length > 0, `${p.id}: ada baris kosong`);
      assert.ok(!NON_KANA_CHARS.test(reading), `${p.id}: bacaan "${reading}" mengandung kanji/latin`);
    }
  }
});

test('titleReading & authorReading murni kana', () => {
  for (const p of POEMS) {
    assert.ok(KANA_ONLY.test(p.titleReading), `${p.id}: titleReading bukan kana`);
    assert.ok(KANA_ONLY.test(p.authorReading), `${p.id}: authorReading bukan kana`);
  }
});
