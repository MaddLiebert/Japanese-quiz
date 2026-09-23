# Plan — Perbaiki Gong Streak yang Tidak Kedengaran (Inaudible)

**Tanggal:** 2026-09-22 10:15
**Workspace:** `C:\Users\maddo\Documents\japanese-quiz`
**Status:** 📝 BELUM DIEKSEKUSI
**Terkait:** `2026-09-21_154130-streak-number-and-tiered-sound.md` (plan asal gong ini), commit `aacb191` (gong kontinu), commit `0396535` (fitur streak)

---

## 1. Goal

Bikin suara gong streak (`playStreakSound`) **kedengeran jelas** di speaker laptop/HP, sambil tetap terasa "makin intens" saat streak naik — tanpa mengubah efek visual.

---

## 2. Current Context / Assumptions

### Gejala (dari user)
- Suara hilang **mulai jawaban benar ke-2/ke-3** (tepat saat `playStreakSound` mulai dipakai, yaitu streak ≥ 3).
- **Efek visual (tinta/sigil/gong) tetap muncul normal.**
- Chime jawaban benar biasa (streak 1–2) **kedengeran normal**.

### Akar masalah (terverifikasi dari kode)
`src/utils/sfx.js` baris 84–140 — `playStreakSound(level)`:
- `base = 150 - heat * 40` → **150 Hz → 110 Hz**.
- Partial: `GONG_RATIOS = [1, 1.51, 2.13, 2.74, 3.61, 4.29]`, semua **sine** murni.
- `peak = 0.30` dibagi ke `totalW` partial → **gain per partial hanya ~0.05–0.15**.

Hasil pengukuran (dijalankan read-only):

```
heat 0: base=150Hz partials(Hz)=[150,227]              tiapGain~0.15
heat 0.5: base=130Hz partials(Hz)=[130,196,277,356]    tiapGain~0.07
heat 1: base=110Hz partials(Hz)=[110,166,234,301,397,472] tiapGain~0.05
Chime pembanding: 523-659 Hz @ gain 0.8 (ini yang kedengeran)
```

**Kesimpulan:** isi gong ada di **110–150 Hz pada gain ~0.05–0.15**. Speaker kecil (laptop/HP) meredam frekuensi di bawah ~200 Hz, dan gain 0.05–0.15 praktis senyap. Chime (523–659 Hz @ 0.8) lolos karena frekuensinya tinggi dan gain-nya 5–16× lebih besar. **Ini bug desain frekuensi/gain, bukan bug runtime.**

### Konteks teknis
- Stack: React 19 + Vite 8 + Tailwind v4. **Tidak ada test runner.**
- `package.json` → `"type": "module"`, Node **v24.18.1** → bisa pakai **built-in `node --test`** (zero dependency, cocok YAGNI).
- `src/utils/sfx.js` mengakses `window` **hanya di dalam** `initAudioContext()` → aman di-import di Node selama fungsi audio tidak dipanggil.
- Pemanggil: `src/features/effects/EffectContext.jsx` baris 167 → `playStreakSound(streakSoundLevel(streakRef.current))`. `playStreakSound` **tidak** dipanggil dari tempat lain (sudah dicek via grep).

### Asumsi
- Perbaikan **hanya** di `src/utils/sfx.js` (+ file test baru). Tidak menyentuh `EffectContext.jsx` / visual.
- Ambang & logika level (`streakSoundLevel`, `heatFor`) **tidak diubah** — yang diperbaiki hanya karakter suara di dalam `playStreakSound`.

---

## 3. Architecture / Proposed Approach

Pisahkan **komputasi parameter gong** (murni, bisa dites di Node) dari **pemutaran Web Audio**. Tambah fungsi murni `streakGongParams(level)` yang mengembalikan `{ base, dur, partials[], strike }` dengan frekuensi **di rentang audible speaker** (base ~200–260 Hz, ada partial ≥ 500 Hz) dan total gain ~0.85 (setara chime), lalu `playStreakSound` tinggal memutar parameter itu. Naiknya "intensitas" saat streak naik datang dari **partial makin banyak + transient makin terang + durasi makin panjang**, bukan dari menurunkan frekuensi (yang justru bikin senyap).

