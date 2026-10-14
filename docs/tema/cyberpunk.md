# PRD — Tema Era: **CYBERPUNK 電脳** (Tema #6 dari 6)

**Versi:** v0.1 · **Dibuat:** 2026-10-11
**Status:** SPEC — belum diimplementasikan
**Induk:** sistem "Tema Era" (lihat `docs/tema/heian.md` §13)
**Target implementasi:** terminal baru (task T0–T12 di §12)
**Prasyarat:** `src/features/theme/eras.js` sudah memuat `{ id:'cyberpunk', kanji:'電脳', minLevel:300 }` ✅ (sudah ada).
**Tema sebelumnya:** Heian 平安 (Lv 1) → Edo 江戸 (Lv 20) → Meiji 明治 (Lv 50) → Shōwa 昭和 (Lv 100) → 多元 Anime Multiverse (Lv 150).
**Papan visual:** `docs/tema/_board-cyberpunk.html` ✅ (mockup hidup, 11 seksi).
**Naskah cerita:** `docs/story.md` §6 Babak 3 (locked).

---

## 0. PRINSIP #0 — 「土台は凍らせる」 BASE BEKU *(baca ini dulu)*

> **電脳 bukan echo base. 電脳 adalah bentuk yang benar-benar BARU — dan satu-satunya era yang materialnya CAHAYA.**

Base `:root` app ini ber-DNA **Shōwa** (tinta tebal, bayangan keras tanpa blur, sudut tajam). Shōwa *menegaskan* base itu (§0 `showa.md`). 電脳 **tidak**. Ia membangun bahasa visualnya sendiri di atas blok `[data-era="cyberpunk"]`, additive.

Aturan keras (sama untuk semua era):

```
❌ SALAH — ubah :root                          → ciri khas lama HILANG, semua era kena getaran
✅ BENAR  — tambah blok [data-era="cyberpunk"]  → base DIKUNCI, era lain aman
```

**Dua hal yang WAJIB beda dari era lain, dan disengaja:**

1. **Glow/neon SAH di sini.** Di semua era lain, glow lembut + gradien glossy dibaca *"kartu web modern"* dan ditolak user (pelajaran Heian). Di 電脳, **neon memang bahannya** — jadi glow bukan cuma boleh, tapi wajib. Yang tetap dilarang: **satu offset keras `Npx Npx 0 0`** (tanda tangan Shōwa) dan **`backdrop-filter` blur** (mahal, lihat §4.4).
2. **Tidak ada siang.** Tema = 「常夜」 malam yang abadi. Jadi toggle terang/gelap **bukan** siang↔malam, tapi **kedalaman malam** (§4.2/§4.3).

---

## 1. Ringkasan

Tema **Cyberpunk 電脳** adalah tema era **keenam & terakhir** (**gerbang Lv 300**). Ia mengubah wajah aplikasi dari **kanvas manga 多元** (putih, outline tinta, cel-shadow berwarna, banyak dunia) menjadi **layar kota neon di tengah malam abadi**: **kaca, cahaya, grid, dan glitch.**

> **Tesis desain (satu kalimat):**
> **「常夜 = 光だけが残った時代」** — *常夜 = zaman yang hanya menyisakan cahaya.*
> **Malam yang tak pernah berakhir, dan satu layar yang menyala di dalamnya.**

**Sumbu desain (yang membedakan 電脳 dari "多元 diberi warna gelap"):**

> **多元 = 世界が増える** (dunia bertambah, melebar, pecah jadi banyak halaman).
> **電脳 = kebalikannya — dunia MENYEMPIT jadi SATU.** Bukan menambah, tapi **balik ke satu titik: rumah mereka.**

Dan satu benang merah dari kode yang **sudah ada** (`src/features/glitch/glitch.js`): glitch diperlakukan sebagai **kebocoran cyberpunk** yang bocor ke Meiji (0–0.12) & 多元 (0–0.20); di **Lv 300 frekuensinya mentok → glitch jadi PERMANEN** (bukan lagi "bocor" tapi "terbuka"). Jadi arah visual 電脳 sudah tersirat di kode:

> **「kebocoran yang akhirnya jadi kenyataan」** — apa yang lima era cuma bocor sekilas, di sini **tak mati lagi**.

---

## 2. Kenapa Cyberpunk (dasar)

電脳 **bukan era sejarah** — ini genre. Akarnya nyata di Jepang 1980-an: *Akira* (1988), *Ghost in the Shell* (1989), *Neuromancer* (1984). User tetap memilihnya sebagai era beneran (keputusan terkunci), dengan alasan: **ini "zaman paling muda"** — masa depan, bukan masa lalu. Lima era = lima zaman; 電脳 = **yang belum terjadi**, dan justru itu rumah Nacht & Saku.

**Yang membuat 電脳 "akhir" bukan "sekadar futuristik":**

| Aspek | Isi |
|---|---|
| Rumah | Nacht & Saku dibangun dari **data dua sarjana saingan nyata** yang mati sebelum tuntas (story.md §4) |
| Wujud asli | **ロウ** — "hukum"/AI. Penyamaran (roh) terbuka di sini |
| Bahasa | **endgame** — 総復習 (uji campur semua era) |
| Nada | **別れ** — perpisahan. Setelah ini TAMAT |

---

## 3. Kontras: 多元 vs 電脳 (dan semua era)

| Aspek | **Heian** | **Edo** | **Meiji** | **Shōwa** | **多元** | **電脳** |
|---|---|---|---|---|---|---|
| Garis tepi | tipis `1px` | ukir `2px` | hairline + aturan ganda | tebal `4px` | outline tinta `3px` | **hairline `1px` + glow** |
| Bayangan | lembut blur | keras `3px` | tidak ada | keras `4px` hitam | cel 2-tone BERWARNA | **glow berlapis (memancar)** |
| Sudut | `10px` | `4px` | `0px` | `0px` | `6px` | **`0px` (cut)** |
| Rasa | halus, kabut | tegas, cetak | presisi, mekanis | berat, monumental | cerah, hidup, ramai | **gelap, digital, sunyi** |
| Metafora | sutra & kertas | kayu cetak | huruf logam | beton & bayangan | halaman manga & sel | **layar & neon** |
| Gerak | mengapung `600ms` | gesit `240ms` | linear `180ms` | berat `200ms` | snap `140ms` | **snap `110ms`** |
| Warna primer | 紫 murasaki | 藍 ai | 煉瓦 renga | コンクリ灰 | 空 sora `#3a8dde` | **cyan `#00F0FF`** |
| Motif | awan + maple | 青海波 + 花火 | 唐草 + 歯車 | 電柱 + 団地 | panel + screentone | **grid + scanline + glitch** |
| Sosok | bangsawan | chōnin | murid/teknokrat | orang biasa | tokoh fiksi, 推し | **AI (Nacht/Saku)** |
| Bentuk era | 1 dunia | 1 dunia | 1 dunia | 1 dunia | **KANVAS + N dunia** | **1 dunia (rumah)** |
| Cahaya | mati | lilin | gas | neon papan | terang siang | **常夜 — tak pernah terang** |

> **Keputusan terkunci:** 電脳 **punya glow** — dan hanya era ini yang boleh. Tanda tangan 電脳 = **hairline + glow + grid + glitch**, BUKAN beton/offset keras.

---

## 4. Design Tokens

### 4.1 Arsitektur token

```
LAPIS 0  base :root              ← BEKU. Warisan. Nol perubahan.
LAPIS 1  [data-era="cyberpunk"]  ← bentuk BARU: kaca & cahaya (宵 yoi = mode terang)
LAPIS 2  .dark / [data-theme=dark][data-era="cyberpunk"]  ← 真夜中 mayonaka (mode gelap)
LAPIS 3  [data-era="cyberpunk"] .era-pattern + ornamen/glitch  ← motif + momen
```

