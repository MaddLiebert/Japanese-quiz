# Plan — Efek Kartu Jawaban Kuis: Pita Senam Hina (depth) + Pixel Chibi Hina

> **Status:** BRAINSTORM → siap eksekusi (belum diimplementasikan).
> **Bahasa kode & komentar:** Indonesia (mengikuti gaya repo). Nama file & variabel: Inggris/lowercase.

---

## 1. Goal (satu kalimat)

Tambahkan **dua efek baru di layar jawaban kuis** khusus pack **Kotodama Burst** (`visual: 'hina'`): **(A)** pita senam ritmik pink ala Hina yang "mengikat" kartu jawaban dengan **efek depth — sebagian pita menembus belakang kartu**, dan **(B)** **pixel-art chibi Hina** kecil di pinggir layout yang bereaksi saat menjawab.

---

## 2. Current context / assumptions

### 2.1 Karakter
Hina Chono (蝶野 雛) dari anime **Blue Box (Ao no Hako)** — **anggota tim senam ritmik**, rambut pink, double buns. Properti khasnya = **pita/ribbon senam**. Ini alasan ide "tali balet" tematik dan tepat.

### 2.2 Pack & gating (WAJIB dipatuhi)
- Pack aktif dibaca dari `useUserStats().progress.activePack`, lalu `getPack(id)`.
- Efek ini **HANYA** muncul kalau `getPack(progress.activePack)?.visual === 'hina'`.
- Pack lain (`pack_02`…`pack_06`, `ink`, `dummy`) **TIDAK BOLEH** terpengaruh (no regression).
- Suara dasar (`rightanswer.mp3` / `wronganswer.mp3`) **tidak boleh diubah**.

### 2.3 Fakta teknis repo (hasil inspeksi)
- Test runner: **`npm test` → `node --test`** (BUKAN vitest). Konvensi: modul **pure** `src/features/effects/hinaFx.js` + tes `hinaFx.test.js`. Saat ini **80 pass / 0 fail**.
- Lint: `npm run lint` → **oxlint**. Build: `npm run build` → `vite build`.
- Token warna (`src/index.css`): `--sumi-val:#1a1a1a`, `--shu-val:#d3382f`, `--kinari-val:#f3f0e8`, `--kinari-light-val:#fdfcf9`, `--matcha-val:#7d8f69`, `--ai-val:#182b49`.
- Palet pink Hina (sudah dipakai di `hinaFx.js`): `#ff4d94`, `#e0568f`.
- Overlay efek global: `src/features/effects/EffectContext.jsx` → `<div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">`. **Selalu di atas konten** → tidak bisa render di belakang kartu.
- Kartu jawaban:
  - `src/features/quiz/Quiz.jsx` (Mondai) — **satu kartu** `<motion.div className="border-[4px] border-sumi bg-kinari-light p-6 sm:p-12 shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] relative z-10 flex-1 flex flex-col justify-between">` (baris ±114–119). `isAnswered`, `selectedOption`, `currentQuestion.correctIndex` tersedia.
  - `src/pages/Practice.jsx` (kanji/kotoba/grammar) — beberapa kartu `<div className="bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] ... relative overflow-hidden">` (baris ±336, ±516, dst). `isAnswered`, `isCurrentAnswerCorrect` tersedia.
  - `src/features/quiz/KanaQuiz.jsx` — **tidak** berupa satu kartu (char besar + grid opsi) → **OUT OF SCOPE** untuk pita.
- Aset: `public/effects/*.webp` (8 file, sudah ada). **Tidak ada** aset pixel/chibi/ribbon.
- Catatan: `public/effects/Hina hasil quiz.gif` sudah ke-commit (tidak berhubungan dengan plan ini).
- Vercel = filesystem case-sensitive → **semua nama file baru lowercase** (kecuali nama komponen React `.jsx` yang sudah konvensi PascalCase). Hindari spasi di nama file.

### 2.4 Pelajaran perf yang WAJIB dipatuhi (dari commit sebelumnya)
- **JANGAN** pakai `filter: drop-shadow()` pada elemen besar yang dianimasikan tiap frame (bikin jank). Untuk bayangan pita → pakai **path salinan gelap yang di-offset** (lebih murah).
- Pakai `will-change: transform` pada elemen yang dianimasikan.
- Hormati `prefers-reduced-motion` (ada preseden di `GachaSlotOverlay.jsx`).

---

## 3. Architecture / proposed approach

