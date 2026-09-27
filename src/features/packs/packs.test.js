import test from 'node:test';
import assert from 'node:assert/strict';
import { PACKS, PACK_RARITY, getPack, isPackReady, rollPackId, gachaPoolInfo, rarityOdds } from './packs.js';

test('PACKS berisi 14 pack dan semuanya ready', () => {
  assert.equal(PACKS.length, 14);
  assert.equal(PACKS.filter(isPackReady).length, 14);
});

test('setiap pack punya id unik & field wajib', () => {
  const ids = new Set(PACKS.map((p) => p.id));
  assert.equal(ids.size, 14);
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
  assert.equal(rollPackId(() => 0.999), 'pack_14');          // ticket ~max → pack terakhir
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

// ── Info isi gacha (ditampilkan di Shop) ─────────────────────────────────────

test('gachaPoolInfo: daftar semua pack ready + peluang dihitung dari bobot', () => {
  const info = gachaPoolInfo();
  assert.equal(info.length, PACKS.filter(isPackReady).length);

  // semua pack punya chance > 0 dan field tampilan lengkap
  for (const p of info) {
    assert.ok(p.id && p.name && p.icon, `pack ${p.id} kurang field tampilan`);
    assert.ok(PACK_RARITY[p.rarity], `rarity ${p.rarity} tidak dikenal`);
    assert.ok(p.chance > 0, `chance ${p.id} harus > 0`);
    assert.equal(typeof p.owned, 'boolean');
  }

  // total peluang = 100% (dibulatkan)
  const total = info.reduce((s, p) => s + p.chance, 0);
  assert.ok(Math.abs(total - 100) < 0.01, `total chance ${total} harus 100`);
});

test('gachaPoolInfo: rarity legendary peluangnya lebih kecil dari common', () => {
  const info = gachaPoolInfo();
  const legendary = info.find((p) => p.rarity === 'legendary');
  const common = info.find((p) => p.rarity === 'common');
  assert.ok(legendary.chance < common.chance, `legendary(${legendary.chance}) harus < common(${common.chance})`);
});

test('gachaPoolInfo: tandai pack yang sudah dimiliki', () => {
  const info = gachaPoolInfo(['kotodama_burst']);
  assert.equal(info.find((p) => p.id === 'kotodama_burst').owned, true);
  assert.equal(info.find((p) => p.id === 'pack_02').owned, false);
});

test('gachaPoolInfo: input kotor aman (null / bukan array / id hantu)', () => {
  for (const bad of [null, undefined, 'bukan-array', 42, ['tidak_ada']]) {
    const info = gachaPoolInfo(bad);
    assert.equal(info.length, PACKS.filter(isPackReady).length);
    assert.ok(info.every((p) => p.chance > 0));
  }
  // id hantu tidak bikin crash, cuma tidak menandai apa pun
  assert.ok(gachaPoolInfo(['tidak_ada']).every((p) => p.owned === false));
});

// ── Fase 2 (Gojo): tier SPECIAL + pack_07 ────────────────────────────────────

test('PACK_RARITY: special paling langka; agregat special ~2% dari pool', () => {
  assert.equal(PACK_RARITY.special.weight, 2);
  const total = PACKS.reduce((s, p) => s + PACK_RARITY[p.rarity].weight, 0);
  const specialWeight = PACKS.filter((p) => p.rarity === 'special')
    .reduce((s) => s + PACK_RARITY.special.weight, 0);
  const pct = (specialWeight / total) * 100;
  assert.ok(pct > 1.5 && pct < 2.5, `agregat special ${pct.toFixed(2)}% harus ~2%`);
  assert.ok(PACK_RARITY.special.weight < PACK_RARITY.legendary.weight);
});

test('pack_07 = Gojo Satoru, rarity special, visual/voice gojo', () => {
  const p = getPack('pack_07');
  assert.ok(p, 'pack_07 harus ada');
  assert.equal(p.rarity, 'special');
  assert.equal(p.visual, 'gojo');
  assert.equal(p.voice, 'gojo');
  assert.equal(p.name, 'Gojo Satoru');
  assert.equal(p.kanji, '五条悟');
  assert.equal(p.icon, '🟣');
});

test('pack_09 = Yuji Itadori, visual yuji (bukan dummy lagi)', () => {
  const p = getPack('pack_09');
  assert.equal(p.visual, 'yuji');
  assert.equal(p.voice, 'yuji');
  assert.ok(!/dummy|menyusul|coming/i.test(p.desc), 'desc tidak boleh "menyusul/dummy"');
  assert.ok(!/dummy|menyusul|coming/i.test(p.desc_en), 'desc_en tidak boleh "menyusul/dummy"');
});


// ── Seri Jujutsu Kaisen: 7 pack (dummy → VP) ─────────────────────────────────

test('7 pack JJK: id, nama, rarity & voice key sesuai peta', () => {
  const want = {
    pack_08: ['Nobara Kugisaki', 'common', 'nobara'],
    pack_09: ['Yuji Itadori', 'rare', 'yuji'],
    pack_10: ['Megumi Fushiguro', 'rare', 'megumi'],
    pack_11: ['Nanami Kento', 'rare', 'nanami'],
    pack_12: ['Yuta Okkotsu', 'legendary', 'yuta'],
    pack_13: ['Toji Fushiguro', 'legendary', 'toji'],
    pack_14: ['Ryomen Sukuna', 'special', 'sukuna'],
  };
  for (const [id, [name, rarity, voice]] of Object.entries(want)) {
    const p = getPack(id);
    assert.ok(p, `${id} harus ada`);
    assert.equal(p.name, name);
    assert.equal(p.rarity, rarity);
    assert.equal(p.voice, voice);
    assert.ok(p.visual && p.kanji && p.icon && p.desc && p.desc_en, `${id} field kurang`);
  }
});


test('rarityOdds: agregat per rarity, total ~100, special paling kecil', () => {
  const odds = rarityOdds();
  const total = odds.reduce((s, o) => s + o.chance, 0);
  assert.ok(Math.abs(total - 100) < 0.2, `total ${total} harus ~100`);
  const special = odds.find((o) => o.rarity === 'special');
  assert.ok(special && special.chance > 1.5 && special.chance < 2.5, `special ${special?.chance}% harus ~2%`);
  for (const o of odds) assert.ok(o.label && o.chance > 0);
});
