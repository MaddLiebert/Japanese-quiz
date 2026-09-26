import test from 'node:test';
import assert from 'node:assert/strict';
import { WRITE_COLORS, WRITE_LEVELS, writeCanvasSize, writeQuizOptions, writeColorsFor } from './writeQuiz.js';

test('WRITE_COLORS: semua field warna hex valid', () => {
  for (const [k, v] of Object.entries(WRITE_COLORS)) {
    assert.match(v, /^#[0-9a-fA-F]{6}$/, `warna ${k} tidak valid: ${v}`);
  }
});

test('writeColorsFor: light pakai palet tinta gelap di kertas terang', () => {
  const c = writeColorsFor('light');
  // tinta gelap (sumi asli #1a1a1a) di atas kertas kinari terang
  assert.equal(c.strokeColor, WRITE_COLORS.strokeColor);
  assert.equal(c.outlineColor, WRITE_COLORS.outlineColor);
});

test('writeColorsFor: dark pakai tinta terang supaya tidak menyatu dengan kanvas', () => {
  const dark = writeColorsFor('dark');
  // sumi di dark mode = #f3efe6 (krem) — kontras tinggi di kanvas #1c1d21
  assert.equal(dark.strokeColor, '#f3efe6');
  // outline harus terang juga, bukan abu kertas
  assert.notEqual(dark.outlineColor, WRITE_COLORS.outlineColor);
  // coretan user tetap shu (aksen) — di dark shu = #ef4c3c
  assert.equal(dark.drawingColor, '#ef4c3c');
});

test('writeColorsFor: kontras tinta vs kanvas minimal 3:1 di kedua tema (WCAG non-teks)', () => {
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const CANVAS = { light: '#fdfcf9', dark: '#1c1d21' };
  for (const theme of ['light', 'dark']) {
    const c = writeColorsFor(theme);
    for (const key of ['strokeColor', 'drawingColor']) {
      const r = ratio(c[key], CANVAS[theme]);
      assert.ok(r >= 3, `${theme}.${key} kontras ${r.toFixed(2)}:1 < 3:1`);
    }
  }
});

test('writeColorsFor: tema tak dikenal → light (aman)', () => {
  assert.deepEqual(writeColorsFor('zzz'), writeColorsFor('light'));
  assert.deepEqual(writeColorsFor(), writeColorsFor('light'));
});

test('writeCanvasSize: dibatasi rentang wajar (>=220 dan <=360)', () => {
  for (const w of [320, 375, 768, 1440, 4000]) {
    const size = writeCanvasSize(w);
    assert.ok(size >= 220 && size <= 360, `size ${size} untuk width ${w}`);
  }
});

test('writeCanvasSize: layar kecil mengecil, layar besar dibatasi 360', () => {
  assert.ok(writeCanvasSize(320) <= writeCanvasSize(768));
  assert.equal(writeCanvasSize(4000), 360);
});

test('WRITE_LEVELS: 3 level, bayangan & preview sesuai', () => {
  assert.deepEqual(Object.keys(WRITE_LEVELS), ['trace', 'memory', 'blind']);
  // Level 1 (jiplak): ada bayangan, tanpa preview.
  assert.equal(WRITE_LEVELS.trace.showOutline, true);
  assert.equal(WRITE_LEVELS.trace.preview, false);
  // Level 2 (ingat): lihat animasi SEKALI dulu, lalu tanpa bayangan.
  assert.equal(WRITE_LEVELS.memory.showOutline, false);
  assert.equal(WRITE_LEVELS.memory.preview, true);
  // Level 3 (buta): langsung tanpa bayangan.
  assert.equal(WRITE_LEVELS.blind.showOutline, false);
  assert.equal(WRITE_LEVELS.blind.preview, false);
});

test('WRITE_LEVELS: XP naik tiap level (biar level susah ada imbalannya)', () => {
  assert.ok(WRITE_LEVELS.memory.xp.kana > WRITE_LEVELS.trace.xp.kana);
  assert.ok(WRITE_LEVELS.blind.xp.kana > WRITE_LEVELS.memory.xp.kana);
  assert.ok(WRITE_LEVELS.memory.xp.kanji > WRITE_LEVELS.trace.xp.kanji);
  assert.ok(WRITE_LEVELS.blind.xp.kanji > WRITE_LEVELS.memory.xp.kanji);
});

test('writeQuizOptions trace: ramah pemula (hint muncul, leniency longgar)', () => {
  const o = writeQuizOptions('trace');
  assert.equal(o.showHintAfterMisses, 3);
  assert.ok(o.leniency >= 1.2);
  assert.equal(o.highlightOnComplete, true);
  assert.equal(o.acceptBackwardsStrokes, true);   // arah terbalik dimaafkan (mode jiplak)
  assert.equal(o.markStrokeCorrectAfterMisses, false);
  assert.equal(o.quizStartStrokeNum, 0);
  assert.equal(typeof o.onCorrectStroke, 'function');
  assert.equal(typeof o.onMistake, 'function');
  assert.equal(typeof o.onComplete, 'function');
});

test('writeQuizOptions memory: hint lebih jarang, lebih ketat dari trace', () => {
  const o = writeQuizOptions('memory');
  const trace = writeQuizOptions('trace');
  assert.ok(o.showHintAfterMisses >= trace.showHintAfterMisses);
  assert.ok(o.leniency < trace.leniency);
  assert.equal(o.acceptBackwardsStrokes, true);
});

test('writeQuizOptions blind: tanpa hint, arah terbalik dihitung salah', () => {
  const o = writeQuizOptions('blind');
  assert.equal(o.showHintAfterMisses, false);
  assert.equal(o.acceptBackwardsStrokes, false);
  assert.equal(o.highlightOnComplete, true);   // feedback akhir tetap ada
});

test('writeQuizOptions: leniency menurun trace > memory > blind', () => {
  const t = writeQuizOptions('trace').leniency;
  const m = writeQuizOptions('memory').leniency;
  const b = writeQuizOptions('blind').leniency;
  assert.ok(t > m && m > b, `t=${t} m=${m} b=${b}`);
  assert.ok(b < 1, 'blind harus di bawah 1 (lebih ketat dari default)');
});

test('writeQuizOptions: level tak dikenal → fallback trace', () => {
  assert.deepEqual(
    { ...writeQuizOptions('zzz'), onCorrectStroke: 1, onMistake: 1, onComplete: 1 },
    { ...writeQuizOptions('trace'), onCorrectStroke: 1, onMistake: 1, onComplete: 1 },
  );
});

test('writeQuizOptions: handlers dikirim user diteruskan apa adanya', () => {
  const onComplete = () => {};
  const o = writeQuizOptions('trace', { onComplete });
  assert.equal(o.onComplete, onComplete);
});
