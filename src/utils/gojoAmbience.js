// ─────────────────────────────────────────────────────────────────────────────
// Ambience Gojo: BGM 領域展開 + hum bola persist + ducking.
// Semua fungsi no-op (return false) di node/test — aman di-import di mana pun.
// Angka ada di sfx.js (domainBgmPlan / ballHumPlan) — satu titik tune.
// ─────────────────────────────────────────────────────────────────────────────
import { getAudioContext, domainBgmPlan, ballHumPlan } from './sfx.js';   // WAJIB pakai .js: file ini di-load node --test (ESM butuh specifier lengkap)

const hasWindow = () => typeof window !== 'undefined';

let bgm = null;              // { master, nodes, level, fadeOutMs }
let hums = { ao: null, aka: null };
let duckTimer = null;

// Debug hook (dev-only): window.__gojoAmbience → dipakai verifikasi browser & DevPanel.
const setDebug = (patch) => {
  if (!hasWindow()) return;
  if (!(import.meta.env && import.meta.env.DEV)) return;   // Vite: hilang di build produksi
  window.__gojoAmbience = {
    ...(window.__gojoAmbience || { bgm: false, balls: { ao: false, aka: false }, duckUntil: 0 }),
    ...patch,
  };
};

// Ramp turun + matikan node (stop aman walau node sudah berhenti).
const rampDown = (entry, fadeMs, target) => {
  const ctx = getAudioContext();
  if (!ctx || !entry) return;
  const t = ctx.currentTime;
  const fade = Math.max(0.05, fadeMs / 1000);
  entry.master.gain.cancelScheduledValues(t);
  entry.master.gain.setValueAtTime(Math.max(entry.master.gain.value, 0.0001), t);
  entry.master.gain.exponentialRampToValueAtTime(Math.max(target, 0.0001), t + fade);
  entry.nodes.forEach((n) => { try { n.stop(t + fade + 0.1); } catch { /* sudah berhenti */ } });
};

// ── BGM 領域展開 ────────────────────────────────────────────────────────────
export const startDomainBgm = () => {
  if (!hasWindow() || bgm) return false;
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') ctx.resume();
  const p = domainBgmPlan();
  const t = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(p.level, t + p.fadeInMs / 1000);
  master.connect(ctx.destination);
  const nodes = [];

  // Drone bass: 2 sine nyaris sama (detune kecil) → beat pelan, terasa "hidup".
  p.drone.freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (osc.detune) osc.detune.setValueAtTime(p.drone.detune[i] || 0, t);
    g.gain.setValueAtTime(p.drone.gain / p.drone.freqs.length, t);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    nodes.push(osc);
  });

  // Pad: triangle lewat lowpass yang dibuka-tutup LFO 0.06Hz.
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.setValueAtTime(p.pad.filterHz, t);
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(p.pad.lfoHz, t);
  lfoGain.gain.setValueAtTime(p.pad.lfoDepth, t);
  lfo.connect(lfoGain);
  lfoGain.connect(padFilter.frequency);
  lfo.start(t);
  nodes.push(lfo);
  p.pad.freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = p.pad.type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(p.pad.gain / p.pad.freqs.length, t);
    osc.connect(g);
    g.connect(padFilter);
    osc.start(t);
    nodes.push(osc);
  });
  padFilter.connect(master);

  bgm = { master, nodes, level: p.level, fadeOutMs: p.fadeOutMs };
  setDebug({ bgm: true });
  return true;
};

export const stopDomainBgm = () => {
  if (!bgm) return false;
  rampDown(bgm, bgm.fadeOutMs, 0.0001);
  bgm = null;
  setDebug({ bgm: false });
  return true;
};

