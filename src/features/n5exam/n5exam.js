// ─────────────────────────────────────────────────────────────────────────────
// N5 Exam 模擬試験 — logika murni (tanpa React, tanpa import JSON).
// Meniru JLPT N5 resmi: 3 seksi berwaktu (20/40/30 mnt), 78 soal, skor 0–180.
// Sumber: jlpt.jp/guideline/testsections.html & /results.html (revisi Des 2020).
// Aturan repo: modul murni dilarang import src/data/*.json — dataset = parameter.
// ─────────────────────────────────────────────────────────────────────────────

import { shuffle } from '../quiz/questionBuilder.js';

// ── Skor resmi JLPT N5 ──────────────────────────────────────────────────────
export const N5_PASS_TOTAL = 80;      // total lulus (0–180)
export const N5_PASS_LKR = 38;        // sectional: Vocab+Grammar+Reading (0–120)
export const N5_PASS_LISTENING = 19;  // sectional: Listening (0–60)
export const LKR_MAX = 120;           // skor maksimum seksi gabungan A+B
export const LISTENING_MAX = 60;      // skor maksimum seksi Listening

// ── Gate unlock: rank Shogun DAN minimal 30 kanji sudah dihafal (mastered) ───
export const N5_EXAM_MIN_MASTERED_KANJI = 30;

// Kanji dianggap "hafal" bila status SRS-nya 'mastered' (lihat ProgressContext:
// recordAnswer → streak ≥ 3 ⇒ 'mastered'). Kunci itemProgress kanji berawalan 'kj_'.
export const countMasteredKanji = (itemProgress) => {
  if (!itemProgress || typeof itemProgress !== 'object') return 0;
  return Object.entries(itemProgress).filter(
    ([id, s]) => typeof id === 'string' && id.startsWith('kj_') && s && s.status === 'mastered',
  ).length;
};

// Gate tunggal: rank dari getRank (single source of truth) + jumlah kanji hafal.
export const isN5ExamUnlocked = (rank, masteredKanjiCount) =>
  typeof rank === 'string' && rank.startsWith('Shogun')
  && Number(masteredKanjiCount) >= N5_EXAM_MIN_MASTERED_KANJI;

// ── Blueprint tipe soal (mondai) persis komposisi resmi N5 ──────────────────
// `gen` = dibangun otomatis dari pool yang sudah ada; tanpa `gen` = dari n5-exam.json.
export const N5_SECTIONS = {
  vocab: {
    minutes: 20,
    label: { id: 'Pengetahuan Bahasa (Kosakata)', en: 'Language Knowledge (Vocabulary)', jp: '言語知識・語彙 · gengo chishiki · goi' },
    mondai: [
      { type: 'kanji_reading', count: 7, gen: 'kanji' },
      { type: 'orthography', count: 5 },
      { type: 'context_vocab', count: 6 },
      { type: 'paraphrase', count: 4 },
    ],
  },
  grammarReading: {
    minutes: 40,
    label: { id: 'Pengetahuan Bahasa (Tata Bahasa)・Membaca', en: 'Language Knowledge (Grammar)・Reading', jp: '言語知識・文法・読解 · gengo chishiki · bunpō · dokkai' },
    mondai: [
      { type: 'grammar_form', count: 16, gen: 'grammar' },
      { type: 'sentence_composition', count: 5 },
      { type: 'text_grammar', count: 5 },
      { type: 'reading_short', count: 3 },
      { type: 'reading_mid', count: 2 },
      { type: 'info_retrieval', count: 1 },
    ],
  },
  listening: {
    minutes: 30,
    label: { id: 'Menyimak', en: 'Listening', jp: '聴解 · chōkai' },
    mondai: [
      { type: 'task_comprehension', count: 7, gen: 'mondai' },
      { type: 'key_point', count: 6, gen: 'mondai' },
      { type: 'verbal_expression', count: 5 },
      { type: 'quick_response', count: 6 },
    ],
  },
};

export const N5_SECTION_ORDER = ['vocab', 'grammarReading', 'listening'];
export const N5_TOTAL_MINUTES = N5_SECTION_ORDER.reduce((s, k) => s + N5_SECTIONS[k].minutes, 0);

// Jumlah soal mentah satu seksi (22 / 32 / 24 = 78).
export const sectionRawTotal = (sectionKey) =>
  N5_SECTIONS[sectionKey].mondai.reduce((s, m) => s + m.count, 0);

// ── Pemetaan skor: proporsional (aproksimasi IRT asli yang tak bisa direplikasi offline) ──
export const scaleSection = (rawCorrect, rawTotal, maxScore) =>
  rawTotal <= 0 ? 0 : Math.round((rawCorrect / rawTotal) * maxScore);

// Nilai kelulusan: total ≥80 DAN lkr ≥38 DAN listening ≥19 (gagal satu seksi = gagal).
export const evaluatePass = ({ lkrRaw, lkrTotal, listeningRaw, listeningTotal }) => {
  const lkrScaled = scaleSection(lkrRaw, lkrTotal, LKR_MAX);
  const listeningScaled = scaleSection(listeningRaw, listeningTotal, LISTENING_MAX);
  const total = lkrScaled + listeningScaled;
  const lkrOk = lkrScaled >= N5_PASS_LKR;
  const listeningOk = listeningScaled >= N5_PASS_LISTENING;
  const totalOk = total >= N5_PASS_TOTAL;
  return {
    lkrScaled, listeningScaled, total,
    lkrOk, listeningOk, totalOk,
    passed: totalOk && lkrOk && listeningOk,
  };
};

export const formatClock = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

