# PRD — Tema Era: **EDO 江戸** (Tema #2 dari 6)

**Versi:** v0.1 · **Dibuat:** 2026-10-04
**Status:** SPEC — belum diimplementasikan
**Induk:** sistem "Tema Era" (lihat `docs/tema/heian.md` §13)
**Target implementasi:** terminal baru (task T0–T11 di §12)
**Prasyarat:** `src/features/theme/eras.js` sudah memuat `{ id:'edo', kanji:'江戸', minLevel:20 }`.

---

## 1. Ringkasan

Tema **Edo** adalah tema era kedua (gerbang **Lv 20**). Ia mengubah wajah aplikasi dari bahasa visual **istana Heian** (garis tipis, kabut, gerak lambat) menjadi bahasa visual **kota cetak Edo**: garis ukir tebal, sudut tajam, bayangan keras tanpa blur, gerak gesit.

> **Tesis desain (satu kalimat):**
> **"Edo = kota yang tercetak"** — siang pasar, malam lentera. Kayu, tinta, dan cetakan ukiyo-e.

Tesis visualnya adalah **kontras total** terhadap Heian. Pemain harus merasa berpindah dunia begitu `data-era` berubah ke `edo` — bukan sekadar "Heian berganti warna".

---

## 2. Kenapa Edo (dasar sejarah)

| Fakta | Implikasi desain |
|---|---|
| **Edo 1603–1868**, Keshogunan Tokugawa, damai ~250 tahun | Nada tema = **stabil, ramai, produktif** — bukan perang. Kota yang tumbuh. |
| **Kota kayu**; kebakaran sering ("火事と喧嘩は江戸の華") | Motif **kayu** + warna tanah; aksen **api/lentera**. |
| **Chōnin 町人** (pedagang & perajin) jadi kekuatan budaya, bukan bangsawan | Pusat tema = **rakyat kota**, bukan istana. Tokoh: pedagang, murid, guru. |
| **Ukiyo-e 浮世絵** = seni cetak kayu massal | Bahasa bentuk = **cetakan**: garis ukir, blok warna datar, registrasi offset. |
| **Terakoya 寺子屋** = sekolah rakyat (読み書きそろばん) | Konteks belajar tema = **sekolah rakyat**, bukan istana. |
| **Ekonomi 両 ryō** & chōnin | Mata uang tema = **両** (Heian = 文 mon). |
| **富くじ tomikuji** (lotre 木札) & 福引 | Gacha tema = **富くじ**. |
| **Tōkaidō 東海道** 53 宿場 dari 日本橋 | Peta perjalanan tema = **jalan raya**, bukan istana. |

---

## 3. Kontras: Heian vs Edo

Karena Heian sudah berjalan, Edo harus jadi **kebalikannya** di semua sumbu — bentuk, warna, gerak.

| Aspek | **Heian (sekarang)** | **Edo (target)** |
|---|---|---|
| Garis tepi | tipis `1px` | **ukir `2px`** |
| Bayangan | lembut `0 6px 28px -6px` | **keras `3px 3px 0 0`** (blur 0) |
| Sudut | membulat `10px` | **tajam `4px`** |
| Rasa | halus, berlapis, kabut | **tegas, datar, tercetak** |
| Metafora | sutra & kertas | **kayu cetak & tinta** |
| Gerak | mengapung, `600ms` | **gesit, `240ms`** |
| Warna primer | 紫 murasaki `#5b4a7a` | **藍 ai `#1e4f79`** |
| Motif | awan 雲 + maple 紅葉 | **青海波 + 麻の葉 + 亀甲 + 花火** |
| Sosok | istana, bangsawan | **chōnin, pedagang, murid** |
| Bahasa | kana | **kanji + furigana** |

> **Keputusan:** Edo mengganti **bentuk juga**, bukan hanya warna. Kalau hanya warna, hasilnya "Heian biru", bukan "Edo".

