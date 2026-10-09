// meijiTheme.test.js — penjaga (guard) tema Meiji pada index.css.
// Tujuan: mencegah regresi yang tak terlihat di UI — mis. bayangan brutalist
// Shōwa masuk lagi, atau selector bocor ke era lain. Baca CSS sebagai teks.
// Lihat PRD: docs/tema/meiji.md §14 (anti-brutalism) & mekanik §Kriteria.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', '..', 'index.css'), 'utf8');
const start = css.indexOf('明治 MEIJI');
// Blok Meiji berakhir di seksi berikutnya (header 日本語学園). Jangan iris ke
// akhir file — kalau tidak, seksi era lain ikut terbaca (guard jadi rapuh).
const endMarker = css.indexOf('HEADER 日本語学園', start);
const block = css.slice(start, endMarker > 0 ? endMarker : undefined);

// Ambil daftar selector unik dari blok Meiji (buang komentar & at-rule).
function selectors(text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...new Set([...clean.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim()))]
    .filter((s) => s && !s.startsWith('@') && !/^[0-9]/.test(s) && s !== 'from' && s !== 'to');
}

test('Meiji: blok CSS [data-era="meiji"] ada di index.css', () => {
  assert.ok(start > 0, 'blok 明治 MEIJI harus ada');
});

test('Meiji: ANTI-BRUTALISM — tidak ada box-shadow ber-offset (semua none)', () => {
  const shadows = [...block.matchAll(/box-shadow:\s*([^;!}]+)/g)].map((m) => m[1].trim());
  const bad = shadows.filter((s) => s !== 'none');
  assert.deepEqual(bad, [], `box-shadow non-none ditemukan: ${bad.join(', ')}`);
});

test('Meiji: setiap selector ter-gate meiji (tidak bocor ke era lain)', () => {
  const leak = selectors(block).filter((s) => !s.includes('meiji'));
  assert.deepEqual(leak, [], `selector tanpa meiji: ${leak.join(' | ')}`);
});

test('Meiji: segel 極 (Edo) TIDAK diaktifkan di Meiji — hindari dua segel', () => {
  assert.ok(!/\[data-era="meiji"\]\s*\.era-seal/.test(block), 'segel 極 tidak boleh tampil di Meiji');
  assert.ok(/\[data-era="meiji"\]\s*\.meiji-seal/.test(block), 'segel 明 harus tampil di Meiji');
});

