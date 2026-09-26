# Plan: Speaking di HP — tab & kartu "fit in" (bukan ke-zoom)

**Tanggal**: 2026-09-27
**Repo**: `C:\Users\maddo\Documents\japanese-quiz` (React 19 + Vite + Tailwind v4 + Motion)
**Bahasa kerja**: kode & komentar mengikuti konvensi repo (komentar Indonesia, UI bilingual en/id).

---

## Goal

Keluhan user (verbatim): *"di bagian speaking di hp agak ke zoom banget bagian hiragana, katakana, kanji, kotoba, gak fit in"*

Arti terukur: di layar HP, bagian Speaking (tab Hiragana/Katakana/Kotoba/Kanji + isinya) **tidak muat dalam layar** — tab terpotong, kartu membungkus jadi banyak baris, tombol sesi keluar viewport, dan teks sesi raksasa (80px) memakan layar. Semua ini bikin tampilan terasa "di-zoom".

---

## Bukti SEBELUM (diukur di headless Chrome, dev server `:5174`)

### M1 — Tab bar terpotong di HP (masalah utama)
`src/pages/Speaking.jsx` TABS: `gap-4 sm:gap-8`, label `text-[10px] tracking-[0.3em]`.

| Lebar | Hasil ukur | Terlihat user |
|---|---|---|
| 360px | Hiragana x16–151, Katakana x167–305, **Kotoba x321–413 (terpotong)**, Kanji x429–506 (off-screen), Puisi x522–582 (off-screen) | Hanya 2 tab; "Kotoba/Kanji/Puisi" tak terlihat |
| 320px | lebih parah | hanya ~1,5 tab |

`overflow-x-auto no-scrollbar` → bisa di-scroll **tapi tidak ada indikator apa pun** (scrollbar disembunyikan), jadi user menganggapnya "gak fit in".

### M2 — Kartu yoon 2 huruf membungkus (kana salah tulis)
`itemGrid` dense (`text-2xl` = 24px). Ukur DOM `きゃ`: 2 client rect di top berbeda (473 & 497) → **き dan ゃ tertumpuk vertikal**, bukan berdampingan.
- Kartu yoon jadi **86px** vs kartu 1 huruf **62px** → tinggi baris tidak rata.
- 33 kartu yoon hiragana + 0 katakana terdampak. Di 320px lebih parah.
- Lebar teks 45px vs area dalam kartu 45px → 0 sisa → rawan wrap.

### M3 — Tombol baris sesi keluar viewport (≤360px)
`SpeakSession`: `gap-3`, `px-5`/`px-6`, `text-xs`. Ukur baris tombol (Dengar/Ucapkan/Lewati): **lebar 373px**.
- 390px: x8–382 ✓ muat
- 360px: x**-7**–367 → terpotong kiri & kanan
- 320px: x**-27**–347 → "Dengar" terpotong 27px

### M4 — Kartu kotoba tinggi tidak seragam + teks panjang membungkus 5 baris
Kategori School (kata terpanjang 10 huruf `がっこうのそうじのひ`): tinggi kartu **{104, 134, 164, 194}px** dalam satu grid → grid berantakan ("dinding bata tidak rata"). `がっこうのそうじのひ` = 5 baris.

### M5 — Teks sesi 80px terlalu besar untuk teks panjang di HP
`text-[80px]`: `がっこうのそうじのひ` di 360px = **3 baris / 240px tinggi** (memenuhi 37% layar 640px). `じゅういちじ` di 390px = 358px (mentok tepi).

---

## Perubahan (4 file + PRD)

### 1. `src/features/speaking/speaking.js` — 2 helper MURNI baru (testable)
Mengikuti pola `speakPromptKind`: fungsi mengembalikan **kunci**; JSX memetakan kunci → kelas Tailwind LENGKAP (kelas tetap literal di JSX supaya terdeteksi scanner Tailwind v4).

```js
// Kunci ukuran teks kartu grid. dense = kana/kanji (kartu kecil 5-10 kolom).
export const gridTextSize = (display, dense) => {
  const n = [...String(display ?? '')].length;
  if (dense) return n <= 1 ? 'lg' : 'sm';        // yoon 2 huruf TIDAK boleh wrap
  if (n <= 4) return 'lg';                        // kotoba pendek (75% data)
  if (n <= 7) return 'md';
  return 'sm';
};

// Kunci ukuran teks item di sesi bicara (mobile px; desktop naik proporsional).
export const speakTextSize = (display) => {
  const n = [...String(display ?? '')].length;
  if (n <= 3) return 'xl';   // 80px → tetap seperti sekarang
  if (n <= 5) return 'lg';   // 60px
  if (n <= 7) return 'md';   // 48px
  return 'sm';               // 40px
};
```

