# Plan: Death Quiz 死闘 — mode endless eksklusif rank Shogun

**Tanggal**: 2026-09-27 05:29
**Repo**: `C:\Users\maddo\Documents\japanese-quiz` (React 19 + Vite + Tailwind v4 + Motion)
**Baseline terukur**: HEAD `83e4a88` · `npm test` **203 pass / 0 fail** · `npm run lint` 0 error (22 warning pre-existing) · `npm run build` ✓ · branch `main` (ahead/behind `0 0` — working tree bersih)

---

## Goal

Permintaan user (verbatim):

> "gw mau nambahin fitur baru, namanya death quiz, dimana cuma bisa di unlock pas nyentuh rank shogun doang, isi kontenya semua quiz ada di sana dan sistemnya endless, tapi ini bisa ngurangin exp si player, dan ada waktunya sama kaya quiz lain, dan ada masih nyambung sama kabel jumper di shop bisa di pake, sama semua voicepack bisa dipake juga."

User tidur + kasih otonomi penuh ("sekarang lu punya kehendak sendiri"), minta: planning matang, pelajari sifat user, eksekusi tanpa kesalahan, jangan halusinasi, **jangan push**.

---

## Fakta recon (terverifikasi, bukan asumsi)

| # | Fakta | Bukti |
|---|---|---|
| 1 | **`kabel_jumper` SUDAH ada di shop** dengan desc `'1x Hidup (Death Quiz)'`, harga 800 medaru | `src/features/items/items.js:9` — item ini memang disiapkan buat fitur ini |
| 2 | Rank **Shogun = xp ≥ 20.000** (`getRank`), label `"Shogun 👹"` | `src/features/progress/ProgressContext.jsx:35-40` |
| 3 | Timer kuis existing = **7 detik** (mode Hard, `useQuizSession`) | `useQuizSession.js:187` — `setTimeLeft(diff === 'hard' ? 7 : null)` |
| 4 | Voicepack/efek **otomatis jalan** lewat `triggerEffect('correct'\|'wrong')` → EffectContext → sfx.js routing | `EffectContext.jsx:213` expose `{ triggerEffect, resetEffectStreak, active }` |
| 5 | Konten pilihan-ganda: hiragana 104 + katakana 46 + kotoba 876 + grammar 53 + kanji 86 = **1.165 soal** | `node -e` hitung langsung dari `src/data/*.json` |
| 6 | Mondai = 87 item **audio-chapter** (durasi audio 30-60 dtk) — **tidak cocok timer 7 detik** | `mondai.json[0]` + file `public/audio/*.mp3` ~1 MB each |
| 7 | `recordAnswer(id, benar, xp)` = XP + SRS + stats global; bonus streak +5% otomatis di `addXp` | `ProgressContext.jsx:319-381`, `streak.js` |
| 8 | WR & medaru hanya berubah lewat `completeQuiz(...)` (per sesi) | `ProgressContext.jsx:414-453` |
| 9 | Inventory punya tombol PAKAI generik yang cuma `consumeItem` (kopi/selotip belum punya efek — perilaku lama) | `Inventory.jsx:189` |
| 10 | `useQuizSession` punya builder soal pintar (distractor per script/row + fallback global) tapi **privat & belum ada testnya** | `useQuizSession.js:32-106` |
| 11 | ⚠️ Jebakan Windows: **jangan** taruh `deathQuiz.js` (murni) + `DeathQuiz.jsx` (komponen) di folder yang sama — base name case-insensitive bentrok (pernah kejadian di repo ini) | skill `japanese-quiz` gotcha |
| 12 | Dev server user sedang jalan di port 5173 & 5174 (dua-duanya app ini) — **reuse, jangan kill** | `curl` title check |

---

## Keputusan desain FINAL (dibuat sendiri, user tidur — semua konstanta bisa di-tune 1 baris)

### D1 — Gate unlock: pakai RANK STRING, bukan ambang kedua
`isDeathQuizUnlocked(rank)` = `rank.startsWith('Shogun')`, rank dari `getRank(progress.xp)` yang sudah ada.
→ **Single source of truth**, tidak ada "20.000" kedua yang bisa drift dari `getRank`. `DEATH_UNLOCK_XP = 20000` hanya untuk **tampilan** progress bar di layar terkunci (dikomentari jelas + dipin test).
Catatan: unlock = rank Shogun (20.000 XP), **bukan** achievement `grand_shogun` (10.000 XP) — beda hal.

