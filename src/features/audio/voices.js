// ─────────────────────────────────────────────────────────────────────────────
// Registry VOICE per pack.
//   - files : daftar path mp3 (relatif ke public/). Dipilih acak tiap kali.
//   - synth : fallback Web Audio (tanpa file) — dipakai kalau files kosong.
// Menambah voice anime: taruh mp3 di public/voices/<packId>/correct_1.mp3, dst,
// lalu isi array files. Kalau kosong → otomatis jatuh ke synth (tidak error).
// ─────────────────────────────────────────────────────────────────────────────

export const VOICES = {
  // Voice sound dasar (taiko/gong) — dipakai pack Sumi Taiko (visual 'ink').
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

  // Pack #1 — suara Hina Chono (klip TTS).
  //   files    : klip VOICE Hina
  //              - correct: KOSONG → Hina tidak bunyi di jawaban benar biasa
  //              - wrong  : bunyi tiap kali salah (bareng wronganswer)
  //              - streak : bunyi tiap milestone (bareng rightanswer)
  //   overlays : base SFX jawaban yang SELALU bunyi bareng klip voice
  hina: {
    files: {
      correct: [],
      wrong:   ['/voices/hina/wrong_1.mp3',   '/voices/hina/wrong_2.mp3',
                '/voices/hina/wrong_3.mp3'],
      streak:  ['/voices/hina/streak_1.mp3',  '/voices/hina/streak_2.mp3',
                '/voices/hina/streak_3.mp3',  '/voices/hina/streak_4.mp3',
                '/voices/hina/streak_5.mp3',  '/voices/hina/streak_6.mp3'],
    },
    overlays: {
      correct: ['/voices/hina/rightanswer.mp3'],
      wrong:   ['/voices/hina/wronganswer.mp3'],
    },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
};

export const getVoice = (key) => VOICES[key] || VOICES.taiko;

// Pilih satu path acak dari daftar (atau null kalau kosong).
export const pickFile = (list, rng = Math.random) =>
  (Array.isArray(list) && list.length > 0)
    ? list[Math.floor(rng() * list.length)]
    : null;
