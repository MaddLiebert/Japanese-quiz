import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REEL_COUNT,
  REEL_MS,
  STRIP_LEN,
  SYMBOL_POOL,
  buildStrip,
  buildStrips,
  reelTargetIcons,
  maxRarity,
  totalSpinMs,
  REEL_EASE,
  REEL_FADE,
  HEIAN_SHELL_PAIRS,
  HEIAN_SHELL_SLOTS,
  HEIAN_SHELL_MS,
  HEIAN_SHELL_POOL,
  HEIAN_SHELL_FADE,
  buildShellStrip,
  buildShellStrips,
} from './slot.js';

test('konstanta dasar masuk akal', () => {
  assert.equal(REEL_COUNT, 3);
  assert.equal(REEL_MS.length, REEL_COUNT);
  assert.ok(STRIP_LEN >= 8);
  assert.ok(SYMBOL_POOL.length >= 4);
});

test('durasi spin panjang & reel berhenti berurutan', () => {
  assert.ok(REEL_MS[0] >= 2500, 'reel pertama minimal 2.5s');
  assert.ok(REEL_MS[REEL_COUNT - 1] >= 4000, 'reel terakhir minimal 4s');
  for (let i = 1; i < REEL_MS.length; i++) {
    assert.ok(REEL_MS[i] > REEL_MS[i - 1], 'tiap reel berhenti setelah reel sebelumnya');
  }
});

test('strip cukup panjang untuk putaran mulus', () => {
  assert.ok(STRIP_LEN >= 24, 'makin banyak simbol = gerak makin mengalir');
});

test('REEL_EASE & REEL_FADE valid', () => {
  assert.equal(REEL_EASE.length, 4);
  assert.ok(REEL_EASE.every((n) => Number.isFinite(n) && n >= 0 && n <= 1));
  assert.ok(REEL_FADE > 0, 'fade tepi harus aktif untuk kesan kedalaman');
});

test('buildStrip: panjang benar & elemen terakhir = target', () => {
  const strip = buildStrip('🎯', ['a', 'b'], 6, () => 0);
  assert.equal(strip.length, 6);
  assert.equal(strip[5], '🎯');
  assert.ok(strip.slice(0, 5).every((s) => s === 'a'));
});

test('buildStrip: semua elemen (kecuali target) berasal dari pool', () => {
  let n = 0;
  const rng = () => { n = (n + 0.37) % 1; return n; };
  const strip = buildStrip('🎯', ['a', 'b', 'c'], 10, rng);
  assert.ok(strip.slice(0, 9).every((s) => ['a', 'b', 'c'].includes(s)));
});

test('buildStrip: length < 1 ditolak', () => {
  assert.throws(() => buildStrip('🎯', ['a'], 0), /length/);
});

test('buildStrips: 3 reel, tiap strip berakhir di target masing-masing', () => {
  const strips = buildStrips(['A', 'B', 'C'], ['x'], 5, () => 0);
  assert.equal(strips.length, REEL_COUNT);
  assert.equal(strips[0][4], 'A');
  assert.equal(strips[1][4], 'B');
  assert.equal(strips[2][4], 'C');
});

test('buildStrips: target lebih sedikit dari reel → dipakai berulang', () => {
  const strips = buildStrips(['A'], ['x'], 5, () => 0);
  assert.deepEqual(strips.map((s) => s[4]), ['A', 'A', 'A']);
});

test('reelTargetIcons: hasil kosong → semua reel pakai simbol pertama pool', () => {
  const icons = reelTargetIcons([], () => 'X');
  assert.deepEqual(icons, [SYMBOL_POOL[0], SYMBOL_POOL[0], SYMBOL_POOL[0]]);
});

test('reelTargetIcons: memetakan hasil lewat iconOf', () => {
  const icons = reelTargetIcons([{ id: 'a' }, { id: 'b' }], (r) => `i-${r.id}`);
  assert.deepEqual(icons, ['i-a', 'i-b', 'i-a']);
});

test('maxRarity: pilih tingkat tertinggi', () => {
  assert.equal(maxRarity(['common', 'rare', 'common']), 'rare');
  assert.equal(maxRarity(['common', 'legendary', 'rare']), 'legendary');
  assert.equal(maxRarity(['common', 'special', 'legendary']), 'special');
  assert.equal(maxRarity(['common']), 'common');
  assert.equal(maxRarity([]), 'common');
  assert.equal(maxRarity(['ngawur', 'rare']), 'rare');
});

test('totalSpinMs: durasi total > reel terakhir', () => {
  assert.ok(totalSpinMs() > REEL_MS[REEL_COUNT - 1]);
});

// ── Era Heian: 貝合わせ (cocokkan kerang) ────────────────────────────────────
test('Heian: 3 pasang = 6 keping, pasangan berhenti berurutan', () => {
  assert.equal(HEIAN_SHELL_PAIRS, 3);
  assert.equal(HEIAN_SHELL_SLOTS, HEIAN_SHELL_PAIRS * 2);
  assert.equal(HEIAN_SHELL_MS.length, HEIAN_SHELL_PAIRS);
  for (let i = 1; i < HEIAN_SHELL_MS.length; i++) {
    assert.ok(HEIAN_SHELL_MS[i] > HEIAN_SHELL_MS[i - 1], 'pasangan berhenti setelah pasangan sebelumnya');
  }
  assert.ok(HEIAN_SHELL_POOL.length >= 4, 'pool simbol kerang cukup beragam');
  assert.ok(HEIAN_SHELL_FADE > 0);
});

test('buildShellStrips: 6 keping, dua keping sepasang berakhir di target SAMA', () => {
  const strips = buildShellStrips(['A', 'B', 'C'], ['x'], 5, () => 0);
  assert.equal(strips.length, HEIAN_SHELL_SLOTS);
  // pasangan 0 = keping 0 & 1 → keduanya target 'A' (itulah "mencocokkan")
  assert.equal(strips[0][4], 'A');
  assert.equal(strips[1][4], 'A');
  assert.equal(strips[2][4], 'B');
  assert.equal(strips[3][4], 'B');
  assert.equal(strips[4][4], 'C');
  assert.equal(strips[5][4], 'C');
});

test('buildShellStrips: target lebih sedikit dari pasangan → dipakai berulang', () => {
  const strips = buildShellStrips(['A'], ['x'], 5, () => 0);
  assert.deepEqual(strips.map((s) => s[4]), ['A', 'A', 'A', 'A', 'A', 'A']);
});

test('buildShellStrip: panjang benar & elemen terakhir = target', () => {
  const strip = buildShellStrip('貝', ['a', 'b'], 6, () => 0);
  assert.equal(strip.length, 6);
  assert.equal(strip[5], '貝');
});
