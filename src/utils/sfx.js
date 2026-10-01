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

const playFile = (path, startAt = 0) => {
  if (typeof window === 'undefined' || !path) return 0;
  try {
    const el = getAudio(path);
    // startAt > 0 = lewati leading-silence klip (mis. fuga 0.46 s) supaya suara
    // TIDAK kerasa telat; durasi balik dikurangi offset biar hold tetap pas.
    const off = Number.isFinite(startAt) && startAt > 0 ? startAt : 0;
    const start = () => {
      try { el.currentTime = off; } catch { /* metadata belum siap */ }
      el.play().catch((err) => console.warn('Voice play error:', err));
    };
    if (el.readyState >= 1) start();
    else el.addEventListener('loadedmetadata', start, { once: true });
    // Durasi klip (ms) → dipakai untuk menyelaraskan tampilnya GIF Hina.
    const d = el.duration;
    return (Number.isFinite(d) && d > 0) ? Math.max(0, (d - off) * 1000) : 0;
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
// 茈 → Murasaki.mp3 (klip asli; GIF 茈 ikut tampil bareng).
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

// ── Suara khusus Yuji (pack_09) ─────────────────────────────────────────────
// Teknik diputar DETERMINISTIK lewat klip (pola sama Gojo) — bukan pickFile acak.
export const YUJI_TECHNIQUE_FILES = {
  keiteiken: '/voices/yuji/keiteiken.mp3',
  manjigeri: '/voices/yuji/manjigeri.mp3',
  kokusen: '/voices/yuji/kokusen.mp3',
  senketsu: '/voices/yuji/senketsu.mp3',
  kai: '/voices/yuji/kai.mp3',
  hachi: '/voices/yuji/hachi.mp3',
  fuga: '/voices/yuji/fuga.mp3',
  zakome: '/voices/yuji/zakome.mp3',
};

// Lead-silence per teknik (detik) — diukur RMS Web Audio; fuga = 0.46 s
// (single source: `YUJI_FUGA_LEAD_S` di yujiFx.js, di-assert tesnya).
export const YUJI_LEAD_S = { fuga: 0.46 };

export const playYujiTechnique = (technique) => {
  const path = YUJI_TECHNIQUE_FILES[technique];
  if (!path) return 0;
  const lead = YUJI_LEAD_S[technique] || 0;
  return playFile(path, lead);
};

// ── Suara khusus Sukuna (pack_14) ───────────────────────────────────────────
// Jurus diputar DETERMINISTIK lewat klip (pola Gojo/Yuji). Leading silence
// semua klip ≤0.24s → TIDAK perlu skip offset (beda dari fuga Yuji 0.46s).
export const SUKUNA_TECHNIQUE_FILES = {
  kumo_no_ito: '/voices/sukuna/kumo_no_ito.mp3',
  nue: '/voices/sukuna/nue.mp3',
  furube: '/voices/sukuna/furube.mp3',
  ryuurin: '/voices/sukuna/ryuurin.mp3',
  sekai_zangeki: '/voices/sukuna/sekai_zangeki.mp3',
  ryouiki_tenkai: '/voices/sukuna/ryouiki_tenkai.mp3',
};

export const playSukunaTechnique = (technique) => {
  const path = SUKUNA_TECHNIQUE_FILES[technique];
  return path ? playFile(path) : 0;
};

// ── Suara khusus Megumi (pack_10) — 十種影法術 ───────────────────────────────
// Jurus diputar DETERMINISTIK lewat klip (pola Gojo/Yuji/Sukuna).
// Lead-silence (hasil ukur RMS 29/09): gyokuken 0.14 · nue 0.15 · orochi 0.13
// (≤0.24 → tanpa skip, pola Sukuna); bansou 0.35 · kosou 0.41 → di-skip supaya
// suara tidak kerasa telat. mahoraga TIDAK di-skip: timeline cinematic 魔虚羅
// di-anchor dari t=0 ke klip chant (skip akan menggeser semua sync).
export const MEGUMI_TECHNIQUE_FILES = {
  gyokuken: '/voices/megumi/gyokuken.mp3',
  nue: '/voices/megumi/nue.mp3',
  orochi: '/voices/megumi/orochi.mp3',
  bansou: '/voices/megumi/bansou.mp3',
  kosou: '/voices/megumi/kosou.mp3',
  mahoraga: '/voices/megumi/mahoraga.mp3',
};

export const MEGUMI_LEAD_S = { bansou: 0.35, kosou: 0.41 };

export const playMegumiTechnique = (technique) => {
  const path = MEGUMI_TECHNIQUE_FILES[technique];
  if (!path) return 0;
  const lead = MEGUMI_LEAD_S[technique] || 0;
  return playFile(path, lead);
};


// ── API publik ──────────────────────────────────────────────────────────────
// Semua mengembalikan durasi klip (ms) supaya efek visual (GIF Hina) bisa
// tampil selama suaranya berbunyi. 0 = tak ada klip (synth / tanpa pack).
export const playCorrectSound = () => {
  // Tanpa pack aktif → suara dasar (chime).
  if (!activeVoiceKey) { synthChime(); return 0; }
  const voice = getVoice(activeVoiceKey);
  if (voice?.silent) return 0;   // pack senyap (klip dihapus) — TANPA fallback synth
  const paths = feedbackFiles(voice, 'correct');
  // Putar SEMUA (overlay + klip voice) bersamaan.
  if (paths.length) return playFiles(paths);
  synthChime();
  return 0;
};

export const playWrongSound = () => {
  if (!activeVoiceKey) { synthThud(); return 0; }
  const voice = getVoice(activeVoiceKey);
  if (voice?.silent) return 0;   // pack senyap — TANPA fallback synth
  const paths = feedbackFiles(voice, 'wrong');
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
// OscillatorNode HANYA menerima 4 bentuk gelombang dasar. Nama tipe FILTER
// (bandpass dll) yang bocor ke osc.type diabaikan Chrome + memicu warning
// console tiap pemutaran — bug ketangkap di verifikasi browser T6 (lolos unit
// test, pelajaran Nobara T6). Fallback 'sine' = perilaku lama saat assignment
// diabaikan, jadi bunyi tidak berubah — hanya warning yang hilang.
export const sanitizeOscType = (t) =>
  (t === 'sine' || t === 'square' || t === 'sawtooth' || t === 'triangle') ? t : 'sine';

// (kode lama sudah stabil & punya test sendiri) — helper ini untuk pemutar baru.
const noiseBurst = (ctx, t, { dur, gain, type = 'lowpass', fromHz = 900, toHz = 120, out = null }) => {
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
  // `out` opsional (BGM master) — default langsung ke speaker.
  g.connect((out && typeof out.connect === 'function') ? out : ctx.destination);
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

// ── BGM 伏魔御廚子 (domain Sukuna) — "mencekam khas Sukuna" ─────────────────
// Kritik user 28/09: "tambahin bgm mencekam khas sukuna buat domain dia".
// Resep (referensi tema Sukuna di anime — taiko berat + drone + kuil):
//   • organ gelap  : saw 55/82.41/110Hz lewat lowpass 320 + swell LFO pelan
//                    (82.41 = E2 → tritone gelap dari 55/110 = A1/A2)
//   • drone        : 2 sine nyaris sama (beat pelan, "hidup") + sub 41.2Hz
//   • taiko        : pola 16 step × 0.5 dtk = loop 8 dtk, aksen tiap 2 dtk
//   • motif koto   : hirajoshi (A B C E F) turun — nada "tanda bahaya"
//   • bel kuil     : inharmonik, tiap 4 dtk
//   • bisikan 呪詞 : noise bandpass termodulasi pelan
export const SUKUNA_BGM_LOOP_STEPS = 16;
export const SUKUNA_BGM_STEP_S = 0.5;

export const sukunaBgmPlan = () => ({
  level: 0.20,            // spec: level 0.20 (sedikit lebih tebal dari Gojo 0.18)
  fadeInMs: 1600,         // spec
  fadeOutMs: 900,         // spec
  drone: { freqs: [55, 110, 41.2], detune: [0, -6, 3], gain: 0.5 },
  pad: { type: 'triangle', freqs: [165, 220, 330], filterHz: 780, lfoHz: 0.05, lfoDepth: 300, gain: 0.4 },
  // Organ gelap: saw tebal di register rendah, dibuka-tutup swell pelan.
  organ: { type: 'sawtooth', freqs: [55, 82.41, 110], filterHz: 320, q: 1.2, swellHz: 0.045, swellDepth: 120, gain: 0.32 },
  // Taiko: pola loop 16 step (0.5 dtk/step = 8 dtk). Aksen = pukulan ganda berat.
  taiko: {
    steps: [0, 3, 4, 7, 8, 11, 12, 14],
    accents: [0, 4, 8, 12],
    loopSteps: SUKUNA_BGM_LOOP_STEPS,
    stepS: SUKUNA_BGM_STEP_S,
  },
  // Motif koto hirajoshi (A B C E F) — 8 nada turun, satu per 2 step (1 dtk).
  motif: {
    notes: [220, 261.63, 329.63, 349.23, 329.63, 261.63, 246.94, 220],
    stepEvery: 2,
  },
  bellEveryMs: 4000,      // bel kuil tiap 4 dtk (spec)
  whisper: { filterType: 'bandpass', filterHz: 620, q: 0.8, modHz: 0.11, gain: 0.05 },
});

// Taiko: pukulan berat (membrane) — sine turun cepat + noise kulit tipis.
// accent = pukulan ganda (2 hantaman beruntun) untuk step berat.
export const sukunaTaikoParams = (accent = false) => (accent
  ? {
    hit: { type: 'sine', fromHz: 92, toHz: 38, dur: 0.42, gain: 0.34, noiseGain: 0.1 },
    hit2: { delayMs: 170, type: 'sine', fromHz: 78, toHz: 34, dur: 0.5, gain: 0.28, noiseGain: 0.08 },
  }
  : { hit: { type: 'sine', fromHz: 104, toHz: 46, dur: 0.3, gain: 0.22, noiseGain: 0.06 } });

// Koto (motif hirajoshi): pluck triangle + oktaf saw tipis, bend turun halus,
// lowpass menutup cepat → karakter "petik dawai" yang gelap.
export const sukunaMotifParams = () => ({
  type: 'triangle',
  overtone: 'sawtooth',
  overtoneGain: 0.18,
  dur: 1.1,
  gain: 0.2,
  bend: -12,              // cents, turun halus (koto)
  filterHz: 2200,
  filterCloseS: 0.9,
});

// ── Ambience Megumi (pack_10): drone bayangan + bisikan 呪詞 — TIDAK ada taiko ──
// (Sukuna = taiko perang; Megumi = sunyi & berat — beda karakter.) Satu titik tune
// (pola sukunaBgmPlan), dipakai src/utils/megumiAmbience.js. Angka = spec §Ambience.
export const MEGUMI_BGM_LOOP_STEPS = 16;
export const MEGUMI_BGM_STEP_S = 0.6;

export const megumiBgmPlan = () => ({
  level: 0.20,            // spec: level 0.20, fadeIn 1600ms, fadeOut 900ms
  fadeInMs: 1600,
  fadeOutMs: 900,
  // Drone bayangan 55/110Hz + sub 41.2Hz (dasar gelap; sama register Sukuna tapi
  // tanpa organ tritone → tidak mencekam, lebih "dalam/berat").
  drone: { freqs: [55, 110, 41.2], detune: [0, -5, 2], gain: 0.52 },
  // Pad gelap: triangle mid (kedengaran di speaker HP) + lowpass napas pelan.
  pad: { type: 'triangle', freqs: [146.83, 196, 293.66], filterHz: 700, lfoHz: 0.04, lfoDepth: 280, gain: 0.42 },
  // Bisikan 呪詞: noise bandpass 200–900Hz termodulasi pelan (spec persis).
  whisper: { filterType: 'bandpass', filterHz: 550, q: 0.9, modHz: 0.09, modDepth: 340, gain: 0.06 },
  // Gema takik roda 八握剣: ketukan kayu pelan tiap 3.2 dtk (penanda adaptasi).
  wheelEveryMs: 3200,
  wheel: { freq: 220, freq2: 176, dur: 0.16, gain: 0.06, noiseGain: 0.02 },
});

export const megumiWheelTickParams = () => megumiBgmPlan().wheel;

// ── SFX one-shot Yuji (pack_09) — TIDAK ada ambience sustained (keputusan desain) ──
// Semua params murni & deterministik -> dites di sfx.yuji.test.js.
// Pemutar = no-op di node (guard window), pola sama playBallSound.
export const impactDoubleParams = () => ({
  hit1: { freq: 190, dur: 0.06, gain: 0.22 },
  gapMs: 100,                                   // jeda khas 逕庭拳 (tok -> TOK)
  hit2: { freq: 150, dur: 0.14, gain: 0.34, noiseGain: 0.06 },
});

export const kickWhooshParams = () => ({ type: 'sawtooth', fromHz: 520, toHz: 120, dur: 0.3, gain: 0.14, noiseGain: 0.1 });

export const blackSparkParams = () => ({
  type: 'square', fromHz: 2600, toHz: 2100, dur: 0.12, gain: 0.14, noiseGain: 0,
  boom: { type: 'sine', fromHz: 120, toHz: 42, dur: 0.5, gain: 0.3, noiseGain: 0.12 },
});

export const bloodCompressParams = () => ({ type: 'sine', fromHz: 220, toHz: 900, dur: 0.45, gain: 0.14, noiseGain: 0.03 });
export const bloodPierceParams = () => ({ type: 'sawtooth', fromHz: 1400, toHz: 120, dur: 0.22, gain: 0.26, noiseGain: 0.1 });
export const possessWhooshParams = () => ({ type: 'sawtooth', fromHz: 80, toHz: 420, dur: 1.1, gain: 0.2, noiseGain: 0.12, subGain: 0.28 });

export const slashParams = (heavy = false) => (heavy
  ? { type: 'sawtooth', fromHz: 900, toHz: 90, dur: 0.3, gain: 0.24, noiseGain: 0.12 }    // 捌
  : { type: 'sawtooth', fromHz: 1800, toHz: 300, dur: 0.16, gain: 0.16, noiseGain: 0.07 }); // 解

export const fugaRoarParams = () => ({ type: 'sawtooth', fromHz: 70, toHz: 240, dur: 1.2, gain: 0.34, noiseGain: 0.18 });
export const fugaCrackleParams = () => ({ hz: 2400, dur: 0.9, gain: 0.08 });

// ── Lapisan SFX tambahan per teknik (biar "hidup", referensi anime) ────────
// Tiap teknik dapat >= 2 lapis: base (sudah ada) + lapisan di bawah ini.
// Referensi desain: 黒閃 di anime = distorsi spasial + crackle listrik + guntur;
// 逕庭拳 = dua bantingan; 卍蹴り = angin berputar + hantaman; 穿血 = jet darah;
// 解/捌 = guntingan tipis vs berat; 開 = ledakan api; Sukuna = bel kuil + detak.

export const keiteikenThumpParams = () => ({ type: 'triangle', fromHz: 210, toHz: 58, dur: 0.22, gain: 0.26, noiseGain: 0.08 });
export const manjigeriSpinParams = () => ({ type: 'sine', fromHz: 180, toHz: 720, dur: 0.26, gain: 0.13, noiseGain: 0.09 });
export const manjigeriCrackParams = () => ({ type: 'square', fromHz: 900, toHz: 110, dur: 0.16, gain: 0.22, noiseGain: 0.12 });

// 黒閃: crackle listrik (beberapa derik cepat) + guntur rendah panjang.
export const kokusenCrackleParams = () => ({ baseHz: 3200, bursts: 4, gapMs: 55, dur: 0.07, gain: 0.13 });
export const kokusenThunderParams = () => ({ type: 'sine', fromHz: 150, toHz: 34, dur: 1.05, gain: 0.3, noiseGain: 0.14 });

export const senketsuJetParams = () => ({ type: 'sawtooth', fromHz: 1800, toHz: 260, dur: 0.34, gain: 0.2, noiseGain: 0.16 });

export const kaiSnipParams = (heavy = false) => (heavy
  ? { type: 'triangle', fromHz: 2600, toHz: 1400, dur: 0.14, gain: 0.2, noiseGain: 0.05 }
  : { type: 'triangle', fromHz: 3400, toHz: 2200, dur: 0.09, gain: 0.15, noiseGain: 0.03 });

export const fugaBoomParams = () => ({ type: 'sine', fromHz: 90, toHz: 32, dur: 1.3, gain: 0.42, noiseGain: 0.2 });

// ── Sukuna masuk (宿儺の器) — lebih MENCEKAM ────────────────────────────────
// Referensi: tema Sukuna di OST = taiko berat + drone rendah + bel kuil.
// Bel kuil = partial INHARMONIK (bukan harmonik) -> kerasa "keramat"/seram.
export const sukunaBellParams = () => ({
  baseHz: 82,
  partials: [1, 2.76, 5.4, 8.93, 13.34],   // rasio inharmonik bel (mirip lonceng kuil)
  dur: 3.2,
  gain: 0.22,
});
export const sukunaHeartParams = () => ({
  beats: [{ atMs: 0, gain: 0.34, hz: 44 }, { atMs: 320, gain: 0.22, hz: 38 }],  // lub-dub
  dur: 0.2,
});
export const sukunaDreadParams = () => ({ fromHz: 58, toHz: 41, dur: 2.6, subGain: 0.3, padGain: 0.14 });

// ── Api takeover (permintaan user: efek api saat Sukuna muncul) ─────────────
// Auman api naik (bandpass 260 -> 1100 Hz = desis "FWOOSH") + bara meletup.
export const fireIgniteParams = () => ({ fromHz: 260, toHz: 1100, dur: 1.5, gain: 0.22, pops: 6, popGain: 0.09, popHz: 1200 });

// Registry lapis per teknik -> satu tempat, gampang di-tune & dites.
export const TECHNIQUE_SFX_LAYERS = {
  keiteiken: ['playImpactDouble', 'playKeiteikenThump'],
  manjigeri: ['playKickWhoosh', 'playManjigeriSpin', 'playManjigeriCrack'],
  kokusen: ['playBlackSpark', 'playKokusenCrackle', 'playKokusenThunder'],
  senketsu: ['playBloodCompress', 'playBloodPierce', 'playSenketsuJet'],
  kai: ['playSlash', 'playKaiSnip'],
  hachi: ['playSlash', 'playKaiSnip'],
  fuga: ['playFugaRoar', 'playFugaBoom', 'playFuga'],
  takeover: ['playPossessWhoosh', 'playSukunaDread', 'playSukunaBell', 'playSukunaHeart', 'playFireIgnite'],
};

export const techniqueSfxLayers = (technique) =>
  Array.isArray(TECHNIQUE_SFX_LAYERS[technique]) ? TECHNIQUE_SFX_LAYERS[technique] : [];

// Helper satu titik: sweep nada + noise burst (DRY semua SFX Yuji).
const sweepNoise = (p, { noise = true } = {}) => {
  if (typeof window === 'undefined' || !p) return 0;
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = sanitizeOscType(p.type || 'sawtooth');
  osc.frequency.setValueAtTime(p.fromHz, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, p.toHz), t + p.dur * 0.85);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(p.gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.05);
  if (noise && p.noiseGain > 0) {
    noiseBurst(ctx, t, { dur: p.dur * 0.8, gain: p.noiseGain, type: 'bandpass', fromHz: p.fromHz * 2, toHz: Math.max(60, p.toHz) });
  }
  return Math.round(p.dur * 1000);
};

export const playKickWhoosh = () => sweepNoise(kickWhooshParams());
export const playKeiteikenThump = () => sweepNoise(keiteikenThumpParams());
export const playManjigeriSpin = () => sweepNoise(manjigeriSpinParams());
export const playManjigeriCrack = () => sweepNoise(manjigeriCrackParams());
export const playSenketsuJet = () => sweepNoise(senketsuJetParams());
export const playKaiSnip = (heavy = false) => sweepNoise(kaiSnipParams(heavy));
export const playFugaBoom = () => sweepNoise(fugaBoomParams());
export const playBloodCompress = () => sweepNoise(bloodCompressParams());
export const playBloodPierce = () => sweepNoise(bloodPierceParams());
export const playSlash = (heavy = false) => sweepNoise(slashParams(heavy));
export const playFugaRoar = () => sweepNoise(fugaRoarParams());

// 黒閃: BZZT nyaring lalu boom rendah (dua lapis).
export const playBlackSpark = () => {
  const p = blackSparkParams();
  const a = sweepNoise(p, { noise: false });
  const b = sweepNoise(p.boom);
  return Math.max(a, b);
};

// 逕庭拳: hit 1 -> jeda 100ms -> hit 2 (lebih kuat). Dijadwalkan di timeline.
export const playImpactDouble = () => {
  if (typeof window === 'undefined') return 0;
  const p = impactDoubleParams();
  const hit = (h) => sweepNoise({ type: 'triangle', fromHz: h.freq, toHz: h.freq * 0.7, dur: h.dur, gain: h.gain, noiseGain: h.noiseGain || 0 });
  hit(p.hit1);
  setTimeout(() => hit(p.hit2), p.gapMs);
  return Math.round((p.hit1.dur + p.gapMs / 1000 + p.hit2.dur) * 1000);
};

// 宿儺の器: aura gelap naik + sub bass (lapisan kedua).
export const playPossessWhoosh = () => {
  const ms = sweepNoise(possessWhooshParams());
  if (typeof window === 'undefined') return 0;
  const p = possessWhooshParams();
  const ctx = initAudioContext();
  if (!ctx) return ms;
  const t = ctx.currentTime;
  const sub = ctx.createOscillator();
  const g = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(46, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(p.subGain, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  sub.connect(g);
  g.connect(ctx.destination);
  sub.start(t);
  sub.stop(t + p.dur + 0.05);
  return ms;
};

// 開: auman api + bara berderak (layer 2, mulai setelah auman — jangan menutupi).
// 黒閃: crackle listrik (derik cepat berulang) + guntur rendah panjang.
export const playKokusenCrackle = () => {
  if (typeof window === 'undefined') return 0;
  const p = kokusenCrackleParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t0 = ctx.currentTime;
  for (let i = 0; i < p.bursts; i++) {
    noiseBurst(ctx, t0 + (i * p.gapMs) / 1000, {
      dur: p.dur, gain: p.gain * (1 - i * 0.15),
      type: 'highpass', fromHz: p.baseHz - i * 300, toHz: p.baseHz * 0.6,
    });
  }
  return p.bursts * p.gapMs + Math.round(p.dur * 1000);
};

export const playKokusenThunder = () => sweepNoise(kokusenThunderParams());

// Sukuna masuk: bel kuil (partial inharmonik) — inti rasa "mencekam".
export const playSukunaBell = () => {
  if (typeof window === 'undefined') return 0;
  const p = sukunaBellParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  for (const ratio of p.partials) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.baseHz * ratio, t);
    const partialGain = p.gain / (1 + ratio * 0.55);   // partial tinggi makin pelan
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(partialGain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur * (1 - ratio / 22));
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + p.dur + 0.1);
  }
  return Math.round(p.dur * 1000);
};

// Detak jantung (lub-dub) — bikin suasana tegang sebelum/di awal kerasukan.
// Api naik + bara meletup (dipakai saat cinematic takeover mulai).
export const playFireIgnite = () => {
  if (typeof window === 'undefined') return 0;
  const p = fireIgniteParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  // Auman: desis bandpass yang MENGUAT (api membesar).
  noiseBurst(ctx, t, { dur: p.dur, gain: p.gain, type: 'bandpass', fromHz: p.fromHz, toHz: p.toHz });
  // Bara meletup: burst pendek nyaring, tersebar acak.
  for (let i = 0; i < p.pops; i++) {
    const at = t + 0.08 + Math.random() * (p.dur * 0.75);
    noiseBurst(ctx, at, { dur: 0.05 + Math.random() * 0.06, gain: p.popGain, type: 'highpass', fromHz: p.popHz, toHz: p.popHz * 0.5 });
  }
  return Math.round(p.dur * 1000) + 300;
};

export const playSukunaHeart = () => {
  if (typeof window === 'undefined') return 0;
  const p = sukunaHeartParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t0 = ctx.currentTime;
  for (const b of p.beats) {
    const t = t0 + b.atMs / 1000;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(b.hz, t);
    osc.frequency.exponentialRampToValueAtTime(b.hz * 0.62, t + p.dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(b.gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + p.dur + 0.05);
  }
  return p.beats[p.beats.length - 1].atMs + Math.round(p.dur * 1000);
};

// Drone rendah "kegelapan" — layer terakhir yang bikin ruangan terasa berat.
export const playSukunaDread = () => {
  if (typeof window === 'undefined') return 0;
  const p = sukunaDreadParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(p.fromHz, t);
  osc.frequency.exponentialRampToValueAtTime(p.toHz, t + p.dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(p.subGain, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.1);
  // Pad oktaf atas biar kedengaran di speaker HP (pelajaran ambience Gojo).
  const pad = ctx.createOscillator();
  const pg = ctx.createGain();
  pad.type = 'triangle';
  pad.frequency.setValueAtTime(p.fromHz * 3, t);
  pg.gain.setValueAtTime(0, t);
  pg.gain.linearRampToValueAtTime(p.padGain, t + 0.2);
  pg.gain.exponentialRampToValueAtTime(0.0008, t + p.dur * 0.9);
  pad.connect(pg);
  pg.connect(ctx.destination);
  pad.start(t);
  pad.stop(t + p.dur);
  return Math.round(p.dur * 1000);
};

export const playFuga = () => {
  const ms = playFugaRoar();
  if (typeof window === 'undefined') return 0;
  const p = fugaCrackleParams();
  const ctx = initAudioContext();
  if (!ctx) return ms;
  noiseBurst(ctx, ctx.currentTime + 0.35, { dur: p.dur, gain: p.gain, type: 'highpass', fromHz: p.hz, toHz: p.hz * 0.5 });
  return ms;
};

// ── SFX jurus Sukuna (pack_14) — 14 fungsi baru, ≥2 lapis per jurus ─────────
// Referensi desain: spec Sukuna.md §SFX. Semua params murni & deterministik
// (dites di sfx.sukuna.test.js); pemutar no-op di node (guard window).
export const webCrackParams = () => ({
  bursts: 4, fromHz: 1800, toHz: 900, gapMs: 42, dur: 0.09, gain: 0.14,
  droneHz: 40, droneGain: 0.16, droneDur: 0.9,
});
export const nueScreamParams = () => ({ type: 'sawtooth', fromHz: 900, toHz: 300, dur: 0.5, gain: 0.2, noiseGain: 0.08 });
export const nueThunderParams = () => ({ type: 'sine', fromHz: 130, toHz: 28, dur: 1.3, gain: 0.36, noiseGain: 0.16 });
export const shadowRustleParams = () => ({ type: 'bandpass', fromHz: 2600, toHz: 500, dur: 0.7, gain: 0.09 });
export const furubeChantParams = () => ({
  droneHz: 55, droneGain: 0.22, dur: 1.8,
  bellPartials: [1, 2.76, 5.4], bellGain: 0.12,
});
export const wheelCreakParams = () => ({ type: 'sawtooth', fromHz: 200, toHz: 90, dur: 0.8, gain: 0.14, noiseGain: 0.06 });
export const giantStepParams = () => ({ type: 'sine', fromHz: 45, toHz: 24, dur: 0.9, gain: 0.34, noiseGain: 0.12 });
export const chantDroneParams = (streak = 21) => {
  const s = Number.isFinite(streak) ? Math.max(21, Math.floor(streak)) : 21;
  const step = Math.min(20, s - 21);   // clamp 20 langkah (+80Hz) — tetap wajar
  return { baseHz: 58, hz: 58 + step * 4, dur: 1.4, gain: 0.2 };
};
export const inkBurnParams = () => ({ crackleHz: 2600, crackleDur: 0.5, crackleGain: 0.1, boomFromHz: 70, boomToHz: 30, boomDur: 0.7, boomGain: 0.26 });
export const riserTensionParams = () => ({ type: 'sawtooth', fromHz: 220, toHz: 880, dur: 0.9, gain: 0.12, noiseGain: 0.06 });
export const worldCutSwingParams = () => ({ type: 'bandpass', fromHz: 1200, toHz: 200, dur: 0.45, gain: 0.2 });
export const spaceTearParams = () => ({ frames: 2, hz: 1800, dur: 0.08, gain: 0.18 });
export const worldCutBoomParams = () => ({ type: 'sine', fromHz: 60, toHz: 22, dur: 1.6, gain: 0.5, noiseGain: 0.22 });
export const silenceAfterParams = () => ({ ms: 400 });

export const playWebCrack = () => {
  if (typeof window === 'undefined') return 0;
  const p = webCrackParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t0 = ctx.currentTime;
  for (let i = 0; i < p.bursts; i++) {
    noiseBurst(ctx, t0 + (i * p.gapMs) / 1000, {
      dur: p.dur, gain: p.gain * (1 - i * 0.12),
      type: 'bandpass', fromHz: p.fromHz - i * 240, toHz: p.toHz,
    });
  }
  // Ekor drone 40Hz — "jaring mengencang".
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(p.droneHz, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(p.droneGain, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + p.droneDur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + p.droneDur + 0.05);
  return p.bursts * p.gapMs + Math.round(p.droneDur * 1000);
};
export const playNueScream = () => sweepNoise(nueScreamParams());
export const playNueThunder = () => sweepNoise(nueThunderParams());
export const playShadowRustle = () => sweepNoise(shadowRustleParams(), { noise: true });

export const playFurubeChant = () => {
  if (typeof window === 'undefined') return 0;
  const p = furubeChantParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  // Drone ritual.
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(p.droneHz, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(p.droneGain, t + 0.1);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.05);
  // Bel inharmonik (ritual).
  for (const ratio of p.bellPartials) {
    const b = ctx.createOscillator();
    const bg = ctx.createGain();
    b.type = 'sine';
    b.frequency.setValueAtTime(p.droneHz * 4 * ratio, t);
    const bgain = p.bellGain / (1 + ratio * 0.5);
    bg.gain.setValueAtTime(0, t);
    bg.gain.linearRampToValueAtTime(bgain, t + 0.01);
    bg.gain.exponentialRampToValueAtTime(0.0008, t + p.dur * 0.8);
    b.connect(bg);
    bg.connect(ctx.destination);
    b.start(t);
    b.stop(t + p.dur);
  }
  return Math.round(p.dur * 1000);
};
export const playWheelCreak = () => sweepNoise(wheelCreakParams());
export const playGiantStep = () => sweepNoise(giantStepParams());

export const playChantDrone = (streak = 21) => {
  const p = chantDroneParams(streak);
  return sweepNoise({ type: 'sine', fromHz: p.hz, toHz: p.hz * 0.92, dur: p.dur, gain: p.gain, noiseGain: 0 }, { noise: false });
};

export const playInkBurn = () => {
  if (typeof window === 'undefined') return 0;
  const p = inkBurnParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  noiseBurst(ctx, t, { dur: p.crackleDur, gain: p.crackleGain, type: 'highpass', fromHz: p.crackleHz, toHz: p.crackleHz * 0.5 });
  sweepNoise({ type: 'sine', fromHz: p.boomFromHz, toHz: p.boomToHz, dur: p.boomDur, gain: p.boomGain, noiseGain: 0.1 }, { noise: true });
  return Math.round((p.crackleDur + p.boomDur) * 1000);
};
export const playRiserTension = () => sweepNoise(riserTensionParams());

export const playWorldCutSwing = () => sweepNoise(worldCutSwingParams(), { noise: true });

export const playSpaceTear = () => {
  if (typeof window === 'undefined') return 0;
  const p = spaceTearParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t0 = ctx.currentTime;
  for (let i = 0; i < p.frames; i++) {
    noiseBurst(ctx, t0 + i * p.dur * 0.6, {
      dur: p.dur, gain: p.gain, type: 'highpass', fromHz: p.hz - i * 500, toHz: p.hz * 0.4,
    });
  }
  return p.frames * Math.round(p.dur * 600);
};

export const playWorldCutBoom = () => sweepNoise(worldCutBoomParams());

// Hening dramatis setelah World Cut — bukan bunyi, tapi bagian dari ritme.
// Node/test = no-op (0) supaya konsisten dengan player lain.
export const playSilenceAfter = () => {
  if (typeof window === 'undefined') return 0;
  const p = silenceAfterParams();
  return p.ms;
};

// ── BGM domain Sukuna: pemain taiko + koto motif ────────────────────────────
// Dipakai scheduler lookahead di sukunaAmbience.js — `at` = waktu ABSOLUT
// (ctx.currentTime + lead) supaya irama tidak goyang karena jitter setTimeout.
// Node/test = no-op (0), pola sama dengan player lain.

// Taiko: pukulan membrane (sine turun cepat + noise kulit tipis). accent =
// pukulan ganda (hentakan berat khas taiko upacara).
// `out` = node tujuan opsional (dipakai BGM: connect ke master gain ambience
// supaya fade-out & ducking ikut berlaku). Default: ctx.destination.
export const playSukunaTaiko = (accent = false, at = null, out = null) => {
  if (typeof window === 'undefined') return 0;
  const p = sukunaTaikoParams(accent);
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t0 = (Number.isFinite(at) ? at : ctx.currentTime);
  const dest = (out && typeof out.connect === 'function') ? out : ctx.destination;

  const hit = (h, at2) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = h.type;
    osc.frequency.setValueAtTime(h.fromHz, at2);
    osc.frequency.exponentialRampToValueAtTime(Math.max(24, h.toHz), at2 + h.dur * 0.85);
    g.gain.setValueAtTime(0, at2);
    g.gain.linearRampToValueAtTime(h.gain, at2 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, at2 + h.dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(at2);
    osc.stop(at2 + h.dur + 0.05);
    if (h.noiseGain > 0) {
      noiseBurst(ctx, at2, { dur: h.dur * 0.5, gain: h.noiseGain, type: 'bandpass', fromHz: h.fromHz * 6, toHz: h.toHz * 3, out: dest });
    }
  };

  hit(p.hit, t0);
  if (p.hit2) hit(p.hit2, t0 + p.hit2.delayMs / 1000);
  const tail = p.hit2 ? p.hit2.delayMs / 1000 + p.hit2.dur : p.hit.dur;
  return Math.round(tail * 1000);
};

// Koto: petikan dawai (triangle + oktaf saw tipis) dengan bend turun halus +
// lowpass menutup cepat → karakter motif 箏 yang gelap (hirajoshi).
// `out` = node tujuan opsional (sama seperti playSukunaTaiko).
export const playSukunaMotif = (freq, at = null, out = null) => {
  if (typeof window === 'undefined') return 0;
  const p = sukunaMotifParams();
  const hz = Number.isFinite(freq) && freq > 0 ? freq : 220;
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t0 = (Number.isFinite(at) ? at : ctx.currentTime);
  const dest = (out && typeof out.connect === 'function') ? out : ctx.destination;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(p.filterHz, t0);
  filter.frequency.exponentialRampToValueAtTime(Math.max(120, p.filterHz * 0.22), t0 + p.filterCloseS);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(p.gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + p.dur);
  filter.connect(g);
  g.connect(dest);

  const osc = ctx.createOscillator();
  osc.type = p.type;
  osc.frequency.setValueAtTime(hz, t0);
  if (osc.detune) osc.detune.setValueAtTime(p.bend, t0);
  osc.connect(filter);
  osc.start(t0);
  osc.stop(t0 + p.dur + 0.05);

  // Oktaf atas (saw tipis) → kilau dawai, tetap di bawah filter yang menutup.
  const ov = ctx.createOscillator();
  const ovg = ctx.createGain();
  ov.type = p.overtone;
  ov.frequency.setValueAtTime(hz * 2, t0);
  ovg.gain.setValueAtTime(p.overtoneGain * p.gain, t0);
  ovg.gain.exponentialRampToValueAtTime(0.0006, t0 + p.dur * 0.6);
  ov.connect(ovg);
  ovg.connect(filter);
  ov.start(t0);
  ov.stop(t0 + p.dur * 0.7);

  return Math.round(p.dur * 1000);
};

// Registry lapis per jurus Sukuna — tiap jurus ≥2 lapis (spec, dites).
export const SUKUNA_TECHNIQUE_SFX_LAYERS = {
  kumo_no_ito: ['playSlash', 'playWebCrack'],
  nue: ['playNueScream', 'playNueThunder', 'playShadowRustle'],
  furube: ['playFurubeChant', 'playWheelCreak', 'playGiantStep'],
  ryuurin: ['playChantDrone', 'playInkBurn', 'playRiserTension'],
  sekai_zangeki: ['playWorldCutSwing', 'playSpaceTear', 'playWorldCutBoom', 'playSilenceAfter'],
  domain: ['playSukunaDread', 'playSukunaBell', 'playDomainBoom'],
};

export const sukunaTechniqueSfxLayers = (technique) =>
  Array.isArray(SUKUNA_TECHNIQUE_SFX_LAYERS[technique]) ? SUKUNA_TECHNIQUE_SFX_LAYERS[technique] : [];

// Nama → fungsi (registry di atas berupa string supaya murni & dites di node).
const SUKUNA_SFX_FNS = {
  playSlash, playWebCrack, playNueScream, playNueThunder, playShadowRustle,
  playFurubeChant, playWheelCreak, playGiantStep, playChantDrone,
  playInkBurn, playRiserTension, playWorldCutSwing, playSpaceTear,
  playWorldCutBoom, playSilenceAfter,
  playSukunaDread, playSukunaBell, playDomainBoom,
};

// Putar SEMUA lapisan SFX satu jurus (urutan registry), kembalikan jumlah lapis
// yang benar-benar terpanggil. Node/test = no-op (semua player return 0).
export const playSukunaTechniqueLayers = (technique, streak = 21) => {
  const layers = sukunaTechniqueSfxLayers(technique);
  let n = 0;
  for (const name of layers) {
    const fn = SUKUNA_SFX_FNS[name];
    if (typeof fn !== 'function') continue;
    if (name === 'playChantDrone') fn(streak);
    else fn();
    n += 1;
  }
  return n;
};

// ── SFX jurus Megumi (pack_10) — 十種影法術 ──────────────────────────────────
// Referensi desain: spec Megumi.md §SFX (bayangan = desir, desis, rumble dalam).
// Semua params murni & deterministik (dites di sfx.megumi.test.js); pemutar
// no-op di node (guard window). Reuse yang sudah ada (playSlash, playWheelCreak,
// playGiantStep, playNueScreech/playNueThunder, playShadowRustle, playDomainBoom).
export const gyokukenParams = () => ({ type: 'sawtooth', fromHz: 420, toHz: 180, dur: 0.6, gain: 0.22, noiseGain: 0.1 });
export const clawSwipeParams = () => ({ swipes: 3, fromHz: 2200, toHz: 600, gapMs: 70, dur: 0.12, gain: 0.17 });
export const orochiHissParams = () => ({ layers: 3, fromHz: 4000, toHz: 800, dur: 1.1, gain: 0.11, gapMs: 90 });
export const orochiRumbleParams = () => ({ type: 'sine', fromHz: 38, toHz: 22, dur: 1.2, gain: 0.34, noiseGain: 0.12 });
export const bansouWaterParams = () => ({ type: 'bandpass', fromHz: 1600, toHz: 300, dur: 0.9, gain: 0.18, noiseGain: 0.14 });
export const bansouTrumpetParams = () => ({ type: 'sawtooth', fromHz: 300, toHz: 140, dur: 0.7, gain: 0.24, noiseGain: 0.08 });
export const kosouRoarParams = () => ({ type: 'sawtooth', fromHz: 260, toHz: 90, dur: 0.9, gain: 0.3, noiseGain: 0.16 });
export const kosouSlashParams = () => ({
  slashes: 3, fromHz: 2600, toHz: 500, gapMs: 80, dur: 0.14, gain: 0.2,
  boom: { type: 'sine', fromHz: 60, toHz: 26, dur: 0.9, gain: 0.34, noiseGain: 0.14 },
});
export const makoraChantParams = () => ({
  droneHz: 55, droneGain: 0.24, dur: 2.2,
  bellPartials: [1, 2.76, 5.4], bellGain: 0.11,
});
export const makoraRoarParams = () => ({ type: 'sine', fromHz: 70, toHz: 30, dur: 1.5, gain: 0.42, noiseGain: 0.18 });
export const adaptFlashParams = () => ({
  chimeHz: 740, chimeGain: 0.16, chimeDur: 0.5,
  shimmerFromHz: 1800, shimmerToHz: 4200, shimmerGain: 0.07, shimmerDur: 0.7,
});
export const swordUnsheatheParams = () => ({ type: 'sawtooth', fromHz: 1200, toHz: 400, dur: 0.55, gain: 0.22, noiseGain: 0.12 });
export const wheelShatterParams = () => ({
  shardHz: 3000, shards: 5, shardDur: 0.09, shardGain: 0.16, gapMs: 40,
  boom: { type: 'sine', fromHz: 80, toHz: 24, dur: 1.1, gain: 0.4, noiseGain: 0.18 },
});
export const shadowSwallowParams = () => ({ type: 'bandpass', fromHz: 500, toHz: 80, dur: 0.55, gain: 0.2, noiseGain: 0.1 });

export const playGyokuken = () => sweepNoise(gyokukenParams());

export const playClawSwipe = () => {
  if (typeof window === 'undefined') return 0;
  const p = clawSwipeParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t0 = ctx.currentTime;
  // 3 goresan berurutan — SEMUA dijadwalkan absolut (tanpa setTimeout) supaya
  // presisi & tidak ada timer nyangkut.
  for (let i = 0; i < p.swipes; i++) {
    const at = t0 + (i * p.gapMs) / 1000;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(Math.max(60, p.fromHz - i * 300), at);
    osc.frequency.exponentialRampToValueAtTime(p.toHz, at + p.dur * 0.85);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(p.gain * (1 - i * 0.1), at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, at + p.dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + p.dur + 0.03);
    noiseBurst(ctx, at, {
      dur: p.dur * 0.8, gain: p.gain * 0.42, type: 'highpass',
      fromHz: p.fromHz, toHz: p.toHz,
    });
  }
  return (p.swipes - 1) * p.gapMs + Math.round(p.dur * 1000);
};

export const playOrochiHiss = () => {
  if (typeof window === 'undefined') return 0;
  const p = orochiHissParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  for (let i = 0; i < p.layers; i++) {
    noiseBurst(ctx, ctx.currentTime + (i * p.gapMs) / 1000, {
      dur: p.dur, gain: p.gain * (1 - i * 0.18), type: 'highpass',
      fromHz: p.fromHz - i * 700, toHz: p.toHz,
    });
  }
  return p.layers * p.gapMs + Math.round(p.dur * 1000);
};

export const playOrochiRumble = () => sweepNoise(orochiRumbleParams());
export const playBansouWater = () => sweepNoise(bansouWaterParams(), { noise: true });
export const playBansouTrumpet = () => sweepNoise(bansouTrumpetParams());
export const playKosouRoar = () => sweepNoise(kosouRoarParams());

export const playKosouSlash = () => {
  if (typeof window === 'undefined') return 0;
  const p = kosouSlashParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t0 = ctx.currentTime;
  for (let i = 0; i < p.slashes; i++) {
    noiseBurst(ctx, t0 + (i * p.gapMs) / 1000, {
      dur: p.dur, gain: p.gain * (1 - i * 0.08), type: 'bandpass',
      fromHz: p.fromHz - i * 400, toHz: p.toHz,
    });
  }
  const boomMs = sweepNoise(p.boom);
  return Math.max(p.slashes * p.gapMs + Math.round(p.dur * 1000), boomMs);
};

export const playMakoraChant = () => {
  if (typeof window === 'undefined') return 0;
  const p = makoraChantParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  // Drone ritual bayangan (55Hz) — dasar rasa "masuk bayangan".
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(p.droneHz, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(p.droneGain, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.05);
  // Bel inharmonik (ritual 布瑠部由良由良).
  for (const ratio of p.bellPartials) {
    const b = ctx.createOscillator();
    const bg = ctx.createGain();
    b.type = 'sine';
    b.frequency.setValueAtTime(p.droneHz * 4 * ratio, t);
    const bgain = p.bellGain / (1 + ratio * 0.5);
    bg.gain.setValueAtTime(0, t);
    bg.gain.linearRampToValueAtTime(bgain, t + 0.01);
    bg.gain.exponentialRampToValueAtTime(0.0008, t + p.dur * 0.8);
    b.connect(bg);
    bg.connect(ctx.destination);
    b.start(t);
    b.stop(t + p.dur);
  }
  return Math.round(p.dur * 1000);
};

export const playMakoraRoar = () => sweepNoise(makoraRoarParams());

export const playAdaptFlash = () => {
  if (typeof window === 'undefined') return 0;
  const p = adaptFlashParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  // Chime gelap (momen "belajar" — roda +1 takik).
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(p.chimeHz, t);
  osc.frequency.exponentialRampToValueAtTime(p.chimeHz * 0.94, t + p.chimeDur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(p.chimeGain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0008, t + p.chimeDur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.chimeDur + 0.05);
  // Shimmer naik (adaptasi "menyerap" serangan).
  noiseBurst(ctx, t, { dur: p.shimmerDur, gain: p.shimmerGain, type: 'bandpass', fromHz: p.shimmerFromHz, toHz: p.shimmerToHz });
  return Math.round((p.chimeDur + p.shimmerDur) * 500);
};

export const playSwordUnsheathe = () => sweepNoise(swordUnsheatheParams(), { noise: true });

export const playWheelShatter = () => {
  if (typeof window === 'undefined') return 0;
  const p = wheelShatterParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t0 = ctx.currentTime;
  for (let i = 0; i < p.shards; i++) {
    noiseBurst(ctx, t0 + (i * p.gapMs) / 1000, {
      dur: p.shardDur, gain: p.shardGain * (1 - i * 0.12), type: 'highpass',
      fromHz: p.shardHz - i * 350, toHz: p.shardHz * 0.35,
    });
  }
  const boomMs = sweepNoise(p.boom);
  return Math.max(p.shards * p.gapMs + Math.round(p.shardDur * 1000), boomMs);
};

export const playShadowSwallow = () => sweepNoise(shadowSwallowParams(), { noise: true });

// Registry lapis per jurus Megumi — tiap jurus ≥2 lapis (spec, dites).
// Reuse lintas-pack: playNueScreech/playNueThunder (kanon Megumi — Sukuna pakai
// karena Meguna), playShadowRustle, playWheelCreak, playGiantStep, playSlash.
export const MEGUMI_TECHNIQUE_SFX_LAYERS = {
  gyokuken: ['playGyokuken', 'playClawSwipe'],
  nue: ['playNueScream', 'playNueThunder', 'playShadowRustle'],
  orochi: ['playOrochiHiss', 'playOrochiRumble'],
  bansou: ['playBansouWater', 'playBansouTrumpet'],
  kosou: ['playKosouRoar', 'playKosouSlash'],
  mahoraga: ['playMakoraChant', 'playWheelCreak', 'playGiantStep', 'playMakoraRoar'],
  adapt: ['playAdaptFlash'],
  sword: ['playSwordUnsheathe'],
  shatter: ['playWheelShatter'],
  wrong: ['playShadowSwallow'],
};

export const megumiTechniqueSfxLayers = (technique) =>
  Array.isArray(MEGUMI_TECHNIQUE_SFX_LAYERS[technique]) ? MEGUMI_TECHNIQUE_SFX_LAYERS[technique] : [];

// Nama → fungsi (registry di atas berupa string supaya murni & dites di node).
const MEGUMI_SFX_FNS = {
  playGyokuken, playClawSwipe, playOrochiHiss, playOrochiRumble,
  playBansouWater, playBansouTrumpet, playKosouRoar, playKosouSlash,
  playMakoraChant, playMakoraRoar, playAdaptFlash, playSwordUnsheathe,
  playWheelShatter, playShadowSwallow,
  playNueScream, playNueThunder, playShadowRustle,
  playWheelCreak, playGiantStep, playSlash,
};

// Putar SEMUA lapis SFX satu jurus Megumi (urutan registry), kembalikan jumlah
// lapis yang benar-benar terpanggil. Node/test = no-op (semua player return 0).
export const playMegumiTechniqueLayers = (technique) => {
  const layers = megumiTechniqueSfxLayers(technique);
  let n = 0;
  for (const name of layers) {
    const fn = MEGUMI_SFX_FNS[name];
    if (typeof fn !== 'function') continue;
    fn();
    n += 1;
  }
  return n;
};


// ── SFX jurus Nobara (pack_08) — 芻霊呪法 (すうれいじゅほう) ──────────────────
// Referensi desain: spec Nobara.md §SFX (paku = swish tajam + TUK logam; ledakan
// = burs oranye + dentuman; resonansi = gelombang sine turun; 黒閃 = bass drop).
// Semua params murni & deterministik (dites di sfx.nobara.test.js); pemutar
// no-op di node (guard window). Reuse yang sudah ada (playSlash, playDomainBoom,
// playNueThunder, playShadowRustle).
export const nailShotParams = () => ({ type: 'sawtooth', fromHz: 3200, toHz: 900, dur: 0.14, gain: 0.18, noiseGain: 0.12 });
export const nailThudParams = () => ({ type: 'triangle', fromHz: 340, toHz: 110, dur: 0.16, gain: 0.3, noiseGain: 0.06 });
export const nailBurstParams = () => ({
  type: 'sine', fromHz: 220, toHz: 60, dur: 0.42, gain: 0.32, noiseGain: 0.16,
  crackle: { fromHz: 2600, toHz: 500, dur: 0.2, gain: 0.12 },
});
export const chainBurstParams = () => ({
  bursts: 3, gapMs: 90, fromHz: 200, toHz: 54, dur: 0.36, gain: 0.3, noiseGain: 0.15,
});
export const hammerStrikeParams = () => ({ type: 'triangle', fromHz: 480, toHz: 90, dur: 0.28, gain: 0.38, noiseGain: 0.14 });
export const resonanceWaveParams = () => ({ type: 'sine', fromHz: 640, toHz: 120, dur: 1.0, gain: 0.24, noiseGain: 0.08, waves: 3 });
export const blackFlashParams = () => ({
  type: 'sine', fromHz: 90, toHz: 26, dur: 0.7, gain: 0.46, noiseGain: 0.2,
  riser: { fromHz: 300, toHz: 1800, dur: 0.22, gain: 0.12 },
});
export const strawRustleParams = () => ({ layers: 3, fromHz: 4200, toHz: 900, dur: 0.4, gain: 0.1, gapMs: 70 });

export const playNailShot = () => sweepNoise(nailShotParams());
export const playNailThud = () => sweepNoise(nailThudParams());

export const playNailBurst = () => {
  if (typeof window === 'undefined') return 0;
  const p = nailBurstParams();
  const ms = sweepNoise(p);
  const ctx = initAudioContext();
  if (!ctx) return ms;
  // Crackle paku pecah (percikan logam) — dijadwalkan absolut, tanpa timer.
  if (p.crackle) {
    noiseBurst(ctx, ctx.currentTime, { dur: p.crackle.dur, gain: p.crackle.gain, type: 'highpass', fromHz: p.crackle.fromHz, toHz: p.crackle.toHz });
  }
  return ms;
};

export const playChainBurst = () => {
  if (typeof window === 'undefined') return 0;
  const p = chainBurstParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t0 = ctx.currentTime;
  // 3 ledakan berantai (簪・時限: tancap → jeda → meledak serentak).
  for (let i = 0; i < p.bursts; i++) {
    const at = t0 + (i * p.gapMs) / 1000;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.fromHz - i * 20, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, p.toHz), at + p.dur * 0.85);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(p.gain * (1 - i * 0.08), at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0008, at + p.dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + p.dur + 0.04);
    noiseBurst(ctx, at, { dur: p.dur * 0.7, gain: p.noiseGain, type: 'bandpass', fromHz: 900, toHz: 180 });
  }
  return (p.bursts - 1) * p.gapMs + Math.round(p.dur * 1000);
};

export const playHammerStrike = () => sweepNoise(hammerStrikeParams());

export const playResonanceWave = () => {
  if (typeof window === 'undefined') return 0;
  const p = resonanceWaveParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t0 = ctx.currentTime;
  // Gelombang resonansi: sine turun berlapis (riak menjalar dari boneka).
  for (let i = 0; i < p.waves; i++) {
    const at = t0 + i * (p.dur / (p.waves + 1));
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.fromHz - i * 90, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, p.toHz), at + p.dur * 0.7);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(p.gain * (1 - i * 0.2), at + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0008, at + p.dur * 0.75);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + p.dur * 0.8);
  }
  return Math.round(p.dur * 1000);
};

export const playBlackFlash = () => {
  if (typeof window === 'undefined') return 0;
  const p = blackFlashParams();
  const ms = sweepNoise(p);
  const ctx = initAudioContext();
  if (!ctx) return ms;
  // Riser singkat sebelum hentaman (layar dim 120ms → flash → BOOM).
  if (p.riser) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(p.riser.fromHz, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(p.riser.toHz, ctx.currentTime + p.riser.dur);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(p.riser.gain, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + p.riser.dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + p.riser.dur + 0.03);
  }
  return ms;
};

export const playStrawRustle = () => {
  if (typeof window === 'undefined') return 0;
  const p = strawRustleParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  for (let i = 0; i < p.layers; i++) {
    noiseBurst(ctx, ctx.currentTime + (i * p.gapMs) / 1000, {
      dur: p.dur, gain: p.gain * (1 - i * 0.18), type: 'highpass',
      fromHz: p.fromHz - i * 600, toHz: p.toHz,
    });
  }
  return p.layers * p.gapMs + Math.round(p.dur * 1000);
};

// Registry lapis per jurus Nobara — tiap jurus ≥2 lapis (spec, dites).
// Reuse lintas-pack: playSlash (tebasan), playDomainBoom (dentuman besar),
// playNueThunder (guntur), playShadowRustle (desir).
export const NOBARA_TECHNIQUE_SFX_LAYERS = {
  kanzashi: ['playNailShot', 'playNailBurst'],
  ren: ['playNailShot', 'playChainBurst'],
  jigen: ['playNailThud', 'playChainBurst'],
  tomonari: ['playStrawRustle', 'playHammerStrike', 'playResonanceWave'],
  kokusen: ['playBlackFlash', 'playDomainBoom'],
  ult: ['playNailShot', 'playHammerStrike', 'playChainBurst', 'playResonanceWave'],
  wrong: ['playStrawRustle'],
};

export const nobaraTechniqueSfxLayers = (technique) =>
  Array.isArray(NOBARA_TECHNIQUE_SFX_LAYERS[technique]) ? NOBARA_TECHNIQUE_SFX_LAYERS[technique] : [];

const NOBARA_SFX_FNS = {
  playNailShot, playNailThud, playNailBurst, playChainBurst,
  playHammerStrike, playResonanceWave, playBlackFlash, playStrawRustle,
  playSlash, playDomainBoom, playNueThunder, playShadowRustle,
};

// Putar SEMUA lapis SFX satu jurus Nobara (urutan registry), kembalikan jumlah
// lapis yang benar-benar terpanggil. Node/test = no-op (semua player return 0).
export const playNobaraTechniqueLayers = (technique) => {
  const layers = nobaraTechniqueSfxLayers(technique);
  let n = 0;
  for (const name of layers) {
    const fn = NOBARA_SFX_FNS[name];
    if (typeof fn !== 'function') continue;
    fn();
    n += 1;
  }
  return n;
};

// ── Klip voice Nobara (pola Megumi) — playNobaraTechnique ──────────────────
export const NOBARA_TECHNIQUE_FILES = {
  kanzashi: '/voices/nobara/kanzashi.mp3',
  tomonari: '/voices/nobara/tomonari.mp3',
  kokusen: '/voices/nobara/kokusen.mp3',
  ult: '/voices/nobara/ult.mp3',
};

// Lead-silence terukur (RMS onset) — hanya > 0.24s yang di-skip (pola Sukuna).
export const NOBARA_LEAD_S = { kanzashi: 0.12, tomonari: 0.16, kokusen: 0.16, ult: 0.30 };

export const playNobaraTechnique = (technique) => {
  const path = NOBARA_TECHNIQUE_FILES[technique];
  if (!path) return 0;
  const lead = NOBARA_LEAD_S[technique] || 0;
  return playFile(path, lead);
};

// ── SFX Nanami Kento (十劃呪法 · 7:3) — ~10 fungsi baru (T4) ──────────────────
// Identitas 十劃呪法: tebasan PRESISI (gesekan pendek) + ding kristal (titik lemah
// kena) + puing (dinding retak → reruntuhan menghantam) + emas korporat (riser
// lembur) + dasi & jam (motif waktu). Reuse: kokusen = crackle+thunder Sukuna,
// ult = + domainBoom. Semua murni & deterministik (tanpa rng).

// Tebasan 7:3 — gesekan presisi TINGGI→rendah, durasi PENDEK (bukan slash berat).
export const ratioSlashParams = () => ({ type: 'bandpass', fromHz: 3600, toHz: 900, dur: 0.12, gain: 0.22, noiseGain: 0.16 });
// Titik lemah 7:3 kena — ding kristal (nada tinggi bersih, decay cepat).
export const criticalDingParams = () => ({ hz: 1760, dur: 0.22, gain: 0.16, overtone: 2640 });
// Sapuan 大鉈 — golok berat menyapu (durasi > tebasan, body rendah).
export const oonataSweepParams = () => ({ type: 'sawtooth', fromHz: 1100, toHz: 180, dur: 0.34, gain: 0.26, noiseGain: 0.14 });
// 呪符 berterbangan — kertas (3 lapis bandpass tinggi, gap beruntun).
export const jufuFlutterParams = () => ({ layers: 3, fromHz: 5200, toHz: 1400, dur: 0.16, gain: 0.09, gapMs: 55 });
// Dinding retak — crackle beruntun rendah (batu mulai pecah).
export const wallCrackParams = () => ({ baseHz: 480, bursts: 4, gapMs: 45, dur: 0.08, gain: 0.18 });
// Puing menghantam — boom rendah + noise (reruntuhan jatuh).
export const rubbleCrashParams = () => ({ type: 'sine', fromHz: 120, toHz: 38, dur: 0.55, gain: 0.34, noiseGain: 0.2 });
// Dasi lepas — kain (bandpass lembut, bukan logam).
export const tieSnapParams = () => ({ type: 'bandpass', fromHz: 1400, toHz: 300, dur: 0.28, gain: 0.14 });
// Jam berdetak — tick pendek dua nada.
export const watchTickParams = () => ({ hz: 1200, hz2: 1800, dur: 0.045, gap: 0.09, gain: 0.12 });
// Riser aura emas lembur — naik (tension).
export const overtimeRiserParams = () => ({ type: 'sawtooth', fromHz: 160, toHz: 980, dur: 1.1, gain: 0.16, noiseGain: 0.08 });
// Kontrak batal (縛り破棄) — turun gelap + sub.
export const contractBreakParams = () => ({ type: 'sine', fromHz: 320, toHz: 42, dur: 0.9, gain: 0.3, noiseGain: 0.14 });

export const playRatioSlash = () => sweepNoise(ratioSlashParams(), { noise: true });
export const playOonataSweep = () => sweepNoise(oonataSweepParams());
export const playTieSnap = () => sweepNoise(tieSnapParams(), { noise: true });
export const playOvertimeRiser = () => sweepNoise(overtimeRiserParams());
export const playRubbleCrash = () => sweepNoise(rubbleCrashParams());
export const playContractBreak = () => sweepNoise(contractBreakParams());

// Ding kristal — dua osc (fundamental + overtone) decay cepat.
export const playCriticalDing = () => {
  if (typeof window === 'undefined') return 0;
  const p = criticalDingParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  for (const [hz, g0] of [[p.hz, p.gain], [p.overtone, p.gain * 0.45]]) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(g0, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + p.dur + 0.05);
  }
  return Math.round(p.dur * 1000);
};

// 呪符 berterbangan — `layers` sweep bandpass tinggi beruntun.
export const playJufuFlutter = () => {
  if (typeof window === 'undefined') return 0;
  const p = jufuFlutterParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  for (let i = 0; i < p.layers; i += 1) {
    const at = t + (i * p.gapMs) / 1000;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    // OscillatorNode tak punya bentuk 'bandpass' (itu tipe filter) — dulu
    // diabaikan Chrome + warning console. Sine = perilaku lama yang efektif;
    // lapisan noiseBurst di bawah yang mengurus karakter bandpass-nya.
    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.fromHz - i * 400, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(200, p.toHz - i * 200), at + p.dur);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(p.gain, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, at + p.dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + p.dur + 0.04);
    noiseBurst(ctx, at, { dur: p.dur * 0.8, gain: p.gain * 0.7, type: 'bandpass', fromHz: p.fromHz, toHz: p.toHz });
  }
  return Math.round((p.layers * p.gapMs + p.dur * 1000));
};

