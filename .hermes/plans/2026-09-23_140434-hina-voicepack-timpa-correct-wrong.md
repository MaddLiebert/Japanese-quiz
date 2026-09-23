# Plan — Timpa klip `correct`/`wrong` voicepack Hina dengan 2 file baru

## Goal

Ganti isi voicepack `hina` supaya jawaban **benar** memakai `rightanswer.mp3` dan
jawaban **salah** memakai `wrong answer.mp3` (menimpa file lama), menyisakan tepat
**8 file**: `correct_1.mp3`, `wrong_1.mp3`, `streak_1..6.mp3`.

---

## Current context / assumptions

Repo: `C:\Users\maddo\Documents\japanese-quiz` (Vite + React 19, test = `node --test`,
52 test hijau saat ini). Shell: **Git Bash** di Windows.

Kondisi `public/voices/hina/` sekarang (sudah diverifikasi):

| File | Status | Dipakai kode? |
|---|---|---|
| `correct_1..4.mp3` | dilacak git | ❌ tidak (sejak commit `1a291be` `correct: []`) |
| `wrong_1..3.mp3` | dilacak git | ✅ `wrong_1`, `wrong_2`, `wrong_3` |
| `streak_1..6.mp3` | dilacak git | ✅ semua |
| `rightanswer.mp3` | **untracked** (baru, 256 kbps) | ❌ belum dirujuk |
| `wrong answer.mp3` | **untracked** (baru, 256 kbps, **ada spasi**) | ❌ belum dirujuk |

- `src/features/audio/voices.js` baris 35–45: entry `hina` sekarang
  `correct: []`, `wrong: [3 file]`, `streak: [6 file]`.
- `src/utils/sfx.js`:
  - `playCorrectSound()` → kalau ada pack aktif & `files.correct` ada isi → putar file;
    kalau kosong → `synthChime()`. **Jadi cukup isi `files.correct` dan Hina langsung
    bunyi lagi untuk jawaban benar — tidak perlu ubah logika.**
  - `playWrongSound()` → sama, putar `files.wrong` (acak) atau `synthThud()`.
  - `answerFeedbackKind(type, onMilestone)` → `'streak'` hanya saat benar+tepat milestone,
    sisanya `type` (`'correct'`/`'wrong'`).
- `src/features/effects/EffectContext.jsx` baris ~167–174 memakai helper di atas:
  milestone → `playStreakSound`, salah → `playWrongSound`, benar biasa → `playCorrectSound`.
- `md5sum` membuktikan **tidak ada file yang duplikat** (semua 15 file beda isi).
- `grep` membuktikan `rightanswer` / `wrong answer` **belum dirujuk** di mana pun.

Keputusan user (dari sesi ini):
- `rightanswer.mp3` **menimpa** `correct_1.mp3`; `correct_2..4.mp3` **dihapus**.
- `wrong answer.mp3` **menimpa** `wrong_1.mp3`; `wrong_2..3.mp3` **dihapus**.
- Jawaban **benar** pakai suara Hina lagi (bukan chime).

Assumptions:
- `wrong answer.mp3` dengan spasi di-rename jadi `wrong_1.mp3` (spasi hilang → aman di URL).
- 4 klip lama `correct_2..4` & 2 klip `wrong_2..3` memang dibuang (user bilang "di timpa aja").

---

## Architecture / proposed approach

Tidak ada perubahan arsitektur: `sfx.js` sudah memutar file dari `voice.files.correct`
/ `voice.files.wrong` kalau array-nya berisi. Jadi pekerjaannya **hampir semua data**:
(1) tukar/nama-ulang file di `public/voices/hina/`, lalu (2) isi ulang array di
`voices.js` + update test, dan (3) rapikan komentar usang di `EffectContext.jsx`.

---

## Step-by-step tasks

> Jalankan semua perintah dari `C:\Users\maddo\Documents\japanese-quiz` (Git Bash).

### Task 1 — Tukar file: timpa + hapus yang lama (commit A)

```bash
cd /c/Users/maddo/Documents/japanese-quiz
cd public/voices/hina

# 1) Timpa correct_1.mp3 dengan rightanswer.mp3 (mv -f = overwrite)
mv -f rightanswer.mp3 correct_1.mp3

# 2) Timpa wrong_1.mp3 dengan "wrong answer.mp3" (perhatikan tanda kutip karena ada spasi)
mv -f "wrong answer.mp3" wrong_1.mp3

# 3) Hapus variasi lama yang tidak dipakai lagi
git rm -q correct_2.mp3 correct_3.mp3 correct_4.mp3
git rm -q wrong_2.mp3 wrong_3.mp3

cd /c/Users/maddo/Documents/japanese-quiz
```

