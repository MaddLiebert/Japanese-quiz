# Plan — Item Shop "Efek Layar Quiz" (Kotodama Burst)

**Tanggal:** 2026-09-21
**Workspace:** `C:\Users\maddo\Documents\japanese-quiz`
**Status:** PLAN (belum dieksekusi)

---

## Goal

Menambah satu item permanen di Shop (`/shop`) yang, saat dibeli & di-equip, memunculkan efek visual (partikel + kilat layar) setiap kali user menjawab benar, salah, atau mencapai streak 3 jawaban benar berturut-turut — di **semua mode quiz**.

---

## Current Context / Assumptions

- Stack: React 19 + Vite 8 + Tailwind v4 (`@tailwindcss/vite`) + `motion` v13 + `react-router-dom` v7. Tidak ada framework test (tidak ada vitest/jest). Verifikasi = `npm run build` + `npm run lint` (oxlint) + cek manual di dev server.
- `motion` sudah dipakai di seluruh quiz (`import { motion } from "motion/react"`) dan `AnimatePresence` tersedia dari paket yang sama.
- Token warna app (dari `src/index.css`): `sumi` (#1a1a1a), `ai` (#182b49), `shu` (#d3382f), `kinari`, `kinari-light`, `matcha` (#7d8f69). Semua punya varian dark mode.
- State global ada di `src/features/progress/ProgressContext.jsx` (`ProgressProvider`), persisten ke `localStorage` key `user_progress_v2`.
- Medaru sudah ada: `progress.medaru`, fungsi `spendMedaru(amount)` (mengembalikan `true`/`false`).
- Call site jawaban benar/salah (semua sudah memanggil `playCorrectSound()` / `playWrongSound()` dari `src/utils/sfx.js`):
  - `src/pages/Practice.jsx` — `handleKanaOptionClick` (baris ~149), `handleKotobaOptionClick` (baris ~163).
  - `src/features/quiz/MondaiQuiz.jsx` — `handleSelectOption` (baris ~44).
  - `src/features/quiz/Quiz.jsx` — `handleSelectOption` (baris ~41).
  - Mode Kanji di `src/pages/Practice.jsx` memakai `handleKotobaOptionClick`, jadi tercakup.
- Shop item saat ini di-hardcode di `shopData.items` (`src/features/shop/Shop.jsx`), harga + item mock; tombol Beli memanggil `handlePurchase(price)`.
- **Keputusan user (sudah dikonfirmasi):**
  1. Sistem item: **permanent, bisa ON/OFF (equip toggle)**.
  2. Gaya efek: **partikel/emoji burst + kilat layar** (hijau saat benar, merah saat salah).
  3. Cakupan: **semua mode quiz** (Practice Kana/Kotoba/Kanji + Mondai).
  4. Efek streak muncul saat **3x** benar berturut-turut.
- Asumsi: efek hanya visual; tidak ada dependency audio/asset baru (emoji + CSS). Tidak menambah npm package.

---

## Architecture / Proposed Approach

Buat **satu EffectContext global** (`src/features/effects/EffectContext.jsx`) yang menyimpan daftar partikel aktif + streak internal, dan merender **satu layer overlay** (`fixed inset-0 pointer-events-none`) di App. Quiz hanya memanggil `triggerEffect('correct' | 'wrong')` tepat di samping `playCorrectSound()` / `playWrongSound()` — jadi 1 baris per call site (DRY, tidak perlu ubah markup tiap quiz).

Streak dilacak **di dalam EffectContext** (tiap `'correct'` menaikkan counter, `'wrong'` mereset ke 0); saat counter mencapai 3 → layer otomatis menembak efek streak. Jadi tiap quiz tidak perlu menyimpan state streak sendiri.

Kepemilikan & status aktif efek disimpan di `ProgressContext` (`ownedEffects: string[]`, `activeEffect: string | null`), sehingga tombol Shop bisa menampilkan **BELI → PAKAI/AKTIF → LEPAS**. Overlay hanya jalan kalau `activeEffect === 'kotodama_burst'`.

---

## Step-by-Step Tasks

### Task 1 — Tambah state efek di `ProgressContext.jsx`

**File:** `src/features/progress/ProgressContext.jsx`

**1a.** Di `DEFAULT_PROGRESS` (baris ~26-38), tambahkan 2 field. Ubah menjadi:

```js
const DEFAULT_PROGRESS = {
  xp: 0,
  level: 1,
  accuracy: 0,
  weightedWinRate: 0,
  matchesPlayed: 0,
  medaru: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  streak: 0,
  maxStreak: 0,
  ownedEffects: [],
  activeEffect: null,
  lastActiveDate: getLocalDateString()
};
```

**1b.** Tambahkan konstanta harga efek setelah `MEDARU_PER_CORRECT` (baris ~44):

```js
export const EFFECT_PRICES = { kotodama_burst: 2500 };
```

**1c.** Tambahkan dua fungsi setelah `spendMedaru` (setelah baris ~407, sebelum `resetProgress`):

```js
  // Beli efek permanen. Return: 'bought' | 'owned' | 'poor'
  const buyEffect = useCallback((effectId) => {
    const price = EFFECT_PRICES[effectId] || 0;
    const owned = progressRef.current?.ownedEffects || [];
    if (owned.includes(effectId)) return 'owned';
    const balance = progressRef.current?.medaru || 0;
    if (balance < price) return 'poor';
    setProgress(prev => {
      const ownedNow = prev.ownedEffects || [];
      if (ownedNow.includes(effectId)) return prev;
      const bal = prev.medaru || 0;
      if (bal < price) return prev;
      return {
        ...prev,
        medaru: bal - price,
        ownedEffects: [...ownedNow, effectId],
        activeEffect: effectId
      };
    });
    return 'bought';
  }, []);

  // ON/OFF efek. Return true kalau sekarang aktif.
  const toggleEffect = useCallback((effectId) => {
    let nowActive = false;
    setProgress(prev => {
      const ownedNow = prev.ownedEffects || [];
      if (!ownedNow.includes(effectId)) return prev;
      const willActivate = prev.activeEffect !== effectId;
      nowActive = willActivate;
      return { ...prev, activeEffect: willActivate ? effectId : null };
    });
    return nowActive;
  }, []);
```

**1d.** Tambahkan `buyEffect` & `toggleEffect` ke provider value (baris ~421):

```js
    <UserStatsContext.Provider value={{ progress, username, setUsername, addXp, completeQuiz, spendMedaru, buyEffect, toggleEffect, resetProgress }}>
```

> Catatan: `resetProgress` sudah otomatis mengosongkan `ownedEffects`/`activeEffect` karena memakai `DEFAULT_PROGRESS`.

**Verifikasi Task 1:**
```bash
npm run build 2>&1 | grep -E "✓ built|error|PARSE"
```
Expected: `✓ built in ...` tanpa error.

---

### Task 2 — Buat komponen efek: `src/features/effects/EffectContext.jsx`

**File baru:** `src/features/effects/EffectContext.jsx`

Buat file dengan isi lengkap berikut:

```jsx
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUserStats } from '../progress/ProgressContext';

const EffectContext = createContext(null);
export const useEffectLayer = () => {
  const ctx = useContext(EffectContext);
  if (!ctx) throw new Error('useEffectLayer must be used within an EffectProvider');
  return ctx;
};

export const EFFECT_ID = 'kotodama_burst';
const STREAK_THRESHOLD = 3;
const PARTICLE_EMOJIS = ['✨', '🌸', '💮', '⭐', '🎉'];

let particleSeq = 0;

export function EffectProvider({ children }) {
  const { progress } = useUserStats();
  const [flash, setFlash] = useState(null);   // 'correct' | 'wrong' | 'streak' | null
  const [particles, setParticles] = useState([]);
  const streakRef = useRef(0);

  const active = progress.activeEffect === EFFECT_ID;

  const spawnParticles = useCallback((type) => {
    const count = type === 'streak' ? 16 : type === 'correct' ? 8 : 6;
    const batch = Array.from({ length: count }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 90 + Math.random() * 160;
      return {
        id: ++particleSeq,
        emoji: type === 'wrong'
          ? '💢'
          : PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotate: Math.random() * 360 - 180,
        scale: 0.8 + Math.random() * 0.9,
        size: 22 + Math.random() * 22
      };
    });
    setParticles(prev => [...prev, ...batch]);
    setTimeout(() => {
      const ids = new Set(batch.map(p => p.id));
      setParticles(prev => prev.filter(p => !ids.has(p.id)));
    }, 900);
  }, []);

  const triggerEffect = useCallback((type) => {
    if (!active) return;
    if (type === 'correct') {
      streakRef.current += 1;
    } else if (type === 'wrong') {
      streakRef.current = 0;
    }
    const isStreak = type === 'correct' && streakRef.current >= STREAK_THRESHOLD;
    const kind = isStreak ? 'streak' : type;
    setFlash(kind);
    spawnParticles(kind);
    setTimeout(() => setFlash(null), kind === 'streak' ? 650 : 450);
  }, [active, spawnParticles]);

  const resetEffectStreak = useCallback(() => { streakRef.current = 0; }, []);

  return (
    <EffectContext.Provider value={{ triggerEffect, resetEffectStreak, active }}>
      {children}
      <EffectLayer flash={flash} particles={particles} />
    </EffectContext.Provider>
  );
}

function EffectLayer({ flash, particles }) {
  const flashClass =
    flash === 'wrong' ? 'bg-shu/25'
      : flash === 'streak' ? 'bg-[#ffd700]/30'
        : flash === 'correct' ? 'bg-matcha/20'
          : '';

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* Screen flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={`absolute inset-0 ${flashClass}`}
          />
        )}
      </AnimatePresence>

      {/* Wrong = screen shake */}
      {flash === 'wrong' && (
        <motion.div
          className="absolute inset-0"
          animate={{ x: [0, -12, 12, -8, 8, 0] }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* Particles burst from center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence>
          {particles.map(p => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, x: 0, y: 0, scale: 0.3 }}
              animate={{ opacity: 0, x: p.x, y: p.y, scale: p.scale, rotate: p.rotate }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              className="absolute select-none"
              style={{ fontSize: p.size }}
            >
              {p.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Streak banner */}
      <AnimatePresence>
        {flash === 'streak' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 bg-[#ffd700] border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] px-6 py-3"
          >
            <span className="text-xl font-black tracking-widest text-sumi">
              連続 3× STREAK!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Verifikasi Task 2:**
```bash
npm run build 2>&1 | grep -E "✓ built|error|PARSE"
```
Expected: `✓ built in ...` tanpa error. (Belum ada yang meng-import, jadi belum kelihatan di UI.)

---

### Task 3 — Pasang `EffectProvider` di `App.jsx`

**File:** `src/App.jsx`

**3a.** Tambahkan import (setelah import ProgressContext, baris ~5):

```js
import { EffectProvider } from "./features/effects/EffectContext";
```

**3b.** Bungkus tree. `EffectProvider` harus **di dalam** `ProgressProvider` (butuh `useUserStats`). Ubah isi `function App()` (baris ~65-105) menjadi:

```jsx
function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ProgressProvider>
          <EffectProvider>
            <BrowserRouter>
              <div className="min-h-screen relative font-sans selection:bg-ai/20 overflow-x-hidden bg-[var(--backdrop-val)]">

                {/* 1. Global Washi Texture overlay */}
                <div
                  className="fixed inset-0 pointer-events-none z-0 mix-blend-multiply opacity-[0.4] dark:opacity-[0.15]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.25'/%3E%3C/svg%3E")`
                  }}
                />

                {/* 2. Abstract background motif (Seigaiha radiating from center) */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-10 dark:opacity-5 bg-seigaiha mask-image:radial-gradient(circle_at_center,black,transparent_70%)"></div>

                {/* Global Top Controls */}
                <TopControls />

                <main className="relative z-10 w-full h-full">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/learn" element={<Learn />} />
                    <Route path="/practice" element={<Practice />} />
                    <Route path="/mondai" element={<MondaiChapterFlow />} />
                    <Route path="/review" element={<Review />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </main>
              </div>
            </BrowserRouter>
          </EffectProvider>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
```