Berbeda dari 多元 (yang punya lapis franchise), 電脳 = **satu dunia** → **tidak ada** lapis 2/3 franchise/karakter.

### 4.2 Warna — 電脳 (terang = **宵 yoi**, senja awal)

| Token | Nilai | Catatan |
|---|---|---|
| `--kinari-val` | `#0E1A2E` | dasar — biru malam (bukan kertas) |
| `--kinari-light-val` | `#12213A` | panel kaca-semu |
| `--backdrop-val` | `#0A1424` | latar luar |
| `--sumi-val` | `#EAF2FA` | "tinta" dibalik → teks terang |
| `--ai-val` | `#00F0FF` | cyan — primer/info/navigasi |
| `--kin-val` | `#FFE23A` | kuning — segel/LEVEL/CTA (peran "emas") |
| `--shu-val` | `#FF2E4C` | merah — **alert SAJA** |
| `--nezumi-val` | `#8F9CA8` | teks telemetri sekunder |

### 4.3 Warna — 電脳 (gelap = **真夜中 mayonaka**, tengah malam)

`.dark[data-era="cyberpunk"]`, `[data-theme="dark"][data-era="cyberpunk"]`

| Token | Nilai |
|---|---|
| `--kinari-val` | `#04050A` (hitam penuh) |
| `--kinari-light-val` | `#080B12` |
| `--backdrop-val` | `#020305` |
| `--sumi-val` | `#E8F4F8` |
| `--shu-val` | `#FF2E4C` |

> **Kontras WAJIB diukur di KEDUA kedalaman malam** (rasio di 宵 lebih ketat). Terukur: merah `#FF003C` cuma **4.41:1** di 宵 → dinaikkan ke `#FF2E4C`. Kuning `#FAF803` 17.8:1 di 真夜中 tapi di 宵 pakai `#FFE23A` biar tidak norak. Semua aksen target **≥4.5:1**.

### 4.4 Token bentuk — 電脳 (BARU: **kaca & cahaya**)

```css
--era-shadow:       0 0 22px rgba(0,240,255,.22), 0 0 46px rgba(0,240,255,.10); /* glow berlapis */
--era-shadow-hover: 0 0 30px rgba(0,240,255,.34), 0 0 60px rgba(0,240,255,.16);
--era-edge-w:       1px;                          /* hairline, BUKAN tinta tebal */
--era-radius:       0px;                          /* cut — sudut mati */
--era-motion:       110ms;                        /* paling cepat dari semua era */
--era-ease:         cubic-bezier(.2,.8,.2,1);
```

**Holonya DISIMULASIKAN, bukan kaca-blur.** Panel kaca-semu = gradien diagonal tipis + hairline cyan `alpha ~.32` + glow luar & dalam. **Nol `backdrop-filter`** — panel ber-blur di banyak tempat = repaint tiap frame = "berat pas scroll" (app ini pernah kena; lihat §14).

### 4.5 Pemetaan nilai (referensi cepat)

| Peran | Nilai |
|---|---|
| Panel kaca-semu | `border:1px solid rgba(0,240,255,.32)` + `background:linear-gradient(160deg,rgba(0,240,255,.06),rgba(0,240,255,.015) 45%,rgba(250,248,3,.02))` |
| Panel segel | border `rgba(250,248,3,.5)` + gradien kuning |
| Panel alert | border `rgba(255,0,60,.5)` + gradien merah |
| Segel (hanko holo) | border `2px var(--kin-val)` + `::before` dashed inset 4px + glow kuning |
| CTA | `background:var(--kin-val); color:#05060A` + `box-shadow:0 0 22px rgba(250,248,3,.35)` |
| Chip telemetri | mono `10px`, `letter-spacing:.16em`, uppercase, border hairline |

---

## 5. Tipografi

**Nol font baru.** App sudah load 10 keluarga; 多元 aja "nol font baru". Pakai yang ada:

| Peran | Font | Kenapa |
|---|---|---|
| Judul / HUD / segel | **Dela Gothic One** | gothic 極太 techno — **sudah dipakai 多元 untuk 題字**. Menggantikan peran "Chakra Petch" di referensi, tanpa unduhan baru. |
| Kanji hero | **Noto Serif JP** | DNA Jepang app — kanji besar tetap **serif**, biar tetap "app ini". |
| Chrome telemetri | **mono sistem** (`ui-monospace, "SFMono-Regular", Menlo, monospace`) | kesan terminal, nol unduhan. |
| Body | **Inter** (base) | tetap kebaca di teks panjang. |

```css
[data-era="cyberpunk"] {
  --font-display: "Dela Gothic One", "Noto Serif JP", sans-serif;
  --font-serif:   "Noto Serif JP", serif;
  --font-mono:    ui-monospace, "SFMono-Regular", Menlo, monospace;
}
```

> ⚠️ `font-synthesis-weight: none` sudah global di `body` (index.css). Dela Gothic One cuma punya 1 bobot → judul dipatok `font-weight:400` (native 極太), bukan 900 palsu (pelajaran 多元).

---

## 6. Motif & Ornamen

### 6.1 Pola ornamen app (WAJIB diikuti)

Ikut pola era lain: **1 elemen latar (`.era-pattern`) + ornamen tipis bergerbang era + `aria-hidden` + `pointer-events:none` + hormati `prefers-reduced-motion`.**

### 6.2 Daftar motif

| Motif | Fungsi | Catatan |
|---|---|---|
| **Grid cyan** | `.era-pattern` — latar | `44px`, STATIS |
| **Scanline** | `.era-pattern` lapis kedua | `3px`, STATIS |
| **Glitch (RGB-split / slice)** | momen (hover/event) | `transform`+`opacity` saja |
| **Segel holo** | hanko/LEVEL | kanji + border dashed |
| **Bar telemetri** | progress/level | hairline + fill glow |

### 6.3 Detail ornamen

- **Grid + scanline = `.era-pattern` WAJIB didefinisikan.** Era yang lupa akan **diam-diam mewarisi 青海波 (gelombang laut Edo)** sebagai seluruh latarnya — tanpa error, tanpa test merah. Verifikasi: `getComputedStyle(el).backgroundImage` berisi grid, BUKAN `circle cx='30' cy='30'`.
- **STATIS, jangan animasi `background-position`.** Layer fullscreen beranimasi = repaint tiap frame = "berat pas scroll". Kalau butuh gerak, animasikan `transform`/`opacity` di layer yang di-`transform: translate3d` (lihat §14).
- **Glitch hanya di MOMEN.** Muncul saat hover / jawaban salah / kebocoran cerita. `transform: translate(...)` + `opacity`, durasi ~.3s, `steps()`.

### 6.4 Catatan kode

```css
[data-era="cyberpunk"] .era-pattern {
  background-image:
    linear-gradient(rgba(0,240,255,.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,240,255,.06) 1px, transparent 1px);
  background-size: 44px 44px;
  animation: none;                       /* STATIS */
}
.dark[data-era="cyberpunk"] .era-pattern,
[data-theme="dark"][data-era="cyberpunk"] .era-pattern { /* varian gelap */ }
```

Urutan cascade penting: rule `.era-pattern` era harus datang **SETELAH** `.bg-seigaiha` era.

---

## 7. Peta 電脳 — 「家」 RUMAH (bukan 8 perhentian)

Era lain punya peta 8 perhentian (perjalanan). 電脳 **tidak** — karena sumbunya **menyempit ke satu titik**. Peta 電脳 = **satu tempat: rumah Nacht & Saku di kota neon**, dilihat dari beberapa sudut (gerbang → jalan → pintu → di dalam → perpisahan).