**Verify** — harus tepat 8 file, tanpa spasi di nama, tidak ada `rightanswer`/`wrong answer`:

```bash
ls -1 public/voices/hina | sort
# correct_1.mp3
# streak_1.mp3
# streak_2.mp3
# streak_3.mp3
# streak_4.mp3
# streak_5.mp3
# streak_6.mp3
# wrong_1.mp3
ls -1 public/voices/hina | wc -l     # -> 8
ls -1 public/voices/hina | grep -i " " || echo "no spaces (good)"
```

Commit:

```bash
git add -A public/voices/hina
git commit -m "assets(voice): timpa correct/wrong hina dgn rightanswer & wrong answer"
```

---

### Task 2 — TDD: update registry `hina` (commit B)

**2a. Update test dulu** (`src/features/audio/voices.test.js`). Ganti 2 test berikut:

Dari:

```js
test('voice hina: correct kosong (benar = chime dasar), 3 wrong / 6 streak', () => {
  const v = VOICES.hina;
  assert.ok(v, 'VOICES.hina harus ada');
  assert.deepEqual(v.files.correct, [], 'klip correct sengaja tidak dipakai');
  assert.equal(v.files.wrong.length, 3);
  assert.equal(v.files.streak.length, 6);
});

test('semua file hina yang dipakai ada di /voices/hina/ dan path unik', () => {
  const all = [
    ...VOICES.hina.files.correct,
    ...VOICES.hina.files.wrong,
    ...VOICES.hina.files.streak,
  ];
  assert.equal(all.length, 9);
  assert.equal(new Set(all).size, 9, 'tidak boleh ada path duplikat');
  for (const p of all) assert.match(p, /^\/voices\/hina\/[a-z]+_\d+\.mp3$/);
});
```

Jadi:

```js
test('voice hina: 1 correct / 1 wrong / 6 streak', () => {
  const v = VOICES.hina;
  assert.ok(v, 'VOICES.hina harus ada');
  assert.equal(v.files.correct.length, 1);
  assert.equal(v.files.wrong.length, 1);
  assert.equal(v.files.streak.length, 6);
});

test('semua file hina yang dipakai ada di /voices/hina/ dan path unik', () => {
  const all = [
    ...VOICES.hina.files.correct,
    ...VOICES.hina.files.wrong,
    ...VOICES.hina.files.streak,
  ];
  assert.equal(all.length, 8);
  assert.equal(new Set(all).size, 8, 'tidak boleh ada path duplikat');
  for (const p of all) assert.match(p, /^\/voices\/hina\/[a-z]+_\d+\.mp3$/);
});
```

**2b. Run → expect FAIL** (registry masih `correct: []` / 3 wrong):

```bash
npm test 2>&1 | grep -E "voice hina|semua file hina|ℹ (tests|pass|fail)"
# expect: 2 test baru GAGAL (length 0 !== 1, 3 !== 1); ℹ fail 2
```

**2c. Implement** — ganti isi entry `hina` di `src/features/audio/voices.js`
(baris 32–45) jadi:

```js
  // Pack #1 — suara Hina Chono (klip TTS). 1 correct + 1 wrong + 6 streak tier.
  hina: {
    files: {
      correct: ['/voices/hina/correct_1.mp3'],
      wrong:   ['/voices/hina/wrong_1.mp3'],
      streak:  ['/voices/hina/streak_1.mp3',  '/voices/hina/streak_2.mp3',
                '/voices/hina/streak_3.mp3',  '/voices/hina/streak_4.mp3',
                '/voices/hina/streak_5.mp3',  '/voices/hina/streak_6.mp3'],
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
git commit -m "feat(voice): hina pakai 1 correct + 1 wrong (klip baru)"
```

---

### Task 3 — Rapikan komentar usang di `EffectContext.jsx` (commit C)

