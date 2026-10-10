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

// ── T3: Ornamen (フィルム＋セル画 / コマ割り題字 / 多世界の扉) ────────────────
test('多元 T3: ornamen di-gate .anime-ornament (default none, tampil hanya 多元)', () => {
  assert.ok(/\.anime-ornament\s*\{\s*display:\s*none/.test(block), 'ornamen default none');
  assert.ok(/\[data-era="anime"\]\s*\.anime-ornament\s*\{\s*display:\s*block/.test(block),
    'ornamen tampil di era 多元');
  assert.ok(/\.anime-ornament\s*\{\s*pointer-events:\s*none/.test(block), 'dekoratif: pointer-events none');
});

test('多元 T3: tiga motif wajib ada (film+sel / panel題字 / gate 多世界)', () => {
  // 1. フィルム＋セル画 (kinetik)
  assert.ok(/\.anime-film-strip\b/.test(block), 'ada strip film');
  assert.ok(/\.anime-film-cel\b/.test(block), 'ada sel berwarna (cel-shade)');
  assert.ok(/\.anime-film-perf\b/.test(block), 'ada perforasi (lubang sproket)');
  // 2. コマ割り題字 (panel)
  assert.ok(/\.anime-panel-cell\b/.test(block), 'ada grid panel manga');
  assert.ok(/\.anime-panel-title\b/.test(block), 'ada 題字 多元');
  assert.ok(/\.anime-panel-balloon\b/.test(block), 'ada balon kosong (kanvas menunggu)');
  assert.ok(/\.anime-panel-seal\b/.test(block), 'ada segel 印');
  // 3. 多世界の扉 (hero)
  assert.ok(/\.anime-gate-frame\b/.test(block), 'ada gerbang panel bertumpuk');
  assert.ok(/\.anime-gate-mountain\b/.test(block), 'ada siluet dunia (gunung)');
  assert.ok(/\.anime-gate-mech-body\b/.test(block), 'ada siluet dunia (機神)');
  assert.ok(/\.anime-gate-bldg\b/.test(block), 'ada siluet dunia (kota)');
});

test('多元 T3: tekstur screentone + 集中線 + オノマトペ ada & ter-gate', () => {
  assert.ok(/\.anime-tone\b/.test(block), 'ada screentone .anime-tone');
  assert.ok(/\.anime-burst\b/.test(block), 'ada 集中線 .anime-burst');
  assert.ok(/\.anime-onoma\b/.test(block), 'ada オノマトペ .anime-onoma');
  // 集中線 mati saat reduced-motion (WCAG 2.1).
  assert.ok(/prefers-reduced-motion[\s\S]{0,80}\.anime-burst\s*\{\s*display:\s*none/.test(block),
    '集中線 mati saat prefers-reduced-motion');
});

test('多元 T3: ornamen punya varian malam 深夜アニメ (sel bercahaya)', () => {
  assert.ok(/\.dark\[data-era="anime"\]\s*\.anime-film-cel/.test(block), 'malam: sel film bercahaya');
  assert.ok(/\.dark\[data-era="anime"\]\s*\.anime-film-glow/.test(block), 'malam: halo sel menyala');
});

// ── T13: token warna 多元 (--color-sora/--color-sakura) ──────────────────────
test('多元 T13: token @theme --color-sora/--color-sakura terdaftar', () => {
  const theme = css.slice(css.indexOf('@theme'), css.indexOf('}', css.indexOf('@theme')));
  assert.ok(/--color-sora:\s*var\(--sora-val\)/.test(theme), '@theme: --color-sora → var(--sora-val)');
  assert.ok(/--color-sakura:\s*var\(--sakura-val\)/.test(theme), '@theme: --color-sakura → var(--sakura-val)');
});

test('多元 T13: default :root punya --sora-val/--sakura-val (aditif, nilai lama utuh)', () => {
  const root = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')));
  assert.ok(/--sora-val:\s*#3a8dde/.test(root), ':root default --sora-val = #3a8dde');
  assert.ok(/--sakura-val:\s*#f18bb0/.test(root), ':root default --sakura-val = #f18bb0');
  // Nilai DNA lama TIDAK berubah (§0): sumi/ai/shu tetap.
  assert.ok(/--sumi-val:\s*#1a1a1a/.test(root), 'DNA lama utuh: --sumi-val #1a1a1a');
  assert.ok(/--shu-val:\s*#d3382f/.test(root), 'DNA lama utuh: --shu-val #d3382f');
});