### D2 — Konten: 5 pool pilihan-ganda (1.165 soal), Mondai DIKECUALIKAN
"Semua quiz" = semua konten kuis pilihan-ganda: hiragana/katakana/kotoba/grammar/kanji. Mondai tidak ikut karena formatnya audio percakapan 30-60 dtk — mustahil dengan timer 7 detik (bertentangan dengan spec user sendiri: "ada waktunya sama kaya quiz lain"). Dicatat di PRD.

### D3 — Sistem endless: queue refill otomatis
Semua 1.165 soal di-shuffle jadi queue; habis → refill otomatis (tanpa batas). Dijamin **tidak ada soal sama persis dua kali berurutan** (termasuk di batas refill). Run berakhir HANYA kalau mati (nyawa 0) atau keluar sukarela.

### D4 — Nyawa 3 (命) + item kabel jumper = revive
- `DEATH_START_LIVES = 3`. Salah **atau** kehabisan waktu = −1 nyawa.
- Nyawa 0 = **MATI** → kalau punya `kabel_jumper`: layar revive muncul (pakai → nyawa jadi 1, run lanjut, skor & soal lanjut; `consumeItem`). Bisa dipakai berkali-kali selama itemnya ada.
- Tidak punya jumper / memilih menyerah → run selesai + penalti.
- Alasan 3 nyawa (bukan 1): timer 7 dtk + konten campuran (grammar susah) — 1 nyawa bikin run cuma 2-3 soal, "endless"-nya jadi bohong. 3 nyawa = run 8-25 soal, item jumper tetap jadi penyelamat utama.

### D5 — Timer 7 detik per soal (sama kaya kuis lain / mode Hard)
`DEATH_TIMER_S = 7`, reset tiap soal, merah + peringatan saat ≤3 dtk. Waktu habis = dihitung salah (seperti `useQuizSession` yang sudah ada).

### D6 — Ekonomi XP: +40/benar, −300 saat mati
- `DEATH_XP_PER_CORRECT = 40` — lewat `recordAnswer` yang sudah ada → SRS & weak items tetap tercatat, bonus streak +5% otomatis.
- `DEATH_XP_PENALTY = 300` — **hanya saat benar-benar mati** (bukan saat keluar sukarela). Diterapkan lewat action baru **`loseXp(amount)`** di ProgressContext (clamp ≥ 0, hitung ulang level; TIDAK menyentuh streak/achievement). Sengaja BUKAN `addXp(-300)` karena `addXp` kena bonus streak & logika streak harian.
- **WR & medaru TIDAK disentuh** (tidak memanggil `completeQuiz`). Alasan: kalau pakai `completeQuiz`, "jawab 1 soal benar lalu keluar" = menang → WR naik = exploit. Mode ini murni XP + SRS.
- Keluar sukarela (tombol kembali, dikonfirmasi dulu) = **tanpa penalti** — retreat yang sah.

### D7 — Kabel jumper juga diamankan di Inventory
Tombol PAKAI generik untuk `kabel_jumper` di Inventory diganti label info ("Dipakai otomatis di Death Quiz") — supaya item 800 medaru tidak terbuang sia-sia di luar mode. Item lain tidak diubah.

### D8 — Voicepack: otomatis semua pack (tidak ada kode khusus)
Tiap jawaban memanggil `triggerEffect('correct'/'wrong')` + `resetEffectStreak()` saat mulai → pack aktif (visual + voice) main seperti di kuis lain. **Semua voicepack bisa dipake** tanpa perubahan registry.

### D9 — Home: kartu ke-6 "Death Quiz" (terkunci terlihat, bukan disembunyikan)
Kartu tampil selalu (user tahu targetnya), versi terkunci: redup + subtitle "🔒 Rank Shogun". Klik → `/death-quiz` → layar terkunci (rank sekarang + progress XP ke 20.000). Route `/death-quiz` + import diwire di commit yang sama dengan halamannya (biar build beneran nge-compile — aturan repo).

---

## Arsitektur (file)

