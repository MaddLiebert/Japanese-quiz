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
