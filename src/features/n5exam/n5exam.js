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

// ── Pemetaan skor: bobot per mondai meniru JLPT resmi (0–180 total) ───────────
// JLPT resmi: Reading bernilai jauh lebih besar per soal dibanding Kosakata biasa.
// Total poin: Vocab ~35 + Grammar ~45 + Reading ~40 = LKR 120; Listening = 60.
export const MONDAI_WEIGHTS = {
  // Vocab (22 soal): ~35 poin
  kanji_reading: 1.5,       // 7 * 1.5 = 10.5
  orthography: 1.5,         // 5 * 1.5 = 7.5
  context_vocab: 1.5,       // 6 * 1.5 = 9.0
  paraphrase: 2.0,          // 4 * 2.0 = 8.0  -> Subtotal Vocab = 35.0

  // Grammar & Reading (32 soal): ~85 poin
  grammar_form: 1.5,        // 16 * 1.5 = 24.0
  sentence_composition: 2.0,// 5 * 2.0 = 10.0
  text_grammar: 2.2,        // 5 * 2.2 = 11.0 -> Subtotal Grammar = 45.0
  reading_short: 5.0,       // 3 * 5.0 = 15.0
  reading_mid: 8.0,         // 2 * 8.0 = 16.0
  info_retrieval: 9.0,      // 1 * 9.0 = 9.0  -> Subtotal Reading = 40.0
                            // Subtotal LKR = 35 + 45 + 40 = 120.0

  // Listening (24 soal): 60 poin
  task_comprehension: 2.5,  // 7 * 2.5 = 17.5
  key_point: 2.5,           // 6 * 2.5 = 15.0
  verbal_expression: 2.5,   // 5 * 2.5 = 12.5
  quick_response: 2.5,      // 6 * 2.5 = 15.0 -> Subtotal Listening = 60.0
};

export const mondaiWeight = (type) => MONDAI_WEIGHTS[type] ?? 1.5;

// Hitung skor seksi tertimbang: jumlah (bobot soal * benar) dibulatkan.
export const scaleSectionWeighted = (items, answers) => {
  let earned = 0;
  let max = 0;
  for (let i = 0; i < items.length; i++) {
    const w = mondaiWeight(items[i]?.mondai);
    max += w;
    if (answers[i]) earned += w;
  }
  return { earned, max, scaled: Math.round(earned) };
};

// ── Pemetaan skor: proporsional dengan floor (truncation), sesuai standar JLPT offline ──
export const scaleSection = (rawCorrect, rawTotal, maxScore) =>
  rawTotal <= 0 ? 0 : Math.floor((rawCorrect / rawTotal) * maxScore);

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

// Ambil 4 opsi unik: 1 benar + 3 distraktor dari pool.
// Skip item jika tidak cukup distraktor (pool < 3 unik setelah remove correct).
const pickOptions = (correct, pool, rng) => {
  const seen = new Set([correct]);
  const out = [correct];
  for (const v of shuffle(pool, rng)) {
    if (out.length >= 4) break;
    if (v == null || seen.has(v) || String(v).startsWith('—')) continue;
    seen.add(v);
    out.push(v);
  }
  if (out.length < 4) return null; // Tandai item ini bermasalah (skip UI)
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
    // Ambil semua reading unik (onyomi + kunyomi), bukan cuma [0]
    const allReadings = [...new Set(readings.filter(r => r.length > 0))];
    if (allReadings.length < 4) return null; // Skip jika tidak cukup distraktor
    const correct = allReadings.find(r => r === (k.kunyomi || '').split('、')[0].replace(/[()（）]/g, '').trim()) ||
                    allReadings.find(r => r === (k.onyomi || '').split('、')[0].replace(/[()（）]/g, '').trim()) ||
                    allReadings[0];
    return makeItem({
      id: `n5_kanji_${k.id}`,
      mondai: 'kanji_reading',
      prompt: `「${k.char}」の 読み方は どれですか。`,
      // Furigana sengaja TIDAK di prompt ini — kanji-nya justru soal yang ditanya.
      explanation: `${k.char}（${k.meaning}）= ${correct}`,
    }, correct, allReadings, rng);
  }).filter(Boolean);
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

