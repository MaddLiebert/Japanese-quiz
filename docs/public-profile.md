# SPEC — 訪問 PROFIL PUBLIK: lihat profil teman dari Leaderboard

**Versi:** v0.1 · **Dibuat:** 2026-10-14
**Status:** SPEC — belum diimplementasikan
**Peran:** pemain bisa membuka profil pemain lain (modal dari Leaderboard + halaman `/u/:id` yang bisa dibagikan).
**Induk:** Leaderboard (`src/features/leaderboard/`), sync Supabase (`supabase/schema.sql`, `src/features/sync/`)
**Terkait:** `src/features/profile/Profile.jsx` (pola visual), `docs/sync.md`
**Target implementasi:** terminal (task T0–T7 di §10)

---

## 1. Masalah yang dipecahkan

Leaderboard sekarang **jalan buntu**: kamu lihat nama, avatar, level, XP orang — tapi tidak bisa menggali lebih dalam. Tidak ada cara "kepo" sehat, tidak ada halaman yang bisa dibagikan ke teman ("liat nih progress gw").

---

## 2. Fakta penting sebelum membangun (hasil recon kode)

Backend **sudah** menyimpan hampir semua yang dibutuhkan. Tabel `public.profiles`:

| Kolom | Ada? | Sudah dikirim leaderboard? |
|---|---|---|
| `display_name` | ✅ | ✅ |
| `avatar` | ✅ | ✅ |
| `xp` | ✅ | ✅ |
| `level` | ✅ | ✅ |
| `streak` | ✅ | ✅ |
| `max_streak` | ✅ | ❌ |
| `accuracy` | ✅ | ❌ |
| `total_answered` | ✅ | ❌ |
| `data` (jsonb, bundle progres penuh) | ✅ | ❌ |
| `updated_at` | ✅ | ✅ |

**Konsekuensi jujur — dua hal yang wajib disadari pemilik:**

1. **Leaderboard SUDAH publik.** Nama, avatar, level, XP, streak setiap pemain sudah bisa dilihat siapa pun yang membuka papan. "Opt-in" di spec ini **tidak** menyembunyikan itu — ia hanya menggerbangi **profil detail** (akurasi + halaman yang bisa dibagikan). Kalau suatu saat diinginkan papan yang juga tersembunyi, itu spec terpisah.
2. **RLS memblokir baca baris orang lain.** `profiles_select_own` = `auth.uid() = id`. Jadi baca profil orang **wajib** lewat fungsi `SECURITY DEFINER` — pola yang sudah dipakai `leaderboard_all_time`.

---

## 3. Keputusan pemilik (2026-10-14)

1. **Dua permukaan:** modal (klik baris Leaderboard) **dan** halaman `/u/:id` yang bisa dibagikan.
2. **Data DASAR saja:** avatar, nama, rank, XP, level, streak, akurasi. **Bukan** badge/koleksi.
3. **Opt-in:** pemain harus menyalakan "Profil Publik" di Pengaturan dulu. Default **mati**.

---

## 4. Prinsip

- **Whitelist kolom, jangan `select *`.** RPC hanya mengembalikan kolom aman. Yang **DILARANG** keluar: `data` (bundle penuh), medaru, `ownedItems`, `ownedPacks`, `ownedCosmetics`, email, `id` auth mentah (kirim `id` profil publik apa adanya — memang sudah dipakai leaderboard).
- **Default tertutup.** `publicProfile: false`. Tanpa menyalakan, RPC mengembalikan kosong → orang lain melihat "profil privat".
- **Satu sumber kebenaran.** Kolom server `is_public` ditulis dari `progress.publicProfile` lewat `bundleToProfile` — jangan dua jalur.
- **Tidak menyentuh ekonomi.** Fitur ini murni baca. Nol perubahan pada XP/medaru/gacha.
- **Nol tabel baru.** Cukup 1 kolom + 1 fungsi RPC.
- **Pola visual sama.** Halaman memakai shell `Profile.jsx` (mode read-only), ikon = kanji glyph, tanpa emoji.

---

## 5. Kontrak data

### 5.1 Kolom baru (Supabase)
```sql
alter table public.profiles add column if not exists is_public boolean not null default false;
```
> `add column if not exists` — aman dijalankan di DB yang sudah ada (pola sama seperti kolom `avatar`).

### 5.2 Fungsi RPC (SECURITY DEFINER)
```sql
create or replace function public.public_profile(p_id uuid)
returns table (id uuid, display_name text, avatar text, xp int, level int,
               streak int, accuracy numeric, updated_at timestamptz)
language sql security definer set search_path = public
as $$
  select p.id, p.display_name, p.avatar, p.xp, p.level, p.streak, p.accuracy, p.updated_at
  from public.profiles p
  where p.id = p_id
    and (p.is_public = true or p.id = auth.uid());   -- publik ATAU milik sendiri
$$;
grant execute on function public.public_profile(uuid) to anon, authenticated;
```
Kembalian kosong = tidak publik / tidak ada → UI tampilkan "profil privat" (jangan bedakan "tidak ada" vs "privat" — hindari bocor keberadaan akun).

