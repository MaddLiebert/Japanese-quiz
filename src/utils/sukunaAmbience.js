// ─────────────────────────────────────────────────────────────────────────────
// Ambience Sukuna: BGM 伏魔御廚子 yang MENCEKAM (kritik user 28/09 v3:
// "tambahin bgm mencekam khas sukuna buat domain dia").
//
// Lapisan (semua Web Audio, tanpa file mp3 — pola gojoAmbience):
//   1. drone   : 2 sine nyaris sama (beat pelan) + sub 41.2Hz — ruangan berat
//   2. organ   : saw 55/82.41/110Hz (A1-E2-A2, tritone gelap) lowpass + swell
//   3. pad     : triangle lembut di mid (kedengaran di speaker HP)
//   4. taiko   : loop 16 step × 0.5 dtk = 8 dtk, aksen pukulan ganda tiap 2 dtk
//   5. motif   : koto hirajoshi turun (A-B-C-E-F) — "tanda bahaya" khas Sukuna
//   6. bel kuil: partial inharmonik tiap 4 dtk
//   7. bisikan : noise bandpass termodulasi pelan (呪詞)
//
// Scheduler taiko/motif pakai LOOKAHEAD (150ms tick, 0.7s ahead) + waktu ctx
// ABSOLUT → irama tidak goyang karena jitter setTimeout (pelajaran metronome).
// Semua fungsi no-op (return false) di node/test — aman di-import di mana pun.
// Angka desain di sfx.js (sukunaBgmPlan) — satu titik tune.
// ─────────────────────────────────────────────────────────────────────────────
import { getAudioContext, sukunaBgmPlan, sukunaBellParams, playSukunaTaiko, playSukunaMotif } from './sfx.js';   // WAJIB pakai .js: file ini di-load node --test (ESM butuh specifier lengkap)

const hasWindow = () => typeof window !== 'undefined';

let bgm = null;              // { master, nodes, level, fadeOutMs, bellTimer, schedTimer, bellNodes }
let duckTimer = null;

// Debug hook (dev-only): window.__sukunaAmbience → verifikasi browser & DevPanel.
const setDebug = (patch) => {
  if (!hasWindow()) return;
  if (!(import.meta.env && import.meta.env.DEV)) return;   // Vite: hilang di build produksi
  window.__sukunaAmbience = {
    ...(window.__sukunaAmbience || { bgm: false, bells: 0, taiko: 0, steps: 0, duckUntil: 0 }),
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

// Satu bel kuil (inharmonik) dijadwalkan pada waktu absolut `at` (ctx time).
// Dipakai oleh loop bel tiap 4 dtk — formula SAMA dengan playSukunaBell
// (gain / (1 + ratio*0.55), decay dur*(1-ratio/22)) supaya karakter bunyi konsisten.
const scheduleBell = (ctx, master, at) => {
  const p = sukunaBellParams();
  p.partials.forEach((ratio) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.baseHz * ratio, at);
    const partialGain = p.gain / (1 + ratio * 0.55);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(partialGain, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, at + p.dur * (1 - ratio / 22));
    osc.connect(g);
    g.connect(master);
    osc.start(at);
    osc.stop(at + p.dur + 0.1);
  });
};

