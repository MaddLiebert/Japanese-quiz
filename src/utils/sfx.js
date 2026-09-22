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

// ── Gong bertingkat untuk streak — KONTINU (halus) ──────────────────────────
// Level 1..12 (dari MILESTONES, boleh pecahan) dipetakan ke "panas" 0..1 yang
// mulus, lalu tiap partial gong muncul bertahap. Jadi tiap kenaikan streak
// mengubah suara sedikit-sedikit — bukan lompat 4 tangga.
const GONG_RATIOS = [1, 1.51, 2.13, 2.74, 3.61, 4.29]; // partial inharmonik khas logam
const MAX_LEVEL = 12;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const heatFor = (level) => clamp01(((level || 0) - 1) / (MAX_LEVEL - 1));

export const playStreakSound = (level = 0) => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const heat = heatFor(level);                 // 0..1 mulus
  const t = ctx.currentTime;

  // Parameter kontinu: makin panas → makin panjang, dalam, dan kaya.
  const dur = 1.2 + heat * 1.8;                // 1.2s → 3.0s
  const base = 150 - heat * 40;                // 150Hz → 110Hz (makin dalam)
  const partialLevel = 2 + heat * (GONG_RATIOS.length - 2); // 2 → 6 partial (pecahan)
  const weights = GONG_RATIOS.map((_, i) => clamp01(partialLevel - i));
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;
  const peak = 0.30;                           // total energi konstan → tidak clipping

  GONG_RATIOS.forEach((ratio, i) => {
    const w = weights[i];
    if (w <= 0.001) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base * ratio, t);
    // sedikit melengkung turun = karakter gong yang "mengendap"
    osc.frequency.exponentialRampToValueAtTime(base * ratio * 0.94, t + dur);

    const g = peak * (w / totalW);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(g, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  });

  // "Pukulan" stik menghantam logam: muncul mulus mulai panas menengah.
  const strike = clamp01(heat * 1.8 - 0.5);    // 0 sampai 1, mulai ~heat 0.28
  if (strike > 0.001) {
    const len = Math.floor(ctx.sampleRate * 0.09);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const noise = ctx.createBufferSource();
    const nFilter = ctx.createBiquadFilter();
    const nGain = ctx.createGain();
    nFilter.type = 'bandpass';
    nFilter.frequency.value = 1800 + heat * 900;
    nGain.gain.setValueAtTime((0.08 + heat * 0.12) * strike, t);
    noise.buffer = buf;
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(t);
  }
};
