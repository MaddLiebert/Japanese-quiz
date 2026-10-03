// ─────────────────────────────────────────────────────────────────────────────
// Audio TEMA per-era (docs/tema/heian.md §9 T12).
//
//   • BGM tema: disintesis via Web Audio (gagaku/koto pentatonik) — TIDAK ada
//     file aset, jadi tema langsung jalan tanpa unduhan. Angka desain ada di
//     sfx.js (`themeBgmPlan`) → satu titik tune, dites murni.
//   • Default **OFF** (spec §9 R5: "BGM mengganggu saat kuis → default OFF,
//     user menyalakan sendiri"). Preferensi persist di localStorage.
//   • Autoplay policy: TIDAK memaksa apa pun yang melanggar kebijakan browser.
//     `startThemeBgm` hanya membunyikan kalau AudioContext sudah 'running';
//     `unlockThemeAudio` memasang listener gesture SEKALI untuk resume.
//
// Semua fungsi no-op di node (`node --test`) → aman di-import di mana pun.
// ─────────────────────────────────────────────────────────────────────────────
import { getAudioContext, themeBgmPlan } from '../../utils/sfx.js';   // WAJIB .js: file ini di-load node --test (ESM butuh specifier lengkap)

const hasWindow = () => typeof window !== 'undefined';

// Preferensi persist (default OFF — spec §9 R5).
export const THEME_BGM_KEY = 'app_theme_bgm';
// Volume BGM: pengali 0..1 di atas level dasar plan (−18 dB). Persist.
export const THEME_BGM_VOL_KEY = 'app_theme_bgm_volume';
export const DEFAULT_THEME_BGM_VOLUME = 1;
// Tangga volume untuk tombol kecil/besar (5 tingkat).
export const THEME_BGM_VOL_STEPS = [0.2, 0.4, 0.6, 0.8, 1];
// Event internal: dipakai host (ThemeAudioHost) supaya ikut bereaksi saat
// toggle di Pengaturan diubah (tanpa perlu context React global).
export const THEME_BGM_EVENT = 'theme-bgm-changed';

export const themeBgmEnabled = () => {
  if (!hasWindow()) return false;
  try { return localStorage.getItem(THEME_BGM_KEY) === 'on'; } catch { return false; }
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export const themeBgmVolume = () => {
  if (!hasWindow()) return DEFAULT_THEME_BGM_VOLUME;
  try {
    const raw = parseFloat(localStorage.getItem(THEME_BGM_VOL_KEY));
    return Number.isFinite(raw) ? clamp01(raw) : DEFAULT_THEME_BGM_VOLUME;
  } catch { return DEFAULT_THEME_BGM_VOLUME; }
};

// Debug hook (dev-only): window.__themeAudio → verifikasi browser & DevPanel.
const setDebug = (patch) => {
  if (!hasWindow()) return;
  if (!(import.meta.env && import.meta.env.DEV)) return;   // Vite: hilang di build produksi
  window.__themeAudio = {
    ...(window.__themeAudio || { bgm: false, era: null, enabled: false, volume: DEFAULT_THEME_BGM_VOLUME }),
    ...patch,
  };
};

// ── Ambil AudioContext + coba resume (TIDAK melanggar kebijakan) ─────────────
const ctxLive = () => {
  if (!hasWindow()) return null;
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (ctx.state === 'suspended') {
    try { ctx.resume().catch(() => {}); } catch { /* abaikan */ }
  }
  return ctx;
};

// Pasang listener gesture SEKALI; `onReady` dipanggil saat context 'running'.
// Mengembalikan fungsi cleanup. Idempoten.
let unlockBound = false;
export const unlockThemeAudio = (onReady) => {
  if (!hasWindow()) return () => {};
  let done = false;
  const ready = () => {
    if (done) return;
    done = true;
    if (typeof onReady === 'function') onReady();
  };
  const tryResume = () => {
    const ctx = getAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'running') { ready(); return true; }
    try {
      const p = ctx.resume();
      if (p && typeof p.then === 'function') p.then(() => { if (ctx.state === 'running') ready(); }).catch(() => {});
    } catch { /* abaikan */ }
    return ctx.state === 'running';
  };
  if (tryResume()) return () => {};
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

// Satu petikan koto dijadwalkan pada waktu absolut `at` (ctx time): triangle
// pendek (attack kilat, decay panjang) lewat lowpass lembut → "tek" kayu.
const scheduleKoto = (ctx, master, at, note, p) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(Math.max(600, note * 4), at);
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(note, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(p.gain, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0007, at + p.dur);
  osc.connect(f); f.connect(g); g.connect(master);
  osc.start(at); osc.stop(at + p.dur + 0.05);
};

// Bed BGM aktif (satu pada satu waktu; era lain = bed baru, crossfade).
let bed = null;

// Mulai BGM untuk `era`. Idempoten: era sama → tidak restart.
export const startThemeBgm = (era = 'heian') => {
  if (!hasWindow()) return false;
  const ctx = ctxLive();
  if (!ctx) return false;
  if (bed && bed.era === era) return false;
  const p = themeBgmPlan(era);
  const t = ctx.currentTime;

  const master = ctx.createGain();
  const target = clamp01(p.level * themeBgmVolume());
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(Math.max(target, 0.0001), t + p.fadeInMs / 1000);
  master.connect(ctx.destination);
  const nodes = [];

  // Drone: sine nyaris sama (detune kecil) → beat pelan, terasa "hidup".
  p.drone.freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (osc.detune) osc.detune.setValueAtTime(p.drone.detune[i] || 0, t);
    g.gain.setValueAtTime(p.drone.gain / p.drone.freqs.length, t);
    osc.connect(g); g.connect(master); osc.start(t); nodes.push(osc);
  });

  // Pad: triangle lewat lowpass yang dibuka-tutup LFO pelan (napas).
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
    osc.type = p.pad.type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(p.pad.gain / p.pad.freqs.length, t);
    osc.connect(g); g.connect(padFilter); osc.start(t); nodes.push(osc);
  });
  padFilter.connect(master);

  // Koto: petikan berurutan pada tangga hirajoshi tiap `everyMs` (deterministik).
  let kotoStep = 0;
  const playKoto = () => {
    const now = getAudioContext();
    if (!now || !bed || bed.era !== era) return;
    const note = p.koto.notes[kotoStep % p.koto.notes.length];
    scheduleKoto(now, master, now.currentTime + 0.02, note, p.koto);
    kotoStep += 1;
  };
  const kotoTimer = setInterval(playKoto, p.koto.everyMs);
  playKoto();   // petikan pertama langsung (bed belum sunyi menunggu 2.4s)

  const prev = bed;
  bed = { master, nodes, era, level: p.level, baseLevel: p.level, fadeOutMs: p.fadeOutMs, kotoTimer };
  if (prev) rampDown(prev, prev.fadeOutMs, 0.0001);
  setDebug({ bgm: true, era, enabled: themeBgmEnabled(), volume: themeBgmVolume() });
  return true;
};

