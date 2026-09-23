# Plan — Layer SFX `rightanswer`/`wrong answer` + voice Hina (bunyi bareng)

## Goal

Saat pack `hina` aktif: jawaban **benar** memutar `rightanswer.mp3` **bersamaan** dengan
klip voice Hina `correct_*.mp3`, jawaban **salah** memutar `wronganswer.mp3` **bersamaan**
dengan klip voice Hina `wrong_*.mp3`, dan **streak** memutar klip voice Hina `streak_*.mp3`.

---

## Current context / assumptions

Repo: `C:\Users\maddo\Documents\japanese-quiz` (Vite + React 19, `npm test` = `node --test`,
**52 test hijau** sekarang). Shell: **Git Bash** di Windows.

Kondisi `public/voices/hina/` (sudah diverifikasi):

| File | Status git | Dipakai kode? |
|---|---|---|
| `correct_1..4.mp3` | dilacak | ❌ (`files.correct = []` sejak commit `1a291be`) |
| `wrong_1..3.mp3` | dilacak | ✅ `files.wrong` |
| `streak_1..6.mp3` | dilacak | ✅ `files.streak` |
| `rightanswer.mp3` | **untracked** | ❌ belum dirujuk |
| `wrong answer.mp3` | **untracked** (⚠️ **ada spasi**) | ❌ belum dirujuk |

Titik kode penting:

- `src/features/audio/voices.js` baris 35–45: entry `hina` = `correct: []`, `wrong: [3]`,
  `streak: [6]`. Belum ada konsep "overlay".
- `src/utils/sfx.js`:
  - `playCorrectSound()`: `if (!activeVoiceKey) return synthChime();` lalu
    `if (playFile(pickFile(voice.files?.correct))) return; synthChime();`
  - `playWrongSound()`: pola sama dengan `synthThud()`.
  - `playFile(path)` membuat `new Audio(path)` dan `.play()` → **memanggil 2× = 2 file
    bunyi bersamaan** (browser mencampur otomatis). Inilah mekanisme "layer".
  - `pickFile(list, rng)` sudah ada (di `voices.js`), bisa inject `rng` untuk test.
- `src/features/effects/EffectContext.jsx` (~baris 167–174) memanggil:
  milestone → `playStreakSound`, salah → `playWrongSound`, sisanya → `playCorrectSound`.
  **Routing ini sudah benar, tidak perlu diubah** — hanya komentarnya yang perlu diperbarui.

Keputusan user (sesi ini, eksplisit):
- Jawaban **benar** = `rightanswer.mp3` **+** klip voice Hina `correct_*.mp3` → **dua-duanya bareng**.
- Jawaban **salah** = `wronganswer.mp3` **+** klip voice Hina `wrong_*.mp3` → **dua-duanya bareng**.
- **Streak** = klip voice Hina `streak_*.mp3` (seperti sekarang, tanpa overlay).
- File baru dipakai **di dalam** voicepack Hina (bukan menggantikan suara dasar global).

Assumptions:
- `wrong answer.mp3` di-rename jadi `wronganswer.mp3` (buang spasi → aman di URL, penting
  karena repo deploy ke Vercel/Linux yang case- & path-sensitive).
- File lama `correct_1..4` & `wrong_1..3` **tetap dipakai** (tidak dihapus) — beda dari plan
  sebelumnya yang salah tangkap ("di timpa"). Di sini maksudnya **overlay**, bukan replace.

---

## Architecture / proposed approach

Tambahkan satu lapisan data baru `overlays` di registry `VOICES` (SFX yang diputar
**bersamaan** dengan klip voice, bukan menggantikannya), lalu satu helper murni
`feedbackFiles(voice, kind, rng)` yang mengembalikan daftar path (overlay dulu, lalu klip
voice). `playCorrectSound`/`playWrongSound` memutar **semua** path itu; kalau kosong → jatuh
ke synth dasar seperti sekarang. `playStreakSound` tidak berubah.

---

## Step-by-step tasks

> Jalankan semua perintah dari `C:\Users\maddo\Documents\japanese-quiz` (Git Bash).

### Task 1 — Rename `wrong answer.mp3` → `wronganswer.mp3` (commit A)

