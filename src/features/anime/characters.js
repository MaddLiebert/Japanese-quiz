// ─────────────────────────────────────────────────────────────────────────────
// A16 必殺技 (Wiring efek karakter — LAPIS 3) — MURNI: tanpa React, tanpa DOM.
// Karakter (hasil gacha A5) → voice + efek 必殺技 (jurus andalan). Pola
// features/packs/ + features/effects/ (JJK yang sudah ada = contoh sistem ini).
// 多元 = era yang MEMBERI RUMAH untuk lapis karakter.
// Spec: docs/tema/anime-mekanik.md §A16 · PRD docs/tema/anime.md §11.
//
// ⚠️ KEBIJAKAN HAK CIPTA (revisi §6.4 anime.md — keputusan pemilik proyek):
//   • Karakter dunia ORISINAL → WAJIB fiktif. JANGAN nama berhak cipta.
//   • Karakter dunia LISENSI (`fr` menunjuk franchise `licensed`) → BOLEH IP
//     nyata, TAPI kredit ditanggung oleh franchise-nya (lihat franchises.js).
//
// ⚠️ Aset opsional (R9): `voice` = key di registry VOICES (features/audio/voices.js),
//   `effect` = key di registry VISUALS (features/effects/visuals.js). Aset belum
//   ada → validateCharacters() melaporkan key yang belum terdaftar (bukan crash);
//   runtime voice jatuh ke synth (getVoice → taiko), visual tak muncul.

import { FRANCHISES, franchiseById } from './franchises.js';

// ── LAPIS 3a — KARAKTER ORISINAL (5, satu per dunia) ────────────────────────
// ⚠️ SEMUA FIKTIF & ORISINAL. Jangan nama karakter berhak cipta.
export const CHARACTERS = [
  {
    id: 'hoshi_hikari', fr: 'hoshi', name: 'Hikari', kanji: '光',
    voice: 'hoshi_hikari', effect: 'hoshi', hissatsu_jp: '流星斬', hissatsu_id: 'Tebasan Meteor',
  },
  {
    id: 'kage_kuro', fr: 'kage', name: 'Kuro', kanji: '黒',
    voice: 'kage_kuro', effect: 'kage', hissatsu_jp: '影分身', hissatsu_id: 'Klona Bayangan',
  },
  {
    id: 'mahou_mira', fr: 'mahou', name: 'Mira', kanji: '未来',
    voice: 'mahou_mira', effect: 'mahou', hissatsu_jp: '星屑魔法', hissatsu_id: 'Sihir Bintang',
  },
  {
    id: 'kishin_zero', fr: 'kishin', name: 'Zero', kanji: '零',
    voice: 'kishin_zero', effect: 'kishin', hissatsu_jp: '機神砲', hissatsu_id: 'Meriam Dewa Mesin',
  },
  {
    id: 'yokai_kitsune', fr: 'yokai', name: 'Kitsune', kanji: '狐',
    voice: 'yokai_kitsune', effect: 'yokai', hissatsu_jp: '狐火', hissatsu_id: 'Api Rubah',
  },

  // ── LAPIS 3b — KARAKTER LISENSI (JJK) ─────────────────────────────────────
  // Dunia 'jjk' = WADAH 8 karakter (payoff konten yang sudah ada). Tiap karakter
  // memakai voice + effect key yang SUDAH terdaftar (pack_07..pack_14) — nol aset
  // baru. `fr: 'jjk'` → kredit ditanggung franchise (§6.4 revisi).
  {
    id: 'jjk_gojo', fr: 'jjk', name: 'Gojo Satoru', kanji: '五条悟',
    voice: 'gojo', effect: 'gojo', hissatsu_jp: '無量空処', hissatsu_id: 'Domain: Ruang Tanpa Batas',
  },
  {
    id: 'jjk_yuji', fr: 'jjk', name: 'Yuji Itadori', kanji: '虎杖悠仁',
    voice: 'yuji', effect: 'yuji', hissatsu_jp: '黒閃', hissatsu_id: 'Kilatan Hitam',
  },
  {
    id: 'jjk_megumi', fr: 'jjk', name: 'Megumi Fushiguro', kanji: '伏黒恵',
    voice: 'megumi', effect: 'megumi', hissatsu_jp: '十種影法術', hissatsu_id: 'Sepuluh Bayangan',
  },
  {
    id: 'jjk_nobara', fr: 'jjk', name: 'Nobara Kugisaki', kanji: '釘崎野薔薇',
    voice: 'nobara', effect: 'nobara', hissatsu_jp: '芻霊呪法', hissatsu_id: 'Boneka Jerami',
  },
  {
    id: 'jjk_nanami', fr: 'jjk', name: 'Nanami Kento', kanji: '七海建人',
    voice: 'nanami', effect: 'nanami', hissatsu_jp: '十劃呪法', hissatsu_id: 'Teknik Rasio 7:3',
  },
  {
    id: 'jjk_toji', fr: 'jjk', name: 'Toji Fushiguro', kanji: '伏黒甚爾',
    voice: 'toji', effect: 'toji', hissatsu_jp: '天与呪縛', hissatsu_id: 'Kutukan Langit-Tanah',
  },
  {
    id: 'jjk_yuta', fr: 'jjk', name: 'Yuta Okkotsu', kanji: '乙骨憂太',
    voice: 'yuta', effect: 'yuta', hissatsu_jp: '模倣', hissatsu_id: 'Tiruan',
  },
  {
    id: 'jjk_sukuna', fr: 'jjk', name: 'Ryomen Sukuna', kanji: '両面宿儺',
    voice: 'sukuna', effect: 'sukuna', hissatsu_jp: '伏魔御廚子', hissatsu_id: 'Kuil Iblis',
  },
];

