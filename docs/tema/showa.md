# PRD — Tema Era: **SHŌWA 昭和** (Tema #4 dari 6)

**Versi:** v0.1 · **Dibuat:** 2026-10-10
**Status:** SPEC — belum diimplementasikan
**Induk:** sistem "Tema Era" (lihat `docs/tema/heian.md` §13)
**Target implementasi:** terminal baru (task T0–T12 di §12)
**Prasyarat:** `src/features/theme/eras.js` sudah memuat `{ id:'showa', kanji:'昭和', minLevel:100 }` ✅ (sudah ada).
**Tema sebelumnya:** Heian 平安 (Lv 1, ✅ LIVE) → Edo 江戸 (Lv 20, ✅ LIVE) → Meiji 明治 (Lv 50, ✅ LIVE).
**Papan visual:** `docs/tema/_board-showa.html` (mockup hidup — belum dibuat).

---

## 0. PRINSIP #0 — 「土台は凍らせる」 BASE BEKU *(baca ini dulu)*

> **Shōwa bukan tema baru. Shōwa adalah tema ASLI app ini — dan ia sudah hidup.**

Sebelum Heian/Edo/Meiji ada, app ini lahir dengan satu bahasa visual: **tinta tebal, bayangan keras tanpa blur, sudut tajam, hitam pekat.** Bahasa itu **bukan** dihapus saat sistem era dibuat — ia **ditinggalkan sebagai base** (`:root` di `src/index.css`). Setiap era baru (Heian, Edo, Meiji) **menumpuk di atasnya** dan menyembunyikannya lewat override.

Bukti di repo (dicek 2026-10-10):

| Fakta | Lokasi |
|---|---|
| **Tidak ada** blok `[data-era="showa"]` di CSS | `grep 'data-era="showa"' src` → kosong |
| Base `:root` = DNA Shōwa | `--sumi-val:#1a1a1a` · `--shu-val:#d3382f` (index.css §:root) |
| Shadow keras Shōwa di base | `shadow-[4px_4px_0_0_#1a1a1a]` … `12px` (index.css baris 74–81) |
| 226 pemakaian `shadow-[…]` + 5 `border-4` | komponen `.jsx` (warisan) |
| `EraContext` set `data-era="showa"` di Lv 100 → **jatuh ke base** | `EraContext.jsx` |
| Penjaga mengakui ini | `eraThemeCoverage.test.js`: `BELUM = ['showa','anime','cyberpunk']` |

Artinya: **saat pemain capai Lv 100, app sudah otomatis menampilkan Shōwa** — karena `data-era="showa"` tidak punya CSS, browser jatuh ke base. **Shōwa sudah "live", cuma belum bernama.**

### Maka aturan kerasnya:

> **JANGAN mengubah base `:root`.** Base = warisan 399 commit = ciri khas web ini.
> Tema Shōwa dibuat dengan **MENAMAI** dan **MEMBEKUKAN** base, lalu **MENAMBAH** ornamen + cinematic di atasnya.

```
❌ SALAH — ubah :root            → ciri khas lama HILANG, semua era kena getaran
✅ BENAR  — tambah [data-era="showa"] yang meng-echo base  → ciri khas DIKUNCI, era lain aman
```

**Konsekuensi desain:** Shōwa = **satu-satunya era yang bentuknya sudah ada dari awal.** Era lain *mengganti* bentuk; Shōwa *menegaskan* bentuk. Ini bukan kelemahan — ini **payoff**: tiga era pertama mengajak pemain "kabur dari brutalisme", dan di Lv 100 pemain **pulang ke rumah**.

**Arsitektur revisi:**

```
LAPIS 0  base :root          ← BEKU. Warisan. Nol perubahan. (tidak boleh disentuh)
LAPIS 1  [data-era="showa"]  ← MENGUNCI base + identitas Shōwa (echo, bukan ganti)
LAPIS 2  ornamen + cinematic ← YANG BARU. Bukti Shōwa "sengaja", bukan default yang lupa diubah.
```

---

## 1. Ringkasan

Tema **Shōwa** adalah tema era keempat (**gerbang Lv 100**). Ia mengubah wajah aplikasi dari bahasa visual **kota huruf logam Meiji** (hairline, aturan koran, tanpa bayangan) menjadi bahasa visual **kota pasca-perang**: **beton, bayangan keras, massa, dan satu lampu hangat di tengahnya.**

> **Tesis desain (satu kalimat):**
> **「昭和 = コンクリートの時代」** — *Shōwa = zaman beton.*
> **Kota yang dicor ulang dari abu, setiap hari, oleh orang biasa.**

Tesis visualnya adalah **pulang**. Heian menulis dengan **kuas** → Edo mencetak **satu blok kayu** → Meiji menyusun **huruf logam** → Shōwa **menuang beton**. Tiga era pertama bergerak dari halus → tegas → presisi; Shōwa **kembali ke bahasa asli app** — tapi kali ini **disengaja**, bukan default.

**Kebetulan yang menjadi tulang punggung:** fokus bahasa Shōwa = **ujian N5**. Ujian = **institusi**, dan institusi pasca-perang = **beton**. Maka bentuk (massa beton) dan isi (ujian besar yang menakutkan & memvalidasi) menjadi **satu benda yang sama**. Ini bukan tempelan — ini inti tema.

> **Catatan penting (beda dari PRD lain):** Shōwa **tidak mengganti bentuk** seperti Heian/Edo/Meiji. Ia **memformalkan** bentuk base yang sudah ada. Bagian yang benar-benar BARU = **ornamen + cinematic + nama + momen**. Lihat §0.

---

## 2. Kenapa Shōwa (dasar sejarah)

| Fakta | Implikasi desain |
|---|---|
| **Shōwa 1926–1989** — perang, kekalahan, pendudukan, lalu **pertumbuhan ekonomi kilat** | Nada tema = **bangkit dari abu** — bukan damai (Edo), bukan istana (Heian), bukan pencerahan (Meiji). |
| **1945 焦土** — kota besar rata jadi tanah; 焼け跡 yakeato | Titik awal peta = **reruntuhan**, bukan pelabuhan/jembatan. |
| **闇市 yamichi** — pasar gelap di reruntuhan (1945–50) | Perhentian 1 = survival, barter, orang biasa bertahan. |
| **団地 danchi** — perumahan beton massal (1950-an–60-an) | Motif utama = **beton + grid seragam**. Tempat tinggal jutaan orang. |
| **高度経済成長** — 1955–1973, "keajaiban ekonomi" | Tema = **membangun cepat**, gedung tumbuh, kota dicor ulang. |
| **東京タワー 1958** · **東京オリンピック 1964** · **新幹線 1964** | Simbol pemulihan: tinggi, cepat, bangga. |
| **大阪万博 1970** — Expo; **太陽の塔** (Okamoto Tarō) | Objek Shōwa paling aneh & kaya: organik-primitif vs struktur beton. |
| **Metabolists** (Tange Kenzō, 1960) · **代々木** (Tokyo Olympics 1964) | Arsitektur Shōwa = **literally brutalist** — béton brut, massa, bekas cetakan. |
| **受験 juken** — budaya ujian masuk yang kejam | Checkpoint tema = **ujian N5** (fokus bahasa app = ujian). |
| **新円 円 en** (1946) · TV · 電化製品 | Mata uang tetap **円**; gacha = **ガチャガチャ** (gachapon, lahir 1965). |