```bash
cd /c/Users/maddo/Documents/japanese-quiz/public/voices/hina
mv -f "wrong answer.mp3" wronganswer.mp3
ls -1 | sort
```

**Verify** — ada `rightanswer.mp3` + `wronganswer.mp3`, **tidak ada** nama berspasi:

```bash
cd /c/Users/maddo/Documents/japanese-quiz
ls -1 public/voices/hina | sort
# correct_1.mp3 correct_2.mp3 correct_3.mp3 correct_4.mp3
# rightanswer.mp3 streak_1.mp3 streak_2.mp3 streak_3.mp3 streak_4.mp3
# streak_5.mp3 streak_6.mp3 wrong_1.mp3 wrong_2.mp3 wrong_3.mp3 wronganswer.mp3
ls -1 public/voices/hina | wc -l                       # -> 15
ls -1 public/voices/hina | grep " " || echo "no spaces (good)"
```

Commit:

```bash
git add public/voices/hina/rightanswer.mp3 public/voices/hina/wronganswer.mp3
git commit -m "assets(voice): tambah rightanswer & wronganswer untuk pack hina"
```

---

### Task 2 — TDD: tambah `overlays` di registry `hina` (commit B)

**2a. Update test dulu** (`src/features/audio/voices.test.js`). Ganti 2 test yang sekarang
berbunyi `voice hina: correct kosong …` dan `semua file hina yang dipakai …` menjadi:

```js
test('voice hina: 4 correct / 3 wrong / 6 streak + overlay right/wrong', () => {
  const v = VOICES.hina;
  assert.ok(v, 'VOICES.hina harus ada');
  assert.equal(v.files.correct.length, 4);
  assert.equal(v.files.wrong.length, 3);
  assert.equal(v.files.streak.length, 6);
  assert.deepEqual(v.overlays.correct, ['/voices/hina/rightanswer.mp3']);
  assert.deepEqual(v.overlays.wrong, ['/voices/hina/wronganswer.mp3']);
});

test('semua path hina unik & menunjuk ke /voices/hina/', () => {
  const v = VOICES.hina;
  const all = [
    ...v.files.correct, ...v.files.wrong, ...v.files.streak,
    ...v.overlays.correct, ...v.overlays.wrong,
  ];
  assert.equal(all.length, 15);
  assert.equal(new Set(all).size, 15, 'tidak boleh ada path duplikat');
  for (const p of all) assert.match(p, /^\/voices\/hina\/[a-z0-9_]+\.mp3$/);
});
```

**2b. Run → expect FAIL** (`overlays` belum ada; `correct` masih `[]`):

```bash
npm test 2>&1 | grep -E "voice hina|semua path hina|ℹ (tests|pass|fail)"
# expect: 2 test GAGAL (Cannot read properties of undefined / length 0 !== 4); ℹ fail 2
```

**2c. Implement** — ganti entry `hina` di `src/features/audio/voices.js` (baris 32–45) jadi:

```js
  // Pack #1 — suara Hina Chono (klip TTS).
  //   files    : klip VOICE Hina (dipilih acak)
  //   overlays : SFX yang diputar BARENG klip voice (bukan menggantikan)
  hina: {
    files: {
      correct: ['/voices/hina/correct_1.mp3', '/voices/hina/correct_2.mp3',
                '/voices/hina/correct_3.mp3', '/voices/hina/correct_4.mp3'],
      wrong:   ['/voices/hina/wrong_1.mp3',   '/voices/hina/wrong_2.mp3',
                '/voices/hina/wrong_3.mp3'],
      streak:  ['/voices/hina/streak_1.mp3',  '/voices/hina/streak_2.mp3',
                '/voices/hina/streak_3.mp3',  '/voices/hina/streak_4.mp3',
                '/voices/hina/streak_5.mp3',  '/voices/hina/streak_6.mp3'],
    },
    overlays: {
      correct: ['/voices/hina/rightanswer.mp3'],
      wrong:   ['/voices/hina/wronganswer.mp3'],
    },
    synth: { correct: 'gong', wrong: 'thud', streak: 'gong-big' },
  },
```

**2d. Run → expect PASS:**

```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
# expect: ℹ tests 52 / ℹ pass 52 / ℹ fail 0
```

Commit:

```bash
git add src/features/audio/voices.js src/features/audio/voices.test.js
git commit -m "feat(voice): hina punya overlay rightanswer/wronganswer"
```