**Ide B (pita, utama)** — karena overlay global selalu di atas kartu, pita **dipasang di dalam komponen kuis** lewat satu komponen reusable `HinaCardFrame` yang membungkus kartu dan merender **dua lapisan SVG**: lapisan **`z-0` (belakang kartu)** + lapisan **`z-20` (depan kartu)**, sedangkan kartu sendiri `relative z-10`. Pita = satu jalur (path) menerus yang **dipotong** di satu titik: bagian kiri (`front`) di lapisan depan, bagian kanan (`back`) di lapisan belakang → karena kartu opaque menutupi lapisan belakang, pita tampak **menembus belakang kartu**. Ketebalan tetap berapa pun ukuran kartu via `vector-effect="non-scaling-stroke"`.

**Ide A (pixel chibi, sekunder)** — chibi digambar **100% kode** sebagai grid pixel (`<rect>` SVG) dari data ASCII-grid + palet pink, tanpa aset luar. Modul pure `hinaChibi.js` (data + fungsi) diuji TDD; komponen `HinaChibi` merender & menganimasikan (idle bob; benar = lompat; salah = goyang).

Keduanya pure-helper + TDD, gating ke pack `hina`, hormati reduced-motion, dan tidak menyentuh pack lain.

---

## 4. Urutan pengerjaan yang direkomendasikan

1. **Fase 1–4 = Ide B (pita)** — self-contained, tanpa aset, dampak visual paling besar → kerjakan dulu.
2. **Fase 5–6 = Ide A (chibi)** — juga kode-only (pixel SVG), kerjakan setelah pita stabil.

Setiap fase = 1 commit. Commit style repo: `feat(effects): ...`.

**Definition of Done tiap fase:** `npm test` pass (angka naik sesuai), `npm run lint` 0 error, `npm run build` ✓, verifikasi browser sesuai §7, 0 console error, pack lain tidak berubah.

---

## FASE 1 — Modul pure `hinaRibbon.js` + tes (TDD)

### Task 1.1 — Tulis tes yang GAGAL dulu
**File baru:** `src/features/effects/hinaRibbon.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HINA_RIBBON_COLORS, hinaRibbonColors,
  HINA_RIBBON_KINDS, hinaRibbonSegments, HINA_RIBBON_VIEWBOX,
  HINA_RIBBON_STROKE,
} from './hinaRibbon.js';

test('hinaRibbonColors: 3 jenis + fallback ke correct', () => {
  assert.deepEqual(Object.keys(HINA_RIBBON_COLORS).sort(), ['correct', 'streak', 'wrong']);
  assert.equal(hinaRibbonColors('nope'), HINA_RIBBON_COLORS.correct);
  for (const k of HINA_RIBBON_KINDS) {
    const c = hinaRibbonColors(k);
    for (const key of ['base', 'light', 'edge']) {
      assert.match(c[key], /^#[0-9a-f]{6}$/i, `${k}.${key} harus hex 6 digit`);
    }
  }
});

test('hinaRibbonSegments: front/back/bow ada, dan tiap jenis unik', () => {
  const seen = new Set();
  for (const k of HINA_RIBBON_KINDS) {
    const s = hinaRibbonSegments(k);
    assert.ok(s.front.startsWith('M'), 'front harus path M...');
    assert.ok(s.back.startsWith('M'), 'back harus path M...');
    assert.ok(s.bow.startsWith('M'), 'bow harus path M...');
    assert.notEqual(s.front, s.back);
    seen.add(`${s.front}|${s.back}|${s.bow}`);
  }
  assert.equal(seen.size, 3, 'tiap jenis punya geometri berbeda');
});

test('hinaRibbonSegments: fallback = correct', () => {
  assert.deepEqual(hinaRibbonSegments('nope'), hinaRibbonSegments('correct'));
});

test('konstanta: viewBox & stroke wajar', () => {
  assert.match(HINA_RIBBON_VIEWBOX, /^0 0 \d+ \d+$/);
  assert.ok(HINA_RIBBON_STROKE.width > HINA_RIBBON_STROKE.highlight);
  assert.ok(HINA_RIBBON_STROKE.highlight > 0);
});
```

**Jalankan (harus GAGAL — file belum ada):**
```bash
cd /c/Users/maddo/Documents/japanese-quiz
npm test 2>&1 | grep -E "hinaRibbon|ℹ (tests|pass|fail)"
```
**Expected:** muncul error `Cannot find module './hinaRibbon.js'` (atau test file gagal load); `fail` > 0.

### Task 1.2 — Implementasi minimal
**File baru:** `src/features/effects/hinaRibbon.js`

