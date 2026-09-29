// ─────────────────────────────────────────────────────────────────────────────
// Logika murni efek Nobara Kugisaki (pack_08, visual 'nobara') — 芻霊呪法.
// Sumber desain: obsidian-mind/brain/Efek JJK/Nobara.md (🔒 spec FINAL).
// Plan: .hermes/plans/2026-09-29_nobara-kugisaki-pack08.md (6 tahap).
// Tanpa DOM / React / import JSON → dites `node --test` (pola gojoFx/yujiFx/
// sukunaFx/megumiFx). Komponen (NobaraBurst) & EffectContext HANYA baca
// dari sini.
//
// Identitas visual: 釘と爆発 (paku & ledakan) — paku melesat → menancap →
// LEDAKAN + retakan menjalar. Beda dari yang lain: Gojo (plasma/ruang) ·
// Yuji (api) · Sukuna (tebasan/kuil) · Megumi (bayangan) · Nobara (ledakan).
//
// Filosofi: Nobara = 3級, rarity `common` → efek RINGKAS tanpa mekanik berat.
// Ultimate 全弾爆発 = ONE-SHOT (tanpa state/timer) — beda dari rare (Megumi
// 適応 state 30s) & special (Domain). Rarity rendah = tetap punya momen.
// ─────────────────────────────────────────────────────────────────────────────

// Milestone = sama persis Gojo/Yuji/Sukuna/Megumi (keputusan desain: konsisten JJK).
export const NOBARA_MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const isNobaraMilestone = (streak) => NOBARA_MILESTONES.includes(streak);

// ── Palet Nobara (design token — ui-ux-pro-max "fire explosion orange red") ──
// Dipakai KONSISTEN di semua elemen. 3 lapis tiap efek:
//   core = putih-panas (titik impact) · body = oranye (bentuk utama) ·
//   edge = merah gelap (tepi luar/retakan).
export const NOBARA_CORE = '#fef3c7';   // putih-kuning panas (impact)
export const NOBARA_ORANGE = '#f97316'; // oranye utama
export const NOBARA_LIGHT = '#fb923c';  // oranye terang (highlight)
export const NOBARA_RED = '#dc2626';    // merah (tepi/retakan)
export const NOBARA_DARK = '#0f172a';   // gelap (黒閃, veil)
export const NOBARA_STRAW = '#d4a24a';  // jerami (boneka 藁人形)

export const NOBARA_STYLE = {
  kanzashi:  { kanji: '簪',      color: NOBARA_ORANGE, label: '簪 · Hairpin' },
  ren:       { kanji: '簪・連',  color: NOBARA_LIGHT,  label: '簪・連 · Hairpin Barrage' },
  jigen:     { kanji: '簪・時限', color: '#fbbf24',    label: '簪・時限 · Hairpin Delayed' },
  tomonari:  { kanji: '共鳴り',   color: NOBARA_RED,   label: '共鳴り · Resonance' },
  kokusen:   { kanji: '黒閃',     color: NOBARA_DARK,  label: '黒閃 · Black Flash' },
  ult:       { kanji: '共鳴り・魂', color: NOBARA_ORANGE, label: '共鳴り・魂 · Soul Resonance' },
};

// ── Ladder jurus per streak (spec §Skill per streak — FINAL) ────────────────
// Non-streak = ROTASI deterministik 簪 ↔ 簪・連 (pola Sukuna/Megumi: bukan acak).
// Momen: 10 簪・時限 · 20 共鳴り · 30+ 黒閃 (jurus puncak, tetap dipakai ≥30).
export const NOBARA_LADDER = { 10: 'jigen', 20: 'tomonari' };
export const NOBARA_TOP_STREAK = 30;
export const NOBARA_NON_STREAK_CYCLE = ['kanzashi', 'ren'];

// Jawaban benar NON-momen ke berapa (1-based) — murni dari streak, stabil antar render.
export const nobaraNonStreakIndex = (streak) => {
  if (!Number.isFinite(streak) || streak <= 0) return 0;
  const s = Math.floor(streak);
  const passed = Object.keys(NOBARA_LADDER).filter((m) => s >= Number(m)).length;
  return s - passed;
};

