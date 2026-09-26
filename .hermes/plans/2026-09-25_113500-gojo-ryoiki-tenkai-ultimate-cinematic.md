# 領域展開・無量空処 — Cinematic Ultimate (bar energi kutukan 呪力 + Six Eyes hint, persist sampai salah)

> **Plan ini MENGGANTIKAN** `.hermes/plans/2026-09-25_103529-gojo-streak50-ryoiki-tenkai-brainstorm.md`
> (versi lama: domain otomatis di streak 50/100 + durasi tetap). Arah baru dari user:
> domain = **bar energi kutukan 呪力** (bar vertikal tepi kanan, keisi tiap jawaban benar,
> penuh di **20 benar beruntun** → tap bar = cast), cinematic berurutan
> (gelap → teks → mata Six Eyes → bigbang + bercak angkasa), **persist sampai jawab salah**,
> dan selama domain hidup **Six Eyes 六眼** = skill pasif: opsi jawaban BENAR berkilau
> biru-putih **tiap 5 dtk (±1,4 dtk nyala)** (murni CSS, nol timer).
> Auto domain di streak 50/100 **DIHAPUS** (50 & 100 kembali jadi murasaki).

## Goal

**Bar energi kutukan 呪力** (vertikal di tepi KANAN layar) muncul selama sesi kuis pack
Gojo: mulai kosong, **keisi dari bawah ke atas** tiap jawaban benar (+1 dari 20) — tiap
kenaikan ada **letupan aura** di garis isi, dan makin penuh aura ambient makin nyala.
Saat penuh (20 benar beruntun) label **領域展開** muncul + bar berdenyut → **tap bar** =
cinematic: layar menggelap hitam kecuali area kuis → teks **領域展開** lalu **無量空処**
muncul per-karakter (berurutan) → **mata Six Eyes** di atas teks membuka → **bigbang** di
tengah + **bercak ruang angkasa di pinggir kuis** → teks/mata mengecil ke atas (settle) dan
**domain tetap hidup sampai user menjawab salah** (bar ikut kosong lagi).
Selama domain hidup, **Six Eyes 六眼** memberi hint pasif: opsi jawaban BENAR berkilau
biru-putih **tiap 5 detik (±1,4 dtk nyala)** — berhenti sendiri saat domain padam.

## Current context / assumptions

### Kondisi repo (ground truth)

- Branch `feat/gojo-pack7-dummy`, working dir `C:\Users\maddo\Documents\japanese-quiz`.
- **JANGAN PUSH** (standing instruction user). Commit lokal saja; origin cuma punya `main`.
- `npm test` → **161 pass / 0 fail** (59 test di `gojoFx.test.js`). Lint 0 error. Dev server 5173.
- DevPanel (Settings, dev-only) sudah punya preview streak: `previewStreak(target)` di
  `EffectContext` — set streak ke `target-1` lalu tembak satu `correct` (mendarat tepat di target).
- Tombol DevPanel saat ini: `茈 #3`, `Domain #50`, `Zenith #100`, `茈 #10`.

### Keputusan user (dari klarifikasi)

| Pertanyaan | Jawaban user |
|---|---|
| Pemicu domain | **Tombol ultimate saja** — auto di streak 50/100 DIHAPUS |
| Kapan tombol nyala | **20 benar beruntun** |
| Suara | **Tanpa voice/klip dulu** — teks tetap berurutan pakai timing + **dentuman synth** |
| Charge setelah cast | **HABIS** — kumpulkan 20 benar beruntun lagi |
| Bola 蒼/赫 saat cast | **TETAP mengambang di pinggir** selama domain aktif (JANGAN di-reset) |
| Teks & Six Eyes setelah bigbang | **Mengecil & naik ke atas** — kartu soal kebaca lagi |
| Dentuman synth | **2×** — saat cast + saat bigbang |
| Bentuk tombol ult | **Bar energi kutukan 呪力 vertikal di tepi KANAN**, isi naik dari BAWAH ke atas |
| Kapan bar tampil | **Selama sesi kuis** (pack Gojo) — mulai kosong, keisi tiap jawaban benar |
| Cara cast | **Tap bar langsung** saat penuh (20/20) |
| Efek "aura" | Tiap +1 benar = **letupan aura** di garis isi; aura ambient makin nyala saat mendekati penuh |
| Hint Six Eyes 六眼 | Selama domain: opsi jawaban BENAR berkilau **tiap 5 dtk, nyala ±1,4 dtk** |
| Visual hint | **Kilau biru-putih ala Six Eyes** (pulse glow di opsi benar) |
| Mode kuis dgn hint | **Semua**: Practice (kana), Grammar, Review, /mondai |

### File yang terlibat

