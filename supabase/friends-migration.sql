-- ═══════════════════════════════════════════════════════════════════════════
-- Migrasi: 友達 TOMODACHI — tambah teman (follow ala IG + kode unik 6 digit)
--   (docs/friends.md §5)
-- Cara pakai: buka file INI → Ctrl+A (di dalam file ini saja) → copy → tempel ke
-- Supabase → SQL Editor → Run. Aman diulang (idempoten).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Kode unik 6 digit per profil ─────────────────────────────────────────
alter table public.profiles add column if not exists friend_code text;
create unique index if not exists profiles_friend_code_key on public.profiles (friend_code);

-- Trigger: assign kode saat insert (atau update yang belum punya kode). Nol di
-- depan dijaga (lpad). Retry ≤60× lalu menyerah (ruang 10^6 sangat lega).
create or replace function public.assign_friend_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare c text; i int := 0;
begin
  if new.friend_code is not null then return new; end if;
  loop
    c := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from public.profiles p where p.friend_code = c and p.id <> new.id);
    i := i + 1;
    if i > 60 then raise exception 'friend code space exhausted'; end if;
  end loop;
  new.friend_code := c;
  return new;
end $$;

drop trigger if exists profiles_assign_friend_code on public.profiles;
create trigger profiles_assign_friend_code
  before insert or update on public.profiles
  for each row execute function public.assign_friend_code();

-- Backfill baris lama (baris ber-trigger akan mengisi friend_code-nya).
update public.profiles set friend_code = null where friend_code is null;

-- ── 2. Tabel follows (pending / accepted) ───────────────────────────────────
create table if not exists public.follows (
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id),
  constraint follows_status  check (status in ('pending','accepted'))
);
create index if not exists follows_following_idx on public.follows (following_id, status);
create index if not exists follows_follower_idx  on public.follows (follower_id, status);

alter table public.follows enable row level security;
drop policy if exists follows_select_involved on public.follows;
create policy follows_select_involved on public.follows for select
  using (auth.uid() = follower_id or auth.uid() = following_id);

-- Baca saja lewat RLS; TULIS hanya lewat RPC SECURITY DEFINER di bawah.
grant usage on schema public to anon, authenticated;
grant select on public.follows to authenticated;

-- ── 3. Helper status hubungan (sumber tunggal label) ────────────────────────
-- self | friends | following | follower | pending_out | pending_in | none
drop function if exists public.rel_state(uuid, uuid);
create or replace function public.rel_state(p_me uuid, p_target uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_me is null then 'none'
    when p_me = p_target then 'self'
    when exists (select 1 from public.follows f where f.follower_id = p_me and f.following_id = p_target and f.status = 'accepted')
     and exists (select 1 from public.follows f where f.follower_id = p_target and f.following_id = p_me and f.status = 'accepted') then 'friends'
    when exists (select 1 from public.follows f where f.follower_id = p_me and f.following_id = p_target and f.status = 'accepted') then 'following'
    when exists (select 1 from public.follows f where f.follower_id = p_me and f.following_id = p_target and f.status = 'pending')  then 'pending_out'
    when exists (select 1 from public.follows f where f.follower_id = p_target and f.following_id = p_me and f.status = 'pending')  then 'pending_in'
    when exists (select 1 from public.follows f where f.follower_id = p_target and f.following_id = p_me and f.status = 'accepted') then 'follower'
    else 'none'
  end;
$$;

-- ── 4. RPC: kode sendiri ────────────────────────────────────────────────────
drop function if exists public.my_friend_code();
create or replace function public.my_friend_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.friend_code from public.profiles p where p.id = auth.uid();
$$;

-- ── 5. RPC: cari pemain (kode tepat / nama publik) ──────────────────────────
-- Kode 6 digit → temukan SIAPA PUN (termasuk privat) → jalur minta pertemanan.
-- Nama → hanya profil PUBLIK (akun privat tak pernah muncul lewat nama).
drop function if exists public.search_players(text, int);
create or replace function public.search_players(p_q text, p_limit int default 20)
returns table (id uuid, display_name text, avatar text, level int, is_public boolean, state text)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select auth.uid() as uid),
  q as (select trim(coalesce(p_q, '')) as s),
  code_hit as (
    select p.id, p.display_name, p.avatar, p.level, (p.is_public or p.is_full_public) as is_public
    from public.profiles p, q
    where q.s ~ '^[0-9]{6}$' and p.friend_code = q.s
  ),
  name_hit as (
    select p.id, p.display_name, p.avatar, p.level, (p.is_public or p.is_full_public) as is_public
    from public.profiles p, q, me
    where q.s !~ '^[0-9]{6}$'
      and char_length(q.s) >= 2
      and (p.is_public or p.is_full_public)
      and p.id <> me.uid
      and p.display_name ilike '%' || q.s || '%'
  ),
  hits as (select * from code_hit union select * from name_hit)
  select h.id, h.display_name, h.avatar, h.level, h.is_public,
         public.rel_state((select uid from me), h.id) as state
  from hits h
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

