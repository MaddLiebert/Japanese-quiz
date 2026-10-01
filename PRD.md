# Dokumen Kebutuhan Produk — 日本語学園 · Nihongo Gakuen

**Versi:** v1.1 · **Terakhir diperbarui:** 2026-10-02

## 1. Gambaran Produk

"Japanese Quiz" (日本語学園 · Nihongo Gakuen) adalah aplikasi web single-player, offline-first untuk pemula yang belajar bahasa Jepang. Produk memandu pengguna dari penguasaan Kana dasar menuju kesiapan JLPT N5. Loop belajar intinya menekankan recall aktif, latihan berulang, umpan balik jelas, dan progres bertahap — menghindari metode belajar pasif.

## 2. Pernyataan Masalah

Pemula bahasa Jepang sering kesulitan menghafal Kana dan kosakata dasar secara hafalan buta. Alat yang ada sering terlalu penuh fitur sosial, gamifikasi generik, atau penjelasan tata bahasa yang terlalu rumit di awal perjalanan. Pengguna butuh lingkungan yang fokus, offline-first, dan estetis yang memprioritaskan recall aktif, mengidentifikasi titik lemah, dan memaksa pengulangan yang tertarget.

## 3. Tujuan

* Membantu pemula belajar Hiragana.
* Memperluas pembelajaran secara bertahap ke Katakana dan Kotoba (kosakata).
* Mengidentifikasi materi yang membuat pengguna kesulitan secara otomatis.
* Mendorong dan memudahkan pengulangan soal lemah.
* Melacak progres belajar dengan mulus.
* Secara bertahap memperkenalkan Grammar, Membaca, dan Menyimak.
* Akhirnya menyediakan Ujian N5 sebagai tolok ukur akhir.

## 4. Bukan Tujuan

MVP dan roadmap jangka pendek secara eksplisit mengecualikan:

* Akun pengguna / Autentikasi login
* Infrastruktur backend / Sinkronisasi cloud
* Multipemain / Fitur sosial / Obrolan
* Papan peringkat
* Pembayaran / Langganan

## 5. Pengguna Sasaran

* Pemula bahasa Jepang yang mulai dari nol.
* Pelajar yang bersiap menghadapi ujian JLPT N5.
* Autodidak yang mencari pengulangan terstruktur.
* Pengguna yang lebih suka belajar berbasis kuis interaktif daripada membaca pasif.

## 6. Perjalanan Pengguna

Loop intinya ketat dan siklik:
**BELAJAR** → **LATIHAN** → **MELAKUKAN KESALAHAN** → **ULANG** → **KUASAI** → **DAPAT XP** → **LANJUT**

## 7. Arsitektur Informasi

13 rute, semuanya bisa diakses dari Beranda:

* **Beranda (`/`):** Dasbor — XP/Level/Streak, lencana Pangkat, rak cap, kartu mulai cepat, panel Misi Harian 日課 + Misi Mingguan 週課.
* **Belajar (`/learn`):** Modul flashcard — Hiragana, Katakana, Kotoba, Kanji, Grammar, Kurikulum MNN (25 bab), Puisi 詩 (pembaca puisi read-only).
* **Latihan (`/practice`):** Penyiapan kuis yang bisa diatur (5 kategori × baris/bab × 3 tingkat kesulitan) + Full Challenge.
* **Menulis (`/writing`):** Animasi urutan goresan + kuis menulis (Hiragana, Katakana, Kanji).
* **Bicara (`/speaking`):** Latihan pelafalan dengan mikrofon (kana, kotoba, kanji, puisi) + panel diagnosa suara opt-in.
* **Mondai (`/mondai`):** Kuis menyimak dengan audio asli (87 soal, alur per bab).
* **Ulang (`/review`):** Antrean mengulang soal lemah.
* **Death Quiz (`/death-quiz`):** Mode bertahan tanpa henti khusus rank Shogun, dengan sistem skill 呪術.
* **Ujian N5 (`/n5-exam`):** Ujian tiruan JLPT N5 berwaktu + sertifikat.
* **Warung (`/shop`):** Warung 商店 — barang konsumsi + Gashapon untuk pack suara/visual.
* **Tas Punggung (`/inventory`):** Pack yang dimiliki, pack aktif, dan barang konsumsi.
* **Profil (`/profile`):** Tab ID Card · Statistik · Sertifikat (sertifikat N5), pemilihan cap.
* **Pengaturan (`/settings`):** Tampilan (tema, bahasa, tombol Tutorial), Tentang, Dedikasi, Zona Bahaya (reset).

## 8. Kondisi Produk Saat Ini

Sudah jadi dan live (Vercel). Bukan lagi prototipe:

* Belajar kana: Hiragana 104 (seion 46, dakuon 20, handakuon 5, yōon 33) + Katakana 46.
* Mesin kosakata: Kotoba 876, Kanji 86, Grammar 53, Kurikulum MNN 25 bab.
* Mesin Kuis yang bisa diatur (5 kategori, cakupan baris/bab, Mudah/Sedang/Sulit, nilai S/A/B/C) + Full Challenge.
* Kuis menyimak Mondai (87 soal) dengan audio asli dan alur per bab.
* Latihan menulis (Hiragana/Katakana/Kanji) — 3 tingkat, animasi urutan goresan, data goresan offline.
* Latihan bicara (kana/kotoba/kanji/puisi) dengan skor mikrofon, 3 tingkat, furigana, dan diagnosa suara on-device.
* Sistem ulangan untuk soal lemah.
* Gamifikasi: XP, Level, Streak, 45 badge, Pangkat 位階 (4 tingkat), mata uang Medaru.
* Misi harian 日課 (3) + misi mingguan 週課 (2) dengan hadiah yang bisa diklaim.
* Ekonomi: Warung 商店 (3 barang konsumsi) + Gashapon (14 pack, 4 rarity) + Tas Punggung 鞄.
* Pack suara + efek jawaban bergaya JJK (14 pack; burst/shadow/domain).
* Death Quiz 死闘 mode tanpa henti dengan sistem skill 呪術 (combo 連撃, meter 呪力, 3 skill).
* Ujian tiruan N5 (3 seksi berwaktu, 78 soal, skoring resmi) + sertifikat 合格証書 in-app.
* Tutorial 指南 — 13 topik kontekstual dalam panel balon teks Saku (bisa disembunyikan).
* PWA (bisa di-install, offline-first via `vite-plugin-pwa`), tema terang/gelap, bahasa ID/EN.
* Progres disimpan di `localStorage` (satu objek `progress`).

## 9. Kebutuhan Fitur

### 9.1 Belajar Kana (Hiragana & Katakana)

* **[EXISTING]** Hiragana dan Katakana dasar yang diorganisir per baris (あ行, か行, dst.).
* **[EXISTING]** Antarmuka flashcard: karakter, Romaji, tip, audio/pelafalan, aksi balik, sebelumnya/berikutnya, toggle mastered.
* **[EXISTING]** Dakuten (が, ざ, だ, ば) — 20 item di `hiragana.json` (`type: 'dakuon'`).
* **[EXISTING]** Handakuten (ぱ) — 5 item (`type: 'handakuon'`).
* **[EXISTING]** Yōon (きゃ, しゃ, dll.) — 33 item (`type: 'yoon'`); juga read-only di Menulis.
* **[EXISTING]** Filter subtipe (Semua / Seion / Dakuon / Handakuon / Yōon) di Belajar + Latihan.
* **[EXISTING]** Animasi urutan goresan visual (lihat 9.9 Latihan Menulis).

