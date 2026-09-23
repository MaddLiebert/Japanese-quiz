# Plan — Layar Gacha Animasi Slot (3 Reel) untuk Warung Kakek

**Tanggal:** 2026-09-22
**Repo:** `C:\Users\maddo\Documents\japanese-quiz`
**Baseline commit:** `46c6c90` (branch `main`, 21 commit ahead of `origin/main`, **belum di-push**)

---

## 1. Goal

Saat tombol **TARIK 1X / TARIK 10X** di `/shop` diklik, buka **overlay full-screen** berisi **mesin slot 3 reel** yang berputar lalu berhenti satu per satu (dengan bunyi *tick* dan *fanfare* saat dapat legendary), lalu menampilkan hasil tarikan.

---

## 2. Current context / assumptions

### Yang sudah ada (JANGAN dirombak)
| File | Peran |
|---|---|
| `src/features/shop/Shop.jsx` (331 baris) | Halaman `/shop`. `handleRoll(count)` → `rollGacha(count)` dari context → `setPullResult(res)` → modal hasil lama (`AnimatePresence`, baris ~269-321) |
| `src/features/progress/ProgressContext.jsx` | `rollGacha(count)` **sudah memotong saldo & menambah `ownedPacks`**. Return `{ ok, results:[{id,isNew}], refunded }` |
| `src/features/packs/packs.js` | `PACKS`, `getPack(id)`, `PACK_RARITY` (`common`/`rare`/`legendary`), `isPackReady` |
| `src/utils/sfx.js` | Web Audio. Sudah punya `playCorrectSound`, `playWrongSound`, `playStreakSound`, dan **`streakGongParams()` yang dites** — jangan diubah |
| `src/index.css` | Tailwind v4 (`@theme`). Warna: `sumi` `#1a1a1a`, `ai` `#182b49`, `shu` `#d3382f`, `kinari`, `kinari-light`, `matcha`. Ada blok `.dark` untuk dark mode |

### Aturan repo yang WAJIB dipatuhi
1. **Test runner = `node --test`** (`npm test`). Tanpa vitest/jest. File tes dinamai `*.test.js`.
2. **Node ESM butuh ekstensi eksplisit** di import: `import { x } from './slot.js'` — **bukan** `'./slot'`. (Vite toleran, `node --test` tidak.)
3. **Line ending CRLF** — git akan memperingatkan `LF will be replaced by CRLF`. Itu normal, abaikan.
4. **Jangan push ke git.** Commit boleh, push hanya bila user bilang.
5. **Dev server user jalan di port 5173 (PID tetap). JANGAN diganggu.** Untuk uji, jalankan sendiri di **5174** dengan `--strictPort`.
6. Lint = `npm run lint` (oxlint). Target: **0 error**. Baseline warning = **21** (jangan tambah warning baru).
7. Jangan memberi nama variabel/fungsi yang diawali `use` kecuali benar-benar React hook (oxlint `react-hooks/rules-of-hooks` akan error).

### Keputusan user (dari clarify)
- **Animasi: mesin slot 3 reel** (bukan pachinko).
- **Bentuk: overlay full-screen** (URL tidak berubah, tombol X untuk tutup).
- **Suara: ya** — tick saat reel muter + fanfare saat legendary.

### Asumsi yang diambil (lihat Open Questions)
- Gacha 10x: 3 reel muter sekali, lalu **grid 10 kartu** muncul di bawah reel.
- Saldo tetap dipotong **sebelum** animasi (memanfaatkan `rollGacha` yang sudah teruji & aman dari StrictMode double-invoke).
- Simbol reel = ikon pack (`pack.icon`); simbol acak saat muter diambil dari `SYMBOL_POOL`.
- **YAGNI:** tidak ada pachinko fisik, tidak ada physics engine, tidak ada route `/gacha`, tidak ada skip-otomatis berbasis waktu.

---

## 3. Architecture / proposed approach

Pisahkan **logika murni** (bisa dites `node --test`) dari **komponen visual**:

1. **`src/features/gacha/slot.js`** — modul murni: bangun *strip* simbol tiap reel, tentukan ikon target, hitung rarity tertinggi, durasi spin. Tanpa React, tanpa DOM.
2. **`src/utils/sfx.js`** — tambah 2 fungsi parameter murni (`reelTickParams`, `fanfareParams`) + 2 pemutar (`playReelTick`, `playFanfare`). **Tidak menyentuh** `streakGongParams`.
3. **`src/features/gacha/GachaSlotOverlay.jsx`** — komponen overlay. Dirender lewat **`createPortal` ke `document.body`** (penting: parent `Shop` memakai `motion.div` ber-`transform`, sehingga `position: fixed` bisa terkurung di dalamnya).
4. **`src/features/shop/Shop.jsx`** — ganti modal lama dengan `<GachaSlotOverlay>`. `rollGacha` tetap dipanggil di sini.

Alur: klik TARIK → `rollGacha()` potong saldo → `setPullResult(res)` → overlay muncul → reel muter + tick → reel berhenti bertahap → fanfare (kalau legendary) → grid hasil + tombol TUTUP.

---

## 4. Step-by-step tasks

> **Cara kerja:** setiap task = tulis tes dulu (RED) → jalankan, pastikan GAGAL → implementasi → jalankan, pastikan PASS → commit. Task 1 & 2 murni TDD. Task 3-6 = UI (gate: `npm run build` + `npm run lint` + uji browser).

---

### Task 1 — Modul murni `slot.js` + tes

**1a. Tulis tes yang GAGAL dulu.**

Buat file `src/features/gacha/slot.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REEL_COUNT,
  REEL_MS,
  STRIP_LEN,
  SYMBOL_POOL,
  buildStrip,
  buildStrips,
  reelTargetIcons,
  maxRarity,
  totalSpinMs,
} from './slot.js';

test('konstanta dasar masuk akal', () => {
  assert.equal(REEL_COUNT, 3);
  assert.equal(REEL_MS.length, REEL_COUNT);
  assert.ok(STRIP_LEN >= 8);
  assert.ok(SYMBOL_POOL.length >= 4);
});

test('buildStrip: panjang benar & elemen terakhir = target', () => {
  const strip = buildStrip('🎯', ['a', 'b'], 6, () => 0);
  assert.equal(strip.length, 6);
  assert.equal(strip[5], '🎯');
  assert.ok(strip.slice(0, 5).every((s) => s === 'a'));
});

test('buildStrip: semua elemen (kecuali target) berasal dari pool', () => {
  let n = 0;
  const rng = () => { n = (n + 0.37) % 1; return n; };
  const strip = buildStrip('🎯', ['a', 'b', 'c'], 10, rng);
  assert.ok(strip.slice(0, 9).every((s) => ['a', 'b', 'c'].includes(s)));
});

test('buildStrip: length < 1 ditolak', () => {
  assert.throws(() => buildStrip('🎯', ['a'], 0), /length/);
});

test('buildStrips: 3 reel, tiap strip berakhir di target masing-masing', () => {
  const strips = buildStrips(['A', 'B', 'C'], ['x'], 5, () => 0);
  assert.equal(strips.length, REEL_COUNT);
  assert.equal(strips[0][4], 'A');
  assert.equal(strips[1][4], 'B');
  assert.equal(strips[2][4], 'C');
});

test('buildStrips: target lebih sedikit dari reel → dipakai berulang', () => {
  const strips = buildStrips(['A'], ['x'], 5, () => 0);
  assert.deepEqual(strips.map((s) => s[4]), ['A', 'A', 'A']);
});

test('reelTargetIcons: hasil kosong → semua reel pakai simbol pertama pool', () => {
  const icons = reelTargetIcons([], () => 'X');
  assert.deepEqual(icons, [SYMBOL_POOL[0], SYMBOL_POOL[0], SYMBOL_POOL[0]]);
});

test('reelTargetIcons: memetakan hasil lewat iconOf', () => {
  const icons = reelTargetIcons([{ id: 'a' }, { id: 'b' }], (r) => `i-${r.id}`);
  assert.deepEqual(icons, ['i-a', 'i-b', 'i-a']);
});

test('maxRarity: pilih tingkat tertinggi', () => {
  assert.equal(maxRarity(['common', 'rare', 'common']), 'rare');
  assert.equal(maxRarity(['common', 'legendary', 'rare']), 'legendary');
  assert.equal(maxRarity(['common']), 'common');
  assert.equal(maxRarity([]), 'common');
  assert.equal(maxRarity(['ngawur', 'rare']), 'rare');
});

test('totalSpinMs: durasi total > reel terakhir', () => {
  assert.ok(totalSpinMs() > REEL_MS[REEL_COUNT - 1]);
});
```

