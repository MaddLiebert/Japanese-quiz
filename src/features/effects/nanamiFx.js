// ─────────────────────────────────────────────────────────────────────────────
// Logika murni efek Nanami Kento (pack_11, visual 'nanami') — 十劃呪法.
// Sumber desain: obsidian-mind/brain/Efek JJK/Nanami Kento.md (🔒 spec FINAL).
// Plan: .hermes/plans/2026-09-29_nanami-kento-pack11.md (6 tahap).
// Tanpa DOM / React / import JSON → dites `node --test` (pola gojoFx/yujiFx/
// sukunaFx/megumiFx/nobaraFx). Komponen (NanamiBurst/NanamiShadow) &
// EffectContext HANYA baca dari sini.
//
// Identitas visual: 7:3 と黄金 (garis rasio presisi + puing + aura emas
// korporat). Beda dari yang lain: Gojo (plasma/ruang) · Yuji (api) ·
// Sukuna (tebasan/kuil) · Megumi (bayangan) · Nobara (paku & ledakan) ·
// Nanami = garis 7:3 yang MEMILIH titik lemah + puing 瓦落瓦落 + emas lembur.
//
// Filosofi: rarity `rare` (pola Megumi) → ladder jurus + ultimate STATE 30 dtk
// dengan TIMER JALAN. Mekanik FINAL B · 瓦落瓦落・連鎖 (keputusan Nacht):
//   benar selama state → +1 puing (cap 3) → soal berikutnya puing menghancurkan
//   opsi salah (selalu sisa ≥1) · salah → kontrak batal (縛り破棄) + streak
//   hangus. KERJA BERBUAH — hasil kerja benar menghancurkan rintangan berikutnya.
// ─────────────────────────────────────────────────────────────────────────────

// Milestone = sama persis Gojo/Yuji/Sukuna/Megumi/Nobara (konsisten JJK).
export const NANAMI_MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const isNanamiMilestone = (streak) => NANAMI_MILESTONES.includes(streak);

// ── Palet Nanami (design token ui-ux-pro-max "professional navy gold") ──────
// 3 lapis tiap efek:
//   core = putih (flash critical) · body = emas (tebasan/aura/percikan) ·
//   edge = navy gelap (bayangan garis); 黒閃 = hitam + merah.
export const NANAMI_WHITE = '#ffffff';     // flash critical (core)
export const NANAMI_GOLD = '#F59E0B';      // emas terang (aura lembur, percikan)
export const NANAMI_GOLD_DEEP = '#B45309'; // emas tua (tebasan, garis 7:3)
export const NANAMI_NAVY = '#1E3A8A';      // navy suit (edge/bayangan garis)
export const NANAMI_BLACK = '#0a0a0a';     // 黒閃 (veil/distorsi)
export const NANAMI_RED = '#dc2626';       // 黒閃 ledakan + kontrak batal

export const NANAMI_COLORS = {
  core: NANAMI_WHITE,
  gold: NANAMI_GOLD,
  goldDeep: NANAMI_GOLD_DEEP,
  navy: NANAMI_NAVY,
  black: NANAMI_BLACK,
  red: NANAMI_RED,
};

export const NANAMI_STYLE = {
  shichisan: { kanji: '七三',            color: NANAMI_GOLD_DEEP, label: '七三 · Ratio 7:3' },
  oonata:    { kanji: '大鉈',            color: NANAMI_NAVY,      label: '大鉈 · Oonata' },
  garagara:  { kanji: '瓦落瓦落',        color: NANAMI_GOLD,      label: '瓦落瓦落 · Garagara' },
  kokusen:   { kanji: '黒閃',            color: NANAMI_BLACK,     label: '黒閃 · Black Flash' },
  jikangai:  { kanji: '時間外労働',      color: NANAMI_GOLD,      label: '時間外労働 · Overtime' },
  ult:       { kanji: '時間外労働・全開', color: NANAMI_GOLD,      label: '時間外労働・全開 · Zenkai' },
};

