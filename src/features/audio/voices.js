// ─────────────────────────────────────────────────────────────────────────────
// Registry VOICE per pack.
//   - files : daftar path mp3 (relatif ke public/). Dipilih acak tiap kali.
//   - synth : fallback Web Audio (tanpa file) — dipakai kalau files kosong.
// Menambah voice anime: taruh mp3 di public/voices/<packId>/correct_1.mp3, dst,
// lalu isi array files. Kalau kosong → otomatis jatuh ke synth (tidak error).
// ─────────────────────────────────────────────────────────────────────────────

export const VOICES = {
  // Pack #1 — Kotodama Burst. Tanpa mp3 → synth gong/taiko.
  taiko: {
    files: { correct: [], wrong: [], streak: [] },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },

  // Pack dummy (pack_02..pack_06) — placeholder, pakai synth yang sama.
  dummy: {
    files: { correct: [], wrong: [], streak: [] },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },

  // Contoh voice anime (aktifkan saat aset siap):
  // anime_a: {
  //   files: {
  //     correct: ['/voices/pack_02/correct_1.mp3'],
  //     wrong:   ['/voices/pack_02/wrong_1.mp3'],
  //     streak:  ['/voices/pack_02/streak_1.mp3'],
  //   },
  //   synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  // },
};

export const getVoice = (key) => VOICES[key] || VOICES.taiko;

// Pilih satu path acak dari daftar (atau null kalau kosong).
export const pickFile = (list, rng = Math.random) =>
  (Array.isArray(list) && list.length > 0)
    ? list[Math.floor(rng() * list.length)]
    : null;