| File | Aksi | Isi |
|---|---|---|
| `src/features/quiz/questionBuilder.js` | **BARU** | Ekstraksi MURNI dari `useQuizSession`: `shuffle`, `pickDistractors`, `toOptionShape`, `buildOptions` — dataset dikirim sebagai PARAMETER (aturan repo: modul `node --test` dilarang import JSON) |
| `src/features/quiz/questionBuilder.test.js` | **BARU** | 8 test |
| `src/features/quiz/useQuizSession.js` | EDIT | Pakai `questionBuilder` (pindahan verbatim, perilaku identik) — supaya tidak ada DUA builder soal yang bisa drift |
| `src/features/deathquiz/deathQuiz.js` | **BARU** | Logika MURNI: konstanta, `isDeathQuizUnlocked`, `allQuizItems`, `refillDeathQueue`, `drawNextDeathItem`, `applyDeathPenalty` |
| `src/features/deathquiz/deathQuiz.test.js` | **BARU** | 12 test |
| `src/features/deathquiz/useDeathQuizSession.js` | **BARU** | Hook sesi (mirror `useQuizSession`): fase `intro/playing/revive/gameover`, timer, nyawa, recordAnswer, triggerEffect, consumeItem, loseXp |
| `src/features/deathquiz/DeathQuizScreen.jsx` | **BARU** | UI 4 layar (terkunci / intro / main / revive / game over) — shell neo-brutalist sesuai repo |
| `src/features/progress/ProgressContext.jsx` | EDIT | + `loseXp(amount)` + expose di provider value |
| `src/App.jsx` | EDIT | + import + `<Route path="/death-quiz">` |
| `src/pages/Home.jsx` | EDIT | + kartu ke-6 Death Quiz (locked/unlocked) |
| `src/features/inventory/Inventory.jsx` | EDIT | jumper → label info, bukan tombol PAKAI |
| `PRD.md` | EDIT | + §9.12 Death Quiz 死闘 + catatan §16 |

**Penamaan aman Windows**: `deathQuiz.js` (murni) vs `DeathQuizScreen.jsx` (komponen) — base name beda, tidak bentrok case-insensitive.

---

## Tasks (TDD, satu commit per fase)

### Task 1 — `questionBuilder` murni + refactor `useQuizSession`
1. Tulis `questionBuilder.test.js` DULU (RED — modul belum ada).
2. Pindahkan `shuffle`/`pickDistractors`/`toOptionShape`/`buildOptions` dari `useQuizSession.js` ke `questionBuilder.js` **verbatim**, ganti referensi dataset langsung → parameter `datasets = { hiragana, katakana, kotoba, grammar, kanji }`. `shuffle(array, rng = Math.random)`.
3. `useQuizSession.js`: import `{ shuffle, buildOptions }` + `const DATASETS = {...}`; call site `buildOptions(item, availableItems, optionCount, DATASETS)`.
4. Gate: `npm test` = **211 pass** (203 + 8), lint 0 error (warning ≤ 22), build ✓ + smoke browser `/practice` (1 soal dijawab, 0 console error — bukti refactor tidak merusak).
5. Commit: `refactor(quiz): ekstrak questionBuilder murni + 8 test (persiapan Death Quiz)`

**Test contract (8)**:
1. `shuffle` permutasi + tidak mengubah input + array baru
2. `shuffle` deterministik dengan rng stub (rng→0.999)
3. `buildOptions` → 4 opsi, id unik, jawaban benar ada
4. `buildOptions` item kana → semua opsi script & type sama (hiragana:104 pool)
5. `buildOptions` item kotoba → opsi punya `meaning`/`meaning_id`
6. `buildOptions` item grammar → opsi punya `char`/`answer`
7. `buildOptions` item kanji → opsi punya `onyomi`/`kunyomi`
8. fallback tier-3: pool kecil (1 item) → tetap 4 opsi dari dataset global

### Task 2 — `deathQuiz.js` murni + test
1. `deathQuiz.test.js` DULU (RED).
2. Implementasi `deathQuiz.js` (import `shuffle` dari `../quiz/questionBuilder.js`).
3. Gate: `npm test` = **223 pass** (211 + 12), lint, build.
4. Commit: `feat(deathquiz): logika murni — queue endless, nyawa, penalti XP + 12 test`

**Test contract (12)**:
1. `isDeathQuizUnlocked('Shogun 👹')` true
2. `isDeathQuizUnlocked` false untuk 'Sensei 📜'/'Senpai 🗡️'/'Kouhai 🐣'
3. `isDeathQuizUnlocked` aman untuk null/undefined/non-string/'' 
4. konstanta terkunci: lives 3 · timer 7 · xp 40 · penalti 300 · unlock 20000
5. `applyDeathPenalty(25000)` = 24700
6. clamp: 300→0, 100→0, 0→0
7. input aneh: NaN→0, -50→0, undefined→0
8. `allQuizItems` = 1165 item (dari data asli via readFileSync), urutan pool hiragana→kanji
9. `refillDeathQueue` = isi sama (multiset), array baru, input tidak berubah
10. `drawNextDeathItem` menyusut 1 tiap draw + item selalu valid
11. endless: 2.500 draw dari 100 item → tidak pernah throw/undefined (refill otomatis)
12. tidak ada dua soal id sama berurutan, termasuk di batas refill (seeded LCG)

