# Fix Sukuna v3 — non-streak rotasi, 必中 cut-all, BGM domain

Kritik user (verbatim ringkas, sesi 3 — 28/09):
1. **"soal non streak di bagian sukuna masih gak bener, kadang pake suara default"**
   → jurus non-streak harus **rotasi**: ke-1 蜘蛛の糸, ke-2 鵺, ke-3 蜘蛛の糸, … **selamanya**.
   → TIDAK PERNAH jatuh ke `playCorrectSound()` (pack Sukuna `correct: []` → chime default).
2. **"logic bagian domain itu pas kena tebasan langsung aja cepet sisain 1 jawaban bener,
   berulang di quiz berikutnya sampe waktu abis"**
   → 必中: tebasan pertama → **SEMUA opsi salah terbelah SEKALIGUS** (sisain 1 jawaban benar),
   bukan 1 opsi / 4 dtk (3 opsi = 12 dtk, kelamaan). Soal berikutnya ikut terbelah
   (langsung) sampai timer domain habis.
3. **"tambahin bgm mencekam khas sukuna buat domain dia"**
   → BGM 伏魔御廚子: taiko berat + motif koto hirajoshi + organ gelap + bel kuil
   (ambience lama cuma drone/pad/bisikan → kurang "mencekam").

## Akar masalah (kode)

| # | Temuan | Bukti |
|---|---|---|
| 1 | `sukunaTechniqueFor` null utk streak 2/4–19/21–29/… → `playCorrectSound()` → `VOICES.sukuna.files.correct = []` → `synthChime()` = **suara default** | `sukunaFx.js:76`, `voices.js:148`, `sfx.js:399` |
| 2 | `sukunaHitsumeCut` progresif: `count = floor(elapsed/4s)` → 1 opsi per 4 dtk | `sukunaFx.js:152`, `EffectContext.jsx:834` |
| 3 | `sukunaAmbience.js` = drone + pad + whisper + bel saja (bukan BGM) | `sukunaAmbience.js` |

## Perubahan

### A. `sukunaFx.js` — ladder + 必中
- `SUKUNA_LADDER = { 20: 'furube', 30: 'ryuurin', 50: 'sekai_zangeki' }` (momen gede tetap).
- `sukunaNonStreakIndex(streak)` = jumlah jawaban benar NON-ladder sebelum streak ini
  (deterministik dari streak, tanpa state → stabil & dites).
- `sukunaTechniqueFor(kind, streak)`: ladder → jurus ladder; selain itu
  `index % 2 === 0 ? 'kumo_no_ito' : 'nue'` → **tidak pernah null** utk streak > 0.
- `SUKUNA_HITSUME_INTERVAL_MS` 4000 → **1500** (tebasan cepat).
- `sukunaHitsumeCut(options, correctId, elapsedS)`: `slashes >= 1` → **SEMUA** opsi salah
  sekaligus; sebelum tebasan pertama → `[]`.
- Hapus `sukunaHitsumeCount` & `sukunaHitsumeOrder` (semantik lama: 1 opsi/4 dtk).

### B. `EffectContext.jsx` — jalur suara + tebasan
- `triggerSukuna`: `tech` SELALU ada utk correct (fallback kumo) → hapus jalur
  `playCorrectSound()` (chime default) di branch else.
- 必中 loop: mulai **setelah cinematic settle** (`sukunaDomainStartDelayMs()`),
  tick `SUKUNA_HITSUME_INTERVAL_MS`; tiap tick `playSlash(false)` + `setSukunaCutCount(n+1)`.
- Bersihkan import `sukunaHitsumeOrder` (tak dipakai).

### C. `sfx.js` + `sukunaAmbience.js` — BGM mencekam
- `SUKUNA_BELL_EVERY_MS = 4000` (bel kuil, decouple dari irama 必中).
- `sukunaBgmPlan()`: tambah `organ` (saw 82.41/110/164.81 → lowpass 320, swell LFO),
  `taiko` (steps [0,3,4,7,8,11,12,14], accents [0,4,8,12]), `motif` hirajoshi
  (A3→F4→E4→C4→B3→A3), grid `stepS 0.5` × `loopSteps 16` = loop 8 dtk.
- `sukunaTaikoParams()` (accent/hit) + `sukunaMotifParams()` (koto: triangle + oktaf
  saw tipis, bend turun, lowpass menutup).
- `sukunaAmbience.js`: organ layer + **lookahead scheduler** (150ms tick, 0.7s ahead)
  memainkan taiko + motif loop; debug `window.__sukunaAmbience.steps/taiko`.

### D. `index.css` — kilat tebasan
- `button[data-sukuna-cut]` dapat `sukunaCutIn` (kilat putih di garis tebasan →
  mengendap jadi 斬); `prefers-reduced-motion` → animation none.

### E. Wiring kecil
- `DevPanel.jsx`: preview 鵺 #3 → **#2** (rotasi baru); label #20 → 魔虚羅; teks deskripsi.
- `Practice.jsx`: komentar 必中 (semua opsi sekaligus).

## Verifikasi
`npm test` (548+ → target hijau) · `npm run lint` (0 error) · `npm run build` ·
browser smoke: (a) jawab benar berturut → kanji 蜘蛛の糸 → 鵺 → 蜘蛛の糸 (DOM `data-sukuna-kanji`),
(b) cast domain → tunggu settle → **semua** `button[data-sukuna-cut]` muncul sekaligus,
soal berikutnya langsung terbelah, (c) `window.__sukunaAmbience.taiko > 0` (BGM jalan).

## Catatan aset
BGM = **sintesis Web Audio** (pola gojoAmbience/sukunaAmbience repo) — tanpa file mp3 baru.
Kalau user punya klip mp3 khusus, tinggal drop → jalur file ditambah (belum sekarang).
