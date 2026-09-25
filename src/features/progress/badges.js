// ─────────────────────────────────────────────────────────────────────────────
// Pemilih badge untuk tampilan ringkas (Home).
// Aturan produk: maksimal 4 cap tampil; kalau user pernah memilih (Profile →
// Edit Badges) pakai pilihan itu, kalau belum pakai 4 pertama yang terbuka.
// ─────────────────────────────────────────────────────────────────────────────

export const BADGE_DISPLAY_MAX = 4;

export const pickBadges = (achievements, selected, max = BADGE_DISPLAY_MAX) => {
  const all = Array.isArray(achievements) ? achievements : [];
  const chosen = Array.isArray(selected) ? selected : [];
  const source = chosen.length > 0 ? chosen : all;
  return source.slice(0, Math.max(0, max));
};

// Buang ID yang tidak punya metadata (badge hantu legacy: '100_xp', 'clean_up',
// 'speed_demon'). Dipakai untuk hitungan "+N cap lain" dan render, supaya angka
// yang ditampilkan selalu sama dengan badge yang benar-benar bisa dilihat.
export const knownBadges = (achievements, meta) => {
  const all = Array.isArray(achievements) ? achievements : [];
  if (!meta || typeof meta !== 'object') return [];
  return all.filter((id) => meta[id]);
};