```js
// ─────────────────────────────────────────────────────────────────────────────
// Pita senam ritmik Hina Chono — untuk "mengikat" kartu jawaban kuis.
// Modul PURE (tanpa React) supaya bisa dites dengan `node --test`.
//
// Trik depth: pita = satu jalur menerus yang DIPOTONG di satu titik.
//   - `front` → digambar di DEPAN kartu (lapisan z-20)
//   - `back`  → digambar di BELAKANG kartu (lapisan z-0, tertutup badan kartu)
// Sambungan ada persis di titik potong → pita tampak menembus belakang kartu.
//   - `bow`   → simpul pita di depan (z-20)
// Koordinat mengikuti HINA_RIBBON_VIEWBOX (0..400). Titik potong ± x=250.
// ─────────────────────────────────────────────────────────────────────────────

// Palet pink Hina (selaras hinaFx.js) + terang/gelap untuk sisi pita.
export const HINA_RIBBON_COLORS = {
  correct: { base: '#ff4d94', light: '#ffd0e4', edge: '#c92f6f' },
  wrong:   { base: '#e0568f', light: '#f6c9da', edge: '#a83a66' },
  streak:  { base: '#ff4d94', light: '#ffe0ee', edge: '#d4af37' },
};

export const hinaRibbonColors = (kind) => HINA_RIBBON_COLORS[kind] || HINA_RIBBON_COLORS.correct;

export const HINA_RIBBON_KINDS = ['correct', 'wrong', 'streak'];

// viewBox tetap; SVG direntang `preserveAspectRatio="none"` + `vector-effect:
// non-scaling-stroke` → ketebalan pita tetap walau ukuran kartu berbeda.
export const HINA_RIBBON_VIEWBOX = '0 0 400 400';

export const HINA_RIBBON_STROKE = { width: 14, highlight: 4, shadow: 16 };

// Titik sambung front→back selalu di akhir `front` = awal `back`.
const SEGMENTS = {
  correct: {
    // masuk dari kiri-atas, melintang ke kanan-tengah (depan)
    front: 'M -20 70 C 90 24, 190 34, 250 96',
    // lanjut ke kanan-bawah MENEMBUS BELAKANG kartu lalu keluar
    back:  'M 250 96 C 300 150, 330 200, 420 300',
    // simpul pita di kiri-atas (depan)
    bow:   'M -20 70 C 26 104, 66 58, 104 88 C 132 110, 116 152, 78 146 C 44 140, 16 112, -20 122',
  },
  wrong: {
    // pita melorot: masuk kiri-atas lalu jatuh (depan)
    front: 'M -20 40 C 80 58, 170 108, 236 176',
    back:  'M 236 176 C 270 214, 300 280, 420 400',
    bow:   'M -20 40 C 22 74, 60 36, 96 64 C 120 84, 106 122, 70 116 C 38 110, 12 84, -20 92',
  },
  streak: {
    // pita lebih megah: lengkung naik dulu (depan)
    front: 'M -20 100 C 70 16, 190 16, 250 92',
    back:  'M 250 92 C 300 150, 340 230, 420 340',
    bow:   'M -20 100 C 16 140, 66 86, 106 114 C 136 136, 120 182, 80 174 C 42 166, 14 134, -20 144',
  },
};

export const hinaRibbonSegments = (kind) => SEGMENTS[kind] || SEGMENTS.correct;
```

**Jalankan (harus PASS):**
```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
```
**Expected:** `ℹ tests 84`, `ℹ pass 84`, `ℹ fail 0`.

### Task 1.3 — Commit
```bash
git add src/features/effects/hinaRibbon.js src/features/effects/hinaRibbon.test.js
git commit -m "feat(effects): geometri pita senam Hina (pure helper + tes)"
```

---

## FASE 2 — Komponen `HinaCardFrame.jsx` (pita depth)

### Task 2.1 — Buat komponen
**File baru:** `src/features/effects/HinaCardFrame.jsx`

```jsx
import { motion } from 'motion/react';
import { useUserStats } from '../progress/ProgressContext';
import { getPack } from '../packs/packs';
import {
  hinaRibbonColors, hinaRibbonSegments,
  HINA_RIBBON_VIEWBOX, HINA_RIBBON_STROKE,
} from './hinaRibbon';

// Bungkus kartu jawaban: pita Hina "mengikat" kartu dengan efek DEPTH.
//   - lapisan z-0  → segmen `back`  (tertutup badan kartu → seolah menembus belakang)
//   - kartu        → WAJIB `relative z-10`
//   - lapisan z-20 → segmen `front` + `bow` (menimpa kartu)
// HANYA aktif kalau pack aktif = Kotodama Burst (visual 'hina').
// Struktur wrapper SELALU sama (tidak berubah saat aktif/non-aktif) → tanpa layout shift.
const reduceMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function RibbonPath({ d, color, width, opacity = 1, delay = 0, shadow = false, reduce }) {
  const paths = [];
  if (shadow) {
    // Bayangan = path salinan gelap yang di-offset (BUKAN filter: drop-shadow → hemat perf).
    paths.push(
      <motion.path
        key="shadow"
        d={d} fill="none" stroke="rgba(26,26,26,0.22)" strokeWidth={HINA_RIBBON_STROKE.shadow}
        strokeLinecap="round" vectorEffect="non-scaling-stroke" transform="translate(3 4)"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
      />,
    );
  }
  paths.push(
    <motion.path
      key="base"
      d={d} fill="none" stroke={color} strokeWidth={width}
      strokeLinecap="round" vectorEffect="non-scaling-stroke"
      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
      transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    />,
  );
  return paths;
}

