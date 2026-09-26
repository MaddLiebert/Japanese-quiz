import test from 'node:test';
import assert from 'node:assert/strict';
import { hasKanji, toHiragana, normalizeJa } from './speechMatch.js';

test('hasKanji: deteksi kanji, aman untuk input aneh', () => {
  assert.equal(hasKanji('古池'), true);
  assert.equal(hasKanji('あいうえお'), false);
  assert.equal(hasKanji(''), false);
  assert.equal(hasKanji(null), false);
  assert.equal(hasKanji(undefined), false);
});

test('toHiragana: katakana → hiragana, sisanya utuh', () => {
  assert.equal(toHiragana('ア'), 'あ');
  assert.equal(toHiragana('カタカナ'), 'かたかな');
  assert.equal(toHiragana('ヴ'), 'ゔ');            // 0x30F4 → 0x3094
  assert.equal(toHiragana('ー'), 'ー');            // chōonpu dipertahankan
  assert.equal(toHiragana('あいう'), 'あいう');     // hiragana lewat apa adanya
  assert.equal(toHiragana('ABC123'), 'ABC123');
  assert.equal(toHiragana(''), '');
});

test('normalizeJa: buang spasi & tanda baca, katakana → hiragana, ー tetap', () => {
  assert.equal(normalizeJa(' おはよう。 '), 'おはよう');
  assert.equal(normalizeJa('コーヒー'), 'こーひー');
  assert.equal(normalizeJa('「古池や」、'), '古池や');
  assert.equal(normalizeJa('え、っと…！？'), 'えっと');
  assert.equal(normalizeJa(null), '');
  assert.equal(normalizeJa(123), '123');
});

import {
  levenshtein, similarity, scoreUtterance, matchSpeech, verdictOf,
  SPEAK_PASS, SPEAK_GREAT,
} from './speechMatch.js';

test('levenshtein: jarak edit klasik', () => {
  assert.equal(levenshtein('kitten', 'sitting'), 3);
  assert.equal(levenshtein('abc', 'abc'), 0);
  assert.equal(levenshtein('', 'abc'), 3);
  assert.equal(levenshtein('abc', ''), 3);
  assert.equal(levenshtein('', ''), 0);
});

test('similarity: 0..1 setelah normalisasi', () => {
  assert.equal(similarity('おはよう', 'おはよう'), 1);
  assert.equal(similarity('おはよう', 'オハヨウ'), 1);          // katakana = hiragana
  assert.equal(similarity('あ', 'ん'), 0);                     // beda total
  assert.ok(similarity('おはよ', 'おはよう') > 0.7);            // kurang 1 huruf
  assert.equal(similarity('', ''), 1);
  assert.equal(similarity('あ', ''), 0);
});

test('scoreUtterance: aturan skor', () => {
  assert.equal(scoreUtterance('おはよう', 'おはよう'), 1);
  assert.equal(scoreUtterance('おはようございます', 'おはよう'), 0.9);  // target terkandung
  assert.equal(scoreUtterance('あー', 'あ'), 0.9);                    // 1 huruf + awalan sama
  assert.equal(scoreUtterance('こんにちは', 'おはよう'), similarity('こんにちは', 'おはよう'));
  assert.equal(scoreUtterance('', 'あ'), 0);
});

test('matchSpeech: ambil skor terbaik dari alternatif × target', () => {
  const best = matchSpeech(['んん', 'おはよう'], ['おはよう', 'オハヨウ']);
  assert.equal(best.score, 1);
  assert.equal(best.heard, 'おはよう');
  const none = matchSpeech([], ['あ']);
  assert.equal(none.score, 0);
  const single = matchSpeech('あ', 'あ');   // boleh string tunggal
  assert.equal(single.score, 1);
});

test('verdictOf: great / pass / retry sesuai ambang', () => {
  assert.equal(verdictOf(1), 'great');
  assert.equal(verdictOf(SPEAK_GREAT), 'great');
  assert.equal(verdictOf(0.8), 'pass');
  assert.equal(verdictOf(SPEAK_PASS), 'pass');
  assert.equal(verdictOf(0.5), 'retry');
  assert.equal(verdictOf(undefined), 'retry');
});