| # | Titik | Kanji | Fungsi app |
|---|---|---|---|
| 1 | Gerbang kota | 門 | masuk era (Lv 300) |
| 2 | Jalan neon | 街 | beranda / navigasi |
| 3 | Pintu rumah | 扉 | gerbang 終 (checkpoint) |
| 4 | Di dalam | 内 | cerita / reveal |
| 5 | Perpisahan | 別れ | penutup (TAMAT) |

> Data & fungsi murni → pola `animeStops.js` (`cyberpunkStops.js`), dites `node --test`.

---

## 8. Penamaan (tema di dalam tema)

### 8.1 Nama UI (`eraNames.js`) — **TERKUNCI**

| Key | Nama | Baca | Arti |
|---|---|---|---|
| shop | **闇市** | yamiichi | pasar gelap |
| gacha | **ハック** | hakku | hack (bobol data) |
| medaru | **クレジット** | kurejitto | kredit (mata uang) |
| inventory | **アーカイブ** | ākaibu | arsip data |
| profile | **電脳ID** | dennō ID | identitas |
| quest | **任務** | ninmu | misi |
| rank | **権限** | kengen | hak akses |
| checkpoint | **終** | owari | TAMAT (ujian akhir) |

> Pola makin ke depan = makin banyak **katakana** (kata serapan). 4 dari 8 = katakana, wajar untuk era paling maju.

### 8.2 Mata uang (`medaruCopy.js`)

`eraNames.js` **TIDAK cukup** untuk mata uang — perlu tambah `CYBERPUNK_MEDARU` di `medaruCopy.js`:
```js
export const CYBERPUNK_MEDARU = { name: 'クレジット', nameShort: 'クレジット', aria: 'クレジット' };
```
`nameShort` dipakai chip di top-bar (panjang — pertimbangkan versi pendek bila chip sempit).

### 8.3 Streak (`streakCopy.js`) — ✅ SUDAH

`CYBERPUNK_STREAK` di `streakCopy.js`: title 接続 (koneksi/uptime), sigil 電/断,
ikon `hologram` — streak = koneksi yang tetap tersambung. Terdaftar di peta era.

---

## 9. Audio — ✅ SUDAH (plan `cyberpunk`)

`THEME_BGM_PLANS.cyberpunk` sudah ada di `src/utils/sfx.js`: drone paling dalam dari
semua era (36.71/73.42/87.31 Hz), pad sawtooth gelap F-minor, arp synth minor dingin
(F G♯ C C♯ D♯, tiap 1.35 s), level 0.12 — **sunyi** (常夜), bukan ramai. BGM
disintesis Web Audio (nol aset), default OFF, ikut preferensi global.

---

## 10. Cinematic Perkenalan — ✅ SUDAH (`/cyberpunk-history`)

`cinematics.js` + `src/features/cinematic/cyberpunk/` lengkap: 5 babak (gate → city →
peak → endless → home), narator **Nacht** (wujud asli), voice 9 klip di
`/voices/cyberpunk/` (edge-tts). Route `/cyberpunk-history` terdaftar di `App.jsx`,
replay dari Pengaturan.

---

## 11. Materi & Checkpoint 終

### 11.1 Materi endgame = **総復習**

Isi app **100% N5** (kana+kanji+kotoba+grammar+mondai). Endgame 電脳 = **総復習** — bukan stok konten baru, tapi **ujian campuran semua era** (N5 = jumlah dari semua yang diajarin tiap era). **N4 ditolak** (kontennya ribuan item = proyek sendiri; ceritanya bilang 電脳 = akhir konten).

### 11.2 Checkpoint **終** (gerbang terakhir)

| Aspek | Nilai |
|---|---|
| Gerbang buka | **Lv 300 + sudah lulus 多元 最終回** (berurutan, seperti era lain) |
| Isi | Ujian campur semua materi — **REUSE mesin `features/n5exam/`** (78 soal, 3 seksi, skor 0–180) |
| "Tersulit" lewat ATURAN | ① **mode dingin** (tanpa benar/salah sampai selesai) · ② **ambang lulus naik** di atas standar N5 · ③ **sekali jalan** (tanpa retry dalam sesi) · ④ **waktu ketat** + semua seksi digabung |
| Lulus → | **完** (tamat, era terakhir) · gagal → tetap **終** |
| Hadiah | sertifikat `N5Certificate` |