export function HinaCardFrame({ active = false, kind = 'correct', className = '', children }) {
  const { progress } = useUserStats();
  const isHina = getPack(progress.activePack)?.visual === 'hina';
  const show = isHina && active;

  const c = hinaRibbonColors(kind);
  const seg = hinaRibbonSegments(kind);
  const reduce = reduceMotion();

  const svgProps = {
    viewBox: HINA_RIBBON_VIEWBOX,
    preserveAspectRatio: 'none',
    className: 'absolute inset-0 w-full h-full overflow-visible',
  };

  return (
    <div className={`relative isolate ${className}`}>
      {show && (
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <svg {...svgProps}>
            {RibbonPath({ d: seg.back, color: c.base, width: HINA_RIBBON_STROKE.width, reduce })}
          </svg>
        </div>
      )}

      {children /* kartu harus `relative z-10` */}

      {show && (
        <div className="absolute inset-0 z-20 pointer-events-none" aria-hidden="true">
          <svg {...svgProps}>
            {RibbonPath({ d: seg.front, color: c.base, width: HINA_RIBBON_STROKE.width, shadow: true, reduce })}
            {RibbonPath({ d: seg.front, color: c.light, width: HINA_RIBBON_STROKE.highlight, opacity: 0.85, delay: 0.05, reduce })}
            {RibbonPath({ d: seg.bow, color: c.base, width: HINA_RIBBON_STROKE.width, shadow: true, reduce })}
            {RibbonPath({ d: seg.bow, color: c.light, width: HINA_RIBBON_STROKE.highlight, opacity: 0.85, delay: 0.05, reduce })}
          </svg>
        </div>
      )}
    </div>
  );
}
```

> Catatan: `RibbonPath(...)` dipanggil sebagai fungsi (bukan `<RibbonPath/>`) karena ia hanya mengembalikan array elemen — sah di React. Kalau lint mengeluh, ubah jadi komponen biasa `<RibbonPath ... />` dan render `{paths}` di dalamnya.

**Verifikasi cepat (harus lolos):**
```bash
npm run lint 2>&1 | tail -5
npm run build 2>&1 | grep -iE "built in|error"
```
**Expected:** lint 0 error; build `✓ built in Xs`.

### Task 2.2 — Commit
```bash
git add src/features/effects/HinaCardFrame.jsx
git commit -m "feat(effects): HinaCardFrame — pita Hina mengikat kartu (depth 2 lapis)"
```

---

## FASE 3 — Integrasi ke `src/features/quiz/Quiz.jsx` (Mondai)

### Task 3.1 — Import
Sisipkan setelah baris `import { useEffectLayer } from "../effects/EffectContext";`:
```jsx
import { HinaCardFrame } from "../effects/HinaCardFrame";
```

### Task 3.2 — Hitung `isCorrectAnswer` + bungkus kartu
Ganti blok `<motion.div key={currentQuestionIndex} … >` (baris ±114) menjadi **dibungkus** `HinaCardFrame`. Tepat setelah `if (!currentQuestion) return null;` tambahkan:

```jsx
  const isCorrectAnswer = selectedOption === currentQuestion.correctIndex;
```

Lalu ubah pembuka kartu menjadi:

```jsx
      {/* Question Card — dibungkus pita Hina (depth) */}
      <HinaCardFrame
        active={isAnswered}
        kind={isCorrectAnswer ? 'correct' : 'wrong'}
        className="flex-1 flex flex-col"
      >
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-[4px] border-sumi bg-kinari-light p-6 sm:p-12 shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] relative z-10 flex-1 flex flex-col justify-between"
        >
```

Dan **tutup** `</HinaCardFrame>` tepat setelah `</motion.div>` penutup kartu (baris ±230), sebelum `</div>` halaman:

```jsx
        </motion.div>
      </HinaCardFrame>
    </div>
  );
