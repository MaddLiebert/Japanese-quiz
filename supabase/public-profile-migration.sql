-- ═══════════════════════════════════════════════════════════════════════════
-- Migrasi: Profil Publik 訪問 (docs/public-profile.md §5)
-- Buka file INI → Ctrl+A (di dalam file ini saja) → copy → tempel ke
-- Supabase → SQL Editor → Run. Aman diulang (idempoten).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Kolom baru: profil publik (opt-in). Default TERTUTUP.
alter table public.profiles add column if not exists is_public boolean not null default false;

-- 2) RPC ber-whitelist kolom. SECURITY DEFINER (tembus RLS) tapi hanya
--    mengekspos kolom aman — JANGAN select p.* (bocorkan bundle data/email).
--    Baris keluar hanya bila is_public = true ATAU milik sendiri.
create or replace function public.public_profile(p_id uuid)
returns table (id uuid, display_name text, avatar text, xp int, level int,
               streak int, accuracy numeric, updated_at timestamptz)
language sql security definer set search_path = public
as $$
  select p.id, p.display_name, p.avatar, p.xp, p.level, p.streak, p.accuracy, p.updated_at
  from public.profiles p
  where p.id = p_id and (p.is_public = true or p.id = auth.uid());
$$;

-- 3) Beri izin ke role API (anon untuk halaman yang bisa dibuka tanpa login).
grant execute on function public.public_profile(uuid) to anon, authenticated;

-- Verifikasi (jalankan terpisah, harus balik 0 baris):
--   select * from public.public_profile('00000000-0000-0000-0000-000000000000');
