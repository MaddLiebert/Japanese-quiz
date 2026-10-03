# PRD — Tema Era: **HEIAN 平安** (Tema #1 dari 6)

**Versi:** v1.0 · **Dibuat:** 2026-10-02
**Status:** SPEC — belum diimplementasikan
**Induk:** sistem "Anime Multiverse / Tema Era" (lihat §13)
**Target implementasi:** terminal baru (task T0–T14 di §12)

---

## 1. Ringkasan

Tema **Heian** adalah **tema era pertama** dan **tema default** (Lv 1) untuk aplikasi 日本語学園. Ia mengubah seluruh wajah aplikasi dari bahasa visual "cetak tebal ala Shōwa" (tinta 4px, bayangan keras, sudut tajam) menjadi bahasa visual **istana Heian**: garis tipis, kabut, warna berlapis, gerak lambat.

> **Tesis desain (satu kalimat):**
> **"Heian = istana dalam kabut"** — kertas sutra tua, tinta lembut, warna berlapis seperti lengan kimono, semuanya mengambang pelan.

Tema ini juga **pintu masuk** sistem tema era: ia menetapkan **arsitektur** (`data-era`, token bentuk, lapisan tema) yang akan dipakai 5 tema berikutnya (Edo, Meiji, Shōwa, Anime Multiverse, Cyberpunk).

---

## 2. Kenapa Heian (dasar sejarah)

| Fakta | Implikasi desain |
|---|---|
| **Hiragana lahir di Heian** (794–1185), dari manyōgana, awalnya disebut **女手 onna-de** ("tulisan perempuan") | Tema ini **harus membuat hiragana terlihat indah** — bukan cuma kanji. Font & tipografi jadi inti. |
| **Murasaki 紫 = warna pangkat tertinggi** di istana (sistem 位階) | Warna primer app berubah **indigo → ungu murasaki**. Bukan asal — bermakna sejarah. |
| **襲の色目 kasane no irome** — warna dipakai **berlapis**, bukan tunggal | Palet dirancang **berpasangan** → dipakai sebagai gradien di kartu. |
| **Miyabi 優雅** (keanggunan) & **mono no aware 物の哀れ** (keindahan yang fana) | Rasa: **halus, lambat, berlapis** — kebalikan dari tegas/brutal Shōwa. |
| Istana = **"istana di atas awan"** (kumo 雲) | Motif latar utama = **awan**, bukan gelombang laut (seigaiha = Edo). |
| Kesusastraan: **Genji Monogatari**, **Makura no Sōshi**, **waka** | Konten belajar tema ini = **kana** (hiragana + katakana) & waka. |

---

## 3. Kontras: tema sekarang vs Heian

Tema yang berjalan sekarang (tinta tebal) = **bahasa visual Shōwa** (poster/cetak pasca-perang). Heian harus jadi **kebalikannya** — ganti **bahasa bentuk**, bukan cuma warna.

| Aspek | Shōwa (sekarang) | **Heian (target)** |
|---|---|---|
| Garis tepi | tinta tebal `4px` | **tipis `1px`, halus** |
| Bayangan | keras `6px 6px 0 0` (blur 0) | **lembut `0 8px 32px` (blur besar)** |
| Sudut | tajam (`0`) | **membulat `10px`** |
| Rasa | tegas, brutal, poster | **halus, berlapis, kabut** |
| Metafora | **cetak (print)** | **sutra & kertas (silk)** |
| Gerak | snap cepat, "pukul/tebas" | **mengapung, lambat, fade** |
| Aksen warna | hitam pekat `#1a1a1a` | **tinta kecoklatan `#3a332b`** |
| Motif | seigaiha (gelombang), asanoha | **kumo (awan) + momiji (maple)** |

> **Keputusan (dikonfirmasi user):** Heian mengganti **bentuk juga**, bukan hanya warna. Kalau hanya warna, hasilnya akan terasa "Shōwa ungu", bukan "Heian".

---

## 4. Design Tokens

### 4.1 Arsitektur token (3 lapis)

