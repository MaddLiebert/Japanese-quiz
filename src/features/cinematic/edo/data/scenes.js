// ─────────────────────────────────────────────────────────────────────────────
// Data-driven scene config untuk HISTORICAL CINEMATIC INTRO era Edo 江戸.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Menambah/mengubah scene = cukup edit array ini; logic di EdoCinematic.jsx
// tidak perlu disentuh.
//
// Bentuk scene IDENTIK dengan Heian (lihat heian/data/scenes.js) supaya
// helper timeline yang sama (totalDuration, sceneAtTime, audioCues, …) bisa
// dipakai ulang. Storyboard mengikuti PRD docs/tema/edo.md §10 (5 babak).
//
// Bahasa: teks Jepang = elemen utama (serif cetak), terjemahan Indonesia
// menyusul. Kanji sah di sini karena kalimat sejarah, bukan label UI.
// ─────────────────────────────────────────────────────────────────────────────

export const EDO_SCENES = [
  {
    id: 'map',
    duration: 10,
    visual: 'map',
    mood: 'market',
    lines: [
      // Babak 1: peta Tōkaidō tergelar — TANPA teks (murni visual + kayu bergesek).
    ],
    audio: {
      cues: [
        { sfx: 'brushSweep', at: 0.4, gain: 0.8 },  // kertas peta tergelar
        { sfx: 'woodKnock', at: 1.6 },               // kayu bergesek
        { sfx: 'taiko', at: 3.2, gain: 0.6 },        // bobot sejarah
        { sfx: 'woodKnock', at: 5.4, gain: 0.8 },
      ],
    },
  },
  {
    id: 'capital',
    duration: 13,
    visual: 'capital',
    mood: 'market',
    lines: [
      { id: 'era', jp: '江戸時代', translation: 'Zaman Edo (1603–1868)', kind: 'title', at: 0.6, translationAt: 2.6, sub: '1603 — 1868', voice: '/voices/edo/01_era.mp3' },
      {
        id: 'bridge',
        jp: 'すべての道は、日本橋から始まる。',
        translation: 'Semua jalan dimulai dari Nihonbashi.',
        kind: 'sentence',
        at: 3.6,
        translationAt: 5.8,
        voice: '/voices/edo/02_bridge.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'marketCry', at: 0.3 },               // sorak penjaja
        { sfx: 'woodKnock', at: 1.2, gain: 0.7 },
        { sfx: 'shamisen', at: 2.4 },                // shamisen masuk
        { sfx: 'marketCry', at: 4.0, gain: 0.7 },
        { sfx: 'shimmer', at: 5.9 },
      ],
    },
  },
  {
    id: 'print',
    duration: 13,
    visual: 'print',
    mood: 'print',
    lines: [
      {
        id: 'ukiyoe',
        jp: '浮世絵、刷る。',
        translation: 'Ukiyo-e dicetak.',
        kind: 'sentence',
        at: 0.8,
        translationAt: 2.9,
        voice: '/voices/edo/03_ukiyoe.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'woodKnock', at: 0.5 },               // blok kayu diukir
        { sfx: 'woodKnock', at: 1.4, gain: 0.85 },
        { sfx: 'inkDrip', at: 2.5 },                 // tinta ditekan
        { sfx: 'brushSweep', at: 4.2, gain: 0.7 },   // kertas tercetak
        { sfx: 'shimmer', at: 6.0 },
      ],
    },
  },
  {
    id: 'night',
    duration: 13,
    visual: 'night',
    mood: 'night',
    lines: [
      {
        id: 'lantern',
        jp: '昼は市、夜は提灯。',
        translation: 'Siang pasar, malam lentera.',
        kind: 'sentence',
        at: 0.7,
        translationAt: 3.0,
        voice: '/voices/edo/04_lantern.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'wind', at: 0.2 },                    // angin malam
        { sfx: 'shamisen', at: 1.3, gain: 0.8 },
        { sfx: 'marketCry', at: 3.4, gain: 0.5 },    // sorak jauh
        { sfx: 'shimmer', at: 5.6 },
      ],
    },
  },
  {
    id: 'change',
    duration: 17,
    visual: 'change',
    mood: 'festival',
    lines: [
      {
        id: 'turn',
        jp: 'そして、町人の時代が来る。',
        translation: 'Dan zaman rakyat kota pun tiba.',
        kind: 'sentence',
        at: 0.6,
        translationAt: 2.8,
        voice: '/voices/edo/05_turn.mp3',
      },
      { id: 'era2', jp: '江戸 — 町人の時代', translation: null, kind: 'title', at: 5.0, translationAt: null, sub: 'EDO · 1603 — 1868', voice: '/voices/edo/06_era2.mp3' },
      {
        id: 'welcome',
        jp: 'ようこそ、江戸へ。',
        translation: 'Selamat datang di Edo.',
        kind: 'welcome',
        at: 7.6,
        translationAt: 9.4,
        voice: '/voices/edo/07_welcome.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'dread', at: 0.4 },
        { sfx: 'gong', at: 4.9 },                    // lonceng penutup
        { sfx: 'heartbeat', at: 7.7 },
        { sfx: 'shimmer', at: 9.5 },
      ],
    },
  },
];

// ── Konstanta transisi (sama seperti Heian → bahasa gerak konsisten) ──────────
export const XFADE = 1.7;
export const MOUNT_PAD = 0.25;

// ── Helper timeline ──────────────────────────────────────────────────────────
// Logika timeline SATU sumber di `../../timeline` (dipakai Heian & Edo).
// Re-export dengan default EDO_SCENES supaya orkestrator & tes memakai pintu
// yang sama seperti Heian (lihat heian/data/scenes.js).
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

export const totalDuration = (scenes = EDO_SCENES) => _totalDuration(scenes);
export const sceneStartTimes = (scenes = EDO_SCENES) => _sceneStartTimes(scenes);
export const sceneAtTime = (scenes, t) => _sceneAtTime(scenes, t);
export const audioCues = (scenes = EDO_SCENES) => _audioCues(scenes);
export const voiceCues = (scenes = EDO_SCENES) => _voiceCues(scenes);
export const ambienceTimeline = (scenes = EDO_SCENES) => _ambienceTimeline(scenes);
export const visibleSceneIndices = (scenes, t, fade = XFADE, pad = MOUNT_PAD) =>
  _visibleSceneIndices(scenes, t, fade, pad);
export const validateScenes = (scenes = EDO_SCENES) => _validateScenes(scenes);
