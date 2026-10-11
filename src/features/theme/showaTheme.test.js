// showaTheme.test.js — penjaga (guard) tema Shōwa pada index.css.
// Tujuan: mencegah regresi yang tak terlihat di UI — mis. seni kartu N5 hilang
// (kartu jadi kosong/hambar seperti keluhan user), gate bocor ke era lain, atau
// token beton terhapus. Baca CSS sebagai teks. Lihat PRD: docs/tema/showa.md.
//
// ⚠️ PRINSIP #0 (§0): Shōwa = tema ASLI app; ia MENG-ECHO base, bukan mengganti.
// Guard di bawah TIDAK memeriksa :root (itu justru harus beku) — hanya blok
// [data-era="showa"] di ujung file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', '..', 'index.css'), 'utf8');
// Blok Shōwa = dari header tema sampai blok tema era BERIKUTNYA (電脳).
// ⚠️ Shōwa dulu seksi terakhir; sejak era 電脳 (常夜) ditambahkan, blok Shōwa
// BUKAN lagi ujung file → slice harus dibatasi, kalau tidak selector 電脳 ikut
// terbaca sebagai "bocor" dari Shōwa.
const start = css.indexOf('SHŌWA 昭和');
const nextEra = css.indexOf('電脳 CYBERPUNK');
const block = css.slice(start, nextEra > start ? nextEra : undefined);

// Ambil daftar selector unik dari blok Shōwa (buang komentar & at-rule).
function selectors(text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...new Set([...clean.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim()))]
    .filter((s) => s && !s.startsWith('@') && !/^[0-9]/.test(s) && s !== 'from' && s !== 'to');
}

test('Shōwa: blok CSS [data-era="showa"] ada di index.css', () => {
  assert.ok(start > 0, 'blok SHŌWA 昭和 harus ada');
  assert.ok(css.includes('[data-era="showa"] {'), 'blok token [data-era="showa"] { ada');
});

test('Shōwa: ECHO base — --era-shadow tetap 4px keras (bukan none)', () => {
  const s = css.indexOf('[data-era="showa"] {');
  const tok = css.slice(s, css.indexOf('}', s));
  assert.ok(/--era-shadow:\s*4px 4px 0 0/.test(tok), 'Shōwa echo base: shadow keras KEMBALI');
  assert.ok(/--era-radius:\s*0px/.test(tok), 'radius 0 (beton, sudut tajam)');
});

test('Shōwa: token beton terdefinisi (concrete/gin-nezu/sodium) di terang & gelap', () => {
  assert.ok(/--concrete-val:\s*#8c8c85/.test(block), 'beton primer #8c8c85');
  assert.ok(/--gin-nezu-val:\s*#b9b7ae/.test(block), 'abu perak #b9b7ae');
  assert.ok(/--sodium-val:\s*#d9a441/.test(block), 'sodium amber #d9a441');
  assert.ok(/\.dark\[data-era="showa"\]/.test(block), 'ada override gelap 夜の団地');
});

test('Shōwa: setiap selector ter-gate showa (tidak bocor ke era lain)', () => {
  const leak = selectors(block).filter((s) => !s.includes('showa'));
  assert.deepEqual(leak, [], `selector tanpa showa: ${leak.join(' | ')}`);
});

// ── Seni kartu JLPT N5 era Shōwa (新幹線 + 団地 + 電柱) ──────────────────────
// Sejajar EdoPrintArt (ukiyo-e) & MeijiPrintArt (cetakan): kartu N5 Shōwa dulu
// KOSONG ("hambar", keluhan user). Kini diisi "scene beton Shōwa". Harus di-gate
// .showa-art (default none), luluh ke kertas lewat mask, dan BERBEDA dari hero.
test('Shōwa: kartu N5 = scene beton (gate showa-art + mask luluh)', () => {
  assert.ok(/\.showa-art\s*\{\s*display:\s*none/.test(block), 'seni default none');
  assert.ok(/\[data-era="showa"\]\s*\.showa-art\s*\{\s*display:\s*block/.test(block),
    'seni tampil di Shōwa');
  assert.ok(/\.showa-art--print[\s\S]*?mask-image/.test(block), 'ada mask luluh ke kertas');
  assert.ok(/\.dark\[data-era="showa"\]\s*\.showa-art--print[\s\S]*?mix-blend-mode:\s*screen/.test(block),
    'malam: seni menyala lembut (screen)');
});

test('Shōwa: scene kartu punya elemen khas (新幹線/団地/電柱), bukan hero', () => {
  assert.ok(/\.showa-art-train\b/.test(block), 'ada 新幹線 (kereta)');
  assert.ok(/\.showa-art-train-stripe/.test(block), 'ada pita biru 0系');
  assert.ok(/\.showa-art-concrete/.test(block), 'ada 団地 beton');
  assert.ok(/\.showa-art-window/.test(block), 'ada jendela menyala sodium');
  assert.ok(/\.showa-art-girder/.test(block), 'ada jalur layang');
  // Beda dari hero: scene TIDAK memakai kelas ornamen hero.
  assert.ok(!/showa-art[\s\S]{0,40}showa-tower-leg/.test(block), 'scene tak menyalin 東京タワー hero');
});
