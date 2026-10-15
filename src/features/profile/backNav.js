// backNav.js — aturan tombol "kembali" untuk halaman /u/:id.
//
// MASALAH YANG DIPERBAIKI: tombol 「← Papan Peringkat」 dulu memakai
// navigate('/leaderboard') yang PUSH entri baru. Riwayat jadi:
//   /leaderboard → /u/A → /leaderboard → /u/A → ...
// sehingga tombol back browser memantul maju-mundur (loop).
//
// ATURAN: kalau ada entri sebelumnya DI DALAM SPA (react-router menandai ini
// dengan history.state.idx > 0), pakai navigate(-1) supaya benar-benar mundur.
// Kalau halaman dibuka langsung dari tautan bersama (idx 0/undefined, tak ada
// riwayat SPA), JANGAN push — pakai replace ke papan peringkat supaya riwayat
// tetap bersih.

// `state` = window.history.state (bisa null). `idx` = indeks entri react-router
// dalam riwayat SPA; 0/absen = ini entri pertama SPA.
export const shouldGoBack = (state) => {
  const idx = state && typeof state === 'object' ? state.idx : undefined;
  return typeof idx === 'number' && idx > 0;
};

// Dipanggil komponen: mundur bila mungkin, kalau tidak replace ke `fallback`.
export const goBackOr = (navigate, fallback = '/leaderboard') => {
  const state = typeof window !== 'undefined' ? window.history.state : null;
  if (shouldGoBack(state)) navigate(-1);
  else navigate(fallback, { replace: true });
};
