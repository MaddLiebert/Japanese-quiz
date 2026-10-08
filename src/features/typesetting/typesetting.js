// ─────────────────────────────────────────────────────────────────────────────
// M1 活字組み (Typesetting) — MURNI: tanpa React, tanpa DOM, tanpa import JSON.
// Belajar grammar = menyusun blok huruf (活字) jadi kalimat benar. Susunan benar
// = cetakan bersih; salah = chromatic misprint (offset renga/biru). Lihat SPEC
// docs/tema/meiji-mekanik.md §M1.
//
// Modul ini hanya berisi LOGIKA. Bank soal ada di ./typesettingBank.js supaya
// file ini tetap murni & bisa dites `node --test` tanpa import attribute JSON.

// Warna blok per kelas kata (dipetakan ke token tema di UI).
export const POS_COLORS = {
  noun: 'renga',
  particle: 'ai',
  verb: 'shu',
  adj: 'matcha',
  aux: 'nezumi',
  adv: 'kin',
};

// Label kelas kata (dwibahasa) untuk tooltip/legenda.
export const POS_LABELS = {
  noun: { id: 'Nomina', en: 'Noun' },
  particle: { id: 'Partikel', en: 'Particle' },
  verb: { id: 'Verba', en: 'Verb' },
  adj: { id: 'Adjektiva', en: 'Adjective' },
  aux: { id: 'Auxiliaris', en: 'Auxiliary' },
  adv: { id: 'Adverbia', en: 'Adverb' },
};

// Warna token untuk 1 kelas kata; tak dikenal → sumi (netral, tidak crash).
export const posColor = (pos) => POS_COLORS[pos] || 'sumi';

// Partikel ditampilkan sebagai blok KECIL (mengajarkan struktur SOV).
export const isSmallBlock = (pos) => pos === 'particle';

// 3 level: 1 jiplak (furigana tampak) · 2 ingat · 3 buta (tanpa furigana).
export const TYPESETTING_LEVELS = {
  1: { key: 1, showReading: true, showTranslation: true, xp: 12 },
  2: { key: 2, showReading: true, showTranslation: false, xp: 20 },
  3: { key: 3, showReading: false, showTranslation: false, xp: 30 },
};

export const DEFAULT_TYPESETTING_LEVEL = 1;

// Normalisasi level tak dikenal → level default (UI tidak pernah crash).
export const typesettingLevel = (level) => TYPESETTING_LEVELS[level] || TYPESETTING_LEVELS[DEFAULT_TYPESETTING_LEVEL];

export const typesettingXp = (level) => typesettingLevel(level).xp;

// ── PRNG deterministik (mulberry32) + Fisher–Yates ───────────────────────────
// Seed sama → urutan sama. Ini yang bikin buildPool bisa dites.
const mulberry32 = (seed) => {
  let a = (Number(seed) || 0) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Acak blok BENAR + distraktor jadi satu kolam (pool). Deterministik via seed.
// Mengembalikan SALINAN blok (pemanggil bebas mengubah tanpa merusak soal).
export const buildPool = (q, seed = 1) => {
  const all = [...(q?.parts || []), ...(q?.distractors || [])];
  const rnd = mulberry32(seed);
  const keyed = all.map((b, i) => ({ b, k: rnd(), i }));
  keyed.sort((x, y) => (x.k - y.k) || (x.i - y.i));
  return keyed.map(({ b }) => ({ ...b }));
};

// Kunci susunan benar (id blok BENAR, urut).
export const correctOrder = (q) => (q?.parts || []).map((p) => p.id);

// Cek susunan: ok HANYA kalau blok BENAR terpakai urut, tanpa distraktor,
// tanpa kurang/lebih. misprintAt = indeks pertama yang salah (−1 kalau ok).
export const checkOrder = (q, placedIds = []) => {
  const correct = correctOrder(q);
  const n = correct.length;
  if (placedIds.length !== n) {
    const span = Math.max(placedIds.length, n);
    for (let i = 0; i < span; i++) {
      if (placedIds[i] !== correct[i]) return { ok: false, misprintAt: i };
    }
    return { ok: false, misprintAt: -1 };
  }
  for (let i = 0; i < n; i++) {
    if (placedIds[i] !== correct[i]) return { ok: false, misprintAt: i };
  }
  return { ok: true, misprintAt: -1 };
};

// Intensitas misprint 0..1 = proporsi posisi yang salah (+ blok berlebih).
// 0 = cetakan bersih. Dipakai UI → CSS var --misprint (offset renga/biru).
export const misprintAmount = (q, placedIds = []) => {
  const correct = correctOrder(q);
  const n = correct.length || 1;
  let wrong = 0;
  for (let i = 0; i < n; i++) {
    if (placedIds[i] !== correct[i]) wrong++;
  }
  wrong += Math.max(0, placedIds.length - correct.length);
  return Math.min(1, wrong / n);
};

// Susunan "penuh" (jumlah blok == jumlah blok benar) — siap dicetak/dicek.
export const isComplete = (q, placedIds = []) =>
  placedIds.length === correctOrder(q).length;

// Blok mana saja yang benar (untuk menyembunyikan distraktor saat reveal).
export const isCorrectBlock = (q, id) => correctOrder(q).includes(id);

// Pilih soal dari bank sesuai level (fallback: semua soal kalau kosong).
export const pickQuestions = (bank = [], level = DEFAULT_TYPESETTING_LEVEL) => {
  const atLevel = bank.filter((q) => q.level === level);
  return atLevel.length > 0 ? atLevel : [...bank];
};

// Validasi soal (dipakai test & bisa dipakai editor konten).
// Soal valid kalau: id ada, ≥2 blok benar, id unik (termasuk distraktor),
// tiap blok punya jp & pos.
export const validateQuestion = (q) => {
  const errors = [];
  if (!q || typeof q !== 'object') return { ok: false, errors: ['question bukan objek'] };
  if (!q.id) errors.push('id kosong');
  if (!Array.isArray(q.parts) || q.parts.length < 2) errors.push('parts < 2');
  const ids = [...(q.parts || []), ...(q.distractors || [])].map((b) => b?.id);
  if (ids.some((x) => !x)) errors.push('ada blok tanpa id');
  if (new Set(ids).size !== ids.length) errors.push('id blok duplikat');
  for (const b of [...(q.parts || []), ...(q.distractors || [])]) {
    if (!b?.jp) errors.push(`blok ${b?.id || '?'} tanpa jp`);
    if (!b?.pos) errors.push(`blok ${b?.id || '?'} tanpa pos`);
  }
  return { ok: errors.length === 0, errors };
};
