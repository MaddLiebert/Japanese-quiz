# PRD — Tema Era: **ANIME MULTIVERSE 多元** (Tema #5 dari 6)

**Versi:** v0.1 · **Dibuat:** 2026-10-10
**Status:** SPEC — belum diimplementasikan
**Induk:** sistem "Tema Era" (lihat `docs/tema/heian.md` §13)
**Target implementasi:** terminal baru (task T0–T14 di §12)
**Prasyarat:** `src/features/theme/eras.js` sudah memuat `{ id:'anime', kanji:'多元', name:'Anime Multiverse', minLevel:150 }` ✅ (sudah ada, baris 8).
**Tema sebelumnya:** Heian 平安 (Lv 1, ✅ LIVE) → Edo 江戸 (Lv 20, ✅ LIVE) → Meiji 明治 (Lv 50, ✅ LIVE) → Shōwa 昭和 (Lv 100, ✅ LIVE).
**Tema berikutnya:** Cyberpunk 電脳 (Lv 300) — **rumah Nacht & Saku**, penutup cerita.
**Papan visual:** `docs/tema/_board-anime.html` ✅ (mockup hidup — buka via static server).
**Spec mekanik:** `docs/tema/anime-mekanik.md` ✅ (sistem kode A1–A16 — modul murni + test).

---

## 0. PRINSIP #0 — 「時代ではなく、世界。」 BUKAN ERA, TAPI DUNIA *(baca ini dulu)*

> **Lima era pertama adalah satu garis waktu. 多元 adalah garis waktu yang PECAH jadi banyak dunia.**

Heian → Edo → Meiji → Shōwa = **satu timeline**, satu 絵巻 yang halamannya berurutan. Pemain membalik halaman → pindah zaman. **Satu dunia per halaman.**

**多元 melanggar aturan itu — dan itu intinya.** Di Lv 150, 絵巻 berhenti membuka *zaman* dan mulai membuka **世界 (dunia)** yang **tidak pernah ada di sejarah**. Inilah kenapa era ini bukan "era" seperti yang lain:

```
LAPIS 1 — ERA         gerbang: LEVEL     →  Heian … Shōwa → 【多元】 → Cyberpunk
LAPIS 2 — FRANCHISE   gerbang: BELI      →  「星の旅人」「影の忍者」… (dunia yang dibeli)
LAPIS 3 — KARAKTER    gerbang: GACHA     →  tokoh per dunia (voice + efek + 必殺技)
```

> **Keputusan TERKUNCI (dari `heian.md` §13):** tema visual 多元 = **「canvas kosong」→ franchise**.
> Artinya: **dasar 多元 = halaman kosong** (kertas manga putih + grid panel). Tiap franchise yang **dibeli** melukis satu **dunia** ke atas kanvas itu. Tanpa franchise → tetap kanvas kosong, bukan tema lain.

### Konsekuensi arsitektur (beda dari semua era sebelumnya)

| Era | Sifat | Model data |
|---|---|---|
| Heian–Shōwa | **1 era = 1 dunia** (palet + motif + nama tetap) | statis |
| **多元** | **1 era = KANVAS** + N dunia opsional | **era → franchise → karakter** (3 lapis) |

Ini berarti 多元 **tidak cukup** punya satu blok `[data-era="anime"]`. Ia butuh:
1. `[data-era="anime"]` → **kanvas kosong** (dasar, selalu ada).
2. `[data-franchise="…"]` → **overlay dunia** di atas kanvas (muncul hanya jika franchise dimiliki).
3. `[data-character="…"]` → **aksen tokoh** (muncul hanya jika karakter di-gacha).

> **Analogi:** Shōwa = rumah yang sudah berdiri (base `:root`). **多元 = galeri kosong** dengan dinding putih; setiap franchise = **lukisan** yang digantung pemain. Era lain *mengganti* wajah app; 多元 *menyediakan tempat* untuk banyak wajah.

**Konsekuensi desain:** 多元 harus tetap **terlihat sengaja** walau kosong. Maka kanvas kosongnya **bukan** abu-abu malas — ia **halaman manga putih** yang hidup: grid panel, nomor halaman, balon kosong 「（　　）」, satu judul 多元. Pemain yang belum beli apa pun tetap merasa "ini memang dunia komik", bukan "tema yang lupa didesain".

---

## 1. Ringkasan

Tema **Anime Multiverse** adalah tema era kelima (**gerbang Lv 150**). Ia mengubah wajah aplikasi dari bahasa visual **kota beton pasca-perang Shōwa** (massa, bayangan keras, abu) menjadi bahasa visual **halaman manga yang menembus banyak dunia**: **garis tinta tebal, warna sel datar (cel-shade), titik screentone, garis kecepatan, dan オノマトペ (bunyi kata).**

> **Tesis desain (satu kalimat):**
> **「多元 = 世界が増える時代」** — *多元 = zaman saat dunia bertambah.*
> **Bukan satu kota; banyak dunia di atas satu halaman.**

Tesis visualnya adalah **pecah**. Heian menulis dengan **kuas** → Edo mencetak **satu blok kayu** → Meiji menyusun **huruf logam** → Shōwa menuang **beton** → **多元 membalik halaman ke dunia yang tidak ada**. Setiap era sebelumnya memindahkan *cara kata dibuat*; 多元 memindahkan *berapa banyak dunia bisa ditampung satu halaman*.

**Kebetulan yang menjadi tulang punggung:** fokus bahasa 多元 = **budaya pop** (`story.md` §6 Babak 2: 「多元 Anime — budaya pop」). Budaya pop Jepang = **register bahasa yang benar-benar berbeda**: オノマトペ (ドキドキ・キラキラ), 若者言葉 (スラング), ネット用語, オタク用語 (推し・沼・尊い), セリフ (dialog タメ口 vs 敬語), dan カタカナ loanwords. Maka bentuk (halaman manga) dan isi belajar (bahasa pop) menjadi **satu benda yang sama**. Ini bukan tempelan — ini inti tema.

> **Catatan penting (beda dari PRD lain):** era lain **mengganti** wajah app. 多元 **menyediakan kanvas** + sistem **franchise/karakter** (Lapis 2 & 3) yang butuh state tersimpan (`ownedFranchises`, `ownedCharacters`). Bagian yang benar-benar BARU = **kanvas + 3 lapis + gacha koleksi**. Lihat §0 dan §11.

---

## 2. Kenapa 多元 (dasar budaya)

Era ini **tidak** berpijak pada satu periode sejarah (seperti Heian/Edo/Meiji/Shōwa). Ia berpijak pada **lapisan budaya pop Jepang** — sesuatu yang nyata, tapi tak bertanggal.

| Fakta | Implikasi desain |
|---|---|
| **漫画 manga & アニメ anime** = bahasa visual global Jepang | Bahasa bentuk = **halaman komik**: outline tebal, cel-shade, panel. |
| **セル画 cel animation** = warna datar + garis tegas (bukan gradien) | Token bentuk = **cel-shadow 2-tone**, radius membulat, outline tebal. |
| **スクリーントーン screentone** (titik halftone di manga) | Tekstur = bintik screentone di atas blok warna. |
| **集中線 & ベタフラッシュ** (garis kecepatan & kilat hitam-putih) | Momen = *impact frame*: garis radial + kedip penuh 1 frame. |
| **オノマトペ** (ドキドキ, キラキラ, ゴゴゴ, バン) | Ornamen + mekanik: bunyi kata jadi elemen visual & soal. |
| **アニソン · シティポップ · ゲーム音楽** | BGM = city-pop hangat + pluck chiptune 8-bit (banyak "genre" = multiverse). |
| **声優 seiyuu · 推し · 沼 · 尊い** (budaya penggemar) | Nama UI: 推し (favorit), デイリー, 名刺. |
| **コミケ · 文化祭 · コスプレ · 物販** | Venue gacha & shop = festival konvensi. |
| **異世界 isekai · 転生 tensei** (trope dunia paralel) | Kerangka naratif 8 perhentian = 8 "dunia"/genre. |
| **ガチャ (arcade) · クレーンゲーム · カプセルトイ** | Mekanik koleksi = crane game + capsule. |

> **Catatan kejujuran desain:** ini era **satu-satunya yang bukan sejarah**. Karena itu ia juga **satu-satunya yang isinya ditentukan pemain** (franchise/karakter). Era ini = **kebebasan** — hadiah setelah 4 era "belajar zaman".

---

## 3. Kontras: Shōwa vs 多元 vs Cyberpunk