### 9.2 Mesin Latihan / Kuis

* **[EXISTING]** Pilih kategori (Hiragana/Katakana/Kotoba/Kanji/Grammar) dan baris/bab tertentu.
* **[EXISTING]** Pemilihan kesulitan:
  * Mudah: 5 soal, 3 opsi.
  * Sedang: 10 soal, 4 opsi.
  * Sulit: 15 soal, 6 opsi.
* **[EXISTING]** Soal dan posisi jawaban diacak.
* **[EXISTING]** Layar hasil: Skor %, Benar/Total, Nilai (S: 100%, A: 80–99%, B: 60–79%, C: <60%), Umpan balik, Ulangi.
* **[EXISTING]** "Full Challenge" mencakup semua baris kategori terpilih dalam satu sesi.

### 9.3 Kotoba (Kosakata)

* **[EXISTING]** Dataset **876** kata di `src/data/kotoba.json` (Jepang + romaji + arti + tipe).
* **[EXISTING]** Mode kuis: Jepang → Romaji + Arti (pengecoh diambil dari pool yang sama).
* **[EXISTING]** Kotoba adalah kategori kuis utama di Latihan (pilih baris/cakupan) dan ikut dalam pool Death Quiz.
* **[EXISTING]** Kotoba muncul di latihan Bicara (876 item) dengan ukuran teks bertingkat.
* **[EXISTING]** Kurikulum MNN menautkan kosakata ke bab silabus lewat `kotoba_ids` di `src/data/syllabus.json`.
* **[PLANNED]** Arah kuis tambahan (Arti → Jepang, Menyimak → Jepang) — belum dibuat.
* **[PLANNED]** Kategori semantik eksplisit (Sapaan, Angka, Waktu, …) — pengelompokan saat ini per bab, bukan per tema.

### 9.4 Kuis Campuran

* **[EXISTING]** Latihan mendukung 5 kategori: Hiragana, Katakana, Kotoba, Kanji, Grammar — plus pemilihan cakupan per baris/bab.
* **[EXISTING]** "Full Challenge" menjalankan semua baris kategori terpilih dalam satu sesi.
* **[EXISTING]** Death Quiz mencampur semua pool pilihan ganda (hiragana + katakana + kotoba + grammar + kanji = 1.165 item).
* **[PLANNED]** Satu sesi tunggal yang mencampur *semua* kategori berbobot (saat ini per-kategori atau hanya lewat Death Quiz).

### 9.5 Sistem Ulangan

* **[EXISTING]** Daftar lemah diisi dari jawaban kuis yang salah (semua kategori).
* **[EXISTING]** Rute khusus `/review` untuk melatih soal lemah langsung.
* **[EXISTING]** Jawaban benar di Ulangan menghapus item dari daftar lemah; penguasaan diperbarui secara visual.
* **[EXISTING]** `source: 'review'` dihitung untuk misi harian "Jalan Samping".

### 9.6 Gamifikasi & Progres

* **[EXISTING]** Pelacakan XP, Level, Streak, Max Streak.
* **[EXISTING]** Akurasi % dan **weighted win-rate** (`weightedWinRate`) — rating bergaya MOBA yang menambah sebagian kecil menuju 100% saat menang dan berkurang saat kalah/jawaban salah.
* **[EXISTING]** **45 badge** (`ACHIEVEMENT_META` di `src/features/progress/ProgressContext.jsx`) mencakup kategori kana/kanji/menulis/bicara/grammar/streak/waktu/skill.
* **[EXISTING]** Rak cap di Beranda (maks 4 tampil, `pickBadges`); user memilih cap mana yang dipasang di Profil.
* **[EXISTING]** **Pangkat 位階** (`src/features/progress/rank.js`) — satu-satunya sumber kebenaran ambang XP:
  * 後輩 Kouhai — 0 XP (Murid baru)
  * 先輩 Senpai — 5.000 XP
  * 先生 Sensei — 10.000 XP
  * 将軍 Shogun — 20.000 XP (tier hero: aksen emas 金, glow, cincin berputar, percikan)
* **[EXISTING]** **Medaru** メダル — mata uang emas dalam game, didapat per jawaban benar dan dari misi, dibelanjakan di Warung dan Gashapon.
* **[EXISTING]** Pangkat diekspos sebagai **string** (`getRank`), jadi gate fitur membaca `rank.startsWith('Shogun')` dan tidak akan pernah melenceng dari ambang XP.

### 9.7 Grammar

* **[EXISTING]** Dataset grammar: **53** item di `src/data/grammar.json` (pola + jawaban + penjelasan).
* **[EXISTING]** Grammar adalah kategori Latihan utama dan ikut dalam pool Death Quiz.
* **[EXISTING]** Item grammar dikelompokkan ke **Kurikulum MNN** — 25 bab silabus (`src/data/syllabus.json`), tiap bab menautkan `grammar_ids` + `kotoba_ids`, bisa ditelusuri di Belajar dan dipilih sebagai cakupan kuis di Latihan.
* **[EXISTING]** Pencapaian: 文法生 `bunpo_student`, 文法師範 `bunpo_master`.
* **[PLANNED]** Tipe kuis isi-titik / susun-kalimat (saat ini hanya pilihan ganda).

### 9.8 Membaca & Menyimak

* **[EXISTING]** Kuis menyimak **Mondai** di `/mondai` — **87** item di `src/data/mondai.json`, digerakkan file audio asli dan alur per bab (`MondaiChapterFlow.jsx`, `MondaiQuiz.jsx`).
* **[EXISTING]** Soal Mondai punya struktur `mondai-chapters.json` dan blok audio interaktif (putar/ulang, tidak bisa skip saat audio berjalan).
* **[EXISTING]** Menyimak Mondai dipakai ulang sebagai bank listening untuk ujian N5 (課題理解 / ポイント理解).
* **[EXISTING]** Pemahaman bacaan dilatih di dalam ujian N5 (内容理解 短文/中文, 情報検索) dan lewat contoh kalimat grammar.
* **[PLANNED]** Progresi bacaan bertingkat berdiri sendiri (kalimat → paragraf) di luar ujian N5.

### 9.9 Latihan Menulis (書)

* **[EXISTING]** Animasi urutan goresan untuk Hiragana, Katakana, dan Kanji (karakter tunggal).
* **[EXISTING]** Kuis menulis dengan 3 tingkat kesulitan:
  * *Tingkat 1 — Jiplak:* garis panduan selalu tampak; petunjuk setelah 3 kali salah; kelonggaran 1,4; goresan terbalik diterima. **10 XP** (kana) / **15 XP** (kanji).
  * *Tingkat 2 — Ingat:* animasi goresan diputar sekali, lalu karakter disembunyikan; petunjuk setelah 5 kali salah; kelonggaran 1,1. **15 XP** / **20 XP**.
  * *Tingkat 3 — Buta:* tanpa garis panduan, tanpa petunjuk; kelonggaran 0,85; goresan terbalik dianggap salah. **25 XP** / **35 XP**.
  * Tingkat dibuka per karakter: lulus tingkat N membuka tingkat N+1 untuk karakter itu (lulus Buta pada sebuah karakter membuatnya tetap terbuka).
