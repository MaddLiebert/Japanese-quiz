// firstRunGateGuard.test.js — penjaga (guard) bahwa gerbang "pertama kali"
// benar-benar TERPASANG, bukan cuma modul yang ada. Pola sama seperti
// cyberpunkTheme.test.js / syncAnonGuard.test.js: baca sumber, cek kabel.
//
// Pelajaran repo: "registry entry ≠ wiring" — modul yang lulus tes tapi tak
// diimpor siapa pun = mati. Guard ini memastikan:
//   1. FirstRunGate dirender di App.jsx (semua halaman, bukan cuma Home).
//   2. Gate lama di Home.jsx SUDAH dibuang (tidak dobel).
//   3. Ikon baru (mail/cloud) terdaftar di Glyph.jsx (nama tak terdaftar → null).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(here, ...p), 'utf8');

const app = read('..', '..', 'App.jsx');
const home = read('..', '..', 'pages', 'Home.jsx');
const glyph = read('..', '..', 'components', 'icons', 'Glyph.jsx');
const gate = read('FirstRunGate.jsx');

test('FirstRunGate dirender di App.jsx (gerbang global, bukan per-halaman)', () => {
  assert.match(app, /import\s*\{[^}]*FirstRunGate[^}]*\}\s*from\s*["']\.\/features\/onboarding\/FirstRunGate["']/,
    'App.jsx harus mengimpor FirstRunGate');
  assert.match(app, /<FirstRunGate\s*\/>/, 'App.jsx harus merender <FirstRunGate />');
});

test('gate lama di Home.jsx sudah dibuang (tidak dobel)', () => {
  assert.doesNotMatch(home, /Lanjut sebagai Tamu/,
    'modal nama lama harus hilang dari Home.jsx');
  assert.doesNotMatch(home, /!username\s*&&/,
    'kondisi gate lama (!username) harus hilang dari Home.jsx');
});

test('FirstRunGate memakai sumber tunggal firstRun.js', () => {
  assert.match(gate, /from\s*["']\.\/firstRun["']/,
    'gate harus mengimpor logika dari firstRun.js, bukan menyalinnya');
  assert.match(gate, /firstRunStep\(/, 'gate memakai firstRunStep untuk menentukan langkah');
  assert.match(gate, /methodCopy\(/, 'gate memakai methodCopy untuk teks');
});

test('Google tampil tapi mati (enabled:false) — jujur, bukan disembunyikan', () => {
  const fr = read('firstRun.js');
  assert.match(fr, /id:\s*'google'/, 'metode google harus ada di katalog');
  const block = fr.slice(fr.indexOf("id: 'google'"));
  assert.match(block.slice(0, 260), /enabled:\s*false/, 'google harus enabled:false');
  // Gate harus merender SEMUA metode (termasuk yang mati), bukan hanya yang aktif.
  assert.match(gate, /AUTH_METHODS\.map\(/, 'gate merender seluruh AUTH_METHODS');
  assert.match(gate, /disabled=\{disabled\}/, 'tombol mati harus disabled');
});

test('ikon baru (mail/cloud) terdaftar di Glyph.jsx', () => {
  assert.match(glyph, /mail:\s*Mail/, 'glyph "mail" harus terdaftar');
  assert.match(glyph, /cloud:\s*Cloud/, 'glyph "cloud" harus terdaftar');
});

test('gate memakai AuthModal untuk jalur email (tidak bikin form login baru)', () => {
  assert.match(gate, /<AuthModal/, 'gate harus memakai AuthModal yang sudah ada');
});

// Bug nyata (2026-10-22): `setChoice(m.id)` dipanggil tanpa pernah dideklarasi →
// ReferenceError di onClick → SEMUA tombol gate mati, layar macet. oxlint
// default (tanpa --deny no-undef) tidak menangkapnya, jadi dikunci di sini.
test('tidak ada state setter hantu di gate (semua setter terdeklarasi)', () => {
  const used = [...gate.matchAll(/\b(set[A-Z]\w*)\s*\(/g)].map((m) => m[1]);
  // Setter sah datang dari dua bentuk: useState ([x, setX] = …) dan
  // destructuring context/import ({ setUsername } = useUserStats()).
  const decls = [...gate.matchAll(/const\s*(?:\[[^\]]*\]|\{[^}]*\})\s*=/g)].map((m) => m[0]).join(' ');
  const declared = [...decls.matchAll(/\bset[A-Z]\w*/g)].map((m) => m[0]);
  const missing = [...new Set(used)].filter((n) => !declared.includes(n));
  assert.deepEqual(missing, [], `setter tak terdeklarasi: ${missing.join(', ')}`);
});
