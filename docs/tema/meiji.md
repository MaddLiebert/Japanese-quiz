# PRD — Tema Era: **MEIJI 明治** (Tema #3 dari 6)

**Versi:** v0.1 · **Dibuat:** 2026-10-08
**Status:** ✅ TERPASANG di kode — tema sudah aktif (blok CSS era + checkpoint/cinematic + gacha). Dokumen ini tetap **SPEC acuan**; §12 = rencana task.
**Induk:** sistem "Tema Era" (lihat `docs/tema/heian.md` §13)
**Target implementasi:** terminal baru (task T0–T12 di §12)
**Prasyarat:** `src/features/theme/eras.js` sudah memuat `{ id:'meiji', kanji:'明治', minLevel:50 }` ✅ (sudah ada).
**Tema sebelumnya:** Heian 平安 (Lv 1, ✅ LIVE) → Edo 江戸 (Lv 20, ✅ LIVE).
**Papan visual:** `docs/tema/_board-meiji.html` (mockup hidup — buka via static server).

---

## 1. Ringkasan

Tema **Meiji** adalah tema era ketiga (**gerbang Lv 50**). Ia mengubah wajah aplikasi dari bahasa visual **kota cetak Edo** (garis ukir tebal, shadow keras, ukiyo-e) menjadi bahasa visual **kota yang berubah oleh koran**: huruf logam, garis aturan, dan kertas surat kabar.

> **Tesis desain (satu kalimat):**
> **「明治 = 活字の時代」** — *Meiji = zaman huruf lepas (movable type).*
> **Kota yang dicetak ulang setiap pagi oleh koran.**

Tesis visualnya adalah **kontras ketiga**. Heian menulis dengan **kuas** (kana) → Edo mencetak **satu blok kayu** (ukiyo-e) → Meiji menyusun **huruf logam** dan menekannya jadi **koran**. Setiap era memindahkan *cara kata dibuat*, bukan cuma warnanya.

**Kebetulan yang menjadi tulang punggung desain:** fokus bahasa Meiji = **Grammar + Reading**. Reading = **koran**. Maka bentuk (letterpress) dan isi belajar (membaca teks panjang) menjadi **satu benda yang sama**. Ini bukan tempelan — ini inti tema.

---

## 2. Kenapa Meiji (dasar sejarah)

| Fakta | Implikasi desain |
|---|---|
| **Meiji 1868–1912** — Restorasi, Jepang membuka diri & modernisasi kilat | Nada tema = **berubah, bergerak, membangun** — bukan damai (Edo) bukan istana (Heian). |
| **活字 movable type + 新聞 koran** jadi massal; pers = mesin pencerahan | Bahasa bentuk = **huruf logam & kolom koran** (garis aturan, halftone). |
| **文明開化 bunmei-kaika** — "pencerahan/peradaban" (potong rambut, pakaian Barat) | Aksen "Barat" boleh muncul: serif Victoria di masthead, 洋装. |
| **銀座 Ginza** — jalan **bata 煉瓦** + **lampu gas 瓦斯灯** (1870-an) | Warna primer = **煉瓦 renga**; aksen cahaya = **瓦斯灯 gaslight**. |
| **学制 1872** — sistem sekolah nasional; seragam, papan tulis | Konteks belajar tema = **sekolah** (小学校), bukan istana/pasar. |
| **Yen 円 lahir 1871** (New Currency Act) | Mata uang tema = **円 en**. |
| **戸籍 koseki 1872** — registrasi keluarga nasional | Nama UI profil = **戸籍**. |
| **鉄道 1872** (Shimbashi–Yokohama) + 電信 telegraf | Motif: rel, uap, kabel; "waktu & jarak menyusut". |
| **国会 1890** + 大日本帝国憲法 1889 | Checkpoint akhir era = **parlemen** (ujian naik era). |
| **鹿鳴館 Rokumeikan** (1883) — dansa & gaun Barat | Perhentian "sosial": 洋装, dansa. |

---

## 3. Kontras: Heian vs Edo vs Meiji

Tiga era = tiga cara mencetak kata. Meiji harus terasa sebagai **dunia ketiga**, bukan "Edo dicat merah".

| Aspek | **Heian** (kuas) | **Edo** (blok kayu) | **Meiji** (huruf logam) |
|---|---|---|---|
| Garis tepi | tipis `1px` | ukir `2px` | **hairline `1px` + aturan ganda `3px double`** |
| Bayangan | lembut berlapis | **keras `3px 3px 0 0`** | **TIDAK ADA** (garis aturan, bukan bayangan) |
| Sudut | membulat `10px` | tajam `4px` | **`0px`** (blok huruf) |
| Rasa | halus, berlapis, kabut | tegas, datar, tercetak | **presisi, mekanis, teratur** |
| Metafora | sutra & kertas | kayu cetak & tinta | **huruf logam & kolom koran** |
| Gerak | mengapung `600ms` | gesit `240ms` | **mekanis, linear `180ms`** |
| Warna primer | 紫 murasaki `#5b4a7a` | 藍 ai `#1e4f79` | **煉瓦 renga `#9b4a3c`** |
| Motif | awan 雲 + maple 紅葉 | 青海波 + 麻の葉 + 花火 | **唐草 + 縞 + 歯車 + halftone** |
| Sosok | istana, bangsawan | chōnin, pedagang | **murid, guru, teknokrat, 洋装** |
| Bahasa | kana | kanji + furigana | **grammar + reading (koran)** |
| Mata uang | 文 mon | 両 ryō | **円 en** |

