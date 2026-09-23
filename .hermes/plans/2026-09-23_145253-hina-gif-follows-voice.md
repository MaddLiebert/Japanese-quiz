# Plan — GIF Hina muncul PERSIS saat suara Hina bunyi (pack Kotodama Burst)

> Menggantikan plan `2026-09-23_144747-hina-gif-answer-effects.md` (kondisinya salah:
> di sana GIF muncul tiap benar/salah).

## Goal

Tampilkan GIF reaksi Hina **hanya pada momen yang sama dengan suara Hina** — yaitu saat
**jawaban salah** dan saat **streak tepat di milestone** (3,5,10,…,100) — sedangkan jawaban
benar biasa (Hina diam) **tanpa GIF**.

---

## Current context / assumptions

Repo: `C:\Users\maddo\Documents\japanese-quiz` (Vite + React 19, Tailwind v4, `motion/react`,
test = `node --test`, **59 test hijau**). Shell: **Git Bash** di Windows.

### Kapan suara Hina bunyi (ini yang bikin GIF ikut nyala)

Di `src/features/effects/EffectContext.jsx` → `triggerEffect(type)`:

- `type === 'wrong'` → `playWrongSound()` → `wronganswer.mp3` **+ klip Hina wrong** (Hina bunyi).
- `type === 'correct'` **dan** `onMilestone === true` → `playStreakSound()` → `rightanswer.mp3`
  **+ klip Hina streak** (Hina bunyi).
- `type === 'correct'` biasa (`onMilestone === false`) → `playCorrectSound()` →
  **`rightanswer.mp3` saja, Hina DIAM**.

> ⚠️ **Penting:** jangan pakai `kind === 'streak'` sebagai syarat GIF. `kind` sudah jadi
> `'streak'` begitu streak ≥ 3 (bukan cuma milestone) → GIF akan muncul di streak 4, 6, 7, …
> yang Hina-nya **diam**. Syarat yang benar = `onMilestone` (variabel yang sudah ada di
> `triggerEffect`, baris ~165).

`onMilestone` = `info ? streakRef.current === info.milestone : false`
(`info` dari `resolveStreak`, milestone = 3,5,10,20,…,100).

### Aset GIF (sudah ada di `public/effects/`, untracked)

| File | Ukuran | Bentuk |
|---|---|---|
| `HinaRight.gif` / `HinaRight1.gif` / `HinaRight2.gif` | 220×220 | persegi |
| `HinaRight3.gif` | 220×124 | landscape |
| `HinaWrong.gif` | 498×498 | persegi |
| `HinaWrong1.gif` | 220×185 | agak landscape |
| `HinaWrong2.webp` | 200×200 | persegi (animated WebP) |
| `HinaWrong3.gif` | 220×124 | landscape — ⚠️ **dari belakang, tanpa muka** |

### Titik kode

- `src/features/effects/visuals.js` — `VISUALS = { ink, dummy }`; test-nya **mengunci**
  `Object.keys(VISUALS).sort() === ['dummy','ink']` → harus di-update.
- `src/features/packs/packs.js` baris 22 — `kotodama_burst` = `visual: 'ink'`, `voice: 'hina'`.
- `src/features/effects/EffectContext.jsx` — `triggerEffect` (~144) → `setFx({...})` (~174);
  `EffectLayer({ fx, drops, visual })` (~206) merender cabang `visual === 'ink'` (filter SVG +
  `HankoStamp`/`BrushSlash`/`StreakSigil`) dan `visual === 'dummy'`.
- Pemanggil `triggerEffect`: `Quiz.jsx`, `MondaiQuiz.jsx`, `Practice.jsx` — **tidak diubah**.

Keputusan user (sesi ini):
- GIF **mengikuti suara Hina**: salah → GIF; milestone streak → GIF; benar biasa → **tanpa GIF**.
- **Streak**: GIF `HinaRight` **DAN** sigil ensō emas tetap tampil bareng.
- Benar = acak `HinaRight*`; salah = acak `HinaWrong*`.
- Semua dipajang **kotak seragam** (`object-fit: contain`) tengah layar, besar (~40vh).
- Hanya untuk pack **Kotodama Burst**.

Assumptions:
- GIF benar/salah dipilih **per jawaban** (acak), disimpan di `fx` biar stabil.
- Efek tinta lama (`HankoStamp`/`BrushSlash`) **diganti** GIF untuk pack ini; `StreakSigil`
  tetap dipakai (milestone tetap spesial).
- `HinaWrong3.gif` (tanpa muka) tetap ikut acak — 1 baris di `hinaGifs.js` untuk membuangnya.

---

## Architecture / proposed approach

Satu helper murni `hinaGifForAnswer(type, onMilestone, rng)` di `hinaGifs.js` memetakan
"momen Hina bunyi" → path GIF (salah → `HinaWrong*`, milestone → `HinaRight*`, benar biasa →
`null`). `EffectContext.triggerEffect` menyimpannya ke `fx.gifSrc` **saat trigger** (bukan saat
render), dan `EffectLayer` merendernya dalam satu kotak persegi dengan `object-fit: contain`;
`StreakSigil` tetap jalan.

