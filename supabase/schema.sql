-- ═══════════════════════════════════════════════════════════════════════════
-- Nihongo Gakuen — Skema Supabase (sync progres + leaderboard)
--
-- Cara pakai: buka Supabase → project → SQL Editor → tempel SELURUH file ini →
-- Run. Aman dijalankan berulang (idempotent).
--
-- Model:
--   profiles   1 baris / user. Menyimpan "bundle" progres (JSONB) + kolom skor
--              yang di-denormalisasi (xp/level/streak/…) supaya leaderboard
--              cukup SELECT + ORDER BY (tanpa parse JSON).
--   xp_events  log kenaikan XP (diisi TRIGGER server-side) → sumber leaderboard
--              MINGGUAN (reset tiap Senin 00:00 UTC via date_trunc('week')).
--
-- Keamanan: RLS aktif. User hanya bisa baca/tulis barisnya sendiri. Leaderboard
-- dibaca lewat FUNGSI SECURITY DEFINER yang cuma mengekspos kolom aman.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── 1. Tabel ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null default '旅人',
  xp              integer not null default 0,
  level           integer not null default 1,
  streak          integer not null default 0,
  max_streak      integer not null default 0,
  accuracy        numeric not null default 0,
  total_answered  integer not null default 0,
  avatar          text not null default '',               -- foto profil (data URL kecil)
  data            jsonb   not null default '{}'::jsonb,   -- bundle progres penuh
  updated_at      timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

-- Untuk DB yang sudah ada: tambahkan kolom avatar (create table if not exists
-- TIDAK menambah kolom ke tabel lama).
alter table public.profiles add column if not exists avatar text not null default '';

create table if not exists public.xp_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  amount      integer not null,
  created_at  timestamptz not null default now()
);
create index if not exists xp_events_user_created_idx on public.xp_events (user_id, created_at desc);
create index if not exists xp_events_created_idx      on public.xp_events (created_at desc);
create index if not exists profiles_xp_idx            on public.profiles (xp desc);

-- ── 2. RLS ─────────────────────────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.xp_events enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists xp_select_own on public.xp_events;
drop policy if exists xp_insert_own on public.xp_events;
create policy xp_select_own on public.xp_events for select using (auth.uid() = user_id);
create policy xp_insert_own on public.xp_events for insert with check (auth.uid() = user_id);

-- ── 2b. GRANT tabel ke role API ────────────────────────────────────────────
-- Supabase baru TIDAK auto-grant tabel yang dibuat via SQL Editor ke role
-- `authenticated`/`anon` → tanpa ini muncul "permission denied for table".
-- RLS di atas tetap yang membatasi BARIS (user hanya barisnya sendiri).
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles  to authenticated;
grant select, insert          on public.xp_events to authenticated;

-- ── 3. Trigger: catat kenaikan XP → xp_events (server-side, tak bisa dipalsukan
--        dari klien; juga jadi sumber leaderboard mingguan) ──────────────────
create or replace function public.log_xp_delta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.xp > 0 then
      insert into public.xp_events(user_id, amount) values (new.id, new.xp);
    end if;
  elsif tg_op = 'UPDATE' then
    if new.xp > coalesce(old.xp, 0) then
      insert into public.xp_events(user_id, amount) values (new.id, new.xp - coalesce(old.xp, 0));
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_xp_delta on public.profiles;
create trigger profiles_xp_delta
  after insert or update of xp on public.profiles
  for each row execute function public.log_xp_delta();

-- ── 4. Leaderboard (SECURITY DEFINER → tembus RLS, tapi hanya kolom aman) ───
-- DROP dulu: `create or replace` TIDAK bisa mengubah tipe return (OUT params)
-- saat kolom hasil berubah (mis. menambah `avatar`). Aman: fungsi dibuat ulang
-- di bawah + grant diulang.
drop function if exists public.leaderboard_all_time(int);
drop function if exists public.leaderboard_weekly(int);
drop function if exists public.my_rank_all_time();

create or replace function public.leaderboard_all_time(p_limit int default 100)
returns table (id uuid, display_name text, xp int, level int, streak int, avatar text, updated_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.id, p.display_name, p.xp, p.level, p.streak, p.avatar, p.updated_at
  from public.profiles p
  where p.xp > 0
  order by p.xp desc, p.updated_at asc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$$;

create or replace function public.leaderboard_weekly(p_limit int default 100)
returns table (id uuid, display_name text, weekly_xp bigint, level int, avatar text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.display_name,
         coalesce(sum(e.amount), 0)::bigint as weekly_xp,
         p.level, p.avatar
  from public.profiles p
  left join public.xp_events e
    on e.user_id = p.id
   and e.created_at >= date_trunc('week', now())
  group by p.id, p.display_name, p.level, p.avatar, p.updated_at
  having coalesce(sum(e.amount), 0) > 0
  order by weekly_xp desc, p.updated_at asc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$$;

-- Posisi (rank) pribadi di papan all-time.
create or replace function public.my_rank_all_time()
returns table (rank bigint, xp int)
language sql
security definer
set search_path = public
as $$
  with ranked as (
    select id, xp, rank() over (order by xp desc) as rnk
    from public.profiles
    where xp > 0
  )
  select rnk, xp from ranked where id = auth.uid();
$$;

grant execute on function public.leaderboard_all_time(int) to anon, authenticated;
grant execute on function public.leaderboard_weekly(int)   to anon, authenticated;
grant execute on function public.my_rank_all_time()        to authenticated;

-- Selesai. Verifikasi: SQL Editor → select * from public.leaderboard_all_time();