```

> **Penting:** kelas `flex-1 flex flex-col` HARUS tetap ada di `HinaCardFrame` supaya kartu masih mengisi tinggi layar seperti sebelumnya (frame jadi flex-child, kartu `flex-1` di dalam frame).

### Task 3.3 — Verifikasi build
```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
npm run lint 2>&1 | tail -3
npm run build 2>&1 | grep -iE "built in|error"
```
**Expected:** `ℹ tests 84 / pass 84 / fail 0`; lint 0 error; build ✓.

### Task 3.4 — Verifikasi browser (lihat §7 untuk skrip lengkap)
Buka `/mondai` → mulai quiz → jawab. **Expected:** setelah menjawab, pita pink muncul "mengikat" kartu; pada titik di tengah kartu `document.elementFromPoint()` mengembalikan **kartu** (bukan pita) → membuktikan pita belakang tertutup.

### Task 3.5 — Commit
```bash
git add src/features/quiz/Quiz.jsx
git commit -m "feat(effects): pita Hina mengikat kartu jawaban di Quiz Mondai"
```

---

## FASE 4 — Integrasi ke `src/pages/Practice.jsx` (kanji/kotoba/grammar)

### Task 4.1 — Import
Sisipkan setelah `import { HinaResultSticker } from "../features/effects/HinaResultSticker";`:
```jsx
import { HinaCardFrame } from "../features/effects/HinaCardFrame";
```

### Task 4.2 — Bungkus TIAP kartu pertanyaan
Di `Practice.jsx` ada beberapa varian kartu pertanyaan (kanji ±336, kotoba/grammar ±516, dan varian lain di blok render). Untuk **setiap** kartu pertanyaan, lakukan pola berikut:

**Sebelum:**
```jsx
<motion.div key={currentQuestion.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }} className="w-full max-w-lg mb-8">
  <div className="bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] p-8 sm:p-12 flex flex-col items-center gap-4 relative overflow-hidden">
    {/* … isi kartu … */}
  </div>
</motion.div>
```

**Sesudah:**
```jsx
<motion.div key={currentQuestion.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }} className="w-full max-w-lg mb-8">
  <HinaCardFrame active={isAnswered} kind={isCurrentAnswerCorrect ? 'correct' : 'wrong'}>
    <div className="bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] p-8 sm:p-12 flex flex-col items-center gap-4 relative overflow-hidden z-10">
      {/* … isi kartu (JANGAN diubah) … */}
    </div>
  </HinaCardFrame>
</motion.div>
```

Aturan saat membungkus:
1. `HinaCardFrame` = anak langsung dari `<motion.div …>` yang sudah ada (jangan ubah `key`/animasi motion itu).
2. Pada `<div>` kartu (yang punya `bg-kinari border-[4px]`), **tambahkan `z-10`** (kartu sudah `relative`; cukup tambah `z-10`).
3. `kind` = `isCurrentAnswerCorrect ? 'correct' : 'wrong'`. (`isCurrentAnswerCorrect` sudah tersedia di Practice; kalau di blok tertentu namanya beda, pakai `isAnswered && <jawaban benar>`.)
4. Pastikan pasangan tag `</HinaCardFrame>` menutup tepat sebelum `</motion.div>`.

> Jika ada kartu yang **bukan** pertanyaan (mis. kartu ringkasan hasil), **JANGAN** dibungkus.

### Task 4.3 — Verifikasi
```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
npm run lint 2>&1 | tail -3
npm run build 2>&1 | grep -iE "built in|error"
```
**Expected:** `84 / 84 / 0`, lint 0, build ✓.

Lalu di browser (`/practice` → A Row → jawab): pita muncul di kartu, tidak mengganggu grid opsi, `elementFromPoint` di tengah kartu = kartu.

### Task 4.4 — Commit
```bash
git add src/pages/Practice.jsx
git commit -m "feat(effects): pita Hina mengikat kartu jawaban di Practice (kanji/kotoba/grammar)"
```

---

## FASE 5 — Modul pure `hinaChibi.js` + tes (TDD)

### Task 5.1 — Tulis tes yang GAGAL dulu
**File baru:** `src/features/effects/hinaChibi.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HINA_CHIBI_PALETTE, HINA_CHIBI_PIXELS, hinaChibiRects,
  HINA_CHIBI_ROWS, HINA_CHIBI_COLS, HINA_CHIBI_PX,
  HINA_CHIBI_W, HINA_CHIBI_H,
} from './hinaChibi.js';

test('grid pixel: semua baris sama panjang & karakternya dikenal palet', () => {
  assert.ok(HINA_CHIBI_ROWS >= 8, 'minimal 8 baris');
  for (const row of HINA_CHIBI_PIXELS) {
    assert.equal(row.length, HINA_CHIBI_COLS, 'semua baris harus sama panjang');
    for (const ch of row) {
      assert.ok(ch in HINA_CHIBI_PALETTE, `karakter tak dikenal: "${ch}"`);
    }
  }
});

test('ukuran: kelipatan bulat (biar crisp, bukan blur)', () => {
  assert.equal(HINA_CHIBI_W, HINA_CHIBI_COLS * HINA_CHIBI_PX);
  assert.equal(HINA_CHIBI_H, HINA_CHIBI_ROWS * HINA_CHIBI_PX);
  assert.ok(Number.isInteger(HINA_CHIBI_PX) && HINA_CHIBI_PX > 0);
});