```
LAPIS 1  --era-*     bentuk (edge, radius, shadow, motion)   ← BARU
LAPIS 2  --*-val     warna (sudah ada, tinggal di-override per era)
LAPIS 3  data-theme  terang/gelap (sudah ada) × data-era (BARU) = komposisi
```

**Kunci:** `data-theme` (light/dark) dan `data-era` (heian/edo/…) harus **berkomposisi**, bukan saling menimpa. Contoh selector: `[data-era="heian"]` untuk terang, `.dark[data-era="heian"]` untuk gelap.

### 4.2 Warna — Heian (terang)

```css
[data-era="heian"] {
  --kinari-val:       #f6f1e4;  /* 白練 shironeri — sutra mentah */
  --kinari-light-val: #fbf8ef;  /* kertas lebih terang */
  --sumi-val:         #3a332b;  /* 墨 sumi lembut — tinta kecoklatan, BUKAN hitam pekat */
  --ai-val:           #5b4a7a;  /* 紫 murasaki — warna pangkat tertinggi */
  --shu-val:          #b83b4a;  /* 紅 kurenai — merah lembayung */
  --matcha-val:       #8a9a5b;  /* 萌黄 moegi — hijau muda */
  --kin-val:          #c9a227;  /* 金 kin — emas sutra & byōbu */
  --backdrop-val:     #e9e2d0;  /* 砂 pasir keemasan */
}
```

### 4.3 Warna — Heian (gelap / "istana malam")

```css
.dark[data-era="heian"], [data-theme="dark"][data-era="heian"] {
  --kinari-val:       #1a1620;  /* malam keunguan */
  --kinari-light-val: #221c2a;
  --sumi-val:         #ece3d2;  /* teks krem hangat */
  --ai-val:           #a98fd6;  /* murasaki terang */
  --shu-val:          #e0606f;
  --matcha-val:       #a3b57a;
  --kin-val:          #e8c860;
  --backdrop-val:     #100d16;
}
```

### 4.4 Token bentuk — Heian (BARU)

Ini yang mengubah "rasa" dari Shōwa → Heian. Dipakai oleh komponen lewat `var(--era-*)`.

```css
[data-era="heian"] {
  --era-edge-w:       1px;                            /* tipis, bukan 4px */
  --era-edge-color:   color-mix(in srgb, var(--sumi-val) 55%, transparent);
  --era-radius:       10px;                           /* membulat, bukan 0 */
  --era-radius-sm:    6px;
  --era-radius-pill:  9999px;
  --era-shadow:       0 6px 28px -6px rgba(58, 51, 43, 0.28);
  --era-shadow-hover: 0 12px 40px -8px rgba(58, 51, 43, 0.38);
  --era-motion:       600ms;                          /* lambat (Shōwa = 200ms) */
  --era-ease:         cubic-bezier(0.22, 1, 0.36, 1);
}
```

### 4.5 Pemetaan nilai (referensi cepat)

| Token | Sekarang (Shōwa) | Heian | Nama tradisional |
|---|---|---|---|
| `--kinari-val` | `#f3f0e8` | `#f6f1e4` | 白練 shironeri |
| `--sumi-val` | `#1a1a1a` | `#3a332b` | 墨 sumi |
| `--ai-val` | `#182b49` | `#5b4a7a` | 紫 murasaki |
| `--shu-val` | `#d3382f` | `#b83b4a` | 紅 kurenai |
| `--matcha-val` | `#7d8f69` | `#8a9a5b` | 萌黄 moegi |
| `--kin-val` | `#a9821c` | `#c9a227` | 金 kin |
| `--backdrop-val` | `#e8e4d9` | `#e9e2d0` | 砂 suna |

### 4.6 🐛 Bug yang ikut diperbaiki: `--ink` tak terdefinisi

**Temuan recon:** `src/index.css` memakai `var(--ink)` di **7 tempat** (blok `.packcard`, baris 1017–1034) tapi **`--ink` tidak pernah didefinisikan** di `:root` maupun `.dark`. Akibatnya `border`/`box-shadow` kartu pack jatuh ke nilai invalid → tidak tampil.

