// ─────────────────────────────────────────────────────────────────────────────
// Audio cinematic sejarah Heian — MEMAKAI ULANG sistem audio yang sudah ada
// (utils/sfx.js → getAudioContext + playClipFile). TIDAK membuat audio manager
// baru.
//
// Struktur:
//   • SFX satu-tembak per momen (sapuan kuas, taiko, bel, koto, gong, …) —
//     SEMUA disintesis via Web Audio, tanpa file aset baru.
//   • Ambience BERKELANJUTAN per "mood" scene (calm/court/kana/dark) yang
//     di-crossfade lembut → cinematic tidak pernah sunyi ("polos").
//   • Voice narasi per-BARIS: path mp3 ditaruh di `line.voice` (data/scenes.js)
//     dan diputar oleh orchestrator (HeianCinematic) lewat playClipFile
//     (utils/sfx.js). Tanpa aset → tidak ada cue → no-op (tanpa error).
//
// Autoplay policy: kita TIDAK memaksa apa pun yang melanggar kebijakan browser.
// `unlockHeianAudio()` memasang listener gesture SEKALI; saat user menyentuh
// layar/tombol, AudioContext di-resume dan audio menyala. Kalau browser tetap
// memblokir, cinematic TETAP berfungsi penuh (hanya tanpa suara).
//
// Semua fungsi AMAN dipanggil kapan saja (guard window/ctx) dan no-op di node
// (dipakai `node --test`), sehingga angka murni di bawah bisa dites.
// ─────────────────────────────────────────────────────────────────────────────
import { getAudioContext, sanitizeOscType } from '../../../utils/sfx.js';

const hasWindow = () => typeof window !== 'undefined';

// ── Ambil AudioContext + coba resume (TIDAK melanggar kebijakan) ─────────────
// resume() hanya berhasil setelah gesture user; kalau ditolak, promise-nya
// ditolak dan audio tetap sunyi — TIDAK ada error yang mengganggu.
const ctxLive = () => {
  if (!hasWindow()) return null;
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (ctx.state === 'suspended') {
    try { ctx.resume().catch(() => {}); } catch { /* abaikan */ }
  }
  return ctx;
};

// Apakah AudioContext benar-benar berbunyi (sudah di-unlock gesture user)?
export const isAudioRunning = () => {
  const ctx = getAudioContext();
  return !!(ctx && ctx.state === 'running');
};

// Aktifkan audio secara LANGSUNG (dipanggil dari onClick tombol suara — gesture
// user nyata). Mengembalikan Promise<boolean> = benar-benar 'running'. Tidak
// memakai guard modul → selalu mencoba.
export const enableHeianAudio = () => {
  if (!hasWindow()) return Promise.resolve(false);
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(false);
  if (ctx.state === 'running') return Promise.resolve(true);
  try {
    return ctx.resume().then(() => ctx.state === 'running').catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
};

// ── Unlock: pasang listener gesture SEKALI ───────────────────────────────────
// `onReady` dipanggil begitu context benar-benar 'running' (langsung kalau sudah
// warm, atau SETELAH resume() selesai). Mengembalikan fungsi cleanup. Idempoten.
let unlockBound = false;
export const unlockHeianAudio = (onReady) => {
  if (!hasWindow()) return () => {};
  let done = false;
  const ready = () => {
    if (done) return;
    done = true;
    if (typeof onReady === 'function') onReady();
  };
  // Coba resume; `onReady` menyala saat state BENAR-BENAR 'running' (resume async).
  const tryResume = () => {
    const ctx = getAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'running') { ready(); return true; }
    try {
      const p = ctx.resume();
      if (p && typeof p.then === 'function') {
        p.then(() => { if (ctx.state === 'running') ready(); }).catch(() => {});
      } else if (ctx.state === 'running') {
        ready();
      }
    } catch { /* abaikan */ }
    return ctx.state === 'running';
  };
  if (tryResume()) return () => {};   // sudah running → tak perlu listener
  if (unlockBound) return () => {};
  unlockBound = true;
  const kick = () => { if (tryResume()) detach(); };
  const detach = () => {
    window.removeEventListener('pointerdown', kick);
    window.removeEventListener('keydown', kick);
    window.removeEventListener('touchstart', kick);
    unlockBound = false;
  };
  const opts = { passive: true };
  window.addEventListener('pointerdown', kick, opts);
  window.addEventListener('keydown', kick, opts);
  window.addEventListener('touchstart', kick, opts);
  return detach;
};

