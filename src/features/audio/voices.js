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
  // VP Nobara Kugisaki (pack_08) — aset user di public/voices/nobara/ (芻霊呪法).
  //   wrong : 3 klip kalah TTS (wawa/shijidesho/tsugi_wa_makenai) — acak tiap salah.
  //   clips : klip jalur khusus — jurus ladder (簪/共鳴り/黒閃) + seruan anime
  //           「共鳴り!」 (ultimate) + klip ambience (呪力/藁人形). Diputar
  //           DETERMINISTIK oleh playNobaraTechnique.
  //   correct/streak: KOSONG (benar = jurus deterministik, pola Gojo/Yuji/Megumi/Sukuna).
  nobara: {
    files: {
      correct: [],
      wrong: ['/voices/nobara/wrong_1.mp3', '/voices/nobara/wrong_2.mp3', '/voices/nobara/wrong_3.mp3'],
      streak: [],
    },
    clips: [
      '/voices/nobara/kanzashi.mp3', '/voices/nobara/tomonari.mp3',
      '/voices/nobara/kokusen.mp3', '/voices/nobara/ult.mp3',
      '/voices/nobara/juriyoku.mp3', '/voices/nobara/waraningyou.mp3',
    ],
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
  // VP Yuji Itadori (pack_09) — aset user di public/voices/yuji/.
  //   wrong : 3 klip meme "Yuji kalah" (dipilih acak tiap salah); pas takeover
  //           ganti deterministik ke zakome (Sukuna) — diatur EffectContext.
  //   clips : klip jalur khusus (keiteiken/manjigeri/kokusen/senketsu + kai/
  //           hachi/fuga/zakome) — diputar DETERMINISTIK oleh playYujiTechnique.
  //   correct/streak: KOSONG (benar = suara teknik deterministik; 宿儺の器 = teks doang).
  yuji: {
    files: {
      correct: [],
      wrong: ['/voices/yuji/kuso.mp3', '/voices/yuji/madada.mp3', '/voices/yuji/shimata.mp3'],
      streak: [],
    },
    clips: [
      '/voices/yuji/keiteiken.mp3', '/voices/yuji/manjigeri.mp3',
      '/voices/yuji/kokusen.mp3', '/voices/yuji/senketsu.mp3',
      '/voices/yuji/kai.mp3', '/voices/yuji/hachi.mp3', '/voices/yuji/fuga.mp3',
      '/voices/yuji/zakome.mp3',
    ],
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
  // VP Megumi Fushiguro (pack_10) — aset user di public/voices/megumi/ (十種影法術).
  //   wrong : 3 klip kalah (hazushita/chi/tsugi_de_kimeru) — dipilih acak tiap salah.
  //   clips : klip jalur khusus — 5 jurus ladder (玉犬/鵺/大蛇/満象/虎葬) + chant
  //           魔虚羅 (ultimate). Diputar DETERMINISTIK oleh playMegumiTechnique.
  //   correct/streak: KOSONG (benar = jurus deterministik; summon = klip chant sendiri).
  megumi: {
    files: {
      correct: [],
      wrong: ['/voices/megumi/hazushita.mp3', '/voices/megumi/chi.mp3', '/voices/megumi/tsugi_de_kimeru.mp3'],
      streak: [],
    },
    clips: [
      '/voices/megumi/gyokuken.mp3', '/voices/megumi/nue.mp3',
      '/voices/megumi/orochi.mp3', '/voices/megumi/bansou.mp3',
      '/voices/megumi/kosou.mp3', '/voices/megumi/mahoraga.mp3',
    ],
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
  // VP Ryomen Sukuna (pack_14) — aset user di public/voices/sukuna/.
  //   wrong : 2 klip kalah (gambare/bakana) — dipilih acak 50/50 tiap salah.
  //   clips : klip jalur khusus — 5 jurus ladder + ryouiki_tenkai (cast domain),
  //           diputar DETERMINISTIK oleh playSukunaTechnique.
  //   correct/streak: KOSONG (benar = jurus deterministik; domain = klip cast sendiri).
  sukuna: {
    files: {
      correct: [],
      wrong: ['/voices/sukuna/gambare.mp3', '/voices/sukuna/bakana.mp3'],
      streak: [],
    },
    clips: [
      '/voices/sukuna/kumo_no_ito.mp3', '/voices/sukuna/nue.mp3',
      '/voices/sukuna/furube.mp3', '/voices/sukuna/ryuurin.mp3',
      '/voices/sukuna/sekai_zangeki.mp3', '/voices/sukuna/ryouiki_tenkai.mp3',
    ],
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
};

export const getVoice = (key) => VOICES[key] || VOICES.taiko;

// Pilih satu path acak dari daftar (atau null kalau kosong).
export const pickFile = (list, rng = Math.random) =>
  (Array.isArray(list) && list.length > 0)
    ? list[Math.floor(rng() * list.length)]
    : null;
