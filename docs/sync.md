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

- **Akun**: anonim per-device (`signInAnonymously`). Bisa di-upgrade ke email tanpa
  kehilangan progres (**Pengaturan → Akun & Sinkronisasi → Simpan ke Email**).
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

## 3. Privasi & batasan

- Yang tampil di papan peringkat: **nama, XP, level, streak**. Isi progres
  (daftar item, jawaban, koleksi) **tidak** pernah dibaca fungsi publik.
- **Anti-curang**: XP/level bisa saja dikirim klien — validasi ketat belum ada di v1
  (diterima untuk app belajar komunitas). Upgrade: hitung XP di server.
- Konflik dua perangkat yang mengerjakan hal berbeda **saat offline** dapat
  kehilangan salah satu sisi pada `progress` (kebijakan LWW). `itemProgress` &
  achievement tetap aman (union). Upgrade: CRDT/event-log.

---

## 4. Verifikasi cepat

```bash
npm test    # termasuk tes murni merge/syncStore/leaderboard
npm run build
# Jalankan app → Pengaturan → Akun & Sinkronisasi → "Aktifkan Sinkronisasi"
# Buka /leaderboard → isi XP (kuis) → "Segarkan" → namamu muncul.
```
