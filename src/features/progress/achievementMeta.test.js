import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ProgressContext.jsx meng-import React → tak bisa di-import langsung di node:test.
// Jadi kita parse blok ACHIEVEMENT_META dari sumber (pola repo: baca file teks).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SRC = readFileSync(join(ROOT, 'src/features/progress/ProgressContext.jsx'), 'utf8');
const start = SRC.indexOf('ACHIEVEMENT_META = {');
const end = SRC.indexOf('\n};', start);
const BLOCK = SRC.slice(start, end);

const entries = [...BLOCK.matchAll(/^\s{2}(\w+):\s*\{([^}]*)\}/gm)]
  .map((m) => ({ id: m[1], body: m[2] }));

test('ACHIEVEMENT_META: setiap badge punya desc_en', () => {
  assert.ok(entries.length >= 45, `hanya ${entries.length} badge terdeteksi`);
  const missing = entries.filter((e) => !/desc_en:\s*'[^']+'/.test(e.body)).map((e) => e.id);
  assert.deepEqual(missing, [], `badge tanpa desc_en: ${missing.join(', ')}`);
});

test('ACHIEVEMENT_META: badge yang desc-nya Indonesia punya desc_en BERBEDA', () => {
  // Kalau desc sudah Inggris (mis. "50 Kanji Correct"), desc_en boleh sama.
  // Tapi kalau desc mengandung kata Indonesia, desc_en WAJIB beda (bukti diterjemah).
  const idWords = /(Kuasai|Lulus|Selesaikan|Streak belajar|Hari|hari|Menit|Skor|sempurna|Ujian)/;
  const bad = [];
  for (const e of entries) {
    const d = e.body.match(/desc:\s*'([^']*)'/)?.[1] || '';
    const de = e.body.match(/desc_en:\s*'([^']*)'/)?.[1] || '';
    if (idWords.test(d) && d === de) bad.push(e.id);
  }
  assert.deepEqual(bad, [], `desc_en masih sama dgn desc ID: ${bad.join(', ')}`);
});