* **[EXISTING]** Dikelompokkan per baris (Kana) dan kategori (Kanji); terintegrasi dengan sistem progres (mastered/XP).
* **[EXISTING]** Data goresan offline-first divendor ke `public/strokes/` (Arphic Public License + LGPL animCJK).
* **[EXISTING]** Palet tinta mode gelap per tema (`writeColorsFor`); kontras ≥ 3:1 (WCAG non-teks) dijamin oleh tes.
* **[EXISTING]** Pencapaian menulis: Goresan Pertama (平, lulus Jiplak apa pun), Penulis Buta (盲, lulus Buta apa pun), Tinta Gelap (闇, lulus Buta pada 10 karakter).
* **[PLANNED]** Kombinasi Yōon (きゃ, しゃ) — kombinasi 2 karakter saat ini read-only.

### 9.10 Latihan Bicara (話)

* **[EXISTING]** Latihan bicara untuk Hiragana (104 termasuk yoon), Katakana (46), Kotoba (876), Kanji (86), dan puisi Jepang (19: 7 klasik domain publik + 12 puisi panjang bertema).
* **[EXISTING]** Puisi bertema: 4 tema (Cinta/Kesedihan/Kesenangan/Bersyukur) × 3 puisi, bisa difilter via chip (`POEM_THEMES` + `filterPoemsByTheme` di `speaking.js`); kartu puisi menampilkan jumlah baris. 雨ニモマケズ (30 baris) ditampilkan utuh.
* **[EXISTING]** Semua teks puisi dan bacaan furigana diimpor dari sumber Aozora Bunko (青空文庫) via `scripts/import-aozora-poems.mjs` + `scripts/aozora-readings.json`; importer melempar error pada setiap rangkaian kanji yang belum dipetakan (tidak menebak).
* **[EXISTING]** Pelafalan dinilai via Web Speech API (`ja-JP`) dengan pencocokan fuzzy yang dinormalisasi kana (katakana→hiragana, tanda baca dibuang, kemiripan Levenshtein ≥ 0,7 untuk lulus).
* **[EXISTING]** Item kanji menerima bacaan onyomi/kunyomi apa pun (bacaan dipisah dari `、`, penanda okurigana ditangani).
* **[EXISTING]** Popup mikrofon saat mendengarkan (`MicOverlay` di `SpeakSession` dan `PoemSession`): ikon mic berdenyut + spektrum audio LANGSUNG yang barnya benar-benar naik-turun mengikuti suara + transkrip interim live dari Web Speech API + tombol Batal. Dua jalur sinyal aman, dipilih per perangkat: di **desktop** meter `getUserMedia` + `AnalyserNode` sungguhan menggerakkan bar (Chrome desktop toleran terhadap stream paralel); di **mobile** stream `getUserMedia` kedua TIDAK PERNAH dibuka — itu mencuri mic dari `SpeechRecognition` dan mematikan deteksi di Android/iOS (bug aslinya) — sebagai gantinya bar mengikuti event VAD `onlevel` milik engine, dengan fallback spike + decay hasil interim untuk engine yang tidak mengimplementasikan `onlevel`. Bentuknya bottom sheet ringkas (tanpa scrim layar penuh) agar soal tetap terbaca; halaman mendapat ruang bawah saat mendengarkan dan `PoemSession` auto-scroll baris yang diucapkan ke tengah viewport. Tombol Dengar/Lewati dinonaktifkan saat mic menyala (tidak ada double-skip, tidak ada TTS bocor ke mic).
* **[EXISTING]** Tiga tingkat kesulitan bebas-pilih (tanpa gate): Pandu (semua petunjuk, ×1 XP), Ingat (hanya teks, ×1,5), Buta (teks disembunyikan, arti sebagai prompt, ×2).
* **[EXISTING]** Puisi dirender baris-per-baris dengan furigana (`<ruby>`), bisa di-toggle; tiap baris yang lulus memberi 5 XP × level, dan puisi yang selesai dicatat sebagai satu item SRS (+25 XP × level).
* **[EXISTING]** Terjemahan puisi: terjemahan Indonesia **per baris** yang puitis untuk semua 19 puisi (diksi/frasa disesuaikan dengan citra puisi, bukan literal) di `src/data/poem-translations.json`; ditampilkan di `PoemSession` di balik toggle "Terjemahan" (default MATI di tingkat Buta) via modul murni `src/features/speaking/poemTranslation.js`.
* **[EXISTING]** Halaman Belajar punya **section "Puisi 詩"** khusus — puisi lengkap read-only + furigana + terjemahan Indonesia per baris + audio + **kredit penulis** (nama + bacaan + romaji + tanggal hidup; tautan sumber Aozora untuk puisi bertema, "karya klasik · domain publik" untuk klasik) via `src/features/learn/PoemReader.jsx` + `src/features/speaking/poemCredits.js` — tanpa XP/skoring/SRS. Tab puisi di Bicara tetap sebagai latihan pelafalan.
* **[EXISTING]** XP dasar per tipe konten: kana 8, kotoba 10, kanji 12, baris puisi 5, puisi 25. Pencapaian: Suara Pertama (声), Pembaca Puisi (詩, 3 puisi).
* **[EXISTING]** Fallback self-assess ("Sudah Baca") untuk browser tanpa SpeechRecognition (Firefox) — tanpa skoring, tanpa XP, tanpa SRS.
* **[EXISTING]** Fit mobile: 5 tab konten dirender sebagai grid 5 kolom tetap (semua tab terlihat di 320px — tidak ada scroll horizontal tersembunyi), kartu grid berukuran sesuai jumlah karakter (`gridTextSize` — kana yoon tidak pernah wrap, kotoba maks 2 baris, tinggi baris seragam via `auto-rows-fr`), dan teks sesi besar bertingkat sesuai panjang (`speakTextSize` — hero 80/120px untuk ≤3 karakter, menurun bertahap sehingga kotoba 10 karakter menjadi 2 baris di 320px). Tombol aksi sesi membungkus dengan label ringkas dan tombol Lewati tampil ikon-saja di bawah `sm`.
* **[EXISTING]** **Perbaikan skor kanji→kana:** Web Speech API sering mengembalikan kanji untuk target kana (か → 蚊/花), yang dulu bernilai 0. `src/features/speaking/kanaReadings.js` (`KANA_KANJI`, `KANJI_TO_KANA`, `WORD_READINGS`, `readingCandidates`) memperluas tiap target ke semua bacaan valid, sehingga suara yang jelas tidak lagi terbaca "Belum pas".
* **[EXISTING]** **Kotak hasil selalu tampil:** `SpeakSession` selalu merender `Terdengar: <teks> · target: X`, termasuk kasus eksplisit saat engine tidak mendengar apa pun — sehingga kegagalan bisa didiagnosis sekilas, bukan diam-diam tidak melakukan apa-apa.
* **[EXISTING]** **Panel diagnosa suara opt-in** ("🔍 Diagnosa suara", `src/features/speaking/SpeechDiagnosticsPanel.jsx`): merekam event ASR asli via callback opsional `onEvent` di `useSpeechRecognition` (`speechLog.js`), meringkasnya (`speechDiagnostics.js`), memeriksa lingkungan (`speechEnv.js` — izin mic, dukungan browser, secure context), menyediakan tes mic, dan menghasilkan laporan yang bisa disalin. `vite.config.js` menyuntikkan `__BUILD_ID__` (SHA commit) agar panel bisa memastikan bundle mana yang benar-benar berjalan.
* **[EXISTING]** Kategori tema puisi (Cinta/Kesedihan/Kesenangan/Bersyukur, 3 masing-masing) rilis 26/09; 百人一首 masih [PLANNED] jika diminta.

### 9.11 Ujian N5 模擬試験 (Ujian Tiruan JLPT N5)

