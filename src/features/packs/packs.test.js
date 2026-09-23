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

// ── Fase 1 (event): pool terbatas + bobot override ───────────────────────────

test('rollPackId hormati poolIds — tidak pernah keluar pack di luar pool', () => {
  const pool = ['pack_02', 'pack_04'];
  for (let i = 0; i < 500; i++) {
    assert.ok(pool.includes(rollPackId(Math.random, pool)), 'keluar pack di luar pool');
  }
});

test('rollPackId poolIds kosong / tak cocok → null', () => {
  assert.equal(rollPackId(Math.random, []), null);
  assert.equal(rollPackId(Math.random, ['tidak_ada']), null);
});

test('rollPackId poolIds=null → perilaku lama (semua pack)', () => {
  const ids = new Set(PACKS.map((p) => p.id));
  for (let i = 0; i < 200; i++) assert.ok(ids.has(rollPackId(Math.random, null)));
});

test('rollPackId weights override memakai bobot yang diberikan', () => {
  // pool 2 pack; bobot override: pack_02 sangat langka (1), pack_04 sangat umum (99)
  const tally = { pack_02: 0, pack_04: 0 };
  for (let i = 0; i < 20000; i++) {
    const id = rollPackId(Math.random, ['pack_02', 'pack_04'], { common: 1, rare: 99 });
    tally[id] += 1;
  }
  // pack_04 = rare (bobot 99), pack_02 = common (bobot 1) → pack_04 harus jauh lebih sering
  assert.ok(tally.pack_04 > tally.pack_02 * 5, `pack_04(${tally.pack_04}) harus >> pack_02(${tally.pack_02})`);
});

test('rollPackId weights override dipatok presisi (~2% untuk bobot 2 dari 100)', () => {
  // Validasi inti event: pack "special" (bobot 2) vs "common" (bobot 98) → ~2%.
  const pool = ['kotodama_burst', 'pack_02'];   // legendary vs common (bobot di-override)
  const weights = { legendary: 2, common: 98 };
  const N = 40000;
  let legendaryCount = 0;
  for (let i = 0; i < N; i++) {
    if (rollPackId(Math.random, pool, weights) === 'kotodama_burst') legendaryCount += 1;
  }
  const pct = (legendaryCount / N) * 100;
  assert.ok(pct > 1.6 && pct < 2.4, `rate ${pct.toFixed(2)}% harus ~2%`);
});

test('rollPackId tanpa weights → fallback ke bobot global PACK_RARITY', () => {
  const tally = {};
  const N = 30000;
  for (let i = 0; i < N; i++) {
    const id = rollPackId(Math.random, ['kotodama_burst', 'pack_02']);  // legendary vs common
    tally[id] = (tally[id] || 0) + 1;
  }
  // global: legendary 20, common 50 → common harus lebih sering (~71%)
  assert.ok(tally.pack_02 > tally.kotodama_burst, 'common harus lebih sering dari legendary');
});
