# Plan — Unifikasi "Theme Pack" (Visual + Voice, 6 Varian, Gacha)

**Tanggal:** 2026-09-22 10:28
**Workspace:** `C:\Users\maddo\Documents\japanese-quiz`
**Status:** 📝 BELUM DIEKSEKUSI
**Sumber:** catatan Obsidian `brain/Next update.md` §9/22/2026 + plan lama `.hermes/plans/2026-09-21_144318-pack-unification-visual-voice.md` (1.067 baris)
**Terkait commit:** `0396535` (toko+efek), `aacb191`+`3446921` (gong audible + `node --test`), `7ca8024` (fix crash progress)

---

## 1. Goal

Menyatukan sistem **efek visual** (Kotodama Burst) dan **suara jawaban** (chime/gong) jadi satu unit **"Theme Pack"** — equip satu pack = dapat visual + voice sekaligus — dengan **6 varian** yang diperoleh lewat **gacha** di Toko.

---

## 2. Current Context / Assumptions

> **PENTING — kenapa plan lama tidak bisa dipakai apa adanya:** plan `2026-09-21_144318` ditulis 21 Sep, **sebelum** kerjaan streak + fix gong + test runner. Task 3-nya menulis ulang `src/utils/sfx.js` dari nol dengan `synthGong()` lama (base 96–140 Hz) → **akan menghapus perbaikan gong audible** (commit `3446921`) dan mematahkan `src/utils/sfx.params.test.js`. Plan ini sudah dikoreksi untuk itu.

### Kondisi kode sekarang (terverifikasi)

| File | Kondisi |
|---|---|
| `src/utils/sfx.js` (157 baris) | Punya `streakGongParams(level)` **murni** + `playStreakSound(level)` audible. **Ada test:** `src/utils/sfx.params.test.js` (6 tes, PASS). |
| `package.json` | Punya script `"test": "node --test"` (baru ditambah). |
| `src/features/progress/ProgressContext.jsx` (477 baris) | `DEFAULT_PROGRESS` baris 26–40 punya `ownedEffects: []`, `activeEffect: null`. `EFFECT_PRICES` baris 49. `buyEffect` baris 423, `toggleEffect` baris 445, `spendMedaru` baris 411. Provider value baris 469. Load localStorage baris 119–130 (**sudah** ada merge `{...DEFAULT_PROGRESS, ...(parsed||{})}` + try/catch). |
| `src/features/effects/EffectContext.jsx` (500 baris) | `EFFECT_ID` baris 25; gate `const active = progress.activeEffect === EFFECT_ID` baris 110; `triggerEffect` baris 141; render layer baris 199–298. |
| `src/features/shop/Shop.jsx` (240 baris) | `shopData.items` (5 item: 3 barang generik + id4 "Voice Pack: custom" + id5 Kotodama). Tombol gacha → `handlePurchase()` yang **hanya potong saldo + alert** (tidak ada undian). |
| `src/App.jsx` (110 baris) | `<ProgressProvider><EffectProvider>…` baris 70–71. **Belum ada** `VoiceSync`. |
| `src/features/dev/DevPanel.jsx` (128 baris) | Baris 60, 77, 123 menulis/baca `ownedEffects` & `activeEffect` langsung ke localStorage → **akan rusak** kalau tidak ikut dimigrasi. |
| `src/utils/audio.js` | Punya `playAudioFile(audioPath)` (baris 58) — pola `new Audio(path).play()`. |
| `public/` | Ada `audio/`. **Belum ada** `public/voices/`. |
| `src/features/packs/`, `src/features/audio/`, `src/features/effects/visuals.js` | **Belum ada** — akan dibuat. |

### Keputusan yang sudah final (dari Obsidian §9/22 + brainstorm plan lama)

