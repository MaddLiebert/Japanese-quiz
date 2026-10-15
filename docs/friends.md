# SPEC — 友達 TOMODACHI: tambah teman (follow ala IG + kode unik 6 digit)

**Versi:** v1.1 · **Dibuat:** 2026-10-15
**Status:** IMPLEMENTED — 友達/leaderboard/tombol selesai; migrasi SQL **belum** dijalankan
di Supabase (fitur mati sampai `supabase/friends-migration.sql` di-apply).
**Peran:** pemain bisa menambah pemain lain sebagai teman — **follow** ala Instagram:
profil **publik** (`is_public`/`is_full_public`) bisa langsung di-follow; profil
**privat** harus **minta pertemanan** (申請 · shinsei) dan menunggu **konfirmasi**
(承認 · shōnin). Tiap pemain punya **kode unik 6 digit** sebagai pegangan pencarian
(nama bisa kembar; kode tidak).
**Induk:** Leaderboard (`src/features/leaderboard/`), Profil Publik 訪問
(`docs/public-profile.md`, `docs/public-profile-full.md`), sync Supabase
(`supabase/schema.sql`, `src/features/sync/`)
**Terkait:** `src/features/profile/PublicProfile.jsx`, `PublicProfileModal.jsx`,
`src/pages/Settings.jsx`, `src/App.jsx` (TopControls + Routes), `docs/sync.md`, `PRD.md`
**Target implementasi:** terminal (task T0–T9 di §10)
**Migrasi SQL siap-tempel:** `supabase/friends-migration.sql`

---

## 1. Masalah yang dipecahkan

Leaderboard + Profil Publik 訪問 sudah jalan, tapi **jalan buntu satu arah**: kamu bisa
melihat level/XP orang, bahkan membuka halaman profilnya — tapi **tidak bisa menjalin
hubungan**. Tidak ada cara "menambahkan" pemain, tidak ada daftar teman, tidak ada cara
meminta akses ke profil yang **privat** (yang sengaja disembunyikan `public_profile`).

Akibatnya fitur 訪問 cuma jadi etalase mati: lihat, lalu tutup. Fitur ini memberi
**lapisan sosial** yang diminta: follow (publik) / minta pertemanan (privat) + daftar
teman + pencarian lewat **kode unik 6 digit**.

---

## 2. Fakta penting (recon kode — 2026-10-15)

| Fakta | Bukti |
|---|---|
| Tabel `profiles` sudah punya `is_public` + `is_full_public` | `supabase/schema.sql:41,46` |
| `public_profile(uuid)` **kosong** untuk profil privat (anti-bocor keberadaan) | `supabase/schema.sql:190` |
| RLS `profiles_select_own` = `auth.uid() = id` → **baca baris orang wajib RPC** `SECURITY DEFINER` | `supabase/schema.sql:65` |
| Jalur baca hemat kuota sudah ada (`rpcCached` + cache TTL 60 dtk + `consume('read')`) | `src/features/leaderboard/leaderboardApi.js:28` |
| Rem tulis harian sudah ada (`consume('write')`, jeda 15 dtk) | `src/features/sync/rateLimit.js:19` |
| Leaderboard baris → modal 訪問; halaman `/u/:id` sudah ada | `Leaderboard.jsx:188`, `App.jsx:345` |
| Registry ikon = `Glyph` (nama tak terdaftar render `null` diam-diam) | `src/components/icons/Glyph.jsx:21` |
| **TIDAK ADA** tabel/kolom/RPC soal follow/teman/kode | `grep -rni "follow\|friend" src supabase` → kosong |
| PRD menyatakan "Fitur sosial" **di luar cakupan** → spec ini **mencabut** butir itu | `PRD.md:29` |

**Konsekuensi:** ini fitur backend **baru** (1 tabel + 1 kolom + 7 RPC), bukan sekadar
perluasan baca. Tapi ia memakai ulang **semua** pola yang sudah ada (RPC `SECURITY
DEFINER` ber-whitelist, cache + kuota, shell halaman neo-brutalis, Glyph kanji).