// Acak opsi untuk item dari bank authored (supaya correctIndex tidak selalu 0)
const shuffleAuthoredItem = (item, rng) => {
  if (!item || !Array.isArray(item.options) || item.options.length < 2) return item;
  const tagged = item.options.map((t, idx) => ({ t, idx }));
  const shuffled = shuffle(tagged, rng);
  const correctIdx = typeof item.correctIndex === 'number' ? item.correctIndex : 0;
  return {
    ...item,
    options: shuffled.map((o) => o.t),
    correctIndex: shuffled.findIndex((o) => o.idx === correctIdx),
    answer: item.options[correctIdx] ?? item.answer,
  };
};

export const buildSection = (type, bank, datasets, count, rng = Math.random) => {
  let source;
  if (type === 'kanji_reading') source = kanjiReading(datasets, rng);
  else if (type === 'grammar_form') source = grammarForm(datasets, rng);
  else if (type === 'task_comprehension' || type === 'key_point') source = mondaiListening(datasets, rng);
  else {
    const raw = Array.isArray(bank?.[type]) ? bank[type] : [];
    source = raw.map((it) => shuffleAuthoredItem(it, rng));
  }

  if (!source || source.length === 0) return [];
  const shuffled = shuffle(source, rng);
  const out = [];
  // Bila bank < count → pakai ulang dari awal (sampling with replacement) supaya ujian tetap penuh.
  // Skip item dengan options===null (tidak cukup distraktor).
  for (let i = 0; i < count; i++) {
    const it = shuffled[i % shuffled.length];
    if (it && it.options !== null) out.push({ ...it, mondai: type, _slot: i });
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
export const scoreExam = (exam, answers, evaluate = evaluatePass) => {
  let cursor = 0;
  const perSection = {};
  const perMondai = [];
  let lkrWeighted = 0;
  let listeningWeighted = 0;

  for (const sec of exam) {
    let correct = 0;
    for (const item of sec.items) {
      const ok = !!answers[cursor++];
      const w = mondaiWeight(item.mondai);
      if (ok) {
        correct++;
        if (sec.key === 'listening') listeningWeighted += w;
        else lkrWeighted += w;
      }
      const row = perMondai.find((r) => r.mondai === item.mondai);
      if (row) { row.correct += ok ? 1 : 0; row.total += 1; }
      else perMondai.push({ mondai: item.mondai, correct: ok ? 1 : 0, total: 1 });
    }
    perSection[sec.key] = { correct, total: sec.items.length };
  }
  const lkrRaw = perSection.vocab.correct + perSection.grammarReading.correct;
  const lkrTotal = perSection.vocab.total + perSection.grammarReading.total;
  
  // Hitung scaled score dengan pembobotan mondai (meniru bobot JLPT resmi)
  const lkrScaled = Math.min(LKR_MAX, Math.round(lkrWeighted));
  const listeningScaled = Math.min(LISTENING_MAX, Math.round(listeningWeighted));
  const total = lkrScaled + listeningScaled;
  const lkrOk = lkrScaled >= N5_PASS_LKR;
  const listeningOk = listeningScaled >= N5_PASS_LISTENING;
  const totalOk = total >= N5_PASS_TOTAL;

  // Custom evaluator (mis. gerbang 終 電脳 = ambang NAIK).
  // Jika evaluate diberikan dan bukan evaluatePass, delegasikan argumen ke custom evaluator.
  let verdict = { lkrScaled, listeningScaled, total, lkrOk, listeningOk, totalOk, passed: totalOk && lkrOk && listeningOk };
  if (evaluate && evaluate !== evaluatePass) {
    const customVerdict = evaluate({
      lkrRaw, lkrTotal,
      listeningRaw: perSection.listening.correct,
      listeningTotal: perSection.listening.total,
    });
    verdict = { ...verdict, ...customVerdict };
  }

  return {
    perSection, perMondai, lkrRaw, lkrTotal,
    listeningRaw: perSection.listening.correct,
    listeningTotal: perSection.listening.total,
    ...verdict,
  };
};
