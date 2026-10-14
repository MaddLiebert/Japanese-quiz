// packEraGuard.test.js — penjaga GERBANG ERA untuk pack anime (JJK).
//
// Aturan pemilik: "voice pack anime cuma ada & cuma bisa dipakai di tema 多元".
// Gerbang = dihitung HIDUP dari `era`, jadi:
//   • di era lain  → voice + efek pack anime MATI (balik ke default),
//   • kembali ke 多元 → hidup lagi OTOMATIS (tanpa state baru / klik ulang).
//
// Unit test (packs.test.js + voiceKey.test.js) menjaga LOGIKA. File ini menjaga
// WIRING-nya: kalau seseorang menghapus gerbang dari EffectContext / VoiceSync /
// kartu pack, test ini gagal — karena unit test tetap hijau walau gerbang dicabut.
//
// Pola: baca sumber sebagai TEKS (tanpa React) — sama seperti
// features/anime/wiring.test.js & features/theme/cyberpunkTheme.test.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = (...p) => readFileSync(join(here, '..', '..', ...p), 'utf8');

test('EffectContext: visual pack di-gerbang era (packAllowedInEra + useEra)', () => {
  const s = src('features', 'effects', 'EffectContext.jsx');
  assert.ok(/packAllowedInEra/.test(s), 'EffectContext harus memakai packAllowedInEra');
  assert.ok(/useEra\b/.test(s), 'EffectContext harus membaca era (useEra)');
  // activeVisual dihitung lewat gerbang, bukan langsung pack?.visual.
  assert.ok(
    /activeVisual\s*=\s*[^;]*packAllowedInEra/.test(s),
    'activeVisual harus dihitung lewat packAllowedInEra (bukan langsung pack?.visual)',
  );
});

test('VoiceSync (App.jsx): mengirim packEra ke resolveVoiceKey', () => {
  const s = src('App.jsx');
  assert.ok(/resolveVoiceKey\(/.test(s), 'VoiceSync memakai resolveVoiceKey');
  assert.ok(/packEra\s*:/.test(s), 'VoiceSync harus mengirim packEra (era milik pack)');
});

test('PackCard: menandai pack terikat era dengan label 多元', () => {
  const s = src('features', 'packs', 'PackCard.jsx');
  assert.ok(/pack\.era/.test(s), 'PackCard harus membaca pack.era');
  assert.ok(/多元/.test(s), 'PackCard harus menampilkan label 多元 untuk pack anime');
});

test('Shop: daftar gacha menandai pack terikat era (label 多元)', () => {
  const s = src('features', 'shop', 'Shop.jsx');
  assert.ok(/p\.era/.test(s), 'Shop harus membaca p.era dari gachaPoolInfo');
  assert.ok(/多元/.test(s), 'Shop harus menampilkan label 多元 untuk pack anime');
});
