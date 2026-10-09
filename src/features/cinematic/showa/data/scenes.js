// ─────────────────────────────────────────────────────────────────────────────
// Data-driven scene config untuk HISTORICAL CINEMATIC INTRO era Shōwa 昭和.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Menambah/mengubah scene = cukup edit array ini; logic di ShowaCinematic.jsx
// tidak perlu disentuh.
//
// Bentuk scene IDENTIK dengan Heian/Edo/Meiji (lihat meiji/data/scenes.js)
// supaya helper timeline yang sama (totalDuration, sceneAtTime, audioCues, …)
// bisa dipakai ulang.
// Storyboard mengikuti PRD docs/tema/showa.md §10 (5 babak):
//   ruins  → 焼け跡: kota rata jadi abu, horizon kosong (TANPA teks)
//   yamichi→ 闇市: lampu bohlam, orang bertahan
//   build  → beton dituang, 団地 berbaris
//   tower  → 東京タワー → 新幹線 → 太陽の塔
//   change → kota beton → segel 昭 + ようこそ
//
// Narator = Nacht ナハト (selang-seling dengan Saku; Shōwa = Nacht).
// Bahasa: teks Jepang = elemen utama, terjemahan Indonesia menyusul. Kanji sah
// di sini karena kalimat sejarah, bukan label UI.
//
// ⚠️ VOICE (T11): `voice` sudah menunjuk /voices/showa/NN_*.mp3 sesuai PRD §10,
//    tapi file mp3-nya BELUM digenerate (T11 = tugas terakhir; tema tetap jalan
//    tanpa voice — PRD §14 R7). Pemutar klip aman kalau file belum ada.
// ─────────────────────────────────────────────────────────────────────────────

