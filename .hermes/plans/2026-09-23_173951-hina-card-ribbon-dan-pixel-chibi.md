# Plan — Kartu Jawaban Kuis "Diikat" Pita Hina (depth) + Pixel Chibi Hina Duduk di Pojok Kartu

> **Status:** keputusan user sudah dikunci → siap eksekusi (belum ada kode diubah).
> **Supersedes:** `.hermes/plans/2026-09-23_172746-hina-card-ribbon-dan-pixel-chibi.md` (versi lama, sudah ada keputusan user).
> **Bahasa:** komentar & UI teks Indonesia; nama file/variabel Inggris lowercase.

---

## 0. Keputusan user (FINAL — jangan ditawar lagi)

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Aset chibi | **SVG saja** — pixel-art digambar dari data kode, **tanpa file aset** |
| 2 | Posisi chibi | **Di pojok kartu, terlihat seperti "duduk" di atas kartu** (nempel di tepi/sudut kartu) |
| 3 | Kapan pita muncul | **SELALU** (selama pack Hina aktif), bukan cuma setelah menjawab |
| 4 | Scope | **SEMUA** layar kuis: `Quiz.jsx` (Mondai), `Practice.jsx` (kanji/kotoba/grammar), `KanaQuiz.jsx` |
| 5 | Gaya pita | **Gaya `streak` lebih megah**, dipakai saat streak/milestone |
| 6 | KanaQuiz "kartu" | **Opsi A** — grid opsi dijadikan kartu (dibungkus `HinaCardFrame`) |
| 7 | Pojok chibi | **Kiri-atas** (`-top-6 -left-4`) |
| 8 | Push | **JANGAN push dulu** — berhenti setelah commit lokal & verifikasi |

### Konsekuensi arsitektur dari keputusan ini (penting)
- Karena **#2 (chibi duduk di pojok kartu)** dan **#3 (pita selalu)** → pita **dan** chibi harus hidup **di dalam bingkai kartu**, bukan di overlay global. Karena itu dibuat **satu komponen `HinaCardFrame`** yang: membungkus kartu, merender pita 2 lapis (belakang+depan), **dan** merender chibi di pojok. Halaman kuis hanya perlu **membungkus kartunya** dengan komponen ini → minim perubahan di 3 file.
- Karena **#5 (pita gaya streak saat milestone)**, `HinaCardFrame` butuh tahu "jawaban terakhir itu streak/benar/salah" → **`EffectContext` di-extend** mengekspos `fxKind` (perubahan satu baris).

---

## 1. Goal (satu kalimat)

Tambahkan, khusus pack **Kotodama Burst** (`visual: 'hina'`), **pita senam pink Hina yang selalu mengikat kartu jawaban dengan efek depth (sebagian pita menembus belakang kartu, gaya lebih megah saat streak)** + **pixel chibi Hina (SVG kode) yang duduk di pojok kartu dan bereaksi saat menjawab**, di semua layar kuis.

---

## 2. Current context / assumptions

### 2.1 Karakter
Hina Chono (蝶野 雛, *Blue Box / Ao no Hako*) — **atlet senam ritmik**, rambut pink double buns. Pita/ribbon = properti khasnya → tema ini tepat.

### 2.2 Gating pack (WAJIB)
- Baca `useUserStats().progress.activePack` → `getPack(id)` → cek `?.visual === 'hina'`.
- HANYA pack Hina yang dapat efek. `pack_02`…`pack_06` (`dummy`) & `ink` **tidak boleh** berubah.
- Suara dasar (`rightanswer.mp3` / `wronganswer.mp3`) **tidak disentuh**.