---

## 4. Design Tokens

### 4.1 Arsitektur token

Mengikuti 3 lapis Heian (`docs/tema/heian.md` §4.1). Edo cukup meng-override:

```
LAPIS 1  --era-*     bentuk (edge, radius, shadow, motion)   ← di-override per era
LAPIS 2  --*-val     warna                                    ← di-override per era
LAPIS 3  data-theme × data-era                                ← komposisi
```

Selektor: `[data-era="edo"]` (terang) · `.dark[data-era="edo"]`, `[data-theme="dark"][data-era="edo"]` (gelap).

### 4.2 Warna — Edo (terang)

```css
[data-era="edo"] {
  --kinari-val:   #f4ecd8;  /* 生成 kinari — kertas kayu alami */
  --sumi-val:     #1c1b1a;  /* 墨 sumi — tinta cetak (lebih pekat dari Heian) */
  --ai-val:       #1e4f79;  /* 藍 ai — indigo Edo */
  --shu-val:      #c0392b;  /* 朱 shu — merah segel/cap */
  --matcha-val:   #4a6b3a;  /* 抹茶 matcha — hijau tua */
  --kin-val:      #c9922a;  /* 金 kin — emas kuningan */
  --backdrop-val: #e6dcc2;  /* latar kertas tua */
}
```

### 4.3 Warna — Edo (gelap / "夜市 yomise")

```css
.dark[data-era="edo"], [data-theme="dark"][data-era="edo"] {
  --kinari-val:   #14161c;  /* malam biru pekat */
  --sumi-val:     #e8e2d4;  /* teks krem */
  --ai-val:       #6fa8d6;  /* indigo terang */
  --shu-val:      #e0553f;  /* merah lentera 提灯 */
  --matcha-val:   #8fae6a;
  --kin-val:      #e8b84b;
  --backdrop-val: #0d0f14;
}
```

### 4.4 Token bentuk — Edo (BARU)

```css
[data-era="edo"] {
  --era-edge-w:       2px;                            /* ukir, bukan 1px */
  --era-edge-color:   var(--sumi-val);
  --era-radius:       4px;                            /* tajam, bukan 10px */
  --era-radius-sm:    2px;
  --era-radius-pill:  9999px;
  --era-shadow:       3px 3px 0 0 rgba(28, 27, 26, 0.85);   /* registrasi cetak */
  --era-shadow-hover: 5px 5px 0 0 rgba(28, 27, 26, 0.9);
  --era-motion:       240ms;                          /* gesit (Heian = 600ms) */
  --era-ease:         cubic-bezier(0.2, 0, 0, 1);
}
```

### 4.5 Pemetaan nilai (referensi cepat)

| Token | Heian | Edo | Nama tradisional |
|---|---|---|---|
| `--kinari-val` | `#f6f1e4` | `#f4ecd8` | 生成 kinari |
| `--sumi-val` | `#3a332b` | `#1c1b1a` | 墨 sumi |
| `--ai-val` | `#5b4a7a` | `#1e4f79` | 藍 ai |
| `--shu-val` | `#b83b4a` | `#c0392b` | 朱 shu |
| `--matcha-val` | `#8a9a5b` | `#4a6b3a` | 抹茶 matcha |
| `--kin-val` | `#c9a227` | `#c9922a` | 金 kin |
| `--backdrop-val` | `#e9e2d0` | `#e6dcc2` | 砂 suna |

---

## 5. Tipografi

Heian memakai font tulis tangan (Klee One) karena zaman hiragana. Edo = **zaman cetak** → font serif berkarakter ukiran.

| Peran | Font | Sumber | Alasan |
|---|---|---|---|
| **Judul hero / display** | **Shippori Mincho B1** | Google Fonts | Serif tebal, berkarakter cetakan kayu |
| **Kanji / teks Jepang** | **Shippori Mincho** *(sudah dimuat)* | Google Fonts | Konsisten dengan display |
| **Latin / UI** | **Inter** *(tetap)* | Google Fonts | Keterbacaan angka & tombol |