> PENTING: jaga indentasi/JSX tetap valid; jangan hapus `<Routes>` yang sudah ada. Kalau ragu, cukup sisipkan `<EffectProvider>` tepat di dalam `<ProgressProvider>` dan tutup `</EffectProvider>` tepat sebelum `</ProgressProvider>`, tanpa mengubah baris lain.

**Verifikasi Task 3:**
```bash
npm run build 2>&1 | grep -E "✓ built|error|PARSE"
```
Expected: `✓ built in ...` tanpa error.

---

### Task 4 — Panggil `triggerEffect` di semua call site quiz

Pola: tambahkan 1 baris tepat setelah `playCorrectSound()` → `triggerEffect('correct')`, dan setelah `playWrongSound()` → `triggerEffect('wrong')`. Juga import hook di tiap file, dan panggil `resetEffectStreak()` saat quiz mulai/ulang.

**4a. `src/pages/Practice.jsx`**

- Import (setelah baris ~18):
```js
import { useEffectLayer } from "../features/effects/EffectContext";
```
- Di dalam `export function Practice()` (setelah baris ~99, dekat `useNavigate`):
```js
  const { triggerEffect, resetEffectStreak } = useEffectLayer();
```
- `handleKanaOptionClick` (baris ~149-160) → ubah blok if/else jadi:
```js
    const correct = option.id === currentQuestion.id;
    if (correct) {
      playCorrectSound();
      triggerEffect('correct');
    } else {
      playWrongSound();
      triggerEffect('wrong');
    }
```
- `handleKotobaOptionClick` (baris ~163-173) → ubah blok if/else jadi:
```js
    const correct = option.id === currentQuestion.id;
    if (correct) {
      playCorrectSound();
      triggerEffect('correct');
    } else {
      playWrongSound();
      triggerEffect('wrong');
    }
```
- Reset streak saat mulai quiz: di `handleStartQuiz` (baris ~245) dan `handleFullChallenge` (baris ~251), tambahkan `resetEffectStreak();` sebelum `setQuizStarted(true);`.