// ── Hum bola persist ────────────────────────────────────────────────────────
const makeHum = (kind) => {
  const ctx = getAudioContext();
  if (!ctx) return null;
  const plan = ballHumPlan({ ao: kind === 'ao', aka: kind === 'aka' })[kind];
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(plan.level, t + plan.fadeInMs / 1000);
  master.connect(ctx.destination);
  const nodes = [];

  // Osc + tremolo pelan (desir/gemuruh yang "bernafas", bukan nada datar).
  const osc = ctx.createOscillator();
  osc.type = plan.osc.type;
  osc.frequency.setValueAtTime(plan.osc.freq, t);
  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(plan.osc.gain, t);
  const trem = ctx.createOscillator();
  const tremGain = ctx.createGain();
  trem.frequency.setValueAtTime(plan.tremolo.hz, t);
  tremGain.gain.setValueAtTime(plan.tremolo.depth, t);
  trem.connect(tremGain);
  tremGain.connect(oscGain.gain);
  trem.start(t);
  nodes.push(trem);
  osc.connect(oscGain);
  oscGain.connect(master);
  osc.start(t);
  nodes.push(osc);

  // Lapisan noise loop (ao = desis udara, aka = crackle) — buffer 1.5s di-loop.
  const len = Math.max(1, Math.floor(ctx.sampleRate * 1.5));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = plan.noise.filterType;
  f.frequency.setValueAtTime(plan.noise.filterHz, t);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(plan.noise.gain, t);
  src.connect(f);
  f.connect(ng);
  ng.connect(master);
  src.start(t);
  nodes.push(src);

  return { master, nodes, level: plan.level, fadeOutMs: 400 };
};

// Idempotent: panggil berkali-kali dengan set bola yang sama → tidak dobel.
export const setBallHum = (balls = {}) => {
  if (!hasWindow()) return false;
  const want = { ao: Boolean(balls.ao), aka: Boolean(balls.aka) };
  let changed = false;
  for (const kind of ['ao', 'aka']) {
    if (want[kind] && !hums[kind]) { hums[kind] = makeHum(kind); changed = true; }
    if (!want[kind] && hums[kind]) { rampDown(hums[kind], 400, 0.0001); hums[kind] = null; changed = true; }
  }
  if (changed) setDebug({ balls: { ao: Boolean(hums.ao), aka: Boolean(hums.aka) } });
  return changed;
};

export const stopBallHum = () => {
  if (!hums.ao && !hums.aka) return false;
  for (const kind of ['ao', 'aka']) {
    if (hums[kind]) { rampDown(hums[kind], 400, 0.0001); hums[kind] = null; }
  }
  setDebug({ balls: { ao: false, aka: false } });
  return true;
};

// ── Ducking: pelankan ambience saat klip suara jawaban/cast berbunyi ────────
export const duckAmbience = (ms = 1200) => {
  if (!hasWindow()) return false;
  const ctx = getAudioContext();
  if (!ctx) return false;
  const entries = [bgm, hums.ao, hums.aka].filter(Boolean);
  if (!entries.length) return false;
  const t = ctx.currentTime;
  entries.forEach((e) => {
    e.master.gain.cancelScheduledValues(t);
    e.master.gain.setValueAtTime(Math.max(e.master.gain.value, 0.0001), t);
    e.master.gain.exponentialRampToValueAtTime(Math.max(e.level * 0.25, 0.0001), t + 0.12);
  });
  if (duckTimer) clearTimeout(duckTimer);
  duckTimer = setTimeout(() => {
    const now = getAudioContext();
    if (!now) return;
    const t2 = now.currentTime;
    [bgm, hums.ao, hums.aka].filter(Boolean).forEach((e) => {
      e.master.gain.cancelScheduledValues(t2);
      e.master.gain.setValueAtTime(Math.max(e.master.gain.value, 0.0001), t2);
      e.master.gain.exponentialRampToValueAtTime(e.level, t2 + 0.35);
    });
  }, Math.max(300, ms));
  setDebug({ duckUntil: Date.now() + ms });
  return true;
};

export const stopAllAmbience = () => {
  const a = stopDomainBgm();
  const b = stopBallHum();
  return a || b;
};
