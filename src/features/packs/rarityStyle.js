// ─────────────────────────────────────────────────────────────────────────────
// Theme Pack v1.1 — SPEC TERKUNCI: treatment kartu per tier.
// Satu sumber untuk Inventory (kartu besar), Shop (baris pool) & Gacha reel.
//
// Aturan inti (jangan diubah tanpa revisi spec):
//   • WARNA = palet KANON karakter, BUKAN warna rarity → ini akar "jangan generic".
//   • RARITY = treatment (frame/foil/pattern/badge/motion), escalating.
//   • Motion: common 'none' → rare 'subtle' → legendary 'smooth' → special 'full'.
//
// Palet diambil dari src/features/effects/*Fx.js + catatan Obsidian `Efek JJK/`
// (sumber kanon) — JANGAN karang angka baru.
// ─────────────────────────────────────────────────────────────────────────────

export const RARITY_TIER = ['common', 'rare', 'legendary', 'special'];

// ── Palet kanon per `visual` pack ────────────────────────────────────────────
// accent  = warna identitas utama (border, badge, garis, glow)
// accent2 = warna pendukung (inner frame, gradient ujung)
// deep    = latar kartu (versi gelap dari accent, tetap ke-arah hue-nya)
// ink     = outline tinta (selalu #0a0a0a — aturan bahasa visual app)
// emblem  = kanji identitas pack (jadi hero di kartu)
export const PACK_PALETTES = {
  // Hina Chono (Blue Box) — pink rambut. Sumber: hinaFx.js HINA_TEXT_COLOR.
  hina:   { accent: '#ff4d94', accent2: '#ff8fb1', deep: '#5c1236', ink: '#0a0a0a', emblem: 'flower' },
  // Sumi Taiko — tinta sumi + emas kin. Sumber: packs.js (visual 'ink') + token --kin.
  ink:    { accent: '#a9821c', accent2: '#e8c860', deep: '#2b2519', ink: '#0a0a0a', emblem: 'drum' },
  // Gojo Satoru — 無量空処 ungu. Sumber: gojoFx.js GOJO_STYLE.domain.
  gojo:   { accent: '#7c4dff', accent2: '#00b0ff', deep: '#2a1259', ink: '#0a0a0a', emblem: 'infinity' },
  // Nobara — oranye/merah paku. Sumber: nobaraFx.js NOBARA_ORANGE/RED.
  nobara: { accent: '#f97316', accent2: '#dc2626', deep: '#6b2410', ink: '#0a0a0a', emblem: 'hammer' },
  // Yuji — api 黒閃/宿儺 (oranye api, beda dari Sukuna yang merah darah).
  // Sumber: yujiFx.js YUJI_FIRE_COLORS ['#ffd166','#ff8c1a','#e0241a','#7a0b06'].
  yuji:   { accent: '#ff8c1a', accent2: '#e0241a', deep: '#5c0d08', ink: '#0a0a0a', emblem: 'hand' },
  // Megumi — bayangan 影 indigo/perak. Sumber: megumiFx.js MEGUMI_INDIGO/SILVER.
  megumi: { accent: '#4338ca', accent2: '#cbd5e1', deep: '#1b1740', ink: '#0a0a0a', emblem: 'paw' },
  // Nanami — navy suit + emas lembur. Sumber: nanamiFx.js NANAMI_NAVY/GOLD.
  nanami: { accent: '#F59E0B', accent2: '#1E3A8A', deep: '#0f2547', ink: '#0a0a0a', emblem: 'shirt' },
  // Yuta — merah darah 真贋相愛 + ungu 模倣. Sumber: yutaFx.js YUTA_DOMAIN.
  yuta:   { accent: '#dc2626', accent2: '#c084fc', deep: '#5c1414', ink: '#0a0a0a', emblem: 'gem' },
  // Toji — baja dingin, TANPA glow 呪力. Sumber: tojiFx.js TOJI_STEEL/GUNMETAL.
  toji:   { accent: '#CBD5E1', accent2: '#5B21B6', deep: '#16181c', ink: '#0a0a0a', emblem: 'sword' },
  // Sukuna — 伏魔御廚子 merah darah. Sumber: sukunaFx.js SUKUNA_BLOOD.
  sukuna: { accent: '#e0241a', accent2: '#ff8c1a', deep: '#2b0705', ink: '#0a0a0a', emblem: 'skull' },
  // Dummy (pack_02..pack_05) — netral matcha/kin, sengaja kalem (bukan karakter).
  dummy:  { accent: '#7d8f69', accent2: '#a9821c', deep: '#2f3a2b', ink: '#0a0a0a', emblem: 'mask' },
};

