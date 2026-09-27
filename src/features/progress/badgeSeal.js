// Logika murni perlakuan "legendaris" untuk badge langka — tanpa React/JSX,
// supaya bisa diuji dengan `node --test`. Dekorasi visualnya ada di BadgeSeal.jsx.

// ID badge yang dapat perlakuan legendaris (kilau emas + denyut).
// 満 (N5 満点 180/180) = paling langka di aplikasi.
export const LEGENDARY_BADGES = new Set(['n5_kanpeki']);

export const isLegendary = (id) => LEGENDARY_BADGES.has(id);

// Kelas lingkaran badge: legendaris → emas + animasi (overflow terlihat untuk
// cincin/percikan); biasa → shu (merah cap) dengan isi terpotong rapi.
export const badgeCircleClass = (id) =>
  isLegendary(id)
    ? 'badge-legendary overflow-visible border-[5px]'
    : 'border-shu text-shu overflow-hidden border-[5px]';
