// ─────────────────────────────────────────────────────────────────────────────
// Barang konsumsi (bukan pack). Dibeli di Shop, disimpan di inventory (ownedItems).
// Helper di bawah murni (tanpa React) supaya bisa dites dengan `node --test`.
// Nama & deskripsi punya versi ID (name/desc) + EN (name_en/desc_en).
//
// Tema Heian 平安 (era #1): nama & deskripsi tampil versi KANA (name_heian/
// desc_heian) — pemain belum bisa kanji. Era lain tetap pakai ID/EN.
// PENTING: `id` = KUNCI SAVE (progress.ownedItems) — JANGAN pernah diubah;
// hanya teks TAMPILAN yang berganti per era.
// ─────────────────────────────────────────────────────────────────────────────

export const SHOP_ITEMS = [
  {
    id: 'kopi_kaleng', icon: 'coffee',
    name: 'Kopi Kaleng Boss', name_en: 'Boss Canned Coffee',
    name_heian: 'めざましのおちゃ',
    desc: 'EXP x2 (30 Menit)', desc_en: '2× EXP (30 Min)',
    desc_heian: 'けいけん 2ばい・30ぷん',
    price: 500,
  },
  {
    id: 'selotip_kaset', icon: 'cassette',
    name: 'Selotip Kaset', name_en: 'Cassette Tape',
    name_heian: 'つなぎのいと',
    desc: 'Sambung Streak Putus', desc_en: 'Repair Broken Streak',
    desc_heian: 'きれた れんぞく を つなぐ',
    price: 1200,
  },
  {
    id: 'kabel_jumper', icon: 'plug',
    name: 'Kabel Jumper', name_en: 'Jumper Cable',
    name_heian: 'いのちのおふだ',
    desc: '1x Hidup (Death Quiz)', desc_en: '1× Revive (Death Quiz)',
    desc_heian: 'いちど いきかえる',
    price: 800,
  },
];

export const getItem = (id) => SHOP_ITEMS.find((i) => i.id === id) || null;

// Era Heian → teks kana (flavor), era lain → teks sekarang (ID/EN).
const HEIAN = 'heian';

// Pilih nama/desc: Heian pakai versi kana; selain itu 'id' → Indonesia, EN → EN.
export const itemName = (item, language, era) =>
  (era === HEIAN
    ? (item.name_heian || item.name)
    : (language === 'id' ? item.name : (item.name_en || item.name)));
export const itemDesc = (item, language, era) =>
  (era === HEIAN
    ? (item.desc_heian || item.desc)
    : (language === 'id' ? item.desc : (item.desc_en || item.desc)));

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
