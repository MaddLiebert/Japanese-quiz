// meishi.test.js — penjaga modul murni A10 名刺 (features/profile/meishi.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A10. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MEISHI_RARITIES, meishiRarity, buildMeishi } from './meishi.js';

test('meishiRarity: naik dengan level (150=SR, 200=SSR, 300=UR)', () => {
  assert.equal(meishiRarity({ level: 1 }), 'R');
  assert.equal(meishiRarity({ level: 149 }), 'R');
  assert.equal(meishiRarity({ level: 150 }), 'SR');
  assert.equal(meishiRarity({ level: 199 }), 'SR');
  assert.equal(meishiRarity({ level: 200 }), 'SSR');
  assert.equal(meishiRarity({ level: 300 }), 'UR');
});

test('meishiRarity: input kosong → R (default level 1)', () => {
  assert.equal(meishiRarity({}), 'R');
  assert.equal(meishiRarity(null), 'R');
});

test('buildMeishi: stabil & membaca field progress', () => {
  const p = { playerName: 'Hana', oshiId: 'hoshi_hikari', level: 150, badges: ['a', 'b'], firstSeen: '2026-01-01' };
  const m = buildMeishi(p);
  assert.deepEqual(m, {
    name: 'Hana', oshi: 'hoshi_hikari', power: 150, badges: ['a', 'b'], since: '2026-01-01', rarity: 'SR',
  });
  assert.deepEqual(buildMeishi(p), buildMeishi(p)); // deterministik
});

test('buildMeishi: default nama 旅人 & field kosong aman', () => {
  const m = buildMeishi({});
  assert.equal(m.name, '旅人');
  assert.equal(m.oshi, null);
  assert.equal(m.power, 1);
  assert.deepEqual(m.badges, []);
  assert.equal(m.rarity, 'R');
});

test('buildMeishi: badges disalin (tidak merusak input)', () => {
  const p = { badges: ['a'] };
  buildMeishi(p).badges.push('b');
  assert.deepEqual(p.badges, ['a']);
});

test('MEISHI_RARITIES: 4 tingkat', () => {
  assert.deepEqual(MEISHI_RARITIES, ['R', 'SR', 'SSR', 'UR']);
});
