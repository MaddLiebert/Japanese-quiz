// ─────────────────────────────────────────────────────────────────────────────
// Misi Harian 日課 — logika MURNI (tanpa React, tanpa localStorage).
// 3 misi reset tiap tengah malam WAKTU LOKAL. Progres dihitung dari aktivitas
// nyata (jawaban benar + sesi kuis selesai) — TIDAK ada timer.
// Reward: EXP (dihitung ProgressContext) + Medaru. Dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

export const SIDE_SOURCES = ['writing', 'speaking', 'review', 'poem'];

export const QUEST_DEFS = [
  {
    id: 'rajin_menjawab', emblem: 'target',
    name: 'Rajin Menjawab', name_en: 'Answer Grinder',
    desc: '20 jawaban benar hari ini', desc_en: '20 correct answers today',
    event: 'correct', target: 20, xp: 80, medaru: 40,
  },
  {
    id: 'tuntas_sesi', emblem: 'trophy',
    name: 'Tuntas Sesi', name_en: 'Session Cleared',
    desc: 'Selesaikan 2 sesi kuis', desc_en: 'Finish 2 quiz sessions',
    event: 'session', target: 2, xp: 120, medaru: 60,
  },
  {
    id: 'jalan_samping', emblem: 'compass',
    name: 'Jalan Samping', name_en: 'Side Path',
    desc: '1 sesi mode sampingan (Menulis/Bicara/Ulang/Puisi)',
    desc_en: '1 side-mode session (Writing/Speaking/Review/Poem)',
    event: 'side', target: 1, xp: 150, medaru: 80,
  },
];

export const questDef = (id) => QUEST_DEFS.find((q) => q.id === id) || null;

// Tanggal lokal YYYY-MM-DD (sama semantik dengan getLocalDateString di ProgressContext).
export const dateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Bentuk awal state misi untuk satu hari.
export const emptyQuests = (today = dateKey()) => ({
  date: today,
  counters: { correct: 0, session: 0, side: 0 },
  claimed: [],
});

// Tanggal beda / state rusak → reset penuh. Tanggal sama → apa adanya (dinormalkan).
export const ensureToday = (quests, today = dateKey()) => {
  if (!quests || typeof quests !== 'object') return emptyQuests(today);
  if (quests.date !== today) return emptyQuests(today);
  const c = quests.counters || {};
  return {
    date: today,
    counters: {
      correct: Number(c.correct) || 0,
      session: Number(c.session) || 0,
      side: Number(c.side) || 0,
    },
    claimed: Array.isArray(quests.claimed) ? quests.claimed : [],
  };
};

// Satu event → naikkan counter relevan. Return objek BARU (immutable).
// kind: 'correct' | 'session' | 'side'.
export const bumpEvent = (quests, kind, today = dateKey()) => {
  const base = ensureToday(quests, today);
  if (!(kind in base.counters)) return base;
  return { ...base, counters: { ...base.counters, [kind]: base.counters[kind] + 1 } };
};

// Progres satu misi: { current (clamp target), target, done, claimed }.
export const questProgress = (quests, def, today = dateKey()) => {
  const base = ensureToday(quests, today);
  const raw = base.counters[def.event] || 0;
  return {
    current: Math.min(raw, def.target),
    target: def.target,
    done: raw >= def.target,
    claimed: base.claimed.includes(def.id),
  };
};

// Semua misi + status (untuk UI).
export const questBoard = (quests, today = dateKey()) =>
  QUEST_DEFS.map((def) => ({ ...def, ...questProgress(quests, def, today) }));

// Boleh diklaim? Selesai DAN belum pernah diklaim.
export const canClaim = (quests, id, today = dateKey()) => {
  const def = questDef(id);
  if (!def) return false;
  const p = questProgress(quests, def, today);
  return p.done && !p.claimed;
};

// Tandai sudah diklaim. Return objek BARU; id ganda diabaikan.
export const markClaimed = (quests, id, today = dateKey()) => {
  const base = ensureToday(quests, today);
  if (base.claimed.includes(id)) return base;
  return { ...base, claimed: [...base.claimed, id] };
};

// ── Tier MINGGUAN 週課 ───────────────────────────────────────────────────────
// Reset tiap Senin (minggu berjalan Senin→Minggu, waktu lokal). Counter dihitung
// dari aktivitas yang sama (jawaban benar + sesi kuis) tapi akumulatif seminggu.

export const WEEKLY_QUEST_DEFS = [
  {
    id: 'mingguan_tekun', emblem: 'calendar',
    name: 'Tekun Seminggu', name_en: 'Weekly Grind',
    desc: '100 jawaban benar minggu ini', desc_en: '100 correct answers this week',
    event: 'correct', target: 100, xp: 400, medaru: 250,
  },
  {
    id: 'mingguan_konsisten', emblem: 'refresh',
    name: 'Konsisten', name_en: 'Consistent',
    desc: '10 sesi kuis minggu ini', desc_en: '10 quiz sessions this week',
    event: 'session', target: 10, xp: 500, medaru: 300,
  },
];

export const weeklyQuestDef = (id) => WEEKLY_QUEST_DEFS.find((q) => q.id === id) || null;

// Senin dari minggu berjalan (awal minggu, waktu lokal). Return Date.
export const weekStart = (date = new Date()) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const shift = (d.getDay() + 6) % 7;   // Senin=0 … Minggu=6
  d.setDate(d.getDate() - shift);
  return d;
};

// Kunci minggu = tanggal Senin-nya (YYYY-MM-DD).
export const weekKey = (date = new Date()) => dateKey(weekStart(date));

export const emptyWeekly = (week = weekKey()) => ({
  week,
  counters: { correct: 0, session: 0 },
  claimed: [],
});

// Minggu beda / rusak → reset penuh. Minggu sama → apa adanya (dinormalkan).
export const ensureWeek = (weekly, week = weekKey()) => {
  if (!weekly || typeof weekly !== 'object') return emptyWeekly(week);
  if (weekly.week !== week) return emptyWeekly(week);
  const c = weekly.counters || {};
  return {
    week,
    counters: {
      correct: Number(c.correct) || 0,
      session: Number(c.session) || 0,
    },
    claimed: Array.isArray(weekly.claimed) ? weekly.claimed : [],
  };
};

export const weekBump = (weekly, kind, week = weekKey()) => {
  const base = ensureWeek(weekly, week);
  if (!(kind in base.counters)) return base;
  return { ...base, counters: { ...base.counters, [kind]: base.counters[kind] + 1 } };
};

export const weekProgress = (weekly, def, week = weekKey()) => {
  const base = ensureWeek(weekly, week);
  const raw = base.counters[def.event] || 0;
  return {
    current: Math.min(raw, def.target),
    target: def.target,
    done: raw >= def.target,
    claimed: base.claimed.includes(def.id),
  };
};

export const weekBoard = (weekly, week = weekKey()) =>
  WEEKLY_QUEST_DEFS.map((def) => ({ ...def, ...weekProgress(weekly, def, week) }));

export const canClaimWeek = (weekly, id, week = weekKey()) => {
  const def = weeklyQuestDef(id);
  if (!def) return false;
  const p = weekProgress(weekly, def, week);
  return p.done && !p.claimed;
};

export const markWeekClaimed = (weekly, id, week = weekKey()) => {
  const base = ensureWeek(weekly, week);
  if (base.claimed.includes(id)) return base;
  return { ...base, claimed: [...base.claimed, id] };
};