---

## 3. Kontras: Heian vs Edo vs Meiji vs Shōwa

Empat era = empat cara kata "menjadi benda". Shōwa harus terasa sebagai **penutup busur** — bahasa asli app yang kembali **sebagai destinasi**.

| Aspek | **Heian** (kuas) | **Edo** (blok kayu) | **Meiji** (huruf logam) | **Shōwa** (beton) |
|---|---|---|---|---|
| Garis tepi | tipis `1px` | ukir `2px` | hairline `1px` + aturan ganda | **tebal `4px` (base!)** |
| Bayangan | lembut berlapis | keras `3px 3px 0 0` | **TIDAK ADA** | **keras `4–6px 0 0` (base!)** |
| Sudut | membulat `10px` | tajam `4px` | `0px` (blok huruf) | **`0px` (base!)** |
| Rasa | halus, kabut | tegas, tercetak | presisi, mekanis | **berat, monumental, jujur** |
| Metafora | sutra & kertas | kayu cetak & tinta | huruf logam & kolom koran | **beton & bayangan** |
| Gerak | mengapung `600ms` | gesit `240ms` | mekanis `180ms linear` | **berat `200ms` (base, dipertahankan)** |
| Warna primer | 紫 murasaki `#5b4a7a` | 藍 ai `#1e4f79` | 煉瓦 renga `#9b4a3c` | **墨 sumi `#1a1a1a` (base!)** |
| Motif | awan + maple | 青海波 + 麻の葉 + 花火 | 唐草 + 縞 + 歯車 | **beton + 太陽の塔 + 団地 + 電柱** |
| Sosok | bangsawan | chōnin | murid, teknokrat | **orang biasa, buruh, murid ujian** |
| Bahasa | kana | kanji + furigana | grammar + reading | **ujian N5 (semua)** |
| Mata uang | 文 mon | 両 ryō | 円 en | **円 en** |

> **Keputusan terkunci:** Shōwa **meng-echo base apa adanya** (garis `4px`, shadow keras, radius `0`). Yang berubah = **warna sekunder, ornamen, dan momen** — bukan geometri.
> **Koreksi penting:** Meiji sengaja `--era-shadow: none` (nolak bayangan). **Shōwa adalah era di mana bayangan keras KEMBALI** — payoff yang sudah ditanam dua era sebelumnya. Ini bukan regresi; ini **pulang**.

---

## 4. Design Tokens

### 4.1 Arsitektur token

Mengikuti 3 lapis Heian/Edo/Meiji (`docs/tema/heian.md` §4.1), **plus Lapis 0**:

```
LAPIS 0  base :root          bentuk+DNA Shōwa          ← BEKU (tidak diubah)
LAPIS 1  --era-* / --*-val   echo base (penguncian)     ← [data-era="showa"]
LAPIS 2  data-theme × era    terang/gelap                ← komposisi
```

Selektor: `[data-era="showa"]` (terang) · `.dark[data-era="showa"]`, `[data-theme="dark"][data-era="showa"]` (gelap).

### 4.2 Warna — Shōwa (terang) — *echo base + beton*

```css
[data-era="showa"] {
  /* ── DIKUNCI dari base (JANGAN diubah nilainya) ── */
  --sumi-val:     #1a1a1a;  /* 墨 sumi — tinta Shōwa asli (base) */
  --shu-val:      #d3382f;  /* 緋 shu — merah segel/日の丸 (base) */
  --kinari-val:   #f3f0e8;  /* 生成 kinari — kertas (base) */
  --ai-val:       #182b49;  /* 藍 ai — base */

  /* ── BARU khas Shōwa: beton ── */
  --concrete-val: #8c8c85;  /* コンクリ灰 concrete grey (PRIMER baru) */
  --gin-nezu-val: #b9b7ae;  /* 銀鼠 gin-nezu — abu perak muda (panel) */
  --sodium-val:   #d9a441;  /* ナトリウム灯 — lampu sodium amber (AKSEN hangat tunggal) */
  --backdrop-val: #d8d5cc;  /* latar luar — aspal pucat/beton */
}
```

> **Catatan token baru:** `--concrete-val` (primer) + `--gin-nezu-val` + `--sodium-val` (aksen) = token **baru** milik Shōwa. Token inti (`--sumi-val`, `--shu-val`, `--kinari-val`) **dikunci sama dengan base** supaya identitas asli tak bergeser.

### 4.3 Warna — Shōwa (gelap / 「夜の団地」 yoru no danchi)

```css
.dark[data-era="showa"], [data-theme="dark"][data-era="showa"] {
  --sumi-val:     #ececec;  /* teks abu terang (beton malam) */
  --shu-val:      #ef4c3c;  /* merah menyala */
  --kinari-val:   #14161a;  /* malam aspal */
  --ai-val:       #4f80c2;
  --concrete-val: #5a5a55;  /* beton gelap */
  --gin-nezu-val: #6e6c64;
  --sodium-val:   #e0b050;  /* lampu sodium menyala */
  --backdrop-val: #0b0c0e;
}
```

> **Vibe gelap = 「夜の団地」:** baris jendela beton menyala satu-satu + lampu sodium + kereta terakhir lewat. **Bukan** istana malam (Heian), **bukan** 夜市 lentera (Edo), **bukan** gaslight (Meiji).

### 4.4 Token bentuk — Shōwa (ECHO BASE, bukan ganti)

```css
[data-era="showa"] {
  --era-shadow:       4px 4px 0 0 var(--sumi-val);   /* ← echo base Shōwa */
  --era-shadow-hover: 6px 6px 0 0 var(--sumi-val);
  --era-edge-w:       4px;                            /* ← echo base */
  --era-edge-color:   var(--sumi-val);
  --era-radius:       0px;                            /* ← echo base (tajam) */
  --era-radius-sm:    0px;
  --era-radius-pill:  9999px;                         /* pill tetap pill */
  --era-motion:       200ms;                          /* ← echo base (snap) */
  --era-ease:         cubic-bezier(0.2, 0, 0, 1);
}
```