// Dinding retak — `bursts` crackle beruntun (tiap burst = noise pendek).
export const playWallCrack = () => {
  if (typeof window === 'undefined') return 0;
  const p = wallCrackParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  for (let i = 0; i < p.bursts; i += 1) {
    noiseBurst(ctx, t + (i * p.gapMs) / 1000, {
      dur: p.dur, gain: p.gain * (1 - i * 0.12),
      type: 'bandpass', fromHz: p.baseHz * (1 + i * 0.35), toHz: Math.max(60, p.baseHz * 0.6),
    });
  }
  return Math.round((p.bursts * p.gapMs + p.dur * 1000));
};

// Jam berdetak — dua tick pendek (tick-tock motif waktu).
export const playWatchTick = () => {
  if (typeof window === 'undefined') return 0;
  const p = watchTickParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  for (const [at, hz] of [[t, p.hz], [t + p.gap, p.hz2]]) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(hz, at);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(p.gain, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0008, at + p.dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + p.dur + 0.02);
  }
  return Math.round((p.gap + p.dur) * 1000);
};

// ── Registry lapis SFX Nanami (urut identitas: core → body → edge) ──────────
export const NANAMI_TECHNIQUE_SFX_LAYERS = {
  shichisan: ['playRatioSlash', 'playCriticalDing'],
  oonata: ['playOonataSweep', 'playJufuFlutter'],
  garagara: ['playWallCrack', 'playRubbleCrash'],
  kokusen: ['playKokusenCrackle', 'playKokusenThunder'],
  jikangai: ['playWatchTick', 'playTieSnap', 'playOvertimeRiser'],
  ult: ['playWatchTick', 'playTieSnap', 'playOvertimeRiser', 'playDomainBoom'],
  contract: ['playContractBreak'],
  wrong: ['playContractBreak'],
};