**Aturan pakai:**
- `.font-display` → judul hero, judul era, nama perhentian.
- `.font-serif` → kanji, label perhentian.
- `.font-sans` (Inter) → tombol, angka, label UI.

> Berbeda dari Heian yang menambah 2 keluarga baru, Edo **tidak menambah font baru** — cukup pakai Shippori Mincho yang sudah dimuat.

---

## 6. Motif & Tekstur

| Motif | Kanji | Peran | Catatan |
|---|---|---|---|
| **青海波** | seigaiha | latar utama (gelombang) | motif laut/kota pelabuhan |
| **市松** | ichimatsu | panel (kotak catur) | pola komon khas Edo; nama dari aktor kabuki 佐野川市松 |
| **麻の葉** | asanoha | aksen (daun rami) | pola geometris, khas kimono Edo |
| **亀甲** | kikkō | bingkai/tepi (sisik kura-kura) | sudah ada di kode sebagai kelas |
| **花火** | hanabi | aksen malam (両国) | hanya di dark/夜市 |

**Tekstur:** **grain cetakan** (bintik tinta) di atas blok warna — meniru hasil cetak kayu.
**Cap:** **segel 極 merah** di sudut kartu/panel — tanda tangan visual Edo.

> Catatan kode: `src/index.css` sudah punya kelas `.bg-seigaiha`, `.bg-asanoha`, & `.bg-ichimatsu` (kini dinonaktifkan untuk Heian, lihat `heian.md` §6). Edo **mengaktifkannya kembali** dengan warna indigo 藍. Ichimatsu dulu tak terdaftar di era mana pun → bocor ke semua era dengan tinta base (Shōwa); kini resmi milik Edo.

---

## 7. Peta Edo — 8 Perhentian

Rute naratif tema. Titik awal **日本橋** (五街道の起点), keliling kota, keluar lewat Tōkaidō sampai **箱根関所**.

```
                    【日本橋】← 五街道の起点
                         │
        ┌────┬────┼────┬────┐
     浅草寺  両国  上野  深川        (keliling kota)
        └────┴────┴────┴────┘
                         │
                    【品川宿】← pos pertama Tōkaidō
                         │
                    【箱根関所】← gerbang keluar Edo
```

| # | Perhentian | Kanji | Tema | Pelajaran bahasa |
|---|---|---|---|---|
| 0 | Nihonbashi | 日本橋 | すべての道の起点 | 挨拶 aisatsu · 数字 sūji |
| 1 | Asakusa-dera | 浅草寺 | 雷門の町 | 買い物 kaimono · 食べ物 tabemono |
| 2 | Ryōgoku | 両国 | 花火と相撲の町 | 祭り matsuri · 数え方 |
| 3 | Ueno | 上野 | 桜の丘 | 自然 shizen · 季節 kisetsu |
| 4 | Fukagawa | 深川 | 富くじの町 | 運 un · 願い事 |
| 5 | Yoshiwara / Yomise | 吉原・夜市 | 夜の灯 | 夜 yoru · 灯り akari |
| 6 | Shinagawa-juku | 品川宿 | 最初の宿場 | 旅 tabi · 宿 yado |
| 7 | Hakone Sekisho | 箱根関所 | 江戸の果て | 関所 sekisho · 峠 tōge |

### Detail tiap perhentian

**0. 日本橋 Nihonbashi — すべての道の起点**
Jembatan pusat Edo; kilometer nol semua jalan Jepang. Pelajari: 挨拶 aisatsu · 数字 sūji. Momen: roh muncul pertama kali di sini — *「ここから、旅は始まる。」* Vibe: rame, pedagang, ikan segar pagi-pagi.