**1b. Jalankan — harus GAGAL.**

```bash
cd "/c/Users/maddo/Documents/japanese-quiz"
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)|ERR_MODULE_NOT_FOUND" | head
```

Expected (RED):
```
ERR_MODULE_NOT_FOUND ... Cannot find module '.../src/features/gacha/slot.js'
ℹ tests 28
ℹ pass 27
ℹ fail 1
```

**1c. Implementasi minimal.**

Buat file `src/features/gacha/slot.js`:

```js
// ─────────────────────────────────────────────────────────────────────────────
// Logika murni mesin slot gacha (tanpa React / DOM) → dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

export const REEL_COUNT = 3;
export const STRIP_LEN = 18;                  // jumlah simbol per strip
export const REEL_MS = [1500, 2000, 2500];    // durasi spin tiap reel (ms)
export const TICK_MS = 75;                    // interval bunyi tick (ms)

// Simbol acak yang dilewati saat reel muter (bukan ikon pack).
export const SYMBOL_POOL = ['🍥', '🎴', '🏮', '⚡', '🌊', '🔥', '❄️', '🌸', '🎐', '🪷'];

// Deretan simbol satu reel: acak dari pool, ELEMEN TERAKHIR = target.
export function buildStrip(targetIcon, pool = SYMBOL_POOL, length = STRIP_LEN, rng = Math.random) {
  if (length < 1) throw new Error('length minimal 1');
  const strip = [];
  for (let i = 0; i < length - 1; i++) {
    strip.push(pool[Math.floor(rng() * pool.length)]);
  }
  strip.push(targetIcon);
  return strip;
}

// Strip untuk SEMUA reel. targetIcons lebih sedikit → dipakai berulang (modulo).
export function buildStrips(targetIcons, pool = SYMBOL_POOL, length = STRIP_LEN, rng = Math.random) {
  return Array.from({ length: REEL_COUNT }, (_, i) =>
    buildStrip(targetIcons[i % targetIcons.length], pool, length, rng)
  );
}

// Ikon target per reel dari hasil gacha. `iconOf(result)` → string ikon.
export function reelTargetIcons(results, iconOf) {
  const list = Array.isArray(results) ? results : [];
  if (list.length === 0) return Array(REEL_COUNT).fill(SYMBOL_POOL[0]);
  return Array.from({ length: REEL_COUNT }, (_, i) => iconOf(list[i % list.length]));
}

// Rarity tertinggi dari daftar rarity (untuk menentukan fanfare).
const RARITY_RANK = { common: 0, rare: 1, legendary: 2 };
export function maxRarity(rarities) {
  return (rarities || []).reduce(
    (best, r) => ((RARITY_RANK[r] ?? 0) > (RARITY_RANK[best] ?? 0) ? r : best),
    'common'
  );
}

// Total durasi animasi spin (reel terakhir + jeda reveal).
export function totalSpinMs() {
  return REEL_MS[REEL_COUNT - 1] + 400;
}
```

**1d. Jalankan — harus PASS.**

```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected (GREEN):
```
ℹ tests 38
ℹ pass 38
ℹ fail 0
```

**1e. Commit.**

```bash
git add src/features/gacha/slot.js src/features/gacha/slot.test.js
git commit -m "feat(gacha): logika murni mesin slot 3 reel (dites)"
```

---

### Task 2 — Suara reel & fanfare di `sfx.js`

> **JANGAN ubah** `streakGongParams`, `GONG_RATIOS`, `synthGong`, atau 3 fungsi `play*Sound` yang sudah ada — ada 6 tes yang bergantung padanya.

**2a. Tulis tes yang GAGAL dulu.**

Buat file `src/utils/sfx.gacha.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { reelTickParams, fanfareParams } from './sfx.js';

test('reelTickParams: klik pendek & pelan (tidak nyaring)', () => {
  const { freq, dur, gain } = reelTickParams();
  assert.ok(freq >= 400 && freq <= 4000, `freq ${freq} di luar rentang audible`);
  assert.ok(dur > 0 && dur <= 0.1, `dur ${dur} terlalu panjang untuk tick`);
  assert.ok(gain > 0 && gain <= 0.3, `gain ${gain} terlalu keras untuk tick`);
});

