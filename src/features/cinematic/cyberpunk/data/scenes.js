// ─────────────────────────────────────────────────────────────────────────────
// Data-driven scene config untuk HISTORICAL CINEMATIC INTRO era 電脳.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Menambah/mengubah scene = cukup edit array ini; logic di CyberCinematic.jsx
// tidak perlu disentuh.
//
// Bentuk scene IDENTIK dengan Heian/Edo/Meiji/Shōwa/多元 → helper timeline
// bersama (timeline.js) dipakai ulang. Mesin yang sama, BAHASA RUPA yang beda.
//
// TEMA: 「常夜」 malam abadi — "puncak peradaban, malam tanpa akhir".
// Storyboard 5 babak (mengikuti pola era lain, isi khas 電脳):
//   gate    → 門: gelap total → satu titik neon menyala → GLITCH masuk (tanpa teks)
//   city    → 街: jalan neon, hujan, kota yang tak pernah tidur
//   peak    → 頂: PUNCAK PERADABAN — menara cahaya, hologram, kota terpadat
//   endless → 終: MALAM TANPA AKHIR — daya turun, kota padam, malam tak usai
//   home    → 家: satu jendela tetap menyala → rumah Nacht & Saku (finale)
//
// Narator = Nacht (wujud asli), lanjutan pola (docs/story.md §4:
//   Heian→Saku, Edo→Nacht, Meiji→Saku, Shōwa→Nacht, 多元→Saku, 電脳→NACHT).
// Bahasa: teks Jepang = elemen utama, terjemahan Indonesia menyusul.
//
// ⚠️ VOICE: `voice` menunjuk /voices/cyberpunk/NN_*.mp3 (9 klip narasi Nacht,
//    voice SINTETIS edge-tts — scripts/generate-cyberpunk-voice.py, pola sama
//    dengan 多元). Guard `scenes.test.js` menjaga keberadaan file. Pemutar klip
//    tetap aman kalau file diganti/hilang (no-op, tanpa error).
// ─────────────────────────────────────────────────────────────────────────────