### 2.3 Fakta teknis repo (hasil inspeksi)
- Test: `npm test` → **`node --test`** (bukan vitest). Konvensi: modul **pure** `src/features/effects/hinaFx.js` + tes `hinaFx.test.js`. Baseline **80 pass / 0 fail**.
- Lint `npm run lint` (oxlint) · Build `npm run build` (vite).
- Token warna (`src/index.css`): `--sumi-val:#1a1a1a`, `--kinari-val:#f3f0e8`, `--kinari-light-val:#fdfcf9`, `--shu-val:#d3382f`, `--matcha-val:#7d8f69`, `--ai-val:#182b49`. Pink Hina (dipakai `hinaFx.js`): `#ff4d94`, `#e0568f`.
- Overlay efek global `src/features/effects/EffectContext.jsx` = `fixed inset-0 z-[100]` → **selalu di atas kartu** → **tidak** dipakai untuk pita (lihat §3).
- Kartu jawaban per layar:
  - `src/features/quiz/Quiz.jsx` (Mondai) — kartu tunggal `<motion.div className="border-[4px] border-sumi bg-kinari-light p-6 sm:p-12 shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] relative z-10 flex-1 flex flex-col justify-between">` (±baris 114–119).
  - `src/pages/Practice.jsx` (kanji/kotoba/grammar) — kartu pertanyaan `bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] … relative overflow-hidden` (±baris 336, ±516, dan varian lain di blok render).
  - `src/features/quiz/KanaQuiz.jsx` — **tidak ada kartu**; hanya grid opsi `<div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-lg">` (±baris 82). Ini akan **dijadikan "kartu jawaban"** (diberi permukaan opaque) lalu dibungkus frame.
- `EffectContext` saat ini: `useEffectLayer()` mengembalikan `{ triggerEffect, resetEffectStreak, active }`; provider `value={{ triggerEffect, resetEffectStreak, active }}` (±baris 213).
- Aset: `public/effects/*.webp` (8 file). **Tidak ada** aset pixel/ribbon → chibi dibuat dari kode.
- Vercel case-sensitive FS → nama file baru lowercase, tanpa spasi.

### 2.4 Pelajaran perf WAJIB (dari commit sebelumnya)
- **JANGAN** `filter: drop-shadow()` pada elemen besar yang dianimasikan → bayangan pita = **path salinan gelap yang di-offset**.
- Pakai `will-change: transform` untuk elemen yang dianimasikan.
- Hormati `prefers-reduced-motion` (preseden di `GachaSlotOverlay.jsx`).

---

## 3. Architecture / proposed approach

**`HinaCardFrame`** = pembungkus kartu yang, saat pack = Hina, merender **4 lapisan** dalam satu `<div className="relative isolate">`:
1. `z-0` — SVG pita **segmen `back`** (tertutup badan kartu yang opaque → seolah menembus belakang),
2. `children` — **kartu (WAJIB `relative z-10`)**,
3. `z-20` — SVG pita **segmen `front` + `bow`** (menimpa kartu),
4. `z-30` — **chibi pixel** di pojok **kiri-atas** kartu (`-top-6 -left-4`), seolah duduk di sudut.

> ⚠️ **Potensi tabrakan:** simpul pita (`bow`) juga berada di sisi **kiri** (x≈-20..132). Chibi di kiri-atas bisa bertumpuk dengan simpul. Jika di browser terlihat bertumpuk jelek → geser chibi ke `-top-6 -left-2` + kecilkan, **atau** geser simpul pita (ubah koordinat `bow`) lebih ke bawah/kanan. Tentukan setelah lihat hasil (§8.4).

Pita = **satu jalur menerus yang dipotong** di satu titik: akhir `front` = awal `back` → di titik itu pita "masuk" ke belakang kartu. Ketebalan konstan via `vector-effect="non-scaling-stroke"`. `HinaCardFrame` membaca `useEffectLayer().fxKind` untuk memilih gaya (`correct`/`wrong`/`streak`) dan `useUserStats()` untuk gating pack. Chibi digambar dari grid pixel (data ASCII + palet) lewat modul pure `hinaChibi.js`.

---

## FASE 1 — `hinaRibbon.js` (pure) + tes (TDD)

