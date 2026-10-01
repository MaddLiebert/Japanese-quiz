// ─────────────────────────────────────────────────────────────────────────────
// Logika murni efek Yuta Okkotsu (pack_12, visual 'yuta') — 真贋相愛 · 模倣.
// Kanon: Yuta = spesial grade; kekuatannya 模倣 (Copy) lewat 里香/Rika. Domain-nya
// 真贋相愛 (しんがんそうあい) = lautan pedang tertancap; tiap pedang = 1 teknik
// yang sudah dia copy; sekali pakai lalu hancur; isi pedang = GACHA.
//
// ULTIMATE (keputusan user 01/10): bar 呪力 penuh → tap → cast 真贋相愛 →
// muncul 3 katana (unik, acak dari 7 ultimate voicepack) → PEMAIN PILIH 1 →
// ultimate itu jalan dengan MEKANIK ASLINYA selama 30 dtk:
//   gojo(無量空処)=freeze · sukuna(伏魔御廚子)=必中 · nobara(共鳴り)=ledak semua salah
//   yuji(宿儺の器)=combo 解捌開 · megumi(魔虚羅)=適応 · nanami(時間外労働)=puing
//   toji(天与呪縛)=amunisi
// SEMUA mekanik DELEGASI ke modul pack aslinya (DRY) — tidak ada yang ditulis ulang.
// Tanpa DOM/React → dites `node --test` (pola gojoFx/sukunaFx/tojiFx).
// ─────────────────────────────────────────────────────────────────────────────
import { GOJO_DOMAIN_DURATION_S, GOJO_RIM } from './gojoFx.js';
import { SUKUNA_HITSUME_DELAY_MS, sukunaHitsumeCut, SUKUNA_BLOOD } from './sukunaFx.js';
import { nobaraUltCut, NOBARA_ULT_TIMELINE, NOBARA_STRAW } from './nobaraFx.js';
import { yujiBurnedIds, yujiComboNext, YUJI_FIRE_COLORS } from './yujiFx.js';
import { megumiAdaptCut, megumiSwordCut, megumiWrongOutcome, MEGUMI_WHEEL_NOTCHES, MEGUMI_INDIGO } from './megumiFx.js';
import { nanamiRubbleCut, nanamiOvertimeOutcome, NANAMI_RUBBLE_MAX, NANAMI_GOLD } from './nanamiFx.js';
import { tojiCutOptions, tojiUltOutcome, tojiStateStartAmmo, TOJI_AMMO_MAX, TOJI_STEEL } from './tojiFx.js';

// Milestone = sama persis pack JJK lain (konsisten).
export const YUTA_MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const isYutaMilestone = (streak) => YUTA_MILESTONES.includes(streak);

// ── Domain Yuta: SELALU 30 dtk (keputusan user) — bukan durasi domain asli copy ─
export const YUTA_DOMAIN_DURATION_S = 30;

// ── Pool COPY (模倣) — 7 ultimate voicepack; pemain PILIH 1 dari 3 katana ─────
export const YUTA_COPY_POOL = ['gojo', 'sukuna', 'nobara', 'yuji', 'megumi', 'nanami', 'toji'];
export const YUTA_COPY_META = {
  gojo:   { id: 'gojo',   kanji: '無量空処',   label: '無量空処 · Infinite Void',       mechanic: 'freeze',   color: '#7c4dff', blurb: 'waktu kuis BEKU 30 dtk' },
  sukuna: { id: 'sukuna', kanji: '伏魔御廚子', label: '伏魔御廚子 · Malevolent Shrine',  mechanic: 'hitsume',  color: '#e0241a', blurb: 'tiap soal: semua opsi salah dibabat' },
  nobara: { id: 'nobara', kanji: '共鳴り',     label: '共鳴り · Resonance',             mechanic: 'detonate', color: '#f59e0b', blurb: 'tiap soal: semua salah diledakkan (sisa ≥1)' },
  yuji:   { id: 'yuji',   kanji: '宿儺の器',   label: '宿儺の器 · Sukuna\u2019s Vessel', mechanic: 'combo',    color: '#ef4444', blurb: 'benar → 解→捌→開; 開 bakar semua salah' },
  megumi: { id: 'megumi', kanji: '魔虚羅',     label: '魔虚羅 · Mahoraga',              mechanic: 'adapt',    color: '#64748b', blurb: 'salah → +takik 適応; roda penuh → 八握剣' },
  nanami: { id: 'nanami', kanji: '時間外労働', label: '時間外労働 · Overtime',          mechanic: 'rubble',   color: '#b8901f', blurb: 'benar → +puing; puing hancurkan opsi salah' },
  toji:   { id: 'toji',   kanji: '天与呪縛',   label: '天与呪縛 · Heavenly Restriction', mechanic: 'ammo',    color: '#94a3b8', blurb: 'amunisi: salah = soal dibunuh (streak aman)' },
};
export const isValidYutaCopy = (id) => YUTA_COPY_POOL.includes(id);
export const yutaCopyMeta = (id) => (isValidYutaCopy(id) ? YUTA_COPY_META[id] : null);
export const yutaCopyPool = () => YUTA_COPY_POOL.map((id) => YUTA_COPY_META[id]);
export const yutaCopyMechanic = (id) => yutaCopyMeta(id)?.mechanic ?? null;

