// ─────────────────────────────────────────────────────────────────────────────
// Logika murni efek Toji Fushiguro (pack_13, visual 'toji') — 天与呪縛・術師殺し.
// Sumber desain: obsidian-mind/brain/Efek JJK/Toji.md (🔒 spec FINAL 30/09).
// Plan: .hermes/plans/2026-09-30_toji-fushiguro-pack13.md (T1–T6).
// Tanpa DOM / React / import JSON → dites `node --test` (pola gojoFx/yujiFx/
// sukunaFx/megumiFx/nobaraFx/nanamiFx). Komponen (TojiBurst/TojiShadow) &
// EffectContext HANYA baca dari sini.
//
// Identitas visual: 冷たい鋼 (つめたいはがね · tsumetai hagane = baja dingin).
// 呪力ゼロ (じゅりょくゼロ · juryoku zero) → TIDAK ADA GLOW 呪力. Beda dari
// yang lain: Gojo (plasma/ruang) · Yuji (api) · Sukuna (tebasan/kuil) ·
// Megumi (bayangan) · Nobara (paku & ledakan) · Nanami (garis 7:3 + emas) ·
// Toji = satu-satunya efek FISIK: kilau bilah, rantai, debu, darah.
//
// Filosofi: rarity `legendary` → ladder jurus + ultimate STATE 30 dtk dengan
// TIMER JALAN (TANPA Domain Expansion 領域展開). Mekanik FINAL A ·
// 武器庫・一撃離脱 (ぶきこ・いちげきりだつ · Bukiko Ichigeki Ridatsu):
//   benar selama state → +1 amunisi (cap 3) · salah → bayar 1 amunisi: soal
//   itu "dibunuh" (skip, streak AMAN, tanpa XP) · salah saat amunisi 0 →
//   salah biasa (streak hangus) + state bubar. Timeout = sama seperti salah.
//   PERSIAPAN — kesalahan dibayar dengan hasil kerja benar sebelumnya.
// ─────────────────────────────────────────────────────────────────────────────

// Milestone = sama persis Gojo/Yuji/Sukuna/Megumi/Nobara/Nanami (konsisten JJK).
export const TOJI_MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const isTojiMilestone = (streak) => TOJI_MILESTONES.includes(streak);

// ── Palet 冷たい鋼 (design token spec §Identitas visual — Photography Studio) ─
// 3 lapis tiap efek:
//   core = putih (kilatan impact 1 frame) · body = baja (bilah/motion streak) ·
//   edge = gunmetal gelap (bayangan bilah/rantai); 血 = aksen kritikal/残穢.
// 武器庫呪霊 (ぶきこじゅれい) = satu-satunya elemen "kutukan" (ungu gelap).
export const TOJI_FLASH = '#FFFFFF';     // core — kilatan impact 1 frame
export const TOJI_STEEL = '#CBD5E1';     // body — bilah baja, motion streak
export const TOJI_GUNMETAL = '#3F3F46';  // edge — bayangan bilah, rantai
export const TOJI_VOID = '#0C0C0C';      // veil/cast + siluet 黒 (くろ)
export const TOJI_BLOOD = '#DC2626';     // aksen kritikal & 残穢 (ざんえ) & kalah
export const TOJI_WORM = '#5B21B6';      // 武器庫呪霊 (ungu gelap)

export const TOJI_COLORS = {
  flash: TOJI_FLASH,
  steel: TOJI_STEEL,
  gunmetal: TOJI_GUNMETAL,
  void: TOJI_VOID,
  blood: TOJI_BLOOD,
  worm: TOJI_WORM,
};