Lima era = lima cara kata "menjadi benda". 多元 harus terasa sebagai **pecah** — bukan "Shōwa diberi warna", bukan "Cyberpunk yang belum jadi".

| Aspek | **Heian** | **Edo** | **Meiji** | **Shōwa** | **多元** | **Cyberpunk** |
|---|---|---|---|---|---|---|
| Garis tepi | tipis `1px` | ukir `2px` | hairline + aturan ganda | tebal `4px` | **outline tinta `3px`** | neon glow |
| Bayangan | lembut blur | keras `3px` | **tidak ada** | keras `4px` hitam | **cel 2-tone BERWARNA** | glow/bloom |
| Sudut | `10px` | `4px` | `0px` | `0px` | **`6px` (kartun)** | `0px`/cut |
| Rasa | halus, kabut | tegas, cetak | presisi, mekanis | berat, monumental | **cerah, hidup, ramai** | gelap, digital |
| Metafora | sutra & kertas | kayu cetak | huruf logam | beton & bayangan | **halaman manga & sel** | neon & glitch |
| Gerak | mengapung `600ms` | gesit `240ms` | linear `180ms` | berat `200ms` | **snap `140ms` + impact** | glitchy |
| Warna primer | 紫 murasaki | 藍 ai | 煉瓦 renga | コンクリ灰 | **空 sora `#3a8dde`** | neon |
| Motif | awan + maple | 青海波 + 花火 | 唐草 + 歯車 | 電柱 + 団地 | **panel + screentone + オノマトペ** | grid + glitch |
| Sosok | bangsawan | chōnin | murid/teknokrat | orang biasa | **tokoh fiksi, 推し, 声優** | AI (Nacht/Saku) |
| Bahasa | kana | kanji + furigana | grammar + reading | ujian N5 | **budaya pop (register baru)** | endgame |
| Mata uang | 文 mon | 両 ryō | 円 en | 円 en | **コイン coin (arcade)** | — |
| Bentuk era | 1 dunia | 1 dunia | 1 dunia | 1 dunia | **KANVAS + N dunia** | 1 dunia |

> **Keputusan terkunci:** 多元 **punya bayangan** — tapi **cel-shadow berwarna**, bukan hitam keras (itu bahasa Shōwa). Kontras Shōwa→多元 = **abu → warna**, **berat → cerah**, **satu kota → banyak dunia**.
> **Koreksi penting:** 多元 **bukan** "Shōwa dengan warna-warni". Kalau hanya warna diganti, bentuknya salah. Tanda tangan 多元 = **outline + screentone + panel + impact frame** (§4, §6).

---

## 4. Design Tokens

### 4.1 Arsitektur token (3 lapis × 3 level tema)

Mengikuti 3 lapis Heian/Edo/Meiji/Shōwa (`docs/tema/heian.md` §4.1), **plus dua level tema baru** (franchise & karakter):

```
LAPIS 0  base :root              bentuk+DNA Shōwa          ← BEKU (tidak diubah)
LAPIS 1  [data-era="anime"]      KANVAS KOSONG (dasar)      ← selalu ada
LAPIS 2  [data-franchise="…"]    OVERLAY dunia              ← muncul jika franchise dimiliki
LAPIS 2b [data-franchise-nuance="…"]  NUANSA dunia         ← suasana khas dunia (mis. 呪力)
LAPIS 3  [data-character="…"]    AKSEN tokoh                ← muncul jika karakter di-gacha
```

Selektor: `[data-era="anime"]` (terang) · `.dark[data-era="anime"]`, `[data-theme="dark"][data-era="anime"]` (gelap) · `.anime-fr-<id>` untuk overlay franchise.

> **⚠️ Keputusan kunci:** **level tema (franchise/karakter) = atribut di `<html>`**, sama seperti `data-era`. Menambah franchise **tidak** menulis CSS baru per-franchise di `index.css` — cukup **satu token set** `--fr-1`/`--fr-2` yang **diisi dari data** franchise (`franchises.js`). CSS hanya tahu *peran* (`--fr-1` = warna dunia), bukan *identitas*.

> **Nuansa dunia (LAPIS 2b):** selain *warna* (`--fr-1`/`--fr-2`), sebuah dunia boleh punya **`nuance`** (mis. JJK → `'cursed'` 呪力) yang mengubah **SUASANA** kanvas: screentone lebih rapat (arsir horor) + tinta lebih pekat + panel lebih rapat. Atribut `data-franchise-nuance` **data-driven** dari `franchises.js` (`franchiseNuance(id)`); CSS hanya punya satu blok `[data-franchise-nuance="cursed"]`. Nuansa mengubah **suasana, bukan bentuk** — outline/cel/radius/motion tetap milik era. Dunia tanpa `nuance` → kanvas default. **Nol nama IP di CSS** (dijaga `animeTheme.test.js` §6.4).
>
> **⚠️ Nuansa = KEPADATAN TINTA, bukan stiker.** Percobaan awal menempel **ornamen tempelan** (segel 呪 + cincin di hero) → ditolak pemilik ("jelek… jangan AI slop"): ornamen numpuk di atas judul 基礎 dan terlihat ngawur. Aturan: nuansa dunia **tidak** menambah elemen tempelan di hero; ia hanya menyetel token (tone/tinta/gutter) + judul mesin gacha (`CLAW_NUANCE`). Efek "nyala" JJK hidup di **jawaban kuis** (lihat §8), bukan ornamen.

### 4.2 Warna — 多元 KANVAS (terang / 「白紙の頁」 hakushi no peiji)

```css
[data-era="anime"] {
  /* ── Kanvas kosong: kertas manga ── */
  --kinari-val:   #fdfcf8;  /* 白紙 shiro — halaman manga (lebih putih dari semua era) */
  --sumi-val:     #171a22;  /* 墨 sumi — garis tinta manga (outline) */
  --backdrop-val: #e9eef6;  /* latar luar — meja studio biru pucat */

  /* ── Palet pop (PRIMER + AKSEN kanvas) ── */
  --sora-val:     #3a8dde;  /* 空 sora — langit anime (PRIMER) */
  --sakura-val:   #f18bb0;  /* 桜 sakura — merah muda (AKSEN) */
  --daidai-val:   #f2872e;  /* 橙 daidai — oranye */
  --matcha-val:   #6cae54;  /* 抹茶 matcha — hijau */
  --kin-val:      #e8b84b;  /* 金 kin — emas (segel 極/印) */

  /* ── Warna netral pendukung ── */
  --nezumi-val:   #6b7280;  /* 鼠 nezumi — abu teks sekunder */
  --tone-val:     #c9d2e0;  /* screentone — bintik halftone */
}
```

> **Catatan token baru:** `--sora-val` (primer) + `--sakura-val` (aksen) + `--daidai-val` + `--matcha-val` + `--tone-val` = token **baru** milik 多元. `--sumi-val` = **tinta manga** (hampir hitam tapi kebiruan, beda dari Shōwa `#1a1a1a` netral).

### 4.3 Warna — 多元 (gelap / 「深夜アニメ」 shinya anime — anime tengah malam)

```css
.dark[data-era="anime"], [data-theme="dark"][data-era="anime"] {
  --kinari-val:   #101219;  /* halaman malam */
  --sumi-val:     #f3f4f8;  /* tinta jadi putih (garis terang) */
  --backdrop-val: #06070c;

  --sora-val:     #5fa9f2;  /* langit malam menyala */
  --sakura-val:   #ff9dc6;
  --daidai-val:   #ff9a44;
  --matcha-val:   #86c96a;
  --kin-val:      #f0c862;

  --nezumi-val:   #a7b0c0;
  --tone-val:     #2a3143;
}
```

> **Vibe gelap = 「深夜アニメ」:** ruang gelap + cahaya monitor/TV menyala + 応援ペンライト (light stick) warna-warni. **Bukan** 夜の団地 (Shōwa), **bukan** 瓦斯灯の夜 (Meiji), **bukan** istana malam (Heian). Ini **bioskop/ruang tonton**, bukan kota.

### 4.4 Token bentuk — 多元 (BARU: cel-shade / manga)

```css
[data-era="anime"] {
  --era-shadow:       5px 5px 0 0 var(--sora-val);   /* ⭐ cel-shadow BERWARNA (2-tone), bukan hitam */
  --era-shadow-hover: 7px 7px 0 0 var(--sora-val);
  --era-edge-w:       3px;                            /* outline tinta tebal (manga panel) */
  --era-edge-color:   var(--sumi-val);
  --era-radius:       6px;                            /* agak membulat (kartun) */
  --era-radius-sm:    4px;
  --era-radius-xs:    2px;
  --era-radius-pill:  9999px;                         /* pill tetap pill */
  --era-motion:       140ms;                          /* snap (impact frame) — paling cepat dari semua era */
  --era-ease:         cubic-bezier(0.2, 0, 0, 1);
  --era-tone:         radial-gradient(var(--tone-val) 1px, transparent 1.2px); /* screentone */
  --era-tone-size:    5px 5px;
}
```