// ── Helper synth (murni di atas Web Audio) ───────────────────────────────────
const noiseBuffer = (ctx, durS) => {
  const len = Math.max(1, Math.floor(ctx.sampleRate * durS));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
  return buf;
};

// Noise → bandpass/lowpass → gain envelope. `toHz` < 30 dijaga (ramp eksponensial).
const noiseSweep = (ctx, t, { dur, gain, type = 'bandpass', fromHz, toHz, q = 0.9, curve = 'exp' }) => {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, dur);
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(fromHz, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(30, toHz), t + dur);
  if (f.Q) f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + dur * (curve === 'soft' ? 0.35 : 0.08));
  g.gain.exponentialRampToValueAtTime(0.0007, t + dur);
  src.connect(f); f.connect(g); g.connect(ctx.destination);
  src.start(t); src.stop(t + dur + 0.05);
};

// Nada tunggal dengan sweep frekuensi + envelope.
const tone = (ctx, t, { type = 'sine', from, to, dur, gain, attack = 0.01, dest = null }) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = sanitizeOscType(type);
  osc.frequency.setValueAtTime(from, t);
  if (to && to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur * 0.85);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0007, t + dur);
  osc.connect(g); g.connect(dest || ctx.destination);
  osc.start(t); osc.stop(t + dur + 0.05);
};

// Bel inharmonik (partial rasio lonceng) — dipakai courtBell & gong.
const bell = (ctx, t, { baseHz, partials, dur, gain }) => {
  partials.forEach((ratio) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseHz * ratio, t);
    const pg = gain / (1 + ratio * 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(pg, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0007, t + dur * (1 - ratio / 24));
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t); osc.stop(t + dur + 0.08);
  });
};

// ── Parameter SFX (MURNI & deterministik → dites di node) ────────────────────
// Setiap entri = resep satu bunyi. Karakter "Heian": kuas, tinta, taiko, bel
// istana, koto, angin, gong, drone gelap.
export const HEIAN_SFX_PARAMS = {
  // 筆 sapuan kuas panjang (tinta masuk)
  brushSweep: { kind: 'noise', dur: 0.95, gain: 0.12, type: 'bandpass', fromHz: 520, toHz: 2700, q: 0.8, curve: 'soft' },
  // goresan kuas pendek (per kana)
  brushStroke: { kind: 'noise', dur: 0.34, gain: 0.1, type: 'bandpass', fromHz: 700, toHz: 2200, q: 1.1 },
  // 滴 tetes tinta
  inkDrip: { kind: 'drip', from: 880, to: 300, dur: 0.22, gain: 0.09, plink: 0.05 },
  // 太鼓 taiko — pukulan drum rendah berat
  taiko: { kind: 'drum', from: 96, to: 40, dur: 0.5, gain: 0.3, noiseGain: 0.09 },
  // 風 angin lembut (ambience sesaat)
  wind: { kind: 'noise', dur: 3.0, gain: 0.055, type: 'lowpass', fromHz: 420, toHz: 700, q: 0.5, curve: 'soft' },
  // 鈴 bel istana (inharmonik, ekor panjang)
  courtBell: { kind: 'bell', baseHz: 330, partials: [1, 2.76, 5.4, 8.93], dur: 2.6, gain: 0.12 },
  // 箏 koto — petikan dawai
  koto: { kind: 'pluck', from: 392, dur: 1.1, gain: 0.16, overtoneGain: 0.18, filterHz: 2200, bend: -12 },
  // 鐘 gong (judul era)
  gong: { kind: 'bell', baseHz: 196, partials: [1, 2.55, 3.8, 5.2, 6.9], dur: 2.6, gain: 0.14 },
  // drone gelap naik (zaman berubah)
  dread: { kind: 'drone', from: 58, to: 41, dur: 2.4, gain: 0.22, padGain: 0.1 },
  // 鼓動 detak jantung (lub-dub)
  heartbeat: { kind: 'heart', beats: [{ atMs: 0, hz: 46, gain: 0.3 }, { atMs: 300, hz: 40, gain: 0.2 }], dur: 0.22 },
  // kilau halus (momen terjemahan / penutup)
  shimmer: { kind: 'shimmer', notes: [1318.51, 1567.98, 2093.0], dur: 0.4, gap: 0.07, gain: 0.06 },
};

export const heianSfxParams = (key) => HEIAN_SFX_PARAMS[key] || null;