test('fanfareParams: legendary = 4 nada, rare = 3, common = 2', () => {
  assert.equal(fanfareParams('legendary').notes.length, 4);
  assert.equal(fanfareParams('rare').notes.length, 3);
  assert.equal(fanfareParams('common').notes.length, 2);
});

test('fanfareParams: rarity tak dikenal diperlakukan seperti common', () => {
  assert.deepEqual(fanfareParams('ngawur').notes, fanfareParams('common').notes);
});

test('fanfareParams: nada naik (fanfare menang, bukan menurun)', () => {
  for (const r of ['common', 'rare', 'legendary']) {
    const { notes } = fanfareParams(r);
    for (let i = 1; i < notes.length; i++) {
      assert.ok(notes[i] > notes[i - 1], `${r}: nada ke-${i} tidak naik`);
    }
  }
});

test('fanfareParams: semua nada di rentang audible speaker (>= 400 Hz)', () => {
  for (const r of ['common', 'rare', 'legendary']) {
    for (const n of fanfareParams(r).notes) {
      assert.ok(n >= 400 && n <= 4000, `${r}: nada ${n}Hz di luar rentang`);
    }
  }
});

test('fanfareParams: durasi & gain sehat', () => {
  for (const r of ['common', 'rare', 'legendary']) {
    const { dur, gap, gain } = fanfareParams(r);
    assert.ok(dur > 0.05 && dur <= 0.5, `${r}: dur ${dur} tidak sehat`);
    assert.ok(gap >= 0 && gap <= 0.3, `${r}: gap ${gap} tidak sehat`);
    assert.ok(gain > 0 && gain <= 1, `${r}: gain ${gain} tidak sehat`);
  }
});
```

**2b. Jalankan — harus GAGAL.**

```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)" | head
```

Expected (RED): `fail 1` dengan pesan `does not provide an export named 'reelTickParams'`.

**2c. Implementasi.** Buka `src/utils/sfx.js`, **tambahkan di paling bawah** (setelah `playStreakSound`):

```js
// ── Suara mesin slot gacha ──────────────────────────────────────────────────
// Parameter murni (dites di sfx.gacha.test.js).
export function reelTickParams() {
  return { freq: 1400, dur: 0.03, gain: 0.12 };
}

export function fanfareParams(rarity = 'common') {
  const notes = rarity === 'legendary'
    ? [523.25, 659.25, 783.99, 1046.5]   // C5 E5 G5 C6
    : rarity === 'rare'
      ? [523.25, 659.25, 783.99]         // C5 E5 G5
      : [523.25, 659.25];                // C5 E5
  return { notes, dur: 0.18, gap: 0.12, gain: 0.5 };
}

// Pemutar (butuh AudioContext; tidak dites di node).
export const playReelTick = () => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const { freq, dur, gain } = reelTickParams();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
};

export const playFanfare = (rarity = 'common') => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const { notes, dur, gap, gain } = fanfareParams(rarity);
  const start = ctx.currentTime;
  notes.forEach((freq, i) => {
    const t = start + i * gap;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  });
};
```

**2d. Jalankan — harus PASS (termasuk 6 tes gong lama).**

```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected (GREEN): `tests 44`, `pass 44`, `fail 0`.

**2e. Commit.**

```bash
git add src/utils/sfx.js src/utils/sfx.gacha.test.js
git commit -m "feat(sfx): bunyi tick reel + fanfare gacha (params dites)"
```

---

### Task 3 — Komponen `GachaSlotOverlay.jsx` (reel + reveal)

Buat file `src/features/gacha/GachaSlotOverlay.jsx`:

```jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { PACKS, PACK_RARITY, getPack } from "../packs/packs";
import { useLanguage } from "../../context/LanguageContext";
import { playReelTick, playFanfare } from "../../utils/sfx";
import {
  REEL_COUNT, REEL_MS, TICK_MS, buildStrips, reelTargetIcons, maxRarity,
} from "./slot";

const ITEM_H = 120; // px — tinggi satu sel reel

const RARITY_STYLE = {
  common:    { bg: 'bg-kinari-light', text: 'text-sumi',         border: 'border-sumi' },
  rare:      { bg: 'bg-ai',           text: 'text-kinari-light', border: 'border-sumi' },
  legendary: { bg: 'bg-shu',          text: 'text-kinari-light', border: 'border-sumi' },
};

const iconOf = (r) => getPack(r?.id)?.icon || '📦';
const rarityOf = (r) => getPack(r?.id)?.rarity || 'common';

// Cek sekali: user minta animasi dikurangi?
const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function GachaSlotOverlay({ result, onClose }) {
  const { language } = useLanguage();
  const id = language === 'id';

  const results = result?.results || [];
  const rarity = useMemo(() => maxRarity(results.map(rarityOf)), [results]);

  // reduced-motion → langsung "selesai", tanpa animasi & tanpa suara.
  const reduced = useRef(prefersReduced()).current;

  const strips = useMemo(
    () => buildStrips(reelTargetIcons(results, iconOf)),
    [results]
  );

  // Berapa reel yang sudah berhenti.
  const [stopped, setStopped] = useState(() => (reduced ? REEL_COUNT : 0));
  const [revealed, setRevealed] = useState(reduced);

  const allStopped = stopped >= REEL_COUNT;

  // Bunyi tick selama masih ada reel yang muter.
  useEffect(() => {
    if (reduced || allStopped) return;
    const t = setInterval(playReelTick, TICK_MS);
    return () => clearInterval(t);
  }, [reduced, allStopped]);

  // Fanfare saat semua reel berhenti.
  useEffect(() => {
    if (reduced || !allStopped) return;
    playFanfare(rarity);
    const t = setTimeout(() => setRevealed(true), 350);
    return () => clearTimeout(t);
  }, [reduced, allStopped, rarity]);

  // Tombol Esc untuk tutup (hanya setelah reveal, biar tidak skip tak sengaja).
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const skip = () => { setStopped(REEL_COUNT); setRevealed(true); };

  const overlay = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-sumi/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-kinari-light border-[4px] border-sumi shadow-[10px_10px_0_0_#1a1a1a] w-full max-w-3xl max-h-[92vh] overflow-y-auto relative"
      >
        {/* Tombol tutup */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 border-[3px] border-sumi bg-kinari-light font-black text-lg shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all"
          title={id ? 'Tutup' : 'Close'}
        >
          ✕
        </button>

        {/* Header */}
        <div className="p-5 sm:p-8 border-b-[4px] border-sumi bg-shu text-kinari-light relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 text-[8rem] font-serif opacity-[0.08] pointer-events-none select-none leading-none">
            玉
          </div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-80">
            {id ? 'Mesin Keberuntungan' : 'Fortune Machine'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-black mt-1">
            🎰 {id ? 'Gashapon Berkarat' : 'Rusty Gashapon'}
          </h2>
          <p className="text-xs font-bold mt-1 opacity-90">
            {results.length}x · {id ? 'refund' : 'refund'} {result?.refunded ?? 0} 🪙
          </p>
        </div>

        {/* Reel */}
        <div className="p-4 sm:p-8 bg-ai/10">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {strips.map((strip, i) => (
              <div
                key={i}
                className="border-[4px] border-sumi bg-kinari-light overflow-hidden relative"
                style={{ height: ITEM_H }}
              >
                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: -(strip.length - 1) * ITEM_H }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: REEL_MS[i] / 1000, ease: [0.16, 0.84, 0.24, 1] }
                  }
                  onAnimationComplete={() => setStopped((s) => Math.max(s, i + 1))}
                >
                  {strip.map((sym, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-center text-5xl sm:text-6xl select-none"
                      style={{ height: ITEM_H }}
                    >
                      {sym}
                    </div>
                  ))}
                </motion.div>
                {/* garis tengah (payline) */}
                <div className="absolute inset-x-0 top-1/2 h-[3px] bg-shu/60 -translate-y-1/2 pointer-events-none" />
              </div>
            ))}
          </div>

          {!allStopped && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={skip}
                className="px-5 py-2 border-[3px] border-sumi bg-kinari-light font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all"
              >
                {id ? '⏩ Lewati' : '⏩ Skip'}
              </button>
            </div>
          )}
        </div>

        {/* Hasil */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 sm:p-8"
          >
            <h3 className="text-xl font-serif font-black text-sumi mb-4">
              {id ? 'Hasil Tarikan' : 'Pull Result'}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {results.map((p, i) => {
                const pack = getPack(p.id);
                const st = RARITY_STYLE[pack?.rarity] || RARITY_STYLE.common;
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`${st.bg} ${st.text} border-[3px] border-sumi px-4 py-3 flex items-center gap-3`}
                  >
                    <span className="text-2xl">{pack?.icon || '📦'}</span>
                    <span className="font-black flex-grow">{pack?.name || p.id}</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                      {PACK_RARITY[pack?.rarity]?.label || 'COMMON'}
                    </span>
                    {!p.isNew && (
                      <span className="text-[10px] font-black bg-sumi text-kinari-light px-2 py-1">
                        DUP +50
                      </span>
                    )}
                  </motion.li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-ai text-kinari-light font-black border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none transition-all"
            >
              {id ? 'TUTUP' : 'CLOSE'}
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );

  // Portal ke body: parent Shop pakai motion.div ber-transform, sehingga
  // `position: fixed` bisa terkurung di dalamnya kalau tidak di-portal.
  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}

export default GachaSlotOverlay;
```