export const nanamiTechniqueSfxLayers = (technique) =>
  Array.isArray(NANAMI_TECHNIQUE_SFX_LAYERS[technique]) ? NANAMI_TECHNIQUE_SFX_LAYERS[technique] : [];

const NANAMI_SFX_FNS = {
  playRatioSlash, playCriticalDing, playOonataSweep, playJufuFlutter,
  playWallCrack, playRubbleCrash, playTieSnap, playWatchTick,
  playOvertimeRiser, playContractBreak,
  playKokusenCrackle, playKokusenThunder, playDomainBoom,
};

// Putar SEMUA lapis SFX satu jurus Nanami (urutan registry), kembalikan jumlah
// lapis yang benar-benar terpanggil. Node/test = no-op (semua player return 0).
export const playNanamiTechniqueLayers = (technique) => {
  const layers = nanamiTechniqueSfxLayers(technique);
  let n = 0;
  for (const name of layers) {
    const fn = NANAMI_SFX_FNS[name];
    if (typeof fn !== 'function') continue;
    fn();
    n += 1;
  }
  return n;
};

// ── Klip voice Nanami (pola Gojo/Nobara) — playNanamiTechnique ─────────────
export const NANAMI_TECHNIQUE_FILES = {
  shichisan: '/voices/nanami/shichisan.mp3',
  oonata: '/voices/nanami/oonata.mp3',
  garagara: '/voices/nanami/garagara.mp3',
  kokusen: '/voices/nanami/kokusen.mp3',
  jikangai: '/voices/nanami/jikangai.mp3',
};

