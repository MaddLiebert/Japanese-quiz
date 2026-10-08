// koseki.js — M11 戸籍 (buku hidup pemain). Meiji = era pendataan.
// Modul MURNI (tanpa React/DOM). Hanya MEMBACA data progress yang sudah ada;
// koreksi pemain disimpan di key baru `app_koseki_v1` (lihat catatan risiko R5).
// Nada manis-creepy: app mengingat, dan mengaku bisa salah.
// Spec: docs/tema/meiji-mekanik.md §M11.

export const KOSEKI_KEY = 'app_koseki_v1';
export const KOSEKI_VERSION = 1;

// Bangun baris-baris buku 戸籍 dari progress nyata. Stabil (deterministik):
// input sama → output sama. Field yang tak ada → entri dilewati (tidak crash).
export const buildKoseki = (progress = {}) => {
  const entries = [];
  const push = (id, jp, id_text, value) =>
    entries.push({ id, jp, id_text, value: value ?? null });

  if (progress.firstSeen) push('since', '登録', 'Terdaftar sejak', progress.firstSeen);
  if (Number.isFinite(progress.daysActive)) push('days', '日数', 'Hari aktif', progress.daysActive);
  if (Number.isFinite(progress.level)) push('level', '階級', 'Level', progress.level);
  if (Number.isFinite(progress.xp)) push('xp', '点数', 'XP', progress.xp);
  if (progress.firstMistakeKanji) push('mistake', '最初の誤り', 'Kesalahan pertama', progress.firstMistakeKanji);

  return {
    since: progress.firstSeen ?? null,
    days: Number.isFinite(progress.daysActive) ? progress.daysActive : 0,
    firstMistake: progress.firstMistakeKanji || null,
    entries,
  };
};

// Tambah koreksi pemain (app bisa salah tentangmu → kamu mengoreksi).
// Pure: mengembalikan objek koseki BARU dengan 1 koreksi ditambahkan.
export const correctEntry = (koseki, entryId, note) => {
  const corrections = Array.isArray(koseki?.corrections) ? [...koseki.corrections] : [];
  corrections.push({ entryId, note, at: corrections.length });
  return { ...(koseki || {}), corrections };
};

export const correctionsFor = (koseki, entryId) =>
  (koseki?.corrections || []).filter((c) => c.entryId === entryId);

export default buildKoseki;
