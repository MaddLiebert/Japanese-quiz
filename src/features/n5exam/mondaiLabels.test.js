import test from 'node:test';
import assert from 'node:assert/strict';
import { MONDAI_INFO, mondaiLabel, mondaiGloss, mondaiJp } from './mondaiLabels.js';

test('MONDAI_INFO: 14 tipe mondai, tiap entri punya jp/romaji/id/en', () => {
  assert.equal(Object.keys(MONDAI_INFO).length, 14);
  for (const [k, v] of Object.entries(MONDAI_INFO)) {
    assert.ok(v.jp && v.romaji && v.id && v.en, `${k} tidak lengkap`);
  }
});

test('mondaiLabel: format "Jepang · romaji"', () => {
  assert.equal(mondaiLabel('kanji_reading'), '漢字読み · kanji yomi');
  assert.equal(mondaiLabel('quick_response'), '即時応答 · sokuji ōtō');
});

test('mondaiLabel: tipe tak dikenal → kembalikan tipe apa adanya', () => {
  assert.equal(mondaiLabel('ngawur'), 'ngawur');
});

test('mondaiGloss: ikut bahasa UI', () => {
  assert.equal(mondaiGloss('kanji_reading', 'id'), 'Cara Baca Kanji');
  assert.equal(mondaiGloss('kanji_reading', 'en'), 'Kanji Reading');
  assert.equal(mondaiGloss('ngawur', 'id'), '');
});

test('mondaiJp: hanya kanji', () => {
  assert.equal(mondaiJp('info_retrieval'), '情報検索');
  assert.equal(mondaiJp('ngawur'), 'ngawur');
});
