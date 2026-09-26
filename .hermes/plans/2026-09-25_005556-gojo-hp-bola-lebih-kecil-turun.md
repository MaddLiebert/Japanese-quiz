# Gojo di HP — Bola 蒼/赫 Lebih Kecil (44px) & Turun ke Bawah Header (y=145)

> **REVISI setelah review + pengukuran langsung di browser (390×844, DOM asli).**
> Angka draf lama (64px, tepi atas y64) **DIBATALKAN**: bola akan menutupi teks
> "Score: 0" (terukur y99–114, x308–374). Plan ini menggantikan draf lama sepenuhnya.

## Goal

Di layar HP (<768px), bola 蒼 (ao) & 赫 (aka) pada efek Gojo diperkecil dari
**84px → 44px** dan tepi atasnya dipindah dari **y=10 → y=145** (tepat di bawah
border header kuis, di atas progress bar) sehingga tidak lagi menempel/menutupi
tombol kontrol atas dan tidak menutupi teks apa pun.

## Current context / assumptions

### File yang terlibat

| File | Peran |
|---|---|
| `src/features/effects/gojoFx.js` | logika murni. `gojoBallLayout(technique, vw, vh)` di **baris 466–487** (branch mobile di **474–486**) — SATU-SATUNYA sumber ukuran & posisi bola |
| `src/features/effects/GojoSpheres.jsx` | render bola. `GojoBall` membaca `layout.size`; deco label kanji (blur/stroke/glow) di **baris ~166–206** |
| `src/features/effects/gojoFx.test.js` | test murni (**49 test**). Test layout di **baris 484–530** |

Turunan otomatis (TIDAK perlu diubah): aura (`inset: -size*0.55`), charge ring,
orbit rings, teks kanji (`fontScale` 0.66), titik fokus 集中線 (`focusOf`),
vignette. Desktop (≥768px) memakai branch `!mobile` → **tidak tersentuh**.

### Kenapa draf lama salah — hasil pengukuran 390×844 (DOM asli, bukan estimasi)

| Elemen | y (px) |
|---|---|
| Tombol kontrol atas (🏪🎒👺☀️ EN/ID) | 16–48 |
| Tombol "← Back" | 48–63 |
| Teks header "Question 1 of 5" / "Score: 0" | 95–114 |
| Border bawah header (4px hitam) | 139–143 |
| Progress bar kotoba/kanji | 191–197 (fixed px; sama di 360/375/390/430) |
| Kartu soal kotoba/kanji | 237 |
| Huruf kana besar (h2) | 278–350 |

- **Kondisi sekarang:** 84px, rect `x296–380, y10–94` → menutupi tombol EN/ID
  (y16–48) & nempel tepi atas → persis keluhan **"kurang kecil sama terlalu atas"**.
- **Draf lama (64px @ y64 → y64–128):** menutupi teks "Score: 0". ❌
- **Alternatif "di bawah tombol atas" (y52–96):** celah cuma 4px/3px; di layar
  Review menutupi teks "Reviewing"/"End Review" (y56–76), di Mondai menutupi "← Back". ❌
- **Posisi baru (44px @ y145 → y145–189):** satu-satunya band bersih di kedua sisi —
  di bawah border (143), di atas progress bar (191). Divalidasi visual 5/5; kanji tetap terbaca. ✓

### Angka target (terverifikasi via node)

```
sebelum: gojoBallLayout('ao', 390,844) → 84 [x296–380, y10–94]
sesudah: gojoBallLayout('ao', 390,844) → 44 [x336–380, y145–189]
         gojoBallLayout('aka',390,844) → 44 [x10–54,  y145–189]
```

### Asumsi

- HP = lebar < 768px (`GOJO_BALL_BREAKPOINT`, sudah ada).
- Border header kuis di y139–143 & progress bar di y191–197 pada semua lebar
  <640 (diverifikasi di 360/375/390/430; berasal dari `py-12` + tombol back +
  header `pb-6 border-b-[4px]` + `mb-10` yang semuanya fixed px).
- `prefers-reduced-motion` tidak berubah perilakunya.

## Architecture / proposed approach

Semua perubahan terkonsentrasi di 2 file: (1) `gojoBallLayout()` — `size` 84→44
dan tambah `topGap = 145` (`cy = topGap + size/2`); (2) `GojoBall` — skala deco
label kanji proporsional ukuran (`decoK = min(1, size/84)`) supaya 蒼/赫 tidak
jadi blob di 44px (uji visual: deco lama = blob, deco terskala = terbaca).
Test murni diperbarui dulu (TDD), lalu implementasi, lalu verifikasi browser.