// Lead-silence terukur (RMS onset, pola Nobara) — hanya > 0.24s yang di-skip.
export const NANAMI_LEAD_S = { shichisan: 0.18, oonata: 0.14, garagara: 0.10, kokusen: 0.16, jikangai: 0.14 };

export const playNanamiTechnique = (technique) => {
  const path = NANAMI_TECHNIQUE_FILES[technique];
  if (!path) return 0;
  const lead = NANAMI_LEAD_S[technique] || 0;
  return playFile(path, lead);
};

// ── SFX Toji Fushiguro (天与呪縛・術師殺し) — 11 fungsi baru (T4) ──────────────
// Identitas 冷たい鋼: BAJA (刃鳴り = dawai logam tinggi) + RANTAI (gemerincing
// beruntun) + DEBU/BATU (crunch) + TANPA GLOW 呪力 (semua fisik, bukan energi).
// Reuse: playSlash(heavy), playBlackSpark, playKokusenCrackle, playDomainBoom,
// playDomainCollapse, playCurseTick, playCurseReady, playChainBurst, playNailThud.
// Semua murni & deterministik (tanpa rng di params).

// 刃鳴り (はなり): baja berdesir — dua nada tinggi berdenyut (beat 1.5 Hz), decay pendek.
export const steelRingParams = () => ({ hz: 3140, hz2: 4310, dur: 0.5, gain: 0.15, beatHz: 1.5 });
// 釈魂刀: belahan jiwa — split rendah (bilah membelah) + noise logam.
export const soulSplitParams = () => ({ type: 'sawtooth', fromHz: 1400, toHz: 42, dur: 0.42, gain: 0.3, noiseGain: 0.18 });
// 万里ノ鎖: gemerincing rantai — bursts pendek beruntun, bandpass tinggi (logam).
export const chainRattleParams = () => ({ bursts: 6, fromHz: 5200, toHz: 2600, dur: 0.06, gapMs: 42, gain: 0.13 });
// Seretan rantai: DISERET keluar — naik (ditarik) + hentakan akhir.
export const chainYankParams = () => ({ type: 'bandpass', fromHz: 700, toHz: 2400, dur: 0.34, gain: 0.2, noiseGain: 0.16 });
// 天逆鉾: tusukan belati — turun tajam pendek (tusuk masuk) + impact.
export const spearPierceParams = () => ({ type: 'sine', fromHz: 2600, toHz: 90, dur: 0.22, gain: 0.28, noiseGain: 0.2 });
// Pembatalan jurus (術式強制解除): reverse-whoosh NAIK + glitch kecil.
export const techniqueCancelParams = () => ({ type: 'triangle', fromHz: 220, toHz: 1900, dur: 0.46, gain: 0.16, noiseGain: 0.1 });
// 遊雲 (三節棍): sapuan tongkat 3 ruas — naik melebar, durasi panjang.
export const staffWhirlParams = () => ({ type: 'sawtooth', fromHz: 260, toHz: 1300, dur: 0.52, gain: 0.22, noiseGain: 0.14 });
// Hantaman: crunch tumpul beruntun (tulang/batu).
export const boneCrunchParams = () => ({ bursts: 3, fromHz: 320, toHz: 90, dur: 0.07, gapMs: 38, gain: 0.22 });
// 武器庫呪霊: geraman ulat raksasa — rendah panjang TURUN (bukan drone).
export const inventoryGrowlParams = () => ({ type: 'sawtooth', fromHz: 180, toHz: 48, dur: 0.95, gain: 0.24, noiseGain: 0.12 });
// Senjata dimuntahkan: metal slide (tinggi → sedang) + thud.
export const weaponEjectParams = () => ({ type: 'square', fromHz: 1900, toHz: 260, dur: 0.3, gain: 0.2, noiseGain: 0.22 });
// Chant cast: rendah panjang (hening 呪力ゼロ — napas, bukan teriakan).
export const chantParams = () => ({ type: 'sine', fromHz: 96, toHz: 58, dur: 1.4, gain: 0.18, noiseGain: 0.06 });