* **[EXISTING]** Mock exam tiruan JLPT N5 yang meniru ujian asli semirip mungkin. Gate unlock: rank **Shogun** (XP ≥ 20.000) **DAN** minimal **30 kanji** berstatus `mastered` di `itemProgress` (id `kj_*`). Gate tunggal lewat `isN5ExamUnlocked(rank, countMasteredKanji(itemProgress))` di `src/features/n5exam/n5exam.js`.
* **[EXISTING]** Blueprint resmi (jlpt.jp): **3 seksi berwaktu** — Pengetahuan Bahasa (Kosakata) 20 mnt, Pengetahuan Bahasa (Tata Bahasa)・Membaca 40 mnt, Menyimak 30 mnt. Total **90 menit**. Tiap seksi punya timer sendiri; waktu habis → seksi auto-kumpul, **tidak bisa balik** ke seksi sebelumnya (seperti ujian asli).
* **[EXISTING]** **78 soal** persis komposisi sampel resmi N5 (22 / 32 / 24), mencakup 14 tipe mondai: 漢字読み, 表記, 文脈規定, 言い換え類義, 文の文法1, 文の文法2 (★), 文章の文法, 内容理解(短文), 内容理解(中文), 情報検索, 課題理解, ポイント理解, 発話表現, 即時応答.
* **[EXISTING]** **Skoring resmi:** total 0–180, lulus **≥80**; sectional Kosakata+Tata Bahasa+Membaca **≥38/120** dan Menyimak **≥19/60**. Gagal satu seksi = gagal total. Skor dipetakan proporsional dari jumlah benar (aproksimasi offline dari IRT asli). Hasil menampilkan skor per seksi + breakdown per tipe mondai + verdict LULUS/GAGAL.
* **[EXISTING]** **Bank hibrida:** tipe yang bisa dibangun otomatis dari pool lama — 漢字読み dari `kanji.json`, 文の文法1 dari `grammar.json`, listening (課題理解/ポイント理解) dari `mondai.json` + mp3 asli. Sisanya (表記/文脈規定/言い換え/★/文章の文法/読解/情報検索/発話/即時応答) di-author di `src/data/n5-exam.json`.
* **[EXISTING]** **Bank soal hibrida (rincian):** `src/data/n5-exam.json` berisi **67 soal authored** dalam **10 tipe mondai** (tipe yang tidak bisa dibangun otomatis); tiap run mengambil **42** di antaranya. Sisanya — **36 soal** — dibangun otomatis saat runtime dari pool yang ada (漢字読み dari `kanji.json`, 文の文法1 dari `grammar.json`, listening dari `mondai.json` + mp3). Total **78 soal** sesuai komposisi sampel resmi N5 (22 / 32 / 24).
* **[EXISTING]** **Furigana**: semua teks Jepang ber-kanji (passage, prompt, opsi, explanation) dirender lewat `<Furigana/>` (format `漢字[かんじ]`) supaya pembaca N5 tetap bisa membaca soal kanji.
* **[EXISTING]** Reward: +15 XP tiap jawaban benar via `recordAnswer`; run selesai lewat `completeQuiz` (menambah win-rate berbobot + Medaru seperti kuis lain). Keluar sukarela = tanpa penalti.
* **[EXISTING]** **Sertifikat & badge kelulusan (fiktif, in-app):** tiap run disimpan ke `progress.n5Exam` lewat `recordN5Exam(result)` (rekor terbaik, `passed` lengket, tidak dicabut). Membuka 3 badge hanko — **合 N5 合格**, **優 N5 優良** (skor ≥140/180), **満 N5 満点** (180/180) — dan sebuah **合格証書** (sertifikat) di Profil → tab "🏆 Sertifikat", lengkap dengan nama, skor per seksi, nomor sertifikat deterministik (`N5-<tahun>-<6digit>`), predikat (合格/優良/満点), tanggal, dan tombol Cetak/Simpan PDF (CSS `@media print` → hanya kartu sertifikat yang tercetak). Sertifikat diberi label jelas **fiktif, BUKAN sertifikat JLPT resmi**.

### 9.12 Death Quiz 死闘

* **[EXISTING]** Mode endless eksklusif untuk **rank Shogun** (XP ≥ 20.000) — gate diturunkan dari string rank (`getRank`), bukan ambang XP kedua, sehingga tidak mungkin melenceng.
* **[EXISTING]** Konten = semua pool pilihan ganda (hiragana 104 + katakana 46 + kotoba 876 + grammar 53 + kanji 86 = 1.165 item). **Mondai dikecualikan**: audionya 30–60 dtk, tidak cocok dengan timer 7 dtk per soal (konsisten dengan spesifikasi pengguna sendiri "ada waktunya sama kaya quiz lain").
* **[EXISTING]** Antrean endless: pool diacak dan diisi ulang otomatis saat habis; item yang sama tidak pernah muncul dua kali berturut-turut (dijaga melintasi batas pengisian ulang). Run hanya berakhir saat mati (nyawa 0) atau keluar sukarela yang dikonfirmasi.
* **[EXISTING]** 3 nyawa (命). Jawaban salah **atau** timeout memakan 1 nyawa. Di 0 nyawa → mati.
* **[EXISTING]** Timer 7 dtk per soal (sama seperti mode Sulit), reset tiap soal, berubah merah/berdenyut di ≤ 3 dtk.
* **[EXISTING]** Ekonomi: **+40 XP** per jawaban benar (lewat `recordAnswer` yang ada → SRS + soal lemah + bonus streak tetap terjaga), **−300 XP** hanya saat mati, diterapkan via aksi khusus `loseXp` (dibatasi ≥ 0, level dihitung ulang; TIDAK menyentuh streak/pencapaian). Win-rate tidak tersentuh (run "jawab 1, lalu keluar" tidak boleh dihitung menang). Keluar sukarela tidak memakan biaya.
* **[EXISTING]** **Kompensasi Medaru** — mode ini paling berisiko, jadi run yang selesai juga membayar emas (skema meningkat): `5 × skor` + bonus milestone `25 × floor(skor / 10)` (10 → +75, 20 → +150, 40 → +300). Dibayar di akhir run via aksi khusus `gainMedaru`, dan hanya saat run benar-benar berakhir (mati atau "menyerah") — keluar sukarela melepaskannya. Guard anti-farm: skor di bawah **5** membayar **0**, jadi "jawab 1 lalu keluar" tidak bisa di-farm. HUD live menampilkan pratinjau hadiah tertunda (🪙 `+N`) dan layar game-over menampilkan Medaru persis yang didapat.
* **[EXISTING]** `kabel_jumper` (Kabel Jumper, 800 Medaru) adalah item revive: di 0 nyawa, jika pemain memilikinya, layar revive menawarkan "Pakai Kabel Jumper" → mengonsumsi 1 item, memulihkan 1 nyawa, dan run lanjut dengan skor/antrean utuh. Di Inventory, jumper menampilkan label info ("Dipakai otomatis di Death Quiz") alih-alih tombol PAKAI generik agar tidak terbuang di tempat lain.
* **[EXISTING]** Voicepack berjalan otomatis (semua pack) via `triggerEffect('correct'|'wrong')` + `resetEffectStreak()` saat mulai — visual + suara berperilaku persis seperti di kuis lain.
* **[EXISTING]** Beranda menampilkan kartu ke-6 ("Death Quiz", 死) yang selalu terlihat: terbuka → aktif; terkunci → redup dengan subtitle "🔒 Rank Shogun", mengarah ke layar terkunci yang menampilkan rank saat ini dan progres XP menuju 20.000.
* **[EXISTING]** **Sistem skill 呪術** (`src/features/deathquiz/deathSkills.js`, murni + teruji): penghitung **combo 連撃** dan **meter 呪力 (energi kutukan)** yang terisi dari jawaban benar, menjadi bahan bakar **3 skill aktif** yang bisa ditembakkan di tengah run. Skill dikonsumsi dari meter, jadi mode ini menghargai rentetan benar, bukan spam tombol.