// ── Pemutar SFX ──────────────────────────────────────────────────────────────
export const playCinematicSfx = (key, gain = 1) => {
  const ctx = ctxLive();
  if (!ctx) return 0;
  const p = heianSfxParams(key);
  if (!p) return 0;
  const t = ctx.currentTime;
  const g = (v) => v * gain;

  switch (p.kind) {
    case 'noise':
      noiseSweep(ctx, t, { ...p, gain: g(p.gain) });
      return Math.round(p.dur * 1000);
    case 'drip':
      tone(ctx, t, { type: 'sine', from: p.from, to: p.to, dur: p.dur, gain: g(p.gain), attack: 0.005 });
      noiseSweep(ctx, t, { dur: 0.05, gain: g(p.plink), type: 'highpass', fromHz: 2400, toHz: 1200 });
      return Math.round(p.dur * 1000);
    case 'drum':
      tone(ctx, t, { type: 'sine', from: p.from, to: p.to, dur: p.dur, gain: g(p.gain), attack: 0.006 });
      noiseSweep(ctx, t, { dur: p.dur * 0.4, gain: g(p.noiseGain), type: 'bandpass', fromHz: p.from * 8, toHz: p.to * 3 });
      return Math.round(p.dur * 1000);
    case 'bell':
      bell(ctx, t, { baseHz: p.baseHz, partials: p.partials, dur: p.dur, gain: g(p.gain) });
      return Math.round(p.dur * 1000);
    case 'pluck': {
      // Koto: triangle + oktaf saw tipis, lowpass menutup cepat (dawai gelap).
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(p.filterHz, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(140, p.filterHz * 0.22), t + p.dur * 0.8);
      const gg = ctx.createGain();
      gg.gain.setValueAtTime(0.0001, t);
      gg.gain.linearRampToValueAtTime(g(p.gain), t + 0.012);
      gg.gain.exponentialRampToValueAtTime(0.0007, t + p.dur);
      f.connect(gg); gg.connect(ctx.destination);
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(p.from, t);
      if (osc.detune) osc.detune.setValueAtTime(p.bend || 0, t);
      osc.connect(f); osc.start(t); osc.stop(t + p.dur + 0.05);
      const ov = ctx.createOscillator();
      const ovg = ctx.createGain();
      ov.type = 'sawtooth';
      ov.frequency.setValueAtTime(p.from * 2, t);
      ovg.gain.setValueAtTime(g(p.overtoneGain * p.gain), t);
      ovg.gain.exponentialRampToValueAtTime(0.0006, t + p.dur * 0.6);
      ov.connect(ovg); ovg.connect(f); ov.start(t); ov.stop(t + p.dur * 0.7);
      return Math.round(p.dur * 1000);
    }
    case 'drone':
      tone(ctx, t, { type: 'sawtooth', from: p.from, to: p.to, dur: p.dur, gain: g(p.gain), attack: 0.12 });
      tone(ctx, t, { type: 'triangle', from: p.from * 3, to: p.to * 3, dur: p.dur * 0.9, gain: g(p.padGain), attack: 0.2 });
      return Math.round(p.dur * 1000);
    case 'heart':
      p.beats.forEach((b) => {
        const at = t + b.atMs / 1000;
        tone(ctx, at, { type: 'sine', from: b.hz, to: b.hz * 0.62, dur: p.dur, gain: g(b.gain), attack: 0.015 });
      });
      return p.beats[p.beats.length - 1].atMs + Math.round(p.dur * 1000);
    case 'shimmer':
      p.notes.forEach((hz, i) => {
        tone(ctx, t + i * p.gap, { type: 'triangle', from: hz, to: hz * 0.98, dur: p.dur, gain: g(p.gain), attack: 0.01 });
      });
      return Math.round((p.notes.length * p.gap + p.dur) * 1000);
    default:
      return 0;
  }
};

