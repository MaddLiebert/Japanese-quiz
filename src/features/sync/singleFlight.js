// ─────────────────────────────────────────────────────────────────────────────
// singleFlight.js — jalankan satu fungsi async PALING BANYAK satu kali bersamaan.
//
// Kenapa perlu: pembuatan akun anonim (`signInAnonymously`) TIDAK idempoten —
// tiap panggilan membuat USER BARU. React StrictMode (dev) men-mount efek dua
// kali, dan user bisa menekan tombol dua kali cepat. Tanpa penjaga, dua
// panggilan bersamaan = dua akun = dua baris di leaderboard.
//
// MURNI (tanpa React / tanpa jaringan) → bisa dites lewat `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

// Bungkus `fn`; panggilan selama `fn` masih berjalan berbagi Promise yang sama.
// Setelah selesai (sukses ATAU gagal) penjaga dilepas supaya bisa dicoba lagi.
export const createSingleFlight = (fn) => {
  let inflight = null;
  const run = (...args) => {
    if (inflight) return inflight;
    inflight = Promise.resolve()
      .then(() => fn(...args))
      .finally(() => { inflight = null; });
    return inflight;
  };
  run.isRunning = () => inflight != null;
  return run;
};

export default createSingleFlight;
