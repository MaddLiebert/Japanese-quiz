// pwaConfig.test.js — penjaga konfigurasi PWA (vite.config.js).
//
// BUG NYATA: `includeAssets: ['**/*']` menyapu SELURUH public/ ke precache
// service worker → tiap install PWA mengunduh ~181 MB (250 mp3 + gif + webp).
// Ditemukan setelah menambah 45 klip voice karakter 多元 (dist/sw.js naik ke
// 725 entri). Media berat HARUS lewat runtimeCaching (CacheFirst), bukan
// precache. Test ini membaca vite.config.js sebagai teks agar regresi tak lolos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cfg = readFileSync(join(here, '..', '..', '..', 'vite.config.js'), 'utf8');

test('PWA: includeAssets TIDAK boleh menyapu seluruh public/ (anti precache raksasa)', () => {
  // Ambil nilai includeAssets.
  const m = cfg.match(/includeAssets:\s*\[([^\]]*)\]/);
  assert.ok(m, 'includeAssets harus terdefinisi di vite.config.js');
  const value = m[1].trim();
  assert.ok(!/\*\*\/\*/.test(value),
    "includeAssets tidak boleh '**/*' — menyapu semua media ke precache (ratusan MB)");
  assert.ok(!/\.(mp3|gif|webp|jpe?g)/i.test(value),
    'includeAssets tidak boleh memuat media berat (mp3/gif/webp/jpg)');
});

test('PWA: media berat dilayani lewat runtimeCaching (CacheFirst)', () => {
  assert.ok(/runtimeCaching:\s*\[/.test(cfg), 'workbox.runtimeCaching harus ada');
  assert.ok(/handler:\s*'CacheFirst'/.test(cfg), 'media berat pakai handler CacheFirst');
  // Pola harus menangkap mp3 (audio + voices) & gambar efek.
  assert.ok(/mp3/.test(cfg) && /gif/.test(cfg) && /webp/.test(cfg),
    'urlPattern runtimeCaching harus menangkap mp3/gif/webp');
});

test('PWA: globPatterns tetap precache app shell + data ringan (json/svg/font)', () => {
  const m = cfg.match(/globPatterns:\s*\[([^\]]*)\]/);
  assert.ok(m, 'globPatterns harus terdefinisi');
  const g = m[1];
  for (const ext of ['js', 'css', 'html', 'json', 'svg', 'woff2']) {
    assert.ok(g.includes(ext), `globPatterns harus memuat ${ext} (app shell/data ringan)`);
  }
  assert.ok(!/mp3/.test(g), 'globPatterns tidak boleh memuat mp3 (media berat)');
});
