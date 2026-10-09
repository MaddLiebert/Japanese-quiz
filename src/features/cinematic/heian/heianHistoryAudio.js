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

  // ── Edo 江戸 (kota cetak) — SFX tambahan, mesin synth yang sama ────────────
  // 木 ketukan blok kayu (ukir / cetak)
  woodKnock: { kind: 'wood', from: 220, to: 140, dur: 0.14, gain: 0.26, noiseGain: 0.07 },
  // 三味線 shamisen — petikan dawai (lebih tajam & ritmis dari koto)
  shamisen: { kind: 'pluck', from: 523.25, dur: 0.75, gain: 0.17, overtoneGain: 0.22, filterHz: 3000, bend: -8 },
  // sorak penjaja pasar (nyaring, pendek)
  marketCry: { kind: 'noise', dur: 0.55, gain: 0.09, type: 'bandpass', fromHz: 1200, toHz: 700, q: 1.4, curve: 'soft' },

  // ── Meiji 明治 (kota huruf logam) — mesin cetak, kereta, telegraf ──────────
  // 活字 mesin cetak: "klak-klak" logam (ketukan tinggi + resonansi pendek).
  pressClack: { kind: 'wood', from: 520, to: 300, dur: 0.1, gain: 0.24, noiseGain: 0.09 },
  // 汽笛 peluit uap kereta (naik lalu tahan).
  steamWhistle: { kind: 'noise', dur: 1.6, gain: 0.12, type: 'bandpass', fromHz: 900, toHz: 1800, q: 1.1, curve: 'soft' },
  // 電信 telegraf "tit-tit" (klik pendek tajam, dua ketuk).
  telegraph: { kind: 'wood', from: 1600, to: 1200, dur: 0.05, gain: 0.16, noiseGain: 0.05 },
  // 掛け声 sorak penjual koran (nyaring, pendek) — kota yang ramai.
  paperCry: { kind: 'noise', dur: 0.5, gain: 0.08, type: 'bandpass', fromHz: 1400, toHz: 800, q: 1.5, curve: 'soft' },

  // ── Shōwa 昭和 (kota beton) — mesin, kereta cepat, sekolah, 歌謡曲 ──────────
  // 蝉 cicada (ミンミンゼミ) — denging musim panas Shōwa (latar pasca-perang).
  cicada: { kind: 'noise', dur: 1.4, gain: 0.05, type: 'bandpass', fromHz: 4200, toHz: 5200, q: 3.2, curve: 'soft' },
  // 歌謡曲 kayōkyoku — petikan gitar bersih pentatonik+blues (nostalgia).
  kayokyoku: { kind: 'pluck', from: 220, dur: 1.2, gain: 0.15, overtoneGain: 0.14, filterHz: 1900, bend: -10 },
  // 杭打ち tiang pancang beton — "dug-dug" berat, rendah (pondasi kota).
  pileDriver: { kind: 'drum', from: 78, to: 34, dur: 0.62, gain: 0.32, noiseGain: 0.1 },
  // 新幹線 — kereta cepat melintas (desis naik cepat, bukan peluit uap).
  shinkansen: { kind: 'noise', dur: 1.3, gain: 0.11, type: 'bandpass', fromHz: 700, toHz: 3200, q: 0.9, curve: 'soft' },
  // チャイム sekolah — bel dua nada (ta-ding) khas sekolah Shōwa.
  schoolChime: { kind: 'bell', baseHz: 523.25, partials: [1, 2.0, 2.76, 4.0], dur: 2.0, gain: 0.1 },
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
    case 'wood':
      // Blok kayu: denyut rendah pendek + klik noise tinggi (karakter "tok").
      tone(ctx, t, { type: 'triangle', from: p.from, to: p.to, dur: p.dur, gain: g(p.gain), attack: 0.004 });
      noiseSweep(ctx, t, { dur: p.dur * 0.6, gain: g(p.noiseGain), type: 'bandpass', fromHz: 2600, toHz: 1100, q: 1.6 });
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

  // ── Edo 江戸: kota cetak — lebih ramai & ritmis dari Heian ─────────────────
  // market: siang pasar (日本橋, 浅草寺). Lebih cerah, ada denyut cepat.
  market: {
    level: 0.1, fadeInMs: 1400, fadeOutMs: 800,
    drone: { freqs: [73.42, 146.83], detune: [0, -5], gain: 0.34 },
    pad: { type: 'triangle', freqs: [293.66, 369.99, 440], filterHz: 1200, lfoHz: 0.12, lfoDepth: 260, gain: 0.28 },
    air: { type: 'bandpass', hz: 1100, gain: 0.05 },
  },
  // print: bengkel cetak (浮世絵). Sunyi, kayu, tinta.
  print: {
    level: 0.08, fadeInMs: 1600, fadeOutMs: 900,
    drone: { freqs: [61.74, 123.47], detune: [0, -4], gain: 0.4 },
    pad: { type: 'triangle', freqs: [246.94, 311.13], filterHz: 900, lfoHz: 0.06, lfoDepth: 200, gain: 0.26 },
    air: { type: 'lowpass', hz: 700, gain: 0.05 },
  },
  // night: 夜市 (提灯). Gelap, hangat, sedikit misterius.
  night: {
    level: 0.11, fadeInMs: 1800, fadeOutMs: 1100,
    drone: { freqs: [49, 98], detune: [0, -6], gain: 0.44 },
    pad: { type: 'triangle', freqs: [174.61, 233.08], filterHz: 720, lfoHz: 0.05, lfoDepth: 240, gain: 0.32 },
    air: { type: 'lowpass', hz: 480, gain: 0.055 },
  },
  // festival: 両国 (花火 & 相撲). Paling hidup — denyut cepat, terang.
  festival: {
    level: 0.12, fadeInMs: 1200, fadeOutMs: 900,
    drone: { freqs: [65.41, 130.81, 196], detune: [0, -4, 4], gain: 0.4 },
    pad: { type: 'triangle', freqs: [329.63, 392, 523.25], filterHz: 1500, lfoHz: 0.16, lfoDepth: 300, gain: 0.3 },
    air: { type: 'bandpass', hz: 1400, gain: 0.05 },
  },

  // ── Meiji 明治: kota huruf logam — terang, mekanis, ada \"denyut mesin\" ─────
  // port: 横浜港 — pelabuhan dibuka (kapal uap, gerbang Barat).
  port: {
    level: 0.1, fadeInMs: 1400, fadeOutMs: 900,
    drone: { freqs: [55, 110, 130.81], detune: [0, -4, 3], gain: 0.4 },
    pad: { type: 'triangle', freqs: [261.63, 329.63, 392], filterHz: 1200, lfoHz: 0.1, lfoDepth: 240, gain: 0.28 },
    air: { type: 'bandpass', hz: 1000, gain: 0.05 },
  },
  // city: 銀座 — jalan bata & lampu gas (gaslight sore).
  city: {
    level: 0.1, fadeInMs: 1400, fadeOutMs: 900,
    drone: { freqs: [58.27, 116.54, 174.61], detune: [0, -4, 3], gain: 0.38 },
    pad: { type: 'triangle', freqs: [293.66, 369.99, 440], filterHz: 1300, lfoHz: 0.12, lfoDepth: 260, gain: 0.28 },
    air: { type: 'bandpass', hz: 1200, gain: 0.05 },
  },
  // press: 新聞社 — bengkel cetak (huruf logam, tinta).
  press: {
    level: 0.08, fadeInMs: 1600, fadeOutMs: 900,
    drone: { freqs: [61.74, 123.47], detune: [0, -4], gain: 0.4 },
    pad: { type: 'triangle', freqs: [246.94, 311.13], filterHz: 950, lfoHz: 0.07, lfoDepth: 200, gain: 0.26 },
    air: { type: 'lowpass', hz: 760, gain: 0.05 },
  },
  // school: 小学校 — ruang kelas (terang, tertib, lonceng).
  school: {
    level: 0.09, fadeInMs: 1600, fadeOutMs: 900,
    drone: { freqs: [65.41, 130.81], detune: [0, -5], gain: 0.36 },
    pad: { type: 'triangle', freqs: [329.63, 392], filterHz: 1400, lfoHz: 0.08, lfoDepth: 220, gain: 0.28 },
    air: { type: 'highpass', hz: 1100, gain: 0.045 },
  },
  // diet: 国会 — ruang sidang (agung, tangga mayor, sedikit menegangkan).
  diet: {
    level: 0.11, fadeInMs: 1500, fadeOutMs: 1000,
    drone: { freqs: [55, 110, 164.81], detune: [0, -4, 4], gain: 0.44 },
    pad: { type: 'triangle', freqs: [261.63, 329.63, 392], filterHz: 1250, lfoHz: 0.06, lfoDepth: 260, gain: 0.3 },
    air: { type: 'bandpass', hz: 900, gain: 0.05 },
  },

  // ── Shōwa 昭和: kota beton — drone BERAT & RENDAH (beton), pentatonik+blues ─
  // ruins: 焼け跡 — sunyi, abu, langit kosong. Paling kelam & lapang.
  ruins: {
    level: 0.09, fadeInMs: 2200, fadeOutMs: 1200,
    drone: { freqs: [41.2, 82.41], detune: [0, -6], gain: 0.5 },
    pad: { type: 'triangle', freqs: [146.83, 174.61], filterHz: 520, lfoHz: 0.04, lfoDepth: 300, gain: 0.3 },
    air: { type: 'lowpass', hz: 320, gain: 0.06 },
  },
  // yamichi: 闇市 — malam pasar, hangat samar (bohlam), hidup keras.
  yamichi: {
    level: 0.1, fadeInMs: 1600, fadeOutMs: 1000,
    drone: { freqs: [49, 98], detune: [0, -5], gain: 0.46 },
    pad: { type: 'triangle', freqs: [196, 233.08], filterHz: 760, lfoHz: 0.06, lfoDepth: 240, gain: 0.3 },
    air: { type: 'bandpass', hz: 700, gain: 0.05 },
  },
  // danchi: 団地 — siang beton (terang, netral, sedikit kosong).
  danchi: {
    level: 0.1, fadeInMs: 1600, fadeOutMs: 900,
    drone: { freqs: [49, 98, 116.54], detune: [0, -5, 2], gain: 0.48 },
    pad: { type: 'triangle', freqs: [220, 261.63, 329.63], filterHz: 1100, lfoHz: 0.08, lfoDepth: 220, gain: 0.28 },
    air: { type: 'bandpass', hz: 1000, gain: 0.05 },
  },
  // expo: 万博 — masa depan 1970 (paling terang, sentuhan harapan, pentatonik).
  expo: {
    level: 0.12, fadeInMs: 1400, fadeOutMs: 1000,
    drone: { freqs: [49, 98, 146.83], detune: [0, -4, 4], gain: 0.46 },
    pad: { type: 'triangle', freqs: [261.63, 329.63, 392, 440], filterHz: 1400, lfoHz: 0.12, lfoDepth: 260, gain: 0.3 },
    air: { type: 'bandpass', hz: 1300, gain: 0.05 },
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
