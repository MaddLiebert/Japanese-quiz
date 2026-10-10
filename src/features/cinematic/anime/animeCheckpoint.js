// ─────────────────────────────────────────────────────────────────────────────
// animeCheckpoint.js — 最終回: gerbang naik era 多元 (sintesis register pop).
//
// Perhentian terakhir peta 多元 (animeStops.js `feature:'checkpoint'`). PRD
// docs/tema/anime.md §7: 最終回 = episode terakhir → lulus = naik era ke
// 電脳 Cyberpunk (Lv 300). Mengikuti pola Shōwa (showaCheckpoint.js): modul ini
// = GERBANG/jembatan tipis ke mesin ujian N5 yang sudah ada (`features/n5exam/`),
// bukan ujian baru. Ia menjawab: (1) perhentian checkpoint, (2) syarat buka,
// (3) verdict lulus.
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────
import { ANIME_LAST_STOP } from './animeStops.js';
import {
  isN5ExamUnlocked, N5_EXAM_MIN_MASTERED_KANJI, evaluatePass,
  N5_PASS_TOTAL, N5_PASS_LKR, N5_PASS_LISTENING,
} from '../../n5exam/n5exam.js';

// Perhentian checkpoint 多元 = 最終回 (perhentian terakhir peta).
export const ANIME_CHECKPOINT_STOP = ANIME_LAST_STOP;

// Halaman/route ujian (memakai fitur N5 yang sudah ada).
export const ANIME_CHECKPOINT_ROUTE = '/n5-exam';

// Gerbang buka: rank Shogun + ≥30 kanji hafal (aturan N5 yang sudah ada).
export const isAnimeCheckpointUnlocked = (rank, masteredKanjiCount) =>
  isN5ExamUnlocked(rank, masteredKanjiCount);

// Verdict kelulusan dari hasil ujian mentah (seksi A+B & listening).
export const gradeAnimeCheckpoint = ({ lkrRaw, lkrTotal, listeningRaw, listeningTotal }) =>
  evaluatePass({ lkrRaw, lkrTotal, listeningRaw, listeningTotal });

// Ambang lulus N5 (diekspor ulang → halaman checkpoint tak perlu tahu detail).
export const ANIME_CHECKPOINT_PASS = N5_PASS_TOTAL;
export const ANIME_CHECKPOINT_PASS_LKR = N5_PASS_LKR;
export const ANIME_CHECKPOINT_PASS_LISTENING = N5_PASS_LISTENING;
export const ANIME_CHECKPOINT_MIN_KANJI = N5_EXAM_MIN_MASTERED_KANJI;

// 「つづく」→「完」 — momen akhir episode (PRD §7 最終回). Dipakai saat lulus.
export const ANIME_CHECKPOINT_END = '完';
export const ANIME_CHECKPOINT_CONTINUED = 'つづく';

// Validasi ringan untuk tes: checkpoint harus perhentian 最終回 terakhir.
export const validateAnimeCheckpoint = () => {
  const errors = [];
  const s = ANIME_CHECKPOINT_STOP;
  if (!s) errors.push('checkpoint stop tidak ada');
  if (s && s.feature !== 'checkpoint') errors.push('stop terakhir bukan feature:checkpoint');
  if (s && s.id !== 'saishukai') errors.push(`checkpoint stop harus 最終回 (saishukai), dapat ${s && s.id}`);
  if (s && !s.last) errors.push('checkpoint harus ditandai last:true');
  if (ANIME_CHECKPOINT_ROUTE !== '/n5-exam') errors.push('route checkpoint harus /n5-exam (fitur N5)');
  return errors;
};