**Perbaikan (T3):** tambahkan `--ink` ke `:root` (dan Heian meng-override-nya):
```css
:root { --ink: #1a1a1a; }
[data-era="heian"] { --ink: var(--era-edge-color); }
```

---

## 5. Tipografi (campuran — keputusan user: "campur aja")

Heian = **zaman hiragana**, jadi font harus bagus di **hiragana**, bukan hanya kanji.

| Peran | Font | Sumber | Alasan |
|---|---|---|---|
| **Judul hero / display** | **Yuji Syuku** | Google Fonts | Berbasis kaligrafi, tepi kuas — "kuas istana" |
| **Serif elegan / sub-judul** | **Shippori Mincho** *(sudah dimuat)* | Google Fonts | Halus, klasik, sudah ada di `index.html` |
| **Kana / teks Jepang** | **Klee One** | Google Fonts | Tulisan tangan halus — sangat cocok untuk **hiragana** |
| **Latin / UI** | **Inter** *(tetap)* | Google Fonts | Keterbacaan angka & tombol |

**Implementasi `index.html`** — tambah 2 keluarga ke URL yang sudah ada:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Noto+Serif+JP:wght@400;700;900&family=Shippori+Mincho:wght@700;900&family=Yuji+Syuku&family=Klee+One:wght@400;600&display=swap" rel="stylesheet" />
```

**Token font (tambah di `@theme`):**
```css
@theme {
  /* ...yang sudah ada... */
  --font-display: "Yuji Syuku", "Shippori Mincho", serif;   /* hero/judul besar */
  --font-kana:    "Klee One", "Noto Serif JP", serif;        /* hiragana/katakana */
}
```

**Aturan pakai:**
- `.font-display` → judul hero, judul era, nama tema
- `.font-serif` → tetap (Shippori Mincho) untuk sub-judul & kanji
- `.font-kana` → **kartu kana, latihan menulis, contoh hiragana**
- `.font-sans` (Inter) → tombol, angka, label UI

---

## 6. Motif & Tekstur

Motif sekarang (**seigaiha** gelombang, **asanoha** daun rami) = **Edo/Shōwa** → untuk Heian diganti.

| Motif | Kanji | Peran | Prioritas |
|---|---|---|---|
| **Awan** | 雲 kumo | **latar utama** (keputusan user) | ★ wajib |
| **Daun maple** | 紅葉 momiji | **aksen** (keputusan user) | ★ wajib |
| Bulan | 月 tsuki | hero/loading | ★ wajib |
| Sakura | 桜 | aksen lembut | opsional |
| Kupu-kupu | 蝶 chō | dekorasi | opsional |
| Air mengalir | 流水 ryūsui | pemisah section | opsional |
| **Kamon Genji** | 源氏香 | badge/simbol (pola kemenyan khas Heian) | opsional |

**Kelas CSS baru (ganti `bg-seigaiha` untuk era ini):**

```css
/* Awan Heian — latar utama. SVG data-URI, pola berulang, drift pelan. */
[data-era="heian"] .bg-kumo {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='120' viewBox='0 0 240 120'%3E%3Cg fill='none' stroke='%233a332b' stroke-width='1.2' opacity='0.16'%3E%3Cpath d='M10 80 Q40 55 70 80 T130 80'/%3E%3Cpath d='M120 40 Q150 15 180 40 T240 40'/%3E%3Cpath d='M0 110 Q30 90 60 110 T120 110'/%3E%3C/g%3E%3C/svg%3E");
  background-repeat: repeat;
}

/* Maple — aksen. Ditempel sebagai ornamen sudut, bukan latar penuh. */
[data-era="heian"] .ornament-momiji::after {
  content: "🍁";  /* placeholder — ganti SVG maple di implementasi */
  position: absolute; top: -6px; right: -6px;
  font-size: 18px; opacity: 0.55;
  pointer-events: none;
}