test('hinaChibiRects: jumlah = pixel non-transparan, koordinat dalam batas', () => {
  const rects = hinaChibiRects();
  const opaque = HINA_CHIBI_PIXELS.join('').split('').filter((c) => HINA_CHIBI_PALETTE[c]).length;
  assert.equal(rects.length, opaque);
  assert.ok(rects.length > 0);
  for (const r of rects) {
    assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= HINA_CHIBI_W && r.y + r.h <= HINA_CHIBI_H);
    assert.match(r.color, /^#[0-9a-f]{6}$/i);
  }
});

test('deterministik', () => {
  assert.deepEqual(hinaChibiRects(), hinaChibiRects());
});
```

**Jalankan (harus GAGAL):**
```bash
npm test 2>&1 | grep -E "hinaChibi|ℹ (tests|pass|fail)"
```
**Expected:** gagal load modul `./hinaChibi.js`.

### Task 5.2 — Implementasi
**File baru:** `src/features/effects/hinaChibi.js`

```js
// ─────────────────────────────────────────────────────────────────────────────
// Pixel-art chibi Hina Chono — digambar 100% dari data (tanpa aset luar).
// Modul PURE (tanpa React) supaya bisa dites dengan `node --test`.
// Tiap karakter grid = 1 kunci palet; '.' = transparan.
// ─────────────────────────────────────────────────────────────────────────────

export const HINA_CHIBI_PALETTE = {
  '.': null,       // transparan
  H: '#ff4d94',    // rambut pink (terang)
  h: '#e0568f',    // rambut pink (gelap/bayangan)
  S: '#ffe3c2',    // kulit
  E: '#3a2a2a',    // mata
  M: '#d94a86',    // pipi/mulut
  W: '#fdfcf9',    // putih (baju/kilau)
  B: '#182b49',    // aksen seragam (biru)
};

// 12 kolom × 14 baris. Dapat diubah bebas selama tes tetap lolos
// (semua baris sama panjang & karakter ada di palet).
export const HINA_CHIBI_PIXELS = [
  '....HHHH....',
  '..HHHHHHHH..',
  '.HHhHHHHhHH.',
  '.HHSSSSSSHH.',
  '.HHSESSESHH.',
  '.HHSSMMSSHH.',
  '..HSSSSSSH..',
  '...HSSSSH...',
  '..WWWWWWWW..',
  '.WWBBBBBBWW.',
  '.WWBBBBBBWW.',
  '..WWWWWWWW..',
  '...WW..WW...',
  '..SS....SS..',
];

export const HINA_CHIBI_PX = 6;                                 // ukuran 1 pixel (px)
export const HINA_CHIBI_ROWS = HINA_CHIBI_PIXELS.length;        // 14
export const HINA_CHIBI_COLS = HINA_CHIBI_PIXELS[0].length;     // 12
export const HINA_CHIBI_W = HINA_CHIBI_COLS * HINA_CHIBI_PX;    // 72
export const HINA_CHIBI_H = HINA_CHIBI_ROWS * HINA_CHIBI_PX;    // 84

export const hinaChibiRects = () => {
  const out = [];
  HINA_CHIBI_PIXELS.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = HINA_CHIBI_PALETTE[ch];
      if (!color) return;
      out.push({ x: x * HINA_CHIBI_PX, y: y * HINA_CHIBI_PX, w: HINA_CHIBI_PX, h: HINA_CHIBI_PX, color });
    });
  });
  return out;
};
```

**Jalankan (harus PASS):**
```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
```
**Expected:** `ℹ tests 88`, `ℹ pass 88`, `ℹ fail 0`.

### Task 5.3 — Commit
```bash
git add src/features/effects/hinaChibi.js src/features/effects/hinaChibi.test.js
git commit -m "feat(effects): pixel chibi Hina (grid + helper, tanpa aset luar)"
```

---

## FASE 6 — Komponen `HinaChibi.jsx` + mount

### Task 6.1 — Buat komponen
**File baru:** `src/features/effects/HinaChibi.jsx`

```jsx
import { motion } from 'motion/react';
import { useUserStats } from '../progress/ProgressContext';
import { getPack } from '../packs/packs';
import { hinaChibiRects, HINA_CHIBI_W, HINA_CHIBI_H } from './hinaChibi';

