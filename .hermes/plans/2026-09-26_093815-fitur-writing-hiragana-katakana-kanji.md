# Fitur Writing (書) — Latihan Menulis Hiragana, Katakana & Kanji (stroke-order + kuis tulis)

> **Konteks bahasa user:** "kita keep dulu voice pack2 an nya, gw mau buat fitur writing
> yang mencakup hirakana kanji" — artinya: **jangan sentuh** voice pack / gacha / efek
> (Hina, Gojo, Sumi Taiko, dsb). Fokus 100% ke fitur baru **Writing** yang mencakup
> **Hiragana + Katakana + Kanji** (Kanji ikut karena user menulis "hirakana kanji";
> katakana ikut karena app sudah punya data katakana dan biayanya nol).
>
> **"Keep dulu" = jangan hapus/jangan refactor, bukan jangan commit.** Semua kerjaan
> lain tetap utuh; plan ini cuma MENAMBAH modul baru + 2 titik wiring.

---

## Goal

Tambah halaman **`/writing`** tempat user bisa (1) melihat **animasi urutan goresan**
kanji/kana dengan tombol putar ulang, dan (2) mengerjakan **kuis tulis**: canvas kosong,
user menggambar goresan, app menilai tiap goresan (benar/salah) dan menyelesaikan
karakter setelah semua goresan benar — lengkap dengan XP/medaru yang sama seperti kuis lain.

## Current context / assumptions

### Ground truth repo (sudah dicek langsung, jangan diasumsikan lain)

- Working dir: `C:\Users\maddo\Documents\japanese-quiz`, branch **`main`**, node **v24.18.1**.
- Baseline test: **`npm test` → 111 pass / 0 fail** (`node --test`, auto-discover `*.test.js`).
- `npm run lint` (oxlint) → exit 0, cuma warning lama. **Jangan perbaiki warning lama.**
- **JANGAN PUSH** (standing instruction user; origin cuma punya `main`). Commit lokal saja.
- Dev server: `npm run dev` → http://localhost:5173
- Stack: React 19 + Vite 8 + Tailwind v4 (`@theme` di `src/index.css`) + `motion/react` (framer
  motion v13) + react-router-dom 7. **Tidak ada vitest/jest** — semua test pakai `node --test`
  dan **hanya mengimpor file `.js` murni (bukan `.jsx`)**. Ini alasan logika inti plan ini
  ditaruh di file `.js` murni.

### Data yang sudah ada (jangan bikin baru)

| File | Isi | Bentuk field |
|---|---|---|
| `src/data/hiragana.json` | 104 item | `{id, char, romaji, script:'hiragana', type, row}` |
| `src/data/katakana.json` | 46 item | sama, `script:'katakana'` |
| `src/data/kanji.json` | 86 item | `{id, char, onyomi, kunyomi, meaning, meaning_id, type:'kanji', category}` |

- Hiragana: 71 item ber-`char` **1 code point** (grup: 16 row), 33 item yoon 2 code point
  (きゃ dst — **tidak bisa ditulis 1 kotak**, nanti ditandai "read only").
- Katakana: **46/46 bisa ditulis** (11 row, tanpa dakuon/yoon di dataset).
- Kanji: **86/86 bisa ditulis** (7 kategori: NumbersKanji, TimeDays, NatureDirections,
  PeopleBody, TraitsSizes, VerbsKanji, SchoolPlaces).
- **Total karakter unik yang perlu data goresan: 206** (71 hiragana single + 46 katakana +
  86 kanji + 3 code point yoon yang belum termasuk, sudah dihitung: 206, **0 missing**).
  Ukuran total file data goresan: **±289 KB** (hasil hitung dari registry jsDelivr).
- Tidak ada karakter NFD di dataset (semua sudah NFC) — aman untuk keying per code point.

### Pilihan library (sudah diverifikasi live via fetch, bukan asumsi)

- **`hanzi-writer@3.7.3`** (MIT, tanpa dependency, ESM + CJS, 78.8 KB `index.esm.js`).
  API yang dipakai (semua terverifikasi ada di bundle 3.7.3):
  - `HanziWriter.create(elementOrId, char, options)` — static factory.
  - `writer.animateCharacter()` — animasi semua goresan sekali.
  - `writer.quiz(opts)` → `Promise`; `writer.cancelQuiz()`; `writer.skipQuizStroke()`.
  - `quiz()` options: `leniency`, `showHintAfterMisses` (default 3, bisa `false`),
    `markStrokeCorrectAfterMisses`, `acceptBackwardsStrokes`, `quizStartStrokeNum`,
    `onMistake(strokeData)`, `onCorrectStroke(strokeData)`, `onComplete({character,totalMistakes})`.
  - Options visual: `width`, `height`, `padding`, `showOutline`, `showCharacter`,
    `strokeColor`, `outlineColor`, `drawingColor`, `highlightColor`, `drawingWidth`,
    `strokeWidth`, `strokeAnimationSpeed`, `delayBetweenStrokes`.
  - `charDataLoader(char, onLoad, onError)` — bisa return `Promise`; dipakai untuk load
    data dari bundle lokal (offline-first, tidak fetch CDN).
  - Catatan: `onReady` **tidak ada**; gunakan `setCharacter()` yang mengembalikan Promise.
  - Catatan: `destroy()` hanya untuk internal renderer — cleanup cukup dengan
    `cancelQuiz()` + unmount React (SVG dihapus bersama DOM).
- **Data goresan `kanji-writer-data-jp@0.0.1`** — berisi **3164 file JSON** (`あ.json` …
  `一.json` …), tiap file `{strokes: string[], medians: number[][][]}`. Sudah dicek:
  - あ = 3 strokes, を = 3, ん = 1, 一 = 1, 四 = 5, 駅 = 14.
  - Semua **206 karakter** yang kita butuhkan ADA (0 missing).
  - **Lisensi**: data kanji = Arphic Public License (ARPHICPL.TXT) + animCJK LGPL;
    data kana = animCJK (LGPL) via `ailectra/kana-json`. File lisensi ikut di package
    (`licenses/ARPHICPL.TXT`, `licenses/LGPL.txt`).
  - Ukuran unpacked package = 9.2 MB (3164 file) — **kita hanya vendor 206 file = ±289 KB**,
    sisanya TIDAK ikut (script copy yang memilih), jadi bundle tetap ramping.
- **Alternatif yang DITOLAK**: KanjiVG (CC BY-SA 3.0 — share-alike bisa nular ke artwork
  app; butuh parser SVG sendiri) dan fetch CDN runtime (melanggar offline-first PRD §18).

