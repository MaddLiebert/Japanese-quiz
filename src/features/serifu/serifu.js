// ─────────────────────────────────────────────────────────────────────────────
// A3 セリフ組み (Susun dialog) — MURNI: tanpa React, tanpa DOM, tanpa import JSON.
// Pola 活字組み Meiji (features/typesetting) TAPI dalam balon manga (セリフ):
// pemain menyusun potongan dialog jadi kalimat benar, dari beberapa balon yang
// saling menyambung. Melatih urutan kata (SOV) + partikel dalam konteks percakapan.
// Spec: docs/tema/anime-mekanik.md §A3.
//
// DRY: inti susun (buildPool/checkOrder/misprintAmount) DIPAKAI ULANG dari
// ../typesetting/typesetting.js — bentuk balon = { parts, distractors } sama persis
// dengan soal 活字. Lapisan 多元 hanya menambah: siapa bicara (`who`) + balon
// "kacau" (skew) via bubbleAmount.
import {
  buildPool as tsBuildPool,
  correctOrder as tsCorrectOrder,
  checkOrder as tsCheckOrder,
  misprintAmount as tsMisprintAmount,
  isComplete as tsIsComplete,
} from '../typesetting/typesetting.js';

// Warna blok per kelas kata (dipetakan ke token tema di UI). 多元 pakai palet pop.
export const POS_COLORS = {
  greeting: 'sora',
  noun: 'matcha',
  particle: 'sakura',
  verb: 'daidai',
  adj: 'kin',
  aux: 'nezumi',
  punct: 'sumi',
};

// Label kelas kata (dwibahasa) untuk tooltip/legenda.
export const POS_LABELS = {
  greeting: { id: 'Sapaan', en: 'Greeting' },
  noun: { id: 'Nomina', en: 'Noun' },
  particle: { id: 'Partikel', en: 'Particle' },
  verb: { id: 'Verba', en: 'Verb' },
  adj: { id: 'Adjektiva', en: 'Adjective' },
  aux: { id: 'Auxiliaris', en: 'Auxiliary' },
  punct: { id: 'Tanda baca', en: 'Punctuation' },
};

export const SERIFU_POS = Object.keys(POS_COLORS);

// Warna token untuk 1 kelas kata; tak dikenal → sumi (netral, tidak crash).
export const posColor = (pos) => POS_COLORS[pos] || 'sumi';

// Partikel & tanda baca ditampilkan sebagai blok KECIL (mengajarkan struktur SOV).
export const isSmallBlock = (pos) => pos === 'particle' || pos === 'punct';

// ── Bank adegan (dialog) ─────────────────────────────────────────────────────
// ⚠️ Aset ORISINAL (aturan §6.4 anime.md) — percakapan sehari-hari, bukan IP nyata.
// id part WAJIB unik dalam SATU adegan (p1..pN) supaya pool/placed tidak tabrakan.
export const SERIFU = [
  {
    id: 's-001',
    scene_jp: '教室、朝。',
    bubbles: [
      {
        who: 'saku',
        parts: [
          { id: 'p1', jp: 'おはよう', pos: 'greeting', reading: 'おはよう' },
          { id: 'p2', jp: '！', pos: 'punct', reading: '' },
        ],
        distractors: [
          { id: 'd1', jp: 'こんばんは', pos: 'greeting', reading: 'こんばんは' },
        ],
      },
      {
        who: 'nacht',
        parts: [
          { id: 'p3', jp: 'おはよう', pos: 'greeting', reading: 'おはよう' },
          { id: 'p4', jp: 'ございます', pos: 'aux', reading: 'ございます' },
        ],
        distractors: [
          { id: 'd2', jp: 'です', pos: 'aux', reading: 'です' },
        ],
      },
    ],
    translation: 'Selamat pagi! / Selamat pagi (hormat).',
  },
  {
    id: 's-002',
    scene_jp: '放課後、友達に／先生に。',
    bubbles: [
      {
        who: 'saku',
        parts: [
          { id: 'p1', jp: 'どこ', pos: 'noun', reading: 'どこ' },
          { id: 'p2', jp: 'に', pos: 'particle', reading: 'に' },
          { id: 'p3', jp: '行く', pos: 'verb', reading: 'いく' },
          { id: 'p4', jp: '？', pos: 'punct', reading: '' },
        ],
        distractors: [
          { id: 'd1', jp: 'が', pos: 'particle', reading: 'が' },
          { id: 'd2', jp: '行った', pos: 'verb', reading: 'いった' },
        ],
      },
      {
        who: 'nacht',
        parts: [
          { id: 'p5', jp: 'どこ', pos: 'noun', reading: 'どこ' },
          { id: 'p6', jp: 'に', pos: 'particle', reading: 'に' },
          { id: 'p7', jp: '行きます', pos: 'verb', reading: 'いきます' },
          { id: 'p8', jp: 'か', pos: 'particle', reading: 'か' },
          { id: 'p9', jp: '？', pos: 'punct', reading: '' },
        ],
        distractors: [],
      },
    ],
    translation: 'Mau ke mana? / Anda mau ke mana?',
  },
  {
    id: 's-003',
    scene_jp: '部活、試合の前。',
    bubbles: [
      {
        who: 'saku',
        parts: [
          { id: 'p1', jp: 'がんばれ', pos: 'verb', reading: 'がんばれ' },
          { id: 'p2', jp: '！', pos: 'punct', reading: '' },
        ],
        distractors: [
          { id: 'd1', jp: 'がんばります', pos: 'verb', reading: 'がんばります' },
        ],
      },
      {
        who: 'nacht',
        parts: [
          { id: 'p3', jp: 'がんばって', pos: 'verb', reading: 'がんばって' },
          { id: 'p4', jp: 'ください', pos: 'aux', reading: 'ください' },
        ],
        distractors: [],
      },
    ],
    translation: 'Semangat! / Tolong semangat.',
  },
];

