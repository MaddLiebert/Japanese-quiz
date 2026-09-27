// localize.js — helper murni memilih field sesuai bahasa UI.
// Konvensi data: field dasar berbahasa Indonesia (mis. `questionText`), versi
// Inggris bersufiks `_en` (mis. `questionText_en`). Mode 'id' → field dasar,
// selain itu → `_en` (fallback ke field dasar kalau EN belum ada).
// Tanpa React/DOM — bisa dites dengan `node --test`.

// Ambil nilai terlokalisasi dari objek. `base` = nama field dasar (ID).
export const localized = (obj, base, language) => {
  if (!obj) return '';
  if (language === 'id') return obj[base] ?? '';
  const en = obj[`${base}_en`];
  return (en != null && en !== '') ? en : (obj[base] ?? '');
};

// Versi untuk bahasa eksplisit 'en' (selalu coba _en dulu).
export const localizedEn = (obj, base) => localized(obj, base, 'en');

// Versi array (mis. `objectives` → `objectives_en`). Mode 'en' → array EN kalau
// ada & panjangnya cocok; kalau tidak, fallback ke array dasar.
export const localizedArray = (obj, base, language) => {
  if (!obj) return [];
  const idArr = Array.isArray(obj[base]) ? obj[base] : [];
  if (language === 'id') return idArr;
  const enArr = obj[`${base}_en`];
  return (Array.isArray(enArr) && enArr.length === idArr.length) ? enArr : idArr;
};
