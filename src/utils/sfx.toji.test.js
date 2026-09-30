import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOJI_TECHNIQUE_SFX_LAYERS, tojiTechniqueSfxLayers, playTojiTechniqueLayers,
  playSteelRing, playSoulSplit, playChainRattle, playChainYank,
  playSpearPierce, playTechniqueCancel, playStaffWhirl, playBoneCrunch,
  playInventoryGrowl, playWeaponEject, playTojiChant,
  steelRingParams, soulSplitParams, chainRattleParams, chainYankParams,
  spearPierceParams, techniqueCancelParams, staffWhirlParams, boneCrunchParams,
  inventoryGrowlParams, weaponEjectParams, chantParams,
} from './sfx.js';

test('TOJI_TECHNIQUE_SFX_LAYERS: tiap jurus >= 2 lapis (spec 天与呪縛)', () => {
  const keys = ['shakkontou', 'banri_no_kusari', 'amanosakahoko', 'yuuyun', 'bukiko_jurei', 'kill', 'ult', 'wrong'];
  assert.deepEqual(Object.keys(TOJI_TECHNIQUE_SFX_LAYERS).sort(), keys.slice().sort());
  for (const k of keys) {
    const layers = TOJI_TECHNIQUE_SFX_LAYERS[k];
    assert.ok(Array.isArray(layers) && layers.length >= 1, `${k} harus punya lapis`);
    for (const fn of layers) assert.match(fn, /^play[A-Z]/, `${k}: ${fn} harus play*`);
  }
  // jurus + kill + ult wajib >= 2 lapis (identitas tebal: core → edge)
  for (const k of ['shakkontou', 'banri_no_kusari', 'amanosakahoko', 'yuuyun', 'bukiko_jurei', 'kill', 'ult']) {
    assert.ok(TOJI_TECHNIQUE_SFX_LAYERS[k].length >= 2, `${k} harus >= 2 lapis`);
  }
  assert.deepEqual(TOJI_TECHNIQUE_SFX_LAYERS.shakkontou, ['playSteelRing', 'playSoulSplit']);
  assert.deepEqual(TOJI_TECHNIQUE_SFX_LAYERS.banri_no_kusari, ['playChainRattle', 'playChainYank']);
  assert.deepEqual(TOJI_TECHNIQUE_SFX_LAYERS.amanosakahoko, ['playSpearPierce', 'playTechniqueCancel']);
  assert.deepEqual(TOJI_TECHNIQUE_SFX_LAYERS.yuuyun, ['playStaffWhirl', 'playBoneCrunch']);
  assert.deepEqual(TOJI_TECHNIQUE_SFX_LAYERS.bukiko_jurei, ['playInventoryGrowl', 'playWeaponEject']);
  assert.deepEqual(TOJI_TECHNIQUE_SFX_LAYERS.kill, ['playSoulSplit', 'playSteelRing']);
  assert.deepEqual(TOJI_TECHNIQUE_SFX_LAYERS.ult, ['playTojiChant', 'playDomainBoom']);
  assert.deepEqual(TOJI_TECHNIQUE_SFX_LAYERS.wrong, ['playNailThud']);
});

test('tojiTechniqueSfxLayers: aman untuk jurus tak dikenal', () => {
  assert.deepEqual(tojiTechniqueSfxLayers('zzz'), []);
  assert.equal(tojiTechniqueSfxLayers('shakkontou').length, 2);
  assert.equal(tojiTechniqueSfxLayers('ult').length, 2);
});

test('playTojiTechniqueLayers: node no-op 0 (semua player return 0), hitung lapis valid', () => {
  assert.equal(playTojiTechniqueLayers('shakkontou'), 2);
  assert.equal(playTojiTechniqueLayers('banri_no_kusari'), 2);
  assert.equal(playTojiTechniqueLayers('amanosakahoko'), 2);
  assert.equal(playTojiTechniqueLayers('yuuyun'), 2);
  assert.equal(playTojiTechniqueLayers('bukiko_jurei'), 2);
  assert.equal(playTojiTechniqueLayers('kill'), 2);
  assert.equal(playTojiTechniqueLayers('ult'), 2);
  assert.equal(playTojiTechniqueLayers('zzz'), 0);
});

