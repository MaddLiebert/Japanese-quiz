// ─────────────────────────────────────────────────────────────────────────────
// Ambience Megumi: BGM 影 (bayangan) yang hidup selama summon 魔虚羅.
// Beda karakter dari Sukuna (taiko perang) & Gojo (bola plasma): Megumi = SUNYI,
// DALAM, BERAT — ruang yang menelan. Spec §Ambience (Megumi.md):
//   • drone bayangan 55/110Hz + sub 41.2Hz
//   • pad gelap (triangle mid — kedengaran di speaker HP)
//   • bisikan 呪詞: noise bandpass 200–900Hz termodulasi pelan
//   • level 0.20, fadeIn 1600ms, fadeOut 900ms
//   • TANPA taiko/organ tritone (itu milik Sukuna — anti-nabrak)
//   • gema takik roda 八握剣 tiap 3.2 dtk (penanda adaptasi berjalan)
//
// Semua fungsi no-op (return false) di node/test — aman di-import di mana pun.
// Angka desain di sfx.js (megumiBgmPlan) — satu titik tune.
// ─────────────────────────────────────────────────────────────────────────────
import { getAudioContext, megumiBgmPlan, megumiWheelTickParams } from './sfx.js';   // WAJIB pakai .js: file ini di-load node --test (ESM butuh specifier lengkap)

const hasWindow = () => typeof window !== 'undefined';

let bgm = null;              // { master, nodes, level, fadeOutMs, wheelTimer }
let duckTimer = null;

// Debug hook (dev-only): window.__megumiAmbience → verifikasi browser & DevPanel.
const setDebug = (patch) => {
  if (!hasWindow()) return;
  if (!(import.meta.env && import.meta.env.DEV)) return;   // Vite: hilang di build produksi
  window.__megumiAmbience = {
    ...(window.__megumiAmbience || { bgm: false, wheelTicks: 0, duckUntil: 0 }),
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

// Satu ketukan roda 八握剣 dijadwalkan pada waktu absolut `at` (ctx time) →
// dua sine pendek (220→176Hz) + noise tipis: "tak-tak" kayu pelan.
const scheduleWheelTick = (ctx, master, at) => {
  const p = megumiWheelTickParams();
  [p.freq, p.freq2].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, at + i * 0.09);
    g.gain.setValueAtTime(0, at + i * 0.09);
    g.gain.linearRampToValueAtTime(p.gain, at + i * 0.09 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0008, at + i * 0.09 + p.dur);
    osc.connect(g);
    g.connect(master);
    osc.start(at + i * 0.09);
    osc.stop(at + i * 0.09 + p.dur + 0.05);
  });
};

// ── BGM 影 — hidup selama summon 魔虚羅 ─────────────────────────────────────
export const startMegumiShadowBgm = () => {
  if (!hasWindow() || bgm) return false;
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') ctx.resume();
  const p = megumiBgmPlan();
  const t = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(p.level, t + p.fadeInMs / 1000);
  master.connect(ctx.destination);
  const nodes = [];

  // Drone bayangan: 2 sine nyaris sama (detune kecil) → beat pelan, terasa "hidup".
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

  // Pad gelap: triangle lewat lowpass yang dibuka-tutup LFO pelan (napas bayangan).
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

  // Bisikan 呪詞: noise bandpass 200–900Hz termodulasi pelan (suara doa jauh).
  const wLen = Math.max(1, Math.floor(ctx.sampleRate * 2.4));
  const wBuf = ctx.createBuffer(1, wLen, ctx.sampleRate);
  const wData = wBuf.getChannelData(0);
  for (let i = 0; i < wLen; i++) wData[i] = Math.random() * 2 - 1;
  const wSrc = ctx.createBufferSource();
  wSrc.buffer = wBuf;
  wSrc.loop = true;
  const wFilter = ctx.createBiquadFilter();
  wFilter.type = p.whisper.filterType;
  wFilter.frequency.setValueAtTime(p.whisper.filterHz, t);
  wFilter.Q.setValueAtTime(p.whisper.q, t);
  // Modulasi filter pelan → bisikan "naik-turun" (bukan hiss statis).
  const wLfo = ctx.createOscillator();
  const wLfoGain = ctx.createGain();
  wLfo.frequency.setValueAtTime(p.whisper.modHz, t);
  wLfoGain.gain.setValueAtTime(p.whisper.modDepth, t);
  wLfo.connect(wLfoGain);
  wLfoGain.connect(wFilter.frequency);
  wLfo.start(t);
  nodes.push(wLfo);
  const wGain = ctx.createGain();
  wGain.gain.setValueAtTime(p.whisper.gain, t);
  wSrc.connect(wFilter);
  wFilter.connect(wGain);
  wGain.connect(master);
  wSrc.start(t);
  nodes.push(wSrc);

  // Gema takik roda 八握剣 tiap 3.2 dtk (penanda adaptasi berjalan).
  let wheelTicks = 0;
  const wheelTimer = setInterval(() => {
    const now = getAudioContext();
    if (!now) return;
    scheduleWheelTick(now, master, now.currentTime + 0.02);
    wheelTicks += 1;
    setDebug({ wheelTicks });
  }, p.wheelEveryMs);

  bgm = { master, nodes, level: p.level, fadeOutMs: p.fadeOutMs, wheelTimer };
  setDebug({ bgm: true, wheelTicks: 0 });
  return true;
};

export const stopMegumiShadowBgm = () => {
  if (!bgm) return false;
  if (bgm.wheelTimer) clearInterval(bgm.wheelTimer);
  rampDown(bgm, bgm.fadeOutMs, 0.0001);
  bgm = null;
  setDebug({ bgm: false });
  return true;
};

// ── Ducking: pelankan ambience saat klip voice Megumi bunyi ─────────────────
export const duckMegumiAmbience = (ms = 1200) => {
  if (!hasWindow()) return false;
  const ctx = getAudioContext();
  if (!ctx || !bgm) return false;
  const t = ctx.currentTime;
  bgm.master.gain.cancelScheduledValues(t);
  bgm.master.gain.setValueAtTime(Math.max(bgm.master.gain.value, 0.0001), t);
  bgm.master.gain.exponentialRampToValueAtTime(Math.max(bgm.level * 0.25, 0.0001), t + 0.12);
  if (duckTimer) clearTimeout(duckTimer);
  duckTimer = setTimeout(() => {
    const now = getAudioContext();
    if (!now || !bgm) return;
    const t2 = now.currentTime;
    bgm.master.gain.cancelScheduledValues(t2);
    bgm.master.gain.setValueAtTime(Math.max(bgm.master.gain.value, 0.0001), t2);
    bgm.master.gain.exponentialRampToValueAtTime(bgm.level, t2 + 0.35);
  }, Math.max(300, ms));
  setDebug({ duckUntil: Date.now() + ms });
  return true;
};

export const stopAllMegumiAmbience = () => stopMegumiShadowBgm();
