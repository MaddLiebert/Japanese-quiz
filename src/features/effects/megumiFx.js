// ─────────────────────────────────────────────────────────────────────────────
// Logika murni efek Megumi Fushiguro (pack_10, visual 'megumi') — 十種影法術.
// Sumber desain: obsidian-mind/brain/Efek JJK/Megumi.md (🔒 spec pack).
// Tanpa DOM / React / import JSON → dites `node --test` (pola gojoFx/yujiFx/
// sukunaFx). Komponen (MegumiBurst/MegumiShadow) & EffectContext HANYA baca
// dari sini.
//
// Identitas visual: BAYANGAN (影) — genangan hitam yang mengalir & menelan;
// siluet shikigami BANGKIT dari genangan (bukan plasma/api/tebasan).
// Warna: tinta hitam + highlight perak + aksen 藍 indigo.
//
// Filosofi ultimate (spec §6): Megumi = KETAHANAN. 適応 (adaptasi) = asuransi
// yang snowball jadi kekuatan — makin sering salah makin kebal (streak TIDAK
// hangus) & makin ngebantu (opsi salah dihapus). Bayarannya = risiko 輪砕け
// (salah ke-9 saat roda penuh → roda pecah, summon bubar, streak HANGUS).
// Beda dari Sukuna yang menyerang (必中) — Megumi BERTAHAN.
// ─────────────────────────────────────────────────────────────────────────────

// Milestone = sama persis Gojo/Yuji/Sukuna (keputusan desain: konsisten JJK).
export const MEGUMI_MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const isMegumiMilestone = (streak) => MEGUMI_MILESTONES.includes(streak);

// ── Palet Megumi: tinta hitam + perak + 藍 indigo + ungu-bayangan (ultimate) ──
export const MEGUMI_INK = '#0a0a0a';
export const MEGUMI_SILVER = '#cbd5e1';
export const MEGUMI_INDIGO = '#4338ca';

export const MEGUMI_STYLE = {
  gyokuken: { kanji: '玉犬',   color: MEGUMI_SILVER, label: '玉犬 · Divine Dogs' },
  nue:      { kanji: '鵺',     color: MEGUMI_INDIGO, label: '鵺 · Nue' },
  orochi:   { kanji: '大蛇',   color: '#14b8a6',     label: '大蛇 · Great Serpent' },
  bansou:   { kanji: '満象',   color: '#38bdf8',     label: '満象 · Max Elephant', gif: '/effects/megumi_bansou.gif' },
  kosou:    { kanji: '虎葬',   color: '#f59e0b',     label: '虎葬 · Tiger Funeral' },
  // 魔虚羅: versi KECIL/terbatas/切札 milik Megumi (anti-nabrak: Sukuna = raksasa/
  // terkontrol/Meguna). GIF cut-in kanon milik Megumi sendiri.
  mahoraga: { kanji: '魔虚羅', color: '#6d28d9',     label: '布瑠部由良由良 → 魔虚羅', gif: '/effects/megumi_mahoraga.gif' },
  // 適応: momen "belajar" — roda +1 takik, streak tidak hangus.
  adapt:    { kanji: '適応',   color: '#8b5cf6',     label: '適応 · Adaptation' },
  // 八握剣 dicabut: roda penuh → sisa durasi SEMUA opsi salah terpotong.
  sword:    { kanji: '八握剣', color: '#e2e8f0',     label: '八握剣 · Sword Drawn' },
  // 輪砕け: backlash 切札 — roda pecah, summon bubar, streak hangus.
  shatter:  { kanji: '輪砕け', color: '#ef4444',     label: '輪砕け · Wheel Shatter' },
};