test('semua player SFX Toji baru: node no-op 0 (guard window)', () => {
  for (const fn of [playSteelRing, playSoulSplit, playChainRattle, playChainYank,
    playSpearPierce, playTechniqueCancel, playStaffWhirl, playBoneCrunch,
    playInventoryGrowl, playWeaponEject, playTojiChant]) {
    assert.equal(fn(), 0, `${fn.name} harus no-op di node`);
  }
});

test('params SFX Toji: murni & deterministik (identitas 冷たい鋼 — baja, bukan glow)', () => {
  assert.deepEqual(steelRingParams(), steelRingParams());
  assert.deepEqual(soulSplitParams(), soulSplitParams());
  assert.deepEqual(chainRattleParams(), chainRattleParams());
  assert.deepEqual(chainYankParams(), chainYankParams());
  assert.deepEqual(spearPierceParams(), spearPierceParams());
  assert.deepEqual(techniqueCancelParams(), techniqueCancelParams());
  assert.deepEqual(staffWhirlParams(), staffWhirlParams());
  assert.deepEqual(boneCrunchParams(), boneCrunchParams());
  assert.deepEqual(inventoryGrowlParams(), inventoryGrowlParams());
  assert.deepEqual(weaponEjectParams(), weaponEjectParams());
  assert.deepEqual(chantParams(), chantParams());
  // 刃鳴り = nada TINGGI berdering (logam tipis), bukan bass
  assert.ok(steelRingParams().hz >= 3000, 'steel ring harus tinggi');
  assert.ok(steelRingParams().hz2 > steelRingParams().hz, 'dua nada berdenyut');
  // belahan jiwa = split rendah (turun tajam) + noise
  assert.ok(soulSplitParams().fromHz > soulSplitParams().toHz);
  assert.ok(soulSplitParams().toHz <= 60, 'split turun ke sub');
  // rantai = gemerincing beruntun (banyak burst pendek)
  assert.ok(chainRattleParams().bursts >= 4, 'rantai gemerincing beruntun');
  assert.ok(chainRattleParams().fromHz >= 4000, 'logam tinggi');
  // seretan rantai = naik (ditarik) — kebalikan split
  assert.ok(chainYankParams().fromHz < chainYankParams().toHz, 'yank = ditarik naik');
  // tusukan 天逆鉾 = turun tajam (tusuk masuk), pendek
  assert.ok(spearPierceParams().fromHz > spearPierceParams().toHz);
  assert.ok(spearPierceParams().dur <= 0.3, 'tusukan harus cepat');
  // pembatalan jurus = REVERSE (naik) + glitch
  assert.ok(techniqueCancelParams().fromHz < techniqueCancelParams().toHz, 'cancel = reverse whoosh naik');
  // sapuan 三節棍 = naik melebar (whirl), durasi panjang
  assert.ok(staffWhirlParams().fromHz < staffWhirlParams().toHz);
  assert.ok(staffWhirlParams().dur >= 0.4, 'sapuan lebar');
  // hantaman = crunch beruntun
  assert.ok(boneCrunchParams().bursts >= 2);
  // geraman 武器庫呪霊 = rendah panjang (bukan drone — turun)
  assert.ok(inventoryGrowlParams().fromHz > inventoryGrowlParams().toHz);
  assert.ok(inventoryGrowlParams().dur >= 0.7, 'geraman panjang');
  // senjata dimuntahkan = metal slide (tinggi → sedang) + thud noise
  assert.ok(weaponEjectParams().fromHz > weaponEjectParams().toHz);
  assert.ok(weaponEjectParams().noiseGain > 0, 'thud harus ada noise');
  // chant cast = rendah panjang (hening 呪力ゼロ, bukan teriakan)
  assert.ok(chantParams().fromHz < 200, 'chant rendah');
  assert.ok(chantParams().dur >= 1, 'chant panjang');
});
