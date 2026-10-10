// ─────────────────────────────────────────────────────────────────────────────
// Data-driven scene config untuk HISTORICAL CINEMATIC INTRO era 多元.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Menambah/mengubah scene = cukup edit array ini; logic di AnimeCinematic.jsx
// tidak perlu disentuh.
//
// Bentuk scene IDENTIK dengan Heian/Edo/Meiji/Shōwa → helper timeline bersama
// (timeline.js) dipakai ulang.
// Storyboard mengikuti PRD docs/tema/anime.md §10 (5 babak):
//   tear    → 開幕: halaman 絵巻 dibuka, lalu SOBEK (TANPA teks)
//   burst   → panel keluar dari sobekan: banyak dunia sekaligus
//   montage → 冒険 → 日常 → 青春 → 魔法 (montase dunia)
//   worlds  → 怪談 (gelap) → 異世界 (portal) → panel menyatu
//   finale  → semua panel menutup jadi satu 題字 多元 + segel
//
// Narator = Saku 咲 (selang-seling: Shōwa = Nacht, 多元 = Saku).
// Bahasa: teks Jepang = elemen utama, terjemahan Indonesia menyusul.
//
// ⚠️ VOICE (T12): `voice` menunjuk /voices/anime/NN_*.mp3 sesuai PRD §10, tapi
//    file mp3 BELUM digenerate (T12 = tugas terakhir; tema tetap jalan tanpa
//    voice — PRD §14 R7). Pemutar klip aman kalau file belum ada.
// ─────────────────────────────────────────────────────────────────────────────