## Tasks

### T0 — Baseline (2 menit)

```bash
cd /c/Users/maddo/Documents/japanese-quiz
git status --short          # harus bersih (tidak ada perubahan menggantung)
node --test src/features/effects/gojoFx.test.js 2>&1 | tail -6
```

Expected: `ℹ tests 49 / ℹ pass 49 / ℹ fail 0`.

Sanity angka sekarang (bukti "terlalu atas"):

```bash
node -e "import('./src/features/effects/gojoFx.js').then(m => { const a = m.gojoBallLayout('ao', 390, 844); const cx = 390/2 + a.anchorXVw/100*390; const cy = 844/2 + a.anchorYVh/100*844; console.log(a.size, Math.round(cx-a.size/2), Math.round(cx+a.size/2), Math.round(cy-a.size/2), Math.round(cy+a.size/2)); })"
```

Expected: `84 296 380 10 94` ← tepi atas bola cuma 10px dari tepi layar.

### T1 — RED: perbarui test dulu (5 menit)

File: `src/features/effects/gojoFx.test.js`

**(a)** Di test `'gojoBallLayout: desktop = tepi tengah, HP = sudut atas + lebih kecil'`
(baris ~484), tambahkan setelah baris `assert.ok(m.anchorXVw > 0, 'HP ao tetap di kanan');`:

```js
  assert.equal(m.size, 44, 'HP: bola 44px (lebih kecil dari 84)');
```

dan setelah baris `const cy = 844 / 2 + (m.anchorYVh / 100) * 844;`:

```js
  assert.ok(Math.abs((cy - m.size / 2) - 145) <= 1, 'HP: tepi atas bola ≈ y145 (di bawah border header)');
```

**(b)** Ganti seluruh test `'gojoBallLayout: di HP bola tidak menutupi kartu jawaban (max-w-lg di tengah)'`
(baris ~513–530) dengan:

```js
test('gojoBallLayout: di HP bola tetap di atas progress bar & kartu jawaban', () => {
  // Terukur (360/375/390/430 × HP): border header berakhir y≈143,
  // progress bar kotoba/kanji y≈191–197, kartu soal y≈237.
  for (const [vw, vh] of [[390, 844], [360, 780], [430, 932]]) {
    for (const t of ['ao', 'aka']) {
      const L = gojoBallLayout(t, vw, vh);
      const cy = vh / 2 + (L.anchorYVh / 100) * vh;
      const bottom = cy + L.size / 2;
      assert.ok(bottom < 191, `${t} @${vw}x${vh}: bola menyentuh progress bar (bottom=${bottom.toFixed(0)})`);
      assert.ok(bottom < 237, `${t} @${vw}x${vh}: bola menutupi kartu soal`);
    }
  }
});
```

**(c)** Tambah test baru tepat di bawahnya:

```js
test('gojoBallLayout: di HP bola turun ke bawah header — tidak nempel tombol atas', () => {
  for (const [vw, vh] of [[390, 844], [360, 780], [430, 932]]) {
    const L = gojoBallLayout('ao', vw, vh);
    const cy = vh / 2 + (L.anchorYVh / 100) * vh;
    const top = cy - L.size / 2;
    assert.ok(top >= 143, `tepi atas di bawah border header (top=${top.toFixed(0)})`);
    assert.ok(L.size <= 48, `ukuran kecil (size=${L.size})`);
  }
});
```

Jalankan — harus GAGAL (fase RED):

```bash
node --test src/features/effects/gojoFx.test.js 2>&1 | tail -20
```

Expected: `ℹ tests 50 / ℹ pass 48 / ℹ fail 2` dengan pesan antara lain:
- `HP: bola 44px (lebih kecil dari 84)` → `84 !== 44`
- `tepi atas di bawah border header (top=10)` → `top=10`

### T2 — GREEN: ubah layout di `gojoFx.js` (3 menit)

File: `src/features/effects/gojoFx.js`. Ganti blok branch mobile (baris 474–486)
dari:

```js
  // HP: kecilkan + taruh di sudut atas (kanan-atas / kiri-atas).
  const size = 84;
  const margin = 10;                             // jarak dari tepi (px)
  // pusat X: nempel tepi (size/2 + margin dari tepi) → aman walau kartu lebar.
  const cx = dir > 0 ? vw - (size / 2 + margin) : (size / 2 + margin);
  // pusat Y: sudut atas (bola nempel atas, di atas kartu jawaban).
  const cy = size / 2 + margin;
```

menjadi:

```js
  // HP: kecilkan + TURUNKAN ke bawah border header (jangan nempel tombol atas).
  const size = 44;
  const margin = 10;                             // jarak dari tepi (px)
  // Tepi ATAS bola (px dari atas layar). 145 = tepat di bawah border header
  // (terukur berakhir y≈143) & di atas progress bar kotoba/kanji (y≈191).
  const topGap = 145;
  // pusat X: nempel tepi (size/2 + margin dari tepi) → aman walau kartu lebar.
  const cx = dir > 0 ? vw - (size / 2 + margin) : (size / 2 + margin);
  // pusat Y: di bawah header, di atas progress bar.
  const cy = topGap + size / 2;
```

(sisa fungsi `return { ... }` tidak berubah)

Verifikasi:

```bash
node -e "import('./src/features/effects/gojoFx.js').then(m => { const r = (L) => { const cx = 390/2 + L.anchorXVw/100*390; const cy = 844/2 + L.anchorYVh/100*844; return [L.size, Math.round(cx-L.size/2), Math.round(cx+L.size/2), Math.round(cy-L.size/2), Math.round(cy+L.size/2)].join(' '); }; console.log('ao :', r(m.gojoBallLayout('ao', 390, 844))); console.log('aka:', r(m.gojoBallLayout('aka', 390, 844))); })"
```

Expected persis:

```
ao : 44 336 380 145 189
aka: 44 10 54 145 189
```

Desktop tetap:

```bash
node -e "import('./src/features/effects/gojoFx.js').then(m => console.log(JSON.stringify(m.gojoBallLayout('ao', 1280, 800))))"
```

Expected: `{"mobile":false,"size":128,"anchorXVw":32,"anchorYVh":0}` (tidak berubah).

```bash
node --test src/features/effects/gojoFx.test.js 2>&1 | tail -6
```

Expected: `ℹ tests 50 / ℹ pass 50 / ℹ fail 0`.

Commit 1:

```bash
git add src/features/effects/gojoFx.js src/features/effects/gojoFx.test.js
git commit -m "fix(gojo): di HP bola 84→44px & turun ke bawah header (y10→145) — tidak nempel tombol atas"
```

### T3 — Skalakan deco kanji (4 menit)

Masalah: di 44px, deco lama (stroke 5px + blur 14px + glow 18/40/70px) membuat
蒼/赫 jadi blob (hasil uji visual di 390×844).

File: `src/features/effects/GojoSpheres.jsx`, fungsi `GojoBall`:

1. Setelah `const size = layout.size;` (baris ~33), tambah:

```js
  const decoK = Math.min(1, size / 84);   // deco kanji di-tune utk bola 84px → mengecil proporsional
```

2. Ganti 3 nilai di blok label (baris ~166–206):
   - `filter: 'blur(14px)',` → `` filter: `blur(${14 * decoK}px)`, ``
   - `` WebkitTextStroke: `${label.strokeWidth}px ${GOJO_INK}`, `` → `` WebkitTextStroke: `${label.strokeWidth * decoK}px ${GOJO_INK}`, ``
   - `` textShadow: `0 0 18px ${color}, 0 0 40px ${color}, 0 0 70px ${color}`, `` → `` textShadow: `0 0 ${18 * decoK}px ${color}, 0 0 ${40 * decoK}px ${color}, 0 0 ${70 * decoK}px ${color}`, ``

Hasil di HP (size 44): `decoK = 0.524` → blur 7.3px, stroke 2.6px, glow 9/21/37px
(divalidasi visual: kanji terbaca, tidak blob). Desktop (128): `decoK = 1` →
**tidak berubah**.

```bash
npm run lint
```

Expected: 0 error (keluar tanpa error).

Commit 2:

```bash
git add src/features/effects/GojoSpheres.jsx
git commit -m "fix(gojo): glow/stroke kanji 蒼/赫 diskalakan saat bola HP kecil — tidak jadi blob"
```

### T4 — Verifikasi browser: kana quiz 390×844 (5 menit)

```bash
npm run dev     # catat port yang dicetak Vite — bisa 5173, atau 5175 kalau 5173 sedang dipakai
```

