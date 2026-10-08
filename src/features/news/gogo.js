// gogo.js — M10 号外 (koran larut malam). Modul MURNI.
// Jam tertentu (00–04 waktu nyata) atau acak langka → Home jadi edisi 号外
// gelap. Bukan tombol; dia yang datang. Isinya: LAPORAN TENTANGMU (progress
// nyata). Nada datar (lihat M3). Frekuensi dibatasi (maks 1×/hari).
// Spec: docs/tema/meiji-mekanik.md §M10.

export const GOGO_KEY = 'app_gogo_v1';

export const isGogoWindow = (hour) => {
  const h = Number(hour);
  return Number.isFinite(h) && h >= 0 && h < 4;
};

// Headline dari stats nyata (mis. hari & kanji). Datar, tanpa drama.
export const gogoHeadline = (stats = {}, language = 'id') => {
  const days = Number(stats.daysActive) || 0;
  const kanji = Number(stats.kanjiMastered) || 0;
  const streak = Number(stats.streak) || 0;
  if (language === 'en') {
    return `Day ${days} · ${kanji} kanji mastered · streak ${streak}`;
  }
  return `Hari ke-${days} · ${kanji} kanji dikuasai · rentetan ${streak}`;
};

// Maks 1×/hari: `lastShownDate` = 'YYYY-MM-DD'. Boleh tampil kalau beda hari.
export const canShowGogo = (lastShownDate, todayDate) =>
  Boolean(todayDate) && lastShownDate !== todayDate;

export default isGogoWindow;