**Verifikasi (bukan tes otomatis — UI):**

```bash
cd "/c/Users/maddo/Documents/japanese-quiz"
npm run lint 2>&1 | grep -icE "error"
npm run build 2>&1 | grep -E "built in|error" | head
```

Expected:
```
0
✓ built in ...s
```

**Commit:**

```bash
git add src/features/gacha/GachaSlotOverlay.jsx
git commit -m "feat(gacha): overlay full-screen mesin slot 3 reel + reveal hasil"
```

---

### Task 4 — Integrasi ke `Shop.jsx`

**4a. Tambah import.** Di `src/features/shop/Shop.jsx` baris ~7, setelah import `SHOP_ITEMS`:

```js
import { GachaSlotOverlay } from "../gacha/GachaSlotOverlay";
```

**4b. Ganti modal lama dengan overlay.** Cari blok `{/* Modal hasil gacha */}` (sekitar baris 269-321) — blok `AnimatePresence` yang berisi kartu hasil — dan **hapus seluruh blok itu**, lalu ganti dengan:

```jsx
      {/* Layar gacha (mesin slot) */}
      <AnimatePresence>
        {pullResult && (
          <GachaSlotOverlay result={pullResult} onClose={() => setPullResult(null)} />
        )}
      </AnimatePresence>
```

**4c. Rapikan import yang jadi tidak terpakai.** Setelah modal lama dihapus, cek apakah `PACK_RARITY`, `RARITY_STYLE`, atau `PACKS` masih dipakai di `Shop.jsx` (kartu pack di etalase masih pakai `PACKS` + `PACK_RARITY` + `RARITY_STYLE`, jadi **kemungkinan besar masih terpakai** — verifikasi dengan grep, jangan hapus asal):

```bash
grep -nE "PACK_RARITY|RARITY_STYLE|PACKS" src/features/shop/Shop.jsx
```

Jika ada yang hanya dipakai modal lama → hapus dari import.

**Verifikasi:**

```bash
npm run lint 2>&1 | grep -icE "error"     # expect: 0
npm run lint 2>&1 | grep -icE "warning"   # expect: 21 (baseline, TIDAK boleh naik)
npm run build 2>&1 | grep -E "built in"   # expect: ✓ built in ...s
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"   # expect: pass 44, fail 0
```

**Commit:**

```bash
git add src/features/shop/Shop.jsx
git commit -m "feat(shop): gacha pakai layar mesin slot, buang modal hasil lama"
```

---

### Task 5 — Uji runtime nyata di browser (WAJIB)

> `npm run build` **tidak** menangkap error runtime (mis. referensi variabel yang sudah dihapus). Task ini yang menangkapnya.

**5a. Jalankan dev server SENDIRI di 5174** (jangan sentuh 5173 milik user):

```bash
cd "/c/Users/maddo/Documents/japanese-quiz"
npm run dev -- --port 5174 --strictPort > /tmp/dev5174-gacha.log 2>&1 &
sleep 7
tail -4 /tmp/dev5174-gacha.log
netstat -ano | grep LISTENING | grep ":5174"
```

Expected: `VITE v8.x ready` + `TCP [::1]:5174 ... LISTENING`.

**5b. Uji di browser** (`browser_exec`), skenario:

1. Set saldo besar + pack kosong:
   `localStorage['user_progress_v2'] = {...current, medaru: 99999, ownedPacks: [], activePack: null}`
