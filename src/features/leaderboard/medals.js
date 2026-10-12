// medals.js — util MURNI (tanpa Supabase/DOM) supaya bisa dites via node --test.
// Peringkat (0-based) → medali untuk 3 teratas, sisanya nomor urut.
export const rankMedal = (i) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`);

export default rankMedal;
