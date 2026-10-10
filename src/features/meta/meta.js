// ─────────────────────────────────────────────────────────────────────────────
// A8 メタ / 4th-wall (App "sadar" ini anime) — MURNI: tanpa React, tanpa DOM.
// Pola companion/questions.js. Di era pop, app sadar dirinya seperti anime:
// 「つづく」, narrator komentar meta, "episode berikutnya". Muncul MAKS 1×/sesi.
// Spec: docs/tema/anime-mekanik.md §A8.

// trigger(stats) = apakah momen ini layak muncul. Data-driven (mudah ditambah).
export const META_MOMENTS = [
  {
    id: 'tsuzuku',
    trigger: (s) => !!s.sessionEnd && (Number(s.answered) || 0) >= 10,
    jp: 'つづく', id_text: 'Bersambung…',
  },
  {
    id: 'episode',
    trigger: (s) => (Number(s.dayStreak) || 0) > 0,
    jp: '第{n}話', id_text: 'Episode {n}',
  },
  {
    id: 'narrator',
    trigger: (s) => (Number(s.streak) || 0) >= 20,
    jp: 'ここで、彼は気づいた。', id_text: 'Di sini, ia menyadari.',
  },
];

// Pilih 1 momen meta yang layak & belum pernah tampil. Tak ada → null.
export const pickMeta = (stats = {}, seenIds = []) =>
  META_MOMENTS.find((m) => m.trigger(stats || {}) && !seenIds.includes(m.id)) || null;

// Isi placeholder {n} (mis. 第{n}話 → 第3話) dari stats.dayStreak. Murni.
export const fillMeta = (moment, stats = {}) => {
  if (!moment) return null;
  const n = Number(stats?.dayStreak) || 1;
  return {
    ...moment,
    jp: (moment.jp || '').replace('{n}', String(n)),
    id_text: (moment.id_text || '').replace('{n}', String(n)),
  };
};

export default pickMeta;