2. Buka `http://localhost:5174/shop`, klik **TARIK 1X**.
3. Cek: overlay muncul (`z-[300]`), **3 reel** ada (`document.querySelectorAll` dalam overlay), tombol ✕ ada.
4. Tunggu ~3s, cek: reel berhenti (tidak ada lagi tombol "Lewati"), blok **Hasil Tarikan** muncul.
5. Klik **TUTUP** → overlay hilang, saldo sudah −100.
6. Klik **TARIK 10X** → tunggu ~3.5s → hasil **10 kartu** muncul.
7. **Cek `window.__errs` kosong** di setiap langkah (pasang `window.addEventListener('error', ...)` + `unhandledrejection`).
8. Uji tombol ✕ saat reel masih muter (harus bisa tutup, saldo tetap terpotong).

**5c. Matikan dev server 5174** dan pastikan 5173 user masih hidup:

```bash
P=$(netstat -ano | grep LISTENING | grep ":5174" | awk '{print $NF}' | head -1)
[ -n "$P" ] && MSYS_NO_PATHCONV=1 taskkill /PID $P /T /F
netstat -ano | grep LISTENING | grep ":5174" || echo "5174 MATI"
netstat -ano | grep LISTENING | grep ":5173" && echo "5173 user AMAN"
```

**5d. Commit** (kalau ada perbaikan dari hasil uji):

```bash
git add -A
git commit -m "fix(gacha): perbaikan dari uji runtime mesin slot"
```

---

### Task 6 — Validasi akhir

```bash
cd "/c/Users/maddo/Documents/japanese-quiz"
echo "=== TEST ===";        npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
echo "=== LINT ===";        echo "error: $(npm run lint 2>&1 | grep -icE 'error') | warning: $(npm run lint 2>&1 | grep -icE 'warning')"
echo "=== BUILD ===";       npm run build 2>&1 | grep -E "built in|error" | head
echo "=== GONG MASIH UTUH ==="; npm test 2>&1 | grep -c "streakGongParams" ; grep -c "streakGongParams" src/utils/sfx.js
echo "=== GIT ===";         git status -s; git log --oneline -6
```

Expected:
- test: `pass 44`, `fail 0`
- lint: `error: 0 | warning: 21`
- build: `✓ built in ...s`
- `streakGongParams` masih ada di `sfx.js` (minimal 2 kemunculan: definisi + pemakaian di `synthGong`)
- working tree bersih (kecuali 2 file plan untracked)

---

## 5. Tests / validation

| Task | Tes | Perintah | Expected |
|---|---|---|---|
| 1 | `slot.test.js` (10 tes) | `npm test` | FAIL dulu (`ERR_MODULE_NOT_FOUND`) → PASS `pass 38` |
| 2 | `sfx.gacha.test.js` (6 tes) + 6 tes gong lama | `npm test` | FAIL dulu → PASS `pass 44` |
| 3 | — (UI) | `npm run lint && npm run build` | `0` error, build sukses |
| 4 | — (integrasi) | `npm test && npm run lint && npm run build` | semua hijau, warning tetap 21 |
| 5 | Runtime browser | `npm run dev -- --port 5174` + `browser_exec` | 0 error konsol, reel berhenti, hasil muncul |
| 6 | Semua | lihat Task 6 | hijau |

**Kriteria lulus akhir:** `npm test` hijau (≥44), `npm run lint` 0 error & ≤21 warning, `npm run build` sukses, `streakGongParams` tidak rusak, uji browser 0 error konsol.

**E2E manual (user, di 5173):**
1. `/settings` → DevPanel → **Medaru 999999**
2. `/shop` → **TARIK 1X** → layar slot muncul, 3 reel muter dengan bunyi *tick*
3. Reel berhenti satu per satu (kiri → tengah → kanan)
4. Kalau dapat legendary → terdengar **fanfare 4 nada**
5. Hasil muncul di bawah → **TUTUP**
6. **TARIK 10X** → 10 kartu hasil
7. Uji tombol ✕ dan tombol **Lewati** di tengah animasi

---

## 6. Risks, tradeoffs, and open questions

### Risks