---

## Step-by-step tasks

> Jalankan semua perintah dari `C:\Users\maddo\Documents\japanese-quiz` (Git Bash).

### Task 0 — Masukkan aset GIF ke git (commit A)

```bash
cd /c/Users/maddo/Documents/japanese-quiz
ls -1 public/effects
git add public/effects
git commit -m "assets(effects): 8 GIF reaksi Hina (benar/salah)"
git ls-files public/effects | wc -l      # -> 8
```

---

### Task 1 — TDD: `hinaGifs.js` dengan aturan "ikut suara Hina" (commit B)

**1a. Tulis test dulu** — buat `src/features/effects/hinaGifs.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { HINA_GIFS, pickHinaGif, hinaGifForAnswer } from './hinaGifs.js';

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
});

test('hinaGifForAnswer: GIF mengikuti kapan Hina BUNYI', () => {
  // salah → Hina wrong bunyi → GIF wrong
  assert.equal(hinaGifForAnswer('wrong', false, () => 0), '/effects/HinaWrong.gif');
  // benar tepat milestone → Hina streak bunyi → GIF correct
  assert.equal(hinaGifForAnswer('correct', true, () => 0), '/effects/HinaRight.gif');
  // benar biasa → Hina DIAM → tanpa GIF
  assert.equal(hinaGifForAnswer('correct', false, () => 0), null);
});
```

**1b. Run → expect FAIL** (file belum ada):

```bash
npm test 2>&1 | grep -E "hinaGifForAnswer|Cannot find|ℹ (tests|pass|fail)"
# expect: gagal impor './hinaGifs.js' → ℹ fail >= 1
```

**1c. Implement** — buat `src/features/effects/hinaGifs.js`:

```js
// Registry GIF reaksi Hina Chono untuk efek jawaban (pack kotodama_burst).
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

// GIF HANYA muncul saat suara Hina bunyi:
//   - salah           → Hina wrong bunyi → GIF wrong
//   - benar MILESTONE → Hina streak bunyi → GIF correct
//   - benar biasa     → Hina DIAM → null (tanpa GIF)
export const hinaGifForAnswer = (type, onMilestone = false, rng = Math.random) => {
  if (type === 'wrong') return pickHinaGif('wrong', rng);
  if (type === 'correct' && onMilestone) return pickHinaGif('correct', rng);
  return null;
};
```

**1d. Run → expect PASS:**

```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
# expect: ℹ tests 63 / ℹ pass 63 / ℹ fail 0
```

Commit:

```bash
git add src/features/effects/hinaGifs.js src/features/effects/hinaGifs.test.js
git commit -m "feat(effects): registry GIF Hina (muncul saat Hina bunyi)"
```

---

### Task 2 — TDD: daftarkan visual `hina` (commit C)

**2a. Ganti seluruh isi** `src/features/effects/visuals.test.js`:

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
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"    # 63 / 63 / 0
git add src/features/effects/visuals.js src/features/effects/visuals.test.js
git commit -m "feat(effects): daftarkan visual 'hina'"
```

---

### Task 3 — Arahkan pack Kotodama Burst ke visual `hina` (commit D)

Di `src/features/packs/packs.js` baris 22:

```js
    visual: 'ink',      // → src/features/effects/visuals.js
```

jadi:

```js
    visual: 'hina',     // → src/features/effects/visuals.js
```

**Verify:**

```bash
grep -n "visual:" src/features/packs/packs.js     # baris 22 -> 'hina'
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"     # 63 / 63 / 0
git add src/features/packs/packs.js
git commit -m "feat(packs): kotodama_burst pakai visual hina (GIF)"
```

---

### Task 4 — Render GIF di `EffectContext.jsx` (commit E)

**4a.** Import di atas `src/features/effects/EffectContext.jsx` (dekat baris 6):

```js
import { hinaGifForAnswer } from './hinaGifs';
```

**4b.** Di `triggerEffect`, **setelah** baris `const onMilestone = info ? streakRef.current === info.milestone : false;`
(baris ~165) tambahkan:

```js
    // GIF Hina: hanya saat suara Hina bunyi (salah / tepat milestone). Benar biasa → null.
    const gifSrc = hinaGifForAnswer(type, onMilestone);
```

**4c.** Lalu di dalam `setFx({ … })`, sisipkan `gifSrc,` tepat setelah `kind,`:

```js
    setFx({
      kind,
      gifSrc,                                    // null = tanpa GIF (Hina diam)
      id: ++seq,
      seed: Math.floor(Math.random() * 900) + 1,
      angle: -14 - Math.random() * 12,
      y: 50 + (Math.random() * 16 - 8),
      level: info ? info.level : 0,
      milestone: info ? info.milestone : 0,
      streak: type === 'correct' ? streakRef.current : 0,
      signature: info ? info.signature : null,
      onMilestone,
    });