### Titik integrasi yang sudah ada (yang dipakai plan ini)

- Router: `src/App.jsx` baris 124–134 (`<Routes>`).
- Navigasi bawah Home: `src/pages/Home.jsx` — grid "Actions" 3 kartu (Practice/Mondai/Review)
  ada di `flex-1 grid grid-rows-2` (baris 290–336). Kartu ke-4 ditambahkan di sini.
- Progress API: `src/features/progress/ProgressContext.jsx`:
  - `useItemProgress().recordAnswer(itemId, isCorrect, xpReward)` → update SRS + XP
    (di dalamnya `addXp` yang otomatis handle streak & level).
  - `useUserStats().progress` → `{xp, level, streak, medaru, ...}`.
  - `useItemProgress().forceMasterItem(itemId)` → tandai mastered (sudah dipakai Flashcard).
- Toast/efek jawaban global: `useEffectLayer().triggerEffect('correct' | 'wrong')`
  (`src/features/effects/EffectContext.jsx`) — **boleh dipanggil** supaya SFX/efek pack
  yang aktif tetap berbunyi; **tidak ada perubahan** di file efek.
- SFX jawaban dasar: `playCorrectSound()` / `playWrongSound()` dari `src/utils/sfx.js`.
- Pola UI: kartu `border-[3px] border-sumi shadow-[6px_6px_0_0_rgba(var(--sumi-val),1)]`,
  label `text-[10px] uppercase tracking-[0.3em] font-bold`, header `font-serif font-black text-sumi`,
  aksen `text-shu` / `text-ai`, tombol `Button` dari `src/components/ui/Button.jsx`.

### Asumsi

- Fitur ini **offline-first**: semua data goresan di-vendor ke `public/strokes/` (bukan npm
  dependency runtime), jadi tidak ada network call saat latihan. Data di-*copy* dari npm
  package **sekali** lewat script; package-nya masuk `devDependencies`.
- Kuis tulis **hanya untuk karakter 1 code point**. Item yoon (きゃ dll) tetap muncul di
  grid tapi tombol "Tulis" disabled + label "2 karakter — latihan baca dulu".
- Penilaian goresan = **Hanzi Writer `quiz()`** (bukan bikin algoritma sendiri — YAGNI).
  Kita hanya mengatur angka `leniency`/hint supaya ramah pemula dan menyambungkan callback
  ke progress/SFX.
- XP tulis = **10 XP per goresan benar** (kana) dan **15 XP per goresan benar** (kanji),
  di-cap per karakter supaya tidak eksploitatif (lihat Task 5: `WRITE_XP`).
- Tidak ada perubahan skema localStorage baru — pakai `item_progress_v2` yang sudah ada
  dengan `itemId` yang sudah ada (`hira_a`, `kata_a`, `kj_ichi`, …). Konsekuensi: menulis
  karakter juga memperbaiki status SRS item itu (bagus, konsisten dengan Review).

---

## Architecture / proposed approach

Tiga lapis, dipisah supaya bisa dites `node --test`:

1. **Data layer (statis, di-vendor)**: script `scripts/vendor-stroke-data.mjs` menyalin
   206 JSON dari package `kanji-writer-data-jp` ke `public/strokes/<hex>.json`
   (nama file = code point hex, mis. `03042.json` untuk あ, `04e00.json` untuk 一).
   Web app memuatnya lewat `fetch('/strokes/03042.json')` di `charDataLoader`
   (relative-safe untuk Vercel: `vercel.json` sudah rewrite semua ke `/index.html`,
   tapi `public/` file tetap di-serve apa adanya; **jangan** pakai `import` JSON dinamis).
2. **Logic layer (murni, `.js`, dites node)**: `src/features/writing/writing.js` berisi
   fungsi murni: daftar grup latihan dari data yang ada, konversi char → path data,
   keputusan "writable?", dan pengali XP. Ini yang dites TDD (tanpa DOM).
3. **UI layer (React)**: `src/features/writing/StrokeCanvas.jsx` membungkus Hanzi Writer
   (satu instance per karakter, mode `animate` atau `quiz`), `src/pages/Writing.jsx`
   halaman dengan grid grup → detail karakter → tab Animasi/Kuis, dan route `/writing`
   di `src/App.jsx` + kartu ke-4 di Home.

Alur kuis tulis (per karakter):
`quiz()` → user gambar → `onCorrectStroke` (+XP, SFX tick) → `onMistake` (SFX salah,
hint muncul setelah 3x) → semua goresan benar → `onComplete` → `recordAnswer(id, true)`
+ `triggerEffect('correct')` → tombol "Karakter berikutnya".

## Step-by-step tasks

Semua perintah dari **root repo**. TDD: RED (test gagal) → GREEN (implement) → commit.
**Satu commit per task. JANGAN PUSH.**

### Task 0 — Baseline (jangan lanjut kalau merah)

```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Harapan:
```
ℹ tests 111
ℹ pass 111
ℹ fail 0
```

`git status --short` boleh berisi file plan di `.hermes/plans/` (biarkan, jangan commit
plan kecuali diminta).

---

### Task 1 — Vendor data goresan (script + 206 file di `public/strokes/`)

**1a.** Install package data sebagai devDependency (data-nya di-copy, bukan di-import runtime):

```bash
npm install --save-dev kanji-writer-data-jp@0.0.1
```

Harapan: `package.json` bertambah `"kanji-writer-data-jp": "^0.0.1"` di `devDependencies`,
dan `node_modules/kanji-writer-data-jp/あ.json` ada.

**1b.** Buat file **`scripts/vendor-stroke-data.mjs`** (isi lengkap, copy-paste):

```js
// Vendor data goresan untuk fitur Writing.
// Sumber: package npm `kanji-writer-data-jp` (Arphic Public License + LGPL animCJK).
// Output: public/strokes/<codepoint-hex>.json  (5 digit hex, mis. 03042 = あ)
// Jalankan ulang kapan pun dataset berubah:  node scripts/vendor-stroke-data.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'node_modules', 'kanji-writer-data-jp');
const OUT_DIR = join(ROOT, 'public', 'strokes');

const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const hiragana = readJSON('src/data/hiragana.json');
const katakana = readJSON('src/data/katakana.json');
const kanji = readJSON('src/data/kanji.json');

// Semua code point yang perlu data goresan (kana single, semua katakana, semua kanji,
// plus code point dasar dari item yoon seperti き や ゃ).
const needed = new Set();
for (const item of [...hiragana, ...katakana]) {
  for (const ch of item.char.normalize('NFC')) needed.add(ch);
}
for (const item of kanji) needed.add(item.char.normalize('NFC'));