> **Keputusan terkunci (dari diskusi):** Meiji **mengganti bentuk juga**, bukan hanya warna.
> **Koreksi penting:** versi pertama mockup masih memakai `box-shadow` offset (blur 0) = **tanda tangan Shōwa brutalism** (warna diganti, bentuk tidak). Sudah dibuang. Meiji **tidak punya bayangan** — strukturnya dari **garis aturan** dan **flat fill**. Satu-satunya offset = **chromatic misprint** horizontal tipis (salah register warna), bukan drop shadow.

---

## 4. Design Tokens

### 4.1 Arsitektur token

Mengikuti 3 lapis Heian/Edo (`docs/tema/heian.md` §4.1). Meiji cukup meng-override:

```
LAPIS 1  --era-*     bentuk (rule, radius, motion)          ← di-override per era
LAPIS 2  --*-val     warna                                  ← di-override per era
LAPIS 3  data-theme × data-era                              ← komposisi
```

Selektor: `[data-era="meiji"]` (terang) · `.dark[data-era="meiji"]`, `[data-theme="dark"][data-era="meiji"]` (gelap).

### 4.2 Warna — Meiji (terang)

```css
[data-era="meiji"] {
  --kinari-val:   #f4f1e8;  /* 生成 kinari — kertas koran (lebih pucat/abu dari Edo) */
  --sumi-val:     #141414;  /* 墨 sumi — tinta letterpress pekat (kontras tinggi) */
  --renga-val:    #9b4a3c;  /* 煉瓦 renga — bata Ginza (PRIMER) */
  --shu-val:      #b8352c;  /* 緋 shu — merah segel/日の丸 */
  --ai-val:       #2f4f6b;  /* 藍 ai pudar — garis aturan */
  --kin-val:      #c9922a;  /* 金 kin — kuningan */
  --gas-val:      #d9a441;  /* 瓦斯灯 gaslight — amber lampu gas (AKSEN tunggal) */
  --nezumi-val:   #6f6a60;  /* 鼠 nezumi — abu teks sekunder */
  --backdrop-val: #e7e1d2;  /* latar luar */
}
```

> **Catatan token baru:** `--renga-val` (primer) & `--gas-val` (aksen) adalah token **baru** untuk Meiji. Era lain tak menyentuhnya. `--ai-val` dipakai sebagai warna **garis aturan**, bukan primer seperti Edo.

### 4.3 Warna — Meiji (gelap / 「瓦斯灯の夜」 gaslight no yoru)

```css
.dark[data-era="meiji"], [data-theme="dark"][data-era="meiji"] {
  --kinari-val:   #12131a;  /* malam batu-bata */
  --sumi-val:     #ece5d5;  /* teks krem koran */
  --renga-val:    #d9795f;  /* bata menyala */
  --shu-val:      #e0553f;
  --ai-val:       #6fa8d6;
  --kin-val:      #e8b84b;
  --gas-val:      #e0b050;  /* gaslight menyala */
  --nezumi-val:   #a49c88;
  --backdrop-val: #0b0c10;
}
```

> **Vibe gelap = 「瓦斯灯の夜」:** gang bata basah + kolam cahaya lampu gas + kereta malam (夜汽車). **Bukan** "istana malam" Heian, **bukan** 夜市 Edo.

### 4.4 Token bentuk — Meiji (BARU, tanpa bayangan)

```css
[data-era="meiji"] {
  --era-shadow:       none;                            /* ⚠️ TANPA bayangan */
  --era-shadow-hover: none;
  --era-hair:         1px solid rgba(20, 20, 20, 0.55);/* hairline rule */
  --era-rule:         1px solid var(--sumi-val);       /* aturan tegas */
  --era-rule-double:  3px double var(--sumi-val);      /* kepala kolom koran */
  --era-edge-w:       1px;
  --era-edge-color:   var(--sumi-val);
  --era-radius:       0px;                             /* blok huruf */
  --era-radius-sm:    0px;
  --era-radius-xs:    0px;
  --era-radius-pill:  9999px;                          /* pill tetap pill (avatar) */
  --era-motion:       180ms;                           /* mekanis (Edo 240, Heian 600) */
  --era-ease:         linear;                          /* mesin cetak, bukan drift */
}
```

### 4.5 Pemetaan nilai (referensi cepat)