> **⚠️ Inilah tanda tangan 多元:** bayangan **berwarna** (`--sora-val`), bukan hitam. Ini yang membuat kartu terasa **sel animasi 2-tone**, bukan poster beton. Semua warna bisa diganti oleh franchise (`--fr-1`), tapi **struktur** (outline + cel-shadow + screentone) tetap — itu identitas era.

### 4.5 Overlay FRANCHISE (Lapis 2 — contoh: 「機神」 mecha)

```css
/* Overlay dunia — hanya aktif bila franchise dimiliki (atribut data-franchise). */
[data-era="anime"][data-franchise="kishin"] {
  --fr-1: #b23a3a;   /* warna dunia 1 (primer franchise) */
  --fr-2: #f0c862;   /* warna dunia 2 (aksen franchise) */
  --fr-motif: 'kishin';   /* nama motif latar (lihat §6) */
  /* Kanvas menimpa primer dengan warna dunia: */
  --sora-val:   var(--fr-1);
  --sakura-val: var(--fr-2);
  --era-shadow: 5px 5px 0 0 var(--fr-1);
}
```

> **Aturan:** franchise **menimpa warna & motif**, **tidak menimpa bentuk** (outline/cel/radius/motion tetap milik era). Jadi semua dunia terasa "satu aplikasi", walau warnanya beda-beda. Ini menjaga konsistensi lintas-dunia.

### 4.6 Pemetaan nilai (referensi cepat)

| Token | Heian | Edo | Meiji | Shōwa | **多元** | Nama tradisional |
|---|---|---|---|---|---|---|
| `--kinari-val` | `#f6f1e4` | `#f4ecd8` | `#f4f1e8` | `#f3f0e8` | **`#fdfcf8`** | 白紙 shiro (BARU) |
| `--sumi-val` | `#3a332b` | `#1c1b1a` | `#141414` | `#1a1a1a` | **`#171a22`** | 墨 sumi (kebiruan) |
| `--sora-val` | — | — | — | — | **`#3a8dde`** | 空 sora (BARU, PRIMER) |
| `--sakura-val` | — | — | — | — | **`#f18bb0`** | 桜 sakura (BARU, AKSEN) |
| `--shu-val` | `#b83b4a` | `#c0392b` | `#b8352c` | `#d3382f` | — | (digantikan sakura) |
| `--era-shadow` | berlapis blur | `3px 3px 0 0` | `none` | `4px 4px 0 0` hitam | **`5px 5px 0 0` BERWARNA** | cel 2-tone (BARU) |

---

## 5. Tipografi

Heian = tulis tangan (Klee One). Edo = serif ukiran (Shippori Mincho B1). Meiji = 明朝体 + serif Victoria. Shōwa = grotesk tebal (Inter 900) + 明朝. 多元 = **judul ala judul anime (太字 + miring) + teks isi manga (明朝/gothic bulat)**.

| Peran | Font | Sumber | Alasan |
|---|---|---|---|
| **Judul hero / judul episode** | **Noto Serif JP 900** *(sudah dimuat)* | Google Fonts | blok tebal ala 題字 judul anime |
| **Label / オノマトペ / angka** | **Inter 900 italic** *(sudah dimuat)* | Google Fonts | impact frame, bunyi kata miring, angka 戦闘力 |
| **Kanji / body / セリフ** | **Shippori Mincho** *(sudah dimuat)* | Google Fonts | konsisten era sebelumnya (dialog manga) |
| **UI / tombol** | **Inter** *(tetap)* | Google Fonts | keterbacaan |

**Aturan pakai:**
- `.font-display` → judul hero, judul dunia, nama perhentian.
- `.font-sans` (Inter) **900 italic** → **オノマトペ** (バン！ドキドキ) & angka 戦闘力 — beda dari era lain yang pakai Inter tegak.
- `.font-serif` → kanji, セリフ, teks panjang.

> **Tidak ada font baru.** 多元 cukup pakai yang sudah dimuat. Beban nol. Font yang ada **dipakai miring & tebal** untuk rasa "judul episode / impact frame".

---

## 6. Motif & Ornamen

### 6.1 Pola ornamen app (WAJIB diikuti — konsistensi dengan Edo/Meiji/Shōwa)

Setiap era punya **2 ornamen** dengan pembagian yang selalu sama. 多元 **wajib** mengikuti pola ini:

| | Ornamen 1 — **KINETIK** | Ornamen 2 — **PANEL** |
|---|---|---|
| Sifat | benda gantung, **berayun ikut scroll** | benda datar, **statis**, ber-kanji |
| Teknik | `useScroll` → `useVelocity` → `useSpring` → `useTransform` (rotasi kecil di titik gantung) | SVG statis |
| Edo | **提灯** lentera (ayun 11°) | **暖簾** tirai `江戸市` |
| Meiji | **瓦斯灯** lampu gas (ayun 6°) | **文選** rak huruf `明治活字` |
| Shōwa | **電柱＋架線** kabel (ayun berat) | **看板 商店街** |
| **多元** | **フィルム＋セル画** (film strip + cel) berayun | **コマ割り 題字** `多元` |

**Aturan teknis (dari `ShowaOrnament.jsx`):**
- SVG React, `role="presentation"`, `aria-hidden="true"`, `pointer-events:none` (murni dekoratif).
- **Gate CSS**: `.anime-ornament` → `display:none` di era lain (hanya tampil saat `[data-era="anime"]`).
- **Dua state**: siang cerah / malam menyala (`.dark[data-era="anime"]`).
- `prefers-reduced-motion: reduce` → gerak dimatikan (hook `usePrefersReducedMotion`).
- File: **`src/components/AnimeOrnament.jsx`** (export `AnimeFilm` + `AnimePanel`).

### 6.2 Daftar lengkap motif & ornamen

| # | Motif | Kanji | Jenis | Peran | Kelas CSS |
|---|---|---|---|---|---|
| 1 | **フィルム＋セル画** | firumu | **kinetik** | strip film + 1 sel yang berayun ikut scroll | `.anime-film` |
| 2 | **コマ割り題字** | komawari | **panel** | grid panel + kanji `多元` + balon kosong | `.anime-panel` |
| 3 | **多世界の扉** | tagen no tobira | hero | gerbang dari panel bertumpuk (tiap panel = 1 dunia) | `.anime-gate` |
| 4 | **集中線** | shūchūsen | aksen | garis radial di belakang elemen fokus | `.anime-burst` |
| 5 | **スクリーントーン** | — | tekstur | bintik halftone di atas blok warna | `.anime-tone` |
| 6 | **オノマトペ** | onomatope | tekstur teks | bunyi kata (バン！ドキドキ) di momen | `.anime-onoma` |
| 7 | **ベタフラッシュ** | beta furasshu | momen | kilat penuh 1 frame (putih/hitam) saat aksi | (scene, bukan ornamen) |

**Tekstur:** **screentone** (bintik halftone) di atas blok warna + **grain kertas manga** (warisan halftone Meiji, dipertahankan sebagai benang merah cetak).
**Cap:** **segel 極/印 merah** di sudut kartu/panel — tanda tangan visual (sama seperti Edo/Meiji/Shōwa, benang merah).

### 6.3 Detail tiap ornamen

**1. フィルム＋セル画 AnimeFilm — KINETIK (utama)**
> Analog 提灯 (Edo) / 瓦斯灯 (Meiji) / 電柱 (Shōwa) = **benda gantung yang berayun** — tapi medianya **film & sel animasi**: strip film panjang dengan kotak-kotak frame, 1 di antaranya sel berwarna.

- **Bentuk:** strip film vertikal (viewBox ±`0 0 64 170`) — deretan kotak frame + perforasi (lubang sproket) di tepi + **1 sel berwarna** (cel-shade) di tengah.
- **Gerak:** strip **bergoyang** ikut momentum scroll — ringan & **ceria** (paling cepat berayun dari semua ornamen): `{ stiffness: 180, damping: 16, mass: 1.2 }`, rotasi `≤ 7°` (提灯 11°, 瓦斯灯 6°, 電柱 4° → 多元 di tengah, "energik").
- **Siang:** sel berwarna penuh (`--sora-val`/`--fr-1`). **Malam** (`.dark[data-era="anime"]`): **monitor menyala** — sel bercahaya + perforasi jadi siluet terang di kegelapan.
- **Kelas:** `.anime-film` + `--anime-film-strip/--anime-film-cel/--anime-film-glow`