const hexOf = (ch) => ch.codePointAt(0).toString(16).padStart(5, '0');

mkdirSync(OUT_DIR, { recursive: true });
const missing = [];
let copied = 0;
for (const ch of needed) {
  const src = join(SRC_DIR, `${ch}.json`);
  const out = join(OUT_DIR, `${hexOf(ch)}.json`);
  if (!existsSync(src)) { missing.push(ch); continue; }
  copyFileSync(src, out);
  copied += 1;
}

// File lisensi wajib ikut (Arphic + LGPL) — syarat redistribusi.
for (const name of ['ARPHICPL.TXT', 'LGPL.txt']) {
  const src = join(SRC_DIR, 'licenses', name);
  if (existsSync(src)) copyFileSync(src, join(OUT_DIR, name));
}

console.log(`[vendor-stroke-data] copied ${copied} files → public/strokes/`);
console.log(`[vendor-stroke-data] needed ${needed.size}, missing ${missing.length}${missing.length ? ': ' + missing.join('') : ''}`);
if (missing.length > 0) process.exit(1);
```

**1c.** Jalankan:

```bash
node scripts/vendor-stroke-data.mjs
```

Harapan (persis):
```
[vendor-stroke-data] copied 206 files → public/strokes/
[vendor-stroke-data] needed 206, missing 0
```

**1d.** Verifikasi isi file:

```bash
ls public/strokes | wc -l
node -e "const j=require('./public/strokes/03042.json');console.log('あ strokes:',j.strokes.length,'medians:',j.medians.length)"
```

Harapan:
```
208
あ strokes: 3 medians: 3
```
(208 = 206 karakter + ARPHICPL.TXT + LGPL.txt)

**1e.** Commit:

```bash
git add scripts/vendor-stroke-data.mjs public/strokes package.json package-lock.json
git commit -m "feat(writing): vendor 206 stroke-data files (kana+kanji) ke public/strokes + script"
```

---

### Task 2 — TDD: modul logika murni `src/features/writing/writing.js`

**2a. RED — buat `src/features/writing/writing.test.js`** (isi lengkap):

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  strokeHex, strokeDataPath, isWritable, writingGroups,
  WRITE_XP_PER_STROKE, writeXpFor,
} from './writing.js';

test('strokeHex: 5 digit hex dari code point', () => {
  assert.equal(strokeHex('あ'), '03042');
  assert.equal(strokeHex('一'), '04e00');
  assert.equal(strokeHex('ん'), '03093');
  assert.equal(strokeHex('駅'), '099c5');
});

test('strokeHex: karakter >1 code point / kosong → null', () => {
  assert.equal(strokeHex('きゃ'), null);
  assert.equal(strokeHex(''), null);
  assert.equal(strokeHex(null), null);
});

test('strokeDataPath: path public absolut', () => {
  assert.equal(strokeDataPath('あ'), '/strokes/03042.json');
  assert.equal(strokeDataPath('一'), '/strokes/04e00.json');
  assert.equal(strokeDataPath('きゃ'), null);
});

test('isWritable: hanya karakter 1 code point', () => {
  assert.equal(isWritable({ char: 'あ' }), true);
  assert.equal(isWritable({ char: 'ア' }), true);
  assert.equal(isWritable({ char: '一' }), true);
  assert.equal(isWritable({ char: 'きゃ' }), false);
  assert.equal(isWritable(null), false);
});

test('writeXpFor: kana 10 XP, kanji 15 XP, per karakter (bukan per goresan)', () => {
  assert.equal(WRITE_XP_PER_STROKE.kana, 10);
  assert.equal(WRITE_XP_PER_STROKE.kanji, 15);
  assert.equal(writeXpFor({ type: 'seion' }), 10);
  assert.equal(writeXpFor({ type: 'dakuon' }), 10);
  assert.equal(writeXpFor({ type: 'kanji' }), 15);
  assert.equal(writeXpFor(null), 10);
});

test('writingGroups: memisah script & hanya 1 code point, urut row/category', () => {
  const groups = writingGroups();
  const keys = groups.map((g) => g.key);
  // Hiragana 16 row + Katakana 11 row + Kanji 7 kategori = 34 grup
  assert.equal(groups.length, 34);
  assert.ok(keys.includes('hiragana:a'));
  assert.ok(keys.includes('katakana:a'));
  assert.ok(keys.includes('kanji:NumbersKanji'));

  const hiraA = groups.find((g) => g.key === 'hiragana:a');
  assert.deepEqual(hiraA.items.map((i) => i.char), ['あ', 'い', 'う', 'え', 'お']);

  const kanjiNums = groups.find((g) => g.key === 'kanji:NumbersKanji');
  assert.ok(kanjiNums.items.length > 0);
  for (const it of kanjiNums.items) assert.equal(it.type, 'kanji');

  // Tidak ada item yoon yang ikut (2 code point)
  for (const g of groups) for (const it of g.items) assert.equal([...it.char].length, 1);
});

test('writingGroups: setiap item punya strokePath valid', () => {
  for (const g of writingGroups()) {
    for (const it of g.items) {
      assert.match(it.strokePath, /^\/strokes\/[0-9a-f]{5}\.json$/);
    }
  }
});

test('writingGroups: total item = 71 hiragana + 46 katakana + 86 kanji = 203', () => {
  const total = writingGroups().reduce((n, g) => n + g.items.length, 0);
  assert.equal(total, 203);
});
```

**2b.** Jalankan (harus GAGAL karena modul belum ada):

```bash
node --test src/features/writing/writing.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Harapan: `ℹ fail 1` (ERR_MODULE_NOT_FOUND).

**2c. GREEN — buat `src/features/writing/writing.js`** (isi lengkap):

```js
// Logika murni fitur Writing — tanpa DOM, tanpa React. Dites dengan `node --test`.
// Data goresan: public/strokes/<hex>.json hasil scripts/vendor-stroke-data.mjs
import hiraganaData from '../../data/hiragana.json';
import katakanaData from '../../data/katakana.json';
import kanjiData from '../../data/kanji.json';

// XP per karakter yang diselesaikan (bukan per goresan — biar tidak eksploitatif).
export const WRITE_XP_PER_STROKE = { kana: 10, kanji: 15 };

// 'あ' → '03042' (5 digit hex). Hanya untuk 1 code point; lainnya null.
export const strokeHex = (char) => {
  if (!char || typeof char !== 'string') return null;
  const points = [...char.normalize('NFC')];
  if (points.length !== 1) return null;
  return points[0].codePointAt(0).toString(16).padStart(5, '0');
};

