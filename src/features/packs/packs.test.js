import test from 'node:test';
import assert from 'node:assert/strict';
import { PACKS, PACK_RARITY, getPack, isPackReady, rollPackId } from './packs.js';

test('PACKS berisi 6 pack dan semuanya ready', () => {
  assert.equal(PACKS.length, 6);
  assert.equal(PACKS.filter(isPackReady).length, 6);
});

test('setiap pack punya id unik & field wajib', () => {
  const ids = new Set(PACKS.map((p) => p.id));
  assert.equal(ids.size, 6);
  for (const p of PACKS) {
    assert.ok(p.id && p.name && p.rarity && p.visual && p.voice, `pack ${p.id} kurang field`);
    assert.ok(PACK_RARITY[p.rarity], `rarity ${p.rarity} tidak dikenal`);
  }
});

test('getPack fallback null', () => {
  assert.equal(getPack('zzz'), null);
  assert.equal(getPack('kotodama_burst')?.name, 'Kotodama Burst');
});

test('rollPackId selalu mengembalikan id valid', () => {
  const ids = new Set(PACKS.map((p) => p.id));
  for (let i = 0; i < 200; i++) assert.ok(ids.has(rollPackId()), 'id tidak valid');
});

test('rollPackId deterministik dengan rng inject', () => {
  assert.equal(rollPackId(() => 0), 'kotodama_burst');      // ticket 0 → pack pertama
  assert.equal(rollPackId(() => 0.999), 'pack_06');          // ticket ~max → pack terakhir
});

test('rollPackId menghormati bobot rarity (legendary lebih jarang dari common)', () => {
  const tally = {};
  for (let i = 0; i < 20000; i++) {
    const id = rollPackId();
    tally[id] = (tally[id] || 0) + 1;
  }
  const common = tally.pack_02 + tally.pack_03;   // 2 pack common
  const legendary = tally.kotodama_burst + tally.pack_06; // 2 pack legendary
  assert.ok(common > legendary, `common(${common}) harus > legendary(${legendary})`);
});
