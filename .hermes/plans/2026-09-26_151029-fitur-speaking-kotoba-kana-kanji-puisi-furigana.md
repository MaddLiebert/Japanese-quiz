# Fitur Speaking (話) — Kotoba, Hiragana, Katakana, Kanji & Puisi (dengan Furigana)

> Plan ini untuk implementer TANPA konteks codebase. Setiap task menyebut path
> file persis, kode lengkap yang bisa di-copy-paste, dan perintah verifikasi
> dengan output yang diharapkan. Ikuti urutannya; jangan lompat.

## Goal

Menambah fitur latihan **berbicara (speaking)** di app `japanese-quiz` untuk 5 jenis
konten — **Hiragana, Katakana, Kotoba, Kanji, dan Puisi Jepang** — di mana user
mengucapkan kata/kalimat lewat mikrofon, app menilai ucapannya dengan Web Speech
API, dan **puisi ditampilkan dengan furigana (ruby) di atas kanji**.

### Revisi 26/09 — keputusan user (WAJIB, mengikat test contract)

1. **3 level kesulitan bebas dipilih (tanpa gating)** — satu tabel `SPEAK_LEVELS`
   di `speaking.js` sebagai SATU-SATUNYA sumber perilaku + pengali XP:
   * `guide` (Pandu): teks + bacaan + arti tampil; XP ×1.
   * `recall` (Ingat): hanya teks Jepang; bacaan & arti disembunyikan; XP ×1.5.
   * `blind` (Buta): teks & bacaan disembunyikan, hanya arti (atau audio) yang
     tampil — user mengucapkan dari ingatan; XP ×2.
   Level dipilih lewat chip di halaman `/speaking`, diteruskan sebagai prop `level`
   ke `SpeakSession` & `PoemSession`. Level tak dikenal → `guide` (tidak throw).
   XP per level = `round(base × xpMult)` — tidak ada tabel XP kedua.
2. **XP per baris puisi**: setiap baris yang lulus memberi `SPEAK_XP['poem-line']`
   (5) lewat `addXp` (BUKAN `recordAnswer`); saat SEMUA baris lulus, puisi dicatat
   `recordAnswer(poem.id, true, speakXpFor({kind:'poem'}, level))` (25 × mult) — SRS
   tetap 1 item per puisi; achievement `poem_reciter` tetap menghitung id `poem_*`
   (baris tidak masuk SRS).
3. **Fallback latihan mandiri** untuk browser tanpa `SpeechRecognition` (Firefox):
   tombol mikrofon diganti tombol "Sudah Baca" per item/baris — TANPA penilaian,
   TANPA XP, TANPA SRS. Banner halaman menyebutkan mode ini.
4. Puisi tambahan / kategori puisi baru: **belum** — di luar scope revisi ini.

## Current context / assumptions (sudah diverifikasi di repo)

* Repo: `C:\Users\maddo\Documents\japanese-quiz` (git-bash: `/c/Users/maddo/Documents/japanese-quiz`), branch `main`.
* Stack: React 19 + Vite 8 + Tailwind 4 + `motion/react` + `react-router-dom` 7 + `vite-plugin-pwa`.
* Test runner: `node --test` (`npm test`) — **saat ini 155 pass / 0 fail**. Discovery otomatis semua `**/*.test.js`.
* Lint: `npm run lint` (oxlint) — harus **exit 0**. Build: `npm run build` — harus `✓ built`.
* Halaman ada di `src/pages/` (Home, Learn, Practice, Review, Settings, Writing). Route di `src/App.jsx` baris ~126–135. Kartu navigasi di `src/pages/Home.jsx` (blok kartu berakhir setelah kartu Writing, sebelum `</div>` penutup).
* Data (semua di `src/data/`):
  * `hiragana.json` — **104 item** (`type`: seion 46, dakuon 20, handakuon 5, yoon 33; field: `id, char, romaji, script, type, row`).
  * `katakana.json` — **46 item** (seion saja; shape sama).
  * `kotoba.json` — **876 item**, `char` **murni kana semua** (tidak ada kanji); field: `id, char, romaji, meaning, meaning_id, type='kotoba', category` (+`word` di 169 item).
  * `kanji.json` — **86 item**; field: `id, char, onyomi, kunyomi, meaning, meaning_id, type='kanji', category`. **Penting**: `onyomi`/`kunyomi` bisa berisi beberapa bacaan dipisah `、` (mis. `イチ、イツ`), placeholder `-` (mis. 百), dan okurigana dalam tanda kurung (mis. `ひと(つ)`, `-び`).
  * **Tidak ada data puisi sama sekali** → kita buat baru di `src/data/poems.json`.
* Audio: `src/utils/audio.js` → `playDramaticAudio(text)` pakai `speechSynthesis` `ja-JP` (sudah dipakai di Practice/Review/Writing). `src/utils/sfx.js` untuk SFX pack (jangan diutak-atik).
* Progress: `src/features/progress/ProgressContext.jsx`:
  * `recordAnswer(itemId, isCorrect, xpReward)` — update stats global + SRS (`itemProgress[itemId]`) + `addXp` (ada bonus streak +5% di `streak.js`, jadi XP tersimpan = `round(base*1.05)`).
  * `useItemProgress()` → `{ recordAnswer, forceMasterItem, itemProgress, weakItems }`.
  * `useAchievements()` → `{ achievements, ACHIEVEMENT_META, unlockAchievement, ... }`; `unlockAchievement(id)` menolak id yang tidak ada di `ACHIEVEMENT_META`.
  * `src/pages/Review.jsx` me-resolve `weakItems` dengan mencari id di array `allData = [hiragana, katakana, kotoba, grammar, kanji]` lalu `.filter(Boolean)` → **item SRS yang id-nya tidak ada di situ akan hilang dari Review** (ini alasan Task 14).
* Effect: `useEffectLayer()` → `triggerEffect('correct' | 'wrong')` (`src/features/effects/EffectContext.jsx`).
* Konvensi penting yang HARUS diikuti (pelajaran dari fitur Writing):
  1. **Modul logika murni TIDAK boleh `import` JSON** (node ESM butuh import attribute, Vite tidak). Data masuk sebagai **parameter fungsi**; test memuat JSON lewat `readFileSync`.
  2. **File `.jsx` tidak boleh mengekspor non-komponen** (aturan lint `react(only-export-components)` / fast-refresh). Hook & helper taruh di file `.js`.
  3. TDD per task: tulis test → jalankan (RED) → implement → jalankan (GREEN) → commit.
  4. Commit per task, pesan gaya repo (`feat(speaking): ...`). **JANGAN push** — tunggu perintah user.
* Environment: Windows + git-bash. Jalankan perintah dari root repo.
* Dev server: `npm run dev` (kalau port 5173 terpakai, Vite otomatis pindah ke 5174 — catat port dari output).

## Architecture / proposed approach

Tiga lapis, mengikuti pola fitur Writing yang sudah terbukti:

1. **Lapisan murni & teruji (`src/features/speaking/speechMatch.js`, `speaking.js`)** — normalisasi teks Jepang (katakana→hiragana, buang tanda baca), Levenshtein similarity, pemecahan bacaan kanji, penilaian ucapan (verdict), pembentukan item latihan, tabel XP + tabel level kesulitan (`SPEAK_LEVELS`). Semua tanpa DOM → bisa dites `node --test`.
2. **Lapisan browser tipis (`useSpeechRecognition.js`)** — pembungkus `SpeechRecognition` (Chrome/Edge). Constructor diambil **saat `start()` dipanggil** (bukan saat modul dimuat) supaya bisa di-mock di E2E dan aman di environment tanpa `window`.
3. **Lapisan UI (`src/pages/Speaking.jsx` + `SpeakSession.jsx` + `PoemSession.jsx` + `Furigana.jsx`)** — 5 tab konten; tiap item: tombol 🔊 Dengar (TTS), 🎤 Ucapkan (rekam → nilai), dan Lewati. Puisi dirender baris-per-baris dengan `<ruby>` furigana, selesai semua baris → item puisi masuk SRS + XP.

XP item utama diberikan lewat `recordAnswer(item.id, true, speakXpFor(item, level))` → otomatis nyambung ke stats, SRS, streak bonus, dan badge. XP baris puisi diberikan lewat `addXp(lineXpFor(level))` (tanpa SRS); puisi yang lulus semua baris dicatat SEKALI lewat `recordAnswer(poem.id, true, speakXpFor({kind:'poem'}, level))`. Item puisi (`poem_*`) ditambahkan ke `allData` Review supaya tidak "hilang" dari Review/weak-items. Mode mandiri (tanpa `SpeechRecognition`) tidak mencatat XP & SRS sama sekali.

## File map (semua file baru/kecuali disebut lain)

```
src/data/poems.json                                  (BARU — 8 puisi domain publik)
src/features/speaking/speechMatch.js                 (BARU — logika pencocokan)
src/features/speaking/speechMatch.test.js            (BARU)
src/features/speaking/speaking.js                    (BARU — item latihan + XP)
src/features/speaking/speaking.test.js               (BARU)
src/features/speaking/poems.test.js                  (BARU — integritas data puisi)
src/features/speaking/useSpeechRecognition.js        (BARU — hook)
src/features/speaking/Furigana.jsx                   (BARU — komponen ruby)
src/features/speaking/SpeakSession.jsx               (BARU — sesi latihan kana/kotoba/kanji)
src/features/speaking/PoemSession.jsx                (BARU — sesi puisi)
src/pages/Speaking.jsx                               (BARU — halaman 5 tab)
src/App.jsx                                          (EDIT — route /speaking)
src/pages/Home.jsx                                   (EDIT — kartu ke-5)
src/pages/Review.jsx                                 (EDIT — dukung item puisi)
src/features/progress/ProgressContext.jsx            (EDIT — 2 achievement baru)
PRD.md                                               (EDIT — §9.10 Speaking)
```

---

## Task 1 — `speechMatch.js` bagian 1: normalisasi teks Jepang

**File test:** `src/features/speaking/speechMatch.test.js` (baru)
**File impl:** `src/features/speaking/speechMatch.js` (baru)

### 1a. Tulis test (RED)

Buat `src/features/speaking/speechMatch.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { hasKanji, toHiragana, normalizeJa } from './speechMatch.js';

test('hasKanji: deteksi kanji, aman untuk input aneh', () => {
  assert.equal(hasKanji('古池'), true);
  assert.equal(hasKanji('あいうえお'), false);
  assert.equal(hasKanji(''), false);
  assert.equal(hasKanji(null), false);
  assert.equal(hasKanji(undefined), false);
});

test('toHiragana: katakana → hiragana, sisanya utuh', () => {
  assert.equal(toHiragana('ア'), 'あ');
  assert.equal(toHiragana('カタカナ'), 'かたかな');
  assert.equal(toHiragana('ヴ'), 'ゔ');            // 0x30F4 → 0x3094
  assert.equal(toHiragana('ー'), 'ー');            // chōonpu dipertahankan
  assert.equal(toHiragana('あいう'), 'あいう');     // hiragana lewat apa adanya
  assert.equal(toHiragana('ABC123'), 'ABC123');
  assert.equal(toHiragana(''), '');
});

test('normalizeJa: buang spasi & tanda baca, katakana → hiragana, ー tetap', () => {
  assert.equal(normalizeJa(' おはよう。 '), 'おはよう');
  assert.equal(normalizeJa('コーヒー'), 'こーひー');
  assert.equal(normalizeJa('「古池や」、'), '古池や');
  assert.equal(normalizeJa('え、っと…！？'), 'えっと');
  assert.equal(normalizeJa(null), '');
  assert.equal(normalizeJa(123), '123');
});
```

### 1b. Jalankan (RED)

```bash
node --test src/features/speaking/speechMatch.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: `fail 1` (modul belum ada → `Cannot find module`).

### 1c. Implementasi

Buat `src/features/speaking/speechMatch.js`:

```js
// speechMatch.js — pencocokan ucapan Jepang. Murni: tanpa DOM, tanpa React,
// tanpa import JSON. Dipakai fitur Speaking untuk menilai hasil
// SpeechRecognition terhadap target (bacaan kana / permukaan teks).

export const SPEAK_PASS = 0.7;   // similarity minimal dianggap lulus
export const SPEAK_GREAT = 0.9;  // skor "hampir sempurna"

const KANJI_RE = /[\u4e00-\u9faf\u3400-\u4dbf]/;

export const hasKanji = (text) => KANJI_RE.test(String(text || ''));