// ── Ladder jurus per streak (spec §Ringkasan cepat) ──────────────────────────
// Non-streak = ROTASI deterministik 玉犬 ↔ 鵺 (bukan acak — pola Sukuna v3).
// Momen: 10 大蛇 · 20 満象 · 30+ 虎葬 (jurus puncak: tetap dipakai selama
// streak ≥ 30 — spec tabel menulis "30+", bukan sekali lewat).
export const MEGUMI_LADDER = { 10: 'orochi', 20: 'bansou' };
export const MEGUMI_TOP_STREAK = 30;
export const MEGUMI_NON_STREAK_CYCLE = ['gyokuken', 'nue'];

// Jawaban benar NON-momen ke berapa streak ini (1-based). Murni dari angka
// streak (tanpa state) → stabil antar render, gampang dites.
export const megumiNonStreakIndex = (streak) => {
  if (!Number.isFinite(streak) || streak <= 0) return 0;
  const s = Math.floor(streak);
  const passed = Object.keys(MEGUMI_LADDER).filter((m) => s >= Number(m)).length;
  return s - passed;
};

export const megumiTechniqueFor = (kind, streak = 0) => {
  if (kind === 'wrong') return null;
  if (!Number.isFinite(streak) || streak <= 0) return null;
  const s = Math.floor(streak);
  if (s >= MEGUMI_TOP_STREAK) return 'kosou';
  if (MEGUMI_LADDER[s]) return MEGUMI_LADDER[s];
  const idx = megumiNonStreakIndex(s);
  if (idx <= 0) return null;
  return MEGUMI_NON_STREAK_CYCLE[(idx - 1) % MEGUMI_NON_STREAK_CYCLE.length];
};

// ── Bar 呪力: 20 slot (pola JJK konsisten) ───────────────────────────────────
export const MEGUMI_ULT_THRESHOLD = 20;
export const megumiCurseCharge = (streak) =>
  (Number.isFinite(streak) && streak > 0) ? Math.min(MEGUMI_ULT_THRESHOLD, Math.floor(streak)) : 0;
export const megumiUltReady = (streak) =>
  Number.isFinite(streak) && streak >= MEGUMI_ULT_THRESHOLD;

// ── 魔虚羅 summon: state 30 dtk, TIMER JALAN (pola `rare`: Yuji/Sukuna) ──────
export const MEGUMI_SUMMON_DURATION_S = 30;
export const megumiSummonLeft = (endsAt, now = Date.now()) => {
  if (!Number.isFinite(endsAt) || !Number.isFinite(now)) return 0;
  const left = Math.ceil((endsAt - now) / 1000);
  if (!Number.isFinite(left) || left <= 0) return 0;
  return Math.min(MEGUMI_SUMMON_DURATION_S, left);
};

// ── Segmen klip chant (hasil ukur RMS 29/09 — JANGAN ditebak) ────────────────
// 布瑠部 ≈0.32–0.67 · 由良由良 ≈1.14–1.66 · segmen pendek ≈2.60–2.82 (ekor
// frasa; penanda siluet bangkit) · 魔虚羅 ≈3.01–4.71 · total 4.959s.
export const MEGUMI_CAST_VOICE = {
  furubeStart: 0.32, furubeEnd: 0.67,
  yuraStart: 1.14,   yuraEnd: 1.66,
  midStart: 2.60,    midEnd: 2.82,
  mahoragaStart: 3.01, mahoragaEnd: 4.71,
  dur: 4.959,
};

