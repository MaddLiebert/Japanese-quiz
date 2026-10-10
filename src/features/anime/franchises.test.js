// franchises.test.js — penjaga modul murni A15 世界選択 (features/anime/franchises.js).
// Lihat SPEC: docs/tema/anime-mekanik.md §A15. Modul TANPA React/DOM → `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FRANCHISES, FRANCHISE_MOTIFS, FRANCHISE_MIN_LEVEL, FRANCHISE_STATUSES, FRANCHISE_NUANCES,
  franchiseById, isFranchiseComingSoon, isFranchiseLicensed,
  canBuyFranchise, addFranchise, franchiseTokens, franchiseNuance, equipFranchise,
  ownsFranchise, validateFranchises,
} from './franchises.js';

const rich = { level: 150, medaru: 9000, ownedFranchises: [] };
const tycoon = { level: 150, medaru: 30000, ownedFranchises: [] };

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

// ── REVISI §6.4: dunia ORISINAL tetap fiktif; dunia LISENSI boleh IP nyata
//    ASAL ber-kredit (atribusi = mitigasi hak cipta). ────────────────────────
test('§6.4 (orisinal): dunia TANPA flag licensed bebas dari nama IP nyata', () => {
  const terlarang = ['jujutsu', 'jjk', 'gojo', 'sukuna', 'naruto', 'one piece', 'onepiece', 'dragon ball', 'dragonball', 'bleach', 'onepunch', 'attack on titan', 'jojo'];
  const orisinal = FRANCHISES.filter((f) => !f.licensed);
  const blob = JSON.stringify(orisinal).toLowerCase();
  const found = terlarang.filter((n) => blob.includes(n));
  assert.deepEqual(found, [], `IP berhak cipta di dunia orisinal: ${found.join(', ')}`);
});

test('§6.4 (lisensi): tiap dunia licensed WAJIB punya credit + status sah', () => {
  for (const f of FRANCHISES.filter((x) => x.licensed)) {
    assert.ok(typeof f.credit === 'string' && f.credit.trim(), `${f.id}: credit wajib ada`);
    assert.ok(FRANCHISE_STATUSES.includes(f.status), `${f.id}: status '${f.status}' tak sah`);
  }
});

test('JJK live: dunia besar (harga ~20k) & bisa dibeli bila medaru cukup', () => {
  const jjk = franchiseById('jjk');
  assert.ok(jjk, 'dunia jjk ada');
  assert.equal(jjk.licensed, true);
  assert.equal(jjk.status, 'live');
  assert.ok(jjk.price >= 20000, 'tier harga dunia besar');
  assert.equal(isFranchiseLicensed('jjk'), true);
  assert.equal(isFranchiseComingSoon('jjk'), false);
  // medaru 9000 tak cukup; 30000 cukup.
  assert.equal(canBuyFranchise(rich, 'jjk'), false);
  assert.equal(canBuyFranchise(tycoon, 'jjk'), true);
});

test('coming soon: One Piece & JoJo = teaser, TIDAK bisa dibeli', () => {
  for (const id of ['onepiece', 'jojo']) {
    assert.equal(isFranchiseComingSoon(id), true, `${id}: coming soon`);
    assert.equal(canBuyFranchise(tycoon, id), false, `${id}: tidak bisa dibeli`);
    assert.equal(franchiseById(id).status, 'soon');
  }
  assert.equal(isFranchiseComingSoon('hoshi'), false);
  assert.equal(isFranchiseComingSoon('nope'), false);
});

// ── NUANSA DUNIA (LAPIS 2 → data-franchise-nuance) ──────────────────────────
test('nuance: JJK = "cursed" (呪力), dunia lain tak ber-nuansa', () => {
  assert.equal(franchiseNuance('jjk'), 'cursed');
  assert.equal(franchiseById('jjk').nuance, 'cursed');
  assert.equal(franchiseNuance('hoshi'), null);
  assert.equal(franchiseNuance('nope'), null);
});

test('nuance: tiap nuance bank ada di daftar FRANCHISE_NUANCES (CSS punya pasangan)', () => {
  for (const f of FRANCHISES) {
    if (f.nuance) assert.ok(FRANCHISE_NUANCES.includes(f.nuance), `${f.id}: nuance '${f.nuance}' tak dikenal`);
  }
});

test('validateFranchises: menangkap nuance tak dikenal', () => {
  const bad = [{ id: 'x', kanji: 'X', name: 'X', genre_id: 'g', price: 100, fr1: '#000000', fr2: '#ffffff', motif: 'star', pool: ['a', 'b'], nuance: 'nope' }];
  assert.ok(validateFranchises(bad).some((e) => e.includes('nuance')));
});