> Jika lint memperingatkan dependency array `useEffect` keyboard (baris ~216), `triggerEffect`/`resetEffectStreak` bersifat stabil (useCallback) — tidak wajib ditambah, tapi boleh.

**4b. `src/features/quiz/MondaiQuiz.jsx`**

- Import (setelah baris ~9):
```js
import { useEffectLayer } from "../effects/EffectContext";
```
- Di dalam `MondaiQuiz()` (setelah baris ~22):
```js
  const { triggerEffect, resetEffectStreak } = useEffectLayer();
```
- `handleSelectOption` (baris ~44-50) → ubah blok if/else jadi:
```js
    if (isCorrect) {
      playCorrectSound();
      triggerEffect('correct');
      setScore(newScore);
    } else {
      playWrongSound();
      triggerEffect('wrong');
      setWrongAnswers((prev) => [...prev, currentIndex]);
    }
```
- Di `onPlayAgain` (baris ~94-102), tambahkan `resetEffectStreak();` di dalam blok.

**4c. `src/features/quiz/Quiz.jsx`**

- Import (setelah baris ~7):
```js
import { useEffectLayer } from "../effects/EffectContext";
```
- Di dalam `const Quiz = ({...})` (setelah baris ~18):
```js
  const { triggerEffect, resetEffectStreak } = useEffectLayer();
```
- `handleSelectOption` (baris ~41-47) → ubah blok if/else jadi:
```js
    if (isCorrect) {
      playCorrectSound();
      triggerEffect('correct');
      setScore(newScore);
    } else {
      playWrongSound();
      triggerEffect('wrong');
      setWrongAnswers((prev) => [...prev, currentQuestion.id]);
    }
```
- Di `handleNext` (baris ~57), saat pindah soal tidak perlu reset; reset cukup saat quiz di-mount. Tambahkan di awal komponen:
```js
  useEffect(() => { resetEffectStreak(); }, [resetEffectStreak]);
```
  (tambahkan `useEffect` ke import React di baris 1: `import React, { useState, useEffect } from "react";`)

