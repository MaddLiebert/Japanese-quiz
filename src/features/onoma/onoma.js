// ─────────────────────────────────────────────────────────────────────────────
// A1 オノマトペ (Onomatopoeia) — MURNI: tanpa React, tanpa DOM, tanpa import JSON.
// Bunyi kata = jantung manga. Belajar lewat KONTEKS ADEGAN → pilih bunyi tepat
// (bukan hafalan buta). 3 kategori:
//   gion 擬音 = suara benda (バン) · gita 擬態 = keadaan (キラキラ) · gijō 擬情 = perasaan (ドキドキ)
// Spec: docs/tema/anime-mekanik.md §A1.
//
// OTO = LEKSIKON lengkap (id → jp/reading/category). Sebagian entri juga membawa
// adegan (scene_jp) + arti + pilihan (choices) → itu "soal" (target). `choices`
// menyimpan ID entri LAIN (termasuk distraktor) → diresolusi via onomaById supaya
// UI bisa merender 4 pilihan. ⚠️ Tiap id di `choices` WAJIB ada di OTO — kalau
// tidak, pilihan hilang diam-diam di UI. validateOnoma() menjaga aturan ini.

// 3 kategori (nama di spec = OTOMA_CATEGORIES; OTO_CATEGORIES = nama kanonik).
export const OTO_CATEGORIES = ['gion', 'gita', 'gijō'];
export const OTOMA_CATEGORIES = OTO_CATEGORIES;

export const OTO = [
  // ── Soal (target) — punya adegan + arti + choices ──────────────────────────
  {
    id: 'dokidoki', jp: 'ドキドキ', reading: 'どきどき', category: 'gijō',
    scene_jp: '告白の直前、心臓が…', meaning_id: 'jantung berdebar kencang', meaning_en: 'heart pounding',
    choices: ['dokidoki', 'wakuwaku', 'kirakira', 'gogogo'],
  },
  {
    id: 'kirakira', jp: 'キラキラ', reading: 'きらきら', category: 'gita',
    scene_jp: 'ヒロインが振り向く。光が…', meaning_id: 'berkilau', meaning_en: 'sparkling',
    choices: ['kirakira', 'dokidoki', 'batabata', 'shizuku'],
  },
  {
    id: 'ban', jp: 'バン！', reading: 'ばん', category: 'gion',
    scene_jp: '扉を思いきり開ける。', meaning_id: 'BANG! (bantingan)', meaning_en: 'BANG!',
    choices: ['ban', 'fuwafuwa', 'zaazaa', 'kosokoso'],
  },
  {
    id: 'gogogo', jp: 'ゴゴゴ', reading: 'ごごご', category: 'gita',
    scene_jp: '強敵が近づく。地響きが…', meaning_id: 'gemuruh mengancam', meaning_en: 'ominous rumble',
    choices: ['gogogo', 'pyonpyon', 'wanwan', 'chirin'],
  },

  // ── Distraktor (leksikon) — muncul sebagai pilihan, bukan soal ─────────────
  {
    id: 'wakuwaku', jp: 'ワクワク', reading: 'わくわく', category: 'gijō',
    meaning_id: 'bersemangat menanti', meaning_en: 'excited, thrilled',
  },
  {
    id: 'batabata', jp: 'バタバタ', reading: 'ばたばた', category: 'gion',
    meaning_id: 'berkepak / bergegas', meaning_en: 'flapping, bustling',
  },
  {
    id: 'shizuku', jp: 'しずく', reading: 'しずく', category: 'gion',
    meaning_id: 'tetesan air', meaning_en: 'drip, droplet',
  },
  {
    id: 'fuwafuwa', jp: 'フワフワ', reading: 'ふわふわ', category: 'gita',
    meaning_id: 'lembut mengembang', meaning_en: 'fluffy, light',
  },
  {
    id: 'zaazaa', jp: 'ザーザー', reading: 'ざーざー', category: 'gion',
    meaning_id: 'hujan deras / desis', meaning_en: 'heavy rain, static',
  },
  {
    id: 'kosokoso', jp: 'コソコソ', reading: 'こそこそ', category: 'gita',
    meaning_id: 'berbisik / mengendap', meaning_en: 'whispering, sneaking',
  },
  {
    id: 'pyonpyon', jp: 'ピョンピョン', reading: 'ぴょんぴょん', category: 'gion',
    meaning_id: 'melompat-lompat', meaning_en: 'hopping',
  },
  {
    id: 'wanwan', jp: 'ワンワン', reading: 'わんわん', category: 'gion',
    meaning_id: 'guk-guk (anjing)', meaning_en: 'woof woof',
  },
  {
    id: 'chirin', jp: 'チリン', reading: 'ちりん', category: 'gion',
    meaning_id: 'kelinting (bel kecil)', meaning_en: 'ding (small bell)',
  },
];