export const playSteelRing = () => {
  if (typeof window === 'undefined') return 0;
  const p = steelRingParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  for (const [hz, g0] of [[p.hz, p.gain], [p.hz2, p.gain * 0.6]]) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(hz, t);
    // beat lambat dua nada (berdenyut, bukan statis — khas dawai logam)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(p.beatHz, t);
    lfoGain.gain.setValueAtTime(g0 * 0.35, t);
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(g0, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + p.dur + 0.05);
    lfo.start(t);
    lfo.stop(t + p.dur + 0.05);
  }
  return Math.round(p.dur * 1000);
};

export const playSoulSplit = () => sweepNoise(soulSplitParams());

export const playChainRattle = () => {
  if (typeof window === 'undefined') return 0;
  const p = chainRattleParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  for (let i = 0; i < p.bursts; i += 1) {
    noiseBurst(ctx, t + (i * p.gapMs) / 1000, {
      dur: p.dur, gain: p.gain * (1 - i * 0.08),
      type: 'bandpass', fromHz: p.fromHz - i * 260, toHz: p.toHz,
    });
  }
  return Math.round((p.bursts * p.gapMs + p.dur * 1000));
};

export const playChainYank = () => sweepNoise(chainYankParams(), { noise: true });
export const playSpearPierce = () => sweepNoise(spearPierceParams());
export const playTechniqueCancel = () => sweepNoise(techniqueCancelParams());
export const playStaffWhirl = () => sweepNoise(staffWhirlParams());
export const playInventoryGrowl = () => sweepNoise(inventoryGrowlParams());
export const playWeaponEject = () => sweepNoise(weaponEjectParams());
export const playTojiChant = () => sweepNoise(chantParams());