> **Deviasi sadar dari keputusan lama:** plan `2026-09-21_154130` keputusan #10 bilang "base makin rendah/dalam per tier" (`150 - layers*8`). Itu **penyebab utama suara hilang**, jadi sengaja dibalik (base naik ringan 200→260 Hz). Lihat §6 Open Questions.

---

## 4. Step-by-step Tasks

> Prinsip: TDD — tulis tes gagal dulu, jalankan (harus FAIL), implementasi minimal, jalankan (harus PASS), commit.

### Task 1 — Siapkan test runner `node --test`

**File:** `package.json`

Tambahkan script `test` (edit bagian `scripts`):

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "oxlint",
  "preview": "vite preview",
  "test": "node --test"
}
```

**Verifikasi:**
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm test
```
**Expected:** keluar ringkasan test runner tanpa error fatal (mis. `tests 0`, `pass 0`). Kalau `npm test` bilang "no test files found", itu **OK** untuk langkah ini.

**Commit:**
```bash
git add package.json && git commit -m "chore(test): tambah runner node --test (zero-dep)"
```

---

### Task 2 — Tulis tes GAGAL untuk `streakGongParams`

**File baru:** `src/utils/sfx.params.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { streakGongParams } from './sfx.js';

const LEVELS = [1, 2, 3, 5, 7, 10, 12];

test('base frequency ada di rentang audible speaker (180-400 Hz)', () => {
  for (const l of LEVELS) {
    const { base } = streakGongParams(l);
    assert.ok(base >= 180 && base <= 400, `level ${l}: base ${base}Hz di luar 180-400`);
  }
});

test('semua partial ada di rentang audible dan ada konten >= 500 Hz', () => {
  for (const l of LEVELS) {
    const { partials } = streakGongParams(l);
    assert.ok(partials.length >= 2, `level ${l}: partial terlalu sedikit`);
    for (const p of partials) {
      assert.ok(p.freq >= 180 && p.freq <= 5000, `level ${l}: partial ${p.freq}Hz di luar rentang`);
      assert.ok(p.gain > 0 && p.gain <= 0.6, `level ${l}: gain partial ${p.gain} tidak sehat`);
    }
    assert.ok(partials.some(p => p.freq >= 500), `level ${l}: tidak ada partial >= 500Hz (bakal senyap)`);
  }
});

test('total energi cukup keras tapi tidak clipping', () => {
  for (const l of LEVELS) {
    const { partials } = streakGongParams(l);
    const sum = partials.reduce((a, p) => a + p.gain, 0);
    assert.ok(sum >= 0.4 && sum <= 1.2, `level ${l}: total gain ${sum.toFixed(3)} di luar 0.4-1.2`);
  }
});

test('durasi wajar', () => {
  for (const l of LEVELS) {
    const { dur } = streakGongParams(l);
    assert.ok(dur >= 0.8 && dur <= 3.5, `level ${l}: dur ${dur} di luar 0.8-3.5s`);
  }
});

test('intensitas non-menurun saat streak naik (partial & dur)', () => {
  let prevCount = 0;
  let prevDur = 0;
  for (const l of LEVELS) {
    const { partials, dur } = streakGongParams(l);
    assert.ok(partials.length >= prevCount, `level ${l}: jumlah partial turun`);
    assert.ok(dur >= prevDur, `level ${l}: dur turun`);
    prevCount = partials.length;
    prevDur = dur;
  }
});

test('transient strike makin terang saat tier tinggi', () => {
  const low = streakGongParams(1).strike;
  const high = streakGongParams(12).strike;
  assert.ok(high.freq >= low.freq, 'frekuensi strike harus naik');
  assert.ok(high.gain >= low.gain, 'gain strike harus naik');
});
```