export const stopThemeBgm = () => {
  if (!bed) return false;
  if (bed.kotoTimer) clearInterval(bed.kotoTimer);
  rampDown(bed, bed.fadeOutMs, 0.0001);
  bed = null;
  setDebug({ bgm: false, era: null });
  return true;
};

export const themeBgmActive = () => !!bed;
export const themeBgmEra = () => (bed ? bed.era : null);

// Terapkan volume ke bed yang sedang berbunyi (ramp halus, tanpa restart).
const applyVolumeToBed = (v) => {
  if (!bed) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const target = Math.max(clamp01(bed.baseLevel * clamp01(v)), 0.0001);
  bed.level = clamp01(bed.baseLevel * clamp01(v));
  bed.master.gain.cancelScheduledValues(t);
  bed.master.gain.setValueAtTime(Math.max(bed.master.gain.value, 0.0001), t);
  bed.master.gain.exponentialRampToValueAtTime(target, t + 0.25);
};

// Ubah volume (0..1). Persist + langsung ngefek ke BGM yang berbunyi.
export const setThemeBgmVolume = (v, { silent = false } = {}) => {
  const vol = clamp01(v);
  if (hasWindow()) {
    try { localStorage.setItem(THEME_BGM_VOL_KEY, String(vol)); } catch { /* abaikan */ }
  }
  setDebug({ volume: vol });
  applyVolumeToBed(vol);
  if (hasWindow() && !silent) {
    try { window.dispatchEvent(new CustomEvent(THEME_BGM_EVENT, { detail: { volume: vol } })); } catch { /* abaikan */ }
  }
  return vol;
};

// Indeks tangga volume terdekat dengan volume sekarang (untuk tombol besar/kecil).
export const themeBgmVolumeStep = () => {
  const v = themeBgmVolume();
  let best = 0;
  let bestD = Infinity;
  THEME_BGM_VOL_STEPS.forEach((s, i) => {
    const d = Math.abs(s - v);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
};

// Murni: jepit indeks ke rentang tangga.
export const clampVolumeStep = (i) =>
  Math.min(THEME_BGM_VOL_STEPS.length - 1, Math.max(0, i));

// Murni: indeks berikutnya setelah naik/turun satu tingkat (tak keluar batas).
export const nextVolumeStep = (i, dir) => clampVolumeStep(i + (dir > 0 ? 1 : -1));

// Naik/turunkan satu tingkat volume. `fromIndex` opsional (default: dari
// preferensi tersimpan) → memudahkan pemanggil yang menyimpan indeks di state.
export const stepThemeBgmVolume = (dir, fromIndex = themeBgmVolumeStep()) => {
  const idx = nextVolumeStep(fromIndex, dir);
  return setThemeBgmVolume(THEME_BGM_VOL_STEPS[idx]);
};

// Toggle dari Pengaturan: persist + bunyikan/matikan segera. `era` = era aktif
// (dipakai kalau baru dinyalakan). Mengembalikan state akhir.
export const setThemeBgmEnabled = (on, era = 'heian') => {
  const enabled = !!on;
  if (hasWindow()) {
    try { localStorage.setItem(THEME_BGM_KEY, enabled ? 'on' : 'off'); } catch { /* abaikan */ }
  }
  setDebug({ enabled });
  if (enabled) startThemeBgm(era);
  else stopThemeBgm();
  if (hasWindow()) {
    try { window.dispatchEvent(new CustomEvent(THEME_BGM_EVENT, { detail: { enabled, era } })); } catch { /* abaikan */ }
  }
  return enabled;
};