export const CYBER_SCENES = [
  {
    id: 'gate',
    duration: 8,
    visual: 'gate',
    mood: 'neon',
    lines: [
      // Babak 1: gerbang kota — gelap, lalu satu titik neon menyala dan pecah
      // jadi GLITCH. TANPA teks (murni visual + suara listrik/glitch).
    ],
    audio: {
      cues: [
        { sfx: 'neonHum', at: 1.0, gain: 0.7 },     // satu titik menyala — dengung listrik
        { sfx: 'glitchBurst', at: 2.8, gain: 0.9 }, // GLITCH masuk — RGB-split
        { sfx: 'powerUp', at: 4.4, gain: 0.8 },     // daya naik, kota hidup
        { sfx: 'glitchTick', at: 6.2, gain: 0.7 },  // tik digital sisa
      ],
    },
  },
  {
    id: 'city',
    duration: 13,
    visual: 'city',
    mood: 'neon',
    lines: [
      {
        id: 'yoi',
        jp: 'ようこそ、常夜へ。',
        translation: 'Selamat datang di malam abadi.',
        kind: 'title',
        at: 0.8,
        translationAt: 3.0,
        voice: '/voices/cyberpunk/01_yoi.mp3',
      },
      {
        id: 'machi',
        jp: '眠らない街。',
        translation: 'Kota yang tak pernah tidur.',
        kind: 'sentence',
        at: 4.4,
        translationAt: 6.4,
        voice: '/voices/cyberpunk/02_machi.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'rain', at: 0.4, gain: 0.6 },        // hujan neon
        { sfx: 'neonHum', at: 1.2, gain: 0.6 },     // dengung papan neon
        { sfx: 'glitchBurst', at: 3.2, gain: 0.7 },
        { sfx: 'glitchTick', at: 6.0, gain: 0.6 },
        { sfx: 'dataRush', at: 9.0, gain: 0.6 },    // aliran data di jalan
        { sfx: 'glitchBurst', at: 11.2, gain: 0.7 },
      ],
    },
  },
  {
    id: 'peak',
    duration: 15,
    visual: 'peak',
    mood: 'peak',
    lines: [
      {
        id: 'peak',
        jp: 'これが、文明の果て。',
        translation: 'Inilah ujung peradaban.',
        kind: 'sentence',
        at: 0.8,
        translationAt: 3.0,
        voice: '/voices/cyberpunk/03_peak.mp3',
      },
      {
        id: 'tower',
        jp: '光の塔、空を穿つ。',
        translation: 'Menara cahaya menembus langit.',
        kind: 'sentence',
        at: 5.2,
        translationAt: 7.4,
        voice: '/voices/cyberpunk/04_tower.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'dataRush', at: 0.5, gain: 0.7 },     // PUNCAK — aliran data padat
        { sfx: 'hologram', at: 2.4, gain: 0.7 },
        { sfx: 'glitchBurst', at: 4.0, gain: 0.8 },
        { sfx: 'neonHum', at: 5.6, gain: 0.6 },
        { sfx: 'hologram', at: 7.4, gain: 0.7 },
        { sfx: 'glitchBurst', at: 9.6, gain: 0.8 },
        { sfx: 'dataRush', at: 11.4, gain: 0.7 },
        { sfx: 'glitchSlice', at: 13.0, gain: 0.7 },
      ],
    },
  },
  {
    id: 'endless',
    duration: 14,
    visual: 'endless',
    mood: 'endless',
    lines: [
      {
        id: 'yoru',
        jp: 'だが、夜は明けない。',
        translation: 'Namun, malam tak akan terang.',
        kind: 'sentence',
        at: 0.8,
        translationAt: 3.0,
        voice: '/voices/cyberpunk/05_yoru.mp3',
      },
      {
        id: 'owari',
        jp: '終わらない夜。',
        translation: 'Malam yang tak berakhir.',
        kind: 'sentence',
        at: 5.4,
        translationAt: 7.4,
        voice: '/voices/cyberpunk/06_owari.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'powerDown', at: 0.6, gain: 0.8 },   // daya turun — kota mulai padam
        { sfx: 'dread', at: 2.6, gain: 0.6 },
        { sfx: 'heartbeat', at: 4.4, gain: 0.7 },
        { sfx: 'glitchSlice', at: 6.4, gain: 0.7 },
        { sfx: 'heartbeat', at: 8.6, gain: 0.6 },
        { sfx: 'rain', at: 9.0, gain: 0.4 },        // hujan tinggal — sunyi
        { sfx: 'glitchSlice', at: 11.0, gain: 0.7 },
      ],
    },
  },
  {
    id: 'home',
    duration: 16,
    visual: 'home',
    mood: 'neon',
    lines: [
      {
        id: 'ie',
        jp: 'それでも、家がある。',
        translation: 'Namun, ada rumah.',
        kind: 'sentence',
        at: 0.8,
        translationAt: 3.0,
        voice: '/voices/cyberpunk/07_ie.mp3',
      },
      {
        id: 'era',
        jp: '電脳 — 常夜の果て',
        translation: 'Cyberpunk — ujung malam abadi',
        kind: 'title',
        at: 5.2,
        translationAt: 7.4,
        sub: 'DENNŌ · ENDLESS NIGHT',
        voice: '/voices/cyberpunk/08_era.mp3',
      },
      {
        id: 'welcome',
        jp: 'ようこそ、電脳へ。',
        translation: 'Selamat datang di 電脳.',
        kind: 'welcome',
        at: 9.2,
        translationAt: 11.2,
        voice: '/voices/cyberpunk/09_welcome.mp3',
      },
    ],
    audio: {
      cues: [
        { sfx: 'neonHum', at: 0.6, gain: 0.6 },     // satu jendela menyala
        { sfx: 'hologram', at: 2.2, gain: 0.6 },
        { sfx: 'sealStamp', at: 5.0, gain: 0.7 },   // segel 家 — hanko holo
        { sfx: 'fanfarePop', at: 5.4, gain: 0.8 },  // 題字 電脳
        { sfx: 'shimmer', at: 8.6, gain: 0.7 },
        { sfx: 'gong', at: 10.6, gain: 0.6 },       // 「つづく」
        { sfx: 'glitchBurst', at: 12.4, gain: 0.6 },
      ],
    },
  },
];

// ── Konstanta transisi (sama seperti era lain → bahasa gerak konsisten) ──────
export const XFADE = 1.7;
export const MOUNT_PAD = 0.25;

// ── Helper timeline ──────────────────────────────────────────────────────────
// Logika timeline SATU sumber di `../../timeline` (dipakai semua era).
// Re-export dengan default CYBER_SCENES supaya orkestrator & tes memakai pintu
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

export const totalDuration = (scenes = CYBER_SCENES) => _totalDuration(scenes);
export const sceneStartTimes = (scenes = CYBER_SCENES) => _sceneStartTimes(scenes);
export const sceneAtTime = (scenes, t) => _sceneAtTime(scenes, t);
export const audioCues = (scenes = CYBER_SCENES) => _audioCues(scenes);
export const voiceCues = (scenes = CYBER_SCENES) => _voiceCues(scenes);
export const ambienceTimeline = (scenes = CYBER_SCENES) => _ambienceTimeline(scenes);
export const visibleSceneIndices = (scenes, t, fade = XFADE, pad = MOUNT_PAD) =>
  _visibleSceneIndices(scenes, t, fade, pad);
export const validateScenes = (scenes = CYBER_SCENES) => _validateScenes(scenes);
