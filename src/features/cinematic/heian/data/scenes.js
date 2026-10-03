// ─────────────────────────────────────────────────────────────────────────────
// Data-driven scene config untuk HISTORICAL CINEMATIC INTRO era Heian.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Menambah/mengubah scene = cukup edit array ini; logic di HeianCinematic.jsx
// tidak perlu disentuh.
//
// Bentuk scene:
//   {
//     id, duration,            // detik scene ini tampil
//     visual,                  // kunci latar (dipakai scenes/*.jsx)
//     mood,                    // 'calm'|'court'|'kana'|'dark' → nada washi + ambience
//     lines: [                 // teks dalam scene
//       { id, jp, translation, kind, at, translationAt, sub?, voice? }
//         at            = detik (relatif scene) saat teks Jepang mulai muncul
//         translationAt = detik (relatif scene) saat terjemahan muncul (null = tak ada)
//         kind          = 'year' | 'sentence' | 'title' | 'welcome'  (pilih gaya)
//         voice         = path mp3 klip narasi untuk BARIS ini (mis.
//                         '/voices/heian/01_year.mp3'); diputar pada detik `at`.
//                         Kosong = belum ada aset → no-op. Voice per-BARIS (bukan
//                         per-scene) supaya scene 'change' yang punya 3 baris
//                         berjarak jauh (turn/era/welcome) bisa punya klip sendiri.
//     ],
//     audio: {
//       cues:  [ { sfx, at, gain? } ],   // SFX absolut-relatif-scene (banyak per scene)
//     },
//     kana?: { glyphs, at, gap }         // deret hiragana (scene 3)
//   }
//
// Aturan bahasa (konsisten dengan tema Heian lain): teks Jepang = elemen utama
// (font brush), terjemahan Indonesia menyusul kemudian (font sans, lebih terbaca).
// Teks kanji di sini SAH karena ini kalimat sejarah asli, bukan label UI.
// ─────────────────────────────────────────────────────────────────────────────

export const HEIAN_SCENES = [
  {
    id: 'capital',
    duration: 9,
    visual: 'ink',
    mood: 'calm',
    lines: [
      { id: 'year', jp: '794年', translation: null, kind: 'year', at: 0.5, translationAt: null, voice: '/voices/heian/01_year.mp3' },
      {
        id: 'capital',
        jp: '都は、平安京へ。',
        translation: 'Ibu kota berpindah ke Heian-kyō.',
        kind: 'sentence',
        at: 3.2,
        translationAt: 5.4,
        voice: '/voices/heian/02_capital.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'brushSweep', at: 0.3 },        // sapuan kuas panjang (tinta masuk)
        { sfx: 'taiko', at: 1.15, gain: 0.7 },  // pukulan drum rendah (bob Bobot sejarah)
        { sfx: 'inkDrip', at: 3.5 },            // tetes tinta saat kalimat mulai ditulis
        { sfx: 'shimmer', at: 5.5 },            // kilau halus saat terjemahan muncul
      ],
    },
  },
  {
    id: 'court',
    duration: 8,
    visual: 'court',
    mood: 'court',
    lines: [
      {
        id: 'court',
        jp: '貴族たちは、宮廷に文化を咲かせた。',
        translation: 'Kaum bangsawan mengembangkan budaya istana yang berkembang pesat.',
        kind: 'sentence',
        at: 0.8,
        translationAt: 3.4,
        voice: '/voices/heian/03_court.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'wind', at: 0.15 },              // angin lembut (ambience)
        { sfx: 'courtBell', at: 1.1 },          // bel istana jauh
        { sfx: 'koto', at: 2.6 },               // petikan koto
        { sfx: 'koto', at: 4.2, gain: 0.8 },    // petikan kedua (motif)
      ],
    },
  },
  {
    id: 'kana',
    duration: 9.5,
    visual: 'kana',
    mood: 'kana',
    lines: [
      {
        id: 'kana',
        jp: 'かなは、日本の言葉を記す新たな道を開いた。',
        translation: 'Kana membuka jalan baru bagi penulisan bahasa Jepang.',
        kind: 'sentence',
        at: 0.8,
        translationAt: 3.6,
        voice: '/voices/heian/04_kana.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'brushSweep', at: 0.5, gain: 0.8 },   // sapuan kuas besar
        { sfx: 'inkDrip', at: 3.7 },                  // tetes tinta
        // Satu goresan kuas per kana (disinkronkan dengan kemunculan あ→か→さ→た).
        { sfx: 'brushStroke', at: 5.6 },
        { sfx: 'brushStroke', at: 6.15 },
        { sfx: 'brushStroke', at: 6.7 },
        { sfx: 'brushStroke', at: 7.25 },
      ],
    },
    // Deret hiragana yang muncul seperti tinta baru ditulis (atmosferik, bukan kuis).
    kana: { glyphs: ['あ', 'か', 'さ', 'た'], at: 5.6, gap: 0.55 },
  },
  {
    id: 'change',
    duration: 11.5,
    visual: 'change',
    mood: 'dark',
    lines: [
      {
        id: 'turn',
        jp: 'そして、時代は変わる。',
        translation: 'Dan zaman pun berubah.',
        kind: 'sentence',
        at: 0.6,
        translationAt: 2.8,
        voice: '/voices/heian/05_turn.mp3',
      },
      { id: 'era', jp: '平安時代', translation: null, kind: 'title', at: 5.4, translationAt: null, sub: '794 — 1185', voice: '/voices/heian/06_era.mp3' },
      {
        id: 'welcome',
        jp: 'ようこそ、平安へ。',
        translation: 'Selamat datang di Heian.',
        kind: 'welcome',
        at: 8.0,
        translationAt: 9.9,
        voice: '/voices/heian/07_welcome.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'dread', at: 0.4 },              // drone gelap naik (zaman berubah)
        { sfx: 'gong', at: 5.3 },               // gong saat judul era 平安時代
        { sfx: 'heartbeat', at: 8.1 },          // detak jantung (sambutan)
        { sfx: 'shimmer', at: 10.0 },           // kilau penutup
      ],
    },
  },
];