// ── Gacha 3 katana: undian unik (Fisher–Yates) deterministik, rng injectable ──
export const YUTA_KATANA_COUNT = 3;
const lcg = (seed) => {
  let s = (Math.floor(seed) || 1) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
};
export const yutaDrawKatanas = (seed = 1, count = YUTA_KATANA_COUNT, rng = null) => {
  const rand = typeof rng === 'function' ? rng : lcg(seed);
  const pool = YUTA_COPY_POOL.slice();
  const n = Math.max(1, Math.min(Number.isFinite(count) ? Math.floor(count) : YUTA_KATANA_COUNT, pool.length));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
};

// ── Palet Yuta: KANON dari domain.gif user (merah darah + ungu gelap + putih mizuhiki) ──
//   Ref: 真贋相愛 = 荒廃した地 + 無数の刀 + あわじ結び mizuhiki 紅白 + 血の色の空。
//   ⚠️ JANGAN pakai ungu-violet sebagai warna utama (itu BUKAN kanon — koreksi user).
export const YUTA_STYLE = {
  katana:   { kanji: '太刀',     color: '#e2e8f0', label: '太刀 · Katana' },        // perak bilah
  ripples:  { kanji: '呪力',     color: '#38bdf8', label: '呪力 · Cursed Energy' }, // biru 呪力
  reversal: { kanji: '反転術式', color: '#f472b6', label: '反転術式 · Reverse Cursed Technique' },
  mimic:    { kanji: '模倣',     color: '#c084fc', label: '模倣 · Copy' },          // ungu aksen (bukan utama)
  ult:      { kanji: '真贋相愛', color: '#dc2626', label: '領域展開・真贋相愛' },   // MERAH DARAH (kanon)
  wrong:    { kanji: 'しまった', color: '#94a3b8', label: 'しまった (gagal)' },
};

// ── Token visual domain kanon (dipakai YutaShadow.jsx / YutaBurst.jsx) ────────
export const YUTA_DOMAIN = {
  sky: '#1a0505',        // langit merah gelap (fade ke hitam)
  blood: '#dc2626',      // merah darah — warna utama domain
  bloodD: '#7f1d1d',     // merah tua (bayangan/tepi)
  shadow: '#2e1065',     // ungu gelap (bayangan Yuta di GIF)
  ground: '#0b0508',     // tanah retak hampir hitam
  steel: '#cbd5e1',      // bilah katana
  steelD: '#475569',     // bilah redup (latar lautan pedang)
  mizuhiki: '#f8fafc',   // tali putih (紅白の水引 — sisi putih)
  mizuhikiRed: '#b91c1c',// sisi merah
  eye: '#ef4444',        // mata merah Yuta
};

// ── T7 (opsi 2): identitas visual copy — emblem ikonik + tint domain ─────────
//   Tiap copy meminjam 1 elemen khas pack sumber (glyph) + warna token pack-nya
//   (DRY: impor konstanta pack, bukan hex duplikat) supaya "copy terasa".
//   Ditempatkan di YutaDomainField (ringan, tidak menimpa lautan pedang Yuta).
export const YUTA_COPY_EMBLEM = {
  gojo:   { glyph: 'void',    kanji: '無', color: GOJO_RIM,        label: '無下限 · Infinity' },
  sukuna: { glyph: 'shrine',  kanji: '伏', color: SUKUNA_BLOOD,    label: '伏魔御廚子 · Shrine' },
  nobara: { glyph: 'straw',   kanji: '共', color: NOBARA_STRAW,    label: '藁人形 · Straw Doll' },
  yuji:   { glyph: 'fire',    kanji: '開', color: YUJI_FIRE_COLORS[2], label: '開 · Fuga' },
  megumi: { glyph: 'wheel',   kanji: '魔', color: MEGUMI_INDIGO,   label: '八握剣 · Wheel' },
  nanami: { glyph: 'watch',   kanji: '時', color: NANAMI_GOLD,     label: '時間外 · Watch' },
  toji:   { glyph: 'reticle', kanji: '天', color: TOJI_STEEL,      label: '天与呪縛 · Reticle' },
};
export const yutaCopyEmblem = (id) => (isValidYutaCopy(id) ? YUTA_COPY_EMBLEM[id] : null);

