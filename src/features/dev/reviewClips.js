// ─────────────────────────────────────────────────────────────────────────────
// DEV-ONLY — SAFE TO REMOVE (bareng DevPanel).
// Helper murni untuk panel review di Settings: daftar klip yang bisa diputar
// untuk tiap jenis umpan balik + rotasi kursor (klik berulang = klip berikutnya,
// bukan acak — supaya reviewer bisa mendengar SEMUA klip secara berurutan).
// ─────────────────────────────────────────────────────────────────────────────

// Daftar SEMUA klip untuk satu jenis feedback pada satu voice.
// Urutan = urutan putar di kuis: overlay SFX dulu, lalu klip voice.
// Kasus khusus Gojo 'correct': klip teknik (clips) — pipeline kuis memutar
// teknik secara deterministik, jadi review pun menampilkan daftar teknik.
export const reviewClips = (voice, kind) => {
  const out = [];
  const ov = voice?.overlays?.[kind];
  if (Array.isArray(ov)) out.push(...ov);
  const files = voice?.files?.[kind];
  if (Array.isArray(files) && files.length > 0) {
    out.push(...files);
  } else if (kind === 'correct' && Array.isArray(voice?.clips) && voice.clips.length > 0) {
    out.push(...voice.clips);
  }
  return out.filter(Boolean);
};

// Kursor rotasi: klik berikutnya → klip berikutnya (wrap-around).
// cursor kotor (NaN/negatif/pecahan) → aman, index tetap valid.
export const nextClip = (list, cursor = 0) => {
  if (!Array.isArray(list) || list.length === 0) return { path: null, cursor: 0, index: -1 };
  const cur = Number.isFinite(cursor) ? Math.abs(Math.floor(cursor)) : 0;
  const index = cur % list.length;
  return { path: list[index], cursor: cur + 1, index };
};