| File | Peran | Perubahan |
|---|---|---|
| `src/features/effects/gojoFx.js` | logika murni | **UBAH** `techniqueForStreak` (buang domain), **TAMBAH** `GOJO_ULT_THRESHOLD`, `gojoUltReady`, `gojoDomainTimeline`, `gojoSequentialChars`, `gojoNebulaSpots`, `GOJO_NEBULA_COLORS` |
| `src/features/effects/gojoFx.test.js` | test murni (59 test) | **UBAH** 2 test lama (50/100 bukan domain lagi, kontrak previewStreak), **TAMBAH** 8 test baru (net +7) |
| `src/utils/sfx.js` | synth Web Audio | **TAMBAH** `domainBoomParams`, `playDomainBoom` |
| `src/utils/sfx.params.test.js` | test params synth | **TAMBAH** 2 test |
| `src/features/effects/GojoDomainCine.jsx` | **FILE BARU** | Komponen cinematic + **bar energi kutukan `GojoCurseBar`** |
| `src/features/effects/EffectContext.jsx` | state efek global | **TAMBAH** state domain/charge/quizActive + `castDomain()` + `endQuizSession()` + render cine & bar; clear saat salah/reset; set `data-gojo-domain` di `<html>` selama domain (hint Six Eyes) |
| `src/index.css` | style global | **TAMBAH** keyframes `gojoSixEyesHint` + rule `html[data-gojo-domain='on'] button[data-correct]:not(:disabled)` (pulse 5 dtk; reduced-motion → garis statis) |
| `src/features/effects/GojoBurst.jsx` | render ledakan per jawaban | **HAPUS** jalur domain (dead code setelah auto dihapus) |
| `src/pages/Practice.jsx` | 2 wrapper kuis + 3 call site akhir sesi | **TAMBAH** `data-quiz-area` (2 tempat) + `data-correct` (2 tempat) + `endQuizSession()` di onBack/onPlayAgain/onGoHome |
| `src/features/quiz/KanaQuiz.jsx` | wrapper kuis | **TAMBAH** `data-quiz-area` + `data-correct` |
| `src/pages/Review.jsx` | wrapper kuis | **TAMBAH** `data-quiz-area` + `data-correct` + cleanup `endQuizSession()` |
| `src/features/quiz/Quiz.jsx` | wrapper kuis `/mondai` (via `MondaiChapterFlow`) | **TAMBAH** `data-quiz-area` + `data-correct` + cleanup `endQuizSession()` |
| `src/features/quiz/MondaiQuiz.jsx` | **DEAD CODE** (tidak dirutekan) | JANGAN diubah — `/mondai` memakai `Quiz.jsx` |
| `src/features/dev/DevPanel.jsx` | panel cheat | **UBAH** tombol preview (#50/#100 → #50/#100 murasaki) + tombol cast & charge ult |

### Kenapa `data-quiz-area` (spotlight "gelap kecuali quiz")

Efek gelap = satu div transparan **seukuran area kuis** dengan `box-shadow: 0 0 0 100vmax rgba(2,2,6,0.94)`
(trik spotlight: bayangan raksasa menutupi seluruh layar, div-nya sendiri jadi "lubang").
Posisi lubang diukur dari elemen `[data-quiz-area]` (wrapper kartu soal + opsi jawaban)
saat cast & saat resize. Wrapper itu ada di 5 tempat (2 di Practice, 1 di KanaQuiz,
1 di Review, 1 di Quiz) — semuanya sudah ada, cuma perlu 1 atribut.
Catatan: `MondaiQuiz.jsx` **dead code** (tidak dirutekan; `/mondai` memakai `Quiz.jsx`
lewat `MondaiChapterFlow`) → JANGAN disentuh.

### Timeline cinematic (angka final)

```
0.0s  gelap (spotlight fade-in 0.5s)
0.35s 領域展開 muncul per-karakter (0.28s/karakter)   ┐
0.9s  mata Six Eyes muncul & membuka (1.2s)           ├─ fase "ngomong"
1.5s 無量空処 muncul per-karakter (0.32s/karakter)    ┘
2.9s BIGBANG di tengah (flash + ring, 0.7s) + bercak nebula pinggir mulai
3.7s settle: blok (mata+teks) naik ke atas & mengecil (0.7s) → kartu soal kebaca lagi
4.4s+ PERSIST: void + bercak pinggir + bintang berkelip + teks kecil di atas
      + HINT Six Eyes: tiap 5 dtk opsi jawaban BENAR berkilau ±1,4 dtk (murni CSS)
      ... sampai user jawab SALAH (fade-out 0.6s + bar kosong lagi)
```

### Asumsi

- Domain hanya untuk pack `pack_07` (visual `gojo`); pack lain tidak terpengaruh.
- Overlay cine `pointer-events-none` → user **tetap bisa** klik opsi jawaban saat domain persist.
- HP = `window.innerWidth < GOJO_BALL_BREAKPOINT` (768, sudah ada) → jumlah bintang/bercak dikurangi.
- `prefers-reduced-motion` → semua fase tanpa animasi (langsung state akhir), persist tetap.
- Dentuman synth 2×: saat cast (`cast`) & saat bigbang (`bang`). Suara jawaban Gojo tetap SENYAP.
- Hint Six Eyes = CSS murni (tanpa timer JS): `<html data-gojo-domain='on'>` + `button[data-correct]`;
  otomatis mati saat tombol dijawab (disabled), domain padam, atau `prefers-reduced-motion` (statis).

## Architecture / proposed approach

Domain dipisah dari pipeline `fx` (jawaban): state baru `domainOn` + `domainSeed` di
`EffectProvider`, dirender `GojoDomainCine` (file baru) di dalam `EffectLayer` — **di
belakang** bola `GojoSpheres` & burst, supaya bola/ledakan tetap terlihat di atas void.
**Bar energi kutukan `GojoCurseBar`** (satu file dengan cine) dirender di `EffectLayer`
saat `quizActive` (sesi kuis berjalan — di-set oleh `resetEffectStreak` di semua titik
mulai kuis, dibersihkan `endQuizSession`); isinya dari state `ultCharge` (0..20, di-update
`gojoCurseCharge(streak)` di `triggerEffect`); `ready` = charge penuh & domain belum aktif.
Semua angka fase di `gojoDomainTimeline()` dan semua angka visual domain di komponen
(satu titik tune per bagian). **Hint Six Eyes** tidak menambah state/timer: `EffectProvider`
cuma menandai `<html data-gojo-domain='on'>` selama `gojoDomain`, dan `src/index.css`
memulse `button[data-correct]:not(:disabled)` (siklus 5 dtk, ±1,4 dtk nyala).

## Step-by-step tasks

Semua perintah dari root repo. TDD: RED → GREEN → commit per task. **Jangan push.**

### Task 0 — Baseline

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"
```

Harapan: `ℹ pass 161`, `ℹ fail 0`. Kalau tidak → STOP, perbaiki dulu.

---

### Task 1 — TDD: `gojoCurseCharge` + `gojoUltReady` + buang domain dari `techniqueForStreak`

**1a. RED — `src/features/effects/gojoFx.test.js`.**

Ubah baris import (baris 3–15): tambahkan **hanya** `GOJO_ULT_THRESHOLD, gojoUltReady, gojoCurseCharge`. **JANGAN** tambahkan simbol Task 2–3 sekarang: named import yang belum diekspor membuat SELURUH file test gagal load (bukan cuma 1 test). Task 2 & 3 menambahkan importnya masing-masing:

```js
import {
  gojoTechniqueFor, gojoPreviewStreak, isGojoMilestone, gojoCrackCount, gojoParticles, GOJO_STYLE,
  gojoSpheres, gojoBolts, gojoBoltPath, gojoStars,
  GOJO_VOID, GOJO_RIM,
  GOJO_INK, GOJO_FLASH, gojoImpactFocus, gojoImpactStar,
  gojoSpeedLines, gojoHalftone, gojoOno,
  GOJO_CORE, gojoSphereShape, gojoOrbitRings, gojoRibbons, gojoTendrils, gojoHalo,
  gojoSphereAnim, nextGojoBalls, GOJO_BALLS_EMPTY,
  gojoBallLabel, gojoBallAura, gojoTensionLines, gojoCharge,
  darkenHex, gojoBallVignette,
  gojoBallLayout, GOJO_BALL_BREAKPOINT,
  gojoMurasakiBurst,
  GOJO_ULT_THRESHOLD, gojoUltReady, gojoCurseCharge,
} from './gojoFx.js';
```

**GANTI** test lama `gojoTechniqueFor: 50 = domain, 100 = domain_zenith` (baris ~42–46) dengan:

```js
test('gojoTechniqueFor: 50/100 = murasaki (domain kini dari bar energi kutukan)', () => {
  assert.equal(gojoTechniqueFor('streak', 50), 'murasaki');
  assert.equal(gojoTechniqueFor('streak', 100), 'murasaki');
});

test('gojoTechniqueFor: TIDAK PERNAH mengembalikan domain', () => {
  for (let s = 1; s <= 200; s++) {
    const t = gojoTechniqueFor('streak', s);
    assert.ok(t !== 'domain' && t !== 'domain_zenith', `streak ${s} → ${t}`);
  }
});
```

Di test `gojoPreviewStreak: set target-1 ...` (baris ~56–64) **UBAH 2 assertion**:

```js
  assert.equal(gojoTechniqueFor('correct', gojoPreviewStreak(3) + 1), 'murasaki');
  assert.equal(gojoTechniqueFor('correct', gojoPreviewStreak(50) + 1), 'murasaki');   // 50: kini murasaki
  assert.equal(gojoTechniqueFor('correct', gojoPreviewStreak(100) + 1), 'murasaki');  // 100: kini murasaki
```

Tambah test baru (sisipkan setelah blok preview streak, ~baris 78):

```js
// ── Energi kutukan 呪力 (bar, bukan streak) ─────────────────────────────────

test('gojoCurseCharge: clamp 0..20 (bar keisi tiap benar, berhenti di penuh)', () => {
  assert.equal(GOJO_ULT_THRESHOLD, 20);
  assert.equal(gojoCurseCharge(0), 0);
  assert.equal(gojoCurseCharge(7), 7);
  assert.equal(gojoCurseCharge(20), 20);
  assert.equal(gojoCurseCharge(35), 20, 'tidak lebih dari penuh');
  for (const bad of [-3, NaN, Infinity, null, undefined, '12']) {
    assert.equal(gojoCurseCharge(bad), 0, `input ${String(bad)}`);
  }
});

test('gojoUltReady: nyala tepat di 20 benar beruntun, aman utk input aneh', () => {
  assert.equal(GOJO_ULT_THRESHOLD, 20);
  assert.equal(gojoUltReady(19), false);
  assert.equal(gojoUltReady(20), true);
  assert.equal(gojoUltReady(21), true);
  for (const bad of [0, -3, NaN, Infinity, null, undefined, '20']) {
    assert.equal(gojoUltReady(bad), false, `input ${String(bad)}`);
  }
});
```

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)|does not provide"
```

Harapan RED: `does not provide an export named 'GOJO_ULT_THRESHOLD'` (atau salah satu dari 3) + seluruh file test gagal load (`ℹ fail 1`).

**1b. GREEN — `src/features/effects/gojoFx.js`.**

Ganti fungsi `techniqueForStreak` (baris ~33–42) jadi:

```js
// Teknik untuk satu streak. streak = jumlah jawaban benar beruntun.
// 50 & 100 TIDAK lagi memicu domain — domain hanya dari bar energi kutukan.
const techniqueForStreak = (streak) => {
  if (isGojoMilestone(streak)) return 'murasaki';
  if (streak === 1) return 'ao';
  if (streak === 2) return 'aka';
  const msInRange = GOJO_MILESTONES.filter((m) => m >= 4 && m <= streak).length;
  const idx = (streak - 3) - msInRange - 1;
  return idx % 2 === 0 ? 'ao' : 'aka';
};
```

Tambah setelah `gojoTechniqueFor` (setelah baris ~48):

```js
// ── Energi kutukan 呪力 (bar ultimate, dipicu tap — bukan streak) ────────────
// Charge penuh = 20 jawaban benar beruntun. Bar muncul selama sesi kuis,
// keisi naik dari bawah ke atas; tap saat penuh = cast 領域展開.
export const GOJO_ULT_THRESHOLD = 20;

// Charge bar dari streak sekarang: 0..20 (clamp — bar berhenti di penuh).
export const gojoCurseCharge = (streak) =>
  (Number.isFinite(streak) && streak > 0)
    ? Math.min(GOJO_ULT_THRESHOLD, Math.floor(streak))
    : 0;

export const gojoUltReady = (streak) =>
  Number.isFinite(streak) && streak >= GOJO_ULT_THRESHOLD;
```

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"
```

Harapan GREEN: `ℹ pass 164`, `ℹ fail 0`.

**1c. Commit:**

```bash
git add src/features/effects/gojoFx.js src/features/effects/gojoFx.test.js
git commit -m "feat(gojo): domain tidak lagi dari streak 50/100 (kembali murasaki) + charge energi kutukan gojoCurseCharge (0..20)"
```

---

### Task 2 — TDD: `gojoDomainTimeline` + `gojoSequentialChars`

**2a. RED — tambah test di `gojoFx.test.js`** (setelah test `gojoUltReady`):

```js
// ── Timeline cinematic & teks berurutan ─────────────────────────────────────

test('gojoDomainTimeline: urut naik, deterministik, durasi wajar', () => {
  const t = gojoDomainTimeline();
  assert.deepEqual(t, gojoDomainTimeline());
  assert.ok(t.darkDur > 0 && t.darkDur <= 1, 'fade gelap wajar');
  assert.ok(t.text2Start >= t.text1Start + 4 * t.text1Char, 'teks 2 mulai setelah teks 1 selesai');
  assert.ok(t.bangStart >= t.text2Start + 4 * t.text2Char, 'bigbang setelah semua teks muncul');
  assert.ok(t.settleStart >= t.bangStart + t.bangDur, 'settle setelah bigbang selesai');
  assert.ok(t.eyesStart >= t.text1Start, 'mata muncul saat teks mulai');
  assert.ok(t.eyesOpenDur > 0.4 && t.eyesOpenDur <= 2, 'buka mata wajar');
});

test('gojoSequentialChars: 1 entry/karakter, delay naik, deterministik', () => {
  const a = gojoSequentialChars('領域展開', 0.5, 0.25);
  assert.deepEqual(a, gojoSequentialChars('領域展開', 0.5, 0.25));
  assert.equal(a.length, 4);
  assert.deepEqual(a.map((x) => x.ch), ['領', '域', '展', '開']);
  assert.deepEqual(a.map((x) => x.delayMs), [500, 750, 1000, 1250]);
  assert.deepEqual(gojoSequentialChars('', 0, 1), []);
  assert.deepEqual(gojoSequentialChars(null, 0, 1), []);
});
```

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)|does not provide"
```

Harapan RED: `does not provide an export named 'gojoDomainTimeline'` + `ℹ fail 1`.

**2b. GREEN — `gojoFx.js`**, sisipkan setelah `gojoUltReady`:

```js
// ── Timeline cinematic 領域展開 (semua waktu di SATU tempat) ────────────────
// Fase: gelap → teks 領域展開 per-karakter → teks 無量空処 per-karakter (mata
// membuka bersamaan) → bigbang → settle (teks mengecil ke atas) → persist.
export const gojoDomainTimeline = () => ({
  darkDur: 0.5,        // fade-in gelap (spotlight)
  text1Start: 0.35,    // 領域展開 mulai
  text1Char: 0.28,     // jeda per karakter
  text2Start: 1.5,     // 無量空処 mulai (setelah teks 1 selesai)
  text2Char: 0.32,
  eyesStart: 0.9,      // Six Eyes muncul (barengan teks 1)
  eyesOpenDur: 1.2,    // nutup → kebuka
  bangStart: 2.9,      // bigbang di tengah (setelah "ngomong" selesai)
  bangDur: 0.7,
  nebulaStart: 3.0,    // bercak ruang angkasa pinggir mulai
  settleStart: 3.7,    // blok mata+teks naik & mengecil
  settleDur: 0.7,
});

// Pecah teks jadi karakter dengan delay bertambah (ms) → dipakai komponen untuk
// memunculkan teks satu-per-satu. Murni & deterministik.
export const gojoSequentialChars = (text, start = 0, perChar = 0.25) => {
  const chars = [...String(text || '')];
  return chars.map((ch, i) => ({ ch, delayMs: Math.round((start + i * perChar) * 1000) }));
};
```

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"
```

Harapan GREEN: `ℹ pass 166`, `ℹ fail 0`.

**2c. Commit:**

```bash
git add src/features/effects/gojoFx.js src/features/effects/gojoFx.test.js
git commit -m "feat(gojo): timeline cinematic domain + teks berurutan per-karakter (gojoDomainTimeline, gojoSequentialChars)"
```

---

### Task 3 — TDD: `gojoNebulaSpots` (bercak ruang angkasa di pinggir)

**3a. RED — tambah test di `gojoFx.test.js`:**

```js
// ── Bercak ruang angkasa (pinggir kuis) ─────────────────────────────────────

test('gojoNebulaSpots: deterministik & jumlah sesuai', () => {
  const a = gojoNebulaSpots(1, 8, () => 0.5);
  assert.deepEqual(a, gojoNebulaSpots(1, 8, () => 0.5));
  assert.equal(a.length, 8);
  assert.equal(new Set(a.map((s) => s.id)).size, 8, 'id unik');
});

test('gojoNebulaSpots: semua di PINGGIR, warna dari palet, angka sehat', () => {
  for (let seed = 1; seed <= 5; seed++) {
    for (const s of gojoNebulaSpots(seed, 8, () => 0.5)) {
      const edge = s.x <= 22 || s.x >= 78 || s.y <= 22 || s.y >= 78;
      assert.ok(edge, `seed ${seed}: spot (${s.x.toFixed(1)},${s.y.toFixed(1)}) harus di pinggir`);
      assert.ok(GOJO_NEBULA_COLORS.includes(s.color), 'warna dari palet');
      assert.ok(s.size > 0 && s.opacity > 0 && s.opacity < 1, 'size/opacity sehat');
      assert.ok(s.delay >= 0 && s.delay <= 1, 'delay wajar');
    }
  }
});
```

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)|does not provide"
```

Harapan RED: `does not provide an export named 'gojoNebulaSpots'` + `ℹ fail 1`.

**3b. GREEN — `gojoFx.js`**, sisipkan setelah `gojoStars` (setelah baris `};` ~391):

```js
// ── Bercak ruang angkasa (persist di pinggir kuis saat domain aktif) ────────
// Dipilih dari 4 sisi bergantian supaya selalu "di pinggir", tidak menutupi
// kartu soal. Warna = palet nebula ungu/biru/magenta. Deterministik via rng.
export const GOJO_NEBULA_COLORS = ['#7c4dff', '#38bdf8', '#c026d3', '#818cf8'];

export const gojoNebulaSpots = (seed = 1, count = 8, rng = Math.random) => {
  const out = [];
  for (let i = 0; i < count; i++) {
    const edge = i % 4;                        // 0 atas · 1 kanan · 2 bawah · 3 kiri
    const along = 6 + rng() * 88;              // posisi sepanjang sisi (%)
    const depth = 4 + rng() * 15;              // jarak dari tepi (%)
    let x; let y;
    if (edge === 0) { x = along; y = depth; }
    else if (edge === 1) { x = 100 - depth; y = along; }
    else if (edge === 2) { x = along; y = 100 - depth; }
    else { x = depth; y = along; }
    out.push({
      id: `${seed}-neb-${i}`,
      x, y,
      size: 110 + rng() * 130,                 // px (blob lembut)
      opacity: 0.2 + rng() * 0.25,
      color: GOJO_NEBULA_COLORS[Math.floor(rng() * GOJO_NEBULA_COLORS.length)],
      delay: rng() * 0.6,
    });
  }
  return out;
};
```

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"
```

Harapan GREEN: `ℹ pass 168`, `ℹ fail 0`.

**3c. Commit:**

```bash
git add src/features/effects/gojoFx.js src/features/effects/gojoFx.test.js
git commit -m "feat(gojo): bercak nebula pinggir kuis (gojoNebulaSpots) - deterministik, selalu di tepi"
```

---

### Task 4 — TDD: dentuman synth `domainBoomParams` + `playDomainBoom`

**4a. RED — `src/utils/sfx.params.test.js`.** Ubah import baris 3:

```js
import { streakGongParams, domainBoomParams } from './sfx.js';
```

Tambah di akhir file:

```js
// ── Dentuman domain 領域展開 (cinematic) ────────────────────────────────────

test('domainBoomParams: sweep turun, angka sehat', () => {
  for (const kind of ['cast', 'bang']) {
    const p = domainBoomParams(kind);
    assert.ok(p.freqStart > p.freqEnd, `${kind}: sweep harus turun`);
    assert.ok(p.freqStart <= 400 && p.freqEnd >= 20, `${kind}: freq di rentang wajar`);
    assert.ok(p.dur >= 0.5 && p.dur <= 2, `${kind}: durasi wajar`);
    assert.ok(p.gain > 0 && p.gain <= 0.8, `${kind}: gain sehat`);
    assert.ok(p.noiseGain >= 0 && p.noiseGain <= 0.4, `${kind}: noise sehat`);
  }
});

test('domainBoomParams: bang lebih besar dari cast', () => {
  const c = domainBoomParams('cast');
  const b = domainBoomParams('bang');
  assert.ok(b.gain > c.gain, 'bang lebih keras');
  assert.ok(b.dur > c.dur, 'bang lebih panjang');
  assert.ok(b.freqStart > c.freqStart, 'bang lebih "meledak"');
});
```

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)|does not provide"
```

Harapan RED: `does not provide an export named 'domainBoomParams'` + `ℹ fail 1`.

**4b. GREEN — `src/utils/sfx.js`.** Sisipkan setelah `synthGong` (setelah baris ~242):

```js
// ── Dentuman domain 領域展開 (cinematic, BUKAN voice) ───────────────────────
// kind: 'cast' (saat tombol ditekan) | 'bang' (saat bigbang di tengah).
// Murni synth: sweep sine turun (dentuman) + burst noise lowpass (desis ruang).
export function domainBoomParams(kind = 'cast') {
  const bang = kind === 'bang';
  return {
    freqStart: bang ? 160 : 92,
    freqEnd: bang ? 36 : 28,
    dur: bang ? 1.4 : 1.0,
    gain: bang ? 0.5 : 0.34,
    noiseGain: bang ? 0.16 : 0.06,
    noiseDur: bang ? 0.5 : 0.25,
  };
}

export const playDomainBoom = (kind = 'cast') => {
  const ctx = initAudioContext();
  if (!ctx) return 0;
  if (ctx.state === 'suspended') ctx.resume();
  const p = domainBoomParams(kind);
  const t = ctx.currentTime;

  // Sweep turun = dentuman.
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(p.freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(p.freqEnd, t + p.dur);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(p.gain, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0008, t + p.dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + p.dur + 0.05);

  // Desis noise (hanya kalau noiseGain > 0).
  if (p.noiseGain > 0.001) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * p.noiseDur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const nf = ctx.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.setValueAtTime(900, t);
    nf.frequency.exponentialRampToValueAtTime(120, t + p.noiseDur);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(p.noiseGain, t);
    ng.gain.exponentialRampToValueAtTime(0.0008, t + p.noiseDur);
    src.connect(nf);
    nf.connect(ng);
    ng.connect(ctx.destination);
    src.start(t);
  }
  return Math.round(p.dur * 1000);
};
```

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"
```

Harapan GREEN: `ℹ pass 170`, `ℹ fail 0`.

**4c. Commit:**

```bash
git add src/utils/sfx.js src/utils/sfx.params.test.js
git commit -m "feat(gojo): dentuman synth domain (cast & bigbang) - domainBoomParams + playDomainBoom"
```

---

### Task 5 — `data-quiz-area` + state domain di `EffectContext` + bar energi kutukan

**5a. Tambah atribut `data-quiz-area`** ke 5 wrapper kuis (atribut saja, class jangan diubah):

1. `src/pages/Practice.jsx` baris ~319 (mode kanji) dan ~499 (mode kotoba). Keduanya
   persis `<div className="flex-1 flex flex-col items-center relative z-10">` — patch dengan
   konteks sekitarnya, contoh untuk kanji (baris sebelum `<header>` sudah lewat, sesudahnya
   `{/* Progress bar */}`):

```diff
-            <div className="flex-1 flex flex-col items-center relative z-10">
+            <div data-quiz-area className="flex-1 flex flex-col items-center relative z-10">
               {/* Progress bar */}
```

   Untuk yang kotoba, cari lagi string yang sama (satu-satunya sisa di file) dan tambahkan
   `data-quiz-area` dengan cara sama.

2. `src/features/quiz/KanaQuiz.jsx` baris ~49:

```diff
-      <div className="flex-1 flex flex-col items-center justify-center relative z-10 pb-16">
+      <div data-quiz-area className="flex-1 flex flex-col items-center justify-center relative z-10 pb-16">
```

3. `src/pages/Review.jsx` baris ~267 — sama persis dengan KanaQuiz.
4. `src/features/quiz/Quiz.jsx` (dipakai `/mondai` lewat `MondaiChapterFlow`) — kartu soal
   `motion.div` baris ~113:

```diff
       <motion.div
         key={currentQuestionIndex}
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
+        data-quiz-area
         className="border-[4px] border-sumi bg-kinari-light p-6 sm:p-12 shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] relative z-10 flex-1 flex flex-col justify-between"
       >
```

Cek:

```bash
grep -rn "data-quiz-area" src/ | wc -l    # harapan: 5
```

**5a-2. Tandai opsi jawaban BENAR dengan `data-correct`** (untuk hint Six Eyes Task 9 —
satu atribut; variabel `isThisCorrect` sudah ada di semua titik):

| File | ~Baris | Tombol | Tambah |
|---|---|---|---|
| `src/pages/Practice.jsx` | 419 (kanji) | `<motion.button key={option.id} …>` | `data-correct={isThisCorrect \|\| undefined}` |
| `src/pages/Practice.jsx` | 559 (kotoba) | sama | sama |
| `src/features/quiz/KanaQuiz.jsx` | 108 | `<motion.button key={option.id} …>` | sama |
| `src/pages/Review.jsx` | 378 | `<motion.button key={option.id} …>` | sama |
| `src/features/quiz/Quiz.jsx` | 157 | `<motion.button key={index} …>` | `data-correct={index === currentQuestion.correctIndex \|\| undefined}` |

Contoh (Practice kanji; 3 tempat lain persis pola yang sama):

```diff
                     <motion.button
                       key={option.id}
                       onClick={() => handleKotobaOptionClick(option)}
+                      data-correct={isThisCorrect || undefined}
                       animate={
```

> `|| undefined` penting: React MENGHILANGKAN atribut bernilai `undefined`, sedangkan `false`
> dirender jadi `data-correct="false"` → selector `[data-correct]` tetap cocok di opsi salah.

Cek:

```bash
grep -rn "data-correct" src/ | wc -l    # harapan: 5
```

**5b. `src/features/effects/EffectContext.jsx` — state + castDomain.**

Import (baris 11):

```js
import { nextGojoBalls, GOJO_BALLS_EMPTY, gojoTechniqueFor, gojoPreviewStreak, gojoCurseCharge } from './gojoFx';
import { GojoDomainCine, GojoCurseBar } from './GojoDomainCine';
```

Di import sfx (baris 4) tambahkan `playDomainBoom`:

```js
import { playCorrectSound, playWrongSound, playStreakSound, answerFeedbackKind, hinaGifHoldMs, playDomainBoom } from '../../utils/sfx';
```

State baru (setelah `const streakRef = useRef(0);` baris ~111):

```js
  // ── Energi kutukan 呪力 → 領域展開 (bar; persist sampai salah) ────────────
  const [gojoDomain, setGojoDomain] = useState(false);      // domain sedang hidup
  const [gojoDomainSeed, setGojoDomainSeed] = useState(0);  // seed per cast (animasi baru)
  const [ultCharge, setUltCharge] = useState(0);            // isi bar 0..20
  const [quizActive, setQuizActive] = useState(false);      // bar tampil selama sesi kuis
```

Di `triggerEffect`, di dalam blok `if (activeVisual === 'gojo') { ... }` (setelah logika bola,
sebelum `}` penutup blok, baris ~240):

```js
      // Bar energi kutukan ikut streak; SATU salah = domain padam & bar kosong.
      setUltCharge(gojoCurseCharge(streakRef.current));
      if (type === 'wrong') setGojoDomain(false);
```

Ganti `resetEffectStreak` (baris ~247) — sekaligus jadi penanda "sesi kuis mulai"
(semua titik mulai kuis memanggil fungsi ini):

```js
  const resetEffectStreak = useCallback(() => {
    streakRef.current = 0;
    setGojoBalls(GOJO_BALLS_EMPTY);
    setGojoExplode(false);
    setGojoDomain(false);
    setUltCharge(0);
    setQuizActive(true);     // bar energi kutukan tampil selama sesi kuis
  }, []);

  // Sesi kuis selesai / keluar → bar hilang (dipanggil dari onBack/onPlayAgain/
  // onGoHome Practice + unmount Quiz/Review).
  const endQuizSession = useCallback(() => {
    setQuizActive(false);
    setGojoDomain(false);
    setUltCharge(0);
  }, []);
```

Tambah `castDomain` setelah `previewStreak`:

```js
  // Cast 領域展開 dengan tap bar. Menghabiskan charge: streak & bar di-reset,
  // bar keisi dari 0 sampai 20 benar beruntun lagi. BOLA 蒼/赫 TETAP mengambang
  // di pinggir (permintaan user — jangan di-reset). Domain hidup sampai jawab SALAH.
  const castDomain = useCallback(() => {
    if (activeVisual !== 'gojo') return;
    streakRef.current = 0;
    setGojoExplode(false);
    setUltCharge(0);
    setGojoDomainSeed((n) => n + 1);
    setGojoDomain(true);
    playDomainBoom('cast');
  }, [activeVisual]);
```

Sinkronkan penanda global hint Six Eyes (dipakai CSS Task 9) — tambahkan setelah `castDomain`:

```js
  // Penanda global untuk CSS hint Six Eyes (index.css) — nol timer JS.
  useEffect(() => {
    const root = document.documentElement;
    if (gojoDomain) root.setAttribute('data-gojo-domain', 'on');
    else root.removeAttribute('data-gojo-domain');
    return () => root.removeAttribute('data-gojo-domain');
  }, [gojoDomain]);
```

Provider value (baris ~264):

```js
    <EffectContext.Provider value={{ triggerEffect, resetEffectStreak, previewStreak, castDomain, endQuizSession, active }}>
      {children}
      <EffectLayer
        fx={fx} drops={drops} visual={activeVisual}
        gojoBalls={gojoBalls} gojoExplode={gojoExplode}
        domainOn={gojoDomain} domainSeed={gojoDomainSeed}
        charge={ultCharge} quizActive={quizActive} onCast={castDomain}
      />
    </EffectContext.Provider>
```

**5c. `EffectLayer` — terima props & render.** Ubah signature & blok gojo:

```js
function EffectLayer({ fx, drops, visual, gojoBalls, gojoExplode, domainOn, domainSeed, charge, quizActive, onCast }) {
```

```jsx
      {/* ── Gojo Satoru (pack 'gojo') — 蒼 → 赫 → 茈 → 領域展開 ──────────────── */}
      {visual === 'gojo' && (
        <>
          {/* Domain cinematic di BELAKANG bola/burst → bola & ledakan tetap terlihat */}
          <AnimatePresence>
            {domainOn && <GojoDomainCine key={`dom-${domainSeed}`} seed={domainSeed} />}
          </AnimatePresence>
          <GojoSpheres balls={gojoBalls} explode={gojoExplode} seed={fx?.id || 1} />
          <AnimatePresence>
            {fx && <GojoBurst key={`gojo-${fx.id}`} fx={fx} kind={kind} />}
          </AnimatePresence>
        </>
      )}

      {/* Bar energi kutukan 呪力 — tampil selama sesi kuis, tap saat penuh = cast */}
      {visual === 'gojo' && quizActive && (
        <GojoCurseBar charge={charge} ready={charge >= 20 && !domainOn} onCast={onCast} />
      )}
```

**5d. Buat `src/features/effects/GojoDomainCine.jsx`** (versi awal dulu: bar + void gelap
sederhana; detail fase menyusul Task 6–8):

```jsx
import { useEffect, useId, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GOJO_STYLE, GOJO_INK, GOJO_BALL_BREAKPOINT, GOJO_ULT_THRESHOLD,
  gojoDomainTimeline, gojoSequentialChars, gojoNebulaSpots, gojoStars,
} from './gojoFx';
import { playDomainBoom } from '../../utils/sfx';

// ─────────────────────────────────────────────────────────────────────────────
// 領域展開・無量空処 — CINEMATIC ULTIMATE (bar energi kutukan, persist sampai salah).
//   0. BAR       → 呪力 bar vertikal tepi KANAN, keisi naik tiap benar (aura di garis isi)
//   1. GELAP     → layar hitam kecuali area kuis (spotlight [data-quiz-area])
//   2. TEKS      → 領域展開 → 無量空処 muncul PER-KARAKTER (berurutan)
//   3. SIX EYES  → mata di ATAS teks, nutup → kebuka
//   4. BIGBANG   → di tengah + bercak ruang angkasa di PINGGIR kuis
//   5. SETTLE    → blok mata+teks naik ke atas & mengecil → kartu soal kebaca
//   6. PERSIST   → tetap hidup sampai jawaban SALAH (dikontrol EffectProvider)
// Semua overlay pointer-events-none → quiz tetap bisa dijawab (bar-nya sendiri yang klikable).
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isMobile = () =>
  typeof window !== 'undefined' && window.innerWidth < GOJO_BALL_BREAKPOINT;

// ── Bar energi kutukan 呪力 (tepinya KANAN, isi naik dari bawah) ─────────────
// Visual: jalur gelap + isi ungu dengan glow; tiap +1 benar memicu "letupan aura"
// (satu kilau yang naik di garis isi, remount via key=charge); saat penuh → label
// 領域展開 + denyut; tap bar = cast.
export function GojoCurseBar({ charge = 0, ready = false, onCast }) {
  const [reduced] = useState(prefersReduced);
  const pct = Math.max(0, Math.min(100, (charge / GOJO_ULT_THRESHOLD) * 100));
  const purple = GOJO_STYLE.domain.color;

  return (
    <div
      data-gojo-cursebar
      className="pointer-events-none fixed right-2.5 top-1/2 -translate-y-1/2 z-[125] flex flex-col items-center gap-2"
    >
      {/* Label 領域展開 saat penuh */}
      <AnimatePresence>
        {ready && (
          <motion.span
            key="ready-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#e8e0ff', writingMode: 'vertical-rl', textShadow: `0 0 12px ${purple}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: reduced ? 1 : [0.65, 1, 0.65], y: 0 }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            領域展開
          </motion.span>
        )}
      </AnimatePresence>

      {/* Bar-nya (tap = cast saat penuh) */}
      <motion.button
        type="button"
        onClick={ready ? onCast : undefined}
        aria-label="呪力"
        disabled={!ready}
        className={`relative w-[14px] h-[46vh] max-h-[380px] min-h-[200px] rounded-full border-[2px] overflow-hidden ${
          ready ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
        }`}
        style={{
          borderColor: ready ? purple : 'rgba(124,77,255,0.45)',
          background: 'rgba(10,4,20,0.55)',
          boxShadow: ready
            ? `0 0 18px 3px ${purple}cc, inset 0 0 10px ${purple}55`
            : `0 0 8px 1px ${purple}33`,
        }}
        animate={ready && !reduced ? { scaleX: [1, 1.25, 1] } : { scaleX: 1 }}
        transition={ready && !reduced ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        {/* Isi: naik dari bawah ke atas */}
        <motion.div
          className="absolute left-0 right-0 bottom-0"
          style={{
            background: `linear-gradient(to top, ${purple}, #c4b5fd)`,
            boxShadow: `0 0 12px 2px ${purple}aa`,
          }}
          initial={false}
          animate={{ height: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
        {/* Letupan aura tiap +1 benar (remount tiap charge berubah) */}
        {charge > 0 && (
          <motion.div
            key={`aura-${charge}`}
            className="absolute left-0 right-0"
            style={{ bottom: `${Math.max(0, pct - 6)}%`, height: 16, background: `radial-gradient(ellipse at 50% 50%, #ffffffcc, ${purple}00 70%)` }}
            initial={{ opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: [0, 1, 0], scaleY: [0.4, 1.6, 1] }}
            transition={{ duration: reduced ? 0 : 0.55, ease: 'easeOut' }}
          />
        )}
      </motion.button>

      {/* Angka charge */}
      <span
        className="font-mono font-black text-[10px] tracking-widest"
        style={{ color: ready ? '#e8e0ff' : 'rgba(232,224,255,0.6)' }}
      >
        {charge}/{GOJO_ULT_THRESHOLD}
      </span>
    </div>
  );
}

// ── Cinematic domain ────────────────────────────────────────────────────────
export function GojoDomainCine({ seed = 1 }) {
  const [reduced] = useState(prefersReduced);
  const [mobile] = useState(isMobile);
  const t = gojoDomainTimeline();

  // Spotlight: ukur area kuis ([data-quiz-area]); fallback = full gelap.
  const [rect, setRect] = useState(null);
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector('[data-quiz-area]');
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect(r.width > 0 && r.height > 0
        ? { left: r.left, top: r.top, width: r.width, height: r.height }
        : null);
    };
    measure();
    window.addEventListener('resize', measure);
    const id = setTimeout(measure, 400);   // setelah animasi kartu selesai
    return () => { window.removeEventListener('resize', measure); clearTimeout(id); };
  }, []);

  // Dentuman bigbang (cast sudah dibunyikan EffectProvider).
  useEffect(() => {
    if (reduced) return undefined;
    const id = setTimeout(() => playDomainBoom('bang'), t.bangStart * 1000);
    return () => clearTimeout(id);
  }, [reduced, t.bangStart]);

  return (
    <motion.div
      data-gojo-domain
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.6 } }}
    >
      {/* Placeholder gelap — detail fase menyusul Task 6–8 */}
      <div
        className="absolute inset-0"
        style={rect
          ? {
            left: rect.left, top: rect.top, width: rect.width, height: rect.height,
            boxShadow: '0 0 0 100vmax rgba(2,2,6,0.94)',
          }
          : { background: 'rgba(2,2,6,0.94)' }}
      />
    </motion.div>
  );
}