**2. コマ割り題字 AnimePanel — PANEL (utama)**
> Panel statis ber-kanji, sejajar 暖簾 (Edo) / 文選 (Meiji) / 看板 (Shōwa).

- **Bentuk:** **grid panel manga** (2–3 panel asimetris) + kanji besar **多元** + **balon kosong** 「（　）」 sebagai placeholder (kanvas menunggu diisi).
- **Gaya huruf:** **Inter 900 italic** (judul anime) — bukan serif ukir.
- **Warna:** dasar `--kinari-val` (putih), outline `--sumi-val`, aksen `--sora-val`.
- **Kelas:** `.anime-panel` + `--anime-panel-line/--anime-panel-text/--anime-panel-accent`

**3. 多世界の扉 AnimeGate — HERO**
> Ornamen besar berdiri di panel hero Home (bukan gantung) — **pintu menuju banyak dunia**.

- **Bentuk:** **gerbang dari beberapa panel bertumpuk** (seperti torii tapi dari bingkai komik), tiap panel menampilkan **siluet dunia** berbeda (gunung/robot/gedung/kota). Ini menandai "banyak dunia".
- **Peran:** berdiri di `.home-hero-bg` panel hero, sejajar `.showa-tower` / `.meiji-ornament` / `.edo-ornament`.
- **Kelas:** `.anime-gate` + `--anime-gate-frame/--anime-gate-world`

**4. 集中線 AnimeBurst — AKSEN**
> Garis radial (garis kecepatan manga) di belakang elemen fokus (jawaban benar, checkpoint, gacha reveal).

- Dipakai sebagai **pseudo-element** di belakang kartu/modal saat momen "wow". Muncul 1 frame + memudar.
- Menggantikan `.era-divider` 多元: satu garis **panel border** tebal.

**5. スクリーントーン + オノマトペ — TEKSTUR (CSS layer, bukan React)**
> Seperti `.era-grain` (Edo) / `.bg-halftone` (Meiji) / `.showa-concrete` (Shōwa) — bukan komponen.

- `.anime-tone` — bintik screentone (`--era-tone` radial-gradient) di atas blok warna.
- `.anime-onoma` — teks オノマトペ (バン！ドキドキ) yang muncul di momen (streak, lulus). `pointer-events:none`.
- Aktif hanya di `[data-era="anime"]` (day) + `.dark[data-era="anime"]` (night).

### 6.4 Catatan kode

- `src/index.css` sudah punya `.era-grain`, `.bg-halftone`, `.showa-concrete`. 多元 **menambah**: `.anime-tone`, `.anime-film`, `.anime-panel`, `.anime-gate`, `.anime-burst`, `.anime-onoma`. **Semua override di dalam `[data-era="anime"]`** supaya tak bocor ke era lain (jaring pengaman sama seperti Heian §7.2C).
- **Guard test** (pola `showaTheme.test.js`): `animeTheme.test.js` memastikan (a) tiap ornamen punya gate `.anime-*`, (b) ornamen **tidak** muncul di era lain, (c) token `--sora-val` ada di blok 多元, (d) **kanvas kosong tetap tampil tanpa franchise** (tidak jatuh ke base).

> **⚠️ HAK CIPTA — kebijakan (REVISI, keputusan pemilik proyek):**
> - **Dunia ORISINAL (tanpa flag `licensed`) = FIKTIF & ORISINAL** (`星の旅人`, `影の忍者`, `魔法学園`, `機神`, `妖奇譚`). **JANGAN** menamai/menyalin IP nyata ke sini. Aturan ini **tetap mengikat**.
> - **Dunia LISENSI (`licensed: true`) = BOLEH memakai IP nyata** (mis. JJK `呪術廻戦`), **ASAL WAJIB punya `credit`** (atribusi ke pemegang hak: `© 芥見下々 / 集英社・MAPPA`). **Kredit = mitigasi hak cipta** — ini yang menahan agar tidak "menyalin tanpa izin". Dijaga `validateFranchises` + test.
> - **Alasan revisi:** konten JJK (`pack_07`..`pack_14`) sudah lama ada di repo; pemilik proyek memutuskan menjadikannya **dunia lisensi resmi** di 多元 (payoff §11.2), bukan sekadar referensi. Belum dipublikasikan → aman; kredit disiapkan sejak awal.
> - **Dunia `status: 'soon'`** (One Piece, JoJo) = teaser: tampil di 物販 tapi **tidak bisa dibeli** & belum punya tokoh (`canBuyFranchise` → false).
> - **シルエット, bukan reproduksi:** motif dunia lisensi (`curse`/`anchor`) tetap digambar sebagai **siluet/bentuk generik** (bukan desain tokoh ikonik / logo resmi).
> - **Nama & kata umum aman:** 機神, 忍者, 魔法, 異世界, 青春 = kata generik/trope, bukan merek. Boleh.
> - Aturan ini **mengikat** semua task §12 (T3, T6, T7, T11).

---

## 7. Peta 多元 — 8 Perhentian

Rute naratif tema: tur **「8つの世界」** (8 dunia) — 絵巻 membuka dunia-dunia yang tak pernah ada di sejarah, satu per satu, menuju episode terakhir.

```
                    【開幕】← 絵巻の頁が裂ける (gerbang terbuka)
                         │
        ┌────┬────┼────┬────┐
     冒険  日常  青春  魔法   (dunia-dunia bermunculan)
        └────┴────┴────┴────┘
                         │
                    【怪談】← dunia paling gelap
                         │
                    【異世界】← dunia paling jauh
                         │
                    【最終回】← episode terakhir → gerbang naik era
```

| # | Perhentian | Kanji | Dunia / Genre | Pelajaran bahasa |
|---|---|---|---|---|
| 0 | Kaimaku | 開幕 | gerbang · halaman pecah | 挨拶 pop · seru 「やばい」「マジ」 |
| 1 | Bōken | 冒険 | petualangan (shōnen) | **オノマトペ** · ドキドキ・バン |
| 2 | Nichijō | 日常 | kehidupan sehari-hari (sekolah) | タメ口 vs 敬語 · 家族・友達 |
| 3 | Seishun | 青春 | olahraga/remaja | **若者言葉** · スラング |
| 4 | Mahō | 魔法 | fantasi/magic | **カタカナ loanwords** · 呪文 |
| 5 | Kaidan | 怪談 | horor/urban legend | 恐怖 vocab · 声の描写 |
| 6 | Isekai | 異世界 | dunia paralel | 敬語 fantasi · 冒険 vocab |
| 7 | Saishūkai | 最終回 | episode terakhir | **CHECKPOINT** (sintesis → naik era) |

### Detail tiap perhentian

**0. 開幕 Kaimaku — 頁が裂ける**
絵巻 tiba-tiba **berhenti** membuka zaman. Halaman berikutnya **robek** — dan di baliknya ada **banyak halaman sekaligus** (multiverse). Pelajari: 挨拶 gaya pop (やばい, マジ, すごい). Momen: Nacht/Saku terkejut — *「…ここは、時代じゃない。世界だ。」* ("…ini bukan zaman. Ini dunia.") Vibe: halaman putih pecah jadi panel-panel, cahaya keluar.

**1. 冒険 Bōken — 少年の世界**
Dunia petualangan (shōnen): pertarungan, teman, mimpi. Pelajari: **オノマトペ** (ドキドキ, ドカン, バン, キラキラ) — bunyi kata yang jadi jantung manga. Momen: *「ドキドキする…！」* Vibe: garis kecepatan, ledakan, langit biru terang.

**2. 日常 Nichijō — 学校の世界**
Dunia sehari-hari: sekolah, rumah, teman. **Di sini register bahasa paling berguna**: タメ口 (bahasa santai antar-teman) vs 敬語 (hormat). Pelajari: 家族 kazoku · 友達 tomodachi · タメ口/敬語. Momen: *「おはよー！」* vs *「おはようございます。」* Vibe: kelas, koridor, atap sekolah, sore.

**3. 青春 Seishun — 部活の世界**
Dunia olahraga/remaja: keringat, rival, kebersamaan. Pelajari: **若者言葉** (スラング muda: やばい, エモい, きゅん, ガチ). Momen: *「エモい…！」* Vibe: lapangan, matahari terbenam, sorak.