| Token | Heian | Edo | **Meiji** | Nama tradisional |
|---|---|---|---|---|
| `--kinari-val` | `#f6f1e4` | `#f4ecd8` | `#f4f1e8` | 生成 kinari |
| `--sumi-val` | `#3a332b` | `#1c1b1a` | `#141414` | 墨 sumi |
| `--ai-val` | `#5b4a7a` | `#1e4f79` | `#2f4f6b` | 藍 ai (pudar) |
| `--shu-val` | `#b83b4a` | `#c0392b` | `#b8352c` | 緋 shu |
| `--kin-val` | `#c9a227` | `#c9922a` | `#c9922a` | 金 kin |
| **`--renga-val`** | — | — | **`#9b4a3c`** | **煉瓦 renga** (BARU) |
| **`--gas-val`** | — | — | **`#d9a441`** | **瓦斯灯 gaslight** (BARU) |
| `--era-shadow` | berlapis blur | `3px 3px 0 0` | **`none`** | — |

---

## 5. Tipografi

Heian memakai font tulis tangan (Klee One), Edo memakai serif ukiran (Shippori Mincho). Meiji = **zaman huruf logam** → serif 明朝体 modern untuk Jepang + serif Victoria untuk Latin (masthead koran).

| Peran | Font | Sumber | Alasan |
|---|---|---|---|
| **Judul hero / masthead / display** | **Noto Serif JP 900** | Google Fonts | 明朝体 modern — blok huruf cetak, tebal |
| **Latin / masthead koran** | **Playfair Display 700/900** | Google Fonts | serif Victoria, khas surat kabar abad ke-19 |
| **Kanji / reading / body** | **Shippori Mincho** *(sudah dimuat)* | Google Fonts | konsisten dengan Edo |
| **UI / angka / tombol** | **Inter** *(tetap)* | Google Fonts | keterbacaan angka & tombol |

**Aturan pakai:**
- `.font-display` → judul hero, judul era, masthead, nama perhentian.
- `.font-serif` → kanji, reading, label perhentian.
- `.font-sans` (Inter) → tombol, angka, label UI.

> **Keluarga baru = 2** (Noto Serif JP + Playfair Display) — hanya bila belum dimuat. Shippori Mincho sudah ada sejak Edo.
> **Kandidat alternatif** (belum diputuskan, §14 R6): display `Zen Old Mincho`; Latin masthead `Bodoni Moda`.

---

## 6. Motif & Tekstur

| Motif | Kanji | Peran | Catatan |
|---|---|---|---|
| **唐草** | karakusa | latar utama (arabesque) | lengkung sulur khas Meiji, bukan gelombang laut Edo |
| **縞** | shima | panel (garis) | garis rapi = kolom koran / pakaian Barat |
| **煉瓦** | renga | aksen (pola bata) | bata Ginza — langsung nyambung ke warna primer |
| **歯車** | haguruma | aksen (gigi mesin) | industrialisasi, mesin cetak |
| **瓦斯灯** | gaslight | aksen malam | hanya di dark mode |
| **halftone** | — | tekstur | bintik cetak koran di atas blok warna |

**Tekstur:** **grain cetakan** halus (garis sangat tipis) di atas blok warna — meniru kertas koran.
**Cap:** **segel 極/印 merah** di sudut kartu/panel — tanda tangan visual (sama seperti Edo, dipertahankan sebagai benang merah).

> Catatan kode: `src/index.css` sudah punya kelas `.bg-seigaiha`, `.bg-asanoha`, `.bg-ichimatsu` (milik Edo). Meiji **menambah** `.bg-karakusa`, `.bg-renga`, `.bg-halftone`, `.era-rule-top` (aturan ganda). Motif Edo tidak bocor ke Meiji karena semua override di dalam `[data-era="meiji"]`.

---

## 7. Peta Meiji — 8 Perhentian

Rute naratif tema: tur **"kota yang berubah"**. Dari pelabuhan yang dibuka → kota → pers → masyarakat → rel → sekolah → pameran → parlemen.

```
                    【横浜港】← gerbang dibuka (kapal uap)
                         │
        ┌────┬────┼────┬────┐
     銀座  新聞社  鹿鳴館  鉄道      (kota yang tumbuh)
        └────┴────┴────┴────┘
                         │
                    【小学校】← 学制 1872
                         │
                    【博覧会】← pameran nasional
                         │
                    【国会】← gerbang naik era
```

| # | Perhentian | Kanji | Tema | Pelajaran bahasa |
|---|---|---|---|---|
| 0 | Yokohama-kō | 横浜港 | gerbang dibuka · 開国 | 挨拶 aisatsu · 新しい kata sifat |
| 1 | Ginza | 銀座 | jalan bata + lampu gas | 買い物 kaimono · 数 sūji |
| 2 | Shimbunsha | 新聞社 | koran, 活字, pencerahan | **Reading** · 読む yomu |
| 3 | Rokumeikan | 鹿鳴館 | dansa Barat, 洋装 | 社交 · 服装 fukusō |
| 4 | Tetsudō | 鉄道 | kereta uap + telegraf (1872) | 旅 tabi · 時間 jikan · 方向 |
| 5 | Shōgakkō | 小学校 | 学制 1872, seragam, papan tulis | **Grammar** · 学ぶ manabu |
| 6 | Hakurankai | 博覧会 | 内国勧業博覧会, museum | 展示 · 比べる kuraberu |
| 7 | Kokkai | 国会 | 憲法 1889, Diet 1890 | **CHECKPOINT** (ujian → naik era) |