| Risiko | Dampak | Mitigasi |
|---|---|---|
| **`position: fixed` terkurung di parent ber-`transform`** | Overlay muncul terpotong / tidak full-screen | **Sudah dimitigasi**: pakai `createPortal(overlay, document.body)` (Task 3) |
| **Parent `motion.div` di Shop masih ber-transform saat overlay render** | Sama seperti di atas | Portal menyelesaikannya |
| `node --test` gagal import karena tanpa ekstensi `.js` | Tes tidak jalan | Semua import internal pakai `.js` eksplisit (aturan repo) |
| Menyentuh `sfx.js` merusak 6 tes gong | Regresi fitur streak | Hanya **menambah** di akhir file; Task 6 memverifikasi `streakGongParams` utuh |
| `onAnimationComplete` tidak terpanggil (mis. tab tidak aktif) | Reel "nyangkut", hasil tak muncul | Tombol **Lewati** selalu tersedia selama `!allStopped`; `transition={{duration:0}}` saat reduced-motion |
| Bunyi tick menumpuk (interval 75ms + ekor 30ms) | Suara berisik/berdenging | `dur: 0.03` & `gain: 0.12` — sangat pendek; `clearInterval` saat semua reel berhenti |
| Autoplay diblokir browser sebelum interaksi user | Suara tidak bunyi di klik pertama | Klik tombol TARIK = interaksi user, jadi `AudioContext` boleh jalan; `resume()` sudah ada di helper |
| Overlay muncul saat StrictMode double-render | Animasi dobel / suara dobel | `rollGacha` dipanggil **di luar** overlay (sudah aman); efek suara dijaga `useEffect` + cleanup |
| 10 hasil tapi hanya 3 reel | Bingung "kok reel cuma 3, hasil 10?" | 3 reel = mesin; hasil lengkap muncul di grid bawah. Bisa diubah (lihat Open Questions) |

### Tradeoffs
- **Saldo dipotong sebelum animasi.** Lebih aman (tidak ada risiko double-charge) tapi kalau user menutup overlay di tengah animasi, item sudah masuk walau animasinya belum selesai. Alternatif (potong setelah animasi) jauh lebih rumit dan rawan bug di StrictMode → **YAGNI**.
- **Animasi CSS/`motion` murni, bukan canvas/physics.** Ringan, mudah dirawat, tapi tidak se-"fisik" pachinko asli.
- **`ITEM_H` hardcoded 120px.** Simpel; kalau nanti mau responsif penuh, perlu `useRef` + `offsetHeight`.
- **Simbol reel pakai ikon pack**, bukan seni khusus per pack. Cukup untuk sekarang.

### Open questions (default yang diambil — bilang kalau mau beda)
1. **10x:** 3 reel sekali + grid 10 kartu. *Alternatif:* putar reel 4x berturut-turut (3+3+3+1) — lebih dramatis, lebih rumit.
2. **Bunyi tick:** interval 75ms. *Alternatif:* tick hanya saat simbol lewat di payline (lebih akurat, lebih rumit).
3. **Tombol Lewati:** muncul selama animasi. *Alternatif:* hilangkan, paksa tunggu ~2.5s.
4. **Fanfare:** hanya saat **legendary**. *Alternatif:* fanfare berbeda per rarity (common = 2 nada, rare = 3, legendary = 4) — *sebenarnya ini sudah diimplementasi di `fanfareParams`, tinggal dipanggil dengan rarity yang tepat; saat ini dipanggil dengan `maxRarity` hasil, jadi sudah otomatis berbeda-beda.*
5. **Auto-close:** tidak ada. Overlay hanya tutup via ✕ / TUTUP / Esc.
6. **Esc saat reel masih muter:** saat ini Esc **bisa** menutup kapan saja (listener tidak digerbangi `revealed`), padahal komentar di kode menyebut "hanya setelah reveal". **Pilih satu saat implementasi** — rekomendasi: biarkan bisa kapan saja (konsisten dengan tombol ✕), lalu perbaiki komentarnya.

---

## 7. Ringkasan file

| File | Aksi |
|---|---|
| `src/features/gacha/slot.js` | **BARU** — logika murni |
| `src/features/gacha/slot.test.js` | **BARU** — 10 tes |
| `src/features/gacha/GachaSlotOverlay.jsx` | **BARU** — overlay slot |
| `src/utils/sfx.js` | **EDIT** — tambah tick + fanfare di akhir |
| `src/utils/sfx.gacha.test.js` | **BARU** — 6 tes |
| `src/features/shop/Shop.jsx` | **EDIT** — ganti modal lama dengan overlay |

**Estimasi commit:** 5-6 commit. **Push: DILARANG** sampai user bilang.