### 9.13 Tutorial 指南 (Panduan Kontekstual)

* **[EXISTING]** **13 topik** (`src/features/tutorial/tutorials.js`) — Mulai dari Mana?, Belajar Huruf & Kata, Kuis Latihan, Latihan Menulis, Latihan Bicara, Mondai (Listening), Ulang Soal Lemah, Warung & Gacha, Tas Punggung, Death Quiz 死闘, Ujian N5 模擬試験, Pengaturan, Profil & Cap.
* **[EXISTING]** Tombol mengapung (kanan-bawah, semua halaman) membuka **panel balon teks Saku** yang isinya **kontekstual** — `tutorialFor(pathname)` memetakan rute aktif ke topik yang cocok (`DEFAULT_TUTORIAL_KEY = 'home'` untuk rute tak dikenal).
* **[EXISTING]** Badge topik belum dibaca: tombol menampilkan berapa topik di halaman ini yang belum dibaca (`unseenCount`); membaca topik memanggil `markTutorialSeen(pathname)` (disimpan di `progress.tutorialSeen`).
* **[EXISTING]** **Bisa disembunyikan:** aksi "Sembunyikan" di header panel menyembunyikan tombol permanen (`progress.tutorialHidden = true`, helper murni `ensureTutorialHidden` / `tutorialButtonVisible`). Nyalakan lagi dari Pengaturan → Tampilan → "Tombol Tutorial".
* **[EXISTING]** `resetProgress` mengembalikan `tutorialSeen` dan `tutorialHidden` ke default.

### 9.14 Misi Harian 日課 & Misi Mingguan 週課

* **[EXISTING]** Logika murni di `src/features/quests/quests.js` (tanpa React, tanpa storage), diuji via `node --test`.
* **[EXISTING]** **3 misi harian**, reset tiap tengah malam waktu lokal (`dateKey`), progres dihitung dari aktivitas nyata (jawaban benar + sesi selesai) — tanpa timer:
  * **Rajin Menjawab** — 20 jawaban benar hari ini → 80 XP + 40 Medaru.
  * **Tuntas Sesi** — selesaikan 2 sesi kuis → 120 XP + 60 Medaru.
  * **Jalan Samping** — 1 sesi mode sampingan (Menulis / Bicara / Ulang / Puisi) → 150 XP + 80 Medaru.
* **[EXISTING]** **2 misi mingguan**, reset tiap Senin (`weekStart`/`weekKey`, waktu lokal):
  * **Tekun Seminggu** — 100 jawaban benar minggu ini → 400 XP + 250 Medaru.
  * **Konsisten** — 10 sesi kuis minggu ini → 500 XP + 300 Medaru.
* **[EXISTING]** Panel harian di Beranda (`DailyQuestPanel.jsx`); bisa diklaim saat `done && !claimed` (`canClaim` / `markClaimed`), dengan toast "Klaim Berhasil" (auto-hilang ~2,8 dtk).
* **[EXISTING]** State ada di `progress.quests` (harian) dan `progress.weekly`; `recordAnswer` menaikkan counter via `bumpEvent` / `weekBump`; `resetProgress` menghapus keduanya.
* **[EXISTING]** XP diberikan oleh ProgressContext; Medaru diberikan via aksi khusus `gainMedaru`.

### 9.15 Warung 商店, Gashapon & Tas Punggung

* **[EXISTING]** **Warung** di `/shop` (`src/features/shop/Shop.jsx`): bagian Gashapon (tarik pack) + etalase barang konsumsi.
* **[EXISTING]** **Barang konsumsi** (`src/features/items/items.js`), dibeli dengan Medaru:
  * **Kopi Kaleng Boss** 缶コーヒー — 500 Medaru — EXP ×2 selama 30 menit.
  * **Selotip Kaset** カセットテープ — 1.200 Medaru — menyambung streak yang putus.
  * **Kabel Jumper** ジャンパーケーブル — 800 Medaru — 1× hidup di Death Quiz.
* **[EXISTING]** Helper item murni dan immutable (`addItem`, `removeItem`, `countItems`, `inventoryList`) dengan nama ID/EN (`itemName` / `itemDesc`).
* **[EXISTING]** **Gashapon** — overlay mesin slot (`src/features/gacha/GachaSlotOverlay.jsx`); pool dan peluang dari `src/features/packs/packs.js` (`gachaPoolInfo`, `rarityOdds`, `rollPackId`). Pack berharga 2.500 Medaru; hasil langsung masuk Tas Punggung.
* **[EXISTING]** **14 pack** dengan 4 rarity (`common` / `rare` / `legendary` / `special`): Hina Chono (legendary), Sumi Taiko (legendary), Gojo Satoru (special), Nobara Kugisaki, Yuji Itadori, Megumi Fushiguro, Nanami Kento, Yuta Okkotsu (legendary), Toji Fushiguro (legendary), Ryomen Sukuna (special), plus pack placeholder.
* **[EXISTING]** **Tas Punggung** di `/inventory` (`src/features/inventory/Inventory.jsx`): pack yang dimiliki, pack aktif (satu saja), dan barang konsumsi. `kabel_jumper` menampilkan label info, bukan tombol "PAKAI" generik, supaya tidak terbuang di luar Death Quiz.
* **[EXISTING]** State: `progress.ownedPacks`, `progress.activePack`, `progress.ownedItems`.

### 9.16 Pack Suara & Efek Jawaban

* **[EXISTING]** Satu "pack" menggabungkan **efek visual** + **set suara** (`src/features/packs/packs.js`); `isPackReady(pack)` mensyaratkan `visual` dan `voice` keduanya ada.
* **[EXISTING]** `EffectProvider` (`src/features/effects/EffectContext.jsx`) mengekspos `triggerEffect('correct' | 'wrong')` dan `resetEffectStreak()`; kuis memanggilnya tiap jawaban, jadi pack aktif menggerakkan visual sekaligus suara.
* **[EXISTING]** Efek bergaya JJK: komponen **Burst** + **Shadow** per karakter (Gojo, Megumi, Nanami, Nobara, Sukuna, Toji, Yuji, Yuta), plus ultimate — Gojo 領域展開 `GojoDomainCine`, Sukuna Domain, Yuji `Takeover`, Gojo `Spheres`.
* **[EXISTING]** `EffectContext` dibatasi per rute lewat `effectGate.js` — ujian N5 berjalan dengan **semua efek dibisukan** (tanpa suara, tanpa visual).
* **[EXISTING]** Klip suara ada di `public/voices/<pack>/` dan dideklarasikan di `src/features/audio/voices.js` (`VOICES`), dengan klip benar/salah/streak/kalah khusus per pack.
* **[EXISTING]** 49 `@keyframes` di `src/index.css` menggerakkan animasi efek; `fxLifecycle.js` menyusun urutannya.
* **[EXISTING]** VoiceSync menjaga audio pack yang berbunyi tetap sinkron dengan pilihan pack aktif.

### 9.17 Profil & Sertifikat