**Pola implementasi (reuse, bukan bikin dari nol)** — ikut `SotsugyoCheckpoint` (Shōwa 卒業) & `AnimeCheckpoint` (多元 最終回):
```
src/features/cinematic/cyberpunk/cyberpunkCheckpoint.js   (modul murni, dites)
src/pages/OwariCheckpoint.jsx                              (halaman 終)
route /owari-checkpoint
```

---

## 12. Rencana Implementasi (T0–T12)

### T0 — Baseline ✅ (prasyarat)
Test/lint hijau + catat HEAD. `eras.js` sudah memuat `cyberpunk` ✅.

### T1 — Nama UI 電脳 (TDD)
`eraNames.js` + `medaruCopy.js` (`CYBERPUNK_MEDARU`) + test. Terapkan di nav.

### T2 — Token CSS 電脳
Blok `[data-era="cyberpunk"]` (宵 yoi) + `.dark[data-era="cyberpunk"]` (真夜中) di `index.css`. **`:root` TIDAK disentuh.** Pindahkan `cyberpunk` dari `BELUM` → `DIDESAIN` di `eraThemeCoverage.test.js`.

### T3 — Motif & ornamen
`.era-pattern` (grid + scanline, STATIS) + glitch (momen) + segel holo.

### T4 — Tipografi
Override `--font-display` (Dela Gothic One) / `--font-serif` / `--font-mono` di scope era. Nol font baru.

### T5 — Cinematic 電脳 ✅
`cinematics.js` + `cyberpunk/data/scenes.js` (5 babak) + `CyberCinematic.jsx` +
voice Nacht. Route `/cyberpunk-history`.

### T6 — Peta 「家」
`cyberpunkStops.js` (5 titik, §7) + test.

### T7 — Glitch permanen
Verifikasi `glitch.js` Lv 300 → glitch permanen benar-benar tampil (glitchAllowed + reduced-motion + toggle).

### T8 — Checkpoint 終
`cyberpunkCheckpoint.js` + `OwariCheckpoint.jsx` + route + gerbang (Lv 300 + lulus 多元 最終回). Aturan "tersulit" (§11.2). Reuse `n5exam`.

### T9 — Dark mode 宵/真夜中
Uji 2 kedalaman malam × komponen. Kontras tiap aksen ≥4.5 di KEDUA-nya.

### T10 — Audio tema ✅
`THEME_BGM_PLANS.cyberpunk` ada (drone 常夜, level 0.12, arp minor dingin).

### T11 — Wiring app
Route + Settings + pemilih era (terkunci Lv 300). Entry point di `TopControls`.

### T12 — Verifikasi akhir
Test/lint/build + `:root` bersih + perf (glitch/scanline tidak berat pas scroll, ukur `Emulation.setCPUThrottlingRate`).

---

## 13. Kriteria Penerimaan

- [ ] `[data-era="cyberpunk"]` + `.dark[data-era="cyberpunk"]` + `--era-shadow` ada; `cyberpunk` di `DIDESAIN`.
- [ ] `:root` **tidak berubah** (diff kosong).
- [ ] `.era-pattern` 電脳 sendiri (BUKAN seigaiha Edo).
- [ ] Tidak ada satu pun `box-shadow` offset keras `Npx Npx 0 0` milik 電脳.
- [ ] Tidak ada `backdrop-filter` (holo-sem, bukan kaca-blur).
- [ ] Semua aksen ≥4.5:1 di **宵 yoi** DAN **真夜中 mayonaka**.
- [ ] Nama UI: 闇市/ハック/クレジット/アーカイブ/電脳ID/任務/権限 + checkpoint 終.
- [ ] Checkpoint 終: gerbang Lv 300 + lulus 多元 最終回; mode dingin + ambang naik + sekali jalan + waktu ketat; lulus → 完.
- [ ] Glitch Lv 300 permanen; hormati reduced-motion + toggle.
- [ ] Nol emoji (ikon = kanji glyph).

