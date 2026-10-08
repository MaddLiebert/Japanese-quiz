// questions.js — M15 app bertanya balik. Modul MURNI.
// Di momen tenang, app bertanya 「なぜ、ぼくはここにいるんだと思う？」 →
// pemain menjawab → app mengingat & mengutipnya kembali nanti (era lain).
// Jawaban disimpan di app_companion_v1 (persist lintas-era).
// Spec: docs/tema/meiji-mekanik.md §M15.

export const COMPANION_KEY = 'app_companion_v1';
export const COMPANION_VERSION = 1;

export const QUESTIONS = [
  { id: 'why', jp: 'なぜ、ぼくはここにいるんだと思う？',
    id_text: 'Menurutmu kenapa aku ada di sini?' },
];

export const questionById = (id) => QUESTIONS.find((q) => q.id === id) || null;

// Simpan jawaban (pure): { [qid]: answer }.
export const rememberAnswer = (answers, qid, answer) => ({
  ...(answers || {}), [qid]: String(answer ?? ''),
});

// Kutip kembali untuk era lain. null kalau belum dijawab.
export const quoteAnswer = (answers, qid) => {
  const a = answers?.[qid];
  return a ? `「${a}」` : null;
};

export const hasAnswer = (answers, qid) => Boolean(answers?.[qid]);

export default QUESTIONS;
