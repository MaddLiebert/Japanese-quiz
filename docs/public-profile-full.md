# SPEC — 訪問 PROFIL LENGKAP: stalk profil penuh (winrate, radar, badge, sertifikat)

**Versi:** v1.0 · **Dibuat:** 2026-10-15
**Status:** TERPASANG di kode — butuh **1 migrasi SQL manual** (lihat §10 T1)
**Peran:** pemain bisa melihat profil **lengkap** pemain lain dari Leaderboard/halaman
`/u/:id`: winrate, penguasaan materi (radar 8 subjek), badge terpasang, dan **sertifikat
N5** — bukan cuma data dasar.
**Induk:** `docs/public-profile.md` (profil publik data dasar), Leaderboard
(`src/features/leaderboard/`), sync (`supabase/schema.sql`, `src/features/sync/`)
**Terkait:** `src/features/profile/Profile.jsx` (sumber tampilan), `N5Certificate.jsx`,
`subjectMastery.js`, `docs/sync.md`

---

## 1. Masalah yang dipecahkan

Profil publik v0.1 (`docs/public-profile.md`) sengaja dibatasi ke **data dasar** (nama,
avatar, XP, level, streak, akurasi) — §13-nya bahkan **menolak** badge/statistik rinci.
Hasilnya "stalk"-nya setengah hati: kamu lihat level orang tapi tidak tahu **seberapa
jago** dia (winrate), **apa yang dikuasai** (radar), **cap apa** yang dia banggakan, atau
**apakah dia sudah lulus N5**. Fitur ini membuka profil penuh — tetap **read-only** dan
tetap **opt-in**.

---

## 2. Fakta penting (recon kode)

Semua data yang dibutuhkan **sudah tersimpan** di kolom `profiles.data` (jsonb) — cuma
sengaja tidak pernah dikirim keluar. Jadi ini **fitur baca**, bukan backend baru.

| Yang ditampilkan | Sumber di bundle `data` | Sebelumnya keluar? |
|---|---|---|
| Winrate | `progress.weightedWinRate` | ❌ |
| Total kuis / akurasi / max streak | `progress.totalAnswered`, `accuracy`, `maxStreak` | ❌ |
| Radar 8 subjek | `itemProgress` (id→status) + dataset JSON di klien | ❌ |
| Badge terpasang | `selectedBadges` + `achievements` | ❌ |
| Sertifikat N5 | `progress.n5Exam` (bestTotal/bestLkr/bestListening/passed/passedAt) | ❌ |

**Konsekuensi:** cukup **perluas RPC yang sudah ada** (`public_profile`) — **nol tabel
baru**, cukup **1 kolom baru** (`is_full_public`) + perluasan RPC.

---

## 3. Keputusan pemilik (2026-10-15)

1. **Sakelar TERPISAH** 「Profil Lengkap」 (`publicProfileFull` → kolom `is_full_public`),
   default **mati**. **Bukan** memperluas sakelar lama.
   > Alasan: 2 pemain sudah menyalakan 「Profil Publik」 dengan janji *"nama, level, XP,
   > streak, akurasi"*. Memperluas sakelar lama = membuka profil penuh mereka **tanpa
   > opt-in ulang** (melanggar janji). Sakelar terpisah = mereka harus memilih lagi.
2. **Isi lengkap:** statistik & winrate, radar penguasaan materi, badge terpasang, dan
   sertifikat N5.
3. **Lengkap implisit menyalakan dasar:** kalau `is_full_public = true`, baris ikut keluar
   (data dasar selalu terlihat). Pemilik tetap bisa melihat profilnya sendiri walau dua
   sakelar mati.

---

## 4. Prinsip

- **Whitelist kolom, jangan `select *`.** RPC menyebut kolom satu per satu; `data` **tidak
  pernah** keluar mentah.
- **Default tertutup.** `publicProfileFull: false`. Tanpa menyalakan, `full_data` = NULL.
- **Satu sumber kebenaran.** `is_full_public` ditulis dari `progress.publicProfileFull`
  lewat `bundleToProfile` — jangan dua jalur.
- **Tidak menyentuh ekonomi.** Murni baca. Nol perubahan XP/medaru/gacha.
- **Payload dibatasi.** `itemProgress` bisa ~1.300 item; server hanya mengirim **peta
  id→status** (~43 KB worst-case) — bukan objek penuh per item.
- **Pola visual sama.** Halaman memakai shell `Profile.jsx` (mode read-only), ikon = kanji
  glyph, **nol emoji**.

---

## 5. Kontrak data

### 5.1 Kolom baru (Supabase)
```sql
alter table public.profiles add column if not exists is_full_public boolean not null default false;
```