export default GojoDomainCine;
```

**5e. Wiring `endQuizSession`** — bar hilang saat sesi kuis selesai/keluar:

1. `src/pages/Practice.jsx` — destructure (baris ~118):

```js
  const { triggerEffect, resetEffectStreak, endQuizSession } = useEffectLayer();
```

   Panggil di 3 titik akhir sesi:
   - `handleStartQuiz`/`handleFullChallenge` tidak perlu (bar muncul dari `resetEffectStreak`).
   - `QuizResult` `onPlayAgain` (baris ~280): `onPlayAgain={() => { endQuizSession(); setQuizStarted(false); }}`
   - `QuizResult` `onGoHome` (baris ~281): `onGoHome={() => { endQuizSession(); navigate('/'); }}`
   - Tombol "← Back" di mode kanji (baris ~298) & kotoba: `onClick={() => { endQuizSession(); setQuizStarted(false); }}`

2. `src/features/quiz/Quiz.jsx` (baris ~20 — dipakai `/mondai` lewat `MondaiChapterFlow`) —
   destructure + tambah efek cleanup:

```js
  const { triggerEffect, resetEffectStreak, endQuizSession } = useEffectLayer();
  // ...dan setelah useEffect resetEffectStreak:
  useEffect(() => () => endQuizSession(), [endQuizSession]);
