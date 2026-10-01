// ─────────────────────────────────────────────────────────────────────────────
// Theme Pack — satu pack = VISUAL + VOICE nyatu, di-equip sekali.
// Menambah pack baru: tambah 1 entry di PACKS, lalu daftarkan visual/voice-nya.
// ─────────────────────────────────────────────────────────────────────────────

export const PACK_RARITY = {
  common:    { label: 'COMMON',    weight: 25 },
  rare:      { label: 'RARE',      weight: 15 },
  legendary: { label: 'LEGENDARY', weight: 9  },
  special:   { label: 'SPECIAL',   weight: 2  },
};

export const PACKS = [
  {
    id: 'kotodama_burst',
    name: 'Hina Chono',
    kanji: '蝶野雛',
    icon: 'flower',
    desc: 'Suara & reaksi Hina: GIF ceria tiap jawaban',
    desc_en: 'Hina voice & reactions: cheerful GIF every answer',
    price: 2500,
    rarity: 'legendary',
    visual: 'hina',     // → src/features/effects/visuals.js
    voice: 'hina',      // → src/features/audio/voices.js
  },
  {
    id: 'pack_02', name: 'Dummy A', kanji: '仮', icon: 'mask',
    desc: 'Interaksi Dummy', desc_en: 'Dummy interaction',
    price: 2500, rarity: 'common', visual: 'dummy', voice: 'dummy',
  },
  {
    id: 'pack_03', name: 'Dummy B', kanji: '仮', icon: 'mask',
    desc: 'Interaksi Dummy', desc_en: 'Dummy interaction',
    price: 2500, rarity: 'common', visual: 'dummy', voice: 'dummy',
  },
  {
    id: 'pack_04', name: 'Dummy C', kanji: '仮', icon: 'mask',
    desc: 'Interaksi Dummy', desc_en: 'Dummy interaction',
    price: 2500, rarity: 'rare', visual: 'dummy', voice: 'dummy',
  },
  {
    id: 'pack_05', name: 'Dummy D', kanji: '仮', icon: 'mask',
    desc: 'Interaksi Dummy', desc_en: 'Dummy interaction',
    price: 2500, rarity: 'rare', visual: 'dummy', voice: 'dummy',
  },
  {
    id: 'pack_06', name: 'Sumi Taiko', kanji: '墨太鼓', icon: 'drum',
    desc: 'Tinta sumi: cap hanko & ensō, dentum taiko',
    desc_en: 'Sumi ink: hanko seal & ensō, taiko drum',
    price: 2500, rarity: 'legendary', visual: 'ink', voice: 'taiko',
  },
  {
    // Pack #7 — Gojo Satoru (SPECIAL 特別). Efek berlapis 蒼→赫→茈→無量空処
    // + aset suara user (public/voices/gojo/) + ambience BGM — sudah live.
    id: 'pack_07', name: 'Gojo Satoru', kanji: '五条悟', icon: 'infinity',
    desc: 'Domain & Infinity: 蒼→赫→茈→無量空処',
    desc_en: 'Domain & Infinity: Ao→Aka→Murasaki→Domain',
    price: 2500, rarity: 'special', visual: 'gojo', voice: 'gojo',
  },

  // ── Seri Jujutsu Kaisen (pack_08..pack_14) ──────────────────────────────────
  // Fase 1 "dummy": visual masih placeholder 'dummy', voice menunjuk ke
  // VOICES.<key> yang masih kosong (jatuh ke synth gong/thud). Klip mp3 diisi
  // bertahap (task VP). Rarity: common Nobara · rare Yuji/Megumi/Nanami ·
  // legendary Yuta/Toji · special Sukuna.
  {
    id: 'pack_08', name: 'Nobara Kugisaki', kanji: '釘崎野薔薇', icon: 'hammer',
    desc: '芻霊呪法: 簪→簪・連→簪・時限→共鳴り→黒閃 + ultimate 全弾爆発',
    desc_en: 'Straw Doll Technique: Hairpin→Barrage→Delayed→Resonance→Black Flash + All-Out Detonation',
    price: 2500, rarity: 'common', visual: 'nobara', voice: 'nobara',
  },
  {
    id: 'pack_09', name: 'Yuji Itadori', kanji: '虎杖悠仁', icon: 'hand',
    desc: 'Wadah Sukuna: 逕庭拳→黒閃→穿血→宿儺の器',
    desc_en: "Sukuna's Vessel: Keiteiken→Kokusen→Senketsu→Takeover",
    price: 2500, rarity: 'rare', visual: 'yuji', voice: 'yuji',
  },
  {
    id: 'pack_10', name: 'Megumi Fushiguro', kanji: '伏黒恵', icon: 'paw',
    desc: '十種影法術: 玉犬→鵺→大蛇→満象→虎葬 + ultimate 魔虚羅·適応',
    desc_en: 'Ten Shadows: Dogs→Nue→Serpent→Elephant→Tiger + Mahoraga·Adaptation',
    price: 2500, rarity: 'rare', visual: 'megumi', voice: 'megumi',
  },
  {
    id: 'pack_11', name: 'Nanami Kento', kanji: '七海建人', icon: 'shirt',
    desc: '十劃呪法: 七三↔大鉈→瓦落瓦落(10)→黒閃(20)→時間外労働(30) + ultimate 時間外労働・全開 (puing 瓦落瓦落・連鎖)',
    desc_en: 'Ratio Technique: 7:3↔Oonata→Garagara(10)→Black Flash(20)→Overtime(30) + ultimate Overtime: All-Out (rubble chain)',
    price: 2500, rarity: 'rare', visual: 'nanami', voice: 'nanami',
  },
  {
    id: 'pack_12', name: 'Yuta Okkotsu', kanji: '乙骨憂太', icon: 'gem',
    desc: '模倣・真贋相愛: 3 katana muncul — pilih 1, pakai ultimate siapa pun (Gojo/Sukuna/Nobara/Yuji/Megumi/Nanami/Toji) 30 dtk',
    desc_en: 'Copy: 真贋相愛 — 3 katanas appear, pick 1, wield any ultimate (Gojo/Sukuna/Nobara/Yuji/Megumi/Nanami/Toji) for 30s',
    price: 2500, rarity: 'legendary', visual: 'yuta', voice: 'yuta',
  },
  {
    id: 'pack_13', name: 'Toji Fushiguro', kanji: '伏黒甚爾', icon: 'sword',
    desc: '天与呪縛: 釈魂刀↔万里ノ鎖→天逆鉾(10)→遊雲(20)→武器庫呪霊(30) + ultimate 天与呪縛・全開 (mekanik 武器庫・一撃離脱 — amunisi bayar salah)',
    desc_en: 'Heavenly Restriction: Shakkontou↔Banri no Kusari→Amanosakahoko(10)→Yuuyun(20)→Bukiko Jurei(30) + ultimate Tenyo Jubaku: Zenkai (armory mechanic — ammo pays for mistakes)',
    price: 2500, rarity: 'legendary', visual: 'toji', voice: 'toji',
  },
  {
    id: 'pack_14', name: 'Ryomen Sukuna', kanji: '両面宿儺', icon: 'skull',
    desc: 'Voice pack Sukuna + efek 領域展開・伏魔御廚子', desc_en: 'Sukuna voice pack + Malevolent Shrine effect',
    price: 2500, rarity: 'special', visual: 'sukuna', voice: 'sukuna',
  },
];

