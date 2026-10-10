// animeTheme.test.js — penjaga (guard) tema 多元 Anime Multiverse pada index.css.
// Tujuan: mencegah regresi yang tak terlihat di UI — mis. cel-shadow BERWARNA
// hilang (kartu jatuh jadi poster beton Shōwa), tinta manga kembali netral, atau
// selector bocor ke era lain. Baca CSS sebagai teks.
// Lihat PRD: docs/tema/anime.md §4 (token), §13 (kriteria penerimaan).
//
// ⚠️ TANDA TANGAN 多元: bayangan CEL BERWARNA (2-tone), bukan hitam keras ala
//    Shōwa. Ini yang membedakan era ini — kalau warnanya jadi sumi/hitam, era
//    kehilangan identitasnya.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', '..', 'index.css'), 'utf8');
// Blok 多元 berakhir di seksi berikutnya (header Shōwa). Jangan iris ke akhir
// file — kalau tidak, seksi era lain ikut terbaca (guard jadi rapuh).
const start = css.indexOf('多元 ANIME MULTIVERSE');
const endMarker = css.indexOf('SHŌWA 昭和', start);
const block = css.slice(start, endMarker > 0 ? endMarker : undefined);

// Ambil daftar selector unik dari blok 多元 (buang komentar & at-rule).
function selectors(text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...new Set([...clean.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim()))]
    .filter((s) => s && !s.startsWith('@') && !/^[0-9]/.test(s) && s !== 'from' && s !== 'to');
}

test('多元: blok CSS [data-era="anime"] ada di index.css', () => {
  assert.ok(start > 0, 'blok 多元 ANIME MULTIVERSE harus ada');
  assert.ok(css.includes('[data-era="anime"] {'), 'blok token [data-era="anime"] { ada');
});

test('多元: TANDA TANGAN — cel-shadow BERWARNA (bukan hitam ala Shōwa)', () => {
  const s = css.indexOf('[data-era="anime"] {');
  const tok = css.slice(s, css.indexOf('}', s));
  assert.ok(/--era-shadow:\s*5px 5px 0 0 var\(--sora-val\)/.test(tok),
    'cel-shadow 2-tone: 5px 5px 0 0 var(--sora-val)');
  // ⚠ Bukan bayangan hitam: sumi (tinta) sebagai warna cel = DNA Shōwa.
  assert.ok(!/--era-shadow:\s*5px 5px 0 0 var\(--sumi-val\)/.test(tok),
    'cel-shadow tidak boleh hitam (itu DNA Shōwa)');
  assert.ok(/--era-edge-w:\s*3px/.test(tok), 'outline tinta 3px (panel manga)');
  assert.ok(/--era-radius:\s*6px/.test(tok), 'sudut membulat 6px (kartun)');
  assert.ok(/--era-motion:\s*140ms/.test(tok), 'motion 140ms (tercepat dari semua era)');
});

test('多元: token kanvas (sora/sakura/sumi/tone) terdefinisi', () => {
  assert.ok(/--sora-val:\s*#3a8dde/.test(block), 'sora #3a8dde = PRIMER');
  assert.ok(/--sakura-val:\s*#f18bb0/.test(block), 'sakura #f18bb0 = AKSEN');
  assert.ok(/--sumi-val:\s*#171a22/.test(block), 'sumi #171a22 = tinta manga (kebiruan)');
  assert.ok(/--tone-val:/.test(block), 'screentone --tone-val ada');
});

test('多元: varian gelap 深夜アニメ ada (ruang tonton, bukan sekadar ganti hex)', () => {
  assert.ok(/\.dark\[data-era="anime"\]/.test(block), 'harus ada override gelap');
  assert.ok(/--kinari-val:\s*#101219/.test(block), 'halaman malam #101219');
});

test('多元: LAPIS 2 — overlay franchise menimpa WARNA, bukan BENTUK', () => {
  const i = css.indexOf('[data-era="anime"][data-franchise]');
  assert.ok(i > 0, 'blok overlay [data-era="anime"][data-franchise] ada');
  const fr = css.slice(i, css.indexOf('}', i));
  assert.ok(/--sora-val:\s*var\(--fr-1\)/.test(fr), 'franchise menimpa --sora-val dari --fr-1');
  assert.ok(/--era-shadow:\s*5px 5px 0 0 var\(--fr-1\)/.test(fr), 'cel-shadow ikut warna dunia');
  // ⚠ Bentuk TIDAK diubah franchise (semua dunia harus terasa "satu app").
  assert.ok(!/--era-edge-w/.test(fr), 'franchise tidak boleh mengubah outline (bentuk = milik era)');
  assert.ok(!/--era-radius/.test(fr), 'franchise tidak boleh mengubah radius');
  assert.ok(!/--era-motion/.test(fr), 'franchise tidak boleh mengubah motion');
});

test('多元: setiap selector ter-gate anime (tidak bocor ke era lain)', () => {
  const leak = selectors(block).filter((s) => !s.includes('anime'));
  assert.deepEqual(leak, [], `selector tanpa anime: ${leak.join(' | ')}`);
});

test('多元: tidak menambah IP berhak cipta di CSS (§6.4)', () => {
  // Nama franchise komersial dilarang; hanya franchise fiktif/orisinal.
  const terlarang = ['jujutsu', 'jjk', 'gojo', 'sukuna', 'naruto', 'onepiece', 'one-piece', 'dragonball', 'dragon-ball'];
  const found = terlarang.filter((n) => block.toLowerCase().includes(n));
  assert.deepEqual(found, [], `nama IP berhak cipta di blok 多元: ${found.join(', ')}`);
});