### Detail tiap perhentian

**0. 横浜港 Yokohama-kō — 開国の港**
Pelabuhan yang dibuka (1859) → kapal uap hitam, pedagang asing, barang Barat masuk. Pelajari: 挨拶 aisatsu · kata sifat baru (新しい/大きい/遠い). Momen: roh muncul pertama kali di dermaga — *「ここから、新しい日本が始まる。」* Vibe: asap kapal, gudang, bahasa campur.

**1. 銀座 Ginza — 煉瓦とガスの町**
Jalan bata + lampu gas (1870-an) — simbol 文明開化. Pelajari: 買い物 kaimono · 数 sūji. Momen: Saku — *「見て、ガス灯！夜でも明るい！」* Vibe: sore hari, lampu menyala satu per satu.

**2. 新聞社 Shimbunsha — 活字の町**
Kantor surat kabar; huruf logam disusun, ditekan, dicetak. **Ini jantung Reading.** Pelajari: 読む yomu · kosakata berita. Momen: **= fitur Reading app** — baca teks panjang, furigana makin sedikit. Vibe: mesin cetak berdenyut, tinta, kertas bertumpuk.

**3. 鹿鳴館 Rokumeikan — 洋装の社交**
Gedung dansa Barat (1883) — gaun, jas, dansa. Pelajari: 社交 · 服装 fukusō. Momen: Nacht (tak nyaman dengan dansa) vs Saku (menikmati). Vibe: lampu gantung, musik waltz, cermin.

**4. 鉄道 Tetsudō — 煙と電信**
Rel pertama (Shimbashi–Yokohama 1872) + kabel telegraf. Pelajari: 旅 tabi · 時間 jikan · 方向 hōkō. Momen: "waktu & jarak menyusut" — jam mulai mengatur hidup. Vibe: uap, peluit, tiang telegraf membentang.

**5. 小学校 Shōgakkō — 学制の町**
Sekolah nasional (学制 1872) — seragam, papan tulis, jam pelajaran. **Ini inti Grammar.** Pelajari: 学ぶ manabu · tata bahasa. Momen: **= fitur Grammar/Writing app** — duduk di bangku, menulis di papan tulis. Vibe: ruang kelas terang, kapur, lonceng sekolah.

**6. 博覧会 Hakurankai — 展示の町**
Pameran industri nasional (内国勧業博覧会) — barang dipajang, dibandingkan. Pelajari: 展示 · 比べる kuraberu. Momen: **= Shop 商店** — display barang, memilih. Vibe: tenda besar, spanduk, kerumunan mengagumi mesin.

**7. 国会 Kokkai — 憲法の町**
Parlemen (Diet 1890), Konstitusi Meiji 1889. Pelajari: sintesis grammar + reading. Momen: **CHECKPOINT AKHIR** — ujian (grammar + reading) → lulus = naik era. Vibe: ruang sidang, podium, surat kabar melaporkan.

---

## 8. Penamaan (tema di dalam tema)

Mengikuti pola Heian/Edo (`docs/tema/heian.md` §11). Tabel di `src/features/theme/eraNames.js`.

| Fungsi | Heian | Edo | **Meiji** | Kanji | Alasan |
|---|---|---|---|---|---|
| Shop / Warung | 市 | 問屋 | **商店 shōten** | 商店 | toko modern |
| Gacha | 貝合わせ | 富くじ | **福引 fukubiki** | 福引 | raffle ala department store Meiji |
| Mata uang | 文 mon | 両 ryō | **円 en** | 円 | Yen lahir 1871 — akurat historis |
| Inventory / Tas | 箪笥 | 風呂敷 | **鞄 kaban** | 鞄 | tas Barat |
| Profil | 系図 | 人別帳 | **戸籍 koseki** | 戸籍 | registrasi keluarga 1872 |
| Misi harian | 日課 | 奉公 | **課業 kagyō** | 課業 | pelajaran/PR sekolah |
| Peringkat | 位 | 番付 | **階級 kaikyū** | 階級 | pangkat militer Meiji / 勲章 |

> **Penting (beda dari Heian):** Meiji memakai **kanji penuh** (bukan kana), karena pemain di Lv 50 sudah bisa kanji — sama seperti Edo. Gacha copy Meiji (福引) harus pakai kanji + furigana seperti `gacha/edoCopy.js`, bukan kana seperti `heianCopy.js`.

---

## 9. Audio

Mengikuti pola Heian/Edo (`heian.md` §9): satu BGM per era + SFX per-interaksi. Titik tune tunggal di `src/utils/sfx.js` → `THEME_BGM_PLANS.meiji`.

