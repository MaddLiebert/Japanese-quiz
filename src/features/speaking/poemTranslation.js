// poemTranslation.js — akses terjemahan puitis puisi (murni: tanpa DOM/React/
// import JSON). Data terjemahan dilewatkan sebagai parameter (pola sama dengan
// speaking.js).
// Bentuk data: { [poemId]: { title_id, lines_id, title_en, lines_en } },
// lines_xx[i] sejajar dengan poem.lines[i]. Bahasa UI 'id' → pakai *_id,
// selain itu → *_en (fallback ke *_id kalau EN belum ada).

// Sufiks field sesuai bahasa UI.
const suffix = (language) => (language === 'id' ? 'id' : 'en');

// Entri terjemahan sebuah puisi; null kalau tidak ada.
export const poemTranslation = (translations, poemId) =>
  (translations && poemId && translations[poemId]) || null;

// Terjemahan satu baris (index-based). '' kalau tidak ada.
// Coba bahasa aktif dulu, lalu fallback ke bahasa lain.
export const translatedLine = (translations, poemId, lineIndex, language = 'en') => {
  const t = poemTranslation(translations, poemId);
  if (!t) return '';
  const primary = t[`lines_${suffix(language)}`];
  const fallback = t[`lines_${suffix(language === 'id' ? 'en' : 'id')}`];
  const lines = Array.isArray(primary) ? primary : (Array.isArray(fallback) ? fallback : []);
  return lines[lineIndex] || '';
};

// Judul terjemahan; '' kalau tidak ada (fallback bahasa lain).
export const translatedTitle = (translations, poemId, language = 'en') => {
  const t = poemTranslation(translations, poemId);
  if (!t) return '';
  return t[`title_${suffix(language)}`] || t[`title_${suffix(language === 'id' ? 'en' : 'id')}`] || '';
};

// Validasi: entri ada, jumlah baris persis sama, semua baris terisi (bahasa aktif).
export const hasFullTranslation = (translations, poem, language = 'en') => {
  const lines = poemTranslation(translations, poem?.id)?.[`lines_${suffix(language)}`];
  return Array.isArray(lines) &&
    lines.length === (poem?.lines || []).length &&
    lines.every((s) => typeof s === 'string' && s.trim().length > 0);
};

// ── Label tipe puisi (haiku/tanka/free) dalam EN/ID ──────────────────────────
export const POEM_TYPES = {
  haiku: { id: 'Haiku', en: 'Haiku' },
  tanka: { id: 'Tanka', en: 'Tanka' },
  free: { id: 'Bebas', en: 'Free Verse' },
};

export const poemTypeLabel = (type, language = 'en') => {
  const t = POEM_TYPES[type];
  if (!t) return type || '';
  return language === 'id' ? t.id : t.en;
};
