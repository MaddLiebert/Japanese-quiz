import test from 'node:test';
import assert from 'node:assert/strict';
import { PACKS, PACK_RARITY, getPack, isPackReady, rollPackId, gachaPoolInfo, rarityOdds, isEraBoundPack, packAllowedInEra, packsForEra, packIdsForEra } from './packs.js';

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
  assert.equal(p.icon, 'infinity');
});

test('pack_09 = Yuji Itadori, visual yuji (bukan dummy lagi)', () => {
  const p = getPack('pack_09');
  assert.equal(p.visual, 'yuji');
  assert.equal(p.voice, 'yuji');
  assert.ok(!/dummy|menyusul|coming/i.test(p.desc), 'desc tidak boleh "menyusul/dummy"');
  assert.ok(!/dummy|menyusul|coming/i.test(p.desc_en), 'desc_en tidak boleh "menyusul/dummy"');
});

test('pack_11 = Nanami Kento, visual nanami (bukan dummy lagi)', () => {
  const p = getPack('pack_11');
  assert.equal(p.visual, 'nanami');
  assert.equal(p.voice, 'nanami');
  assert.ok(!/dummy|menyusul|coming/i.test(p.desc), 'desc tidak boleh "menyusul/dummy"');
  assert.ok(!/dummy|menyusul|coming/i.test(p.desc_en), 'desc_en tidak boleh "menyusul/dummy"');
});

test('pack_13 = Toji Fushiguro, visual toji (bukan dummy lagi)', () => {
  const p = getPack('pack_13');
  assert.equal(p.visual, 'toji');
  assert.equal(p.voice, 'toji');
  assert.ok(!/dummy|menyusul|coming/i.test(p.desc), 'desc tidak boleh "menyusul/dummy"');
  assert.ok(!/dummy|menyusul|coming/i.test(p.desc_en), 'desc_en tidak boleh "menyusul/dummy"');
});