// Timeline cinematic cast (detik) — SEMUA sync ke klip 4.959s (spec §6):
// veil → genangan menyebar → chant per-karakter → roda 八握剣 → siluet bangkit
// → kanji 魔虚羅 → shake → FLASH + BOOM → settle (roda kecil persist).
export const MEGUMI_SUMMON_TIMELINE = {
  veilAt: 0.0,        // veil gelap total + dread
  poolAt: 0.10,       // genangan bayangan menyebar dari TENGAH ke lantai
  kanji1At: 0.32,     // 布瑠部 per-karakter (sync frasa 1)
  kanji1Per: 0.12,    // ≈0.12s/kanji (3 karakter dalam 0.35s)
  kanji2At: 1.14,     // 由良由良 per-karakter (sync frasa 2)
  kanji2Per: 0.13,    // ≈0.13s/kanji (4 karakter dalam 0.52s)
  wheelAt: 1.80,      // roda 八握剣 muncul di atas, muter (8 jari-jari)
  riseAt: 2.60,       // siluet raksasa 魔虚羅 bangkit dari bayangan (sync segmen mid)
  kanji3At: 3.01,     // 魔虚羅 raksasa muncul 1× glow ungu-bayangan
  shakeAt: 3.30,      // SHAKE layar + aura 影 + bara hitam naik
  flashAt: 4.72,      // FLASH (setelah frasa 魔虚羅 selesai 4.71)
  boomAt: 4.72,       // BOOM (playDomainBoom('bang') + playMakoraRoar)
  settleAt: 4.85,     // settle: siluet+kanji naik & mengecil → roda kecil persist
  settleDur: 0.6,
};

// Hitung mundur mulai SETELAH cinematic settle → 30 dtk itu waktu main penuh.
export const megumiSummonStartDelayMs = () => {
  const t = MEGUMI_SUMMON_TIMELINE;
  return Math.round((t.settleAt + t.settleDur) * 1000);
};

// ── Mekanik 適応 (Adaptation) — inti ultimate ────────────────────────────────
export const MEGUMI_WHEEL_NOTCHES = 8;   // 八握剣 = 8 takik
export const MEGUMI_ADAPT_CUT = 1;       // 適応: 1 opsi salah dihapus / salah
// Jeda sebelum potongan 適応 mendarat di soal berikutnya (pola SUKUNA_HITSUME_DELAY_MS,
// tapi lebih pelan: Megumi BERTAHAN — bayangan menelan opsi pelan, bukan tebasan).
export const MEGUMI_ADAPT_DELAY_MS = 1100;
// Jeda 八握剣 (必中 mini): roda penuh → pedang dicabut → opsi salah dipotong.
// Lebih cepat dari 適応 karena momen "pedang tercabut" harus kerasa responsif.
export const MEGUMI_SWORD_DELAY_MS = 700;

// Roda penuh → Mahoraga cabut 八握剣 → 必中 mini (SEMUA opsi salah terpotong).
export const megumiSwordReady = (notches, max = MEGUMI_WHEEL_NOTCHES) => {
  const n = Number.isFinite(notches) && notches > 0 ? Math.floor(notches) : 0;
  const m = Number.isFinite(max) && max > 0 ? Math.floor(max) : MEGUMI_WHEEL_NOTCHES;
  return n >= m;
};

// Salah SELAMA summon. Roda belum penuh → 適応 (roda +1, streak aman).
// Roda sudah penuh (salah ke-9) → 輪砕け (summon bubar + streak HANGUS).
export const megumiWrongOutcome = (notches, max = MEGUMI_WHEEL_NOTCHES) => {
  const m = Number.isFinite(max) && max > 0 ? Math.floor(max) : MEGUMI_WHEEL_NOTCHES;
  const n = Number.isFinite(notches) && notches > 0 ? Math.floor(notches) : 0;
  if (n >= m) return { notches: m, outcome: 'shatter' };
  return { notches: n + 1, outcome: 'adapt' };
};

// Opsi salah yang dihapus 適応: deterministik (urutan array, bukan acak) →
// stabil antar render. Jawaban benar TIDAK pernah masuk.
export const megumiAdaptCut = (options = [], correctId = null, count = MEGUMI_ADAPT_CUT) => {
  const ids = (Array.isArray(options) ? options : [])
    .map((o) => (o && typeof o === 'object' ? o.id : o))
    .filter((id) => id != null && id !== correctId);
  const n = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  return ids.slice(0, n);
};

