// printshop.js — M14 印刷所 (ruang "pabrik" app). Modul MURNI. Easter egg.
// Susun sesuatu tepat → masuk 印刷所 gelap: mesin berjalan, tumpukan halaman
// setengah jadi, sisa era lain (Heian belum dicetak, layout Edo dibuang), dan
// satu halaman bertanggal masa depan (cyberpunk).
// Spec: docs/tema/meiji-mekanik.md §M14.

export const PRINT_SHOP_ARTIFACTS = [
  { id: 'heian',  jp: '平安 — 未印刷', id_text: 'Heian — belum dicetak' },
  { id: 'edo',    jp: '江戸 — 破棄',   id_text: 'Edo — dibuang' },
  { id: 'future', jp: '??? — 電脳',    id_text: '??? — Cyberpunk' },
];

// Kondisi easter egg: era Meiji + sudah menyusun beberapa edisi (typesetting
// benar ≥ 5) + minimal level 50. Deterministik dari progress.
export const PRINT_SHOP_MIN_EDITION = 5;

export const isPrintShopUnlocked = (progress = {}) => {
  const era = progress.era || 'heian';
  const level = Number(progress.level) || 0;
  const editions = Number(progress.editionsPrinted) || 0;
  return era === 'meiji' && level >= 50 && editions >= PRINT_SHOP_MIN_EDITION;
};

export const artifactById = (id) => PRINT_SHOP_ARTIFACTS.find((a) => a.id === id) || null;

export default isPrintShopUnlocked;
