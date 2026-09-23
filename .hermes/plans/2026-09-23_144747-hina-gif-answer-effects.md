# Plan — Efek jawaban Hina Chono (GIF) untuk pack Kotodama Burst

## Goal

Saat pack `kotodama_burst` aktif, jawaban **benar** menampilkan GIF reaksi Hina
(`HinaRight*`) dan jawaban **salah** menampilkan GIF `HinaWrong*` — semua dipajang di
**kotak persegi yang sama** (rata tengah, ~40% tinggi layar) dengan `object-fit: contain`
supaya **muka Hina selalu terlihat utuh**, tanpa efek murahan.

---

## Current context / assumptions

Repo: `C:\Users\maddo\Documents\japanese-quiz` (Vite + React 19, Tailwind v4, `motion/react`,
test = `node --test`, **59 test hijau**). Shell: **Git Bash** di Windows.

Aset sudah ditaruh user di `public/effects/` (**untracked**, belum masuk git):

| File | Ukuran | Bentuk | Catatan |
|---|---|---|---|
| `HinaRight.gif` | 220×220 | persegi | muka jelas |
| `HinaRight1.gif` | 220×220 | persegi | muka jelas |
| `HinaRight2.gif` | 220×220 | persegi | muka jelas |
| `HinaRight3.gif` | 220×124 | **landscape** | muka tengah-kanan, agak kepotong atas |
| `HinaWrong.gif` | 498×498 | persegi | 1.7 MB (berat) |
| `HinaWrong1.gif` | 220×185 | **agak landscape** | muka jelas |
| `HinaWrong2.webp` | 200×200 | persegi | **animated WebP, transparan** |
| `HinaWrong3.gif` | 220×124 | **landscape** | ⚠️ **dari belakang — MUKA TIDAK KELIHATAN** |

Titik kode penting:

- `src/features/effects/visuals.js` — `VISUALS = { ink, dummy }`, `getVisual(key)`.
  `src/features/effects/visuals.test.js` **mengunci** `Object.keys(VISUALS).sort()` =
  `['dummy','ink']` → **harus di-update** saat menambah key baru.
- `src/features/packs/packs.js` baris 22 — `kotodama_burst` punya `visual: 'ink'`,
  `voice: 'hina'`. Pack inilah "pack Hina".
- `src/features/effects/EffectContext.jsx`:
  - `activeVisual = activePack?.visual`; `active = Boolean(getVisual(activeVisual))`
    (baris ~111–113). Kalau `!active`, `triggerEffect` cuma bunyi tanpa visual.
  - `triggerEffect(type)` (baris ~144) menyusun `setFx({ kind, id, seed, angle, y, level,
    milestone, streak, signature, onMilestone })`. `kind` ∈ `'correct' | 'wrong' | 'streak'`
    (`'streak'` dipakai saat benar **tepat di milestone**).
  - `EffectLayer({ fx, drops, visual })` (baris ~206) merender: cabang `visual === 'ink'`
    (filter SVG tinta + `HankoStamp`/`BrushSlash`/`StreakSigil`) dan `visual === 'dummy'`.
- Pemanggil `triggerEffect('correct' | 'wrong')`: `src/features/quiz/Quiz.jsx`,
  `src/features/quiz/MondaiQuiz.jsx`, `src/pages/Practice.jsx` — **tidak perlu diubah**.

Keputusan user (sesi ini):
- **Benar** = acak dari `HinaRight*` (4 file). **Salah** = acak dari `HinaWrong*` (4 file).
- Tampil **tengah layar, besar (~40% tinggi layar)**, **semua kotak**, muka tetap keliatan
  → pakai **`object-fit: contain`** (pad), bukan crop.
- Efek tinta lama (hanko 正 / sapuan kuas) **diganti** efek baru bergaya Hina, **tanpa slop**.
- Hanya berlaku untuk **pack Kotodama Burst**.