> **⚠️ Inilah inti §0.** Blok ini **tidak mengubah tampilan** Shōwa (base sudah seperti ini). Fungsinya: **mengunci** agar base tidak bisa berubah di masa depan dan merusak identitas. Setelah blok ini ada, `:root` bebas "membeku".

### 4.5 Pemetaan nilai (referensi cepat)

| Token | Heian | Edo | Meiji | **Shōwa** | Nama tradisional |
|---|---|---|---|---|---|
| `--kinari-val` | `#f6f1e4` | `#f4ecd8` | `#f4f1e8` | **`#f3f0e8`** | 生成 kinari (=base) |
| `--sumi-val` | `#3a332b` | `#1c1b1a` | `#141414` | **`#1a1a1a`** | 墨 sumi (=base) |
| `--ai-val` | `#5b4a7a` | `#1e4f79` | `#2f4f6b` | **`#182b49`** | 藍 ai (=base) |
| `--shu-val` | `#b83b4a` | `#c0392b` | `#b8352c` | **`#d3382f`** | 緋 shu (=base) |
| **`--concrete-val`** | — | — | — | **`#8c8c85`** | **コンクリ灰** (BARU) |
| **`--gin-nezu-val`** | — | — | — | **`#b9b7ae`** | **銀鼠** (BARU) |
| **`--sodium-val`** | — | — | — | **`#d9a441`** | **ナトリウム灯** (BARU) |
| `--era-shadow` | berlapis blur | `3px 3px 0 0` | `none` | **`4px 4px 0 0`** | keras (=base) |

---

## 5. Tipografi

Heian = tulis tangan (Klee One). Edo = serif ukiran (Shippori Mincho B1). Meiji = 明朝体 modern + serif Victoria (Noto Serif JP + Playfair). Shōwa = **zaman papan reklame & koran malam** → **grotesk tebal (sans) + 明朝 untuk teks panjang**.

| Peran | Font | Sumber | Alasan |
|---|---|---|---|
| **Judul hero / display** | **Noto Serif JP 900** *(sudah dimuat)* | Google Fonts | blok tebal monumental, tapi tetap Jepang |
| **Judul besar / angka papan** | **Inter 900** *(sudah dimuat)* | Google Fonts | grotesk tebal — papan reklame, angka 偏差値 |
| **Kanji / body** | **Shippori Mincho** *(sudah dimuat)* | Google Fonts | konsisten era sebelumnya |
| **UI / tombol** | **Inter** *(tetap)* | Google Fonts | keterbacaan |

**Aturan pakai:**
- `.font-display` → judul hero, judul era, nama perhentian.
- `.font-sans` (Inter) 900 → **tebal** untuk label papan/angka (beda dari era lain yang pakai Inter biasa).
- `.font-serif` → kanji, reading, teks panjang.

> **Tidak ada font baru.** Shōwa cukup pakai yang sudah dimuat (Noto Serif JP + Shippori Mincho + Inter). Beban nol. Font yang ada **dipakai lebih berat** (Inter 900) untuk rasa "papan/gedung".

---

## 6. Motif & Ornamen

### 6.1 Pola ornamen app (WAJIB diikuti — konsistensi dengan Edo/Meiji)

Setiap era punya **2 ornamen** dengan pembagian yang selalu sama. Shōwa **wajib** mengikuti pola ini:

| | Ornamen 1 — **KINETIK** | Ornamen 2 — **PANEL** |
|---|---|---|
| Sifat | benda gantung, **berayun ikut scroll** | benda datar, **statis**, ber-kanji |
| Teknik | `useScroll` → `useVelocity` → `useSpring` → `useTransform` (rotasi kecil di titik gantung) | SVG statis |
| Edo | **提灯** lentera (ayun 11°) | **暖簾** tirai toko `江戸市` |
| Meiji | **瓦斯灯** lampu gas (ayun 6°, lebih berat) | **文選** rak huruf `明治活字` |
| **Shōwa** | **電柱＋架線** (kabel, ayun berat) | **看板 商店街** |

**Aturan teknis (dari `EdoOrnament.jsx` / `MeijiOrnament.jsx`):**
- SVG React, `role="presentation"`, `aria-hidden="true"`, `pointer-events:none` (murni dekoratif).
- **Gate CSS**: `.showa-ornament` → `display:none` di era lain (hanya tampil saat `[data-era="showa"]`).
- **Dua state**: siang padam / malam menyala (`.dark[data-era="showa"]`).
- `prefers-reduced-motion: reduce` → gerak dimatikan (hook `usePrefersReducedMotion`).
- File: **`src/components/ShowaOrnament.jsx`** (export `ShowaDenchu` + `ShowaKanban`).

### 6.2 Daftar lengkap motif & ornamen

| # | Motif | Kanji | Jenis | Peran | Kelas CSS |
|---|---|---|---|---|---|
| 1 | **電柱＋架線** | denchū | **kinetik** | tiang + kabel gantung, ayun ikut scroll | `.showa-denchu` |
| 2 | **看板** | kanban | **panel** | papan 商店街, huruf grotesk tebal | `.showa-kanban` |
| 3 | **東京タワー** | Tōkyō Tawā | hero | menara 1958 berdiri di panel hero | `.showa-tower` |
| 4 | **首都高** | shutokō | aksen | pita beton melengkung → divider/latar history | `.era-divider` |
| 5 | **打ちっぱなし** | — | tekstur | beton exposed: bintik abu + bekas cetakan | `.showa-concrete` |
| 6 | **団地グリッド** | danchi | tekstur | grid jendela beton berulang | `.showa-danchi` |
| 7 | **太陽の塔** | taiyō no tō | motif | **KHUSUS perhentian 万博** (siluet, bukan reproduksi) | (scene, bukan ornamen) |

**Tekstur:** **grain beton** (bintik abu) di atas blok warna + **halftone** (warisan Meiji, dipertahankan sebagai benang merah cetak).
**Cap:** **segel 極/印 merah** di sudut kartu/panel — tanda tangan visual (sama seperti Edo/Meiji, benang merah).

### 6.3 Detail tiap ornamen

**1. 電柱＋架線 ShowaDenchu — KINETIK (utama)**
> Langit Shōwa = langit penuh kabel. Sebelum kabel ditanam, seluruh Jepang pasca-perang diselimuti **tiang beton + kabel menggantung**. Ini objek paling "Shōwa" yang ada, dan **belum dipakai era lain**.

