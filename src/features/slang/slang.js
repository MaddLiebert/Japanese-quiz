// ─────────────────────────────────────────────────────────────────────────────
// A6 若者言葉 (Slang muda) — MURNI: tanpa React, tanpa DOM, tanpa import JSON.
// Slang yang benar-benar dipakai anak muda Jepang (やばい, エモい, きゅん, ガチ).
// Mekanik: cocokkan slang → arti + nuansa. Register paling "hidup" & paling
// sering muncul di anime/media sosial.
// Spec: docs/tema/anime-mekanik.md §A6.
//
// ⚠️ Kesopanan: tiap entri menandai apakah HANYA untuk antar-teman (`friend_only`)
// + `caution_id` (peringatan konteks) — supaya pemain tidak memakai slang ke atasan.
// (Slang per definisi bukan bahasa sopan; bank menjaga `friend_only` benar.)

// Kelas nuansa (dipakai UI untuk memberi rasa kata).
export const SLANG_NUANCES = ['serba bisa', 'perasaan', 'gema', 'tegas', 'net'];

// やばい punya makna tergantung konteks — ini poin ajarnya.
export const SLANG = [
  {
    id: 'yabai', jp: 'やばい', reading: 'やばい',
    meaning_id: 'gila / keren / bahaya (tergantung konteks)', meaning_en: 'insane / cool / risky',
    nuance_id: 'serba bisa', level: 1, friend_only: true,
    caution_id: 'Antar-teman saja. Tidak dipakai ke atasan.',
  },
  {
    id: 'emoi', jp: 'エモい', reading: 'えもい',
    meaning_id: 'menyentuh / bikin haru', meaning_en: 'emotional / vibey',
    nuance_id: 'perasaan', level: 1, friend_only: true,
    caution_id: 'Antar-teman saja.',
  },
  {
    id: 'kyun', jp: 'きゅん', reading: 'きゅん',
    meaning_id: 'berdebar (karena gemas/cinta)', meaning_en: 'heart flutter',
    nuance_id: 'gema', level: 2, friend_only: true,
    caution_id: 'Antar-teman saja.',
  },
  {
    id: 'gachi', jp: 'ガチ', reading: 'がち',
    meaning_id: 'sungguhan / serius', meaning_en: 'for real / serious',
    nuance_id: 'tegas', level: 2, friend_only: true,
    caution_id: 'Antar-teman saja.',
  },
  {
    id: 'suko', jp: 'すこ', reading: 'すこ',
    meaning_id: 'suka (versi net)', meaning_en: 'like (net slang)',
    nuance_id: 'net', level: 3, friend_only: true,
    caution_id: 'Hanya di internet/antar-teman.',
  },
  {
    id: 'kusa', jp: '草', reading: 'くさ',
    meaning_id: 'wkwk (dari 笑う → www → 草)', meaning_en: 'lol (lit. grass)',
    nuance_id: 'net', level: 3, friend_only: true,
    caution_id: 'Hanya di internet/antar-teman.',
  },
];

// Entri berdasarkan id; tak dikenal → null (UI tidak pernah crash).
export const slangById = (id) => SLANG.find((s) => s.id === id) || null;

// Cek jawaban. guessId boleh berupa id entri ('yabai') ATAU teks jp ('やばい').
export const checkSlang = (item, guessId) => {
  if (!item) return { ok: false, correct: null };
  const ok = guessId === item.id || guessId === item.jp;
  return { ok, correct: item.id || null };
};

// Semua slang yang levelnya ≤ level (level tak dikenal → semua).
export const slangByLevel = (level) => {
  const lv = Number(level);
  if (!Number.isFinite(lv)) return [...SLANG];
  return SLANG.filter((s) => s.level <= lv);
};

// Slang yang aman hanya antar-teman (untuk peringatan konteks di UI).
export const friendOnlySlang = () => SLANG.filter((s) => s.friend_only);

// Validasi 1 entri.
export const validateSlang = (s) => {
  const errors = [];
  if (!s || typeof s !== 'object') return { ok: false, errors: ['entri bukan objek'] };
  if (!s.id) errors.push('id kosong');
  if (!s.jp) errors.push('jp kosong');
  if (!s.reading) errors.push('reading kosong');
  if (!s.meaning_id) errors.push('meaning_id kosong');
  if (!SLANG_NUANCES.includes(s.nuance_id)) errors.push(`nuance tak dikenal: ${s.nuance_id}`);
  if (!Number.isFinite(Number(s.level))) errors.push('level bukan angka');
  if (s.friend_only && !s.caution_id) errors.push('friend_only wajib punya caution_id');
  return { ok: errors.length === 0, errors };
};

export const validateSlangBank = (bank = SLANG) => {
  const errors = [];
  const ids = bank.map((s) => s?.id);
  if (new Set(ids).size !== ids.length) errors.push('ada id duplikat');
  for (const s of bank) {
    const res = validateSlang(s);
    if (!res.ok) errors.push(`${s?.id || '?'}: ${res.errors.join(', ')}`);
  }
  return errors;
};

export default SLANG;
