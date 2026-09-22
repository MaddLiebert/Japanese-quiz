import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHOP_ITEMS,
  getItem,
  addItem,
  removeItem,
  countItems,
  inventoryList,
} from './items.js';

test('SHOP_ITEMS punya 3 barang generik dengan id unik', () => {
  assert.equal(SHOP_ITEMS.length, 3);
  const ids = SHOP_ITEMS.map((i) => i.id);
  assert.equal(new Set(ids).size, 3);
  for (const item of SHOP_ITEMS) {
    assert.ok(item.id && item.icon && item.name && item.desc, `field kurang di ${item.id}`);
    assert.equal(typeof item.price, 'number');
  }
});

test('getItem mengembalikan item atau null', () => {
  assert.equal(getItem('kopi_kaleng')?.price, 500);
  assert.equal(getItem('tidak_ada'), null);
});

test('addItem menambah qty dan tidak memutasi objek lama', () => {
  const inv = {};
  const a = addItem(inv, 'kopi_kaleng');
  const b = addItem(a, 'kopi_kaleng', 2);
  assert.deepEqual(inv, {}, 'objek lama tidak boleh berubah');
  assert.equal(a.kopi_kaleng, 1);
  assert.equal(b.kopi_kaleng, 3);
});

test('removeItem mengurangi, menghapus saat 0, dan tidak pernah negatif', () => {
  const inv = { kopi_kaleng: 2, kabel_jumper: 1 };
  const a = removeItem(inv, 'kopi_kaleng');
  assert.equal(a.kopi_kaleng, 1);
  const b = removeItem(a, 'kopi_kaleng', 5);
  assert.equal(b.kopi_kaleng, undefined, 'qty 0 harus dihapus dari objek');
  assert.equal(inv.kopi_kaleng, 2, 'objek lama tidak boleh berubah');
  assert.ok(!Object.values(b).some((v) => v < 0));
});

test('countItems menjumlahkan seluruh qty', () => {
  assert.equal(countItems({}), 0);
  assert.equal(countItems(null), 0);
  assert.equal(countItems({ a: 2, b: 3 }), 5);
});

test('inventoryList hanya item qty>0, lengkap dengan metadata', () => {
  const list = inventoryList({ kopi_kaleng: 2, kabel_jumper: 0, selotip_kaset: 1 });
  assert.deepEqual(list.map((i) => i.id), ['kopi_kaleng', 'selotip_kaset']);
  assert.equal(list[0].qty, 2);
  assert.equal(list[0].name, 'Kopi Kaleng Boss');
  assert.deepEqual(inventoryList({}), []);
});