### 5.2 RPC `public_profile(uuid)` — diperluas
Tambah kolom **`full_data jsonb`** (nama `full_data`, **bukan** `full` — `full` reserved
keyword PostgreSQL dan gagal di `RETURNS TABLE`). `NULL` kecuali pemilik menyalakan
`is_full_public` (atau baris milik sendiri). Isinya whitelist ketat:
```jsonc
{
  "winRate": 87.5, "totalAnswered": 120, "totalCorrect": 104,
  "maxStreak": 12, "accuracy": 86.6, "matchesPlayed": 40,
  "n5Exam": { "passed": true, "bestTotal": 152, "bestLkr": 104, "bestListening": 48, "passedAt": "..." },
  "selectedBadges": ["n5_gokaku"], "achievements": ["...", "..."],
  "itemStatus": { "<itemId>": "mastered|familiar|learning" }
}
```
`DROP FUNCTION` dulu (create or replace tak bisa mengubah tipe return). Lihat
`supabase/public-profile-migration.sql` untuk versi siap-tempel.

### 5.3 State lokal
```js
// DEFAULT_PROGRESS
publicProfileFull: false,
```
Aksi: `setPublicProfileFull(on)` di `ProgressContext.jsx` (ekspos lewat value Provider).

### 5.4 Tulisan ke server
`bundleToProfile` menambah: `is_full_public: Boolean(p.publicProfileFull)`.

---

## 6. Alur pemain

```
Pengaturan → 「Profil Lengkap」 ON  (terpisah dari 「Profil Publik」)
      ↓ (sync berikutnya menulis is_full_public = true)
Leaderboard → klik baris teman → modal 訪問 (kini menampilkan penanda プロフィール完全 + winrate)
      ↓ 「Buka halaman」
   /u/<id>  → tab 概要 / 統計 / 合格証書
              (winrate, radar 8 subjek, badge, sertifikat N5)
```
Kalau target hanya menyalakan 「Profil Publik」 (dasar): halaman tampil data dasar + ajakan
menyalakan 「Profil Lengkap」. Kalau dua-duanya mati: 「プロフィールは非公開」.

---

## 7. Permukaan UI

**Pengaturan** (`src/pages/Settings.jsx`): sakelar kedua di bawah Profil Publik.
Teks jujur: *"Buka profil penuh: winrate, penguasaan materi, badge, dan sertifikat N5.
Menyalakan ini juga membuat data dasar bisa dilihat. Medaru, isi tas, dan email tetap
privat."* Status: `LENGKAP` / `TERBATAS (default)`.

**Leaderboard modal** (`PublicProfileModal.jsx`): bila `full_data` ada → chip 「プロフィール完全」
+ baris winrate. Detail tetap di halaman.

**Halaman** `/u/:id` (`PublicProfile.jsx`): bila `full_data` ada → 3 tab:
- **概要 Ringkasan** — 6 kartu: winrate, total kuis, max streak, akurasi, XP, streak.
- **統計 Statistik** — radar penguasaan materi 8 subjek + badge terpasang.
- **合格証書 Sertifikat** — `N5Certificate` (komponen yang sama dengan Profil), atau kartu
  "Sertifikat Belum Terbit".

Logika murni di `src/features/profile/publicProfileView.js` (diuji `node --test`):
`statusMapToItemProgress`, `buildPublicMastery`, `fullStats`, `hasCertificate`,
`publicBadgeList`, `hasFullProfile`.

---

## 8. API klien

`fetchPublicProfile` (`leaderboardApi.js`) **tidak berubah** — baris yang sama kini ikut
membawa `row.full_data` (kalau lengkap menyala). Cache TTL 60 dtk + kuota `consume('read')`
yang sudah ada tetap dipakai. **Nol jalur baru.**

---

## 9. Privasi — daftar tegas

| Data | Boleh keluar? |
|---|---|
| nama, avatar, xp, level, streak, akurasi, updated_at | ✅ (sudah publik di papan) |
| winrate, totalAnswered, maxStreak, matchesPlayed | ✅ **hanya bila `is_full_public`** |
| n5Exam (sertifikat N5) | ✅ **hanya bila `is_full_public`** |
| selectedBadges + achievements | ✅ **hanya bila `is_full_public`** |
| itemStatus (id→status) | ✅ **hanya bila `is_full_public`** (dipakai hitung radar) |
| medaru, ownedItems/Packs/Cosmetics/Franchises, furniture | ❌ TIDAK PERNAH |
| `data` jsonb mentah, bio, email | ❌ TIDAK PERNAH |
| `id` auth sebagai kredensial | ❌ TIDAK PERNAH (id profil publik sudah dipakai papan) |

Aturan implementasi: RPC menyebut kolom satu per satu + `jsonb_build_object` eksplisit.
Review diff SQL sebelum dijalankan — `select p.*` atau `p.data` mentah = bug privasi.

---

## 10. Rencana Implementasi (T0–T7)

### T0 — Baseline
`npm test` · `npm run lint` · `git rev-parse --short HEAD`.

