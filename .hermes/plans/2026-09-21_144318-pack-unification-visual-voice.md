# Plan — Unifikasi Efek Visual + Voice jadi "Theme Pack" (6 Varian, Gacha)

**Tanggal:** 2026-09-21 14:43
**Workspace:** `C:\Users\maddo\Documents\japanese-quiz`
**Status:** PLAN — **siap eksekusi** (8 pertanyaan terbuka sudah dijawab user, lihat §2 & §6)
**Terkait:** `2026-09-21_143704-full-tiered-streak-effects.md` (plan streak bertingkat — **dieksekusi DULU**, lihat §0)

---

## 0. Urutan Eksekusi (WAJIB — keputusan user #7 = "a")

Plan ini **dan** `2026-09-21_143704-full-tiered-streak-effects.md` sama-sama mengubah `src/features/effects/EffectContext.jsx`. **Jangan dikerjakan paralel** — bentrok. Urutan yang disetujui user:

```
LANGKAH 1 ──► Plan STREAK BERTINGKAT  (.hermes/plans/2026-09-21_143704-full-tiered-streak-effects.md)
              - EffectContext.jsx: STREAK_TIERS, StreakSigil, intensityFor()
              - sfx.js: pakai playStreakSound() untuk milestone
              - Verifikasi: npm run build sukses
                    │
                    ▼
LANGKAH 2 ──► Plan PACK UNIFICATION (dokumen ini)
              - Registry packs/voices/visuals (baru)
              - sfx.js: routing voice (DI ATAS hasil langkah 1)
              - ProgressContext, Shop, App, EffectContext
              - Verifikasi: npm run build + npm run lint + E2E manual
```

**Konsekuensi penting:** Task 3 di dokumen ini (rewrite `src/utils/sfx.js`) harus **menggabungkan** `playStreakSound()` yang sudah dibuat di langkah 1 — jangan menimpa/hilangkan. Saat masuk langkah 2, **baca ulang `src/utils/sfx.js` versi terbaru dulu**, baru terapkan Task 3 di atasnya.

---

## 1. Goal

Menyatukan sistem efek visual (sekarang "Kotodama Burst") dan suara jawaban (sekarang chime/thud sintetis) menjadi **satu unit "Theme Pack"** — beli/equip satu pack = dapat visual + suara sekaligus — dengan **6 varian pack** yang diperoleh lewat **gacha**, di mana Kotodama Burst menjadi pack #1 (voice masih synth gong/taiko) dan 5 pack lain disiapkan sebagai slot kosong sampai aset voice anime-nya dicari.

---

## 2. Current Context / Assumptions

Baca dulu — ini kondisi kode sebelum plan dijalankan.

**Dua sistem terpisah hari ini:**

| Sistem | File | Isi | State |
|---|---|---|---|
| Visual efek | `src/features/effects/EffectContext.jsx` | cap hanko 正, sapuan kuas, ensō 連 (SVG + `feTurbulence`) | `progress.ownedEffects[]`, `progress.activeEffect` |
| Suara jawaban | `src/utils/sfx.js` | chime naik (benar) & thud turun (salah) — **disintesis Web Audio**, bukan file | ❌ tidak ada state, selalu berbunyi |

**Fakta kode yang sudah diverifikasi:**

- `src/utils/sfx.js` mengekspor `playCorrectSound()` dan `playWrongSound()` (72 baris, murni Web Audio API — `OscillatorNode` + `GainNode`).
- Pemanggil suara ada di **4 file**: `src/features/quiz/MondaiQuiz.jsx:49,53`, `src/features/quiz/Quiz.jsx:46,50`, `src/pages/Practice.jsx:156,159,172,175`, `src/pages/Review.jsx:101,103`. Semuanya import `{ playCorrectSound, playWrongSound } from ".../utils/sfx"`.
- `src/features/progress/ProgressContext.jsx:37-38` → `ownedEffects: []`, `activeEffect: null` di `DEFAULT_PROGRESS`.
- `src/features/progress/ProgressContext.jsx:49` → `export const EFFECT_PRICES = { kotodama_burst: 2500 };`
- `src/features/progress/ProgressContext.jsx:415-452` → `buyEffect(effectId)` (return `'bought'|'owned'|'poor'`) & `toggleEffect(effectId)`.
- `src/features/progress/ProgressContext.jsx:461` → provider value: `{ progress, username, setUsername, addXp, completeQuiz, spendMedaru, buyEffect, toggleEffect, resetProgress }`.
- `src/features/effects/EffectContext.jsx:24` → `export const EFFECT_ID = 'kotodama_burst';` dan baris 55 → `const active = progress.activeEffect === EFFECT_ID;` (gerbang ON/OFF visual).
- `src/features/shop/Shop.jsx:15-29` → `shopData.items[]` berisi 5 item; id:5 = `Kotodama Burst` (`isEffect: true`, `effectId: "kotodama_burst"`, `price: 2500`). id:4 = `🎙️ Voice Pack: custom` (masih placeholder murni, tidak ada logika).
- `src/features/shop/Shop.jsx:9-14` → `shopData.gacha` = `{ name, price1x: 100, price10x: 900, desc }`. Tombol gacha memanggil `handlePurchase()` yang **hanya memotong saldo** dan `alert("Transaksi diproses...")` — **tidak ada logika undian sama sekali**.
- `public/audio/` sudah ada & berisi 87 mp3 pelajaran (mis. `01 Dai 1 Ka - Kaiwa.mp3`). **Belum ada** `public/voices/`.
- `src/utils/audio.js:58` sudah punya `playAudioFile(audioPath)` yang membuat `new Audio(path).play()` — **bisa dipakai ulang** untuk memutar voice mp3.
- Build tool: Vite 8 + React 19 + Tailwind 4 + `motion`. Tidak ada test runner di repo → validasi lewat `npm run build`, `npm run lint` (oxlint), dan script `node -e` untuk logika murni.

**Keputusan user (hasil brainstorm, sudah dikonfirmasi):**