### 5.3 State lokal
```js
// DEFAULT_PROGRESS
publicProfile: false,
```

### 5.4 Tulisan ke server
`bundleToProfile` menambah:
```js
is_public: Boolean(p.publicProfile),
```

---

## 6. Alur pemain

```
Pengaturan → 「Profil Publik」 ON
      ↓ (sync berikutnya menulis is_public = true)
Leaderboard → klik baris teman
      ↓
   ┌─ Modal 訪問 ────────────────┐
   │ [avatar]  Nama              │
   │ Rank chip · Lv · XP         │
   │ Streak · Akurasi            │
   │ [Buka halaman] [Salin tautan]│
   └─────────────────────────────┘
      ↓ "Buka halaman"
   /u/<id>  ← bisa dibagikan
```
Kalau target **belum** menyalakan: modal/halaman menampilkan 「プロフィールは非公開」 *Profil ini privat* + saran "minta dia menyalakan Profil Publik".

---

## 7. Permukaan UI

**Pengaturan** (`src/pages/Settings.jsx` → dekat Akun & Sinkronisasi):
- Sakelar/tombol 「プロフィールを公開」 **Profil Publik** ON/OFF.
- Teks jujur: *"Kalau dinyalakan, pemain lain bisa membuka halaman profilmu (nama, level, XP, streak, akurasi). Medaru, isi tas, dan email tetap privat."*

**Leaderboard** (`src/features/leaderboard/Leaderboard.jsx`):
- Baris jadi `<button>` (sekarang `<div>`) → buka modal. Tambah `aria-label` + `title`.
- Modal `訪問` read-only: avatar besar, nama, `RankBadge variant="chip"`, Lv, XP, streak, akurasi. Tombol 「ページを開く」 (buka halaman) + 「リンクをコピー」 (salin tautan).
- Kasus privat → teks 「非公開」.
- Baris **"Kamu"** → modal diganti tautan ke Profil sendiri (`/profile`).

**Halaman** `/u/:id` (`src/features/profile/PublicProfile.jsx` + route di `App.jsx`):
- Shell sama seperti `Profile.jsx` (frame editorial, back button).
- Mode read-only: TIDAK ada tombol edit nama/avatar, TIDAK ada tab Statistik/Sertifikat (hanya kartu ringkas).
- Tombol 「リンクをコピー」 menyalin `location.href` (pakai `navigator.clipboard`, fallback `prompt`).
- Kalau belum publik → kartu "profil privat".

---

## 8. API klien (`src/features/leaderboard/leaderboardApi.js`)

```js
export const fetchPublicProfile = (id, opts) =>
  rpcCached(`pub:${id}`, 'public_profile', { p_id: id }, opts);
```
- Pakai cache TTL yang **sudah ada** (60 dtk) + `consume(storage(), 'read')` (kuota) — jangan bikin jalur baru.
- Kembalikan `{ row, error, cached }`; `row === null` = privat/tidak ada.

---

## 9. Privasi — daftar tegas

| Data | Boleh keluar? |
|---|---|
| display_name, avatar, xp, level, streak, accuracy, updated_at | ✅ ya (sudah publik di papan) |
| `data` jsonb (bundle progres penuh) | ❌ TIDAK PERNAH |
| medaru, ownedPacks, ownedItems, ownedCosmetics, ownedFurniture | ❌ TIDAK PERNAH |
| email, id auth sebagai kredensial | ❌ TIDAK PERNAH |
| badge yang tidak dipilih (`achievements` mentah) | ❌ TIDAK (di luar "data dasar") |

Aturan implementasi: RPC **menyebut kolom satu per satu**. Review dulu diff SQL-nya sebelum dijalankan — `select p.*` = bug privasi.

---

## 10. Rencana Implementasi (T0–T7)

> Konvensi commit: `feat(profile-public):`, `fix(profile-public):`, `docs(profile-public):`
> Setiap task: tulis test gagal → jalankan → implementasi → jalankan (lulus) → commit.

