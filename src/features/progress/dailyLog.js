// ─────────────────────────────────────────────────────────────────────────────
// dailyLog.js — log akurasi per tanggal (bukan kumulatif).
//
// Kenapa ada: `totalAnswered`/`totalCorrect` cuma total seumur hidup, jadi tak
// bisa menjawab "minggu ini naik atau turun". Log ini disimpan 30 hari terakhir
// (payload ~1 KB) supaya localStorage tidak membengkak.
//
// Bentuk: { '2026-10-23': { a: 12, c: 9 }, ... }  a = dijawab, c = benar.
// MURNI (tanpa DOM/React) → diuji `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

export const DAILY_LOG_KEEP_DAYS = 30;

export const emptyDailyLog = () => ({});

// Tambah satu jawaban ke tanggal `day` (YYYY-MM-DD). Buang entri lebih tua
// dari KEEP hari supaya objek tidak tumbuh selamanya.
export const bumpDaily = (log, day, isCorrect, keep = DAILY_LOG_KEEP_DAYS) => {
  if (!day) return log || emptyDailyLog();
  const prev = log?.[day] || { a: 0, c: 0 };
  const next = { ...(log || {}), [day]: { a: prev.a + 1, c: prev.c + (isCorrect ? 1 : 0) } };

  const cutoff = new Date(`${day}T00:00:00`);
  cutoff.setDate(cutoff.getDate() - keep + 1);
  const min = cutoff.toISOString().slice(0, 10);

  for (const key of Object.keys(next)) {
    if (key < min) delete next[key];
  }
  return next;
};

// Deret akurasi untuk N hari terakhir (default 7), urut lama → baru.
// Hari tanpa jawaban → null (garis putus, bukan 0% yang menyesatkan).
export const accuracySeries = (log, days = 7, today = new Date()) => {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const row = log?.[key];
    out.push({
      day: key,
      answered: row?.a || 0,
      accuracy: row?.a ? Math.round((row.c / row.a) * 100) : null,
    });
  }
  return out;
};

export default bumpDaily;
