// publicProfileView.js — logika murni tampilan Profil LENGKAP 訪問.
// Tanpa React/DOM & tanpa import JSON (dataset dilewatkan sebagai parameter)
// supaya bisa dites `node --test` (pola features/profile/subjectMastery.js).
//
// Server mengirim `full` (whitelist ketat) hanya bila pemilik menyalakan
// 「Profil Lengkap」. Modul ini mengubah bentuk data server → bentuk yang
// dipakai komponen (statistik dasar + radar penguasaan + sertifikat), dengan
// default aman supaya profil kosong tak pernah bikin crash.
import { buildSubjectMastery } from './subjectMastery.js';

// `full.itemStatus` = { id: 'mastered' | 'familiar' | 'learning' }.
// `buildSubjectMastery` mengharap { id: { status } } — jembatani di sini.
export const statusMapToItemProgress = (statusMap) => {
  const out = {};
  if (!statusMap || typeof statusMap !== 'object') return out;
  for (const [k, v] of Object.entries(statusMap)) {
    if (typeof v === 'string' && v) out[k] = { status: v };
  }
  return out;
};

// Radar 8 subjek dari peta status item (dataset JSON dilewatkan pemanggil).
export const buildPublicMastery = (statusMap, datasets = {}) =>
  buildSubjectMastery(statusMapToItemProgress(statusMap), datasets);

// Statistik dasar dari `full` — SEMUA angka dinormalkan ke Number (0 bila absen).
export const fullStats = (full) => {
  const f = full || {};
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    winRate: num(f.winRate),
    totalAnswered: num(f.totalAnswered),
    totalCorrect: num(f.totalCorrect),
    maxStreak: num(f.maxStreak),
    accuracy: num(f.accuracy),
    matchesPlayed: num(f.matchesPlayed),
  };
};

// Sertifikat N5 ada HANYA bila lulus (sama kontrak dengan N5Certificate).
export const hasCertificate = (full) => Boolean(full?.n5Exam?.passed);

// Daftar badge untuk ditampilkan: badge terpasang pemilik lebih dulu, lalu
// sisa cap yang terbuka (dibatasi agar tak meledak). `selectedBadges` kosong →
// pakai cap terbuka apa adanya.
export const publicBadgeList = (full, limit = 8) => {
  const f = full || {};
  const unlocked = Array.isArray(f.achievements) ? f.achievements : [];
  const selected = Array.isArray(f.selectedBadges) ? f.selectedBadges : [];
  const ordered = [...selected.filter((b) => unlocked.includes(b)), ...unlocked.filter((b) => !selected.includes(b))];
  return ordered.slice(0, Math.max(0, limit));
};

// Profil penuh tersedia? (server kirim kolom `full_data` non-null). Nama kolom
// sengaja `full_data` karena `full` reserved keyword di PostgreSQL.
export const hasFullProfile = (row) => Boolean(row && row.full_data && typeof row.full_data === 'object');
