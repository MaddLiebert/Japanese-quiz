import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  typingKind, normText, normKana, kanjiReadings, checkAnswer,
  buildTypingQuestion,
} from './typing.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const DATA = {
  hiragana: readJSON('src/data/hiragana.json'),
  katakana: readJSON('src/data/katakana.json'),
  kotoba: readJSON('src/data/kotoba.json'),
  kanji: readJSON('src/data/kanji.json'),
};
const firstId = (arr, id) => arr.find((d) => d.id === id);

test('typingKind: kanji/kotoba/kana', () => {
  assert.equal(typingKind(firstId(DATA.hiragana, 'hira_a')), 'kana');
  assert.equal(typingKind(firstId(DATA.kotoba, 'v_ohayou')), 'kotoba');
  assert.equal(typingKind(firstId(DATA.kanji, 'kj_ichi')), 'kanji');
  assert.equal(typingKind(null), 'kana');
});

test('normText: lowercase, strip spasi, NFKC', () => {
  assert.equal(normText('  Otoko  no hito '), 'otokonohito');
  assert.equal(normText('ＡＢＣ'), 'abc');
  assert.equal(normText(''), '');
});

test('normKana: NFKC satukan, strip spasi', () => {
  assert.equal(normKana('ふん'), 'ふん');
  assert.equal(normKana('　ぷん '), 'ぷん');
});

test('kanjiReadings: pecah 、 & buang kurung isi', () => {
  const ichi = firstId(DATA.kanji, 'kj_ichi'); // onyomi 'イチ、イツ' → ['イチ','イツ']
  const rs = kanjiReadings(ichi);
  assert.ok(rs.includes('イチ'));
  assert.ok(rs.includes('ひと'));
  assert.ok(!rs.includes('ひと(つ)'));
});

test('checkAnswer kana alfabet: romaji & normalize', () => {
  const a = firstId(DATA.hiragana, 'hira_a');      // あ → 'a'
  assert.equal(checkAnswer(a, 'a', 'alfabet'), true);
  assert.equal(checkAnswer(a, 'A ', 'alfabet'), true);
  assert.equal(checkAnswer(a, 'ka', 'alfabet'), false);
});

test('checkAnswer kotoba alfabet: romaji pakai spasi, strip spasi di kedua sisi', () => {
  const m = firstId(DATA.kotoba, 'v_onnanohito'); // romaji 'onna no hito'
  assert.equal(checkAnswer(m, 'onna no hito', 'alfabet'), true);
  assert.equal(checkAnswer(m, 'onnanohito', 'alfabet'), true); // spasi dihapus normText
  assert.equal(checkAnswer(m, 'otoko no hito', 'alfabet'), false);
});

test('checkAnswer jepang: char item, slash / kotoba terima salah satu', () => {
  const f = firstId(DATA.kotoba, 'v_fun');   // char 'ふん / ぷん'
  assert.equal(checkAnswer(f, 'ふん', 'jepang'), true);
  assert.equal(checkAnswer(f, 'ぷん', 'jepang'), true);
  assert.equal(checkAnswer(f, 'ふんぷん', 'jepang'), false);
});

test('buildTypingQuestion: kotoba read alfabet → romaji, bukan arti', () => {
  const k = firstId(DATA.kotoba, 'v_ohayou'); // 'おはよう' romaji 'ohayou', meaning 'Good morning'
  const q = buildTypingQuestion(k, 'read', 'en', 'alfabet');
  assert.equal(q.prompt, 'おはよう');
  assert.equal(q.answer, 'ohayou');
  // mode jepang read → answer = char (latihan IME)
  const qj = buildTypingQuestion(k, 'read', 'en', 'jepang');
  assert.equal(qj.answer, 'おはよう');
  // write → answer = char di semua mode
  const qw = buildTypingQuestion(k, 'write', 'en', 'alfabet');
  assert.equal(qw.prompt, 'Good morning');
  assert.equal(qw.answer, 'おはよう');
});

test('buildTypingQuestion: kana read → romaji; write → char', () => {
  const a = firstId(DATA.hiragana, 'hira_a');
  const q = buildTypingQuestion(a, 'read', 'en', 'alfabet');
  assert.equal(q.prompt, 'あ');
  assert.equal(q.answer, 'a');
  const qw = buildTypingQuestion(a, 'write', 'en', 'jepang');
  assert.equal(qw.prompt, 'a');
  assert.equal(qw.answer, 'あ');
});