// Opsi salah yang terpotong 八握剣 (必中 mini): SEMUA opsi salah, benar aman.
export const megumiSwordCut = (options = [], correctId = null) =>
  (Array.isArray(options) ? options : [])
    .map((o) => (o && typeof o === 'object' ? o.id : o))
    .filter((id) => id != null && id !== correctId);

// Rencana takik roda untuk UI (persist selama summon): array { id, on }.
export const megumiWheelNotchPlan = (notches, max = MEGUMI_WHEEL_NOTCHES) => {
  const m = Number.isFinite(max) && max > 0 ? Math.floor(max) : MEGUMI_WHEEL_NOTCHES;
  const n = Math.min(m, Number.isFinite(notches) && notches > 0 ? Math.floor(notches) : 0);
  return Array.from({ length: m }, (_, i) => ({ id: `notch-${i}`, on: i < n }));
};

// ── Generator partikel murni (rng injectable; dipakai MegumiBurst/MegumiShadow) ──
const r2 = (v) => +v.toFixed(2);

// Genangan bayangan: blob mengalir di lantai (dasar SEMUA jurus Megumi).
export const megumiPoolBlobs = (seed = 1, count = 7, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-pb${i}`,
    x: r2(6 + rng() * 88),            // persen horizontal
    w: r2(18 + rng() * 26),           // lebar (persen)
    h: r2(6 + rng() * 10),            // tinggi genangan (persen)
    dur: r2(0.5 + rng() * 0.6),
    delay: r2(rng() * 0.25),
  }));

// 玉犬: 2 siluet serigala bangkit dari genangan (kiri & kanan).
export const megumiWolfRise = (seed = 1, rng = Math.random) =>
  ['left', 'right'].map((side, i) => ({
    id: `${seed}-w${i}`,
    side,
    x: side === 'left' ? r2(16 + rng() * 8) : r2(76 + rng() * 8),
    scale: r2(0.85 + rng() * 0.3),
    tilt: r2(-9 + rng() * 18),        // derajat
    delay: r2(i * 0.08 + rng() * 0.06),
  }));

// 玉犬: 3 goresan cakar melintang (garis bayangan tajam + rim perak).
export const megumiClawMarks = (seed = 1, rng = Math.random) =>
  Array.from({ length: 3 }, (_, i) => ({
    id: `${seed}-cl${i}`,
    y: r2(30 + i * 9 + rng() * 4),    // persen vertikal
    angle: r2(-26 + rng() * 16),
    len: r2(46 + rng() * 26),
    dur: r2(0.22 + rng() * 0.16),
    delay: r2(i * 0.06),
  }));

// 鵺: petir ungu nyamber dari ATAS (beda Gojo: dari tepi) — 3 sambaran.
export const megumiShadowBolts = (seed = 1, count = 3, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => {
    const x0 = 18 + (i / Math.max(1, count - 1)) * 64;   // kiri → tengah → kanan
    const segments = 5 + Math.floor(rng() * 3);
    const pts = [[r2(x0 + (rng() - 0.5) * 6), -4]];
    let x = pts[0][0];
    for (let s = 1; s <= segments; s++) {
      const y = (100 / segments) * s;
      x = Math.max(2, Math.min(98, x + (rng() - 0.5) * 16));
      pts.push([r2(x), r2(y)]);
    }
    return {
      id: `${seed}-sb${i}`,
      pts,
      width: r2(1 + rng() * 1.4),
      dur: r2(0.34 + rng() * 0.3),
      delay: r2(i * 0.22 + rng() * 0.1),
    };
  });

// 鵺: bulu/sayap bayangan melebar menutupi layar (0.3s lalu hilang).
export const megumiWingSpread = (seed = 1, rng = Math.random) => ({
  id: `${seed}-wg`,
  span: r2(62 + rng() * 22),          // persen lebar bentangan
  y: r2(26 + rng() * 16),
  dur: r2(0.3 + rng() * 0.14),
  delay: r2(0.18 + rng() * 0.1),
});

// 大蛇: cincin lilitan ular raksasa (nglilit) + sisik perak berkilau.
export const megumiSerpentCoils = (seed = 1, count = 5, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-sc${i}`,
    r: r2(16 + i * 7 + rng() * 4),     // radius viewBox 0..100
    tilt: r2(-14 + rng() * 28),
    width: r2(1.6 + rng() * 1.2),
    dur: r2(0.5 + rng() * 0.4),
    delay: r2(i * 0.09),
  }));