export const FALLBACK_PALETTE = PACK_PALETTES.dummy;

// Palet pack dari `visual`-nya. `visual` tak dikenal / kosong → fallback dummy.
export const packPalette = (visual) => PACK_PALETTES[visual] || FALLBACK_PALETTE;

// ── Treatment per rarity (TERKUNCI) ─────────────────────────────────────────
// rank      : urutan kekuatan (buat tes escalating)
// surface   : 'paper' (terang, teks sumi) | 'deep' (berwarna, teks terang)
// frame     : { width, style, material } — border luar + inner
// foil      : null | 'sheen' | 'shimmer' | 'holo'
// pattern   : 'none' | 'asanoha' | 'kumihimo' | 'domain'
// badge     : 'outline' | 'solid' | 'gold' | 'holo'
// motion    : 'none' | 'subtle' | 'smooth' | 'full'
// shadow    : px offset hard-shadow neo-brutalist
export const RARITY_TREATMENT = {
  common: {
    rank: 1, label: 'COMMON', surface: 'paper',
    frame: { width: 4, style: 'solid', material: 'paper' },
    foil: null, pattern: 'none', badge: 'outline', motion: 'none', shadow: 6,
  },
  rare: {
    rank: 2, label: 'RARE', surface: 'deep',
    frame: { width: 4, style: 'solid', material: 'satin' },
    foil: 'sheen', pattern: 'asanoha', badge: 'solid', motion: 'subtle', shadow: 6,
  },
  legendary: {
    rank: 3, label: 'LEGENDARY', surface: 'deep',
    frame: { width: 4, style: 'double', material: 'gold-foil' },
    foil: 'shimmer', pattern: 'kumihimo', badge: 'gold', motion: 'smooth', shadow: 8,
  },
  special: {
    rank: 4, label: 'SPECIAL', surface: 'deep',
    frame: { width: 5, style: 'double', material: 'holo' },
    foil: 'holo', pattern: 'domain', badge: 'holo', motion: 'full', shadow: 10,
  },
};

export const rarityTreatment = (rarity) => RARITY_TREATMENT[rarity] || RARITY_TREATMENT.common;

export const tierMotion = (rarity) => rarityTreatment(rarity).motion;
export const tierRank = (rarity) => rarityTreatment(rarity).rank;

// Gabungan lengkap untuk satu pack — dipakai komponen kartu.
export const packCardStyle = (pack) => {
  const treatment = rarityTreatment(pack?.rarity);
  const palette = packPalette(pack?.visual);
  return { treatment, palette, surface: treatment.surface, motion: treatment.motion };
};

// CSS custom-property vars (string) buat style inline elemen kartu.
export const packCssVars = (pack) => {
  const { palette } = packCardStyle(pack);
  return {
    '--accent': palette.accent,
    '--accent2': palette.accent2,
    '--deep': palette.deep,
    '--ink': palette.ink,
  };
};

// Luminansi relatif WCAG dari hex.
const relLuminance = (hex) => {
  const c = hex.replace('#', '');
  const chan = (i) => {
    const s = parseInt(c.slice(i, i + 2), 16) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * chan(0) + 0.7152 * chan(2) + 0.0722 * chan(4);
};

// Rasio kontras WCAG antara dua hex (1..21).
export const contrastRatio = (a, b) => {
  const la = relLuminance(a), lb = relLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

// Warna teks yang kontras >= 4.5 di atas `accent` — dipakai badge/baris yang
// berlatar warna kanon karakter (a11y: teks harus kebaca di semua accent).
export const accentInk = (hex) =>
  contrastRatio(hex, '#0a0a0a') >= contrastRatio(hex, '#ffffff') ? '#0a0a0a' : '#ffffff';

