// ─────────────────────────────────────────────────────────────────────────────
// Logika murni efek Yuji Itadori (pack_09, visual 'yuji').
// Sumber desain: obsidian-mind/brain/Efek JJK/Yuji Itadori.md.
// Tanpa DOM / React / import JSON → dites `node --test` (pola gojoFx.js).
// Komponen (YujiBurst/YujiTakeover) & EffectContext HANYA membaca dari sini.
// ─────────────────────────────────────────────────────────────────────────────

// Milestone = sama persis Gojo (keputusan desain: konsisten antar pack JJK).
export const YUJI_MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const isYujiMilestone = (streak) => YUJI_MILESTONES.includes(streak);

// ── Warna: biru -> hitam -> merah darah -> hitam-ungu -> api ────────────────
export const YUJI_INK = '#0a0a0a';
export const YUJI_FLASH = '#ffffff';
// ── Wajah kerasukan Sukuna (kanon) ───────────────────────────────────────
// Kanon (wiki JJK): saat Sukuna menguasai badan Yuji → (1) sepasang mata KEDUA
// terbuka DI BAWAH mata normal, (2) mata menyempit jadi celah dengan pupil
// ganda, (3) tato hitam: mahkota di dahi + garis batang hidung + tato pipi.
// Koordinat di bidang 0..100 (viewBox) supaya bisa dipakai <svg> apa pun.
export const YUJI_SUKUNA_EYES = [
  { id: 'upper-l', cx: 33, cy: 46, rx: 12, ry: 4.2, pupil: 3.1 },
  { id: 'upper-r', cx: 67, cy: 46, rx: 12, ry: 4.2, pupil: 3.1 },
  { id: 'lower-l', cx: 35, cy: 57, rx: 7.5, ry: 2.6, pupil: 1.9 },
  { id: 'lower-r', cx: 65, cy: 57, rx: 7.5, ry: 2.6, pupil: 1.9 },
];

export const YUJI_SUKUNA_MARKINGS = [
  // Mahkota di tengah dahi (kanon: crown-like symbol).
  { id: 'crown', d: 'M50 16 L42 30 M50 16 L50 32 M50 16 L58 30 M50 16 L34 26 M50 16 L66 26' },
  // Garis horizontal di batang hidung (kanon).
  { id: 'nose', d: 'M38 40 L62 40' },
  // Tato pipi kiri/kanan (kanon: spread from cheekbones).
  { id: 'cheek-l', d: 'M22 50 L34 62 M20 58 L30 68 M26 44 L38 55' },
  { id: 'cheek-r', d: 'M78 50 L66 62 M80 58 L70 68 M74 44 L62 55' },
];

export const YUJI_STYLE = {
  keiteiken: { kanji: '逕庭拳', color: '#00b0ff', label: '逕庭拳 · Keiteiken' },
  manjigeri: { kanji: '卍蹴り', color: '#00b0ff', label: '卍蹴り · Manji-geri' },
  kokusen:   { kanji: '黒閃',   color: '#111111', label: '黒閃 · Kokusen' },
  senketsu:  { kanji: '穿血',   color: '#8b0000', label: '穿血 · Senketsu' },
  kai:       { kanji: '解',     color: '#e8e0ff', label: '解 · Kai' },
  hachi:     { kanji: '捌',     color: '#e8e0ff', label: '捌 · Hachi' },
  fuga:      { kanji: '開',     color: '#e0241a', label: '開 · Fūga' },
  takeover:  { kanji: '宿儺の器', color: '#6d28d9', label: '宿儺の器 · Sukuna no Utsuwa' },
};

// ── Teknik per streak ───────────────────────────────────────────────────────
// 1 = 逕庭拳 · 2 = 卍蹴り (gantian) · 3..59 = 黒閃 · >=60 = 穿血.
// TIDAK PERNAH mengembalikan domain/takeover — takeover dari BAR (指), bukan streak.
export const yujiTechniqueFor = (kind, streak = 0) => {
  if (kind === 'wrong') return null;
  if (!Number.isFinite(streak) || streak <= 0) return 'keiteiken';
  if (streak >= 60) return 'senketsu';
  if (streak >= 3) return 'kokusen';
  return streak === 1 ? 'keiteiken' : 'manjigeri';
};

// ── Bar 指 (jari Sukuna): 20 benar beruntun = penuh -> tap = 宿儺の器 ─────────
export const YUJI_ULT_THRESHOLD = 20;
export const yujiCurseCharge = (streak) =>
  (Number.isFinite(streak) && streak > 0) ? Math.min(YUJI_ULT_THRESHOLD, Math.floor(streak)) : 0;
export const yujiUltReady = (streak) =>
  Number.isFinite(streak) && streak >= YUJI_ULT_THRESHOLD;