* **[EXISTING]** `/profile` (`src/features/profile/Profile.jsx`) punya **3 tab**:
  * **ID Card** — nama/avatar, lencana Pangkat 位階 (perlakuan hero di Shogun), level, XP, streak, cap terpasang.
  * **Statistik** — rincian penguasaan per subjek dari `src/features/profile/subjectMastery.js` (`buildSubjectMastery`, `SUBJECT_ORDER`, `STATUS_WEIGHT` = mastered 1 / familiar 0,66 / learning 0,33).
  * **Sertifikat** — sertifikat N5 合格証書 (lihat §9.11), dengan Cetak/Simpan PDF.
* **[EXISTING]** Pemilihan cap: user memilih cap mana yang dipasang (`selectedBadges`); Beranda menampilkan maks 4 (`BADGE_DISPLAY_MAX`).
* **[EXISTING]** `badgeSeal.js` mengklasifikasi badge (legendary vs biasa) dan menyediakan gaya segel.

### 9.18 Pengaturan

* **[EXISTING]** `/settings` (`src/pages/Settings.jsx`) dengan bagian:
  * **Tampilan** — mode tema (terang/gelap), bahasa aplikasi (ID/EN), dan toggle **"Tombol Tutorial"** (Tampil / Sembunyi).
  * **Tentang** — identitas aplikasi (日本語学園 · Nihongo Gakuen) dan kredit.
  * **Dedikasi** — catatan dedikasi.
  * **Zona Bahaya** — "Reset Semua Data" (`resetProgress`), yang menghapus XP/level/streak/badge/pack/item/misi/state tutorial.
* **[EXISTING]** Tema diterapkan ke `<html>` via `data-theme` + kelas `.dark`; tema awal mengikuti `prefers-color-scheme` saat pertama kali, lalu `localStorage.app_theme`.
* **[EXISTING]** Bahasa disimpan di `localStorage.ui_language` (default `en`); `LanguageProvider` mengganti teks di seluruh app.

## 10. Kebutuhan UX

* **Fokus:** Tanpa distraksi. UI harus langsung mendukung loop belajar.
* **Recall Aktif:** Pengguna harus menebak sebelum melihat jawaban kapan pun memungkinkan.
* **Umpan Balik:** Umpan balik visual dan fisik (animasi) yang langsung dan tidak ambigu untuk aksi benar/salah.
* **Progresi:** Gamifikasi harus terasa layak didapat dan sekunder terhadap pemerolehan bahasa yang sesungguhnya.

## 11. Sistem Desain Visual

**Arah:** MODERN JAPANESE EDITORIAL.
UI TIDAK boleh menyerupai dasbor SaaS generik, klon Duolingo, atau bergantung pada tropes anime/sakura hasil AI.

* **Palet:**
  * *Sumi (Tinta Gelap):* Teks utama dan border kontras tinggi.
  * *Ai (Indigo Tua):* Tombol utama, status aktif.
  * *Shu (Vermilion):* Aksen, jawaban salah, notifikasi, stempel Hanko.
  * *Kinari (Kertas Hangat):* Latar belakang, muka kartu.
  * *Matcha (Hijau Muted):* Status sukses, nilai S, badge mastered.
* **Tekstur/Pola:** Grain kertas Washi halus, pola Seigaiha/Asanoha pada opasitas rendah, dekorasi sapuan kuas organik.
* **Tipografi:** Gaya editorial Jepang (sans-serif bersih untuk UI, Mincho/Gothic yang sangat terbaca untuk karakter Jepang).
* **Bentuk:** Kartu agak membulat, tombol radius sedang, segel Jepang melingkar (Hanko) untuk pencapaian/nilai, bentuk persegi bersih untuk bar progres.
* **Tema:** mode **terang + gelap** penuh (`data-theme` di `<html>`), dengan palet tinta gelap khusus untuk kanvas Menulis (`writeColorsFor`, kontras ≥ 3:1 dijamin tes).
* **Efek jawaban:** animasi burst/shadow/domain bergaya JJK yang digerakkan pack suara aktif (§9.16), plus stempel Hanko untuk nilai dan badge.

## 12. Panduan Animasi

* **[EXISTING]** Stack: Framer Motion (transisi halaman, gerak kartu) + CSS keyframes (`src/index.css`, 49 keyframes) untuk animasi efek.
* **[EXISTING]** Efek menghormati `prefers-reduced-motion` dan dibatasi per rute (§9.16).
* **Animasi Wajib:**
  * Transisi halaman (fade + drift naik sedikit).
  * Balik flashcard (rotasi 3D dengan fisika spring).
  * Transisi soal kuis (slide masuk/keluar).
  * Jawaban benar: pembesaran halus + pergeseran warna.
  * Jawaban salah: goyangan horizontal cepat + pergeseran warna.
  * Teks XP mengapung saat kuis selesai.
  * Pengisian bar progres yang mulus dan eased.
  * Stempel pencapaian: mengecil dan terkunci di tempat dengan rotasi sedikit (efek Hanko).
  * Hover/tekan tombol: mengecil sedikit agar terasa taktil.
* **Batasan:** Hindari bouncing berlebihan, spam partikel, dan gradien mencolok. Gerak harus terasa sengaja dan berakar pada material fisik.

## 13. Spesifikasi Layar

### 13.1 Beranda

* Identitas/logo produk (日本語学園 · Nihongo Gakuen).
* Hero: Level, XP, Streak, dan lencana Pangkat 位階 (perlakuan hero di Shogun).
* Rak cap: maks 4 badge yang dipilih user.
* Panel Misi Harian 日課 (3 misi, klaim hadiah) dan ringkasan Misi Mingguan 週課.
* Kartu navigasi: Belajar, Latihan, Mondai, Ulang, Menulis, Bicara, Death Quiz, Ujian N5.
* Tombol menuju Profil dan Pengaturan.

### 13.2 Belajar

* Tata letak vertikal/grid baris Hiragana/Katakana.
* Tampilan flashcard modal/overlay.
* Tombol toggle mastered yang jelas.
* Pemicu audio pelafalan.

### 13.3 Latihan (Penyiapan Kuis)

* Pemilihan kategori (Hiragana, Katakana, Kotoba, Kanji, Grammar).
* Pemilihan cakupan (baris/bab tertentu vs. Semua).
* Toggle kesulitan (Mudah/Sedang/Sulit).
* Aksi "Mulai Kuis" yang sticky.

### 13.4 Sesi Kuis

* Bar atas: penghitung soal (mis. 3/10) dan bar progres linear.
* Tengah: konten Jepang besar dan sangat terbaca.
* Bawah/Grid: opsi jawaban (target sentuh besar).
* Umpan balik warna/animasi langsung saat memilih.

### 13.5 Hasil Kuis

* Huruf Nilai besar (S/A/B/C) bergaya segel Hanko.
* Persentase skor dan rasio Benar/Total.
* Animasi XP yang didapat.
* Daftar soal yang dijawab salah (ditambahkan ke soal lemah).
* Aksi: Ulangi, Ke Ulangan, Kembali ke Beranda.

### 13.6 Ulangan

* Daftar/Grid soal lemah saat ini.
* Tombol "Mulai Ulangan".
* Memperbarui penguasaan secara visual setelah ulangan berhasil.

### 13.7 Profil

* Tiga tab: **ID Card** (nama/avatar, lencana Pangkat, level, XP, streak, cap terpasang), **Statistik** (rincian penguasaan per subjek), **Sertifikat** (sertifikat N5, cetak/simpan PDF).
* Grid badge: semua 45 badge (terkunci vs terbuka); user memasang badge mana yang ditonjolkan.
* Statistik detail: Global Mastery %, Akurasi %, Weighted Win-Rate, Total XP, Level, Streak / Max Streak.