---

## 3. Keputusan pemilik (2026-10-15)

1. **Model = follow ala IG.** Profil **publik** → follow **langsung** (searah, tanpa
   konfirmasi). Profil **privat** → **minta pertemanan**, menunggu di-**accept**; setelah
   accept **saling follow** → statusnya **teman** (友達 · tomodachi).
2. **Kode unik = numerik 6 digit** (mis. `482913`). Bukan alfanumerik.
3. **Permukaan = halaman baru 「友達」 `/friends`**: kotak cari (kode/nama) + daftar teman
   + permintaan masuk yang bisa di-accept/tolak.
4. **Search = kode (utama) + nama (sekadar bantu)** — nama boleh banyak hasil, kode pasti
   unik.

---

## 4. Prinsip

- **Teman = saling follow.** Tidak ada tabel "friend" terpisah: `teman` dihitung dari
  **dua baris `accepted` yang berlawanan arah**. Satu tabel, satu kebenaran.
- **Whitelist kolom, jangan `select *`.** RPC menyebut kolom satu per satu. Profil
  **privat** tidak pernah membocorkan XP/streak/akurasi — hanya nama, avatar, level.
- **Kode = identitas yang bisa dibagikan.** Di-assign server-side (trigger), unik
  (unique index), 6 digit, nol di depan dijaga (`lpad`).
- **Nol emoji.** Ikon = kanji glyph (`Glyph.jsx`). Label Jepang + ID/EN lewat `language`.
- **Hemat kuota.** Semua baca lewat `rpcCached` (cache 60 dtk + dedup); tulis lewat
  `consume('write')`. Nol jalur jaringan baru di luar pola `leaderboardApi`.
- **Offline-first tetap utuh.** Backend belum dikonfigurasi → halaman `/friends`
  menampilkan pesan "backend belum dikonfigurasi", bukan crash.

---

## 5. Kontrak data

### 5.1 Kolom baru — kode teman

```sql
alter table public.profiles add column if not exists friend_code text;
create unique index if not exists profiles_friend_code_key on public.profiles (friend_code);
```

Di-assign **trigger** (`before insert or update`) supaya **setiap** baris punya kode —
termasuk baris lama (backfill) dan baris yang dibuat client lewat upsert sync:

```sql
create or replace function public.assign_friend_code()
returns trigger language plpgsql security definer set search_path = public as $$
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

-- Backfill baris lama (per-baris → trigger melihat kode yang sudah terpasang).
do $$ declare r record; begin
  for r in select id from public.profiles where friend_code is null loop
    update public.profiles set friend_code = null where id = r.id;
  end loop;
end $$;
```

### 5.2 Tabel baru — `follows`

```sql
create table if not exists public.follows (
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending',   -- 'pending' | 'accepted'
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
grant select on public.follows to authenticated;
```

**Tulis hanya lewat RPC `SECURITY DEFINER`** (accept perlu menulis baris untuk ORANG LAIN
— RLS memblokir lewat client). Nol policy insert/update/delete.

### 5.3 Status hubungan (`rel_state`)

Satu helper murni-SQL jadi sumber kebenaran label:

| state | arti |
|---|---|
| `self` | ini dirimu |
| `friends` | dua baris `accepted` berlawanan arah → 友達 |
| `following` | aku follow dia (publik, langsung) |
| `follower` | dia follow aku, aku belum |
| `pending_out` | aku sudah minta, menunggu dia accept |
| `pending_in` | dia minta ke aku, menunggu aku accept |
| `none` | belum ada hubungan |

### 5.4 RPC (semua `SECURITY DEFINER`, whitelist kolom)

