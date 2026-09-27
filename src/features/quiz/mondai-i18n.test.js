import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Modul murni tak import JSON; test memuat sendiri (pola repo).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const MONDAI = JSON.parse(readFileSync(join(ROOT, 'src/data/mondai.json'), 'utf8'));
const CHAPTERS = JSON.parse(readFileSync(join(ROOT, 'src/data/mondai-chapters.json'), 'utf8')).chapters;

const allQuestions = CHAPTERS.flatMap((c) => c.questions);

test('mondai.json: setiap soal punya questionText_en + explanation_en', () => {
  const missing = MONDAI.filter((m) => !m.questionText_en?.trim() || !m.explanation_en?.trim()).map((m) => m.id);
  assert.deepEqual(missing, [], `soal tanpa EN: ${missing.join(', ')}`);
});

test('mondai-chapters.json: setiap soal punya questionText_en + explanation_en', () => {
  const missing = allQuestions.filter((m) => !m.questionText_en?.trim() || !m.explanation_en?.trim()).map((m) => m.id);
  assert.deepEqual(missing, [], `soal chapter tanpa EN: ${missing.join(', ')}`);
});

test('mondai: jumlah soal kedua file konsisten (87)', () => {
  assert.equal(MONDAI.length, 87);
  assert.equal(allQuestions.length, 87);
});

test('mondai: versi EN benar-benar beda dari ID untuk soal berbahasa Indonesia', () => {
  // Soal yang questionText-nya MURNI Jepang (mis. "患者[かんじゃ]は…") memang tak
  // punya versi EN — ID=EN wajar. Yang WAJIB beda = soal berbahasa Indonesia
  // (mengandung huruf Latin + kata Indonesia).
  const isIndonesian = (s) => /[A-Za-z]/.test(s) && /(Pertanyaan|Percakapan|Audio|berapa|apa|siapa|Bagaimana|Di mana|Kapan)/i.test(s);
  const same = MONDAI
    .filter((m) => isIndonesian(m.questionText) && m.questionText === m.questionText_en)
    .map((m) => m.id);
  assert.deepEqual(same, [], `questionText_en masih sama dgn ID: ${same.join(', ')}`);
});