### 2. `src/pages/Speaking.jsx`
- **Tab bar**: `gap-2 sm:gap-8`, `px-1` (tap target), label `text-[9px] sm:text-[10px]` + `tracking-[0.1em] sm:tracking-[0.3em]`.
  Target terukur: 5 tab ≤ **288px** (container 320px) & ≤ 328px (360px).
  Kandidat terukur (label 9px tracking 0.1em + jp 14px): total **241px + gap** → fit dengan margin.
- **Kartu grid**: `whitespace-nowrap` pada teks + kelas ukuran dari `gridTextSize` + `auto-rows-fr` pada grid (semua baris sama tinggi; fr di container auto = setinggi konten tertinggi, jadi tidak memotong).
  Mapping: dense `lg`→`text-2xl`, `sm`→`text-lg sm:text-2xl`; kotoba `lg`→`text-3xl`, `md`→`text-2xl`, `sm`→`text-xl`.

### 3. `src/features/speaking/SpeakSession.jsx`
- Teks utama: pakai `speakTextSize` (mobile turun; `sm:` naik proporsional — 1-3 huruf tetap 80/120px).
- Baris tombol: `gap-2 sm:gap-3`, `px-3 sm:px-5`/`px-3 sm:px-6`, `text-[11px] sm:text-xs`.
- Tombol **Lewati**: label teks disembunyikan di <sm (`hidden sm:inline`), tetap ikon + `aria-label`/`title` → memberi margin aman di 320px.

### 4. PRD
- Section 20 (Responsive): catat aturan tab bar & kartu grid harus muat di 320px.

### 5. Test baru (`speaking.test.js`)
`gridTextSize` (yoon→sm, kana 1 huruf→lg, kotoba 4/5-7/8+ → lg/md/sm, input kosong/null aman) + `speakTextSize` (batas 3/5/7 huruf, kosong aman).

---

## Target terukur SESUDAH (gate)

| # | Ukur | Target |
|---|---|---|
| 1 | 5 tab bar di 320px | semua `right ≤ vw-16`, tidak ada yang off-screen |
| 2 | Kartu `きゃ` | 1 baris (rects top sama), tinggi = kartu 1 huruf (62px) |
| 3 | Tinggi kartu kotoba School | seragam (semua sama) |
| 4 | Baris tombol sesi di 320px | `left ≥ 0` & `right ≤ vw` |
| 5 | Teks sesi `がっこうのそうじのひ` di 360px | ≤ 2 baris |
| 6 | Verifikasi komprehensif | semua 104 hiragana + 46 katakana + 86 kanji + 876 kotoba: tidak ada teks overflow dari kartu |
| 7 | Regresi | `npm test` 197 pass + test baru, lint exit 0, build ✓, desktop 1280px tetap rapi |

**Aturan repo**: commit lokal saja, TIDAK push.

---

## Log Eksekusi (27/09/2026)

Status: **SELESAI**. Semua target gate terpenuhi, diukur di headless Chrome (CDP emulation 320/360/390/414px) pada dev server `:5174`.

### File yang diubah
| File | Perubahan |
|---|---|
| `src/features/speaking/speaking.js` | +3 helper murni: `displayCharCount`, `gridTextSize`, `speakTextSize` |
| `src/features/speaking/speaking.test.js` | +4 test (201 total, dari 197) |
| `src/pages/Speaking.jsx` | tab bar → grid 5 kolom; kartu → ukuran adaptif + nowrap kana + `auto-rows-fr` |
| `src/features/speaking/SpeakSession.jsx` | teks sesi adaptif; tombol wrap + kompak; skip ikon-saja <sm |
| `PRD.md` | §9.10 + §20 catatan mobile fit |

### Hasil ukur SESUDAH vs SEBELUM