export const TOJI_STYLE = {
  shakkontou:      { kanji: '釈魂刀',       color: TOJI_STEEL,   label: '釈魂刀 · Shakkontou' },
  banri_no_kusari: { kanji: '万里ノ鎖',     color: TOJI_GUNMETAL, label: '万里ノ鎖 · Banri no Kusari' },
  amanosakahoko:   { kanji: '天逆鉾',       color: TOJI_FLASH,   label: '天逆鉾 · Amanosakahoko' },
  yuuyun:          { kanji: '遊雲',         color: TOJI_STEEL,   label: '遊雲 · Yuuyun' },
  bukiko_jurei:    { kanji: '武器庫呪霊',   color: TOJI_WORM,    label: '武器庫呪霊 · Bukiko Jurei' },
  ult:             { kanji: '天与呪縛・全開', color: TOJI_BLOOD,   label: '天与呪縛・全開 · Tenyo Jubaku Zenkai' },
};

// ── Ladder jurus per streak (spec §Skill per streak — FINAL) ────────────────
// Non-streak = ROTASI deterministik 釈魂刀 ↔ 万里ノ鎖 (pola Sukuna/Megumi/
// Nobara/Nanami: bukan acak). Momen: 10 天逆鉾 · 20 遊雲 · 30+ 武器庫呪霊.
export const TOJI_LADDER = { 10: 'amanosakahoko', 20: 'yuuyun' };
export const TOJI_TOP = 30;
export const TOJI_NON_STREAK_CYCLE = ['shakkontou', 'banri_no_kusari'];

// Jawaban benar NON-momen ke berapa (1-based) — murni dari streak, stabil antar render.
export const tojiNonStreakIndex = (streak) => {
  if (!Number.isFinite(streak) || streak <= 0) return 0;
  const s = Math.floor(streak);
  const passed = Object.keys(TOJI_LADDER).filter((m) => s >= Number(m)).length;
  return s - passed;
};

export const tojiTechniqueFor = (kind, streak = 0) => {
  if (kind === 'wrong') return null;
  if (!Number.isFinite(streak) || streak <= 0) return null;
  const s = Math.floor(streak);
  if (s >= TOJI_TOP) return 'bukiko_jurei';
  if (TOJI_LADDER[s]) return TOJI_LADDER[s];
  const idx = tojiNonStreakIndex(s);
  if (idx <= 0) return null;
  return TOJI_NON_STREAK_CYCLE[(idx - 1) % TOJI_NON_STREAK_CYCLE.length];
};

// ── Bar 呪力: 20 slot (pola JJK konsisten) ──────────────────────────────────
export const TOJI_ULT_THRESHOLD = 20;
export const tojiCurseCharge = (streak) =>
  (Number.isFinite(streak) && streak > 0) ? Math.min(TOJI_ULT_THRESHOLD, Math.floor(streak)) : 0;
export const tojiUltReady = (streak) =>
  Number.isFinite(streak) && streak >= TOJI_ULT_THRESHOLD;

// ── Ultimate 天与呪縛・全開 — cinematic 4,54 dtk lalu STATE 30 dtk ──────────
// Timeline (detik) — sync ke klip cast.mp3 TERUKUR (PyAV, 4,539s ≈ 4,54s):
//   lead 0,06 · frasa 1 「禪院じゃねぇのか」 0,06–1,86 · JEDA DRAMATIS 1,86–3,04
//   (di sinilah bilah dicabut) · frasa 2 「よかったな」 3,04–3,92 · tail 4,5.
// JANGAN ditebak — angka dari pengukuran RMS; kalau klip cast diganti, ukur ulang.
export const TOJI_ULT_DURATION_S = 4.54;
export const TOJI_QUOTE = ['禪院じゃねぇのか', 'よかったな']; // 「禪院じゃねぇのか　よかったな」 (ch.113)
export const TOJI_CAST_VOICE = {
  dur: 4.54,
  lead: 0.06,
  phrase1: { start: 0.06, end: 1.86 },
  pause: { start: 1.86, end: 3.04 },   // jeda dramatis — bilah dicabut di sini
  phrase2: { start: 3.04, end: 3.92 },
  tail: 4.5,
};
export const TOJI_TIMELINE = {
  veilAt: 0,        // veil: layar meredup ke siluet 黒 (くろ)
  hushAt: 0.35,     // angin berhenti — hening (呪力ゼロ)
  wormAt: 1.2,      // 武器庫呪霊 masuk dari tepi, mulut menganga
  drawAt: 2.4,      // tangan masuk & mencabut 釈魂刀 (kilau baja) — di jeda dramatis
  quote1At: 0.06,   // kanji 「禪院じゃねぇのか」 per-frasa (merah darah, TANPA glow)
  quote2At: 3.04,   // kanji 「よかったな」 per-frasa
  slashAt: 4.1,     // tebasan silang X seluruh layar + shake + debu
  settleAt: 4.54,   // settle → masuk state 30 dtk + rail amunisi + counter
};

