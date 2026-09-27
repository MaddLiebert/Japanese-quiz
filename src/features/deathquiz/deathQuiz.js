// ─────────────────────────────────────────────────────────────────────────────
// Death Quiz 死闘 — logika murni (tanpa React, tanpa import JSON).
// Mode endless eksklusif rank Shogun: semua konten kuis pilihan-ganda,
// 3 nyawa, timer 7 dtk, penalti XP saat mati, revive pakai kabel jumper.
// Semua konstanta di bawah ini adalah knob tuning — ubah di sini saja.
// ─────────────────────────────────────────────────────────────────────────────

import { shuffle } from '../quiz/questionBuilder.js';

export const DEATH_START_LIVES = 3;      // 命 awal tiap run
export const DEATH_TIMER_S = 7;          // timer per soal (sama dengan mode Hard kuis lain)
export const DEATH_XP_PER_CORRECT = 40;  // XP tiap jawaban benar (sebelum bonus streak)
export const DEATH_XP_PENALTY = 300;     // XP hilang saat MATI (bukan saat keluar sukarela)
export const DEATH_UNLOCK_XP = 20000;    // ambang rank Shogun (untuk progress bar layar terkunci)

// ── Kompensasi medaru (gold) ────────────────────────────────────────────────
// Mode ini paling berisiko (−300 XP saat mati), jadi bukan cuma mengurangi:
// tiap run yang berakhir membayar medaru. Skema escalating — makin jauh makin
// besar, biar endless-nya berasa diganjar.
export const DEATH_MEDARU_PER_CORRECT = 5;      // medaru dasar tiap jawaban benar
export const DEATH_MEDARU_MILESTONE = 10;       // tiap 10 benar → bonus kelipatan
export const DEATH_MEDARU_MILESTONE_BONUS = 25; // 10→+25, 20→+50, 30→+75, …
export const DEATH_MEDARU_MIN_SCORE = 5;        // skor minimum agar dapat medaru (anti-farm)

// Gate unlock dari RANK STRING (single source of truth = getRank di ProgressContext).
// Bukan ambang XP kedua, supaya tidak bisa drift dari sistem rank.
export const isDeathQuizUnlocked = (rank) =>
  typeof rank === 'string' && rank.startsWith('Shogun');

// Semua konten kuis pilihan-ganda: hiragana 104 + katakana 46 + kotoba 876
// + grammar 53 + kanji 86 = 1.165 soal. Mondai (audio 30-60 dtk) sengaja TIDAK
// ikut — format audionya tidak cocok dengan timer 7 dtk.
export const allQuizItems = (datasets) => [
  ...datasets.hiragana,
  ...datasets.katakana,
  ...datasets.kotoba,
  ...datasets.grammar,
  ...datasets.kanji,
];

// Isi ulang queue: salinan baru yang di-shuffle (input tidak diubah).
export const refillDeathQueue = (items, rng = Math.random) => shuffle(items, rng);

// Ambil soal berikutnya dari queue. Queue habis → refill otomatis (endless).
// `lastId` mencegah soal yang sama muncul dua kali berurutan — termasuk tepat
// di batas refill: kalau item pertama queue baru sama dengan yang barusan,
// tukar dengan posisi lain.
// State: { queue, lastId } — murni, mengembalikan state baru + `item`.
export const drawNextDeathItem = (state, items, rng = Math.random) => {
  let queue = state.queue;
  const lastId = state.lastId ?? null;

  if (!queue || queue.length === 0) {
    queue = refillDeathQueue(items, rng);
  }

  // Guard duplikat berurutan (best-effort: hanya kalau ada kandidat lain).
  if (queue.length > 1 && queue[0].id === lastId) {
    const swapAt = 1 + Math.floor(rng() * (queue.length - 1));
    const copy = [...queue];
    [copy[0], copy[swapAt]] = [copy[swapAt], copy[0]];
    queue = copy;
  }

  const [item, ...rest] = queue;
  return { item, queue: rest, lastId: item.id };
};

// Penalti XP saat mati: kurangi, clamp di 0, input aneh → 0.
export const applyDeathPenalty = (xp) => {
  const base = Number(xp);
  if (!Number.isFinite(base) || base <= 0) return 0;
  return Math.max(0, base - DEATH_XP_PENALTY);
};

// Hadiah medaru akhir run (skema escalating).
//   base   = skor × 5
//   bonus  = 25 × floor(skor / 10)  → 10→25, 20→50, 30→75, …
// Skor < DEATH_MEDARU_MIN_SCORE → 0 (anti-farm: jawab 1 soal lalu keluar = 0).
// Input aneh (NaN/negatif/undefined) → 0.
export const deathMedaruReward = (score) => {
  const s = Math.floor(Number(score));
  if (!Number.isFinite(s) || s < DEATH_MEDARU_MIN_SCORE) return 0;
  const base = s * DEATH_MEDARU_PER_CORRECT;
  const bonus = DEATH_MEDARU_MILESTONE_BONUS * Math.floor(s / DEATH_MEDARU_MILESTONE);
  return base + bonus;
};