**Verifikasi Task 4:**
```bash
npm run build 2>&1 | grep -E "✓ built|error|PARSE"
npm run lint 2>&1 | grep -iE "Practice.jsx|MondaiQuiz.jsx|Quiz.jsx"
```
Expected: build `✓ built in ...`; lint tidak menampilkan error baru untuk ketiga file (warning `only-export-components` yang sudah ada di ProgressContext bukan error).

---

### Task 5 — Tambah item di Shop + tombol BELI/PAKAI/LEPAS

**File:** `src/features/shop/Shop.jsx`

**5a.** Tambahkan item ke `shopData.items` (setelah item id 4, baris ~19):

```js
    {
      id: 5,
      icon: "✨",
      name: "Kotodama Burst",
      desc: "Efek partikel & kilat tiap jawaban (permanen)",
      price: 2500,
      isEffect: true,
      effectId: "kotodama_burst"
    },
```

**5b.** Ubah baris import `useUserStats` (baris 4) untuk mengambil fungsi baru:

```js
import { useUserStats, getRank } from "../progress/ProgressContext";
```
dan di dalam komponen (baris ~24):
```js
  const { progress, spendMedaru, buyEffect, toggleEffect } = useUserStats();
```

**5c.** Tambahkan handler efek setelah `handlePurchase` (baris ~40):

