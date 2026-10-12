// ─────────────────────────────────────────────────────────────────────────────
// rateLimit.js — pengaman kuota: batasi jumlah request ke Supabase per hari,
// jeda minimum antar operasi tulis, backoff saat error, dan guard reload-loop.
//
// Tujuan: app GRATISAN (Vercel Hobby + Supabase Free) TIDAK meledak request /
// kuota gara-gara bug atau pemakaian liar. Semua state disimpan di localStorage
// per-perangkat (bukan proteksi keamanan — proteksi BIAYA).
//
// MURNI: `storage`, waktu (`now`), dan RNG (`rand`) disuntik → bisa dites lewat
// `node --test` tanpa browser. Kalau `storage` null (SSR/test), semua lolos
// (fail-open: app tetap jalan, cuma tanpa rem).
// ─────────────────────────────────────────────────────────────────────────────

export const QUOTA_KEY = 'net_quota_v1';
export const RELOAD_KEY = 'sync_reload_guard_v1';

// Batas HARIAN per perangkat — konservatif, jauh di bawah kuota gratis akun,
// tapi longgar untuk pemakaian normal (main kuis seharian).
export const DAILY_LIMIT = {
  write: 300,  // upsert profil (bundle) — ~1 tiap 15 dtk selama 75 menit
  read: 900,   // RPC leaderboard / select profil (dilindungi cache lagi)
  auth: 40,    // sign-in anonim / refresh token
};

// Jeda MINIMUM antar operasi tulis (ms) — cegah burst saat main kuis.
export const MIN_INTERVAL = {
  write: 15000,
  auth: 30000,
};

// Backoff saat gagal beruntun (eksponensial + jitter, dibatasi).
export const BACKOFF_BASE = 15000;        // 15 dtk
export const BACKOFF_MAX = 15 * 60 * 1000; // 15 menit

// Tanggal UTC 'YYYY-MM-DD' — dasar reset harian.
export const dayKey = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

export const emptyQuota = (now = Date.now()) => ({
  day: dayKey(now),
  write: 0,
  read: 0,
  auth: 0,
  lastWrite: 0,
});

// Baca kuota hari ini; otomatis reset kalau tanggal UTC berganti.
export const readQuota = (storage, now = Date.now()) => {
  const fresh = emptyQuota(now);
  if (!storage) return fresh;
  let raw = null;
  try { raw = JSON.parse(storage.getItem(QUOTA_KEY) || 'null'); } catch { raw = null; }
  if (!raw || typeof raw !== 'object' || raw.day !== fresh.day) return fresh;
  return {
    day: fresh.day,
    write: Number(raw.write) || 0,
    read: Number(raw.read) || 0,
    auth: Number(raw.auth) || 0,
    lastWrite: Number(raw.lastWrite) || 0,
  };
};

export const writeQuota = (storage, quota) => {
  if (!storage) return;
  try { storage.setItem(QUOTA_KEY, JSON.stringify(quota)); } catch { /* penuh → lewati */ }
};

// Cek & catat 1 pemakaian. Yang dihitung adalah PERCOBAAN (naik walau request
// gagal) supaya error beruntun tidak jadi celah boros — backoff yang meredamnya.
// Return { ok, reason, remaining, quota }.
export const consume = (storage, kind, now = Date.now(), limits = DAILY_LIMIT) => {
  const quota = readQuota(storage, now);
  const limit = limits?.[kind];
  if (!Number.isFinite(limit)) return { ok: true, reason: null, remaining: Infinity, quota };
  const used = quota[kind] || 0;
  if (used >= limit) return { ok: false, reason: 'quota', remaining: 0, quota };
  quota[kind] = used + 1;
  writeQuota(storage, quota);
  return { ok: true, reason: null, remaining: limit - quota[kind], quota };
};

// Jeda minimum tulis: sisa ms sampai boleh tulis lagi (0 = boleh sekarang).
export const writeCooldown = (storage, now = Date.now(), minMs = MIN_INTERVAL.write) => {
  if (!Number.isFinite(minMs) || minMs <= 0) return 0;
  const quota = readQuota(storage, now);
  const last = quota.lastWrite || 0;
  if (!last) return 0; // belum pernah tulis → tidak ada jeda
  const elapsed = now - last;
  return elapsed >= minMs ? 0 : minMs - elapsed;
};

// Tandai waktu tulis sukses terakhir (mulai hitung jeda minimum lagi).
export const markWrite = (storage, now = Date.now()) => {
  const quota = readQuota(storage, now);
  quota.lastWrite = now;
  writeQuota(storage, quota);
};

// Jeda backoff setelah `failures` kali gagal beruntun (0 = tidak menunda).
export const backoffDelay = (
  failures,
  { base = BACKOFF_BASE, max = BACKOFF_MAX, rand = Math.random } = {},
) => {
  const n = Math.max(0, Math.floor(Number(failures) || 0));
  if (n <= 0) return 0;
  const exp = Math.min(max, base * 2 ** (n - 1));
  const jitter = 0.8 + rand() * 0.4; // ±20% → hindari thundering herd
  return Math.round(Math.min(max, exp * jitter));
};

// Guard reload-loop: hanya boleh reload kalau sudah lewat `minGapMs` sejak
// reload terakhir. Mencegah badai request kalau merge salah menandai "remote".
export const canReload = (storage, now = Date.now(), minGapMs = 60000) => {
  if (!storage) return true;
  const last = Number(storage.getItem(RELOAD_KEY)) || 0;
  if (!last) return true; // belum pernah reload → boleh
  return now - last >= minGapMs;
};

export const markReload = (storage, now = Date.now()) => {
  if (!storage) return;
  try { storage.setItem(RELOAD_KEY, String(now)); } catch { /* noop */ }
};

// Ringkasan pemakaian untuk UI (Settings).
export const quotaSummary = (storage, now = Date.now(), limits = DAILY_LIMIT) => {
  const q = readQuota(storage, now);
  const pick = (kind) => {
    const limit = limits?.[kind] ?? Infinity;
    const used = q[kind] || 0;
    return { used, limit, remaining: Math.max(0, limit - used) };
  };
  return { day: q.day, write: pick('write'), read: pick('read'), auth: pick('auth') };
};

export default consume;
