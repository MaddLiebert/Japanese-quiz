# SPEC — 合戦 GASSEN: 1v1 & 2v2 Live Multiplayer Quiz

**Versi:** v1.0 · **Dibuat:** 2026-10-19
**Status:** SPEC — belum diimplementasikan
**Peran:** pemain dapat membuat lobby room bersama, memilih format pertarungan 1v1 (対決 · Taiketsu) atau 2v2 (紅白戦 · Kōhakusen) dengan sistem tim Merah (紅組) vs Biru (藍組), mengatur materi soal & jumlah ronde, serta bertarung secara langsung (live real-time) dengan penentuan pemenang berdasarkan kecepatan dan ketepatan menjawab.
**Induk:** Quiz Engine (`src/features/quiz/`), Supabase Sync & Realtime (`src/features/sync/`)
**Terkait:** `src/pages/Home.jsx`, `src/App.jsx` (Routes + TopControls), `src/features/quiz/questionBuilder.js`, `src/features/friends/`, `supabase/schema.sql`
**Target implementasi:** terminal (task T0–T8 di §8)
**Migrasi SQL siap-tempel:** `supabase/multiplayer-migration.sql`

---

## 1. Masalah yang dipecahkan

Mode latihan (`/practice`), ujian N5 (`/n5-exam`), dan Death Quiz (`/death-quiz`) saat ini murni **single-player**. Fitur sosial yang sudah ada (`/friends` dan `/leaderboard`) hanya menyajikan kompetisi pasif (adu skor all-time/mingguan).

Pemain tidak memiliki sarana untuk menguji kemampuan bahasa Jepangnya secara langsung berhadapan dengan teman atau pemain lain. Fitur ini menambahkan **arena pertarungan live** dengan dua format:
1. **1v1 Tunggal**: duel adu cepat dan tepat satu lawan satu.
2. **2v2 Pertarungan Regu**: kerja sama 2 orang per tim (Merah vs Biru) dengan sistem perolehan poin kumulatif tim.

---

## 2. Fakta Teknis (Recon Kode — 2026-10-19)

| Komponen | Status Saat Ini | Dampak untuk Multiplayer |
|---|---|---|
| Supabase Client | `@supabase/supabase-js` sudah terpasang | Mendukung `supabase.channel()` (Presence + Broadcast) bawaan tanpa library pihak ketiga tambahan |
| Deterministic Generator | `features/anime/quiz.js` memakai `mulberry32` ber-seed | Pola yang sama bisa diadopsi ke `questionBuilder.js` agar kedua pihak merender soal identik dari 1 angka `seed` |
| Autentikasi | Tamu anonim (`ensureAnonSession`) + Email/Sandi | Pemain tamu maupun akun terdaftar dapat langsung masuk matchmaking tanpa hambatan login |
| Sistem Pertemanan | Tabel `follows` + kode unik 6-digit sudah ada | Host bisa langsung mengundang pemain dari daftar teman aktif |
| Desain Sistem | Neo-brutalist (kinari, sumi, shu, ai, border 4px, shadow tebal) | Tampilan lobby, kartu slot tim, dan HUD live mengikuti DNA desain yang ada |

---

## 3. Keputusan Pemilik Proyek (2026-10-19)

1. **Lobby Sendiri**: Memiliki rute dan layar lobby terdedikasi (`/multiplayer`).
2. **Format Fleksibel 1v1 & 2v2**:
   - Host dapat mengganti mode room antara 1v1 (2 pemain) dan 2v2 (4 pemain).
   - Pada mode 2v2, terdapat dua kubu: **Tim Merah (紅組 · Aka)** dan **Tim Biru (藍組 · Ao)**. Pemain bebas berpindah kubu sebelum pertandingan dimulai.
3. **Sistem Pemenang 2v2 = Kolektif Skor Tim**:
   - Masing-masing anggota tim menjawab soal secara mandiri.
   - Poin yang didapat anggota langsung terakumulasi ke total skor tim. Tim dengan total poin tertinggi di akhir ronde menang.
4. **Scoring Berbasis Kecepatan (Speed Scoring)**:
   - Jawaban benar bernilai `100 - (detik_terpakai * 6)` poin per soal (maks 100, makin lambat makin berkurang).
   - Jawaban salah / kehabisan waktu = 0 poin.
