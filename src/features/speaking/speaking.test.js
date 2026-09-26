import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SPEAK_XP, SPEAK_LEVELS, DEFAULT_SPEAK_LEVEL, speakLevel, speakXpFor, lineXpFor, speakPromptKind,
  lineText, lineReading,
  kanaSpeakItems, kotobaSpeakItems, kanjiSpeakItems, poemLineItems,
  filterKanaByType,
} from './speaking.js';

test('speakXpFor: XP dasar per jenis konten (level default = guide)', () => {
  assert.equal(speakXpFor({ kind: 'hiragana' }), SPEAK_XP.hiragana);
  assert.equal(speakXpFor({ kind: 'katakana' }), SPEAK_XP.katakana);
  assert.equal(speakXpFor({ kind: 'kotoba' }), SPEAK_XP.kotoba);
  assert.equal(speakXpFor({ kind: 'kanji' }), SPEAK_XP.kanji);
  assert.equal(speakXpFor({ kind: 'poem' }), SPEAK_XP.poem);
  assert.equal(speakXpFor({ kind: 'poem-line' }), SPEAK_XP['poem-line']);
  assert.equal(speakXpFor(null), 0);
  assert.equal(speakXpFor({}), 0);
});

test('speakLevel: 3 level bebas + normalisasi input ngawur ke guide', () => {
  assert.equal(SPEAK_LEVELS.guide.xpMult, 1);
  assert.equal(SPEAK_LEVELS.recall.xpMult, 1.5);
  assert.equal(SPEAK_LEVELS.blind.xpMult, 2);
  assert.equal(SPEAK_LEVELS.guide.showText, true);
  assert.equal(SPEAK_LEVELS.recall.showReading, false);
  assert.equal(SPEAK_LEVELS.blind.showText, false);
  assert.equal(speakLevel('recall'), SPEAK_LEVELS.recall);
  assert.equal(speakLevel('ngawur'), SPEAK_LEVELS[DEFAULT_SPEAK_LEVEL]);
  assert.equal(speakLevel(undefined), SPEAK_LEVELS[DEFAULT_SPEAK_LEVEL]);
});

test('speakXpFor + level: XP = dasar × pengali (dibulatkan)', () => {
  assert.equal(speakXpFor({ kind: 'kotoba' }, 'recall'), 15);      // 10 × 1.5
  assert.equal(speakXpFor({ kind: 'kanji' }, 'blind'), 24);        // 12 × 2
  assert.equal(speakXpFor({ kind: 'poem' }, 'recall'), 38);        // round(25 × 1.5)
  assert.equal(speakXpFor({ kind: 'poem-line' }, 'blind'), 10);    // 5 × 2
  assert.equal(speakXpFor({ kind: 'ngawur' }, 'blind'), 0);        // kind tak dikenal
  assert.equal(lineXpFor('guide'), 5);
  assert.equal(lineXpFor('recall'), 8);                            // round(5 × 1.5)
});

test('speakPromptKind: mode Buta — kana pakai prompt audio, lainnya arti', () => {
  assert.equal(speakPromptKind({ kind: 'hiragana' }, 'guide'), 'text');
  assert.equal(speakPromptKind({ kind: 'katakana' }, 'recall'), 'text');
  assert.equal(speakPromptKind({ kind: 'hiragana' }, 'blind'), 'audio');   // romaji = bacaan → jangan tampil
  assert.equal(speakPromptKind({ kind: 'katakana' }, 'blind'), 'audio');
  assert.equal(speakPromptKind({ kind: 'kotoba' }, 'blind'), 'meaning');
  assert.equal(speakPromptKind({ kind: 'kanji' }, 'blind'), 'meaning');
  assert.equal(speakPromptKind(null, 'blind'), 'meaning');
});

test('lineText & lineReading: gabung segmen', () => {
  const line = { segments: [{ t: '古池', r: 'ふるいけ' }, { t: 'や' }] };
  assert.equal(lineText(line), '古池や');
  assert.equal(lineReading(line), 'ふるいけや');
  assert.equal(lineText(null), '');
  assert.equal(lineReading({}), '');
});

test('kanaSpeakItems: bentuk item latihan kana', () => {
  const items = kanaSpeakItems([{ id: 'hira_a', char: 'あ', romaji: 'a', type: 'seion', row: 'a' }], 'hiragana');
  assert.equal(items.length, 1);
  assert.deepEqual(
    { id: items[0].id, kind: items[0].kind, display: items[0].display, readings: items[0].readings, meaning: items[0].meaning },
    { id: 'hira_a', kind: 'hiragana', display: 'あ', readings: ['あ'], meaning: 'a' },
  );
  assert.deepEqual(kanaSpeakItems(null, 'hiragana'), []);
});

test('kotobaSpeakItems: bacaan = char (kotoba murni kana)', () => {
  const items = kotobaSpeakItems([{ id: 'v_ohayou', char: 'おはよう', romaji: 'ohayou', meaning: 'Good morning', meaning_id: 'Selamat pagi', category: 'Greetings' }]);
  assert.equal(items[0].readings[0], 'おはよう');
  assert.equal(items[0].meaningId, 'Selamat pagi');
});

test('kanjiSpeakItems: readings dari onyomi+kunyomi', () => {
  const items = kanjiSpeakItems([{ id: 'kj_ichi', char: '一', onyomi: 'イチ、イツ', kunyomi: 'ひと(つ)', meaning: 'One', meaning_id: 'Satu', category: 'NumbersKanji' }]);
  assert.equal(items[0].kind, 'kanji');
  assert.ok(items[0].readings.includes('イチ'));
  assert.ok(items[0].readings.includes('イツ'));
  assert.ok(items[0].readings.includes('ひと'));
  assert.ok(items[0].readings.includes('ひとつ'));
});

test('poemLineItems: id per baris + bacaan benar', () => {
  const poem = {
    id: 'poem_x',
    lines: [
      { segments: [{ t: '古池', r: 'ふるいけ' }, { t: 'や' }] },
      { segments: [{ t: '水', r: 'みず' }, { t: 'の' }, { t: '音', r: 'おと' }] },
    ],
  };
  const items = poemLineItems(poem);
  assert.equal(items.length, 2);
  assert.equal(items[0].id, 'poem_x_l0');
  assert.equal(items[0].display, '古池や');
  assert.deepEqual(items[0].readings, ['ふるいけや']);
  assert.equal(items[1].readings[0], 'みずのおと');
  assert.deepEqual(poemLineItems(null), []);
});

test('filterKanaByType: all / seion / yoon', () => {
  const data = [
    { id: 'a', type: 'seion' }, { id: 'b', type: 'dakuon' }, { id: 'c', type: 'yoon' },
  ];
  assert.equal(filterKanaByType(data, 'all').length, 3);
  assert.deepEqual(filterKanaByType(data, 'yoon').map((d) => d.id), ['c']);
  assert.deepEqual(filterKanaByType(null, 'all'), []);
});