// State 30 dtk (pola `legendary` — timer JALAN; TANPA Domain Expansion).
export const TOJI_STATE_S = 30;

// Hitung mundur state (clamp 0..TOJI_STATE_S; input kotor → 0).
export const tojiStateLeft = (endsAt, now = Date.now()) => {
  if (!Number.isFinite(endsAt) || !Number.isFinite(now)) return 0;
  const left = Math.ceil((endsAt - now) / 1000);
  if (!Number.isFinite(left) || left <= 0) return 0;
  return Math.min(TOJI_STATE_S, left);
};

// Mulai hitung mundur SETELAH cinematic settle → 30 dtk itu waktu main penuh.
export const tojiStateStartDelayMs = () => Math.round(TOJI_ULT_DURATION_S * 1000);

// ── Mekanik 武器庫・一撃離脱 (FINAL A — keputusan Nacht) ────────────────────
// Ekonomi amunisi: benar → +1 senjata di rail (cap 3). Salah → bayar 1:
// soal itu "dibunuh" (術師殺し — skip ke soal berikutnya, streak AMAN, tanpa
// XP). Salah saat amunisi 0 → salah biasa (streak hangus) + state bubar.
// Timeout = sama seperti salah (konsisten).
export const TOJI_AMMO_MAX = 3;

// Benar selama state: +1 amunisi, clamp cap. Input kotor → 1 (benar tetap bernilai).
export const tojiAmmoGain = (ammo) => {
  const n = Number.isFinite(ammo) && ammo > 0 ? Math.floor(ammo) : 0;
  return Math.min(TOJI_AMMO_MAX, n + 1);
};

// Salah selama state: bayar 1 amunisi, clamp di 0 (tidak pernah negatif).
export const tojiAmmoSpend = (ammo) => {
  const n = Number.isFinite(ammo) && ammo > 0 ? Math.floor(ammo) : 0;
  return Math.max(0, n - 1);
};

// Hasil jawaban selama state:
//   correct → load (+1, cap) · wrong/timeout → spend (bayar 1, soal dibunuh;
//   streak AMAN) · amunisi 0 saat salah → break (salah biasa + state bubar).
export const tojiUltOutcome = (kind, ammo = 0) => {
  const a = Number.isFinite(ammo) && ammo > 0 ? Math.floor(ammo) : 0;
  if (kind === 'correct') return { ammo: tojiAmmoGain(a), outcome: 'load' };
  if (a <= 0) return { ammo: 0, outcome: 'break' };
  return { ammo: a - 1, outcome: 'spend' };
};

// Soal "dibunuh" (術師殺し): amunisi > 0 → SELURUH opsi tertebas (tidak ada
// reveal benar/salah — soal mati total, langsung skip). Amunisi 0 → tidak ada
// cut (salah biasa). `correctId` diterima utk paritas API pack lain; sengaja
// TIDAK dipakai: kill total memang menebas termasuk opsi benar.
export const tojiCutOptions = (options = [], correctId = null, ammo = 0) => { // eslint-disable-line no-unused-vars
  const n = Number.isFinite(ammo) && ammo > 0 ? Math.floor(ammo) : 0;
  if (n <= 0) return [];
  return (Array.isArray(options) ? options : [])
    .map((o) => (o && typeof o === 'object' ? o.id : o))
    .filter((id) => id != null);
};