5. **Konfigurasi Soal**:
   - Host bebas memilih kategori materi: Hiragana, Katakana, Kanji, Kotoba, Grammar, atau Campur N5.
   - Pilihan panjang kuis: 5 soal (kilat) atau 10 soal (standar).
6. **Akses Masuk Ganda**:
   - Kode Room 6 Digit (Private Match & Invite Teman).
   - Matchmaking Acak / Cepat (Quick Match).

---

## 4. Mekanika Permainan (Game Rules)

### 4.1. Tahap Room (Lobby Fase)
1. **Host Membuat Room**:
   - Server membuat kode unik 6 karakter (huruf kapital/angka tanpa karakter rancu, misal `K9P2X4`).
   - Host menyetel:
     - Mode: `1v1` atau `2v2`.
     - Kategori Bank: `hiragana` | `katakana` | `kanji` | `kotoba` | `grammar` | `mixed`.
     - Jumlah Soal: `5` atau `10`.
2. **Pemain Masuk**:
   - Menggunakan kode 6 karakter atau melalui daftar teman.
   - Bergabung ke Presence channel Supabase: mengirimkan `{ id, username, avatar, rank }`.
   - Di mode 2v2, pemain baru otomatis ditempatkan pada tim yang slotnya masih kosong, dengan opsi tombol "Tukar Tim (チーム変更)".
3. **Kesiapan (Ready Check)**:
   - Setiap pemain non-host menekan tombol `Siap (準備完了)`.
   - Host hanya dapat menekan `Mulai (開戦)` apabila seluruh slot terisi dan berstatus Siap.

### 4.2. Tahap Pertandingan (In-Game Battle Fase)
1. **Sinkronisasi Soal Tanpa Beban Jaringan**:
   - Host me-generate angka acak bulat `seed` (misal: `491823`).
   - Broadcast pesan `game_start` dikirim ke channel berisi `{ seed, config, startTime }`.
   - Masing-masing klien merender urutan soal dan distraktor yang identik secara lokal menggunakan seeded RNG (anti-lag, hemat kuota data).
2. **Ronde Berwaktu**:
   - Timer 10 detik per soal.
   - Pemain memilih jawaban (A, B, C, D).
   - Begitu tombol diklik, klien langsung membroadcast status ke channel:
     `{ type: 'answer', playerId, team, questionIndex, isCorrect, pointsEarned }`.
3. **Tampilan Live HUD**:
   - Skor personal dan skor tim ter-update saat itu juga di layar seluruh pemain.
   - Indikator mini menampilkan status anggota tim dan lawan (apakah sudah menjawab atau masih berpikir).
   - Reaksi cepat (Emote kanji: 炎, 笑, 涙, 汗, 喝) dapat ditekan di bawah layar dan muncul melayang di samping avatar pemain.
4. **Hasil Akhir (Ekonomi XP & Rank Kompetitif)**:
   - Setelah soal terakhir selesai, layar hasil menampilkan:
     - Tim/Pemain Pemenang (勝利 · Shōri) vs Kalah (敗北 · Haiboku).
     - Breakdown kontribusi poin masing-masing pemain (termasuk status MVP).
     - **Skema XP & Rank**:
       - **1v1**: Menang `+100 XP` · Kalah `-60 XP`.
       - **2v2**: Menang `+120 XP` · Kalah `-50 XP`.
       - **MVP Tim Kalah (2v2)**: Penalti dipotong setengah (`-25 XP`).
       - **Seri (Draw)**: Masing-masing `+30 XP` (tanpa penalti).
     - **Perlindungan Rank & Track Belajar (Zero Interference)**:
       - Penalti kalah memakai `loseXp(amount)` (bukan `addXp(-N)`), hanya mengurangi XP & level/rank.
       - **Sabuk Pemula (Kouhai Protection)**: Pemain rank Kouhai (後輩, XP 0–4.999) kebal pengurangan XP (kalah = 0 XP). Penalti baru aktif mulai rank Senpai (先輩, XP ≥ 5.000).
       - **Track Belajar Tetap 100% Utuh**: `itemProgress` (status hafalan SRS kosakata, kanji, grammar), streak harian (`streak`/`maxStreak`), dan win-rate latihan biasa TIDAK tersentuh atau ter-reset.
     - Hadiah medaru: Pemenang +25 もん, Kalah +10 もん.