// Chibi pixel Hina di pinggir layout. HANYA pack Kotodama Burst (visual 'hina').
//   - idle (belum menjawab) → bob naik-turun pelan, loop
//   - benar  → lompat kecil (overshoot pop)
//   - salah  → goyang kepala
export function HinaChibi({ active = false, kind = 'correct', className = '' }) {
  const { progress } = useUserStats();
  const isHina = getPack(progress.activePack)?.visual === 'hina';
  if (!isHina) return null;

  const rects = hinaChibiRects();
  const wrong = kind === 'wrong';

  return (
    <motion.svg
      viewBox={`0 0 ${HINA_CHIBI_W} ${HINA_CHIBI_H}`}
      width={HINA_CHIBI_W}
      height={HINA_CHIBI_H}
      shapeRendering="crispEdges"
      className={`select-none pointer-events-none ${className}`}
      style={{ willChange: 'transform' }}
      aria-hidden="true"
      animate={
        active
          ? wrong
            ? { rotate: [0, -9, 9, -6, 0], y: 0 }
            : { y: [0, -10, 0], scale: [1, 1.08, 1] }
          : { y: [0, -2, 0] }
      }
      transition={
        active
          ? wrong
            ? { duration: 0.5, ease: 'easeOut' }
            : { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }
          : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.color} />
      ))}
    </motion.svg>
  );
}
```

### Task 6.2 — Mount di `Quiz.jsx`
Tambahkan import:
```jsx
import { HinaChibi } from "../effects/HinaChibi";
```
Lalu sisipkan di dalam `<div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col relative">`, **tepat sebelum** `{/* Question Card */}`:

```jsx
      {/* Pixel chibi Hina di pinggir kiri layout (desktop saja) */}
      <div className="hidden md:block absolute left-1 bottom-24 z-20">
        <HinaChibi active={isAnswered} kind={isCorrectAnswer ? 'correct' : 'wrong'} />
      </div>
```

> Posisi (`left-1 bottom-24`) = titik awal; **tune** di browser supaya tidak menabrak kartu/teks. Alternatif: `-left-2 top-40`.

### Task 6.3 — Mount di `Practice.jsx` (opsional, konsisten)
Sama seperti Task 6.2, sisipkan di dalam kontainer halaman Practice (`relative`), mis.:
```jsx
      <div className="hidden md:block absolute left-1 bottom-24 z-20">
        <HinaChibi active={isAnswered} kind={isCurrentAnswerCorrect ? 'correct' : 'wrong'} />
      </div>
```

### Task 6.4 — Verifikasi
```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
npm run lint 2>&1 | tail -3
npm run build 2>&1 | grep -iE "built in|error"
```
**Expected:** `88 / 88 / 0`, lint 0, build ✓.

### Task 6.5 — Commit
```bash
git add src/features/effects/HinaChibi.jsx src/features/quiz/Quiz.jsx src/pages/Practice.jsx
git commit -m "feat(effects): pixel chibi Hina di pinggir layout kuis (reaktif jawaban)"
```

---

## 7. Tests / validation — verifikasi browser (WAJIB, jangan menebak)

### 7.1 Nyalakan dev server
```bash
cd /c/Users/maddo/Documents/japanese-quiz
npm run dev > /tmp/vite_hina.log 2>&1 &
sleep 7; grep -iE "ready in|error" /tmp/vite_hina.log | head -3
curl -s -o /dev/null -w "app=%{http_code}\n" http://localhost:5173/
```
**Expected:** `ready in Xms`, `app=200`.

### 7.2 Seed pack (GOTCHA: `activePack` sering reset ke `null` di sesi otomasi — WAJIB seed tiap kali)
Jalankan di browser:
```js
(() => {
  const p = JSON.parse(localStorage.getItem('user_progress_v2') || '{}');
  p.ownedPacks = ['kotodama_burst'];
  p.activePack = 'kotodama_burst';
  localStorage.setItem('user_progress_v2', JSON.stringify(p));
  return p.activePack;
})()
```
**Expected:** `'kotodama_burst'`. Lalu reload halaman.

### 7.3 Uji "pita menembus belakang kartu" (bukti objektif)
Setelah menjawab (pita muncul), jalankan:
```js
(() => {
  const back = document.querySelector('.z-0 svg');       // lapisan pita belakang
  const front = document.querySelector('.z-20 svg');      // lapisan pita depan
  const card = document.querySelector('.bg-kinari.border-\\[4px\\]') ||
               document.querySelector('.bg-kinari-light.border-\\[4px\\]');
  const r = card.getBoundingClientRect();
  const hitCenter = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return JSON.stringify({
    adaPitaBelakang: !!back,
    adaPitaDepan: !!front,
    kartuDiTengahTitik: hitCenter === card || card.contains(hitCenter),  // HARUS true
    jumlahPathPita: document.querySelectorAll('svg path').length,
  });
})()
```
**Expected:** `adaPitaBelakang: true`, `adaPitaDepan: true`, `kartuDiTengahTitik: true` (pita belakang **tertutup** kartu), `jumlahPathPita >= 6`.
> Kalau `kartuDiTengahTitik: false` → berarti lapisan `z-0` tidak di belakang kartu → cek: kartu punya `relative z-10`? frame punya `isolate`? DOM urutan: back div sebelum kartu?

