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

test('scaleSection: proporsional raw → scaled, floor', () => {
  assert.equal(scaleSection(0, 54, LKR_MAX), 0);
  assert.equal(scaleSection(54, 54, LKR_MAX), 120);
  assert.equal(scaleSection(27, 54, LKR_MAX), 60);
  assert.equal(scaleSection(24, 24, LISTENING_MAX), 60);
  assert.equal(scaleSection(1, 54, LKR_MAX), 2); // 1/54*120 = 2.22 → 2 (floor)
  assert.equal(scaleSection(2, 54, LKR_MAX), 4); // 2/54*120 = 4.44 → 4 (floor)
  assert.equal(scaleSection(0, 0, LKR_MAX), 0);
});

test('evaluatePass: total ≥80 DAN lkr ≥38 DAN listening ≥19', () => {
  const ok = evaluatePass({ lkrRaw: 54, lkrTotal: 54, listeningRaw: 24, listeningTotal: 24 });
  assert.equal(ok.total, 180);
  assert.equal(ok.passed, true);

  // total besar tapi listening < 19 → GAGAL
  const r = evaluatePass({ lkrRaw: 54, lkrTotal: 54, listeningRaw: 7, listeningTotal: 24 });
  assert.equal(r.listeningScaled, 17); // 7/24*60 = 17.5 → 17 (floor)
  assert.equal(r.total, 137); // 120 + 17 = 137
  assert.equal(r.listeningOk, false);
  assert.equal(r.passed, false);

  // sectional aman tapi total < 80 → GAGAL
  const r2 = evaluatePass({ lkrRaw: 17, lkrTotal: 54, listeningRaw: 8, listeningTotal: 24 });
  assert.equal(r2.lkrScaled, 37); // 17/54*120 = 37.77 → 37 (floor)
  assert.equal(r2.listeningScaled, 20); // 8/24*60 = 20 (exact)
  assert.equal(r2.total, 57); // 37 + 20 = 57
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

test('buildSection: authored items have shuffled options and valid correctIndex', () => {
  const items = buildSection('orthography', BANK, DATASETS, 5, lcg(10));
  assert.equal(items.length, 5);
  for (const it of items) {
    assert.equal(it.options.length, 4);
    assert.ok(it.correctIndex >= 0 && it.correctIndex < 4);
    assert.equal(it.options[it.correctIndex], it.answer);
  }
  // Across multiple items, correctIndex should not all be 0
  const indices = new Set(buildSection('context_vocab', BANK, DATASETS, 10, lcg(11)).map((it) => it.correctIndex));
  assert.ok(indices.size > 1, 'options must be shuffled across indices');
});

test('scoreExam: pembobotan per-mondai mencerminkan bobot resmi (Reading lebih besar dari Vocab)', () => {
  const exam = buildExam(BANK, DATASETS, lcg(12));
  // Buat jawaban di mana hanya seksi vocab benar (22 soal) vs hanya reading benar (6 soal)
  const answersOnlyVocab = exam.flatMap((sec) =>
    sec.items.map(() => sec.key === 'vocab')
  );
  const rVocab = scoreExam(exam, answersOnlyVocab);
  // 22 soal vocab berbobot total 35 poin
  assert.equal(rVocab.lkrScaled, 35);

  // Semua benar -> 120 / 60 / 180
  const answersAll = exam.flatMap((sec) => sec.items.map(() => true));
  const rAll = scoreExam(exam, answersAll);
  assert.equal(rAll.lkrScaled, 120);
  assert.equal(rAll.listeningScaled, 60);
  assert.equal(rAll.total, 180);
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

test('scoreExam: evaluator bisa di-inject (gerbang 終) — ambang naik mengubah verdict', () => {
  const exam = buildExam(BANK, DATASETS, lcg(8));
  const answers = exam.flatMap((s) => s.items.map(() => true));
  // N5 biasa: 180/180 → lulus.
  assert.equal(scoreExam(exam, answers).passed, true);
  // 終: pakai ambang keras yang tak mungkin dicapai → gagal walau jawaban sempurna.
  const impossible = () => ({ lkrScaled: 120, listeningScaled: 60, total: 180, lkrOk: false, listeningOk: true, totalOk: true, passed: false });
  assert.equal(scoreExam(exam, answers, impossible).passed, false);
  // Evaluator bawaan tetap dipakai bila argumen ke-3 kosong.
  assert.equal(scoreExam(exam, answers, undefined).passed, true);
});

// Regresi: opsi kosong ("-"), opsi kembar, dan soal kembar dalam satu ujian.
test('buildExam: opsi tidak kosong, tidak kembar, dan tidak ada soal dobel', () => {
  for (let run = 0; run < 50; run++) {
    const flat = buildExam(BANK, DATASETS, lcg(run + 1)).flatMap((s) => s.items);
    const ids = new Set();
    for (const it of flat) {
      assert.equal(it.options.length, 4, it.id);
      const vals = it.options.map((o) => String(o ?? '').trim());
      assert.ok(vals.every((v) => v && !/^[-‐–—]+$/.test(v)), `${it.id} opsi kosong`);
      assert.equal(new Set(vals).size, 4, `${it.id} opsi kembar: ${JSON.stringify(vals)}`);
      assert.equal(it.options[it.correctIndex], it.answer, it.id);
      assert.ok(!ids.has(it.id), `${it.id} muncul dobel`);
      ids.add(it.id);
    }
  }
});

// Data mentah: id unik di tiap dataset + tidak ada soal kembar isi.
test('data: id unik di kanji/grammar/mondai/bank, tidak ada konten kembar', () => {
  const norm = (s) => String(s ?? '').normalize('NFKC').replace(/\s+/g, '').trim();
  for (const [name, arr] of Object.entries({ kanji: DATASETS.kanji, grammar: DATASETS.grammar, mondai: DATASETS.mondai })) {
    const ids = new Set(arr.map((x) => x.id));
    assert.equal(ids.size, arr.length, `${name}: id dobel`);
  }
  const key = (it) => [norm(it.prompt || it.questionText), norm(it.passage), norm(it.audio)].join('|');
  const bankItems = Object.values(BANK).flat().filter(Array.isArray).flat();
  const all = [...bankItems, ...DATASETS.mondai];
  const seen = new Map();
  for (const it of all) {
    const k = key(it);
    assert.ok(!seen.has(k), `konten kembar: ${seen.get(k)} = ${it.id}`);
    seen.set(k, it.id);
  }
});