export const nobaraTechniqueFor = (kind, streak = 0) => {
  if (kind === 'wrong') return null;
  if (!Number.isFinite(streak) || streak <= 0) return null;
  const s = Math.floor(streak);
  if (s >= NOBARA_TOP_STREAK) return 'kokusen';
  if (NOBARA_LADDER[s]) return NOBARA_LADDER[s];
  const idx = nobaraNonStreakIndex(s);
  if (idx <= 0) return null;
  return NOBARA_NON_STREAK_CYCLE[(idx - 1) % NOBARA_NON_STREAK_CYCLE.length];
};

// ── Bar 呪力: 20 slot (pola JJK konsisten) ──────────────────────────────────
export const NOBARA_ULT_THRESHOLD = 20;
export const nobaraCurseCharge = (streak) =>
  (Number.isFinite(streak) && streak > 0) ? Math.min(NOBARA_ULT_THRESHOLD, Math.floor(streak)) : 0;
export const nobaraUltReady = (streak) =>
  Number.isFinite(streak) && streak >= NOBARA_ULT_THRESHOLD;

// ── Ultimate 全弾爆発 — ONE-SHOT (rarity `common`: TANPA state/timer) ───────
// Timeline (detik) — total ~2.2s lalu SELESAI (bukan countdown).
export const NOBARA_ULT_DURATION_S = 2.2;
export const NOBARA_ULT_TIMELINE = {
  veilAt: 0.0,       // veil gelap turun (200ms)
  nailsAt: 0.15,     // 12 paku muncul dari tepi (stagger 40ms)
  nailStagger: 0.04,
  stickAt: 0.50,     // semua tancap serentak + paku getar
  flashAt: 0.65,     // core flash putih (60ms = 1 frame)
  boomAt: 0.70,      // LEDAKAN BESAR + shake 350ms
  cutAt: 1.00,       // opsi salah meledak satu-satu (stagger 80ms)
  cutStagger: 0.08,
  kanjiAt: 1.60,     // kanji 共鳴り・魂 muncul (glow, 600ms)
  settleAt: 2.20,    // veil naik, retakan pudar
};

// Mekanik cut: hapus opsi salah, TAPI sisakan minimal 1 opsi salah
// (spec: user tetap harus mikir — bukan auto-benar).
export const NOBARA_ULT_MIN_WRONG = 1;
export const nobaraUltCut = (options = [], correctId = null, keepWrong = NOBARA_ULT_MIN_WRONG) => {
  const ids = (Array.isArray(options) ? options : [])
    .map((o) => (o && typeof o === 'object' ? o.id : o))
    .filter((id) => id != null && id !== correctId);
  const keep = Number.isFinite(keepWrong) && keepWrong > 0 ? Math.floor(keepWrong) : 0;
  const cutCount = Math.max(0, ids.length - keep);
  return ids.slice(0, cutCount);
};

// ── Durasi klip (TERUKUR PyAV + RMS onset — JANGAN ditebak) ────────────────
// Lead-silence juga terukur (RMS 20ms window, threshold 6% peak):
//   kanzashi 0.12 · tomonari 0.16 · kokusen 0.16 · ult 0.30 · wrong_* (TTS)
export const NOBARA_CLIPS = {
  kanzashi: 0.93,     // "簪 (かんざし)!" — jurus dasar
  ren: 0.93,          // reuse klip kanzashi (rentetan = 3× putar stagger)
  jigen: 0.93,        // reuse klip kanzashi (time-delay = jeda 420ms lalu ledak)
  tomonari: 1.06,     // "共鳴り (ともなり)!"
  kokusen: 1.18,      // "黒閃 (こくせん)!"
  waraningyou: 1.53,  // "藁人形 (わらにんぎょう)!" — klip ambience/bonus
  juriyoku: 0.98,     // "呪力 (じゅりょく)!" — klip ambience/bonus
  ult: 1.45,          // seruan anime 「共鳴り!」— klip ultimate
};

// Lead-silence per klip (detik) — hanya yang > 0.24s yang di-skip (pola
// Sukuna/Megumi: klip pendek tanpa skip biar responsif; ult = anchor timeline
// 2.2s jadi TIDAK di-skip).
export const NOBARA_LEAD_S = { kanzashi: 0.12, tomonari: 0.16, kokusen: 0.16, ult: 0.30 };

