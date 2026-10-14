// cosmeticWiringGuard.test.js — penjaga (guard) bahwa kosmetik 電脳 (isi gacha
// ハック) benar tersambung: rollGacha bercabang ke kosmetik di 電脳, equip ada,
// dan render (Shop/Profile/Inventory/Overlay) tak lupa. Baca sumber sebagai teks
// (pola cyberpunkTheme.test.js / packEraGuard.test.js) → cegah gerbang dicabut.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = (...p) => readFileSync(join(here, ...p), 'utf8');

test('ProgressContext: rollGacha bercabang ke kosmetik + equipCosmetic ada', () => {
  const s = src('..', 'progress', 'ProgressContext.jsx');
  assert.ok(/cosmeticIdsForEra/.test(s), 'ProgressContext harus memakai cosmeticIdsForEra');
  assert.ok(/rollCosmeticId/.test(s), 'rollGacha harus bisa roll kosmetik');
  assert.ok(/equipCosmetic/.test(s), 'equipCosmetic harus ada');
  assert.ok(/ownedCosmetics/.test(s), 'state ownedCosmetics harus ada');
});

test('GachaSlotOverlay: hasil bisa berupa kosmetik (getCosmetic)', () => {
  const s = src('..', 'gacha', 'GachaSlotOverlay.jsx');
  assert.ok(/getCosmetic/.test(s), 'overlay harus mengenal kosmetik');
});

test('Shop: pool 電脳 = kosmetik (cosmeticPoolInfo)', () => {
  const s = src('..', 'shop', 'Shop.jsx');
  assert.ok(/cosmeticPoolInfo/.test(s), 'Shop harus menampilkan pool kosmetik di 電脳');
  assert.ok(/cyberpunk/.test(s), 'Shop harus mengenal era cyberpunk');
});

test('Profile: render Frame ID + Skin HUD, digate era 電脳', () => {
  const s = src('..', 'profile', 'Profile.jsx');
  assert.ok(/activeFrame/.test(s), 'Profile harus membaca activeFrame');
  assert.ok(/activeHud/.test(s), 'Profile harus membaca activeHud');
  assert.ok(/cyberpunk/.test(s), 'kosmetik hanya tampil di era 電脳');
});

test('Inventory: section kosmetik + equip', () => {
  const s = src('..', 'inventory', 'Inventory.jsx');
  assert.ok(/cosmeticsForEra/.test(s), 'Inventory harus menampilkan kosmetik era');
  assert.ok(/equipCosmetic/.test(s), 'Inventory harus bisa pasang kosmetik');
});