**1. 浅草寺 Asakusa-dera — 雷門の町**
Kuil tertua; gerbang **雷門**, jalan belanja **仲見世**. Pelajari: 買い物 kaimono · 食べ物 tabemono. Momen: Saku — *「見て！お団子いっぱい！」* Vibe: pasar kuil, dango, omikuji, ramai.

**2. 両国 Ryōgoku — 花火と相撲の町**
Tepi **隅田川**; **花火** (kembang api musim panas) & **相撲**. Pelajari: 祭り matsuri · 数え方. Momen: festival — Nacht: *「音が大きい。だが、きれいだ。」* Vibe: malam musim panas, cahaya, sorak orang.

**3. 上野 Ueno — 桜の丘**
Bukit **寛永寺** + pohon **桜**. Pelajari: 自然 shizen · 季節 kisetsu. Momen: **hanami** — jeda tenang di tengah keramaian. Vibe: damai, kelopak jatuh, mono no aware.

**4. 深川 Fukagawa — 富くじの町**
**富岡八幡宮** — pusat **富くじ** (lotre Edo). Pelajari: 運 un · 願い事. Momen: **= GACHA app** — tarik 木札 dari 富箱 → kartu/kanji. Vibe: tegang-berharap, orang antre, teriakan penjaja.

**5. 吉原・夜市 Yoshiwara / Yomise — 夜の灯**
Distrik malam; **提灯** (lentera) menyala. Pelajari: 夜 yoru · 灯り akari. Momen: **= DARK MODE app** — biru pekat + merah lentera. Vibe: misterius, indah, sedikit berbahaya.

**6. 品川宿 Shinagawa-juku — 最初の宿場**
Pos pertama Tōkaidō (宿場 pertama dari 53). Pelajari: 旅 tabi · 宿 yado. Momen: 読み手 resmi jadi pengelana — tinggalkan kota, masuk jalan raya. Vibe: gerbang kota, ramai pelancong, kuda, kuli.

**7. 箱根関所 Hakone Sekisho — 江戸の果て**
Pos pemeriksaan (関所) di pegunungan — gerbang keluar Edo. Pelajari: 関所 sekisho · 峠 tōge. Momen: **CHECKPOINT AKHIR** — penjaga bertanya (ujian) → lulus = naik era. Vibe: sunyi, berkabut, gunung, danau **芦ノ湖** + **Fuji** di kejauhan.

---

## 8. Penamaan (tema di dalam tema)

Mengikuti pola Heian (`docs/tema/heian.md` §11). Tabel di `src/features/theme/eraNames.js`.

| Fungsi | Heian | **Edo** | Kanji | Alasan |
|---|---|---|---|---|
| Shop / Warung | 市 | **問屋 toiya** | 問屋 | pedagang besar/grosir |
| Gacha | 貝合わせ | **富くじ tomikuji** | 富くじ | lotre Edo (木札 dari 富箱) |
| Mata uang | 文 mon | **両 ryō** | 両 | mata uang Edo |
| Inventory / Tas | 箪笥 | **風呂敷 furoshiki** | 風呂敷 | kain pembungkus barang |
| Profil | 系図 | **人別帳 ninbetsuchō** | 人別帳 | daftar penduduk |
| Misi harian | 日課 | **奉公 hōkō** | 奉公 | pengabdian/kerja |
| Peringkat | 位 | **番付 banzuke** | 番付 | daftar peringkat (sumo) |

---

## 9. Audio

Mengikuti pola Heian (`heian.md` §9): satu BGM per era + SFX per-interaksi.

| Elemen | Usulan |
|---|---|
| BGM | 三味線 shamisen / 祭囃子 matsuri-bayashi (ritmis, lebih cepat dari gagaku) |
| SFX pasar | sorak penjaja, langkah, kayu |
| SFX cetak | ketukan blok kayu, gulungan kertas |
| Mood | `market` (siang) · `night` (夜市) · `festival` (両国) |

