// quiz.test.js — penjaga mesin kuis 多元 (E1–E5 wiring). Lihat SPEC §A1/A2/A3/A6/A7.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QUIZ_MODES, QUIZ_MODE_LABEL, isQuizMode,
  buildOnomaQuestions, buildRegisterQuestions, buildSerifuQuestions,
  buildSlangQuestions, buildLoanQuestions, buildQuestions, checkAnswer,
  shuffle, QUIZ_XP,
} from './quiz.js';

test('quiz: 5 mode terdaftar & berlabel (onoma/register/serifu/slang/loanwords)', () => {
  assert.deepEqual(QUIZ_MODES, ['onoma', 'register', 'serifu', 'slang', 'loanwords']);
  for (const m of QUIZ_MODES) {
    assert.ok(QUIZ_MODE_LABEL[m]?.jp, `${m} tanpa label jp`);
    assert.ok(QUIZ_MODE_LABEL[m]?.stop, `${m} tanpa perhentian peta`);
    assert.ok(isQuizMode(m));
  }
  assert.equal(isQuizMode('nope'), false);
});

test('quiz: shuffle deterministik (seed sama → sama) & tidak mengubah input', () => {
  const a = [1, 2, 3, 4, 5, 6];
  const s1 = shuffle(a, 42);
  const s2 = shuffle(a, 42);
  assert.deepEqual(s1, s2, 'seed sama → urutan sama');
  assert.deepEqual(a, [1, 2, 3, 4, 5, 6], 'input tidak diubah');
  assert.deepEqual([...s1].sort(), a, 'kandungan sama (cuma urutan)');
});

// ── A1 オノマトペ ─────────────────────────────────────────────────────────────
test('quiz onoma: tiap soal punya jawaban di antara pilihan & kind choice', () => {
  const qs = buildOnomaQuestions(1);
  assert.ok(qs.length >= 3, 'harus ada beberapa soal onoma');
  for (const q of qs) {
    assert.equal(q.kind, 'choice');
    assert.ok(q.prompt_jp, 'ada adegan');
    assert.ok(q.choices.some((c) => c.id === q.answerId), 'jawaban ada di pilihan');
    assert.ok(q.choices.length >= 3, 'pilihan cukup');
  }
});

// ── A6 若者言葉 ───────────────────────────────────────────────────────────────
test('quiz slang: cocok arti → kata, jawaban selalu tersedia, level memfilter', () => {
  const qs = buildSlangQuestions(3, 7);
  assert.ok(qs.length >= 3);
  for (const q of qs) {
    assert.equal(q.kind, 'choice');
    assert.ok(q.prompt_jp, 'ada arti');
    assert.ok(q.choices.some((c) => c.id === q.answerId));
  }
  // Level 1 → hanya slang level 1 (subset).
  assert.ok(buildSlangQuestions(1, 7).length <= qs.length, 'level rendah → lebih sedikit');
});

// ── A7 カタカナ ───────────────────────────────────────────────────────────────
test('quiz loanwords: asal kata → katakana, false friend dapat hint khusus', () => {
  const qs = buildLoanQuestions(3);
  assert.ok(qs.length >= 5);
  for (const q of qs) {
    assert.equal(q.kind, 'choice');
    assert.ok(q.prompt_jp, 'ada kata asal');
    assert.ok(q.choices.some((c) => c.id === q.answerId));
  }
  // Ada minimal 1 soal false friend (マンション) dengan hint peringatan.
  const ff = qs.find((q) => q.id === 'loan:manshon');
  assert.ok(ff, 'ada soal マンション (false friend)');
  assert.match(ff.hint_id, /false friend|bergeser/i);
});

// ── A2 タメ口↔敬語 ───────────────────────────────────────────────────────────
test('quiz register: dua arah (polite & casual) menghasilkan target berbeda', () => {
  const polite = buildRegisterQuestions(3, 'polite', 5);
  const casual = buildRegisterQuestions(3, 'casual', 5);
  assert.ok(polite.length >= 5 && casual.length === polite.length);
  for (const q of polite) {
    assert.equal(q.kind, 'choice');
    assert.ok(q.choices.some((c) => c.id === q.answerId), 'jawaban ada di pilihan');
    assert.match(q.hint_id, /敬語/);
  }
  // Arah 'casual' → hint タメ口; id soal memuat arah (tak tertukar).
  assert.match(casual[0].hint_id, /タメ口/);
  assert.ok(polite[0].id.endsWith(':polite'));
  assert.ok(casual[0].id.endsWith(':casual'));
});

// ── A3 セリフ組み ────────────────────────────────────────────────────────────
test('quiz serifu: kind order, pool memuat semua blok benar + correct urut', () => {
  const qs = buildSerifuQuestions(11);
  assert.ok(qs.length >= 3, 'beberapa balon');
  for (const q of qs) {
    assert.equal(q.kind, 'order');
    assert.ok(Array.isArray(q.pool) && q.pool.length >= q.correct.length, 'pool cukup');
    for (const id of q.correct) {
      assert.ok(q.pool.some((b) => b.id === id), `blok ${id} ada di pool`);
    }
  }
});

// ── Pabrik & penilaian ───────────────────────────────────────────────────────
test('quiz buildQuestions: mode dikenal → soal; mode asing → []', () => {
  for (const m of QUIZ_MODES) {
    const qs = buildQuestions(m, { level: 3, dir: 'polite', seed: 1 });
    assert.ok(Array.isArray(qs), `${m} mengembalikan array`);
  }
  assert.deepEqual(buildQuestions('nope'), []);
});

test('quiz checkAnswer: pilihan & susun dinilai benar/salah dengan tepat', () => {
  const q = buildOnomaQuestions(1)[0];
  assert.equal(checkAnswer(q, q.answerId).ok, true);
  assert.equal(checkAnswer(q, 'salah-id').ok, false);

  const o = buildSerifuQuestions(1)[0];
  assert.equal(checkAnswer(o, o.correct).ok, true);
  assert.equal(checkAnswer(o, [...o.correct].reverse()).ok, false, 'urutan salah → salah');
  assert.equal(checkAnswer(o, o.correct.slice(0, -1)).ok, false, 'kurang → salah');
  assert.equal(checkAnswer(null, 'x').ok, false, 'soal null → aman');
});

test('quiz: XP konstan & positif', () => {
  assert.ok(QUIZ_XP > 0);
});
