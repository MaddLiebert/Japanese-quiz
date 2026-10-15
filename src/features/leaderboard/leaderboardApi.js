// ─────────────────────────────────────────────────────────────────────────────
// leaderboardApi.js — akses data papan peringkat via fungsi RPC Supabase
// (SECURITY DEFINER, lihat supabase/schema.sql). Tidak ada state; murni I/O.
// (Namanya diberi akhiran "Api" supaya tidak bentrok case-insensitive dengan
// komponen Leaderboard.jsx di Windows.)
//
// PENGAMAN KUOTA (penting untuk tier GRATIS):
//   • Setiap read lewat CACHE TTL 60 dtk + dedup → buka/ganti tab berulang
//     tidak memicu RPC baru selama data masih segar.
//   • Tiap RPC tetap dihitung ke kuota harian (rateLimit) sebagai jaring kedua.
//   • `force` (tombol Segarkan) melewati cache, tapi tetap dihitung kuota.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseConfigured } from '../sync/supabaseClient';
import { createRequestCache } from '../sync/requestCache';
import { consume } from '../sync/rateLimit';

const clean = (rows) => (Array.isArray(rows) ? rows : []);

// Cache per-sesi tab (dibagi semua pemanggil leaderboard).
const cache = createRequestCache({ ttlMs: 60000 });

const storage = () => {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
};

// Jalankan satu RPC dengan cache + hitung kuota. `force` melewati cache.
const rpcCached = async (key, rpcName, args, { force = false } = {}) => {
  if (!isSupabaseConfigured) return { rows: [], error: 'unconfigured', cached: false };
  const { value, cached } = await cache.run(
    key,
    async () => {
      const quota = consume(storage(), 'read');
      if (!quota.ok) return { data: null, error: { message: 'quota' } };
      return supabase.rpc(rpcName, args);
    },
    { force },
  );
  const error = value?.error ? (value.error.message || String(value.error)) : null;
  return { rows: clean(value?.data), error, cached };
};

export const fetchAllTime = (limit = 100, opts) =>
  rpcCached(`all:${limit}`, 'leaderboard_all_time', { p_limit: limit }, opts);

export const fetchWeekly = (limit = 100, opts) =>
  rpcCached(`week:${limit}`, 'leaderboard_weekly', { p_limit: limit }, opts);

export const fetchMyRank = async (opts) => {
  if (!isSupabaseConfigured) return { rank: null, xp: 0, error: 'unconfigured' };
  const { rows, error } = await rpcCached('myrank', 'my_rank_all_time', undefined, opts);
  const row = rows[0];
  return { rank: row?.rank ?? null, xp: row?.xp ?? 0, error };
};

// Profil publik 訪問 (docs/public-profile.md §8) — profil pemain lain lewat RPC
// ber-whitelist `public_profile(uuid)` (SECURITY DEFINER). Pakai cache TTL 60 dtk
// + kuota read yang SUDAH ADA (rpcCached) — jangan bikin jalur baru.
// Return { row, error, cached }; `row === null` = privat / tidak ada (sengaja
// TIDAK dibedakan — hindari bocor keberadaan akun). Bila pemilik menyalakan
// 「Profil Lengkap」, baris ikut membawa `row.full_data` (whitelist statistik +
// sertifikat N5); lihat docs/public-profile-full.md §8.
export const fetchPublicProfile = async (id, opts) => {
  if (!id) return { row: null, error: null, cached: false };
  const { rows, error, cached } = await rpcCached(`pub:${id}`, 'public_profile', { p_id: id }, opts);
  return { row: rows[0] ?? null, error, cached };
};

// Bersihkan cache (dipakai setelah push lokal supaya peringkat sendiri segar).
export const clearLeaderboardCache = () => cache.clear();

export { rankMedal } from './medals';
