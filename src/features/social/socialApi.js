// ─────────────────────────────────────────────────────────────────────────────
// socialApi.js — akses data 友達 TOMODACHI lewat RPC Supabase
// (SECURITY DEFINER, lihat supabase/friends-migration.sql). Murni I/O.
//
// PENGAMAN KUOTA (pola SAMA dengan leaderboardApi.js — jangan bikin jalur baru):
//   • READ  → cache TTL 60 dtk + dedup + kuota `consume('read')`.
//   • WRITE (follow/accept/unfollow) → kuota `consume('write')` + jeda min tulis.
//   • Backend belum dikonfigurasi → return { error: 'unconfigured' } (bukan crash).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseConfigured } from '../sync/supabaseClient';
import { createRequestCache } from '../sync/requestCache';
import { consume, createTapGuard } from '../sync/rateLimit';

const clean = (rows) => (Array.isArray(rows) ? rows : []);

// Cache per-sesi tab (dibagi semua pemanggil sosial). Di-clear setelah aksi tulis.
const cache = createRequestCache({ ttlMs: 60000 });

// Anti-double-tap per-target: tap GANDA ke target sama dalam 1,2 dtk ditolak,
// tapi target BERBEDA selalu boleh (follow beruntun itu wajar). Rem 15 dtk
// milik bundle sync TIDAK dipakai di sini.
const taps = createTapGuard();

const storage = () => {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
};

// Satu RPC read dengan cache + kuota. `force` melewati cache (tetap dihitung kuota).
// Return `data` MENTAH (bisa array tabel ATAU skalar spt text dari my_friend_code).
const rpcRead = async (key, rpcName, args, { force = false } = {}) => {
  if (!isSupabaseConfigured) return { data: null, error: 'unconfigured', cached: false };
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
  return { data: value?.data ?? null, error, cached };
};

// RPC read yang mengembalikan TABEL → selalu array.
const rpcReadRows = async (key, rpcName, args, opts) => {
  const { data, error, cached } = await rpcRead(key, rpcName, args, opts);
  return { rows: clean(data), error, cached };
};

// Satu RPC tulis: anti-double-tap per-target + kuota write. Return { data, error }.
const rpcWrite = async (rpcName, args, tapKey) => {
  if (!isSupabaseConfigured) return { data: null, error: 'unconfigured' };
  const s = storage();
  // Kunci anti-double-tap: target + nama RPC (respond/unfollow ke target sama
  // tetap dihitung aksi berbeda karena rpcName beda).
  if (!taps.allow(`${rpcName}:${tapKey ?? args?.p_target ?? args?.p_requester ?? ''}`)) {
    return { data: null, error: 'cooldown' };
  }
  const quota = consume(s, 'write');
  if (!quota.ok) return { data: null, error: 'quota' };
  try {
    const { data, error } = await supabase.rpc(rpcName, args);
    if (error) return { data: null, error: error.message || String(error) };
    cache.clear(); // state hubungan berubah → buang cache supaya segar
    return { data, error: null };
  } catch (e) {
    return { data: null, error: String(e?.message || e) };
  }
};

// ── Read ────────────────────────────────────────────────────────────────────
// Kode teman sendiri (6 digit). RPC skalar → PostgREST balas nilai LANGSUNG
// (bukan array). Tangani skalar, array-1-baris, dan null.
export const fetchFriendCode = async (opts) => {
  const { data, error } = await rpcRead('mycode', 'my_friend_code', undefined, opts);
  const raw = Array.isArray(data) ? (data[0] ?? null) : data;
  const code = typeof raw === 'string' ? raw : (raw?.my_friend_code ?? raw ?? null);
  return { code: code ? String(code) : null, error };
};

// Cari pemain: kode 6 digit (tepat, siapa pun) ATAU nama (hanya profil publik).
export const searchPlayers = async (q, opts) => {
  const query = String(q || '').trim();
  if (query.length < 2) return { rows: [], error: null, cached: false };
  return rpcReadRows(`search:${query}`, 'search_players', { p_q: query }, opts);
};

// Kartu minimal (nama/avatar/level + state) untuk SEMUA id — kasus profil privat.
export const fetchPlayerCard = async (id, opts) => {
  if (!id) return { row: null, error: null, cached: false };
  const { rows, error, cached } = await rpcReadRows(`card:${id}`, 'player_card', { p_id: id }, opts);
  return { row: rows[0] ?? null, error, cached };
};

// Semua hubungan sendiri (teman/following/follower/permintaan masuk & keluar).
export const fetchConnections = (opts) =>
  rpcReadRows('connections', 'list_connections', undefined, opts);

// ── Write ───────────────────────────────────────────────────────────────────
// Follow (publik, langsung) ATAU minta pertemanan (privat, pending). Return state baru.
export const requestFollow = (id) => rpcWrite('request_follow', { p_target: id });

// Terima (accept → saling follow) / tolak permintaan masuk.
export const respondFollow = (requesterId, accept) =>
  rpcWrite('respond_follow', { p_requester: requesterId, p_accept: Boolean(accept) });

// Berhenti follow. `both` = hapus dua arah (bubarkan pertemanan).
export const unfollow = (id, both = false) =>
  rpcWrite('unfollow', { p_target: id, p_both: Boolean(both) });

export const clearSocialCache = () => cache.clear();

export default fetchConnections;