// ── Ladder jurus per streak (spec §Skill per streak — FINAL) ────────────────
// Non-streak = ROTASI deterministik 七三 ↔ 大鉈 (pola Sukuna/Megumi/Nobara:
// bukan acak). Momen: 10 瓦落瓦落 · 20 黒閃 · 30+ 時間外労働 (jurus puncak).
export const NANAMI_LADDER = { 10: 'garagara', 20: 'kokusen' };
export const NANAMI_TOP = 30;
export const NANAMI_NON_STREAK_CYCLE = ['shichisan', 'oonata'];

// Jawaban benar NON-momen ke berapa (1-based) — murni dari streak, stabil antar render.
export const nanamiNonStreakIndex = (streak) => {
  if (!Number.isFinite(streak) || streak <= 0) return 0;
  const s = Math.floor(streak);
  const passed = Object.keys(NANAMI_LADDER).filter((m) => s >= Number(m)).length;
  return s - passed;
};

export const nanamiTechniqueFor = (kind, streak = 0) => {
  if (kind === 'wrong') return null;
  if (!Number.isFinite(streak) || streak <= 0) return null;
  const s = Math.floor(streak);
  if (s >= NANAMI_TOP) return 'jikangai';
  if (NANAMI_LADDER[s]) return NANAMI_LADDER[s];
  const idx = nanamiNonStreakIndex(s);
  if (idx <= 0) return null;
  return NANAMI_NON_STREAK_CYCLE[(idx - 1) % NANAMI_NON_STREAK_CYCLE.length];
};

// ── Bar 呪力: 20 slot (pola JJK konsisten) ──────────────────────────────────
export const NANAMI_ULT_THRESHOLD = 20;
export const nanamiCurseCharge = (streak) =>
  (Number.isFinite(streak) && streak > 0) ? Math.min(NANAMI_ULT_THRESHOLD, Math.floor(streak)) : 0;
export const nanamiUltReady = (streak) =>
  Number.isFinite(streak) && streak >= NANAMI_ULT_THRESHOLD;

// ── Ultimate 時間外労働・全開 — cinematic ~2.4s lalu STATE 30 dtk ───────────
// Timeline (detik) — sync ke quote per-frasa (spec §Ultimate):
// veil → jam dilihat → dasi lepas → kanji quote per-frasa → aura meledak →
// garis 7:3 raksasa → settle (masuk state lembur).
export const NANAMI_ULT_DURATION_S = 2.4;
export const NANAMI_QUOTE = ['残念ですが', 'ここからは', '時間外労働です']; // 「残念ですがここからは時間外労働です」
export const NANAMI_TIMELINE = {
  veilAt: 0.0,      // veil: layar turun ke 25% brightness (200ms)
  watchAt: 0.15,    // jam dilihat — 2 jarum berputar cepat
  tieAt: 0.4,       // dasi lepas + kain berkibar
  quoteAt: 0.7,     // kanji quote per-frasa (glow emas)
  quotePer: 0.2,    // ≈0.2s/frasa (3 frasa dalam 0.6s)
  auraAt: 1.4,      // aura meledak: partikel emas naik bergelombang + distorsi panas
  lineAt: 1.8,      // garis 7:3 raksasa melintang SELURUH layar + titik nyala
  settleAt: 2.4,    // settle → masuk state lembur 30 dtk + counter puing 瓦
};

// State lembur 30 dtk (pola `rare` — timer JALAN; jam kecil di pojok).
export const NANAMI_OVERTIME_S = 30;

// Mulai hitung mundur SETELAH cinematic settle → 30 dtk itu waktu main penuh.
export const nanamiOvertimeStartDelayMs = () => Math.round(NANAMI_ULT_DURATION_S * 1000);

// ── Mekanik 瓦落瓦落・連鎖 (FINAL B — keputusan Nacht) ──────────────────────
// Benar selama state → +1 puing (cap 3). Soal berikutnya → puing dihabiskan:
// tiap puing menghancurkan 1 opsi salah. min(puing, salah − 1) — SELALU
// sisakan ≥1 opsi salah (gak pernah auto-benar).
export const NANAMI_RUBBLE_MAX = 3;
export const NANAMI_ULT_MIN_WRONG = 1;

// Benar selama state: +1 puing, clamp cap. Input kotor → 1 (benar tetap bernilai).
export const nanamiRubbleGain = (piles) => {
  const n = Number.isFinite(piles) && piles > 0 ? Math.floor(piles) : 0;
  return Math.min(NANAMI_RUBBLE_MAX, n + 1);
};

