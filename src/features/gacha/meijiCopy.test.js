import test from 'node:test';
import assert from 'node:assert/strict';
import { MEIJI_GACHA, isMeiji, gachaCopyMeiji } from './meijiCopy.js';
import { gachaCopy } from './heianCopy.js';

// Kana (Hiragana/Katakana) — label utama Meiji TIDAK boleh kana-saja seperti
// Heian; Meiji = era cetak modern, memakai kanji + furigana.
const KANA = /[\u3040-\u309f\u30a0-\u30ff]/;
const KANJI = /[\u4e00-\u9fff]/;

test('isMeiji: hanya "meiji" yang dianggap Meiji', () => {
  assert.equal(isMeiji('meiji'), true);
  assert.equal(isMeiji('edo'), false);
  assert.equal(isMeiji(undefined), false);
  assert.equal(isMeiji(null), false);
});

test('MEIJI_GACHA: judul 福引 + watermark 福 (undian 福箱)', () => {
  assert.equal(MEIJI_GACHA.title, '福引');
  assert.equal(MEIJI_GACHA.watermark, '福');
  assert.equal(MEIJI_GACHA.pull1, '引く 1本');
  assert.equal(MEIJI_GACHA.pull10, '引く 10本');
  assert.equal(MEIJI_GACHA.contents, '福箱の中身');
});

test('label utama Meiji memakai KANJI (era cetak modern, beda dari kana Heian)', () => {
  assert.ok(KANJI.test(MEIJI_GACHA.kicker), 'kicker 運試し memuat kanji');
  assert.ok(KANJI.test(MEIJI_GACHA.title), 'title 福引 memuat kanji');
  assert.ok(KANJI.test(MEIJI_GACHA.tagline), 'tagline memuat kanji');
  assert.ok(!(KANA.test(MEIJI_GACHA.title) && !KANJI.test(MEIJI_GACHA.title)));
});

test('MEIJI_GACHA: field lengkap (kontrak UI sama dengan Heian/Edo/legacy)', () => {
  const keys = ['kicker', 'title', 'titleSub', 'tagline', 'pull1', 'pull10', 'contents', 'ownedSuffix', 'toBackpack', 'resultTitle', 'skip', 'close', 'watermark'];
  for (const k of keys) assert.ok(MEIJI_GACHA[k], `field ${k} kosong`);
});

test('gachaCopyMeiji: hasil selalu salinan baru (konstanta aman)', () => {
  const a = gachaCopyMeiji();
  a.title = 'X';
  assert.equal(MEIJI_GACHA.title, '福引');
  assert.notEqual(gachaCopyMeiji(), a);
});

test('gachaCopy dispatcher: meiji → 福引, tidak bocor ke Heian/Edo/legacy', () => {
  assert.equal(gachaCopy('meiji', 'id').title, '福引');
  assert.equal(gachaCopy('meiji', 'en').title, '福引'); // tidak bergantung bahasa
  assert.equal(gachaCopy('heian', 'id').title, 'かいあわせ');
  assert.equal(gachaCopy('edo', 'id').title, '富くじ');
  assert.equal(gachaCopy('taisho', 'id').title, 'Gashapon Berkarat'); // era tanpa tema → legacy
});

test('gachaCopy: Meiji beda dari Heian & Edo (kontras tema)', () => {
  assert.notDeepEqual(gachaCopy('meiji', 'id'), gachaCopy('heian', 'id'));
  assert.notDeepEqual(gachaCopy('meiji', 'id'), gachaCopy('edo', 'id'));
});