test('Meiji: token inti terkunci (renga primer, radius 0, shadow none, font cetak)', () => {
  assert.ok(/--renga-val:\s*#9b4a3c/.test(block), 'renga #9b4a3c = warna primer');
  assert.ok(/--era-radius:\s*0px/.test(block), 'radius 0 (potongan kertas)');
  assert.ok(/--era-shadow:\s*none/.test(block), 'shadow none (anti-brutalism)');
  assert.ok(/--era-rule-color/.test(block), 'warna garis untuk gradient (bukan shorthand border)');
  assert.ok(/Shippori Mincho B1/.test(block), 'font display serif cetak');
});

test('Meiji: varian gelap ada (gaslight malam), bukan sekadar ganti hex', () => {
  assert.ok(/\.dark\[data-era="meiji"\]/.test(block), 'harus ada override gelap');
  assert.ok(/--gas-val:\s*#f0c85a/.test(block), 'gaslight malam = amber terang');
});

// ── T8: 6 kombinasi (3 era × terang/gelap) — token warna inti terdefinisi ────
// Tujuan: pastikan tiap kombinasi era×mode MENENTUKAN tokennya sendiri, tidak
// "bocor" ke base Shōwa. Kalau satu kombinasi lupa token, ia tampil sebagai era
// lain (persis risiko R2 di PRD §14).
const INTI = ['--kinari-val', '--kinari-light-val', '--sumi-val'];

test('T8: tiap era DIDESAIN mendefinisikan token inti di TERANG & GELAP (6 kombinasi)', () => {
  const eras = ['heian', 'edo', 'meiji'];
  for (const era of eras) {
    // Blok terang = selektor `[data-era="era"] {` (bukan .dark…).
    const ltStart = css.indexOf(`[data-era="${era}"] {`);
    assert.ok(ltStart >= 0, `${era}: blok terang tidak ditemukan`);
    const lt = css.slice(ltStart, css.indexOf('}', ltStart));
    // Blok gelap = `.dark[data-era="era"]`.
    const dkStart = css.indexOf(`.dark[data-era="${era}"]`);
    assert.ok(dkStart >= 0, `${era}: blok gelap tidak ditemukan`);
    const dk = css.slice(dkStart, css.indexOf('}', dkStart));
    for (const tok of INTI) {
      assert.ok(lt.includes(tok), `${era} TERANG tidak mendefinisikan ${tok} → bocor ke base`);
      assert.ok(dk.includes(tok), `${era} GELAP tidak mendefinisikan ${tok} → bocor ke base`);
    }
  }
});

test('T8: tiap era punya latar gelap BERBEDA (vibe malam tak bertabrakan)', () => {
  const bgOf = (era) => {
    const i = css.indexOf(`.dark[data-era="${era}"]`);
    const blk = css.slice(i, css.indexOf('}', i));
    const m = blk.match(/--kinari-val:\s*(#[0-9a-fA-F]{3,6})/);
    return m ? m[1].toLowerCase() : null;
  };
  const bgs = ['heian', 'edo', 'meiji'].map(bgOf);
  assert.ok(bgs.every(Boolean), `latar gelap hilang: ${JSON.stringify(bgs)}`);
  assert.equal(new Set(bgs).size, 3, `latar gelap era harus beda semua: ${bgs.join(', ')}`);
});

// ── Latar 唐草 karakusa (motif UTAMA Meiji, bukan bata poster) ──────────────
// Keputusan user: latar Meiji app harus BEDA dari poster nihongo-gakuen (yang
// bertembok bata 煉瓦). Motif utama Meiji menurut PRD tema = 唐草 karakusa
// (arabesque); bata hanya aksen. Jadi .era-pattern = sulur karakusa, bukan bata.
test('Meiji: latar = 唐草 karakusa (motif utama PRD), bukan bata poster', () => {
  const lt = block.match(/\[data-era="meiji"\]\s*\.era-pattern\s*\{([\s\S]*?)\n\}/);
  assert.ok(lt, 'Meiji harus punya rule [data-era="meiji"] .era-pattern sendiri');
  assert.ok(/url\("\/art\/meiji-karakusa-day\.svg"\)/.test(lt[1]),
    '.era-pattern Meiji siang harus pakai /art/meiji-karakusa-day.svg');
  // Bukan bata: jangan rujuk aset bata poster.
  assert.ok(!/meiji-brick/.test(lt[1]), 'latar Meiji tidak boleh pakai aset bata poster');
  // Bukan seigaiha (lingkaran gelombang) milik Edo.
  assert.ok(!/circle cx='30' cy='30'/.test(lt[1]), 'dinding Meiji tidak boleh seigaiha Edo');
  // Dinding diam — jangan dianimasikan (perf: hindari repaint).
  assert.ok(/animation:\s*none/.test(lt[1]), '.era-pattern Meiji harus animation:none (statis)');

  const dk = block.match(/\.dark\[data-era="meiji"\]\s*\.era-pattern[\s\S]*?\{([\s\S]*?)\n\}/);
  assert.ok(dk, 'harus ada varian gelap .era-pattern Meiji');
  assert.ok(/url\("\/art\/meiji-karakusa-night\.svg"\)/.test(dk[1]),
    'varian gelap harus pakai /art/meiji-karakusa-night.svg');
});
// ── Ornamen hero Meiji: 瓦斯灯 (lampu gas) + 文選 (rak 活字) ─────────────────
// Analog 提灯/暖簾 milik Edo. Harus di-gate `.meiji-ornament` (default none),
// dan lampu gas MENYALA (halo tampil) hanya di mode gelap.
test('Meiji: ornamen 瓦斯灯/文選 di-gate meiji, lampu menyala saat gelap', () => {
  assert.ok(/\.meiji-ornament\s*\{\s*display:\s*none/.test(block), 'ornamen default none');
  assert.ok(/\[data-era="meiji"\]\s*\.meiji-ornament\s*\{\s*display:\s*block/.test(block),
    'ornamen tampil di Meiji');
  assert.ok(/\.meiji-gaslight-glow\s*\{\s*display:\s*none/.test(block), 'halo padam (siang)');
  assert.ok(/\.dark\[data-era="meiji"\]\s*\.meiji-gaslight-glow[\s\S]*?display:\s*block/.test(block),
    'halo lampu gas menyala di mode gelap');
  assert.ok(/\.meiji-bunsen-kanji/.test(block), 'blok 活字 文選 ada');
});

// ── Seni kartu JLPT N5 era Meiji (銀座煉瓦街 + 瓦斯灯 + 蒸気機関車) ───────────
// Sejajar EdoPrintArt (ukiyo-e) & lukisan 月夜 Heian: kartu N5 Meiji dulu KOSONG,
// kini diisi "cetakan Meiji". Harus di-gate .meiji-art (default none) & luluh
// ke kertas lewat mask.
test('Meiji: kartu N5 = cetakan Meiji (gate meiji-art + mask luluh)', () => {
  assert.ok(/\.meiji-art\s*\{\s*display:\s*none/.test(block), 'seni default none');
  assert.ok(/\[data-era="meiji"\]\s*\.meiji-art\s*\{\s*display:\s*block/.test(block),
    'seni tampil di Meiji');
  assert.ok(/\.meiji-art--print[\s\S]*?mask-image/.test(block), 'ada mask luluh ke kertas');
  assert.ok(/\.dark\[data-era="meiji"\]\s*\.meiji-art--print[\s\S]*?mix-blend-mode:\s*screen/.test(block),
    'malam: seni menyala lembut (screen)');
});