// ── BGM 伏魔御廚子 ──────────────────────────────────────────────────────────
export const startSukunaDomainBgm = () => {
  if (!hasWindow() || bgm) return false;
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') ctx.resume();
  const p = sukunaBgmPlan();
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

  // Organ gelap: saw register rendah lewat lowpass yang dibuka-tutup swell pelan.
  // (Sumber "mencekam": tritone A1/E2 + filter yang bergerak seperti napas.)
  const organFilter = ctx.createBiquadFilter();
  organFilter.type = 'lowpass';
  organFilter.frequency.setValueAtTime(p.organ.filterHz, t);
  organFilter.Q.setValueAtTime(p.organ.q, t);
  const organLfo = ctx.createOscillator();
  const organLfoGain = ctx.createGain();
  organLfo.frequency.setValueAtTime(p.organ.swellHz, t);
  organLfoGain.gain.setValueAtTime(p.organ.swellDepth, t);
  organLfo.connect(organLfoGain);
  organLfoGain.connect(organFilter.frequency);
  organLfo.start(t);
  nodes.push(organLfo);
  const organGain = ctx.createGain();
  organGain.gain.setValueAtTime(p.organ.gain, t);
  organFilter.connect(organGain);
  organGain.connect(master);
  p.organ.freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = p.organ.type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(1 / p.organ.freqs.length, t);
    osc.connect(g);
    g.connect(organFilter);
    osc.start(t);
    nodes.push(osc);
  });

  // Pad: triangle lewat lowpass yang dibuka-tutup LFO pelan.
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

  // Bisikan 呪詞: noise bandpass 300–1200Hz termodulasi pelan (suara doa jauh).
  const wLen = Math.max(1, Math.floor(ctx.sampleRate * 2.2));
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
  wLfoGain.gain.setValueAtTime(260, t);
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

  // Bel kuil tiap 4 dtk (lookahead sederhana: setTimeout + jadwal ctx absolute).
  let bells = 0;
  const bellTimer = setInterval(() => {
    const now = getAudioContext();
    if (!now) return;
    scheduleBell(now, master, now.currentTime + 0.02);
    bells += 1;
    setDebug({ bells });
  }, p.bellEveryMs);

  // ── Scheduler taiko + motif koto (lookahead, irama stabil) ────────────────
  // Loop 16 step × 0.5 dtk = 8 dtk. `nextStepAt` = waktu ctx absolut step
  // berikutnya; tiap 150ms kita jadwalkan semua step yang jatuh ≤0.7s ke depan.
  // Taiko & motif diputar lewat master (bukan langsung ke destination) supaya
  // ducking ikut memelankan BGM saat klip voice bunyi.
  const stepS = p.taiko.stepS;
  const loopSteps = p.taiko.loopSteps;
  const lookaheadS = 0.7;
  const taikoSteps = new Set(p.taiko.steps);
  const accentSteps = new Set(p.taiko.accents);
  let step = 0;
  let nextStepAt = ctx.currentTime + 0.25;   // masuk halus setelah fade-in mulai
  let taikoHits = 0;
  let motifNotes = 0;

  const scheduleStep = (stepIndex, at) => {
    if (taikoSteps.has(stepIndex)) {
      const accent = accentSteps.has(stepIndex);
      playSukunaTaiko(accent, at, master);
      taikoHits += accent ? 2 : 1;
      setDebug({ taiko: taikoHits, steps: stepIndex });
    }
    const every = p.motif.stepEvery;
    if (stepIndex % every === 0) {
      const idx = (stepIndex / every) % p.motif.notes.length;
      playSukunaMotif(p.motif.notes[idx], at, master);
      motifNotes += 1;
      setDebug({ motif: motifNotes });
    }
  };

  const schedTimer = setInterval(() => {
    const now = getAudioContext();
    if (!now) return;
    // Autoplay policy: context bisa ter-suspend (belum ada gesture) → currentTime
    // BEKU → loop tak pernah jalan (taiko/motif mati diam-diam). Bangunkan tiap
    // tick; begitu currentTime maju, scheduler lanjut sendiri (self-healing).
    if (now.state === 'suspended') now.resume();
    while (nextStepAt < now.currentTime + lookaheadS) {
      scheduleStep(step, nextStepAt);
      step = (step + 1) % loopSteps;
      nextStepAt += stepS;
    }
  }, 150);

  bgm = { master, nodes, level: p.level, fadeOutMs: p.fadeOutMs, bellTimer, schedTimer };
  setDebug({ bgm: true, bells: 0, taiko: 0, steps: 0, motif: 0 });
  return true;
};

export const stopSukunaDomainBgm = () => {
  if (!bgm) return false;
  if (bgm.bellTimer) clearInterval(bgm.bellTimer);
  if (bgm.schedTimer) clearInterval(bgm.schedTimer);
  rampDown(bgm, bgm.fadeOutMs, 0.0001);
  bgm = null;
  setDebug({ bgm: false });
  return true;
};

// ── Ducking: pelankan ambience saat klip voice Sukuna bunyi ─────────────────
export const duckSukunaAmbience = (ms = 1200) => {
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

export const stopAllSukunaAmbience = () => stopSukunaDomainBgm();
