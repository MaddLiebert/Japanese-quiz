let audioCtx;

const initAudioContext = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  return audioCtx;
};

export const playCorrectSound = () => {
  const ctx = initAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const t = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = 'sine';
  
  // Ascending chime (C5 to E5)
  osc.frequency.setValueAtTime(523.25, t);
  osc.frequency.exponentialRampToValueAtTime(659.25, t + 0.1);

  // Bright fade out
  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(0.8, t + 0.03);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

  osc.start(t);
  osc.stop(t + 0.6);
};

export const playWrongSound = () => {
  const ctx = initAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const t = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = 'triangle';
  
  // Low thud
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);

  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(0.8, t + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

  osc.start(t);
  osc.stop(t + 0.25);
};

// ── Gong bertingkat untuk streak — KONTINU & AUDIBLE ────────────────────────
// Catatan: gong versi lama pakai base 110-150Hz @ gain 0.05-0.15 → praktis
// SENYAP di speaker laptop/HP (yang meredam < ~200Hz). Sekarang base dinaikkan
// ke rentang audible, partial selalu menyertakan konten terang (>=500Hz),
// total gain disetel setara chime, dan intensitas naik dari jumlah partial +
// transient + durasi (bukan dari menurunkan frekuensi).
const GONG_RATIOS = [1, 2.55, 3.8, 5.2, 6.9, 8.8]; // partial, rasio 2 pertama sudah terang
const MAX_LEVEL = 12;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const heatFor = (level) => clamp01(((level || 0) - 1) / (MAX_LEVEL - 1));

// Murni (tanpa Web Audio) supaya bisa dites dengan `node --test`.
// Mengembalikan parameter gong untuk sebuah level streak.
export function streakGongParams(level = 0) {
  const heat = heatFor(level);

  const base = 200 + heat * 60;              // 200 -> 260 Hz (audible, naik ringan)
  const dur = 1.0 + heat * 1.6;              // 1.0 -> 2.6 s
  const partialLevel = 2 + heat * (GONG_RATIOS.length - 2); // 2 -> 6 partial
  const weights = GONG_RATIOS.map((_, i) => clamp01(partialLevel - i));
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;
  const peak = 0.85;                         // total energi (setara chime 0.8)

  const partials = GONG_RATIOS
    .map((ratio, i) => ({
      freq: base * ratio,
      gain: peak * (weights[i] / totalW),
      weight: weights[i],
    }))
    .filter((p) => p.weight > 0.001);

  const strike = {
    freq: 2200 + heat * 1400,                 // 2200 -> 3600 Hz (terang, nembus)
    gain: clamp01(heat * 1.6 - 0.3) * 0.18,   // muncul mulai tier menengah
    dur: 0.06,
  };

  return { heat, base, dur, partials, strike };
}

export const playStreakSound = (level = 0) => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const { dur, partials, strike } = streakGongParams(level);
  const t = ctx.currentTime;

  // Body gong: osilator sine, serangan cepat + ekor "mengendap".
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

  // Transient "stik menghantam logam": tinggi & pendek supaya jelas terdengar.
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
