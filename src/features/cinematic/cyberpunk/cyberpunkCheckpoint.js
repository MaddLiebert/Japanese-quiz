// ─────────────────────────────────────────────────────────────────────────────
// cyberpunkCheckpoint.js — 終 「owari」: Gerbang Terakhir 電脳.
//
// Berbeda dari checkpoint era lain (Edo 箱根 / Meiji 国会 / Shōwa 卒業 / 多元
// 最終回) yang = UJIAN N5 apa adanya, 終 = ujian CAMPURAN SEMUA ERA, versi
// TERSULIT. Isi app 100% N5 (kana + kotoba + kanji + grammar + mondai), jadi
// "campur semua era" = mesin N5 yang sama (`features/n5exam/`), tapi dijalankan
// dengan ATURAN LEBIH KERAS + AMBANG LULUS NAIK.
//
// 4 aturan "tersulit" (§11.2) — DATA murni supaya bisa dites & ditampilkan:
//   ① mode dingin   — tanpa benar/salah sampai selesai (cold)
//   ② ambang naik   — passing grade N5 dinaikkan (raised)
//   ③ sekali jalan  — tanpa retry (noRetry)
//   ④ waktu ketat   — durasi dipotong (tightTime)
//
// Gerbang buka: Lv 300 (era 電脳) DAN sudah lulus 多元 最終回 (n5Exam.passed).
// Lulus → 完 (tamat). Gagal → tetap 終 (malam belum berakhir). Hadiah: N5Certificate.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Lihat PRD docs/tema/cyberpunk.md §11.
// ─────────────────────────────────────────────────────────────────────────────
import { CYBERPUNK_CHECKPOINT_STOP } from './cyberpunkStops.js';
import { N5_SECTIONS, N5_SECTION_ORDER, LKR_MAX, LISTENING_MAX, scaleSection } from '../../n5exam/n5exam.js';

// Perhentian gerbang 終 = 扉 (peta 電脳, titik ke-3).
export { CYBERPUNK_CHECKPOINT_STOP };

// Halaman/route checkpoint 終 (halaman gerbang sendiri, bukan langsung N5).
export const CYBERPUNK_CHECKPOINT_ROUTE = '/owari-checkpoint';

// Gerbang era: Lv 300 (sama dengan gerbang masuk era 電脳).
export const CYBERPUNK_CHECKPOINT_MIN_LEVEL = 300;

// Aturan "tersulit" (§11.2) — 4 sumbu, semuanya ON.
export const OWARI_RULES = {
  cold: true,        // ① mode dingin: tidak ada benar/salah sampai selesai
  noRetry: true,     // ③ sekali jalan: tidak boleh mengulang
  tightTime: 0.7,    // ④ waktu ketat: 70% durasi N5 (90 mnt → 63 mnt)
  raised: { total: 110, lkr: 52, listening: 26 }, // ② ambang lulus NAIK
};

// Ambang lulus resmi N5 (untuk pembanding di halaman: "naik dari X ke Y").
export const N5_BASE_PASS = { total: 80, lkr: 38, listening: 19 };

// Ambang lulus 終 (dinaikkan) — diekspor supaya halaman tak perlu tahu detail.
export const OWARI_PASS_TOTAL = OWARI_RULES.raised.total;
export const OWARI_PASS_LKR = OWARI_RULES.raised.lkr;
export const OWARI_PASS_LISTENING = OWARI_RULES.raised.listening;

// Durasi total 終 = durasi N5 × faktor waktu ketat (dibulatkan ke menit).
export const N5_TOTAL_MINUTES = N5_SECTION_ORDER.reduce((s, k) => s + N5_SECTIONS[k].minutes, 0);
export const OWARI_TOTAL_MINUTES = Math.round(N5_TOTAL_MINUTES * OWARI_RULES.tightTime);

// Durasi per-seksi 終 (memakai faktor yang sama; minimal 1 menit).
export const owariSectionMinutes = (sectionKey) =>
  Math.max(1, Math.round(N5_SECTIONS[sectionKey].minutes * OWARI_RULES.tightTime));

// Gerbang buka: Lv 300 DAN sudah lulus 多元 最終回 (n5Exam.passed).
export const isCyberpunkCheckpointUnlocked = (level, animeCheckpointPassed) =>
  (Number(level) || 0) >= CYBERPUNK_CHECKPOINT_MIN_LEVEL && animeCheckpointPassed === true;

// Verdict kelulusan 終 dari hasil ujian mentah — memakai AMBANG NAIK, bukan N5.
// Membungkus penskalaan yang sama dengan N5 (proporsional) → adil, hanya ambang
// yang lebih tinggi. Gagal satu seksi = gagal total (aturan N5 tetap berlaku).
export const gradeOwariCheckpoint = ({ lkrRaw, lkrTotal, listeningRaw, listeningTotal }) => {
  const lkrScaled = scaleSection(lkrRaw, lkrTotal, LKR_MAX);
  const listeningScaled = scaleSection(listeningRaw, listeningTotal, LISTENING_MAX);
  const total = lkrScaled + listeningScaled;
  const lkrOk = lkrScaled >= OWARI_PASS_LKR;
  const listeningOk = listeningScaled >= OWARI_PASS_LISTENING;
  const totalOk = total >= OWARI_PASS_TOTAL;
  return {
    lkrScaled, listeningScaled, total,
    lkrOk, listeningOk, totalOk,
    passed: totalOk && lkrOk && listeningOk,
  };
};

// Momen akhir: lulus → 完 (tamat), gagal → 終 (tetap malam).
export const OWARI_END = '完';
export const OWARI_STAY = '終';

// Hadiah kelulusan 終 (dari fitur N5 yang sudah ada).
export const OWARI_REWARD = 'N5Certificate';

// Validasi ringan untuk tes: checkpoint harus 扉, route/ambang/aturan konsisten.
export const validateCyberpunkCheckpoint = () => {
  const errors = [];
  const s = CYBERPUNK_CHECKPOINT_STOP;
  if (!s) errors.push('checkpoint stop tidak ada');
  if (s && s.feature !== 'checkpoint') errors.push('stop 終 bukan feature:checkpoint');
  if (s && s.id !== 'tobira') errors.push(`checkpoint stop harus 扉 (tobira), dapat ${s && s.id}`);
  if (s && s.last) errors.push('checkpoint 終 TIDAK boleh ditandai last (終 ada di tengah peta)');
  if (CYBERPUNK_CHECKPOINT_ROUTE !== '/owari-checkpoint') errors.push('route checkpoint harus /owari-checkpoint');
  if (OWARI_RULES.tightTime >= 1) errors.push('waktu ketat harus < 1 (durasi dipotong)');
  if (OWARI_PASS_TOTAL <= N5_BASE_PASS.total) errors.push('ambang total 終 harus NAIK dari N5');
  if (OWARI_PASS_LKR <= N5_BASE_PASS.lkr) errors.push('ambang LKR 終 harus NAIK dari N5');
  if (OWARI_PASS_LISTENING <= N5_BASE_PASS.listening) errors.push('ambang listening 終 harus NAIK dari N5');
  if (OWARI_TOTAL_MINUTES >= N5_TOTAL_MINUTES) errors.push('durasi 終 harus lebih pendek dari N5');
  return errors;
};