// 'あ' → '/strokes/03042.json' | null
export const strokeDataPath = (char) => {
  const hex = strokeHex(char);
  return hex ? `/strokes/${hex}.json` : null;
};

// Karakter bisa dilatih tulis kalau 1 code point.
export const isWritable = (item) => Boolean(item && strokeHex(item.char));

// XP untuk menyelesaikan 1 karakter.
export const writeXpFor = (item) =>
  item?.type === 'kanji' ? WRITE_XP_PER_STROKE.kanji : WRITE_XP_PER_STROKE.kana;

// Susun grup latihan dari dataset yang ada.
// Hiragana/Katakana dikelompokkan per `row`; Kanji per `category`.
// Item yoon (2 code point) DIBUANG karena tidak bisa ditulis dalam 1 kotak.
export const writingGroups = () => {
  const groups = [];
  const push = (script, key, items) => {
    const writable = items.filter(isWritable).map((it) => ({
      ...it,
      script,
      strokePath: strokeDataPath(it.char),
    }));
    if (writable.length > 0) groups.push({ key: `${script}:${key}`, script, row: key, items: writable });
  };

  const byRow = (data, script) => {
    const rows = [...new Set(data.map((d) => d.row))];
    for (const row of rows) push(script, row, data.filter((d) => d.row === row));
  };

  byRow(hiraganaData, 'hiragana');
  byRow(katakanaData, 'katakana');

  const cats = [...new Set(kanjiData.map((d) => d.category))];
  for (const cat of cats) push('kanji', cat, kanjiData.filter((d) => d.category === cat));

  return groups;
};
```

**2d.** Jalankan lagi:

```bash
node --test src/features/writing/writing.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Harapan:
```
ℹ tests 8
ℹ pass 8
ℹ fail 0
```

**2e.** Cek tidak merusak suite lama:

```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Harapan: `ℹ pass 119`, `ℹ fail 0` (111 + 8).

**2f.** Commit:

```bash
git add src/features/writing/writing.js src/features/writing/writing.test.js
git commit -m "feat(writing): modul murni writing.js (hex path, writable, groups, XP) + 8 test"
```

---

### Task 3 — TDD: params penilaian kuis tulis `src/features/writing/writeQuiz.js`

Tujuan: semua angka yang memengaruhi UX penilaian (leniency, hint, ukuran canvas,
warna) ada di **satu tempat** dan dites — supaya tidak perlu nebak-nebak saat tune nanti.

**3a. RED — buat `src/features/writing/writeQuiz.test.js`** (isi lengkap):

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { WRITE_COLORS, writeCanvasSize, writeQuizOptions } from './writeQuiz.js';

test('WRITE_COLORS: semua field warna hex valid', () => {
  for (const [k, v] of Object.entries(WRITE_COLORS)) {
    assert.match(v, /^#[0-9a-fA-F]{6}$/, `warna ${k} tidak valid: ${v}`);
  }
});

test('writeCanvasSize: dibatasi rentang wajar (>=220 dan <=360)', () => {
  for (const w of [320, 375, 768, 1440, 4000]) {
    const size = writeCanvasSize(w);
    assert.ok(size >= 220 && size <= 360, `size ${size} untuk width ${w}`);
  }
});

test('writeCanvasSize: layar kecil mengecil, layar besar dibatasi 360', () => {
  assert.ok(writeCanvasSize(320) <= writeCanvasSize(768));
  assert.equal(writeCanvasSize(4000), 360);
});

test('writeQuizOptions: ramah pemula (hint muncul, leniency santai)', () => {
  const o = writeQuizOptions('light');
  assert.equal(o.showHintAfterMisses, 3);
  assert.ok(o.leniency >= 1 && o.leniency <= 2);
  assert.equal(o.highlightOnComplete, true);
  assert.equal(o.acceptBackwardsStrokes, true);   // arah terbalik dimaafkan (mode latihan)
  assert.equal(o.markStrokeCorrectAfterMisses, false);
  assert.equal(o.quizStartStrokeNum, 0);
  assert.equal(typeof o.onCorrectStroke, 'function');
  assert.equal(typeof o.onMistake, 'function');
  assert.equal(typeof o.onComplete, 'function');
});

test('writeQuizOptions: mode strict mematikan hint & arah terbalik', () => {
  const o = writeQuizOptions('strict');
  assert.equal(o.showHintAfterMisses, false);
  assert.equal(o.acceptBackwardsStrokes, false);
  assert.ok(o.leniency < writeQuizOptions('light').leniency);
});

test('writeQuizOptions: mode tak dikenal → fallback light', () => {
  assert.deepEqual(
    { ...writeQuizOptions('zzz'), onCorrectStroke: 1, onMistake: 1, onComplete: 1 },
    { ...writeQuizOptions('light'), onCorrectStroke: 1, onMistake: 1, onComplete: 1 },
  );
});
```

**3b.** Jalankan (GAGAL):

```bash
node --test src/features/writing/writeQuiz.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Harapan: `ℹ fail 1`.

**3c. GREEN — buat `src/features/writing/writeQuiz.js`** (isi lengkap):

```js
// Params kuis tulis — murni & dites (node --test). Semua angka tune ada di sini.
// Dipakai StrokeCanvas.jsx saat memanggil writer.quiz(writeQuizOptions(mode, handlers)).

export const WRITE_COLORS = {
  strokeColor: '#1a1a1a',   // goresan contoh (sumi)
  outlineColor: '#c9c4b6',  // garis bayangan (kertas)
  highlightColor: '#182b49',// kilau saat goresan benar (ai)
  drawingColor: '#d3382f',  // coretan user (shu)
};

const LIGHT = {
  leniency: 1.4,
  showHintAfterMisses: 3,
  highlightOnComplete: true,
  acceptBackwardsStrokes: true,
  markStrokeCorrectAfterMisses: false,
  quizStartStrokeNum: 0,
};

const STRICT = {
  leniency: 0.9,
  showHintAfterMisses: false,
  highlightOnComplete: true,
  acceptBackwardsStrokes: false,
  markStrokeCorrectAfterMisses: false,
  quizStartStrokeNum: 0,
};

// Ukuran canvas: clamp 220..360 px berdasar lebar layar.
export const writeCanvasSize = (viewportWidth = 360) => {
  const raw = Math.round(Number(viewportWidth) * 0.72);
  if (!Number.isFinite(raw)) return 260;
  return Math.max(220, Math.min(360, raw));
};