**4. 魔法 Mahō — 幻想の世界**
Dunia fantasi/magic: sihir, sekolah sihir, makhluk. Pelajari: **カタカナ loanwords** (マジック, ドラゴン, クリスタル) + 呪文 (mantra). Momen: *「魔法、かけてみて。」* Vibe: menara, kristal bercahaya, bintang.

**5. 怪談 Kaidan — 闇の世界**
Dunia horor/urban legend: hantu, kegelapan, bisikan. Pelajari: kosakata 恐怖 (takut), deskripsi suara (声). Momen: *「…だれか、いる。」* Vibe: gelap, satu lampu, bayangan, **深夜アニメ** (dark mode). Ini perhentian **paling gelap** (rasio 光/影, §21).

**6. 異世界 Isekai — 遠い世界**
Dunia paralel paling jauh: 転生 (reinkarnasi), dunia lain. Pelajari: 敬語 fantasi + kosakata petualangan lanjutan. Momen: *「ここは、別の世界。」* Vibe: portal, dunia aneh, langit dua bulan.

**7. 最終回 Saishūkai — 最後の頁**
Episode terakhir musim ini. **CHECKPOINT AKHIR** — sintesis semua register pop (オノマトペ + タメ口/敬語 + スラング + カタカナ). Lulus = **naik era → Cyberpunk (Lv 300)**. Momen: layar **「つづく」→「完」**, lalu pintu ke 電脳 terbuka. Vibe: episode terakhir, kredit berjalan, **寂しい** (sepi) — persis sebelum pulang. *「次は…最後の世界だ。」*

---

## 8. Penamaan (tema di dalam tema)

Mengikuti pola Heian/Edo/Meiji/Shōwa (`docs/tema/heian.md` §11). Tabel di `src/features/theme/eraNames.js`.

| Fungsi | Heian | Edo | Meiji | Shōwa | **多元** | Kanji | Alasan |
|---|---|---|---|---|---|---|---|
| Shop / Warung | 市 | 問屋 | 商店 | 商店街 | **物販 butsuhan** | 物販 | booth jual merch di konvensi |
| Gacha | 貝合わせ | 富くじ | 福引 | ガチャガチャ | **クレーンゲーム** | — | arcade UFO catcher |
| Mata uang | 文 | 両 | 円 | 円 | **コイン koin** | — | koin arcade |
| Inventory / Tas | 箪笥 | 風呂敷 | 鞄 | ランドセル | **リュック rikku** | — | ransel pop |
| Profil | 系図 | 人別帳 | 戸籍 | 履歴書 | **名刺 meishi** | 名刺 | kartu tukar ala 推し活 |
| Misi harian | 日課 | 奉公 | 課業 | 宿題 | **デイリー** | — | daily quest (bahasa game) |
| Peringkat | 位 | 番付 | 階級 | 偏差値 | **戦闘力 sentōryoku** | 戦闘力 | "power level" — trope anime |

> **Penting:** 多元 memakai **kanji + katakana + romaji** campur (persis bahasa pop). Pemain di Lv 150 sudah lewat N5. Gacha copy 多元 pakai katakana seperti `showaCopy.js`, plus **romaji** (lapisan belajar) seperti contoh `show aCopy.js` `titleSub`.
> **Bonus tema:** 戦闘力 (peringkat) mengikat trope anime "power level" — peringkat pemain = 戦闘力. デイリー & クレーンゲーム = bahasa game yang benar-benar dipakai pemain Jepang.

---

## 9. Audio

Mengikuti pola Heian/Edo/Meiji/Shōwa (`heian.md` §9): satu BGM per era + SFX per-interaksi. Titik tune tunggal di `src/utils/sfx.js` → `THEME_BGM_PLANS.anime`.

| Elemen | Usulan |
|---|---|
| BGM | **シティポップ city-pop** (bass funky, Rhodes hangat) + **アニソン** energy — **cerah & optimis**, bukan nostalgia (Shōwa) |
| Drone | bass **bergerak (groove)**, bukan berat statis (Shōwa) — ada "denyut" |
| Pluck/melodi | **chiptune 8-bit** (square wave) arpeggio — warna game/anime |
| SFX kota | peluit kereta (warisan), **アニメ効果音**: キラキラ, ドキドキ, バン, ジャジャーン |
| SFX gacha | **クレーンゲーム** (mesin arcade) + fanfare ガチャ |
| Mood | `gate` (開幕) · `adventure` (冒険) · `daily` (日常) · `youth` (青春) · `magic` (魔法) · `horror` (怪談) · `isekai` (異世界) · `finale` (最終回) |
| Momen | **impact frame** — SFX 「バン！」 + 1 frame kedip saat benar berturut |

```js
// src/utils/sfx.js — tambah ke THEME_BGM_PLANS
anime: {
  level: 0.13,
  fadeInMs: 900,        // masuk CEPAT (Shōwa 1600) — era paling gesit
  fadeOutMs: 700,
  drone: { freqs: [65.41, 130.81, 164.81], detune: [0, -4, 3], gain: 0.42 },  // bergerak, tidak berat
  pad:   { type: 'triangle', freqs: [261.63, 329.63, 440], filterHz: 1800, lfoHz: 0.16, lfoDepth: 220, gain: 0.26 },
  pluck: { type: 'square', notes: [523.25, 587.33, 659.25, 783.99, 880], everyMs: 900, dur: 0.7, gain: 0.14 }, // 8-bit arpeggio
},
```

> **Keputusan kunci:** 多元 = **cerah & energik** (city-pop + chiptune) — kontras dengan Shōwa yang **hangat & nostalgia** (kayōkyoku di atas beton). Meiji = mayor diatonik kaku; 多元 = mayor **bergroove + elektronik ringan**. Ini "generasi berikutnya" secara bunyi.

### 9.1 BGM NUANSA DUNIA (LAPIS 2b) — ambience khas dunia

Saat dunia aktif punya `nuance` (mis. JJK → `'cursed'`), BGM **bukan** chiptune generik — ia ambience khas dunia. Kunci efektif = `themeBgmKey(era, nuance)` → mis. `'anime-cursed'`. **Murni & data-driven** (`utils/sfx.js` `THEME_BGM_PLANS`), no-op di node.