// Katakana → hiragana (geser 0x60). Karakter lain dibiarkan apa adanya.
export const toHiragana = (text) => {
  if (!text) return '';
  return [...String(text)]
    .map((ch) => {
      const code = ch.codePointAt(0);
      if (code >= 0x30a1 && code <= 0x30f6) return String.fromCodePoint(code - 0x60);
      return ch;
    })
    .join('');
};

// Normalisasi untuk perbandingan: katakana→hiragana, buang spasi & tanda baca.
// 'ー' (chōonpu) DIPERTAHANKAN karena bagian dari bacaan (コーヒー → こーひー).
export const normalizeJa = (text) => {
  if (!text) return '';
  return toHiragana(text)
    .replace(/[\s\u3000]/g, '')
    .replace(/[。、，．！？!?.,「」『』（）()・…~〜：:；;]/g, '');
};
```

### 1d. Jalankan (GREEN)

```bash
node --test src/features/speaking/speechMatch.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: `tests 3`, `pass 3`, `fail 0`.

### 1e. Commit

```bash
git add src/features/speaking/speechMatch.js src/features/speaking/speechMatch.test.js
git commit -m "feat(speaking): normalisasi teks Jepang (katakana→hiragana, buang tanda baca) + 3 test"
```

---

## Task 2 — `speechMatch.js` bagian 2: similarity & penilaian

**File test:** `src/features/speaking/speechMatch.test.js` (tambah)
**File impl:** `src/features/speaking/speechMatch.js` (tambah)

### 2a. Tambahkan test (RED)

Tambahkan ke `src/features/speaking/speechMatch.test.js`:

```js
import {
  levenshtein, similarity, scoreUtterance, matchSpeech, verdictOf,
  SPEAK_PASS, SPEAK_GREAT,
} from './speechMatch.js';

test('levenshtein: jarak edit klasik', () => {
  assert.equal(levenshtein('kitten', 'sitting'), 3);
  assert.equal(levenshtein('abc', 'abc'), 0);
  assert.equal(levenshtein('', 'abc'), 3);
  assert.equal(levenshtein('abc', ''), 3);
  assert.equal(levenshtein('', ''), 0);
});

test('similarity: 0..1 setelah normalisasi', () => {
  assert.equal(similarity('おはよう', 'おはよう'), 1);
  assert.equal(similarity('おはよう', 'オハヨウ'), 1);          // katakana = hiragana
  assert.equal(similarity('あ', 'ん'), 0);                     // beda total
  assert.ok(similarity('おはよ', 'おはよう') > 0.7);            // kurang 1 huruf
  assert.equal(similarity('', ''), 1);
  assert.equal(similarity('あ', ''), 0);
});

test('scoreUtterance: aturan skor', () => {
  assert.equal(scoreUtterance('おはよう', 'おはよう'), 1);
  assert.equal(scoreUtterance('おはようございます', 'おはよう'), 0.9);  // target terkandung
  assert.equal(scoreUtterance('あー', 'あ'), 0.9);                    // 1 huruf + awalan sama
  assert.equal(scoreUtterance('こんにちは', 'おはよう'), similarity('こんにちは', 'おはよう'));
  assert.equal(scoreUtterance('', 'あ'), 0);
});

test('matchSpeech: ambil skor terbaik dari alternatif × target', () => {
  const best = matchSpeech(['んん', 'おはよう'], ['おはよう', 'オハヨウ']);
  assert.equal(best.score, 1);
  assert.equal(best.heard, 'おはよう');
  const none = matchSpeech([], ['あ']);
  assert.equal(none.score, 0);
  const single = matchSpeech('あ', 'あ');   // boleh string tunggal
  assert.equal(single.score, 1);
});

test('verdictOf: great / pass / retry sesuai ambang', () => {
  assert.equal(verdictOf(1), 'great');
  assert.equal(verdictOf(SPEAK_GREAT), 'great');
  assert.equal(verdictOf(0.8), 'pass');
  assert.equal(verdictOf(SPEAK_PASS), 'pass');
  assert.equal(verdictOf(0.5), 'retry');
  assert.equal(verdictOf(undefined), 'retry');
});
```

### 2b. Jalankan (RED)