> Implementasi: `themeBgmPlan(era)` di `src/utils/sfx.js` (saat ini fallback Heian).

---

## 10. Video Sinematik Perkenalan

Mengikuti pola Heian (`heian.md` §10): 60–90 detik, dibuat sendiri, diputar sekali, bisa di-skip.

**Storyboard (5 babak):**

| # | Visual | Teks (JP / ID) | Audio |
|---|---|---|---|
| 1 | Layar kosong → **peta Tōkaidō** tergelar | *(tanpa teks)* | kayu bergesek |
| 2 | **日本橋**, kerumunan pagi, ikan di pasar | **江戸時代** / "Zaman Edo (1603–1868)" | shamisen masuk |
| 3 | **Blok kayu diukir**, tinta ditekan, kertas tercetak | **浮世絵、刷る** / "Ukiyo-e dicetak" | ketukan blok |
| 4 | **提灯** menyala di jalan malam | **昼は市、夜は提灯** / "Siang pasar, malam lentera" | sorak jauh |
| 5 | Peta menutup → logo + **segel 極** | **江戸 — 町人の時代** / "Edo — zaman rakyat kota" | lonceng |

**Spesifikasi:** MP4 (H.264) + WebM fallback · 1920×1080 · < 8 MB · simpan di `public/themes/edo/`.

---

## 11. Koneksi ke Fitur App

| Perhentian | Fitur | Bagaimana |
|---|---|---|
| 深川 Fukagawa | **Gacha** | 富くじ — tarik 木札 dari 富箱 → kartu/kanji |
| 夜市 Yomise | **Dark mode** | 提灯 — biru pekat + merah lentera |
| 箱根関所 | **Checkpoint / ujian** | penjaga bertanya → lulus = naik era |
| 日本橋 | Navigasi | pusat peta, titik awal |
| 浅草寺 | Shop 問屋 | belanja |
| 両国 | Event | festival musiman |
| 上野 | Jeda naratif | momen tenang (mono no aware) |
| 品川宿 | Transisi | masuk mode "jalan" |

> Koneksi ini **bukan tempelan**: 深川 memang kota lotre, 夜市 memang soal cahaya malam, 箱根 memang pos pemeriksaan.

---

## 12. Rencana Implementasi (T0–T11)

> Konvensi commit: `feat(theme):`, `fix(theme):`, `style(theme):`, `docs(theme):`.
> Setiap task: tulis test gagal → implementasi → test lulus → commit.