| Aspek | Anime biasa (chiptune) | Dunia kutukan `'anime-cursed'` |
|---|---|---|
| Suasana | cerah, gesit | gelap, tegang, berat |
| Masuk | fadeIn 1400 ms | **fadeIn 1800 ms** (lambat & berat) |
| Pad | `square` 8-bit (C E G C) | `triangle` minor (A C D#), lowpass rapat |
| Petikan | arpeggio mayor cepat (1000 ms) | **sparse** (1700 ms) — seperti denyut 呪力 |

> **Prinsip:** nuansa dunia mengubah **bunyi & kepadatan tinta**, bukan menempel stiker. Dunia tanpa `nuance` → BGM era polos. Preferensi BGM tetap **default OFF** (`themeAudio`); ambience menyala hanya kalau user menyalakannya.

---

## 10. Cinematic Perkenalan

Mengikuti pola Heian/Edo/Meiji/Shōwa (`heian.md` §10): 60–90 detik, data-driven (`scenes.js`), diputar sekali, bisa di-skip. Narator = **Saku 咲** (selang-seling: Heian=Saku, Edo=Nacht, Meiji=Saku, Shōwa=Nacht, **多元=Saku**).

**Storyboard (5 babak):**

| # | Visual | Teks (JP / ID) | Audio |
|---|---|---|---|
| 1 | Halaman 絵巻 dibuka seperti biasa — lalu **SOBEK** *(tanpa teks)* | *(tanpa teks)* | kertas sobek, hening |
| 2 | Panel-panel keluar dari sobekan — **banyak dunia sekaligus** | **頁の向こうに、世界がある** / "Di balik halaman, ada dunia" | city-pop masuk, キラキラ |
| 3 | Montase dunia: 冒険 → 日常 → 青春 → 魔法 | **いくつもの物語** / "Banyak cerita" | medley, ドキドキ |
| 4 | 怪談 (gelap) → 異世界 (portal) → panel menyatu | **どの世界へ行く？** / "Mau ke dunia mana?" | hening, lalu portal |
| 5 | Semua panel menutup jadi satu 題字 + segel 極/印 | **多元 — 世界が増える** / "多元 — dunia bertambah" | fanfare, 「つづく」 |

**Spesifikasi:** **SVG/React** (BUKAN video) — mengikuti keputusan T11b Meiji & Shōwa. `anime/data/scenes.js` + `AnimeBackdrop.jsx` + `AnimeScenes.jsx` + `AnimeCinematic.jsx`. Reaktif ke waktu/mood/`prefers-reduced-motion`, tanpa beban MB.

**Voice (pola `docs/voice-cinematic-edo.md`):** narator **Saku**, 1 file `saku-anime.mp3` di-split jadi 7 klip (`01_tear` … `07_welcome`) di `public/voices/anime/`, sumber mentah di `voice-source/anime/`.

### Naskah + timing (usulan, 7 baris)

Scene 1 (`tear`, 9s) **TANPA teks** → tanpa voice. Scene start: tear 0 · burst 9 · montage 22 · worlds 38 · finale 54; total ~68s.

| # | scene/baris | Teks Jepang | Kana (ふりがな) | at | absolut |
|---|---|---|---|---|---|
| 1 | burst/world | 頁の向こうに、世界がある。 | ページの むこうに、せかいが ある。 | 0.6 | **9.6s** |
| 2 | burst/turn | ここは時代じゃない。世界だ。 | ここは じだいじゃない。せかいだ。 | 3.4 | **12.4s** |
| 3 | montage/stories | いくつもの物語が、待っている。 | いくつもの ものがたりが、まっている。 | 1.0 | **23.0s** |
| 4 | worlds/choose | どの世界へ、行く？ | どの せかいへ、いく？ | 0.8 | **38.8s** |
| 5 | finale/grow | 世界が、増えていく。 | せかいが、ふえていく。 | 0.6 | **54.6s** |
| 6 | finale/era | 多元 — 世界が増える | たげん — せかいが ふえる | 4.6 | **58.6s** |
| 7 | finale/welcome | ようこそ、多元へ。 | ようこそ、たげんへ。 | 6.8 | **61.4s** |

> Nama file hasil: `01_world.mp3` · `02_turn.mp3` · `03_stories.mp3` · `04_choose.mp3` · `05_grow.mp3` · `06_era.mp3` · `07_welcome.mp3`.

---

## 11. Arsitektur 3 Lapis + Koneksi ke Fitur App

### 11.1 Tiga lapis tema (inti era ini)

| Lapis | Gerbang | Isi | State | Contoh |
|---|---|---|---|---|
| **1 — ERA** | **LEVEL** (Lv 150) | kanvas kosong + register bahasa pop | `progress.era` (sudah ada) | 多元 |
| **2 — FRANCHISE** | **BELI di 物販** (shop) | satu **dunia** (palet + motif + 8 perhentian sendiri + gacha pool) | `progress.ownedFranchises[]` (BARU) | 機神, 星の旅人, **呪術廻戦** |
| **3 — KARAKTER** | **GACHA** (クレーンゲーム) | satu **tokoh** (voice + efek 必殺技) | `progress.ownedCharacters{}` (BARU) | (tokoh per franchise) |

> **Dua jenis dunia (LAPIS 2):** (a) **ORISINAL** — 5 dunia fiktif, harga 5–7k; (b) **LISENSI** — IP nyata (`licensed: true`), **tier harga dunia besar ~20k**, wajib `credit`, dan memuat **banyak karakter** (wadah banyak tokoh). Contoh live: **JJK `呪術廻戦`** (8 tokoh: Gojo/Yuji/Megumi/Nobara/Nanami/Toji/Yuta/Sukuna — memakai voice + efek `pack_07`..`pack_14` yang **sudah ada**). Dunia `status:'soon'` (One Piece, JoJo) = **teaser**: tampil, tak bisa dibeli.
> **Beli = AUTO-EQUIP:** dunia yang baru dibeli **langsung jadi dunia aktif** (kanvas langsung berubah warna) — bukan sekadar masuk koleksi.

> **Ini yang membedakan 多元 dari 5 era lain** — dan yang sudah ditanam di `heian.md` §13. Ia **membutuhkan state baru** di `ProgressContext` (2 array/objek) + **backend-less** (semua lokal, seperti `ownedPacks` sekarang).

### 11.2 Koneksi ke fitur yang SUDAH ADA

| Perhentian / Lapis | Fitur app | Bagaimana |
|---|---|---|
| Lapis 3 — KARAKTER | **Theme Pack** (`features/packs/`) | **Sudah ada!** `pack_07`..`pack_14` (JJK) = contoh karakter dengan voice + efek. 多元 = era yang **memberi rumah** untuk lapis ini. |
| Lapis 3 — efek | **Effects** (`features/effects/`) | Gojo/Yuji/Sukuna/Megumi/dst — `effectGate.js` gerbang senyap. Karakter 多元 pakai mesin yang sama. |
| Lapis 3 — voice | **Voices** (`features/audio/voices.js`) | Registry voice per pack (sudah generik). |
| Lapis 2 — BELI | **Shop 物販** (`features/shop/`) | `buyItem` + `GACHA_PRICE` — franchise = item mahal (bukan gacha). |
| Lapis 3 — GACHA | **Gacha クレーンゲーム** (`features/gacha/slot.js`) | Mesin slot per-era (Heian=kerang, Edo=木札). 多元 = **crane game** (kapsul/figur). |
| 最終回 | **Checkpoint** | `n5exam/` sudah dipakai Shōwa; 多元 = sintesis register pop → gerbang Lv 300. |
| 怪談 | **Dark mode 深夜アニメ** | toggle gelap = ruang tonton. |
| 冒険/日常/青春 | **Learn / Reading / Grammar** | register bahasa pop masuk sebagai materi. |
| Semua | **Codex つながり** (`features/codex/`) | benang lintas-era (灯り/道/銭/報) lanjut ke 多元. |
| GLITCH | **`features/glitch/glitch.js`** | kebocoran Cyberpunk **paling kuat** di sini (era terdekat rumah). |

> Koneksi ini **bukan tempelan**: karakter memang di-gacha, franchise memang dibeli, dan **app ini SUDAH punya konten anime** (JJK) yang selama ini "menggantung" tanpa era. 多元 = **payoff** dari kerja yang sudah ada.

---

## 12. Rencana Implementasi (T0–T14)

> Konvensi commit: `feat(theme):`, `fix(theme):`, `style(theme):`, `docs(theme):`.
> Setiap task: tulis test gagal → implementasi → test lulus → commit.
> **Aturan tambahan 多元: JANGAN sentuh `:root` (aturan §0 Shōwa tetap berlaku) + JANGAN tambah IP berhak cipta (§6.4).**

### T0 — Baseline ✅
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run lint 2>&1 | grep -ci error
git rev-parse --short HEAD
git diff --stat src/index.css | grep ':root' || echo "OK: :root tak disentuh"
```

### T1 — Nama UI 多元 ✅
Tambah blok `anime` ke `ERA_NAMES` di `src/features/theme/eraNames.js` (§8).
Test: `eraName('gacha','anime')` → `'クレーンゲーム'`; `eraName('rank','anime')` → `'戦闘力'`; era tak dikenal → fallback.

### T2 — Token CSS 多元 (kanvas kosong) ✅
Tambah blok `[data-era="anime"]` + `.dark[data-era="anime"]` di `src/index.css` (§4.2/4.3/4.4).
**Verifikasi:** grep `--era-shadow` di blok 多元 = `5px 5px 0 0 var(--sora-val)` (berwarna, bukan hitam). Pindahkan `'anime'` dari `BELUM` → `DIDESAIN` di `eraThemeCoverage.test.js`.
→ Selesai: blok 多元 + overlay `[data-franchise]` (Lapis 2) + guard `animeTheme.test.js`; `eraDarkMode.test.js` naik ke 5 era; `:root` tetap beku. **1238 pass.**

### T3 — Ornamen & tekstur
Tambah `.anime-tone`, `.anime-film`, `.anime-panel`, `.anime-gate`, `.anime-burst`, `.anime-onoma` di `index.css` + komponen `src/components/AnimeOrnament.jsx` (pola `ShowaOrnament.jsx`), gate `.anime-ornament`. **Aset orisinal** (§6.4).

### T4 — Tipografi
Pakai font yang sudah dimuat (Noto Serif JP 900 + Inter 900 italic). Tak ada font baru. Terapkan `.font-display` pada judul hero 多元.

### T5 — Cinematic 多元
Tambah entri ke `CINEMATICS` di `src/features/cinematic/cinematics.js`:
```js
anime: { id: 'anime', era: 'anime', kind: 'history', title: '多元', route: '/anime-history' },
```
Buat `src/features/cinematic/anime/` mengikuti struktur Shōwa (data-driven `scenes.js` + view scene SVG/React).
**Test penjaga:** `cinematicForEra('anime')?.id === 'anime'`; `nextCinematic('anime', {}) === 'anime'`.

### T6 — Peta 8 perhentian
Buat `src/features/cinematic/anime/animeStops.js` (modul murni, §7) + test (pola `showaStops.test.js`).

### T7 — Lapis 2 & 3: FRANCHISE + KARAKTER (inti baru)
- `src/features/anime/franchises.js` — daftar franchise **ORISINAL** (id, kanji, harga, palet `fr1/fr2`, motif, gacha pool). Modul murni.
- `src/features/anime/characters.js` — daftar karakter per franchise (id, voice key, effect key, 必殺技).
- Fungsi murni: `franchiseById`, `charactersOf(franchiseId)`, `ownedFranchise`, `equipFranchise`.
- State baru di `ProgressContext`: `ownedFranchises: []`, `ownedCharacters: {}` + aksi `buyFranchise`, `pullCharacter`.
- **Test:** franchise unik, tiap karakter punya voice+effect valid, gate level ≥150.

### T8 — Gacha クレーンゲーム
Buat `src/features/gacha/animeCopy.js` (pola `showaCopy.js`, §8) + test. Konteks: crane game — ambil kapsul/figur karakter.
Perluas `slot.js` dengan varian 多元 (pola `HEIAN_SHELL_*`/`EDO_SLIP_*`) → `ANIME_CLAW_*`.

### T9 — Dark mode 深夜アニメ
Pastikan toggle gelap saat era 多元 = ruang tonton (halaman malam + layar menyala), bukan era lain.
**Verifikasi:** uji **10 kombinasi** (5 era × terang/gelap).

### T10 — Checkpoint 最終回
`src/features/cinematic/anime/animeCheckpoint.js` (pola `showaCheckpoint.js`) — sintesis register pop → gerbang naik era (→ Cyberpunk Lv 300).

### T11 — Audio tema
Isi `THEME_BGM_PLANS.anime` (§9) + test di `themeAudio.test.js` (pola Shōwa).

### T12 — Voice cinematic
Generate `saku-anime.mp3` → split 7 klip → wire ke `anime/data/scenes.js` (§10) + test penjaga file voice ada.

### T13 — Wiring app
Route `/anime-history`, `/saishukai-checkpoint`, halaman franchise/karakter; entri cinematic 多元 di `Settings.jsx`; token warna `--color-sora`/`--color-sakura` + default `:root` di `index.css`; entri era di pemilih era.

### T14 — Verifikasi akhir
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run lint 2>&1 | grep -ci error     # 0
npm run build 2>&1 | tail -3           # exit 0
git diff --stat src/index.css | grep ':root' || echo "OK: :root BEKU"
```
Uji manual: Lv 150 → app tampil 多元 (**kanvas kosong** = halaman manga); beli 1 franchise → **dunia berubah warna+motif** tanpa ganti bentuk; gacha 1 karakter → voice+efek muncul; toggle gelap → 深夜アニメ; `prefers-reduced-motion` → animasi mati.

---

## 13. Kriteria Penerimaan

| # | Kriteria | Cara uji |
|---|---|---|
| 1 | `data-era="anime"` di `<html>` saat Lv 150 | DevTools |
| 2 | `--sora-val` = `#3a8dde` (primer) | DevTools computed |
| 3 | Bentuk: outline `3px` + **cel-shadow berwarna** `5px 5px 0 0` + radius `6px` | Visual |
| 4 | **Kanvas kosong** tampil sengaja (panel + 題字 多元 + balon kosong), **tidak** jatuh ke base Shōwa | Visual |
| 5 | Motif manga / screentone / 集中線 / オノマトペ | Visual |
| 6 | Nama nav jadi 物販 / クレーンゲーム / コイン / リュック / 名刺 / デイリー / 戦闘力 | Visual |
| 7 | Peta 8 perhentian (dunia) tampil | Visual |
| 8 | **Lapis 2:** beli franchise → warna+motif dunia berubah, bentuk tetap | Uji beli |
| 9 | **Lapis 3:** gacha karakter → voice + efek 必殺技 muncul | Uji gacha |
| 10 | Dark mode = 深夜アニメ | Toggle |
| 11 | Checkpoint 最終回 → naik era (gerbang Lv 300) | Uji |
| 12 | Cinematic 多元 (narrator Saku) auto-play sekali | Uji |
| 13 | **`:root` TIDAK berubah** (git diff bersih) | `git diff src/index.css` |
| 14 | **Nol IP berhak cipta baru** di aset | Review + grep nama |
| 15 | `npm test` lulus (+ test baru), lint 0, build exit 0 | Terminal |

---

## 14. Risiko & Catatan

| # | Risiko | Mitigasi |
|---|---|---|
| R1 | **Godaan mengubah `:root`** → ciri khas lama hilang | **Aturan keras §0 Shōwa: `:root` beku.** Uji `git diff` di T14 |
| R2 | **"Kanvas kosong" terasa seperti era yang lupa didesain** | Ornamen + 題字 + balon kosong = **bukti kesengajaan**. Plus copy 「この頁は、まだ白い。」 di hero saat kosong |
| R3 | **3 lapis tema = kompleksitas CSS/state** | Franchise = **1 token set `--fr-1/--fr-2`** (data, bukan CSS per-franchise). State lokal, pola `ownedPacks` |
| R4 | **Hak cipta** — godaan memakai IP nyata | **Aturan §6.4 keras:** franchise fiktif/orisinal; siluet bukan reproduksi; JJK yang ada = referensi, bukan template |
| R5 | 10 kombinasi era×mode bisa "bertabrakan" di komponen bersama | Uji **10 kombinasi** (5 era × terang/gelap) di T9/T14 |
| R6 | Crane game butuh aset kapsul baru | Fallback ke pola `showaCopy.js` dulu; aset menyusul |
| R7 | Voice Saku belum ada | Kerjakan terakhir (T12); tema jalan tanpa voice |
| R8 | Kontras Shōwa(abu)→多元(cerah) bisa terasa "norak" | Token `--tone-val` + screentone + **outline tebal** menahan agar tetap "manga", bukan "pelangi" |
| R9 | Franchise/karakter butuh banyak konten (8 perhentian per dunia) | Mulai **1 franchise percontohan** penuh; sisanya bertahap |

---

## 15. Yang TIDAK termasuk PRD ini

- **Mengubah base `:root`** — DILARANG (§0 Shōwa).
- **Menambah IP berhak cipta baru** — DILARANG (§6.4).
- Era lain (Cyberpunk) — PRD terpisah.
- **Sistem mekanik penuh** (オノマトペ quiz, セリフ, 推し, 4th-wall, dl) → **`docs/tema/anime-mekanik.md`** (pola `meiji-mekanik.md`) — dokumen terpisah.
- Implementasi kode (dokumen ini SPEC; eksekusi di terminal).
- Cerita/naratif utama — lihat `docs/story.md` §6–7.
- Voice & naskah final cinematic — mengikuti pola `docs/voice-cinematic-edo.md`.
- **Keputusan terbuka:** motion final (`140ms` snap vs lebih halus), jumlah franchise percontohan, jenis checkpoint (pakai N4 bridge?).
- **Keputusan TERKUNCI (§6):** ornamen = **フィルム＋セル画** (kinetik) + **コマ割り題字** (panel) + **多世界の扉** (hero) + **集中線** (aksen) + **screentone/オノマトペ** (tekstur). Franchise = **fiktif/orisinal**.

---

## 16. Isi クレーンゲーム (Gacha) — 推し活グッズ

| Item | Kanji | Rarity | Efek |
|---|---|---|---|
| Koin arcade | コイン | ★ | mata uang |
| Gantungan kunci | キーホルダー | ★ | hiasan |
| Can badge | 缶バッジ | ★ | koleksi 推し |
| Strap karet | ラバーストラップ | ★★ | hiasan tas |
| Stand akrilik | アクリルスタンド | ★★ | pajangan profil |
| Kartu トレカ | トレカ | ★★ | koleksi |
| Figur kecil | フィギュア | ★★★ | pajangan besar |
| Boneka | ぬいぐるみ | ★★★ | maskot profil |
| Poster | ポスター | ★★★ | latar profil |
| **Itasha (mini)** | 痛車 | ★★★★ | item puncak — mobil hias |
| **「???」 (out-of-place)** | ??? | ★★★★ | **item "aneh" = petunjuk cerita** — barang dari **電脳 (Cyberpunk)** yang belum seharusnya ada di 多元 |

> **Item langka out-of-place** menyambung benang Nacht/Saku (pola sama Meiji §16 & Shōwa §16). Di 多元, penyamaran mereka **hampir terbuka** — lihat §18.

---

## 17. Karakter & NPC

| NPC | Kanji | Peran |
|---|---|---|
| Pegawai arcade | 店員 | pemberi misi harian デイリー |
| Cosplayer | コスプレイヤー | konteks 推し & 服装 |
| Mangaka | 漫画家 | pemberi soal オノマトペ / セリフ |
| Seiyuu | 声優 | pemandu audio (pelafalan) |
| Penulis dōjin | 同人作家 | konteks 物販 & 文化祭 |
| Staf produksi | スタッフ | tema "di balik layar" (§19) |

> NPC bisa jadi **avatar pemberi misi** (mengganti panel teks), pola quest yang sudah ada.

---

## 18. Beat cerita — penyamaran yang hampir terbuka

> Dari `docs/story.md` §4: Nacht & Saku = **AI dari Cyberpunk** yang menyamar jadi roh kuno.
> **Meiji = penyamaran "berhasil".** **Shōwa = mulai retak.** **多元 = hampir terbuka.**
> Babak 2 berakhir di 多元; Babak 3 = 電脳 (rumah mereka). Jadi 多元 = **halaman terakhir sebelum pulang**.

Di dunia pop, **"tokoh dengan kekuatan" adalah hal biasa**. Jadi Nacht & Saku — yang punya kekuatan & pakaian "masa depan" — **tidak lagi terlihat aneh**. Mereka **cocok** terlalu sempurna. Dan itu **berbahaya**: mereka mulai bertingkah seperti **tokoh utama**, bukan pengamat.

- **Petunjuk menumpuk → berubah jadi terang:** Nacht/Saku mulai memakai **kekuatan** mereka tanpa ragu; Saku menyebut istilah yang **belum ada** di dunia mana pun.
- **Misteri 絵巻 memuncak:** 絵巻 mulai membuka **dunia yang tak pernah ada di sejarah** — tanda bahwa ia **bukan benda kuno**, tapi **mesin** yang kehabisan "masa lalu asli" dan mulai **menggambar dunia baru**. Pemain menyadari: **bukan mereka yang membalik halaman — halaman yang menarik mereka.**
- **Ancaman bergeser:** dari "kelihatan terlalu tahu" (Meiji) → "kelihatan seperti pulang" (Shōwa) → **"rumah sudah dekat"** (多元). Saku: *「…もうすぐ、着くね。」* lalu diam.
- **Rival (§5 story.md)** muncul lebih sering — memberi Misi Harian/Mingguan — seolah **mengukur** pemain sebelum ujian terakhir.

> **Ini benang yang menembus SELURUH 多元** — bukan perhentian, tapi lapisan di belakangnya. Puncak sebelum twist Cyberpunk (Lv 300).

---

## 19. Sisi gelap — 「画面の向こう」 (di balik layar)

多元 bukan cuma keceriaan. Harga di balik industri pop disajikan datar, **tanpa drama** (pola Meiji §19 & Shōwa §19). Aturan nada: **「照明は見せない」** — lampu panggung tidak diperlihatkan; yang tampak cuma sorot, bukan kerja di belakangnya.

| Aspek | Kanji | Catatan (datar) |
|---|---|---|
| Kerja lembur industri animasi | 過労 | orang di balik tontonan yang lelah |
| 炎上 (kebakaran daring / cancel culture) | 炎上 | satu baris salah → dibakar ramai-ramai |
| 廃課金 (kecanduan gacha / belanja berlebihan) | 廃課金 | batas antara hobi & obsesi |
| ネットいじめ (perundungan daring) | 誹謗中傷 | kata-kata yang melukai |
| 打ち切り (serial dipotong) | 打ち切り | cerita yang berhenti sebelum selesai |

> Contoh baris (datar): *「その話は、打ち切られた。」* ("Cerita itu dipotong.") Titik. Selesai.
> Ini yang bikin 多元 **bukan nostalgia naif** — di balik keceriaan ada harga. Kontras dengan warna cerah = tension utama tema.
> **Nada:** disajikan lewat **staf/NPC** (§17) & baris datar — **tidak** menghakimi, tidak menghibur.

---

## 20. Identitas suara

| Elemen | Usulan |
|---|---|
| **シティポップ + アニソン** | BGM tema — cerah & energik (§9) |
| **オノマトペ SFX** | キラキラ · ドキドキ · バン · ジャジャーン |
| **Fanfare ガチャ** | クレーンゲーム arcade + jingle kemenangan |
| **Diegetik** | item **ポスター** / **トレカ** memutar musik dunia di profil |
| **Impact frame** | 「バン！」 + kedip 1 frame saat streak/jawaban benar — tanda tangan bunyi 多元 |
| **「つづく」** | teks penutup tiap dunia (lanjut ke dunia berikut) |

---

## 21. 光と影 — 多元 = era paling RAMAI & paling sepi

Heian & Edo = satu budaya. Meiji = tumbukan Jepang×Barat. Shōwa = harapan×trauma. **多元 = ramai×sepi (賑やか×寂しい).** Prinsip: **「世界が増えるほど、ひとりになる。」** — makin banyak dunia, makin sendiri (karena semua ini menuju perpisahan di Cyberpunk).

Setiap perhentian punya **rasio 賑 (ramai) / 寂 (sepi)** — sehingga tiap dunia terasa beda **tanpa ganti palet**:

| Perhentian | 賑 (ramai) | 寂 (sepi) | Efek |
|---|---|---|---|
| 開幕 | 30% | 70% | halaman robek, sunyi lalu terang |
| 冒険 | 90% | 10% | **paling ramai** |
| 日常 | 70% | 30% | hangat |
| 青春 | 85% | 15% | bersemangat |
| 魔法 | 80% | 20% | megah |
| 怪談 | 15% | 85% | **paling gelap/sepi** |
| 異世界 | 55% | 45% | jauh |
| 最終回 | 40% | 60% | ramai lalu **sepi** (berpisah) |

> Data & fungsi murni → pola `meiji-mekanik.md` M2 (`waYoFor`/`waYoMix`) & Shōwa §21 (`koKageFor`/`koKageMix`) → untuk 多元: `nigiSabiFor`/`nigiSabiMix`.

---

## 22. Ringkasan Satu Layar

> **多元 = 世界が増える時代.** Halaman manga yang pecah jadi banyak dunia.
> Heian menulis dengan **kuas** · Edo mencetak **blok kayu** · Meiji menyusun **huruf logam** · Shōwa menuang **beton** · 多元 membalik halaman ke **dunia yang tak ada**.
> **多元 = era KANVAS** — bukan 1 dunia, tapi **tempat untuk banyak dunia** (`heian.md` §13: canvas kosong → franchise).
> 空 sora `#3a8dde` (primer) · 桜 sakura `#f18bb0` (aksen) · 墨 `#171a22` (outline).
> Outline `3px` · **cel-shadow BERWARNA** `5px 5px 0 0` · radius `6px` · screentone · gerak `140ms` (paling cepat).
> Font: Noto Serif JP 900 (display) · Inter 900 italic (オノマトペ/戦闘力) · Shippori Mincho (セリフ). **Nol font baru.**
> Uang **コイン** · gacha **クレーンゲーム** · shop **物販** · checkpoint **最終回** · dark mode **深夜アニメ**.
> **3 lapis:** ERA (Lv 150) → **FRANCHISE** (beli di 物販) → **KARAKTER** (gacha クレーンゲーム).
> **Dunia:** 5 ORISINAL (fiktif) + **LISENSI** (IP nyata, tier ~20k, wajib `credit`; JJK live 8 tokoh) + `soon` teaser (One Piece, JoJo). **Beli = auto-equip.**
> **8 perhentian (dunia):** 開幕 → 冒険 → 日常 → 青春 → 魔法 → 怪談 → 異世界 → 最終回.
> Fokus bahasa **budaya pop (オノマトペ · タメ口/敬語 · 若者言葉 · カタカナ · セリフ)** · narator **Saku** · gerbang **Lv 150 — dunia bertambah**.
> **ATURAN:** `:root` BEKU (§0 Shōwa) · **dunia orisinal = FIKTIF; dunia lisensi = IP nyata + `credit` WAJIB** (§6.4 revisi) · bentuk era TETAP, franchise hanya ganti warna+motif.