// Opsi lengkap untuk writer.quiz(). Handlers wajib dikirim supaya bisa
// disambungkan ke progress/SFX oleh komponen.
export const writeQuizOptions = (mode = 'light', handlers = {}) => {
  const base = mode === 'strict' ? STRICT : LIGHT;
  return {
    ...base,
    onCorrectStroke: handlers.onCorrectStroke || (() => {}),
    onMistake: handlers.onMistake || (() => {}),
    onComplete: handlers.onComplete || (() => {}),
  };
};
```

**3d.** Jalankan:

```bash
node --test src/features/writing/writeQuiz.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Harapan: `ℹ pass 6`, `ℹ fail 0`.

**3e.** Cek suite penuh → `npm test` harapan `ℹ pass 125`, `ℹ fail 0`.

**3f.** Commit:

```bash
git add src/features/writing/writeQuiz.js src/features/writing/writeQuiz.test.js
git commit -m "feat(writing): params kuis tulis (warna, ukuran canvas, opsi quiz) + 6 test"
```

---

### Task 4 — Install `hanzi-writer` + komponen `StrokeCanvas.jsx`

**4a.** Install dependency runtime:

```bash
npm install hanzi-writer@3.7.3
```

Harapan: `package.json` → `"hanzi-writer": "^3.7.3"` di `dependencies`.

**4b.** Buat **`src/features/writing/StrokeCanvas.jsx`** (isi lengkap):

```jsx
import { useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import { WRITE_COLORS, writeCanvasSize, writeQuizOptions } from './writeQuiz.js';
import { strokeDataPath } from './writing.js';

// Loader data goresan dari public/strokes (offline-first, tanpa CDN).
export const localCharDataLoader = (char, onLoad, onError) => {
  const path = strokeDataPath(char);
  if (!path) { onError(new Error(`no stroke data for ${char}`)); return; }
  fetch(path)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
    .then(onLoad)
    .catch(onError);
};

/**
 * mode: 'animate' → putar animasi urutan goresan (sekali)
 *       'quiz'    → user menulis; tiap goresan dinilai
 * handlers (mode quiz): { onCorrectStroke, onMistake, onComplete, onStrokeCount }
 */
export function StrokeCanvas({
  char,
  size,
  mode = 'animate',
  quizMode = 'light',
  handlers = {},
  onStrokeCount,
  playKey = 0,          // naikkan angka ini untuk memutar ulang animasi
  showOutline = true,
}) {
  const mountRef = useRef(null);
  const writerRef = useRef(null);

  // (Re)buat writer setiap ganti karakter / mode / playKey.
  useEffect(() => {
    const el = mountRef.current;
    if (!el || !char) return;

    // Bersihkan SVG sebelumnya (StrictMode dev double-mount aman).
    el.innerHTML = '';
    const px = size || writeCanvasSize(typeof window !== 'undefined' ? window.innerWidth : 360);

    const writer = HanziWriter.create(el, char, {
      width: px,
      height: px,
      padding: Math.round(px * 0.08),
      showOutline,
      // showCharacter=false di DUA mode: mode animate menggambar goresan satu-satu,
      // mode quiz cuma menampilkan bayangan (outline) supaya user menulis sendiri.
      showCharacter: false,
      strokeColor: WRITE_COLORS.strokeColor,
      outlineColor: WRITE_COLORS.outlineColor,
      highlightColor: WRITE_COLORS.highlightColor,
      drawingColor: WRITE_COLORS.drawingColor,
      drawingWidth: Math.max(3, Math.round(px * 0.03)),
      strokeWidth: Math.max(2, Math.round(px * 0.018)),
      outlineWidth: Math.max(1, Math.round(px * 0.01)),
      strokeAnimationSpeed: 0.9,
      delayBetweenStrokes: 260,
      charDataLoader: localCharDataLoader,
      onLoadCharDataSuccess: (data) => {
        onStrokeCount?.(data?.strokes?.length ?? 0);
      },
      onLoadCharDataError: () => {
        onStrokeCount?.(0);
      },
    });
    writerRef.current = writer;

    if (mode === 'animate') {
      writer.animateCharacter();
    } else {
      writer.quiz(writeQuizOptions(quizMode, handlers));
    }

    return () => {
      try { writer.cancelQuiz(); } catch { /* noop */ }
      writerRef.current = null;
      el.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char, mode, quizMode, playKey, size, showOutline]);

  return (
    <div className="relative inline-block">
      <div
        ref={mountRef}
        className="bg-kinari-light border-[3px] border-sumi shadow-[6px_6px_0_0_rgba(var(--sumi-val),1)]"
        style={{ lineHeight: 0 }}
      />
      {/* Garis bantu tengah (社中線) — dekoratif, tidak menghalangi pointer */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-full w-px bg-shu/15" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-shu/15" />
      </div>
    </div>
  );
}

export default StrokeCanvas;
```

**4c.** Verifikasi build tidak pecah (komponen belum dirutekan, jadi ini cuma cek import):

```bash
node -e "import('hanzi-writer').then(m=>console.log('hanzi-writer default:', typeof m.default))"
```

Harapan: `hanzi-writer default: function`

**4d.** Commit:

```bash
git add package.json package-lock.json src/features/writing/StrokeCanvas.jsx
git commit -m "feat(writing): StrokeCanvas (hanzi-writer animate+quiz, loader lokal) + dep hanzi-writer 3.7.3"
```

---

### Task 5 — Halaman `/writing` (`src/pages/Writing.jsx`)

**5a.** Buat **`src/pages/Writing.jsx`** (isi lengkap):