### Task 3 — hook + UI + wiring (fitur hidup)
1. `useDeathQuizSession.js`: fase, timer (pola `useQuizSession`: ref + interval + timeout effect), `selectAnswer` (delay 900ms benar / 1500ms salah), `useJumper`, `finalizeDeath` (hitung `realLoss` via `applyDeathPenalty`, panggil `loseXp`), `start`, cleanup timer di unmount.
2. `DeathQuizScreen.jsx`: 4 layar. Semua label bilingual id/en via `useLanguage`; angka & teks yang diverifikasi E2E: `命 ×{lives}`, `Waktu {timeLeft}s`, `Skor {score}`, tombol `Mulai`, `Pakai Kabel Jumper`, `Menyerah`, `Main Lagi`.
3. `ProgressContext.jsx`: `loseXp` (setProgress murni, clamp, level recalc) + masuk provider value.
4. `App.jsx`: import + route `/death-quiz` (satu langkah, lalu build).
5. `Home.jsx`: kartu ke-6 setelah Speaking — accent `shu` (tema bahaya), ikon bulat kanji `死`, terkunci → `opacity-60` + subtitle `🔒 Rank Shogun`.
6. `Inventory.jsx`: `kabel_jumper` → label info (non-button), lainnya tetap.
7. Gate: `npm test` = 223, lint, build + **E2E browser CDP** (lihat bawah).
8. Commit: `feat(deathquiz): mode Death Quiz 死闘 — endless, 3 nyawa, revive kabel jumper, kartu Home`

### Task 4 — PRD + vault + penutup
1. `PRD.md` §9.12 + §16 catatan penalti XP.
2. Log Eksekusi di plan ini + vault (`Hasil update (demo).md`, `Project Japanese Quiz.md`, `Key Decisions.md`, `Tracking Commit & Push.md`).
3. Gate akhir: test/lint/build + E2E ulang sekali. **Tidak push.**

---

## Verifikasi browser (CDP — tool dari skill repo, `scripts/cdp-verify.mjs`)

Dev server: **reuse** yang sudah jalan (5173/5174) — jangan kill proses user.

### Skenario A — Shogun + flow penuh (seed: xp 25000, jumper ×2, pack `pack_06`)
1. Seed via `addInitScript` SEBELUM mount (termasuk `ui_language:'id'`).
2. `/death-quiz` → assert teks intro + tombol `Mulai`.
3. Klik `Mulai` → assert `命 ×3` + `Waktu` + `Skor 0`; pasang recorder efek sebelum jawab.
4. Jawab (klik opsi pertama) berulang: setelah tiap jawaban baca `命 ×N` — assert nyawa turun saat salah; assert `window.__seen.svg > 0` (efek pack `ink` jalan = voicepack terpakai).
5. Sampai mati → assert layar revive + tombol `Pakai Kabel Jumper`; klik → assert lanjut main (`命 ×1`) + `ownedItems.kabel_jumper` 2→1.
6. Mati lagi → pakai jumper terakhir (1→0) → main lagi → mati → assert layar game over + `Penalti` tampil + `xp` di localStorage turun tepat **−300** dari nilai sebelum mati terakhir (jawaban salah tidak memberi XP).
7. Klik `Main Lagi` → assert run baru `命 ×3` `Skor 0`. Assert 0 console error.

### Skenario B — terkunci (seed: xp 15000 = Sensei)
1. `/death-quiz` → assert teks terkunci + `Shogun` + rank sekarang tampil; **tidak** ada tombol `Mulai`.
2. Home → assert kartu `Death Quiz` tampil + subtitle terkunci. 0 console error.

### Skenario C — regresi kuis biasa (setelah Task 1)
`/practice` → pilih 1 row → Start → jawab 1 soal → 0 console error (builder pindahan tetap normal).

---

## Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Refactor `useQuizSession` mengubah perilaku | Pindahan verbatim + 8 test baru + smoke browser `/practice` sebelum lanjut |
| StrictMode double-invoke | Semua efek samping (penalti, consumeItem) di EVENT HANDLER / timer callback, bukan di effect/updater; `setProgress` updater tetap murni |
| Soal sama dua kali berurutan di batas refill | Guard `avoidId` + test seeded LCG |
| Item jumper terbuang di Inventory | D7: tombol PAUSE diganti label |
| Drift ambang unlock | D1: gate dari `getRank`, bukan angka kedua |
| Waktu habis dobel-advance | Guard `isAnsweredRef` (pola sama dengan `useQuizSession` yang sudah terbukti) |

## Yang bisa user ubah setelah bangun (semua 1 baris konstanta)