| Elemen | Usulan |
|---|---|
| BGM | 軍楽隊 brass band + piano ringan (文明開化 songs) — **march tapi ringan**, bukan gagaku (Heian) bukan shamisen (Edo) |
| Drone | bass stabil, sedikit lebih "terang" dari Edo |
| Pluck/melodi | piano/glockenspiel pada tangga mayor (diatonik) — "modern", bukan pentatonik kuno |
| SFX koran | mesin cetak "klak-klak", gulungan kertas, tinta |
| SFX kota | bel kereta, peluit uap, telegraf (tit-tit) |
| Mood | `port` (kapal) · `city` (gaslight) · `press` (koran) · `school` (kelas) · `diet` (sidang) |

```js
// src/utils/sfx.js — tambah ke THEME_BGM_PLANS
meiji: {
  level: 0.13,
  fadeInMs: 1200,       // masuk tegas-mekanis (Edo 1400, Heian 2600)
  fadeOutMs: 800,
  drone: { freqs: [55, 110, 130.81], detune: [0, -4, 2], gain: 0.46 },  // +C3 → lebih terang
  pad:   { type: 'triangle', freqs: [261.63, 329.63, 392], filterHz: 1300, lfoHz: 0.12, lfoDepth: 240, gain: 0.28 },
  // piano/glock: tangga MAYOR (C D E G A) — "modern/Barat", bukan insen/pentatonik
  pluck: { notes: [261.63, 293.66, 329.63, 392, 440], everyMs: 1100, dur: 1.0, gain: 0.17 },
},
```

> **Keputusan kunci:** Meiji = satu-satunya era yang memakai **tangga mayor diatonik** (Barat), menandai 文明開化. Heian = hirajoshi, Edo = insen.

---

## 10. Video Sinematik Perkenalan

Mengikuti pola Heian/Edo (`heian.md` §10, `edo.md` §10): 60–90 detik, data-driven (`scenes.js`), diputar sekali, bisa di-skip. Narator = **Saku 咲** (selang-seling: Heian=Saku, Edo=Nacht, **Meiji=Saku**).

**Storyboard (5 babak):**

| # | Visual | Teks (JP / ID) | Audio |
|---|---|---|---|
| 1 | Kapal uap hitam masuk teluk, asap *(tanpa teks)* | *(tanpa teks)* | peluit kapal, ombak |
| 2 | Jalan bata Ginza, lampu gas menyala satu per satu | **明治時代** / "Zaman Meiji (1868–1912)" | brass masuk |
| 3 | Mesin cetak: huruf logam disusun, ditekan, koran tercetak | **活字、刷る** / "Huruf lepas dicetak" | klak mesin cetak |
| 4 | Kereta uap + kabel telegraf membentang ke cakrawala | **煙と電信** / "Asap dan telegraf" | peluit kereta, tit telegraf |
| 5 | Kota berubah → logo + segel 極/印 | **明治 — 文明開化** / "Meiji — pencerahan" | lonceng |

**Spesifikasi:** MP4 (H.264) + WebM fallback · 1920×1080 · < 8 MB · simpan di `public/themes/meiji/`.

> **Status implementasi:** jalur video **tidak dipakai**. Cinematic di-render
> **SVG/React** (`meiji/scenes/MeijiScenes.jsx` + `components/MeijiBackdrop.jsx` +
> `SceneLayer`), sama seperti Heian/Edo — reaktif ke waktu/mood/`prefers-reduced-motion`,
> tanpa bobot ~8 MB. Baris di atas = opsi alternatif yang tidak diambil.

**Voice (pola sama `docs/voice-cinematic-edo.md`):** narator **Saku**, 1 file `saku-meiji.mp3` di-split jadi 7 klip (`01_era` … `07_welcome`) di `public/voices/meiji/`, sumber mentah di `voice-source/meiji/`.

### Naskah + timing (usulan, 7 baris)

Scene 1 (`port`, 10s) **TANPA teks** → tanpa voice. Scene start: port 0 · ginza 10 · print 23 · rail 36 · change 49; total ~66s.

| # | scene/baris | Teks Jepang | Kana (ふりがな) | at | absolut | gap berikut |
|---|---|---|---|---|---|---|
| 1 | ginza/era | 明治時代 | めいじじだい | 0.6 | **10.6s** | 3.0s |
| 2 | ginza/brick | 煉瓦の道に、ガス灯がともる。 | れんがの みちに、がすとうが ともる。 | 3.6 | **13.6s** | 10.2s |
| 3 | print/type | 活字を組んで、刷る。 | かつじを くんで、する。 | 0.8 | **23.8s** | 12.9s |
| 4 | rail/steam | 煙と電信が、国をつなぐ。 | けむりと でんしんが、くにを つなぐ。 | 0.7 | **36.7s** | 12.9s |
| 5 | change/turn | そして、新しい時代が来る。 | そして、あたらしい じだいが くる。 | 0.6 | **49.6s** | 4.4s |
| 6 | change/era2 | 明治 — 文明開化 | めいじ — ぶんめいかいか | 5.0 | **54.0s** | 2.6s |
| 7 | change/welcome | ようこそ、明治へ。 | ようこそ、めいじへ。 | 7.6 | **56.6s** | (akhir) |

> Nama file hasil: `01_era.mp3` · `02_brick.mp3` · `03_type.mp3` · `04_steam.mp3` · `05_turn.mp3` · `06_era2.mp3` · `07_welcome.mp3`.