```bash
node --test src/features/speaking/speechMatch.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: `fail 1` (named export belum ada → `SyntaxError: does not provide an export named 'levenshtein'`).

### 2c. Implementasi — tambahkan ke `speechMatch.js` (di bawah `normalizeJa`)

```js
// Jarak edit Levenshtein — iteratif, memori O(1 baris).
export const levenshtein = (a, b) => {
  const s = String(a || '');
  const t = String(b || '');
  if (s === t) return 0;
  if (s.length === 0) return t.length;
  if (t.length === 0) return s.length;
  let prev = Array.from({ length: t.length + 1 }, (_, i) => i);
  for (let i = 1; i <= s.length; i++) {
    const cur = [i];
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[t.length];
};

// Kemiripan 0..1 (kedua sisi dinormalisasi lebih dulu).
export const similarity = (a, b) => {
  const x = normalizeJa(a);
  const y = normalizeJa(b);
  if (!x && !y) return 1;
  if (!x || !y) return 0;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
};

// Skor satu ucapan terhadap satu target:
// - sama persis setelah normalisasi → 1
// - target (≥2 huruf) terkandung di ucapan → 0.9 (mis. "おはよう" di "おはようございます")
// - target 1 huruf & ucapan diawali target → 0.9 (mis. "あ" vs "あー")
// - lainnya → similarity biasa
export const scoreUtterance = (heard, target) => {
  const h = normalizeJa(heard);
  const t = normalizeJa(target);
  if (!h || !t) return 0;
  if (h === t) return 1;
  if (t.length >= 2 && h.includes(t)) return 0.9;
  if (t.length === 1 && h.startsWith(t)) return 0.9;
  return similarity(h, t);
};

// Skor terbaik dari beberapa alternatif ucapan × beberapa target.
// heardList: array transcript dari SpeechRecognition; targetList: bacaan + permukaan.
export const matchSpeech = (heardList, targetList) => {
  const heard = (Array.isArray(heardList) ? heardList : [heardList]).filter(Boolean);
  const targets = (Array.isArray(targetList) ? targetList : [targetList]).filter(Boolean);
  let best = { score: 0, heard: '', target: '' };
  for (const h of heard) {
    for (const t of targets) {
      const score = scoreUtterance(h, t);
      if (score > best.score) best = { score, heard: h, target: t };
    }
  }
  return best;
};

export const verdictOf = (score) => {
  const s = Number(score) || 0;
  if (s >= SPEAK_GREAT) return 'great';
  if (s >= SPEAK_PASS) return 'pass';
  return 'retry';
};
```

### 2d. Jalankan (GREEN)

```bash
node --test src/features/speaking/speechMatch.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: `tests 8`, `pass 8`, `fail 0`.

### 2e. Commit

```bash
git add src/features/speaking/speechMatch.js src/features/speaking/speechMatch.test.js
git commit -m "feat(speaking): similarity Levenshtein + penilaian ucapan (verdict) + 5 test"
```

---

## Task 3 — `speechMatch.js` bagian 3: bacaan kanji

**File test:** `src/features/speaking/speechMatch.test.js` (tambah)
**File impl:** `src/features/speaking/speechMatch.js` (tambah)

### 3a. Tambahkan test (RED)

```js
import { readingsFromKanji } from './speechMatch.js';

test('readingsFromKanji: onyomi + kunyomi dipisah 、', () => {
  const r = readingsFromKanji({ onyomi: 'イチ、イツ', kunyomi: 'ひと(つ)' });
  assert.deepEqual(r, ['イチ', 'イツ', 'ひと', 'ひとつ']);
});

test('readingsFromKanji: buang placeholder "-" & tanda hubung okurigana', () => {
  assert.deepEqual(readingsFromKanji({ onyomi: 'ヒャク', kunyomi: '-' }), ['ヒャク']);
  assert.deepEqual(readingsFromKanji({ onyomi: 'ニチ、ジツ', kunyomi: 'ひ、-び、か' }), ['ニチ', 'ジツ', 'ひ', 'び', 'か']);
  assert.deepEqual(readingsFromKanji({ onyomi: 'キン、コン', kunyomi: 'かね、かな-' }), ['キン', 'コン', 'かね', 'かな']);
});

test('readingsFromKanji: input kosong aman', () => {
  assert.deepEqual(readingsFromKanji(null), []);
  assert.deepEqual(readingsFromKanji({}), []);
  assert.deepEqual(readingsFromKanji({ onyomi: '', kunyomi: '' }), []);
});
```

### 3b. Jalankan (RED)

```bash
node --test src/features/speaking/speechMatch.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: `fail 1` (export `readingsFromKanji` belum ada).

### 3c. Implementasi — tambahkan ke `speechMatch.js` (paling bawah)

```js
// Bacaan dari item kanji.json: onyomi + kunyomi dipisah '、'.
// Buang placeholder '-', tanda kurung, dan tanda hubung okurigana di tepi.
// "ひと(つ)" → ["ひと", "ひとつ"]; "-び" → ["び"]; "イチ、イツ" → ["イチ","イツ"]
export const readingsFromKanji = (item) => {
  const out = [];
  const push = (raw) => {
    if (!raw) return;
    for (const part of String(raw).split('、')) {
      const pre = part.split(/[（(]/)[0].replace(/^-+|-+$/g, '').trim();
      const full = part.replace(/[（()）]/g, '').replace(/^-+|-+$/g, '').trim();
      if (pre && pre !== '-') out.push(pre);
      if (full && full !== '-' && full !== pre) out.push(full);
    }
  };
  push(item?.onyomi);
  push(item?.kunyomi);
  return [...new Set(out)];
};
```

### 3d. Jalankan (GREEN)

```bash
node --test src/features/speaking/speechMatch.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: `tests 11`, `pass 11`, `fail 0`.

### 3e. Commit

```bash
git add src/features/speaking/speechMatch.js src/features/speaking/speechMatch.test.js
git commit -m "feat(speaking): readingsFromKanji (pisah 、, okurigana, placeholder -) + 3 test"
```

---

## Task 4 — `src/data/poems.json`: 4 puisi pertama + test integritas

**File data:** `src/data/poems.json` (baru)
**File test:** `src/features/speaking/poems.test.js` (baru)

### 4a. Tulis test (RED)

Buat `src/features/speaking/poems.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasKanji } from './speechMatch.js';

// Helper lokal sementara — di Task 6b GANTI jadi:
// import { lineText, lineReading } from './speaking.js';
const lineText = (line) => (line.segments || []).map((s) => s.t).join('');
const lineReading = (line) => (line.segments || []).map((s) => s.r || s.t).join('');

// Modul murni tidak meng-import JSON; test memuat sendiri (pola fitur writing).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const POEMS = JSON.parse(readFileSync(join(ROOT, 'src/data/poems.json'), 'utf8'));

const KANA_ONLY = /^[\u3041-\u309f\u30a0-\u30ffー]+$/;

test('poems.json: ada 8 puisi, id unik, field wajib lengkap', () => {
  assert.equal(POEMS.length, 8);
  assert.equal(new Set(POEMS.map((p) => p.id)).size, 8);
  for (const p of POEMS) {
    assert.ok(p.id && p.title && p.author && p.type, `puisi ${p.id} kurang field`);
    assert.ok(p.meaning && p.meaning_id, `puisi ${p.id} kurang arti`);
    assert.ok(Array.isArray(p.lines) && p.lines.length >= 3, `puisi ${p.id} baris < 3`);
  }
});

test('setiap segmen berkanji WAJIB punya furigana kana', () => {
  for (const p of POEMS) {
    for (const line of p.lines) {
      for (const seg of line.segments || []) {
        if (hasKanji(seg.t)) {
          assert.ok(seg.r, `${p.id}: segmen "${seg.t}" tidak punya furigana`);
          assert.ok(KANA_ONLY.test(seg.r), `${p.id}: furigana "${seg.r}" bukan kana murni`);
        }
      }
    }
  }
});

test('bacaan tiap baris murni kana (tidak ada kanji yang lolos)', () => {
  for (const p of POEMS) {
    for (const line of p.lines) {
      const reading = lineReading(line);
      assert.ok(reading.length > 0, `${p.id}: ada baris kosong`);
      assert.ok(KANA_ONLY.test(reading), `${p.id}: bacaan "${reading}" mengandung non-kana`);
    }
  }
});

test('titleReading & authorReading murni kana', () => {
  for (const p of POEMS) {
    assert.ok(KANA_ONLY.test(p.titleReading), `${p.id}: titleReading bukan kana`);
    assert.ok(KANA_ONLY.test(p.authorReading), `${p.id}: authorReading bukan kana`);
  }
});
```

### 4b. Jalankan (RED)

```bash
node --test src/features/speaking/poems.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)|ENOENT" | head -3
```

Expected: `fail 1` — `ENOENT ... poems.json` (file belum ada).

### 4c. Buat data (4 puisi pertama)

Buat `src/data/poems.json`:

```json
[
  {
    "id": "poem_basho_furuike",
    "title": "古池や",
    "titleReading": "ふるいけや",
    "author": "松尾芭蕉",
    "authorReading": "まつおばしょう",
    "type": "haiku",
    "excerpt": false,
    "meaning": "The old pond; a frog jumps in — the sound of water.",
    "meaning_id": "Kolam tua; katak melompat — bunyi air.",
    "lines": [
      { "segments": [{ "t": "古池", "r": "ふるいけ" }, { "t": "や" }] },
      { "segments": [{ "t": "蛙", "r": "かわず" }, { "t": "飛", "r": "と" }, { "t": "びこむ" }] },
      { "segments": [{ "t": "水", "r": "みず" }, { "t": "の" }, { "t": "音", "r": "おと" }] }
    ]
  },
  {
    "id": "poem_basho_natsukusa",
    "title": "夏草や",
    "titleReading": "なつくさや",
    "author": "松尾芭蕉",
    "authorReading": "まつおばしょう",
    "type": "haiku",
    "excerpt": false,
    "meaning": "Summer grass — all that remains of warriors' dreams.",
    "meaning_id": "Rumput musim panas — sisa mimpi para prajurit.",
    "lines": [
      { "segments": [{ "t": "夏草", "r": "なつくさ" }, { "t": "や" }] },
      { "segments": [{ "t": "兵", "r": "つわもの" }, { "t": "どもが" }] },
      { "segments": [{ "t": "夢", "r": "ゆめ" }, { "t": "の" }, { "t": "跡", "r": "あと" }] }
    ]
  },
  {
    "id": "poem_issa_meigetsu",
    "title": "名月を",
    "titleReading": "めいげつを",
    "author": "小林一茶",
    "authorReading": "こばやしいっさ",
    "type": "haiku",
    "excerpt": false,
    "meaning": "The full moon — and a child crying, \"give it to me!\"",
    "meaning_id": "Bulan purnama — dan anak kecil menangis, \"ambilkan untukku!\"",
    "lines": [
      { "segments": [{ "t": "名月", "r": "めいげつ" }, { "t": "を" }] },
      { "segments": [{ "t": "とってくれろと" }] },
      { "segments": [{ "t": "泣", "r": "な" }, { "t": "く" }, { "t": "子", "r": "こ" }, { "t": "かな" }] }
    ]
  },
  {
    "id": "poem_buson_nanohana",
    "title": "菜の花や",
    "titleReading": "なのはなや",
    "author": "与謝蕪村",
    "authorReading": "よさぶそん",
    "type": "haiku",
    "excerpt": false,
    "meaning": "Canola blossoms — the moon in the east, the sun in the west.",
    "meaning_id": "Bunga kanola — bulan di timur, matahari di barat.",
    "lines": [
      { "segments": [{ "t": "菜", "r": "な" }, { "t": "の" }, { "t": "花", "r": "はな" }, { "t": "や" }] },
      { "segments": [{ "t": "月", "r": "つき" }, { "t": "は" }, { "t": "東", "r": "ひがし" }, { "t": "に" }] },
      { "segments": [{ "t": "日", "r": "ひ" }, { "t": "は" }, { "t": "西", "r": "にし" }, { "t": "に" }] }
    ]
  }
]
```

> **Instruksi pasti (jangan pakai alternatif lain):** di Task 4 ini, definisikan helper
> **lokal** di dalam test supaya test bisa RED→GREEN tanpa menunggu Task 6:
>
> ```js
> // Helper lokal sementara — di Task 6b GANTI jadi import dari './speaking.js'.
> const lineText = (line) => (line.segments || []).map((s) => s.t).join('');
> const lineReading = (line) => (line.segments || []).map((s) => s.r || s.t).join('');
> ```
>
> Jadi di Task 4, baris import `import { lineReading } from './speaking.js';` **diganti** dua baris helper lokal di atas. Task 6b nanti menggantinya kembali menjadi import.

### 4d. Jalankan (GREEN)

```bash
node --test src/features/speaking/poems.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: `tests 4`, `pass 4`, `fail 0` (kalau pakai helper lokal di test; kalau menunggu Task 6, jalankan setelah Task 6).

### 4e. Commit

```bash
git add src/data/poems.json src/features/speaking/poems.test.js
git commit -m "feat(speaking): data puisi (4 haiku klasik) + test integritas furigana"
```

---

## Task 5 — `src/data/poems.json`: 4 puisi lagi (total 8)

**File data:** `src/data/poems.json` (tambah 4 entry)

### 5a. Tambahkan 4 puisi ini ke array (setelah `poem_buson_nanohana`)

```json
  {
    "id": "poem_komachi_hananoiro",
    "title": "花の色は",
    "titleReading": "はなのいろは",
    "author": "小野小町",
    "authorReading": "おののこまち",
    "type": "tanka",
    "excerpt": false,
    "meaning": "The blossoms' colour faded while, in vain, I grew old watching the long rains.",
    "meaning_id": "Warna bunga pun memudar — masa mudaku terbuang dalam hujan panjang.",
    "lines": [
      { "segments": [{ "t": "花", "r": "はな" }, { "t": "の" }, { "t": "色", "r": "いろ" }, { "t": "は" }] },
      { "segments": [{ "t": "移", "r": "うつ" }, { "t": "りにけりな" }] },
      { "segments": [{ "t": "いたづらに" }] },
      { "segments": [{ "t": "わが" }, { "t": "身", "r": "み" }, { "t": "世", "r": "よ" }, { "t": "にふる" }] },
      { "segments": [{ "t": "ながめせしまに" }] }
    ]
  },
  {
    "id": "poem_kenji_amenimomakezu",
    "title": "雨にも負けず",
    "titleReading": "あめにもまけず",
    "author": "宮沢賢治",
    "authorReading": "みやざわけんじ",
    "type": "free",
    "excerpt": true,
    "meaning": "Unbeaten by rain, by wind, by snow and summer heat (excerpt).",
    "meaning_id": "Tak kalah oleh hujan, angin, salju, maupun panasnya musim panas (kutipan).",
    "lines": [
      { "segments": [{ "t": "雨", "r": "あめ" }, { "t": "にも" }, { "t": "負", "r": "ま" }, { "t": "けず" }] },
      { "segments": [{ "t": "風", "r": "かぜ" }, { "t": "にも" }, { "t": "負", "r": "ま" }, { "t": "けず" }] },
      { "segments": [{ "t": "雪", "r": "ゆき" }, { "t": "にも" }, { "t": "夏", "r": "なつ" }, { "t": "の" }, { "t": "暑", "r": "あつ" }, { "t": "さにも" }, { "t": "負", "r": "ま" }, { "t": "けぬ" }] }
    ]
  },
  {
    "id": "poem_basho_yamaji",
    "title": "山路来て",
    "titleReading": "やまじきて",
    "author": "松尾芭蕉",
    "authorReading": "まつおばしょう",
    "type": "haiku",
    "excerpt": false,
    "meaning": "Along the mountain path — somehow lovely, the violets.",
    "meaning_id": "Di jalan pegunungan — entah kenapa indah, bunga violet.",
    "lines": [
      { "segments": [{ "t": "山", "r": "やま" }, { "t": "路", "r": "じ" }, { "t": "来", "r": "き" }, { "t": "て" }] },
      { "segments": [{ "t": "何", "r": "なに" }, { "t": "やらゆかし" }] },
      { "segments": [{ "t": "すみれ" }, { "t": "草", "r": "ぐさ" }] }
    ]
  },
  {
    "id": "poem_shiki_kakikueba",
    "title": "柿食えば",
    "titleReading": "かきくえば",
    "author": "正岡子規",
    "authorReading": "まさおかしき",
    "type": "haiku",
    "excerpt": false,
    "meaning": "Eating a persimmon — a bell rings at Hōryū-ji.",
    "meaning_id": "Menyantap kesemek — lonceng pun berbunyi di Hōryū-ji.",
    "lines": [
      { "segments": [{ "t": "柿", "r": "かき" }, { "t": "食", "r": "く" }, { "t": "えば" }] },
      { "segments": [{ "t": "鐘", "r": "かね" }, { "t": "が" }, { "t": "鳴", "r": "な" }, { "t": "るなり" }] },
      { "segments": [{ "t": "法隆寺", "r": "ほうりゅうじ" }] }
    ]
  }
```

### 5b. Verifikasi

```bash
node -e "const p=require('./src/data/poems.json'); console.log('total:', p.length, '| ids unik:', new Set(p.map(x=>x.id)).size)"
node --test src/features/speaking/poems.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: `total: 8 | ids unik: 8` dan `tests 4 / pass 4 / fail 0`.

### 5c. Commit

```bash
git add src/data/poems.json
git commit -m "feat(speaking): tambah 4 puisi (tanka 小野小町, 宮沢賢治, 蕪村, 正岡子規) — total 8"
```

---

## Task 6 — `speaking.js`: item latihan + tabel XP

**File test:** `src/features/speaking/speaking.test.js` (baru)
**File impl:** `src/features/speaking/speaking.js` (baru)

### 6a. Tulis test (RED)

Buat `src/features/speaking/speaking.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SPEAK_XP, SPEAK_LEVELS, DEFAULT_SPEAK_LEVEL, speakLevel, speakXpFor, lineXpFor,
  lineText, lineReading,
  kanaSpeakItems, kotobaSpeakItems, kanjiSpeakItems, poemLineItems,
  filterKanaByType,
} from './speaking.js';

test('speakXpFor: XP dasar per jenis konten (level default = guide)', () => {
  assert.equal(speakXpFor({ kind: 'hiragana' }), SPEAK_XP.hiragana);
  assert.equal(speakXpFor({ kind: 'katakana' }), SPEAK_XP.katakana);
  assert.equal(speakXpFor({ kind: 'kotoba' }), SPEAK_XP.kotoba);
  assert.equal(speakXpFor({ kind: 'kanji' }), SPEAK_XP.kanji);
  assert.equal(speakXpFor({ kind: 'poem' }), SPEAK_XP.poem);
  assert.equal(speakXpFor({ kind: 'poem-line' }), SPEAK_XP['poem-line']);
  assert.equal(speakXpFor(null), 0);
  assert.equal(speakXpFor({}), 0);
});

test('speakLevel: 3 level bebas + normalisasi input ngawur ke guide', () => {
  assert.equal(SPEAK_LEVELS.guide.xpMult, 1);
  assert.equal(SPEAK_LEVELS.recall.xpMult, 1.5);
  assert.equal(SPEAK_LEVELS.blind.xpMult, 2);
  assert.equal(SPEAK_LEVELS.guide.showText, true);
  assert.equal(SPEAK_LEVELS.recall.showReading, false);
  assert.equal(SPEAK_LEVELS.blind.showText, false);
  assert.equal(speakLevel('recall'), SPEAK_LEVELS.recall);
  assert.equal(speakLevel('ngawur'), SPEAK_LEVELS[DEFAULT_SPEAK_LEVEL]);
  assert.equal(speakLevel(undefined), SPEAK_LEVELS[DEFAULT_SPEAK_LEVEL]);
});

test('speakXpFor + level: XP = dasar × pengali (dibulatkan)', () => {
  assert.equal(speakXpFor({ kind: 'kotoba' }, 'recall'), 15);      // 10 × 1.5
  assert.equal(speakXpFor({ kind: 'kanji' }, 'blind'), 24);        // 12 × 2
  assert.equal(speakXpFor({ kind: 'poem' }, 'recall'), 38);        // round(25 × 1.5)
  assert.equal(speakXpFor({ kind: 'poem-line' }, 'blind'), 10);    // 5 × 2
  assert.equal(speakXpFor({ kind: 'ngawur' }, 'blind'), 0);        // kind tak dikenal
  assert.equal(lineXpFor('guide'), 5);
  assert.equal(lineXpFor('recall'), 8);                            // round(5 × 1.5)
});

test('lineText & lineReading: gabung segmen', () => {
  const line = { segments: [{ t: '古池', r: 'ふるいけ' }, { t: 'や' }] };
  assert.equal(lineText(line), '古池や');
  assert.equal(lineReading(line), 'ふるいけや');
  assert.equal(lineText(null), '');
  assert.equal(lineReading({}), '');
});

test('kanaSpeakItems: bentuk item latihan kana', () => {
  const items = kanaSpeakItems([{ id: 'hira_a', char: 'あ', romaji: 'a', type: 'seion', row: 'a' }], 'hiragana');
  assert.equal(items.length, 1);
  assert.deepEqual(
    { id: items[0].id, kind: items[0].kind, display: items[0].display, readings: items[0].readings, meaning: items[0].meaning },
    { id: 'hira_a', kind: 'hiragana', display: 'あ', readings: ['あ'], meaning: 'a' },
  );
  assert.deepEqual(kanaSpeakItems(null, 'hiragana'), []);
});

test('kotobaSpeakItems: bacaan = char (kotoba murni kana)', () => {
  const items = kotobaSpeakItems([{ id: 'v_ohayou', char: 'おはよう', romaji: 'ohayou', meaning: 'Good morning', meaning_id: 'Selamat pagi', category: 'Greetings' }]);
  assert.equal(items[0].readings[0], 'おはよう');
  assert.equal(items[0].meaningId, 'Selamat pagi');
});

test('kanjiSpeakItems: readings dari onyomi+kunyomi', () => {
  const items = kanjiSpeakItems([{ id: 'kj_ichi', char: '一', onyomi: 'イチ、イツ', kunyomi: 'ひと(つ)', meaning: 'One', meaning_id: 'Satu', category: 'NumbersKanji' }]);
  assert.equal(items[0].kind, 'kanji');
  assert.ok(items[0].readings.includes('イチ'));
  assert.ok(items[0].readings.includes('イツ'));
  assert.ok(items[0].readings.includes('ひと'));
  assert.ok(items[0].readings.includes('ひとつ'));
});

test('poemLineItems: id per baris + bacaan benar', () => {
  const poem = {
    id: 'poem_x',
    lines: [
      { segments: [{ t: '古池', r: 'ふるいけ' }, { t: 'や' }] },
      { segments: [{ t: '水', r: 'みず' }, { t: 'の' }, { t: '音', r: 'おと' }] },
    ],
  };
  const items = poemLineItems(poem);
  assert.equal(items.length, 2);
  assert.equal(items[0].id, 'poem_x_l0');
  assert.equal(items[0].display, '古池や');
  assert.deepEqual(items[0].readings, ['ふるいけや']);
  assert.equal(items[1].readings[0], 'みずのおと');
  assert.deepEqual(poemLineItems(null), []);
});

test('filterKanaByType: all / seion / yoon', () => {
  const data = [
    { id: 'a', type: 'seion' }, { id: 'b', type: 'dakuon' }, { id: 'c', type: 'yoon' },
  ];
  assert.equal(filterKanaByType(data, 'all').length, 3);
  assert.deepEqual(filterKanaByType(data, 'yoon').map((d) => d.id), ['c']);
  assert.deepEqual(filterKanaByType(null, 'all'), []);
});
```

### 6b. Jalankan (RED)

```bash
node --test src/features/speaking/speaking.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: `fail 1` (modul belum ada).

### 6c. Implementasi

Buat `src/features/speaking/speaking.js`:

```js
// speaking.js — logika murni fitur Speaking (tanpa DOM/React/import JSON).
// Data dilewatkan sebagai parameter (pola sama dengan features/writing/writing.js).
import { readingsFromKanji } from './speechMatch.js';

// ── Level kesulitan (bebas dipilih, TANPA gating) ───────────────────────────
// SATU-SATUNYA sumber perilaku tampilan + pengali XP per level:
// guide  = semua petunjuk tampil (teks + bacaan + arti), XP ×1
// recall = hanya teks Jepang (bacaan & arti disembunyikan), XP ×1.5
// blind  = teks disembunyikan, arti jadi petunjuk, XP ×2
export const SPEAK_LEVELS = {
  guide:  { key: 'guide',  label: 'Pandu', xpMult: 1,   showText: true,  showReading: true,  showMeaning: true },
  recall: { key: 'recall', label: 'Ingat', xpMult: 1.5, showText: true,  showReading: false, showMeaning: false },
  blind:  { key: 'blind',  label: 'Buta',  xpMult: 2,   showText: false, showReading: false, showMeaning: true },
};
export const DEFAULT_SPEAK_LEVEL = 'guide';

// Level tak dikenal / kosong → guide (normalisasi, tidak throw).
export const speakLevel = (level) => SPEAK_LEVELS[level] || SPEAK_LEVELS[DEFAULT_SPEAK_LEVEL];

// XP dasar per jenis konten — SATU-SATUNYA sumber angka (dipakai UI & test).
export const SPEAK_XP = { hiragana: 8, katakana: 8, kotoba: 10, kanji: 12, 'poem-line': 5, poem: 25 };

// XP final = dasar × pengali level (dibulatkan). Item tanpa kind → 0.
export const speakXpFor = (item, level) => {
  if (!item || !item.kind) return 0;
  const base = SPEAK_XP[item.kind] ?? 0;
  return base ? Math.round(base * speakLevel(level).xpMult) : 0;
};

// XP satu baris puisi pada level tertentu (dipakai PoemSession).
export const lineXpFor = (level) => speakXpFor({ kind: 'poem-line' }, level);

// Teks permukaan satu baris puisi (gabungan t).
export const lineText = (line) =>
  (line?.segments || []).map((s) => s?.t || '').join('');

// Bacaan satu baris puisi (r kalau ada, kalau tidak pakai t).
export const lineReading = (line) =>
  (line?.segments || []).map((s) => s?.r || s?.t || '').join('');

// Item latihan dari dataset kana (hiragana/katakana).
export const kanaSpeakItems = (data, script) =>
  (data || []).map((d) => ({
    id: d.id,
    kind: script,
    display: d.char,
    surface: d.char,
    readings: [d.char],
    meaning: d.romaji,
    sub: d.type,
    row: d.row,
  }));

export const kotobaSpeakItems = (data) =>
  (data || []).map((d) => ({
    id: d.id,
    kind: 'kotoba',
    display: d.char,
    surface: d.char,
    readings: [d.char],
    meaning: d.meaning,
    meaningId: d.meaning_id,
    category: d.category,
  }));

export const kanjiSpeakItems = (data) =>
  (data || []).map((d) => ({
    id: d.id,
    kind: 'kanji',
    display: d.char,
    surface: d.char,
    readings: readingsFromKanji(d),
    meaning: d.meaning,
    meaningId: d.meaning_id,
    category: d.category,
  }));

// Baris-baris puisi → item latihan (tidak masuk SRS; SRS per puisi saat selesai).
export const poemLineItems = (poem) =>
  (poem?.lines || []).map((line, i) => ({
    id: `${poem.id}_l${i}`,
    kind: 'poem-line',
    display: lineText(line),
    surface: lineText(line),
    readings: [lineReading(line)],
    segments: line.segments || [],
  }));

// Filter kana per tipe (seion/dakuon/handakuon/yoon) — 'all' mengembalikan semua.
export const filterKanaByType = (data, type) =>
  !type || type === 'all' ? (data || []) : (data || []).filter((d) => d.type === type);
```

### 6d. Jalankan (GREEN) + ganti helper lokal di `poems.test.js`

```bash
node --test src/features/speaking/speaking.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: `tests 8`, `pass 8`, `fail 0`.

Task 4 memakai helper lokal di `poems.test.js`. **Ganti sekarang** menjadi import:

```js
import { lineText, lineReading } from './speaking.js';
```

(hapus dua baris `const lineText = ...` / `const lineReading = ...` lokal di test tersebut)

lalu jalankan `node --test src/features/speaking/poems.test.js` → `pass 4 / fail 0`.

### 6e. Commit

```bash
git add src/features/speaking/speaking.js src/features/speaking/speaking.test.js src/features/speaking/poems.test.js
git commit -m "feat(speaking): item latihan (kana/kotoba/kanji/puisi) + tabel XP & 3 level + 8 test"
```

---

## Task 7 — `Furigana.jsx`: komponen ruby

**File:** `src/features/speaking/Furigana.jsx` (baru) — **hanya boleh mengekspor komponen** (aturan fast-refresh).

Buat file:

```jsx
// Furigana.jsx — render <ruby> dari segmen puisi: { t: '古池', r: 'ふるいけ' }.
// Segmen tanpa r → teks polos. HANYA ekspor komponen (aturan react-refresh).
export function Furigana({ segments, show = true, className = '', rtClassName = 'font-bold text-shu/80 tracking-wider' }) {
  if (!Array.isArray(segments) || segments.length === 0) return null;
  return (
    <span className={className}>
      {segments.map((s, i) => {
        if (!s?.t) return null;
        if (!show || !s.r) return <span key={i}>{s.t}</span>;
        return (
          <ruby key={i}>
            {s.t}
            <rt className={rtClassName} style={{ fontSize: '0.5em' }}>{s.r}</rt>
          </ruby>
        );
      })}
    </span>
  );
}

export default Furigana;
```

Verifikasi:

```bash
npm run lint > /tmp/lint_furigana.txt 2>&1; echo "lint exit: $?"; grep -c "Furigana" /tmp/lint_furigana.txt || echo "0 warning"
npm run build 2>&1 | grep -iE "built in|error" | head -2
```

Expected: `lint exit: 0`, tidak ada warning `only-export-components` untuk Furigana, dan `✓ built`.

Commit:

```bash
git add src/features/speaking/Furigana.jsx
git commit -m "feat(speaking): komponen Furigana (ruby) untuk puisi berkanji"
```

---

## Task 8 — `useSpeechRecognition.js`: hook Web Speech API

**File:** `src/features/speaking/useSpeechRecognition.js` (baru) — file `.js`, bukan `.jsx` (bukan komponen).

Keputusan desain penting: **constructor diambil saat `listenOnce()` dipanggil**, bukan saat modul dimuat — supaya (a) aman di environment tanpa `window`, (b) bisa di-mock pada E2E (inject `window.SpeechRecognition` lalu klik mic tanpa reload).

Buat file:

```js
// useSpeechRecognition.js — pembungkus tipis Web Speech API (SpeechRecognition).
// Constructor diambil SAAT start() supaya bisa di-mock (E2E) & aman tanpa window.
import { useCallback, useEffect, useRef, useState } from 'react';

export const getRecognitionCtor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const isSpeechRecognitionSupported = () => Boolean(getRecognitionCtor());

export function useSpeechRecognition({ lang = 'ja-JP' } = {}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const recRef = useRef(null);

  useEffect(() => () => {
    try { recRef.current?.abort?.(); } catch { /* noop */ }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Satu sesi dengar. Mengembalikan array transcript (bisa kosong).
  const listenOnce = useCallback(() => new Promise((resolve) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) { setError('not-supported'); resolve([]); return; }
    try { recRef.current?.abort?.(); } catch { /* noop */ }

    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.continuous = false;

    let settled = false;
    const finish = (texts) => {
      if (settled) return;
      settled = true;
      recRef.current = null;
      setListening(false);
      resolve(texts);
    };

    rec.onresult = (e) => {
      const texts = [];
      try {
        const res = e?.results?.[0];
        if (res) for (let i = 0; i < res.length; i++) {
          if (res[i]?.transcript) texts.push(res[i].transcript);
        }
      } catch { /* noop */ }
      finish(texts);
    };
    rec.onerror = (e) => { setError(e?.error || 'unknown'); finish([]); };
    rec.onend = () => finish([]);

    setError(null);
    setListening(true);
    try { rec.start(); } catch { setError('unknown'); finish([]); }
  }), [lang]);

  return { listenOnce, listening, error, clearError, supported: isSpeechRecognitionSupported() };
}
```

Verifikasi:

```bash
npm run lint > /tmp/lint_hook.txt 2>&1; echo "lint exit: $?"
npm run build 2>&1 | grep -iE "built in|error" | head -2
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: `lint exit: 0`, `✓ built`, dan `npm test` tetap hijau (155+ test — hook tidak punya unit test node karena butuh browser; E2E di Task 16 yang menguji).

Commit:

```bash
git add src/features/speaking/useSpeechRecognition.js
git commit -m "feat(speaking): hook useSpeechRecognition (ctor saat start, mock-friendly)"
```

---

## Task 9 — `SpeakSession.jsx`: sesi latihan kana/kotoba/kanji

**File:** `src/features/speaking/SpeakSession.jsx` (baru)

Buat file:

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, Mic, SkipForward, Check } from 'lucide-react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { matchSpeech, verdictOf } from './speechMatch';
import { speakXpFor, speakLevel, DEFAULT_SPEAK_LEVEL } from './speaking';
import { useItemProgress, useAchievements } from '../progress/ProgressContext';
import { useEffectLayer } from '../effects/EffectContext';
import { useLanguage } from '../../context/LanguageContext';
import { playDramaticAudio } from '../../utils/audio';

const ERROR_TEXT = {
  'not-supported': { id: 'Browser ini tidak mendukung pengenalan suara.', en: 'This browser does not support speech recognition.' },
  'not-allowed': { id: 'Izin mikrofon ditolak. Aktifkan lewat pengaturan browser.', en: 'Microphone permission denied. Enable it in browser settings.' },
  'no-speech': { id: 'Tidak terdengar suara — coba lagi lebih dekat ke mikrofon.', en: 'No speech detected — try again closer to the mic.' },
  'audio-capture': { id: 'Mikrofon tidak ditemukan.', en: 'No microphone found.' },
  network: { id: 'Pengenalan suara butuh koneksi internet.', en: 'Speech recognition needs an internet connection.' },
};

export function SpeakSession({ items = [], startIndex = 0, level = DEFAULT_SPEAK_LEVEL, onExit }) {
  const { language } = useLanguage();
  const id = language === 'id';
  const { recordAnswer } = useItemProgress();
  const { unlockAchievement } = useAchievements();
  const { triggerEffect } = useEffectLayer();
  const { listenOnce, listening, error, clearError, supported } = useSpeechRecognition();
  const lv = speakLevel(level);
  const selfAssess = !supported;   // mode mandiri: tanpa penilaian, tanpa XP

  const [index, setIndex] = useState(Math.min(startIndex, Math.max(items.length - 1, 0)));
  const [result, setResult] = useState(null); // { verdict, heard, xp }
  const [totalXp, setTotalXp] = useState(0);
  const [busy, setBusy] = useState(false);
  const advanceRef = useRef(null);

  useEffect(() => () => clearTimeout(advanceRef.current), []);

  const item = items[index] || null;
  // Baris arti (prompt level Buta) & baris bacaan (romaji kana / arti kotoba / onyomi+kunyomi kanji).
  const artiText = item ? ((id ? (item.meaningId || item.meaning) : item.meaning) || '') : '';
  const readingText = item
    ? (item.kind === 'kanji' ? (item.readings || []).join('、') : (item.kind === 'kotoba' ? artiText : (item.meaning || '')))
    : '';

  const next = () => {
    clearTimeout(advanceRef.current);
    setResult(null);
    clearError();
    setIndex((i) => i + 1);
  };

  const handleListen = () => {
    if (item) playDramaticAudio(item.readings?.[0] || item.surface);
  };

  const handleSpeak = async () => {
    if (!item || busy || listening) return;
    setBusy(true);
    clearError();
    setResult(null);
    const heard = await listenOnce();
    setBusy(false);
    if (!heard.length) return; // pesan error tampil dari hook

    const best = matchSpeech(heard, [item.surface, ...(item.readings || [])]);
    const verdict = verdictOf(best.score);
    if (verdict === 'retry') {
      setResult({ verdict, heard: best.heard, xp: 0 });
      return;
    }
    const xp = speakXpFor(item, level);
    recordAnswer(item.id, true, xp);
    triggerEffect('correct');
    unlockAchievement?.('first_voice');
    setTotalXp((t) => t + xp);
    setResult({ verdict, heard: best.heard, xp });
    advanceRef.current = setTimeout(next, 1300);
  };

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 min-h-screen flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-3xl sm:text-4xl font-serif font-black text-sumi mb-3">
          {id ? 'Sesi selesai!' : 'Session complete!'}
        </h2>
        <p className="text-sm font-bold text-sumi/60 mb-8">
          {id ? `Total XP dari sesi ini: +${totalXp}` : `Total XP this session: +${totalXp}`}
        </p>
        <button
          type="button"
          onClick={onExit}
          className="px-8 py-4 bg-ai text-kinari-light border-[3px] border-sumi font-black uppercase tracking-widest shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all"
        >
          {id ? 'Kembali' : 'Back'}
        </button>
      </div>
    );
  }

  const errText = error ? (ERROR_TEXT[error] || { id: 'Gagal merekam. Coba lagi.', en: 'Recording failed. Try again.' })[id ? 'id' : 'en'] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-sumi/50">
          {index + 1} / {items.length} · +{totalXp} XP
        </span>
        <button
          type="button"
          onClick={onExit}
          className="text-[11px] font-black uppercase tracking-[0.2em] text-sumi/60 hover:text-shu transition-colors"
        >
          ✕ {id ? 'Keluar' : 'Exit'}
        </button>
      </div>

      <motion.div
        key={index}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-grow flex flex-col items-center justify-center text-center"
      >
        <div className="text-[80px] sm:text-[120px] font-serif font-black text-sumi leading-none mb-6 select-none">
          {lv.showText ? item.display : '？'}
        </div>
        {lv.showReading && readingText && (
          <p className="text-sm font-bold text-sumi/60 mb-2">{readingText}</p>
        )}
        {lv.showMeaning && item.kind === 'kanji' && (
          <p className="text-sm font-bold text-sumi/60 mb-2">{artiText}</p>
        )}
        {!lv.showText && (
          <p className="text-lg font-serif font-bold text-sumi mb-2">{artiText || '…'}</p>
        )}
        {item.sub && (
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sumi/40 mb-6">{item.sub}</span>
        )}

        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={handleListen}
            className="flex items-center gap-2 px-5 py-3 bg-kinari border-[3px] border-sumi font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Volume2 size={16} /> {id ? 'Dengar' : 'Listen'}
          </button>
          {selfAssess ? (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 bg-matcha text-kinari-light border-[3px] border-sumi font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <Check size={16} /> {id ? 'Sudah Baca' : 'Read ✓'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSpeak}
              disabled={busy || listening}
              className={`flex items-center gap-2 px-6 py-3 border-[3px] border-sumi font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 ${
                listening ? 'bg-shu text-kinari-light animate-pulse' : 'bg-ai text-kinari-light'
              }`}
            >
              <Mic size={16} /> {listening ? (id ? 'Mendengar…' : 'Listening…') : (id ? 'Ucapkan' : 'Speak')}
            </button>
          )}
          <button
            type="button"
            onClick={next}
            className="flex items-center gap-2 px-5 py-3 bg-kinari border-[3px] border-sumi/30 text-sumi/60 font-black text-xs uppercase tracking-widest active:translate-y-[2px] transition-all"
          >
            <SkipForward size={16} /> {id ? 'Lewati' : 'Skip'}
          </button>
        </div>

        {result && (
          <div
            className={`mt-6 px-5 py-3 border-[3px] border-sumi text-sm font-bold ${
              result.verdict === 'retry' ? 'bg-kinari text-shu' : 'bg-matcha text-kinari-light'
            }`}
          >
            {result.verdict === 'great' && (id ? `Sempurna! +${result.xp} XP` : `Perfect! +${result.xp} XP`)}
            {result.verdict === 'pass' && (id ? `Bagus! +${result.xp} XP` : `Nice! +${result.xp} XP`)}
            {result.verdict === 'retry' && (id ? 'Belum pas — coba lagi.' : 'Not quite — try again.')}
            {result.heard && (
              <span className="block text-[11px] font-bold opacity-70 mt-1">
                {id ? 'Terdengar: ' : 'Heard: '}{result.heard}
              </span>
            )}
          </div>
        )}

        {errText && (
          <div className="mt-6 px-5 py-3 border-[3px] border-dashed border-shu/50 text-shu text-xs font-bold">
            {errText}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default SpeakSession;
```

Verifikasi:

```bash
npm run lint > /tmp/lint_speak.txt 2>&1; echo "lint exit: $?"; grep -E "SpeakSession" /tmp/lint_speak.txt || echo "(clean)"
npm run build 2>&1 | grep -iE "built in|error" | head -2
```

Expected: `lint exit: 0`, `(clean)`, `✓ built`.

Commit:

```bash
git add src/features/speaking/SpeakSession.jsx
git commit -m "feat(speaking): SpeakSession - 3 level (pandu/ingat/buta) + mode mandiri + XP per level"
```

---

## Task 10 — `PoemSession.jsx`: sesi puisi baris-per-baris + furigana

**File:** `src/features/speaking/PoemSession.jsx` (baru)

Buat file:

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Mic, Check } from 'lucide-react';
import { Furigana } from './Furigana';
import { useSpeechRecognition } from './useSpeechRecognition';
import { matchSpeech, verdictOf } from './speechMatch';
import { lineReading, poemLineItems, speakXpFor, lineXpFor, DEFAULT_SPEAK_LEVEL } from './speaking';
import { useItemProgress, useAchievements, useUserStats } from '../progress/ProgressContext';
import { useEffectLayer } from '../effects/EffectContext';
import { useLanguage } from '../../context/LanguageContext';
import { playDramaticAudio } from '../../utils/audio';

export function PoemSession({ poem, level = DEFAULT_SPEAK_LEVEL, onExit }) {
  const { language } = useLanguage();
  const id = language === 'id';
  const { recordAnswer, itemProgress } = useItemProgress();
  const { unlockAchievement } = useAchievements();
  const { addXp } = useUserStats();
  const { triggerEffect } = useEffectLayer();
  const { listenOnce, listening, error, clearError, supported } = useSpeechRecognition();
  const selfAssess = !supported;   // mode mandiri: tanpa penilaian, tanpa XP, tanpa SRS

  const lines = poem?.lines || [];
  const [passed, setPassed] = useState({});     // { [lineIndex]: true }
  const [active, setActive] = useState(0);
  const [showFurigana, setShowFurigana] = useState(true);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [lineXp, setLineXp] = useState(0);      // total XP baris pada sesi ini
  const awardedRef = useRef(false);             // guard StrictMode double-effect

  const allPassed = lines.length > 0 && lines.every((_, i) => passed[i]);

  // Selesai semua baris → efek + achievement; SRS & XP puisi SEKALI (bukan mode mandiri).
  useEffect(() => {
    if (!allPassed || awardedRef.current) return;
    awardedRef.current = true;
    triggerEffect('correct');
    if (selfAssess) return;   // mode mandiri: tanpa penilaian, tanpa XP, tanpa SRS
    unlockAchievement?.('first_voice');
    recordAnswer(poem.id, true, speakXpFor({ kind: 'poem' }, level));
  }, [allPassed, selfAssess, poem?.id, level, recordAnswer, triggerEffect, unlockAchievement]);

  // Badge pembaca puisi: 3 puisi berbeda dengan correctCount >= 1.
  useEffect(() => {
    const count = Object.entries(itemProgress || {})
      .filter(([k, v]) => k.startsWith('poem_') && (v?.correctCount || 0) >= 1).length;
    if (count >= 3) unlockAchievement?.('poem_reciter');
  }, [itemProgress, unlockAchievement]);

  const markPassed = (i) => {
    setPassed((p) => ({ ...p, [i]: true }));
    const nextUnpassed = lines.findIndex((_, idx) => idx > i && !passed[idx] && idx !== i);
    if (nextUnpassed >= 0) setActive(nextUnpassed);
  };

  const speakLine = async (i) => {
    if (selfAssess) { markPassed(i); return; }   // mode mandiri: tandai dibaca, tanpa nilai/XP
    const item = poemLineItems(poem)[i];
    if (!item || busy || listening) return;
    setBusy(true);
    clearError();
    setResult(null);
    const heard = await listenOnce();
    setBusy(false);
    if (!heard.length) return;
    const best = matchSpeech(heard, [item.surface, ...item.readings]);
    const verdict = verdictOf(best.score);
    if (verdict === 'retry') {
      setResult({ line: i, verdict, heard: best.heard });
      return;
    }
    const xp = lineXpFor(level);
    addXp(xp);                      // XP per baris (tanpa SRS)
    setLineXp((t) => t + xp);
    markPassed(i);
    setResult({ line: i, verdict, heard: best.heard, xp });
  };

  if (!poem) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onExit}
          className="text-[11px] font-black uppercase tracking-[0.2em] text-sumi/60 hover:text-shu transition-colors"
        >
          ← {id ? 'Kembali' : 'Back'}
        </button>
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sumi/60 cursor-pointer select-none">
          <input type="checkbox" checked={showFurigana} onChange={(e) => setShowFurigana(e.target.checked)} />
          ふりがな
        </label>
      </div>

      <header className="mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-serif font-black text-sumi">
          <Furigana segments={lines[0]?.segments} show={showFurigana} />
        </h2>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sumi/50 mt-2">
          {poem.author} {poem.excerpt ? (id ? '· kutipan' : '· excerpt') : ''}
        </p>
      </header>

      <div className="flex flex-col gap-3 mb-8">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`border-[3px] border-sumi p-4 flex items-center gap-3 transition-colors ${
              passed[i] ? 'bg-matcha/15 border-matcha' : active === i ? 'bg-kinari shadow-[4px_4px_0_0_#1a1a1a]' : 'bg-kinari/60'
            }`}
          >
            <span className="text-2xl sm:text-3xl font-serif font-black text-sumi flex-grow leading-relaxed">
              <Furigana segments={line.segments} show={showFurigana} />
            </span>
            <button
              type="button"
              onClick={() => playDramaticAudio(lineReading(line))}
              className="shrink-0 w-9 h-9 border-[2px] border-sumi flex items-center justify-center active:translate-y-[2px] transition-all"
              title={id ? 'Dengar' : 'Listen'}
            >
              <Volume2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => speakLine(i)}
              disabled={busy || listening}
              className={`shrink-0 w-9 h-9 border-[2px] border-sumi flex items-center justify-center transition-all disabled:opacity-50 ${
                passed[i] ? 'bg-matcha text-kinari-light' : 'bg-ai text-kinari-light active:translate-y-[2px]'
              }`}
              title={selfAssess ? (id ? 'Tandai sudah dibaca' : 'Mark as read') : (id ? 'Ucapkan baris ini' : 'Speak this line')}
            >
              {passed[i] ? '✓' : (selfAssess ? <Check size={15} /> : <Mic size={15} />)}
            </button>
          </div>
        ))}
      </div>

      {result && (
        <div
          className={`px-5 py-3 border-[3px] border-sumi text-sm font-bold mb-6 ${
            result.verdict === 'retry' ? 'bg-kinari text-shu' : 'bg-matcha text-kinari-light'
          }`}
        >
          {result.verdict === 'retry'
            ? (id ? `Baris ${result.line + 1} belum pas — coba lagi.` : `Line ${result.line + 1} not quite — try again.`)
            : (id ? `Baris ${result.line + 1} ✓ +${result.xp} XP` : `Line ${result.line + 1} ✓ +${result.xp} XP`)}
          {result.heard && (
            <span className="block text-[11px] font-bold opacity-70 mt-1">
              {id ? 'Terdengar: ' : 'Heard: '}{result.heard}
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="px-5 py-3 border-[3px] border-dashed border-shu/50 text-shu text-xs font-bold mb-6">
          {error === 'not-supported'
            ? (id ? 'Browser ini tidak mendukung pengenalan suara.' : 'This browser does not support speech recognition.')
            : (id ? 'Gagal merekam. Coba lagi.' : 'Recording failed. Try again.')}
        </div>
      )}

      {allPassed && (
        <div className="mt-auto text-center border-[3px] border-sumi bg-matcha/15 p-6">
          <p className="text-lg font-serif font-black text-sumi mb-1">
            {id ? 'Puisi selesai! 🎉' : 'Poem complete! 🎉'}
          </p>
          <p className="text-xs font-bold text-sumi/60 mb-4">
            {selfAssess
              ? (id ? 'Mode mandiri — tanpa XP' : 'Self-assess — no XP')
              : (id
                ? `+${speakXpFor({ kind: 'poem' }, level)} XP puisi · +${lineXp} XP dari baris`
                : `+${speakXpFor({ kind: 'poem' }, level)} XP poem · +${lineXp} XP from lines`)}
          </p>
          <p className="text-xs font-bold text-sumi/70 mb-4">{id ? poem.meaning_id : poem.meaning}</p>
          <button
            type="button"
            onClick={onExit}
            className="px-6 py-3 bg-ai text-kinari-light border-[3px] border-sumi font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {id ? 'Kembali' : 'Back'}
          </button>
        </div>
      )}
    </div>
  );
}

