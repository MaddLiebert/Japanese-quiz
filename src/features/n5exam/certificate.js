// ─────────────────────────────────────────────────────────────────────────────
// Sertifikat & badge kelulusan Ujian N5 模擬試験 — logika murni.
// Tanpa React, tanpa import JSON. Menyimpan rekor terbaik ujian dan menurunkan
// badge + nomor sertifikat (fiktif, untuk dalam aplikasi saja).
// ─────────────────────────────────────────────────────────────────────────────

export const N5_YUUSHUU_MIN = 140; // ambang "優良" (distinction)
export const N5_KANPEKI_TOTAL = 180; // "満点" (sempurna)

// Rekor ujian default (dibackfill ke progress lama).
export const emptyExamRecord = () => ({
  attempts: 0,
  bestTotal: 0,
  bestLkr: 0,
  bestListening: 0,
  passed: false,
  passedAt: null,
  lastTotal: 0,
  lastLkr: 0,
  lastListening: 0,
  lastPassed: false,
});

// Gabungkan hasil ujian terbaru ke rekor. `best*` = nilai tertinggi sepanjang masa;
// `passed` lengket (sekali lulus tetap lulus, sertifikat tidak dicabut).
export const mergeExamRecord = (prev, result = {}) => {
  const p = prev || emptyExamRecord();
  const num = (v) => (Number.isFinite(v) ? v : 0);
  const justPassed = !!result.passed && !p.passed;
  return {
    attempts: num(p.attempts) + 1,
    bestTotal: Math.max(num(p.bestTotal), num(result.total)),
    bestLkr: Math.max(num(p.bestLkr), num(result.lkrScaled)),
    bestListening: Math.max(num(p.bestListening), num(result.listeningScaled)),
    passed: !!p.passed || !!result.passed,
    passedAt: justPassed ? (result.at || null) : (p.passedAt || null),
    lastTotal: num(result.total),
    lastLkr: num(result.lkrScaled),
    lastListening: num(result.listeningScaled),
    lastPassed: !!result.passed,
  };
};

// Badge yang berhak didapat dari sebuah rekor (urut dari yang termudah).
// Semua badge lulus butuh `passed` — 優良/満点 mustahil tanpa lulus.
export const n5BadgesFor = (record) => {
  if (!record || !record.passed) return [];
  const best = Number(record.bestTotal) || 0;
  const out = ['n5_gokaku'];
  if (best >= N5_YUUSHUU_MIN) out.push('n5_yuushuu');
  if (best >= N5_KANPEKI_TOTAL) out.push('n5_kanpeki');
  return out;
};

// Sebutan kelulusan (dipakai di sertifikat & badge).
export const gradeLabel = (record, lang = 'id') => {
  const best = Number(record?.bestTotal) || 0;
  if (record?.passed && best >= N5_KANPEKI_TOTAL) return lang === 'id' ? '満点 (Sempurna)' : '満点 (Perfect)';
  if (record?.passed && best >= N5_YUUSHUU_MIN) return lang === 'id' ? '優良 (Distingsi)' : '優良 (Distinction)';
  if (record?.passed) return lang === 'id' ? '合格 (Lulus)' : '合格 (Pass)';
  return lang === 'id' ? '不合格 (Belum Lulus)' : '不合格 (Not Passed)';
};

// Hash djb2 → 6 digit, supaya nomor sertifikat stabil & deterministik.
const hash6 = (str) => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (((h << 5) + h) + str.charCodeAt(i)) >>> 0;
  return String(h % 1000000).padStart(6, '0');
};

// Nomor sertifikat fiktif: N5-<tahun>-<6 digit>. Kosong bila belum lulus.
export const certificateNo = (record, username = '') => {
  if (!record?.passed) return '';
  const year = String(record.passedAt || '').slice(0, 4) || '0000';
  return `N5-${year}-${hash6(`${username}|${record.bestTotal}|${record.passedAt}`)}`;
};