### Task 1.1 — Tulis tes yang GAGAL
**File baru:** `src/features/effects/hinaRibbon.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HINA_RIBBON_COLORS, hinaRibbonColors,
  HINA_RIBBON_KINDS, hinaRibbonSegments,
  HINA_RIBBON_VIEWBOX, HINA_RIBBON_STROKE,
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

test('hinaRibbonSegments: front/back/bow ada, tiap jenis unik', () => {
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

**Jalankan (harus GAGAL):**
```bash
cd /c/Users/maddo/Documents/japanese-quiz
npm test 2>&1 | grep -E "hinaRibbon|ℹ (tests|pass|fail)"
```
**Expected:** error `Cannot find module './hinaRibbon.js'`; `fail` > 0.

### Task 1.2 — Implementasi
**File baru:** `src/features/effects/hinaRibbon.js`

```js
// ─────────────────────────────────────────────────────────────────────────────
// Pita senam ritmik Hina Chono — mengikat kartu jawaban kuis.
// Modul PURE (tanpa React) → bisa dites `node --test`.
//
// Depth: pita = SATU jalur menerus yang dipotong di satu titik.
//   front → digambar DI DEPAN kartu (z-20)
//   back  → digambar DI BELAKANG kartu (z-0, tertutup badan kartu)
// Akhir `front` == awal `back` (titik potong ±x=250) → pita tampak menembus kartu.
//   bow   → simpul pita (di depan).
// Koordinat mengikuti HINA_RIBBON_VIEWBOX (0..400). Gaya `streak` lebih megah.
// ─────────────────────────────────────────────────────────────────────────────

export const HINA_RIBBON_KINDS = ['correct', 'wrong', 'streak'];

// Palet pink Hina (selaras hinaFx.js) + highlight & tepi.
export const HINA_RIBBON_COLORS = {
  correct: { base: '#ff4d94', light: '#ffd0e4', edge: '#c92f6f' },
  wrong:   { base: '#e0568f', light: '#f6c9da', edge: '#a83a66' },
  streak:  { base: '#ff4d94', light: '#ffe0ee', edge: '#d4af37' }, // megah: aksen emas
};

export const hinaRibbonColors = (kind) => HINA_RIBBON_COLORS[kind] || HINA_RIBBON_COLORS.correct;

export const HINA_RIBBON_VIEWBOX = '0 0 400 400';
export const HINA_RIBBON_STROKE = { width: 14, highlight: 4, shadow: 16 };