// Opsi salah yang dihancurkan puing: deterministik (urutan array, bukan acak)
// → stabil antar render. Jawaban benar TIDAK pernah masuk. Selalu sisa ≥1 salah.
export const nanamiRubbleCut = (options = [], correctId = null, piles = 0, keepWrong = NANAMI_ULT_MIN_WRONG) => {
  const ids = (Array.isArray(options) ? options : [])
    .map((o) => (o && typeof o === 'object' ? o.id : o))
    .filter((id) => id != null && id !== correctId);
  const keep = Number.isFinite(keepWrong) && keepWrong > 0 ? Math.floor(keepWrong) : 0;
  const n = Number.isFinite(piles) && piles > 0 ? Math.floor(piles) : 0;
  const cutCount = Math.min(n, Math.max(0, ids.length - keep));
  return ids.slice(0, cutCount);
};

// Hasil jawaban selama state lembur:
//   correct → stack (+1 puing, cap) · wrong → contract (kontrak batal: state
//   bubar + puing rontok + streak hangus) · timeout → expire (padam alami).
export const nanamiOvertimeOutcome = (kind, piles = 0) => {
  if (kind === 'correct') return { piles: nanamiRubbleGain(piles), outcome: 'stack' };
  if (kind === 'wrong') return { piles: 0, outcome: 'contract' };
  return { piles: 0, outcome: 'expire' };
};

// ── Motion tokens (anti-slop: beda easing per peran, bukan satu easing) ─────
// line = power2.out (garis tumbuh presisi, bukan bounce) · impact = back.out
// (overshoot kecil = "kena") · exit = power2.in (keluar cepat) · reveal =
// expo.out (stagger ringan, token gsap ui-ux-pro-max).
export const NANAMI_MOTION = {
  line: 'cubic-bezier(0.33, 1, 0.68, 1)',      // power2.out — presisi
  impact: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // back.out — impact "kena"
  exit: 'cubic-bezier(0.55, 0, 1, 0.45)',      // power2.in — keluar cepat
  reveal: 'cubic-bezier(0.16, 1, 0.3, 1)',     // expo.out — stagger reveal
  durFast: 160,     // ms — feedback jawaban (responsif)
  durMid: 320,      // ms — tebasan/puing
  durCine: 2400,    // ms — ultimate (boleh lambat, momen)
};

// ── Stagger (anti-slop #4: garis 0 → titik 120 → tebasan 200 → percikan 280
//    → puing 360 — bukan semua bareng) ─────────────────────────────────────
export const NANAMI_STAGGER = {
  line: 0,      // garis 7:3 tumbuh
  point: 0.12,  // titik 7:3 nyala
  slash: 0.2,   // tebasan tepat di titik itu
  spark: 0.28,  // percikan emas
  rubble: 0.36, // puing meluncur radial
};

// ── Hold effect (ms): efek tampil minimal NANAMI_MIN_HOLD_MS ────────────────
// T5 (klip suara) belum ada → hold dari clipMs eksplisit; min hold rare 1.4s.
export const NANAMI_MIN_HOLD_MS = 1400;
export const nanamiAnswerHoldMs = (clipMs = 0, baseHoldMs = 0) => {
  const clip = Number.isFinite(clipMs) && clipMs > 0 ? clipMs : 0;
  return Math.max(baseHoldMs || 0, clip > 0 ? clip + 400 : 0, NANAMI_MIN_HOLD_MS);
};

// Hold ultimate: timeline penuh 2.4s + settle 300ms.
export const nanamiUltHoldMs = () => Math.round(NANAMI_ULT_DURATION_S * 1000) + 300;

// ── Generator murni (DETERMINISTIK — pola redesign Megumi v2.1: tanpa rng) ──
const r2 = (v) => +v.toFixed(2);