/* Bulan — hero/loading. */
[data-era="heian"] .ornament-tsuki::before {
  content: "月";
  font-family: var(--font-display);
  position: absolute; top: 8px; right: 12px;
  font-size: 28px; color: var(--kin-val);
  opacity: 0.5; pointer-events: none;
}
```

> **Catatan implementasi:** SVG awan/maple di atas adalah **placeholder fungsional**. Di T6, ganti dengan SVG yang lebih halus (kurva bergaya Heian). Prinsip: **stroke tipis, opacity rendah, tanpa isi padat**.

---

## 7. Bahasa Bentuk (Shape Language) — inti perubahan "berat"

Ini bagian yang **wajib** dikerjakan. Tanpa ini, Heian cuma "Shōwa ungu".

### 7.1 Masalah di kode saat ini
| Temuan | Jumlah |
|---|---|
| Kelas `shadow-[Npx_Npx_0_0_...]` keras, hardcoded | **277** |
| Nilai hex hardcoded di `.jsx` | **609** |
| `border-2` / `border-4` | 14 / 5 |
| `rounded-none` (sudut tajam) | 30 |
| `--ink` tak terdefinisi (bug) | **7 pemakaian** |

### 7.2 Strategi: token bentuk + override per-era

**Jangan** ganti 277 kelas satu per satu. Ganti **strateginya**:

**Langkah A — definisikan kelas utilitas era** (di `index.css`):
```css
/* Kelas pengganti shadow keras. Di era Shōwa = shadow keras (default),
   di era Heian = shadow lembut. Komponen pakai .card-edge, bukan shadow-[...]. */
