// ─────────────────────────────────────────────────────────────────────────────
// Guard performa: mencegah "patah-patah" (sub-60fps) kembali diam-diam.
//
// Diukur di browser (dev server, CPU-throttle untuk meniru HP):
//   • `.era-pattern` yang meng-animasi `background-position` memaksa REPAINT
//     seluruh viewport tiap frame → scroll Home berat (avg ~69.9ms).
//     Setelah pindah ke `transform` (compositor) → ~16.7ms.
//   • Path scene cinematic yang meng-animasi `pathLength` DENGAN filter SVG
//     (feTurbulence/feDisplacementMap) di-raster ulang tiap frame → med 33.3ms.
//     Tanpa filter → 16.7ms.
//
// Uji ini membaca sumber apa adanya (tanpa browser) dan mengunci kedua aturan.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = join(here, 'index.css');
const scenesDir = join(here, 'features', 'cinematic', 'heian', 'scenes');

test('.era-pattern meng-animasi transform, BUKAN background-position', () => {
  const css = readFileSync(cssPath, 'utf8');

  // Keyframes heian-drift tidak boleh menyentuh background-position.
  const drift = css.match(/@keyframes\s+heian-drift\s*\{([\s\S]*?)\n\}/);
  assert.ok(drift, 'blok @keyframes heian-drift harus ada');
  assert.ok(
    !/background-position/.test(drift[1]),
    'heian-drift tidak boleh meng-animasi background-position (memicu repaint tiap frame)',
  );
  assert.ok(
    /transform\s*:\s*translate/.test(drift[1]),
    'heian-drift harus menggeser lewat transform (GPU/compositor)',
  );

  // Layer pola harus diperbesar supaya transform tidak menyingkap tepi.
  const pattern = css.match(/\[data-era="heian"\]\s+\.era-pattern\s*\{([\s\S]*?)\n\}/);
  assert.ok(pattern, 'rule [data-era="heian"] .era-pattern harus ada');
  assert.ok(
    /width\s*:\s*200%/.test(pattern[1]) && /height\s*:\s*200%/.test(pattern[1]),
    '.era-pattern harus 200% agar animasi transform tidak menyingkap tepi',
  );
});

test('path cinematic yang meng-animasi pathLength tidak memakai filter SVG', () => {
  const files = readdirSync(scenesDir).filter((f) => f.endsWith('.jsx'));
  assert.ok(files.length > 0, 'folder scenes harus berisi file .jsx');

  for (const f of files) {
    const src = readFileSync(join(scenesDir, f), 'utf8');
    // Ambil tiap elemen <motion.path ... /> dan periksa kombinasinya.
    const tags = src.match(/<motion\.path[\s\S]*?\/>/g) || [];
    for (const tag of tags) {
      const animates = /pathLength/.test(tag);
      const filtered = /filter\s*=/.test(tag);
      assert.ok(
        !(animates && filtered),
        `${f}: pathLength + filter SVG pada elemen yang sama → filter di-raster ulang tiap frame (patah-patah). Pisahkan filternya.`,
      );
    }
  }
});
