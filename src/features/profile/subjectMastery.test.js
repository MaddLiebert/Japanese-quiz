import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STATUS_WEIGHT, computeMastery, flattenExamData, SUBJECT_ORDER, buildSubjectMastery, SUBJECT_LABEL_ID,
} from './subjectMastery.js';

const items = (...ids) => ids.map((id) => ({ id }));

test('computeMastery: tanpa item → 0', () => {
  assert.equal(computeMastery({}, []), 0);
  assert.equal(computeMastery({}, null), 0);
});

test('computeMastery: bobot status (mastered/familiar/learning)', () => {
  const data = items('a', 'b', 'c', 'd');
  const ip = {
    a: { status: 'mastered' },   // 1
    b: { status: 'familiar' },   // 0.66
    c: { status: 'learning' },   // 0.33
    // d belum dikerjakan → 0
  };
  // (1 + 0.66 + 0.33) / 4 = 0.4975 → 50
  assert.equal(computeMastery(ip, data), 50);
});

test('computeMastery: status tak dikenal → 0, id tak ada di dataset diabaikan', () => {
  const ip = { a: { status: 'weird' }, ghost: { status: 'mastered' } };
  assert.equal(computeMastery(ip, items('a')), 0);
});

test('computeMastery: semua mastered → 100', () => {
  const data = items('a', 'b');
  const ip = { a: { status: 'mastered' }, b: { status: 'mastered' } };
  assert.equal(computeMastery(ip, data), 100);
});

test('flattenExamData: objek berisi array → satu daftar; item tanpa id dibuang', () => {
  const exam = {
    orthography: [{ id: 'n5ort_001' }, { id: 'n5ort_002' }],
    quick_response: [{ id: 'n5qr_001' }, { noId: true }],
  };
  const flat = flattenExamData(exam);
  assert.equal(flat.length, 3);
  assert.deepEqual(flat.map((x) => x.id), ['n5ort_001', 'n5ort_002', 'n5qr_001']);
  assert.deepEqual(flattenExamData(null), []);
});

test('SUBJECT_ORDER: memuat Puisi & Ujian N5 (gap yang dulu hilang)', () => {
  const keys = SUBJECT_ORDER.map((s) => s.data);
  assert.ok(keys.includes('poems'), 'Poems harus ada di radar');
  assert.ok(keys.includes('n5exam'), 'N5 Exam harus ada di radar');
  assert.equal(SUBJECT_ORDER.length, 8);
});

test('buildSubjectMastery: urutan tetap & skor per subjek benar', () => {
  const datasets = {
    hiragana: items('hira_a'),
    katakana: items('kata_a'),
    kanji: items('kj_ichi'),
    kotoba: items('v_ohayou'),
    grammar: items('g_ni_freq'),
    mondai: items('m01'),
    poems: items('poem_basho_furuike'),
    n5exam: [{ id: 'n5ort_001' }],
  };
  const ip = {
    hira_a: { status: 'mastered' },       // Hiragana 100
    poem_basho_furuike: { status: 'mastered' }, // Poems 100
    n5ort_001: { status: 'learning' },    // N5 Exam 33
  };
  const out = buildSubjectMastery(ip, datasets);
  assert.deepEqual(out.map((s) => s.subject), SUBJECT_ORDER.map((s) => s.subject));
  const by = Object.fromEntries(out.map((s) => [s.subject, s.score]));
  assert.equal(by.Hiragana, 100);
  assert.equal(by.Poems, 100);
  assert.equal(by['N5 Exam'], 33);
  assert.equal(by.Katakana, 0);
});

test('buildSubjectMastery: dataset kosong → semua 0 (tanpa crash)', () => {
  const out = buildSubjectMastery({ a: { status: 'mastered' } }, {});
  assert.equal(out.length, SUBJECT_ORDER.length);
  assert.ok(out.every((s) => s.score === 0));
});

test('SUBJECT_LABEL_ID: setiap subjek punya label ID', () => {
  for (const { subject } of SUBJECT_ORDER) {
    assert.equal(typeof SUBJECT_LABEL_ID[subject], 'string', `${subject} harus punya label ID`);
    assert.ok(SUBJECT_LABEL_ID[subject].length > 0);
  }
});

test('STATUS_WEIGHT: nilai kontrak', () => {
  assert.equal(STATUS_WEIGHT.mastered, 1);
  assert.equal(STATUS_WEIGHT.familiar, 0.66);
  assert.equal(STATUS_WEIGHT.learning, 0.33);
});