export const playBoneCrunch = () => {
  if (typeof window === 'undefined') return 0;
  const p = boneCrunchParams();
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime;
  for (let i = 0; i < p.bursts; i += 1) {
    noiseBurst(ctx, t + (i * p.gapMs) / 1000, {
      dur: p.dur, gain: p.gain * (1 - i * 0.15),
      type: 'lowpass', fromHz: p.fromHz * (1 + i * 0.3), toHz: p.toHz,
    });
  }
  return Math.round((p.bursts * p.gapMs + p.dur * 1000));
};

// ── Registry lapis SFX Toji (urut identitas: core → edge) ───────────────────
export const TOJI_TECHNIQUE_SFX_LAYERS = {
  shakkontou: ['playSteelRing', 'playSoulSplit'],
  banri_no_kusari: ['playChainRattle', 'playChainYank'],
  amanosakahoko: ['playSpearPierce', 'playTechniqueCancel'],
  yuuyun: ['playStaffWhirl', 'playBoneCrunch'],
  bukiko_jurei: ['playInventoryGrowl', 'playWeaponEject'],
  kill: ['playSoulSplit', 'playSteelRing'],
  ult: ['playTojiChant', 'playDomainBoom'],
  wrong: ['playNailThud'],
};

export const tojiTechniqueSfxLayers = (technique) =>
  Array.isArray(TOJI_TECHNIQUE_SFX_LAYERS[technique]) ? TOJI_TECHNIQUE_SFX_LAYERS[technique] : [];

