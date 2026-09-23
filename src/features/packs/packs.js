// ─────────────────────────────────────────────────────────────────────────────
// Theme Pack — satu pack = VISUAL + VOICE nyatu, di-equip sekali.
// Menambah pack baru: tambah 1 entry di PACKS, lalu daftarkan visual/voice-nya.
// ─────────────────────────────────────────────────────────────────────────────

export const PACK_RARITY = {
  common:    { label: 'COMMON',    weight: 50 },
  rare:      { label: 'RARE',      weight: 30 },
  legendary: { label: 'LEGENDARY', weight: 20 },
};

export const PACKS = [
  {
    id: 'kotodama_burst',
    name: 'Kotodama Burst',
    kanji: '言霊',
    icon: '🈳',
    desc: 'Tinta washi: cap hanko, sapuan kuas & ensō',
    desc_en: 'Washi ink: hanko seal, brush stroke & ensō',
    price: 2500,
    rarity: 'legendary',
    visual: 'hina',     // → src/features/effects/visuals.js
    voice: 'hina',      // → src/features/audio/voices.js
  },
  {
    id: 'pack_02', name: 'Dummy A', kanji: '仮', icon: '🎭',
    desc: 'Interaksi Dummy', desc_en: 'Dummy interaction',
    price: 2500, rarity: 'common', visual: 'dummy', voice: 'dummy',
  },
  {
    id: 'pack_03', name: 'Dummy B', kanji: '仮', icon: '🎭',
    desc: 'Interaksi Dummy', desc_en: 'Dummy interaction',
    price: 2500, rarity: 'common', visual: 'dummy', voice: 'dummy',
  },
  {
    id: 'pack_04', name: 'Dummy C', kanji: '仮', icon: '🎭',
    desc: 'Interaksi Dummy', desc_en: 'Dummy interaction',
    price: 2500, rarity: 'rare', visual: 'dummy', voice: 'dummy',
  },
  {
    id: 'pack_05', name: 'Dummy D', kanji: '仮', icon: '🎭',
    desc: 'Interaksi Dummy', desc_en: 'Dummy interaction',
    price: 2500, rarity: 'rare', visual: 'dummy', voice: 'dummy',
  },
  {
    id: 'pack_06', name: 'Dummy E', kanji: '仮', icon: '🎭',
    desc: 'Interaksi Dummy', desc_en: 'Dummy interaction',
    price: 2500, rarity: 'legendary', visual: 'dummy', voice: 'dummy',
  },
];

export const getPack = (id) => PACKS.find((p) => p.id === id) || null;

// Pack "siap pakai" = punya visual & voice (termasuk placeholder 'dummy').
export const isPackReady = (pack) => Boolean(pack && pack.visual && pack.voice);

// Undian gacha berbobot rarity. `rng` bisa di-inject untuk testing.
export const rollPackId = (rng = Math.random) => {
  const pool = PACKS.filter(isPackReady);
  if (pool.length === 0) return null;
  const total = pool.reduce((sum, p) => sum + (PACK_RARITY[p.rarity]?.weight ?? 1), 0);
  let ticket = rng() * total;
  for (const pack of pool) {
    ticket -= PACK_RARITY[pack.rarity]?.weight ?? 1;
    if (ticket <= 0) return pack.id;
  }
  return pool[pool.length - 1].id;
};