// ── Motion tokens (anti-slop: beda easing per peran, bukan satu easing) ─────
// line = power2.out (bilah tumbuh presisi) · impact = back.out(1.4) (overshoot
// "kena" — token gsap spec) · exit = power2.in (keluar cepat) · reveal =
// expo.out 400–700ms (stagger rail senjata + quote per-frasa — token spec).
export const TOJI_MOTION = {
  line: 'cubic-bezier(0.33, 1, 0.68, 1)',      // power2.out — presisi
  impact: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // back.out — impact "kena"
  exit: 'cubic-bezier(0.55, 0, 1, 0.45)',      // power2.in — keluar cepat
  reveal: 'cubic-bezier(0.16, 1, 0.3, 1)',     // expo.out — stagger reveal
  durFast: 160,     // ms — feedback jawaban (responsif)
  durMid: 320,      // ms — tebasan/seretan rantai
  durCine: 4540,    // ms — ultimate = durasi klip cast terukur (4,54s)
};

// ── Stagger (anti-slop #4: bilah 0 → flash 100 → belah 180 → percikan 260
//    → debu 340 — bukan semua bareng) ─────────────────────────────────────
export const TOJI_STAGGER = {
  blade: 0,     // kilau bilah melintang
  flash: 0.1,   // flash putih 1 frame
  split: 0.18,  // opsi terbelah 2 (soul-cut)
  spark: 0.26,  // 2 percikan baja
  dust: 0.34,   // debu + goresan
};

// ── Hold effect (ms): efek tampil minimal TOJI_MIN_HOLD_MS ─────────────────
// Min hold legendary 1.4s; klip (T5) menambah +400ms kalau lebih panjang.
export const TOJI_MIN_HOLD_MS = 1400;
export const tojiAnswerHoldMs = (clipMs = 0, baseHoldMs = 0) => {
  const clip = Number.isFinite(clipMs) && clipMs > 0 ? clipMs : 0;
  return Math.max(baseHoldMs || 0, clip > 0 ? clip + 400 : 0, TOJI_MIN_HOLD_MS);
};

// Hold ultimate: timeline penuh (4,54s) + settle 300ms.
export const tojiUltHoldMs = () => Math.round(TOJI_ULT_DURATION_S * 1000) + 300;

// ── Generator murni (DETERMINISTIK — pola redesign Megumi v2.1: tanpa rng) ──
const r2 = (v) => +v.toFixed(2);

// Geometri bilah bersama (deterministik): melintang naik dari luar kiri ke
// luar kanan — sudut ≈26,57° (atan2(60,120)). Dipakai bilah & belahan jiwa.
const BLADE = { x0: -10, y0: 14, x1: 110, y1: 74 };
const BLADE_ANGLE = r2((Math.atan2(BLADE.y1 - BLADE.y0, BLADE.x1 - BLADE.x0) * 180) / Math.PI);

// 釈魂刀 (しゃっこんとう): kilau bilah diagonal — bilah melintang dari luar
// kartu, glints BERJALAN di bilah (≥2), flash putih 1 frame (≤80ms). Bilah
// menipis ke ujung (w0 > w1). Menebas 魂 (たましい · jiwa) — tembus pertahanan.
export const tojiBlade = (seed = 1) => ({
  id: `${seed}-blade`,
  x0: BLADE.x0, y0: BLADE.y0, x1: BLADE.x1, y1: BLADE.y1,
  angle: BLADE_ANGLE,
  w0: 2.6,
  w1: 0.6,
  glints: [0.32, 0.58, 0.82].map((at, i) => ({
    id: `${seed}-gl${i}`,
    at,
    size: r2(2.4 + (i % 2) * 1.2),
    delay: r2(at * 0.12),
  })),
  flashDur: 0.06,   // flash putih 1 frame
  dur: 0.22,        // power2.out 220ms — presisi, bukan bounce
});

