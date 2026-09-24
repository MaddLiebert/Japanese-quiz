import { getVoice, pickFile } from '../features/audio/voices.js';

let audioCtx;

const initAudioContext = () => {
  // Guard: node/test tak punya window → kembalikan null (pemutar jadi no-op, tanpa throw).
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  return audioCtx;
};

// ── Voice aktif (di-set ProgressProvider lewat setActiveVoice) ───────────────
// null = tidak ada pack aktif → pakai suara dasar (chime/thud), perilaku lama.
let activeVoiceKey = null;
export const setActiveVoice = (key) => { activeVoiceKey = key || null; };
export const getActiveVoiceKey = () => activeVoiceKey;

// Jenis umpan balik suara untuk satu jawaban.
// Milestone streak → 'streak' (MURNI klip voice Hina, tanpa base generik).
// Selain itu → type apa adanya ('correct' / 'wrong').
export const answerFeedbackKind = (type, onMilestone = false) =>
  (type === 'correct' && onMilestone) ? 'streak' : type;

// Daftar file yang harus diputar untuk satu jenis umpan balik.
// Bisa >1: overlay SFX dulu, lalu klip voice — dua-duanya diputar BARENG oleh pemanggil.
// rng bisa di-inject untuk test.
export const feedbackFiles = (voice, kind, rng = Math.random) => {
  const out = [];
  const ov = pickFile(voice?.overlays?.[kind], rng);
  if (ov) out.push(ov);
  const clip = pickFile(voice?.files?.[kind], rng);
  if (clip) out.push(clip);
  return out;
};

// Daftar SEMUA path milik satu voice (files + overlays) → dipakai untuk preload.
export const voiceFilePaths = (voice) => {
  if (!voice) return [];
  const groups = [
    voice.files?.correct, voice.files?.wrong, voice.files?.streak,
    voice.overlays?.correct, voice.overlays?.wrong,
    voice.technique ? Object.values(voice.technique) : null,
  ];
  const out = [];
  for (const g of groups) {
    if (Array.isArray(g)) for (const p of g) if (p && !out.includes(p)) out.push(p);
  }
  return out;
};

// ── Pemutar file mp3 (mode voice pack) ──────────────────────────────────────
// Cache 1 objek <audio> per path + preload, supaya TIDAK fetch/decode ulang
// tiap jawaban (penyebab suara telat). Elemen di-reuse → mulai instan.
const audioCache = new Map();

const getAudio = (path) => {
  let el = audioCache.get(path);
  if (!el) {
    el = new Audio(path);
    el.preload = 'auto';
    el.volume = 0.9;
    audioCache.set(path, el);
    if (typeof el.load === 'function') el.load();   // warm-up decode
  }
  return el;
};

// Preload semua klip sebuah voice (dipanggil saat pack di-equip).
export const preloadVoice = (voice) => {
  if (typeof window === 'undefined') return 0;
  const paths = voiceFilePaths(voice);
  paths.forEach(getAudio);
  return paths.length;
};

// Prime = unduh TIAP klip sampai byte lengkap (buffer penuh), bukan cuma
// metadata. Tanpa ini, klip baru (mis. tier streak) baru mulai fetch saat
// dipanggil → terdengar telat beberapa ratus ms. `fetcher` bisa di-inject
// untuk test; default fetch. Aman dipanggil berulang (browser cache).
const primedPaths = new Set();
export const primeVoice = (voice, fetcher) => {
  if (typeof window === 'undefined' && !fetcher) return 0;
  const paths = voiceFilePaths(voice);
  const doFetch = fetcher || (typeof fetch === 'function' ? fetch : null);
  if (!doFetch) return 0;
  let n = 0;
  for (const p of paths) {
    if (primedPaths.has(p)) continue;
    primedPaths.add(p);
    n++;
    try {
      doFetch(p).then((r) => (r && typeof r.blob === 'function' ? r.blob() : r)).catch(() => {});
    } catch { /* abaikan */ }
  }
  return n;
};

// ── Durasi tampil GIF Hina ──────────────────────────────────────────────────
// GIF harus tampil SELAMA suara Hina bunyi. clipMs = durasi klip yang diputar
// (dari elemen <audio>). Kalau tak diketahui → fallback per jenis, lalu di-clamp
// supaya tidak kedip (<1.2s) dan tidak nyangkut (>8s).
const GIF_HOLD_FALLBACK = { correct: 1600, wrong: 2000, streak: 2800 };
const GIF_HOLD_MIN = 1600;
const GIF_HOLD_MAX = 8000;

