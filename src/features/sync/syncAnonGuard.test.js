// syncAnonGuard.test.js — penjaga (guard) anti "akun anonim dobel".
//
// Konteks bug (2026-10-14): user klik "Aktifkan Sinkronisasi" → leaderboard
// menampilkan dirinya DUA kali. Akar: `signInAnonymously()` tidak idempoten —
// tiap panggilan membuat USER BARU. React StrictMode (dev) men-mount efek dua
// kali + klik ganda → dua akun → dua baris leaderboard.
//
// Aturan yang dikunci di sini:
//   1. Pembuatan sesi anonim WAJIB lewat helper single-flight (`ensureAnonSession`).
//   2. TIDAK boleh ada panggilan `signInAnonymously()` langsung di tempat lain.
//   3. Bootstrap & enableSync memakai helper itu.
//
// Baca SyncContext.jsx sebagai teks (pola sama seperti guard tema lain).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, 'SyncContext.jsx'), 'utf8');

// Buang komentar supaya tidak "membaca" kalimat di komentar sendiri.
const code = src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

test('anon: sesi anonim dibuat lewat helper single-flight', () => {
  assert.match(code, /const\s+ensureAnonSession\s*=\s*createSingleFlight\s*\(/);
  assert.match(code, /import\s*\{\s*createSingleFlight\s*\}\s*from\s*['"]\.\/singleFlight['"]/);
});

test('anon: TIDAK ada signInAnonymously() langsung (selain di helper)', () => {
  const calls = code.match(/signInAnonymously\s*\(/g) || [];
  // Hanya SATU panggilan — di dalam ensureAnonSession.
  assert.equal(calls.length, 1, `ditemukan ${calls.length} panggilan signInAnonymously (harus 1)`);
});

test('anon: bootstrap & enableSync memakai ensureAnonSession', () => {
  const uses = code.match(/await\s+ensureAnonSession\s*\(/g) || [];
  assert.ok(uses.length >= 2, `ensureAnonSession dipakai ${uses.length}× (harus >= 2: bootstrap + enableSync)`);
});