// Warna tint domain per copy (dipakai YutaDomainField). alpha opsional 0..1.
const YUTA_TINT_ALPHA = 0.30;
const clamp01 = (v) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : YUTA_TINT_ALPHA);
export const yutaCopyTint = (id, alpha) => {
  const base = yutaCopyEmblem(id)?.color || YUTA_DOMAIN.blood;
  if (alpha === undefined) return base;
  const a = Math.round(clamp01(alpha) * 255).toString(16).padStart(2, '0');
  return `${base}${a}`;
};

// ── Ladder jurus Yuta (non-streak = rotasi deterministik; bukan acak) ─────────
export const YUTA_LADDER = { 10: 'reversal', 20: 'mimic' };
export const YUTA_TOP = 30;
export const YUTA_NON_STREAK_CYCLE = ['katana', 'ripples'];

export const yutaNonStreakIndex = (streak) => {
  if (!Number.isFinite(streak) || streak <= 0) return 0;
  const s = Math.floor(streak);
  const passed = Object.keys(YUTA_LADDER).filter((m) => s >= Number(m)).length;
  return s - passed;
};

export const yutaTechniqueFor = (kind, streak = 0) => {
  if (kind === 'wrong') return null;
  if (!Number.isFinite(streak) || streak <= 0) return null;
  const s = Math.floor(streak);
  if (s >= YUTA_TOP) return 'ult';
  if (YUTA_LADDER[s]) return YUTA_LADDER[s];
  const idx = yutaNonStreakIndex(s);
  if (idx <= 0) return null;
  return YUTA_NON_STREAK_CYCLE[(idx - 1) % YUTA_NON_STREAK_CYCLE.length];
};

// ── Bar 呪力: 20 slot (pola JJK konsisten) ───────────────────────────────────
export const YUTA_ULT_THRESHOLD = 20;
export const yutaCurseCharge = (streak) =>
  (Number.isFinite(streak) && streak > 0) ? Math.min(YUTA_ULT_THRESHOLD, Math.floor(streak)) : 0;
export const yutaUltReady = (streak) =>
  Number.isFinite(streak) && streak >= YUTA_ULT_THRESHOLD;

// ── Durasi & hitung mundur copy — SELALU domain Yuta (30 dtk) ────────────────
export const yutaCopyDurationS = (copyId) => (isValidYutaCopy(copyId) ? YUTA_DOMAIN_DURATION_S : 0);

export const yutaCopyLeft = (endsAt, now = Date.now()) => {
  if (!Number.isFinite(endsAt) || !Number.isFinite(now)) return 0;
  const left = Math.ceil((endsAt - now) / 1000);
  if (!Number.isFinite(left) || left <= 0) return 0;
  return Math.min(YUTA_DOMAIN_DURATION_S, left);
};

// ── DELEGASI mekanik sure-hit (inti "copy terasa") ───────────────────────────
export const yutaCopyFreezes = (copyId) => copyId === 'gojo';

// Tipe potongan per-soal (recurring selama domain): sukuna=all, nobara=keep1.
export const yutaCopyPerQuestionCut = (copyId) => {
  if (copyId === 'sukuna') return 'all';
  if (copyId === 'nobara') return 'keep1';
  return null;
};

export const yutaCopyCut = (copyId, options = [], correctId = null, keepWrong = 1) => {
  if (copyId === 'sukuna') return sukunaHitsumeCut(options, correctId);
  if (copyId === 'nobara') return nobaraUltCut(options, correctId, keepWrong);
  return [];
};

export const yutaCopyCutDelayMs = (copyId) => {
  if (copyId === 'sukuna') return SUKUNA_HITSUME_DELAY_MS;
  if (copyId === 'nobara') return Math.round(NOBARA_ULT_TIMELINE.cutAt * 1000);
  return 0;
};