export const hinaGifHoldMs = (kind, clipMs = 0) => {
  const fb = GIF_HOLD_FALLBACK[kind] ?? 2000;
  const ms = (typeof clipMs === 'number' && Number.isFinite(clipMs) && clipMs > 0) ? clipMs : fb;
  return Math.min(GIF_HOLD_MAX, Math.max(GIF_HOLD_MIN, Math.round(ms)));
};

const playFile = (path) => {
  if (typeof window === 'undefined' || !path) return 0;
  try {
    const el = getAudio(path);
    el.currentTime = 0;                              // putar dari awal (reuse)
    el.play().catch((err) => console.warn('Voice play error:', err));
    // Durasi klip (ms) → dipakai untuk menyelaraskan tampilnya GIF Hina.
    const d = el.duration;
    return (Number.isFinite(d) && d > 0) ? d * 1000 : 0;
  } catch (err) {
    console.warn('Voice play error:', err);
  }
  return 0;
};

// Putar semua path BARENG, kembalikan durasi klip TERPANJANG (ms) — 0 kalau tak ada.
const playFiles = (paths) => {
  let maxMs = 0;
  for (const p of paths) maxMs = Math.max(maxMs, playFile(p) || 0);
  return maxMs;
};

// ── Suara dasar (tanpa pack): chime naik & thud turun ───────────────────────
const synthChime = () => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, t);
  osc.frequency.exponentialRampToValueAtTime(659.25, t + 0.1);
  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(0.8, t + 0.03);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc.start(t);
  osc.stop(t + 0.6);
};

const synthThud = () => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.8, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.25);
};

// ── Gong bertingkat (murni) — JANGAN diubah, dites di sfx.params.test.js ─────
const GONG_RATIOS = [1, 2.55, 3.8, 5.2, 6.9, 8.8];
const MAX_LEVEL = 12;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const heatFor = (level) => clamp01(((level || 0) - 1) / (MAX_LEVEL - 1));

export function streakGongParams(level = 0) {
  const heat = heatFor(level);
  const base = 200 + heat * 60;              // 200 -> 260 Hz (audible)
  const dur = 1.0 + heat * 1.6;              // 1.0 -> 2.6 s
  const partialLevel = 2 + heat * (GONG_RATIOS.length - 2);
  const weights = GONG_RATIOS.map((_, i) => clamp01(partialLevel - i));
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;
  const peak = 0.85;

  const partials = GONG_RATIOS
    .map((ratio, i) => ({ freq: base * ratio, gain: peak * (weights[i] / totalW), weight: weights[i] }))
    .filter((p) => p.weight > 0.001);

  const strike = {
    freq: 2200 + heat * 1400,
    gain: clamp01(heat * 1.6 - 0.3) * 0.18,
    dur: 0.06,
  };

  return { heat, base, dur, partials, strike };
}

// ── Synth gong (dipakai voice pack & streak) ────────────────────────────────
const synthGong = (level = 0) => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const { dur, partials, strike } = streakGongParams(level);
  const t = ctx.currentTime;

  partials.forEach((p) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.freq, t);
    osc.frequency.exponentialRampToValueAtTime(p.freq * 0.96, t + dur);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(p.gain, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  });

  if (strike.gain > 0.001) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(strike.freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(strike.gain, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + strike.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + strike.dur + 0.02);
  }
};

// ── API publik ──────────────────────────────────────────────────────────────
// Semua mengembalikan durasi klip (ms) supaya efek visual (GIF Hina) bisa
// tampil selama suaranya berbunyi. 0 = tak ada klip (synth / tanpa pack).
export const playCorrectSound = () => {
  // Tanpa pack aktif → suara dasar (chime).
  if (!activeVoiceKey) { synthChime(); return 0; }
  const paths = feedbackFiles(getVoice(activeVoiceKey), 'correct');
  // Putar SEMUA (overlay + klip voice) bersamaan.
  if (paths.length) return playFiles(paths);
  synthChime();
  return 0;
};

export const playWrongSound = () => {
  if (!activeVoiceKey) { synthThud(); return 0; }
  const paths = feedbackFiles(getVoice(activeVoiceKey), 'wrong');
  if (paths.length) return playFiles(paths);
  synthThud();
  return 0;
};