### T1 — SQL (kolom + RPC diperluas) — **MANUAL**
Edit `supabase/schema.sql` + `supabase/public-profile-migration.sql`. Jalankan blok
migrasi di **Supabase → SQL Editor**. Verifikasi:
```sql
select * from public.public_profile('<uuid-yang-is_full_public>');   -- full_data terisi
select * from public.public_profile('<uuid-yang-hanya-is_public>');  -- full_data = null
```
> ⚠️ DDL tidak bisa dijalankan otomatis dari sini (tak ada Management API token/DB
> password di repo). **Pemilik harus menempel manual.**

### T2 — `bundleToProfile` menulis `is_full_public` ✅
`syncStore.js` + tes (`is_full_public` dari `progress.publicProfileFull`, terpisah dari
`is_public`).

### T3 — State + aksi ✅
`DEFAULT_PROGRESS.publicProfileFull = false`; aksi `setPublicProfileFull(on)`; guard test
baca-sumber.

### T4 — Sakelar kedua di Pengaturan ✅
`Settings.jsx` — blok 「Profil Lengkap」 + teks jujur.

### T5 — Logika tampilan + UI ✅
`publicProfileView.js` (+ tes), `PublicProfile.jsx` (3 tab), `PublicProfileModal.jsx`
(penanda + winrate).

### T6 — Verifikasi ✅
`npm test` (0 gagal) · `npm run lint` (0 error) · build `EXIT=0`.

### T7 — Verifikasi browser (pemilik)
Setelah T1 dijalankan: nyalakan 「Profil Lengkap」 di akun A → buka `/u/<id-A>` dari akun B
(anon) → tab lengkap tampil; matikan → kembali data dasar.

---

## 11. Kriteria Penerimaan

- [x] RPC menyebut kolom satu per satu + `jsonb_build_object` (tak ada `select *`).
- [x] `is_full_public` default `false`; lengkap mati → `full_data` NULL.
- [x] Pemilik tetap bisa melihat profilnya sendiri walau dua sakelar mati.
- [x] `bundleToProfile` menulis `is_full_public` dari `progress.publicProfileFull`.
- [x] `publicProfileFull` ikut sync/backup tanpa ubah `merge.js`/`backup.js`.
- [x] `resetProgress` → `publicProfileFull` kembali `false`.
- [x] Sakelar 「Profil Lengkap」 terpisah dari 「Profil Publik」.
- [x] Halaman `/u/:id` menampilkan winrate, radar 8 subjek, badge, sertifikat N5.
- [x] Sertifikat memakai komponen `N5Certificate` yang sama (konsisten).
- [x] Tidak ada medaru/isi tas/bio/email yang pernah dikirim ke klien lain.
- [x] Nol emoji di UI baru (ikon = kanji glyph).
- [ ] Migrasi SQL dijalankan di Supabase (manual, T1) — **menunggu pemilik**.

---

## 12. Risiko

| # | Risiko | Mitigasi |
|---|---|---|
| R1 | Kebocoran `data` mentah | Whitelist `jsonb_build_object` eksplisit; review diff SQL |
| R2 | Pemain lama tak sadar kini bisa lebih terbuka | Sakelar TERPISAH — mereka harus opt-in ulang |
| R3 | Payload besar (itemProgress ~1.300 item) | Server kirim peta id→status saja (~43 KB worst-case) + cache 60 dtk |
| R4 | Enumerasi akun | id UUID acak; privat & tidak-ada sama-sama kosong |
| R5 | Sertifikat N5 "difoto orang" disalahartikan resmi | Disclaimer fiktif sudah ada di `N5Certificate` |
| R6 | `full` reserved keyword → SQL gagal | Kolom dinamai `full_data` |
| R7 | Radar kosong membingungkan | Semua subjek tampil 0% bila belum ada data |

---

## 13. Yang TIDAK termasuk

- **Medaru, isi tas, inventori, kosmetik, franchise** — tetap privat.
- **Bio** — tidak ikut (bisa berisi apa saja; di luar "statistik & koleksi").
- **Mengikuti/follow, komentar, pesan** — di luar cakupan.
- **Papan yang tersembunyi** — spec terpisah.
- **N4** — ditolak (proyek sendiri).

---

## 14. Ringkasan Satu Layar

Sakelar **baru** 「Profil Lengkap」 (default mati) membuka `full_data` di RPC
`public_profile` yang sudah ada: winrate, radar 8 subjek, badge terpasang, dan sertifikat
N5. **Nol tabel baru** — cukup **1 kolom** (`is_full_public`) + perluasan RPC ber-whitelist.
Halaman `/u/:id` dapat 3 tab (概要/統計/合格証書). Sakelar lama 「Profil Publik」 tetap
data dasar — pemain lama **tidak** ikut terbuka. Yang tidak pernah keluar: medaru, isi tas,
bio, email, bundle `data` mentah.