Assumptions:
- GIF dipilih **per jawaban** (acak), bukan dirotasi global.
- **Streak** tetap memakai sigil ensō emas yang ada (`StreakSigil`) — bukan GIF — supaya
  milestone tetap terasa spesial. (Kalau mau streak pakai GIF juga → open question.)
- `HinaWrong3.gif` (tanpa muka) tetap ikut acak; ada toggle 1 baris untuk membuangnya.

---

## Architecture / proposed approach

Tambah satu **registry GIF** murni (`hinaGifs.js`) + satu **key visual baru** `hina` di
`visuals.js`, lalu arahkan `kotodama_burst.visual` ke `'hina'`. Di `EffectContext.jsx`,
GIF dipilih **saat trigger** (disimpan di `fx.gifSrc`, supaya stabil & tidak re-pick tiap
render) dan dirender di dalam satu kotak persegi bergaya brutalist app (border tebal +
hard-shadow) dengan `object-fit: contain`. `StreakSigil` tetap dipakai untuk `kind ===
'streak'`.

---

## Step-by-step tasks

> Jalankan semua perintah dari `C:\Users\maddo\Documents\japanese-quiz` (Git Bash).

### Task 0 — Masukkan aset ke git (commit A)

```bash
cd /c/Users/maddo/Documents/japanese-quiz
ls -1 public/effects
git add public/effects
git commit -m "assets(effects): 8 GIF reaksi Hina (benar/salah)"
```

**Verify:**

```bash
git log --oneline -1                       # assets(effects): 8 GIF reaksi Hina …
git ls-files public/effects | wc -l        # -> 8
```

---

### Task 1 — TDD: registry GIF `hinaGifs.js` (commit B)

**1a. Tulis test dulu** — buat `src/features/effects/hinaGifs.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { HINA_GIFS, pickHinaGif } from './hinaGifs.js';

test('HINA_GIFS punya 4 correct & 4 wrong', () => {
  assert.equal(HINA_GIFS.correct.length, 4);
  assert.equal(HINA_GIFS.wrong.length, 4);
});

test('semua path unik & menunjuk ke /effects/HinaRight|Wrong', () => {
  const all = [...HINA_GIFS.correct, ...HINA_GIFS.wrong];
  assert.equal(new Set(all).size, 8, 'tidak boleh duplikat');
  for (const p of all) assert.match(p, /^\/effects\/Hina(?:Right|Wrong)[0-9]*\.(?:gif|webp)$/);
});

test('pickHinaGif deterministik & null untuk kind lain', () => {
  assert.equal(pickHinaGif('correct', () => 0), '/effects/HinaRight.gif');
  assert.equal(pickHinaGif('wrong', () => 0.99), '/effects/HinaWrong3.gif');
  assert.equal(pickHinaGif('streak'), null);
  assert.equal(pickHinaGif('nope'), null);
});
```

**1b. Run → expect FAIL** (file belum ada):

```bash
npm test 2>&1 | grep -E "HINA_GIFS|pickHinaGif|Cannot find|ℹ (tests|pass|fail)"
# expect: gagal impor './hinaGifs.js' → ℹ fail >= 1
```

**1c. Implement** — buat `src/features/effects/hinaGifs.js`:

```js
// Registry GIF reaksi Hina Chono untuk efek jawaban (pack kotodama_burst).
// Dipakai EffectContext saat visual 'hina' aktif.
export const HINA_GIFS = {
  correct: [
    '/effects/HinaRight.gif',
    '/effects/HinaRight1.gif',
    '/effects/HinaRight2.gif',
    '/effects/HinaRight3.gif',
  ],
  wrong: [
    '/effects/HinaWrong.gif',
    '/effects/HinaWrong1.gif',
    '/effects/HinaWrong2.webp',
    '/effects/HinaWrong3.gif',   // ⚠️ dari belakang (tanpa muka) — hapus baris ini kalau tak mau
  ],
};

// Pilih satu GIF acak untuk kind ('correct' | 'wrong'). null kalau kind lain.
export const pickHinaGif = (kind, rng = Math.random) => {
  const list = HINA_GIFS[kind];
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(rng() * list.length)];
};
```