| # | Metrik | Sebelum | Sesudah |
|---|---|---|---|
| 1 | Tab terlihat di 320px | 2 dari 5 (Kotoba x321–413 terpotong) | **5 dari 5**, x16–304, 0 overflow |
| 2 | Kartu `きゃ` | 2 baris (rect top 473 & 497), kartu 86px | **1 baris**, kartu 62px = kartu 1 huruf |
| 3 | Tinggi kartu hiragana | {62, 86} | **{62}** seragam (104/104) |
| 4 | Baris tombol sesi 320px | x−27 … 347 (terpotong 27px) | x31–289, **muat** |
| 5 | `がっこうのそうじのひ` di sesi 320px | 3 baris @80px (240px) | **2 baris @44px** (88px) |
| 6 | Kotoba max baris (103 kategori) | 5 baris (School) | **2 baris** (0 kategori bermasalah) |
| 7 | Kartu kotoba tinggi | {104,134,164,194} | seragam per baris (`auto-rows-fr`) |

### Verifikasi menyeluruh (bukti)
- **Semua tab × semua breakpoint**: Hiragana/Katakana/Kotoba/Kanji/Puisi × 320/360/390/414px → **20/20 OK**, `document.scrollWidth == viewport`, 0 elemen overflow.
- **Semua 104 hiragana** (71 seion + 33 yoon), **46 katakana**, **86 kanji**: max 1 baris, tinggi seragam 62px, 0 teks meluber, 0 label terpotong.
- **Semua 103 kategori kotoba** (876 kata): max 2 baris, 0 spill, 0 label terpotong.
- **Sesi**: kana あ tetap 80px (desain lama), yoon きゃ 80px, kotoba 10 huruf 44px/2 baris, tombol 3 muat di 320/360/390.
- **Mode Buta**: grid 104/104 label `？`; sesi kana → prompt `🎧` + tombol "Putar & Tirukan", romaji tidak bocor; font prompt `？` = 80px (diperbaiki dari bug awal yang menghitung dari teks tersembunyi).
- **Mode Pandu** kotoba panjang: 44px, 2 baris.
- **Desktop 1280px**: hiragana 10 kolom/24px, kotoba 6 kolom/30px — tampilan desktop tidak berubah.
- **Tab Puisi**: 19 kartu render, sesi puisi 3 baris ter-render, 0 spill di 320px.

### Gate akhir
`npm test` → **201 pass / 0 fail** · `npm run lint` → exit 0 (0 warning dari file yang diubah) · `npm run build` → ✓ built, semua kelas Tailwind baru ada di dist CSS.

### Putaran kedua — label arti kotoba (commit `60c7c17`)
Label arti dulu `truncate` → **24% (210/876) terpotong** di HP. Perbaikan: `line-clamp-2` (kana/kanji) / `line-clamp-5` (kotoba) + `shrink-0` (flex sempat mengompres label). Hasil final terukur di 320/360/390px: **0 terpotong, 0 spill, 0 overflow** untuk seluruh 104 hiragana + 46 katakana + 13 kanji + 876 kotoba (103 kategori) — 12/12 kombinasi bersih.

### Catatan penyimpangan dari plan
1. **Dua bug ditemukan saat verifikasi (bukan dari plan)**: (a) `whitespace-nowrap` yang diterapkan ke kotoba membuat teks meluber keluar kartu (31/34 kartu) — diperbaiki: nowrap hanya untuk kana/kanji; (b) ukuran font sesi dihitung dari teks tersembunyi di mode Buta — diperbaiki agar memakai teks yang benar-benar tampil.
2. **Batas `gridTextSize` digeser** dari rencana awal (4/7) ke (4/6) setelah pengukuran aktual: `じゅういちじ` (6 huruf) aman di `md`, `こうちょうしつ` (7 huruf) butuh `sm` agar tidak 3 baris di 320px.
3. **Ukuran font kotoba mobile** akhirnya `text-base`/`text-sm`/`text-xs` (bukan `text-lg`/`text-base`/`text-sm` di rencana): diukur dari lebar dalam kartu aktual (64.7px di 320px), `text-sm` = 14px masih menyisakan 3 baris untuk kata 10 huruf — 12px (`text-xs`) memberi 2 baris. Desktop tidak terpengaruh (tetap `sm:text-3xl`/`sm:text-2xl`/`sm:text-xl`).
4. **Tab bar** tidak memakai pendekatan "shrink label" saja (diukur: total 360px > 288px container di 320px) — diganti grid 5 kolom + label di atas aksara Jepang, yang terukur fit dengan margin ≥6px per sel.

