// cyberpunkCopy.test.js — penjaga teks UI gacha 電脳 ハック (features/gacha/cyberpunkCopy.js).
// Lihat PRD: docs/tema/cyberpunk.md §16 (isi ハック) + §8.1 (nama UI era). Modul
// TANPA React/DOM → `node --test`. Kontrak field = sama dengan era lain (Heian…
// 多元) supaya mesin gacha tak perlu tahu era.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CYBERPUNK_GACHA, isCyberpunk, gachaCopyCyberpunk } from './cyberpunkCopy.js';
import { gachaCopy } from './heianCopy.js';

// Kana & Kanji — label utama 電脳 memakai KANJI + KATAKANA (era paling modern,
// paling banyak kata serapan), bukan kana-saja seperti Heian.
const HIRAGANA = /[\u3040-\u309f]/;
const KATAKANA = /[\u30a0-\u30ff]/;
const KANJI = /[\u4e00-\u9fff]/;

test('isCyberpunk: hanya "cyberpunk" yang dianggap 電脳', () => {
  assert.equal(isCyberpunk('cyberpunk'), true);
  assert.equal(isCyberpunk('anime'), false);
  assert.equal(isCyberpunk('showa'), false);
  assert.equal(isCyberpunk(undefined), false);
  assert.equal(isCyberpunk(null), false);
});

test('CYBERPUNK_GACHA: judul ハック (hack) — sejalan eraNames.js', () => {
  assert.equal(CYBERPUNK_GACHA.title, 'ハック');
  assert.equal(CYBERPUNK_GACHA.pull1, 'ハック 1回');
  assert.equal(CYBERPUNK_GACHA.pull10, 'ハック 10回');
  assert.ok(CYBERPUNK_GACHA.watermark, 'watermark terisi');
});

test('label utama 電脳 memakai KANJI+KATAKANA (bukan kana Heian)', () => {
  assert.ok(KATAKANA.test(CYBERPUNK_GACHA.title), 'title ハック memuat katakana');
  assert.ok(!HIRAGANA.test(CYBERPUNK_GACHA.title), 'title bukan hiragana');
  assert.ok(KANJI.test(CYBERPUNK_GACHA.kicker), 'kicker memuat kanji');
  assert.ok(KANJI.test(CYBERPUNK_GACHA.contents), 'contents memuat kanji');
});

test('CYBERPUNK_GACHA: field lengkap (kontrak UI sama dengan era lain)', () => {
  const keys = ['kicker', 'title', 'titleSub', 'tagline', 'pull1', 'pull10', 'contents', 'ownedSuffix', 'toBackpack', 'resultTitle', 'skip', 'close', 'watermark'];
  for (const k of keys) assert.ok(CYBERPUNK_GACHA[k], `field ${k} kosong`);
});

test('gachaCopyCyberpunk: hasil selalu salinan baru (konstanta aman)', () => {
  const a = gachaCopyCyberpunk();
  a.title = 'X';
  assert.equal(CYBERPUNK_GACHA.title, 'ハック');
  assert.notEqual(gachaCopyCyberpunk(), a);
});

test('gachaCopy dispatcher: cyberpunk → ハック, TIDAK bocor ke LEGACY', () => {
  assert.equal(gachaCopy('cyberpunk', 'id').title, 'ハック');
  assert.equal(gachaCopy('cyberpunk', 'en').title, 'ハック'); // tidak bergantung bahasa
  // Ini bug yang diperbaiki: sebelumnya jatuh ke LEGACY (teks Indonesia).
  assert.notEqual(gachaCopy('cyberpunk', 'id').title, 'Gashapon Berkarat');
  assert.notEqual(gachaCopy('cyberpunk', 'en').title, 'Rusty Gashapon');
  // Era lain tak terpengaruh.
  assert.equal(gachaCopy('anime', 'id').title, 'クレーンゲーム');
  assert.equal(gachaCopy('showa', 'id').title, 'ガチャガチャ');
});

test('gachaCopy: 電脳 beda dari Heian/Edo/Meiji/Shōwa/多元 (kontras tema)', () => {
  const cp = gachaCopy('cyberpunk', 'id');
  assert.notDeepEqual(cp, gachaCopy('heian', 'id'));
  assert.notDeepEqual(cp, gachaCopy('edo', 'id'));
  assert.notDeepEqual(cp, gachaCopy('meiji', 'id'));
  assert.notDeepEqual(cp, gachaCopy('showa', 'id'));
  assert.notDeepEqual(cp, gachaCopy('anime', 'id'));
});

test('tema 電脳: tak ada nama IP & tak ada teks legacy di salinan', () => {
  const terlarang = ['gojo', 'sukuna', 'jjk', 'jujutsu', 'naruto', 'onepiece', 'jojo'];
  const blob = JSON.stringify(CYBERPUNK_GACHA).toLowerCase();
  assert.deepEqual(terlarang.filter((x) => blob.includes(x)), [], 'tak ada nama IP');
  assert.ok(!/gashapon/i.test(blob), 'tak ada sisa teks legacy Gashapon');
});