```

3. `src/pages/Review.jsx` (baris ~40) — destructure + tambah efek cleanup:

```js
  const { triggerEffect, resetEffectStreak, endQuizSession } = useEffectLayer();
  // ...dan setelah useEffect resetEffectStreak:
  useEffect(() => () => endQuizSession(), [endQuizSession]);
```

**5f. Gates + commit:**

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"   # 170 pass, 0 fail
npm run lint 2>&1 | grep -cE "error"        # 0
git add src/pages/Practice.jsx src/pages/Review.jsx src/features/quiz/KanaQuiz.jsx \
        src/features/quiz/Quiz.jsx \
        src/features/effects/EffectContext.jsx src/features/effects/GojoDomainCine.jsx
git commit -m "feat(gojo): bar energi kutukan 呪力 - keisi tiap benar, aura, tap saat penuh = cast 領域展開"
```

---

### Task 6 — Cinematic bagian 1: teks berurutan (領域展開 → 無量空処)

**6a. `GojoDomainCine.jsx` — tambah komponen `SequentialChars`** (di bawah `GojoCurseBar`):

```jsx
// Teks muncul PER-KARAKTER berurutan (menggantikan "suara Gojo" sampai aset ada).
function SequentialChars({ text, start, perChar, reduced, className, style }) {
  const items = gojoSequentialChars(text, start, perChar);
  return (
    <span className={className} style={style} aria-label={text}>
      {items.map((it, i) => (
        <motion.span
          key={`${it.ch}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, y: 16, scale: 0.6 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: reduced ? 0 : it.delayMs / 1000,
            duration: reduced ? 0 : 0.32,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {it.ch}
        </motion.span>
      ))}
    </span>
  );
}
```

**6b. Render blok tengah** — sisipkan setelah placeholder gelap (dalam root `motion.div`):

```jsx
      {/* Blok tengah: [mata] → [領域展開] → [無量空処]; naik & mengecil saat settle */}
      <motion.div
        data-gojo-text
        className="absolute inset-0 flex flex-col items-center justify-center gap-[2.2vmin]"
        initial={false}
        animate={reduced ? {} : { y: '-31vh', scale: 0.34, opacity: 0.75 }}
        transition={{ delay: reduced ? 0 : t.settleStart, duration: reduced ? 0 : t.settleDur, ease: [0.22, 1, 0.36, 1] }}
      >
        <SequentialChars
          text="領域展開"
          start={t.text1Start}
          perChar={t.text1Char}
          reduced={reduced}
          className="font-serif font-black tracking-[0.35em] text-[#e8e0ff]"
          style={{ fontSize: 'clamp(20px, 3.4vw, 40px)', WebkitTextStroke: `2px ${GOJO_INK}` }}
        />
        <SequentialChars
          text="無量空処"
          start={t.text2Start}
          perChar={t.text2Char}
          reduced={reduced}
          className="font-serif font-black tracking-[0.22em]"
          style={{
            fontSize: 'clamp(44px, 8.5vw, 118px)',
            color: GOJO_STYLE.domain.color,
            WebkitTextStroke: `3px ${GOJO_INK}`,
            textShadow: `6px 6px 0 ${GOJO_INK}, 0 0 60px ${GOJO_STYLE.domain.color}cc`,
          }}
        />
      </motion.div>
