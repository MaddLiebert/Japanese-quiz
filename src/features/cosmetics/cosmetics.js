// ─────────────────────────────────────────────────────────────────────────────
// cosmetics.js — katalog KOSMETIK era 電脳 (isi gacha ハック).
//
// Keputusan pemilik (2026-10-14): isi pool ハック = **Skin HUD / Frame ID**
// (tampilan, TANPA efek suara). Sejalan PRD docs/tema/cyberpunk.md §16.
//
// Konsep: 電脳 = era terakhir; saat pemain sampai sini semua Theme Pack sudah
// dimiliki, jadi gacha ハック memberi BARANG TAMPILAN khas 電脳, bukan merch
// arcade 多元. Dua jenis:
//   • frame (Frame ID 電脳ID) — bingkai avatar di Profil.
//   • hud   (Skin HUD)        — aksen panel/ID di Profil.
//
// Terikat era: hanya boleh didapat & dipakai di era 電脳 (pola sama dengan
// pack ber-`era`). Gerbang dihitung HIDUP dari `era` → tanpa state baru.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────
import { PACK_RARITY } from '../packs/packs.js';

export const COSMETIC_ERA = 'cyberpunk';

export const COSMETIC_KIND = { FRAME: 'frame', HUD: 'hud' };

// Label jenis untuk UI.
export const COSMETIC_KIND_LABEL = {
  frame: { id: 'Frame ID 電脳ID', en: 'ID Frame' },
  hud:   { id: 'Skin HUD',        en: 'HUD Skin' },
};

// Palet neon 電脳 (akrit: --ai cyan, --shu merah, magenta 常夜).
const NEON = {
  cyan:    { accent: '#00e5ff', accent2: '#7c4dff', deep: '#08202b' },
  magenta: { accent: '#ff2e88', accent2: '#7c4dff', deep: '#2b0820' },
  rain:    { accent: '#5bc8ff', accent2: '#3a6ea5', deep: '#0b1626' },
  amber:   { accent: '#ffb020', accent2: '#ff2e88', deep: '#2b1c08' },
  tokoyo:  { accent: '#c9a4ff', accent2: '#00e5ff', deep: '#1a0f2b' },
};

// Katalog. Semua `era: 'cyberpunk'`. `icon` = nama Glyph yang ada di app.
export const COSMETICS = [
  // ── Frame ID 電脳ID ───────────────────────────────────────────────────────
  {
    id: 'frame_neon', kind: 'frame', era: COSMETIC_ERA,
    name: 'Neon Frame', kanji: 'ネオン枠', icon: 'idcard', rarity: 'common',
    desc: 'Bingkai ID neon sian', desc_en: 'Cyan neon ID frame', palette: NEON.cyan,
  },
  {
    id: 'frame_rain', kind: 'frame', era: COSMETIC_ERA,
    name: 'Rain Frame', kanji: '雨枠', icon: 'droplet', rarity: 'rare',
    desc: 'Bingkai ID hujan neon', desc_en: 'Neon rain ID frame', palette: NEON.rain,
  },
  {
    id: 'frame_owari', kind: 'frame', era: COSMETIC_ERA,
    name: 'Owari Frame', kanji: '終枠', icon: 'crown', rarity: 'legendary',
    desc: 'Bingkai ID 終 — akhir perjalanan', desc_en: 'Owari ID frame — journey end', palette: NEON.tokoyo,
  },
  // ── Skin HUD ─────────────────────────────────────────────────────────────
  {
    id: 'hud_scan', kind: 'hud', era: COSMETIC_ERA,
    name: 'Scanline HUD', kanji: '走査線', icon: 'chart', rarity: 'common',
    desc: 'HUD garis pindai', desc_en: 'Scanline HUD', palette: NEON.cyan,
  },
  {
    id: 'hud_holo', kind: 'hud', era: COSMETIC_ERA,
    name: 'Hologram HUD', kanji: 'ホログラム', icon: 'eye', rarity: 'rare',
    desc: 'HUD holografik magenta', desc_en: 'Magenta hologram HUD', palette: NEON.magenta,
  },
  {
    id: 'hud_tokoyo', kind: 'hud', era: COSMETIC_ERA,
    name: 'Tokoyo HUD', kanji: '常夜', icon: 'sparkles', rarity: 'legendary',
    desc: 'HUD 常夜 — malam abadi', desc_en: 'Tokoyo HUD — eternal night', palette: NEON.tokoyo,
  },
];

export const getCosmetic = (id) => COSMETICS.find((c) => c.id === id) || null;

// Boleh didapat/dipakai di era ini? Semua kosmetik terikat era 電脳.
export const cosmeticAllowedInEra = (c, era) => !c?.era || c.era === era;

// Kosmetik yang tersedia di era ini (era non-電脳 → kosong).
export const cosmeticsForEra = (era = null) =>
  (!era ? COSMETICS : COSMETICS.filter((c) => cosmeticAllowedInEra(c, era)));

export const cosmeticIdsForEra = (era = null) => cosmeticsForEra(era).map((c) => c.id);

// Undian kosmetik berbobot rarity (pola sama dengan rollPackId). MURNI.
export const rollCosmeticId = (rng = Math.random, poolIds = null) => {
  const pool = COSMETICS.filter((c) => !poolIds || poolIds.includes(c.id));
  if (pool.length === 0) return null;
  const weightOf = (c) => PACK_RARITY[c.rarity]?.weight ?? 1;
  const total = pool.reduce((sum, c) => sum + weightOf(c), 0);
  if (total <= 0) return pool[0].id;
  let ticket = rng() * total;
  for (const c of pool) {
    ticket -= weightOf(c);
    if (ticket <= 0) return c.id;
  }
  return pool[pool.length - 1].id;
};

// Info isi gacha kosmetik untuk Shop: field kompatibel dengan pool pack
// (id/name/kanji/icon/rarity/desc/chance/owned/era) + `palette` + `kind`.
export const cosmeticPoolInfo = (ownedIds = []) => {
  const pool = COSMETICS;
  if (pool.length === 0) return [];
  const owned = Array.isArray(ownedIds) ? ownedIds : [];
  const total = pool.reduce((sum, c) => sum + (PACK_RARITY[c.rarity]?.weight ?? 1), 0);
  if (total <= 0) return [];
  const raw = pool.map((c) => (PACK_RARITY[c.rarity]?.weight ?? 1) / total * 100);
  const rounded = raw.map((v) => Math.round(v * 10) / 10);
  const drift = Math.round((100 - rounded.reduce((s, v) => s + v, 0)) * 10) / 10;
  if (drift !== 0) {
    let idx = 0;
    for (let i = 1; i < rounded.length; i++) if (rounded[i] > rounded[idx]) idx = i;
    rounded[idx] = Math.round((rounded[idx] + drift) * 10) / 10;
  }
  return pool.map((c, i) => ({
    id: c.id,
    name: c.name,
    kanji: c.kanji,
    icon: c.icon,
    rarity: c.rarity,
    kind: c.kind,
    era: c.era,
    palette: c.palette,
    desc: c.desc,
    desc_en: c.desc_en,
    chance: rounded[i],
    winnable: true,
    owned: owned.includes(c.id),
  }));
};
