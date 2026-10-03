import test from 'node:test';
import assert from 'node:assert/strict';
import { HEIAN_GACHA, gachaCopy, isHeian } from './heianCopy.js';

// Kanji (CJK Unified Ideographs). Label utama Heian WAJIB bebas kanji —
// pemain belum bisa kanji, jadi semua istilah tampil sebagai KANA.
const KANJI = /[\u4e00-\u9fff]/;

test('isHeian: hanya "heian" yang dianggap Heian', () => {
  assert.equal(isHeian('heian'), true);
  assert.equal(isHeian('edo'), false);
  assert.equal(isHeian('showa'), false);
  assert.equal(isHeian(undefined), false);
  assert.equal(isHeian(null), false);
});

test('gachaCopy(heian): judul & watermark = kana/kerang', () => {
  const T = gachaCopy('heian', 'id');
  assert.equal(T.title, 'かいあわせ');
  assert.equal(T.watermark, '貝');
  assert.equal(T.pull1, 'ひく 1まい');
  assert.equal(T.pull10, 'ひく 10まい');
  assert.equal(T.contents, 'かいの なかみ');
});

test('label utama Heian BEBAS kanji (kana saja) — syarat "belum bisa kanji"', () => {
  const T = HEIAN_GACHA;
  for (const key of ['kicker', 'title', 'tagline', 'pull1', 'pull10', 'contents', 'ownedSuffix', 'toBackpack', 'resultTitle', 'skip', 'close']) {
    assert.ok(!KANJI.test(T[key]), `label Heian "${key}" tidak boleh mengandung kanji: ${T[key]}`);
  }
  // titleSub justru satu-satunya tempat kanji (lapisan belajar) — dan harus ada.
  assert.ok(KANJI.test(T.titleSub), 'titleSub sengaja memuat kanji sebagai lapisan belajar');
});

test('gachaCopy: era selain Heian → teks lama, tidak ikut berubah', () => {
  const id = gachaCopy('showa', 'id');
  assert.equal(id.title, 'Gashapon Berkarat');
  assert.equal(id.pull1, 'TARIK 1X');
  assert.equal(id.watermark, '玉');
  assert.equal(id.titleSub, '');

  const en = gachaCopy('edo', 'en');
  assert.equal(en.title, 'Rusty Gashapon');
  assert.equal(en.pull10, 'PULL 10X');
  assert.equal(en.watermark, '玉');
});

test('gachaCopy: Heian tidak bergantung bahasa (flavor kana tetap)', () => {
  assert.deepEqual(gachaCopy('heian', 'id'), gachaCopy('heian', 'en'));
});

test('gachaCopy: hasil selalu salinan baru (tidak bisa merusak konstanta)', () => {
  const a = gachaCopy('heian', 'id');
  a.title = 'X';
  assert.equal(HEIAN_GACHA.title, 'かいあわせ');
});