// ── Builder soal ────────────────────────────────────────────────────────────
// Item shape seragam (dibaca UI):
// { id, mondai, prompt, promptFurigana?, passage?, passageFurigana?, audio?,
//   options:[4], correctIndex, answer, explanation }
// Teks yang mengandung kanji disimpan dengan anotasi furigana format "漢字[かんじ]"
// di field *Furigana; UI merendernya lewat <Furigana/>.

// Ambil 4 opsi unik: 1 benar + 3 distraktor dari pool (fallback bila pool tipis).
const pickOptions = (correct, pool, rng) => {
  const seen = new Set([correct]);
  const out = [correct];
  for (const v of shuffle(pool, rng)) {
    if (out.length >= 4) break;
    if (v == null || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  let n = 1;
  while (out.length < 4) { out.push(`—${n}`); n++; }
  return shuffle(out, rng);
};

const makeItem = (base, correctValue, distractorPool, rng) => {
  const options = pickOptions(correctValue, distractorPool, rng);
  return {
    ...base,
    options,
    correctIndex: options.indexOf(correctValue),
    answer: correctValue,
  };
};

// — Tipe yang dibangun otomatis dari pool yang ada —
const kanjiReading = (datasets, rng) => {
  const pool = datasets.kanji || [];
  const readings = pool
    .flatMap((k) => [...String(k.onyomi || '').split('、'), ...String(k.kunyomi || '').split('、')])
    .map((s) => s.replace(/[()（）]/g, '').trim())
    .filter(Boolean);
  return pool.map((k) => {
    const correct = (String(k.kunyomi || '').split('、')[0] || String(k.onyomi || '').split('、')[0] || '')
      .replace(/[()（）]/g, '').trim();
    return makeItem({
      id: `n5_kanji_${k.id}`,
      mondai: 'kanji_reading',
      prompt: `「${k.char}」の 読み方は どれですか。`,
      // Furigana sengaja TIDAK di prompt ini — kanji-nya justru soal yang ditanya.
      explanation: `${k.char}（${k.meaning}）= ${correct}`,
    }, correct, readings, rng);
  });
};

const grammarForm = (datasets, rng) => {
  const pool = datasets.grammar || [];
  const particles = [...new Set(pool.map((g) => g.char).filter(Boolean))];
  return pool.map((g) => {
    const options = pickOptions(g.char, particles, rng);
    return {
      id: `n5_grm_${g.id}`,
      mondai: 'grammar_form',
      prompt: g.question,
      options,
      correctIndex: options.indexOf(g.char),
      answer: g.char,
      explanation: `Jawaban: ${g.char} (${g.romaji})`,
    };
  });
};

const mondaiListening = (datasets, rng) => {
  const pool = datasets.mondai || [];
  return pool.map((m) => {
    const tagged = m.options.map((t, idx) => ({ t, idx }));
    const shuffled = shuffle(tagged, rng);
    return {
      id: `n5_lst_${m.id}`,
      mondai: 'task_comprehension',
      prompt: m.questionText,
      audio: m.audio,
      options: shuffled.map((o) => o.t),
      correctIndex: shuffled.findIndex((o) => o.idx === m.correctIndex),
      answer: m.options[m.correctIndex],
      explanation: m.explanation,
      dialogScript: m.dialogScript,
    };
  });
};

export const buildSection = (type, bank, datasets, count, rng = Math.random) => {
  let source;
  if (type === 'kanji_reading') source = kanjiReading(datasets, rng);
  else if (type === 'grammar_form') source = grammarForm(datasets, rng);
  else if (type === 'task_comprehension' || type === 'key_point') source = mondaiListening(datasets, rng);
  else source = Array.isArray(bank?.[type]) ? bank[type] : [];

  if (!source || source.length === 0) return [];
  const shuffled = shuffle(source, rng);
  const out = [];
  // Bila bank < count → pakai ulang dari awal (sampling with replacement) supaya ujian tetap penuh.
  for (let i = 0; i < count; i++) {
    const it = shuffled[i % shuffled.length];
    out.push({ ...it, mondai: type, _slot: i });
  }
  return out;
};

export const buildExam = (bank, datasets, rng = Math.random) =>
  N5_SECTION_ORDER.map((key) => {
    const sec = N5_SECTIONS[key];
    const items = sec.mondai.flatMap((m) => buildSection(m.type, bank, datasets, m.count, rng));
    return { key, minutes: sec.minutes, label: sec.label, items };
  });

// answers = array boolean sejajar exam.flatMap(s => s.items).
export const scoreExam = (exam, answers) => {
  let cursor = 0;
  const perSection = {};
  const perMondai = [];
  for (const sec of exam) {
    let correct = 0;
    for (const item of sec.items) {
      const ok = !!answers[cursor++];
      if (ok) correct++;
      const row = perMondai.find((r) => r.mondai === item.mondai);
      if (row) { row.correct += ok ? 1 : 0; row.total += 1; }
      else perMondai.push({ mondai: item.mondai, correct: ok ? 1 : 0, total: 1 });
    }
    perSection[sec.key] = { correct, total: sec.items.length };
  }
  const lkrRaw = perSection.vocab.correct + perSection.grammarReading.correct;
  const lkrTotal = perSection.vocab.total + perSection.grammarReading.total;
  const verdict = evaluatePass({
    lkrRaw, lkrTotal,
    listeningRaw: perSection.listening.correct,
    listeningTotal: perSection.listening.total,
  });
  return {
    perSection, perMondai, lkrRaw, lkrTotal,
    listeningRaw: perSection.listening.correct,
    listeningTotal: perSection.listening.total,
    ...verdict,
  };
};
