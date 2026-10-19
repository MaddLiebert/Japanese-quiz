-- ─────────────────────────────────────────────────────────────────────────────
-- Migrasi Multiplayer 合戦 (1v1 & 2v2 Live Room + Matchmaking Queue)
-- Idempoten: aman di-run berkali-kali di SQL Editor Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. ENUM Types
do $$ begin
  create type public.match_mode as enum ('1v1', '2v2');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.match_status as enum ('waiting', 'in_progress', 'finished', 'abandoned');
exception when duplicate_object then null; end $$;

-- 2. Tabel Rooms
create table if not exists public.multiplayer_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references public.profiles(id) on delete cascade,
  mode public.match_mode not null default '1v1',
  category text not null default 'mixed',
  question_count int not null default 10,
  seed int not null default 0,
  status public.match_status not null default 'waiting',
  red_team uuid[] not null default '{}',
  blue_team uuid[] not null default '{}',
  winner_team text,
  final_scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index kode room (pencarian instan)
create index if not exists idx_mp_rooms_code on public.multiplayer_rooms(code);
create index if not exists idx_mp_rooms_status on public.multiplayer_rooms(status);

-- 3. Tabel Quick Match Queue
create table if not exists public.match_queue (
  player_id uuid primary key references public.profiles(id) on delete cascade,
  mode public.match_mode not null default '1v1',
  category text not null default 'mixed',
  created_at timestamptz not null default now()
);

-- 4. RLS & Permissions
alter table public.multiplayer_rooms enable row level security;
alter table public.match_queue enable row level security;

-- Drop policy lama bila ada (idempoten)
drop policy if exists "mp_rooms_read_all" on public.multiplayer_rooms;
drop policy if exists "mp_rooms_write" on public.multiplayer_rooms;
drop policy if exists "match_queue_all" on public.match_queue;

create policy "mp_rooms_read_all" on public.multiplayer_rooms for select using (true);
create policy "mp_rooms_write" on public.multiplayer_rooms for all using (auth.uid() is not null);
create policy "match_queue_all" on public.match_queue for all using (auth.uid() is not null);

grant select, insert, update on public.multiplayer_rooms to authenticated, anon;
grant select, insert, update, delete on public.match_queue to authenticated, anon;

-- 5. RPC Helper: Buat Room Baru
create or replace function public.create_mp_room(
  p_code text,
  p_mode public.match_mode,
  p_category text,
  p_question_count int,
  p_seed int
) returns jsonb
language plpgsql security definer set search_path = public, auth
as $$
declare
  v_uid uuid;
  v_room record;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.multiplayer_rooms (
    code, host_id, mode, category, question_count, seed, red_team
  ) values (
    upper(trim(p_code)), v_uid, p_mode, p_category, p_question_count, p_seed, array[v_uid]
  )
  returning * into v_room;

  return row_to_json(v_room)::jsonb;
end;
$$;

grant execute on function public.create_mp_room(text, public.match_mode, text, int, int) to authenticated, anon;

-- 6. RPC Helper: Cari Room Aktif
create or replace function public.find_mp_room(p_code text)
returns jsonb
language plpgsql security definer set search_path = public, auth
as $$
declare
  v_room record;
begin
  select * into v_room
  from public.multiplayer_rooms
  where code = upper(trim(p_code))
    and status in ('waiting', 'in_progress');

  if not found then
    return null;
  end if;

  return row_to_json(v_room)::jsonb;
end;
$$;

grant execute on function public.find_mp_room(text) to authenticated, anon;