| RPC | Arg | Kembalian | Fungsi |
|---|---|---|---|
| `my_friend_code()` | — | `text` | kode 6 digit milik sendiri |
| `search_players(q, limit)` | `text, int` | tabel kartu + `state` | cari kode (tepat) / nama (publik) |
| `player_card(id)` | `uuid` | kartu minimal + `state` | kartu untuk profil privat |
| `list_connections()` | — | tabel `bucket, …` | teman / following / follower / request |
| `request_follow(target)` | `uuid` | `text` (state baru) | follow (publik) **atau** minta (privat) |
| `respond_follow(requester, accept)` | `uuid, bool` | `text` | accept → saling follow; tolak → hapus |
| `unfollow(target, both)` | `uuid, bool` | `text` | berhenti follow (opsional dua arah) |

**Aturan search (keputusan privasi):** pencarian **kode** = tepat 6 digit, menemukan
**siapa pun** (termasuk privat) — inilah jalur minta pertemanan ke akun privat. Pencarian
**nama** hanya mengembalikan profil **publik**; akun privat **tidak pernah** muncul lewat
nama (menjaga janji 「Profil privat = tidak terlihat」 di `docs/public-profile.md` §9).
Kartu privat tetap hanya membawa **nama, avatar, level** — XP/streak/akurasi tetap kosong.

`player_card(id)` sengaja mengembalikan kartu minimal untuk **id apa pun** (termasuk
privat) supaya halaman `/u/:id` bisa menampilkan 「siapa ini」 + tombol minta pertemanan,
**tanpa** membocorkan statistik. Ini perpanjangan sadar dari janji privasi: yang bocor
hanya **nama+avatar+level** (sama seperti yang sudah tampil di papan peringkat publik).

### 5.5 Tulisan ke server

`bundleToProfile` **tidak berubah** — kode di-assign server-side (trigger), bukan dari
client. Nol key sync baru; nol perubahan `merge.js`/`backup.js`.

---

## 6. Alur pemain

```
/friends  ── kotak cari ──► ketik 6 digit ATAU nama
      │                          │
      │            ┌─────────────┴─────────────┐
      │            │ kode (tepat)              │ nama (publik)
      │            ▼                           ▼
      │      kartu + tombol                 daftar kartu publik
      │            │
      │     ┌──────┴───────┐
      │     ▼              ▼
      │  PUBLIK         PRIVAT
      │  「フォロー」      「友達申請」
      │   klik →         klik →
      │   langsung       pending_out
      │   following      (nunggu)
      │                     │
      │        ┌────────────┴───────────┐
      │        ▼                        ▼
      │  (di sisi dia, tab 申請)     (dia tolak → hilang)
      │   「承認」 accept
      │        ▼
      │   dua baris accepted → 友達 (teman)
      └─────────────────────────────────────►
```

Titik masuk **kedua**: **Leaderboard** — tombol 友達 **langsung di tiap baris**, plus
klik baris → modal 訪問 → tombol yang sama; dan halaman **`/u/:id`**.

---

## 7. Permukaan UI

**Halaman 「友達」 `/friends`** (`src/features/social/Friends.jsx`):
- Kepala: **kode temanku** besar + tombol 「コピー」 (salin kode) — pakai `copyText` yang
  sudah ada.
- Kotak cari (kode/nama) → daftar hasil (kartu: avatar, nama, Lv, badge 「非公開」 bila
  privat) + tombol aksi per baris.
- Tab: **友達** (teman) · **フォロー中** (following) · **フォロワー** (follower) ·
  **申請** (permintaan masuk, badge jumlah).
- Tiap baris → klik = buka `/u/:id`; tombol aksi di sisi kanan.

**Tombol aksi** (`src/features/social/FollowButton.jsx`, dipakai di 3 tempat: halaman
`/friends`, modal 訪問, halaman `/u/:id`). Label mengikuti `rel_state`:

**Leaderboard** (`Leaderboard.jsx`): tombol `<FollowButton size="sm">` **LANGSUNG di
tiap baris** (sisi kanan) — jalur utama "add friend lewat leaderboard". Baris diubah
dari `<button>` jadi `<div>` berisi `<button>` (buka profil/modal) + tombol 友達, supaya
tidak ada tombol bersarang (HTML valid). Baris membawa **hanya id**, jadi status
diambil dari **satu** `fetchConnections()` → `stateMap()` (bukan RPC per-baris, hemat
kuota); `is_public` tidak diketahui → label **netral** 「追加」 Add dan RPC
`request_follow` sendiri yang memutuskan `accepted` (publik) vs `pending` (privat).

| state | label | aksi |
|---|---|---|
| `none` + target publik | 「フォロー」 Follow | `request_follow` |
| `none` + target privat | 「友達申請」 Minta Pertemanan | `request_follow` |
| `none` + publik tak diketahui (baris leaderboard) | 「追加」 Add | `request_follow` (server pilih) |
| `following` | 「フォロー中」 Following | `unfollow` |
| `pending_out` | 「申請中」 Menunggu | `unfollow` (batalkan) |
| `pending_in` | 「承認」 Terima / 「拒否」 | `respond_follow` |
| `friends` | 「友達」 Teman | `unfollow(both)` |
| `follower` | 「フォロー返す」 Follow back | `request_follow` |
| `self` | — (tombol disembunyikan) | — |

**Modal 訪問** (`PublicProfileModal.jsx`) + **halaman `/u/:id`** (`PublicProfile.jsx`):
tambah `<FollowButton>` di bawah kartu. Untuk profil privat, halaman memakai
`player_card` → kartu minimal + 「非公開」 + tombol minta pertemanan (bukan lagi kartu
kosong tanpa aksi).

**TopControls** (`App.jsx`): entri baru 「友達」 (`Glyph name="users"`) **di dalam blok
`{open && …}`**, dengan badge jumlah permintaan masuk.

**Pengaturan**: nol perubahan wajib. (Kode tampil di `/friends`.)

**Ikon baru** (`src/components/icons/Glyph.jsx`): `userPlus` (UserPlus), `userCheck`
(UserCheck), `users` (Users), `userMinus` (UserMinus), `search` (Search), `clock`
(Clock). Nama tak terdaftar render `null` → **wajib** didaftarkan.

---

## 8. API klien

`src/features/social/socialApi.js` — pola sama `leaderboardApi.js` (cache TTL 60 dtk +
dedup + `consume('read')`; tulis lewat `consume('write')`):

```js
export const fetchFriendCode = ()                      // rpc my_friend_code
export const searchPlayers = (q, opts)                 // rpc search_players   (cache)
export const fetchPlayerCard = (id, opts)              // rpc player_card      (cache)
export const fetchConnections = (opts)                 // rpc list_connections (cache)
export const requestFollow = (id)                      // rpc request_follow   (tulis)
export const respondFollow = (id, accept)              // rpc respond_follow   (tulis)
export const unfollow = (id, both = false)             // rpc unfollow         (tulis)
export const clearSocialCache = ()
```

**Logika murni** `src/features/social/socialView.js` (+ tes `node --test`):
`REL` (konstanta state), `relLabel(state, language)`, `actionFor(state, isPublic)`,
`bucketConnections(rows)` (kelompok + urut per bucket), `requestCount(rows)`.

---

## 9. Privasi — daftar tegas

| Data | Boleh keluar? |
|---|---|
| nama, avatar, level (kartu pencarian & profil privat) | ✅ |
| `friend_code` | ✅ (memang untuk dibagikan) |
| `is_public` / `is_full_public` (penanda) | ✅ (hanya boolean) |
| XP, streak, akurasi, statistik | ✅ **hanya bila profil publik/lengkap** (lewat `public_profile`) |
| akun privat muncul di **pencarian nama** | ❌ TIDAK (hanya lewat kode tepat) |
| medaru, isi tas, email, bundle `data` mentah | ❌ TIDAK PERNAH |
| daftar follower/following orang lain | ❌ TIDAK PERNAH (hanya milik sendiri) |

