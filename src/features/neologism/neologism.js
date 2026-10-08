// neologism.js — M8 新語 (cipta kata). Modul MURNI.
// Nyata: Meiji MENCIptakan kata untuk konsep Barat (哲学, 科学, 自由, 電報…).
// Mekanik: pemain diberi KONSEP tanpa kata Jepangnya → menyusun istilah dari
// kanji → dibandingkan dengan kata nyata. Sumber kanji = src/data/kanji.json.
// Spec: docs/tema/meiji-mekanik.md §M8.

export const NEOLOGISMS = [
  { id: 'philosophy', concept_id: 'Filsafat', concept_en: 'Philosophy',
    answer: '哲学', pool: ['哲', '学', '自', '由', '科'] },
  { id: 'science', concept_id: 'Ilmu pengetahuan', concept_en: 'Science',
    answer: '科学', pool: ['科', '学', '哲', '明'] },
  { id: 'freedom', concept_id: 'Kebebasan', concept_en: 'Freedom',
    answer: '自由', pool: ['自', '由', '民', '権'] },
  { id: 'telegraph', concept_id: 'Telegraf', concept_en: 'Telegraph',
    answer: '電報', pool: ['電', '報', '信', '文'] },
];

export const neologismById = (id) => NEOLOGISMS.find((n) => n.id === id) || null;

// Cek susunan kanji pemain terhadap kata sejarah.
// ok = cocok persis (urutan benar). exact = sama dengan `answer`.
export const checkNeologism = (item, kanjiIds = []) => {
  if (!item) return { ok: false, exact: false };
  const guess = Array.isArray(kanjiIds) ? kanjiIds.join('') : String(kanjiIds || '');
  return { ok: guess === item.answer, exact: guess === item.answer };
};

// Kanji dari pool yang belum terpakai (untuk UI board).
export const remainingKanji = (item, used = []) =>
  (item?.pool || []).filter((k) => !used.includes(k));

export default NEOLOGISMS;