// Adegan berdasarkan id; tak dikenal → null (UI tidak pernah crash).
export const serifuById = (id) => SERIFU.find((s) => s.id === id) || null;

// Daftar balon 1 adegan; adegan null → [] (aman).
export const bubblesOf = (scene) => (Array.isArray(scene?.bubbles) ? scene.bubbles : []);

// ── Inti susun (delegasi ke typesetting Meiji) ───────────────────────────────
// Acak blok BENAR + distraktor jadi satu kolam; deterministik via seed.
export const buildPool = (bubble, seed = 1) => tsBuildPool(bubble, seed);

// Kunci susunan benar (id blok BENAR, urut).
export const correctOrder = (bubble) => tsCorrectOrder(bubble);

// Cek susunan. wrongAt = indeks pertama yang salah (−1 kalau ok).
// (misprintAt disertakan sebagai alias agar konsisten dengan modul Meiji.)
export const checkOrder = (bubble, placedIds = []) => {
  const { ok, misprintAt } = tsCheckOrder(bubble, placedIds);
  return { ok, wrongAt: misprintAt, misprintAt };
};

// Intensitas balon "kacau" 0..1 = proporsi posisi salah (+ blok berlebih).
// 0 = balon rapi. Dipakai UI → CSS skew/robek pada balon.
export const bubbleAmount = (bubble, placedIds = []) => tsMisprintAmount(bubble, placedIds);

// Susunan "penuh" (jumlah blok == jumlah blok benar) — siap dicek.
export const isComplete = (bubble, placedIds = []) => tsIsComplete(bubble, placedIds);

// ── Validasi ─────────────────────────────────────────────────────────────────
// 1 balon valid: who ada, parts ≥1, id unik (parts+distractors), tiap blok punya jp & pos.
export const validateBubble = (bubble) => {
  const errors = [];
  if (!bubble || typeof bubble !== 'object') return { ok: false, errors: ['balon bukan objek'] };
  if (!bubble.who) errors.push('who kosong');
  if (!Array.isArray(bubble.parts) || bubble.parts.length < 1) errors.push('parts < 1');
  const ids = [...(bubble.parts || []), ...(bubble.distractors || [])].map((b) => b?.id);
  if (ids.some((x) => !x)) errors.push('ada blok tanpa id');
  if (new Set(ids).size !== ids.length) errors.push('id blok duplikat dalam balon');
  for (const b of [...(bubble.parts || []), ...(bubble.distractors || [])]) {
    if (!b?.jp) errors.push(`blok ${b?.id || '?'} tanpa jp`);
    if (!b?.pos) errors.push(`blok ${b?.id || '?'} tanpa pos`);
    else if (!SERIFU_POS.includes(b.pos)) errors.push(`blok ${b?.id || '?'} pos tak dikenal: ${b.pos}`);
  }
  return { ok: errors.length === 0, errors };
};

// 1 adegan valid: id/scene_jp/translation ada, ≥1 balon, id blok unik LINTAS balon.
export const validateSerifu = (scene) => {
  const errors = [];
  if (!scene || typeof scene !== 'object') return { ok: false, errors: ['adegan bukan objek'] };
  if (!scene.id) errors.push('id kosong');
  if (!scene.scene_jp) errors.push('scene_jp kosong');
  if (!scene.translation) errors.push('translation kosong');
  if (!Array.isArray(scene.bubbles) || scene.bubbles.length < 1) errors.push('bubbles < 1');
  const allIds = [];
  for (const b of scene.bubbles || []) {
    const res = validateBubble(b);
    if (!res.ok) errors.push(`balon ${b?.who || '?'}: ${res.errors.join(', ')}`);
    for (const blk of [...(b?.parts || []), ...(b?.distractors || [])]) allIds.push(blk?.id);
  }
  const known = allIds.filter(Boolean);
  if (new Set(known).size !== known.length) errors.push('id blok duplikat lintas balon');
  return { ok: errors.length === 0, errors };
};

// Validasi seluruh bank: id adegan unik + tiap adegan valid.
export const validateSerifuBank = (bank = SERIFU) => {
  const errors = [];
  const ids = bank.map((s) => s?.id);
  if (new Set(ids).size !== ids.length) errors.push('ada id adegan duplikat');
  for (const scene of bank) {
    const res = validateSerifu(scene);
    if (!res.ok) errors.push(`${scene?.id || '?'}: ${res.errors.join(', ')}`);
  }
  return errors;
};

export default SERIFU;
