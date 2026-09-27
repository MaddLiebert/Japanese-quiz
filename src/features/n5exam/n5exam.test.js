import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  N5_SECTIONS, N5_SECTION_ORDER, N5_TOTAL_MINUTES,
  sectionRawTotal, scaleSection, evaluatePass, formatClock,
  N5_PASS_TOTAL, N5_PASS_LKR, N5_PASS_LISTENING, LKR_MAX, LISTENING_MAX,
  N5_EXAM_MIN_MASTERED_KANJI, countMasteredKanji, isN5ExamUnlocked,
  buildSection, buildExam, scoreExam,
} from './n5exam.js';

// Aturan repo: modul murni dilarang import JSON → test baca manual.
const read = (name) =>
  JSON.parse(readFileSync(new URL(`../../data/${name}.json`, import.meta.url), 'utf8'));

const DATASETS = {
  kanji: read('kanji'),
  grammar: read('grammar'),
  kotoba: read('kotoba'),
  mondai: read('mondai'),
  hiragana: read('hiragana'),
  katakana: read('katakana'),
};
const BANK = read('n5-exam');

// LCG deterministik — urutan acak stabil di test.
const lcg = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

test('blueprint: 3 seksi, 90 menit, urutan resmi', () => {
  assert.deepEqual(N5_SECTION_ORDER, ['vocab', 'grammarReading', 'listening']);
  assert.equal(N5_SECTIONS.vocab.minutes, 20);
  assert.equal(N5_SECTIONS.grammarReading.minutes, 40);
  assert.equal(N5_SECTIONS.listening.minutes, 30);
  assert.equal(N5_TOTAL_MINUTES, 90);
});

test('blueprint: jumlah soal per seksi 22 / 32 / 24 = 78', () => {
  assert.equal(sectionRawTotal('vocab'), 22);
  assert.equal(sectionRawTotal('grammarReading'), 32);
  assert.equal(sectionRawTotal('listening'), 24);
});

test('konstanta skor resmi JLPT N5', () => {
  assert.equal(N5_PASS_TOTAL, 80);
  assert.equal(N5_PASS_LKR, 38);
  assert.equal(N5_PASS_LISTENING, 19);
  assert.equal(LKR_MAX, 120);
  assert.equal(LISTENING_MAX, 60);
});

test('scaleSection: proporsional raw → scaled, dibulatkan', () => {
  assert.equal(scaleSection(0, 54, LKR_MAX), 0);
  assert.equal(scaleSection(54, 54, LKR_MAX), 120);
  assert.equal(scaleSection(27, 54, LKR_MAX), 60);
  assert.equal(scaleSection(24, 24, LISTENING_MAX), 60);
  assert.equal(scaleSection(1, 54, LKR_MAX), 2); // 1/54*120 = 2.22 → 2
  assert.equal(scaleSection(0, 0, LKR_MAX), 0);
});

test('evaluatePass: total ≥80 DAN lkr ≥38 DAN listening ≥19', () => {
  const ok = evaluatePass({ lkrRaw: 54, lkrTotal: 54, listeningRaw: 24, listeningTotal: 24 });
  assert.equal(ok.total, 180);
  assert.equal(ok.passed, true);

  // total besar tapi listening < 19 → GAGAL
  const r = evaluatePass({ lkrRaw: 54, lkrTotal: 54, listeningRaw: 7, listeningTotal: 24 });
  assert.equal(r.listeningScaled, 18);
  assert.equal(r.total, 138);
  assert.equal(r.listeningOk, false);
  assert.equal(r.passed, false);

  // sectional aman tapi total < 80 → GAGAL
  const r2 = evaluatePass({ lkrRaw: 17, lkrTotal: 54, listeningRaw: 8, listeningTotal: 24 });
  assert.equal(r2.lkrScaled, 38);
  assert.equal(r2.listeningScaled, 20);
  assert.equal(r2.total, 58);
  assert.equal(r2.totalOk, false);
  assert.equal(r2.passed, false);
});

test('formatClock: mm:ss', () => {
  assert.equal(formatClock(0), '00:00');
  assert.equal(formatClock(59), '00:59');
  assert.equal(formatClock(1200), '20:00');
  assert.equal(formatClock(2400), '40:00');
  assert.equal(formatClock(-5), '00:00');
});