// ── DELEGASI ekonomi (full asli): init state + outcome per jawaban ───────────
export const yutaCopyInit = (copyId) => {
  if (copyId === 'toji') return { ammo: tojiStateStartAmmo() };
  if (copyId === 'nanami') return { piles: 0 };
  if (copyId === 'megumi') return { wheel: 0 };
  if (copyId === 'yuji') return { combo: 0 };
  return {};
};

// kind: 'correct' | 'wrong'. state: { ammo?, piles?, wheel?, combo? }.
// Return shape mengikuti pack sumber (delegasi apa adanya) — provider memetakan.
export const yutaCopyOutcome = (copyId, kind, state = {}) => {
  if (copyId === 'toji') return tojiUltOutcome(kind, state.ammo);
  if (copyId === 'nanami') return nanamiOvertimeOutcome(kind, state.piles);
  if (copyId === 'megumi') return megumiWrongOutcome(state.wheel);
  if (copyId === 'yuji') return { combo: yujiComboNext(state.combo) };
  return {};
};

// Helper potongan ekonomi (dipakai provider; delegasi, jangan tulis ulang).
export const yutaCopyEconomyCut = (copyId, options = [], correctId = null, state = {}) => {
  if (copyId === 'megumi') {
    // 八握剣 (roda penuh) → SEMUA salah; kalau tidak → 適応 (1 opsi).
    return megumiWrongOutcome(state.wheel).outcome === 'shatter'
      ? megumiSwordCut(options, correctId)
      : megumiAdaptCut(options, correctId);
  }
  if (copyId === 'nanami') return nanamiRubbleCut(options, correctId, state.piles);
  if (copyId === 'toji') return tojiCutOptions(options, correctId, state.ammo);
  if (copyId === 'yuji') return state.combo >= 3 ? yujiBurnedIds(options, correctId) : [];
  return [];
};

export const YUTA_COPY_LIMITS = {
  ammoMax: TOJI_AMMO_MAX, rubbleMax: NANAMI_RUBBLE_MAX, wheelMax: MEGUMI_WHEEL_NOTCHES,
  gojoDurationS: GOJO_DOMAIN_DURATION_S,
};

// ── Generator murni (DETERMINISTIK, tanpa rng — pola tojiFx v2.1) ────────────
const r2 = (v) => +v.toFixed(2);

// 太刀: tebasan bilah tunggal melintang naik (sudut tetap), menipis ke ujung.
export const yutaKatana = (seed = 1) => ({
  id: `${seed}-katana`,
  x0: -8, y0: 78, x1: 108, y1: 22,
  angle: r2((Math.atan2(22 - 78, 108 - (-8)) * 180) / Math.PI), // ≈ -26.57°
  w0: 3.0, w1: 0.5,
  glints: [0.34, 0.6, 0.84].map((at, i) => ({ id: `${seed}-kg${i}`, at, size: r2(2.6 + (i % 2) * 1.2) })),
  dur: 0.24,
});

// 呪力: gelombang cincin biru keluar dari tengah (cursed energy ripples).
export const yutaRipples = (seed = 1, count = 4) =>
  Array.from({ length: Math.max(1, count) }, (_, i) => ({
    id: `${seed}-rip${i}`,
    r: r2(26 + i * 16),          // radius viewBox 0..100
    width: r2(1.6 - i * 0.25),
    dur: r2(0.5 + i * 0.12),
    delay: r2(i * 0.08),
  }));

// 真贋相愛 / 模倣: dua cincin berlawanan arah (asli ↔ palsu saling mengunci).
export const yutaCopyRings = (seed = 1, count = 3) =>
  Array.from({ length: Math.max(1, count) }, (_, i) => ({
    id: `${seed}-cr${i}`,
    r: r2(30 + i * 14),
    dir: i % 2 === 0 ? 1 : -1,
    width: r2(1.8 - i * 0.3),
    dur: r2(2.4 + i * 0.6),
  }));

// 真贋相愛 MOMEN PICK: cincin gelombang MERAH meluas dari pusat, full-screen.
// ⚠️ Di sini `vmax` AMAN — field domain full-screen, tidak di-clip seperti kartu
// (beda dgn bug cincin 呪力 di kartu yang wajib pakai px relatif rect).
export const yutaDomainRings = (seed = 1, count = 3) =>
  Array.from({ length: Math.max(1, count) }, (_, i) => ({
    id: `${seed}-dr${i}`,
    delay: r2(i * 0.18),
    dur: r2(1.4 + i * 0.2),
    width: r2(1.1 + i * 0.18),   // × vmax
    w: r2(2.2 - i * 0.5),
  }));

