// rank.js — sistem PANGKAT (rank) 位階. Logika MURNI: tanpa React/JSX, supaya
// bisa dites `node --test` (pola features/**/*.js lain).
//
// SATU-SATUNYA sumber kebenaran rank: ambang XP, kanji, ikon, warna aksen,
// tagline, dan status "puncak". UI (RankBadge.jsx) + gate fitur (Death Quiz,
// Ujian N5) membaca dari sini. `getRank()` di ProgressContext mendelegasi ke
// sini agar rank tetap berupa STRING (kontrak lama: gate memakai
// `rank.startsWith('Shogun')`).

// tier menaik: 0 = paling dasar, 3 = PUNCAK (paling "wah").
// accent dipakai untuk border/glow tiap tier; `top: true` = perlakuan hero
// (emas 金 + kilau + cincin berputar + percikan) — lihat RankBadge + index.css.
export const RANKS = [
  {
    key: 'Kouhai',
    kanji: '後輩',
    glyph: 'bird',
    minXp: 0,
    tier: 0,
    accent: '#7d8f69',
    tagline: 'Murid baru — perjalanan baru dimulai.',
    tagline_en: 'Fresh student — the journey just began.',
  },
  {
    key: 'Senpai',
    kanji: '先輩',
    glyph: 'sword',
    minXp: 5000,
    tier: 1,
    accent: '#182b49',
    tagline: 'Sudah melangkah — kini ditiru yang lain.',
    tagline_en: 'You have stepped up — now others look to you.',
  },
  {
    key: 'Sensei',
    kanji: '先生',
    glyph: 'scroll',
    minXp: 10000,
    tier: 2,
    accent: '#d3382f',
    tagline: 'Guru — ilmu sudah layak dibagikan.',
    tagline_en: 'Master — your knowledge is worth passing on.',
  },
  {
    key: 'Shogun',
    kanji: '将軍',
    glyph: 'skull',
    minXp: 20000,
    tier: 3,
    top: true,
    accent: '#a9821c',       // emas 金
    tagline: 'Sang Jenderal Agung — tak ada jalan kembali.',
    tagline_en: 'The Great General — there is no road back.',
  },
];

// Rank puncak (perlakuan hero). Diekspor agar UI/gate tak perlu menebak.
export const TOP_RANK = RANKS[RANKS.length - 1];
export const TOP_RANK_XP = TOP_RANK.minXp;

// Ambang XP → info rank lengkap (objek dari RANKS). Input aneh → rank dasar.
export const getRankInfo = (xp) => {
  const value = Number(xp) || 0;
  let found = RANKS[0];
  for (const r of RANKS) {
    if (value >= r.minXp) found = r;
  }
  return found;
};

// Kontrak lama: STRING nama rank (gate memakai startsWith('Shogun')).
export const getRankName = (xp) => getRankInfo(xp).key;

// Sudah menyentuh rank puncak?
export const isTopRank = (xp) => (Number(xp) || 0) >= TOP_RANK_XP;

// Info rank berikutnya (null kalau sudah di puncak).
export const getNextRank = (xp) => {
  const cur = getRankInfo(xp);
  return RANKS.find((r) => r.minXp > cur.minXp) || null;
};

// Progres di DALAM rank aktif: { current, next, pct, remaining, isMax }.
// pct 0..100 menuju rank berikutnya; di puncak → isMax true, pct 100.
export const rankProgress = (xp) => {
  const value = Number(xp) || 0;
  const cur = getRankInfo(value);
  const next = getNextRank(value);
  if (!next) {
    return { current: cur, next: null, pct: 100, remaining: 0, isMax: true };
  }
  const span = next.minXp - cur.minXp;
  const done = Math.max(0, value - cur.minXp);
  const pct = span > 0 ? Math.min(100, Math.round((done / span) * 100)) : 100;
  return { current: cur, next, pct, remaining: Math.max(0, next.minXp - value), isMax: false };
};

// Label singkat "Rank · XP" untuk dipakai chip kecil.
export const rankLabel = (xp) => `${getRankName(xp)} ${getRankInfo(xp).kanji}`;
