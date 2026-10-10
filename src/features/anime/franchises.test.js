// franchises.test.js — penjaga modul murni A15 世界選択 (features/anime/franchises.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A15. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FRANCHISES, FRANCHISE_MOTIFS, FRANCHISE_MIN_LEVEL, franchiseById,
  canBuyFranchise, addFranchise, franchiseTokens, equipFranchise,
  ownsFranchise, validateFranchises,
} from './franchises.js';

const rich = { level: 150, medaru: 9000, ownedFranchises: [] };

test('franchiseById: dikenal → objek; tak dikenal → null', () => {
  assert.equal(franchiseById('hoshi').kanji, '星の旅人');
  assert.equal(franchiseById('nope'), null);
});

test('canBuyFranchise: boleh saat level ≥150, belum punya, medaru cukup', () => {
  assert.equal(canBuyFranchise(rich, 'hoshi'), true);
});

test('canBuyFranchise: level <150 → false', () => {
  assert.equal(canBuyFranchise({ ...rich, level: 149 }, 'hoshi'), false);
});

test('canBuyFranchise: sudah punya → false (tidak bisa beli dobel)', () => {
  assert.equal(canBuyFranchise({ ...rich, ownedFranchises: ['hoshi'] }, 'hoshi'), false);
});

test('canBuyFranchise: medaru kurang → false', () => {
  assert.equal(canBuyFranchise({ ...rich, medaru: 100 }, 'hoshi'), false);
});

test('canBuyFranchise: franchise tak dikenal → false', () => {
  assert.equal(canBuyFranchise(rich, 'nope'), false);
});

test('addFranchise: menambah & idempoten (immutable)', () => {
  const a = addFranchise(rich, 'hoshi');
  assert.deepEqual(a.ownedFranchises, ['hoshi']);
  assert.deepEqual(rich.ownedFranchises, [], 'tidak merusak state asli');
  const b = addFranchise(a, 'hoshi');
  assert.equal(b, a, 'idempoten: sudah punya → state sama');
});

test('addFranchise: id tak dikenal → state tak berubah', () => {
  assert.equal(addFranchise(rich, 'nope'), rich);
});

test('franchiseTokens: fr1/fr2/motif; tak dikenal → null', () => {
  assert.deepEqual(franchiseTokens('kishin'), { fr1: '#b23a3a', fr2: '#f0c862', motif: 'gear' });
  assert.equal(franchiseTokens('nope'), null);
});

test('equipFranchise: hanya bila dimiliki', () => {
  const owned = addFranchise(rich, 'hoshi');
  assert.equal(equipFranchise(owned, 'hoshi').activeFranchise, 'hoshi');
  // belum dimiliki → tidak berubah
  assert.equal(equipFranchise(rich, 'hoshi').activeFranchise, undefined);
  assert.equal(equipFranchise(rich, 'nope').activeFranchise, undefined);
});

test('ownsFranchise: cek kepemilikan', () => {
  const owned = addFranchise(rich, 'kage');
  assert.equal(ownsFranchise(owned, 'kage'), true);
  assert.equal(ownsFranchise(owned, 'hoshi'), false);
});

test('bank: valid semua (fr1/fr2 hex, motif dikenal, pool ≥2, harga >0)', () => {
  assert.deepEqual(validateFranchises(FRANCHISES), []);
});

test('validateFranchises: menangkap data rusak', () => {
  assert.ok(validateFranchises([{ id: 'x', kanji: 'X', name: 'X', genre_id: 'g', price: 0, fr1: 'red', fr2: '#ffffff', motif: 'star', pool: ['a'] }]).length > 0);
  assert.ok(validateFranchises([{ id: 'y', kanji: 'Y', name: 'Y', genre_id: 'g', price: 100, fr1: '#000000', fr2: '#ffffff', motif: 'nope', pool: ['a', 'b'] }]).some((e) => e.includes('motif')));
});

test('bank: id unik & tiap motif bank ada di daftar motif', () => {
  const ids = FRANCHISES.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const f of FRANCHISES) assert.ok(FRANCHISE_MOTIFS.includes(f.motif));
});

test('gerbang: FRANCHISE_MIN_LEVEL = 150 (sinkron dengan era 多元)', () => {
  assert.equal(FRANCHISE_MIN_LEVEL, 150);
});

test('hak cipta §6.4: tidak ada nama IP nyata di data franchise', () => {
  const terlarang = ['jujutsu', 'jjk', 'gojo', 'sukuna', 'naruto', 'one piece', 'onepiece', 'dragon ball', 'dragonball', 'bleach', 'onepunch', 'attack on titan'];
  const blob = JSON.stringify(FRANCHISES).toLowerCase();
  const found = terlarang.filter((n) => blob.includes(n));
  assert.deepEqual(found, [], `IP berhak cipta ditemukan: ${found.join(', ')}`);
});