Aturan implementasi: tiap RPC menyebut kolom satu per satu; review diff SQL sebelum
dijalankan (`select p.*` = bug privasi).

---

## 10. Rencana Implementasi (T0–T9)

> Konvensi commit: `feat(social):`, `fix(social):`, `docs(social):`, `chore(social):`.
> Tiap task: tulis tes gagal → jalankan → implementasi → jalankan (lulus) → commit.
> **Runner boundary:** `node --test` hanya memuat `.js` murni → logika di modul murni,
> komponen `.jsx` tipis.

### T0 — Baseline
`npm test` (catat `ℹ pass/fail`) · `npx oxlint src` (catat jumlah error) ·
`git rev-parse --short HEAD`.

### T1 — SQL (kolom + tabel + 7 RPC + grant) — **MANUAL**
Salin `supabase/friends-migration.sql` → Supabase → SQL Editor → Run. Aman diulang
(idempoten). Verifikasi:
```sql
select public.my_friend_code();                       -- 6 digit
select * from public.search_players('123456');        -- cari kode
select * from public.list_connections();              -- kosong (belum ada teman)
```
> ⚠️ DDL tidak bisa dijalankan otomatis dari repo (tak ada connection string/management
> token). **Pemilik menempel manual.** Bila belum dijalankan → RPC balas `PGRST202`
> ("… in the schema cache") → UI menampilkan pesan ramah (`profileError.js` sudah
> menangani pola ini).

### T2 — Modul murni `socialView.js` + tes
`relLabel`, `actionFor`, `bucketConnections`, `requestCount`. Tes menutup **semua** state
di §7 + input kotor (rows `null`, `state` tak dikenal → `none`).

### T3 — `socialApi.js` + tes
Tes gaya `leaderboardApi.test.js` (module hook + Supabase palsu): RPC yang dipanggil
benar, cache-hit tidak memakan kuota, `force` melewati cache, tulis memakai kuota `write`.

### T4 — `Glyph` + `FollowButton`
Daftarkan 6 ikon baru; `FollowButton` (loading/disabled saat menulis, refresh state
setelah aksi) memakai `relLabel`/`actionFor`.

### T5 — Halaman `/friends` + route + TopControls
`Friends.jsx` (kode + salin, kotak cari, tab, daftar), `<Route path="/friends">` di
`App.jsx`, entri 「友達」 di blok `{open && …}` TopControls + badge permintaan.

### T6 — Integrasi modal 訪問 + halaman `/u/:id`
`PublicProfileModal.jsx` + `PublicProfile.jsx`: pasang `FollowButton`; halaman memakai
`player_card` untuk kasus privat (kartu minimal + tombol).

### T7 — Docs
`docs/sync.md` §2 tambah paragraf 「友達」; `PRD.md` §4 perbarui butir "Fitur sosial"
(cabut dari Bukan Tujuan + catat fitur teman). Absence = doc defect.

### T8 — Verifikasi
`npm test` (0 gagal) · `npx oxlint src` (0 error baru) · `npm run build` `EXIT=0`.

### T9 — Verifikasi browser (pemilik, setelah T1)
Akun A (publik) di-follow akun B → langsung `following`. Akun C (privat) diminta akun B →
`pending_out`; di akun C tab 申請 muncul → 承認 → keduanya jadi 友達. Cari lewat kode 6
digit akun privat → kartu minimal + tombol minta.

---

## 11. Kriteria Penerimaan

- [ ] Kolom `friend_code` + unique index + trigger assign (backfill baris lama).
- [ ] Tabel `follows` + RLS (select hanya yang melibatkan diri) + nol policy tulis.
- [ ] Tujuh RPC `SECURITY DEFINER` ber-whitelist kolom; grant `anon, authenticated`
      (baca) / `authenticated` (tulis).