### T0 — Baseline
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run lint 2>&1 | grep -ci error
git rev-parse --short HEAD
```

### T1 — SQL (kolom + RPC + grant)
Edit `supabase/schema.sql`: `is_public`, `public_profile(uuid)`, grant ke `anon, authenticated`.
Jalankan di Supabase SQL Editor. Verifikasi:
```sql
select * from public.public_profile('<uuid-terkenal>');   -- kosong bila privat
```

### T2 — `bundleToProfile` menulis `is_public`
`src/features/sync/syncStore.js` + `syncStore.test.js` (assert `is_public === Boolean(progress.publicProfile)`).

### T3 — State + aksi
`DEFAULT_PROGRESS.publicProfile = false`; aksi `setPublicProfile(on)` di `ProgressContext.jsx`; `resetProgress` mengembalikannya `false` (ikut `user_progress_v2` yang dihapus — pastikan `DEFAULT_PROGRESS` dipakai). Guard test baca-sumber.

### T4 — Sakelar di Pengaturan
`src/pages/Settings.jsx` — tombol ON/OFF + teks jujur (§7).

### T5 — `fetchPublicProfile`
`leaderboardApi.js` + tes (cache & kuota terpakai; `row === null` saat kosong).

### T6 — UI: modal + halaman + route
- `Leaderboard.jsx`: baris → `<button>`, modal `訪問`, tombol salin tautan.
- `PublicProfile.jsx` baru + `<Route path="/u/:id" />` di `App.jsx`.
- `Glyph` baru bila perlu (`share`, `external`) — **daftarkan** di `Glyph.jsx` (nama tak terdaftar render `null`).

### T7 — Verifikasi
`npm test` (0 gagal) · `npm run lint` (0 error) · build `EXIT=0` ·
cek di browser: nyalakan Profil Publik di akun A, buka `/u/<id-A>` dari akun B (anon) → tampil; matikan → jadi privat.

---

## 11. Kriteria Penerimaan

- [ ] RPC `public_profile` **menyebut kolom satu per satu** (tidak ada `select *`).
- [ ] `is_public` default `false`; profil non-publik → RPC kosong.
- [ ] Pemilik tetap bisa melihat profilnya sendiri walau `is_public = false`.
- [ ] `bundleToProfile` menulis `is_public` dari `progress.publicProfile`.
- [ ] `publicProfile` ikut sync & backup tanpa ubah `merge.js`/`backup.js`.
- [ ] `resetProgress` → `publicProfile` kembali `false`.
- [ ] Modal tampil dari klik baris Leaderboard; baris "Kamu" → `/profile`.
- [ ] Halaman `/u/:id` bisa dibuka **tanpa login** (anon) untuk profil publik.
- [ ] Tidak ada medaru/isi tas/email yang pernah dikirim ke klien lain.
- [ ] Nol emoji di UI baru (ikon = kanji glyph).
- [ ] `fetchPublicProfile` memakai cache + kuota yang sudah ada.

---

## 12. Risiko

| # | Risiko | Mitigasi |
|---|---|---|
| R1 | **Kebocoran data** (jsonb `data` ikut terkirim) | Whitelist kolom di RPC; review diff SQL sebelum jalan |
| R2 | Pemain tak sadar leaderboard sudah publik | Teks di Pengaturan menyebut eksplisit apa yang publik & apa yang privat |
| R3 | Enumerasi akun (menebak id) | `id` = UUID acak (tidak bisa ditebak); privat & tidak-ada sama-sama kosong |
| R4 | Kuota Supabase (read) | Pakai cache 60 dtk + `consume('read')` yang sudah ada |
| R5 | Pemain lupa sudah menyalakan | Sakelar jelas di Pengaturan + status ON/OFF terlihat |
| R6 | Deep link `/u/:id` di PWA offline | SPA rewrite `vercel.json` sudah menangani; halaman tampilkan pesan "offline" bila gagal |
| R7 | Profil kosong membingungkan | Empty state jelas: 「非公開」 + cara mengaktifkan |

---

## 13. Yang TIDAK termasuk

- **Badge/koleksi/subject mastery publik** — ditolak (keputusan: data dasar saja).
- **Papan yang tersembunyi** (leaderboard tetap publik apa adanya) — spec terpisah.
- **Mengikuti/follow, komentar, pesan** — di luar cakupan.
- **Lihat profil dari Inventori/Shop** — hanya dari Leaderboard + tautan.
- **Statistik rinci (radar 8 subjek)** — di luar "data dasar".
- **N4** — ditolak (proyek sendiri).

---

## 14. Ringkasan Satu Layar

Klik baris Leaderboard → **modal 訪問** (avatar, nama, rank, Lv, XP, streak, akurasi)
+ halaman **`/u/:id`** yang bisa dibagikan. **Opt-in**: default mati; pemain
menyalakan 「Profil Publik」 di Pengaturan. Nol tabel baru — cukup **1 kolom**
(`is_public`) + **1 RPC** `SECURITY DEFINER` ber-whitelist kolom (pola sama
dengan `leaderboard_all_time`). Yang **tidak pernah** keluar: bundle `data`,
medaru, isi tas, email. Data dasarnya **sudah ada** di server & sebagian sudah
lewat di papan — jadi ini fitur baca, bukan fitur backend baru.