// Karakter berdasarkan id; tak dikenal → null (UI tidak pernah crash).
export const characterById = (id) => CHARACTERS.find((c) => c.id === id) || null;

// Karakter milik 1 franchise (untuk gacha pool per dunia). fr null → [].
export const charactersOf = (franchiseId) => CHARACTERS.filter((c) => c.fr === franchiseId);

// Key voice/efek karakter (null kalau tak dikenal). Dipakai UI untuk wiring.
export const characterVoice = (id) => characterById(id)?.voice || null;
export const characterEffect = (id) => characterById(id)?.effect || null;

// Franchise induk + kredit hak cipta karakter (untuk label 推し/名刺).
export const characterFranchise = (id) => franchiseById(characterById(id)?.fr);
export const characterCredit = (id) => characterFranchise(id)?.credit || null;

// Jurus andalan (必殺技) — untuk label reveal.
export const characterHissatsu = (id) => {
  const c = characterById(id);
  return c ? { jp: c.hissatsu_jp, id: c.hissatsu_id } : null;
};

// Validasi: tiap karakter menunjuk voice + effect yang TERDAFTAR (registry).
// voices/visuals = objek registry (mis. VOICES / VISUALS). Kembalikan daftar error.
export const validateCharacters = (voices = {}, visuals = {}) => {
  const errors = [];
  const has = (reg, key) => !!key && Object.prototype.hasOwnProperty.call(reg, key);
  for (const c of CHARACTERS) {
    if (!has(voices, c.voice)) errors.push(`${c.id}: voice '${c.voice}' tak terdaftar`);
    if (!has(visuals, c.effect)) errors.push(`${c.id}: effect '${c.effect}' tak terdaftar`);
  }
  return errors;
};

// Validasi integritas DATA karakter (tanpa registry eksternal):
// id unik, fr menunjuk franchise yang ada, field wajib terisi, tiap franchise
// (yang SUDAH rilis) ≥1 karakter. Dunia `status:'soon'` boleh belum punya tokoh.
export const validateCharacterData = (bank = CHARACTERS, franchises = FRANCHISES) => {
  const errors = [];
  const ids = bank.map((c) => c?.id);
  if (new Set(ids).size !== ids.length) errors.push('ada id karakter duplikat');
  for (const c of bank) {
    const tag = c?.id || '?';
    if (!c?.id) errors.push('karakter tanpa id');
    if (!c?.name) errors.push(`${tag}: name kosong`);
    if (!c?.kanji) errors.push(`${tag}: kanji kosong`);
    if (!c?.voice) errors.push(`${tag}: voice kosong`);
    if (!c?.effect) errors.push(`${tag}: effect kosong`);
    if (!c?.hissatsu_jp) errors.push(`${tag}: hissatsu_jp kosong`);
    if (!c?.hissatsu_id) errors.push(`${tag}: hissatsu_id kosong`);
    if (!franchiseById(c?.fr)) errors.push(`${tag}: fr '${c?.fr}' bukan franchise terdaftar`);
  }
  for (const f of franchises) {
    if (f.status === 'soon') continue; // teaser: tokoh menyusul
    if (!bank.some((c) => c?.fr === f.id)) errors.push(`franchise '${f.id}' belum punya karakter`);
  }
  return errors;
};

export default CHARACTERS;