-- ── 6. RPC: kartu minimal pemain (nama/avatar/level) untuk SEMUA id ─────────
-- Dipakai halaman /u/:id kasus privat → tetap bisa "siapa ini" + tombol minta.
-- HANYA nama, avatar, level — XP/streak/akurasi TIDAK ikut.
drop function if exists public.player_card(uuid);
create or replace function public.player_card(p_id uuid)
returns table (id uuid, display_name text, avatar text, level int, is_public boolean, state text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name, p.avatar, p.level, (p.is_public or p.is_full_public) as is_public,
         public.rel_state(auth.uid(), p.id) as state
  from public.profiles p
  where p.id = p_id;
$$;

-- ── 7. RPC: daftar hubungan sendiri (teman/following/follower/permintaan) ───
drop function if exists public.list_connections();
create or replace function public.list_connections()
returns table (bucket text, id uuid, display_name text, avatar text, level int, is_public boolean, at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select auth.uid() as uid)
  select 'friend'::text, p.id, p.display_name, p.avatar, p.level, (p.is_public or p.is_full_public), f1.updated_at
  from me, public.follows f1
  join public.follows f2 on f2.follower_id = f1.following_id and f2.following_id = f1.follower_id and f2.status = 'accepted'
  join public.profiles p on p.id = f1.following_id
  where f1.follower_id = me.uid and f1.status = 'accepted'
  union all
  select 'following', p.id, p.display_name, p.avatar, p.level, (p.is_public or p.is_full_public), f.updated_at
  from me, public.follows f
  join public.profiles p on p.id = f.following_id
  where f.follower_id = me.uid and f.status = 'accepted'
    and not exists (select 1 from public.follows b where b.follower_id = f.following_id and b.following_id = me.uid and b.status = 'accepted')
  union all
  select 'follower', p.id, p.display_name, p.avatar, p.level, (p.is_public or p.is_full_public), f.updated_at
  from me, public.follows f
  join public.profiles p on p.id = f.follower_id
  where f.following_id = me.uid and f.status = 'accepted'
    and not exists (select 1 from public.follows b where b.follower_id = me.uid and b.following_id = f.follower_id and b.status = 'accepted')
  union all
  select 'request_in', p.id, p.display_name, p.avatar, p.level, (p.is_public or p.is_full_public), f.created_at
  from me, public.follows f
  join public.profiles p on p.id = f.follower_id
  where f.following_id = me.uid and f.status = 'pending'
  union all
  select 'request_out', p.id, p.display_name, p.avatar, p.level, (p.is_public or p.is_full_public), f.created_at
  from me, public.follows f
  join public.profiles p on p.id = f.following_id
  where f.follower_id = me.uid and f.status = 'pending';
$$;

-- ── 8. RPC tulis: follow / minta / accept / unfollow ────────────────────────
drop function if exists public.request_follow(uuid);
create or replace function public.request_follow(p_target uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare me uuid := auth.uid();
declare target_public boolean;
declare existing text;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if p_target is null or p_target = me then return 'self'; end if;

  select (is_public or is_full_public) into target_public from public.profiles where id = p_target;
  if target_public is null then return 'none'; end if;  -- target tak ada

  select status into existing from public.follows where follower_id = me and following_id = p_target;
  if existing is not null then return public.rel_state(me, p_target); end if;

  -- target sudah follow aku (accepted) → follow balik = langsung TEMAN.
  if exists (select 1 from public.follows where follower_id = p_target and following_id = me and status = 'accepted') then
    insert into public.follows(follower_id, following_id, status, updated_at)
      values (me, p_target, 'accepted', now())
      on conflict (follower_id, following_id) do update set status = 'accepted', updated_at = now();
    return 'friends';
  end if;

  -- publik → langsung accepted; privat → pending (nunggu accept).
  insert into public.follows(follower_id, following_id, status, updated_at)
    values (me, p_target, case when target_public then 'accepted' else 'pending' end, now())
    on conflict (follower_id, following_id) do update set status = excluded.status, updated_at = now();
  return public.rel_state(me, p_target);
end $$;

drop function if exists public.respond_follow(uuid, boolean);
create or replace function public.respond_follow(p_requester uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  if p_accept then
    update public.follows set status = 'accepted', updated_at = now()
      where follower_id = p_requester and following_id = me and status = 'pending';
    insert into public.follows(follower_id, following_id, status, updated_at)
      values (me, p_requester, 'accepted', now())
      on conflict (follower_id, following_id) do update set status = 'accepted', updated_at = now();
    return 'friends';
  end if;
  delete from public.follows where follower_id = p_requester and following_id = me and status = 'pending';
  return public.rel_state(me, p_requester);
end $$;

drop function if exists public.unfollow(uuid, boolean);
create or replace function public.unfollow(p_target uuid, p_both boolean default false)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  delete from public.follows where follower_id = me and following_id = p_target;
  if p_both then
    delete from public.follows where follower_id = p_target and following_id = me;
  end if;
  return public.rel_state(me, p_target);
end $$;

-- ── 9. Grant RPC ke role API ────────────────────────────────────────────────
-- player_card & search_players juga ke anon (kartu = nama/avatar/level, sudah
-- publik di papan peringkat; dipakai halaman /u/:id yang bisa dibuka tanpa login).
grant execute on function public.rel_state(uuid, uuid)             to authenticated;
grant execute on function public.my_friend_code()                  to authenticated;
grant execute on function public.player_card(uuid)                 to anon, authenticated;
grant execute on function public.search_players(text, int)         to anon, authenticated;
grant execute on function public.list_connections()                to authenticated;
grant execute on function public.request_follow(uuid)              to authenticated;
grant execute on function public.respond_follow(uuid, boolean)     to authenticated;
grant execute on function public.unfollow(uuid, boolean)           to authenticated;

-- ── Verifikasi (jalankan terpisah) ──────────────────────────────────────────
--   select public.my_friend_code();                          -- 6 digit
--   select * from public.player_card('00000000-0000-0000-0000-000000000000');  -- 0 baris
--   select * from public.list_connections();                 -- kosong (belum ada teman)
