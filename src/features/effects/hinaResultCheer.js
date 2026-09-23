// ─────────────────────────────────────────────────────────────────────────────
// Sorakan Hina di layar HASIL KUIS (nilai bagus): teks + suara.
// Teks SENGAJA disamakan dengan klip suara yang dipakai, biar apa yang dibaca
// sama dengan apa yang didengar:
//   streak_2.mp3 = HINA_CHONO_すごいすごい！.mp3  →  「すごいすごい！」
// Modul PURE (tanpa React) → bisa dites `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

// Teks yang tampil (disamakan dengan suara).
export const HINA_CHEER_TEXT = 'すごいすごい！';
export const HINA_CHEER_ROMAJI = 'SUGOI SUGOI!';

// Klip suara yang dipakai: ambil dari voice pack Hina yang SUDAH ada (tanpa
// aset baru). streak_2 = 「すごいすごい！」 → cocok dengan teks di atas.
export const HINA_CHEER_SOUND = '/voices/hina/streak_2.mp3';

// Hanya untuk nilai bagus (>= 80% → grade A & S), selaras stiker hasil kuis.
export const HINA_CHEER_PASS_PCT = 80;

export const isHinaCheerScore = (score = 0, total = 0) => {
  if (!total || total <= 0) return false;
  return (score / total) * 100 >= HINA_CHEER_PASS_PCT;
};