- [ ] Profil **publik** → follow **langsung** (`accepted`); profil **privat** → `pending`
      → accept → **dua** baris `accepted` (teman).
- [ ] `rel_state` menutup `self/friends/following/follower/pending_out/pending_in/none`.
- [ ] Pencarian **kode** menemukan siapa pun; pencarian **nama** hanya profil publik.
- [ ] Kartu privat **tidak pernah** membocorkan XP/streak/akurasi.
- [ ] Halaman `/friends`: kode sendiri + salin, kotak cari, tab 友達/フォロー中/フォロワー/申請.
- [ ] Tombol aksi di 3 tempat (halaman, modal 訪問, `/u/:id`) konsisten dengan `rel_state`.
- [ ] Nol emoji di UI baru (ikon = kanji glyph); semua teks bilingual.
- [ ] Semua baca lewat cache + kuota `read`; tulis lewat kuota `write`. Nol jalur baru.
- [ ] Backend belum dikonfigurasi → halaman tampil pesan, bukan crash.
- [ ] `npm test` 0 gagal · `npx oxlint` 0 error baru · `npm run build` `EXIT=0`.
- [ ] Migrasi SQL dijalankan di Supabase (manual, T1) — **menunggu pemilik**.

---

## 12. Risiko

| # | Risiko | Mitigasi |
|---|---|---|
| R1 | Kebocoran statistik profil privat | RPC whitelist kolom; kartu privat hanya nama/avatar/level |
| R2 | Enumerasi akun lewat pencarian nama | Pencarian nama **hanya** profil publik; privat hanya via kode tepat |
| R3 | Tabrakan kode 6 digit (1/10⁶) | Unique index + trigger retry (≤60×) + `on conflict` di tulis |
| R4 | Spam permintaan pertemanan | Kuota tulis harian (`consume('write')`) + jeda 15 dtk sudah ada |
| R5 | Kuota Supabase (read) | `rpcCached` TTL 60 dtk + dedup + `consume('read')` |
| R6 | RPC belum dimigrasi → error mentah | `profileError.js` menerjemahkan `PGRST202` jadi instruksi |
| R7 | Follow diri sendiri / dobel | `check (follower_id <> following_id)` + guard `p_target = me` di RPC |
| R8 | Setengah-hubungan (satu arah hilang) | `rel_state` = sumber tunggal; `unfollow(both)` untuk hapus teman penuh |

---

## 13. Yang TIDAK termasuk

- **Chat / pesan / komentar** — di luar cakupan (PRD: obrolan tetap dikecualikan).
- **Notifikasi push** permintaan pertemanan — badge in-app saja.
- **Blokir / report** pemain — spec terpisah bila diminta.
- **Papan privat / leaderboard tersembunyi** — tetap publik apa adanya.
- **Lihat daftar teman orang lain** — hanya milik sendiri.
- **Google OAuth** — tidak disentuh (keputusan lama: tamu + email/sandi).

---

## 14. Ringkasan Satu Layar

Tiap pemain dapat **kode unik 6 digit** (trigger + unique index). Tabel **`follows`**
(`pending`/`accepted`) + **7 RPC** `SECURITY DEFINER` ber-whitelist mewujudkan **follow
ala IG**: profil **publik** → langsung follow; profil **privat** → minta pertemanan,
nunggu **accept**; setelah accept **saling follow** = **teman** (友達). Halaman baru
「友達」 `/friends` (kode sendiri + kotak cari kode/nama + tab 友達/フォロー中/フォロワー/申請)
plus tombol aksi di modal 訪問 dan `/u/:id`. Pencarian **kode** menemukan siapa pun;
pencarian **nama** hanya profil publik. Yang **tidak pernah** keluar dari akun privat:
XP, streak, akurasi, medaru, isi tas, email — hanya nama, avatar, level. Semua baca
lewat cache + kuota `read` yang sudah ada; nol jalur jaringan baru.