// 万里ノ鎖 (ばんりのくさり): rantai masuk dari luar layar → nyangkut di opsi
// yang dipencet → DISERET keluar + debu + goresan lantai. Ujung jauh "dimakan"
// 武器庫呪霊 → tak teramati → memanjang tak terbatas (kanon ch.75).
export const tojiChain = (seed = 1) => {
  const links = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    return {
      id: `${seed}-lk${i}`,
      x: r2(108 - t * 46),                 // 108 (luar kanan) → 62 (hook)
      y: r2(18 + Math.sin(t * Math.PI) * 10),
      size: r2(9 - t * 3.5),               // mengecil ke ujung (9 → 5,5)
      rot: r2((i % 2 ? 1 : -1) * (12 + i * 6)),
    };
  });
  return {
    id: `${seed}-chain`,
    entry: { x: 108, y: 18 },   // masuk dari luar layar (kanan)
    hook: { x: 62, y: 28 },     // nyangkut di opsi yang dipencet
    drag: { x: -12, y: 34 },    // diseret keluar (kiri)
    links,
    dust: Array.from({ length: 4 }, (_, i) => ({
      id: `${seed}-du${i}`,
      x: r2(66 + i * 5),
      y: r2(72 + (i % 2) * 4),
      size: r2(4 + (i % 3) * 2),
      delay: r2(0.05 * i),
    })),
    scratches: Array.from({ length: 3 }, (_, i) => ({
      id: `${seed}-sc${i}`,
      y: r2(66 + i * 6),
      len: r2(26 + i * 8),
      delay: r2(0.04 * i),
    })),
    dur: 0.5,
  };
};

// Soul-cut (釈魂刀 menebas 魂): opsi terbelah 2 — belahan putih baja + tepi
// hitam, meluncur misah + TEPAT 2 percikan baja (spec). Sudut = sudut bilah.
export const tojiSoulSplit = (seed = 1) => ({
  id: `${seed}-split`,
  angle: BLADE_ANGLE,          // sejajar tebasan (deterministik)
  edge: { white: 2.2, black: 1.4 },
  slide: 7.5,                  // belahan meluncur misah (persen)
  sparks: [
    { id: `${seed}-sp0`, x: 52, y: 44, size: 3.2, ang: -30 },
    { id: `${seed}-sp1`, x: 58, y: 52, size: 2.4, ang: 24 },
  ],
  dur: 0.34,
});

// 武器庫呪霊 (ぶきこじゅれい): 呪霊 ulat raksasa — segmen gelombang, kepala
// terbesar (mulut menganga), memuntahkan senjata dengan rotasi DETERMINISTIK
// kanon: 大鉈 (おおなた) → 槍 (やり) → 刀 (かたな) → 銃 (じゅう).
export const TOJI_WORM_WEAPONS = ['oonata', 'yari', 'katana', 'juu'];

export const tojiWorm = (seed = 1, count = 8) => {
  const n = Number.isFinite(count) && count > 0 ? Math.floor(count) : 8;
  const segments = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1 || 1);
    return {
      id: `${seed}-sg${i}`,
      x: r2(18 + t * 64),                        // kepala kiri → ekor kanan
      y: r2(26 + Math.sin(t * Math.PI * 1.6) * 7), // gelombang badan
      size: r2(13 - t * 8),                      // kepala 13 → ekor 5
    };
  });
  return {
    id: `${seed}-worm`,
    head: { x: segments[0].x, y: segments[0].y, r: 13 },
    mouth: { open: 0.9, at: 0.06 },   // mulut menganga → tangan masuk
    segments,
    weapons: TOJI_WORM_WEAPONS.map((type, i) => ({
      id: `${seed}-wp${i}`,
      type,
      delay: r2(0.12 + i * 0.1),      // dimuntahkan BERURUTAN (stagger)
      ang: r2(-38 + i * 17),
    })),
    dur: 1.1,
  };
};