- `DEATH_START_LIVES` (3) · `DEATH_TIMER_S` (7) · `DEATH_XP_PER_CORRECT` (40) · `DEATH_XP_PENALTY` (300) di `src/features/deathquiz/deathQuiz.js`
- Mau Mondai ikut? Butuh desain timer terpisah (audio panjang) — bukan sekadar tambah pool.
- Mau medaru/WR ikut bergerak? Bisa ditambah `completeQuiz` di akhir run (tapi ada exploit WR "menang 1 soal lalu keluar" — harus didesain dulu).

## Catatan aturan repo

- Plan ini **tidak** di-commit (aturan `.hermes/plans/`).
- Commit lokal per fase — **TIDAK push** (perintah user eksplisit).
- Komentar & pesan commit Bahasa Indonesia.
- Log Eksekusi ditambahkan ke file ini setelah selesai.

---

## Log Eksekusi (2026-09-27)

- **Task 1** — commit `eff34b9` (questionBuilder murni + 8 test).
- **Task 2** — commit `aaa5bcf` (deathQuiz.js murni + 12 test).
- **Task 3** — commit `74ddd77` (hook + UI 4 layar + route + kartu Home + `loseXp` + Inventory jumper).
- **Task 4** — commit `931fd3d` (PRD §9.12 + §16 + plan ini).
- **Gate akhir**: `npm test` **223 pass / 0 fail**, `npm run lint` **0 error** (22 warning pre-existing), `npm run build` ✓.
- **E2E CDP** (`scripts/cdp-verify.mjs` dari skill, headless Chrome):
  - Skenario A (seed xp 25000, jumper ×2, pack_06 ink, bahasa id): **12/12 PASS** — intro, HUD `命 ×3`/`Skor 0`/`Waktu 7s`, nyawa turun tiap salah, layar revive, pakai jumper 2→1→0, efek pack jalan (svg>0), game over, **XP turun tepat −300 (25000→24700)**, Main Lagi → run baru `命 ×3`. **0 console error, 0 page error.**
  - Skenario B (seed xp 15000 = Sensei): **4/4 PASS** — layar terkunci (Rank Shogun + rank sekarang + progress 15.000/20.000), tidak ada tombol Mulai, kartu Home terkunci (🔒). **0 console error, 0 page error.**
- **Tidak di-push** (perintah user). Working tree bersih, `main` ahead 4.
- Catatan tooling: `cdp-verify.mjs` dipatch agar tahan race `-32000 "Inspected target navigated or closed"` (retry, bukan fatal) — ini bikin re-`navigate()` saat seeding tidak lagi crash.

---

## Follow-up (2026-09-27) — Kompensasi Medaru (keputusan user)

**Alasan:** user menilai mode ini tidak adil — cuma mengurangi XP tanpa reward sepadan ("kan gak adil ya kalo ngurang exp doang, gw pengen kompensasi sepadan, kaya reach gold nya juga banyak").

**Keputusan (user pilih dari opsi):** skema **Escalating** — `5 medaru/benar` + bonus `25 × floor(skor/10)` (10→+75, 20→+150, 40→+300). Reward tambahan lain (achievement/drop item/WR) **tidak** dipilih → cukup medaru dulu.

**Desain:**
- `deathMedaruReward(score)` murni di `deathQuiz.js` (base + bonus, **min skor 5 → 0** sebagai anti-farm).
- Action baru `gainMedaru(amount)` di `ProgressContext` (+ expose di provider).
- `finishRun` membayar medaru SEKALI saat run benar-benar berakhir (mati / menyerah). **Keluar sukarela (`quit`) tidak dibayar** — konsisten dengan "tanpa penalti" & mencegah farming.
- UI: HUD preview `🪙 +N` (live), layar game over nampilkan chip `MEDARU +N` + kalimat kompensasi (atau pesan min. skor 5), intro dapat 1 bullet penjelasan.

**Verifikasi:**
- `npm test` **227 pass / 0 fail** (+4 test baru), lint **0 error**, build ✓.
- E2E CDP **Skenario C** (seed medaru 100, Shogun): **8/8 PASS** — jawab 10 benar (HUD `+75`), medaru **belum** nambah saat main, game over → saldo 100→**175** (+75 tepat), lalu Main Lagi mati skor 0 → **tetap 175** (anti-farm) + pesan "skor belum cukup". **0 console/page error.**
- E2E **regresi Skenario A**: 7/7 PASS (HUD, revive, jumper 2→1→0, XP −300 tepat, skor 0 → medaru tidak nambah, Main Lagi). **0 error.**
- Commit: `feat(deathquiz): kompensasi Medaru (escalating) — hadiah sepadan buat mode berisiko`. **Tidak push.**