// ── Konstanta transisi ───────────────────────────────────────────────────────
// Cross-fade antar scene (detik). Transisi di-CENTER pada batas scene sehingga
// dua scene benar-benar saling menembus (bukan cut keras).
export const XFADE = 1.7;
// Mount scene sedikit SEBELUM jendela cross-fade supaya animasi masuknya sudah
// jalan saat mulai terlihat (tidak "pop" dari diam).
export const MOUNT_PAD = 0.25;

// ── Helper timeline (murni, dipakai HeianCinematic & dites) ──────────────────

// Total durasi seluruh cinematic (detik).
export const totalDuration = (scenes = HEIAN_SCENES) =>
  scenes.reduce((sum, s) => sum + s.duration, 0);

// Waktu MULAI (absolut, detik) tiap scene.
export const sceneStartTimes = (scenes = HEIAN_SCENES) => {
  let t = 0;
  return scenes.map((s) => {
    const start = t;
    t += s.duration;
    return start;
  });
};

// Scene ke-berapa yang aktif pada detik `t` (0-based). t di luar rentang → dijepit.
export const sceneAtTime = (scenes, t) => {
  if (!scenes.length) return 0;
  const starts = sceneStartTimes(scenes);
  if (t < 0) return 0;
  for (let i = scenes.length - 1; i >= 0; i -= 1) {
    if (t >= starts[i]) return i;
  }
  return 0;
};

// Ubah `at` relatif-scene menjadi waktu ABSOLUT (untuk penjadwalan audio/teks).
export const absoluteLineTimes = (scene, sceneStart = 0) =>
  (scene.lines || []).map((l) => ({
    id: l.id,
    at: sceneStart + l.at,
    translationAt: l.translationAt == null ? null : sceneStart + l.translationAt,
  }));

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// ── Audio ────────────────────────────────────────────────────────────────────
// Daftar pemicu SFX absolut (banyak per scene), terurut waktu.
// Bentuk: [{ id, sceneId, sfx, at, gain }]
export const audioCues = (scenes = HEIAN_SCENES) => {
  const starts = sceneStartTimes(scenes);
  const out = [];
  scenes.forEach((s, i) => {
    (s.audio?.cues || []).forEach((c, j) => {
      out.push({
        id: `${s.id}:${c.sfx}:${j}`,
        sceneId: s.id,
        sfx: c.sfx,
        at: starts[i] + (c.at || 0),
        gain: c.gain == null ? 1 : c.gain,
      });
    });
  });
  return out.sort((a, b) => a.at - b.at);
};