- **Bentuk:** tiang beton vertikal (viewBox ±`0 0 72 160`) + **3–4 kabel catenary** (kurva melengkung antar tiang) + 1 lampu jalan di ujung.
- **Gerak:** kabel **bergoyang pelan** ikut momentum scroll — **berat**, bukan lincah. Spring lebih kaku dari 提灯: `{ stiffness: 140, damping: 20, mass: 1.6 }`, rotasi `≤ 4°` (提灯 11°, 瓦斯灯 6° → 電柱 paling berat). Transform-origin di pangkal tiang.
- **Siang:** siluet abu beton (`--concrete-val`). **Malam** (`.dark[data-era="showa"]`): **lampu sodium menyala** — halo amber (`--sodium-val`) + kabel jadi siluet gelap di langit.
- **Kelas:** `.showa-denchu` + `--showa-denchu-pole/--cable/--lamp/--glow`
- **Kenapa cocok:** kabel menggantung = **analog langsung** 提灯 (Edo) / 瓦斯灯 (Meiji) — benda gantung yang berayun — tapi medianya **listrik & beton**, bukan lilin/gas. Tangga material (lilin → gas → **listrik**) nyambung sempurna.

> **Alternatif kinetik (cadangan):** 🧺 **団地の物干し** — jemuran di balkon beton, kain bergoyang. Sangat Shōwa (danchi + cucian) & lembut, tapi kurang ikonik dari 電柱.

**2. 看板 ShowaKanban — PANEL (utama)**
> Panel statis ber-kanji, sejajar 暖簾 (Edo) / 文選 (Meiji).

- **Bentuk:** papan kotak sederhana — **plat/logam**, bukan kayu ukir. Kanji **商店街** (atau **昭和**).
- **Gaya huruf:** **grotesk tebal** (Inter 900) — papan reklame Shōwa, **bukan** serif ukir.
- **Warna:** dasar `--concrete-val` (beton), teks `--sumi-val`, satu aksen merah `--shu-val`.
- **Kelas:** `.showa-kanban` + `--showa-kanban-plate/--text/--accent`

> **Alternatif panel (cadangan):** 📻 **ラジオ / 白黒テレビ** kotak — tapi ini lebih cocok jadi **item gacha** (§16), bukan ornamen hero.

**3. 東京タワー ShowaTower — HERO**
> Ornamen besar berdiri di panel hero Home (bukan gantung).

- **Bentuk:** rangka merah-putih, ramping, kaki 4 menyilang. SVG sederhana (siluet + garis rangka), **bukan foto/detail penuh**.
- **Peran:** berdiri di `.home-hero-bg` panel hero, sejajar `.meiji-ornament` / `.edo-ornament`.
- **Kelas:** `.showa-tower` + `--showa-tower-frame/--accent`

**4. 首都高 Shutokō — AKSEN (bukan ornamen utama)**
> Pita beton melengkung di atas kota (jalan layang Shōwa).

- Dipakai sebagai **divider** atau **band** di halaman history (`/showa-history`), **bukan** di Home.
- Menggantikan `.era-divider` Shōwa: satu garis beton melengkung + kolom penyangga.

**5. 打ちっぱなし + 団地グリッド — TEKSTUR (CSS layer, bukan React)**
> Seperti `.era-grain` (Edo) / `.bg-halftone` (Meiji) — bukan komponen.

- `.showa-concrete` — bintik abu + **bekas cetakan** (formwork marks) di atas blok warna → beton exposed. Bukan glossy.
- `.showa-danchi` — pola **grid jendela seragam** untuk panel/latar.
- Aktif hanya di `[data-era="showa"]` (day) + `.dark[data-era="showa"]` (night).

### 6.4 Catatan kode

- `src/index.css` sudah punya `.era-grain`, `.bg-halftone` (Meiji). Shōwa **menambah**: `.showa-concrete`, `.showa-danchi`, `.showa-denchu`, `.showa-kanban`, `.showa-tower`. **Semua override di dalam `[data-era="showa"]`** supaya tak bocor ke era lain (jaring pengaman sama seperti Heian §7.2C).
- **Guard test** (pola `meijiTheme.test.js`): `showaTheme.test.js` memastikan (a) tiap ornamen punya gate `.showa-*`, (b) ornamen **tidak** muncul di era lain, (c) token `--concrete-val` ada di blok Shōwa.

> **⚠️ HAK CIPTA — keputusan terkunci:**
> - **東京タワー** dipakai untuk **hero** — struktur/bangunan, **lebih aman** (desain menara ikonik, digambar sebagai siluet rangka sederhana).
> - **太陽の塔** (karya seni **Okamoto Tarō**) → **JANGAN** direproduksi detail. Hanya **siluet sederhana** dan **hanya** sebagai motif perhentian 万博 (scene), **bukan** ornamen hero.
> - **Gōjira/Godzilla** (IP **Tōhō**) → **JANGAN** dipakai. Kalau mau nuansa kaijū, pakai **siluet abstrak** (bayangan gedung/bentuk raksasa tanpa detail ikonik).

---

## 7. Peta Shōwa — 8 Perhentian

Rute naratif tema: tur **"dari abu ke menara"** — dari reruntuhan → bertahan → perumahan → tinggi → cepat → pesta → sidang → lulus.

```
                    【焼け跡】← titik nol (1945)
                         │
        ┌────┬────┼────┬────┐
     闇市  団地  東京タワー  新幹線    (kota tumbuh cepat)
        └────┴────┴────┴────┘
                         │
                    【万博】← 太陽の塔 (1970)
                         │
                    【卒業】← ujian N5 → gerbang naik era
```

| # | Perhentian | Kanji | Tema | Pelajaran bahasa |
|---|---|---|---|---|
| 0 | Yakeato | 焼け跡 | titik nol · dari abu | 挨拶 aisatsu · 復興 fukkō |
| 1 | Yamichi | 闇市 | pasar gelap · bertahan hidup | 食べ物 tabemono · 売る/買う |
| 2 | Danchi | 団地 | perumahan beton · keluarga | 家族 kazoku · 部屋 heya |
| 3 | Tōkyō Tawā | 東京タワー | 1958 · menara pemulihan | 高い takai · 上 agaru |
| 4 | Shinkansen | 新幹線 | 1964 · kecepatan | 速い hayai · 時間 jikan |
| 5 | Orinpikku | オリンピック | 1964 · bangga nasional | スポーツ · 勝つ katsu |
| 6 | Banpaku | 万博 | 1970 · masa depan · 太陽の塔 | 未来 mirai · 夢 yume |
| 7 | Sotsugyō | 卒業 | ujian N5 · 蛍の光 | **CHECKPOINT** (N5 → naik era) |

