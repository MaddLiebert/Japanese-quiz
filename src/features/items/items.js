// ─────────────────────────────────────────────────────────────────────────────
// Barang konsumsi (bukan pack). Dibeli di Shop, disimpan di inventory (ownedItems).
// Helper di bawah murni (tanpa React) supaya bisa dites dengan `node --test`.
// Nama & deskripsi punya versi ID (name/desc) + EN (name_en/desc_en).
// ─────────────────────────────────────────────────────────────────────────────

export const SHOP_ITEMS = [
  { id: 'kopi_kaleng', icon: '☕', name: 'Kopi Kaleng Boss', name_en: 'Boss Canned Coffee', desc: 'EXP x2 (30 Menit)', desc_en: '2× EXP (30 Min)', price: 500 },
  { id: 'selotip_kaset', icon: '📼', name: 'Selotip Kaset', name_en: 'Cassette Tape', desc: 'Sambung Streak Putus', desc_en: 'Repair Broken Streak', price: 1200 },
  { id: 'kabel_jumper', icon: '🔌', name: 'Kabel Jumper', name_en: 'Jumper Cable', desc: '1x Hidup (Death Quiz)', desc_en: '1× Revive (Death Quiz)', price: 800 },
];

export const getItem = (id) => SHOP_ITEMS.find((i) => i.id === id) || null;

// Pilih nama/desc sesuai bahasa UI ('id' → nama Indonesia, selain itu EN).
export const itemName = (item, language) =>
  (language === 'id' ? item.name : (item.name_en || item.name));
export const itemDesc = (item, language) =>
  (language === 'id' ? item.desc : (item.desc_en || item.desc));

// Tambah qty. Return objek BARU (immutable — aman untuk state React).
export const addItem = (inventory, id, qty = 1) => {
  if (!id || qty <= 0) return inventory || {};
  const inv = inventory || {};
  return { ...inv, [id]: (inv[id] || 0) + qty };
};

// Kurangi qty. Qty habis → key dihapus (bukan disimpan sebagai 0).
export const removeItem = (inventory, id, qty = 1) => {
  const inv = inventory || {};
  const now = (inv[id] || 0) - qty;
  if (now > 0) return { ...inv, [id]: now };
  const next = { ...inv };
  delete next[id];
  return next;
};

// Total qty seluruh barang.
export const countItems = (inventory) =>
  Object.values(inventory || {}).reduce((sum, n) => sum + (n > 0 ? n : 0), 0);

// Daftar barang qty>0, urut sesuai urutan SHOP_ITEMS, lengkap metadata.
export const inventoryList = (inventory) => {
  const inv = inventory || {};
  return SHOP_ITEMS
    .filter((i) => (inv[i.id] || 0) > 0)
    .map((i) => ({ ...i, qty: inv[i.id] }));
};