---

## 11. Koneksi ke Fitur App

| Perhentian | Fitur | Bagaimana |
|---|---|---|
| 新聞社 Shimbunsha | **Reading** | koran = bahan baca; furigana makin sedikit |
| 小学校 Shōgakkō | **Grammar / Writing** | 学制, papan tulis, seragam |
| 鉄道 Tetsudō | SRS / Progress | perjalanan = progres; "jalur" belajar |
| 博覧会 Hakurankai | **Shop 商店** | pameran = display barang |
| 国会 Kokkai | **Checkpoint** | ujian grammar+reading → gerbang Lv 100 (Shōwa) |
| 銀座 Ginza (gas) | **Dark mode** | 瓦斯灯の夜 |

> Koneksi ini **bukan tempelan**: 新聞社 memang kantor koran (Reading), 小学校 memang tempat belajar tata bahasa (Grammar), 国会 memang tempat ujian akhir.

---

## 12. Rencana Implementasi (T0–T12)

> Konvensi commit: `feat(theme):`, `fix(theme):`, `style(theme):`, `docs(theme):`.
> Setiap task: tulis test gagal → implementasi → test lulus → commit.

### T0 — Baseline
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run lint 2>&1 | grep -ci error
git rev-parse --short HEAD
```

### T1 — Nama UI Meiji
Tambah blok `meiji` ke `ERA_NAMES` di `src/features/theme/eraNames.js` (§8).
Test: `eraName('gacha','meiji')` → `'福引'`; `eraName('medaru','meiji')` → `'円'`; era tak dikenal → fallback.

### T2 — Token CSS Meiji
Tambah blok `[data-era="meiji"]` + `.dark[data-era="meiji"]` di `src/index.css` (§4).
Isi: warna (4.2/4.3), bentuk (4.4, **`--era-shadow: none`**), tipografi.
**Verifikasi:** grep `--era-shadow` di blok Meiji = `none`.

### T3 — Motif & tekstur
Tambah `.bg-karakusa`, `.bg-renga`, `.bg-halftone`, `.era-rule-top` (aturan ganda) di `index.css`.
Override kelas shadow bawaan → `none` di dalam `[data-era="meiji"]` (jaring pengaman anti-brutalism, pola sama Heian §7.2 Langkah C).

### T4 — Tipografi
Tambah **Noto Serif JP 900** + **Playfair Display** ke `index.html` (§5, `display=swap`).
Set `--font-display` Meiji. Terapkan `.font-display` pada judul hero & masthead.

### T5 — Cinematic Meiji
Tambah entri ke `CINEMATICS` di `src/features/cinematic/cinematics.js`:
```js
meiji: { id: 'meiji', era: 'meiji', kind: 'history', title: '明治', route: '/meiji-history' },
```
Buat `src/features/cinematic/meiji/` mengikuti struktur Edo (data-driven `scenes.js` + 5 view scene).
**Test penjaga:** salin pola `cinematics.test.js` — `cinematicForEra('meiji')?.id === 'meiji'`; `nextCinematic('meiji', {}) === 'meiji'`.

### T6 — Peta 8 perhentian
Buat `src/features/cinematic/meiji/meijiStops.js` (modul murni, §7) + test (pola `edoStops.test.js`).

### T7 — Gacha 福引
Buat `src/features/gacha/meijiCopy.js` (pola `edoCopy.js`, §8) + test.
Konteks: 福引 (raffle) — tarik くじ dari kotak 福箱 → kartu/kanji.

### T8 — Dark mode 瓦斯灯の夜
Pastikan toggle gelap saat era Meiji = 瓦斯灯の夜 (biru-bata + amber gas), bukan Heian/Edo.
**Verifikasi:** uji 3 era × terang/gelap = 6 kombinasi.

### T9 — Checkpoint 国会
`src/features/cinematic/meiji/meijiCheckpoint.js` (pola `edoCheckpoint.js`) — ujian grammar+reading → naik era.

### T10 — Audio tema
Isi `THEME_BGM_PLANS.meiji` (§9) + test di `themeAudio.test.js` (pola Heian/Edo).

### T11 — Voice cinematic
Generate `saku-meiji.mp3` → split 7 klip → wire ke `meiji/data/scenes.js` (§10) + test penjaga file voice ada.

### T12 — Verifikasi akhir
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run lint 2>&1 | grep -ci error     # 0
npm run build 2>&1 | tail -3           # exit 0
```
Uji manual: Lv 50 → app tampil Meiji (huruf logam, garis aturan, **tanpa shadow**, renga, gaslight); toggle gelap → 瓦斯灯の夜; `prefers-reduced-motion` → animasi mati.

---

## 13. Kriteria Penerimaan