```js
  const handleEffectAction = (item) => {
    const owned = (progress.ownedEffects || []).includes(item.effectId);
    const isActive = progress.activeEffect === item.effectId;

    if (!owned) {
      const result = buyEffect(item.effectId);
      if (result === 'poor') {
        alert(language === 'id'
          ? `Medaru kurang! Butuh ${item.price}, saldo kamu ${medaru}.`
          : `Not enough Medaru! Need ${item.price}, you have ${medaru}.`);
      } else {
        alert(language === 'id' ? "Efek dibeli & diaktifkan!" : "Effect purchased & activated!");
      }
      return;
    }
    toggleEffect(item.effectId);
    alert(isActive
      ? (language === 'id' ? "Efek dimatikan." : "Effect turned off.")
      : (language === 'id' ? "Efek diaktifkan!" : "Effect activated!"));
  };
```

**5d.** Ubah blok tombol di kartu etalase (baris ~169-177) supaya item efek punya label & aksi berbeda. Ganti seluruh `<button ...>BELI - {item.price} 🪙</button>` menjadi:

```jsx
                    {item.isEffect ? (() => {
                      const owned = (progress.ownedEffects || []).includes(item.effectId);
                      const isActive = progress.activeEffect === item.effectId;
                      const affordable = medaru >= item.price;
                      const label = !owned
                        ? `BELI - ${item.price} 🪙`
                        : isActive ? 'AKTIF ✓ (klik untuk OFF)' : 'PAKAI';
                      const color = isActive
                        ? 'bg-matcha text-kinari-light'
                        : (owned || affordable) ? 'bg-ai text-kinari-light' : 'bg-kinari-light text-sumi/50';
                      return (
                        <button
                          type="button"
                          onClick={() => handleEffectAction(item)}
                          className={`py-3 font-black text-sm w-full border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none transition-all ${color}`}
                        >
                          {label}
                        </button>
                      );
                    })() : (
                      <button
                        type="button"
                        onClick={() => handlePurchase(item.price)}
                        className={`py-3 font-black text-lg w-full border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none transition-all ${
                          medaru >= item.price ? "bg-ai text-kinari-light" : "bg-kinari-light text-sumi/50"
                        }`}
                      >
                        BELI - {item.price} 🪙
                      </button>
                    )}
```

> Catatan grid: item ke-5 akan membungkus ke baris berikutnya pada `lg:grid-cols-4`. Ini OK (grid `1/2/4` kolom). Kalau mau rapi, ubah grid menjadi `lg:grid-cols-3` — opsional, tanyakan user.

**Verifikasi Task 5:**
```bash
npm run build 2>&1 | grep -E "✓ built|error|PARSE"
npm run lint 2>&1 | grep -iE "Shop.jsx"
```
Expected: `✓ built in ...`; tidak ada error lint baru di `Shop.jsx`.

---

### Task 6 — Verifikasi end-to-end manual (dev server)

```bash
npm run dev
```
Lalu di browser:
1. Buka `/shop`. Kartu **"✨ Kotodama Burst"** muncul dengan tombol `BELI - 2500 🪙`.
2. Saldo awal 0 → klik BELI → alert "Medaru kurang!". ✅ (guard saldo)
3. Main quiz dulu (Practice Hiragana 1 baris, 4 soal) sampai dapat medaru ≥ 2500 (menang penuh 4 soal = +8; ini kecil, jadi untuk uji cepat: buka DevTools console, jalankan
   `localStorage.setItem('user_progress_v2', JSON.stringify({...JSON.parse(localStorage.getItem('user_progress_v2')||'{}'), medaru: 3000}))` lalu reload).
