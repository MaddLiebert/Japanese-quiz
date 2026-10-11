// cyberpunkTheme.test.js — penjaga (guard) tema 電脳 Cyberpunk pada index.css.
// Tujuan: mencegah regresi yang tak terlihat di UI — mis. ornamen 電脳 hilang
// (hero kembali ber-DNA Shōwa), gate bocor ke era lain, atau token kaca/cahaya
// terhapus. Baca CSS sebagai teks. Lihat PRD: docs/tema/cyberpunk.md §4/§6.
//
// ⚠️ TANDA TANGAN 電脳: hairline + GLOW + grid + glitch — BUKAN offset keras
//    `Npx Npx 0 0` (DNA Shōwa). Satu-satunya era yang bahannya KACA & CAHAYA.
//    Kalau glow-nya hilang / diganti bayangan hitam keras, era kehilangan
//    identitasnya.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', '..', 'index.css'), 'utf8');
// Blok 電脳 = era TERAKHIR → dari header tema sampai AKHIR file. (Kalau kelak
// ada era setelahnya, ganti batas ini seperti blok Shōwa/多元.)
const start = css.indexOf('電脳 CYBERPUNK');
const block = css.slice(start);

// Ambil daftar selector unik dari blok 電脳 (buang komentar & at-rule).
function selectors(text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...new Set([...clean.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim()))]
    .filter((s) => s && !s.startsWith('@') && !/^[0-9]/.test(s) && s !== 'from' && s !== 'to');
}

test('電脳: blok CSS [data-era="cyberpunk"] ada di index.css', () => {
  assert.ok(start > 0, 'blok 電脳 CYBERPUNK harus ada');
  assert.ok(css.includes('[data-era="cyberpunk"] {'), 'blok token [data-era="cyberpunk"] { ada');
});

test('電脳: TANDA TANGAN — kaca & cahaya (glow, bukan offset keras Shōwa)', () => {
  const s = css.indexOf('[data-era="cyberpunk"] {');
  const tok = css.slice(s, css.indexOf('}', s));
  // Bentuk = GLOW berlapis (bukan `4px 4px 0 0 var(--sumi-val)` ala Shōwa).
  assert.ok(/--era-shadow:\s*0 0 20px/.test(tok), 'era-shadow = glow berlapis 0 0 20px');
  assert.ok(!/--era-shadow:\s*\d+px \d+px 0 0/.test(tok), 'era-shadow TIDAK boleh offset keras (DNA Shōwa)');
  assert.ok(/--era-edge-w:\s*1px/.test(tok), 'hairline 1px (bukan tinta tebal)');
  assert.ok(/--era-radius:\s*0px/.test(tok), 'sudut mati (cut), bukan membulat');
  assert.ok(/--era-motion:\s*110ms/.test(tok), 'motion 110ms (tercepat dari semua era)');
});