const SEGMENTS = {
  correct: {
    front: 'M -20 70 C 90 24, 190 34, 250 96',
    back:  'M 250 96 C 300 150, 330 200, 420 300',
    bow:   'M -20 70 C 26 104, 66 58, 104 88 C 132 110, 116 152, 78 146 C 44 140, 16 112, -20 122',
  },
  wrong: {
    front: 'M -20 40 C 80 58, 170 108, 236 176',
    back:  'M 236 176 C 270 214, 300 280, 420 400',
    bow:   'M -20 40 C 22 74, 60 36, 96 64 C 120 84, 106 122, 70 116 C 38 110, 12 84, -20 92',
  },
  streak: {
    // lebih megah: naik dulu, simpul lebih besar, lengkung lebih panjang
    front: 'M -20 120 C 60 10, 200 10, 250 92',
    back:  'M 250 92 C 305 150, 345 240, 420 350',
    bow:   'M -20 120 C 10 168, 70 96, 116 128 C 152 154, 132 208, 86 198 C 44 188, 12 152, -20 164',
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

## FASE 2 — `hinaChibi.js` (pure pixel) + tes (TDD)

### Task 2.1 — Tulis tes yang GAGAL
**File baru:** `src/features/effects/hinaChibi.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HINA_CHIBI_PALETTE, HINA_CHIBI_PIXELS, hinaChibiRects,
  HINA_CHIBI_ROWS, HINA_CHIBI_COLS, HINA_CHIBI_PX, HINA_CHIBI_W, HINA_CHIBI_H,
} from './hinaChibi.js';

test('grid: semua baris sama panjang & karakter dikenal palet', () => {
  assert.ok(HINA_CHIBI_ROWS >= 8, 'minimal 8 baris');
  for (const row of HINA_CHIBI_PIXELS) {
    assert.equal(row.length, HINA_CHIBI_COLS, 'semua baris harus sama panjang');
    for (const ch of row) assert.ok(ch in HINA_CHIBI_PALETTE, `karakter tak dikenal: "${ch}"`);
  }
});

test('ukuran kelipatan bulat (crisp, bukan blur)', () => {
  assert.equal(HINA_CHIBI_W, HINA_CHIBI_COLS * HINA_CHIBI_PX);
  assert.equal(HINA_CHIBI_H, HINA_CHIBI_ROWS * HINA_CHIBI_PX);
  assert.ok(Number.isInteger(HINA_CHIBI_PX) && HINA_CHIBI_PX > 0);
});

test('hinaChibiRects: jumlah = pixel opaque, koordinat dalam batas', () => {
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
**Expected:** gagal load `./hinaChibi.js`.

### Task 2.2 — Implementasi
**File baru:** `src/features/effects/hinaChibi.js`

```js
// ─────────────────────────────────────────────────────────────────────────────
// Pixel-art chibi Hina Chono — digambar 100% dari data kode (tanpa aset).
// Modul PURE → bisa dites `node --test`. '.' = transparan.
// ─────────────────────────────────────────────────────────────────────────────

export const HINA_CHIBI_PALETTE = {
  '.': null,      // transparan
  H: '#ff4d94',   // rambut pink (terang)
  h: '#e0568f',   // rambut pink (gelap)
  S: '#ffe3c2',   // kulit
  E: '#3a2a2a',   // mata
  M: '#d94a86',   // pipi/mulut
  W: '#fdfcf9',   // putih (baju)
  B: '#182b49',   // aksen seragam
};

// 12 kolom × 14 baris (boleh diubah selama tes tetap lolos).
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

export const HINA_CHIBI_PX = 6;
export const HINA_CHIBI_ROWS = HINA_CHIBI_PIXELS.length;
export const HINA_CHIBI_COLS = HINA_CHIBI_PIXELS[0].length;
export const HINA_CHIBI_W = HINA_CHIBI_COLS * HINA_CHIBI_PX;
export const HINA_CHIBI_H = HINA_CHIBI_ROWS * HINA_CHIBI_PX;

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

### Task 2.3 — Commit
```bash
git add src/features/effects/hinaChibi.js src/features/effects/hinaChibi.test.js
git commit -m "feat(effects): pixel chibi Hina (grid + helper, tanpa aset)"
```

---

## FASE 3 — `EffectContext`: ekspos `fxKind`

### Task 3.1 — Sisipkan `fxKind` ke value provider
**File:** `src/features/effects/EffectContext.jsx`

Cari (sekitar baris 213):
```jsx
    <EffectContext.Provider value={{ triggerEffect, resetEffectStreak, active }}>
```
Ganti menjadi:
```jsx
    <EffectContext.Provider value={{ triggerEffect, resetEffectStreak, active, fxKind: fx?.kind ?? null }}>
```

> Alasan: `HinaCardFrame` butuh tahu jawaban terakhir (`correct`/`wrong`/`streak`) untuk memilih gaya pita. `fx` sudah state di provider → aman. Value provider sudah berupa objek baru tiap render (tidak ada regresi).

### Task 3.2 — Verifikasi
```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
npm run lint 2>&1 | tail -3
npm run build 2>&1 | grep -iE "built in|error"
```
**Expected:** `88 / 88 / 0`; lint 0 error; build ✓.

### Task 3.3 — Commit
```bash
git add src/features/effects/EffectContext.jsx
git commit -m "feat(effects): EffectContext ekspos fxKind (untuk gaya pita kartu)"
```

---

## FASE 4 — Komponen `HinaChibi.jsx` + `HinaCardFrame.jsx`

### Task 4.1 — `HinaChibi.jsx`
**File baru:** `src/features/effects/HinaChibi.jsx`

```jsx
import { motion } from 'motion/react';
import { hinaChibiRects, HINA_CHIBI_W, HINA_CHIBI_H } from './hinaChibi';

// Pixel chibi Hina. Gating pack dilakukan oleh HinaCardFrame (bukan di sini).
//   kind='correct' → lompat kecil; kind='wrong' → goyang; kind='streak' → lompat besar
export function HinaChibi({ kind = 'correct', className = '' }) {
  const rects = hinaChibiRects();
  const wrong = kind === 'wrong';
  const grand = kind === 'streak';

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
        wrong
          ? { rotate: [0, -9, 9, -6, 0], y: 0 }
          : { y: grand ? [0, -14, 0] : [0, -8, 0], scale: grand ? [1, 1.14, 1] : [1, 1.06, 1] }
      }
      transition={
        wrong
          ? { duration: 0.5, ease: 'easeOut' }
          : { duration: grand ? 0.7 : 0.55, ease: [0.34, 1.56, 0.64, 1] }
      }
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.color} />
      ))}
    </motion.svg>
  );
}
```

### Task 4.2 — `HinaCardFrame.jsx`
**File baru:** `src/features/effects/HinaCardFrame.jsx`

```jsx
import { motion } from 'motion/react';
import { useUserStats } from '../progress/ProgressContext';
import { getPack } from '../packs/packs';
import { useEffectLayer } from './EffectContext';
import {
  hinaRibbonColors, hinaRibbonSegments,
  HINA_RIBBON_VIEWBOX, HINA_RIBBON_STROKE,
} from './hinaRibbon';
import { HinaChibi } from './HinaChibi';

// Bungkus kartu jawaban: pita Hina SELALU mengikat kartu (pack Hina aktif) +
// chibi duduk di pojok kartu. Struktur wrapper SELALU sama → tanpa layout shift.
//   z-0  = pita `back`  (tertutup badan kartu → menembus belakang)
//   children = kartu (WAJIB `relative z-10`)
//   z-20 = pita `front` + `bow`
//   z-30 = chibi di pojok KIRI-ATAS (seolah duduk di sudut kartu)
const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Ribbon({ d, color, width, opacity = 1, delay = 0, shadow = false, reduce = false }) {
  return (
    <>
      {shadow && (
        <motion.path
          d={d} fill="none" stroke="rgba(26,26,26,0.22)" strokeWidth={HINA_RIBBON_STROKE.shadow}
          strokeLinecap="round" vectorEffect="non-scaling-stroke" transform="translate(3 4)"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
      <motion.path
        d={d} fill="none" stroke={color} strokeWidth={width} opacity={opacity}
        strokeLinecap="round" vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      />
    </>
  );
}

export function HinaCardFrame({ className = '', children }) {
  const { progress } = useUserStats();
  const { fxKind } = useEffectLayer();
  const isHina = getPack(progress.activePack)?.visual === 'hina';
  const reduce = prefersReduced();

  const kind = fxKind || 'correct';
  const c = hinaRibbonColors(kind);
  const seg = hinaRibbonSegments(kind);
  const svgProps = {
    viewBox: HINA_RIBBON_VIEWBOX,
    preserveAspectRatio: 'none',
    className: 'absolute inset-0 w-full h-full overflow-visible',
  };

  return (
    <div className={`relative isolate ${className}`}>
      {isHina && (
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <svg {...svgProps}>
            <Ribbon d={seg.back} color={c.base} width={HINA_RIBBON_STROKE.width} reduce={reduce} />
          </svg>
        </div>
      )}

      {children /* kartu WAJIB relative z-10 */}

      {isHina && (
        <div className="absolute inset-0 z-20 pointer-events-none" aria-hidden="true">
          <svg {...svgProps}>
            <Ribbon d={seg.front} color={c.base} width={HINA_RIBBON_STROKE.width} shadow reduce={reduce} />
            <Ribbon d={seg.front} color={c.light} width={HINA_RIBBON_STROKE.highlight} opacity={0.85} delay={0.05} reduce={reduce} />
            <Ribbon d={seg.bow} color={c.base} width={HINA_RIBBON_STROKE.width} shadow reduce={reduce} />
            <Ribbon d={seg.bow} color={c.light} width={HINA_RIBBON_STROKE.highlight} opacity={0.85} delay={0.05} reduce={reduce} />
          </svg>
        </div>
      )}

      {isHina && (
        <div className="absolute -top-6 -left-4 z-30 pointer-events-none" aria-hidden="true">
          <HinaChibi kind={kind} />
        </div>
      )}
    </div>
  );
}
```

### Task 4.3 — Verifikasi
```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
npm run lint 2>&1 | tail -5
npm run build 2>&1 | grep -iE "built in|error"
```
**Expected:** `88 / 88 / 0`; lint 0 error; build ✓.

### Task 4.4 — Commit
```bash
git add src/features/effects/HinaChibi.jsx src/features/effects/HinaCardFrame.jsx
git commit -m "feat(effects): HinaCardFrame (pita depth + chibi duduk di pojok kartu)"
```

---

## FASE 5 — Integrasi `src/features/quiz/Quiz.jsx` (Mondai)

### Task 5.1 — Import
Setelah `import { useEffectLayer } from "../effects/EffectContext";` tambah:
```jsx
import { HinaCardFrame } from "../effects/HinaCardFrame";
```

### Task 5.2 — Bungkus kartu
Cari blok kartu (sekitar baris 114) dan bungkus. **Sebelum:**
```jsx
      {/* Question Card */}
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-[4px] border-sumi bg-kinari-light p-6 sm:p-12 shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] relative z-10 flex-1 flex flex-col justify-between"
      >
```
**Sesudah:**
```jsx
      {/* Question Card — diikat pita Hina + chibi di pojok */}
      <HinaCardFrame className="flex-1 flex flex-col">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-[4px] border-sumi bg-kinari-light p-6 sm:p-12 shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] relative z-10 flex-1 flex flex-col justify-between"
        >
```
Lalu **tutup** tepat setelah `</motion.div>` penutup kartu (sekitar baris 230), sebelum `</div>` halaman:
```jsx
        </motion.div>
      </HinaCardFrame>
    </div>
  );
```

> `flex-1 flex flex-col` dipindah ke `HinaCardFrame` supaya tinggi kartu tetap mengisi layar.

### Task 5.3 — Verifikasi
```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
npm run lint 2>&1 | tail -3
npm run build 2>&1 | grep -iE "built in|error"
```
**Expected:** `88 / 88 / 0`; lint 0; build ✓.

### Task 5.4 — Commit
```bash
git add src/features/quiz/Quiz.jsx
git commit -m "feat(effects): pita Hina + chibi di kartu jawaban Quiz Mondai"
```

---

## FASE 6 — Integrasi `src/pages/Practice.jsx` (kanji/kotoba/grammar)

### Task 6.1 — Import
Setelah `import { HinaResultSticker } from "../features/effects/HinaResultSticker";` tambah:
```jsx
import { HinaCardFrame } from "../features/effects/HinaCardFrame";
```

### Task 6.2 — Bungkus **tiap** kartu pertanyaan
Di `Practice.jsx` ada beberapa varian kartu pertanyaan (kanji ±336, kotoba/grammar ±516, dan varian lain). Untuk **setiap** kartu pertanyaan terapkan pola:

**Sebelum:**
```jsx
<motion.div key={currentQuestion.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }} className="w-full max-w-lg mb-8">
  <div className="bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] p-8 sm:p-12 flex flex-col items-center gap-4 relative overflow-hidden">
    {/* isi kartu */}
  </div>
</motion.div>
```

**Sesudah:**
```jsx
<motion.div key={currentQuestion.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }} className="w-full max-w-lg mb-8">
  <HinaCardFrame>
    <div className="bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] p-8 sm:p-12 flex flex-col items-center gap-4 relative overflow-hidden z-10">
      {/* isi kartu — JANGAN diubah */}
    </div>
  </HinaCardFrame>
</motion.div>
```

Aturan:
1. `HinaCardFrame` = anak langsung `<motion.div …>` yang sudah ada (jangan ubah `key`/animasi).
2. `<div>` kartu yang punya `bg-kinari border-[4px]` → **tambah `z-10`** (sudah `relative`).
3. **JANGAN** bungkus kartu yang bukan pertanyaan (mis. kartu ringkasan).
4. Pastikan `</HinaCardFrame>` menutup tepat sebelum `</motion.div>`.

> Kartu punya `overflow-hidden` → pita tetap bisa "keluar" ke belakang karena pita digambar di lapisan frame (di luar kartu). Chibi `-bottom-6 -right-4` juga di luar kartu → tidak terpotong.

### Task 6.3 — Verifikasi
```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
npm run lint 2>&1 | tail -3
npm run build 2>&1 | grep -iE "built in|error"
```
**Expected:** `88 / 88 / 0`; lint 0; build ✓.

### Task 6.4 — Commit
```bash
git add src/pages/Practice.jsx
git commit -m "feat(effects): pita Hina + chibi di kartu jawaban Practice (kanji/kotoba/grammar)"
```

---

## FASE 7 — Integrasi `src/features/quiz/KanaQuiz.jsx`

KanaQuiz tidak punya kartu → **grid opsi dijadikan "kartu jawaban"** (permukaan opaque agar efek depth terbaca), lalu dibungkus frame.

### Task 7.1 — Import
Setelah `import { useLanguage } from "../../context/LanguageContext";` tambah:
```jsx
import { HinaCardFrame } from "../effects/HinaCardFrame";
```

### Task 7.2 — Bungkus grid opsi
**Sebelum** (sekitar baris 82):
```jsx
        <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-lg">
          {options.map((option) => {
```
**Sesudah:**
```jsx
        <HinaCardFrame className="w-full max-w-lg">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] p-4 sm:p-6 relative z-10">
            {options.map((option) => {
```
Dan **tutup** `</HinaCardFrame>` tepat setelah `</div>` penutup grid opsi (sebelum blok feedback `{isAnswered && (`):
```jsx
          </div>
        </HinaCardFrame>
```

> Ini menambahkan permukaan kartu pada grid opsi (perubahan visual disengaja). Verifikasi di browser; kalau kurang cocok, alternatif: beri `bg-kinari` tanpa `border`, atau bungkus blok karakter besar (baris ±50) — lihat §9 open question.

### Task 7.3 — Verifikasi
```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
npm run lint 2>&1 | tail -3
npm run build 2>&1 | grep -iE "built in|error"
```
**Expected:** `88 / 88 / 0`; lint 0; build ✓.

### Task 7.4 — Commit
```bash
git add src/features/quiz/KanaQuiz.jsx
git commit -m "feat(effects): pita Hina + chibi di kartu jawaban KanaQuiz"
```

---

## 8. Tests / validation — verifikasi browser (WAJIB)

### 8.1 Dev server
```bash
cd /c/Users/maddo/Documents/japanese-quiz
npm run dev > /tmp/vite_hina.log 2>&1 &
sleep 7; grep -iE "ready in|error" /tmp/vite_hina.log | head -3
curl -s -o /dev/null -w "app=%{http_code}\n" http://localhost:5173/
```
**Expected:** `ready in Xms`, `app=200`.

### 8.2 Seed pack (GOTCHA: `activePack` sering reset ke `null` di sesi otomasi — seed TIAP kali)
```js
(() => {
  const p = JSON.parse(localStorage.getItem('user_progress_v2') || '{}');
  p.ownedPacks = ['kotodama_burst'];
  p.activePack = 'kotodama_burst';
  localStorage.setItem('user_progress_v2', JSON.stringify(p));
  return p.activePack;
})()
```
**Expected:** `'kotodama_burst'` → reload.

### 8.3 Bukti objektif "pita menembus belakang kartu"
```js
(() => {
  const back = document.querySelector('.z-0 svg');
  const front = document.querySelector('.z-20 svg');
  const card = document.querySelector('.bg-kinari.border-\\[4px\\], .bg-kinari-light.border-\\[4px\\]');
  const r = card.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return JSON.stringify({
    adaPitaBelakang: !!back,
    adaPitaDepan: !!front,
    kartuDiTengahTitik: hit === card || card.contains(hit), // HARUS true
    jumlahPath: document.querySelectorAll('svg path').length,
  });
})()
```
**Expected:** `adaPitaBelakang: true`, `adaPitaDepan: true`, `kartuDiTengahTitik: true`, `jumlahPath >= 6`.
> Kalau `kartuDiTengahTitik: false` → kartu belum `relative z-10`, atau frame belum `isolate`, atau urutan DOM salah.

### 8.4 Bukti chibi "duduk di pojok kartu"
```js
(() => {
  const svg = [...document.querySelectorAll('svg')].find(s => s.querySelectorAll('rect').length > 40);
  if (!svg) return 'CHIBI TIDAK ADA';
  const cr = svg.getBoundingClientRect();
  const card = document.querySelector('.bg-kinari.border-\\[4px\\], .bg-kinari-light.border-\\[4px\\]');
  const kr = card.getBoundingClientRect();
  const tumpang = !(cr.right < kr.left || cr.left > kr.right || cr.bottom < kr.top || cr.top > kr.bottom);
  return JSON.stringify({
    pixel: svg.querySelectorAll('rect').length,
    crisp: getComputedStyle(svg).shapeRendering,
    warnaPink: [...svg.querySelectorAll('rect')].some(r => (r.getAttribute('fill') || '').toLowerCase() === '#ff4d94'),
    nempelKartu: tumpang,               // HARUS true
    dekatPojokKiriAtas: cr.left < kr.left + kr.width * 0.5 && cr.top < kr.top + kr.height * 0.5,
  });
})()
```
**Expected:** `pixel > 40`, `crisp: 'crispEdges'`, `warnaPink: true`, `nempelKartu: true`, `dekatPojokKiriAtas: true`.

### 8.5 Uji gaya pita (correct / wrong / streak)
Jawab benar biasa → `fxKind`='correct'. Salah → `'wrong'`. Streak 3 → `'streak'` (megah, aksen emas `#d4af37`).
```js
(() => {
  const strokes = [...document.querySelectorAll('.z-20 svg path')].map(p => p.getAttribute('stroke'));
  return JSON.stringify({ adaEmas: strokes.includes('#d4af37'), jumlah: strokes.length });
})()
```
**Expected saat streak:** `adaEmas: true`.

### 8.6 No-regression pack lain
Seed `activePack='pack_02'` → reload → buka kuis.
```js
document.querySelectorAll('svg path').length
```
**Expected:** **0** path pita; chibi tidak ada. Kartu tetap normal.

### 8.7 Console & visual
- `window.__errs` kosong / DevTools console **0 error**.
- Screenshot & inspeksi mata: pita "mengikat" kartu, bagian kanan menghilang di belakang kartu; chibi duduk di pojok kanan-bawah.
- (Opsional) ukur FPS: rata-rata frame tidak jauh dari baseline idle (±19ms).

### 8.8 Gates akhir
```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
npm run lint 2>&1 | tail -3
npm run build 2>&1 | grep -iE "built in|error"
```
**Expected:** `88 pass / 0 fail`; lint 0 error; build ✓.

### 8.9 Matikan dev server
```bash
# ganti <pid> dengan PID node vite
taskkill //F //PID <pid> 2>/dev/null; echo done
```

---

## 9. Risks, tradeoffs, open questions

### Risiko & mitigasi
1. **`preserveAspectRatio="none"` mendistorsi bentuk pita** (kartu tidak persegi). *Mitigasi:* `vector-effect="non-scaling-stroke"` menjaga ketebalan; jalur dominan diagonal. Bila jelek → ukur kartu via `ResizeObserver` + generate path proporsional (YAGNI dulu).
2. **Pita terpotong ancestor `overflow-hidden`** → pita di lapisan frame (bukan di dalam kartu) → aman. Verifikasi §8.3.
3. **Chibi ketutup `overflow-hidden` kartu** → chibi di lapisan frame (`z-30`) → aman.
4. **Jank** → tanpa `filter: drop-shadow` (bayangan = path offset); animasi terbatas (`pathLength`, transform kecil). Ukur §8.7.
5. **z-index bocor** → frame `isolate` + kartu `z-10`.
6. **Pack lain kena** → gating `visual === 'hina'` + uji §8.6.
7. **KanaQuiz berubah tampilan** (grid opsi jadi berkartu) → disengaja; lihat open question #1.
8. **`fxKind` bikin provider value berubah** → sudah begitu sejak awal (objek literal) → bukan regresi; kalau perlu, bungkus `useMemo` (opsional).
9. **Pita "selalu" saat idle** memakai `fxKind` terakhir (null → `correct`). Setelah reload, pita tampil gaya `correct` sampai jawaban pertama. Sesuai keputusan #3 (selalu tampil).

### Tradeoff
- Pita 2 lapisan = ~6 path SVG → dampak perf kecil, tetap diukur.
- Chibi pixel SVG = gaya pixel terbatas (bukan artwork anime asli), tapi tanpa aset & crisp.

### Open questions (sisa — bisa dijawab saat verifikasi browser)
1. **Tabrakan chibi (kiri-atas) vs simpul pita (kiri):** jika bertumpuk jelek, geser chibi (`-top-6 -left-2`, perkecil) atau geser simpul (`bow`) lebih ke bawah. Tentukan setelah lihat hasil.
2. **KanaQuiz (Opsi A)**: jika kartu pada grid opsi terasa aneh, alternatif tanpa border / blok karakter besar.
3. Push: **tidak di-push** (keputusan #8). Semua commit tetap lokal sampai user minta.