**Verifikasi (harus GAGAL):**
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm test
```
**Expected:** FAIL dengan error seperti `SyntaxError: The requested module './sfx.js' does not provide an export named 'streakGongParams'` (atau `streakGongParams is not a function`). Ini membuktikan tes benar-benar menguji sesuatu.

---

### Task 3 — Implementasi `streakGongParams` (murni) + rewrite `playStreakSound`

**File:** `src/utils/sfx.js`

**3a.** Ganti seluruh blok dari baris komentar `// ── Gong bertingkat untuk streak — KONTINU (halus) ──` sampai akhir file (baris 74–140) dengan kode berikut:

```js
// ── Gong bertingkat untuk streak — KONTINU & AUDIBLE ────────────────────────
// Catatan: gong versi lama pakai base 110-150Hz @ gain 0.05-0.15 → praktis
// SENYAP di speaker laptop/HP. Sekarang base dinaikkan ke rentang audible,
// ditambah partial terang + transient, dan total gain disetel setara chime.
const GONG_RATIOS = [1, 1.5, 2.0, 3.0, 4.2, 5.8]; // partial inharmonik khas logam
const MAX_LEVEL = 12;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const heatFor = (level) => clamp01(((level || 0) - 1) / (MAX_LEVEL - 1));

// Murni (tanpa Web Audio) supaya bisa dites dengan `node --test`.
// Mengembalikan parameter gong untuk sebuah level streak.
export function streakGongParams(level = 0) {
  const heat = heatFor(level);

  const base = 200 + heat * 60;              // 200 -> 260 Hz (audible, naik ringan)
  const dur = 1.0 + heat * 1.6;              // 1.0 -> 2.6 s
  const partialLevel = 2 + heat * (GONG_RATIOS.length - 2); // 2 -> 6 partial
  const weights = GONG_RATIOS.map((_, i) => clamp01(partialLevel - i));
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;
  const peak = 0.85;                         // total energi (setara chime 0.8)

  const partials = GONG_RATIOS
    .map((ratio, i) => ({ freq: base * ratio, gain: peak * (weights[i] / totalW), weight: weights[i] }))
    .filter(p => p.weight > 0.001);

  const strike = {
    freq: 2200 + heat * 1400,               // 2200 -> 3600 Hz (terang, nembus)
    gain: clamp01(heat * 1.6 - 0.3) * 0.18, // muncul mulai tier menengah
    dur: 0.06,
  };

  return { heat, base, dur, partials, strike };
}

export const playStreakSound = (level = 0) => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const { dur, partials, strike } = streakGongParams(level);
  const t = ctx.currentTime;

  // Body gong: osilator sine dengan serangan cepat + ekor "mengendap".
  partials.forEach((p) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.freq, t);
    osc.frequency.exponentialRampToValueAtTime(p.freq * 0.96, t + dur);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(p.gain, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  });

  // Transient "stik menghantam logam": tinggi & pendek supaya jelas terdengar.
  if (strike.gain > 0.001) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(strike.freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(strike.gain, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + strike.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + strike.dur + 0.02);
  }
};
```

> Pastikan tidak ada sisa referensi `STREAK_LAYERS` / `GONG_RATIOS` lama yang menggantung. `playCorrectSound` (baris 13–42) dan `playWrongSound` (baris 44–72) **tidak diubah**.

**Verifikasi (harus PASS):**
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm test
```
**Expected:** semua tes `pass`, `fail 0`.

**Commit:**
```bash
git add src/utils/sfx.js src/utils/sfx.params.test.js && git commit -m "fix(sfx): gong streak audible — base 200-260Hz + partial terang + transient

Gong lama (base 110-150Hz @ gain 0.05-0.15) praktis senyap di speaker
laptop/HP. Sekarang: base audible, partial >=500Hz, total gain ~0.85
(setara chime), durasi/transient naik per tier. Logika param dipisah ke
streakGongParams() murni + dites via node --test."
```

---

### Task 4 — Verifikasi lint & build

**Verifikasi:**
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm run lint && npm run build
```
**Expected:**
- `lint`: tidak ada `error` baru (warning lama boleh tetap ada). Kalau `oxlint` mengeluh file test, tambahkan `src/utils/sfx.params.test.js` ke ignore atau abaikan (test file bukan bagian bundle).
- `build`: `✓ built in <N>s` tanpa error.

