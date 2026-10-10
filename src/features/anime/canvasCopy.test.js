// canvasCopy.test.js — penjaga copy "kanvas kosong" 多元 (PRD §12 R2).
// Baris 「この頁は、まだ白い。」 = bukti kesengajaan kanvas kosong; kalau
// hilang/berubah, hero 多元 kembali terasa "era yang lupa didesain".
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANVAS_EMPTY_JP,
  CANVAS_EMPTY_TEXT,
  isCanvasEmpty,
  canvasEmptyCopy,
} from './canvasCopy.js';

test('canvasCopy: baris kanonik 白紙の頁 persis PRD §R2', () => {
  assert.equal(CANVAS_EMPTY_JP, 'この頁は、まだ白い。');
});

test('isCanvasEmpty: true saat belum punya dunia, false saat sudah punya', () => {
  assert.equal(isCanvasEmpty(null), true, 'null (pra-load) = kosong');
  assert.equal(isCanvasEmpty(undefined), true);
  assert.equal(isCanvasEmpty({}), true, 'field absen = kosong');
  assert.equal(isCanvasEmpty({ ownedFranchises: [] }), true);
  assert.equal(isCanvasEmpty({ ownedFranchises: ['hoshi'] }), false);
  assert.equal(isCanvasEmpty({ ownedFranchises: ['hoshi', 'kage'] }), false);
});

test('canvasEmptyCopy: jp kanonik + terjemahan mengikuti bahasa', () => {
  assert.equal(canvasEmptyCopy('id').jp, CANVAS_EMPTY_JP);
  assert.equal(canvasEmptyCopy('id').text, CANVAS_EMPTY_TEXT.id);
  assert.equal(canvasEmptyCopy('en').text, CANVAS_EMPTY_TEXT.en);
  assert.equal(canvasEmptyCopy().text, CANVAS_EMPTY_TEXT.id, 'default = ID');
  // Dua bahasa harus BEDA (bukan placeholder kembar).
  assert.notEqual(CANVAS_EMPTY_TEXT.id, CANVAS_EMPTY_TEXT.en);
});