// Entri berdasarkan id; tak dikenal → null (UI tidak pernah crash).
export const onomaById = (id) => OTO.find((o) => o.id === id) || null;

// Semua entri 1 kategori; kategori tak dikenal → [] (aman).
export const onomaPool = (category) => OTO.filter((o) => o.category === category);

// Kategori valid?
export const isOnomaCategory = (category) => OTO_CATEGORIES.includes(category);

// Soal = entri yang punya adegan + choices (target kuis).
export const onomaQuestions = () =>
  OTO.filter((o) => !!o.scene_jp && Array.isArray(o.choices) && o.choices.length > 0);

// Resolusi `choices` (id) → entri OTO (buang id tak dikenal). Untuk UI merender pilihan.
export const onomaChoices = (item) =>
  (item?.choices || []).map(onomaById).filter(Boolean);

// Jawaban pemain: `choice` boleh berupa id entri ('dokidoki') ATAU teks jp ('ドキドキ').
// ok = pilihan cocok dengan soal. correct = teks jp jawaban (untuk reveal),
// correctId = id jawaban (untuk highlight/log).
export const checkOnoma = (item, choice) => {
  if (!item) return { ok: false, correct: null, correctId: null };
  const ok = choice === item.jp || choice === item.id;
  return { ok, correct: item.jp || null, correctId: item.id || null };
};

// Validasi 1 entri (dipakai test & editor konten). Soal valid kalau:
// id/jp/reading ada, kategori dikenal, dan (bila soal) choices ≥2, memuat
// id sendiri, semua id-nya terdaftar di OTO, tanpa duplikat.
export const validateOnoma = (item) => {
  const errors = [];
  if (!item || typeof item !== 'object') return { ok: false, errors: ['entri bukan objek'] };
  if (!item.id) errors.push('id kosong');
  if (!item.jp) errors.push('jp kosong');
  if (!item.reading) errors.push('reading kosong');
  if (!isOnomaCategory(item.category)) errors.push(`kategori tak dikenal: ${item.category}`);

  if (item.choices !== undefined) {
    if (!Array.isArray(item.choices) || item.choices.length < 2) {
      errors.push('choices < 2');
    } else {
      if (new Set(item.choices).size !== item.choices.length) errors.push('choices duplikat');
      if (item.id && !item.choices.includes(item.id)) errors.push('choices tidak memuat id jawaban');
      for (const cid of item.choices) {
        if (!onomaById(cid)) errors.push(`choices id tak terdaftar: ${cid}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
};

// Validasi seluruh bank (dipakai test). Mengembalikan daftar error gabungan.
export const validateOnomaBank = (bank = OTO) => {
  const errors = [];
  const ids = bank.map((o) => o?.id);
  if (new Set(ids).size !== ids.length) errors.push('ada id entri duplikat');
  for (const item of bank) {
    const res = validateOnoma(item);
    if (!res.ok) errors.push(`${item?.id || '?'}: ${res.errors.join(', ')}`);
  }
  return errors;
};

export default OTO;
