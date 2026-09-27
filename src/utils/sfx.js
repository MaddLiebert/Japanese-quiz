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
    voice.clips,   // klip jalur khusus (mis. Gojo: ao/aka/ryoiki) — tetap di-preload
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

// ── Dentuman domain 領域展開 (cinematic, BUKAN voice) ───────────────────────
// kind: 'cast' (saat tombol ditekan) | 'bang' (saat bigbang di tengah).
// Murni synth: sweep sine turun (dentuman) + burst noise lowpass (desis ruang)
// + PUNCH mid (triangle pendek) — v2 tuning: sub-bass 28-92Hz tidak terdengar
// di speaker HP, punch mid inilah yang bikin "nendang" di device asli.
export function domainBoomParams(kind = 'cast') {
  const bang = kind === 'bang';
  return {
    freqStart: bang ? 160 : 92,
    freqEnd: bang ? 36 : 28,
    dur: bang ? 1.4 : 1.0,
    gain: bang ? 0.62 : 0.5,
    noiseGain: bang ? 0.2 : 0.1,
    noiseDur: bang ? 0.5 : 0.3,
    punchFreq: bang ? 240 : 190,
    punchDur: bang ? 0.28 : 0.22,
    punchGain: bang ? 0.34 : 0.26,
  };
}

export const playDomainBoom = (kind = 'cast') => {
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const p = domainBoomParams(kind);
  const t = ctx.currentTime;

  // Sweep turun = dentuman.
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(p.freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(p.freqEnd, t + p.dur);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(p.gain, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.05);

  // Desis noise (hanya kalau noiseGain > 0).
  if (p.noiseGain > 0.001) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * p.noiseDur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const nf = ctx.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.setValueAtTime(900, t);
    nf.frequency.exponentialRampToValueAtTime(120, t + p.noiseDur);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(p.noiseGain, t);
    ng.gain.exponentialRampToValueAtTime(0.0008, t + p.noiseDur);
    src.connect(nf);
    nf.connect(ng);
    ng.connect(ctx.destination);
    src.start(t);
  }

  // PUNCH mid (v2): triangle pendek di 190-240Hz — decay cepat seperti "thump".
  // Inilah yang terdengar "nendang" di speaker HP (sweep sub-bass di bawahnya
  // sering tidak diputar speaker kecil).
  if (p.punchGain > 0.001) {
    const po = ctx.createOscillator();
    const pg = ctx.createGain();
    po.type = 'triangle';
    po.frequency.setValueAtTime(p.punchFreq, t);
    po.frequency.exponentialRampToValueAtTime(p.punchFreq * 0.6, t + p.punchDur);
    pg.gain.setValueAtTime(0, t);
    pg.gain.linearRampToValueAtTime(p.punchGain, t + 0.008);
    pg.gain.exponentialRampToValueAtTime(0.0008, t + p.punchDur);
    po.connect(pg);
    pg.connect(ctx.destination);
    po.start(t);
    po.stop(t + p.punchDur + 0.02);
  }
  return Math.round(p.dur * 1000);
};

// ── Suara khusus Gojo (pack_07) ─────────────────────────────────────────────
// Teknik diputar DETERMINISTIK (bukan pickFile acak): 蒼 → ao.mp3, 赫 → aka.mp3.
// 茈 (murasaki) belum punya klip — GIF murasaki yang tampil, jadi senyap.
export const GOJO_TECHNIQUE_FILES = {
  ao: '/voices/gojo/ao.mp3',
  aka: '/voices/gojo/aka.mp3',
  murasaki: '/voices/gojo/Murasaki.mp3',
};

export const playGojoTechnique = (technique) => {
  const path = GOJO_TECHNIQUE_FILES[technique];
  return path ? playFile(path) : 0;
};

// Cast 領域展開 — klip voice Gojo (diputar bareng dentuman oleh EffectProvider).
export const GOJO_CAST_FILE = '/voices/gojo/ryoiki tenkai.mp3';
export const playGojoCast = () => playFile(GOJO_CAST_FILE);

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

// Pemutar nada berurutan (dipakai fanfare gacha & chime bar 呪力 penuh — DRY).
const playNotes = (notes, dur, gap, gain) => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
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

export const playFanfare = (rarity = 'common') => {
  const { notes, dur, gap, gain } = fanfareParams(rarity);
  playNotes(notes, dur, gap, gain);
};