const TOJI_SFX_FNS = {
  playSteelRing, playSoulSplit, playChainRattle, playChainYank,
  playSpearPierce, playTechniqueCancel, playStaffWhirl, playBoneCrunch,
  playInventoryGrowl, playWeaponEject, playTojiChant,
  playNailThud, playDomainBoom,
};

// Putar SEMUA lapis SFX satu jurus Toji (urutan registry), kembalikan jumlah
// lapis yang benar-benar terpanggil. Node/test = no-op (semua player return 0).
export const playTojiTechniqueLayers = (technique) => {
  const layers = tojiTechniqueSfxLayers(technique);
  let n = 0;
  for (const name of layers) {
    const fn = TOJI_SFX_FNS[name];
    if (typeof fn !== 'function') continue;
    fn();
    n += 1;
  }
  return n;
};

// ── Klip voice Toji (pola Gojo/Nanami) — playTojiTechnique + playTojiCast ────
export const TOJI_TECHNIQUE_FILES = {
  shakkontou: '/voices/toji/shakkontou.mp3',
  banri_no_kusari: '/voices/toji/banri_no_kusari.mp3',
  amanosakahoko: '/voices/toji/amanosakahoko.mp3',
  yuuyun: '/voices/toji/yuuyun.mp3',
  bukiko_jurei: '/voices/toji/bukiko_jurei.mp3',
};

