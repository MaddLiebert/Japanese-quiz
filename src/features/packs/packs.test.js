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
  assert.equal(getPack('kotodama_burst')?.name, 'Hina Chono');
});

test('kotodama_burst = "Hina Chono" (nama/kanji/desc sesuai Hina, bukan tinta)', () => {
  const p = getPack('kotodama_burst');
  assert.equal(p.visual, 'hina');
  assert.equal(p.voice, 'hina');
  assert.equal(p.name, 'Hina Chono');
  assert.equal(p.kanji, '蝶野雛');
  assert.match(p.desc, /Hina|suara/i, 'desc harus menyebut Hina/suara');
  assert.ok(!/tinta|ink/i.test(p.desc), 'desc tidak boleh menulis efek tinta (sudah pindah ke Sumi Taiko)');
  assert.ok(!/tinta|ink/i.test(p.desc_en), 'desc_en tidak boleh menulis efek tinta');
});

test('pack_06 = "Sumi Taiko" (tinta washi + taiko), bukan dummy lagi', () => {
  // Efek tinta (hanko/ensō) & sound default (gong/thud) asli Kotodama Burst
  // dipindah ke pack legendary ini, karena pack #1 sekarang jadi Hina.
  const p = getPack('pack_06');
  assert.equal(p.rarity, 'legendary');
  assert.equal(p.visual, 'ink');
  assert.equal(p.voice, 'taiko');
  assert.equal(p.name, 'Sumi Taiko');
  assert.equal(p.kanji, '墨太鼓');
  assert.ok(!/dummy/i.test(p.name), 'nama tidak boleh mengandung "dummy"');
  assert.ok(!/dummy/i.test(p.desc), 'desc tidak boleh mengandung "dummy"');
  assert.ok(!/dummy/i.test(p.desc_en), 'desc_en tidak boleh mengandung "dummy"');
  assert.match(p.desc, /tinta|ink/i);
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
