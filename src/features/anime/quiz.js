// ─────────────────────────────────────────────────────────────────────────────
// quiz.js — mesin kuis 多元 (E1–E5 wiring). MURNI: tanpa React, tanpa DOM.
//
// Menyatukan 5 modul belajar 多元 ke SATU bentuk soal seragam supaya satu halaman
// latihan (`/anime-practice`) bisa melayani semuanya:
//   • onoma    (A1 オノマトペ)   — adegan → pilih bunyi
//   • register (A2 タメ口↔敬語) — kalimat → pilih register lawan
//   • serifu   (A3 セリフ組み)   — susun potongan dialog (kind 'order')
//   • slang    (A6 若者言葉)     — arti → pilih kata slang
//   • loanwords(A7 カタカナ)     — asal kata → pilih katakana
//
// Bentuk soal:
//   { id, mode, kind: 'choice'|'order', prompt_jp, prompt_id, hint_id,
//     choices: [{id, jp, sub}], answerId, reveal: {jp, id} }
// kind 'order' memakai `pool` (blok teracak) + `correct` (urutan id benar).
//
// Deterministik (seed) → bisa dites di node tanpa DOM. Semua pembuat soal
// mengembalikan array (kosong bila modul tak punya soal untuk level itu).
// Spec: docs/tema/anime-mekanik.md §A1/A2/A3/A6/A7.
// ─────────────────────────────────────────────────────────────────────────────
import { onomaQuestions, onomaChoices } from '../onoma/onoma.js';
import { slangByLevel } from '../slang/slang.js';
import { LOANWORDS, LOAN_LANG_LABELS } from '../loanwords/loanwords.js';
import { registerByLevel, registerTarget } from '../register/register.js';
import { SERIFU, bubblesOf, buildPool, correctOrder } from '../serifu/serifu.js';

export const QUIZ_MODES = ['onoma', 'register', 'serifu', 'slang', 'loanwords'];

// Label mode (untuk tab UI) + perhentian peta terkait.
export const QUIZ_MODE_LABEL = {
  onoma:     { jp: 'オノマトペ', id: 'Kata Bunyi',    stop: 'boken' },
  register:  { jp: 'タメ口↔敬語', id: 'Register',      stop: 'nichijo' },
  serifu:    { jp: 'セリフ組み', id: 'Susun Dialog',   stop: 'nichijo' },
  slang:     { jp: '若者言葉',   id: 'Slang Muda',    stop: 'seishun' },
  loanwords: { jp: 'カタカナ',   id: 'Kata Serapan',  stop: 'maho' },
};

export const isQuizMode = (mode) => QUIZ_MODES.includes(mode);