```jsx
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import { StrokeCanvas } from '../features/writing/StrokeCanvas';
import { writingGroups, isWritable, writeXpFor } from '../features/writing/writing';
import { useItemProgress, useUserStats } from '../features/progress/ProgressContext';
import { useEffectLayer } from '../features/effects/EffectContext';
import { playDramaticAudio } from '../utils/audio';
import { categoryTranslations } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';

const SCRIPT_LABEL = { hiragana: 'Hiragana ひらがな', katakana: 'Katakana カタカナ', kanji: 'Kanji 漢字' };

export function Writing() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { recordAnswer, forceMasterItem, itemProgress } = useItemProgress();
  const { progress } = useUserStats();
  const { triggerEffect } = useEffectLayer();

  const groups = useMemo(() => writingGroups(), []);
  const [activeScript, setActiveScript] = useState('hiragana');
  const [activeGroupKey, setActiveGroupKey] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState('animate');       // 'animate' | 'quiz'
  const [playKey, setPlayKey] = useState(0);
  const [strokeTotal, setStrokeTotal] = useState(0);
  const [correctStrokes, setCorrectStrokes] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);

  const scriptGroups = groups.filter((g) => g.script === activeScript);
  const group = groups.find((g) => g.key === activeGroupKey) || null;
  const item = group ? group.items[activeIndex] : null;
  const isMastered = item ? itemProgress[item.id]?.status === 'mastered' : false;

  const id = language === 'id';
  const label = (row) => (id && categoryTranslations[row] ? categoryTranslations[row] : row);

  const resetSession = () => {
    setPlayKey((k) => k + 1);
    setStrokeTotal(0);
    setCorrectStrokes(0);
    setMistakes(0);
    setFinished(false);
  };

  const handleComplete = () => {
    setFinished(true);
    if (!item) return;
    recordAnswer(item.id, true, writeXpFor(item));
    triggerEffect('correct');
  };

  // ── View 1: pilih grup ─────────────────────────────────────────────────────
  if (!group) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
        <button
          onClick={() => navigate(-1)}
          className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> {id ? 'Kembali' : 'Back'}
        </button>

        <header className="mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-seigaiha opacity-[0.05] pointer-events-none transform translate-x-1/4 -translate-y-1/4" />
          <h1 className="text-4xl sm:text-7xl md:text-8xl font-serif font-black text-sumi tracking-tighter relative z-10">
            書 <span className="text-shu">{id ? 'Latihan Menulis' : 'Writing'}</span>
          </h1>
          <p className="text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-sumi/60 mt-4 sm:mt-6 relative z-10">
            {id ? 'Urutan goresan & kuis tulis — Hiragana, Katakana, Kanji' : 'Stroke order & writing quiz — Hiragana, Katakana, Kanji'}
          </p>
        </header>

        {/* Script tabs */}
        <div className="flex items-end gap-4 sm:gap-8 border-b-[2px] border-sumi/10 mb-8 sm:mb-12 overflow-x-auto no-scrollbar">
          {Object.entries(SCRIPT_LABEL).map(([key, text]) => (
            <button
              key={key}
              onClick={() => { setActiveScript(key); setActiveGroupKey(null); }}
              className={`pb-4 text-[10px] font-bold tracking-[0.3em] uppercase border-b-[4px] -mb-[2px] shrink-0 transition-colors ${
                activeScript === key ? 'border-ai text-ai' : 'border-transparent text-sumi/40 hover:text-sumi/70'
              }`}
            >
              {text}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 sm:gap-6">
          {scriptGroups.map((g) => {
            const mastered = g.items.filter((it) => itemProgress[it.id]?.status === 'mastered').length;
            return (
              <motion.div
                key={g.key}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveGroupKey(g.key); setActiveIndex(0); resetSession(); }}
                className="bg-kinari border-[3px] border-sumi shadow-[6px_6px_0_0_rgba(var(--sumi-val),1)] hover:shadow-[2px_2px_0_0_rgba(var(--sumi-val),1)] transition-all cursor-pointer p-8 flex flex-col relative overflow-hidden group min-h-[180px]"
              >
                <div className="absolute inset-0 bg-seigaiha opacity-[0.03] group-hover:opacity-10 transition-opacity" />
                <div className="relative z-10 flex items-start justify-between w-full mb-6">
                  <h2 className="text-3xl font-serif text-sumi font-bold leading-tight">
                    {activeScript === 'kanji' ? label(g.row) : `${g.row} 行`}
                  </h2>
                  <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-sumi/50 bg-kinari-light border-2 border-sumi/20 px-2 py-1 shrink-0 ml-4">
                    {g.items.length} {activeScript === 'kanji' ? 'Kanji' : 'Char'}
                  </div>
                </div>
                <div className="relative z-10 mt-auto w-full">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                      {id ? 'Dikuasai' : 'Mastered'}
                    </span>
                    <span className="text-[10px] font-bold text-sumi font-serif">{mastered}/{g.items.length}</span>
                  </div>
                  <div className="w-full h-[4px] bg-sumi/10">
                    <div className="h-full bg-ai transition-all duration-500" style={{ width: `${(mastered / g.items.length) * 100}%` }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── View 2: latihan 1 karakter ─────────────────────────────────────────────
  const writable = isWritable(item);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen flex flex-col">
      <button
        onClick={() => setActiveGroupKey(null)}
        className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group w-fit"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> {id ? 'Kembali ke Kategori' : 'Back to Rows'}
      </button>

      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8 border-b-[4px] border-sumi pb-6">
        <h1 className="text-3xl sm:text-5xl font-serif font-black text-sumi">
          {activeScript === 'kanji' ? label(group.row) : `${group.row} 行`}
        </h1>
        <div className="text-sm font-bold tracking-[0.3em] text-sumi bg-kinari border-[3px] border-sumi px-6 py-2 shadow-[4px_4px_0_0_rgba(var(--sumi-val),1)]">
          <span className="text-ai">{activeIndex + 1}</span> / {group.items.length}
        </div>
      </header>

      {/* Character picker */}
      <div className="flex flex-wrap gap-2 mb-8">
        {group.items.map((it, idx) => (
          <button
            key={it.id}
            onClick={() => { setActiveIndex(idx); resetSession(); }}
            className={`w-11 h-11 border-[2px] font-serif text-lg transition-all ${
              idx === activeIndex
                ? 'bg-sumi text-kinari-light border-sumi'
                : 'bg-kinari-light text-sumi/70 border-sumi/20 hover:border-sumi/60'
            }`}
          >
            {it.char}
          </button>
        ))}
      </div>

      {/* Tab: Animasi / Kuis */}
      <div className="flex gap-3 mb-6">
        {[
          { key: 'animate', text: id ? 'Lihat Urutan' : 'Stroke Order' },
          { key: 'quiz', text: id ? 'Kuis Tulis' : 'Writing Quiz' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); resetSession(); }}
            className={`px-6 py-3 border-[3px] border-sumi text-[11px] font-black uppercase tracking-widest transition-all ${
              tab === t.key ? 'bg-ai text-kinari-light shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)]' : 'bg-kinari text-sumi/60'
            }`}
          >
            {t.text}
          </button>
        ))}
      </div>

      {!writable ? (
        <div className="bg-kinari border-[3px] border-sumi/30 p-8 text-center text-sumi/60 font-bold uppercase tracking-widest text-sm">
          {id ? 'Karakter ini 2 huruf — latihan baca dulu, tulis menyusul.' : 'This is a 2-character combo — read it first, writing comes later.'}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8">
          <StrokeCanvas
            key={`${item.id}-${tab}`}
            char={item.char}
            mode={tab}
            quizMode="light"
            playKey={playKey}
            showOutline={tab === 'quiz'}
            onStrokeCount={setStrokeTotal}
            handlers={{
              onCorrectStroke: () => { setCorrectStrokes((n) => n + 1); },
              onMistake: () => { setMistakes((n) => n + 1); },
              onComplete: handleComplete,
            }}
          />

          {/* Info bar */}
          <div className="w-full max-w-md flex flex-col gap-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/60">
              <span>{item.romaji || item.meaning_id || item.meaning}</span>
              <span>{strokeTotal > 0 ? `${correctStrokes}/${strokeTotal} ${id ? 'goresan' : 'strokes'}` : ''}</span>
            </div>

            {tab === 'quiz' && (
              <div className={`w-full py-3 text-center font-bold text-sm uppercase tracking-widest border-[3px] ${
                finished ? 'bg-matcha/10 border-matcha text-matcha'
                  : mistakes > 0 ? 'bg-shu/10 border-shu text-shu'
                  : 'bg-kinari border-sumi/20 text-sumi/50'
              }`}>
                {finished
                  ? (id ? `✓ Selesai! +${writeXpFor(item)} XP` : `✓ Complete! +${writeXpFor(item)} XP`)
                  : mistakes > 0
                    ? (id ? `✗ ${mistakes}× meleset — coba lagi` : `✗ ${mistakes} miss — try again`)
                    : (id ? 'Tulis mengikuti bayangan' : 'Trace the outline')}
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => setPlayKey((k) => k + 1)}
                className="!bg-kinari !text-sumi border-[3px] border-sumi uppercase tracking-widest font-bold text-xs shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)] rounded-none"
              >
                {tab === 'animate' ? (id ? '↻ Putar Ulang' : '↻ Replay') : (id ? '↻ Ulangi Kuis' : '↻ Restart Quiz')}
              </Button>

              {tab === 'animate' && (
                <Button
                  onClick={() => playDramaticAudio(item.char)}
                  className="!bg-kinari !text-sumi border-[3px] border-sumi uppercase tracking-widest font-bold text-xs shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)] rounded-none"
                >
                  <Volume2 size={14} className="inline mr-1" /> {id ? 'Dengar' : 'Listen'}
                </Button>
              )}

              <Button
                onClick={() => forceMasterItem(item.id)}
                className={`uppercase tracking-widest font-bold text-xs border-[3px] border-sumi shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)] rounded-none ${
                  isMastered ? '!bg-ai !text-kinari-light' : '!bg-kinari !text-sumi'
                }`}
              >
                {isMastered ? (id ? '✓ Dikuasai' : '✓ Mastered') : (id ? 'Tandai Dikuasai' : 'Mark Mastered')}
              </Button>

              <Button
                onClick={() => { setActiveIndex((i) => Math.min(i + 1, group.items.length - 1)); resetSession(); }}
                disabled={activeIndex >= group.items.length - 1}
                className={`uppercase tracking-widest font-bold text-xs border-[3px] border-sumi rounded-none ${
                  activeIndex >= group.items.length - 1 ? 'opacity-30 !bg-kinari !text-sumi' : '!bg-sumi !text-kinari-light shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)]'
                }`}
              >
                {id ? 'Berikutnya →' : 'Next →'}
              </Button>
            </div>

            <div className="text-center text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/40">
              {id ? `Level ${progress.level} · ${progress.xp.toLocaleString()} XP` : `Level ${progress.level} · ${progress.xp.toLocaleString()} XP`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Writing;
```