// ── Ambience & SFX tambahan Gojo (pack_07) — bola, bar, domain ──────────────
// Prinsip: setiap momen VISUAL dapat lapisan SUARA non-voice supaya scene terasa
// hidup (bukan cuma klip suara Gojo). Semua angka murni & deterministik → dites
// di sfx.gojoAmbience.test.js. Pemutar = no-op di node (guard window).

// AudioContext untuk modul ambience (gojoAmbience.js) — jangan buat context baru.
export const getAudioContext = () => initAudioContext();

// Burst noise pendek (desis/angin). Sengaja TIDAK me-refactor playDomainBoom
// (kode lama sudah stabil & punya test sendiri) — helper ini untuk pemutar baru.
const noiseBurst = (ctx, t, { dur, gain, type = 'lowpass', fromHz = 900, toHz = 120 }) => {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(fromHz, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(30, toHz), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(ctx.destination);
  src.start(t);
};

// ── Bola 蒼/赫: suara saat muncul ───────────────────────────────────────────
// ao = "hisap" (nada NAIK + desis bandpass tinggi) · aka = "ledak" (nada TURUN + desis berat).
export const ballAppearParams = (technique) => {
  if (technique === 'ao') return { type: 'sine', from: 170, to: 560, dur: 0.6, gain: 0.16, airGain: 0.05, airHz: 1600 };
  if (technique === 'aka') return { type: 'sawtooth', from: 420, to: 110, dur: 0.5, gain: 0.18, airGain: 0.07, airHz: 900 };
  return null;
};

export const playBallSound = (technique) => {
  const p = ballAppearParams(technique);
  if (!p || typeof window === 'undefined') return 0;
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = p.type;
  osc.frequency.setValueAtTime(p.from, t);
  osc.frequency.exponentialRampToValueAtTime(p.to, t + p.dur * 0.85);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(p.gain, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.05);
  noiseBurst(ctx, t, { dur: p.dur * 0.7, gain: p.airGain, type: 'bandpass', fromHz: p.airHz, toHz: p.airHz * 0.4 });
  return Math.round(p.dur * 1000);
};

// ── 茈 (murasaki): riser sebelum tabrakan + impact saat bola bertemu ────────
// dur riser = 0.42s = durasi slide bola ke tengah (d0 di GojoBurst/GojoSpheres).
export const murasakiRiserParams = () => ({
  type: 'sawtooth', from: 180, to: 1500, dur: 0.42, gain: 0.15,
  filterFrom: 350, filterTo: 2600,
  impact: { freqStart: 150, freqEnd: 40, dur: 0.9, gain: 0.3, noiseGain: 0.1 },
});

export const playMurasakiRiser = () => {
  if (typeof window === 'undefined') return 0;
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const p = murasakiRiserParams();
  const t = ctx.currentTime;

  // Riser: sweep naik + filter membuka.
  const osc = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = p.type;
  osc.frequency.setValueAtTime(p.from, t);
  osc.frequency.exponentialRampToValueAtTime(p.to, t + p.dur);
  f.type = 'lowpass';
  f.frequency.setValueAtTime(p.filterFrom, t);
  f.frequency.exponentialRampToValueAtTime(p.filterTo, t + p.dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(p.gain, t + p.dur * 0.9);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur + 0.06);
  osc.connect(f);
  f.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.1);

  // Impact: tepat saat kedua bola bertemu (bareng ledakan visual + klip 茈).
  const imp = p.impact;
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(imp.freqStart, t + p.dur);
  osc2.frequency.exponentialRampToValueAtTime(imp.freqEnd, t + p.dur + imp.dur);
  g2.gain.setValueAtTime(0, t + p.dur);
  g2.gain.linearRampToValueAtTime(imp.gain, t + p.dur + 0.015);
  g2.gain.exponentialRampToValueAtTime(0.0008, t + p.dur + imp.dur);
  osc2.connect(g2);
  g2.connect(ctx.destination);
  osc2.start(t + p.dur);
  osc2.stop(t + p.dur + imp.dur + 0.05);
  noiseBurst(ctx, t + p.dur, { dur: 0.4, gain: imp.noiseGain, type: 'lowpass', fromHz: 800, toHz: 90 });
  return Math.round((p.dur + imp.dur) * 1000);
};

// ── Bar 呪力: tick naik tiap +1 benar + chime saat penuh ────────────────────
// Batas 20 = GOJO_ULT_THRESHOLD (gojoFx.js); kesamaannya dikunci di test.
const CURSE_TICK_MAX = 20;