### 7.4 Uji chibi
```js
(() => {
  const svg = [...document.querySelectorAll('svg')].find(s => s.querySelectorAll('rect').length > 10);
  if (!svg) return 'CHIBI TIDAK ADA';
  const rects = svg.querySelectorAll('rect');
  return JSON.stringify({
    jumlahPixel: rects.length,
    shapeRendering: getComputedStyle(svg).shapeRendering,
    warna: [...new Set([...rects].map(r => r.getAttribute('fill')))].slice(0, 6),
  });
})()
```
**Expected:** `jumlahPixel` > 40; `shapeRendering: 'crispEdges'`; warna termasuk `#ff4d94` (pink Hina).

### 7.5 Uji no-regression pack lain
Seed `activePack='pack_02'`, reload, jawab quiz.
```js
document.querySelectorAll('svg path').length  // pita
```
**Expected:** **0** path pita (tidak ada pita) dan chibi `null` → pack lain aman.

### 7.6 Cek console error & screenshot
- Setelah semua aksi, pastikan `window.__errs` kosong / DevTools console **0 error**.
- Ambil screenshot & inspeksi visual: pita terlihat "mengikat" kartu, bagian kanan menghilang di belakang kartu; chibi di pinggir.

### 7.7 Gates akhir
```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
npm run lint 2>&1 | tail -3
npm run build 2>&1 | grep -iE "built in|error"
```
**Expected:** `88 pass / 0 fail`, lint 0 error, build ✓.

### 7.8 Matikan dev server
```bash
# cari PID node vite lalu matikan (Windows)
taskkill //F //PID <pid> 2>/dev/null; echo done
```

---

## 8. Risks, tradeoffs, open questions

### Risiko & mitigasi
1. **`preserveAspectRatio="none"` mendistorsi bentuk pita** (kartu bukan persegi → sudut jalur berubah). *Mitigasi:* `vector-effect="non-scaling-stroke"` menjaga ketebalan; desain jalur dibuat dominan diagonal agar distorsi minim. Kalau jelek → ukur ukuran kartu via `ResizeObserver` lalu generate path proporsional (tambah kerja, YAGNI dulu).
2. **Pita terpotong / ketutup ancestor** (`overflow-hidden` pada kontainer). *Mitigasi:* frame tidak `overflow-hidden`; verifikasi di browser; kalau ada ancestor memotong, tambahkan `overflow-visible` pada kontainer terkait.
3. **Jank**: jangan pakai `filter: drop-shadow` (sudah dihindari via path bayangan offset). Animasi hanya `pathLength` + transform kecil.
4. **z-index bocor** mengganggu elemen lain → frame memakai `isolate` (stacking context terpisah) + kartu `z-10`.
5. **Layout shift** saat pita muncul → wrapper frame selalu ada (struktur DOM tetap).
6. **Pack lain kena** → gating `visual === 'hina'` + uji §7.5.
7. **`motion` versi** — kalau `pathLength`/`useReducedMotion` bermasalah, ganti `pathLength` dengan animasi `strokeDashoffset` manual dan pakai pola `window.matchMedia` (sudah dipakai di plan ini, aman).
8. **Chibi terlihat "murahan"/salah tempat** → koordinat grid & posisi mudah diubah (data-driven); bisa juga ganti ke sprite PNG di `public/effects/chibi/` bila user menyediakan (lihat open questions).

### Tradeoff
- Pita di 2 lapisan = 2× render SVG (kecil, ~6 path) → dampak perf dapat diabaikan, tapi tetap ukur FPS sebelum/sesudah (target: tidak melebihi baseline idle ±19ms).
- Ide A memakai pixel SVG kode → tidak butuh aset, tapi gaya pixel terbatas (bukan artwork anime asli).

### Open questions (butuh keputusan user sebelum/selama eksekusi)
1. **Chibi**: pakai **pixel SVG kode** (default, tanpa aset) atau kamu sediakan **sprite PNG** pixel-art Hina? (Kalau PNG: taruh di `public/effects/chibi/hina-chibi.png`, komponen ganti ke `<img>` + `image-rendering: pixelated`.)
2. **Posisi chibi**: di **samping kartu** (default) atau **pojok viewport** (fixed kanan-bawah)?
3. **Pita**: muncul **hanya setelah menjawab** (default) atau **selalu ada** (mengikat terus, lebih hidup tapi bisa mengganggu)?
4. **Scope pita**: cukup **Quiz.jsx** saja (paling rapi) atau sekalian **Practice.jsx** (kanji/kotoba/grammar)?
5. **Streak**: pita gaya `streak` (lebih megah) perlu dipakai saat milestone, atau cukup `correct`/`wrong` dulu?
6. Setelah selesai: **push** semua commit ke remote? (Saat ini ±8 commit belum di-push.)