export default PoemSession;
```

Verifikasi:

```bash
npm run lint > /tmp/lint_poem.txt 2>&1; echo "lint exit: $?"; grep -E "PoemSession" /tmp/lint_poem.txt || echo "(clean)"
npm run build 2>&1 | grep -iE "built in|error" | head -2
```

Expected: `lint exit: 0`, `(clean)`, `✓ built`.

Commit:

```bash
git add src/features/speaking/PoemSession.jsx
git commit -m "feat(speaking): PoemSession - XP per baris + XP puisi per level + mode mandiri"
```

---

## Task 11 — `src/pages/Speaking.jsx`: halaman 5 tab (kana/kotoba/kanji)

**File:** `src/pages/Speaking.jsx` (baru). Task 12 akan mengisi tab puisi; di task ini tab puisi boleh dirender sebagai grid kartu puisi (tanpa PoemSession) supaya halaman sudah jalan.

Buat file:

```jsx
import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Mic } from 'lucide-react';
import { SpeakSession } from '../features/speaking/SpeakSession';
import { Furigana } from '../features/speaking/Furigana';
import {
  kanaSpeakItems, kotobaSpeakItems, kanjiSpeakItems, filterKanaByType,
  SPEAK_LEVELS, DEFAULT_SPEAK_LEVEL,
} from '../features/speaking/speaking';
import { isSpeechRecognitionSupported } from '../features/speaking/useSpeechRecognition';
import { useItemProgress } from '../features/progress/ProgressContext';
import { useLanguage } from '../context/LanguageContext';
import hiraganaData from '../data/hiragana.json';
import katakanaData from '../data/katakana.json';
import kotobaData from '../data/kotoba.json';
import kanjiData from '../data/kanji.json';
import poemsData from '../data/poems.json';