// ── 宿儺の器: state 30 dtk, TIMER JALAN (beda dari domain Gojo yang membekukan) ─
export const YUJI_TAKEOVER_DURATION_S = 30;
export const yujiTakeoverLeft = (endsAt, now = Date.now()) => {
  if (!Number.isFinite(endsAt) || !Number.isFinite(now)) return 0;
  const left = Math.ceil((endsAt - now) / 1000);
  if (!Number.isFinite(left) || left <= 0) return 0;
  return Math.min(YUJI_TAKEOVER_DURATION_S, left);
};

// Timeline cinematic cast 宿儺の器 (detik). 宿儺の器 = TEKS DOANG (tanpa klip
// voice); suara Sukuna masuk lewat combo 解/捌/開.
export const YUJI_TAKEOVER_TIMELINE = {
  tattooStart: 0.0,   // aura biru naik, tato merayap
  eyesAt: 0.4,        // mata berubah, aura hitam-ungu
  kanjiAt: 0.8,       // kanji 宿儺の器 muncul
  kanjiHold: 1.5,     // lama kanji tampil
  voiceAt: 1.2,       // possessWhoosh (SFX, bukan klip voice)
  settleStart: 2.3,   // veil tersingkap
  settleDur: 0.6,
};

// Hitung mundur mulai SETELAH cinematic settle -> 30 dtk itu waktu main penuh.
export const yujiTakeoverStartDelayMs = () => {
  const t = YUJI_TAKEOVER_TIMELINE;
  return Math.round((t.settleStart + t.settleDur) * 1000);
};

// ── Combo takeover 解->捌->開 (kanon: 解/捌 dulu, baru 開) ────────────────────
// level 0 = belum, 1 = 解, 2 = 捌, 3 = 開 (finisher). Cap di 3.
export const yujiComboNext = (level) =>
  Math.min(3, (Number.isFinite(level) && level > 0 ? Math.floor(level) : 0) + 1);
export const YUJI_COMBO_CLIPS = ['/voices/yuji/kai.mp3', '/voices/yuji/hachi.mp3', '/voices/yuji/fuga.mp3'];
export const YUJI_COMBO_KANJI = ['解', '捌', '開'];
export const yujiComboClip = (level) => {
  const lvl = Math.floor(Number(level));
  return (lvl >= 1 && lvl <= 3) ? YUJI_COMBO_CLIPS[lvl - 1] : null;
};
export const yujiComboKanji = (level) => {
  const lvl = Math.floor(Number(level));
  return (lvl >= 1 && lvl <= 3) ? YUJI_COMBO_KANJI[lvl - 1] : null;
};

// ── 開 (finisher): bakar 2 opsi SALAH soal berikutnya (50/50) + XP dobel ────
export const YUJI_FINISHER_XP_MULT = 2;

// Pilih <=2 id opsi salah. rng injectable -> deterministik di tes. Tidak
// memutasi input (map() bikin salinan dulu).
export const yujiBurnedIds = (options = [], correctId = null, rng = Math.random) => {
  const ids = (Array.isArray(options) ? options : [])
    .map((o) => (o && typeof o === 'object' ? o.id : o))
    .filter((id) => id != null && id !== correctId);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, 2);
};

// ── Generator partikel murni (rng injectable; dipakai YujiBurst) ────────────
export const yujiSparks = (seed = 1, count = 16, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + rng() * 0.5;
    return {
      id: `${seed}-s${i}`,
      angle: a,
      dist: 40 + rng() * 150,
      size: 2 + rng() * 5,
      dur: 0.35 + rng() * 0.35,
      delay: rng() * 0.12,
    };
  });

export const yujiCracks = (seed = 1, count = 8, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-c${i}`,
    angle: (i / count) * Math.PI * 2 + rng() * 0.35,
    len: 30 + rng() * 20,          // satuan viewBox 0..100
    delay: i * 0.04,
  }));

export const yujiEmbers = (seed = 1, count = 7, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-e${i}`,
    x: 12 + rng() * 76,            // persen horizontal
    size: 3 + rng() * 5,
    dur: 0.9 + rng() * 0.9,
    delay: rng() * 0.7,
    drift: -30 - rng() * 60,       // px, negatif = naik
  }));

export const yujiBeam = (seed = 1, rng = Math.random) => ({
  id: `${seed}-beam`,
  y: 44 + rng() * 12,              // posisi vertikal (persen)
  thickness: 2 + rng() * 2,
  dur: 0.5,
});

export const yujiWindLines = (seed = 1, count = 12, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-w${i}`,
    x: 8 + rng() * 84,
    len: 18 + rng() * 40,
    dur: 0.3 + rng() * 0.25,
    delay: rng() * 0.2,
  }));

// Garis putus-putus 御廚子 versi Yuji (解/捌) — nyebar kayak gunting, lalu SNIP.
export const yujiScissorLines = (seed = 1, count = 7, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-k${i}`,
    angle: rng() * Math.PI,        // radian
    offset: -30 + rng() * 60,      // geser vertikal di viewBox
    delay: i * 0.05,
  }));