export const getPack = (id) => PACKS.find((p) => p.id === id) || null;

// Pack "siap pakai" = punya visual & voice (termasuk placeholder 'dummy').
export const isPackReady = (pack) => Boolean(pack && pack.visual && pack.voice);

// Info isi gacha untuk ditampilkan di Shop: semua pack ready + peluang (%) + status milik.
// `ownedIds` boleh null / bukan array / berisi id hantu — semua aman.
// Peluang dihitung dari bobot rarity, dibulatkan 1 desimal, lalu total dikoreksi
// ke 100% supaya tidak ada selisih pembulatan yang bikin bingung pemain.
export const gachaPoolInfo = (ownedIds = []) => {
  const pool = PACKS.filter(isPackReady);
  if (pool.length === 0) return [];
  const owned = Array.isArray(ownedIds) ? ownedIds : [];
  const total = pool.reduce((sum, p) => sum + (PACK_RARITY[p.rarity]?.weight ?? 1), 0);
  if (total <= 0) return [];
  const raw = pool.map((p) => (PACK_RARITY[p.rarity]?.weight ?? 1) / total * 100);
  const rounded = raw.map((c) => Math.round(c * 10) / 10);
  // Selisih pembulatan dibebankan ke entri terbesar (biasanya common) biar total pas 100.
  const drift = Math.round((100 - rounded.reduce((s, c) => s + c, 0)) * 10) / 10;
  if (drift !== 0) {
    let idx = 0;
    for (let i = 1; i < rounded.length; i++) if (rounded[i] > rounded[idx]) idx = i;
    rounded[idx] = Math.round((rounded[idx] + drift) * 10) / 10;
  }
  return pool.map((p, i) => ({
    id: p.id,
    name: p.name,
    kanji: p.kanji,
    icon: p.icon,
    rarity: p.rarity,
    visual: p.visual,
    desc: p.desc,
    desc_en: p.desc_en,
    chance: rounded[i],
    owned: owned.includes(p.id),
  }));
};

// Peluang AGREGAT per rarity (%), dihitung dari pool yang siap — dipakai teks
// odds di Shop supaya tidak pernah basi saat pack baru ditambah.
export const RARITY_ORDER = ['common', 'rare', 'legendary', 'special'];
export const rarityOdds = () => {
  const pool = PACKS.filter(isPackReady);
  const total = pool.reduce((s, p) => s + (PACK_RARITY[p.rarity]?.weight ?? 1), 0);
  if (total <= 0) return [];
  return RARITY_ORDER
    .filter((r) => pool.some((p) => p.rarity === r))
    .map((r) => {
      const weight = pool.filter((p) => p.rarity === r)
        .reduce((s, p) => s + (PACK_RARITY[p.rarity]?.weight ?? 1), 0);
      return { rarity: r, label: PACK_RARITY[r]?.label || r.toUpperCase(), chance: Math.round((weight / total) * 1000) / 10 };
    });
};

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