const TABS = [
  { key: 'hiragana', label: 'Hiragana ひらがな' },
  { key: 'katakana', label: 'Katakana カタカナ' },
  { key: 'kotoba', label: 'Kotoba 言葉' },
  { key: 'kanji', label: 'Kanji 漢字' },
  { key: 'poem', label: 'Puisi 詩' },
];

const KANA_TYPES = [
  { key: 'all', label: 'Semua' },
  { key: 'seion', label: 'Seion' },
  { key: 'dakuon', label: 'Dakuon' },
  { key: 'handakuon', label: 'Handakuon' },
  { key: 'yoon', label: 'Yoon' },
];

const chip = (on) =>
  `px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] border-[3px] border-sumi transition-all ${
    on ? 'bg-shu text-kinari-light shadow-[2px_2px_0_0_#1a1a1a]' : 'bg-kinari text-sumi/60 hover:text-sumi'
  }`;

export function Speaking() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const id = language === 'id';
  const { itemProgress } = useItemProgress();

  const [tab, setTab] = useState('hiragana');
  const [kanaType, setKanaType] = useState('all');
  const [kotobaCategory, setKotobaCategory] = useState(() => kotobaData[0]?.category || '');
  const [kanjiCategory, setKanjiCategory] = useState(() => kanjiData[0]?.category || '');
  const [session, setSession] = useState(null);   // { items, index }
  const [poem, setPoem] = useState(null);
  const [level, setLevel] = useState(DEFAULT_SPEAK_LEVEL);

  const supported = isSpeechRecognitionSupported();

  const hiraganaItems = useMemo(
    () => kanaSpeakItems(filterKanaByType(hiraganaData, kanaType), 'hiragana'),
    [kanaType],
  );
  const katakanaItems = useMemo(() => kanaSpeakItems(katakanaData, 'katakana'), []);
  const kotobaCategories = useMemo(() => [...new Set(kotobaData.map((d) => d.category))], []);
  const kotobaItems = useMemo(
    () => kotobaSpeakItems(kotobaData.filter((d) => d.category === kotobaCategory)),
    [kotobaCategory],
  );
  const kanjiCategories = useMemo(() => [...new Set(kanjiData.map((d) => d.category))], []);
  const kanjiItems = useMemo(
    () => kanjiSpeakItems(kanjiData.filter((d) => d.category === kanjiCategory)),
    [kanjiCategory],
  );

  if (session) {
    return (
      <SpeakSession
        items={session.items}
        startIndex={session.index}
        level={level}
        onExit={() => setSession(null)}
      />
    );
  }
  if (poem) {
    return <PoemSession poem={poem} level={level} onExit={() => setPoem(null)} />;
  }

  const mastered = (itemId) => itemProgress[itemId]?.status === 'mastered';

  const itemGrid = (items, labelFn) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {items.map((it, i) => (
        <button
          key={it.id}
          type="button"
          onClick={() => setSession({ items, index: i })}
          className="bg-kinari border-[3px] border-sumi shadow-[3px_3px_0_0_#1a1a1a] hover:shadow-[1px_1px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-3 flex flex-col items-center gap-1 relative"
        >
          {mastered(it.id) && <span className="absolute top-1 right-1 text-[9px] text-matcha font-black">✓</span>}
          <span className="text-3xl font-serif font-black text-sumi leading-none">{it.display}</span>
          <span className="text-[10px] font-bold text-sumi/50 uppercase tracking-wider truncate w-full">
            {labelFn(it)}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> {id ? 'Kembali' : 'Back'}
      </button>

      <header className="mb-8 relative overflow-hidden">
        <h1 className="text-4xl sm:text-7xl md:text-8xl font-serif font-black text-sumi tracking-tighter relative z-10">
          話 <span className="text-shu">{id ? 'Latihan Bicara' : 'Speaking'}</span>
        </h1>
        <p className="text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-sumi/60 mt-4 sm:mt-6 relative z-10">
          {id
            ? 'Ucapkan kana, kotoba, kanji & puisi — 3 level: Pandu / Ingat / Buta'
            : 'Speak kana, words, kanji & poems — 3 levels: Guide / Recall / Blind'}
        </p>
      </header>

      {!supported && (
        <div className="mb-8 px-5 py-4 border-[3px] border-dashed border-shu/50 text-shu text-xs font-bold">
          {id
            ? '⚠️ Browser ini tidak mendukung pengenalan suara (coba Chrome/Edge). Mode latihan mandiri aktif: tombol "Sudah Baca" — tanpa penilaian & XP.'
            : '⚠️ This browser does not support speech recognition (try Chrome/Edge). Self-assess mode is active: "Read ✓" — no scoring & XP.'}
        </div>
      )}

      {/* Level kesulitan — bebas dipilih, tanpa gating */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sumi/50 mr-1">
          Level
        </span>
        {Object.values(SPEAK_LEVELS).map((l) => (
          <button key={l.key} type="button" onClick={() => setLevel(l.key)} className={chip(level === l.key)}>
            {l.label} · ×{l.xpMult}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-end gap-4 sm:gap-8 border-b-[2px] border-sumi/10 mb-8 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`pb-4 text-[10px] font-bold tracking-[0.3em] uppercase border-b-[4px] -mb-[2px] shrink-0 transition-colors ${
              tab === t.key ? 'border-ai text-ai' : 'border-transparent text-sumi/40 hover:text-sumi/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hiragana' && (
        <section>
          <div className="flex flex-wrap gap-2 mb-6">
            {KANA_TYPES.map((t) => (
              <button key={t.key} type="button" onClick={() => setKanaType(t.key)} className={chip(kanaType === t.key)}>
                {t.label}
              </button>
            ))}
          </div>
          {itemGrid(hiraganaItems, (it) => it.meaning)}
        </section>
      )}

      {tab === 'katakana' && (
        <section>{itemGrid(katakanaItems, (it) => it.meaning)}</section>
      )}

      {tab === 'kotoba' && (
        <section>
          <div className="mb-6">
            <select
              value={kotobaCategory}
              onChange={(e) => setKotobaCategory(e.target.value)}
              className="bg-kinari border-[3px] border-sumi px-4 py-2 text-xs font-black uppercase tracking-widest"
            >
              {kotobaCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {itemGrid(kotobaItems, (it) => (id ? it.meaningId : it.meaning))}
        </section>
      )}

      {tab === 'kanji' && (
        <section>
          <div className="flex flex-wrap gap-2 mb-6">
            {kanjiCategories.map((c) => (
              <button key={c} type="button" onClick={() => setKanjiCategory(c)} className={chip(kanjiCategory === c)}>
                {c}
              </button>
            ))}
          </div>
          {itemGrid(kanjiItems, (it) => (id ? it.meaningId : it.meaning))}
        </section>
      )}

      {tab === 'poem' && (
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {poemsData.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ y: -3 }}
                className="bg-kinari border-[3px] border-sumi shadow-[5px_5px_0_0_#1a1a1a] p-6 cursor-pointer"
                onClick={() => setPoem(p)}
              >
                <div className="text-xl font-serif font-black text-sumi mb-1">
                  <Furigana segments={p.lines[0]?.segments} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sumi/50">
                  {p.author} · {p.type}{p.excerpt ? (id ? ' · kutipan' : ' · excerpt') : ''}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Speaking;
```

**Catatan:** file ini mengimpor `PoemSession` — pastikan Task 10 sudah selesai (kalau belum, tambahkan `import { PoemSession } from '../features/speaking/PoemSession';` dulu dan task 10 file sudah ada).

Verifikasi:

```bash
npm run lint > /tmp/lint_page.txt 2>&1; echo "lint exit: $?"; grep -E "Speaking.jsx" /tmp/lint_page.txt || echo "(clean)"
npm run build 2>&1 | grep -iE "built in|error" | head -2
```

Expected: `lint exit: 0`, `(clean)`, `✓ built`.

Commit:

```bash
git add src/pages/Speaking.jsx
git commit -m "feat(speaking): halaman /speaking - 5 tab + chip level (pandu/ingat/buta)"
```

---

## Task 12 — Tab puisi: wiring `PoemSession`

**File:** `src/pages/Speaking.jsx` (edit)

Di Task 11, tab puisi sudah menampilkan kartu & `setPoem(p)` sudah ada, dan blok `if (poem) return <PoemSession .../>` sudah ada — **kalau begitu tidak ada yang perlu diubah**. Kalau saat Task 11 kamu menunda `PoemSession`, lakukan sekarang:

1. Tambahkan import di atas:
```jsx
import { PoemSession } from '../features/speaking/PoemSession';
```
2. Tambahkan blok sebelum `return` utama (setelah blok `if (session)`):
```jsx
  if (poem) {
    return <PoemSession poem={poem} level={level} onExit={() => setPoem(null)} />;
  }
```

Verifikasi:

```bash
npm run build 2>&1 | grep -iE "built in|error" | head -2
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: `✓ built`, test tetap hijau.

Commit (kalau ada perubahan):

```bash
git add src/pages/Speaking.jsx
git commit -m "feat(speaking): wiring PoemSession ke tab puisi"
```

---

## Task 13 — Route `/speaking` + kartu di Home

**File 1:** `src/App.jsx` (edit)
**File 2:** `src/pages/Home.jsx` (edit)

### 13a. `src/App.jsx`

1. Tambahkan import setelah `import { Writing } from "./pages/Writing";`:
```jsx
import { Speaking } from "./pages/Speaking";
```
2. Tambahkan route setelah `<Route path="/writing" element={<Writing />} />`:
```jsx
<Route path="/speaking" element={<Speaking />} />
```

### 13b. `src/pages/Home.jsx`

Cari kartu Writing (blok `<motion.div onClick={() => navigate('/writing')} ...>` yang berakhir dengan `</motion.div>` tepat sebelum `</div>` penutup daftar kartu). Tambahkan **setelah** kartu Writing:

```jsx
              <motion.div onClick={() => navigate('/speaking')} whileHover={{ backgroundColor: "rgba(24, 43, 73, 0.05)" }} className="p-6 sm:p-8 cursor-pointer flex items-center justify-between group transition-colors border-t-[4px] border-sumi">
                <div className="flex flex-col gap-2">
                  <h4 className="text-xl sm:text-2xl font-serif font-bold text-sumi group-hover:text-ai transition-colors">
                    {language === 'id' ? 'Latihan Bicara' : 'Speaking Practice'}
                  </h4>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                    {language === 'id' ? 'Ucapkan Kana, Kotoba & Puisi' : 'Speak Kana, Words & Poems'}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full border-[3px] border-ai text-ai flex items-center justify-center group-hover:bg-ai group-hover:text-kinari-light transition-all flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v1a7 7 0 0 1-14 0v-1"></path><line x1="12" y1="18" x2="12" y2="22"></line></svg>
                </div>
              </motion.div>
```

Verifikasi:

```bash
npm run build 2>&1 | grep -iE "built in|error" | head -2
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: `✓ built`, test hijau.

Commit:

```bash
git add src/App.jsx src/pages/Home.jsx
git commit -m "feat(speaking): route /speaking + kartu Latihan Bicara di Home"
```

---

## Task 14 — 2 achievement baru + dukungan puisi di Review

**File 1:** `src/features/progress/ProgressContext.jsx` (edit)
**File 2:** `src/pages/Review.jsx` (edit)

### 14a. Achievement baru

Di `ProgressContext.jsx`, cari blok achievement Writing (`first_stroke`, `blind_writer`, `blind_ten` — sekitar baris 97–99). Tambahkan **setelah** `blind_ten`:

```js
  first_voice: { label: '声', title: 'First Voice', desc: 'Selesaikan latihan bicara pertama' },
  poem_reciter: { label: '詩', title: 'Poem Reciter', desc: 'Selesaikan 3 puisi' },
```

(`unlockAchievement` sudah menolak id yang tidak ada di `ACHIEVEMENT_META`, jadi tambahkan dulu sebelum dipakai.)

### 14b. Review.jsx — supaya item puisi tidak hilang

1. Tambah import setelah `import kanjiData from "../data/kanji.json";`:
```jsx
import poemsData from "../data/poems.json";
```
2. Cari `const allData = [` (sekitar baris 18) dan tambahkan ke dalam array:
```js
  ...poemsData.map((p) => ({
    id: p.id,
    char: p.title,
    romaji: p.titleReading,
    meaning: p.meaning,
    meaning_id: p.meaning_id,
    type: 'poem',
  })),
```
3. Cari semua tempat yang mengecek `item.type === 'kotoba' || item.type === 'kanji'` (daftar pra-review) dan yang mengecek `isKotoba`/`isKanji` di sesi review — tambahkan puisi supaya arti tampil:
   * Di blok daftar: ubah `item.type === 'kotoba' || item.type === 'kanji' ? item.meaning : item.romaji` → `item.type === 'kotoba' || item.type === 'kanji' || item.type === 'poem' ? item.meaning : item.romaji`.
   * Di blok sesi: cari `const isKotoba = currentWeakChar.type === 'kotoba';` lalu tambahkan baris berikut di bawahnya:
```js
    const isPoem = currentWeakChar.type === 'poem';
```
   lalu grep `isKotoba` di file itu dan tambahkan `|| isPoem` pada kondisi yang menampilkan arti (biasanya `(isKotoba || isKanji)`).

Verifikasi (grep memastikan tidak ada sisa yang terlewat):

```bash
grep -n "isPoem\|type === 'poem'" src/pages/Review.jsx
npm run build 2>&1 | grep -iE "built in|error" | head -2
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: ada minimal 2 baris hasil grep (import map + kondisi), `✓ built`, test hijau. Verifikasi visual menyusul di Task 16 (setelah lulus puisi, buka `/review` dan pastikan judul puisi muncul).

Commit:

```bash
git add src/features/progress/ProgressContext.jsx src/pages/Review.jsx
git commit -m "feat(speaking): achievement first_voice/poem_reciter + Review dukung item puisi"
```

---

## Task 15 — Update PRD

**File:** `PRD.md` (edit)

1. Cari `### 9.10 N5 Challenge` dan ubah menjadi `### 9.11 N5 Challenge`.
2. Tambahkan section baru **sebelum** `### 9.11 N5 Challenge`:

```markdown
### 9.10 Speaking Practice (話)

* **[EXISTING]** Speech practice for Hiragana (104 incl. yoon), Katakana (46), Kotoba (876), Kanji (86), and Japanese poems (8 public-domain classics).
* **[EXISTING]** Pronunciation scored via Web Speech API (`ja-JP`) with kana-normalized fuzzy matching (katakana→hiragana, punctuation stripped, Levenshtein similarity ≥ 0.7 to pass).
* **[EXISTING]** Kanji items accept any onyomi/kunyomi reading (readings split from `、`, okurigana markers handled).
* **[EXISTING]** Three free-select difficulty levels (no gating): Pandu (all hints, ×1 XP), Ingat (text only, ×1.5), Buta (text hidden, meaning as prompt, ×2).
* **[EXISTING]** Poems render line-by-line with furigana (`<ruby>`), toggleable; each passed line awards 5 XP × level, and a completed poem is recorded as one SRS item (+25 XP × level).
* **[EXISTING]** XP base per content type: kana 8, kotoba 10, kanji 12, poem line 5, poem 25. Achievements: First Voice (声), Poem Reciter (詩, 3 poems).
* **[EXISTING]** Self-assess fallback ("Sudah Baca") for browsers without SpeechRecognition (Firefox) — no scoring, no XP, no SRS.
* **[PLANNED]** Poem categories (e.g. 百人一首) if requested.
```

3. (Opsional, konsisten) Di bagian IA/overview yang menyebut daftar fitur (baris ~48 dan ~61), tambahkan baris:
```
* **Speaking:** Microphone pronunciation practice for kana, kotoba, kanji, and poems (with furigana).
```

Verifikasi:

```bash
grep -n "9.10 Speaking\|9.11 N5" PRD.md
```

Expected: dua baris muncul (`### 9.10 Speaking Practice (話)` dan `### 9.11 N5 Challenge`).

Commit:

```bash
git add PRD.md
git commit -m "docs(prd): 9.10 Speaking (話) - kana/kotoba/kanji/puisi + furigana; N5 Challenge jadi 9.11"
```

---

## Task 16 — Final gate + verifikasi browser (mock SpeechRecognition)

### 16a. Final gate (semua hijau)

```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run lint > /tmp/lint_final.txt 2>&1; echo "lint exit: $?"
npm run build 2>&1 | grep -iE "built in|error" | head -2
git status -sb | head -1
```

Expected: `fail 0` dan total test **= 179** (155 lama + 11 speechMatch + 9 speaking + 4 poems); `lint exit: 0`; `✓ built`; branch `main...origin/main [ahead N]` (belum di-push — sesuai instruksi).

### 16b. Jalankan dev server

```bash
npm run dev
```

Catat port dari output (mis. `Local: http://localhost:5174/` — 5173 mungkin dipakai proses lama).

### 16c. Verifikasi browser (mock — TANPA mikrofon asli)

Pakai browser tool. Urutan langkah:

1. **Buka `/speaking`** → cek 5 tab render, grid hiragana berisi 104 tombol:
   ```js
   js("document.body.innerText.includes('Latihan Bicara') && [...document.querySelectorAll('button')].filter(b=>/^[ぁ-ん]$/.test(b.innerText.split('\\n')[0])).length")
   ```
   Expected: `true` dan `104` (atau 46 utk katakana tab).

2. **Inject mock SpeechRecognition** (ctor dibaca saat klik — tidak perlu reload):
   ```js
   js(`window.__mockSpeech = (texts) => {
     window.SpeechRecognition = class {
       constructor(){ this.lang=''; this.interimResults=false; this.maxAlternatives=1; this.continuous=false; }
       start(){ setTimeout(() => {
         this.onresult?.({ results: [ texts.map((t) => ({ transcript: t })) ] });
         this.onend?.();
       }, 150); }
       stop(){ this.onend?.(); }
       abort(){}
     };
   }; window.__mockSpeech(['あ']); 'ok'`)
   ```

3. **Sesi kana sukses**: buka tab Hiragana, klik kotak `あ` pertama, klik tombol `Ucapkan` (mock sudah set `あ`), tunggu ~1.5 s:
   ```js
   js("[...document.querySelectorAll('button')].find(b=>/Ucapkan|Speak/.test(b.innerText)).click()")
   ```
   Expected: chip level default = **Pandu**; muncul teks `Bagus!`/`Sempurna!` + `+8 XP`; `localStorage` XP naik **+8** (base 8, bonus streak round(8×1.05)=8); `itemProgress['hira_a'].streak >= 1`:
   ```js
   js("JSON.parse(localStorage.getItem('item_progress_v2'))['hira_a'].streak")
   ```

3b. **XP per level**: kembali ke `/speaking`, klik chip `Ingat · ×1.5`, buka item berikutnya, klik `Ucapkan` (mock `い`) → Expected: `+12 XP` (8 × 1.5); XP `localStorage` naik **+13** (round(12×1.05)). Chip `Buta · ×2` → `+16 XP` (round(16×1.05)=17).

4. **Sesi retry** (tanpa XP): set mock ke kata yang salah lalu klik `Ucapkan` lagi pada item berikutnya:
   ```js
   js("window.__mockSpeech(['んんん'])")
   ```
   Expected: teks `Belum pas — coba lagi.`, XP tidak berubah.

5. **Error path**: mock yang memicu `onerror`:
   ```js
   js(`window.__mockSpeech = () => { window.SpeechRecognition = class {
     constructor(){}
     start(){ setTimeout(() => { this.onerror?.({ error: 'not-allowed' }); this.onend?.(); }, 100); }
     stop(){} abort(){}
   }; }; 'ok'`)
   ```
   Klik `Ucapkan` → Expected: pesan izin mikrofon muncul (teks `Izin mikrofon ditolak`).

6. **Mode mandiri (not-supported)**: `js("delete window.SpeechRecognition; delete window.webkitSpeechRecognition; location.reload()")` → setelah reload: banner menyebut `Mode latihan mandiri aktif`, tombol utama jadi `Sudah Baca` (bukan `Ucapkan`). Klik `Sudah Baca` → item lanjut TANPA perubahan XP/SRS (`itemProgress` & XP `localStorage` tidak berubah).

7. **Sesi puisi + furigana**: buka tab `Puisi 詩` → klik kartu pertama (古池や) → cek `<ruby>`/`<rt>` ada dan berisi bacaan:
   ```js
   js("document.querySelectorAll('rt').length")   // Expected: >= 5 (ふるいけ, かわず, と, みず, おと)
   js("[...document.querySelectorAll('rt')].map(r=>r.textContent).join(',')") // mengandung 'ふるいけ'
   ```
   Lalu ucapkan 3 baris (mock per baris, klik tombol 🎤 tiap baris):
   ```js
   js("window.__mockSpeech(['ふるいけや'])")   // klik mic baris 1
   js("window.__mockSpeech(['かわずとびこむ'])") // klik mic baris 2
   js("window.__mockSpeech(['みずのおと'])")    // klik mic baris 3
   ```
   Expected: tiap baris `✓` dan menampilkan `+5 XP`; banner `Puisi selesai!` dengan `+25 XP puisi · +15 XP dari baris`; XP `localStorage` naik **+41** (3 × round(5×1.05)=5 + round(25×1.05)=26); dan `item_progress_v2['poem_basho_furuike'].correctCount === 1` (baris TIDAK masuk SRS — cek tidak ada key `poem_basho_furuike_l0`).

8. **Review menampilkan puisi**: buka `/review` → Expected: `古池や` muncul di daftar target review (membuktikan Task 14 jalan).

9. **Toggle furigana**: di PoemSession, uncheck `ふりがな` → `document.querySelectorAll('rt').length` jadi 0; check lagi → kembali.

10. Kill dev server setelah selesai:
    ```bash
    powershell -Command "Get-NetTCPConnection -LocalPort 5174 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force }"
    ```

### 16d. Catatan verifikasi manual (user)

Mock di atas menguji logika UI; **akurasi pengenalan suara asli** hanya bisa dites user langsung di Chrome/Edge (klik 🎤 → izinkan mikrofon → ucapkan). Ingatkan user untuk tes manual: buka `/speaking`, coba `あ`, `おはよう`, satu kanji (`一` — coba ucapkan `いち`), dan satu puisi.

### 16e. Commit terakhir (kalau ada sisa)

```bash
git add -A
git commit -m "chore(speaking): verifikasi E2E mock + rapikan sisa"
git log --oneline -8
```

Expected: rangkaian commit `feat(speaking): ...` terlihat; `git status -sb` → `main...origin/main [ahead N]` (**JANGAN push**).

---

## Tests / validation (ringkasan)

| File test | Fokus | Perkiraan test |
|---|---|---|
| `src/features/speaking/speechMatch.test.js` | normalisasi, Levenshtein, verdict, bacaan kanji | ~11 |
| `src/features/speaking/speaking.test.js` | item latihan, XP, level, helper puisi, filter | ~9 |
| `src/features/speaking/poems.test.js` | integritas data puisi + furigana wajib | ~4 |
| E2E browser (Task 16c) | alur sukses/retry/level/mode mandiri, furigana, XP, SRS, Review | manual script |

Aturan tetap: setiap task TDD (RED → GREEN → commit); `npm test` hijau penuh di akhir; `npm run lint` exit 0; `npm run build` sukses.

## Risks, tradeoffs, dan open questions

**Risks**
1. **Web Speech API butuh internet** (Chrome mengirim audio ke server Google) + HTTPS/localhost. PWA offline → pengenalan suara gagal (`network` error); TTS tetap jalan offline. Sudah ditangani dengan pesan error khusus.
2. **Dukungan browser**: Chrome/Edge desktop & Android ✓; Safari 14.5+ sebagian ✓; **Firefox ✗** → hanya banner + pesan. Fallback self-assess (tanpa mikrofon) sengaja belum dibuat (YAGNI) — tercatat `[PLANNED]` di PRD.
3. **Akurasi pengenalan** bervariasi (mic, aksen, noise). Mitigasi: threshold longgar (0.7), alternatif transcript (maxAlternatives=3), target ganda (bacaan + permukaan), retry **tidak** menghukum (tidak mencatat jawaban salah ke SRS).
4. **Furigana adalah data manual** — salah baca = salah belajar. Mitigasi: test integritas memaksa setiap segmen berkanji punya furigana kana murni (Task 4).
5. **`recordAnswer` untuk id puisi** bisa "hilang" dari Review kalau Task 14 terlewat → sudah dikunci dengan patch + verifikasi E2E langkah 8.
6. **StrictMode double-effect** pada penyelesaian puisi → dicegah `awardedRef` (Task 10).

**Tradeoffs**
* XP puisi diberikan sekali per penyelesaian penuh (bukan per baris) — lebih sederhana & menghindari SRS per baris; konsekuensinya tidak ada partial credit.
* Item speaking memakai id yang sama dengan item belajar (mis. `hira_a`, `v_ohayou`) → latihan bicara otomatis memperkuat SRS yang sudah ada (bagus), tapi stats `totalAnswered` ikut naik dari speaking (diterima).
* Tidak ada level kesulitan (beda dengan Writing) — knob kesulitan alami = pilihan konten (kana → kotoba → kanji → puisi).

**Open questions (untuk user)**
1. Perlu fallback "latihan mandiri" (tanpa mikrofon, tanpa XP) untuk Firefox? Sekarang hanya banner.
2. Perlu XP per baris puisi? Sekarang 25 XP saat puisi selesai.
3. Perlu lebih banyak puisi / kategori puisi (mis. 百人一首 khusus)? Data tinggal ditambah di `poems.json` mengikuti skema.
4. Perlu level kesulitan speaking seperti fitur Writing (bebas dipilih)?


---

## Log Eksekusi (26/09/2026)

Status: **SELESAI** — 12 commit lokal (`acb607b..55770fc`), belum di-push (sesuai aturan repo).

| Task | Commit | Hasil gate |
|---|---|---|
| 1 — normalisasi teks | `acb607b` | speechMatch 3/3 |
| 2 — similarity + verdict | `49e6c3e` | speechMatch 8/8 |
| 3 — bacaan kanji | `802fc12` | speechMatch 11/11 |
| 4+5 — data puisi (digabung, lihat catatan) | `4c299d7` | poems 4/4 |
| 6 — item latihan + XP + 3 level | `0d0c76a` | speaking 9/9, poems 4/4 |
| 7+8 — Furigana + hook | `d97862c` | lint exit 0 |
| 9 — SpeakSession | `bbce12d` | lint clean |
| 10 — PoemSession | `0d837e5` | lint clean |
| 11+12 — halaman + wiring puisi | `95f0371` | lint clean |
| 13 — route + kartu Home | `1617ee4` | build ✓, bundle memuat halaman (grep "Latihan Bicara" di dist) |
| 14 — achievement + Review puisi | `8e4f29b` | build ✓ |
| 15 — PRD 9.10/9.11 | `55770fc` | grep 2 baris ✓ |
| 16 — final gate | — | **179 pass / 0 fail** · lint exit 0 · build ✓ · `main` ahead 12 |

**Catatan penyimpangan dari plan (test contract menang):**
1. Task 4 & 5 digabung satu commit: test integritas Task 4 sudah mengunci `POEMS.length === 8`, jadi memisah 4+4 akan meninggalkan commit merah. Data ditulis 8 sekaligus.
2. Task 6 jumlah test aktual **9** (plan menulis 8 setelah revisi — test level menambah 2 blok, test XP lama jadi 1 blok baru; total suite tetap 179 = prediksi gate).
3. Task 12 tanpa perubahan kode (wiring sudah ada di Task 11, sesuai catatan plan).

**Bukti browser (mock SpeechRecognition, tanpa mikrofon asli):**
- `/speaking`: 5 tab render, grid hiragana **104 tombol** (46 seion + 20 dakuon + 5 handakuon + 33 yoon), 3 chip level.
- Sukses kana `あ` → `Perfect! +8 XP`, XP 8, SRS `hira_a` streak 1.
- Level Ingat `い` → `+12 XP` (8×1.5), stored +13 (round 12×1.05).
- Retry `んんん` → `Not quite — try again.`, XP tidak berubah (21→21).
- Error `not-allowed` → pesan izin mikrofon tampil.
- Mode mandiri (API dihapus + re-render) → tombol `Read ✓`, XP & SRS tidak berubah.
- Puisi 古池や: furigana `<ruby>/<rt>` tampil (toggle 6→0→6), 3 baris `✓ +5 XP`, selesai → `+25 XP poem · +15 XP from lines`, XP total 62, SRS `poem_basho_furuike` correctCount 1, **tidak ada key baris** (`_l`) di SRS.
- `/review`: 古池や muncul di daftar target + sesi review menampilkan soal puisi (distractor dari puisi lain, tidak crash).
- Level Buta kanji 一 → teks `？` + arti sebagai prompt; ucapkan `いち` → `Perfect! +24 XP` (12×2).


## Log Revisi UX (26/09/2026 — pasca E2E, laporan user)

Dua putaran revisi setelah fitur live, semua diverifikasi di browser (emulasi 390px + hit-test `elementFromPoint`):

### Putaran 1 — `8fde89d` fix(speaking): grid padat + Buta kana dengar-tirukan
| Keluhan user | Bukti terukur sebelum | Fix | Bukti sesudah |
|---|---|---|---|
| Grid kana "makan tempat, gak rapih" | 2 kolom, grid 4720px, halaman 5214px | Grid padat 5 kolom (HP) / 10 (desktop), tombol 65×62px | Grid 1452px (−69%), halaman 1946px (−63%), yoon きゃ 48px < 65px tanpa overflow |
| Mode Buta kana "sama aja bohong" (romaji terlihat) | prompt = romaji `a` = bacaan itu sendiri | `speakPromptKind(item, level)`: kana+Buta → `'audio'`; prompt 🎧 + tombol "Putar & Tirukan", teks & romaji disembunyikan | `leakedRomaji: false`, `hasHeadphone: true`, `hasPlayBtn: true` |
| Bonus: arti dobel di Buta kanji | `One` tampil 2× | hapus render duplikat | `meaningShownTimes: 1`, verdict tetap `Perfect +24 XP` |

Test baru: `speakPromptKind` (kana→audio, kotoba/kanji→meaning, pandu/ingat→text). Suite 179 → **180 pass**.

### Putaran 2 — `bf302d9` fix(speaking): back button sesi pindah kiri + turun dari TopControls
| Keluhan user | Bukti terukur sebelum | Fix | Bukti sesudah |
|---|---|---|---|
| "Tombol back pas listening gak keliatan kalo di hp ketutupan" | Tombol `✕ Keluar` di kanan-atas (x323–374, y32–49) PERSIS di dalam area TopControls global (x111–374, y16–48, z-50) → `overlap: true`, hit-test mengembalikan chip TopControls | Tombol back pindah ke KIRI (pola Writing/Practice: `text-[10px] flex items-center gap-2` + `←`), container `py-8` → `pt-14 pb-8 sm:py-16` di SpeakSession + PoemSession | HP 390px: back x16 y57, `backHitOK: true`, `backOverlapTC: false`; state LISTENING aktif (`listeningActive: true`) back tetap bisa diklik; desktop 1264px: back x328 y65, no overlap |
| Akar masalah | `TopControls` di `App.jsx` = `fixed top-4 right-4 z-50`, semua kontrol kanan-atas halaman ketutupan | — | Toggle furigana PoemSession juga diverifikasi aman (y57 > tcBottom 48, hit-test OK) |

Verifikasi klik nyata: back diklik → kembali ke grid halaman speaking ✓.

**Gate akhir kedua putaran:** `npm test` 180/180 · lint exit 0 · build ✓ · `main` ahead 16, belum di-push.