### 13.8 Warung 商店

* Bagian Gashapon: pool saat ini, peluang per rarity, dan aksi tarik (overlay mesin slot).
* Etalase: 3 barang konsumsi dengan harga (Medaru), deskripsi, dan aksi BELI.
* Saldo Medaru ditampilkan di header.

### 13.9 Tas Punggung

* Pack yang dimiliki (dengan gaya rarity) dan pemilih pack aktif.
* Barang konsumsi beserta jumlah; `kabel_jumper` menampilkan label info, bukan tombol "PAKAI".

### 13.10 Mondai (Menyimak)

* Alur bab → layar soal dengan blok audio interaktif (putar/ulang; skip nonaktif saat audio berjalan).
* Opsi pilihan ganda; umpan balik langsung; layar hasil di akhir bab.

### 13.11 Death Quiz 死闘

* HUD: nyawa 命, skor, timer 7 dtk per soal, combo 連撃, meter 呪力, 3 tombol skill, pratinjau Medaru tertunda.
* Layar revive saat nyawa 0 dan punya Kabel Jumper.
* Layar game-over dengan ringkasan XP/Medaru.

### 13.12 Ujian N5 模擬試験

* Header seksi dengan timer sendiri; tidak bisa kembali ke seksi yang sudah selesai.
* Layar soal dengan teks Jepang ber-furigana; auto-kumpul saat waktu habis.
* Layar hasil: skor per seksi, rincian per tipe mondai, verdict LULUS/GAGAL, sertifikat.

### 13.13 Pengaturan

* Tampilan: toggle tema, toggle bahasa, toggle tombol Tutorial.
* Tentang + Dedikasi; Zona Bahaya (reset semua data).

## 14. Logika Kuis

* **[EXISTING]** Soal diambil secara dinamis berdasarkan pilihan pengguna.
* **[EXISTING]** Pengecoh (jawaban salah) dipilih acak dari kategori/pool yang sama dengan jawaban benar.
* **[NEEDS DECISION]** Logika untuk menghasilkan pengecoh pada soal Grammar/Kalimat yang kompleks.
* **[EXISTING]** Nilai: S (100%), A (80–99%), B (60–79%), C (<60%).

## 15. Logika Penguasaan & Ulangan

* **[EXISTING]** Soal yang dijawab salah masuk ke daftar lemah (semua kategori).
* **[EXISTING]** Jawaban benar di Ulangan menghapus item dari daftar lemah; penguasaan diperbarui secara visual.
* **[EXISTING]** SRS sederhana per item (`itemProgress[id] = { correctCount, incorrectCount, streak, lastReviewed, nextReview, status }`):
  * `streak` = jumlah jawaban benar beruntun; satu jawaban salah meresetnya ke 0.
  * Status: `streak >= 3` → `mastered`; `streak >= 2` → `familiar`; selain itu `learning`.
  * `nextReview` = hari ini + `2^streak` hari (saat benar), atau +1 hari (saat salah).
* **[EXISTING]** Antrean soal lemah = item dengan `nextReview <= hari ini` ATAU `status === 'learning'`.
* **[NEEDS DECISION]** Parameter SRS yang lebih kaya (interval tetap, ease factor) — saat ini memakai `2^streak` sederhana.

## 16. Logika XP & Pencapaian

* **[EXISTING]** XP dasar per jawaban benar: default **10** (`recordAnswer`); Bicara: kana 8, kotoba 10, kanji 12, baris puisi 5, puisi 25.
* **[EXISTING]** Pengali XP per kesulitan: Mudah ×0,8, Sedang ×1,0, Sulit ×1,2 (`DIFFICULTY_MAP`).
* **[EXISTING]** Bonus streak: **+5% XP** tiap jawaban benar saat streak aktif (`STREAK_BONUS_RATE = 0.05`; aktif saat streak ≥ 1 hari).
* **[EXISTING]** Ambang Level meningkat secara progresif.
* **[EXISTING]** Evaluasi lokal pemicu Pencapaian di akhir setiap sesi kuis.
* **[EXISTING]** **Medaru** メダル — didapat per jawaban benar (`MEDARU_PER_CORRECT = 2`) dan dari misi/milestone Death Quiz; dibelanjakan di Warung dan Gashapon. Diberikan via aksi khusus `gainMedaru(amount)`.
* **[EXISTING]** Pembaruan weighted win-rate: `WIN_GAIN_RATE = 0.1` menuju 100% per kemenangan, `LOSS_RATE = 0.15` saat kalah total, `PER_WRONG_RATE = 0.02` per jawaban salah.
* **[EXISTING]** Penalti Death Quiz: saat mati, run mengurangi 300 XP melalui aksi khusus `loseXp(amount)` — dibatasi di 0, level dihitung ulang, dan sengaja melewati `addXp` sehingga streak harian dan bonus +5%-nya tidak tersentuh. Keluar sukarela tidak menerapkan penalti; win-rate tidak pernah diubah oleh mode ini. Penyeimbangnya adalah Medaru: run yang selesai membayar `5 × skor + 25 × floor(skor/10)` emas via aksi khusus `gainMedaru(amount)` (skor < 5 → 0), sehingga risikonya dikompensasi, bukan semata menghukum.

## 17. Model Data

Semua progres disimpan di browser `localStorage` sebagai **satu objek `progress`** (plus beberapa kunci terpisah: `app_theme`, `ui_language`).

Bentuk `progress` (`DEFAULT_PROGRESS` di `src/features/progress/ProgressContext.jsx`):

| Kunci | Tipe | Arti |
|---|---|---|
| `xp` | int | Total pengalaman |
| `level` | int | Level (turunan dari XP) |
| `accuracy` | float | Akurasi mentah |
| `weightedWinRate` | float | Rating bergaya MOBA 0–100 |
| `matchesPlayed` | int | Sesi yang diselesaikan |
| `medaru` | int | Mata uang emas |
| `totalAnswered` | int | Total jawaban seumur hidup |
| `totalCorrect` | int | Total jawaban benar |
| `streak` / `maxStreak` | int | Streak harian saat ini / terbaik |
| `ownedPacks` | string[] | Id pack yang dimiliki |
| `activePack` | string \| null | Pack yang sedang dipakai |
| `ownedItems` | `{ [id]: qty }` | Barang konsumsi |
| `n5Exam` | object | Rekor N5 terbaik (`emptyExamRecord()`), `passed` lengket |
| `lastActiveDate` | string | `YYYY-MM-DD` lokal |
| `quests` | object | State misi harian (`emptyQuests()`) |
| `weekly` | object | State misi mingguan (`emptyWeekly()`) |
| `tutorialSeen` | object | `{ [tutorialKey]: true }` |
| `tutorialHidden` | boolean | Tombol Tutorial disembunyikan |

Penyimpanan progres item terpisah: `itemProgress` (`{ hiragana|katakana|kotoba|kanji|grammar: { [id]: 'new'|'learning'|'weak'|'mastered' } }`), plus `achievements` (id) dan `selectedBadges`.

*Data statis (JSON diimpor lokal, bukan di localStorage):* `hiragana.json` (104), `katakana.json` (46), `kotoba.json` (876), `kanji.json` (86), `grammar.json` (53), `mondai.json` (87) + `mondai-chapters.json`, `n5-exam.json`, `poems.json` (19) + `poem-translations.json` (19), `syllabus.json` (25 bab). Data goresan divendor ke `public/strokes/`; klip suara ke `public/voices/<pack>/`.