// Daftar pemicu voice absolut — satu per BARIS yang punya `voice`.
// Bentuk: [{ id, sceneId, lineId, path, at }], terurut waktu.
export const voiceCues = (scenes = HEIAN_SCENES) => {
  const starts = sceneStartTimes(scenes);
  const out = [];
  scenes.forEach((s, i) => {
    (s.lines || []).forEach((l) => {
      if (!l.voice) return;
      out.push({
        id: `voice:${s.id}:${l.id}`,
        sceneId: s.id,
        lineId: l.id,
        path: l.voice,
        at: starts[i] + (l.at || 0),
      });
    });
  });
  return out.sort((a, b) => a.at - b.at);
};

// Kapan "mood" ambience berubah: [{ at, mood }].
export const ambienceTimeline = (scenes = HEIAN_SCENES) => {
  const starts = sceneStartTimes(scenes);
  return scenes.map((s, i) => ({ at: starts[i], mood: s.mood || 'calm' }));
};

// ── Transisi visual (dipakai SceneLayer via motion value) ────────────────────

// Opasitas scene ke-i pada detik `t`. Cross-fade di-center pada batas scene.
export const sceneOpacityAt = (scenes, i, t, fade = XFADE) => {
  const starts = sceneStartTimes(scenes);
  const s = starts[i];
  const e = s + scenes[i].duration;
  const half = fade / 2;
  let op = 1;
  if (i > 0) {
    if (t < s + half) op = Math.min(op, clamp01((t - (s - half)) / fade));
  } else if (t < half) {
    op = Math.min(op, clamp01(t / half));
  }
  if (i < scenes.length - 1) {
    if (t > e - half) op = Math.min(op, clamp01(((e + half) - t) / fade));
  } else if (t > e - half) {
    op = Math.min(op, clamp01((e - t) / half));
  }
  return clamp01(op);
};

// Indeks scene yang perlu DI-MOUNT pada detik `t` (jendela + padding).
export const visibleSceneIndices = (scenes, t, fade = XFADE, pad = MOUNT_PAD) => {
  const starts = sceneStartTimes(scenes);
  const half = fade / 2;
  const out = [];
  scenes.forEach((sc, i) => {
    const s = starts[i];
    const e = s + sc.duration;
    if (t >= s - half - pad && t <= e + half + pad) out.push(i);
  });
  return out;
};

// Validasi ringan untuk tes: id unik, durasi > 0, tiap baris punya jp + timing wajar,
// cue audio punya sfx + waktu valid.
export const validateScenes = (scenes = HEIAN_SCENES) => {
  const errors = [];
  const ids = new Set();
  scenes.forEach((s, i) => {
    if (!s.id) errors.push(`scene[${i}] tanpa id`);
    if (ids.has(s.id)) errors.push(`id scene duplikat: ${s.id}`);
    ids.add(s.id);
    if (!(s.duration > 0)) errors.push(`scene ${s.id} durasi harus > 0`);
    (s.lines || []).forEach((l) => {
      if (!l.jp) errors.push(`scene ${s.id} baris ${l.id} tanpa jp`);
      if (!(l.at >= 0)) errors.push(`scene ${s.id} baris ${l.id} at harus >= 0`);
      if (l.at > s.duration) errors.push(`scene ${s.id} baris ${l.id} at melewati durasi scene`);
      if (l.translationAt != null && l.translationAt < l.at) {
        errors.push(`scene ${s.id} baris ${l.id}: terjemahan harus muncul SETELAH teks Jepang`);
      }
    });
    (s.audio?.cues || []).forEach((c, j) => {
      if (!c.sfx) errors.push(`scene ${s.id} cue[${j}] tanpa sfx`);
      if (!(c.at >= 0) || c.at > s.duration) errors.push(`scene ${s.id} cue[${j}] at di luar durasi scene`);
    });
  });
  return errors;
};