**1d. Run → expect PASS:**

```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
# expect: ℹ tests 62 / ℹ pass 62 / ℹ fail 0
```

Commit:

```bash
git add src/features/effects/hinaGifs.js src/features/effects/hinaGifs.test.js
git commit -m "feat(effects): registry GIF reaksi Hina (correct/wrong)"
```

---

### Task 2 — TDD: daftarkan visual `hina` (commit C)

**2a. Update test** — ganti seluruh isi `src/features/effects/visuals.test.js` jadi:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { VISUALS, getVisual } from './visuals.js';

test('VISUALS punya ink, hina & dummy', () => {
  assert.deepEqual(Object.keys(VISUALS).sort(), ['dummy', 'hina', 'ink']);
});

test('getVisual fallback null', () => {
  assert.equal(getVisual('nope'), null);
  assert.equal(getVisual('ink')?.label, 'Washi Ink');
  assert.equal(getVisual('hina')?.label, 'Hina Reaction');
  assert.equal(getVisual('dummy')?.component, 'dummy');
});
```

**2b. Run → expect FAIL:**

```bash
npm test 2>&1 | grep -E "VISUALS punya|getVisual fallback|ℹ (tests|pass|fail)"
# expect: 2 test gagal (hina belum ada); ℹ fail 2
```

**2c. Implement** — `src/features/effects/visuals.js`:

```js
// key → metadata visual. Komponen render sebenarnya ada di EffectContext.jsx.
export const VISUALS = {
  ink:   { id: 'ink',   label: 'Washi Ink',         component: 'ink'   },
  hina:  { id: 'hina',  label: 'Hina Reaction',     component: 'hina'  },
  dummy: { id: 'dummy', label: 'Dummy Placeholder', component: 'dummy' },
};

export const getVisual = (key) => VISUALS[key] || null;
```

**2d. Run → expect PASS:**

```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
# expect: ℹ tests 62 / ℹ pass 62 / ℹ fail 0
```

Commit:

```bash
git add src/features/effects/visuals.js src/features/effects/visuals.test.js
git commit -m "feat(effects): daftarkan visual 'hina'"
```

---

### Task 3 — Arahkan pack Kotodama Burst ke visual `hina` (commit D)

Di `src/features/packs/packs.js`, baris 22, ubah:

```js
    visual: 'ink',      // → src/features/effects/visuals.js
```

jadi:

```js
    visual: 'hina',     // → src/features/effects/visuals.js
```

**Verify:**

```bash
grep -n "visual:" src/features/packs/packs.js
# baris 22 -> visual: 'hina',  (pack_02..pack_06 tetap 'dummy')
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"   # 62 / 62 / 0
git add src/features/packs/packs.js
git commit -m "feat(packs): kotodama_burst pakai visual hina (GIF)"
```

---

### Task 4 — Render GIF di `EffectContext.jsx` (commit E)

**4a.** Tambah import di atas `src/features/effects/EffectContext.jsx` (dekat baris 6):

```js
import { pickHinaGif } from './hinaGifs';
```

**4b.** Di `triggerEffect`, di dalam `setFx({ … })` (baris ~174–185), tambahkan field
`gifSrc` **tepat setelah** `kind,`:

```js
    setFx({
      kind,
      // GIF reaksi Hina: hanya untuk benar/salah biasa (streak tetap sigil ensō).
      gifSrc: (kind === 'correct' || kind === 'wrong') ? pickHinaGif(kind) : null,
      id: ++seq,
      seed: Math.floor(Math.random() * 900) + 1,
      angle: -14 - Math.random() * 12,          // sapuan tidak pernah sama
      y: 50 + (Math.random() * 16 - 8),          // posisi vertikal (persen)
      level: info ? info.level : 0,
      milestone: info ? info.milestone : 0,
      streak: type === 'correct' ? streakRef.current : 0,   // angka streak aktual
      signature: info ? info.signature : null,
      onMilestone,
    });