// ── Ambience BERKELANJUTAN per mood (crossfade) ──────────────────────────────
// Resep bed: drone + pad (lewat lowpass LFO "bernafas") + noise halus.
// Angka murni → dites.
export const AMBIENCE_PLANS = {
  calm: {
    level: 0.09, fadeInMs: 1800, fadeOutMs: 900,
    drone: { freqs: [55, 110], detune: [0, -5], gain: 0.4 },
    pad: { type: 'triangle', freqs: [165, 220], filterHz: 780, lfoHz: 0.05, lfoDepth: 200, gain: 0.3 },
    air: { type: 'lowpass', hz: 480, gain: 0.05 },
  },
  court: {
    level: 0.1, fadeInMs: 1800, fadeOutMs: 900,
    drone: { freqs: [55, 110, 165], detune: [0, -4, 3], gain: 0.4 },
    pad: { type: 'triangle', freqs: [196, 293.66, 392], filterHz: 900, lfoHz: 0.06, lfoDepth: 240, gain: 0.32 },
    air: { type: 'bandpass', hz: 900, gain: 0.045 },
  },
  kana: {
    level: 0.08, fadeInMs: 1600, fadeOutMs: 900,
    drone: { freqs: [65.41, 130.81], detune: [0, -5], gain: 0.38 },
    pad: { type: 'triangle', freqs: [220, 329.63], filterHz: 1000, lfoHz: 0.07, lfoDepth: 220, gain: 0.3 },
    air: { type: 'highpass', hz: 1400, gain: 0.04 },
  },
  dark: {
    level: 0.12, fadeInMs: 2000, fadeOutMs: 1200,
    drone: { freqs: [41.2, 82.41, 110], detune: [0, -6, 3], gain: 0.46 },
    pad: { type: 'triangle', freqs: [146.83, 220], filterHz: 620, lfoHz: 0.04, lfoDepth: 280, gain: 0.34 },
    air: { type: 'lowpass', hz: 360, gain: 0.06 },
  },
};

export const ambiencePlan = (mood) => AMBIENCE_PLANS[mood] || AMBIENCE_PLANS.calm;

// Bangun satu bed ambience untuk `mood`. Mengembalikan { master, nodes, level,
// fadeOutMs, mood } atau null (node/test).
const buildBed = (ctx, mood) => {
  const p = ambiencePlan(mood);
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(p.level, t + p.fadeInMs / 1000);
  master.connect(ctx.destination);
  const nodes = [];

  p.drone.freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (osc.detune) osc.detune.setValueAtTime(p.drone.detune[i] || 0, t);
    g.gain.setValueAtTime(p.drone.gain / p.drone.freqs.length, t);
    osc.connect(g); g.connect(master); osc.start(t); nodes.push(osc);
  });

  const padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.setValueAtTime(p.pad.filterHz, t);
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(p.pad.lfoHz, t);
  lfoGain.gain.setValueAtTime(p.pad.lfoDepth, t);
  lfo.connect(lfoGain); lfoGain.connect(padFilter.frequency); lfo.start(t); nodes.push(lfo);
  p.pad.freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = sanitizeOscType(p.pad.type);
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(p.pad.gain / p.pad.freqs.length, t);
    osc.connect(g); g.connect(padFilter); osc.start(t); nodes.push(osc);
  });
  padFilter.connect(master);

  // Lapisan udara: noise loop 2s → filter → gain.
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 2);
  src.loop = true;
  const af = ctx.createBiquadFilter();
  af.type = p.air.type;
  af.frequency.setValueAtTime(p.air.hz, t);
  const ag = ctx.createGain();
  ag.gain.setValueAtTime(p.air.gain, t);
  src.connect(af); af.connect(ag); ag.connect(master); src.start(t); nodes.push(src);

  return { master, nodes, level: p.level, fadeOutMs: p.fadeOutMs, mood };
};

const rampDown = (ctx, entry, fadeMs) => {
  if (!entry) return;
  const t = ctx.currentTime;
  const fade = Math.max(0.05, fadeMs / 1000);
  entry.master.gain.cancelScheduledValues(t);
  entry.master.gain.setValueAtTime(Math.max(entry.master.gain.value, 0.0001), t);
  entry.master.gain.exponentialRampToValueAtTime(0.0001, t + fade);
  entry.nodes.forEach((n) => { try { n.stop(t + fade + 0.1); } catch { /* sudah berhenti */ } });
};

// Bed ambience aktif (satu pada satu waktu; di-crossfade saat mood berubah).
let bed = null;

// Mulai/geser ambience ke `mood`. Idempoten: mood sama → tidak restart.
export const setHeianMood = (mood) => {
  if (!hasWindow()) return false;
  const ctx = ctxLive();
  if (!ctx) return false;
  const target = ambiencePlan(mood) ? mood : 'calm';
  if (bed && bed.mood === target) return false;
  const prev = bed;
  bed = buildBed(ctx, target);
  if (prev) rampDown(ctx, prev, prev.fadeOutMs);
  return true;
};

// Mulai ambience awal (dipakai saat cinematic mount, mood scene pertama).
export const startHeianAmbience = (mood = 'calm') => setHeianMood(mood);

export const stopHeianAmbience = () => {
  if (!bed) return false;
  const ctx = getAudioContext();
  if (ctx) rampDown(ctx, bed, bed.fadeOutMs);
  bed = null;
  return true;
};

// Info untuk debug/tes.
export const ambienceActive = () => !!bed;
export const ambienceMood = () => (bed ? bed.mood : null);
