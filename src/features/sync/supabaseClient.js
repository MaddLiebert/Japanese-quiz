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
        // Anonim → tidak ada redirect OAuth; deteksi sesi di URL tidak perlu.
        detectSessionInUrl: false,
      },
    })
  : null;

export default supabase;