**5b.** Verifikasi tidak ada import yang salah (build):

```bash
npm run build 2>&1 | tail -8
```

Harapan: `✓ built in ...` tanpa `error`. (Warning ukuran chunk boleh.)

**5c.** Commit:

```bash
git add src/pages/Writing.jsx
git commit -m "feat(writing): halaman /writing (grid grup → detail, tab animasi/kuis, XP & mastered)"
```

---

### Task 6 — Wiring: route + kartu Home

**6a.** Edit `src/App.jsx`:
- tambah import (setelah baris `import Inventory from "./features/inventory/Inventory";`):

```jsx
import Writing from "./pages/Writing";
```

- tambah route (setelah `<Route path="/review" element={<Review />} />`):

```jsx
<Route path="/writing" element={<Writing />} />
```

**6b.** Edit `src/pages/Home.jsx` — kartu ke-4 di grid Actions.
Ubah (baris ±290):

```jsx
<div className="flex-1 grid grid-rows-2">
```
menjadi:

```jsx
<div className="flex-1 grid grid-rows-3">
```

lalu tambahkan kartu baru **sebelum** kartu Review (setelah blok Mondai `</motion.div>`):

```jsx
<motion.div onClick={() => navigate('/writing')} whileHover={{ backgroundColor: "rgba(125, 143, 105, 0.05)" }} className="p-6 sm:p-8 border-b-[4px] border-sumi cursor-pointer flex items-center justify-between group transition-colors">
  <div className="flex flex-col gap-2">
    <h4 className="text-xl sm:text-2xl font-serif font-bold text-sumi group-hover:text-matcha transition-colors">
      {language === 'id' ? 'Latihan Menulis' : 'Writing Practice'}
    </h4>
    <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
      {language === 'id' ? 'Urutan Goresan & Kuis Tulis' : 'Stroke Order & Writing Quiz'}
    </p>
  </div>
  <div className="w-14 h-14 rounded-full border-[3px] border-sumi flex items-center justify-center group-hover:bg-matcha group-hover:border-matcha group-hover:text-kinari-light transition-all flex-shrink-0 font-serif text-xl">
    書
  </div>
</motion.div>
```