1. **Model:** satu pack = visual + voice nyatu, equip sekali (bukan mix-and-match).
2. **Akuisisi:** 6 pack didapat lewat **gacha** (random 1 dari 6).
3. **Sumber suara:** **file mp3** yang user cari sendiri, ditaruh di `public/voices/`.
4. **Perilaku voice:** **menggantikan** suara benar/salah default (chime/thud diganti voice pack).
5. **Kotodama Burst:** jadi **pack #1**, voice-nya pakai **synth sekarang** (gong/taiko), nanti diisi mp3.
6. 5 pack lain: **Interaksi Dummy** — placeholder yang **berfungsi** (bisa keluar dari gacha & di-equip), pakai visual `dummy` + voice `dummy`, sampai aset asli (voice anime + efek) dicari user.

**Jawaban final user atas 8 pertanyaan terbuka (2026-09-21):**

| # | Pertanyaan | Keputusan user | Efek ke plan |
|---|---|---|---|
| 1 | Harga gacha/pack | **Tetap** (100 / 900 / 2500) | Tidak ada perubahan |
| 2 | Duplikat gacha | **Refund sebagian — 50 medaru** per duplikat | Logika refund di `rollGacha` (Task 4f) + UI "DUPLIKAT +50 🪙" (Task 6e) |
| 3 | Bobot rarity | **Setuju** (`common 50 / rare 30 / legendary 20`) | Tidak ada perubahan |
| 4 | Nama/ikon 5 pack | **Interaksi Dummy** | 5 pack jadi dummy **fungsional** (`visual: 'dummy'`, `voice: 'dummy'`), **bukan** "Coming Soon" — Task 1, 2, 6 |
| 5 | Voice pack #1 (Kotodama) | **Pakai synth sekarang** (permanen) | `VOICES.taiko.files` tetap kosong selamanya; tidak ada mp3 untuk Kotodama |
| 6 | Lokasi/penamaan voice | **OK** (`public/voices/<packId>/correct_1.mp3`) | Tidak ada perubahan |
| 7 | Urutan eksekusi | **a — plan streak bertingkat DULU**, baru plan ini | Lihat §0 |
| 8 | `playStreakSound` milestone | *(user tidak menjawab)* | **Default: dipakai** untuk suara milestone streak (lihat §6) |

**Asumsi:** user memakai app client-only (localStorage), tidak ada backend. Semua state persist di key `user_progress_v2`.

---

## 3. Architecture / Proposed Approach

Pisahkan **data** (registry) dari **state** (punya apa / aktif apa). Buat 3 registry statis baru — `PACKS` (6 pack: id, nama, kanji, harga, rarity, → `visual` key, → `voice` key), `VISUALS` (key → komponen visual), `VOICES` (key → set file mp3 + fallback synth) — lalu ubah `ProgressContext` agar menyimpan `ownedPacks[]` / `activePack` (migrasi otomatis dari `ownedEffects`/`activeEffect` lama). Suara di-route lewat **setter module-level** di `sfx.js` (`setActiveVoice(key)` disinkronkan oleh provider), sehingga **4 file pemanggil suara tidak perlu disentuh sama sekali**. Menambah pack ke-2..6 = **cukup tambah 1 entry di `PACKS` + isi folder mp3** → nol perubahan logika.

Diagram alur:

```
ProgressContext (state)                 registry (data statis)
  ownedPacks: ['kotodama_burst']  ──┐
  activePack: 'kotodama_burst'      │
        │                           │
        │ (1) useEffect sync        │
        ▼                           ▼
  sfx.setActiveVoice(voiceKey) ──► VOICES[voiceKey]
        │                              ├─ files.correct[] → playAudioFile()
        ▼                              └─ synth.fallback   → Web Audio gong
  playCorrectSound()  ◄── dipanggil 4 file quiz (TIDAK DIUBAH)
        │
        ▼
  EffectContext: VISUALS[pack.visual]  (render overlay visual)
```

**Penting (DRY/YAGNI):** jangan bikin sistem mix-and-match (ditolak user). Jangan bikin backend gacha — undian dilakukan client-side, hasil disimpan ke `ownedPacks`.

---

## 4. Step-by-step Tasks

> Semua path relatif ke root workspace `C:\Users\maddo\Documents\japanese-quiz`.
> Jalankan `npm run build` di akhir tiap task besar untuk memastikan tidak ada yang rusak.
> **Jangan commit/push** — user melarang sampai ia memberi izin eksplisit.

---

### Task 1 — Buat registry `PACKS` (6 varian, 1 aktif + 5 slot TBD)

**File baru:** `src/features/packs/packs.js`

Buat file berikut **persis**:

```js
// ─────────────────────────────────────────────────────────────────────────────
// Theme Pack — satu pack = VISUAL + VOICE nyatu, di-equip sekali.
//
// Untuk menambah pack baru: tambahkan satu entry di PACKS, lalu:
//   - visual: daftarkan komponennya di src/features/effects/visuals.js
//   - voice : daftarkan file/synth-nya di src/features/audio/voices.js
// Tidak ada logika lain yang perlu diubah.
// ─────────────────────────────────────────────────────────────────────────────

export const PACK_RARITY = {
  common:    { label: 'COMMON',    weight: 50 },
  rare:      { label: 'RARE',      weight: 30 },
  legendary: { label: 'LEGENDARY', weight: 20 },
};

export const PACKS = [
  {
    id: 'kotodama_burst',
    name: 'Kotodama Burst',
    kanji: '言霊',
    icon: '🈳',
    desc: 'Tinta washi: cap hanko, sapuan kuas & ensō',
    desc_en: 'Washi ink: hanko seal, brush stroke & ensō',
    price: 2500,
    rarity: 'legendary',
    visual: 'ink',      // → src/features/effects/visuals.js
    voice: 'taiko',     // → src/features/audio/voices.js
  },

  // ── 5 pack berikut = "Interaksi Dummy": fungsional (bisa keluar gacha &
  //    di-equip), tapi visual/voice-nya masih placeholder generik.
  //    Ganti `visual`/`voice` ke key asli begitu aset (voice anime + efek) siap.
  {
    id: 'pack_02', name: 'Dummy A', kanji: '仮', icon: '🎭',
    desc: 'Interaksi Dummy', desc_en: 'Dummy interaction',
    price: 2500, rarity: 'common', visual: 'dummy', voice: 'dummy',
  },
  {
    id: 'pack_03', name: 'Dummy B', kanji: '仮', icon: '🎭',
    desc: 'Interaksi Dummy', desc_en: 'Dummy interaction',
    price: 2500, rarity: 'common', visual: 'dummy', voice: 'dummy',
  },
  {
    id: 'pack_04', name: 'Dummy C', kanji: '仮', icon: '🎭',
    desc: 'Interaksi Dummy', desc_en: 'Dummy interaction',
    price: 2500, rarity: 'rare', visual: 'dummy', voice: 'dummy',
  },
  {
    id: 'pack_05', name: 'Dummy D', kanji: '仮', icon: '🎭',
    desc: 'Interaksi Dummy', desc_en: 'Dummy interaction',
    price: 2500, rarity: 'rare', visual: 'dummy', voice: 'dummy',
  },
  {
    id: 'pack_06', name: 'Dummy E', kanji: '仮', icon: '🎭',
    desc: 'Interaksi Dummy', desc_en: 'Dummy interaction',
    price: 2500, rarity: 'legendary', visual: 'dummy', voice: 'dummy',
  },
];

export const getPack = (id) => PACKS.find((p) => p.id === id) || null;

// Pack "siap pakai" = punya visual & voice (termasuk placeholder 'dummy').
export const isPackReady = (pack) => Boolean(pack && pack.visual && pack.voice);

// Undian gacha berbobot rarity. `rng` bisa di-inject untuk testing.
export const rollPackId = (rng = Math.random) => {
  const pool = PACKS.filter(isPackReady);
  if (pool.length === 0) return null;

  // Total bobot dari rarity pack yang tersedia.
  const total = pool.reduce((sum, p) => sum + (PACK_RARITY[p.rarity]?.weight ?? 1), 0);
  let ticket = rng() * total;
  for (const pack of pool) {
    ticket -= PACK_RARITY[pack.rarity]?.weight ?? 1;
    if (ticket <= 0) return pack.id;
  }
  return pool[pool.length - 1].id;
};
```

**Verifikasi:**

```bash
cd /c/Users/maddo/Documents/japanese-quiz
node -e "import('./src/features/packs/packs.js').then(m => { console.log('total pack:', m.PACKS.length); console.log('ready:', m.PACKS.filter(m.isPackReady).length); console.log('roll x8 (unik):', [...new Set(Array.from({length:8}, () => m.rollPackId()))]); })"
```

Expected output:
```
total pack: 6
ready: 6
roll x8 (unik): [ ... 2-6 id berbeda dari {kotodama_burst, pack_02..pack_06} ]
```
(karena semua pack kini "ready", gacha bisa mengeluarkan ke-6-nya; bobot rarity berlaku)

---

### Task 2 — Buat registry `VOICES` + folder aset

**File baru:** `src/features/audio/voices.js`
**Folder baru:** `public/voices/` (dengan `.gitkeep`)

Buat folder dan file:

```bash
cd /c/Users/maddo/Documents/japanese-quiz
mkdir -p public/voices
touch public/voices/.gitkeep
```

Isi `src/features/audio/voices.js`:

```js
// ─────────────────────────────────────────────────────────────────────────────
// Registry VOICE per pack.
//
// Dua mode:
//   - files : daftar path mp3 (relatif ke public/). Dipilih acak tiap kali.
//   - synth : fallback Web Audio (tidak butuh file) — dipakai kalau files kosong.
//
// Cara menambah voice anime:
//   1. Taruh mp3 di public/voices/<packId>/correct_1.mp3, wrong_1.mp3, dst.
//   2. Isi array files di bawah.
//   Kalau array files kosong → otomatis jatuh ke synth (tidak pernah error).
// ─────────────────────────────────────────────────────────────────────────────

export const VOICES = {
  // Pack #1 — Kotodama Burst. Tidak pakai mp3 (keputusan user #5) → synth gong/taiko.
  taiko: {
    files: { correct: [], wrong: [], streak: [] },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },

  // Pack dummy (pack_02..pack_06) — keputusan user #4 "Interaksi Dummy".
  // Suara placeholder: pakai synth yang sama sampai voice anime diisi.
  // Ganti jadi entry voice anime (lihat contoh di bawah) saat aset siap,
  // lalu ubah `voice: 'dummy'` → `voice: 'anime_x'` di packs.js.
  dummy: {
    files: { correct: [], wrong: [], streak: [] },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },

  // Contoh pack voice anime (aktifkan saat aset siap):
  // anime_a: {
  //   files: {
  //     correct: ['/voices/pack_02/correct_1.mp3', '/voices/pack_02/correct_2.mp3'],
  //     wrong:   ['/voices/pack_02/wrong_1.mp3'],
  //     streak:  ['/voices/pack_02/streak_1.mp3'],
  //   },
  //   synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' }, // fallback
  // },
};

export const getVoice = (key) => VOICES[key] || VOICES.taiko;

// Pilih satu path acak dari daftar (atau null kalau kosong).
export const pickFile = (list, rng = Math.random) =>
  (Array.isArray(list) && list.length > 0)
    ? list[Math.floor(rng() * list.length)]
    : null;
```

**Verifikasi:**

```bash
cd /c/Users/maddo/Documents/japanese-quiz
ls -la public/voices/
node -e "import('./src/features/audio/voices.js').then(m => { const v = m.getVoice('taiko'); console.log('correct files:', v.files.correct.length); console.log('pickFile empty ->', m.pickFile([])); console.log('pickFile list ->', m.pickFile(['a.mp3','b.mp3'])); })"
```

Expected output:
```
.total_lines... (folder ada, berisi .gitkeep)
correct files: 0
pickFile empty -> null
pickFile list -> a.mp3  (atau b.mp3)
```

---

### Task 2b — Visual `dummy` (placeholder fungsional)

**File baru:** `src/features/effects/visuals.js`