### Detail tiap perhentian

**0. 焼け跡 Yakeato — 灰からの出発**
Kota rata jadi tanah (1945). Pelajari: 挨拶 aisatsu · 復興 fukkō. Momen: roh muncul pertama kali di reruntuhan — *「ここから、また始める。」* Vibe: sunyi, abu, langit luas, orang berdiri.

**1. 闇市 Yamichi — 生き延びる町**
Pasar gelap di reruntuhan (1945–50) — barter, apa saja dijual. Pelajari: 食べ物 tabemono · 売る/買う. Momen: Saku menemukan makanan pertama — *「あたたかい…。」* Vibe: lampu bohlam gantung, asap, kerumunan, hidup keras.

**2. 団地 Danchi — コンクリートの家**
Perumahan beton massal (1950-an). **Ini inti bentuk tema.** Pelajari: 家族 kazoku · 部屋 heya. Momen: keluarga pindah ke unit baru — *「ここが、私たちの家。」* Vibe: koridor beton, jendela seragam, cucian di balkon.

**3. 東京タワー Tōkyō Tawā — 1958**
Menara 333 m — simbol pemulihan. Pelajari: 高い takai · 上 agaru. Momen: naik lift, lihat kota dari atas — *「街が、こんなに大きくなった。」* Vibe: sore, merah-putih, kota terbentang.

**4. 新幹線 Shinkansen — 1964**
Kereta cepat pertama. Pelajari: 速い hayai · 時間 jikan. Momen: **"waktu & jarak menyusut"** (echo tema Meiji 鉄道). Vibe: hidung biru-putih, peron, peluit, kecepatan.

**5. オリンピック Orinpikku — 1964**
Tokyo Olympics (代々木, Tange). Pelajari: スポーツ · 勝つ katsu. Momen: stadion penuh, bendera — *「世界が、ここに来た。」* Vibe: terang, sorak, massa penonton di tribun beton.

**6. 万博 Banpaku — 1970 太陽の塔**
Osaka Expo; **太陽の塔** (Okamoto). Objek paling aneh & kaya Shōwa. Pelajari: 未来 mirai · 夢 yume. Momen: **= SHOP 商店** — display masa depan, memilih. Vibe: tenda besar, monorel, menara bermuka tiga.

**7. 卒業 Sotsugyō — 試験の町**
Ujian N5 (受験). Pelajari: sintesis semua (kana + kotoba + kanji + grammar + reading). Momen: **CHECKPOINT AKHIR** — kerjakan ujian N5 → lulus = naik era. Vibe: ruang ujian sunyi, jam dinding, **蛍の光** saat lulus. *「ここまで、来たね。」*

---

## 8. Penamaan (tema di dalam tema)

Mengikuti pola Heian/Edo/Meiji (`docs/tema/heian.md` §11). Tabel di `src/features/theme/eraNames.js`.

| Fungsi | Heian | Edo | Meiji | **Shōwa** | Kanji | Alasan |
|---|---|---|---|---|---|---|
| Shop / Warung | 市 | 問屋 | 商店 | **商店街 shōtengai** | 商店街 | jalan belanja pasca-perang |
| Gacha | 貝合わせ | 富くじ | 福引 | **ガチャガチャ** | ガチャ | gachapon (lahir 1965) |
| Mata uang | 文 | 両 | 円 | **円 en** | 円 | yen bertahan (新円 1946) |
| Inventory / Tas | 箪笥 | 風呂敷 | 鞄 | **ランドセル** | ランドセル | tas sekolah Shōwa |
| Profil | 系図 | 人別帳 | 戸籍 | **履歴書 rirekisho** | 履歴書 | CV/résumé — dokumen Shōwa |
| Misi harian | 日課 | 奉公 | 課業 | **宿題 shukudai** | 宿題 | PR sekolah |
| Peringkat | 位 | 番付 | 階級 | **偏差値 hensachi** | 偏差値 | skor ujian — inti tema |

> **Penting:** Shōwa memakai **kanji penuh + katakana** (ガチャ/ランドセル) — pemain di Lv 100 sudah mahir. Gacha copy Shōwa (ガチャ) pakai kanji+katakana seperti `meijiCopy.js`, bukan kana seperti `heianCopy.js`.
> **Bonus tema:** 偏差値 (peringkat) mengikat langsung ke tema **ujian** — peringkat pemain = skor ujian.

---

## 9. Audio

Mengikuti pola Heian/Edo/Meiji (`heian.md` §9): satu BGM per era + SFX per-interaksi. Titik tune tunggal di `src/utils/sfx.js` → `THEME_BGM_PLANS.showa`.

| Elemen | Usulan |
|---|---|
| BGM | **歌謡曲 kayōkyoku** (Shōwa pop) + drone berat — **hangat di atas beton**, bukan brass (Meiji) bukan shamisen (Edo) |
| Drone | bass stabil, **berat/rendah** (beton) — lebih gelap dari Meiji |
| Pluck/melodi | gitar bersih / elektrik lembut pada **pentatonik + blues**, nada nostalgia |
| SFX kota | kereta lewat, 新幹線 whistle, チャイム sekolah, cicada 蝉 |
| SFX gacha | **ガチャガチャ** (kapsul berputar) |
| Mood | `ruins` (焼け跡) · `danchi` (団地) · `city` (東京) · `expo` (万博) |
| Momen | **蛍の光** saat lulus checkpoint (melodi "Auld Lang Syne") |

```js
// src/utils/sfx.js — tambah ke THEME_BGM_PLANS
showa: {
  level: 0.13,
  fadeInMs: 1600,
  fadeOutMs: 1000,
  drone: { freqs: [49, 98, 116.54], detune: [0, -5, 2], gain: 0.5 },   // rendah & berat (beton)
  pad:   { type: 'sawtooth', freqs: [196, 233.08, 293.66], filterHz: 900, lfoHz: 0.08, lfoDepth: 180, gain: 0.24 },
  pluck: { notes: [196, 220, 261.63, 293.66, 349.23], everyMs: 1250, dur: 1.1, gain: 0.16 }, // pentatonik+blues
},
```

> **Keputusan kunci:** Shōwa = **hangat & nostalgia** (kayōkyoku) di atas **drone berat** (beton). Meiji = mayor diatonik (Barat/cerah); Shōwa = pentatonik+blues (Jepang-modern/melankolis). Kontras terasa.

