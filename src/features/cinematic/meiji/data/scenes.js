// ─────────────────────────────────────────────────────────────────────────────
// Data-driven scene config untuk HISTORICAL CINEMATIC INTRO era Meiji 明治.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Menambah/mengubah scene = cukup edit array ini; logic di MeijiCinematic.jsx
// tidak perlu disentuh.
//
// Bentuk scene IDENTIK dengan Heian/Edo (lihat edo/data/scenes.js) supaya helper
// timeline yang sama (totalDuration, sceneAtTime, audioCues, …) bisa dipakai ulang.
// Storyboard mengikuti PRD docs/tema/meiji.md §10 (5 babak).
//
// Bahasa: teks Jepang = elemen utama (serif cetak), terjemahan Indonesia
// menyusul. Kanji sah di sini karena kalimat sejarah, bukan label UI.
// ─────────────────────────────────────────────────────────────────────────────

export const MEIJI_SCENES = [
  {
    id: 'port',
    duration: 10,
    visual: 'port',
    mood: 'port',
    lines: [
      // Babak 1: kapal uap hitam masuk teluk — TANPA teks (murni visual + uap).
    ],
    audio: {
      cues: [
        { sfx: 'steamWhistle', at: 0.6, gain: 0.9 },   // peluit kapal uap
        { sfx: 'wind', at: 1.8, gain: 0.7 },            // ombak/angin laut
        { sfx: 'taiko', at: 3.6, gain: 0.5 },           // bobot sejarah
        { sfx: 'steamWhistle', at: 6.4, gain: 0.7 },
      ],
    },
  },
  {
    id: 'ginza',
    duration: 13,
    visual: 'ginza',
    mood: 'city',
    lines: [
      { id: 'era', jp: '明治時代', translation: 'Zaman Meiji (1868–1912)', kind: 'title', at: 0.6, translationAt: 2.6, sub: '1868 — 1912', voice: '/voices/meiji/01_era.mp3' },
      {
        id: 'brick',
        jp: '煉瓦の道に、ガス灯がともる。',
        translation: 'Di jalan bata, lampu gas menyala.',
        kind: 'sentence',
        at: 3.6,
        translationAt: 5.8,
        voice: '/voices/meiji/02_brick.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'paperCry', at: 0.3 },                   // sorak penjual koran
        { sfx: 'woodKnock', at: 1.2, gain: 0.6 },
        { sfx: 'shimmer', at: 2.4 },                    // lampu gas menyala
        { sfx: 'paperCry', at: 4.2, gain: 0.7 },
        { sfx: 'shimmer', at: 6.0 },
      ],
    },
  },
  {
    id: 'print',
    duration: 13,
    visual: 'print',
    mood: 'press',
    lines: [
      {
        id: 'type',
        jp: '活字を組んで、刷る。',
        translation: 'Huruf lepas disusun, dicetak.',
        kind: 'sentence',
        at: 0.8,
        translationAt: 2.9,
        voice: '/voices/meiji/03_type.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'pressClack', at: 0.5 },                 // mesin cetak
        { sfx: 'pressClack', at: 1.1, gain: 0.9 },
        { sfx: 'inkDrip', at: 2.4 },                    // tinta
        { sfx: 'pressClack', at: 3.6, gain: 0.85 },
        { sfx: 'shimmer', at: 5.8 },
      ],
    },
  },
  {
    id: 'rail',
    duration: 13,
    visual: 'rail',
    mood: 'city',
    lines: [
      {
        id: 'steam',
        jp: '煙と電信が、国をつなぐ。',
        translation: 'Asap dan telegraf menghubungkan negeri.',
        kind: 'sentence',
        at: 0.7,
        translationAt: 3.0,
        voice: '/voices/meiji/04_steam.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'steamWhistle', at: 0.2 },               // peluit kereta
        { sfx: 'woodKnock', at: 1.3, gain: 0.7 },       // rel
        { sfx: 'telegraph', at: 2.6 },                  // tit-tit
        { sfx: 'telegraph', at: 3.0 },
        { sfx: 'shimmer', at: 5.6 },
      ],
    },
  },
  {
    id: 'change',
    duration: 17,
    visual: 'change',
    mood: 'diet',
    lines: [
      {
        id: 'turn',
        jp: 'そして、新しい時代が来る。',
        translation: 'Dan zaman baru pun tiba.',
        kind: 'sentence',
        at: 0.6,
        translationAt: 2.8,
        voice: '/voices/meiji/05_turn.mp3',
      },
      { id: 'era2', jp: '明治 — 文明開化', translation: null, kind: 'title', at: 5.0, translationAt: null, sub: 'MEIJI · 1868 — 1912', voice: '/voices/meiji/06_era2.mp3' },
      {
        id: 'welcome',
        jp: 'ようこそ、明治へ。',
        translation: 'Selamat datang di Meiji.',
        kind: 'welcome',
        at: 7.6,
        translationAt: 9.4,
        voice: '/voices/meiji/07_welcome.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'dread', at: 0.4 },
        { sfx: 'courtBell', at: 4.9 },                  // lonceng penutup
        { sfx: 'heartbeat', at: 7.7 },
        { sfx: 'shimmer', at: 9.5 },
      ],
    },
  },
];

// ── Konstanta transisi (sama seperti Heian/Edo → bahasa gerak konsisten) ──────
export const XFADE = 1.7;
export const MOUNT_PAD = 0.25;

// ── Helper timeline ──────────────────────────────────────────────────────────
// Logika timeline SATU sumber di `../../timeline` (dipakai Heian, Edo, Meiji).
// Re-export dengan default MEIJI_SCENES supaya orkestrator & tes memakai pintu
// yang sama seperti era lain (lihat edo/data/scenes.js).
import {
  totalDuration as _totalDuration,
  sceneStartTimes as _sceneStartTimes,
  sceneAtTime as _sceneAtTime,
  audioCues as _audioCues,
  voiceCues as _voiceCues,
  ambienceTimeline as _ambienceTimeline,
  visibleSceneIndices as _visibleSceneIndices,
  validateScenes as _validateScenes,
} from '../../timeline.js';

export const totalDuration = (scenes = MEIJI_SCENES) => _totalDuration(scenes);
export const sceneStartTimes = (scenes = MEIJI_SCENES) => _sceneStartTimes(scenes);
export const sceneAtTime = (scenes, t) => _sceneAtTime(scenes, t);
export const audioCues = (scenes = MEIJI_SCENES) => _audioCues(scenes);
export const voiceCues = (scenes = MEIJI_SCENES) => _voiceCues(scenes);
export const ambienceTimeline = (scenes = MEIJI_SCENES) => _ambienceTimeline(scenes);
export const visibleSceneIndices = (scenes, t, fade = XFADE, pad = MOUNT_PAD) =>
  _visibleSceneIndices(scenes, t, fade, pad);
export const validateScenes = (scenes = MEIJI_SCENES) => _validateScenes(scenes);