---

## 5. Arsitektur Data & Supabase Realtime

### 5.1. Skema Database (`supabase/multiplayer-migration.sql`)
```sql
-- Status room pertandingan
create type public.match_mode as enum ('1v1', '2v2');
create type public.match_status as enum ('waiting', 'in_progress', 'finished', 'abandoned');

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
  winner_team text, -- 'red' | 'blue' | 'draw'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Antrean Matchmaking Otomatis (Quick Match)
create table if not exists public.match_queue (
  player_id uuid primary key references public.profiles(id) on delete cascade,
  mode public.match_mode not null default '1v1',
  category text not null default 'mixed',
  created_at timestamptz not null default now()
);
```

### 5.2. Protokol Realtime Channel (`room:<CODE>`)

| Event | Pengirim | Payload | Tujuan |
|---|---|---|---|
| `presence:sync` | Supabase Realtime | Daftar state pemain dalam room | Mengetahui siapa yang ada di lobby dan tim mana yang dipilih |
| `broadcast:update_settings` | Host | `{ mode, category, questionCount }` | Sinkronisasi perubahan pengaturan kuis di room |
| `broadcast:switch_team` | Pemain | `{ playerId, targetTeam: 'red' \| 'blue' }` | Notifikasi perpindahan kubu tim |
| `broadcast:player_ready` | Pemain | `{ playerId, isReady: boolean }` | Memperbarui checklist siap main |
| `broadcast:game_start` | Host | `{ seed, startedAt }` | Memberitahu semua klien untuk memulai kuis secara serentak |
| `broadcast:player_answer` | Pemain | `{ playerId, team, qIndex, isCorrect, points }` | Mengirim perolehan skor tanpa menyimpan ke database per soal |
| `broadcast:send_emote` | Pemain | `{ playerId, emote: '炎' \| '笑' \| '涙' \| '汗' \| '喝' }` | Memunculkan bubble reaksi visual |
| `broadcast:game_over` | Host / Klien | `{ finalScores: { red, blue }, winner }` | Rekonsiliasi hasil akhir |

---

## 6. Desain Visual & UI (Neo-brutalist)

1. **Lobby Browser (`/multiplayer`)**:
   - Header: Judul besar font serif `合戦 · Multiplayer Arena` dengan subjudul `Pertarungan Kuis Bahasa Jepang 1v1 & 2v2`.
   - Grid 2 Kolom:
     - Kartu Kiri: "Buat Room Baru" (pilihan 1v1 / 2v2, dropdown materi, tombol CTA biru `bg-ai`).
     - Kartu Kanan: "Gabung Cepat / Kode Room" (input 6 digit karakter monospaced + tombol "Cari Lawan Otomatis").
2. **Room Waiting Lounge**:
   - Kode Room besar di tengah dalam kotak berbingkai ganda: `K 9 P 2 X 4` + tombol ikon salin.
   - Papan Tim 2v2:
     - **Kubu Merah (紅組)**: Aksen merah `border-shu bg-shu/5`, slot 2 pemain.
     - **Kubu Biru (藍組)**: Aksen biru `border-ai bg-ai/5`, slot 2 pemain.
     - Tombol "Tukar Kubu" di antara kedua kotak.
3. **Battle Arena**:
   - Atas: Skor Tim Merah vs Tim Biru berbentuk bar tebal kontras.
   - Tengah: Timer angka besar detak detik + soal kuis ber-furigana.
   - Bawah: 4 tombol jawaban Neo-brutalist.

---

## 7. Kriteria Penerimaan (Acceptance Criteria)

