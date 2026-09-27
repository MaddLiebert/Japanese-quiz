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

  // Pack #7 — Gojo Satoru. Aset user di public/voices/gojo/:
  //   wrong : 4 klip meme "gojo kalah" (dipilih acak tiap jawaban salah)
  //   clips : klip jalur khusus — ao/aka (teknik, diputar deterministik oleh
  //           playGojoTechnique) + ryoiki tenkai (cast domain). Ikut di-preload.
  //   correct/streak: KOSONG — benar biasa = suara teknik (ao/aka) yang dipilih
  //           deterministik, bukan acak; 茈 belum punya klip (GIF yang bicara).
  gojo: {
    files: {
      correct: [],
      wrong: [
        '/voices/gojo/Gojo kalah 1.mp3',
        '/voices/gojo/gojo kalah2.mp3',
        '/voices/gojo/gojo kalah 3.mp3',
        '/voices/gojo/gojo kalah 4.mp3',
      ],
      streak: [],
    },
    clips: ['/voices/gojo/ao.mp3', '/voices/gojo/aka.mp3', '/voices/gojo/Murasaki.mp3', '/voices/gojo/ryoiki tenkai.mp3'],
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
};

export const getVoice = (key) => VOICES[key] || VOICES.taiko;

// Pilih satu path acak dari daftar (atau null kalau kosong).
export const pickFile = (list, rng = Math.random) =>
  (Array.isArray(list) && list.length > 0)
    ? list[Math.floor(rng() * list.length)]
    : null;