---

## 10. Cinematic Perkenalan

Mengikuti pola Heian/Edo/Meiji (`heian.md` §10, `edo.md` §10): 60–90 detik, data-driven (`scenes.js`), diputar sekali, bisa di-skip. Narator = **Nacht ナハト** (selang-seling: Heian=Saku, Edo=Nacht, Meiji=Saku, **Shōwa=Nacht**).

**Storyboard (5 babak):**

| # | Visual | Teks (JP / ID) | Audio |
|---|---|---|---|
| 1 | Kota rata jadi abu — horizon kosong *(tanpa teks)* | *(tanpa teks)* | angin, sunyi |
| 2 | 闇市: lampu bohlam, orang bertahan | **昭和時代** / "Zaman Shōwa (1926–1989)" | kayōkyoku masuk |
| 3 | Beton dituang — gedung tumbuh cepat, 団地 berbaris | **コンクリート、打つ** / "Beton dituang" | mesin, gedung naik |
| 4 | 東京タワー → 新幹線 → 太陽の塔 | **灰から、塔へ** / "Dari abu, ke menara" | peluit, sorak, drum |
| 5 | Kota beton → logo + segel 極/印 | **昭和 — 灰からの町** / "Shōwa — kota dari abu" | lonceng, 蛍の光 petikan |

**Spesifikasi:** **SVG/React** (BUKAN video) — mengikuti keputusan T11b Meiji. `showa/data/scenes.js` + `ShowaBackdrop.jsx` + `ShowaScenes.jsx` + `ShowaCinematic.jsx`. Reaktif ke waktu/mood/`prefers-reduced-motion`, tanpa beban MB.

**Voice (pola `docs/voice-cinematic-edo.md`):** narator **Nacht**, 1 file `nacht-showa.mp3` di-split jadi 7 klip (`01_era` … `07_welcome`) di `public/voices/showa/`, sumber mentah di `voice-source/showa/`.

### Naskah + timing (usulan, 7 baris)

Scene 1 (`ruins`, 10s) **TANPA teks** → tanpa voice. Scene start: ruins 0 · yamichi 10 · build 24 · tower 38 · change 52; total ~68s.

| # | scene/baris | Teks Jepang | Kana (ふりがな) | at | absolut |
|---|---|---|---|---|---|
| 1 | yamichi/era | 昭和時代 | しょうわじだい | 0.6 | **10.6s** |
| 2 | yamichi/survive | 灰の中でも、人は生きる。 | はいの なかでも、ひとは いきる。 | 3.6 | **13.6s** |
| 3 | build/concrete | コンクリートを打って、町を作る。 | こんくりーとを うって、まちを つくる。 | 0.8 | **24.8s** |
| 4 | tower/rise | 塔が立つ。速い車が走る。 | とうが たつ。はやい くるまが はしる。 | 0.7 | **38.7s** |
| 5 | change/turn | そして、未来が見えてくる。 | そして、みらいが みえてくる。 | 0.6 | **52.6s** |
| 6 | change/era2 | 昭和 — 灰からの町 | しょうわ — はいからの まち | 5.0 | **57.0s** |
| 7 | change/welcome | ようこそ、昭和へ。 | ようこそ、しょうわへ。 | 7.6 | **59.6s** |

> Nama file hasil: `01_era.mp3` · `02_survive.mp3` · `03_concrete.mp3` · `04_rise.mp3` · `05_turn.mp3` · `06_era2.mp3` · `07_welcome.mp3`.

---

## 11. Koneksi ke Fitur App

| Perhentian | Fitur | Bagaimana |
|---|---|---|
| 卒業 Sotsugyō | **Ujian N5** | `features/n5exam/` + `/n5-exam` **sudah ada** → checkpoint Shōwa = N5 exam |
| 万博 Banpaku | **Shop 商店街** | pameran = display barang masa depan |
| 団地 Danchi | **Profil 履歴書** | rumah & keluarga = data pemain |
| 闇市 Yamichi | **Gacha ガチャ** | kapsul = gachapon |
| 東京タワー / 新幹線 | **Progress** | naik & makin cepat = progres belajar |
| 焼け跡 Yakeato | **Dark mode** | 夜の団地 — jendela beton menyala |
| 卒業 | **Checkpoint** | ujian N5 → gerbang Lv 150 (Anime Multiverse) |

> Koneksi ini **bukan tempelan**: 卒業 memang ujian, 万博 memang pameran, 団地 memang tempat tinggal, 闇市 memang tempat gacha.

---

## 12. Rencana Implementasi (T0–T12)

> Konvensi commit: `feat(theme):`, `fix(theme):`, `style(theme):`, `docs(theme):`.
> Setiap task: tulis test gagal → implementasi → test lulus → commit.
> **Aturan tambahan Shōwa: JANGAN sentuh `:root`.** Diff pada `:root` = tanda bahaya.

