// ─────────────────────────────────────────────────────────────────────────────
// supabaseClient.js — satu instance Supabase (atau null kalau belum dikonfigurasi).
//
// Kredensial dari env Vite (aman ditaruh di frontend):
//   VITE_SUPABASE_URL       = https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY  = eyJ...
// Lihat `.env.example`. Kalau salah satu kosong → `supabase = null` dan seluruh
// fitur sync/leaderboard dinonaktifkan dengan mulus (app tetap jalan offline).
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.VITE_SUPABASE_URL;
const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // WAJIB true untuk login Google (OAuth): token balik lewat URL
        // (?code=… / #access_token=…). Kalau false, client tak pernah membaca
        // hasil redirect → login Google gagal (penyebab dulu fitur ini dibuang).
        // Untuk alur email+password & anonim: tak ada parameter di URL → no-op.
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;

export default supabase;