4. Beli efek → alert "Efek dibeli & diaktifkan!" → saldo turun 2500 → tombol jadi `AKTIF ✓ (klik untuk OFF)`.
5. Masuk Practice, jawab soal: benar → kilat hijau + burst ✨; salah → kilat merah + getar; 3x benar berturut → banner `連続 3× STREAK!` + burst emas.
6. Ulangi di Mondai (audio quiz) → efek sama muncul.
7. Kembali ke Shop → klik `AKTIF ✓` → jadi `PAKAI`; masuk quiz → **tidak ada** efek lagi. ✅ (toggle)
8. Buka `/settings` → Reset Data → cek `ownedEffects`/`activeEffect` hilang (efek tak aktif, tombol kembali `BELI`).

---

## Tests / Validation

Repo **tidak punya test runner** (tidak ada vitest/jest di `package.json`). Karena itu TDD unit test tidak bisa diterapkan tanpa menambah dependency — **jangan** tambah vitest untuk fitur visual ini (YAGNI). Validasi yang dipakai:

1. **Build gate** (setiap task): `npm run build 2>&1 | grep -E "✓ built|error|PARSE"` → harus `✓ built in ...`.
2. **Lint gate** (task 4 & 5): `npm run lint 2>&1 | grep -iE "Practice.jsx|MondaiQuiz.jsx|Quiz.jsx|Shop.jsx"` → tidak ada error baru.
3. **Manual E2E** (Task 6) dengan 8 langkah di atas.

**Opsional (kalau mau bukti otomatis tanpa dependency baru):** jalankan logika murni (tanpa React) lewat node untuk memverifikasi aturan streak/harga:
```bash
node -e "
const EFFECT_PRICES={kotodama_burst:2500};
const STREAK=3;
function run(seq){let s=0,out=[];for(const t of seq){if(t==='correct'){s++;}else if(t==='wrong'){s=0;}
  out.push(t==='correct'&&s>=STREAK?'streak':t);}return out;}
console.log(run(['correct','correct','correct']));   // ['correct','correct','streak']
console.log(run(['correct','wrong','correct','correct','correct'])); // [...,'correct','correct','streak']
console.log('price', EFFECT_PRICES.kotodama_burst);
"
```
Expected output:
```
[ 'correct', 'correct', 'streak' ]
[ 'correct', 'wrong', 'correct', 'correct', 'streak' ]
price 2500
```

**Commit:** jangan commit/push sampai user bilang "push" (instruksi berdiri: *"jangan di push sebelum gw bilang"*). Kalau user minta commit, commit per task dengan pesan `feat(shop): kotodama burst effect — <task>`.

---

## Risks, Tradeoffs, dan Open Questions

**Risks / tradeoffs:**
- **Streak lintas quiz:** `streakRef` hidup di EffectProvider global. Kalau user pindah quiz tanpa menyelesaikan (mis. tekan Back setelah 2 benar), counter bisa "nyangkut" dan efek streak muncul di quiz berikutnya lebih cepat. Mitigasi: `resetEffectStreak()` dipanggil di tiap titik mulai quiz (Task 4). Risiko sisa rendah (hanya 1 kasus tepi).
- **`setTimeout` di EffectContext** tidak dibersihkan saat unmount — karena EffectProvider hidup seumur app, dampaknya nihil. Tapi kalau nanti jadi masalah, simpan timer id di ref dan clear di cleanup.
- **Layer `z-[100]`** sengaja di atas `TopControls` (`z-50`) — pastikan tidak menghalangi klik: seluruh layer `pointer-events-none`, jadi aman.
- **Performa:** maksimal ~16 partikel DOM per jawaban, dibersihkan dalam 900ms. Aman.
- **Dark mode:** `bg-matcha/20`, `bg-shu/25`, `bg-[#ffd700]/30` tetap terbaca di dark. Token `shu`/`matcha` sudah punya varian dark.
- **`handlePurchase` lama** tetap ada untuk 4 item consumable (belum ada efek gameplay-nya). Item efek pakai jalur baru (`handleEffectAction`).
- **Reduced motion:** belum menangani `prefers-reduced-motion`. Bisa ditambah nanti (bukan bagian permintaan).

**Open questions (jawab kalau perlu, kalau tidak biarkan default):**
1. Harga 2500 medaru sudah pas? (default: 2500)
2. Grid etalase tetap `lg:grid-cols-4` (item ke-5 bikin baris baru) atau ubah ke `lg:grid-cols-3`? (default: biarkan 4)
3. Nama item "Kotodama Burst" & ikon ✨ OK? (default: ya)
4. Efek salah berupa getar + kilat merah — atau cukup kilat saja? (default: getar + kilat)