// ── Generator murni (DETERMINISTIK — pola redesign Megumi v2.1: tanpa rng) ──
const r2 = (v) => +v.toFixed(2);

// 簪: paku melesat diagonal ke kartu. Koordinat 0-100 relatif kartu.
// Paku = GARIS (bukan titik) biar kebaca "tertancap". Sudut konsisten.
export const nobaraNails = (seed = 1, count = 1) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-n${i}`,
    // mulai dari luar kartu (kanan-atas) → tancap di dalam
    x0: r2(108 + i * 6),
    y0: r2(-12 - i * 5),
    x1: r2(72 - i * 14),      // titik tancap: menyebar ke kiri
    y1: r2(30 + i * 16),
    len: r2(16 + (i % 3) * 3), // panjang visual paku (unit kartu)
    rot: r2(-38 + (i % 4) * 7),// sudut paku (derajat)
    delay: r2(i * 0.07),       // stagger 70ms (anti-slop rule)
    dur: r2(0.16 + (i % 2) * 0.03),
  }));

// 爆発: burs bersudut (polygon bergerigi — lingkaran halus = slop).
// Mengembalikan titik polygon + 3 lapis warna (core/body/edge).
export const nobaraBurst = (seed = 1, size = 1) => {
  const spikes = 10;                       // jumlah gerigi burs
  const R = 26 * size;                     // radius luar
  const rIn = R * 0.42;                    // radius dalam (gerigi)
  const pts = Array.from({ length: spikes * 2 }, (_, i) => {
    const ang = (Math.PI * i) / spikes - Math.PI / 2;
    const rad = i % 2 === 0 ? R * (1 + ((i * 7) % 5) * 0.03) : rIn * (1 + ((i * 3) % 4) * 0.04);
    return [r2(Math.cos(ang) * rad), r2(Math.sin(ang) * rad)];
  });
  return {
    id: `${seed}-burst`,
    pts,
    coreR: r2(R * 0.30),                   // lingkaran core (putih-panas)
    bodyR: r2(R * 0.62),                   // badan oranye
    edgeR: r2(R * 0.95),                   // tepi merah
    dur: r2(0.32 + (size - 1) * 0.08),
  };
};

// 8 percikan radial dari titik tancap (arah KONSISTEN keluar — anti-slop).
export const nobaraSparks = (seed = 1, count = 8) =>
  Array.from({ length: count }, (_, i) => {
    const ang = (Math.PI * 2 * i) / count + 0.35;
    const d = 30 + (i % 3) * 12;
    return {
      id: `${seed}-sp${i}`,
      dx: r2(Math.cos(ang) * d),
      dy: r2(Math.sin(ang) * d),
      len: r2(10 + (i % 4) * 3.5),
      rot: r2((ang * 180) / Math.PI),
      delay: r2((i % 4) * 0.02),
      dur: r2(0.24 + (i % 3) * 0.05),
    };
  });

// 亀裂: retakan bercabang 2-3, sudut tajam, makin tipis makin jauh.
// Koordinat 0-100 relatif kartu. Dari titik tancap (x,y) menyebar.
export const nobaraCracks = (seed = 1, count = 3) => {
  const base = [
    { ang: 35,  len: 42, branch: [ { at: 0.55, ang: 22, len: 18 }, { at: 0.8, ang: -18, len: 12 } ] },
    { ang: 128, len: 36, branch: [ { at: 0.6, ang: 155, len: 15 } ] },
    { ang: -50, len: 30, branch: [ { at: 0.5, ang: -75, len: 13 }, { at: 0.75, ang: -30, len: 10 } ] },
    { ang: 210, len: 34, branch: [ { at: 0.65, ang: 235, len: 14 } ] },
  ];
  return Array.from({ length: count }, (_, i) => {
    const b = base[i % base.length];
    return {
      id: `${seed}-ck${i}`,
      ang: b.ang,
      len: b.len,
      w0: r2(2.6 - i * 0.35),      // tebal pangkal
      w1: r2(0.5),                  // tipis ujung
      branch: b.branch.map((br, j) => ({ ...br, id: `${seed}-ck${i}b${j}` })),
      delay: r2(0.03 * i),
      dur: r2(0.28 + (i % 2) * 0.06),
    };
  });
};

// 共鳴り: riak resonansi elips (khas getaran/dampak suara — bukan lingkaran penuh).
// Dari boneka jerami ke kartu: seri elips yang membesar & memudar.
export const nobaraRipple = (seed = 1, count = 3) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-rp${i}`,
    rx: r2(18 + i * 16),           // radius x (elips)
    ry: r2(9 + i * 8),             // radius y (elips lebih pipih = getaran)
    rot: r2(-12 + i * 6),          // sedikit miring (organik)
    delay: r2(i * 0.14),
    dur: r2(0.42 + i * 0.1),
  }));