---

## 14. Risiko & Catatan

| Risiko | Mitigasi |
|---|---|
| **"Berat pas scroll"** (layer fullscreen beranimasi / `backdrop-filter`) | Grid+scanline STATIS; animasi hanya `transform`/`opacity`; NOL blur. Ukur dengan `Emulation.setCPUThrottlingRate`. |
| **Glow terbaca "kartu web modern"** | Neon harus **sengaja & kotor** (scanline, misregistrasi RGB, flicker) — bukan "soft blue shadow" default komponen. |
| **Tema terang terasa "keluar dari cerita"** | 常夜 → terang = 宵 (kedalaman malam), BUKAN putih/siang. |
| **Kontras merah gagal di 宵** | Sudah diukur: naikkan ke `#FF2E4C`. Uji tiap aksen di kedua kedalaman. |
| **`.era-pattern` lupa → seigaiha Edo** | WAJIB tulis rule + verifikasi `backgroundImage`. |
| **Ciri khas app hilang** (jadi "netrunner generik") | Kosakata = cerita app (ナハト/サク/ロウ/絵巻/終), bukan STREET_RUNNER. Kanji hero tetap serif. |
| **Dela Gothic 1 bobot → bold palsu** | Judul `font-weight:400` (native), `font-synthesis-weight:none` sudah global. |

---

## 15. Yang TIDAK termasuk PRD ini

- **Isi POOL gacha ハック** (daftar hadiah) — ✅ SUDAH: 6 kosmetik 電脳 (§16).
- **Naskah NPC non-cinematic** — TBD.
- **Konten N4** — ditolak (proyek sendiri).
- **Franchise/karakter lapis 2/3** — 電脳 = satu dunia, tidak berlaku.
- **Implementasi kode** — dokumen ini spec; eksekusi di terminal (T0–T12).

---

## 16. Isi ハック (Gacha) — ✅ SELESAI

**Teks UI ✅** — `src/features/gacha/cyberpunkCopy.js` (`CYBERPUNK_GACHA`):
kicker 侵入, title **ハック**, watermark 電, hasil masuk アーカイブ (selaras
`eraNames.js` + §8.1). Sebelumnya `gachaCopy('cyberpunk')` jatuh ke LEGACY →
teks Indonesia "Gashapon Berkarat" bocor ke era 電脳; kini tidak.

**Isi POOL hadiah ✅** — `src/features/cosmetics/cosmetics.js`: **6 kosmetik**
(3 Frame ID 電脳ID: ネオン枠/雨枠/終枠 + 3 Skin HUD: 走査線/ホログラム/常夜),
tampilan saja TANPA suara (keputusan pemilik 2026-10-14). Terikat era 電脳:
`gachaCopy` ハック di 電脳 mengeluarkan kosmetik (`rollGacha` bercabang →
`rollCosmeticId`), tersimpan di `progress.ownedCosmetics`, dipasang lewat
`equipCosmetic` (`activeFrame`/`activeHud`) → tampil di Profil (bingkai avatar +
chip) & Inventory. Digate era: di luar 電脳 otomatis mati.

---

## 17. Karakter & NPC

| | Nacht ナハト | Saku 咲 |
|---|---|---|
| Wujud asli | **ロウ** (AI) — neon/hologram | **ロウ** (AI) — neon/hologram |
| Peran | pemandu tenang, pembuka penyamaran | hangat, mata berkaca saat perpisahan |
| Momen | *「…もう、隠せないな。」* | *「君は、もう一人で歩ける。」* |

Wujud "penyamaran" (roh) dari era sebelumnya **terbuka** di sini (§18).