// 七三: garis 7:3 tumbuh dari tepi kiri → berhenti DI titik 7:3 → titik nyala.
// Koordinat 0-100 relatif kartu. Garis = GARIS (bukan titik) biar kebaca
// "membelah". Titik 7:3 SELALU di dalam kartu (di situlah tebasan mendarat).
// Notch kecil di titik 7 = tanda rasio "7:3" — presisi = identitas.
export const nanamiRatioLine = (seed = 1) => {
  const x0 = -8, y0 = 18, x1 = 108, y1 = 62; // melintang naik dari luar kiri ke luar kanan
  const ratio = 0.7;
  const px = r2(x0 + ratio * (x1 - x0));
  const py = r2(y0 + ratio * (y1 - y0));
  return {
    id: `${seed}-ratio`,
    x0, y0, x1, y1,
    ratio,
    growTo: ratio,          // tumbuh berhenti DI titik 7:3 (bukan penuh)
    px, py,                 // titik lemah paksa — tebasan mendarat di sini
    angle: r2((Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI),
    notch: { len: 5, w: 1.2, gap: 2 }, // notch penanda 7:3 di dekat titik
    dur: 0.22,              // power2.out 220ms — presisi, bukan bounce
  };
};

// 瓦落瓦落: puing meluncur RADIAL dari titik hancur, rotasi SEARAH luncuran
// (fisika dasar — anti-slop #2). Poligon tak beraturan (5-7 sisi), bukan bulat.
export const nanamiRubble = (seed = 1, count = 6) =>
  Array.from({ length: count }, (_, i) => {
    const ang = (((i * 47 + 15) % 360) * Math.PI) / 180; // sebaran sudut deterministik
    const dist = 34 + (i % 3) * 14;                       // jarak luncur
    const dx = r2(Math.cos(ang) * dist);
    const dy = r2(Math.sin(ang) * dist);
    return {
      id: `${seed}-rb${i}`,
      dx, dy,
      size: r2(6 + (i % 4) * 2.5),
      sides: 5 + (i % 3),                    // poligon tak beraturan
      spin: r2((dx >= 0 ? 1 : -1) * (90 + (i % 4) * 60)), // rotasi searah luncuran
      delay: r2(NANAMI_STAGGER.rubble + i * 0.03),        // mulai 360ms, stagger 30ms
      dur: r2(0.34 + (i % 3) * 0.06),
    };
  });

// 時間外労働: aura = partikel naik BERGELOMBANG (sin) + distorsi panas tipis —
// bukan glow gradient statis (anti-slop #3). Sebaran horizontal merata.
export const nanamiAura = (seed = 1, count = 10) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-au${i}`,
    x: r2(6 + i * 9.2),                      // merata kiri→kanan (6%..88.8%)
    sway: r2(1.6 + (i % 3) * 0.6),           // amplitudo gelombang sinus
    rise: r2(18 + (i % 4) * 6),              // tinggi naik
    phase: r2((i * 0.7) % (Math.PI * 2)),    // fase beda → gelombang, bukan garis
    size: r2(2 + (i % 3) * 0.7),
    delay: r2(i * 0.05),
    dur: r2(0.9 + (i % 4) * 0.15),
  }));

// 亀裂: retakan dinding (瓦落瓦落 di belakang kartu) — bercabang 2-3, sudut
// tajam, makin tipis makin jauh. Koordinat 0-100 relatif kartu.
export const nanamiCracks = (seed = 1, count = 4) => {
  const base = [
    { ang: -18,  len: 46, branch: [ { at: 0.5,  ang: -40, len: 17 }, { at: 0.78, ang: 6,   len: 12 } ] },
    { ang: 72,   len: 38, branch: [ { at: 0.58, ang: 96,  len: 15 } ] },
    { ang: 155,  len: 33, branch: [ { at: 0.52, ang: 178, len: 13 }, { at: 0.8,  ang: 132, len: 9 } ] },
    { ang: -104, len: 30, branch: [ { at: 0.62, ang: -128, len: 12 } ] },
  ];
  return Array.from({ length: count }, (_, i) => {
    const b = base[i % base.length];
    return {
      id: `${seed}-ck${i}`,
      ang: b.ang,
      len: b.len,
      w0: r2(2.6 - (i % 4) * 0.35),  // tebal pangkal
      w1: 0.5,                        // tipis ujung
      branch: b.branch.map((br, j) => ({ ...br, id: `${seed}-ck${i}b${j}` })),
      delay: r2(0.03 * (i % 4)),
      dur: r2(0.28 + (i % 2) * 0.06),
    };
  });
};