// Voice khusus milestone streak (dipakai EffectContext saat pack aktif).
// level milestone (1..12, boleh pecahan dari streakSoundLevel) → indeks tier streak (0..5).
// 50 = tier 4 (indeks 3, sendiri), 100 = tier 6 (indeks 5, sendiri).
// Sengaja pakai array, BUKAN pembagian rata: Math.floor((level-1)/2) menaruh streak 60
// di tier yang sama dengan 50 → kalimat 「五十連続」 ikut keputar di 60.
export const STREAK_TIER_BY_LEVEL = [0, 0, 1, 1, 2, 2, 3, 4, 4, 4, 4, 5];

export const streakTierIndex = (level = 0) => {
  const lvl = Math.min(12, Math.max(1, Math.floor(level))); // 1..12
  return STREAK_TIER_BY_LEVEL[lvl - 1];
};

// Daftar file untuk milestone streak: HANYA klip voice Hina — sengaja TANPA base
// SFX (mis. rightanswer) supaya yang terdengar benar-benar SUARA HINA, bukan bunyi
// generik. Kalau tidak ada klip streak → [] (pemanggil fallback synth).
// Klip streak dipilih lewat pickStreakClip (50 & 100 tetap klip khusus, sisanya
// ROTASI lewat kandidat umum pakai `cursor` → tidak pernah mengulang klip sama).
// Kandidat umum: 0「いい調子」2「止まらないね」4「もう誰も止められない」.
// Sengaja BUKAN [0,0,1,1,2,2,...] (itu sebabnya dulu milestone 3 & 5 bunyi sama).
// Indeks 1 (streak_2 =「すごいすごい」) SENGAJA tidak ikut rotasi: klip itu dipakai
// sebagai sorakan di layar hasil, jadi kalau ikut rotasi akan terdengar DUA KALI
// (sekali saat milestone, sekali lagi di layar hasil).
export const STREAK_SPECIAL_INDEX = { 3: 3, 5: 5 };
export const STREAK_COMMON_POOL = [0, 2, 4];

export const pickStreakClip = (streakFiles, level = 0, cursor = 0) => {
  if (!Array.isArray(streakFiles) || streakFiles.length === 0) return { index: -1, path: null };
  const cur = Math.abs(Math.floor(cursor)) || 0;
  // Bukan 6 tier (daftar custom) → geser lurus, tetap tidak mengulang berturut.
  if (streakFiles.length !== 6) {
    const index = cur % streakFiles.length;
    return { index, path: streakFiles[index] };
  }
  const tier = streakTierIndex(level);
  if (tier === 3 || tier === 5) {                 // streak 50 / 100 → klip khusus
    const index = STREAK_SPECIAL_INDEX[tier];
    return { index, path: streakFiles[index] };
  }
  const index = STREAK_COMMON_POOL[cur % STREAK_COMMON_POOL.length];
  return { index, path: streakFiles[index] };
};

let streakClipCursor = 0;   // rotasi klip streak antar milestone

// Milestone = HANYA klip voice Hina (tanpa base generik) → bunyinya suara Hina.
export const streakPlaylist = (voice, level = 0, cursor = streakClipCursor) => {
  const streakFiles = voice?.files?.streak;
  if (!Array.isArray(streakFiles) || streakFiles.length === 0) return [];
  const clip = pickStreakClip(streakFiles, level, cursor).path;
  return clip ? [clip] : [];
};

export const playStreakSound = (level = 0) => {
  if (!activeVoiceKey) { synthGong(level); return 0; }
  const paths = streakPlaylist(getVoice(activeVoiceKey), level);
  streakClipCursor += 1;   // milestone berikutnya pakai klip berikutnya (variatif)
  if (paths.length) return playFiles(paths);
  synthGong(level);
  return 0;
};

// Putar satu klip suara bebas (mis. sorakan "sugoi" di layar hasil kuis).
// Pemanggil (HinaResultSticker) sudah memastikan pack visual 'hina' aktif.
// Kembalikan durasi klip (ms); 0 kalau gagal/tak ada.
export const playClipFile = (path) => playFile(path);

// ── Suara mesin slot gacha ──────────────────────────────────────────────────
// Parameter murni (dites di sfx.gacha.test.js).
export function reelTickParams() {
  return { freq: 1400, dur: 0.03, gain: 0.12 };
}