---

### Task 3 — TDD: `feedbackFiles` + putar overlay di `sfx.js` (commit C)

**3a. Tambah test dulu** di `src/utils/sfx.routing.test.js`. Ubah baris import di atas jadi:

```js
import { setActiveVoice, getActiveVoiceKey, streakTierIndex, STREAK_TIER_BY_LEVEL, answerFeedbackKind, feedbackFiles } from './sfx.js';
import { VOICES } from '../features/audio/voices.js';
```

Lalu tambahkan di bawah:

```js
test('feedbackFiles: overlay + klip voice diputar DUA-DUANYA', () => {
  const voice = { files: { correct: ['/a.mp3'] }, overlays: { correct: ['/ov.mp3'] } };
  assert.deepEqual(feedbackFiles(voice, 'correct', () => 0), ['/ov.mp3', '/a.mp3']);
});

test('feedbackFiles: tanpa overlays → hanya klip voice', () => {
  const voice = { files: { wrong: ['/w.mp3'] } };
  assert.deepEqual(feedbackFiles(voice, 'wrong', () => 0), ['/w.mp3']);
});

test('feedbackFiles: voice kosong / taiko → [] (fallback synth)', () => {
  assert.deepEqual(feedbackFiles(VOICES.taiko, 'correct'), []);
  assert.deepEqual(feedbackFiles(undefined, 'wrong'), []);
  assert.deepEqual(feedbackFiles({ files: { correct: [] } }, 'correct'), []);
});
```

**3b. Run → expect FAIL** (`feedbackFiles` belum diekspor):

```bash
npm test 2>&1 | grep -E "feedbackFiles|does not provide|ℹ (tests|pass|fail)"
# expect: SyntaxError "does not provide an export named 'feedbackFiles'"; ℹ fail 1
```

**3c. Implement.** Di `src/utils/sfx.js`, sisipkan helper ini **tepat di bawah**
`answerFeedbackKind` (setelah baris `export const answerFeedbackKind = …`):

```js
// Daftar file yang harus diputar untuk satu jenis umpan balik.
// Bisa >1: overlay SFX dulu, lalu klip voice — dua-duanya diputar BARENG oleh pemanggil.
// rng bisa di-inject untuk test.
export const feedbackFiles = (voice, kind, rng = Math.random) => {
  const out = [];
  const ov = pickFile(voice?.overlays?.[kind], rng);
  if (ov) out.push(ov);
  const clip = pickFile(voice?.files?.[kind], rng);
  if (clip) out.push(clip);
  return out;
};
```

Lalu ganti **body** `playCorrectSound` dan `playWrongSound` (blok "API publik") jadi:

```js
export const playCorrectSound = () => {
  // Tanpa pack aktif → suara dasar (chime).
  if (!activeVoiceKey) return synthChime();
  const paths = feedbackFiles(getVoice(activeVoiceKey), 'correct');
  // Putar SEMUA (overlay + klip voice) bersamaan.
  if (paths.length) { paths.forEach((p) => playFile(p)); return; }
  synthChime();
};

export const playWrongSound = () => {
  if (!activeVoiceKey) return synthThud();
  const paths = feedbackFiles(getVoice(activeVoiceKey), 'wrong');
  if (paths.length) { paths.forEach((p) => playFile(p)); return; }
  synthThud();
};
```

> `playStreakSound` **tidak diubah** (streak = klip Hina streak saja).

**3d. Run → expect PASS:**

```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"
# expect: ℹ tests 55 / ℹ pass 55 / ℹ fail 0
```

Commit:

```bash
git add src/utils/sfx.js src/utils/sfx.routing.test.js
git commit -m "feat(sfx): putar overlay rightanswer/wronganswer bareng voice hina"
```

---

### Task 4 — Perbarui komentar routing di `EffectContext.jsx` (commit D)

Perilaku tidak berubah, hanya komentar yang sekarang kurang tepat. Di
`src/features/effects/EffectContext.jsx`, ganti blok komentar:

Dari:

```js
    // Suara (keputusan desain):
    //  - milestone streak (3,5,10,…,100) → klip voice Hina tier-nya
    //  - jawaban salah                    → klip voice Hina wrong
    //  - jawaban benar biasa              → chime dasar (Hina DIAM)
    // Dipanggil di sini karena hanya EffectContext yang tahu streak barunya
    // (call site memanggil triggerEffect SEBELUM streak naik).
```