.card-edge {
  border: var(--era-edge-w, 4px) solid var(--era-edge-color, var(--ink, #1a1a1a));
  border-radius: var(--era-radius, 0);
  box-shadow: var(--era-shadow, 6px 6px 0 0 var(--ink, #1a1a1a));
  transition: box-shadow var(--era-motion, 200ms) var(--era-ease, ease),
              transform var(--era-motion, 200ms) var(--era-ease, ease);
}
.card-edge:hover { box-shadow: var(--era-shadow-hover, 8px 8px 0 0 var(--ink, #1a1a1a)); }
```

**Langkah B — migrasi bertahap.** Komponen inti (Home, kartu kuis, kartu pack, kartu profil) dipindah dari kelas keras → `.card-edge`. Ini bisa **bertahap per layar**, tidak harus sekaligus.

**Langkah C — jaring pengaman.** Selama migrasi, tambah override CSS supaya sisa kelas keras **tidak merusak** Heian:
```css
/* Jaring pengaman: di era Heian, semua shadow keras jadi lembut. */
[data-era="heian"] [class*="shadow-["] {
  box-shadow: var(--era-shadow) !important;
}
[data-era="heian"] [class*="border-4"],
[data-era="heian"] [class*="border-2"] {
  border-width: var(--era-edge-w) !important;
  border-color: var(--era-edge-color) !important;
}
[data-era="heian"] .rounded-none {
  border-radius: var(--era-radius) !important;
}
```
> Ini bikin Heian **langsung terlihat benar** di seluruh app tanpa harus migrasi 277 kelas dulu. Migrasi bersih menyusul.

> **Jebakan jaring pengaman — "kotak samar".** Jaring yang memberi serat kertas pada
> `div/section/article/li` ber-border tanpa `bg-*` harus **mengecualikan border berarah**
> (`border-t-/b-/l-/r-`). Elemen dengan garis pemisah saja (mis. blok teks "JLPT N5"
> di Home: `border-t-[3px]`) **bukan kartu** — kalau ikut diberi serat, muncul kotak
> samar di sekitar teks. Aturan jaring:
> ```css
> [data-era="heian"] :where(div,section,article,li)[class*="border"]:not([class*="bg-"]):not([class*="border-t-"]):not([class*="border-b-"]):not([class*="border-l-"]):not([class*="border-r-"]) { /* serat kertas */ }
> ```
> Bila ada elemen yang tetap salah, tambahkan `.era-flat` untuk mematikan seratnya.

### 7.3 Radius — catatan `rounded-full`
`rounded-full` dipakai 100×, sebagian besar untuk **avatar/pill/tombol bulat** — itu **tetap** bulat di Heian (lingkaran tidak berubah makna). Yang berubah hanya **`rounded-none`** (sudut tajam → membulat).

---

## 8. Gerak (Motion)

Heian = **lambat & mengambang**. Shōwa = cepat & tegas.

| Elemen | Shōwa (sekarang) | **Heian** |
|---|---|---|
| Transisi tema | 200ms | **800ms** (kabut menyingkir) |
| Ganti layar | snap | **fade + naik pelan** (`600ms`) |
| Kartu muncul | pop keras | **mengapung, blur→jelas** |
| Kabut latar | — | **lapisan awan bergerak pelan** (drift 60–90s loop) |
| Kelopak | — | **sakura/momiji jatuh pelan** (opsional) |
| Hover kartu | lompat 2px keras | **terangkat halus + glow lembut** |

```css
@keyframes heian-drift {
  from { background-position: 0 0; }
  to   { background-position: 240px 120px; }
}
[data-era="heian"] .bg-kumo { animation: heian-drift 90s linear infinite; }

@keyframes heian-rise {
  from { opacity: 0; transform: translateY(12px); filter: blur(4px); }
  to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
}
[data-era="heian"] .heian-enter { animation: heian-rise var(--era-motion) var(--era-ease) both; }

@media (prefers-reduced-motion: reduce) {
  [data-era="heian"] .bg-kumo,
  [data-era="heian"] .heian-enter { animation: none !important; }
}
```

> **WAJIB patuh `prefers-reduced-motion`** — repo ini sudah punya disiplin ini di semua animasi (lihat blok efek JJK).

---

## 9. Audio

| Item | Isi | Catatan hukum |
|---|---|---|
| **BGM tema** | **Gagaku** (musik istana) / **koto** / **shakuhachi** — lambat, drone, pentatonik | **Bebas royalti** (generate sendiri / Pixabay / Kevin MacLeod). **Jangan** pakai musik berhak cipta. |
| **SFX jawab benar** | **denting koto** lembut | bebas royalti |
| **SFX jawab salah** | **nada shakuhachi rendah** (bukan "buzz") | bebas royalti |
| **SFX transisi era** | **angin + lonceng jauh** | bebas royalti |
| **Volume** | BGM default **-18 dB**, SFX **-10 dB**, ada toggle di Pengaturan | — |

> **Integrasi:** pakai `src/utils/audio.js` yang sudah ada. Tambah slot `themeBgm` di `src/features/audio/voices.js` atau modul baru `themeAudio.js`.

---

## 10. Video Sinematik Perkenalan

Setiap tema punya video perkenalan (keputusan user). Untuk Heian:

**Durasi:** 60–90 detik · **Dibuat sendiri** (aman hukum — jangan pakai potongan anime/film).

**Storyboard (5 babak):**

| # | Visual | Teks (JP / ID) | Audio |
|---|---|---|---|
| 1 | Layar kosong → **kabut** bergerak masuk | *(tanpa teks)* | angin pelan |
| 2 | Kabut menyingkir → **istana Heian-kyō** dari jauh, bulan | **平安時代** / "Zaman Heian (794–1185)" | koto masuk |
| 3 | **Kuas menulis** hiragana pertama di sutra | **ひらがな、誕生** / "Hiragana lahir di sini" | kuas di kertas |
| 4 | **Genji Monogatari** terbuka, ilustrasi gulungan | **源氏物語** / "Kisah Genji — Murasaki Shikibu" | gagaku |
| 5 | Kabut menutup lagi → logo 日本語学園 + **月** | **平安 — 優雅の始まり** / "Heian — awal keanggunan" | lonceng jauh |

**Spesifikasi teknis:**
- Format: **MP4 (H.264)** + **WebM** fallback · resolusi 1920×1080 · < 8 MB
- Diputar **sekali** saat tema pertama dibuka (dapat dilewati / skip)
- Simpan: `public/themes/heian/intro.mp4` + `.webm` + `poster.webp`
- Tool: DaVinci Resolve (gratis) / Canva / CapCut

> **Catatan:** video ini **berat** — bisa dikerjakan **terakhir** (T13), setelah tema visual jalan. Tema tetap berfungsi tanpa video.

---

## 11. Penamaan (tema di dalam tema)

Nama-nama UI berubah menyesuaikan era (keputusan user).

| Fungsi | Sekarang | **Heian** | Kanji | Alasan |
|---|---|---|---|---|
| Shop / Warung | Warung | **市 ichi** | 市 | "pasar" — pusat dagang kuno |
| Gacha | Gacha | **貝合わせ kai-awase** | 貝合わせ | permainan **mencocokkan kerang** khas Heian — pas untuk "mengundi & mencocokkan" |
| Mata uang | Medaru | **文 mon** | 文 | koin Jepang kuno |
| Inventory / Tas | Tas | **箪笥 tansu** | 箪笥 | lemari penyimpanan |
| Profil | Profil | **系図 keizu** | 系図 | silsilah/daftar keluarga |
| Misi harian | Misi | **日課 nikka** | 日課 | "tugas harian" |
| Peringkat | Rank | **位 i** (peringkat istana) | 位 | sistem 位階 istana Heian |

> **Implementasi:** tabel pemetaan nama per-era di modul baru `src/features/theme/eraNames.js` (pure function → mudah dites). Default (era lain) = nama sekarang.

---

## 12. Rencana Implementasi (T0–T14)

> Konvensi commit: `feat(theme):`, `fix(theme):`, `style(theme):`, `docs(theme):`
> Setiap task: tulis test gagal → jalankan → implementasi → jalankan (lulus) → commit.

### T0 — Baseline
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"   # 884/884/0
npm run lint 2>&1 | grep -ci error               # 0
git rev-parse --short HEAD
```

### T1 — Modul era (TDD, pure function)
Buat `src/features/theme/eras.js`:
```js
export const ERAS = [
  { id: 'heian', kanji: '平安', name: 'Heian', minLevel: 1 },
  { id: 'edo',   kanji: '江戸', name: 'Edo',   minLevel: 20 },
  // ... (era lain menyusul)
];
export function eraForLevel(level) { /* tertinggi yang minLevel <= level */ }
export function isEraUnlocked(eraId, level) { /* boolean */ }
```
Test `src/features/theme/eras.test.js`: Lv 1 → heian; Lv 19 → heian; Lv 20 → edo; dsb.

### T2 — `EraContext` + persist
Buat `src/features/theme/EraContext.jsx`:
- baca `localStorage.getItem('app_era')`
- default: `eraForLevel(level)` (dari ProgressContext)
- set `document.documentElement.setAttribute('data-era', era)`
- aksi `setEra`, `unlockedEras`
- **baca `level` dari `useUserStats()`** (ProgressContext) → era otomatis naik saat level naik

Daftarkan `<EraProvider>` di `src/App.jsx` (di dalam `ProgressProvider`, di luar `BrowserRouter`).

### T3 — Perbaiki bug `--ink` + tambah token bentuk
Di `src/index.css`:
- `:root { --ink: #1a1a1a; }`
- blok `[data-era="heian"]` (§4.2) + dark (§4.3)
- blok token bentuk (§4.4)
- **verifikasi:** `grep -c "var(--ink)" src/index.css` = **7**, dan `--ink` kini terdefinisi.

### T4 — Jaring pengaman bentuk (§7.2 Langkah C)
Tambah override `[data-era="heian"] [class*="shadow-["]` dll di `index.css`.
**Verifikasi manual:** buka app dengan `data-era="heian"` → semua kartu jadi tipis + membulat + shadow lembut.

### T5 — Kelas utilitas `.card-edge` (§7.2 Langkah A)
Tambah `.card-edge` di `index.css`.
**Migrasi bertahap** (boleh per-layar): `src/pages/Home.jsx` dulu, lalu kartu kuis, kartu pack, kartu profil.

### T6 — Motif awan + maple (§6)
Tambah `.bg-kumo`, `.ornament-momiji`, `.ornament-tsuki` di `index.css`.
Ganti pemakaian `bg-seigaiha` di `src/App.jsx` (baris 138) agar era-aware:
```jsx
<div className="... bg-seigaiha era-pattern ..." />
```
→ CSS: `[data-era="heian"] .era-pattern { background-image: <kumo> }`.

### T7 — Tipografi (§5)
- Tambah `Yuji Syuku` + `Klee One` ke `index.html`
- Tambah `--font-display`, `--font-kana` di `@theme`
- Tambah `.font-display`, `.font-kana` di CSS
- Terapkan `.font-display` pada judul hero (Home), `.font-kana` pada kartu kana

### T8 — Motion (§8)
Tambah `heian-drift`, `heian-rise`, `.heian-enter`, dan transisi tema 800ms.
**Wajib** sertakan blok `prefers-reduced-motion`.

### T9 — Nama era (§11)
Buat `src/features/theme/eraNames.js` + test:
```js
export function eraName(key, eraId) { /* 'shop' → '市' saat heian, else default */ }
```
Terapkan di nav (`src/App.jsx`) & judul halaman.

### T10 — Pemilih era di Pengaturan
Di `src/pages/Settings.jsx` bagian **Tampilan** (setelah toggle Terang/Gelap): tambah kartu **"Era"** dengan daftar era; yang belum terbuka (level kurang) **terkunci** dengan label "Buka di Lv N".
**Verifikasi:** Lv 1 → hanya Heian yang bisa dipilih.

### T11 — Gerbang level (§13)
`eraForLevel` dipakai `EraContext` → era **otomatis** naik saat level naik. User tetap bisa **memilih era lama** yang sudah terbuka.

### T12 — Audio tema (§9)
Buat `src/features/theme/themeAudio.js` + slot BGM/SFX; toggle di Pengaturan.
Aset: `public/themes/heian/bgm.mp3`, `correct.mp3`, `wrong.mp3`, `transition.mp3`.

### T13 — Video sinematik (§10)
`public/themes/heian/intro.mp4` + `.webm` + `poster.webp`; komponen `ThemeIntro.jsx` (diputar sekali, bisa skip, persist `introSeen_heian`).
> Boleh dikerjakan **terakhir**; tema tetap jalan tanpa ini.

### T14 — Verifikasi akhir
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"   # tetap 884/884/0 (+ test baru)
npm run lint 2>&1 | grep -ci error               # 0
npm run build 2>&1 | tail -3                     # exit 0
```
Uji manual: Lv 1 → app tampil Heian (tipis, kabut, ungu murasaki, awan, hiragana indah); toggle gelap → "istana malam"; `prefers-reduced-motion` → animasi mati.

---

## 13. Arsitektur Sistem Tema Era (induk — 6 tema)

PRD ini menetapkan **pola** yang dipakai semua era.

```
LAPIS 1 — ERA        gerbang: LEVEL
  Heian (Lv 1) → Edo (Lv 20) → Meiji (Lv 50) → Shōwa (Lv 100)
  → Anime Multiverse (Lv 150) → Cyberpunk (Lv 300)

  (Di dalam era "Anime Multiverse":)
  LAPIS 2 — FRANCHISE   gerbang: BELI di Shop     ("JJK Multiverse", dst)
  LAPIS 3 — KARAKTER    gerbang: GACHA            (Gojo, Sukuna, dst)
```

| Era | Level | Konten belajar | Tema visual |
|---|---|---|---|
| **Heian** 平安 | **1** | **Kana** (hiragana/katakana) | istana, kabut, murasaki, awan+maple |
| Edo 江戸 | 20 | Kotoba + Kanji | kota, ukiyo-e, terakoya |
| Meiji 明治 | 50 | Grammar + Reading | ilmu modern, koran, barat |
| Shōwa 昭和 | 100 | Ujian N5 | **tema sekarang** (poster tebal) |
| Anime Multiverse 多元 | 150 | Budaya pop | **canvas kosong** → franchise |
| Cyberpunk | 300 | Endgame | neon, glitch |

**Keputusan terkunci:**
- Heian = **default** (semua pemain mulai di sini)
- Era ganti **bentuk + warna + font + motion**, bukan cuma warna
- Nama UI berubah per-era
- Semua tema punya **video sinematik + BGM**
- Anime/efek karakter **terkunci sampai Anime Multiverse** (Lv 150)

---

## 14. Kriteria Penerimaan

| # | Kriteria | Cara uji |
|---|---|---|
| 1 | `data-era="heian"` di `<html>` saat Lv 1 | DevTools |
| 2 | Warna: `--ai-val` = `#5b4a7a` (murasaki) | DevTools computed |
| 3 | Bentuk: kartu **tipis 1px, membulat, shadow lembut** | Visual |
| 4 | Tidak ada lagi shadow keras 0-blur saat era Heian | Visual / grep |
| 5 | Latar **awan**, aksen **maple** | Visual |
| 6 | Hiragana pakai font **Klee One**, judul **Yuji Syuku** | Visual |
| 7 | Transisi tema **800ms** (lambat) | Visual |
| 8 | `prefers-reduced-motion` mematikan animasi | DevTools emulate |
| 9 | Toggle gelap → **"istana malam"** (ungu gelap) | Toggle |
| 10 | Nama nav jadi **市 / 貝合わせ / 文** | Visual |
| 11 | Era terkunci menampilkan **"Buka di Lv N"** | Settings |
| 12 | `npm test` tetap **884 lulus** (+ test baru), lint 0, build exit 0 | Terminal |
| 13 | Bug `--ink` **hilang** (kartu pack punya border) | Visual |

---

## 15. Risiko & Catatan

| # | Risiko | Mitigasi |
|---|---|---|
| R1 | **277 kelas shadow keras + 609 hex** → migrasi besar | Jaring pengaman CSS (§7.2C) bikin Heian benar **dulu**, migrasi bersih menyusul |
| R2 | Font baru (Yuji Syuku) **berat** | `display=swap`, subset; pertimbangkan self-host |
| R3 | Video sinematik **berat** (produksi) | Kerjakan terakhir (T13); tema jalan tanpa video |
| R4 | **Kontras** teks di latar sutra | Uji WCAG AA; `--sumi-val` sudah dirancang gelap cukup |
| R5 | BGM mengganggu saat kuis | Default **OFF** untuk BGM; user menyalakan sendiri |
| R6 | Era lain belum ada → `eraForLevel` Lv 20+ kosong | Fallback: era tertinggi yang tersedia (Heian) sampai era lain dibuat |
| R7 | `data-theme` × `data-era` tidak berkomposisi | Uji **4 kombinasi** (terang/gelap × era) di T14 |

---

## 16. Yang TIDAK termasuk PRD ini

- Era lain (Edo, Meiji, Shōwa, Anime Multiverse, Cyberpunk) — PRD terpisah
- Sistem beli franchise + gacha (butuh backend)
- Backend + akun (menyusul)
- Pengamanan audio MNN (plan terpisah: `.hermes/plans/2026-10-02_015141-mnn-audio-amankan-repo.md`)
- Perbaikan Speaking `う` (plan terpisah)

---

## 17. Ringkasan Satu Layar

> **Heian = istana dalam kabut.**
> Ungu murasaki (pangkat tertinggi) · garis tipis · shadow lembut · sudut membulat ·
> latar awan 雲 · aksen maple 紅葉 · hiragana dengan font tulisan tangan ·
> gerak lambat seperti kabut · BGM gagaku · video sinematik 90 detik.
> **Gerbang: Lv 1 — tema default setiap pemain.**