Karena pack_02..pack_06 memakai `visual: 'dummy'` (keputusan user #4), daftarkan visual placeholder yang **tetap terlihat** (bukan kosong) supaya user bisa memverifikasi bahwa pack benar-benar aktif:

```js
// key → metadata visual. Komponen render sebenarnya ada di EffectContext.jsx.
// Tambahkan pack baru di sini begitu desain visualnya siap.
export const VISUALS = {
  ink:   { id: 'ink',   label: 'Washi Ink',     component: 'ink'   },
  dummy: { id: 'dummy', label: 'Dummy Placeholder', component: 'dummy' },
};

export const getVisual = (key) => VISUALS[key] || null;
```

Di `EffectContext.jsx` nanti (Task 7), tambahkan cabang `dummy`: kilatan abu-abu netral + teks kanji `仮` (kari = sementara) supaya jelas ini placeholder, tanpa mengganggu efek `ink`. Untuk sekarang cukup file registry-nya ada.

**Verifikasi:**
```bash
cd /c/Users/maddo/Documents/japanese-quiz
node -e "import('./src/features/effects/visuals.js').then(m=>console.log(Object.keys(m.VISUALS), m.getVisual('dummy')?.label))"
```
Expected: `[ 'ink', 'dummy' ] Dummy Placeholder`

---

### Task 3 — Tambah routing voice + synth gong/taiko di `sfx.js`

**File diubah:** `src/utils/sfx.js` (dari 72 baris)

**Konsekuensi:** `playCorrectSound()` / `playWrongSound()` **tetap punya signature yang sama** → 4 file pemanggil (`MondaiQuiz.jsx`, `Quiz.jsx`, `Practice.jsx`, `Review.jsx`) **tidak perlu diubah sama sekali**.

Ganti seluruh isi `src/utils/sfx.js` dengan:

```js
import { getVoice, pickFile } from '../features/audio/voices';

let audioCtx;

const initAudioContext = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  return audioCtx;
};

// ── Voice aktif (di-set oleh ProgressProvider lewat setActiveVoice) ──────────
let activeVoiceKey = 'taiko';
export const setActiveVoice = (key) => {
  activeVoiceKey = key || 'taiko';
};
export const getActiveVoiceKey = () => activeVoiceKey;

// ── Pemutar file mp3 (mode voice pack) ──────────────────────────────────────
const playFile = (path) => {
  if (typeof window === 'undefined' || !path) return false;
  const audio = new Audio(path);
  audio.volume = 0.9;
  audio.play().catch((err) => console.warn('Voice play error:', err));
  return true;
};

// ── Synth: gong/taiko (benar) & thud (salah) ────────────────────────────────
// Gong = beberapa osilator rasio inharmonik + noise strike, decay panjang.
const synthGong = (big = false) => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const t = ctx.currentTime;
  const dur = big ? 2.4 : 1.4;
  const base = big ? 96 : 140;

  // Rasio inharmonik khas gong logam.
  [1, 1.51, 2.13, 2.74, 3.61].forEach((ratio, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base * ratio, t);
    osc.frequency.exponentialRampToValueAtTime(base * ratio * 0.94, t + dur);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime((big ? 0.5 : 0.32) / (i + 1), t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  });

  // Noise burst = pukulan stik ke permukaan logam.
  const len = Math.floor(ctx.sampleRate * 0.09);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const noise = ctx.createBufferSource();
  const nGain = ctx.createGain();
  const nFilter = ctx.createBiquadFilter();
  nFilter.type = 'bandpass';
  nFilter.frequency.value = big ? 1800 : 2600;
  nGain.gain.setValueAtTime(big ? 0.35 : 0.22, t);
  noise.buffer = buf;
  noise.connect(nFilter).connect(nGain).connect(ctx.destination);
  noise.start(t);
};

const synthThud = () => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.8, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.32);
};

// ── API publik (signature TIDAK berubah) ────────────────────────────────────
export const playCorrectSound = () => {
  const voice = getVoice(activeVoiceKey);
  if (playFile(pickFile(voice.files?.correct))) return;
  if (voice.synth?.correct === 'gong') synthGong(false);
  else if (voice.synth?.correct === 'gong-big') synthGong(true);
  else synthGong(false);
};

export const playWrongSound = () => {
  const voice = getVoice(activeVoiceKey);
  if (playFile(pickFile(voice.files?.wrong))) return;
  synthThud();
};

// Voice khusus milestone streak (opsional; dipakai plan streak bertingkat).
export const playStreakSound = () => {
  const voice = getVoice(activeVoiceKey);
  if (playFile(pickFile(voice.files?.streak))) return;
  synthGong(true);
};
```

**Verifikasi (logika routing tanpa browser):**

```bash
cd /c/Users/maddo/Documents/japanese-quiz
node -e "
import('./src/features/audio/voices.js').then(m => {
  const v = m.getVoice('taiko');
  console.log('synth correct:', v.synth.correct);
  console.log('files kosong -> fallback ke synth:', m.pickFile(v.files.correct) === null);
  console.log('getVoice(unknown) -> taiko:', m.getVoice('zzz') === m.VOICES.taiko);
});
"
```

Expected output:
```
synth correct: gong
files kosong -> fallback ke synth: true
getVoice(unknown) -> taiko: true
```

Lalu build:
```bash
npm run build
```
Expected: `✓ built in ...` tanpa error.

---

### Task 4 — Migrasi state `ProgressContext`: `ownedPacks` / `activePack` + `rollGacha`

**File diubah:** `src/features/progress/ProgressContext.jsx`

**4a.** Ganti blok di baris ~37-38:

```js
  ownedEffects: [],
  activeEffect: null,
```
menjadi:

```js
  ownedPacks: [],
  activePack: null,
```

**4b.** Ganti baris 49 (`export const EFFECT_PRICES = { kotodama_burst: 2500 };`) menjadi:

```js
// Harga pack diambil dari registry PACKS (single source of truth).
export const PACK_PRICES = Object.fromEntries(PACKS.map((p) => [p.id, p.price]));
```

Tambahkan import di bagian atas file (setelah import `react`):

```js
import { PACKS, getPack, rollPackId, isPackReady } from '../packs/packs';
```

**4c.** Tambah migrasi state lama → baru. Cari fungsi yang membaca `user_progress_v2` dari localStorage (dekat deklarasi `loadProgress`/`useState(DEFAULT_PROGRESS)`), lalu sisipkan normalisasi berikut **setelah** objek progress dimuat:

```js
// ── Migrasi v2 lama (ownedEffects/activeEffect) → packs ─────────────────────
const migratePacks = (p) => {
  if (!p) return p;
  if (p.ownedPacks === undefined) {
    p.ownedPacks = p.ownedEffects ? [...p.ownedEffects] : [];
    p.activePack = p.activeEffect ?? null;
    delete p.ownedEffects;
    delete p.activeEffect;
  }
  return p;
};
```

Panggil `migratePacks` pada hasil parse localStorage sebelum `setProgress`.

**4d.** Ganti fungsi `buyEffect` (baris ~415-435) dengan:

```js
  // Beli pack. Return: 'bought' | 'owned' | 'poor' | 'invalid'
  const buyPack = useCallback((packId) => {
    const pack = getPack(packId);
    if (!pack || !isPackReady(pack)) return 'invalid';
    const owned = progressRef.current?.ownedPacks || [];
    if (owned.includes(packId)) return 'owned';
    const balance = progressRef.current?.medaru || 0;
    if (balance < pack.price) return 'poor';
    setProgress(prev => {
      const ownedNow = prev.ownedPacks || [];
      if (ownedNow.includes(packId)) return prev;
      const bal = prev.medaru || 0;
      if (bal < pack.price) return prev;
      return { ...prev, medaru: bal - pack.price, ownedPacks: [...ownedNow, packId], activePack: packId };
    });
    return 'bought';
  }, []);
```

**4e.** Ganti fungsi `toggleEffect` (baris ~437-450) dengan:

```js
  // ON/OFF pack. Return true kalau sekarang aktif.
  const togglePack = useCallback((packId) => {
    let nowActive = false;
    setProgress(prev => {
      const ownedNow = prev.ownedPacks || [];
      if (!ownedNow.includes(packId)) return prev;
      const willActivate = prev.activePack !== packId;
      nowActive = willActivate;
      return { ...prev, activePack: willActivate ? packId : null };
    });
    return nowActive;
  }, []);
```

**4f.** Tambah fungsi gacha **tepat sebelum** `resetProgress`.

**Versi final (aman StrictMode + refund duplikat 50 medaru — keputusan user #2).** Undian dihitung **sebelum** `setProgress`, jadi tidak dobel-potong saat React StrictMode memanggil updater 2×:

```js
// Harga gacha & refund duplikat
const GACHA_PRICE_1X = 100;
const GACHA_PRICE_10X = 900;
const DUPLICATE_REFUND = 50; // keputusan user #2: refund sebagian per duplikat

// Undian gacha. count = 1 atau 10.
// Return { ok, results: [{ id, isNew }], refunded } — refunded = total medaru balik.
const rollGacha = useCallback((count = 1) => {
  const price = count >= 10 ? GACHA_PRICE_10X : GACHA_PRICE_1X;
  const balance = progressRef.current?.medaru || 0;
  if (balance < price) return { ok: false, reason: 'poor', results: [], refunded: 0 };

  // 1) Hitung undian DI LUAR updater (aman dari StrictMode double-invoke).
  const ownedNow = progressRef.current?.ownedPacks || [];
  const seen = new Set(ownedNow);
  const results = [];
  for (let i = 0; i < count; i++) {
    const id = rollPackId();
    if (!id) break;
    const isNew = !seen.has(id);
    results.push({ id, isNew });
    seen.add(id); // duplikat di dalam 1 tarikan 10x tetap terhitung duplikat
  }
  const refunded = results.filter((r) => !r.isNew).length * DUPLICATE_REFUND;

  // 2) Terapkan ke state (idempotent: cek saldo & dedupe lagi di dalam).
  setProgress(prev => {
    const bal = prev.medaru || 0;
    if (bal < price) return prev;
    const merged = [...(prev.ownedPacks || [])];
    results.forEach((r) => { if (!merged.includes(r.id)) merged.push(r.id); });
    return { ...prev, medaru: bal - price + refunded, ownedPacks: merged };
  });

  return { ok: true, results, refunded };
}, []);
```

> **Catatan:** saldo akhir = `saldo - harga + refund`. Contoh tarikan 10x (900) dengan 3 duplikat → `-900 + 150 = -750`. Kalau user mau **tanpa refund**, set `DUPLICATE_REFUND = 0`.

**4g.** Tambah `useRef` import bila belum ada (sudah ada). Update provider value di baris 461:

```js
    <UserStatsContext.Provider value={{ progress, username, setUsername, addXp, completeQuiz, spendMedaru, buyPack, togglePack, rollGacha, resetProgress }}>
```

**4h.** Ganti nama key localStorage agar reset bersih (opsional tapi disarankan): biarkan `user_progress_v2` (migrasi sudah menangani). Pastikan `resetProgress` tetap menghapus key yang sama.

**Verifikasi:**

```bash
cd /c/Users/maddo/Documents/japanese-quiz
npm run build
grep -n "buyEffect\|toggleEffect\|ownedEffects\|activeEffect" src/features/progress/ProgressContext.jsx || echo "BERSIH: tidak ada sisa nama lama"
```
Expected: build sukses; output `BERSIH: ...` (hanya boleh tersisa di fungsi `migratePacks`).

---

### Task 5 — Sinkronkan voice aktif + gerbang visual via pack

**File diubah:** `src/App.jsx`, `src/features/effects/EffectContext.jsx`

**5a.** Di `src/features/effects/EffectContext.jsx`, ganti baris 24 & 55:

```js
export const EFFECT_ID = 'kotodama_burst';
```
→ hapus (tidak lagi dipakai).

```js
  const active = progress.activeEffect === EFFECT_ID;
```
→
```js
  // Visual aktif hanya kalau activePack punya visual nyata.
  const activePack = getPack(progress.activePack);
  const active = Boolean(activePack?.visual);
```

Tambah import di atas: `import { getPack } from '../packs/packs';`

*(Catatan: `VISUALS` registry dari Task 7 — kalau Task 7 belum dikerjakan, cukup cek `activePack?.visual === 'ink'`.)*

**5b.** Di `src/App.jsx`, tambahkan komponen kecil yang menyinkronkan voice tiap `activePack` berubah. Sisipkan di dalam `ProgressProvider` (di atas `EffectProvider`):

```jsx
import { useEffect } from 'react';
import { useUserStats } from './features/progress/ProgressContext';
import { getPack } from './features/packs/packs';
import { setActiveVoice } from './utils/sfx';

function VoiceSync() {
  const { progress } = useUserStats();
  useEffect(() => {
    const pack = getPack(progress.activePack);
    setActiveVoice(pack?.voice || 'taiko');
  }, [progress.activePack]);
  return null;
}
```

Lalu render `<VoiceSync />` di dalam provider:

```jsx
<ProgressProvider>
  <VoiceSync />
  <EffectProvider>
    {/* ...router... */}
  </EffectProvider>
</ProgressProvider>
```

**Verifikasi:**

```bash
cd /c/Users/maddo/Documents/japanese-quiz
npm run build && npm run lint
```
Expected: build sukses. Lint boleh memunculkan warning `only-export-components` (pre-existing, bukan dari perubahan ini).

---

### Task 6 — Rombak `Shop.jsx`: kartu pack + hasil gacha

**File diubah:** `src/features/shop/Shop.jsx`

**6a.** Ganti import & state (baris 1-37):

```jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useUserStats, getRank } from "../progress/ProgressContext";
import { useLanguage } from "../../context/LanguageContext";
import { PACKS, PACK_RARITY, isPackReady } from "../packs/packs";

const GACHA_PRICE_1X = 100;
const GACHA_PRICE_10X = 900;

const RARITY_STYLE = {
  common:    { bg: 'bg-kinari-light', text: 'text-sumi',   border: 'border-sumi' },
  rare:      { bg: 'bg-ai',           text: 'text-kinari-light', border: 'border-sumi' },
  legendary: { bg: 'bg-shu',          text: 'text-kinari-light', border: 'border-sumi' },
};
```

Hapus `shopData` (baris 8-30) — diganti `PACKS`.

> **Catatan:** dengan keputusan user #4 ("Interaksi Dummy"), **semua 6 pack kini `isPackReady === true`** (dummy dianggap ready). Jadi cabang "Segera Hadir" di bawah praktis tidak pernah muncul sampai ada pack yang benar-benar kosong di masa depan — biarkan tetap ada sebagai jaring pengaman.

**6b.** Ganti hook & handler:

```jsx
export function Shop() {
  const { progress, buyPack, togglePack, rollGacha } = useUserStats();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [pullResult, setPullResult] = useState(null);

  const medaru = progress.medaru || 0;
  const ownedPacks = progress.ownedPacks || [];
  const activePack = progress.activePack;

  const handleRoll = (count) => {
    const price = count >= 10 ? GACHA_PRICE_10X : GACHA_PRICE_1X;
    const res = rollGacha(count);
    if (!res.ok) {
      alert(language === 'id'
        ? `Medaru kurang! Butuh ${price}, saldo kamu ${medaru}.`
        : `Not enough Medaru! Need ${price}, you have ${medaru}.`);
      return;
    }
    setPullResult(res);   // simpan { results, refunded }
  };

  const handlePackAction = (pack) => {
    if (!isPackReady(pack)) return;
    const owned = ownedPacks.includes(pack.id);
    const isActive = activePack === pack.id;

    if (!owned) {
      const result = buyPack(pack.id);
      if (result === 'poor') {
        alert(language === 'id'
          ? `Medaru kurang! Butuh ${pack.price}, saldo kamu ${medaru}.`
          : `Not enough Medaru! Need ${pack.price}, you have ${medaru}.`);
      }
      return;
    }
    togglePack(pack.id);
  };
```

**6c.** Ganti `onClick` tombol gacha (baris 160 & 167) dari `handlePurchase(...)` → `handleRoll(1)` / `handleRoll(10)`, dan label tombol tetap.

**6d.** Ganti seluruh blok Etalase (baris 176-232) dengan grid pack:

```jsx
          {/* Etalase Section */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-serif font-black text-sumi tracking-tight">
                {language === 'id' ? 'Etalase Warung Kakek' : 'Grandpa Shop Shelf'}
              </h2>
              <div className="h-[2px] flex-1 bg-sumi/10"></div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40">品物</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PACKS.map((pack) => {
                const owned = ownedPacks.includes(pack.id);
                const isActive = activePack === pack.id;
                const ready = isPackReady(pack);
                const rs = RARITY_STYLE[pack.rarity] || RARITY_STYLE.common;
                const affordable = medaru >= pack.price;

                return (
                  <div key={pack.id}
                    className={`border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] flex flex-col p-6 relative overflow-hidden ${
                      ready ? 'bg-kinari' : 'bg-kinari-light/60'
                    }`}>
                    <span className={`absolute top-0 right-0 text-[9px] font-black px-2 py-1 border-b-[3px] border-l-[3px] border-sumi ${rs.bg} ${rs.text}`}>
                      {PACK_RARITY[pack.rarity]?.label || 'COMMON'}
                    </span>

                    <div className="text-5xl mb-3 text-center mt-2">{pack.icon}</div>
                    <h3 className="text-lg font-serif font-black border-b-4 border-sumi pb-2 mb-2 text-sumi text-center">
                      {pack.name}
                    </h3>
                    <div className="text-[11px] font-bold text-sumi/60 text-center mb-3">{pack.kanji}</div>
                    <p className="text-sm font-bold mb-6 flex-grow text-sumi/80 text-center">
                      {language === 'id' ? pack.desc : pack.desc_en}
                    </p>

                    {!ready ? (
                      <div className="py-3 text-center text-xs font-black uppercase tracking-widest border-4 border-dashed border-sumi/30 text-sumi/40">
                        {language === 'id' ? 'Segera Hadir' : 'Coming Soon'}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePackAction(pack)}
                        className={`py-3 font-black text-sm w-full border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none transition-all ${
                          isActive ? 'bg-matcha text-kinari-light'
                          : (owned || affordable) ? 'bg-ai text-kinari-light'
                          : 'bg-kinari-light text-sumi/50'
                        }`}>
                        {!owned ? `BELI - ${pack.price} 🪙` : isActive ? 'AKTIF ✓' : 'PAKAI'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
```

**6e.** Tambah modal hasil gacha **sebelum** penutup `</div>` terakhir (setelah `</section>` Etalase):

```jsx
          <AnimatePresence>
            {pullResult && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-sumi/70 flex items-center justify-center p-4"
                onClick={() => setPullResult(null)}>
                <motion.div
                  initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  className="bg-kinari-light border-[4px] border-sumi shadow-[12px_12px_0_0_#1a1a1a] p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-2xl font-serif font-black text-sumi mb-4 text-center">
                    {language === 'id' ? 'Hasil Tarikan' : 'Pull Result'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {pullResult.results.map((r, i) => {
                      const p = PACKS.find((x) => x.id === r.id);
                      const rs = RARITY_STYLE[p?.rarity] || RARITY_STYLE.common;
                      return (
                        <div key={i} className={`border-[3px] border-sumi p-3 text-center ${rs.bg} ${rs.text}`}>
                          <div className="text-3xl mb-1">{p?.icon}</div>
                          <div className="text-xs font-black">{p?.name}</div>
                          <div className="text-[9px] font-bold uppercase tracking-widest mt-1">
                            {r.isNew
                              ? (language === 'id' ? 'BARU!' : 'NEW!')
                              : (language === 'id' ? 'DUPLIKAT +50 🪙' : 'DUPE +50 🪙')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {pullResult.refunded > 0 && (
                    <div className="mb-4 text-center text-sm font-black text-sumi bg-[#ffd700]/40 border-[3px] border-sumi py-2">
                      {language === 'id'
                        ? `Refund duplikat: +${pullResult.refunded} 🪙`
                        : `Duplicate refund: +${pullResult.refunded} 🪙`}
                    </div>
                  )}
                  <button type="button" onClick={() => setPullResult(null)}
                    className="w-full py-3 bg-ai text-kinari-light font-black border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none">
                    {language === 'id' ? 'TUTUP' : 'CLOSE'}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
```

**Verifikasi:**

```bash
cd /c/Users/maddo/Documents/japanese-quiz
npm run build
grep -n "shopData\|buyEffect\|toggleEffect" src/features/shop/Shop.jsx || echo "BERSIH: Shop sudah pakai PACKS"
```
Expected: build sukses; output `BERSIH: ...`.

---

### Task 7 — Registry `VISUALS` + cabang visual `dummy`

**File:** `src/features/effects/visuals.js` (sudah dibuat di **Task 2b**), `src/features/effects/EffectContext.jsx`

Tujuan: saat pack #2..6 punya visual sendiri, cukup daftarkan di `visuals.js`. Untuk sekarang ada 2 key: `ink` (Kotodama) & `dummy` (pack_02..06).

Registry (dari Task 2b — pastikan sudah ada):

```js
export const VISUALS = {
  ink:   { id: 'ink',   label: 'Washi Ink',        component: 'ink'   },
  dummy: { id: 'dummy', label: 'Dummy Placeholder', component: 'dummy' },
};

export const getVisual = (key) => VISUALS[key] || null;
```

Di `EffectContext.jsx`:

```js
import { getVisual } from './visuals';
// ...
const activePack = getPack(progress.activePack);
const activeVisual = activePack?.visual || null;
const active = Boolean(getVisual(activeVisual));
```

Lalu di layer render, pilih cabang berdasar `activeVisual`:

- `activeVisual === 'ink'` → render efek tinta yang sudah ada (hanko/sapuan/ensō).
- `activeVisual === 'dummy'` → render **placeholder terlihat**: kilatan abu-abu netral + kanji `仮` besar di tengah (fade in/out cepat). Ini menegaskan pack dummy benar-benar aktif tanpa meniru efek tinta.
- selain itu → `null` (tidak render apa pun).

Contoh cabang dummy (sisipkan sejajar dengan cabang ink di `EffectLayer`):

```jsx
{activeVisual === 'dummy' && (
  <motion.div
    key={sig.key}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: [0, 0.9, 0], scale: [0.9, 1.05, 1] }}
    transition={{ duration: 0.7, ease: 'easeOut' }}
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
  >
    <span className="text-[18vw] font-serif font-black text-sumi/25 select-none">仮</span>
  </motion.div>
)}
```

**Verifikasi:** `npm run build` sukses.

---

### Task 8 — Validasi menyeluruh

```bash
cd /c/Users/maddo/Documents/japanese-quiz
npm run lint
npm run build
```

Expected:
- Lint: hanya warning `only-export-components` (pre-existing).
- Build: `✓ built in X.XXs`, tanpa error.

Cek tidak ada sisa nama lama di seluruh `src`:

```bash
grep -rn "ownedEffects\|activeEffect\|buyEffect\|toggleEffect\|EFFECT_PRICES" src/ || echo "BERSIH TOTAL"
```
Expected: `BERSIH TOTAL` (kecuali `migratePacks` di ProgressContext).

---

## 5. Tests / Validation

Repo **tidak punya test runner** (tidak ada vitest/jest di `package.json`). Maka TDD di sini = **script `node -e` untuk logika murni** + build gate + verifikasi manual E2E. Jangan tambah dependency test baru (YAGNI).

**Test logika murni (bisa dijalankan sekarang, tanpa React):**

| # | Yang diuji | Perintah | Expected |
|---|---|---|---|
| T1 | `PACKS` berisi 6, **semua** ready (dummy dianggap ready) | `node -e "import('./src/features/packs/packs.js').then(m=>console.log(m.PACKS.length, m.PACKS.filter(m.isPackReady).length))"` | `6 6` |
| T2 | `rollPackId` hanya keluarkan id valid dari PACKS | `node -e "import('./src/features/packs/packs.js').then(m=>{const ids=new Set(m.PACKS.map(p=>p.id));console.log([...new Set(Array.from({length:60},()=>m.rollPackId()))].every(x=>ids.has(x)))})"` | `true` |
| T3 | `rollPackId` deterministik dengan rng inject | `node -e "import('./src/features/packs/packs.js').then(m=>console.log(m.rollPackId(()=>0), m.rollPackId(()=>0.999)))"` | dua id valid dari PACKS (boleh sama/beda) |
| T4 | `pickFile` kosong → null, list → salah satu | `node -e "import('./src/features/audio/voices.js').then(m=>console.log(m.pickFile([]), ['a','b'].includes(m.pickFile(['a','b']))))"` | `null true` |
| T5 | `getVoice` fallback | `node -e "import('./src/features/audio/voices.js').then(m=>console.log(m.getVoice('nope')===m.VOICES.taiko))"` | `true` |
| T6 | `getPack` fallback null | `node -e "import('./src/features/packs/packs.js').then(m=>console.log(m.getPack('zzz')))"` | `null` |
| T7 | `getVisual` punya `ink` & `dummy` | `node -e "import('./src/features/effects/visuals.js').then(m=>console.log(Object.keys(m.VISUALS).join(','), !!m.getVisual('dummy')))"` | `ink,dummy true` |

**Test refund duplikat (logika murni, bisa dijalankan sebelum wiring):**

```bash
node -e "
const DUPLICATE_REFUND = 50;
// simulasi: 10 tarikan, 3 duplikat
const results = [ {isNew:true},{isNew:true},{isNew:true},{isNew:true},{isNew:true},{isNew:true},{isNew:true},{isNew:false},{isNew:false},{isNew:false} ];
const refunded = results.filter(r=>!r.isNew).length * DUPLICATE_REFUND;
const price = 900, saldo = 5000;
console.log('refund:', refunded, '| saldo akhir:', saldo - price + refunded);
"
```
Expected: `refund: 150 | saldo akhir: 4250`

**Test E2E manual (browser) — user harus jalankan:**

```bash
npm run dev
```
Lalu:
1. Buka `/settings` → DevPanel → **"Medaru 999999"** (dev-only, ada di `src/features/dev/DevPanel.jsx`).
2. Buka `/shop` → klik **TARIK 1X** → modal hasil muncul, saldo berkurang 100 (atau −100 + refund bila duplikat).
3. Klik **TARIK 10X** → modal 10 kartu; kalau ada duplikat muncul baris **"Refund duplikat: +N 🪙"**; saldo = `−900 + N`.
4. Beli pack "Kotodama Burst" (2500) → tombol jadi **AKTIF ✓**.
5. Beli/equip pack **Dummy** → jawab quiz → muncul kanji `仮` samar (placeholder), bukan efek tinta.
6. Equip Kotodama lagi → jawab **benar** → terdengar **gong** (bukan chime lama) + visual tinta muncul.
7. Jawab **salah** → terdengar **thud** + sapuan kuas.
8. Nonaktifkan pack (klik → **PAKAI**) → jawab quiz → tidak ada gong/visual.
9. Refresh halaman → pack tetap tersimpan (localStorage).

**Kriteria lulus:** semua 9 langkah E2E sesuai, build sukses, lint bersih dari error.

---

## 6. Risks, Tradeoffs, and Open Questions

### Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| **Ukuran bundle membengkak** oleh mp3 voice | Load awal lambat | mp3 di `public/` tidak masuk bundle Vite (di-serve terpisah) — aman. Tetap batasi tiap file < 200 KB. |
| **Legal/izin klip anime** | Masalah hukum kalau dipublikasikan | Untuk pemakaian pribadi/demo aman; kalau mau publish, pakai voice orisinal/TTS berlisensi. |
| **Autoplay diblokir browser** | Voice tidak bunyi di klik pertama | `AudioContext.resume()` + `audio.play().catch()` sudah ditangani (fallback diam, tidak crash). |
| **Migrasi state gagal** (user sudah punya `ownedEffects`) | Pack hilang setelah update | `migratePacks()` menyalin `ownedEffects`→`ownedPacks` & `activeEffect`→`activePack`; ada guard `=== undefined`. |
| **StrictMode double-invoke pada `setProgress`** | Saldo gacha terpotong dobel | Sudah dimitigasi: undian dihitung **di luar** updater (Task 4f), lalu `setProgress` idempotent (cek saldo + dedupe di dalam). |

### Tradeoff

- **Satu pack = visual+voice nyatu** (pilihan user) lebih simpel & sesuai "satuin", tapi user tidak bisa pakai visual A + voice B. Bisa ditambah nanti kalau perlu (state jadi `activeVisual` + `activeVoice` terpisah) — **YAGNI sekarang**.
- **Gacha client-side** gampang dicurangi (devtools). Tidak masalah untuk app belajar pribadi; kalau perlu adil, harus server-side (di luar scope).
- **Refund duplikat 50 medaru** (keputusan user #2) = duplikat tidak sia-sia total, tapi ekonomi gacha jadi lebih longgar. Ubah `DUPLICATE_REFUND` bila perlu.
- **Dummy dianggap "ready"** (keputusan user #4) membuat gacha langsung bisa mengeluarkan ke-6 pack sejak awal — bagus untuk demo, tapi artinya belum ada pack yang "langka nyata" sampai aset asli masuk.

### Pertanyaan terbuka

**Semua 8 pertanyaan sudah dijawab user** (lihat tabel di §2). Tidak ada blocker tersisa.

**Satu item masih default (user tidak menjawab):**
- **#8 `playStreakSound`** → **default dipakai**: milestone streak (dari plan bertingkat) memutar `playStreakSound()` (gong besar), jawaban biasa tetap `playCorrectSound()`. Kalau tidak diinginkan, cukup jangan panggil `playStreakSound` di `EffectContext.jsx`.

---

## 7. Ringkasan Urutan Eksekusi

> **PENTING (§0):** kerjakan **plan streak bertingkat dulu** (`2026-09-21_143704-full-tiered-streak-effects.md`), baru tabel di bawah ini.

| Task | File | Estimasi |
|---|---|---|
| 1 | `src/features/packs/packs.js` (baru) — 6 pack, 5 dummy fungsional | 3 mnt |
| 2 | `src/features/audio/voices.js` (baru) + `public/voices/` | 2 mnt |
| 2b | `src/features/effects/visuals.js` (baru) — registry `ink` + `dummy` | 2 mnt |
| 3 | `src/utils/sfx.js` (rewrite — **di atas** hasil plan streak) | 5 mnt |
| 4 | `src/features/progress/ProgressContext.jsx` (migrasi + `rollGacha` refund) | 5 mnt |
| 5 | `src/App.jsx` + `src/features/effects/EffectContext.jsx` (voice sync) | 3 mnt |
| 6 | `src/features/shop/Shop.jsx` (pack cards + gacha modal + refund) | 5 mnt |
| 7 | `src/features/effects/EffectContext.jsx` (cabang visual `dummy`) | 3 mnt |
| 8 | Validasi (lint + build + grep + test node) | 2 mnt |
| — | E2E manual oleh user | — |

**Tidak ada commit/push** — tunggu perintah eksplisit user.