### T0 — Baseline
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run lint 2>&1 | grep -ci error
git rev-parse --short HEAD
git diff --stat src/index.css | grep ':root' || echo "OK: :root tak disentuh"
```

### T1 — Nama UI Shōwa
Tambah blok `showa` ke `ERA_NAMES` di `src/features/theme/eraNames.js` (§8).
Test: `eraName('gacha','showa')` → `'ガチャガチャ'`; `eraName('rank','showa')` → `'偏差値'`; era tak dikenal → fallback.

### T2 — Token CSS Shōwa (ECHO BASE)
Tambah blok `[data-era="showa"]` + `.dark[data-era="showa"]` di `src/index.css` (§4).
Isi: warna (4.2/4.3, **token inti = nilai base**), bentuk (4.4, **echo base**).
**Verifikasi:** grep `--era-shadow` di blok Shōwa = `4px 4px 0 0` (bukan `none`).

### T3 — Ornamen & tekstur
Tambah `.showa-concrete`, `.showa-danchi`, `.showa-denchu`, `.showa-tower` di `index.css` + komponen `src/components/ShowaOrnament.jsx` (pola `MeijiOrnament.jsx`), gate `.showa-ornament`.

### T4 — Tipografi
Pakai font yang sudah dimuat (Noto Serif JP 900 + Inter 900). Tak ada font baru. Terapkan `.font-display` pada judul hero Shōwa.

### T5 — Cinematic Shōwa
Tambah entri ke `CINEMATICS` di `src/features/cinematic/cinematics.js`:
```js
showa: { id: 'showa', era: 'showa', kind: 'history', title: '昭和', route: '/showa-history' },
```
Buat `src/features/cinematic/showa/` mengikuti struktur Meiji (data-driven `scenes.js` + view scene SVG/React).
**Test penjaga:** `cinematicForEra('showa')?.id === 'showa'`; `nextCinematic('showa', {}) === 'showa'`.

### T6 — Peta 8 perhentian
Buat `src/features/cinematic/showa/showaStops.js` (modul murni, §7) + test (pola `meijiStops.test.js`).

### T7 — Gacha ガチャガチャ
Buat `src/features/gacha/showaCopy.js` (pola `meijiCopy.js`, §8) + test. Konteks: gachapon — putar kapsul → kartu/kanji.

### T8 — Dark mode 夜の団地
Pastikan toggle gelap saat era Shōwa = 夜の団地 (beton gelap + jendela menyala + sodium), bukan era lain.
**Verifikasi:** uji **8 kombinasi** (4 era × terang/gelap).

### T9 — Checkpoint 卒業 (N5)
`src/features/cinematic/showa/showaCheckpoint.js` (pola `meijiCheckpoint.js`) — **pakai `features/n5exam/` yang sudah ada** → ujian N5 = gerbang naik era.

### T10 — Audio tema
Isi `THEME_BGM_PLANS.showa` (§9) + test di `themeAudio.test.js` (pola Meiji).

### T11 — Voice cinematic
Generate `nacht-showa.mp3` → split 7 klip → wire ke `showa/data/scenes.js` (§10) + test penjaga file voice ada.

### T12 — Verifikasi akhir
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run lint 2>&1 | grep -ci error     # 0
npm run build 2>&1 | tail -3           # exit 0
git diff --stat src/index.css | grep ':root' || echo "OK: :root BEKU"
```
Uji manual: Lv 100 → app tampil Shōwa (beton, shadow keras **KEMBALI**, tajam, abu+merah); toggle gelap → 夜の団地; `prefers-reduced-motion` → animasi mati; **ciri khas web lama masih utuh**.

---

## 13. Kriteria Penerimaan

| # | Kriteria | Cara uji |
|---|---|---|
| 1 | `data-era="showa"` di `<html>` saat Lv 100 | DevTools |
| 2 | `--concrete-val` = `#8c8c85` (primer) | DevTools computed |
| 3 | Bentuk: garis `4px` + shadow keras `4px 4px 0 0` + radius `0px` (echo base) | Visual |
| 4 | Motif beton / 団地 / 電柱 / 太陽の塔 | Visual |
| 5 | Nama nav jadi 商店街 / ガチャガチャ / 円 / ランドセル / 履歴書 / 宿題 / 偏差値 | Visual |
| 6 | Peta 8 perhentian tampil | Visual |
| 7 | Gacha ガチャガチャ jalan di 闇市 | Uji gacha |
| 8 | Dark mode = 夜の団地 | Toggle |
| 9 | Checkpoint 卒業 = ujian N5 → naik era | Uji |
| 10 | Cinematic Shōwa (narrator Nacht) auto-play sekali | Uji |
| 11 | **`:root` TIDAK berubah** (git diff bersih) | `git diff src/index.css` |
| 12 | Kontras Meiji↔Shōwa terasa saat pindah (bayangan **KEMBALI**) | Visual |
| 13 | `npm test` lulus (+ test baru), lint 0, build exit 0 | Terminal |

---

## 14. Risiko & Catatan

| # | Risiko | Mitigasi |
|---|---|---|
| R1 | **Godaan mengubah `:root`** → ciri khas lama hilang | **Aturan keras §0: `:root` beku.** Uji `git diff src/index.css` grep `:root` di T12 |
| R2 | Shōwa terasa "cuma base dikasih nama" (era yang lupa didesain) | **Ornamen + cinematic + nama = bukti kesengajaan.** Itu bukan hiasan; itu tesis |
| R3 | Kontras 4 era bisa "bertabrakan" di komponen bersama | Uji **8 kombinasi** (4 era × terang/gelap) di T8/T12 |
| R4 | Brutalism ≠ poster: "beton" gampang jadi "poster Swiss abu" | Token `--concrete-val` + tekstur 打ちっぱなし + **massa** (bukan cuma warna abu) |
| R5 | Motif 太陽の塔 / 東京タワー bisa terasa berat digambar | SVG sederhana, siluet + grid; data-driven, tiap perhentian = data |
| R6 | ガチャガチャ butuh aset kapsul baru | Fallback ke pola `meijiCopy.js` dulu |
| R7 | Voice Nacht belum ada | Kerjakan terakhir (T11); tema jalan tanpa voice |
| R8 | 蛍の光 berkonotasi perpisahan | **Justru itu** — dipakai di momen lulus (perpisahan dengan era) |

---

## 15. Yang TIDAK termasuk PRD ini

- **Mengubah base `:root`** — DILARANG (§0).
- Era lain (Anime Multiverse, Cyberpunk) — PRD terpisah.
- Implementasi kode (dokumen ini SPEC; eksekusi di terminal).
- Cerita/naratif utama — lihat `docs/story.md` §6–7.
- Voice & naskah final cinematic — mengikuti pola `docs/voice-cinematic-edo.md`.
- **Keputusan terbuka:** motion final (base snap `200ms` vs lebih berat), jenis ujian checkpoint (pakai N5 exam apa adanya?).
- **Keputusan TERKUNCI (§6):** ornamen = **電柱＋架線** (kinetik) + **看板 商店街** (panel) + **東京タワー** (hero) + **首都高** (divider) + **打ちっぱなし/団地** (tekstur). 太陽の塔 = motif 万博 saja; Gōjira dilarang (IP).

---

## 16. Isi ガチャガチャ (Gacha) — barang Shōwa

| Item | Kanji | Rarity | Efek |
|---|---|---|---|
| Koin yen | 円 | ★ | mata uang |
| Bohlam | 電球 | ★ | hiasan (cahaya) |
| Kapsul gacha | ガチャ | ★ | ikon gacha |
| TV hitam-putih | 白黒テレビ | ★★ | simbol 電化 |
| Kipas angin | 扇風機 | ★★ | hiasan rumah |
| Radio | ラジオ | ★★ | pemutar lagu era |
| Sepeda | 自転車 | ★★ | ikon "perjalanan" |
| Mesin cuci | 洗濯機 | ★★★ | simbol 三種の神器 |
| Kulkas | 冷蔵庫 | ★★★ | simbol 三種の神器 |
| **模型の塔** | 太陽の塔 | ★★★★ | item 万博 — puncak |
| **「???」 (out-of-place)** | ??? | ★★★★ | **item "aneh" = petunjuk cerita** — barang yang belum seharusnya ada di Shōwa |