- [ ] Generator soal `questionBuilder.js` mendukung injeksi `rng` seed deterministik sehingga dua pemanggil dengan seed sama menghasilkan soal dan pilihan jawaban identik.
- [ ] Host dapat membuat room dengan kode unik 6 karakter dan memilih format 1v1 atau 2v2.
- [ ] Pada mode 2v2, sistem membagi pemain ke dalam Tim Merah dan Tim Biru dengan total maksimal 4 pemain.
- [ ] Pemain dapat berpindah kubu tim selama pertandingan belum dimulai.
- [ ] Pertandingan hanya bisa dimulai bila semua slot terpenuhi dan pemain berstatus siap.
- [ ] Kecepatan menjawab memengaruhi perolehan poin secara linier (maks 100 poin, berkurang seiring detik).
- [ ] Skor anggota tim terakumulasi secara real-time ke total skor tim di layar lawan maupun kawan.
- [ ] Pemenang ditentukan secara adil di akhir ronde berdasarkan total skor tertinggi tim/pemain.
- [ ] Penalti kalah mengurangi XP via `loseXp` (hanya rank/level yang turun), dengan perlindungan rank Kouhai (XP < 5000 tidak bisa turun).
- [ ] Track belajar pemain (streak harian, hafalan SRS kanji/kotoba) 100% terlindungi dan tidak terpengaruh hasil match multiplayer.
- [ ] Unit test (`node --test`) mencakup seluruh modul logika murni (room state, team assignment, speed scoring, seeded generator).

---

## 8. Rencana Implementasi (T0–T8)

- **T0: Modul Murni Logika Multiplayer & Skoring**
  - Buat `src/features/multiplayer/multiplayerScore.js` + unit test:
    - Penghitungan poin berbasis kecepatan `calcSpeedScore(timeLeft, maxTime, isCorrect)`.
    - Agregasi skor tim 2v2 `tallyTeamScores(answers)`.
- **T1: Seeded Random Engine di Question Builder**
  - Patch `src/features/quiz/questionBuilder.js`:
    - Integrasikan PRNG `mulberry32(seed)` agar `buildOptions` dan pemilihan soal dapat diulang secara deterministik.
- **T2: Modul API & Protokol Supabase Realtime**
  - Buat `src/features/multiplayer/multiplayerApi.js`:
    - Fungsi pembuatan room, pencarian room berdasarkan kode, dan join channel realtime.
    - Handler presence (player list) dan broadcast (ready, answer, emote).
- **T3: Skema Migrasi SQL Supabase**
  - Buat file `supabase/multiplayer-migration.sql`:
    - Tabel `multiplayer_rooms` dan `match_queue` beserta policy RLS dan grant role `authenticated` / `anon`.
- **T4: Komponen Room Waiting Lounge**
  - Buat `src/features/multiplayer/RoomLobby.jsx`:
    - Tampilan slot 1v1 dan 2v2 (Merah vs Biru), toggle tukar tim, tombol setel materi, dan tombol siap.
- **T5: Komponen Arena Pertandingan Live**
  - Buat `src/features/multiplayer/BattleScreen.jsx`:
    - HUD dual team bar, timer countdown tersinkronisasi, dan display soal bersama.
- **T6: Komponen Layar Hasil Akhir**
  - Buat `src/features/multiplayer/MatchResultModal.jsx`:
    - Animasi penentuan kemenangan regu, perolehan medaru, dan tombol kembali ke lobby.
- **T7: Halaman Utama Multiplayer Browser & Routing**
  - Buat `src/pages/Multiplayer.jsx` dan daftarkan `<Route path="/multiplayer" element={<Multiplayer />} />` di `src/App.jsx`.
  - Pasang kartu akses "合戦 · Multiplayer" di `src/pages/Home.jsx`.
- **T8: Verifikasi & Audit Kualitas**
  - `npm test`, `npm run lint`, dan `npm run build` hijau tanpa error.

---

## 9. Risiko & Solusi

1. **Risiko Pemain Keluar / Disconnect di Tengah Kuis**:
   - *Solusi*: Supabase Presence mendeteksi status leave. Jika rekan satu tim disconnect, pemain yang tersisa tetap dapat melanjutkan dan poinnya tetap dihitung penuh. Jika semua anggota tim lawan disconnect, tim yang bertahan menang walkout (WO).
2. **Risiko Kuota Tier Gratis Supabase**:
   - *Solusi*: Menggunakan Realtime Broadcast murni (tidak menulis baris database per soal). Database Postgres hanya disentuh 2 kali per match: saat room dibuat dan saat match selesai.
3. **Risiko Beda Waktu Antar Perangkat**:
   - *Solusi*: Start kuis menggunakan timestamp server/host, timer berjalan serempak 10 detik per soal dengan toleransi network jitter 500ms.