// ── RNG deterministik (mulberry32) — seed sama → urutan sama ─────────────────
const rng = (seed) => {
  let a = (Number(seed) || 1) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Salinan teracak deterministik (tidak mengubah input).
export const shuffle = (arr, seed = 1) => {
  const out = [...(arr || [])];
  const r = rng(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

// Hash pendek string → seed stabil per-soal (urutan pilihan tak ikut berubah
// saat bank tumbuh).
const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < String(s).length; i += 1) {
    h ^= String(s).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
};

// Ambil `n` distraktor dari kandidat (buang yang id-nya sama dengan jawaban).
const distractors = (candidates, answerId, n, seed) =>
  shuffle(candidates.filter((c) => c.id !== answerId), seed).slice(0, n);

// ── Soal: A1 オノマトペ (adegan → pilih bunyi) ────────────────────────────────
export const buildOnomaQuestions = (seed = 1) =>
  onomaQuestions().map((it) => ({
    id: `onoma:${it.id}`, mode: 'onoma', kind: 'choice',
    prompt_jp: it.scene_jp, prompt_id: null,
    hint_id: 'Pilih オノマトペ yang tepat untuk adegan ini.',
    choices: shuffle(
      onomaChoices(it).map((c) => ({ id: c.id, jp: c.jp, sub: c.reading })),
      seed + hash(it.id),
    ),
    answerId: it.id,
    reveal: { jp: it.jp, id: it.meaning_id },
  }));

// ── Soal: A6 若者言葉 (arti → pilih kata) ─────────────────────────────────────
export const buildSlangQuestions = (level = 3, seed = 1) => {
  const bank = slangByLevel(level);
  const all = bank.map((s) => ({ id: s.id, jp: s.jp, sub: s.reading }));
  return bank.map((s) => ({
    id: `slang:${s.id}`, mode: 'slang', kind: 'choice',
    prompt_jp: s.meaning_id, prompt_id: s.caution_id || null,
    hint_id: 'Pilih kata slang yang cocok dengan arti ini.',
    choices: shuffle([
      { id: s.id, jp: s.jp, sub: s.reading },
      ...distractors(all, s.id, 3, seed + hash(s.id)),
    ], seed + hash(s.id)),
    answerId: s.id,
    reveal: { jp: s.jp, id: s.meaning_id },
  }));
};

// ── Soal: A7 カタカナ loanwords (asal kata → pilih katakana) ──────────────────
export const buildLoanQuestions = (seed = 1) => {
  const all = LOANWORDS.map((l) => ({ id: l.id, jp: l.jp, sub: l.origin }));
  return LOANWORDS.map((l) => ({
    id: `loan:${l.id}`, mode: 'loanwords', kind: 'choice',
    prompt_jp: l.origin, prompt_id: LOAN_LANG_LABELS[l.origin_lang] || l.origin_lang,
    hint_id: l.false_friend ? 'Hati-hati — artinya bergeser (false friend).' : 'Pilih カタカナ dari kata asal ini.',
    choices: shuffle([
      { id: l.id, jp: l.jp, sub: l.meaning_id },
      ...distractors(all, l.id, 3, seed + hash(l.id)),
    ], seed + hash(l.id)),
    answerId: l.id,
    reveal: { jp: l.jp, id: l.meaning_id },
  }));
};

// ── Soal: A2 タメ口↔敬語 (kalimat → pilih register lawan) ─────────────────────
// mode 'polite' = santai→hormat; 'casual' = hormat→santai.
export const buildRegisterQuestions = (level = 3, dir = 'polite', seed = 1) => {
  const bank = registerByLevel(level);
  const all = bank.map((p) => ({ id: registerTarget(p, dir), jp: registerTarget(p, dir), sub: p.meaning_id }));
  return bank.map((p) => {
    const src = dir === 'casual' ? p.polite : p.casual;
    const target = registerTarget(p, dir);
    return {
      id: `register:${p.id}:${dir}`, mode: 'register', kind: 'choice',
      prompt_jp: src, prompt_id: p.meaning_id,
      hint_id: dir === 'casual' ? 'Ubah ke タメ口 (santai).' : 'Ubah ke 敬語 (hormat).',
      choices: shuffle([
        { id: target, jp: target, sub: p.meaning_id },
        ...distractors(all, target, 3, seed + hash(p.id)),
      ], seed + hash(p.id + dir)),
      answerId: target,
      reveal: { jp: target, id: p.meaning_id },
    };
  });
};

// ── Soal: A3 セリフ組み (susun potongan dialog) — kind 'order' ────────────────
// Satu soal = SATU balon (potongan dialog) yang harus disusun benar.
export const buildSerifuQuestions = (seed = 1) =>
  SERIFU.flatMap((scene) =>
    bubblesOf(scene).map((bubble, bi) => ({
      id: `serifu:${scene.id}:${bi}`, mode: 'serifu', kind: 'order',
      prompt_jp: scene.scene_jp, prompt_id: scene.translation,
      who: bubble.who,
      hint_id: 'Susun potongan jadi kalimat yang benar (SOV).',
      pool: buildPool(bubble, seed + hash(`${scene.id}:${bi}`)),
      correct: correctOrder(bubble),
      answerId: null,
      reveal: { jp: (bubble.parts || []).map((p) => p.jp).join(''), id: scene.translation },
    })),
  );

// ── Pabrik soal: mode → daftar soal ─────────────────────────────────────────
export const buildQuestions = (mode, { level = 3, dir = 'polite', seed = 1 } = {}) => {
  switch (mode) {
    case 'onoma': return buildOnomaQuestions(seed);
    case 'register': return buildRegisterQuestions(level, dir, seed);
    case 'serifu': return buildSerifuQuestions(seed);
    case 'slang': return buildSlangQuestions(level, seed);
    case 'loanwords': return buildLoanQuestions(seed);
    default: return [];
  }
};

// ── Penilaian ───────────────────────────────────────────────────────────────
// Soal pilihan: `chosen` = id pilihan. Soal susun: `chosen` = array id terurut.
export const checkAnswer = (question, chosen) => {
  if (!question) return { ok: false, correct: null };
  if (question.kind === 'order') {
    const order = Array.isArray(chosen) ? chosen : [];
    const ok = order.length === question.correct.length
      && order.every((id, i) => id === question.correct[i]);
    return { ok, correct: [...question.correct] };
  }
  return { ok: chosen === question.answerId, correct: question.answerId };
};

// XP per jawaban benar (sederhana & seragam).
export const QUIZ_XP = 6;