> **Item langka out-of-place** menyambung benang Nacht/Saku (pola sama Meiji §16). Di Shōwa, penyamaran mereka **mulai retak** — lihat §18.

---

## 17. Karakter & NPC

| NPC | Kanji | Peran |
|---|---|---|
| Pedagang 闇市 | 闇市の商人 | pemberi misi harian |
| Ibu rumah tangga 団地 | 団地の主婦 | konteks keluarga/kosakata |
| Buruh bangunan | 作業員 | tema "membangun" |
| Kondektur 新幹線 | 車掌 | pemandu antar-perhentian |
| Guru ujian | 先生 | pemberi soal (menuju N5) |

> NPC bisa jadi **avatar pemberi misi** (mengganti panel teks), pola quest yang sudah ada.

---

## 18. Beat cerita — penyamaran yang retak

> Dari `docs/story.md` §4: Nacht & Saku = **AI dari Cyberpunk** yang menyamar jadi roh kuno.
> **Meiji = era di mana penyamaran mereka "berhasil".** **Shōwa = era di mana ia mulai RETAK.**

Di Meiji mereka terlihat "terlalu tahu". Di Shōwa, dunia mulai **menyerupai asal mereka** (kota beton, listrik, TV, mesin) — dan itu **berbahaya**: mereka jadi terlalu nyaman, terlalu "di rumah".

- **Petunjuk menumpuk:** Nacht paham mesin sebelum orang lain; Saku menyebut *「…これ、知ってる。」* (\"…ini, aku tahu.\") saat melihat sesuatu yang baru.
- **Ancaman bergeser:** dari \"terlalu tahu\" → **\"kelihatan seperti pulang\"**. Saku pernah bergumam *「…昔、ここに高いたてものがあった。」* lalu menutup mulut (echo `story.md` §6).
- **Misteri 絵巻:** jejak data yang **bukan milik pemain** makin sering → pemain ngerasa **bukan pembaca pertama** (menyambung dua sarjana yang mati sebelum tuntas).

> **Ini benang yang menembus SELURUH era Shōwa** — bukan perhentian, tapi lapisan di belakangnya. Puncak sebelum twist Cyberpunk (Lv 300).

---

## 19. Sisi gelap — 「灰の中の声」

Shōwa bukan cuma "keajaiban ekonomi". Harga yang dibayar disajikan datar, **tanpa drama** (pola Meiji §19). Aturan nada: **「記録は叫ばない」** — catatan tidak berteriak.

| Tahun | Peristiwa | Kanji |
|---|---|---|
| 1945 | Bom atom, kekalahan, pendudukan | 終戦 |
| 1945–50 | 闇市, kelaparan, kehilangan | 焼け跡 |
| 1954 | Uji coba nuklir, kapal nelayan terkena | 第五福竜丸 |
| 1960 | Demonstrasi Anpo, bentrokan | 安保闘争 |
| 1960s | Polusi industri, penyakit Minamata | 公害 |
| 1968–70 | Gerakan mahasiswa, bentrokan kampus | 全共闘 |

> Contoh baris (datar): *「灰の中で、人が生きている。」* (\"Di dalam abu, orang hidup.\") Titik. Selesai.
> Ini yang bikin Shōwa **bukan nostalgia naif** — ada bobotnya. Kontras dengan kayōkyoku hangat = tension utama tema.

---

## 20. Identitas suara

| Elemen | Usulan |
|---|---|
| **蛍の光 (Hotaru no Hikari)** | lagu kelulusan Shōwa — dimainkan saat **checkpoint 卒業**. Konotasi perpisahan → merinding (echo Meiji §20) |
| **歌謡曲 kayōkyoku** | BGM tema — hangat & nostalgia di atas drone beton (§9) |
| **Diegetik** | item **ラジオ** memutar musik era di profil |
| **SFX** | 新幹線 whistle · チャイム sekolah · cicada 蝉 · ガチャガチャ kapsul |

---

## 21. 復興と影 — Shōwa = era dengan DUA wajah

Heian & Edo = satu budaya. Meiji = tumbukan Jepang×Barat. **Shōwa = tumbukan HARAPAN×TRAUMA.** Prinsip: **"Shōwa = beton di atas abu."**

Setiap perhentian punya **rasio 光 (terang/harapan) / 影 (gelap/trauma)** — sehingga tiap halaman terasa beda **tanpa ganti warna**:

| Perhentian | 光 | 影 | Efek |
|---|---|---|---|
| 焼け跡 | 10% | 90% | **paling gelap** |
| 闇市 | 40% | 60% | bertahan |
| 団地 | 70% | 30% | rumah baru |
| 東京タワー | 85% | 15% | **paling terang** |
| 新幹線 | 75% | 25% | cepat |
| オリンピック | 80% | 20% | bangga |
| 万博 | 60% | 40% | masa depan (tapi aneh) |
| 卒業 | 65% | 35% | lulus, tapi berpisah |

> Data & fungsi murni → pola `meiji-mekanik.md` M2 (`waYoFor`/`waYoMix`) → untuk Shōwa: `koKageFor`/`koKageMix`.

---

## 22. Ringkasan Satu Layar

> **昭和 = コンクリートの時代.** Kota yang dicor ulang dari abu.
> Heian menulis dengan **kuas** · Edo mencetak **blok kayu** · Meiji menyusun **huruf logam** · Shōwa menuang **beton**.
> **Shōwa = tema ASLI app ini** — bukan tema baru. Ia **memformalkan base** yang sudah ada (§0).
> コンクリ灰 `#8c8c85` (primer) · ナトリウム灯 `#d9a441` (aksen) · 墨 `#1a1a1a` (=base).
> Garis `4px` · shadow keras `4px 4px 0 0` **KEMBALI** · radius `0px` · grain beton · gerak `200ms` (=base).
> Font: Noto Serif JP 900 (display) · Inter 900 (papan) · Shippori Mincho (kanji). **Nol font baru.**
> Uang **円 en** · gacha **ガチャガチャ** · checkpoint **卒業 (ujian N5)** · dark mode **夜の団地**.
> **8 perhentian:** 焼け跡 → 闇市 → 団地 → 東京タワー → 新幹線 → オリンピック → 万博 → 卒業.
> Fokus bahasa **ujian N5 (semua)** · narator **Nacht** · gerbang **Lv 100 — pulang ke bahasa asli app.**
> **ATURAN #0: `:root` BEKU.** Ciri khas lama dilestarikan dengan MENAMAI, bukan MENGGANTI.