| # | Kriteria | Cara uji |
|---|---|---|
| 1 | `data-era="meiji"` di `<html>` saat Lv 50 | DevTools |
| 2 | `--renga-val` = `#9b4a3c` (primer) | DevTools computed |
| 3 | Bentuk: garis `1px` hairline + aturan ganda `3px double`, radius `0px` | Visual |
| 4 | **TIDAK ADA `box-shadow` non-none** pada elemen Meiji | Visual / grep computed |
| 5 | Motif 唐草 / 縞 / 煉瓦 / 歯車 / halftone | Visual |
| 6 | Nama nav jadi 商店 / 福引 / 円 / 鞄 / 戸籍 / 課業 / 階級 | Visual |
| 7 | Peta 8 perhentian tampil | Visual |
| 8 | Gacha 福引 jalan di 新聞社 | Uji gacha |
| 9 | Dark mode = 瓦斯灯の夜 | Toggle |
| 10 | Checkpoint 国会 = ujian naik era | Uji |
| 11 | Cinematic Meiji (narrator Saku) auto-play sekali | Uji |
| 12 | Kontras Heian↔Edo↔Meiji terasa saat pindah | Visual |
| 13 | `npm test` lulus (+ test baru), lint 0, build exit 0 | Terminal |

---

## 14. Risiko & Catatan

| # | Risiko | Mitigasi |
|---|---|---|
| R1 | **Mudah jatuh ke brutalism Shōwa** (shadow offset = bentuk Shōwa) | **Aturan keras: `--era-shadow: none`**; struktur dari garis aturan. Uji grep computed-style di T12. |
| R2 | Kontras 3 era bisa "bertabrakan" di komponen bersama | Uji 6 kombinasi (3 era × terang/gelap) di T12 |
| R3 | `--era-shadow: none` bisa bocor ke era lain | Semua override di dalam `[data-era="meiji"]`; Heian/Edo tak disentuh |
| R4 | 2 font baru menambah beban | `display=swap`; Noto Serif JP subset Jepang; Playfair hanya Latin masthead |
| R5 | 8 perhentian bisa jadi banyak kerja | Data-driven (`meijiStops.js`); tiap perhentian = data, bukan halaman baru |
| R6 | Font display alternatif belum diputuskan | Kandidat: Zen Old Mincho (display), Bodoni Moda (Latin). Default: Noto Serif JP + Playfair |
| R7 | Motif 旭日 rising sun berkonotasi imperial/militer | **Dipakai sangat tipis atau dihindari** — keputusan belum final (§15) |
| R8 | Gacha Meiji butuh aset baru (木札 福引) | Fallback ke pola `edoCopy.js` dulu |

---

## 15. Yang TIDAK termasuk PRD ini

- Era lain (Shōwa, Anime Multiverse, Cyberpunk) — PRD terpisah.
- Implementasi kode (dokumen ini SPEC; eksekusi di terminal).
- Cerita/naratif utama — lihat `docs/story.md` §6–7.
- Voice & naskah final cinematic — mengikuti pola `docs/voice-cinematic-edo.md`.
- **Sistem mekanik** (typesetting, codex, 戸籍, glitch, dll) → **`docs/tema/meiji-mekanik.md`**.
- **Keputusan terbuka:** motif 旭日 (pakai/hindari?), font display final, jenis ujian Checkpoint 国会.

---

## 16. Isi 福引 (Gacha) — barang 文明開化

| Item | Kanji | Rarity | Efek |
|---|---|---|---|
| Koin yen | 円 | ★ | mata uang |
| Koran | 新聞 | ★ | bahan Reading |
| Lampu gas | 瓦斯灯 | ★★ | hiasan profil (cahaya) |
| Rickshaw | 人力車 | ★★ | ikon "perjalanan" |
| Mesin jahit | ミシン | ★★ | simbol industri rumah |
| Jam saku | 懐中時計 | ★★★ | tampilkan timer di kuis |
| Gramofon | 蓄音機 | ★★★ | **putar BGM era di profil** |
| **「???」 (out-of-place)** | ??? | ★★★★ | **item "aneh" = petunjuk cerita** — barang yang belum seharusnya ada di Meiji |

> **Item langka** sengaja **out-of-place** — pemain jeli curiga. Menyambung ke benang Nacht/Saku (§19).

---

## 17. Karakter & NPC

| NPC | Kanji | Peran |
|---|---|---|
| Penjual koran | 新聞少年 | muncul tiap pagi = pengingat misi harian |
| Penarik rickshaw | 人力車引き | pemandu antar-perhentian |
| Guru sekolah | 先生 | pemberi soal Grammar |
| Wanita berpakaian Barat | 洋装の女性 | di 鹿鳴館, kontras dengan kimono |

> NPC bisa jadi **avatar pemberi misi** (mengganti panel teks), mengikuti pola quest yang sudah ada.

---

## 18. Beat cerita — penyamaran yang mulai bocor

> Dari `docs/story.md` §4: Nacht & Saku = **AI dari Cyberpunk** yang menyamar jadi roh kuno.
> **Meiji = era pertama di mana mereka akhirnya "cocok".**

Di Heian/Edo, pakaian modern mereka membuat orang bengong. Di Meiji, pakaian itu jadi **biasa** — penyamaran **berhasil**, dan justru itu bahayanya:

- **Petunjuk menumpuk:** Saku hampir menyebut masa depan lalu menutup mulut; mereka paham mesin baru sebelum orang lain; Nacht tiba-tiba **nyaman** di 鹿鳴館 (pakaian Barat = wujud aslinya).
- **Ancaman bergeser:** dari "kelihatan aneh" → **"kelihatan terlalu tahu"**. Seorang tokoh (editor koran?) berkata: *「あなたたち、未来の人みたいですね。」* ("Kalian seperti orang dari masa depan.")
- **Misteri 絵巻:** sesekali muncul sisa data yang **bukan milikmu** (nama, streak, halaman yang sudah selesai) → pemain ngerasa **bukan pembaca pertama**. (Nyambung ke "dua sarjana yang mati sebelum tuntas", `story.md` §4.)

> **Ini benang yang menembus SELURUH era Meiji** — bukan perhentian, tapi lapisan di belakangnya. Detail mekanik → `meiji-mekanik.md` M12/M14.

---

## 19. Sisi gelap — 「第二面」

Meiji bukan cuma kemajuan. Harga yang dibayar disajikan sebagai **halaman belakang koran** yang **opsional** dibaca (pemain memilih). Aturan nada: **「新聞は叫ばない」** — koran tidak berteriak; ditulis datar, tanpa drama.

| Tahun | Peristiwa | Kanji |
|---|---|---|
| 1873 | Pajak tanah (地租改正) → petani miskin, kerusuhan | 農民一揆 |
| 1873 | Wajib militer (徴兵令) → pemuda desa pergi | 徴兵 |
| 1877 | Pemberontakan Satsuma → dunia samurai berakhir | 西南戦争 |
| 1880 | Gerakan kebebasan & hak rakyat, ditahan | 自由民権 |
| 1879–1910 | Kolonialisme: 沖縄 · 台湾 · 韓国 | 併合 |

> Contoh baris (datar): *「農民一揆、各地で続く。」* ("Pemberontakan petani berlanjut di berbagai tempat.") Titik. Selesai.
> Ini yang bikin Meiji **bukan propaganda naif** — ada bobotnya. Detail mekanik → `meiji-mekanik.md` M3.

---

## 20. Identitas suara

| Elemen | Usulan |
|---|---|
| **蛍の光 (Hotaru no Hikari)** | lagu sekolah Meiji (melodi "Auld Lang Syne") — dinyanyikan saat **kelulusan**; untuk **checkpoint 国会** atau penutup era. Konotasi perpisahan → merinding. |
| **軍楽隊 brass band + piano** | BGM tema, tangga **mayor diatonik** (§9) |
| **Diegetik** | item **蓄音機 (gramofon)** memutar musik era di profil |
| **SFX** | bel sekolah · peluit kereta · telegraf tit-tit · mesin cetak klak-klak |

---

## 21. 和魂洋才 — Meiji = era dengan DUA budaya

Heian & Edo = satu budaya (murni Jepang). **Meiji = tumbukan** → satu-satunya era dengan **dua bahasa visual yang bertarung**. Prinsip: **"Meiji = kolase, bukan kemurnian."**

Setiap perhentian punya **rasio 和 (Jepang) / 洋 (Barat)** — sehingga tiap halaman terasa beda **tanpa ganti warna**:

| Perhentian | 和 | 洋 | Efek |
|---|---|---|---|
| 横浜港 | 40% | 60% | kapal, bendera asing |
| 銀座 | 35% | 65% | bata + lampu gas |
| 新聞社 | 75% | 25% | 活字 & kanji dominan |
| 鹿鳴館 | 15% | 85% | **paling Barat** |
| 鉄道 | 30% | 70% | mesin, jadwal |
| 小学校 | 65% | 35% | papan tulis + 修身 |
| 博覧会 | 50% | 50% | **seimbang** |
| 国会 | 60% | 40% | konstitusi (Barat) di gedung Jepang |

> Data & fungsi murni → `meiji-mekanik.md` M2 (`waYoFor`, `waYoMix`).

---

## 22. Ringkasan Satu Layar

> **明治 = 活字の時代.** Kota yang dicetak ulang setiap pagi oleh koran.
> Heian menulis dengan **kuas** · Edo mencetak **blok kayu** · Meiji menyusun **huruf logam**.
> 煉瓦 renga `#9b4a3c` (primer) · 瓦斯灯 gaslight `#d9a441` (aksen) · kertas koran.
> Hairline `1px` + aturan ganda `3px double` · radius `0px` · **TANPA bayangan** · halftone · gerak `180ms linear`.
> Font: Noto Serif JP 900 (display) · Playfair Display (masthead) · Shippori Mincho (kanji).
> Uang **円 en** · gacha **福引** · checkpoint **国会** · dark mode **瓦斯灯の夜**.
> **8 perhentian:** 横浜港 → 銀座 → 新聞社 → 鹿鳴館 → 鉄道 → 小学校 → 博覧会 → 国会.
> Fokus bahasa **Grammar + Reading** · narator **Saku** · gerbang **Lv 50 — kontras total dari Heian & Edo.**