export const SHOWA_SCENES = [
  {
    id: 'ruins',
    duration: 10,
    visual: 'ruins',
    mood: 'ruins',
    lines: [
      // Babak 1: kota rata jadi abu — horizon kosong, TANPA teks (murni visual).
    ],
    audio: {
      cues: [
        { sfx: 'wind', at: 1.0, gain: 0.8 },      // angin di tanah kosong
        { sfx: 'dread', at: 4.2, gain: 0.7 },     // bobot sunyi
        { sfx: 'wind', at: 7.0, gain: 0.6 },
      ],
    },
  },
  {
    id: 'yamichi',
    duration: 14,
    visual: 'yamichi',
    mood: 'yamichi',
    lines: [
      { id: 'era', jp: '昭和時代', translation: 'Zaman Shōwa (1926–1989)', kind: 'title', at: 0.6, translationAt: 2.6, sub: '1926 — 1989', voice: '/voices/showa/01_era.mp3' },
      {
        id: 'survive',
        jp: '灰の中でも、人は生きる。',
        translation: 'Bahkan di dalam abu, manusia tetap hidup.',
        kind: 'sentence',
        at: 3.6,
        translationAt: 5.8,
        voice: '/voices/showa/02_survive.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'cicada', at: 0.4, gain: 0.5 },      // 蝉 (musim panas pasca-perang)
        { sfx: 'marketCry', at: 1.4, gain: 0.7 },   // sorak pedagang 闇市
        { sfx: 'woodKnock', at: 3.0, gain: 0.5 },
        { sfx: 'kayokyoku', at: 4.4, gain: 0.6 },   // 歌謡曲 dari radio
        { sfx: 'shimmer', at: 6.4 },
      ],
    },
  },
  {
    id: 'build',
    duration: 14,
    visual: 'build',
    mood: 'danchi',
    lines: [
      {
        id: 'concrete',
        jp: 'コンクリートを打って、町を作る。',
        translation: 'Beton dituang, kota dibangun.',
        kind: 'sentence',
        at: 0.8,
        translationAt: 2.9,
        voice: '/voices/showa/03_concrete.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'pileDriver', at: 0.5, gain: 0.8 },   // tiang pancang — beton dituang
        { sfx: 'pileDriver', at: 1.6, gain: 0.9 },
        { sfx: 'woodKnock', at: 2.6, gain: 0.6 },    // cetakan (formwork)
        { sfx: 'pileDriver', at: 3.8, gain: 0.85 },
        { sfx: 'shimmer', at: 5.8 },
      ],
    },
  },
  {
    id: 'tower',
    duration: 14,
    visual: 'tower',
    mood: 'city',
    lines: [
      {
        id: 'rise',
        jp: '塔が立つ。速い車が走る。',
        translation: 'Menara berdiri. Kereta cepat melaju.',
        kind: 'sentence',
        at: 0.7,
        translationAt: 3.0,
        voice: '/voices/showa/04_rise.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'shinkansen', at: 0.3, gain: 0.9 },   // 新幹線 melintas
        { sfx: 'taiko', at: 1.4, gain: 0.5 },        // bobot menara 東京タワー
        { sfx: 'marketCry', at: 2.8, gain: 0.6 },    // sorak オリンピック
        { sfx: 'shinkansen', at: 4.2, gain: 0.7 },
        { sfx: 'shimmer', at: 5.8 },
      ],
    },
  },
  {
    id: 'change',
    duration: 17,
    visual: 'change',
    mood: 'expo',
    lines: [
      {
        id: 'turn',
        jp: 'そして、未来が見えてくる。',
        translation: 'Dan masa depan mulai terlihat.',
        kind: 'sentence',
        at: 0.6,
        translationAt: 2.8,
        voice: '/voices/showa/05_turn.mp3',
      },
      { id: 'era2', jp: '昭和 — 灰からの町', translation: null, kind: 'title', at: 5.0, translationAt: null, sub: 'SHŌWA · 1926 — 1989', voice: '/voices/showa/06_era2.mp3' },
      {
        id: 'welcome',
        jp: 'ようこそ、昭和へ。',
        translation: 'Selamat datang di Shōwa.',
        kind: 'welcome',
        at: 7.6,
        translationAt: 9.4,
        voice: '/voices/showa/07_welcome.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'dread', at: 0.4, gain: 0.6 },
        { sfx: 'courtBell', at: 4.9, gain: 0.7 },    // lonceng penutup
        { sfx: 'schoolChime', at: 5.6, gain: 0.8 },  // チャイム sekolah
        { sfx: 'koto', at: 7.7, gain: 0.5 },         // 蛍の光 (petikan perpisahan)
        { sfx: 'shimmer', at: 9.5 },
      ],
    },
  },
];

// ── Konstanta transisi (sama seperti Heian/Edo/Meiji → bahasa gerak konsisten) ─
export const XFADE = 1.7;
export const MOUNT_PAD = 0.25;

// ── Helper timeline ──────────────────────────────────────────────────────────
// Logika timeline SATU sumber di `../../timeline` (dipakai Heian, Edo, Meiji).
// Re-export dengan default SHOWA_SCENES supaya orkestrator & tes memakai pintu
// yang sama seperti era lain (lihat meiji/data/scenes.js).
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

export const totalDuration = (scenes = SHOWA_SCENES) => _totalDuration(scenes);
export const sceneStartTimes = (scenes = SHOWA_SCENES) => _sceneStartTimes(scenes);
export const sceneAtTime = (scenes, t) => _sceneAtTime(scenes, t);
export const audioCues = (scenes = SHOWA_SCENES) => _audioCues(scenes);
export const voiceCues = (scenes = SHOWA_SCENES) => _voiceCues(scenes);
export const ambienceTimeline = (scenes = SHOWA_SCENES) => _ambienceTimeline(scenes);
export const visibleSceneIndices = (scenes, t, fade = XFADE, pad = MOUNT_PAD) =>
  _visibleSceneIndices(scenes, t, fade, pad);
export const validateScenes = (scenes = SHOWA_SCENES) => _validateScenes(scenes);