Jadi:

```js
    // Suara (keputusan desain):
    //  - milestone streak (3,5,10,…,100) → klip voice Hina streak (per-tier)
    //  - jawaban salah                    → wronganswer.mp3 + voice Hina wrong
    //  - jawaban benar biasa              → rightanswer.mp3 + voice Hina correct
    // Dipanggil di sini karena hanya EffectContext yang tahu streak barunya
    // (call site memanggil triggerEffect SEBELUM streak naik).
```

**Verify** (tidak ada perubahan perilaku, semua tetap hijau):

```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"    # 55 / 55 / 0
npm run lint                                      # exit 0, 0 error
npm run build 2>&1 | grep -E "built in|error"     # ✓ built in …, tanpa "error"
git add src/features/effects/EffectContext.jsx
git commit -m "docs(effects): perbarui komentar routing suara (overlay + voice)"
```

---

## Tests / validation

- Unit (Node): test di `voices.test.js` memaku bentuk registry (4/3/6 + 2 overlay, 15 path
  unik); test di `sfx.routing.test.js` memaku `feedbackFiles` (overlay+voice bareng, tanpa
  overlay, dan fallback `[]`). Gate akhir: `npm test` → `ℹ tests 55 / ℹ pass 55 / ℹ fail 0`.
- Gate kualitas: `npm run lint` → 0 error; `npm run build` → built tanpa error.
- Gate aset: `ls -1 public/voices/hina | wc -l` → `15`; tidak ada nama berspasi.
- Gate dengar (manual, browser — kode audio tak bisa di-unit-test):
  ```bash
  npm run dev
  ```
  → `/settings` → panel Developer → **✨ Buka & Pakai Efek** → main kuis:
  - jawab **benar** → `rightanswer.mp3` **dan** klip Hina (`correct_*`) terdengar bareng.
  - jawab **salah** → `wronganswer.mp3` **dan** klip Hina (`wrong_*`) terdengar bareng.
  - capai **streak 3** → `streak_1.mp3` (`いい調子〜！`).
- TDD per task kode: tulis/ubah test → run (fail) → implement → run (pass) → commit.

## Risks, tradeoffs, and open questions

- **Dua audio bareng bisa terdengar "muddy".** Kalau `rightanswer.mp3` ternyata juga berisi
  suara orang (bukan SFX pendek), dia akan tumpang-tindih dengan klip Hina. Tidak bisa
  diverifikasi tanpa mendengar — cek di gate dengar. Kalau kacau, alternatif cepat: matikan
  salah satu array (kosongkan `files.correct` → tinggal overlay saja, atau sebaliknya).
- **`wronganswer.mp3` (48 kHz, 256 kbps)** beda dari klip lain (44.1 kHz, 128 kbps) — volume
  bisa terasa beda. Opsional: normalisasi pakai ffmpeg (belum terpasang).
- **Streak tidak di-overlay.** Saat milestone, hanya klip Hina streak yang bunyi (tanpa
  `rightanswer.mp3`). Kalau maunya milestone juga dapat overlay, ubah `playStreakSound`
  agar memutar `feedbackFiles(voice,'streak')` + tetap pakai tier — **tanyakan dulu**.
- **Kembali ke "Hina bunyi tiap jawaban benar".** Commit `1a291be` sengaja bikin benar =
  chime karena dulu terasa aneh. Sekarang benar = overlay + voice Hina lagi. Kalau nanti
  terasa repetitif, opsi lama (acak 25% / tiap kelipatan 5) masih bisa dipasang.
- **`pickFile` pakai `Math.random`** → tiap jawaban benar klip Hina-nya acak dari 4; overlay
  cuma 1 file jadi selalu sama. (Sengaja.)
- Open question: apakah `rightanswer.mp3`/`wronganswer.mp3` seharusnya juga bunyi saat
  **tanpa pack aktif** (menggantikan chime/thud global)? Plan ini: **tidak** (hanya di pack
  Hina), sesuai "di voice Hina".
- Open question: `docs/voice-pack-1-hina.md` masih bilang 3 correct / 3 wrong — update atau
  biarkan?