```

**6c. Verifikasi cepat di browser** (dev server 5173):

```python
# Buka /settings, klik tombol cast di DevPanel (dibuat di Task 10; sementara pakai
# cara manual: previewGojo(20) lalu klik tombol ULT yang muncul)
import time, json
new_tab("http://localhost:5173/settings")
wait_for_load()
# charge ult: klik "茈 #3"? Tidak — pakai preview #20 via DevPanel setelah Task 10.
# SEMENTARA: cukup cek teks muncul saat cast manual (lihat Task 10 untuk tombolnya).
```

> Catatan: sampai Task 10 selesai, cara tercepat mengetes cast = sementara panggil dari
> konsol DevPanel. Kalau belum ada tombolnya, lompat verifikasi visual ke Task 10 lalu
> kembali. Yang penting: `npm test` & lint hijau di akhir task.

**6d. Gates + commit:**

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"   # 170 pass
npm run lint 2>&1 | grep -cE "error"        # 0
git add src/features/effects/GojoDomainCine.jsx
git commit -m "feat(gojo): teks domain muncul per-karakter (領域展開 → 無量空処) + settle ke atas"
```

---

### Task 7 — Cinematic bagian 2: Six Eyes (mata nutup → kebuka)

**7a. `GojoDomainCine.jsx` — tambah komponen `SixEyes`** (di bawah `SequentialChars`):