test('gate: countMasteredKanji hanya hitung kj_* berstatus mastered', () => {
  const ip = {
    kj_ichi: { status: 'mastered' },
    kj_ni: { status: 'mastered' },
    kj_san: { status: 'learning' },
    v_ohayou: { status: 'mastered' },   // bukan kanji → diabaikan
    kj_yon: { status: 'familiar' },
  };
  assert.equal(countMasteredKanji(ip), 2);
  assert.equal(countMasteredKanji(null), 0);
  assert.equal(countMasteredKanji({}), 0);
});

test('gate: isN5ExamUnlocked butuh Shogun DAN ≥30 kanji hafal', () => {
  assert.equal(N5_EXAM_MIN_MASTERED_KANJI, 30);
  assert.equal(isN5ExamUnlocked('Shogun 👹', 30), true);
  assert.equal(isN5ExamUnlocked('Shogun 👹', 45), true);
  assert.equal(isN5ExamUnlocked('Shogun 👹', 29), false);
  assert.equal(isN5ExamUnlocked('Sensei 📜', 50), false);
});

test('buildSection kanji_reading: 7 soal, 4 opsi, correctIndex valid', () => {
  const items = buildSection('kanji_reading', BANK, DATASETS, 7, lcg(1));
  assert.equal(items.length, 7);
  for (const it of items) {
    assert.equal(it.mondai, 'kanji_reading');
    assert.equal(it.options.length, 4);
    assert.ok(it.correctIndex >= 0 && it.correctIndex < 4);
    assert.equal(it.options[it.correctIndex], it.answer);
  }
});

test('buildSection grammar_form: 16 soal dari grammar.json, ada blank', () => {
  const items = buildSection('grammar_form', BANK, DATASETS, 16, lcg(2));
  assert.equal(items.length, 16);
  for (const it of items) {
    assert.equal(it.options.length, 4);
    assert.ok(it.prompt.includes('___'));
  }
});

test('buildSection: tipe authored diambil dari n5-exam.json (reading pakai passage)', () => {
  const items = buildSection('reading_short', BANK, DATASETS, 3, lcg(3));
  assert.equal(items.length, 3);
  for (const it of items) {
    assert.equal(it.mondai, 'reading_short');
    assert.ok(it.passage && it.passage.length > 0);
    assert.equal(it.options.length, 4);
    assert.equal(it.options[it.correctIndex], it.answer);
  }
});

test('buildSection: bank kecil → boleh mengulang agar ujian tetap penuh', () => {
  const items = buildSection('info_retrieval', BANK, DATASETS, 5, lcg(4));
  assert.equal(items.length, 5);
});

test('buildExam: 3 seksi berurutan dengan jumlah soal sesuai blueprint', () => {
  const exam = buildExam(BANK, DATASETS, lcg(5));
  assert.deepEqual(exam.map((s) => s.key), ['vocab', 'grammarReading', 'listening']);
  assert.equal(exam[0].items.length, 22);
  assert.equal(exam[1].items.length, 32);
  assert.equal(exam[2].items.length, 24);
  assert.equal(exam[1].minutes, 40);
});

test('scoreExam: semua benar → 120/60/180 lulus; ada 12 baris per-mondai', () => {
  const exam = buildExam(BANK, DATASETS, lcg(6));
  const answers = exam.flatMap((s) => s.items.map(() => true));
  const r = scoreExam(exam, answers);
  assert.equal(r.lkrRaw, 54);
  assert.equal(r.listeningRaw, 24);
  assert.equal(r.lkrScaled, 120);
  assert.equal(r.listeningScaled, 60);
  assert.equal(r.total, 180);
  assert.equal(r.passed, true);
  assert.equal(r.perMondai.length, 14); // 4 (vocab) + 6 (grammar/reading) + 4 (listening)
});

test('scoreExam: semua salah → 0 poin, gagal', () => {
  const exam = buildExam(BANK, DATASETS, lcg(7));
  const answers = exam.flatMap((s) => s.items.map(() => false));
  const r = scoreExam(exam, answers);
  assert.equal(r.total, 0);
  assert.equal(r.passed, false);
});