```

**4d.** Ubah syarat blok filter SVG di `EffectLayer` supaya `hina` juga punya filter (dipakai
`StreakSigil`). Cari `{visual === 'ink' && (` (baris ~225) → jadi:

```jsx
      {(visual === 'ink' || visual === 'hina') && (
```

**4e.** Bungkus render hanko/kuas dengan cek visual, dan **biarkan `StreakSigil` selalu jalan**
(biar GIF + sigil tampil bareng di milestone). Ganti blok `AnimatePresence` (baris ~292–305):

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

**4f.** Tambahkan cabang render GIF **tepat sebelum** `{/* Visual dummy … */}` (baris ~309):

```jsx
      {/* Visual Hina — GIF muncul PERSIS saat suara Hina bunyi (salah / milestone) */}
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

> **Catatan milestone:** `gifSrc` diisi `HinaRight*` (karena `onMilestone` true) **dan**
> `StreakSigil` tetap dirender → GIF + ensō emas tampil bareng, sesuai permintaan.

**Verify:**

```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"    # 63 / 63 / 0
npm run lint                                      # exit 0, 0 error
npm run build 2>&1 | grep -E "built in|error"     # ✓ built in …, tanpa "error"
git add src/features/effects/EffectContext.jsx
git commit -m "feat(effects): render GIF Hina saat Hina bunyi (salah & milestone)"
```

---

### Task 5 — Polish: getar saat salah (commit F)

Di `EffectContext.jsx`, pada pembungkus terluar GIF (dari Task 4f), ganti `animate`/`transition`
supaya getar hanya saat salah:

```jsx
        <motion.div
          key={`hina-${fx.id}`}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={fx.kind === 'wrong' ? { opacity: 1, x: [0, -9, 8, -5, 3, 0] } : { opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: fx.kind === 'wrong' ? 0.42 : 0.25, ease: 'easeOut' }}
        >
```

**Verify:**

```bash
npm run lint                                      # exit 0, 0 error
npm run build 2>&1 | grep -E "built in|error"     # ✓ built in …
git add src/features/effects/EffectContext.jsx
git commit -m "polish(effects): getar halus saat salah (GIF Hina)"
```

---

### Task 6 — Validasi penuh + cek manual (tanpa commit)

```bash
cd /c/Users/maddo/Documents/japanese-quiz
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"     # ℹ tests 63 / pass 63 / fail 0
npm run lint                                      # exit 0, 0 error
npm run build 2>&1 | grep -E "built in|error"     # ✓ built in …
ls -1 dist/effects 2>/dev/null | wc -l            # -> 8
```

Manual:

```bash
npm run dev
```

1. `/settings` → Developer → **✨ Buka & Pakai Efek** (equip `kotodama_burst`).
2. Jawab **benar biasa** → **TIDAK ada GIF** (Hina diam) — hanya suara `rightanswer`.
3. Jawab **salah** → GIF `HinaWrong*` + suara Hina wrong + getar.
4. Capai **streak 3** (milestone) → GIF `HinaRight*` **dan** sigil ensō emas tampil bareng.
5. Streak 4 (bukan milestone) → **tanpa GIF** (Hina diam) — ini bukti aturan benar.

---

## Tests / validation

- Unit (Node): `hinaGifs.test.js` — termasuk **`hinaGifForAnswer('correct', false) === null`**
  (aturan inti: benar biasa tanpa GIF). `visuals.test.js` — key `['dummy','hina','ink']`.
  Gate: `npm test` → `ℹ tests 63 / ℹ pass 63 / ℹ fail 0`.
- Gate kualitas: `npm run lint` 0 error; `npm run build` sukses; `dist/effects` = 8 file.
- Gate visual (manual, Task 6): titik paling krusial = **streak 4 tanpa GIF** & **benar biasa
  tanpa GIF** (buktikan syarat `onMilestone`, bukan `kind`).
- TDD per task kode: tulis test → run (fail) → implement → run (pass) → commit.

## Risks, tradeoffs, and open questions

- **Salah pakai `kind` = bug halus.** Kalau implementer memakai `kind === 'streak'` (bukan
  `onMilestone`), GIF muncul di streak 4/6/7/… padahal Hina diam. Test
  `hinaGifForAnswer('correct', false) === null` mengunci ini.
- **`HinaWrong3.gif` tanpa muka.** Ikut acak (4 file). Kalau aneh → hapus 1 baris di
  `hinaGifs.js`; test `length 4` + `new Set size 8` **harus ikut diubah**.
- **GIF landscape → bar kosong** di kotak persegi (`contain`, sengaja). Kotak + border tebal +
  hard-shadow dipakai supaya terlihat disengaja.
- **Ukuran aset** ~3.9 MB masuk `dist/`. Bisa dikompres nanti kalau load terasa berat (YAGNI).
- **Animated WebP** butuh browser modern (aman untuk target app ini).
- **`gifSrc` disimpan di `fx`** supaya pilihan GIF stabil (tidak re-pick tiap render). Jangan
  pindahkan `hinaGifForAnswer()` ke dalam JSX.
- **`visual: 'ink'` jadi tak terpakai** pack mana pun; `HankoStamp`/`BrushSlash` tetap disimpan
  (jangan dihapus tanpa diminta) — gampang dipakai ulang.
- **Open question:** preload GIF saat equip (biar tak ada kedipan pertama)? Buang `HinaWrong3`?
