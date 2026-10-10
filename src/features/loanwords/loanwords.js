// ─────────────────────────────────────────────────────────────────────────────
// A7 カタカナ loanwords — MURNI: tanpa React, tanpa DOM, tanpa import JSON.
// カタカナ = pintu masuk kata serapan (マジック←magic, ドラゴン←dragon). Mekanik:
// cocokkan katakana → kata asal + arti. Berguna & cepat dikuasai.
// Spec: docs/tema/anime-mekanik.md §A7.
//
// ⚠️ Jebakan belajar (false friend): sebagian kata serapan BERGESER arti
// (マンション = gedung apartemen, BUKAN mansion) → ditandai `false_friend` +
// `trap_id` (catatan pergeseran) dan dijadikan soal lanjutan.
// Tunjukkan bahasa asal (en/de/pt/fr) → pemain sadar katakana bukan cuma Inggris.

// Bahasa asal yang dipakai bank.
export const LOAN_LANGS = ['en', 'de', 'pt', 'fr'];

// Label bahasa asal (untuk UI).
export const LOAN_LANG_LABELS = {
  en: 'Inggris', de: 'Jerman', pt: 'Portugis', fr: 'Prancis',
};

export const LOANWORDS = [
  // ── Serapan biasa (arti sejalan) ───────────────────────────────────────────
  { id: 'majikku',   jp: 'マジック',   origin: 'magic',       origin_lang: 'en', meaning_id: 'sihir / sulap' },
  { id: 'doragon',   jp: 'ドラゴン',   origin: 'dragon',      origin_lang: 'en', meaning_id: 'naga' },
  { id: 'kurisutaru',jp: 'クリスタル', origin: 'crystal',     origin_lang: 'en', meaning_id: 'kristal' },
  { id: 'arubaito',  jp: 'アルバイト', origin: 'Arbeit',      origin_lang: 'de', meaning_id: 'kerja sambilan' },
  { id: 'pasokon',   jp: 'パソコン',   origin: 'personal computer', origin_lang: 'en', meaning_id: 'komputer (PC)' },
  { id: 'konbini',   jp: 'コンビニ',   origin: 'convenience store', origin_lang: 'en', meaning_id: 'minimarket 24 jam' },
  { id: 'gemu',      jp: 'ゲーム',     origin: 'game',        origin_lang: 'en', meaning_id: 'permainan' },
  { id: 'sumaho',    jp: 'スマホ',     origin: 'smartphone',  origin_lang: 'en', meaning_id: 'ponsel pintar' },
  { id: 'pan',       jp: 'パン',       origin: 'pão',         origin_lang: 'pt', meaning_id: 'roti' },
  { id: 'anketo',    jp: 'アンケート', origin: 'enquête',     origin_lang: 'fr', meaning_id: 'kuesioner / survei' },

  // ── False friend (arti bergeser) ───────────────────────────────────────────
  {
    id: 'manshon', jp: 'マンション', origin: 'mansion', origin_lang: 'en',
    meaning_id: 'gedung apartemen (beton, bertingkat)', false_friend: true,
    trap_id: 'Bukan "mansion" mewah — ini apartemen biasa.',
  },
  {
    id: 'baikingu', jp: 'バイキング', origin: 'viking', origin_lang: 'en',
    meaning_id: 'prasmanan (buffet)', false_friend: true,
    trap_id: 'Bukan orang Viking — ini makan prasmanan.',
  },
  {
    id: 'kanningu', jp: 'カンニング', origin: 'cunning', origin_lang: 'en',
    meaning_id: 'mencontek (saat ujian)', false_friend: true,
    trap_id: 'Bukan "licik" — ini mencontek.',
  },
];

// Entri berdasarkan id; tak dikenal → null (UI tidak pernah crash).
export const loanById = (id) => LOANWORDS.find((l) => l.id === id) || null;

// Cek jawaban. guessId boleh id entri ('majikku') ATAU teks jp ('マジック').
export const checkLoan = (item, guessId) => {
  if (!item) return { ok: false, correct: null };
  const ok = guessId === item.id || guessId === item.jp;
  return { ok, correct: item.id || null };
};

// Kata serapan berdasarkan bahasa asal; tak dikenal → [].
export const loansByLang = (lang) => LOANWORDS.filter((l) => l.origin_lang === lang);

// Kata serapan yang artinya bergeser (soal lanjutan).
export const falseFriends = () => LOANWORDS.filter((l) => l.false_friend);

// Validasi 1 entri.
export const validateLoan = (l) => {
  const errors = [];
  if (!l || typeof l !== 'object') return { ok: false, errors: ['entri bukan objek'] };
  if (!l.id) errors.push('id kosong');
  if (!l.jp) errors.push('jp kosong');
  if (!l.origin) errors.push('origin kosong');
  if (!LOAN_LANGS.includes(l.origin_lang)) errors.push(`origin_lang tak dikenal: ${l.origin_lang}`);
  if (!l.meaning_id) errors.push('meaning_id kosong');
  if (l.false_friend && !l.trap_id) errors.push('false_friend wajib punya trap_id');
  return { ok: errors.length === 0, errors };
};

export const validateLoanBank = (bank = LOANWORDS) => {
  const errors = [];
  const ids = bank.map((l) => l?.id);
  if (new Set(ids).size !== ids.length) errors.push('ada id duplikat');
  for (const l of bank) {
    const res = validateLoan(l);
    if (!res.ok) errors.push(`${l?.id || '?'}: ${res.errors.join(', ')}`);
  }
  return errors;
};

export default LOANWORDS;
