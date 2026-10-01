import test from 'node:test';
import assert from 'node:assert/strict';
import { PACKS } from './packs.js';
import {
  PACK_PALETTES, RARITY_TREATMENT, RARITY_TIER, FALLBACK_PALETTE,
  packPalette, rarityTreatment, tierMotion, tierRank, packCardStyle, packCssVars,
  accentInk, contrastRatio,
} from './rarityStyle.js';

// ── Palet kanon (inti "jangan generic") ──────────────────────────────────────

test('palet: semua `visual` yang dipakai PACKS punya palet kanon', () => {
  for (const p of PACKS) {
    assert.ok(PACK_PALETTES[p.visual], `visual "${p.visual}" (${p.id}) belum punya palet`);
  }
});

test('palet: tiap pack KARAKTER punya accent BEDA (bukan warna generic)', () => {
  const chars = PACKS.filter((p) => p.visual !== 'dummy');
  const seen = new Map();
  for (const p of chars) {
    const { accent } = packPalette(p.visual);
    assert.ok(!seen.has(accent), `accent ${accent} dipakai ${seen.get(accent)} & ${p.id} — generic!`);
    seen.set(accent, p.id);
  }
  assert.ok(seen.size >= 9, `harus ada >=9 accent unik, dapat ${seen.size}`);
});

test('palet: bentuk valid + bukan hitam pekat (harus kebaca di tema gelap)', () => {
  for (const [key, pal] of Object.entries(PACK_PALETTES)) {
    for (const field of ['accent', 'accent2', 'deep', 'ink', 'emblem']) {
      assert.ok(pal[field], `${key}.${field} kosong`);
    }
    assert.match(pal.accent, /^#[0-9A-Fa-f]{6}$/, `${key}.accent bukan hex`);
    assert.match(pal.accent2, /^#[0-9A-Fa-f]{6}$/, `${key}.accent2 bukan hex`);
    assert.match(pal.deep, /^#[0-9A-Fa-f]{6}$/, `${key}.deep bukan hex`);
    assert.notEqual(pal.deep.toLowerCase(), '#000000', `${key}.deep hitam pekat`);
    assert.ok(pal.emblem.length >= 1, `${key}.emblem kosong`);
  }
});

// ── Treatment per tier (escalating) ──────────────────────────────────────────

test('treatment: 4 tier, rank & motion naik monoton (escalating)', () => {
  assert.deepEqual(RARITY_TIER, ['common', 'rare', 'legendary', 'special']);
  const rankOrder = { none: 0, subtle: 1, smooth: 2, full: 3 };
  let prevRank = 0, prevMotion = -1, prevShadow = 0;
  for (const r of RARITY_TIER) {
    const t = RARITY_TREATMENT[r];
    assert.ok(t, `treatment ${r} hilang`);
    assert.ok(t.rank > prevRank, `rank ${r} tidak naik`);
    assert.ok(rankOrder[t.motion] > prevMotion, `motion ${r} tidak naik`);
    assert.ok(t.shadow >= prevShadow, `shadow ${r} turun`);
    prevRank = t.rank; prevMotion = rankOrder[t.motion]; prevShadow = t.shadow;
  }
});

test('treatment: common diam; tier tinggi dapat material/foil/pola', () => {
  assert.equal(RARITY_TREATMENT.common.motion, 'none');
  assert.equal(RARITY_TREATMENT.common.foil, null);
  assert.equal(RARITY_TREATMENT.common.pattern, 'none');
  assert.equal(RARITY_TREATMENT.rare.foil, 'sheen');
  assert.equal(RARITY_TREATMENT.legendary.foil, 'shimmer');
  assert.equal(RARITY_TREATMENT.special.foil, 'holo');
  assert.equal(RARITY_TREATMENT.special.motion, 'full');
  assert.equal(RARITY_TREATMENT.special.pattern, 'domain');
});

test('treatment: hanya common surface paper; legend/special frame double', () => {
  assert.equal(RARITY_TREATMENT.common.surface, 'paper');
  assert.equal(RARITY_TREATMENT.rare.surface, 'deep');
  assert.equal(RARITY_TREATMENT.common.frame.style, 'solid');
  assert.equal(RARITY_TREATMENT.legendary.frame.style, 'double');
  assert.equal(RARITY_TREATMENT.special.frame.style, 'double');
  assert.ok(RARITY_TREATMENT.special.frame.width > RARITY_TREATMENT.legendary.frame.width);
});

// ── Helper murni ─────────────────────────────────────────────────────────────

test('helper: rarity tak dikenal → common; visual tak dikenal → dummy', () => {
  assert.equal(rarityTreatment('nyasar'), RARITY_TREATMENT.common);
  assert.equal(rarityTreatment(undefined), RARITY_TREATMENT.common);
  assert.equal(packPalette('nyasar'), FALLBACK_PALETTE);
  assert.equal(packPalette(undefined), FALLBACK_PALETTE);
  assert.equal(tierRank('special'), 4);
  assert.equal(tierMotion('legendary'), 'smooth');
});

test('packCardStyle & packCssVars: gabungan treatment + palet pack', () => {
  const toji = PACKS.find((p) => p.id === 'pack_13');
  const s = packCardStyle(toji);
  assert.equal(s.treatment.rank, 3);        // legendary
  assert.equal(s.motion, 'smooth');
  assert.equal(s.surface, 'deep');
  assert.equal(s.palette.accent, '#CBD5E1');
  const vars = packCssVars(toji);
  assert.equal(vars['--accent'], '#CBD5E1');
  assert.equal(vars['--deep'], '#16181c');
  assert.equal(vars['--ink'], '#0a0a0a');
});

test('tier sesuai rarity pack asli (special motion penuh, common diam)', () => {
  const byId = (id) => PACKS.find((p) => p.id === id);
  assert.equal(packCardStyle(byId('pack_07')).motion, 'full');          // gojo special
  assert.equal(packCardStyle(byId('pack_14')).motion, 'full');          // sukuna special
  assert.equal(packCardStyle(byId('pack_08')).motion, 'none');          // nobara common
  assert.equal(packCardStyle(byId('kotodama_burst')).motion, 'smooth'); // hina legendary
});

// ── Kontras (a11y) ───────────────────────────────────────────────────────────

test('accentInk: teks di atas accent SELALU kontras >= 4.5 (WCAG AA)', () => {
  for (const [key, pal] of Object.entries(PACK_PALETTES)) {
    const ink = accentInk(pal.accent);
    const ratio = contrastRatio(pal.accent, ink);
    assert.ok(ratio >= 4.5, `${key}: kontras ${ratio.toFixed(2)} < 4.5 (accent ${pal.accent})`);
    assert.ok(ink === '#0a0a0a' || ink === '#ffffff', `${key}: ink tak dikenal ${ink}`);
  }
  assert.equal(accentInk('#CBD5E1'), '#0a0a0a'); // accent terang → teks gelap
  assert.equal(accentInk('#0f2547'), '#ffffff'); // accent gelap → teks terang
});
