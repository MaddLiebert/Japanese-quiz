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

test('gachaCopy: era tanpa tema → teks lama, tidak ikut berubah', () => {
  // Pakai era fiktif ('taisho') — 電脳 kini punya tema ハック sendiri.
  const en = gachaCopy('taisho', 'en');
  assert.equal(en.title, 'Rusty Gashapon');
  assert.equal(en.pull10, 'PULL 10X');
  assert.equal(en.watermark, '玉');

  // Era yang memang belum punya tema → fallback teks lama. (電脳 dulu dipakai
  // di sini; sejak ハック dibuat, ia punya tema sendiri — pakai id fiktif.)
  const id = gachaCopy('taisho', 'id');
  assert.equal(id.title, 'Gashapon Berkarat');
  assert.equal(id.pull1, 'TARIK 1X');
  assert.equal(id.titleSub, '');
});

test('gachaCopy(meiji): 福引 kanji, bukan teks lama', () => {
  const T = gachaCopy('meiji', 'id');
  assert.equal(T.title, '福引');
  assert.equal(T.watermark, '福');
  assert.equal(T.pull1, '引く 1本');
  assert.notEqual(T.title, 'Gashapon Berkarat');
  assert.notEqual(T.title, 'かいあわせ');
  assert.notEqual(T.title, '富くじ');
});

test('gachaCopy(edo): 富くじ kanji, bukan teks lama', () => {
  const T = gachaCopy('edo', 'id');
  assert.equal(T.title, '富くじ');
  assert.equal(T.watermark, '富');
  assert.equal(T.pull1, '引く 1枚');
  // Edo bukan Heian, dan bukan legacy.
  assert.notEqual(T.title, 'Gashapon Berkarat');
  assert.notEqual(T.title, 'かいあわせ');
});

test('gachaCopy: Heian tidak bergantung bahasa (flavor kana tetap)', () => {
  assert.deepEqual(gachaCopy('heian', 'id'), gachaCopy('heian', 'en'));
});

test('gachaCopy: hasil selalu salinan baru (tidak bisa merusak konstanta)', () => {
  const a = gachaCopy('heian', 'id');
  a.title = 'X';
  assert.equal(HEIAN_GACHA.title, 'かいあわせ');
});
