// ─────────────────────────────────────────────────────────────────────────────
// eraDarkMode.test.js — T8 (PRD docs/tema/showa.md §12) & R3.
//
// Uji 8 KOMBINASI (4 era × terang/gelap). Tujuan: pastikan tiap kombinasi
// era×mode MENENTUKAN tampilannya sendiri — tidak "bocor" ke era lain, dan
// mode gelap tiap era benar-benar MALAM (beda dari siangnya). Kalau satu
// kombinasi lupa token, ia tampil sebagai era lain (risiko R3).
//
// ⚠️ PRINSIP #0 (§0): Shōwa = tema ASLI app. Ia MENG-ECHO base `:root`
//    (bukan mengganti) — jadi Shōwa SENGAJA tidak menimpa --kinari-val dsb.
//    Guard ini memperlakukan Shōwa sebagai ECHO: token intinya = base, dan
//    malamnya = 夜の団地 (beton gelap + sodium menyala), bukan sekadar ganti hex.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ERAS } from './eras.js';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', '..', 'index.css'), 'utf8');

// Blok token TERANG = `[data-era="era"] {` (bukan `.dark…`).
const lightBlock = (era) => {
  const i = css.indexOf(`[data-era="${era}"] {`);
  return i < 0 ? null : css.slice(i, css.indexOf('}', i));
};
// Blok token GELAP = `.dark[data-era="era"], [data-theme="dark"][data-era="era"] {`
// (bentuk blok token SELALU berkoma; selector elemen seperti
// `.dark[data-era="x"] .foo {` tidak — itu bukan blok token).
const darkBlock = (era) => {
  const i = css.indexOf(`.dark[data-era="${era}"],`);
  return i < 0 ? null : css.slice(i, css.indexOf('}', i));
};

const DESIGNED = ['heian', 'edo', 'meiji', 'showa', 'anime', 'cyberpunk'];

test('T8: 6 era terdaftar (heian/edo/meiji/showa/anime/cyberpunk) & terdaftar di ERAS', () => {
  const ids = new Set(ERAS.map((e) => e.id));
  for (const era of DESIGNED) assert.ok(ids.has(era), `${era} harus ada di ERAS`);
});

test('T8: tiap era punya blok token TERANG & GELAP (12 kombinasi lengkap)', () => {
  for (const era of DESIGNED) {
    assert.ok(lightBlock(era), `${era}: blok terang [data-era="${era}"] { hilang`);
    assert.ok(darkBlock(era), `${era}: blok gelap .dark[data-era="${era}"] hilang`);
  }
});

// Heian/Edo/Meiji/Anime/Cyberpunk DIDESAIN penuh → wajib menentukan token inti
// sendiri di terang & gelap (kalau lupa → bocor ke base Shōwa).
test('T8: Heian/Edo/Meiji/Anime/Cyberpunk menentukan --kinari-val sendiri di terang & gelap', () => {
  for (const era of ['heian', 'edo', 'meiji', 'anime', 'cyberpunk']) {
    assert.ok(/--kinari-val:/.test(lightBlock(era)), `${era} TERANG lupa --kinari-val`);
    assert.ok(/--kinari-val:/.test(darkBlock(era)), `${era} GELAP lupa --kinari-val`);
  }
});

// Shōwa = ECHO base: SENGAJA tidak menimpa kertas/int. Justru ini yang
// membedakannya (ia memformalkan base, bukan tema baru).
test('T8: Shōwa ECHO base — tidak menimpa --kinari-val/--sumi-val (§0)', () => {
  assert.ok(!/--kinari-val:/.test(lightBlock('showa')), 'Shōwa terang TIDAK boleh menimpa --kinari-val (echo base)');
  assert.ok(!/--kinari-val:/.test(darkBlock('showa')), 'Shōwa gelap TIDAK boleh menimpa --kinari-val (echo base)');
  assert.ok(!/--sumi-val:/.test(lightBlock('showa')), 'Shōwa terang TIDAK boleh menimpa --sumi-val (echo base)');
});

// Malam tiap era benar-benar malam: --kinari-val gelap ≠ terang.
test('T8: tiap era gelap = latar GELAP (bukan sekadar ganti nama)', () => {
  const hex = (block, tok) => {
    const m = block && block.match(new RegExp(`${tok}:\\s*(#[0-9a-fA-F]{3,6})`));
    return m ? m[1].toLowerCase() : null;
  };
  for (const era of ['heian', 'edo', 'meiji']) {
    const lt = hex(lightBlock(era), '--kinari-val');
    const dk = hex(darkBlock(era), '--kinari-val');
    assert.ok(lt && dk, `${era}: --kinari-val terang/gelap harus ada`);
    assert.notEqual(lt, dk, `${era}: malam harus beda dari siang`);
  }
  // Shōwa: echo base → malam = base `.dark` (#141517). Token malamnya sendiri
  // (beton) harus lebih gelap dari siangnya.
  assert.ok(/--concrete-val:\s*#5a5a55/.test(darkBlock('showa')), 'Shōwa malam: beton menggelap #5a5a55');
  assert.ok(/--concrete-val:\s*#8c8c85/.test(lightBlock('showa')), 'Shōwa siang: beton #8c8c85');
});

test('T8: latar gelap 4 era saling BEDA (vibe malam tak bertabrakan)', () => {
  const darkBg = (era) => {
    const b = darkBlock(era);
    const m = b && b.match(/--kinari-val:\s*(#[0-9a-fA-F]{3,6})/);
    return m ? m[1].toLowerCase() : null;
  };
  const bgs = ['heian', 'edo', 'meiji'].map(darkBg);
  assert.ok(bgs.every(Boolean), `latar gelap hilang: ${JSON.stringify(bgs)}`);
  assert.equal(new Set(bgs).size, 3, `latar gelap 3 era harus beda: ${bgs.join(', ')}`);
  // Shōwa tidak menimpa → memakai base gelap #141517 (echo), beda dari 3 era lain.
  const baseDark = (css.match(/\.dark, \[data-theme="dark"\] \{[\s\S]*?--kinari-val:\s*(#[0-9a-fA-F]{3,6})/) || [])[1];
  assert.equal(baseDark && baseDark.toLowerCase(), '#141517', 'base gelap = #141517');
  assert.ok(!bgs.includes('#141517'), 'Shōwa (base #141517) harus beda dari heian/edo/meiji');
});

test('T8: Shōwa malam = 夜の団地 (jendela beton menyala, sodium lebih terang)', () => {
  const dk = darkBlock('showa');
  assert.ok(/--sodium-val:\s*#e0b050/.test(dk), 'malam: sodium menyala lebih terang #e0b050');
  assert.ok(/--gin-nezu-val:\s*#6e6c64/.test(dk), 'malam: abu perak menggelap #6e6c64');
  // Jendela 団地 menyala di malam (halo sodium).
  assert.ok(/\.dark\[data-era="showa"\]\s*\.showa-art-window[\s\S]*?fill:\s*#ffe6a6/.test(css),
    'malam: jendela 団地 menyala #ffe6a6');
});