Perilaku **tidak berubah** (routing sudah benar lewat `answerFeedbackKind`); hanya
komentar yang sekarang bohong ("Hina DIAM"). Di `src/features/effects/EffectContext.jsx`,
ganti blok komentar:

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
    //  - milestone streak (3,5,10,…,100) → klip voice Hina tier-nya
    //  - jawaban salah                    → klip voice Hina wrong
    //  - jawaban benar biasa              → klip voice Hina correct
    // Dipanggil di sini karena hanya EffectContext yang tahu streak barunya
    // (call site memanggil triggerEffect SEBELUM streak naik).
```

**Verify** (tidak ada perubahan perilaku, semua tetap hijau):

```bash
npm test 2>&1 | grep -E "ℹ (tests|pass|fail)"   # 52 / 52 / 0
npm run lint                                     # exit 0, 0 error
npm run build 2>&1 | grep -E "built in|error"    # ✓ built in …, tanpa "error"
git add src/features/effects/EffectContext.jsx
git commit -m "docs(effects): perbarui komentar routing suara (benar = hina)"
```

---

### Task 4 (OPSIONAL) — Sinkronkan dokumen lama

`docs/voice-pack-1-hina.md` masih menyebut 3 correct / 3 wrong / 6 streak. Kalau mau
konsisten, update tabel "3a Correct" dan "3b Wrong" jadi 1 baris masing-masing
(`correct_1.mp3` = うん、大正解！; `wrong_1.mp3` = えー？はずれ〜！). Tidak wajib.

---

## Tests / validation

- Unit (Node): 2 test di `voices.test.js` memaku bentuk registry (1/1/6, total 8, path
  unik & cocok regex). Gate akhir: `npm test` → `ℹ tests 52 / ℹ pass 52 / ℹ fail 0`.
- Gate kualitas: `npm run lint` → 0 error; `npm run build` → built tanpa error.
- Gate aset: `ls -1 public/voices/hina | wc -l` → `8`; tidak ada nama berspasi.
- Gate dengar (manual, browser — kode audio tak bisa di-unit-test):
  ```bash
  npm run dev
  ```
  → `/settings` → panel Developer → **✨ Buka & Pakai Efek** → main kuis:
  - jawab **benar** → harus bunyi `rightanswer` (isi `correct_1.mp3`).
  - jawab **salah** → harus bunyi `wrong answer` (isi `wrong_1.mp3`).
  - capai **streak 3** → `streak_1.mp3` (`いい調子〜！`).
- TDD per task kode: tulis/ubah test → run (fail) → implement → run (pass) → commit.

## Risks, tradeoffs, and open questions

- **Isi audio tidak bisa diverifikasi mesin.** Kita tidak bisa "dengar" file, jadi
  dipastikan hanya bahwa file valid MP3 (header `ID3`, 128–256 kbps) — bukan bahwa
  `rightanswer.mp3` benar-benar terdengar seperti "jawaban benar". Kalau ternyata isinya
  ketuker, itu baru ketahuan di gate dengar (Task 5 manual).
- **Balik ke perilaku lama yang tadinya dikeluhkan.** Commit `1a291be` sengaja bikin
  jawaban benar = chime karena "tiap bener ada suara Hina, kek aneh". Dengan plan ini
  Hina **bunyi lagi di SETIAP jawaban benar**. User sadar memilih ini, tapi kalau nanti
  terasa repetitif lagi, opsi sebelumnya (acak 25% / tiap kelipatan 5) masih bisa dipakai.
- **Beda bitrate/sample-rate** (`rightanswer` 256 kbps, `wrong answer` 256 kbps/48 kHz vs
  sisanya 128 kbps/44.1 kHz) — tidak masalah fungsional, hanya volume/karakter bisa
  sedikit beda. Opsional: normalisasi pakai ffmpeg (belum terpasang) kalau mau seragam.
- **File lama hilang permanen?** Tidak — `correct_2..4` & `wrong_2..3` ada di git history
  (commit `0cdf230`), gampang dikembalikan (`git checkout <sha> -- public/voices/hina/...`).
- **`rightanswer.mp3` / `wrong answer.mp3` belum pernah di-commit** — setelah `mv`, file
  sumbernya hilang dari working tree; kalau salah, harus ambil ulang dari `Downloads`.
- Open question: apakah `synthChime` tetap jadi fallback `playCorrectSound` saat file gagal
  load? (Sekarang begitu; aman, tidak diubah oleh plan ini.)
- Open question: Task 4 (update `docs/voice-pack-1-hina.md`) dikerjakan atau dilewati?
