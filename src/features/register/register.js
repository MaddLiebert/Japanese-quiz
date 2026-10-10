// ─────────────────────────────────────────────────────────────────────────────
// A2 タメ口↔敬語 (Tukar register) — MURNI: tanpa React, tanpa DOM, tanpa import JSON.
// Register = inti bahasa pop. Tokoh anime bicara タメ口 (santai) ke teman,
// 敬語 (hormat) ke atasan/orang baru. Mekanik: ubah kalimat dari satu register ke
// yang lain — keterampilan yang langsung kepakai di percakapan nyata.
// Spec: docs/tema/anime-mekanik.md §A2.
//
// ⚠️ Aturan data: `casual` unik & `polite` unik di seluruh bank. Kalau tidak,
// toPolite/toCasual jadi ambigu (lookup dua arah bisa salah) — validateRegisterBank
// menjaga ini.

// Dua arah: 'polite' (santai→hormat) · 'casual' (hormat→santai).
export const REGISTER_MODES = ['polite', 'casual'];
export const DEFAULT_REGISTER_MODE = 'polite';

export const isRegisterMode = (mode) => REGISTER_MODES.includes(mode);

// Hint konjugasi (mode Jiplak / level 1): pola umum, bukan kamus.
export const REGISTER_HINTS = [
  { from: 'だ', to: 'です', note: 'kopula' },
  { from: 'る', to: 'ます', note: 'verba godan/ichidan' },
  { from: 'する', to: 'します', note: 'verba する' },
  { from: '〜て', to: '〜てください', note: 'permintaan' },
];

// Pasangan kalimat santai ↔ hormat (bukan kamus — ada konteks).
export const REGISTER_PAIRS = [
  { id: 'taberu',  casual: '食べる',      polite: '食べます',        meaning_id: 'makan',            level: 1 },
  { id: 'iku',     casual: '行く',        polite: '行きます',        meaning_id: 'pergi',            level: 1 },
  { id: 'da',      casual: '学生だ',      polite: '学生です',        meaning_id: 'murid',            level: 1 },
  { id: 'ii',      casual: 'いい',        polite: 'いいです',        meaning_id: 'bagus',            level: 1 },
  { id: 'miru',    casual: '見る',        polite: '見ます',          meaning_id: 'melihat',          level: 1 },
  { id: 'suru',    casual: 'する',        polite: 'します',          meaning_id: 'melakukan',        level: 1 },
  { id: 'oishii',  casual: 'おいしい',    polite: 'おいしいです',    meaning_id: 'enak',             level: 1 },
  { id: 'shiteru', casual: '知ってる？',  polite: 'ご存じですか？',  meaning_id: 'tahu?',            level: 2 },
  { id: 'kure',    casual: '教えて',      polite: '教えてください',  meaning_id: 'tolong ajar',      level: 2 },
  { id: 'matsu',   casual: '待って',      polite: '待ってください',  meaning_id: 'tunggu',           level: 2 },
  { id: 'kuru',    casual: '来る',        polite: '来ます',          meaning_id: 'datang',           level: 2 },
  { id: 'wakaru',  casual: '分かる',      polite: '分かります',      meaning_id: 'mengerti',         level: 2 },
  { id: 'itta',    casual: '行った',      polite: '行きました',      meaning_id: 'sudah pergi',      level: 3 },
  { id: 'tabeta',  casual: '食べた',      polite: '食べました',      meaning_id: 'sudah makan',      level: 3 },
];

// Entri berdasarkan id; tak dikenal → null (UI tidak pernah crash).
export const registerById = (id) => REGISTER_PAIRS.find((p) => p.id === id) || null;

// Normalisasi mode tak dikenal → default (UI tidak pernah crash).
export const registerMode = (mode) => (isRegisterMode(mode) ? mode : DEFAULT_REGISTER_MODE);

// Kalimat target untuk mode ini ('polite' → target hormat, 'casual' → target santai).
export const registerTarget = (item, mode) =>
  mode === 'casual' ? (item?.casual ?? null) : (item?.polite ?? null);

// Cek jawaban pemain. guess = kalimat pemain (di-trim; string kosong = salah).
// ok = cocok dengan target register. target = kalimat benar (untuk reveal).
export const checkRegister = (item, mode, guess) => {
  const target = registerTarget(item, mode);
  const g = typeof guess === 'string' ? guess.trim() : guess;
  return { ok: !!target && g === target, target: target || null };
};

// Konversi cepat (lookup dua arah) untuk hint/auto-suggest. Tak dikenal → null.
export const toPolite = (casual) => REGISTER_PAIRS.find((p) => p.casual === casual)?.polite || null;
export const toCasual = (polite) => REGISTER_PAIRS.find((p) => p.polite === polite)?.casual || null;

// Soal per level (level ≤ n). Level tak dikenal → semua.
export const registerByLevel = (level) => {
  const lv = Number(level);
  if (!Number.isFinite(lv)) return [...REGISTER_PAIRS];
  return REGISTER_PAIRS.filter((p) => p.level <= lv);
};

// Validasi 1 pasangan: id/casual/polite/meaning ada, level angka, casual≠polite.
export const validateRegisterPair = (p) => {
  const errors = [];
  if (!p || typeof p !== 'object') return { ok: false, errors: ['pasangan bukan objek'] };
  if (!p.id) errors.push('id kosong');
  if (!p.casual) errors.push('casual kosong');
  if (!p.polite) errors.push('polite kosong');
  if (!p.meaning_id) errors.push('meaning_id kosong');
  if (!Number.isFinite(Number(p.level))) errors.push('level bukan angka');
  if (p.casual && p.polite && p.casual === p.polite) errors.push('casual == polite');
  return { ok: errors.length === 0, errors };
};

// Validasi seluruh bank: id unik, casual unik, polite unik, tiap pasangan valid.
export const validateRegisterBank = (bank = REGISTER_PAIRS) => {
  const errors = [];
  const ids = bank.map((p) => p?.id);
  if (new Set(ids).size !== ids.length) errors.push('ada id duplikat');
  const casuals = bank.map((p) => p?.casual).filter(Boolean);
  if (new Set(casuals).size !== casuals.length) errors.push('ada casual duplikat (lookup ambigu)');
  const polites = bank.map((p) => p?.polite).filter(Boolean);
  if (new Set(polites).size !== polites.length) errors.push('ada polite duplikat (lookup ambigu)');
  for (const p of bank) {
    const res = validateRegisterPair(p);
    if (!res.ok) errors.push(`${p?.id || '?'}: ${res.errors.join(', ')}`);
  }
  return errors;
};

export default REGISTER_PAIRS;
