// eras.js — daftar tema era + gerbang level. Modul MURNI (tanpa React/DOM)
// supaya bisa dites `node --test`. Lihat PRD: docs/tema/heian.md §13.
export const ERAS = [
  { id: 'heian',    kanji: '平安', name: 'Heian',            minLevel: 1 },
  { id: 'edo',      kanji: '江戸', name: 'Edo',              minLevel: 20 },
  { id: 'meiji',    kanji: '明治', name: 'Meiji',            minLevel: 50 },
  { id: 'showa',    kanji: '昭和', name: 'Shōwa',            minLevel: 100 },
  { id: 'anime',    kanji: '多元', name: 'Anime Multiverse', minLevel: 150 },
  { id: 'cyberpunk',kanji: '電脳', name: 'Cyberpunk',        minLevel: 300 },
];

export const DEFAULT_ERA = 'heian';

const lv = (n) => (Number.isFinite(n) ? n : 1);

export function getEra(id) {
  return ERAS.find((e) => e.id === id) || null;
}

// Era tertinggi yang minLevel-nya <= level.
export function eraForLevel(level) {
  const n = lv(level);
  let current = ERAS[0];
  for (const e of ERAS) if (n >= e.minLevel) current = e;
  return current;
}

export function isEraUnlocked(eraId, level) {
  const e = getEra(eraId);
  if (!e) return false;
  return lv(level) >= e.minLevel;
}

export function unlockedEras(level) {
  return ERAS.filter((e) => isEraUnlocked(e.id, level));
}

export function nextEra(level) {
  return ERAS.find((e) => e.minLevel > lv(level)) || null;
}