// 藁人形: boneka jerami di tepi (fade+slide). Bentuk dasar: badan + kepala +
// tali jerami. Posisi TETAP di sayap kiri (tidak random).
export const nobaraStrawDoll = (seed = 1) => ({
  id: `${seed}-doll`,
  x: 6, y: 58,                 // persen viewport (sayap kiri-bawah)
  w: 34, h: 52,                // px unit dasar (di-scale komponen)
  tilt: -8,
  strands: 5,                  // helai jerami
  dur: 0.36,
});

// 全弾爆発: 12 paku dari tepi layar menuju kartu (stagger).
export const nobaraUltNails = (seed = 1, count = 12) =>
  Array.from({ length: count }, (_, i) => {
    const edge = i % 4;          // 0=atas 1=kanan 2=bawah 3=kiri
    const t = ((i * 37) % 100) / 100;
    return {
      id: `${seed}-un${i}`,
      edge,
      t: r2(t),                   // posisi di tepi (0-1)
      dx: r2(edge === 1 ? -46 : edge === 3 ? 46 : -14 + (i % 5) * 7),
      dy: r2(edge === 0 ? 46 : edge === 2 ? -46 : -10 + (i % 4) * 7),
      rot: r2(-60 + (i % 6) * 22),
      delay: r2(i * 0.04),        // stagger 40ms
      dur: r2(0.2 + (i % 3) * 0.04),
    };
  });

// ── Motion tokens (anti-slop: beda easing per peran, bukan satu easing) ─────
export const NOBARA_MOTION = {
  enter: 'cubic-bezier(0.34, 1.56, 0.64, 1)',  // back.out — impact terasa "kena"
  exit: 'cubic-bezier(0.55, 0, 1, 0.45)',      // power2.in — keluar cepat
  crack: 'cubic-bezier(0.22, 1, 0.36, 1)',     // power1.out — retakan menjalar
  durFast: 160,     // ms — feedback jawaban (responsif)
  durMid: 320,      // ms — burs/retakan
  durCine: 2200,    // ms — ultimate (boleh lambat, momen)
};

// ── Klip voice untuk jurus (diputar deterministik oleh playNobaraTechnique) ──
export const NOBARA_VOICE_FOR = {
  kanzashi: 'kanzashi',
  ren: 'kanzashi',       // reuse — rentetan
  jigen: 'kanzashi',     // reuse — time-delay
  tomonari: 'tomonari',
  kokusen: 'kokusen',
  ult: 'ult',            // seruan anime 「共鳴り!」 (segmen paling intens)
};

// ── Hold effect (ms): efek tampil selama klip suara + 400ms, min 1.2s ───────
// Pola megumiAnswerHoldMs: pakai durasi TERUKUR kalau clipMs tidak tersedia.
export const NOBARA_MIN_HOLD_MS = 1200;
export const nobaraAnswerHoldMs = (tech, clipMs = 0, baseHoldMs = 0) => {
  const measured = Number.isFinite(NOBARA_CLIPS[tech]) ? Math.round(NOBARA_CLIPS[tech] * 1000) : 0;
  const clip = (Number.isFinite(clipMs) && clipMs > 0) ? clipMs : measured;
  return Math.max(baseHoldMs || 0, clip > 0 ? clip + 400 : 0, NOBARA_MIN_HOLD_MS);
};

// ── Ultimate hold: timeline penuh 2.2s + settle 300ms ──────────────────────
export const nobaraUltHoldMs = () => Math.round(NOBARA_ULT_DURATION_S * 1000) + 300;
