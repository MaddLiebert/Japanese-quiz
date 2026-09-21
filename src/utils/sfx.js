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

// ── Gong bertingkat untuk streak (keputusan user #2/#4/#6) ──────────────────
// Lapisan bertambah sesuai tier: 1 nada (<3) → 2 (3-9) → 3 (10-49) → chord (50+).
const STREAK_LAYERS = (level) => {
  const L = level || 0;
  if (L <= 0) return 1;   // dasar
  if (L <= 2) return 2;   // streak 3-9
  if (L <= 6) return 3;   // streak 10-49
  return 6;               // streak 50+ = chord penuh
};

// Rasio partial gong (inharmonik khas logam). Dipakai bertahap sesuai lapisan.
const GONG_RATIOS = [1, 1.51, 2.13, 2.74, 3.61, 4.29];

export const playStreakSound = (level = 0) => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const layers = STREAK_LAYERS(level);
  const t = ctx.currentTime;
  // Makin tinggi tier → makin panjang & makin dalam.
  const dur = 1.2 + layers * 0.22;
  const base = 150 - layers * 8;          // makin banyak lapisan, makin rendah/dalam
  const peak = 0.30 / Math.sqrt(layers);  // bagi rata supaya tidak clipping

  for (let i = 0; i < layers; i++) {
    const ratio = GONG_RATIOS[i % GONG_RATIOS.length];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base * ratio, t);
    // sedikit melengkung turun = karakter gong yang "mengendap"
    osc.frequency.exponentialRampToValueAtTime(base * ratio * 0.94, t + dur);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak / (i + 1), t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  }

  // Lapisan tinggi dapat "pukulan" noise (stik menghantam logam).
  if (layers >= 3) {
    const len = Math.floor(ctx.sampleRate * 0.09);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const noise = ctx.createBufferSource();
    const nFilter = ctx.createBiquadFilter();
    const nGain = ctx.createGain();
    nFilter.type = 'bandpass';
    nFilter.frequency.value = 1800 + layers * 120;
    nGain.gain.setValueAtTime(0.10 + layers * 0.02, t);
    noise.buffer = buf;
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(t);
  }
};
