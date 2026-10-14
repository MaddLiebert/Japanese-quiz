# Sinkronisasi & Papan Peringkat 同期 · 番付

Backend opsional untuk **simpan progres ke cloud**, **main lintas perangkat**, dan
**papan peringkat global**. Dibangun di atas **Supabase** (Postgres + Auth + RLS).
App tetap **offline-first**: kalau backend tidak dikonfigurasi, semuanya nonaktif
dan app jalan seperti biasa.

---

## 1. Setup (sekali saja)

### a. Buat project Supabase
1. Daftar/masuk ke <https://supabase.com> → **New project** (gratis).
2. Setelah selesai, buka **Project Settings → API**. Catat:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

### b. Jalankan skema database
Buka **SQL Editor** → tempel isi **`supabase/schema.sql`** → **Run**.
Ini membuat tabel `profiles` & `xp_events`, RLS, trigger XP, dan fungsi leaderboard.

### c. Aktifkan Anonymous Sign-In
**Authentication → Sign In / Providers → Anonymous** → **Enable**.
(Dipakai untuk membuat akun otomatis per-device tanpa form pendaftaran.)

### d. Isi environment
- Lokal: salin `.env.example` → `.env`, isi kedua nilai di atas.
- **Vercel**: Project → Settings → Environment Variables → tambahkan
  `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (Production + Preview), lalu redeploy.

> Kedua nilai **aman** ada di frontend (anon key memang publik; keamanan diatur RLS).

---

## 2. Cara kerja

- **Akun**: anonim per-device (`signInAnonymously`). Bisa diamankan dengan
  **Masuk lewat tautan email (magic link)** (Pengaturan → Akun & Sinkronisasi):
  user masukkan Gmail → Supabase kirim **tautan masuk** ke inbox → klik → masuk.
  **Tanpa sandi, tanpa daftar.** Kalau sudah ada sesi anonim, email **ditautkan**
  (`updateUser({ email })`) → **progres tidak hilang**; kalau belum ada sesi,
  `signInWithOtp({ shouldCreateUser: true })`.
  - **Wajib (Supabase):** provider **Email** harus aktif (**Authentication →
    Sign In / Providers → Email = ON**). Tidak perlu Google Cloud Console.
  - **Penting:** tambahkan origin app ke **Authentication → URL Configuration →
    Redirect URLs** (untuk balik dari tautan email & tautan reset password).
  - Cadangan: **email + password** masih tersedia (di balik "Atau pakai email +
    password") — `updateUser({email,password})`, `signInWithPassword`,
    `resetPasswordForEmail`. Kalau pakai ini, matikan **Email → Confirm email**
    supaya user langsung bisa masuk tanpa verifikasi.
  - **Email kustom (opsional):** default Supabase hanya kirim ~3–4 email/jam ke
    alamat yang bukan anggota tim (batas bawaan). Untuk produksi, sambungkan SMTP
    sendiri (mis. Resend/SendGrid) di **Project Settings → Auth → SMTP**.

- **Push**: setiap key sync berubah (`username`, `user_progress_v2`,
  `item_progress_v2`, `achievements_unlocked_v2`, `selected_badges`) → ditandai
  "dirty" → dikirim ke cloud (debounce 4 dtk, berkala 60 dtk, saat tab kembali fokus).
- **Pull**: saat app dibuka → ambil baris remote → **merge**:
  - `progress` → *last-write-wins* (snapshot dengan `updatedAt` terbaru menang; medaru
    bisa turun karena belanja, jadi bukan max per-field).
  - `itemProgress` → digabung per-item (ambil `lastReviewed` terbaru).
  - `achievements` → union; `selectedBadges` → ikut snapshot pemenang.
  Kalau remote menang → localStorage ditulis ulang + reload sekali.
- **Papan peringkat** (`/leaderboard`): **mingguan** (reset tiap Senin 00:00 UTC,
  dari `xp_events`) & **sepanjang masa** (dari kolom `xp`). Dibaca lewat fungsi
  `SECURITY DEFINER` yang hanya mengekspos kolom aman — **bukan** isi progres.

Modul: `src/features/sync/*` (logika murni `merge.js` + `syncStore.js`, diuji via
`node --test`), `src/features/leaderboard/*`, `src/features/sync/SyncSettings.jsx`.

---

## 3. Pengaman kuota tier GRATIS (Vercel Hobby + Supabase Free)

Supaya app **tidak meledak request/kuota** (baik karena bug maupun pemakaian liar),
semua akses jaringan lewat rem di **`src/features/sync/rateLimit.js`** &
**`src/features/sync/requestCache.js`** (keduanya murni, diuji `node --test`):

| Rem | Nilai | Fungsi |
|---|---|---|
| Kuota harian tulis | **300**/hari/perangkat | Batas upsert profil |
| Kuota harian baca | **900**/hari/perangkat | Batas RPC leaderboard/select |
| Kuota harian auth | **40**/hari/perangkat | Batas sign-in anonim/refresh |
| Jeda minimum tulis | **15 dtk** | Main kuis tidak jadi ratusan upsert |
| Backoff gagal | 15 dtk → 15 mnt (eksponensial + jitter) | Berhenti hammering saat error |
| Guard reload-loop | **60 dtk** | Merge salah tidak memicu badai reload/request |
| Cache leaderboard | **60 dtk** + dedup in-flight | Buka/ganti tab berulang = 0 request baru |