**6c.** Jalankan dev server dan verifikasi manual (2 perintah, jalankan `npm run dev`
di terminal terpisah, lalu buka http://localhost:5173):

1. Buka `/writing` → muncul 3 tab (Hiragana/Katakana/Kanji); tab Hiragana menampilkan
   16 kartu row; klik "a 行" → grid あ い う え お; klik あ → tab **Lihat Urutan**
   memutar animasi 3 goresan (bisa diputar ulang dengan tombol ↻).
2. Ganti ke tab **Kuis Tulis** → bayangan あ terlihat; gambar goresan pertama (horizontal)
   → ada coretan merah & hint setelah 3× salah; selesaikan semua goresan → bar hijau
   "✓ Selesai! +10 XP" muncul, angka XP di Home naik, SFX jawaban benar berbunyi
   (kalau pack efek aktif, efek pack ikut muncul — **tanpa mengubah file efek**).
3. Kanji: buka tab Kanji → "Kanji Angka" → 一 → kuis → selesai → **+15 XP**.
4. Yoon: pilih row "kya" di Hiragana → karakter きゃ → panel "2 huruf — latihan baca dulu"
   (tanpa canvas).

**6d.** Cek tidak ada regresi test/lint:

```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)" && npm run lint 2>&1 | tail -2; echo "lint exit: $?"
```

Harapan: `ℹ pass 125`, `ℹ fail 0`; lint tidak menambah error baru (exit 0).

**6e.** Commit:

```bash
git add src/App.jsx src/pages/Home.jsx
git commit -m "feat(writing): route /writing + kartu Writing di Home"
```

---

### Task 7 — Update dokumentasi PRD (kecil, sekali jalan)

**7a.** Edit `PRD.md` §9: tambah sub-bagian setelah §9.1 (Kana Learning):

```markdown
### 9.1b Writing (Stroke Order & Writing Quiz) — [EXISTING]

* **[EXISTING]** Halaman `/writing`: pilih script (Hiragana/Katakana/Kanji) → grup → karakter.
* **[EXISTING]** Mode "Lihat Urutan": animasi urutan goresan (hanzi-writer) + putar ulang + audio TTS.
* **[EXISTING]** Mode "Kuis Tulis": user menggambar goresan, dinilai per goresan (hint setelah 3× salah,
  arah terbalik dimaafkan), selesai → +10 XP (kana) / +15 XP (kanji), masuk SRS `item_progress_v2`.
* **[EXISTING]** Data goresan offline-first: `public/strokes/<hex>.json` (206 karakter, ±289 KB),
  sumber `kanji-writer-data-jp` (Arphic Public License + LGPL animCJK).
* **[PLANNED]** Mode strict (tanpa hint, arah goresan wajib benar) & skor akurasi goresan.
```

**7b.** Commit:

```bash
git add PRD.md
git commit -m "docs(prd): catat fitur Writing (stroke order + kuis tulis)"
```

---

## Tests / validation

Ringkasan gerbang mutu yang harus lulus di akhir:

| Perintah | Harapan |
|---|---|
| `npm test 2>&1 \| grep -E "^ℹ (tests\|pass\|fail)"` | `tests 125`, `pass 125`, `fail 0` |
| `npm run lint` | exit 0 (warning lama boleh, **tidak boleh ada error baru**) |
| `npm run build` | `✓ built` tanpa error |
| `ls public/strokes \| wc -l` | `208` |
| `node -e "const j=require('./public/strokes/03042.json');console.log(j.strokes.length)"` | `3` |
| Manual: `/writing` → あ → Kuis Tulis → selesai | bar "✓ Selesai! +10 XP", XP Home naik |

Catatan TDD: Task 2 & 3 mengikuti siklus penuh (test dulu → jalankan lihat `fail 1` →
implement → jalankan lihat `pass`). Task 1/4/5/6/7 adalah task data/UI — verifikasinya
perintah eksak di atas + langkah manual bernomor (bukan "test it works").

## Risks, tradeoffs, and open questions

**Risks / mitigasi**

1. **Lisensi data goresan.** Data kanji = Arphic Public License, data kana = animCJK **LGPL**.
   Untuk proyek pribadi/eskul aman; kalau nanti dipublikasikan komersial, wajib ikutkan
   `public/strokes/ARPHICPL.TXT` + `LGPL.txt` (sudah di-copy oleh script) dan jangan
   klaim data itu milik sendiri. Alternatif bebas risiko: ganti sumber ke KanjiVG
   (CC BY-SA 3.0, share-alike) — tapi itu pekerjaan parser baru, bukan sekarang.
2. **Kualitas penilaian goresan.** `leniency: 1.4` + `acceptBackwardsStrokes: true`
   sengaja longgar untuk pemula; bisa jadi terlalu longgar untuk user mahir. Semua angka
   ada di `writeQuiz.js` (dites) sehingga tune = ubah 1 file + 1 test.
3. **Ukuran aset.** 206 file ±289 KB masuk precache PWA (`globPatterns` sudah mencakup
   `json`). Masih kecil, tapi kalau nanti dataset bertambah besar, pindahkan ke
   lazy-load per grup (fetch sudah lazy per karakter — yang masuk bundle cuma file
   yang benar-benar dibuka saat precache install; workbox akan precache semuanya,
   jadi monitor `dist/` size setelah Task 1).
4. **StrictMode double-mount.** React 19 StrictMode mount 2× di dev; `StrokeCanvas`
   membersihkan `el.innerHTML` + `cancelQuiz()` di cleanup supaya tidak ada canvas dobel.
   Kalau muncul glitch, set `showCharacter:false` sudah dipakai di kedua mode.
5. **iOS Safari touch.** Hanzi Writer pakai `touchstart/touchmove/touchend`; `preventDefault`
   dipanggil otomatis saat quiz aktif — aman, tapi wajib tes 1× di HP (manual step 6c).

**Tradeoffs yang diambil**

- **Vendor data, bukan npm import runtime** → bundle ramping, offline-first, tapi
  menambah 208 file di repo (+ script copy). Dipilih karena PRD §18 mewajibkan offline-first.
- **Tidak menambah localStorage key baru** → memakai `item_progress_v2` yang ada. Plus:
  konsisten dengan Review/SRS. Minus: "menulis" dan "membaca" tidak dibedakan statusnya.
- **Hanya 1 code point yang bisa ditulis** → yoon (きゃ) read-only. Plus: tidak perlu
  bikin canvas multi-slot. Minus: 33 item hiragana tidak bisa dilatih tulis (dilabeli jelas).
- **`triggerEffect` dipakai, file efek tidak disentuh** → pack SFX/visual tetap jalan,
  nol risiko regresi ke Gojo/Hina/Sumi.

**Open questions (kalau user mau lanjut, tanyakan sebelum task tambahan)**

1. Perlu mode **strict** (arah goresan wajib benar, tanpa hint) sebagai toggle di halaman,
   atau cukup mode light dulu? (params strict sudah ada & dites, tinggal UI toggle.)
2. Perlu **streak/achievement khusus menulis** (mis. "Tulis 50 karakter")? Belum termasuk
   plan ini karena mengubah `ACHIEVEMENT_META` (bukan area "keep").
3. Perlu **urutan kurikulum** (ikuti `syllabus.json` per bab) atau grid bebas per row
   seperti sekarang? Plan ini pilih grid bebas (paling sederhana, konsisten dengan Learn).
