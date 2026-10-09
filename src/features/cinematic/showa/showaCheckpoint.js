// ─────────────────────────────────────────────────────────────────────────────
// showaCheckpoint.js — 卒業: ujian gerbang naik era Shōwa (N5).
//
// Perhentian terakhir peta Shōwa (showaStops.js `feature:'checkpoint'`). Fokus
// PRD §11: Shōwa = era ujian → checkpoint = **UJIAN N5 yang sudah ada**
// (`features/n5exam/`), bukan kuis kecil seperti Edo/Meiji. LULUS N5 = pemain
// boleh "naik era" (→ Anime Multiverse, gerbang Lv 150).
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Lihat PRD docs/tema/showa.md §7/§11/§12 (T9).
//
// Desain: modul ini = GERBANG/jembatan tipis ke mesin N5 — tidak menduplikasi
// logika ujian. Ia menjawab 3 hal untuk halaman & test:
//   1. Apa perhentian checkpoint-nya (dari peta).
//   2. Syarat buka gerbang (memakai isN5ExamUnlocked yang sudah ada).
//   3. Verdict kelulusan dari hasil ujian (memakai evaluatePass yang ada).
// ─────────────────────────────────────────────────────────────────────────────
import { SHOWA_LAST_STOP } from './showaStops.js';
import {
  isN5ExamUnlocked, N5_EXAM_MIN_MASTERED_KANJI, evaluatePass,
  N5_PASS_TOTAL, N5_PASS_LKR, N5_PASS_LISTENING,
} from '../../n5exam/n5exam.js';

// Perhentian checkpoint Shōwa = 卒業 (perhentian terakhir peta).
export const SHOWA_CHECKPOINT_STOP = SHOWA_LAST_STOP;

// Halaman/route ujian (memakai fitur N5 yang sudah ada).
export const SHOWA_CHECKPOINT_ROUTE = '/n5-exam';

// Gerbang buka: rank Shogun + ≥30 kanji hafal (aturan N5 yang sudah ada).
export const isShowaCheckpointUnlocked = (rank, masteredKanjiCount) =>
  isN5ExamUnlocked(rank, masteredKanjiCount);

// Verdict kelulusan dari hasil ujian mentah (seksi A+B & listening).
// Membungkus evaluatePass supaya halaman checkpoint punya SATU pintu uji.
export const gradeShowaCheckpoint = ({ lkrRaw, lkrTotal, listeningRaw, listeningTotal }) =>
  evaluatePass({ lkrRaw, lkrTotal, listeningRaw, listeningTotal });

// Ambang lulus N5 (diekspor ulang → halaman checkpoint tak perlu tahu detail).
export const SHOWA_CHECKPOINT_PASS = N5_PASS_TOTAL;
export const SHOWA_CHECKPOINT_PASS_LKR = N5_PASS_LKR;
export const SHOWA_CHECKPOINT_PASS_LISTENING = N5_PASS_LISTENING;
export const SHOWA_CHECKPOINT_MIN_KANJI = N5_EXAM_MIN_MASTERED_KANJI;

// 蛍の光 (Hotaru no Hikari) — lagu kelulusan Shōwa (PRD §20). Dipakai saat lulus.
export const SHOWA_CHECKPOINT_SONG = '蛍の光';

// Validasi ringan untuk tes: checkpoint harus perhentian 卒業 terakhir.
export const validateShowaCheckpoint = () => {
  const errors = [];
  const s = SHOWA_CHECKPOINT_STOP;
  if (!s) errors.push('checkpoint stop tidak ada');
  if (s && s.feature !== 'checkpoint') errors.push('stop terakhir bukan feature:checkpoint');
  if (s && s.id !== 'sotsugyo') errors.push(`checkpoint stop harus 卒業 (sotsugyo), dapat ${s && s.id}`);
  if (s && !s.last) errors.push('checkpoint harus ditandai last:true');
  if (SHOWA_CHECKPOINT_ROUTE !== '/n5-exam') errors.push('route checkpoint harus /n5-exam (fitur N5)');
  return errors;
};
