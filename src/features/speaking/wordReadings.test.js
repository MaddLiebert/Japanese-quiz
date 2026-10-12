import test from 'node:test';
import assert from 'node:assert/strict';
import { WORD_KANJI_READINGS } from './wordReadings.js';
import { readingCandidates } from './kanaReadings.js';
import { matchSpeech, verdictOf } from './speechMatch.js';

// ── REGRESI BUG UTAMA: target latihan KANA, hasil ASR KANJI ──────────────────
// Dulu kamus hanya ~40 kata → ほん→本 skor 0 ("Belum pas" walau suara jelas).
// Sekarang kamus auto (JMdict) menutup ratusan kata.
test('kamus auto: kata umum kotoba punya bentuk kanji → kana', () => {
  const cases = [
    ['本', 'ほん'], ['車', 'くるま'], ['水', 'みず'], ['元気', 'げんき'],
    ['お金', 'おかね'], ['食べる', 'たべる'], ['飲む', 'のむ'], ['今日', 'きょう'],
    ['学校', 'がっこう'], ['寿司', 'すし'], ['母', 'はは'], ['顔', 'かお'],
  ];
  for (const [kanji, kana] of cases) {
    assert.ok(WORD_KANJI_READINGS[kanji]?.includes(kana), `${kanji} → ${kana} harus ada di kamus`);
  }
});

test('matchSpeech: ASR kanji lolos untuk target kana (inti bug)', () => {
  const cases = [
    ['本', 'ほん'], ['車', 'くるま'], ['水', 'みず'], ['元気', 'げんき'],
    ['お金', 'おかね'], ['食べる', 'たべる'], ['友達', 'ともだち'], ['寿司', 'すし'],
  ];
  for (const [heard, target] of cases) {
    const best = matchSpeech([heard], [target, target]);
    assert.equal(best.score, 1, `${heard} harus lolos untuk ${target}`);
    assert.equal(verdictOf(best.score), 'great');
  }
});

test('readingCandidates: pakai kamus auto + peta tangan + angka', () => {
  assert.ok(readingCandidates('本').includes('ほん'));       // kamus auto
  assert.ok(readingCandidates('お早う').includes('おはよう')); // peta tangan
  assert.ok(readingCandidates('1').includes('いち'));         // peta angka
  assert.deepEqual(readingCandidates(''), []);
  assert.deepEqual(readingCandidates(null), []);
});

test('kamus auto: tetap JUJUR untuk kata yang memang tak ada', () => {
  // Kanji langka / non-kosakata tidak dipetakan → tidak salah lolos.
  assert.equal(WORD_KANJI_READINGS['拳'], undefined);
  assert.equal(matchSpeech(['拳'], ['けん']).score, 0);
});

test('kamus auto: ukuran & bentuk data wajar', () => {
  const keys = Object.keys(WORD_KANJI_READINGS);
  assert.ok(keys.length > 1000, `kamus terlalu kecil: ${keys.length}`);
  for (const k of keys.slice(0, 50)) {
    assert.ok(/[\u4e00-\u9faf]/.test(k), `kunci harus ber-kanji: ${k}`);
    assert.ok(Array.isArray(WORD_KANJI_READINGS[k]) && WORD_KANJI_READINGS[k].length >= 1);
    for (const r of WORD_KANJI_READINGS[k]) {
      assert.ok(/^[\u3041-\u309fー]+$/.test(r), `bacaan harus hiragana: ${k} → ${r}`);
    }
  }
});