test('電脳: token warna 常夜 (cyan/kuning/merah) terdefinisi terang & gelap', () => {
  assert.ok(/--ai-val:\s*#00f0ff/.test(block), 'cyan #00f0ff = PRIMER');
  assert.ok(/--kin-val:\s*#ffe23a/.test(block), 'kuning #ffe23a = segel/LEVEL');
  assert.ok(/--shu-val:\s*#ff2e4c/.test(block), 'merah #ff2e4c = alert');
  assert.ok(/\.dark\[data-era="cyberpunk"\]/.test(block), 'ada override 真夜中 mayonaka');
});

test('電脳: motif grid + scanline sendiri (tak mewarisi 青海波 Edo)', () => {
  // Tanpa rule .era-pattern sendiri, latar diam-diam mewarisi seigaiha Edo.
  assert.ok(/\[data-era="cyberpunk"\]\s*\.era-pattern[\s\S]{0,600}linear-gradient/.test(block),
    'era-pattern 電脳 = grid (linear-gradient)');
  assert.ok(/\[data-era="cyberpunk"\]\s*\.era-pattern[\s\S]{0,600}animation:\s*none/.test(block),
    'grid STATIS (animation:none) — bukan repaint tiap frame');
});

// ── T3: Ornamen (光ファイバーケーブル / ホログラム HUD / 電脳塔) ─────────────
test('電脳 T3: ornamen di-gate .cyber-ornament (default none, tampil hanya 電脳)', () => {
  assert.ok(/\.cyber-ornament\s*\{\s*display:\s*none/.test(block), 'ornamen default none');
  assert.ok(/\[data-era="cyberpunk"\]\s*\.cyber-ornament\s*\{\s*display:\s*block/.test(block),
    'ornamen tampil di era 電脳');
  assert.ok(/\.cyber-ornament\s*\{\s*pointer-events:\s*none/.test(block), 'dekoratif: pointer-events none');
});

test('電脳 T3: tiga motif wajib ada (kabel serat / HUD holo / menara)', () => {
  // 1. 光ファイバーケーブル (kinetik)
  assert.ok(/\.cyber-cable-mast\b/.test(block), 'ada tiang kabel');
  assert.ok(/\.cyber-cable-core\b/.test(block), 'ada inti serat optik');
  assert.ok(/\.cyber-cable-glowline\b/.test(block), 'ada halo cahaya kabel');
  assert.ok(/\.cyber-cable-node\b/.test(block), 'ada node konektor');
  // 2. ホログラム HUD (panel)
  assert.ok(/\.cyber-hud-frame\b/.test(block), 'ada frame HUD');
  assert.ok(/\.cyber-hud-meter-fill\b/.test(block), 'ada bar telemetri');
  assert.ok(/\.cyber-hud-corner\b/.test(block), 'ada siku HUD');
  // 3. 電脳塔 (hero)
  assert.ok(/\.cyber-spire-mast\b/.test(block), 'ada rangka menara');
  assert.ok(/\.cyber-spire-dish\b/.test(block), 'ada dish antena');
  assert.ok(/\.cyber-spire-beacon\b/.test(block), 'ada beacon merah');
  assert.ok(/\.cyber-spire-wave\b/.test(block), 'ada cincin gelombang');
});

test('電脳 T3: kabel serat = CAHAYA (stroke cyan), bukan tinta tebal Shōwa', () => {
  assert.ok(/\.cyber-cable-core\s*\{[\s\S]{0,200}stroke:\s*rgba\(0, 240, 255/.test(block),
    'inti kabel = cyan (cahaya)');
  assert.ok(/\.cyber-cable-glowline\s*\{[\s\S]{0,200}stroke-width:\s*6/.test(block),
    'halo kabel lebar (glow)');
});

test('電脳 T3: ornamen punya varian 真夜中 (cahaya lebih kuat)', () => {
  assert.ok(/\.dark\[data-era="cyberpunk"\]\s*\.cyber-cable-glowline/.test(block),
    'malam: halo kabel menguat');
  assert.ok(/\.dark\[data-era="cyberpunk"\]\s*\.cyber-spire-wave/.test(block),
    'malam: cincin menara menguat');
});

// ── Hero 日本語学園 電脳 (kritik user: header masih ber-DNA Shōwa) ───────────
test('電脳: hero di-reskin ke palet 常夜 (bukan merah-hitam base)', () => {
  // Judul merek = cyan (PRIMER), sub = kuning — bukan merah #E60012.
  assert.ok(/\[data-era="cyberpunk"\]\s*\.home-hero-title\s*\{[\s\S]{0,160}color:\s*var\(--ai-val\)/.test(block),
    'judul 電脳 = cyan var(--ai-val)');
  assert.ok(/\[data-era="cyberpunk"\]\s*\.home-hero-sub\s*\{[\s\S]{0,120}color:\s*var\(--kin-val\)/.test(block),
    'sub 電脳 = kuning var(--kin-val)');
  // Aksen 基礎 = merah neon token (bukan #E60012 hardcoded).
  assert.ok(/\[data-era="cyberpunk"\]\s*\.home-hero-h1-accent\s*\{[\s\S]{0,160}color:\s*var\(--shu-val\)/.test(block),
    'aksen 基礎 = var(--shu-val)');
  // Veil pencerah dimatikan (kalau tidak, grid holo pudar).
  assert.ok(/\[data-era="cyberpunk"\]\s*\.home-hero-veil\s*\{\s*background-image:\s*none/.test(block),
    'veil pencerah dimatikan di 電脳');
});

test('電脳: hero latar = grid holo (bukan kertas polos / seigaiha)', () => {
  assert.ok(/\[data-era="cyberpunk"\]\s*\.home-hero-bg\s*\{[\s\S]{0,400}linear-gradient/.test(block),
    'hero latar 電脳 = grid linear-gradient');
  assert.ok(/\.dark\[data-era="cyberpunk"\]\s*\.home-hero-bg/.test(block),
    'hero latar punya varian 真夜中');
});

test('電脳: setiap selector ter-gate cyber (tidak bocor ke era lain)', () => {
  const leak = selectors(block).filter((s) => !s.includes('cyber'));
  assert.deepEqual(leak, [], `selector tanpa cyber: ${leak.join(' | ')}`);
});
