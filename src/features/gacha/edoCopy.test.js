import test from 'node:test';
import assert from 'node:assert/strict';
import { EDO_GACHA, isEdo, gachaCopyEdo } from './edoCopy.js';
import { gachaCopy } from './heianCopy.js';

// Kana (Hiragana/Katakana) — label utama Edo TIDAK boleh kana-saja seperti
// Heian; Edo = era cetak, memakai kanji + furigana.
const KANA = /[\u3040-\u309f\u30a0-\u30ff]/;
const KANJI = /[\u4e00-\u9fff]/;

test('isEdo: hanya "edo" yang dianggap Edo', () => {
  assert.equal(isEdo('edo'), true);
  assert.equal(isEdo('heian'), false);
  assert.equal(isEdo(undefined), false);
  assert.equal(isEdo(null), false);
});

test('EDO_GACHA: judul 富くじ + watermark 富 (lotre 木札 dari 富箱)', () => {
  assert.equal(EDO_GACHA.title, '富くじ');
  assert.equal(EDO_GACHA.watermark, '富');
  assert.equal(EDO_GACHA.pull1, '引く 1枚');
  assert.equal(EDO_GACHA.pull10, '引く 10枚');
  assert.equal(EDO_GACHA.contents, '木札の中身');
});

test('label utama Edo memakai KANJI (era cetak, beda dari kana Heian)', () => {
  assert.ok(KANJI.test(EDO_GACHA.kicker), 'kicker 運試し memuat kanji');
  assert.ok(KANJI.test(EDO_GACHA.title), 'title 富くじ memuat kanji');
  assert.ok(KANJI.test(EDO_GACHA.tagline), 'tagline memuat kanji');
  // Bukan kana-saja (Heian) — setidaknya satu field punya kanji.
  assert.ok(!(KANA.test(EDO_GACHA.title) && !KANJI.test(EDO_GACHA.title)));
});

test('EDO_GACHA: field lengkap (kontrak UI sama dengan Heian/legacy)', () => {
  const keys = ['kicker', 'title', 'titleSub', 'tagline', 'pull1', 'pull10', 'contents', 'ownedSuffix', 'toBackpack', 'resultTitle', 'skip', 'close', 'watermark'];
  for (const k of keys) assert.ok(EDO_GACHA[k], `field ${k} kosong`);
});

test('gachaCopyEdo: hasil selalu salinan baru (konstanta aman)', () => {
  const a = gachaCopyEdo();
  a.title = 'X';
  assert.equal(EDO_GACHA.title, '富くじ');
  assert.notEqual(gachaCopyEdo(), a);
});

test('gachaCopy dispatcher: edo → 富くじ, tidak bocor ke Heian/legacy', () => {
  assert.equal(gachaCopy('edo', 'id').title, '富くじ');
  assert.equal(gachaCopy('edo', 'en').title, '富くじ'); // tidak bergantung bahasa
  assert.equal(gachaCopy('heian', 'id').title, 'かいあわせ');
  assert.equal(gachaCopy('showa', 'id').title, 'Gashapon Berkarat');
});

test('gachaCopy: Heian & Edo beda (kontras tema)', () => {
  assert.notDeepEqual(gachaCopy('heian', 'id'), gachaCopy('edo', 'id'));
});