export function fanfareParams(rarity = 'common') {
  const notes = rarity === 'special'
    ? [523.25, 659.25, 783.99, 1046.5, 1318.51]   // C5 E5 G5 C6 E6
    : rarity === 'legendary'
      ? [523.25, 659.25, 783.99, 1046.5]          // C5 E5 G5 C6
      : rarity === 'rare'
        ? [523.25, 659.25, 783.99]                // C5 E5 G5
        : [523.25, 659.25];                       // C5 E5
  return { notes, dur: 0.18, gap: 0.12, gain: 0.5 };
}

// Pemutar (butuh AudioContext; tidak dites di node).
export const playReelTick = () => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const { freq, dur, gain } = reelTickParams();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
};

export const playFanfare = (rarity = 'common') => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const { notes, dur, gap, gain } = fanfareParams(rarity);
  const start = ctx.currentTime;
  notes.forEach((freq, i) => {
    const t = start + i * gap;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  });
};

// ── Suara teknik Gojo (蒼→赫→茈→Domain) ─────────────────────────────────────
// Satu nada "glide" per teknik, meniru gerak efek visualnya:
//   ao            = partikel HISAP ke dalam   → nada NAIK   (220→660 Hz)
//   aka           = partikel LEDAK ke luar    → nada TURUN  (660→220 Hz)
//   murasaki      = dua aliran MENYATU        → naik, timbre kasar (sawtooth)
//   domain/zenith = gelombang domain          → bass naik, makin panjang & terang
// Murni & deterministik → dites di node (sfx.gojo.test.js). Bisa di-tune nanti.
export const GOJO_TONES = {
  ao:            { type: 'sine',     from: 220, to: 660,    dur: 0.55, gain: 0.35 },
  aka:           { type: 'triangle', from: 660, to: 220,    dur: 0.50, gain: 0.40 },
  murasaki:      { type: 'sawtooth', from: 392, to: 523.25, dur: 0.75, gain: 0.40 },
  domain:        { type: 'sine',     from: 110, to: 220,    dur: 1.20, gain: 0.45 },
  domain_zenith: { type: 'sine',     from: 110, to: 330,    dur: 1.60, gain: 0.50 },
};

export const gojoSoundParams = (technique) => GOJO_TONES[technique] || null;

// Daftar file untuk SATU jawaban Gojo: SFX teknik + klip voice, diputar BARENG.
//   benar (kind='correct'): [SFX teknik (ao/aka/murasaki/domain), voice correct]
//   salah (kind='wrong')  : [voice wrong] saja (teknik null → tak ada SFX)
// rng bisa di-inject untuk test. Path yang null otomatis dibuang.
export const gojoAnswerFiles = (kind, technique, voice = getVoice('gojo'), rng = Math.random) => {
  const out = [];
  if (kind === 'correct') {
    const tech = gojoTechniqueFile(technique, voice);
    if (tech) out.push(tech);
    const clip = pickFile(voice?.files?.correct, rng);
    if (clip) out.push(clip);
  } else {
    const clip = pickFile(voice?.files?.wrong, rng);
    if (clip) out.push(clip);
  }
  return out;
};

// Putar SEMUA file jawaban Gojo bareng; kembalikan durasi klip terpanjang (ms).
export const playGojoAnswer = (kind, technique, voice = activeVoiceKey ? getVoice(activeVoiceKey) : getVoice('gojo')) => {
  const files = gojoAnswerFiles(kind, technique, voice);
  if (files.length) return playFiles(files);
  // tak ada file (mis. aset belum ada) → fallback: synth teknik / thud.
  if (kind === 'correct') return playGojoSound(technique, voice);
  synthThud();
  return 0;
};

// Path file SFX teknik Gojo dari registry voice (default: VOICES.gojo).
// teknik null/tak dikenal → null.
export const gojoTechniqueFile = (technique, voice = getVoice('gojo')) =>
  (voice && voice.technique && voice.technique[technique]) || null;

// Putar SFX teknik Gojo: utamakan FILE mp3 asli (public/voices/gojo/);
// kalau file tak ada → fallback synth (GOJO_TONES). Aman di node (→0).
export const playGojoSound = (technique, voice = activeVoiceKey ? getVoice(activeVoiceKey) : getVoice('gojo')) => {
  const file = gojoTechniqueFile(technique, voice);
  if (file) return playFiles([file]);
  const p = gojoSoundParams(technique);
  if (!p) { synthThud(); return 0; }
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = p.type;
  osc.frequency.setValueAtTime(p.from, t);
  osc.frequency.exponentialRampToValueAtTime(p.to, t + p.dur * 0.8);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(p.gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.05);
  return 0;
};
