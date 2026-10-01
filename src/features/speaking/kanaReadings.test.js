import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KANJI_TO_KANA, WORD_READINGS,
  isKanjiChar, readingsFor, readingCandidates,
} from './kanaReadings.js';
import { matchSpeech, verdictOf } from './speechMatch.js';

test('KANJI_TO_KANA: kanji → bacaan tunggal, satu kanji boleh berbilang', () => {
  assert.deepEqual(KANJI_TO_KANA['蚊'], ['か']);
  assert.ok(KANJI_TO_KANA['手'].includes('て'));
  assert.ok(KANJI_TO_KANA['木'].includes('き'));
  assert.ok(KANJI_TO_KANA['火'].includes('か'));
  assert.ok(KANJI_TO_KANA['火'].includes('ひ'));
  assert.deepEqual(readingsFor('花'), ['か']);
  assert.deepEqual(readingsFor('漢'), []);   // tak ada di peta → kosong, aman
});

test('isKanjiChar: deteksi kanji, aman input aneh', () => {
  assert.equal(isKanjiChar('蚊'), true);
  assert.equal(isKanjiChar('あ'), false);
  assert.equal(isKanjiChar(''), false);
  assert.equal(isKanjiChar(null), false);
});

test('readingCandidates: perluas kanji tunggal → kana + kanji asli', () => {
  const c = readingCandidates('蚊');
  assert.equal(c[0], '蚊');                  // teks asli dulu
  assert.ok(c.includes('か'));
  assert.deepEqual([...new Set(c)], c);      // dedupe
});

test('readingCandidates: kata ber-kanji → bentuk bacaan + per-kanji', () => {
  const k = readingCandidates('古池');            // 古=こ dikenal, 池 tak → "こ池"
  assert.ok(k.includes('こ池'));
  assert.ok(k.includes('こ'));
  assert.ok(readingCandidates('お早う').includes('おはよう')); // WORD_READINGS
  assert.deepEqual(readingCandidates(''), []);
  assert.deepEqual(readingCandidates(null), []);
  assert.deepEqual(readingCandidates('あ'), ['あ']);          // tanpa kanji → apa adanya
});

test('WORD_READINGS: entri kunci ada', () => {
  assert.equal(WORD_READINGS['お早う'], 'おはよう');
  assert.equal(WORD_READINGS['日本'], 'にほん');
});

// ── INTI BUG: kana diucapkan, engine mengembalikan kanji ─────────────────────
test('matchSpeech: kanji hasil ASR tetap lolos untuk target kana (bug utama)', () => {
  const cases = [
    ['蚊', 'か'], ['手', 'て'], ['木', 'き'], ['死', 'し'],
    ['二', 'に'], ['目', 'め'], ['日', 'ひ'], ['火', 'ひ'],
    ['蛾', 'が'], ['字', 'じ'],
  ];
  for (const [heard, target] of cases) {
    const best = matchSpeech([heard], [target, target]);
    assert.equal(best.score, 1, `${heard} harus lolos untuk ${target}`);
    assert.equal(verdictOf(best.score), 'great');
    assert.equal(best.heard, heard, 'UI menampilkan teks ASR asli');
  }
});

test('matchSpeech: あ tetap lolos (kasus yang dulu bekerja)', () => {
  assert.equal(matchSpeech(['あ'], ['あ']).score, 1);
});

test('matchSpeech: kandidat hasil perluasan COCOK-PERSIS, bukan fuzzy', () => {
  // 蚊 → kandidat "か": target "か" lolos PERSIS.
  assert.equal(matchSpeech(['蚊'], ['か']).score, 1);
  // Tapi ekspansi tidak boleh "nyambung sebagian": "か" ≠ "かき" → 0.
  assert.equal(matchSpeech(['蚊'], ['かき']).score, 0);
  // Kanji berbilang bacaan: 火 → か ATAU ひ, keduanya persis.
  assert.equal(matchSpeech(['火'], ['か']).score, 1);
  assert.equal(matchSpeech(['火'], ['ひ']).score, 1);
});

test('matchSpeech: regresi — perilaku lama tetap utuh', () => {
  const best = matchSpeech(['んん', 'おはよう'], ['おはよう', 'オハヨウ']);
  assert.equal(best.score, 1);
  assert.equal(best.heard, 'おはよう');
  assert.equal(matchSpeech([], ['あ']).score, 0);
  assert.equal(matchSpeech('あ', 'あ').score, 1);
  // teks asli tetap fuzzy: "おはよ" (kurang 1 huruf) masih lulus
  assert.ok(matchSpeech(['おはよ'], ['おはよう']).score > 0.7);
});

test('matchSpeech: kata ber-kanji vs kotoba kana', () => {
  // Engine menulis お早う padahal latihan kotoba おはよう
  assert.equal(matchSpeech(['お早う'], ['おはよう']).score, 1);
});

test('matchSpeech: kata TAK dikenal tidak salah lolos', () => {
  // 犬 tak ada di peta → target いぬ tetap gagal (jujur), tapi tak error
  assert.equal(matchSpeech(['犬'], ['いぬ']).score, 0);
});
