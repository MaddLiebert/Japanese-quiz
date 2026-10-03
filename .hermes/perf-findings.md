# Heian perf — diagnosis + fix (SELESAI)

Diukur in-browser (dev server :5174, Heian aktif). Lingkungan headless punya
plafon idle ~16.7ms (60fps) & noise tinggi → pakai median + drop-count, bukan avg.

## 1. SCROLL Home berat  →  FIXED
**Sebab:** `.era-pattern` (lapisan awan `position:fixed`, full-screen) meng-animasi
`background-position` (`@keyframes heian-drift`) → **repaint seluruh viewport tiap
frame** (bukan compositor).

**Fix:** layer diperbesar 200% (`top/left:-50%`) + keyframes pindah ke
`transform: translate3d(...)` + `will-change: transform`. Digeser di compositor.

Bukti:
- sebelum (throttle 4x): avg ~69.9ms
- sesudah: desktop med 16.7ms / 1–2 drop; HP portrait (390×844 DPR3) med 16.7ms / 0 drop
- tanpa overflow horizontal (scrollWidth == clientWidth)

## 2. CINEMATIC patah-patah  →  FIXED
**Sebab:** `<motion.path>` di `SceneCapital.jsx` & `SceneKana.jsx` meng-animasi
`pathLength` SAMBIL memakai `filter="url(#hb-s1-ink|#hb-s3-ink)"`
(feTurbulence + feDisplacementMap). Filter di-raster ulang tiap frame selama
geometri path berubah → med 33.3ms (~30fps).

**Fix:** lepas `filter` dari path yang di-animasi (hapus `<filter>` + atributnya).
Catatan: `numOctaves=1` / region filter diperkecil TIDAK menolong — biangnya
animasi geometri di bawah filter, bukan ongkos filter.

Bukti: med **33.3ms → 16.7ms** (= idle/60fps); DOM terverifikasi `[filter]` = 0.

## Yang TIDAK menolong (jangan dicoba lagi)
- `content-visibility:hidden` pada app di belakang overlay → justru 33.3ms (lebih buruk).
- memperkecil region filter / menurunkan numOctaves → tetap 33.3ms.

## Guard regresi
`src/perf-heian.test.js` (node --test) mengunci:
1. `.era-pattern` pakai transform (bukan background-position) + 200%.
2. Tidak ada `motion.path` yang menggabung `pathLength` + `filter` SVG.

## Sisa (opsional, bukan penyebab utama)
- `.era-divider__band::before/::after` masih animasi `background-position`
  (`heian-cloud`, 70s) — elemen kecil; A/B tidak menunjukkan dampak terukur,
  tapi idealnya ikut dipindah ke transform kalau nanti terasa.
- Blur teks (`InkReveal`, `SceneText`) = faktor sekunder (tidak mengubah median).
