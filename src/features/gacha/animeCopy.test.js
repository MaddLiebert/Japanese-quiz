// animeCopy.test.js — penjaga teks UI gacha 多元 クレーンゲーム (features/gacha/animeCopy.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A5. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ANIME_GACHA, isAnime, gachaCopyAnime, CLAW_NUANCE, clawNuanceCopy } from './animeCopy.js';
import { gachaCopy } from './heianCopy.js';
import {
  ANIME_CLAW_COUNT, ANIME_CLAW_MS, ANIME_CLAW_EASE, ANIME_CLAW_POOL, ANIME_CLAW_FADE,
  buildClawStrip, buildClawStrips, STRIP_LEN,
} from './slot.js';

// Kana & Kanji — label utama 多元 memakai KANJI + KATAKANA (bahasa pop).
const HIRAGANA = /[\u3040-\u309f]/;
const KATAKANA = /[\u30a0-\u30ff]/;
const KANJI = /[\u4e00-\u9fff]/;

test('isAnime: hanya "anime" yang dianggap 多元', () => {
  assert.equal(isAnime('anime'), true);
  assert.equal(isAnime('showa'), false);
  assert.equal(isAnime(undefined), false);
  assert.equal(isAnime(null), false);
});

test('ANIME_GACHA: judul クレーンゲーム + watermark 景 (hadiah arcade)', () => {
  assert.equal(ANIME_GACHA.title, 'クレーンゲーム');
  assert.equal(ANIME_GACHA.watermark, '景');
  assert.equal(ANIME_GACHA.pull1, 'アーム 1回');
  assert.equal(ANIME_GACHA.pull10, 'アーム 10回');
  assert.equal(ANIME_GACHA.contents, '景品の中身');
});

test('label utama 多元 memakai KANJI+KATAKANA (bukan kana Heian)', () => {
  assert.ok(KANJI.test(ANIME_GACHA.kicker), 'kicker 運試し memuat kanji');
  assert.ok(KATAKANA.test(ANIME_GACHA.title), 'title クレーンゲーム memuat katakana');
  assert.ok(!HIRAGANA.test(ANIME_GACHA.title), 'title bukan hiragana');
  assert.ok(KANJI.test(ANIME_GACHA.contents), 'contents 景品の中身 memuat kanji 中身');
});

test('ANIME_GACHA: field lengkap (kontrak UI sama dengan era lain)', () => {
  const keys = ['kicker', 'title', 'titleSub', 'tagline', 'pull1', 'pull10', 'contents', 'ownedSuffix', 'toBackpack', 'resultTitle', 'skip', 'close', 'watermark'];
  for (const k of keys) assert.ok(ANIME_GACHA[k], `field ${k} kosong`);
});

test('gachaCopyAnime: hasil selalu salinan baru (konstanta aman)', () => {
  const a = gachaCopyAnime();
  a.title = 'X';
  assert.equal(ANIME_GACHA.title, 'クレーンゲーム');
  assert.notEqual(gachaCopyAnime(), a);
});

test('gachaCopy dispatcher: anime → クレーンゲーム, tidak bocor ke era lain', () => {
  assert.equal(gachaCopy('anime', 'id').title, 'クレーンゲーム');
  assert.equal(gachaCopy('anime', 'en').title, 'クレーンゲーム'); // tidak bergantung bahasa
  assert.equal(gachaCopy('heian', 'id').title, 'かいあわせ');
  assert.equal(gachaCopy('showa', 'id').title, 'ガチャガチャ');
  assert.notEqual(gachaCopy('anime', 'id').title, 'Gashapon Berkarat'); // bukan legacy
});

test('gachaCopy: 多元 beda dari Heian/Edo/Meiji/Shōwa (kontras tema)', () => {
  assert.notDeepEqual(gachaCopy('anime', 'id'), gachaCopy('heian', 'id'));
  assert.notDeepEqual(gachaCopy('anime', 'id'), gachaCopy('showa', 'id'));
});

test('slot 多元: 3 figur, overshoot ease, pool pop', () => {
  assert.equal(ANIME_CLAW_COUNT, 3);
  assert.equal(ANIME_CLAW_MS.length, ANIME_CLAW_COUNT);
  for (let i = 1; i < ANIME_CLAW_MS.length; i++) {
    assert.ok(ANIME_CLAW_MS[i] > ANIME_CLAW_MS[i - 1], 'figur berhenti berurutan');
  }
  assert.ok(ANIME_CLAW_EASE[1] > 1, 'ease overshoot (cakar memantul)');
  assert.ok(ANIME_CLAW_POOL.length >= 4);
  assert.ok(ANIME_CLAW_FADE > 0);
});

test('buildClawStrip: elemen terakhir = target; panjang = STRIP_LEN', () => {
  const strip = buildClawStrip('star', ANIME_CLAW_POOL, STRIP_LEN, () => 0.5);
  assert.equal(strip.length, STRIP_LEN);
  assert.equal(strip[strip.length - 1], 'star');
});

test('buildClawStrips: 3 strip, tiap elemen terakhir = target yang diminta', () => {
  const targets = ['star', 'heart', 'note'];
  const strips = buildClawStrips(targets, ANIME_CLAW_POOL, STRIP_LEN, () => 0.5);
  assert.equal(strips.length, ANIME_CLAW_COUNT);
  strips.forEach((s, i) => assert.equal(s[s.length - 1], targets[i]));
});

// ── NUANSA DUNIA di mesin (LAPIS 2) ─────────────────────────────────────────
test('nuansa mesin: "cursed" punya judul/tagline sendiri (bukan nama IP)', () => {
  const n = clawNuanceCopy('cursed');
  assert.ok(n.title && n.kicker && n.tagline, 'field nuansa lengkap');
  assert.notEqual(n.title, ANIME_GACHA.title, 'judul berubah saat nuansa aktif');
  // Teks GENERIK bertema kutukan — bukan nama tokoh/logo IP.
  const terlarang = ['gojo', 'sukuna', 'jjk', 'jujutsu', 'naruto', 'onepiece', 'jojo'];
  const blob = JSON.stringify(CLAW_NUANCE).toLowerCase();
  assert.deepEqual(terlarang.filter((x) => blob.includes(x)), [], 'tak ada nama IP');
});

test('clawNuanceCopy: nuansa null/tak dikenal → {} (pakai default mesin)', () => {
  assert.deepEqual(clawNuanceCopy(null), {});
  assert.deepEqual(clawNuanceCopy(undefined), {});
  assert.deepEqual(clawNuanceCopy('nope'), {});
});

test('clawNuanceCopy: hasil salinan baru (konstanta aman)', () => {
  const a = clawNuanceCopy('cursed');
  a.title = 'X';
  assert.notEqual(CLAW_NUANCE.cursed.title, 'X');
});
