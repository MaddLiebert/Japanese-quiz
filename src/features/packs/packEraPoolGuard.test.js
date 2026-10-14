// packEraPoolGuard.test.js — penjaga (guard) bahwa pool gacha SADAR-ERA benar
// tersambung: roll di era non-多元 tak boleh bisa mengeluarkan pack JJK, dan
// Shop harus menampilkan peluang yang SAMA dengan yang bisa keluar.
//
// Keputusan pemilik: "tiap tema cuma bisa menang pack miliknya sendiri
// (+ sedikit pack dasar bersama)". Baca sumber sebagai teks (pola sama dengan
// cyberpunkTheme.test.js / syncAnonGuard.test.js) → cegah gerbang dicabut diam-diam.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = (...p) => readFileSync(join(here, ...p), 'utf8');

test('rollGacha: pool difilter era lewat packIdsForEra', () => {
  const s = src('..', 'progress', 'ProgressContext.jsx');
  assert.ok(/packIdsForEra/.test(s), 'ProgressContext harus memakai packIdsForEra');
  assert.ok(/rollGacha\s*=\s*useCallback\(\(\s*count\s*=\s*1\s*,\s*era/.test(s),
    'rollGacha harus menerima parameter era');
});

test('Shop: kirim era ke rollGacha, gachaPoolInfo & rarityOdds', () => {
  const s = src('..', 'shop', 'Shop.jsx');
  assert.ok(/rollGacha\(\s*count\s*,\s*era\s*\)/.test(s), 'Shop harus mengirim era ke rollGacha');
  assert.ok(/gachaPoolInfo\(\s*ownedPacks\s*,\s*era\s*\)/.test(s), 'tampilan pool harus sadar-era');
  assert.ok(/rarityOdds\(\s*era\s*\)/.test(s), 'teks odds harus sadar-era (sama dgn roll)');
});
