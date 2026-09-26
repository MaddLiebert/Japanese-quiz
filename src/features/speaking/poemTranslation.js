// poemTranslation.js — akses terjemahan puitis Indonesia puisi (murni:
// tanpa DOM/React/import JSON). Data terjemahan dilewatkan sebagai parameter
// (pola sama dengan speaking.js).
// Bentuk data: { [poemId]: { title_id: string, lines_id: string[] } },
// lines_id[i] sejajar dengan poem.lines[i].

// Entri terjemahan sebuah puisi; null kalau tidak ada.
export const poemTranslation = (translations, poemId) =>
  (translations && poemId && translations[poemId]) || null;

// Terjemahan satu baris (index-based). '' kalau tidak ada.
export const translatedLine = (translations, poemId, lineIndex) => {
  const lines = poemTranslation(translations, poemId)?.lines_id;
  if (!Array.isArray(lines)) return '';
  return lines[lineIndex] || '';
};

// Judul terjemahan; '' kalau tidak ada.
export const translatedTitle = (translations, poemId) =>
  poemTranslation(translations, poemId)?.title_id || '';

// Validasi: entri ada, jumlah baris persis sama, semua baris terisi.
export const hasFullTranslation = (translations, poem) => {
  const lines = poemTranslation(translations, poem?.id)?.lines_id;
  return Array.isArray(lines) &&
    lines.length === (poem?.lines || []).length &&
    lines.every((s) => typeof s === 'string' && s.trim().length > 0);
};
