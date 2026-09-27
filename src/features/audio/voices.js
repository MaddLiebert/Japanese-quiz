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

  // ── Seri Jujutsu Kaisen (pack_08..pack_14) — placeholder DUMMY ──────────────
  // files kosong → otomatis fallback synth (gong/thud), perilakunya sama
  // seperti voice 'dummy'. Klip mp3 diisi bertahap oleh task "VP <karakter>".
  // VP Nobara Kugisaki (pack_08) — TTS generik, setelan di docs/voice-pack-2-jujutsu.md.
  nobara: {
    files: {
      correct: ['/voices/nobara/correct_1.mp3', '/voices/nobara/correct_2.mp3', '/voices/nobara/correct_3.mp3'],
      wrong:   ['/voices/nobara/wrong_1.mp3',   '/voices/nobara/wrong_2.mp3',   '/voices/nobara/wrong_3.mp3'],
      streak:  ['/voices/nobara/streak_1.mp3',  '/voices/nobara/streak_2.mp3',  '/voices/nobara/streak_3.mp3'],
    },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
  // VP Yuji Itadori (pack_09) — TTS generik, setelan di docs/voice-pack-2-jujutsu.md.
  yuji: {
    files: {
      correct: ['/voices/yuji/correct_1.mp3', '/voices/yuji/correct_2.mp3', '/voices/yuji/correct_3.mp3'],
      wrong:   ['/voices/yuji/wrong_1.mp3',   '/voices/yuji/wrong_2.mp3',   '/voices/yuji/wrong_3.mp3'],
      streak:  ['/voices/yuji/streak_1.mp3',  '/voices/yuji/streak_2.mp3',  '/voices/yuji/streak_3.mp3'],
    },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
  // VP Megumi Fushiguro (pack_10) — TTS generik, setelan di docs/voice-pack-2-jujutsu.md.
  megumi: {
    files: {
      correct: ['/voices/megumi/correct_1.mp3', '/voices/megumi/correct_2.mp3', '/voices/megumi/correct_3.mp3'],
      wrong:   ['/voices/megumi/wrong_1.mp3',   '/voices/megumi/wrong_2.mp3',   '/voices/megumi/wrong_3.mp3'],
      streak:  ['/voices/megumi/streak_1.mp3',  '/voices/megumi/streak_2.mp3',  '/voices/megumi/streak_3.mp3'],
    },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
  // VP Nanami Kento (pack_11) — TTS generik, setelan di docs/voice-pack-2-jujutsu.md.
  nanami: {
    files: {
      correct: ['/voices/nanami/correct_1.mp3', '/voices/nanami/correct_2.mp3', '/voices/nanami/correct_3.mp3'],
      wrong:   ['/voices/nanami/wrong_1.mp3',   '/voices/nanami/wrong_2.mp3',   '/voices/nanami/wrong_3.mp3'],
      streak:  ['/voices/nanami/streak_1.mp3',  '/voices/nanami/streak_2.mp3',  '/voices/nanami/streak_3.mp3'],
    },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
  // VP Yuta Okkotsu (pack_12) — TTS generik, setelan di docs/voice-pack-2-jujutsu.md.
  yuta: {
    files: {
      correct: ['/voices/yuta/correct_1.mp3', '/voices/yuta/correct_2.mp3', '/voices/yuta/correct_3.mp3'],
      wrong:   ['/voices/yuta/wrong_1.mp3',   '/voices/yuta/wrong_2.mp3',   '/voices/yuta/wrong_3.mp3'],
      streak:  ['/voices/yuta/streak_1.mp3',  '/voices/yuta/streak_2.mp3',  '/voices/yuta/streak_3.mp3'],
    },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
  // VP Toji Fushiguro (pack_13) — TTS generik, setelan di docs/voice-pack-2-jujutsu.md.
  toji: {
    files: {
      correct: ['/voices/toji/correct_1.mp3', '/voices/toji/correct_2.mp3', '/voices/toji/correct_3.mp3'],
      wrong:   ['/voices/toji/wrong_1.mp3',   '/voices/toji/wrong_2.mp3',   '/voices/toji/wrong_3.mp3'],
      streak:  ['/voices/toji/streak_1.mp3',  '/voices/toji/streak_2.mp3',  '/voices/toji/streak_3.mp3'],
    },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
  // VP Ryomen Sukuna (pack_14) — TTS generik, setelan di docs/voice-pack-2-jujutsu.md.
  sukuna: {
    files: {
      correct: ['/voices/sukuna/correct_1.mp3', '/voices/sukuna/correct_2.mp3', '/voices/sukuna/correct_3.mp3'],
      wrong:   ['/voices/sukuna/wrong_1.mp3',   '/voices/sukuna/wrong_2.mp3',   '/voices/sukuna/wrong_3.mp3'],
      streak:  ['/voices/sukuna/streak_1.mp3',  '/voices/sukuna/streak_2.mp3',  '/voices/sukuna/streak_3.mp3'],
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
