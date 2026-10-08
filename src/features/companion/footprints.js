// footprints.js — M12 jejak Nacht/Saku (app "memperhatikan"). ★★★
// Modul MURNI (tanpa React/DOM). Pakai timestamp & streak NYATA, bukan acak.
// Muncul maks 1×/sesi. Narrator Meiji = Saku.
// Spec: docs/tema/meiji-mekanik.md §M12.

// Aturan dievaluasi BERURUTAN; yang pertama cocok & belum tampil dipilih.
export const FOOTPRINT_RULES = [
  { id: 'lateNight', when: (s) => s.lastHour >= 1 && s.lastHour < 5,
    jp: '昨日、夜ふかししたね。', id_text: 'Kemarin begadang ya.' },
  { id: 'comeback', when: (s) => (s.gapDays ?? 0) >= 3,
    jp: '…おかえり。', id_text: '…Selamat kembali.' },
  { id: 'streak', when: (s) => (s.streak ?? 0) >= 30,
    jp: 'よく続いてるね。疲れてない？', id_text: 'Rajin sekali. Tidak lelah?' },
];

// Rule pertama yang cocok & belum tampil. null kalau tidak ada.
export const pickFootprint = (stats = {}, seenIds = []) => {
  const seen = Array.isArray(seenIds) ? seenIds : [];
  for (const rule of FOOTPRINT_RULES) {
    if (seen.includes(rule.id)) continue;
    try {
      if (rule.when(stats)) return { id: rule.id, jp: rule.jp, id_text: rule.id_text };
    } catch {
      // stats aneh → lewati rule ini, jangan crash.
    }
  }
  return null;
};

export const markSeen = (seenIds, id) => {
  const seen = Array.isArray(seenIds) ? seenIds : [];
  return seen.includes(id) ? seen : [...seen, id];
};

// Bangun stats jejak dari data progress NYATA (bukan acak).
// lastHour = jam saat ini (0..23) · gapDays = selisih hari sejak lastActiveDate.
// nowMs/prevDateStr dalam bentuk string 'YYYY-MM-DD' atau ms. Aman kalau kosong.
const MS_PER_DAY = 86400000;
const toDayIndex = (v) => {
  if (v == null) return null;
  if (typeof v === 'number') return Math.floor(v / MS_PER_DAY);
  const s = String(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / MS_PER_DAY);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : Math.floor(d.getTime() / MS_PER_DAY);
};

export const companionStats = (progress = {}, now = {}) => {
  const nowMs = Number.isFinite(now.nowMs) ? now.nowMs : Date.now();
  const lastHour = Number.isFinite(now.hour) ? now.hour : new Date(nowMs).getHours();
  const todayIdx = toDayIndex(now.todayStr) ?? Math.floor(nowMs / MS_PER_DAY);
  const prevIdx = toDayIndex(progress.lastActiveDate);
  const gapDays = prevIdx == null ? 0 : Math.max(0, todayIdx - prevIdx);
  return {
    lastHour,
    gapDays,
    streak: Number(progress.streak) || 0,
    daysActive: Number(progress.daysActive) || 0,
  };
};

export default FOOTPRINT_RULES;