// Lead-silence TERUKUR (PyAV RMS onset) — semua <= 0.32s (pola Nanami; hanya
// > 0.32 yang perlu skip agresif, jadi nilai ini murni informasional + test).
// `state` = klip 武器庫・一撃離脱 (bukiko_ichigeki) saat state 全開 mulai.
export const TOJI_LEAD_S = {
  shakkontou: 0.12, banri_no_kusari: 0.14, amanosakahoko: 0.18,
  yuuyun: 0.16, bukiko_jurei: 0.16, cast: 0.16, state: 0.20,
};

export const playTojiTechnique = (technique) => {
  const path = TOJI_TECHNIQUE_FILES[technique];
  if (!path) return 0;
  const lead = TOJI_LEAD_S[technique] || 0;
  return playFile(path, lead);
};

// Cast 天与呪縛・全開: klip 「天与呪縛・全開」(2,78s TERUKUR) — cinematic
// TojiShadow tersinkron per-frasa ke TOJI_CAST_VOICE (bukan ditebak).
export const playTojiCast = () => playFile('/voices/toji/cast.mp3', TOJI_LEAD_S.cast);

// 武器庫・一撃離脱 — klip mekanik state, diputar saat STATE 30 dtk mulai
// (bukan jurus). Suara seruan Toji saat armory rail aktif.
export const playTojiStateStart = () => playFile('/voices/toji/bukiko_ichigeki.mp3', TOJI_LEAD_S.state);

// ── Klip voice Yuta Okkotsu (pack_12) — ⚠️ 100% ASET USER, BUKAN TTS ─────────
// 真贋相愛 · 模倣: 4 jurus ladder + cast domain + callout 7 ultimate pack sumber.
// ATURAN KERAS USER: jangan generate TTS generik. Semua klip di bawah = file
// user di public/voices/yuta/ (di-copy dari ~/Downloads/yuta/, audio TIDAK diubah).
export const YUTA_TECHNIQUE_FILES = {
  katana:   '/voices/yuta/katana.mp3',    // 太刀
  ripples:  '/voices/yuta/ripples.mp3',   // 呪力
  reversal: '/voices/yuta/reversal.mp3',  // 反転術式
  mimic:    '/voices/yuta/mimic.mp3',     // 模倣
};

// Callout 7 copy = KLIP ASLI pack sumber (0 TTS baru, suara kanon tiap karakter).
export const YUTA_COPY_FILES = {
  gojo:   '/voices/gojo/ryoiki tenkai.mp3',
  sukuna: '/voices/sukuna/ryouiki_tenkai.mp3',
  nobara: '/voices/nobara/ult.mp3',
  yuji:   '/voices/yuji/fuga.mp3',
  megumi: '/voices/megumi/mahoraga.mp3',
  nanami: '/voices/nanami/jikangai.mp3',
  toji:   '/voices/toji/cast.mp3',
};

// Lead-silence TERUKUR (PyAV RMS onset, aset user) — dipakai untuk skip senyap
// depan supaya suara tidak telat. Semua <= 0.6s (tidak perlu skip agresif).
export const YUTA_LEAD_S = {
  katana: 0.37, ripples: 0.39, reversal: 0.39, mimic: 0.18, cast: 0.5,
};

export const playYutaTechnique = (technique) => {
  const path = YUTA_TECHNIQUE_FILES[technique];
  if (!path) return 0;
  return playFile(path, YUTA_LEAD_S[technique] || 0);
};

// Cast 真贋相愛: klip 「領域展開・真贋相愛」(4,86s TERUKUR) — cinematic T3
// (YutaDomainCine) sudah menyesuaikan durasi ini.
export const playYutaCast = () => playFile('/voices/yuta/cast.mp3', YUTA_LEAD_S.cast);

// Callout saat 1 katana dipilih: putar klip ultimate karakter yang ditiru.
export const playYutaCopy = (copyId) => {
  const path = YUTA_COPY_FILES[copyId];
  return path ? playFile(path, 0.1) : 0;
};

// ── Lapis SFX jurus Yuta (>= 1 lapis; reuse yang sudah ada — DRY) ───────────
export const YUTA_TECHNIQUE_SFX_LAYERS = {
  katana:   ['playSlash'],       // tebasan bilah
  ripples:  ['playCurseTick'],   // gelombang 呪力
  reversal: ['playBlackSpark'],  // 反転術式 = percikan terbalik
  mimic:    ['playDomainBoom'],  // 模倣 = dentuman ambil alih
  ult:      ['playDomainBoom'],  // 真贋相愛 = dentuman domain
};

const YUTA_SFX_FNS = { playSlash, playCurseTick, playBlackSpark, playDomainBoom };

// Putar SEMUA lapis SFX satu jurus Yuta; node/test = no-op (semua player return 0).
export const playYutaTechniqueLayers = (technique) => {
  const names = Array.isArray(YUTA_TECHNIQUE_SFX_LAYERS[technique]) ? YUTA_TECHNIQUE_SFX_LAYERS[technique] : [];
  let n = 0;
  for (const name of names) {
    const fn = YUTA_SFX_FNS[name];
    if (typeof fn === 'function') { fn(); n += 1; }
  }
  return n;
};
