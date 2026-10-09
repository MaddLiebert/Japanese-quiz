import test from 'node:test';
import assert from 'node:assert/strict';
import { SHOWA_GACHA, isShowa, gachaCopyShowa } from './showaCopy.js';
import { gachaCopy } from './heianCopy.js';

// Kana (Hiragana/Katakana) & Kanji — label utama Shōwa memakai KANJI +
// KATAKANA (era modern), bukan kana-saja seperti Heian.
const HIRAGANA = /[\u3040-\u309f]/;
const KATAKANA = /[\u30a0-\u30ff]/;
const KANJI = /[\u4e00-\u9fff]/;

test('isShowa: hanya "showa" yang dianggap Shōwa', () => {
  assert.equal(isShowa('showa'), true);
  assert.equal(isShowa('meiji'), false);
  assert.equal(isShowa('edo'), false);
  assert.equal(isShowa(undefined), false);
  assert.equal(isShowa(null), false);
});

test('SHOWA_GACHA: judul ガチャガチャ + watermark 玉 (kapsul gacha)', () => {
  assert.equal(SHOWA_GACHA.title, 'ガチャガチャ');
  assert.equal(SHOWA_GACHA.watermark, '玉');
  assert.equal(SHOWA_GACHA.pull1, '回す 1回');
  assert.equal(SHOWA_GACHA.pull10, '回す 10回');
  assert.equal(SHOWA_GACHA.contents, 'カプセルの中身');
});

test('label utama Shōwa memakai KANJI+KATAKANA (era modern, beda dari kana Heian)', () => {
  assert.ok(KANJI.test(SHOWA_GACHA.kicker), 'kicker 運試し memuat kanji');
  assert.ok(KATAKANA.test(SHOWA_GACHA.title), 'title ガチャガチャ memuat katakana ガチャ');
  assert.ok(KANJI.test(SHOWA_GACHA.tagline), 'tagline memuat kanji');
  // Bukan kana-saja (Heian) — judul pakai KATAKANA, bukan hiragana.
  assert.ok(!HIRAGANA.test(SHOWA_GACHA.title), 'title bukan hiragana (beda dari Heian)');
  assert.ok(KANJI.test(SHOWA_GACHA.contents), 'contents カプセルの中身 memuat kanji 中身');
});

test('SHOWA_GACHA: field lengkap (kontrak UI sama dengan Heian/Edo/Meiji/legacy)', () => {
  const keys = ['kicker', 'title', 'titleSub', 'tagline', 'pull1', 'pull10', 'contents', 'ownedSuffix', 'toBackpack', 'resultTitle', 'skip', 'close', 'watermark'];
  for (const k of keys) assert.ok(SHOWA_GACHA[k], `field ${k} kosong`);
});

test('gachaCopyShowa: hasil selalu salinan baru (konstanta aman)', () => {
  const a = gachaCopyShowa();
  a.title = 'X';
  assert.equal(SHOWA_GACHA.title, 'ガチャガチャ');
  assert.notEqual(gachaCopyShowa(), a);
});

test('gachaCopy dispatcher: showa → ガチャガチャ, tidak bocor ke Heian/Edo/Meiji/legacy', () => {
  assert.equal(gachaCopy('showa', 'id').title, 'ガチャガチャ');
  assert.equal(gachaCopy('showa', 'en').title, 'ガチャガチャ'); // tidak bergantung bahasa
  assert.equal(gachaCopy('heian', 'id').title, 'かいあわせ');
  assert.equal(gachaCopy('edo', 'id').title, '富くじ');
  assert.equal(gachaCopy('meiji', 'id').title, '福引');
  // Bukan lagi teks legacy.
  assert.notEqual(gachaCopy('showa', 'id').title, 'Gashapon Berkarat');
});

test('gachaCopy: Shōwa beda dari Heian/Edo/Meiji (kontras tema)', () => {
  assert.notDeepEqual(gachaCopy('showa', 'id'), gachaCopy('heian', 'id'));
  assert.notDeepEqual(gachaCopy('showa', 'id'), gachaCopy('edo', 'id'));
  assert.notDeepEqual(gachaCopy('showa', 'id'), gachaCopy('meiji', 'id'));
});