## 18. Batasan Teknis

* **Stack:** React **19**, Vite **8**, Tailwind CSS **v4**, Framer Motion, `vite-plugin-pwa`, `oxlint`.
* **PWA:** bisa di-install, offline-first via `vite-plugin-pwa` (service worker + manifest). Aset statis (audio, data goresan, suara) dibundel atau di-precache — tanpa panggilan API untuk loop inti.
* **Identitas build:** `vite.config.js` menyuntikkan `define: { __BUILD_ID__ }` (SHA commit bila tersedia, jika tidak timestamp) agar app bisa menampilkan bundle mana yang benar-benar berjalan (dipakai panel diagnosa Bicara).
* **Arsitektur:** komponen UI di `src/components/`, logika fitur di `src/features/<fitur>/` (modul `.js` murni dipisah dari UI `.jsx`), halaman di `src/pages/`, data statis di `src/data/`. Modul logika murni diuji dengan `node --test`.
* **Tes:** 884 tes lulus (`npm test`); lint via `oxlint` (wajib 0 error).

## 19. Aksesibilitas

* **Sentuh:** Opsi jawaban dan tombol navigasi harus punya target sentuh minimal 44×44px.
* **Keyboard:** Navigasi keyboard penuh untuk sesi kuis (mis. tombol angka 1–6 untuk memilih jawaban, Spasi/Enter untuk lanjut).
* **Visual:** Rasio kontras minimal WCAG AA, terutama terhadap latar Kinari (kertas hangat). Status Benar/Salah harus memakai ikon atau label teks, tidak semata mengandalkan warna Matcha/Shu.
* **Gerak:** Hormati media query CSS `prefers-reduced-motion` dengan menonaktifkan animasi shake/flip dan beralih ke fade.

## 20. Desain Responsif

* **Pendekatan mobile-first.**
* **Mobile:** Satu kolom, aksi berjangkar bawah untuk jangkauan jempol yang mudah.
* **Tab bar harus muat di 320px:** strip tab berisi 5+ item memakai grid tetap (`grid-cols-5`) alih-alih scroll horizontal — scrollbar tersembunyi bukan affordance yang bisa ditemukan, jadi tab yang tidak muat terbaca sebagai "terpotong". Label mengecil (`text-[9px]`, `tracking-normal`) dan glyph Jepang berada di bawahnya.
* **Kartu grid (Bicara):** Karakter Jepang berlebar penuh (1 em masing-masing), jadi lebar teks kartu ≈ jumlah karakter × ukuran font. Ukuran font grid bertingkat sesuai jumlah karakter (`gridTextSize`) agar tidak ada kartu yang melebihi 2 baris di 320px; kana yoon (2 karakter) memakai `whitespace-nowrap` agar tidak pernah wrap, dan baris memakai `auto-rows-fr` untuk tinggi seragam.
* **Teks sesi besar (Bicara):** font bertingkat sesuai jumlah karakter (`speakTextSize`) — 1–3 karakter mempertahankan ukuran hero 80px/120px, item yang lebih panjang menurun bertahap — sehingga kotoba 10 karakter muat dalam 2 baris di 320px alih-alih 3.
* **Tablet:** Tata letak dua kolom untuk layar Progres dan Ulangan.
* **Desktop:** Kontainer max-width yang dibatasi (mis. `max-w-2xl` atau `max-w-4xl`) dipusatkan di layar untuk menjaga proporsi editorial; jangan melebar penuh.

## 21. Performa

* Transisi antar-soal instan (<50ms).
* File audio harus dipramuat untuk sesi kuis aktif guna mencegah lag saat balik/pelafalan.
* Ukuran bundel dijaga minimal; lazy load fase terpisah (mis. modul Ujian N5) jika tumbuh terlalu besar.

## 22. Peta Jalan Terkirim (sudah jadi)

* **Fase 1 — Fondasi:** flashcard Hiragana/Katakana, mesin Latihan, kesulitan, hasil, localStorage. ✅
* **Fase 2 — Ulangan & Gamifikasi:** layar Ulangan, soal lemah, XP, Level, Streak, 45 badge, Profil. ✅
* **Fase 3 — Kana Lengkap:** Dakuten, Handakuten, Yōon, Full Challenge. ✅
* **Fase 4 — Katakana Lengkap:** paritas dengan Hiragana. ✅
* **Fase 5 — Kotoba Diperluas:** 876 kata, pengelompokan per bab. ✅
* **Fase 6 — Kuis Campuran:** 5 kategori + Full Challenge. ✅
* **Fase 7 — Grammar:** 53 pola + Kurikulum MNN (25 bab). ✅
* **Fase 8 — Membaca & Menyimak:** menyimak Mondai (87) + bacaan N5. ✅
* **Fase 9 — Menulis / Bicara / Death Quiz / Ujian N5 / Ekonomi / Tutorial.** ✅

## 23. Peta Jalan Mendatang (belum dibuat)

* Arah kuis Kotoba tambahan (Arti → Jepang, Menyimak → Jepang).
* Progresi bacaan bertingkat berdiri sendiri di luar ujian N5.
* Tipe kuis grammar isi-titik / susun-kalimat.
* Set puisi 百人一首 (Hyakunin Isshu), bila diminta.
* ASR on-device opsional (transformers.js Whisper) untuk browser tanpa Web Speech API.
* Latihan menulis Yōon (kombinasi 2 karakter saat ini read-only).

## 24. Kriteria Penerimaan (app saat ini)

* User bisa mempelajari semua Hiragana/Katakana/Kotoba/Kanji/Grammar dan mengikuti kuis Mudah/Sedang/Sulit tanpa crash.
* Nilai (S/A/B/C) dihitung benar; XP, Medaru, dan streak bertahan setelah refresh.
* Jawaban salah mengisi daftar lemah; sesi Ulangan menghapusnya saat jawaban benar.
* Misi harian dan mingguan melacak aktivitas nyata, reset sesuai jadwal, dan membayar saat diklaim.
* Warung/Gashapon membelanjakan Medaru dan mengirim pack/item ke Tas Punggung.
* Death Quiz terkunci di rank Shogun, menjalankan sistem skill 呪術, dan membayar Medaru di akhir run.
* Ujian N5 berjalan 3 seksi berwaktu, skor 0–180 dengan aturan lulus resmi, dan menerbitkan sertifikat.
* Tombol Tutorial kontekstual, melacak topik yang sudah dibaca, dan bisa disembunyikan lalu dinyalakan lagi.
* UI mengikuti sistem desain "Modern Japanese Editorial" di tema terang maupun gelap.

---

## Lampiran A — Inventaris Fitur (terverifikasi)

Dihasilkan oleh `node scripts/prd-inventory.mjs`. Jika angka ini berubah, perbarui tabel ini.

| Area | Jumlah |
|---|---|
| Hiragana | 104 (seion 46 · dakuon 20 · handakuon 5 · yōon 33) |
| Katakana | 46 |
| Kotoba | 876 |
| Kanji | 86 |
| Grammar | 53 |
| Mondai | 87 |
| Bank soal N5 | 67 soal authored dalam 10 tipe mondai (42 dipakai per run; 36 dibangun otomatis → total 78) |
| Puisi | 19 (7 klasik + 12 bertema) |
| Bab silabus | 25 |
| Badge | 45 |
| Topik tutorial | 13 |
| Rute | 13 |
| Pack | 14 (4 rarity) |
| Misi harian | 3 |
| Misi mingguan | 2 |
| Tes | 884 |