1. Satu pack = visual + voice nyatu, equip sekali (bukan mix-and-match).
2. 6 pack didapat lewat **gacha** (harga tetap: 100 / 900).
3. Duplikat gacha → **refund 50 medaru**.
4. Bobot rarity: `common 50% / rare 30% / legendary 20%`.
5. 5 pack selain Kotodama = **"Interaksi Dummy" fungsional** (`visual:'dummy'`, `voice:'dummy'`, kanji `仮`, icon 🎭).
6. Kotodama (pack #1) = `visual:'ink'`, `voice:'taiko'` — pakai **synth gong sekarang**, tanpa mp3.
7. Format voice: `public/voices/<packId>/correct_1.mp3`; kalau folder kosong → **fallback synth**.
8. `playStreakSound` tetap dipakai.
9. **Jangan commit/push** sampai user memberi izin eksplisit.

### Asumsi
- App client-only (localStorage key `user_progress_v2`), tanpa backend.
- Node **v24.18.1** → `node --test` tersedia (zero-dependency, sesuai YAGNI).

---

## 3. Architecture / Proposed Approach

Pisahkan **data** (registry statis) dari **state** (punya apa / aktif apa). Buat 3 registry: `PACKS` (id, nama, harga, rarity, → key visual, → key voice), `VOICES` (key → daftar mp3 + fallback synth), `VISUALS` (key → komponen). `ProgressContext` menyimpan `ownedPacks[]`/`activePack` (migrasi otomatis dari `ownedEffects`/`activeEffect`). Suara di-route lewat **setter module-level** `setActiveVoice(key)` yang disinkronkan sebuah komponen `<VoiceSync />` — sehingga **4 file pemanggil suara tidak perlu disentuh**. Menambah pack = cukup 1 entry di `PACKS` + isi folder mp3.

Diagram alur:

```
ProgressContext (state)                 registry (data statis)
  ownedPacks: ['kotodama_burst']  ──┐
  activePack: 'kotodama_burst'      │
        │                           │
        │ (1) <VoiceSync/> useEffect│
        ▼                           ▼
  sfx.setActiveVoice(voiceKey) ──► VOICES[voiceKey]
        │                              ├─ files.correct[] → playFile() (mp3)
        ▼                              └─ synth           → synthGong/synthThud
  playCorrectSound() ◄── dipanggil EffectContext (TIDAK DIUBAH signature)
        │
        ▼
  EffectContext: VISUALS[pack.visual]  (render overlay visual)
```

**DRY/YAGNI:** jangan bikin mix-and-match (ditolak user). Jangan bikin backend gacha — undian client-side. Jangan tambah dependency test baru.

---

## 4. Step-by-step Tasks

> Semua path relatif ke `C:\Users\maddo\Documents\japanese-quiz`.
> **TDD:** tulis tes gagal → `npm test` FAIL → implementasi → `npm test` PASS → commit.
> **JANGAN commit/push** sampai user izinkan (commit di bawah = instruksi, tapi tahan dulu bila user belum setuju).
> Jalankan perintah dari Git-Bash/MSYS. Untuk flag Windows, pakai `MSYS_NO_PATHCONV=1` bila perlu.

---

### Task 1 — Registry `PACKS` + tes

**File baru:** `src/features/packs/packs.js`

**1a.** Buat file **persis**:

```js
// ─────────────────────────────────────────────────────────────────────────────
// Theme Pack — satu pack = VISUAL + VOICE nyatu, di-equip sekali.
// Menambah pack baru: tambah 1 entry di PACKS, lalu daftarkan visual/voice-nya.
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
  const total = pool.reduce((sum, p) => sum + (PACK_RARITY[p.rarity]?.weight ?? 1), 0);
  let ticket = rng() * total;
  for (const pack of pool) {
    ticket -= PACK_RARITY[pack.rarity]?.weight ?? 1;
    if (ticket <= 0) return pack.id;
  }
  return pool[pool.length - 1].id;
};
```

**1b.** Tulis tes GAGAL — **file baru:** `src/features/packs/packs.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { PACKS, PACK_RARITY, getPack, isPackReady, rollPackId } from './packs.js';

test('PACKS berisi 6 pack dan semuanya ready', () => {
  assert.equal(PACKS.length, 6);
  assert.equal(PACKS.filter(isPackReady).length, 6);
});

test('setiap pack punya id unik & field wajib', () => {
  const ids = new Set(PACKS.map((p) => p.id));
  assert.equal(ids.size, 6);
  for (const p of PACKS) {
    assert.ok(p.id && p.name && p.rarity && p.visual && p.voice, `pack ${p.id} kurang field`);
    assert.ok(PACK_RARITY[p.rarity], `rarity ${p.rarity} tidak dikenal`);
  }
});

test('getPack fallback null', () => {
  assert.equal(getPack('zzz'), null);
  assert.equal(getPack('kotodama_burst')?.name, 'Kotodama Burst');
});

test('rollPackId selalu mengembalikan id valid', () => {
  const ids = new Set(PACKS.map((p) => p.id));
  for (let i = 0; i < 200; i++) assert.ok(ids.has(rollPackId()), 'id tidak valid');
});

test('rollPackId deterministik dengan rng inject', () => {
  assert.equal(rollPackId(() => 0), 'kotodama_burst');      // ticket 0 → pack pertama
  assert.equal(rollPackId(() => 0.999), 'pack_06');          // ticket ~max → pack terakhir
});

test('rollPackId menghormati bobot rarity (legendary lebih jarang dari common)', () => {
  const tally = {};
  for (let i = 0; i < 20000; i++) {
    const id = rollPackId();
    tally[id] = (tally[id] || 0) + 1;
  }
  const common = tally.pack_02 + tally.pack_03;   // 2 pack common
  const legendary = tally.kotodama_burst + tally.pack_06; // 2 pack legendary
  assert.ok(common > legendary, `common(${common}) harus > legendary(${legendary})`);
});
```

**Verifikasi (FAIL dulu):**
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm test 2>&1 | tail -15
```
Expected: FAIL — `Cannot find module './packs.js'` (atau `does not provide an export named 'PACKS'`).

**Verifikasi (PASS):** buat file `packs.js` (langkah 1a) lalu:
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm test 2>&1 | tail -15
```
Expected: semua tes `pass`, `fail 0`.

**Commit:**
```bash
git add src/features/packs/packs.js src/features/packs/packs.test.js
git commit -m "feat(packs): registry 6 Theme Pack + undian gacha berbobot (dites)"
```

---

### Task 2 — Registry `VOICES` + folder aset + tes

**File baru:** `src/features/audio/voices.js`
**Folder baru:** `public/voices/` (dengan `.gitkeep`)

**2a.** Buat folder:
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && mkdir -p public/voices && touch public/voices/.gitkeep
```

**2b.** Buat `src/features/audio/voices.js` **persis**:

```js
// ─────────────────────────────────────────────────────────────────────────────
// Registry VOICE per pack.
//   - files : daftar path mp3 (relatif ke public/). Dipilih acak tiap kali.
//   - synth : fallback Web Audio (tanpa file) — dipakai kalau files kosong.
// Menambah voice anime: taruh mp3 di public/voices/<packId>/correct_1.mp3, dst,
// lalu isi array files. Kalau kosong → otomatis jatuh ke synth (tidak error).
// ─────────────────────────────────────────────────────────────────────────────

export const VOICES = {
  // Pack #1 — Kotodama Burst. Tanpa mp3 → synth gong/taiko.
  taiko: {
    files: { correct: [], wrong: [], streak: [] },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },

  // Pack dummy (pack_02..pack_06) — placeholder, pakai synth yang sama.
  dummy: {
    files: { correct: [], wrong: [], streak: [] },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },

  // Contoh voice anime (aktifkan saat aset siap):
  // anime_a: {
  //   files: {
  //     correct: ['/voices/pack_02/correct_1.mp3'],
  //     wrong:   ['/voices/pack_02/wrong_1.mp3'],
  //     streak:  ['/voices/pack_02/streak_1.mp3'],
  //   },
  //   synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  // },
};

export const getVoice = (key) => VOICES[key] || VOICES.taiko;

// Pilih satu path acak dari daftar (atau null kalau kosong).
export const pickFile = (list, rng = Math.random) =>
  (Array.isArray(list) && list.length > 0)
    ? list[Math.floor(rng() * list.length)]
    : null;
```

**2c.** Tulis tes — **file baru:** `src/features/audio/voices.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { VOICES, getVoice, pickFile } from './voices.js';

test('getVoice fallback ke taiko untuk key tak dikenal', () => {
  assert.equal(getVoice('zzz'), VOICES.taiko);
  assert.equal(getVoice('dummy'), VOICES.dummy);
});

test('taiko & dummy tidak punya file (murni synth)', () => {
  assert.deepEqual(VOICES.taiko.files.correct, []);
  assert.deepEqual(VOICES.dummy.files.streak, []);
  assert.equal(VOICES.taiko.synth.correct, 'gong');
});

test('pickFile: kosong → null, list → salah satu isi', () => {
  assert.equal(pickFile([]), null);
  assert.equal(pickFile(null), null);
  assert.equal(pickFile(undefined), null);
  assert.ok(['a.mp3', 'b.mp3'].includes(pickFile(['a.mp3', 'b.mp3'])));
});

test('pickFile deterministik dengan rng inject', () => {
  assert.equal(pickFile(['a', 'b', 'c'], () => 0), 'a');
  assert.equal(pickFile(['a', 'b', 'c'], () => 0.99), 'c');
});
```

**Verifikasi (FAIL dulu):**
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm test 2>&1 | tail -15
```
Expected: FAIL — modul `./voices.js` tidak ada.

**Verifikasi (PASS):** setelah `voices.js` dibuat:
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && ls -la public/voices/ && npm test 2>&1 | tail -15
```
Expected: folder ada (berisi `.gitkeep`); semua tes `pass`, `fail 0`.

**Commit:**
```bash
git add src/features/audio/voices.js src/features/audio/voices.test.js public/voices/.gitkeep
git commit -m "feat(voices): registry voice per pack + fallback synth (dites)"
```

---

### Task 3 — Registry `VISUALS` + tes

**File baru:** `src/features/effects/visuals.js`

**3a.** Buat **persis**:

```js
// key → metadata visual. Komponen render sebenarnya ada di EffectContext.jsx.
export const VISUALS = {
  ink:   { id: 'ink',   label: 'Washi Ink',         component: 'ink'   },
  dummy: { id: 'dummy', label: 'Dummy Placeholder', component: 'dummy' },
};

export const getVisual = (key) => VISUALS[key] || null;
```

**3b.** Tulis tes — **file baru:** `src/features/effects/visuals.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { VISUALS, getVisual } from './visuals.js';

test('VISUALS punya ink & dummy', () => {
  assert.deepEqual(Object.keys(VISUALS).sort(), ['dummy', 'ink']);
});

test('getVisual fallback null', () => {
  assert.equal(getVisual('nope'), null);
  assert.equal(getVisual('ink')?.label, 'Washi Ink');
  assert.equal(getVisual('dummy')?.component, 'dummy');
});
```

**Verifikasi (FAIL lalu PASS):**
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm test 2>&1 | tail -15
```
Expected: FAIL sebelum file ada; `pass 0 fail 0` setelah — semua hijau.

**Commit:**
```bash
git add src/features/effects/visuals.js src/features/effects/visuals.test.js
git commit -m "feat(visuals): registry visual pack (ink + dummy) (dites)"
```

---

### Task 4 — Routing voice di `sfx.js` **tanpa menghapus gong audible**

**File diubah:** `src/utils/sfx.js` (157 baris)

> ⚠️ **JANGAN** pakai versi `sfx.js` dari plan lama — versi itu membuang `streakGongParams` (gong audible) dan memakai `synthGong` base 96–140 Hz yang senyap. Kita **pertahankan** `streakGongParams` + `src/utils/sfx.params.test.js` yang sudah ada.

**4a.** Tulis tes GAGAL dulu — **file baru:** `src/utils/sfx.routing.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { setActiveVoice, getActiveVoiceKey } from './sfx.js';

test('default voice = taiko', () => {
  assert.equal(getActiveVoiceKey(), 'taiko');
});

test('setActiveVoice mengubah & fallback ke taiko saat kosong', () => {
  setActiveVoice('dummy');
  assert.equal(getActiveVoiceKey(), 'dummy');
  setActiveVoice(null);
  assert.equal(getActiveVoiceKey(), 'taiko');
  setActiveVoice('');
  assert.equal(getActiveVoiceKey(), 'taiko');
});

test('sfx.js tetap mengekspor streakGongParams (gong audible tidak boleh hilang)', async () => {
  const mod = await import('./sfx.js');
  assert.equal(typeof mod.streakGongParams, 'function');
  const p = mod.streakGongParams(1);
  assert.ok(p.base >= 180, 'base harus audible (>=180Hz)');
});
```

**Verifikasi (FAIL dulu):**
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm test 2>&1 | tail -20
```
Expected: FAIL — `does not provide an export named 'setActiveVoice'`.

**4b.** Ganti **seluruh isi** `src/utils/sfx.js` dengan versi berikut (gong audible dipertahankan, ditambah routing voice):

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

// ── Voice aktif (di-set ProgressProvider lewat setActiveVoice) ───────────────
let activeVoiceKey = 'taiko';
export const setActiveVoice = (key) => { activeVoiceKey = key || 'taiko'; };
export const getActiveVoiceKey = () => activeVoiceKey;

// ── Pemutar file mp3 (mode voice pack) ──────────────────────────────────────
const playFile = (path) => {
  if (typeof window === 'undefined' || !path) return false;
  const audio = new Audio(path);
  audio.volume = 0.9;
  audio.play().catch((err) => console.warn('Voice play error:', err));
  return true;
};

// ── Gong bertingkat (murni) — JANGAN diubah, dites di sfx.params.test.js ─────
const GONG_RATIOS = [1, 2.55, 3.8, 5.2, 6.9, 8.8];
const MAX_LEVEL = 12;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const heatFor = (level) => clamp01(((level || 0) - 1) / (MAX_LEVEL - 1));

export function streakGongParams(level = 0) {
  const heat = heatFor(level);
  const base = 200 + heat * 60;              // 200 -> 260 Hz (audible)
  const dur = 1.0 + heat * 1.6;              // 1.0 -> 2.6 s
  const partialLevel = 2 + heat * (GONG_RATIOS.length - 2);
  const weights = GONG_RATIOS.map((_, i) => clamp01(partialLevel - i));
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;
  const peak = 0.85;

  const partials = GONG_RATIOS
    .map((ratio, i) => ({ freq: base * ratio, gain: peak * (weights[i] / totalW), weight: weights[i] }))
    .filter((p) => p.weight > 0.001);

  const strike = {
    freq: 2200 + heat * 1400,
    gain: clamp01(heat * 1.6 - 0.3) * 0.18,
    dur: 0.06,
  };

  return { heat, base, dur, partials, strike };
}

// ── Synth: gong (benar/streak) & thud (salah) ───────────────────────────────
const synthGong = (level = 0) => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const { dur, partials, strike } = streakGongParams(level);
  const t = ctx.currentTime;

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
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.32);
};

// ── API publik (signature TIDAK berubah untuk 4 file pemanggil) ─────────────
export const playCorrectSound = () => {
  const voice = getVoice(activeVoiceKey);
  if (playFile(pickFile(voice.files?.correct))) return;
  synthGong(0);
};

export const playWrongSound = () => {
  const voice = getVoice(activeVoiceKey);
  if (playFile(pickFile(voice.files?.wrong))) return;
  synthThud();
};

// Voice khusus milestone streak (dipakai EffectContext).
export const playStreakSound = (level = 0) => {
  const voice = getVoice(activeVoiceKey);
  if (playFile(pickFile(voice.files?.streak))) return;
  synthGong(level);
};
```

**Verifikasi (PASS):**
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm test 2>&1 | tail -20
```
Expected: **semua** tes pass — `sfx.params.test.js` (6) + `sfx.routing.test.js` (3) + packs/voices/visuals. `fail 0`.

```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm run build 2>&1 | grep -E "built in|error" | head
```
Expected: `✓ built in …s`, tanpa error.

**Commit:**
```bash
git add src/utils/sfx.js src/utils/sfx.routing.test.js
git commit -m "feat(sfx): routing voice per pack (mp3 -> fallback synth); gong audible dipertahankan"
```

---

### Task 5 — Migrasi state `ProgressContext` ke packs + `rollGacha`

**File diubah:** `src/features/progress/ProgressContext.jsx`

**5a.** Tambah import di atas (setelah `import ... from 'react'`, baris 1):

```js
import { getPack, rollPackId, isPackReady } from '../packs/packs';
```

**5b.** Di `DEFAULT_PROGRESS` (baris 26–40), ganti:
```js
  ownedEffects: [],
  activeEffect: null,
```
menjadi:
```js
  ownedPacks: [],
  activePack: null,
```

**5c.** Ganti baris 49 (`export const EFFECT_PRICES = { kotodama_burst: 2500 };`) menjadi:
```js
// Harga & refund gacha (mengikuti harga pack di registry PACKS).
const GACHA_PRICE_1X = 100;
const GACHA_PRICE_10X = 900;
const DUPLICATE_REFUND = 50; // refund per duplikat (keputusan user #2)
```

**5d.** Tambah fungsi migrasi **tepat di atas** `export const ProgressProvider` (baris ~117):
```js
// ── Migrasi state lama (ownedEffects/activeEffect) → packs ──────────────────
const migratePacks = (p) => {
  if (!p) return p;
  const legacyOwned = Array.isArray(p.ownedEffects) ? p.ownedEffects : null;
  if (legacyOwned) {
    p.ownedPacks = [...new Set([...(p.ownedPacks || []), ...legacyOwned])];
    if (p.activePack == null && p.activeEffect != null) p.activePack = p.activeEffect;
    delete p.ownedEffects;
    delete p.activeEffect;
  }
  return p;
};
```

**5e.** Di loader localStorage (baris ~122–129), bungkus hasil merge dengan `migratePacks`:
```js
    try {
      const parsed = JSON.parse(saved);
      // Merge dengan default (backfill field hilang) + migrasi state pack.
      return migratePacks({ ...DEFAULT_PROGRESS, ...(parsed || {}) });
    } catch {
      return DEFAULT_PROGRESS;
    }
```

**5f.** Ganti `buyEffect` (baris ~423–442) menjadi `buyPack`:
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

**5g.** Ganti `toggleEffect` (baris ~445–455) menjadi `togglePack`:
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

**5h.** Tambah `rollGacha` **tepat sebelum** `resetProgress` (baris ~457). Undian dihitung **di luar** updater (aman StrictMode React 19):
```js
  // Undian gacha. count = 1 atau 10.
  // Return { ok, results:[{id,isNew}], refunded }.
  const rollGacha = useCallback((count = 1) => {
    const price = count >= 10 ? GACHA_PRICE_10X : GACHA_PRICE_1X;
    const balance = progressRef.current?.medaru || 0;
    if (balance < price) return { ok: false, reason: 'poor', results: [], refunded: 0 };

    const ownedNow = progressRef.current?.ownedPacks || [];
    const seen = new Set(ownedNow);
    const results = [];
    for (let i = 0; i < count; i++) {
      const id = rollPackId();
      if (!id) break;
      const isNew = !seen.has(id);
      results.push({ id, isNew });
      seen.add(id);
    }
    const refunded = results.filter((r) => !r.isNew).length * DUPLICATE_REFUND;

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

**5i.** Update provider value (baris 469) — ganti `buyEffect, toggleEffect` → `buyPack, togglePack, rollGacha` (pertahankan `spendMedaru`):
```jsx
    <UserStatsContext.Provider value={{ progress, username, setUsername, addXp, completeQuiz, spendMedaru, buyPack, togglePack, rollGacha, resetProgress }}>
```

**Verifikasi:**
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm run build 2>&1 | grep -E "built in|error" | head
grep -rn "buyEffect\|toggleEffect\|EFFECT_PRICES" src/ || echo "BERSIH: nama lama tinggal di migratePacks"
```
Expected: build sukses; `BERSIH` (kecuali `ownedEffects`/`activeEffect` yang memang disebut di `migratePacks`).

**Commit:**
```bash
git add src/features/progress/ProgressContext.jsx
git commit -m "feat(progress): state ownedPacks/activePack + buyPack/togglePack/rollGacha + migrasi"
```

---

### Task 6 — Sinkronkan voice + gerbang visual via pack

**File diubah:** `src/App.jsx`, `src/features/effects/EffectContext.jsx`

**6a.** Di `src/App.jsx`, tambah import (setelah baris 11):
```jsx
import { useEffect } from "react";
import { getPack } from "./features/packs/packs";
import { setActiveVoice } from "./utils/sfx";
```

**6b.** Tambah komponen `VoiceSync` (di atas `function App()`):
```jsx
// Sinkronkan voice aktif ke sfx.js setiap activePack berubah.
function VoiceSync() {
  const { progress } = useUserStats();
  useEffect(() => {
    const pack = getPack(progress.activePack);
    setActiveVoice(pack?.voice || 'taiko');
  }, [progress.activePack]);
  return null;
}
```

**6c.** Render `<VoiceSync />` di dalam `ProgressProvider` (baris 70):
```jsx
        <ProgressProvider>
          <VoiceSync />
          <EffectProvider>
```

**6d.** Di `src/features/effects/EffectContext.jsx`, tambah import (setelah baris 4):
```jsx
import { getPack } from '../packs/packs';
import { getVisual } from './visuals';
```

**6e.** Ganti baris 25 (`export const EFFECT_ID = 'kotodama_burst';`) — hapus (tidak lagi dipakai).

**6f.** Ganti baris 110:
```jsx
  const active = progress.activeEffect === EFFECT_ID;
```
menjadi:
```jsx
  // Visual aktif hanya kalau activePack punya visual yang terdaftar.
  const activePack = getPack(progress.activePack);
  const activeVisual = activePack?.visual || null;
  const active = Boolean(getVisual(activeVisual));
```

**6g.** Teruskan `activeVisual` ke layer. Di baris 193, ganti:
```jsx
      <EffectLayer fx={fx} drops={drops} />
```
menjadi:
```jsx
      <EffectLayer fx={fx} drops={drops} visual={activeVisual} />
```
Lalu ubah signature `EffectLayer` (baris 199):
```jsx
function EffectLayer({ fx, drops, visual }) {
```

**Verifikasi:**
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm run build 2>&1 | grep -E "built in|error" | head && npm run lint 2>&1 | grep -iE "error" | head
```
Expected: build sukses; lint 0 error.

**Commit:**
```bash
git add src/App.jsx src/features/effects/EffectContext.jsx
git commit -m "feat(effects): gerbang visual via activePack + sinkronisasi voice (VoiceSync)"
```

---

### Task 7 — `Shop.jsx`: kartu pack + hasil gacha

**File diubah:** `src/features/shop/Shop.jsx`

> **Keputusan (default, aman):** **pertahankan** 3 barang generik (Kopi Kaleng, Selotip Kaset, Kabel Jumper — tetap pakai `spendMedaru`), **buang** id4 "Voice Pack: custom" & id5 Kotodama (digantikan sistem pack), lalu **tambah** seksi Theme Pack + modal gacha.

**7a.** Ganti baris 1–35 (import + `shopData` + deklarasi hook) dengan:

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
  common:    { bg: 'bg-kinari-light', text: 'text-sumi',         border: 'border-sumi' },
  rare:      { bg: 'bg-ai',           text: 'text-kinari-light', border: 'border-sumi' },
  legendary: { bg: 'bg-shu',          text: 'text-kinari-light', border: 'border-sumi' },
};

// Barang generik (bukan pack) — tetap pakai spendMedaru.
const GENERIC_ITEMS = [
  { id: 1, icon: "☕", name: "Kopi Kaleng Boss", desc: "EXP x2 (30 Menit)", price: 500 },
  { id: 2, icon: "📼", name: "Selotip Kaset", desc: "Sambung Streak Putus", price: 1200 },
  { id: 3, icon: "🔌", name: "Kabel Jumper", desc: "1x Hidup (Death Quiz)", price: 800 },
];

export function Shop() {
  const { progress, spendMedaru, buyPack, togglePack, rollGacha } = useUserStats();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [pullResult, setPullResult] = useState(null);

  const medaru = progress.medaru || 0;
  const ownedPacks = progress.ownedPacks || [];
  const activePack = progress.activePack;

  const handlePurchase = (price) => {
    const ok = spendMedaru(price);
    alert(ok
      ? (language === 'id' ? "Transaksi diproses..." : "Transaction processed...")
      : (language === 'id' ? `Medaru kurang! Butuh ${price}, saldo kamu ${medaru}.` : `Not enough Medaru! Need ${price}, you have ${medaru}.`));
  };

  const handleRoll = (count) => {
    const price = count >= 10 ? GACHA_PRICE_10X : GACHA_PRICE_1X;
    const res = rollGacha(count);
    if (!res.ok) {
      alert(language === 'id' ? `Medaru kurang! Butuh ${price}, saldo kamu ${medaru}.` : `Not enough Medaru! Need ${price}, you have ${medaru}.`);
      return;
    }
    setPullResult(res);
  };

  const handlePackAction = (pack) => {
    if (!isPackReady(pack)) return;
    const owned = ownedPacks.includes(pack.id);
    if (!owned) {
      const result = buyPack(pack.id);
      if (result === 'poor') {
        alert(language === 'id' ? `Medaru kurang! Butuh ${pack.price}, saldo kamu ${medaru}.` : `Not enough Medaru! Need ${pack.price}, you have ${medaru}.`);
      }
      return;
    }
    togglePack(pack.id);
  };
```

**7b.** Ganti `onClick` dua tombol gacha (baris ~160 & ~167) dari `handlePurchase(shopData.gacha.price1x/10x)` → `handleRoll(1)` / `handleRoll(10)`, dan label pakai konstanta:
```jsx
                  TARIK 1X - {GACHA_PRICE_1X} 🪙
```
```jsx
                  TARIK 10X - {GACHA_PRICE_10X} 🪙
```
(Blok Gacha section lainnya tidak diubah.)

**7c.** Ganti **seluruh** blok Etalase (baris 176–232) dengan dua seksi berikut:

```jsx
          {/* Barang Generik */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-serif font-black text-sumi tracking-tight">
                {language === 'id' ? 'Etalase Warung Kakek' : 'Grandpa Shop Shelf'}
              </h2>
              <div className="h-[2px] flex-1 bg-sumi/10"></div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40">品物</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {GENERIC_ITEMS.map((item) => (
                <div key={item.id} className="bg-kinari border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] flex flex-col text-center p-6">
                  <div className="text-6xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-serif font-black border-b-4 border-sumi pb-2 mb-2 text-sumi">{item.name}</h3>
                  <p className="text-sm font-bold mb-6 flex-grow text-sumi/80">{item.desc}</p>
                  <button type="button" onClick={() => handlePurchase(item.price)}
                    className={`py-3 font-black text-lg w-full border-4 border-sumi shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-1 active:shadow-none transition-all ${
                      medaru >= item.price ? "bg-ai text-kinari-light" : "bg-kinari-light text-sumi/50"
                    }`}>
                    BELI - {item.price} 🪙
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Theme Pack */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-serif font-black text-sumi tracking-tight">
                {language === 'id' ? 'Theme Pack' : 'Theme Pack'}
              </h2>
              <div className="h-[2px] flex-1 bg-sumi/10"></div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40">主題</span>
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
                    className={`border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] flex flex-col p-6 relative overflow-hidden ${ready ? 'bg-kinari' : 'bg-kinari-light/60'}`}>
                    <span className={`absolute top-0 right-0 text-[9px] font-black px-2 py-1 border-b-[3px] border-l-[3px] border-sumi ${rs.bg} ${rs.text}`}>
                      {PACK_RARITY[pack.rarity]?.label || 'COMMON'}
                    </span>
                    <div className="text-5xl mb-3 text-center mt-2">{pack.icon}</div>
                    <h3 className="text-lg font-serif font-black border-b-4 border-sumi pb-2 mb-2 text-sumi text-center">{pack.name}</h3>
                    <div className="text-[11px] font-bold text-sumi/60 text-center mb-3">{pack.kanji}</div>
                    <p className="text-sm font-bold mb-6 flex-grow text-sumi/80 text-center">{language === 'id' ? pack.desc : pack.desc_en}</p>
                    {!ready ? (
                      <div className="py-3 text-center text-xs font-black uppercase tracking-widest border-4 border-dashed border-sumi/30 text-sumi/40">
                        {language === 'id' ? 'Segera Hadir' : 'Coming Soon'}
                      </div>
                    ) : (
                      <button type="button" onClick={() => handlePackAction(pack)}
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

**7d.** Tambah modal hasil gacha **sebelum** penutup `</div>` body (setelah `</section>` Theme Pack, sebelum `</div>` baris 234):

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
                            {r.isNew ? (language === 'id' ? 'BARU!' : 'NEW!') : (language === 'id' ? 'DUPLIKAT +50 🪙' : 'DUPE +50 🪙')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {pullResult.refunded > 0 && (
                    <div className="mb-4 text-center text-sm font-black text-sumi bg-[#ffd700]/40 border-[3px] border-sumi py-2">
                      {language === 'id' ? `Refund duplikat: +${pullResult.refunded} 🪙` : `Duplicate refund: +${pullResult.refunded} 🪙`}
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
cd "C:/Users/maddo/Documents/japanese-quiz" && npm run build 2>&1 | grep -E "built in|error" | head
grep -n "shopData\|buyEffect\|toggleEffect" src/features/shop/Shop.jsx || echo "BERSIH: Shop pakai PACKS"
```
Expected: build sukses; `BERSIH`.

**Commit:**
```bash
git add src/features/shop/Shop.jsx
git commit -m "feat(shop): kartu Theme Pack + gacha fungsional + modal hasil (refund duplikat)"
```

---

### Task 8 — Cabang visual `dummy` di `EffectContext.jsx`

**File diubah:** `src/features/effects/EffectContext.jsx`

Tujuan: pack dummy (pack_02..06) tetap terlihat aktif (bukan kosong) → kilatan netral + kanji `仮`.

**8a.** Di `EffectLayer`, tepat setelah blok `<AnimatePresence>` yang menutup baris ~295 (`{kind === 'streak' && (...)}` lalu `</AnimatePresence>`), sisipkan cabang dummy **di dalam** `<div className="fixed inset-0 ...">` (setelah `</motion.div>` penutup wash/splash, sebelum `</div>` terakhir):

```jsx
      {/* Visual dummy (pack_02..pack_06) — placeholder yang tetap terlihat */}
      {visual === 'dummy' && fx && (
        <motion.div
          key={`dummy-${fx.id}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.9, 1.05, 1] }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-[18vw] font-serif font-black text-sumi/25 select-none">仮</span>
        </motion.div>
      )}
```

**Verifikasi:**
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm run build 2>&1 | grep -E "built in|error" | head && npm run lint 2>&1 | grep -iE "error" | head
```
Expected: build sukses; lint 0 error.

**Commit:**
```bash
git add src/features/effects/EffectContext.jsx
git commit -m "feat(effects): cabang visual dummy (kanji 仮) untuk pack placeholder"
```

---

### Task 9 — Migrasi `DevPanel.jsx` (jangan sampai rusak)

**File diubah:** `src/features/dev/DevPanel.jsx`

> Panel ini menulis `ownedEffects`/`activeEffect` langsung ke localStorage. Setelah Task 5, field itu tidak dibaca lagi → tombol "Buka & Pakai Efek" jadi tak berefek. Ganti ke `ownedPacks`/`activePack`.

**9a.** Ganti baris 60:
```js
    writeProgress({ ownedPacks: ["kotodama_burst"], activePack: "kotodama_burst" });
```

**9b.** Ganti baris 77:
```js
    writeProgress({ medaru: 999999, ownedPacks: ["kotodama_burst"], activePack: "kotodama_burst" });
```

**9c.** Ganti baris 123 (baris status):
```jsx
          medaru: {progress.medaru || 0} · packs: {(progress.ownedPacks || []).join(", ") || "—"} · active: {progress.activePack || "—"}
```

**Verifikasi:**
```bash
cd "C:/Users/maddo/Documents/japanese-quiz" && npm run build 2>&1 | grep -E "built in|error" | head
grep -rn "ownedEffects\|activeEffect" src/ || echo "BERSIH TOTAL (kecuali migratePacks)"
```
Expected: build sukses; grep hanya menyisakan kemunculan di `migratePacks` (`ProgressContext.jsx`) — cek manual baris itu.

**Commit:**
```bash
git add src/features/dev/DevPanel.jsx
git commit -m "chore(dev): DevPanel pakai ownedPacks/activePack"
```

---

### Task 10 — Validasi menyeluruh

```bash
cd "C:/Users/maddo/Documents/japanese-quiz"
npm test 2>&1 | tail -12
npm run lint 2>&1 | grep -icE "error" || echo "0 error"
npm run build 2>&1 | grep -E "built in|error" | head
grep -rn "ownedEffects\|activeEffect\|buyEffect\|toggleEffect\|EFFECT_PRICES\|shopData" src/ || echo "BERSIH TOTAL"
```
Expected:
- `npm test`: semua pass, `fail 0`.
- lint: 0 error (warning `only-export-components` pre-existing boleh ada).
- build: `✓ built in …s`.
- grep: hanya `migratePacks` yang menyebut `ownedEffects`/`activeEffect` (itu memang disengaja). Tidak ada `buyEffect`/`toggleEffect`/`EFFECT_PRICES`/`shopData`.

**E2E manual (user):** lihat §5.

---

## 5. Tests / Validation

Repo sekarang **punya** runner `node --test` (`npm test`). TDD = tes murni di Node + build gate + E2E manual.

| Task | Tes | Perintah | Expected |
|---|---|---|---|
| 1 | `packs.test.js` (6) | `npm test` | FAIL dulu → PASS (6/6) |
| 2 | `voices.test.js` (4) | `npm test` | FAIL dulu → PASS |
| 3 | `visuals.test.js` (2) | `npm test` | FAIL dulu → PASS |
| 4 | `sfx.routing.test.js` (3) + `sfx.params.test.js` (6) | `npm test` | PASS semua; `streakGongParams` tetap ada |
| 5 | build + grep nama lama | `npm run build` / grep | build sukses; nama lama bersih |
| 6–9 | build + lint | `npm run build && npm run lint` | sukses; 0 error |
| 10 | semua di atas | `npm test && npm run lint && npm run build` | hijau |

**Kriteria lulus akhir:** `npm test` hijau, `npm run build` sukses, `npm run lint` 0 error, grep nama lama bersih.

**E2E manual (browser, user yang jalankan):**
```bash
npm run dev
```
1. `/settings` → DevPanel → **"Medaru 999999"**.
2. `/shop` → **TARIK 1X** → modal muncul, saldo −100 (atau −100 + refund bila duplikat).
3. **TARIK 10X** → modal 10 kartu; bila ada duplikat muncul baris **"Refund duplikat: +N 🪙"**; saldo = −900 + N.
4. Beli **Kotodama Burst** (2500) → tombol **AKTIF ✓**.
5. Equip **Dummy A** → jawab kuis → muncul kanji **仮** samar (bukan efek tinta).
6. Equip **Kotodama** lagi → jawab **benar** → dengar **gong** (bukan chime) + visual tinta; jawab **salah** → **thud** + sapuan kuas.
7. Nonaktifkan pack → jawab kuis → tidak ada visual/suara pack (chime dasar tetap).
8. Refresh → pack & saldo tetap tersimpan (localStorage).
9. (Regresi) Kuis Mondai/Quiz/Practice/Review tetap berbunyi normal.

---

## 6. Risks, Tradeoffs, and Open Questions

### Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| **Menimpa gong audible** (kalau pakai `sfx.js` dari plan lama) | Suara streak senyap lagi | Task 4 **mempertahankan** `streakGongParams`; `sfx.routing.test.js` menguji `streakGongParams` masih ada & `base>=180`. |
| **`DevPanel` menulis field lama** | Tombol "Buka & Pakai Efek" mati setelah migrasi | Task 9 memigrasikannya; Task 10 grep memastikan bersih. |
| **StrictMode double-invoke `setProgress`** | Saldo gacha terpotong dobel | `rollGacha` menghitung undian **di luar** updater + idempotent di dalam (Task 5h). |
| **Migrasi state gagal** (user punya `ownedEffects`) | Pack hilang setelah update | `migratePacks()` menyalin `ownedEffects`→`ownedPacks`, `activeEffect`→`activePack` (Task 5d–5e). |
| **Autoplay diblokir browser** | Voice mp3 tidak bunyi di klik pertama | `audio.play().catch()` + fallback synth (tidak crash). |
| **Bundle membengkak** oleh mp3 | Load awal lambat | mp3 di `public/` tidak masuk bundle Vite. Batasi < 200 KB/file. |
| **Legal klip anime** | Masalah bila dipublikasikan | Aman untuk pribadi/demo; untuk publish pakai voice orisinal/TTS berlisensi. |

### Tradeoff
- **Satu pack = visual+voice nyatu** (pilihan user) lebih simpel, tapi tidak bisa mix-and-match. Bisa ditambah nanti (`activeVisual` + `activeVoice` terpisah) — **YAGNI sekarang**.
- **Gacha client-side** gampang dicurangi via devtools; tidak masalah untuk app belajar pribadi.
- **Refund 50 medaru** membuat ekonomi gacha lebih longgar; ubah `DUPLICATE_REFUND` bila perlu.
- **Dummy dianggap "ready"** → gacha bisa mengeluarkan ke-6 pack sejak awal (bagus untuk demo, tapi belum ada pack "langka nyata").

### Open Questions
1. **Barang generik di Shop** (Kopi/Selotip/Kabel): plan ini **mempertahankannya** (default aman). Kalau mau diganti penuh oleh pack, hapus seksi `GENERIC_ITEMS`.
2. **`playStreakSound` saat efek nonaktif**: sekarang streak hanya bersuara kalau pack aktif (gate `active`). Mau streak tetap bersuara walau pack OFF? Default: **tidak** (perilaku sekarang).
3. **Harga gacha 10x (900)** vs 10×100=1000 → sudah diskon; biarkan.
4. **Review.jsx** tetap chime dasar (tanpa pack) — di luar scope.
5. **Commit/push**: Task di atas menulis perintah commit, tapi **tahan dulu** sampai user memberi izin eksplisit (sesuai instruksi lama). Push **selalu** butuh izin.
