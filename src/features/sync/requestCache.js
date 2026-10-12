// ─────────────────────────────────────────────────────────────────────────────
// requestCache.js — cache TTL + dedup in-flight untuk request READ.
//
// Kenapa: tiap buka halaman leaderboard / ganti tab / balik ke halaman memicu
// RPC lagi. Tanpa cache, itu request berulang yang membakar kuota & bandwidth.
// Cache ini: (1) menyajikan hasil < TTL ms tanpa request, (2) menggabungkan
// request paralel dengan key sama jadi SATU request (dedup).
//
// MURNI: `now` disuntik → bisa dites `node --test`. In-memory per sesi tab.
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_TTL_MS = 60000; // 1 menit

export const createRequestCache = ({ ttlMs = DEFAULT_TTL_MS, now = () => Date.now() } = {}) => {
  const store = new Map();    // key → { at, value }
  const inflight = new Map(); // key → Promise

  // Jalankan fn() dengan cache. `force` = abaikan cache (mis. tombol Segarkan).
  // Return { value, cached, deduped }.
  const run = async (key, fn, { force = false } = {}) => {
    const t = now();
    if (!force) {
      const hit = store.get(key);
      if (hit && t - hit.at < ttlMs) return { value: hit.value, cached: true, deduped: false };
    }
    if (inflight.has(key)) {
      return { value: await inflight.get(key), cached: false, deduped: true };
    }
    const p = Promise.resolve().then(fn);
    inflight.set(key, p);
    try {
      const value = await p;
      store.set(key, { at: now(), value });
      return { value, cached: false, deduped: false };
    } finally {
      inflight.delete(key);
    }
  };

  // Umur entri cache (ms); Infinity kalau belum ada.
  const age = (key) => {
    const hit = store.get(key);
    return hit ? now() - hit.at : Infinity;
  };

  const peek = (key) => store.get(key)?.value;

  const clear = () => { store.clear(); };

  return { run, age, peek, clear, size: () => store.size };
};

export default createRequestCache;