export const curseTickParams = (charge = 1) => {
  const n = Number(charge);
  const c = Math.min(CURSE_TICK_MAX, Math.max(1, Number.isFinite(n) ? Math.floor(n) : 1));
  return { freq: 520 + (c - 1) * 36, dur: 0.055, gain: 0.09, type: 'triangle' };
};

export const playCurseTick = (charge = 1) => {
  if (typeof window === 'undefined') return 0;
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const p = curseTickParams(charge);
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = p.type;
  osc.frequency.setValueAtTime(p.freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(p.gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.02);
  return Math.round(p.dur * 1000);
};

export const curseReadyParams = () => ({ notes: [659.25, 987.77], dur: 0.16, gap: 0.1, gain: 0.2 });

export const playCurseReady = () => {
  if (typeof window === 'undefined') return 0;
  const p = curseReadyParams();
  playNotes(p.notes, p.dur, p.gap, p.gain);
  return Math.round((p.notes.length * p.gap + p.dur) * 1000);
};

// ── Domain padam (jawab salah / waktu habis) ────────────────────────────────
export const domainCollapseParams = (kind = 'wrong') => {
  const timeout = kind === 'timeout';
  return {
    freqStart: timeout ? 180 : 240,
    freqEnd: timeout ? 46 : 52,
    dur: timeout ? 1.6 : 1.1,
    gain: timeout ? 0.22 : 0.32,
    noiseGain: timeout ? 0.07 : 0.11,
  };
};

export const playDomainCollapse = (kind = 'wrong') => {
  if (typeof window === 'undefined') return 0;
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const p = domainCollapseParams(kind);
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(p.freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(p.freqEnd, t + p.dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(p.gain, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.05);
  noiseBurst(ctx, t, { dur: p.dur * 0.4, gain: p.noiseGain, type: 'lowpass', fromHz: 700, toHz: 90 });
  return Math.round(p.dur * 1000);
};

// ── Cue halus 六眼 membuka ──────────────────────────────────────────────────
export const domainCueParams = (kind) => (kind === 'eyes'
  ? { notes: [1318.51, 1567.98], dur: 0.22, gap: 0.09, gain: 0.07 }
  : null);

export const playDomainCue = (kind) => {
  const p = domainCueParams(kind);
  if (!p || typeof window === 'undefined') return 0;
  playNotes(p.notes, p.dur, p.gap, p.gain);
  return Math.round((p.notes.length * p.gap + p.dur) * 1000);
};

// ── Rencana ambience (dipakai gojoAmbience.js; murni → dites) ───────────────
// BGM 領域展開: drone bass (55/110Hz) + pad triangle yang filternya dibuka-tutup
// LFO pelan (0.06Hz) → terasa "ruang bernapas", bukan lagu.
// v2 (tuning user): level dinaikkan + konten mid ditambah — speaker HP/laptop
// tidak memutar 55Hz, jadi BGM v1 "hilang" di device asli.
export const domainBgmPlan = () => ({
  level: 0.18,           // master — jelas kedengaran, tetap di bawah voice (0.18 vs 1.0)
  fadeInMs: 1600,
  fadeOutMs: 900,
  drone: { freqs: [55, 110], detune: [0, -5], gain: 0.45 },
  pad: { type: 'triangle', freqs: [165, 220, 330], filterHz: 900, lfoHz: 0.06, lfoDepth: 260, gain: 0.42 },
});

// Hum bola persist: ao = desir tinggi (highpass), aka = gemuruh rendah + crackle (bandpass).
export const ballHumPlan = (balls = {}) => {
  const out = {};
  if (balls.ao) {
    out.ao = {
      level: 0.05, fadeInMs: 900,
      osc: { type: 'sine', freq: 330, gain: 0.5 },
      tremolo: { hz: 0.4, depth: 0.18 },
      noise: { filterType: 'highpass', filterHz: 1200, gain: 0.05 },
    };
  }
  if (balls.aka) {
    out.aka = {
      level: 0.055, fadeInMs: 900,
      osc: { type: 'sawtooth', freq: 92, gain: 0.4 },
      tremolo: { hz: 0.55, depth: 0.22 },
      noise: { filterType: 'bandpass', filterHz: 1400, gain: 0.08 },
    };
  }
  return out;
};
