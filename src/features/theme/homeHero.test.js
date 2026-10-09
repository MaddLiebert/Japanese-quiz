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
const block = css.slice(start, start + 12000);

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

// ── Dinding bata 煉瓦 di HERO (bukan cuma .era-pattern global) ───────────────
// Bug: dinding bata Meiji hanya dipasang di `.era-pattern` global, yang duduk
// DI BELAKANG panel Home yang opak (frame bg-kinari-light + gradien overlay)
// → di Home dinding TAK TERLIHAT (user: "gak ada tuh di sini"). Pola era lain
// (Edo seigaiha) muncul LANGSUNG di panel hero lewat `.home-hero-bg`. Meiji
// harus sama: bata di panel hero juga.
test('hero Meiji: dinding bata 煉瓦 tampil di .home-hero-bg (bukan polos)', () => {
  // Hero Meiji = 唐草 karakusa (motif utama PRD), BUKAN bata poster — sengaja
  // dibedakan dari nihongo-gakuen.
  assert.ok(/\[data-era="meiji"\] \.home-hero-bg\s*\{[\s\S]*?url\("\/art\/meiji-karakusa-day\.svg"\)/.test(block),
    'hero Meiji harus punya latar 唐草 /art/meiji-karakusa-day.svg, bukan bata');
  assert.ok(!/meiji-brick/.test(block), 'hero Meiji tidak boleh pakai aset bata poster');
  // Varian gelap 瓦斯灯の夜 = karakusa malam.
  assert.ok(/\.dark\[data-era="meiji"\] \.home-hero-bg[\s\S]*?url\("\/art\/meiji-karakusa-night\.svg"\)/.test(block),
    'hero Meiji gelap = karakusa /art/meiji-karakusa-night.svg');
});

// ── Scene 瓦斯灯の夜 ala mockup_meiji ─────────────────────────────────────────
// Mockup = ruangan malam: dinding bata + sorot lampu gas + vignette gelap.
// Veil pencerah bawaan (from-kinari-light/85) memudarkan dinding → di Meiji
// dimatikan. Teks di atas dinding gelap jadi krem/putih (poster meiji.html).
test('hero Meiji: scene lampu gas + vignette (bukan rata)', () => {
  // Siang: sedikit sorot kertas hangat di atas sulur karakusa.
  assert.ok(/\[data-era="meiji"\] \.home-hero-bg[\s\S]*?radial-gradient\([^)]*201,118,105/.test(block),
    'hero Meiji siang harus punya sorot hangat (radial-gradient)');
  // Malam: sorot lampu gas + vignette ruangan.
  assert.ok(/\.dark\[data-era="meiji"\] \.home-hero-bg[\s\S]*?radial-gradient\([^)]*255,196,120/.test(block),
    'hero Meiji gelap harus punya sorot lampu gas yang lebih kuat');
  assert.ok(/\.dark\[data-era="meiji"\] \.home-hero-bg[\s\S]*?rgba\(0,0,0,0\.\d+\) 100%/.test(block),
    'hero Meiji gelap harus punya vignette gelap di tepi');
});

test('hero Meiji: veil pencerah dimatikan + teks jadi terang di mode gelap', () => {
  assert.ok(/\[data-era="meiji"\] \.home-hero-veil \{ background-image: none/.test(block),
    'veil pencerah harus dimatikan di Meiji (dinding gelap terbaca)');
  assert.ok(/\.dark\[data-era="meiji"\] \.home-hero-h1[^{]*\{[^}]*color:\s*#f0eee8/.test(block),
    'judul 日本語 di mode gelap = krem #f0eee8 (bukan hitam)');
});
