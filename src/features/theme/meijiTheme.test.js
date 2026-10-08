// meijiTheme.test.js — penjaga (guard) tema Meiji pada index.css.
// Tujuan: mencegah regresi yang tak terlihat di UI — mis. bayangan brutalist
// Shōwa masuk lagi, atau selector bocor ke era lain. Baca CSS sebagai teks.
// Lihat PRD: docs/tema/meiji.md §14 (anti-brutalism) & mekanik §Kriteria.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', '..', 'index.css'), 'utf8');
const start = css.indexOf('明治 MEIJI');
// Blok Meiji berakhir di seksi berikutnya (header 日本語学園). Jangan iris ke
// akhir file — kalau tidak, seksi era lain ikut terbaca (guard jadi rapuh).
const endMarker = css.indexOf('HEADER 日本語学園', start);
const block = css.slice(start, endMarker > 0 ? endMarker : undefined);

// Ambil daftar selector unik dari blok Meiji (buang komentar & at-rule).
function selectors(text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...new Set([...clean.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim()))]
    .filter((s) => s && !s.startsWith('@') && !/^[0-9]/.test(s) && s !== 'from' && s !== 'to');
}

test('Meiji: blok CSS [data-era="meiji"] ada di index.css', () => {
  assert.ok(start > 0, 'blok 明治 MEIJI harus ada');
});

test('Meiji: ANTI-BRUTALISM — tidak ada box-shadow ber-offset (semua none)', () => {
  const shadows = [...block.matchAll(/box-shadow:\s*([^;!}]+)/g)].map((m) => m[1].trim());
  const bad = shadows.filter((s) => s !== 'none');
  assert.deepEqual(bad, [], `box-shadow non-none ditemukan: ${bad.join(', ')}`);
});

test('Meiji: setiap selector ter-gate meiji (tidak bocor ke era lain)', () => {
  const leak = selectors(block).filter((s) => !s.includes('meiji'));
  assert.deepEqual(leak, [], `selector tanpa meiji: ${leak.join(' | ')}`);
});

test('Meiji: segel 極 (Edo) TIDAK diaktifkan di Meiji — hindari dua segel', () => {
  assert.ok(!/\[data-era="meiji"\]\s*\.era-seal/.test(block), 'segel 極 tidak boleh tampil di Meiji');
  assert.ok(/\[data-era="meiji"\]\s*\.meiji-seal/.test(block), 'segel 明 harus tampil di Meiji');
});

test('Meiji: token inti terkunci (renga primer, radius 0, shadow none, font cetak)', () => {
  assert.ok(/--renga-val:\s*#9b4a3c/.test(block), 'renga #9b4a3c = warna primer');
  assert.ok(/--era-radius:\s*0px/.test(block), 'radius 0 (potongan kertas)');
  assert.ok(/--era-shadow:\s*none/.test(block), 'shadow none (anti-brutalism)');
  assert.ok(/--era-rule-color/.test(block), 'warna garis untuk gradient (bukan shorthand border)');
  assert.ok(/Shippori Mincho B1/.test(block), 'font display serif cetak');
});

test('Meiji: varian gelap ada (gaslight malam), bukan sekadar ganti hex', () => {
  assert.ok(/\.dark\[data-era="meiji"\]/.test(block), 'harus ada override gelap');
  assert.ok(/--gas-val:\s*#f0c85a/.test(block), 'gaslight malam = amber terang');
});