1. DevTools → Console, aktifkan pack Gojo:

```js
const p = JSON.parse(localStorage.getItem('user_progress_v2') || '{}');
p.ownedPacks = Array.from(new Set([...(p.ownedPacks || []), 'pack_07']));
p.activePack = 'pack_07';
localStorage.setItem('user_progress_v2', JSON.stringify(p));
location.reload();
```

2. DevTools → device toolbar → 390×844. Practice → tab **Kana** → pilih baris
   "a" → **Start Quiz** → jawab BENAR (bola 蒼 muncul), lanjut jawab BENAR lagi
   (赫 muncul di kiri).

3. Ukur rect bola:

```js
(() => {
  const ov = document.querySelector('div[class*="z-[100]"]');
  return [...ov.querySelectorAll('div')]
    .filter(d => d.style.width && d.style.width === d.style.height && parseFloat(d.style.width) > 30)
    .map(d => { const b = d.getBoundingClientRect(); return { w: d.style.width, l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom) }; });
})()
```

Expected: `[{w:"44px", l:336, t:145, r:380, b:189}]` untuk ao; saat aka muncul:
`[{..., l:10 ...}, {l:336...}]`.

4. Cek TIDAK ada overlap: y145–189 vs tombol atas (16–48) ✓, teks header
   (95–114) ✓, border (139–143) ✓, progress bar (191) ✓. Ambil screenshot
   before/after untuk banding.

### T5 — Verifikasi browser: layar lain (5 menit)

Ulangi langkah T4 (poin 2–3) sekilas di:

- **375×667** dan **430×932** (kana) — rect bola harus tetap `t:145, b:189`.
- **Tab Kotoba** (progress bar di y191–197) — bola tidak menyentuh bar.
- **Halaman Review** (seed `item_progress_v2` dengan item `hira_a`/`hira_i`
  status `learning` → Start Review) — header hanya teks y56–76 → bola bebas.

### T6 — Gate akhir (3 menit)

```bash
node --test 2>&1 | grep -E "ℹ (tests|pass|fail)"
npm run lint
npm run build
```

Expected: `ℹ tests 152 / ℹ pass 152 / ℹ fail 0` (151 + 1 test baru); lint 0
error; `vite build` selesai tanpa error.

## Tests / validation

TDD: T1 (test baru GAGAL: `84 !== 44`, `top=10`) → T2 (implementasi → semua
PASS; sanity angka persis `44 336 380 145 189`) → T3 (deco — verifikasi visual,
tidak ada test unit untuk JSX di repo ini) → T4/T5 (browser) → T6 (gate).
2 commit kecil, **tanpa push**.

## Risks, tradeoffs, open questions

1. **Mondai chapter quiz (layar sekunder):** judul bab (y121–156) & kotak "1/4"
   (y171–213) selebar layar → bola menyentuh *tepi* kotak "1/4" & garis bawah
   judul secara kosmetik. Tidak menutupi glyph (baris itu tanpa descender) dan
   `pointer-events: none` → tidak menghalangi klik. Tradeoff diterima: posisi
   ini satu-satunya band bersih untuk layar utama (kana/kotoba/kanji/grammar/review).
2. **Lebar 640–767px** (tablet kecil & HP landscape, masih branch mobile):
   `sm:py-20` menggeser header ke y119–175 → bola (y145–189) menyentuh garis
   border header (y171–175) secara kosmetik — terverifikasi di 700×900 & HP
   landscape 667×375 (tanpa teks di bawah bola). Tidak ada penanganan khusus
   (YAGNI); jika mengganggu, tambah `topGap 177` untuk `vw >= 640`.
3. **Aura/glow & charge ring** tetap soft-bleed ke border header / progress bar
   (gradient transparan, by design — sama seperti sebelumnya).
4. **Review overview** (kartu weak items mulai ~y140): bola bisa menyentuh sudut
   kartu hanya jika user menekan "Akhiri Review" di tengah sesi (bola tidak
   di-reset saat pindah view). Kosmetik.
5. **Open question:** kalau user masih merasa "terlalu atas", tinggal naikkan
   `topGap` (mis. 200 → di bawah progress bar, di atas kartu y237) — 1 baris +
   update 1 test.

Rollback: `git revert` 2 commit di atas, atau kembalikan `size = 84`,
`cy = size / 2 + margin`, dan 3 nilai deco.
