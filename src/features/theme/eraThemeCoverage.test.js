// eraThemeCoverage.test.js — PENJAGA: setiap era yang terdaftar di eras.js
// WAJIB punya tema sendiri (blok CSS [data-era="…"]), atau secara eksplisit
// ditandai "belum didesain". Ini mencegah pola yang berulang: era baru ditambah
// ke eras.js tapi CSS-nya lupa → era itu jatuh ke BASE (yang masih ber-DNA
// Shōwa) dan "bagian Shōwa ketinggalan" (kritik user, berulang).
//
// CARA PAKAI saat menambah era baru:
//   1. Tambah ke ERAS (eras.js).
//   2. Test ini akan GAGAL sampai kamu memutuskan: pindahkan id ke DIDESAIN
//      (dan tulis blok CSS-nya) atau ke BELUM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ERAS } from './eras.js';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', '..', 'index.css'), 'utf8');

// Era yang SUDAH punya tema lengkap (blok [data-era="…"] di index.css).
const DIDESAIN = ['heian', 'edo', 'meiji', 'showa'];
// Era yang BELUM didesain → sengaja pakai base untuk sekarang. Pindahkan ke
// DIDESAIN begitu temanya dibuat.
const BELUM = ['anime', 'cyberpunk'];

test('setiap era di ERAS terdaftar sebagai DIDESAIN atau BELUM (tak boleh diam-diam)', () => {
  const known = new Set([...DIDESAIN, ...BELUM]);
  const unknown = ERAS.map((e) => e.id).filter((id) => !known.has(id));
  assert.deepEqual(unknown, [],
    `era baru wajib didaftarkan di eraThemeCoverage.test.js (DIDESAIN/BELUM): ${unknown.join(', ')}`);
});

test('DIDESAIN + BELUM persis menutup semua era di ERAS (tak ada yatim)', () => {
  const ids = ERAS.map((e) => e.id).sort();
  const listed = [...DIDESAIN, ...BELUM].sort();
  assert.deepEqual(listed, ids);
});

test('setiap era DIDESAIN punya blok CSS [data-era="…"] (kalau tidak → jatuh ke base Shōwa)', () => {
  for (const id of DIDESAIN) {
    assert.ok(css.includes(`[data-era="${id}"]`),
      `era "${id}" tidak punya blok CSS [data-era="${id}"] → akan tampil sebagai Shōwa`);
  }
});

test('setiap era DIDESAIN punya varian gelap (.dark[data-era="…"])', () => {
  for (const id of DIDESAIN) {
    assert.ok(css.includes(`.dark[data-era="${id}"]`),
      `era "${id}" tidak punya override gelap .dark[data-era="${id}"]`);
  }
});

test('setiap era DIDESAIN mendefinisikan token bentuk anti-brutalism (--era-shadow)', () => {
  for (const id of DIDESAIN) {
    const start = css.indexOf(`[data-era="${id}"] {`);
    assert.ok(start >= 0, `blok token [data-era="${id}"] { tidak ditemukan`);
    const block = css.slice(start, css.indexOf('}', start));
    assert.ok(/--era-shadow:/.test(block),
      `era "${id}" tidak mendefinisikan --era-shadow`);
  }
});

test('tidak ada blok [data-era="…"] di CSS untuk era yang TIDAK terdaftar di ERAS', () => {
  const inCss = [...new Set([...css.matchAll(/\[data-era="([a-z-]+)"\]/g)].map((m) => m[1]))];
  const ids = new Set(ERAS.map((e) => e.id));
  const stray = inCss.filter((id) => !ids.has(id));
  assert.deepEqual(stray, [], `blok CSS untuk era tak dikenal (salah ketik?): ${stray.join(', ')}`);
});