Semua batas **per-perangkat** (localStorage `net_quota_v1`), **fail-open**: kalau
localStorage tidak ada, app tetap jalan (hanya tanpa rem). Reset otomatis tiap
**tengah malam UTC**. Pemakaian tampil di **Pengaturan → Akun & Sinkronisasi →
Kuota Harian**.

**Di sisi Vercel** (`vercel.json`): aset ber-hash (`/assets/*`) di-cache
`immutable` 1 tahun, gambar/audio cache panjang — jadi kunjungan ulang **tidak**
mengunduh ulang (hemat bandwidth Hobby 100 GB/bln). `index.html` & `sw.js` selalu
`must-revalidate` agar user tetap dapat versi terbaru.

> Angka di atas sengaja **jauh di bawah** kuota gratis, tapi **longgar** untuk
> pemakaian normal (main kuis seharian). Naikkan/turunkan di `rateLimit.js`
> (`DAILY_LIMIT`, `MIN_INTERVAL`) sesuai kebutuhan.

**Cara memastikan hemat**: buka **Settings → Kuota Harian** — angka `used/limit`
harusnya tumbuh pelan. Kalau cepat mendekati limit padahal pemakaian normal,
naikkan limit atau periksa loop.

---

## 4. Troubleshooting

**`permission denied for table profiles`** (kode `42501`) saat menulis profil:
Supabase baru **tidak auto-grant** tabel buatan SQL Editor ke role API. Jalankan:

```sql
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles  to authenticated;
grant select, insert          on public.xp_events to authenticated;
```

**Tombol "Aktifkan Sinkronisasi" gagal**: pastikan **Authentication → Providers →
Anonymous Sign-Ins = ON**.

**Leaderboard kosong**: belum ada user dengan `xp > 0`; selesaikan 1 sesi kuis lalu
**Sync Sekarang**.

**Project ter-pause (free tier)**: dashboard → **Restore**.

---

## 5. Privasi & batasan

- Yang tampil di papan peringkat: **nama, XP, level, streak**. Isi progres
  (daftar item, jawaban, koleksi) **tidak** pernah dibaca fungsi publik.
- **Anti-curang**: XP/level bisa saja dikirim klien — validasi ketat belum ada di v1
  (diterima untuk app belajar komunitas). Upgrade: hitung XP di server.
- Konflik dua perangkat yang mengerjakan hal berbeda **saat offline** dapat
  kehilangan salah satu sisi pada `progress` (kebijakan LWW). `itemProgress` &
  achievement tetap aman (union). Upgrade: CRDT/event-log.

---

## 6. Verifikasi cepat

```bash
npm test    # termasuk tes murni merge/syncStore/leaderboard
npm run build
# Jalankan app → Pengaturan → Akun & Sinkronisasi → "Aktifkan Sinkronisasi"
# Buka /leaderboard → isi XP (kuis) → "Segarkan" → namamu muncul.
```
