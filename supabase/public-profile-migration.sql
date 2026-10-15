-- ═══════════════════════════════════════════════════════════════════════════
-- Migrasi: Profil Publik 訪問 + Profil LENGKAP 訪問
--   (docs/public-profile.md §5, docs/public-profile-full.md §5)
-- Buka file INI → Ctrl+A (di dalam file ini saja) → copy → tempel ke
-- Supabase → SQL Editor → Run. Aman diulang (idempoten).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Kolom dasar: profil publik (opt-in). Default TERTUTUP.
alter table public.profiles add column if not exists is_public boolean not null default false;

-- 1b) Kolom BARU: profil LENGKAP (opt-in TERPISAH). Default TERTUTUP.
--     Menyalakan ini membuka statistik rinci (winrate, radar, badge, sertifikat
--     N5) DAN implisit menyalakan data dasar. Pemain lama yang hanya is_public
--     TIDAK ikut terbuka — mereka opt-in ulang lewat sakelar terpisah.
alter table public.profiles add column if not exists is_full_public boolean not null default false;

-- 2) RPC ber-whitelist kolom. SECURITY DEFINER (tembus RLS) tapi hanya
--    mengekspos kolom aman — JANGAN select p.* (bocorkan bundle data/email).
--    Baris keluar bila is_public/is_full_public = true ATAU milik sendiri.
--    `full` = NULL kecuali profil lengkap menyala → isinya WHITELIST ketat.
--    DROP dulu: create or replace tak bisa mengubah tipe return (kolom baru).
drop function if exists public.public_profile(uuid);

create or replace function public.public_profile(p_id uuid)
returns table (id uuid, display_name text, avatar text, xp int, level int,
               streak int, accuracy numeric, updated_at timestamptz, full_data jsonb)
language sql
security definer
set search_path = public
as $$
  select
    p.id, p.display_name, p.avatar, p.xp, p.level, p.streak, p.accuracy, p.updated_at,
    case when p.is_full_public is true or p.id = auth.uid() then
      jsonb_build_object(
        'winRate',       coalesce((p.data->'progress'->>'weightedWinRate')::numeric, 0),
        'totalAnswered', coalesce((p.data->'progress'->>'totalAnswered')::int, 0),
        'totalCorrect',  coalesce((p.data->'progress'->>'totalCorrect')::int, 0),
        'maxStreak',     coalesce((p.data->'progress'->>'maxStreak')::int, 0),
        'accuracy',      coalesce((p.data->'progress'->>'accuracy')::numeric, 0),
        'matchesPlayed', coalesce((p.data->'progress'->>'matchesPlayed')::int, 0),
        'n5Exam',        coalesce(p.data->'progress'->'n5Exam', '{}'::jsonb),
        'selectedBadges',coalesce(p.data->'selectedBadges', '[]'::jsonb),
        'achievements',  coalesce(p.data->'achievements', '[]'::jsonb),
        -- Peta status item saja (id→status) untuk radar penguasaan materi.
        'itemStatus',    coalesce(
          (select jsonb_object_agg(kv.key, kv.value->'status')
           from jsonb_each(coalesce(p.data->'itemProgress', '{}'::jsonb)) as kv
           where kv.value->>'status' is not null),
          '{}'::jsonb)
      )
    else null end
  from public.profiles p
  where p.id = p_id
    and (p.is_public = true or p.is_full_public = true or p.id = auth.uid());
$$;

-- 3) Beri izin ke role API (anon untuk halaman yang bisa dibuka tanpa login).
grant execute on function public.public_profile(uuid) to anon, authenticated;

-- Verifikasi (jalankan terpisah, harus balik 0 baris):
--   select * from public.public_profile('00000000-0000-0000-0000-000000000000');