```jsx
// Six Eyes 六眼 — sepasang mata di ATAS teks. Animasi "membuka" = scaleY dari
// garis tipis (0.05) ke penuh; iris biru langit → ungu dengan glow.
function SixEyes({ reduced, start, openDur }) {
  const gid = 'gojoIris' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const open = {
    delay: reduced ? 0 : start,
    duration: reduced ? 0 : openDur,
    ease: [0.22, 1, 0.36, 1],
  };
  return (
    <motion.div
      data-gojo-eyes
      className="flex items-center gap-[7vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: reduced ? 0 : start, duration: reduced ? 0 : 0.25 }}
    >
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="relative"
          style={{ width: 96, height: 52, transformOrigin: '50% 50%', filter: 'drop-shadow(0 0 18px #38bdf8aa)' }}
          initial={{ scaleY: reduced ? 1 : 0.05 }}
          animate={{ scaleY: 1 }}
          transition={open}
        >
          <svg viewBox="0 0 100 56" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
            <defs>
              <radialGradient id={`${gid}-${i}`} cx="50%" cy="45%" r="62%">
                <stop offset="0%" stopColor="#e0f7ff" />
                <stop offset="55%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#7c4dff" />
              </radialGradient>
            </defs>
            <path d="M2,28 Q50,-4 98,28 Q50,60 2,28 Z" fill="#07030d" stroke="#e8e0ff" strokeWidth="2.5" />
            <circle cx="50" cy="28" r="14" fill={`url(#${gid}-${i})`} />
            <circle cx="50" cy="28" r="6" fill="#07030d" />
            <circle cx="45" cy="22" r="2.6" fill="#ffffff" opacity="0.85" />
          </svg>
        </motion.div>
      ))}
    </motion.div>
  );
}
```

**7b. Sisipkan `<SixEyes .../>`** sebagai anak PERTAMA blok tengah (sebelum `領域展開`):

```jsx
        <SixEyes reduced={reduced} start={t.eyesStart} openDur={t.eyesOpenDur} />
```

**7c. Gates + commit:**

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"   # 170 pass
npm run lint 2>&1 | grep -cE "error"        # 0
git add src/features/effects/GojoDomainCine.jsx
git commit -m "feat(gojo): Six Eyes 六眼 di atas teks domain - animasi nutup ke kebuka"
```

---

### Task 8 — Cinematic bagian 3: bigbang + bercak ruang angkasa (persist)

**8a. Tambah komponen `GojoBigBang`** (di bawah `SixEyes`):

```jsx
// Bigbang di TENGAH (flash + ring mengembang, memudar habis) — lalu ruang
// "tenang": bercak nebula di pinggir + bintang berkelip (persist).
function GojoBigBang({ reduced, start, dur }) {
  return (
    <div
      data-gojo-bang
      className="absolute left-1/2 top-1/2"
      style={{ width: 380, height: 380, marginLeft: -190, marginTop: -190, pointerEvents: 'none' }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={reduced ? { scale: 1, opacity: 0.35 } : { scale: [0, 0.3, 2.7], opacity: [0, 1, 0] }}
        transition={{ delay: reduced ? 0 : start, duration: reduced ? 0 : dur, times: [0, 0.18, 1], ease: 'easeOut' }}
        style={{ background: 'radial-gradient(circle, #ffffff 0 10%, #c4b5fd 32%, rgba(124,77,255,0) 72%)' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: '6px solid #c4b5fd' }}
        initial={{ scale: 0.1, opacity: 0 }}
        animate={reduced ? { scale: 1, opacity: 0.25 } : { scale: [0.1, 3.6], opacity: [0, 0.85, 0] }}
        transition={{ delay: reduced ? 0 : start + 0.05, duration: reduced ? 0 : dur * 1.15, ease: 'easeOut' }}
      />
    </div>
  );
}
```

**8b. Render bercak + bintang + bigbang** — di root `motion.div`, setelah blok tengah:

```jsx
      {/* Bercak ruang angkasa DI PINGGIR kuis (persist, denyut pelan) */}
      {spots.map((s) => (
        <motion.div
          key={s.id}
          data-gojo-nebula
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            marginLeft: -s.size / 2,
            marginTop: -s.size / 2,
            background: `radial-gradient(circle, ${s.color} 0 16%, ${s.color}66 44%, transparent 72%)`,
            filter: 'blur(14px)',
            willChange: 'transform, opacity',
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={reduced
            ? { opacity: s.opacity, scale: 1 }
            : { opacity: [0, s.opacity, s.opacity * 0.7, s.opacity], scale: [0.6, 1, 1.08, 1] }}
          transition={{
            delay: reduced ? 0 : t.nebulaStart + s.delay,
            duration: reduced ? 0 : 6,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Bintang hanya di PINGGIR (biar kartu soal tetap bersih) */}
      {edgeStars.map((st) => (
        <motion.span
          key={st.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.size, height: st.size }}
          initial={{ opacity: 0 }}
          animate={reduced ? { opacity: 0.7 } : { opacity: [0, 0.85, 0.3, 0.75] }}
          transition={{
            delay: reduced ? 0 : t.nebulaStart + st.delay,
            duration: reduced ? 0 : 4,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* BIGBANG di tengah */}
      <GojoBigBang reduced={reduced} start={t.bangStart} dur={t.bangDur} />
```

**8c. Tambah state `spots` & `edgeStars`** di `GojoDomainCine` (setelah `const t = ...`):

```js
  const [spots] = useState(() => gojoNebulaSpots(seed, mobile ? 5 : 8));
  const [allStars] = useState(() => gojoStars(seed, mobile ? 36 : 64));
  // Bintang hanya yang di pinggir (x/y di luar 18%/82%) → area kuis tetap bersih.
  const edgeStars = allStars.filter((s) => s.x <= 18 || s.x >= 82 || s.y <= 14 || s.y >= 86);
```

**8d. Gates + commit:**

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"   # 170 pass
npm run lint 2>&1 | grep -cE "error"        # 0
git add src/features/effects/GojoDomainCine.jsx
git commit -m "feat(gojo): bigbang tengah + bercak ruang angkasa pinggir + bintang berkelip (persist)"
```

---

### Task 9 — Skill Six Eyes: hint jawaban berkala (CSS murni, nol timer JS)

> Keputusan user: **tiap 5 dtk nyala ±1,4 dtk**, **kilau biru-putih ala Six Eyes**,
> berlaku di **semua mode kuis**. Implementasi = 1 blok CSS + atribut yang sudah ada
> (`data-correct` dari 5a-2, `data-gojo-domain` dari 5b) → nol state baru, nol timer.

**9a. `src/index.css` — tambah di akhir file:**

```css
/* ── Hint Six Eyes 六眼 — selama domain 領域展開 hidup ──────────────────────── */
/* Opsi jawaban BENAR berkilau biru-putih tiap 5 dtk (nyala ±1,4 dtk per siklus:
   fase 70%→98% = 3,5s→4,9s). Murni CSS — nol timer JS: otomatis mati saat tombol
   dijawab (disabled), saat domain padam (atribut dilepas). Pakai `filter` (BUKAN
   box-shadow) karena override dark-mode mengunci box-shadow dengan !important. */
