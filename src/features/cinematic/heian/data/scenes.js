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

// ── Helper timeline ──────────────────────────────────────────────────────────
// Logika timeline kini SATU sumber di `../../timeline` (dipakai Heian & Edo).
// Di sini hanya di-RE-EXPORT dengan default HEIAN_SCENES supaya pemanggil lama
// (HeianCinematic, SceneLayer, tes) tetap bekerja tanpa perubahan.
import {
  totalDuration as _totalDuration,
  sceneStartTimes as _sceneStartTimes,
  sceneAtTime as _sceneAtTime,
  absoluteLineTimes as _absoluteLineTimes,
  audioCues as _audioCues,
  voiceCues as _voiceCues,
  ambienceTimeline as _ambienceTimeline,
  sceneOpacityAt as _sceneOpacityAt,
  visibleSceneIndices as _visibleSceneIndices,
  validateScenes as _validateScenes,
} from '../../timeline.js';

export const totalDuration = (scenes = HEIAN_SCENES) => _totalDuration(scenes);
export const sceneStartTimes = (scenes = HEIAN_SCENES) => _sceneStartTimes(scenes);
export const sceneAtTime = (scenes, t) => _sceneAtTime(scenes, t);
export const absoluteLineTimes = (scene, sceneStart = 0) => _absoluteLineTimes(scene, sceneStart);
export const audioCues = (scenes = HEIAN_SCENES) => _audioCues(scenes);
export const voiceCues = (scenes = HEIAN_SCENES) => _voiceCues(scenes);
export const ambienceTimeline = (scenes = HEIAN_SCENES) => _ambienceTimeline(scenes);
export const sceneOpacityAt = (scenes, i, t, fade = XFADE) => _sceneOpacityAt(scenes, i, t, fade);
export const visibleSceneIndices = (scenes, t, fade = XFADE, pad = MOUNT_PAD) =>
  _visibleSceneIndices(scenes, t, fade, pad);
export const validateScenes = (scenes = HEIAN_SCENES) => _validateScenes(scenes);