```

**4c.** Di `EffectLayer`, **ubah syarat blok filter SVG** supaya ikut aktif untuk `hina`
(dibutuhkan `StreakSigil`). Cari baris `{visual === 'ink' && (` (pembuka blok `<svg><defs>`,
baris ~225) dan ganti jadi:

```jsx
      {(visual === 'ink' || visual === 'hina') && (
```

**4d.** Tambahkan cabang render GIF **tepat sebelum** blok `{/* Visual dummy … */}` (baris
~309). Sisipkan:

```jsx
      {/* Visual Hina (pack kotodama_burst) — GIF reaksi di kotak persegi */}
      {visual === 'hina' && fx && fx.gifSrc && (
        <motion.div
          key={`hina-${fx.id}`}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="relative bg-kinari-light border-[4px] border-sumi shadow-[10px_10px_0_0_rgba(26,26,26,0.35)] overflow-hidden"
            style={{ width: 'min(40vh, 88vw)', height: 'min(40vh, 88vw)' }}
          >
            <img
              src={fx.gifSrc}
              alt=""
              draggable={false}
              className="w-full h-full select-none"
              style={{ objectFit: 'contain' }}
            />
          </motion.div>
        </motion.div>
      )}
```

**4e.** Pastikan streak tetap tampil di mode hina. Cari blok `<AnimatePresence>` berisi
`{kind === 'correct' && <HankoStamp …/>}` / `{kind === 'wrong' && <BrushSlash …/>}` /
`{kind === 'streak' && (<StreakSigil …/>)}` (baris ~292–305) dan bungkus **hanya** dengan
kondisi visual, jadi:

```jsx
          <AnimatePresence>
            {visual === 'ink' && kind === 'correct' && <HankoStamp key={`h-${fx.id}`} fid={fid} />}
            {visual === 'ink' && kind === 'wrong' && <BrushSlash key={`b-${fx.id}`} fid={fid} angle={fx.angle} y={fx.y} />}
            {kind === 'streak' && (
              <StreakSigil
                key={`s-${fx.id}`}
                fid={fid}
                level={fx.level}
                milestone={fx.milestone}
                signature={fx.signature}
                streak={fx.streak}
              />
            )}
          </AnimatePresence>
```

> Efek samping yang **diinginkan**: di mode `hina`, hanko 正 & sapuan kuas tidak lagi
> dirender (digantikan GIF); sigil streak tetap jalan.

**Verify:**

```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"    # 62 / 62 / 0
npm run lint                                      # exit 0, 0 error
npm run build 2>&1 | grep -E "built in|error"     # ✓ built in …, tanpa "error"
git add src/features/effects/EffectContext.jsx
git commit -m "feat(effects): render GIF Hina untuk jawaban benar/salah"
```

---

### Task 5 — Polish: getar saat salah + hormati reduce-motion (commit F)

**5a.** Bungkus kotak GIF dengan getar halus khusus salah. Ganti `<motion.div>` pembungkus
terluar (dari Task 4d) jadi:

```jsx
        <motion.div
          key={`hina-${fx.id}`}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={
            fx.kind === 'wrong'
              ? { opacity: 1, x: [0, -9, 8, -5, 3, 0] }
              : { opacity: 1, x: 0 }
          }
          exit={{ opacity: 0 }}
          transition={{ duration: fx.kind === 'wrong' ? 0.42 : 0.25, ease: 'easeOut' }}
        >
```

**5b.** Tambah vignette merah lembut khusus salah — sisipkan **sebelum** kotak GIF di dalam
pembungkus:

```jsx
          {fx.kind === 'wrong' && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 50%, transparent 42%, rgba(211,56,47,0.22) 100%)' }}
            />
          )}
```

**Verify:**

```bash
npm run lint                                      # exit 0, 0 error
npm run build 2>&1 | grep -E "built in|error"     # ✓ built in …
git add src/features/effects/EffectContext.jsx
git commit -m "polish(effects): getar + vignette merah saat salah, GIF hina"
```

---

### Task 6 — Validasi penuh + cek manual (tanpa commit)

```bash
cd /c/Users/maddo/Documents/japanese-quiz
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"     # ℹ tests 62 / pass 62 / fail 0
npm run lint                                      # exit 0, 0 error
npm run build 2>&1 | grep -E "built in|error"     # ✓ built in …
ls -1 dist/effects 2>/dev/null | wc -l            # -> 8 (aset ikut ter-build)
```

Manual (browser):

```bash
npm run dev
```

1. Buka `/settings` → panel Developer → **✨ Buka & Pakai Efek** (equip `kotodama_burst`).
2. Main kuis, jawab **benar** → GIF `HinaRight*` muncul di tengah, kotak, muka utuh.
3. Jawab **salah** → GIF `HinaWrong*` + getar + vignette merah.
4. Capai **streak 3** → sigil ensō emas (tanpa GIF).
5. Cek `HinaRight3` / `HinaWrong1` / `HinaWrong3` (yang landscape) → tetap kotak, muka
   keliatan (ada bar kosong di atas/bawah — itu efek `contain` yang disengaja).

---

## Tests / validation

- Unit (Node): `hinaGifs.test.js` (4+4 path, unik, regex, `pickHinaGif` deterministik/null),
  `visuals.test.js` (key `['dummy','hina','ink']`, label). Gate: `npm test` →
  `ℹ tests 62 / ℹ pass 62 / ℹ fail 0`.
- Gate kualitas: `npm run lint` → 0 error; `npm run build` → built tanpa error; `dist/effects`
  berisi 8 file.
- Gate visual (manual, browser): langkah Task 6 — kode `<img>`/animasi tidak bisa di-unit-test.
- TDD per task kode: tulis test → run (fail) → implement → run (pass) → commit.

## Risks, tradeoffs, and open questions

- **`HinaWrong3.gif` tanpa muka.** User bilang acak dari 4, tapi file ini view dari belakang.
  Kalau terasa aneh, hapus 1 baris di `hinaGifs.js` → `wrong` jadi 3 file (test `length 4`
  & regex `new Set size 8` **harus ikut diubah**).
- **Ukuran file.** `HinaWrong.gif` 1.7 MB + lainnya ~2.2 MB → total ~3.9 MB masuk
  `dist/`. Kalau load pertama terasa berat, opsi: kompres GIF (kurangi warna/frame/ukuran),
  atau preload seperti voice. Belum dilakukan (YAGNI).
- **`object-fit: contain` → bar kosong** di GIF landscape (padding sengaja, sesuai pilihan
  user). Kotak + border tebal + shadow dipakai supaya bar-nya terlihat sengaja, bukan rusak.
- **Animated WebP** (`HinaWrong2.webp`) butuh browser modern (Chrome/Firefox/Safari 14+).
  Aman untuk target app ini; kalau perlu kompatibilitas tua → konversi ke GIF.
- **`gifSrc` disimpan di `fx`** (bukan dipanggil saat render) supaya pilihan GIF **stabil**
  dan tidak berubah tiap re-render React. Jangan pindahkan `pickHinaGif()` ke dalam JSX.
- **Streak tidak pakai GIF** (default). Kalau mau milestone juga menampilkan GIF, itu
  perubahan terpisah — tanyakan dulu.
- **`visual: 'ink'` jadi tak terpakai** oleh pack mana pun (pack lain `dummy`). Visual `ink`
  & komponen `HankoStamp`/`BrushSlash` **tetap disimpan** (bukan dihapus) — gampang dipakai
  ulang. Jangan hapus tanpa diminta.
- **Open question:** mau GIF juga untuk **streak**? Mau buang `HinaWrong3`? Mau preload GIF
  saat equip (biar tidak ada kedipan pertama)?
