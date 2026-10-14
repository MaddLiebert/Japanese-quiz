// cosmetics.test.js — penjaga katalog kosmetik 電脳 (isi gacha ハック).
// PRD: docs/tema/cyberpunk.md §16. Modul MURNI → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COSMETICS, COSMETIC_ERA, COSMETIC_KIND, getCosmetic, cosmeticAllowedInEra,
  cosmeticsForEra, cosmeticIdsForEra, rollCosmeticId, cosmeticPoolInfo,
} from './cosmetics.js';
import { PACK_RARITY } from '../packs/packs.js';

test('katalog: 6 kosmetik, id unik, field wajib lengkap', () => {
  assert.equal(COSMETICS.length, 6);
  const ids = new Set(COSMETICS.map((c) => c.id));
  assert.equal(ids.size, 6);
  for (const c of COSMETICS) {
    assert.ok(c.id && c.name && c.kanji && c.icon && c.rarity && c.kind, `${c.id} field kurang`);
    assert.ok(PACK_RARITY[c.rarity], `rarity ${c.rarity} tidak dikenal`);
    assert.ok(c.palette && c.palette.accent, `${c.id} tanpa palet`);
    assert.equal(c.era, COSMETIC_ERA, `${c.id} harus terikat era 電脳`);
    assert.ok([COSMETIC_KIND.FRAME, COSMETIC_KIND.HUD].includes(c.kind), `${c.id} kind tak dikenal`);
  }
});

test('katalog: ada Frame ID & Skin HUD (keputusan pemilik)', () => {
  const frames = COSMETICS.filter((c) => c.kind === 'frame');
  const huds = COSMETICS.filter((c) => c.kind === 'hud');
  assert.ok(frames.length >= 2, 'minimal 2 frame');
  assert.ok(huds.length >= 2, 'minimal 2 hud skin');
});

test('getCosmetic: fallback null', () => {
  assert.equal(getCosmetic('zzz'), null);
  assert.equal(getCosmetic('frame_neon')?.kind, 'frame');
});

test('cosmeticAllowedInEra: hanya 電脳', () => {
  const c = getCosmetic('frame_neon');
  assert.equal(cosmeticAllowedInEra(c, 'cyberpunk'), true);
  for (const era of ['heian', 'edo', 'meiji', 'showa', 'anime']) {
    assert.equal(cosmeticAllowedInEra(c, era), false, `tidak boleh di ${era}`);
  }
});

test('cosmeticsForEra: era lain kosong, 電脳 penuh, tanpa era → semua', () => {
  for (const era of ['heian', 'edo', 'meiji', 'showa', 'anime']) {
    assert.equal(cosmeticsForEra(era).length, 0, `${era} harus kosong`);
  }
  assert.equal(cosmeticsForEra('cyberpunk').length, 6);
  assert.equal(cosmeticsForEra(null).length, 6);
});

test('rollCosmeticId: deterministik dengan rng inject', () => {
  const ids = cosmeticIdsForEra('cyberpunk');
  assert.equal(rollCosmeticId(() => 0, ids), 'frame_neon');
  assert.equal(rollCosmeticId(() => 0.999, ids), COSMETICS[COSMETICS.length - 1].id);
});

test('rollCosmeticId: pool kosong / tak cocok → null', () => {
  assert.equal(rollCosmeticId(Math.random, []), null);
  assert.equal(rollCosmeticId(Math.random, ['tidak_ada']), null);
});

test('rollCosmeticId: menghormati bobot rarity (legendary lebih jarang)', () => {
  const ids = cosmeticIdsForEra('cyberpunk');
  const tally = {};
  for (let i = 0; i < 20000; i++) {
    const id = rollCosmeticId(Math.random, ids);
    tally[id] = (tally[id] || 0) + 1;
  }
  const common = (tally.frame_neon || 0) + (tally.hud_scan || 0);
  const legendary = (tally.frame_owari || 0) + (tally.hud_tokoyo || 0);
  assert.ok(common > legendary, `common(${common}) harus > legendary(${legendary})`);
});

test('cosmeticPoolInfo: field kompatibel pool pack + total 100 + owned', () => {
  const info = cosmeticPoolInfo(['frame_neon']);
  assert.equal(info.length, 6);
  for (const c of info) {
    assert.ok(c.id && c.name && c.icon && c.palette, `${c.id} field tampilan kurang`);
    assert.ok(c.chance > 0);
    assert.equal(typeof c.owned, 'boolean');
    assert.equal(c.winnable, true);
  }
  const total = info.reduce((s, c) => s + c.chance, 0);
  assert.ok(Math.abs(total - 100) < 0.01, `total ${total} harus 100`);
  assert.equal(info.find((c) => c.id === 'frame_neon').owned, true);
});

test('cosmeticPoolInfo: input kotor aman', () => {
  for (const bad of [null, undefined, 'x', 42, ['tidak_ada']]) {
    const info = cosmeticPoolInfo(bad);
    assert.equal(info.length, 6);
    assert.ok(info.every((c) => c.owned === false));
  }
});