// 真贋相愛 (latar domain): lautan pedang tertancap — posisi & sudut deterministik
// (sebaran sudut berbasis i, bukan rng) supaya stabil antar render.
export const yutaSwordField = (seed = 1, count = 24) =>
  Array.from({ length: Math.max(1, count) }, (_, i) => {
    const col = i % 6;
    const row = Math.floor(i / 6);
    return {
      id: `${seed}-sw${i}`,
      x: r2(6 + col * 17 + ((row % 2) * 5)),      // kolom + geser ganjil-genap
      y: r2(58 + row * 9),                         // makin ke bawah makin dekat
      rot: r2(-28 + ((i * 37) % 56)),              // sudut miring deterministik
      h: r2(16 + ((i * 13) % 9)),                  // tinggi bilah (variasi)
      w: r2(1.2 + ((i % 3) * 0.4)),
      scale: r2(0.6 + row * 0.14),                 // perspektif baris bawah lebih besar
    };
  });

// ── T8: perkaya jurus (setara Nobara) — percikan / retakan / partikel ─────────
// Percikan radial: 8 arah KONSISTEN dari titik tancap (bukan acak) — pola nobaraSparks.
export const yutaSparks = (seed = 1, count = 8, baseLen = 26) =>
  Array.from({ length: Math.max(1, count) }, (_, i) => {
    const ang = (360 / Math.max(1, count)) * i;                 // merata
    const len = r2(baseLen * (0.72 + ((i * 17) % 7) / 10));      // variasi deterministik
    const rad = (ang * Math.PI) / 180;
    return {
      id: `${seed}-sp${i}`,
      ang: r2(ang),
      len,
      dx: r2(Math.cos(rad) * len),
      dy: r2(Math.sin(rad) * len),
      size: r2(2 + (i % 3) * 0.8),
      dur: r2(0.34 + (i % 4) * 0.05),
      delay: r2((i % 3) * 0.02),
    };
  });

// Retakan: bercabang, menirus (w0>w1), punya akhir (dur terbatas) — pola nobaraCracks.
export const yutaCracks = (seed = 1, count = 3) =>
  Array.from({ length: Math.max(1, count) }, (_, i) => {
    const ang = r2(-90 + i * (360 / Math.max(1, count)) + (i * 11) % 20);
    const len = r2(24 + (i * 13) % 22);
    const branchCount = 1 + (i % 2);
    return {
      id: `${seed}-ck${i}`,
      ang,
      len,
      w0: r2(1.8 - i * 0.25),
      w1: r2(0.4),
      dur: r2(0.26 + i * 0.04),
      delay: r2(i * 0.03),
      branch: Array.from({ length: branchCount }, (_, j) => ({
        ang: r2(ang + (j === 0 ? 34 : -38) + (i * 7) % 12),
        len: r2(len * (0.4 + j * 0.12)),
      })),
    };
  });

// Partikel 呪力 naik bergelombang (bukan glow statis) — pola NanamiOvertimeAura motes.
export const yutaMotes = (seed = 1, count = 10) => {
  const rand = lcg(seed + 99);
  return Array.from({ length: Math.max(1, count) }, (_, i) => ({
    id: `${seed}-mo${i}`,
    x: r2(rand() * 100),
    rise: r2(80 + rand() * 160),
    size: r2(2 + rand() * 3),
    dur: r2(2.4 + rand() * 2),
    delay: r2(rand() * 1.6),
    phase: r2(rand() * Math.PI * 2),
    sway: r2(10 + rand() * 26),
  }));
};

// Diameter cincin (px) RELATIF ke kartu — bukan `vmin`.
// ⚠️ Bug lama: cincin diukur `vmin` (skala layar) tapi dirender di dalam kotak kartu
// yang di-clip → cincin lebih besar dari kartu → lingkarannya di luar area → TAK terlihat
// (keluhan user "cincin ilang, gak ada yang juryoku"). Ukur relatif kartu supaya tampil.
export const yutaRingDiameters = (base = 120, count = 4, startFrac = 0.6, stepFrac = 0.5) =>
  Array.from({ length: Math.max(1, count) }, (_, i) => r2(base * (startFrac + i * stepFrac)));
