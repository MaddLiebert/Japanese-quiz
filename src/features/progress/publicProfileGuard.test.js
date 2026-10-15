// publicProfileGuard.test.js — penjaga (guard) state "Profil Publik" 訪問.
//
// Konteks (docs/public-profile.md §5.3, §10 T3): opt-in profil publik disimpan
// di `progress.publicProfile`, default TERTUTUP (false). Karena itu:
//   1. `DEFAULT_PROGRESS.publicProfile` WAJIB `false` (default tertutup).
//   2. Harus ada aksi `setPublicProfile(on)` di ProgressContext (satu-satunya
//      jalur menyalakan) dan WAJIB diekspos lewat value Provider — kalau tidak,
//      Sakelar di Pengaturan tak bisa memanggilnya.
//   3. `resetProgress` memakai `DEFAULT_PROGRESS` → publicProfile otomatis
//      kembali `false` saat reset (tanpa jalur kedua).
//
// Baca ProgressContext.jsx sebagai teks (pola sama seperti guard tema lain).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, 'ProgressContext.jsx'), 'utf8');

// Buang komentar supaya tidak "membaca" kalimat di komentar sendiri.
const code = src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

test('publicProfile: DEFAULT_PROGRESS default TERTUTUP (false)', () => {
  assert.match(code, /publicProfile\s*:\s*false/);
});

test('publicProfile: ada aksi setPublicProfile(on) dan diekspos ke value Provider', () => {
  assert.match(code, /const\s+setPublicProfile\s*=\s*useCallback\s*\(/);
  // Ekspos di value={{ … }} — kalau lupa, Sakelar Pengaturan tak bisa memanggilnya.
  assert.match(code, /value=\{\{[^}]*\bsetPublicProfile\b/s);
});

test('publicProfile: setPublicProfile menulis boolean (Boolean(on))', () => {
  assert.match(code, /publicProfile\s*:\s*Boolean\s*\(\s*on\s*\)/);
});

test('publicProfile: resetProgress memakai DEFAULT_PROGRESS (kembali false)', () => {
  assert.match(code, /resetProgress[\s\S]*?setProgress\s*\(\s*DEFAULT_PROGRESS\s*\)/);
});

// ── Profil LENGKAP 訪問 (docs/public-profile-full.md §5.3, §10 T3) ──────────
// Sakelar TERPISAH `publicProfileFull`, default TERTUTUP. Punya aksi sendiri
// `setPublicProfileFull(on)` (diekspos ke Provider) supaya Pengaturan bisa
// memanggilnya — tanpa menyentuh `setPublicProfile` yang lama.
test('publicProfileFull: DEFAULT_PROGRESS default TERTUTUP (false)', () => {
  assert.match(code, /publicProfileFull\s*:\s*false/);
});

test('publicProfileFull: ada aksi setPublicProfileFull(on) dan diekspos ke Provider', () => {
  assert.match(code, /const\s+setPublicProfileFull\s*=\s*useCallback\s*\(/);
  assert.match(code, /value=\{\{[^}]*\bsetPublicProfileFull\b/s);
});

test('publicProfileFull: setPublicProfileFull menulis boolean (Boolean(on))', () => {
  assert.match(code, /publicProfileFull\s*:\s*Boolean\s*\(\s*on\s*\)/);
});