test('pack_12 = Yuta Okkotsu, visual yuta (bukan dummy lagi)', () => {
  const p = getPack('pack_12');
  assert.equal(p.visual, 'yuta');
  assert.equal(p.voice, 'yuta');
  assert.equal(p.rarity, 'legendary');
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

// ── Gerbang era: pack anime (JJK) HANYA untuk era 多元 ───────────────────────
// Aturan pemilik: "voice pack anime cuma ada & cuma bisa dipakai di tema 多元".

test('pack_07..pack_14 ditandai era "anime" (JJK = pack anime)', () => {
  const animeIds = ['pack_07', 'pack_08', 'pack_09', 'pack_10', 'pack_11', 'pack_12', 'pack_13', 'pack_14'];
  for (const id of animeIds) {
    assert.equal(getPack(id).era, 'anime', `${id} harus era 'anime'`);
  }
});

test('pack_01..pack_06 TIDAK terikat era (bebas dipakai di era mana pun)', () => {
  const bebas = ['kotodama_burst', 'pack_02', 'pack_03', 'pack_04', 'pack_05', 'pack_06'];
  for (const id of bebas) {
    assert.ok(!getPack(id).era, `${id} tidak boleh punya era`);
  }
});

test('isEraBoundPack: true hanya untuk pack ber-era', () => {
  assert.equal(isEraBoundPack(getPack('pack_07')), true);
  assert.equal(isEraBoundPack(getPack('kotodama_burst')), false);
  assert.equal(isEraBoundPack(null), false);
});

test('packAllowedInEra: pack anime hanya boleh di era anime', () => {
  const anime = getPack('pack_07');
  assert.equal(packAllowedInEra(anime, 'anime'), true);
  for (const era of ['heian', 'edo', 'meiji', 'showa', 'cyberpunk']) {
    assert.equal(packAllowedInEra(anime, era), false, `pack anime tidak boleh di ${era}`);
  }
});

test('packAllowedInEra: pack tanpa era selalu boleh (semua era)', () => {
  const bebas = getPack('kotodama_burst');
  for (const era of ['heian', 'edo', 'meiji', 'showa', 'anime', 'cyberpunk']) {
    assert.equal(packAllowedInEra(bebas, era), true);
  }
  assert.equal(packAllowedInEra(null, 'anime'), true, 'pack null → tidak menghalangi');
});

test('gachaPoolInfo membawa field era (untuk label "多元" di Shop)', () => {
  const info = gachaPoolInfo();
  const gojo = info.find((p) => p.id === 'pack_07');
  assert.equal(gojo.era, 'anime');
  const hina = info.find((p) => p.id === 'kotodama_burst');
  assert.ok(!hina.era, 'pack non-anime tidak punya era');
});

// ── Pool SADAR-ERA: tiap tema hanya bisa menang pack miliknya + pack dasar ────
// Keputusan pemilik: "tiap tema cuma bisa menang pack miliknya sendiri
// (+ sedikit pack dasar bersama)". Pack dasar = pack tanpa `era`.

const BASE_IDS = ['kotodama_burst', 'pack_02', 'pack_03', 'pack_04', 'pack_05', 'pack_06'];
const ANIME_IDS = ['pack_07', 'pack_08', 'pack_09', 'pack_10', 'pack_11', 'pack_12', 'pack_13', 'pack_14'];

test('packsForEra: era non-anime hanya pack dasar (tanpa JJK)', () => {
  for (const era of ['heian', 'edo', 'meiji', 'showa', 'cyberpunk']) {
    const ids = packsForEra(era).map((p) => p.id);
    assert.deepEqual([...ids].sort(), [...BASE_IDS].sort(), `pool ${era} harus = pack dasar`);
    for (const a of ANIME_IDS) assert.ok(!ids.includes(a), `${a} tidak boleh ada di pool ${era}`);
  }
});

test('packsForEra: era anime = pack dasar + semua JJK', () => {
  const ids = packsForEra('anime').map((p) => p.id);
  for (const b of BASE_IDS) assert.ok(ids.includes(b), `dasar ${b} harus ada di 多元`);
  for (const a of ANIME_IDS) assert.ok(ids.includes(a), `${a} harus ada di 多元`);
  assert.equal(ids.length, 14);
});

test('packsForEra: era kosong/null → semua pack (perilaku lama)', () => {
  assert.equal(packsForEra(null).length, 14);
  assert.equal(packsForEra(undefined).length, 14);
  assert.equal(packsForEra('').length, 14);
});

test('packIdsForEra: daftar id cocok dengan packsForEra', () => {
  assert.deepEqual(packIdsForEra('heian'), packsForEra('heian').map((p) => p.id));
  assert.deepEqual(packIdsForEra('anime'), packsForEra('anime').map((p) => p.id));
});

test('roll di pool Heian tidak PERNAH keluar JJK (1000x)', () => {
  const poolIds = packIdsForEra('heian');
  for (let i = 0; i < 1000; i++) {
    const id = rollPackId(Math.random, poolIds);
    assert.ok(!ANIME_IDS.includes(id), `JJK ${id} bocor ke pool Heian`);
  }
});

test('gachaPoolInfo(era): JJK ditandai winnable:false + chance 0 di luar 多元', () => {
  const info = gachaPoolInfo([], 'heian');
  const gojo = info.find((p) => p.id === 'pack_07');
  assert.equal(gojo.winnable, false, 'Gojo tidak bisa menang di Heian');
  assert.equal(gojo.chance, 0, 'peluang Gojo di Heian = 0');
  const hina = info.find((p) => p.id === 'kotodama_burst');
  assert.equal(hina.winnable, true);
  assert.ok(hina.chance > 0, 'pack dasar tetap bisa menang di Heian');
});

test('gachaPoolInfo(era): di 多元 semua pack winnable & total chance 100', () => {
  const info = gachaPoolInfo([], 'anime');
  assert.ok(info.every((p) => p.winnable === true), 'di 多元 semua bisa menang');
  const total = info.reduce((s, p) => s + p.chance, 0);
  assert.ok(Math.abs(total - 100) < 0.01, `total chance ${total} harus 100`);
});

test('gachaPoolInfo() tanpa era → semua winnable (perilaku lama)', () => {
  const info = gachaPoolInfo();
  assert.ok(info.every((p) => p.winnable === true));
  const total = info.reduce((s, p) => s + p.chance, 0);
  assert.ok(Math.abs(total - 100) < 0.01);
});

test('rarityOdds(era): peluang dihitung dari pool era (bukan seluruh pack)', () => {
  const all = rarityOdds();
  const heian = rarityOdds('heian');
  // Heian tak punya pack special (Gojo/Sukuna) → special hilang dari daftar.
  assert.ok(!heian.some((o) => o.rarity === 'special'), 'Heian tak boleh menampilkan special');
  assert.ok(all.some((o) => o.rarity === 'special'), 'pool penuh punya special');
  const total = heian.reduce((s, o) => s + o.chance, 0);
  assert.ok(Math.abs(total - 100) < 0.2, `total odds Heian ${total} harus ~100`);
});
