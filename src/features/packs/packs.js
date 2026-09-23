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
    name: 'Hina Chono',
    kanji: '蝶野雛',
    icon: '🈳',
    desc: 'Suara & reaksi Hina: GIF ceria tiap jawaban',
    desc_en: 'Hina voice & reactions: cheerful GIF every answer',
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
    id: 'pack_06', name: 'Sumi Taiko', kanji: '墨太鼓', icon: '🪘',
    desc: 'Tinta sumi: cap hanko & ensō, dentum taiko',
    desc_en: 'Sumi ink: hanko seal & ensō, taiko drum',
    price: 2500, rarity: 'legendary', visual: 'ink', voice: 'taiko',
  },
];

export const getPack = (id) => PACKS.find((p) => p.id === id) || null;

// Pack "siap pakai" = punya visual & voice (termasuk placeholder 'dummy').
export const isPackReady = (pack) => Boolean(pack && pack.visual && pack.voice);

// Undian gacha berbobot rarity. `rng` bisa di-inject untuk testing.
// poolIds  — batasi undian ke daftar id pack tertentu (untuk BANNER EVENT).
//            null = semua pack (perilaku lama, backward-compatible).
// weights  — override bobot per rarity, mis. { special: 2, legendary: 8 }.
//            null = pakai bobot global PACK_RARITY.
export const rollPackId = (rng = Math.random, poolIds = null, weights = null) => {
  const pool = PACKS.filter(
    (p) => isPackReady(p) && (!poolIds || poolIds.includes(p.id))
  );
  if (pool.length === 0) return null;
  const weightOf = (p) => weights?.[p.rarity] ?? PACK_RARITY[p.rarity]?.weight ?? 1;
  const total = pool.reduce((sum, p) => sum + weightOf(p), 0);
  if (total <= 0) return pool[0].id;
  let ticket = rng() * total;
  for (const pack of pool) {
    ticket -= weightOf(pack);
    if (ticket <= 0) return pack.id;
  }
  return pool[pool.length - 1].id;
};