### T0 — Baseline
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run lint 2>&1 | grep -ci error
git rev-parse --short HEAD
```

### T1 — Nama UI Edo
Tambah blok `edo` ke `ERA_NAMES` di `src/features/theme/eraNames.js` (§8).
Test: `eraName('gacha','edo')` → `'富くじ'`; era tak dikenal → fallback.

### T2 — Token CSS Edo
Tambah blok `[data-era="edo"]` + `.dark[data-era="edo"]` di `src/index.css` (§4).
Isi: warna (4.2/4.3), bentuk (4.4), tipografi.

### T3 — Motif & tekstur
Aktifkan kembali `.bg-seigaiha`, `.bg-asanoha` untuk Edo; tambah `.era-grain` (tekstur cetak) dan `.era-seal` (segel 極).

### T4 — Gerbang level
Pastikan `eraForLevel(20)` → `edo` dan pemilih era di Pengaturan menampilkan Edo terbuka di Lv 20. (Sudah ada di `eras.js`; verifikasi UI.)

### T5 — Cinematic Edo
Tambah entri ke `CINEMATICS` di `src/features/cinematic/cinematics.js`:
```js
edo: { id: 'edo', era: 'edo', kind: 'history', title: '江戸', route: '/edo-history' }
```
Buat `src/features/cinematic/edo/` mengikuti struktur Heian (data-driven `scenes.js`).

### T6 — Peta 8 perhentian
Halaman navigasi Edo dengan 8 perhentian (§7). Data di modul murni (`edoStops.js`) agar mudah dites.

### T7 — Gacha 富くじ (深川)
Ubah gacha agar menampilkan varian Edo: 木札 dari 富箱. Ikuti pola `gacha/heianCopy.js` → `gacha/edoCopy.js`.

### T8 — Dark mode 夜市
Pastikan toggle gelap saat era Edo = 夜市 (biru pekat + merah lentera), bukan "istana malam" Heian.

### T9 — Checkpoint 箱根
Perhentian terakhir = ujian naik era.

### T10 — Audio tema
Isi `themeBgmPlan('edo')` (§9).

### T11 — Verifikasi akhir
`npm test` lulus, lint 0, build exit 0; uji 4 kombinasi terang/gelap × era.

---

## 13. Kriteria Penerimaan

| # | Kriteria | Cara uji |
|---|---|---|
| 1 | `data-era="edo"` di `<html>` saat Lv 20 | DevTools |
| 2 | `--ai-val` = `#1e4f79` (indigo) | DevTools computed |
| 3 | Bentuk: garis `2px`, radius `4px`, shadow keras `3px 3px 0 0` | Visual |
| 4 | Motif 青海波 / 麻の葉 / 亀甲 / 花火 | Visual |
| 5 | Nama nav jadi 問屋 / 富くじ / 両 / 風呂敷 / 人別帳 / 奉公 / 番付 | Visual |
| 6 | Peta 8 perhentian tampil | Visual |
| 7 | Gacha 富くじ jalan di 深川 | Uji gacha |
| 8 | Dark mode = 夜市 提灯 | Toggle |
| 9 | Checkpoint 箱根 = ujian naik era | Uji |
| 10 | Kontras Heian↔Edo terasa saat pindah | Visual |
| 11 | `npm test` lulus (+ test baru), lint 0, build exit 0 | Terminal |

---

## 14. Risiko & Catatan

| # | Risiko | Mitigasi |
|---|---|---|
| R1 | Kontras Heian↔Edo bisa "bertabrakan" di komponen bersama | Uji 4 kombinasi (terang/gelap × era) di T11 |
| R2 | `--era-shadow` keras bisa bocor ke Heian | Semua override di dalam `[data-era="edo"]`; Heian tak disentuh |
| R3 | Font cetak (Shippori Mincho B1) menambah beban | Sudah dimuat (Shippori Mincho); B1 via `display=swap` |
| R4 | 8 perhentian bisa jadi banyak kerja | T6 data-driven; tiap perhentian = data, bukan halaman baru |
| R5 | Gacha Edo butuh aset baru (木札) | Fallback ke pola `heianCopy.js` dulu |

---

## 15. Yang TIDAK termasuk PRD ini

- Era lain (Meiji, Shōwa, Anime Multiverse, Cyberpunk) — PRD terpisah.
- Implementasi kode (dokumen ini SPEC; eksekusi di terminal).
- Cerita/naratif Edo — lihat `docs/story.md` §6–7.
- Prolog & perkenalan Nacht/Saku — lihat `docs/prolog.md`.

---

## 16. Ringkasan Satu Layar

> **Edo = kota yang tercetak.**
> Siang pasar, malam lentera. 藍 indigo · 朱 merah · kayu kinari.
> Garis ukir `2px` · radius `4px` · shadow keras `3px 3px 0 0` · segel 極 merah · grain cetakan.
> Motif 青海波 / 麻の葉 / 亀甲 / 花火 · font Shippori Mincho B1 · gerak gesit `240ms`.
> Uang 両 ryō · gacha 富くじ · checkpoint 箱根関所.
> **8 perhentian:** 日本橋 → 浅草寺 → 両国 → 上野 → 深川 → 夜市 → 品川宿 → 箱根関所.
> **Gerbang: Lv 20 — kontras total dari Heian.**