**Kalau lint komplain file test:** tambahkan baris ignore di `.oxlintrc.json` (buat kalau belum ada):
```json
{ "ignorePatterns": ["**/*.test.js"] }
```
lalu ulangi `npm run lint`.

---

### Task 5 — Cek dengar manual (verifikasi akhir, oleh user)

Tidak bisa diotomasi (butuh telinga), jadi jalankan dev server:

```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm run dev
```
Buka app → main kuis → jawab benar berturut-turut dan **dengar**:
- Jawaban 1–2: chime biasa (tetap seperti sebelumnya).
- Jawaban ke-3+ (streak naik): **gong terdengar jelas**, dan makin tinggi streak makin "besar/terang" (bukan makin pelan).
- Jawab salah: streak reset, gong berhenti.

**Expected:** gong terdengar di semua tier; tidak ada yang senyap.

**Kalau masih kurang keras**, naikkan `peak` di `streakGongParams` dari `0.85` → `1.0` (jangan lebih, bisa clipping), lalu ulangi `npm test`.

**Commit (kalau ada tweak):**
```bash
git add src/utils/sfx.js && git commit -m "tweak(sfx): naikkan gain gong streak ke 1.0"
```

---

## 5. Tests / Validation

| Level | Cara | Expected |
|---|---|---|
| Unit (murni) | `npm test` | 6 tes PASS: base 180–400Hz, ada partial ≥500Hz, total gain 0.4–1.2, dur 0.8–3.5s, monoton, strike naik |
| Statis | `npm run lint` | 0 error baru |
| Build | `npm run build` | `✓ built in …s`, PWA precache OK |
| Manual (telinga) | `npm run dev` → jawab benar beruntun | gong terdengar mulai streak 3 dan makin intens |

**TDD loop per task:** Task 2 = tulis tes → `npm test` GAGAL → Task 3 = implementasi → `npm test` PASS → commit. Jangan lanjut sebelum tes hijau.

---

## 6. Risks, Tradeoffs, and Open Questions

**Risks / tradeoffs**
- **Deviasi dari keputusan lama (#10):** base sekarang naik (200→260Hz), bukan turun. Konsekuensi: gong terasa "lebih terang/ringan", bukan "makin dalam" saat streak tinggi. Ini **disengaja** karena versi dalam = senyap. Kalau user tetap mau nuansa "dalam", alternatifnya: pertahankan base ~200Hz tetap, dan taruh "kepala" gong di partial ke-2/3 (yang jatuh di 300–600Hz) supaya tetap audible.
- **`peak 0.85` bisa clipping** kalau partial bertumpuk di fase yang sama. Kalau terdengar pecah/distorsi, turunkan ke `0.6` atau tambah `ctx.createDynamicsCompressor()` sebelum `destination`.
- **Speaker berbeda-beda:** yang audible di laptop bisa beda di HP. `npm test` hanya menjamin parameter di rentang audible secara teori; keputusan akhir tetap telinga user (Task 5).
- **`node --test` di Windows/Git-Bash:** pastikan dijalankan dari root project. Kalau glob tidak ketemu, pakai `node --test src/utils/sfx.params.test.js`.

**Open questions**
1. Nuansa yang diinginkan: **terang & jelas** (rencana sekarang) vs **dalam & berat** (perlu kompromi audibility)? Default plan: terang & jelas.
2. Apakah `Review.jsx` (chime biasa, tanpa gong) juga mau dibuat bertingkat? Default: **tidak** (di luar scope, sesuai keputusan #8 plan lama).
3. Perlu `DynamicsCompressor` global untuk semua SFX, atau cukup gain manual? Default: **cukup gain manual** (YAGNI) sampai terbukti perlu.