export const megumiScales = (seed = 1, count = 9, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-scl${i}`,
    x: r2(12 + rng() * 76),
    y: r2(22 + rng() * 58),
    size: r2(3 + rng() * 5),
    dur: r2(0.4 + rng() * 0.5),
    delay: r2(rng() * 0.5),
  }));

// 大蛇/虎葬: garis retak lantai (gelap) — pecahan tanah.
export const megumiCracks = (seed = 1, count = 5, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-ck${i}`,
    x: r2(10 + rng() * 80),
    y: r2(58 + rng() * 30),           // area lantai
    len: r2(20 + rng() * 40),
    angle: r2(-40 + rng() * 80),
    delay: r2(i * 0.07 + rng() * 0.08),
  }));

// 満象: semburan air dari belalai (gradient biru, BUKAN api) + riak menyebar.
export const megumiWaterJet = (seed = 1, rng = Math.random) => ({
  id: `${seed}-wj`,
  angle: r2(-38 + rng() * 22),        // derajat (naik lalu jatuh)
  len: r2(40 + rng() * 24),
  width: r2(6 + rng() * 6),
  dur: r2(0.7 + rng() * 0.4),
});

export const megumiRipples = (seed = 1, count = 4, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-rp${i}`,
    x: r2(20 + rng() * 60),
    y: r2(66 + rng() * 24),
    r0: r2(6 + rng() * 6),
    r1: r2(26 + rng() * 22),
    dur: r2(0.6 + rng() * 0.5),
    delay: r2(i * 0.12 + rng() * 0.08),
  }));

// 虎葬: harimau bayangan menerkam dari sisi + cakar raksasa amber.
export const megumiTigerLeap = (seed = 1, rng = Math.random) => ({
  id: `${seed}-tl`,
  fromX: r2(8 + rng() * 14),          // persen (masuk dari kiri)
  toX: r2(70 + rng() * 20),
  y: r2(38 + rng() * 18),
  tilt: r2(-16 + rng() * 10),
  scale: r2(0.9 + rng() * 0.35),
  dur: r2(0.55 + rng() * 0.25),
});

export const megumiAmberClaws = (seed = 1, rng = Math.random) =>
  Array.from({ length: 3 }, (_, i) => ({
    id: `${seed}-ac${i}`,
    angle: r2(-30 + i * 12 + rng() * 6),
    offset: r2(i * 10 - 10),
    width: r2(2.4 + rng() * 1.6),
    dur: r2(0.26 + rng() * 0.18),
    delay: r2(i * 0.05),
  }));

// 虎葬: lantai retak membentuk pola taring (zigzag gigi).
export const megumiFangCracks = (seed = 1, count = 6, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-fc${i}`,
    x: r2(12 + i * 13 + rng() * 5),
    y: r2(60 + rng() * 24),
    len: r2(14 + rng() * 22),
    angle: r2(50 + rng() * 40),       // miring membentuk taring
    delay: r2(i * 0.05),
  }));

// Aura 影 (summon persist): bara hitam naik + drift.
export const megumiShadowMotes = (seed = 1, count = 8, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-sm${i}`,
    x: r2(8 + rng() * 84),
    size: r2(3 + rng() * 5),
    dur: r2(1.0 + rng() * 1.0),
    delay: r2(rng() * 0.9),
    drift: r2(-30 - rng() * 60),      // px, negatif = naik
  }));