export const ANIME_SCENES = [
  {
    id: 'tear',
    duration: 9,
    visual: 'tear',
    mood: 'burst',
    lines: [
      // Babak 1: halaman 絵巻 dibuka seperti biasa — lalu SOBEK. TANPA teks
      // (murni visual + suara kertas sobek).
    ],
    audio: {
      cues: [
        { sfx: 'wind', at: 0.8, gain: 0.6 },       // halaman dibuka — angin tipis
        { sfx: 'pageTear', at: 3.2, gain: 0.9 },   // SOBEK
        { sfx: 'burst', at: 3.6, gain: 0.8 },      // ledakan panel
        { sfx: 'sparklePop', at: 5.2, gain: 0.7 }, // cahaya keluar dari sobekan
      ],
    },
  },
  {
    id: 'burst',
    duration: 13,
    visual: 'burst',
    mood: 'adventure',
    lines: [
      {
        id: 'world',
        jp: '頁の向こうに、世界がある。',
        translation: 'Di balik halaman, ada dunia.',
        kind: 'title',
        at: 0.6,
        translationAt: 2.8,
        voice: '/voices/anime/01_world.mp3',
      },
      {
        id: 'turn',
        jp: 'ここは時代じゃない。世界だ。',
        translation: 'Ini bukan zaman. Ini dunia.',
        kind: 'sentence',
        at: 3.4,
        translationAt: 5.6,
        voice: '/voices/anime/02_turn.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'popChord', at: 0.4, gain: 0.7 },    // city-pop masuk
        { sfx: 'sparklePop', at: 1.4, gain: 0.7 },
        { sfx: 'doki', at: 3.6, gain: 0.8 },        // ドキドキ saat sadar
        { sfx: 'burst', at: 5.2, gain: 0.7 },
        { sfx: 'popChord', at: 6.6, gain: 0.6 },
        { sfx: 'sparklePop', at: 8.4, gain: 0.6 },
      ],
    },
  },
  {
    id: 'montage',
    duration: 16,
    visual: 'montage',
    mood: 'youth',
    lines: [
      {
        id: 'stories',
        jp: 'いくつもの物語が、待っている。',
        translation: 'Banyak cerita menanti.',
        kind: 'sentence',
        at: 1.0,
        translationAt: 3.2,
        voice: '/voices/anime/03_stories.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'popChord', at: 0.4, gain: 0.6 },     // 冒険 — petualangan
        { sfx: 'burst', at: 1.6, gain: 0.6 },
        { sfx: 'shimmer', at: 3.4, gain: 0.7 },      // 日常 — sekolah, ringan
        { sfx: 'doki', at: 6.2, gain: 0.7 },         // 青春 — olahraga
        { sfx: 'sparklePop', at: 9.0, gain: 0.7 },   // 魔法 — kilau
        { sfx: 'popChord', at: 11.6, gain: 0.6 },
        { sfx: 'shimmer', at: 13.6, gain: 0.6 },
      ],
    },
  },
  {
    id: 'worlds',
    duration: 16,
    visual: 'worlds',
    mood: 'horror',
    lines: [
      {
        id: 'choose',
        jp: 'どの世界へ、行く？',
        translation: 'Mau ke dunia mana?',
        kind: 'sentence',
        at: 0.8,
        translationAt: 3.0,
        voice: '/voices/anime/04_choose.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'dread', at: 0.4, gain: 0.7 },        // 怪談 — gelap, tegang
        { sfx: 'heartbeat', at: 2.4, gain: 0.7 },
        { sfx: 'portal', at: 6.6, gain: 0.9 },       // 異世界 — portal terbuka
        { sfx: 'sparklePop', at: 8.8, gain: 0.7 },
        { sfx: 'popChord', at: 11.0, gain: 0.6 },    // panel menyatu
        { sfx: 'shimmer', at: 13.4, gain: 0.6 },
      ],
    },
  },
  {
    id: 'finale',
    duration: 15,
    visual: 'finale',
    mood: 'finale',
    lines: [
      {
        id: 'grow',
        jp: '世界が、増えていく。',
        translation: 'Dunia terus bertambah.',
        kind: 'sentence',
        at: 0.6,
        translationAt: 2.8,
        voice: '/voices/anime/05_grow.mp3',
      },
      { id: 'era', jp: '多元 — 世界が増える', translation: '多元 — dunia bertambah', kind: 'title', at: 4.6, translationAt: 6.8, sub: 'TAGEN · MULTIVERSE', voice: '/voices/anime/06_era.mp3' },
      {
        id: 'welcome',
        jp: 'ようこそ、多元へ。',
        translation: 'Selamat datang di Multiverse.',
        kind: 'welcome',
        at: 7.4,
        translationAt: 9.2,
        voice: '/voices/anime/07_welcome.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'popChord', at: 0.5, gain: 0.6 },
        { sfx: 'fanfarePop', at: 4.4, gain: 0.8 },   // 題字 多元
        { sfx: 'courtBell', at: 5.2, gain: 0.7 },
        { sfx: 'sparklePop', at: 6.9, gain: 0.7 },
        { sfx: 'shimmer', at: 8.8, gain: 0.7 },
        { sfx: 'gong', at: 10.4, gain: 0.6 },        // 「つづく」
      ],
    },
  },
];

// ── Konstanta transisi (sama seperti era lain → bahasa gerak konsisten) ──────
export const XFADE = 1.7;
export const MOUNT_PAD = 0.25;

// ── Helper timeline ──────────────────────────────────────────────────────────
// Logika timeline SATU sumber di `../../timeline` (dipakai semua era).
// Re-export dengan default ANIME_SCENES supaya orkestrator & tes memakai pintu
// yang sama seperti era lain.
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

export const totalDuration = (scenes = ANIME_SCENES) => _totalDuration(scenes);
export const sceneStartTimes = (scenes = ANIME_SCENES) => _sceneStartTimes(scenes);
export const sceneAtTime = (scenes, t) => _sceneAtTime(scenes, t);
export const audioCues = (scenes = ANIME_SCENES) => _audioCues(scenes);
export const voiceCues = (scenes = ANIME_SCENES) => _voiceCues(scenes);
export const ambienceTimeline = (scenes = ANIME_SCENES) => _ambienceTimeline(scenes);
export const visibleSceneIndices = (scenes, t, fade = XFADE, pad = MOUNT_PAD) =>
  _visibleSceneIndices(scenes, t, fade, pad);
export const validateScenes = (scenes = ANIME_SCENES) => _validateScenes(scenes);