---

## 18. Beat cerita — penyamaran terbuka (locked, story.md §6 Babak 3)

> Kota neon. 読み手 dewasa berdiri di depan rumah Nacht & Saku.
> **「…もう、隠せないな。」** → wujud berubah → **neon/hologram**.
> **「俺たちは、ロウだ。未来の——君たちの言葉で言うなら、機械の魂だ。」**
> **Pertanyaan besar SENGAJA tidak dijawab:** kenapa 絵巻 dikirim ke anak itu? Nacht & Saku diam; Saku tersenyum, mata berkaca.
> **「君は、もう一人で歩ける。」** · **「だから——ここで、お別れだ。」**
> 絵巻 menutup. **「…ありがとう。」** **TAMAT.**

---

## 19. Sisi gelap — 「常夜の光」 (cahaya malam abadi)

Sajikan datar, **tanpa drama** (pola Meiji §19 & Shōwa §19). Aturan nada: **「灯りは消えない。だから眠れない。」** — lampu tak pernah mati; karena itu tak bisa tidur.

| Aspek | Kanji | Catatan (datar) |
|---|---|---|
| Malam tak berujung | 不眠 | kota yang tak pernah tidur |
| Kesepian di tengah keramaian | 孤独 | paling ramai, paling sendiri |
| Data & privasi | 監視 | dilihat tanpa tahu |
| Mesin menggantikan manusia | 代替 | orang yang tergusur |
| Perpisahan | 別れ | yang tak bisa dihindari |

> Ini yang bikin 電脳 **bukan neon kosong** — di balik cahaya ada harga. Kontras dengan neon = tension utama tema.

---

## 20. Identitas suara — ✅ sebagian besar SUDAH

| Elemen | Status |
|---|---|
| BGM | ✅ `THEME_BGM_PLANS.cyberpunk` (§9) — synthwave/ambient 常夜 |
| SFX | ✅ pola glitch/blip/hum (glitch.js, sfx.js) |
| Segel/LEVEL | ✅ nada rendah "sistem" |
| Voice | ✅ Nacht/Saku **wujud asli** — cinematic `/voices/cyberpunk/` (9 klip) |

---

## 21. Ringkasan Satu Layar

> **電脳 = 常夜の時代.** Malam yang abadi, dan satu layar yang menyala di dalamnya.
> Heian menulis dengan **kuas** · Edo mencetak **blok kayu** · Meiji menyusun **huruf logam** · Shōwa menuang **beton** · 多元 membalik halaman ke **banyak dunia** · 電脳 **menyempit jadi satu: rumah.**
> **Sumbu:** 「kebocoran yang akhirnya jadi kenyataan」 — glitch Lv 300 PERMANEN.
> Tema **「常夜」**: tak ada siang → terang = **宵 yoi** (`#0E1A2E`) · gelap = **真夜中 mayonaka** (`#04050A`).
> cyan `#00F0FF` (info) · kuning `#FFE23A` (segel/CTA) · merah `#FF2E4C` (alert SAJA) · teks `#EAF2FA`.
> **hairline 1px + glow berlapis** · radius `0` · gerak `110ms` (tercepat) · **NOL blur**.
> Font: Dela Gothic One (display) · Noto Serif JP (kanji hero) · mono sistem. **Nol font baru.**
> Uang **クレジット** · gacha **ハック** · shop **闇市** · inventory **アーカイブ** · profile **電脳ID** · quest **任務** · rank **権限** · checkpoint **終**.
> **Materi = 総復習** (nol konten baru) · **終** = ujian campur semua era, tersulit → lulus **完**.
> **Cerita:** rumah Nacht & Saku · penyamaran terbuka (**ロウ**) · **別れ** · TAMAT.
> **ATURAN:** `:root` BEKU · glow SAH (satu-satunya era) · bentuk = kaca & cahaya (bukan beton/offset keras) · nol blur · nol emoji.