@keyframes gojoSixEyesHint {
  0%, 70% { filter: drop-shadow(0 0 0 rgba(56, 189, 248, 0)); }
  76%, 92% { filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.95)) drop-shadow(0 0 28px rgba(124, 77, 255, 0.55)); }
  98%, 100% { filter: drop-shadow(0 0 0 rgba(56, 189, 248, 0)); }
}

html[data-gojo-domain='on'] button[data-correct]:not(:disabled) {
  animation: gojoSixEyesHint 5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  html[data-gojo-domain='on'] button[data-correct]:not(:disabled) {
    animation: none;
    filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.8));
  }
}
```

**9b. Verifikasi isolasi CSS di browser** (tanpa cast — set atribut manual; buka halaman
kuis mana pun yang punya opsi jawaban, mis. `/practice` mulai quiz):

```python
import time
# 1) Tanpa atribut → tidak ada animasi.
print("off:", js("""(() => {
  const b = document.querySelector('button[data-correct]');
  return b ? getComputedStyle(b).animationName : 'no-button';
})()"""))   # harapan: "none"
# 2) Set atribut manual → animasi nyala di TEPAT 1 tombol (opsi benar).
js("document.documentElement.setAttribute('data-gojo-domain', 'on')")
time.sleep(0.3)
print("on:", js("""(() => ({
  n: document.querySelectorAll('button[data-correct]:not(:disabled)').length,
  anim: (() => { const b = document.querySelector('button[data-correct]:not(:disabled)');
    return b ? getComputedStyle(b).animationName : null; })(),
  dur: (() => { const b = document.querySelector('button[data-correct]:not(:disabled)');
    return b ? getComputedStyle(b).animationDuration : null; })(),
}))()"""))   # harapan: n=1, anim="gojoSixEyesHint", dur="5s"
# 3) Bersihkan.
js("document.documentElement.removeAttribute('data-gojo-domain')")
print("clean:", js("(() => !document.documentElement.hasAttribute('data-gojo-domain'))()"))  # True
```

**9c. Commit:**

```bash
git add src/index.css
git commit -m "feat(gojo): skill Six Eyes 六眼 - opsi jawaban benar berkilau tiap 5 dtk selama domain (CSS murni)"
```

---

### Task 10 — DevPanel: charge bar & cast; update preview #50/#100

**10a. `src/features/dev/DevPanel.jsx`.** Ganti destructure (baris ~53):

```js
  const { previewStreak, castDomain } = useEffectLayer();
```

Ganti 4 tombol preview (blok `Preview Efek Gojo`) jadi 5 tombol:

```jsx
            <button type="button" onClick={() => previewGojo(3)} className={`${btn} bg-[#9c27b0] text-kinari-light`}>
              🟣 {id ? "茈 #3" : "茈 #3"}
            </button>
            <button type="button" onClick={() => previewGojo(50)} className={`${btn} bg-[#9c27b0] text-kinari-light`}>
              🟣 {id ? "茈 #50" : "茈 #50"}
            </button>
            <button type="button" onClick={() => previewGojo(100)} className={`${btn} bg-[#9c27b0] text-kinari-light`}>
              🟣 {id ? "茈 #100" : "茈 #100"}
            </button>
            <button type="button" onClick={() => previewGojo(20)} className={`${btn} bg-[#ffd700] text-sumi`}>
              ⚡ {id ? "Isi Bar #20" : "Fill Bar #20"}
            </button>
            <button type="button" onClick={castNow} className={`${btn} bg-[#7c4dff] text-kinari-light`}>
              🌌 {id ? "Cast 領域展開" : "Cast Domain"}
            </button>
```

> Catatan: tombol "Isi Bar #20" memakai `previewGojo(20)` → set streak 19 lalu satu
> jawaban benar → `streakRef.current` jadi 20 → `ultCharge` = 20 (bar penuh) — **bar
> muncul kalau `quizActive`**; karena dari Settings (bukan sesi kuis) bar tidak tampil,
> jadi tombol ini berguna untuk menguji di quiz asli atau mengecek logika saja.
> **Untuk verifikasi visual bar, gunakan Task 12b (E2E quiz) atau tombol "Cast" langsung.**

Tambah handler `castNow` (setelah `previewGojo`):

```js
  // Cast domain langsung (dev). Kalau pack Gojo belum aktif → aktifkan dulu
  // (klik sekali lagi untuk cast).
  const castNow = () => {
    if (progress.activePack === GOJO_PACK_ID) { castDomain(); return; }
    previewGojo(20);
  };
```

**10b. Cek:**

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"   # 170 pass (test previewStreak sudah diubah di Task 1)
npm run lint 2>&1 | grep -cE "error"        # 0
```

**10c. Commit:**

```bash
git add src/features/dev/DevPanel.jsx
git commit -m "feat(dev): tombol Isi Bar #20 & Cast 領域展開 di DevPanel; preview #50/#100 kini murasaki"
```

---

### Task 11 — Cleanup: hapus jalur domain dari `GojoBurst.jsx`

Setelah auto-domain hilang, semua cabang `isDomain`/`zenith` di `GojoBurst` = dead code. Hapus:

1. Import: hapus `gojoStars` dari daftar import (baris ~5). Sisanya tetap.
2. Hapus state `const [stars] = useState(...)` (baris ~53–55).
3. Setelah early-return `ao/aka`: **hapus** `const isDomain = ...` dan `const zenith = ...` (baris ~76–77).
4. `const shake = isDomain || isStreak;` → `const shake = isStreak;`
5. WASH: `animate={{ opacity: reduced ? 0.4 : [0, isDomain ? 0.55 : 0.4, 0] }}` →
   `animate={{ opacity: reduced ? 0.4 : [0, 0.4, 0] }}`; transition `zenith ? 1.1 : 0.6` → `0.6`.
6. SHAKE transition: `duration: zenith ? 0.8 : 0.5` → `duration: 0.5`.
7. Hapus blok **Layer 2b — BINTANG 無量空処** (`{isDomain && stars.map(...)}`, baris ~200–217).
8. Layer 5: `fontSize: isDomain ? 'clamp(40px, 7vw, 92px)' : 'clamp(56px, 10vw, 140px)'` →
   `fontSize: 'clamp(56px, 10vw, 140px)'`.
9. Hapus blok **"Teks kecil 領域展開 saat domain"** (`{isDomain && (...)}`, baris ~431–451).

Cek:

```bash
grep -n "isDomain\|zenith\|gojoStars" src/features/effects/GojoBurst.jsx   # harapan: kosong
npm test 2>&1 | grep -E "^ℹ (pass|fail)"   # 170 pass
npm run lint 2>&1 | grep -cE "error"        # 0
```

Commit:

```bash
git add src/features/effects/GojoBurst.jsx
git commit -m "refactor(gojo): hapus jalur domain dari GojoBurst (dead code setelah domain jadi tombol)"
```

---

### Task 12 — Verifikasi browser penuh (ground truth)

**11a. Cast dari DevPanel (Settings):**

```python
import time, json
new_tab("http://localhost:5173/settings")
wait_for_load()
# klik "Charge Ult #20" (aktifkan pack + charge) — kalau pack belum aktif, klik lagi
for label in ['Charge Ult', 'Charge Ult']:
    js("""(() => { const b=[...document.querySelectorAll('button')].find(x=>/Charge Ult/i.test(x.textContent)); if (b) b.click(); return !!b; })()""")
    time.sleep(0.8)
# klik tombol ULT yang muncul (data-gojo-ult)
print("ULT:", js("""(() => !!document.querySelector('[data-gojo-ult]'))()"""))   # True
js("""(() => { document.querySelector('[data-gojo-ult]').click(); return true; })()""")
time.sleep(0.8)
print("DOM 0.8s:", js("""(() => ({
  domain: !!document.querySelector('[data-gojo-domain]'),
  spotlight: !!document.querySelector('[data-gojo-spotlight], [data-gojo-domain]'),
  eyes: !!document.querySelector('[data-gojo-eyes]'),
}))()"""))
time.sleep(2.6)   # t≈3.4s: bigbang sudah lewat, nebula jalan
print("DOM 3.4s:", js("""(() => ({
  nebula: document.querySelectorAll('[data-gojo-nebula]').length,
  bang: !!document.querySelector('[data-gojo-bang]'),
}))()"""))   # nebula: 8 (desktop)
```

Screenshot di t≈1.2s (teks+mata), t≈3.2s (bigbang), t≈5s (persist) → `vision_analyze`:
"Apakah terlihat: gelap kecuali area tengah, teks 領域展開/無量空処 berurutan, mata di
atas teks, bigbang/nebula di pinggir?"

**12b. E2E di quiz asli (bar keisi + spotlight + hint Six Eyes + persist sampai salah).** Di `/practice`:

```python
# 1. pilih SEMUA baris hiragana, difficulty Hard, mulai quiz
#    → cek bar muncul dari kosong: [data-gojo-cursebar] ada, isi 0%
# 2. jawab benar 20x (map kana→romaji di bawah) → cek bar naik & penuh
HIRA = {'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
        'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
        'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
        'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo',
        'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'wo','ん':'n'}
import time
for i in range(20):
    ok = js("""(HIRA => {
      const h = [...document.querySelectorAll('h2')].map(e=>e.textContent.trim()).find(x=>HIRA[x]);
      if (!h) return null;
      const want = HIRA[h];
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === want);
      if (!btn) return null;
      btn.click();
      return want;
    })(""" + json.dumps(HIRA) + ")")
    time.sleep(0.45)
    if i == 4:
        print("bar awal:", js("""(() => {
          const el = document.querySelector('[data-gojo-cursebar]');
          const fill = el && el.querySelector('div');
          return { ada: !!el, isi: fill ? fill.style.height || 'auto' : null,
                   angka: el ? el.textContent.trim() : null };
        })()"""))
    js("""(() => { const b=[...document.querySelectorAll('button')].find(x=>/Soal Berikutnya|Next Question|Lihat Hasil|See Results/i.test(x.textContent)); if (b) b.click(); return true; })()""")
    time.sleep(0.35)
print("bar setelah 20 benar:", js("""(() => {
  const el = document.querySelector('[data-gojo-cursebar]');
  const btn = el && el.querySelector('button');
  return { ada: !!el, angka: el ? el.textContent.trim() : null,
           label: /領域展開/.test(el ? el.textContent : ''),
           tapEnabled: btn ? !btn.disabled : false };
})()"""))   # harapan: angka "20/20", label true, tapEnabled true
```

Klik bar-nya (`document.querySelector('[data-gojo-cursebar] button').click()`) → cek
`[data-gojo-domain]` + spotlight (`boxShadow` mengandung `100vmax`) → tunggu sampai
settle (~4.5s) → **cek hint Six Eyes aktif**:

```python
print("hint:", js("""(() => {
  const root = document.documentElement;
  const b = document.querySelector('button[data-correct]:not(:disabled)');
  return { attr: root.getAttribute('data-gojo-domain'),
           n: document.querySelectorAll('button[data-correct]:not(:disabled)').length,
           anim: b ? getComputedStyle(b).animationName : null,
           dur: b ? getComputedStyle(b).animationDuration : null };
})()"""))   # harapan: attr="on", n=1, anim="gojoSixEyesHint", dur="5s"
```

…lalu **jawab 1 soal SALAH** (klik opsi yang bukan romaji benar) → tunggu 0.8s →
`[data-gojo-domain]` harus **hilang** DAN bar kosong lagi (`0/20`) DAN hint mati
(`data-gojo-domain` di `<html>` hilang; tombol tidak lagi ber-animasi):

```python
print("setelah salah:", js("""(() => ({
  domain: !!document.querySelector('[data-gojo-domain]'),
  attr: document.documentElement.getAttribute('data-gojo-domain'),
  bar: document.querySelector('[data-gojo-cursebar]') ? document.querySelector('[data-gojo-cursebar]').textContent.trim() : null,
}))()"""))   # harapan: domain=false, attr=null, bar="0/20"
```

**12c. HP 390×844:** ulangi E2E dengan emulasi (bar tidak menutupi opsi jawaban di kanan):

```python
cdp('Emulation.setDeviceMetricsOverride', width=390, height=844, deviceScaleFactor=3, mobile=True)
# cek bar di tepi kanan (x ≈ 390-14-10), tidak menutupi tombol opsi; cast → nebula = 5
cdp('Emulation.clearDeviceMetricsOverride')
```

Screenshot + vision: "teks muat? bar keisi kelihatan? tap bar bisa?"

**12d. Regresi murasaki:** klik `茈 #3` di DevPanel → cek DOM: petir `stroke-width 5.5`,
ring `border 10px` (seperti sebelum perubahan).

**12e. Tema gelap:** nyalakan dark mode → cast lagi → vision: void tetap enak, tidak "kotor".

---

### Task 13 — Gates akhir

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"   # 170 pass, 0 fail
npm run lint 2>&1 | grep -cE "error"        # 0
npm run build 2>&1 | tail -2                # build sukses (dist/index.html ada)
git status --short
git ls-remote --heads origin                # PASTIKAN cuma refs/heads/main → tidak ada push
```

Kalau ada fix dari Task 12:

```bash
git add -A -- src/
git commit -m "fix(gojo): poles cinematic 領域展開 setelah verifikasi browser (desktop/HP, terang/gelap)"
```

## Tests / validation

- Unit: `gojoFx.test.js` **+8 test baru** (curse charge clamp, ult ready, tidak-pernah-domain,
  50/100 murasaki, timeline, sequential chars, nebula ×2), **−1 test lama** (50 = domain diganti),
  **2 assertion lama diubah** (kontrak previewStreak). `sfx.params.test.js` **+2 test** dentuman.
  **Total 161 → 170 pass / 0 fail.**
  (Hint Six Eyes = CSS murni → tidak ada test unit; diverifikasi di browser: Task 9b + 12b.)
- Kontrak penting:
  - `gojoTechniqueFor` untuk streak 1..200 **tidak pernah** `domain`/`domain_zenith`.
  - `gojoCurseCharge`: clamp 0..20 (bar berhenti di penuh), input aneh → 0.
  - `gojoUltReady`: tepat nyala di 20; NaN/string/undefined → false.
  - `gojoDomainTimeline`: urutan fase monoton & konsisten dengan durasi teks (4 karakter).
  - `gojoNebulaSpots`: selalu di pinggir (tidak menutupi kartu soal), warna dari palet.
- Browser (ground truth): cast dari DevPanel (fase & jumlah elemen), E2E quiz asli
  (bar keisi 0→20 → tap → spotlight di area kuis → hint Six Eyes nyala tiap 5 dtk →
  **persist sampai salah** → domain + hint mati + bar kosong lagi),
  HP 390×844 (bar tidak menutupi opsi), tema terang & gelap, regresi murasaki (5.5/10/90-30).
- Gates: lint 0 error, build sukses. **Commit lokal saja — JANGAN PUSH.**

## Risks, tradeoffs, and open questions

- **Bar di tepi kanan bisa menutupi opsi jawaban di HP.** Bar `w-[14px]` + `right-2.5` = ~24px
  dari tepi; kartu opsi di HP punya padding ~16px, jadi secara teori aman. Kalau menutupi:
  geser `right-2.5` → `right-1` atau perkecil tinggi bar (1 angka di `GojoCurseBar`).
- **Bar hanya tampil selama sesi kuis** (`quizActive` di-set `resetEffectStreak`, dibersihkan
  `endQuizSession`). Kalau user keluar via jalur tak terduga (mis. browser back), bar bisa
  tersisa — `endQuizSession` dipanggil di cleanup `Quiz.jsx`/`Review.jsx`; untuk Practice
  jalur back ditangani eksplisit. Tambal kalau ada temuan saat verifikasi.
- **Hint Six Eyes bisa "membocorkan" jawaban.** Memang itu tujuannya (skill), tapi kalau
  terasa terlalu kuat: ubah 2 angka di keyframes (`5s` → `8s`) atau besarkan porsi redup
  (70% → 85%) di `src/index.css` (satu blok).
- **`drop-shadow` di HP tua bisa berat** karena animasi filter 5 dtk terus-menerus. Kalau
  ada keluhan: ganti ke `outline`/`background` pulse, atau tambah
  `@media (max-width: 768px) { animation-duration: 6s; }` (opsional, jangan di V1).
- **Kartu soal tertutup ~4s saat reveal.** Cinematic sengaja menutupi; setelah `settleStart`
  teks/mata mengecil ke atas dan kartu kebaca lagi. Kalau terasa kelamaan → turunkan
  `settleStart` di `gojoDomainTimeline()` (1 angka).
- **Posisi settle di atas** (`y: '-31vh'`, `scale: 0.34`) bisa menimpa header skor di layar
  tertentu. Kalau perlu: ubah 2 angka di blok tengah `GojoDomainCine.jsx`.
- **Performa**: ±50–80 elemen overlay saat persist (bintang + nebula + teks). Semua animasi
  hanya `opacity`/`transform`; HP otomatis dikurangi (36 bintang, 5 bercak). Kalau masih
  berat: kecilkan angka di `GojoDomainCine.jsx` (2 konstanta).
- **Charge hilang saat mulai quiz baru** (`resetEffectStreak`) — konsisten dengan "20 benar
  beruntun", tapi artinya charge tidak bisa "dibawa" antar sesi. Ubah kalau user mau lain.
- **Dentuman synth 2×** — kalau user tidak mau suara sama sekali, hapus 2 call
  (`playDomainBoom('cast')` di `EffectContext`, `playDomainBoom('bang')` di cine).
- **Domain persist lintas halaman** (mis. cast lalu pindah ke Home): overlay tetap render
  dengan fallback full-gelap. V1 dibiarkan (hilang saat salah / mulai quiz baru / cast ulang).

**Open questions (SUDAH DIJAWAB user — semua default di bawah ini FINAL):**

1. Charge ult **HABIS setelah cast** (final) — kumpulkan 20 benar beruntun lagi.
2. Bola 蒼/赫 **TETAP mengambang di pinggir** saat cast (final) — tidak di-reset.
3. Teks **mengecil & naik ke atas** setelah bigbang (final) — kartu soal kebaca lagi.
4. Dentuman synth **2×** (final: cast + bigbang).
