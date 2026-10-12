// ─────────────────────────────────────────────────────────────────────────────
// leaderboardApi.js — akses data papan peringkat via fungsi RPC Supabase
// (SECURITY DEFINER, lihat supabase/schema.sql). Tidak ada state; murni I/O.
// (Namanya diberi akhiran "Api" supaya tidak bentrok case-insensitive dengan
// komponen Leaderboard.jsx di Windows.)
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseConfigured } from '../sync/supabaseClient';

const clean = (rows) => (Array.isArray(rows) ? rows : []);

export const fetchAllTime = async (limit = 100) => {
  if (!isSupabaseConfigured) return { rows: [], error: 'unconfigured' };
  const { data, error } = await supabase.rpc('leaderboard_all_time', { p_limit: limit });
  return { rows: clean(data), error: error ? error.message : null };
};

export const fetchWeekly = async (limit = 100) => {
  if (!isSupabaseConfigured) return { rows: [], error: 'unconfigured' };
  const { data, error } = await supabase.rpc('leaderboard_weekly', { p_limit: limit });
  return { rows: clean(data), error: error ? error.message : null };
};

export const fetchMyRank = async () => {
  if (!isSupabaseConfigured) return { rank: null, xp: 0, error: 'unconfigured' };
  const { data, error } = await supabase.rpc('my_rank_all_time');
  const row = clean(data)[0];
  return { rank: row?.rank ?? null, xp: row?.xp ?? 0, error: error ? error.message : null };
};

export { rankMedal } from './medals';
