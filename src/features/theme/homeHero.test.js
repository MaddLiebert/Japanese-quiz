// homeHero.test.js — penjaga header 日本語学園 (Home hero).
// Aturan user: latar motif bulat-bulat 青海波 HANYA di Edo. Heian & Shōwa POLOS.
// Warna teks merek ikut PALET era (bukan merah-hitam hardcoded).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', '..', 'index.css'), 'utf8');
const start = css.indexOf('HEADER 日本語学園');
const block = css.slice(start, start + 4000);

test('header hero: ada blok aturan (kelas home-hero-*)', () => {
  assert.ok(start > 0, 'seksi HEADER 日本語学園 harus ada');
  assert.ok(/\.home-hero-bg/.test(block), 'kelas .home-hero-bg harus ada');
});

test('latar bulat (seigaiha) HANYA di Edo, bukan Heian', () => {
  assert.ok(/\[data-era="edo"\] \.home-hero-bg/.test(block), 'Edo harus punya latar');
  assert.ok(!/\[data-era="heian"\] \.home-hero-bg[^}]*background-image:\s*url/.test(block),
    'Heian TIDAK boleh punya latar motif');
});

test('Heian & default POLOS (background-image: none)', () => {
  assert.ok(/\.home-hero-bg\s*\{\s*background-image:\s*none/.test(block), 'default polos');
  assert.ok(/\[data-era="heian"\] \.home-hero-bg\s*\{\s*background-image:\s*none/.test(block),
    'Heian polos');
});

test('Heian tidak diubah: mark 学 tetap bayangan merah asli', () => {
  assert.ok(/\[data-era="heian"\] \.home-hero-mark\s*\{\s*box-shadow:\s*4px 4px 0 0 #d3382f/.test(block),
    'Heian mark harus persis seperti semula');
});

test('warna teks merek ikut palet, TANPA merah (permintaan user)', () => {
  assert.ok(/\[data-era="edo"\] \.home-hero-title\s*\{\s*color:\s*var\(--ai-val\)\s*!important/.test(block),
    'Edo judul = indigo palet');
  assert.ok(/\[data-era="edo"\] \.home-hero-sub\s*\{\s*color:\s*var\(--ai-val\)\s*!important/.test(block),
    'Edo sub = indigo palet (bukan 朱 merah)');
  assert.ok(!/\[data-era="edo"\] \.home-hero-(title|sub)[^}]*var\(--shu-val\)/.test(block),
    'Edo tidak boleh pakai --shu-val (merah) di teks merek');
  assert.ok(/\[data-era="meiji"\] \.home-hero-title\s*\{\s*color:\s*var\(--renga-val\)\s*!important/.test(block),
    'Meiji judul = renga palet');
});
