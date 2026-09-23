import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HINA_CHIBI_PALETTE, HINA_CHIBI_PIXELS, hinaChibiRects,
  HINA_CHIBI_ROWS, HINA_CHIBI_COLS, HINA_CHIBI_PX, HINA_CHIBI_W, HINA_CHIBI_H,
} from './hinaChibiPixels.js';

test('grid: semua baris sama panjang & karakter dikenal palet', () => {
  assert.ok(HINA_CHIBI_ROWS >= 8, 'minimal 8 baris');
  for (const row of HINA_CHIBI_PIXELS) {
    assert.equal(row.length, HINA_CHIBI_COLS, 'semua baris harus sama panjang');
    for (const ch of row) assert.ok(ch in HINA_CHIBI_PALETTE, `karakter tak dikenal: "${ch}"`);
  }
});

test('ukuran kelipatan bulat (crisp, bukan blur)', () => {
  assert.equal(HINA_CHIBI_W, HINA_CHIBI_COLS * HINA_CHIBI_PX);
  assert.equal(HINA_CHIBI_H, HINA_CHIBI_ROWS * HINA_CHIBI_PX);
  assert.ok(Number.isInteger(HINA_CHIBI_PX) && HINA_CHIBI_PX > 0);
});

test('hinaChibiRects: jumlah = pixel opaque, koordinat dalam batas', () => {
  const rects = hinaChibiRects();
  const opaque = HINA_CHIBI_PIXELS.join('').split('').filter((c) => HINA_CHIBI_PALETTE[c]).length;
  assert.equal(rects.length, opaque);
  assert.ok(rects.length > 0);
  for (const r of rects) {
    assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= HINA_CHIBI_W && r.y + r.h <= HINA_CHIBI_H);
    assert.match(r.color, /^#[0-9a-f]{6}$/i);
  }
});

test('deterministik', () => {
  assert.deepEqual(hinaChibiRects(), hinaChibiRects());
});
