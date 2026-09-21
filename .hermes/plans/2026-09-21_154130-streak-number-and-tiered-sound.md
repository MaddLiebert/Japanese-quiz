# Plan — Angka Streak Aktual di Sigil + Suara Berjenjang (Gong Bertingkat)

**Tanggal:** 2026-09-21 15:41
**Workspace:** `C:\Users\maddo\Documents\japanese-quiz`
**Status:** ✅ SUDAH DIEKSEKUSI (2026-09-21) — build `✓ built in 9.48s`; E2E headless terbukti angka naik `3連 → 12連` (termasuk `10連`/`11連`/`12連`) + reset saat salah; 0 console/page error. Tidak ada commit/push.
**Terkait:** `2026-09-21_143704-full-tiered-streak-effects.md` (sudah dieksekusi — ini revisinya)

---

## 1. Goal

Dua revisi pada efek streak: (a) angka di sigil menampilkan **jumlah streak yang sebenarnya** (11連, 12連, … 19連 — bukan `10連` yang macet sampai 19), dan (b) suara jawaban benar **naik intensitas per tingkat streak** lewat lapisan gong bertambah (1 nada → 2 → 3 → chord penuh), menggantikan chime datar sekarang.

---

## 2. Current Context / Assumptions

**Kondisi kode sekarang (sudah diverifikasi):**

- `src/features/effects/EffectContext.jsx` (460 baris) — seluruh efek terkurung di sini.
  - Baris 367: `const kanji = L === 1 ? '連' : L === 2 ? '連続' : `${milestone}連`;` ← **sumber masalah #1**: pakai `milestone`, bukan streak asli. Jadi streak 10–19 semuanya `10連`.
  - Baris 368: `const kanjiSize = Math.min(46 + L * 4, 104);`
  - Baris 138: `const onMilestone = info ? streakRef.current === info.milestone : false;`
  - Baris 140–150: `setFx({ kind, id, seed, angle, y, level, milestone, signature, onMilestone })` ← **belum ada `streak`**.
  - `resolveStreak(streak)` (baris 31–42) mengembalikan `{ level, milestone, signature }`.
  - `intensityFor(level)` (baris 45–55) — parametrik untuk visual.
- `src/utils/sfx.js` (72 baris) — `playCorrectSound()` = chime naik C5→E5 (523.25→659.25 Hz), **satu nada, datar untuk semua jawaban** ← **sumber masalah #2**. `playWrongSound()` = thud turun.
- **Urutan pemanggilan di call site (PENTING):**
  - `src/pages/Practice.jsx:156-157` → `playCorrectSound(); triggerEffect('correct');`
  - `src/pages/Practice.jsx:172-173` → idem
  - `src/features/quiz/MondaiQuiz.jsx:49-50` → idem
  - `src/features/quiz/Quiz.jsx:46-47` → idem
  - Artinya **suara dibunyikan sebelum streak diperbarui** → suara tidak mungkin tahu tier barunya.
- `src/pages/Review.jsx:101,103` → `playCorrectSound()` / `playWrongSound()` — **Review TIDAK memakai effect layer** (`grep useEffectLayer src/pages/Review.jsx` = kosong).
- `resetEffectStreak()` dipanggil di: `Practice.jsx:253,264`; `MondaiQuiz.jsx:26,101`; `Quiz.jsx:22`.
- Stack: React 19 + `motion` v13 + Tailwind v4 + Vite 8. **Tidak ada test runner** → validasi = `npm run build`, `npm run lint`, tes logika `node -e`, dan E2E headless via CDP (sudah terbukti bisa di sesi sebelumnya).

**Keputusan user (hasil clarify):**

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Angka di sigil streak 3–9 | **Semua angka aktual**: `3連`, `4連`, … `11連`, `12連`, … `99連`, `100連` |
| 2 | Cara naik intensitas suara | **Tambah lapisan suara** (1 nada → 2 → 3 → chord penuh) |
| 3 | Suara streak vs suara benar biasa | **Timpa** — streak menggantikan total suara benar biasa |
| 4 | Karakter suara | **Gong/taiko** (nyambung tema tinta Jepang) |
| 5 | Kapan suara berjenjang aktif | **Hanya kalau efek/pack aktif** (belum beli = chime biasa) |
| 6 | Tingkat lapisan | **4 tingkat**: 1 nada (<3) → 2 nada (3–9) → 3 nada (10–49) → **chord penuh (50+)** |
| 7 | Badge `金`/`百` di 50/100 | **Pertahankan** (angka aktual + badge hiasan) |
| 8 | `Review.jsx` ikut tier? | **Tidak** — biarkan chime biasa |
| 9 | Ambang getar (`level >= 5` = streak ≥ 30) | **Tetap** |
| 10 | Nada dasar gong (`150 - layers*8`) | **Tetap** makin rendah/dalam per tier |
| 11 | Setelah streak 100 | **Terus naik**: `101連`, `102連`, … (angka tak di-cap; `intensityFor` tetap cap di level 12) |

**Asumsi:** `EFFECT_ID = 'kotodama_burst'` dan `progress.activeEffect` tetap jadi gerbang ON/OFF (tidak diubah). Review page tidak ikut (tidak punya effect layer) — lihat §6 open question.

---

## 3. Architecture / Proposed Approach

Dua perubahan struktural kecil:

**(A) Angka aktual** — tambahkan `streak` ke state `fx` yang dikirim `triggerEffect`, lalu `StreakSigil` memakai `streak` (bukan `milestone`) untuk teks. Milestone **tetap** dipakai untuk deteksi signature (`gold50`/`zenith100`) dan ambang getar. Ukuran font dibuat adaptif karena `100連` (4 karakter) jauh lebih lebar dari `連` (1 karakter) dan bisa meluber keluar cincin.

**(B) Suara berjenjang** — pindahkan **kepemilikan suara ke `EffectContext`** (`triggerEffect` memanggil suara), lalu **hapus pemanggilan suara dari 3 file quiz**. Alasannya: (1) hanya `EffectContext` yang tahu streak saat itu, dan (2) ini menghilangkan masalah urutan (sekarang suara dipanggil sebelum streak naik) tanpa perlu menyinkronkan state antar-modul. `sfx.js` menambah `playStreakSound(level)` yang menumpuk osilator gong bertingkat; `playCorrectSound`/`playWrongSound` tetap ada sebagai suara dasar (dipakai saat efek tidak aktif, dan oleh `Review.jsx`).

Diagram alur baru:

```
Practice.jsx / MondaiQuiz.jsx / Quiz.jsx
   └─ triggerEffect('correct'|'wrong')        ← SATU panggilan (suara dihapus dari sini)
        │
        ▼
   EffectContext.triggerEffect(type)
        ├─ efek TIDAK aktif → playCorrectSound()/playWrongSound() (chime dasar) → return
        ├─ streakRef += 1 (atau = 0 kalau salah)
        ├─ info = resolveStreak(streak)  → { level, milestone, signature }
        ├─ setFx({ ..., streak: streakRef.current })   ← BARU
        └─ info ? playStreakSound(info.level)          ← BARU (gong bertingkat)
                 : playCorrectSound()/playWrongSound()

   Review.jsx → tetap playCorrectSound()/playWrongSound() sendiri (tanpa tier)
```

Tabel lapisan suara (`playStreakSound(level)`):

| Level | Streak | Lapisan | Isi nada |
|---|---|---|---|
| 0 (dasar) | < 3 | 1 | gong tunggal |
| 1–2 | 3–9 | 2 | gong + oktaf atas |
| 3–6 | 10–49 | 3 | + rasio inharmonik ke-3 |
| 7–12 | 50+ | 6 (chord penuh) | seluruh partial + noise strike |

---

## 4. Step-by-step Tasks

> Semua path relatif ke root workspace `C:\Users\maddo\Documents\japanese-quiz`.
> **Jangan commit/push** — user melarang sampai memberi izin eksplisit.
> Kerjakan berurutan; jalankan `npm run build` setelah Task 3.

---

### Task 1 — Kirim `streak` aktual di state `fx`

**File:** `src/features/effects/EffectContext.jsx`

Di dalam `triggerEffect` (sekitar baris 140–150), tambahkan field `streak`:

```js
    setFx({
      kind,
      id: ++seq,
      seed: Math.floor(Math.random() * 900) + 1,
      angle: -14 - Math.random() * 12,          // sapuan tidak pernah sama
      y: 50 + (Math.random() * 16 - 8),          // posisi vertikal (persen)
      level: info ? info.level : 0,
      milestone: info ? info.milestone : 0,
      streak: type === 'correct' ? streakRef.current : 0,   // ← BARU
      signature: info ? info.signature : null,
      onMilestone,
    });
```

**Verifikasi:**
```bash
cd /c/Users/maddo/Documents/japanese-quiz
grep -n "streak: type === 'correct'" src/features/effects/EffectContext.jsx
```
Expected: 1 baris ditemukan.

---

### Task 2 — `StreakSigil`: pakai angka streak aktual + font adaptif

**File:** `src/features/effects/EffectContext.jsx`

**2a.** Ubah tanda tangan fungsi (baris 362) untuk menerima `streak`:

```js
function StreakSigil({ fid, level, milestone, signature, streak }) {
```

**2b.** Ganti baris 367–368 (perhitungan kanji & ukuran font):

```js
  const shown = Math.max(streak || milestone || 1, 1);
  const kanji = `${shown}連`;
  // Font adaptif: "連" (1 char) bisa besar, "100連" (4 char) harus mengecil
  // supaya tidak meluber keluar cincin.
  const baseSize = Math.min(46 + L * 4, 104);
  const len = String(kanji).length;
  const kanjiSize = Math.round(baseSize / (1 + Math.max(0, len - 1) * 0.34));
```

> Catatan: `連`/`連続` **dihapus** (keputusan user #1 = semua angka aktual). Untuk `streak = 3` → `3連`.
>
> **Penting (keputusan user #11): angka TIDAK di-cap di 100.** Karena `shown` diambil dari `streak` mentah, streak 101 → `101連`, 102 → `102連`, dst. `resolveStreak` memang meng-cap `level` di 12 (jadi `intensityFor` mentok di puncak), tapi `streak` yang dipakai untuk teks tetap nilai asli. **Jangan** menambahkan `Math.min(streak, 100)`.

**2c.** Teruskan `streak` saat merender komponen (blok routing, sekitar baris 253–261):

```jsx
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
```

**Verifikasi:**
```bash
grep -n "streak={fx.streak}\|const shown = Math.max" src/features/effects/EffectContext.jsx
```
Expected: 2 baris ditemukan.

---

### Task 3 — `sfx.js`: `playStreakSound(level)` gong bertingkat

**File:** `src/utils/sfx.js`

Tambahkan di akhir file (setelah `playWrongSound`):

```js
// ── Gong bertingkat untuk streak (keputusan user #2/#4/#6) ──────────────────
// Lapisan bertambah sesuai tier: 1 nada (<3) → 2 (3-9) → 3 (10-49) → chord (50+).
const STREAK_LAYERS = (level) => {
  const L = level || 0;
  if (L <= 0) return 1;   // dasar
  if (L <= 2) return 2;   // streak 3-9
  if (L <= 6) return 3;   // streak 10-49
  return 6;               // streak 50+ = chord penuh
};

// Rasio partial gong (inharmonik khas logam). Dipakai bertahap sesuai lapisan.
const GONG_RATIOS = [1, 1.51, 2.13, 2.74, 3.61, 4.29];

export const playStreakSound = (level = 0) => {
  const ctx = initAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const layers = STREAK_LAYERS(level);
  const t = ctx.currentTime;
  // Makin tinggi tier → makin panjang & makin dalam.
  const dur = 1.2 + layers * 0.22;
  const base = 150 - layers * 8;          // makin banyak lapisan, makin rendah/dalam
  const peak = 0.30 / Math.sqrt(layers);  // bagi rata supaya tidak clipping

  for (let i = 0; i < layers; i++) {
    const ratio = GONG_RATIOS[i % GONG_RATIOS.length];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base * ratio, t);
    // sedikit melengkung turun = karakter gong yang "mengendap"
    osc.frequency.exponentialRampToValueAtTime(base * ratio * 0.94, t + dur);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak / (i + 1), t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  }

  // Lapisan tinggi dapat "pukulan" noise (stik menghantam logam).
  if (layers >= 3) {
    const len = Math.floor(ctx.sampleRate * 0.09);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const noise = ctx.createBufferSource();
    const nFilter = ctx.createBiquadFilter();
    const nGain = ctx.createGain();
    nFilter.type = 'bandpass';
    nFilter.frequency.value = 1800 + layers * 120;
    nGain.gain.setValueAtTime(0.10 + layers * 0.02, t);
    noise.buffer = buf;
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(t);
  }
};
```

**Verifikasi (logika lapisan tanpa browser):**
```bash
node -e "
const S=(l)=>l<=0?1:l<=2?2:l<=6?3:6;
[0,1,2,3,6,7,12].forEach(l=>console.log('level',l,'->',S(l),'lapisan'));
"
```
Expected:
```
level 0 -> 1 lapisan
level 1 -> 2 lapisan
level 2 -> 2 lapisan
level 3 -> 3 lapisan
level 6 -> 3 lapisan
level 7 -> 6 lapisan
level 12 -> 6 lapisan
```

Lalu build:
```bash
npm run build
```
Expected: `✓ built in ...` tanpa error.

---

### Task 4 — `EffectContext`: panggil suara dari `triggerEffect`

**File:** `src/features/effects/EffectContext.jsx`

**4a.** Tambah import di baris atas:

```js
import { playCorrectSound, playWrongSound, playStreakSound } from '../../utils/sfx';
```

**4b.** Ganti seluruh `triggerEffect` (sekitar baris 122–154) menjadi:

```js
  const triggerEffect = useCallback((type) => {
    // Efek tidak aktif → tetap bunyi suara dasar (perilaku lama), lalu berhenti.
    if (!active) {
      if (type === 'correct') playCorrectSound();
      else playWrongSound();
      return;
    }

    // Satu salah → streak hangus total.
    if (type === 'correct') streakRef.current += 1;
    else if (type === 'wrong') streakRef.current = 0;

    // Tentukan efek berdasarkan level milestone tertinggi.
    let kind = type;
    let info = null;
    if (type === 'correct') {
      info = resolveStreak(streakRef.current);
      if (info) kind = 'streak';
    }

    const cfg = info ? intensityFor(info.level) : BASE_INTENSITY[type];
    const onMilestone = info ? streakRef.current === info.milestone : false;

    // Suara: streak menimpa suara dasar (keputusan user #3).
    if (info) playStreakSound(info.level);
    else if (type === 'correct') playCorrectSound();
    else playWrongSound();

    setFx({
      kind,
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
    spawnInk(kind, cfg);
    const t = setTimeout(() => setFx(null), cfg.hold);
    timersRef.current.push(t);
  }, [active, spawnInk]);
```

**Verifikasi:**
```bash
grep -n "playStreakSound(info.level)" src/features/effects/EffectContext.jsx
grep -n "if (!active) {" src/features/effects/EffectContext.jsx
```
Expected: masing-masing 1 baris.

---

### Task 5 — Hapus pemanggilan suara dari 3 file quiz (biar tidak dobel)

**File:** `src/pages/Practice.jsx`, `src/features/quiz/MondaiQuiz.jsx`, `src/features/quiz/Quiz.jsx`

Di tiap file, hapus baris `playCorrectSound();` dan `playWrongSound();` yang **berpasangan dengan** `triggerEffect(...)` — dan hapus importnya bila tidak terpakai lagi.

**`src/pages/Practice.jsx`** (baris ~156-160 dan ~172-176):

```js
    if (correct) {
      triggerEffect('correct');
    } else {
      triggerEffect('wrong');
    }
```
dan
```js
    if (correct) {
      triggerEffect('correct');
    } else {
      triggerEffect('wrong');
    }
```

Hapus baris 6: `import { playCorrectSound, playWrongSound } from "../utils/sfx";`

**`src/features/quiz/MondaiQuiz.jsx`** (baris ~48-55): hapus `playCorrectSound();` & `playWrongSound();`, sisakan `triggerEffect(...)`. Hapus baris 5 (import sfx).

**`src/features/quiz/Quiz.jsx`** (baris ~45-52): idem. Hapus baris 5 (import sfx).

> **JANGAN sentuh `src/pages/Review.jsx`** — dia tidak punya effect layer, jadi tetap pakai `playCorrectSound`/`playWrongSound` sendiri (chime biasa).

**Verifikasi:**
```bash
cd /c/Users/maddo/Documents/japanese-quiz
echo "--- sisa import sfx (harus HANYA Review + EffectContext) ---"
grep -rn "utils/sfx" src/ --include=*.jsx
echo "--- sisa playCorrectSound di quiz files (harus KOSONG) ---"
grep -n "playCorrectSound\|playWrongSound" src/pages/Practice.jsx src/features/quiz/MondaiQuiz.jsx src/features/quiz/Quiz.jsx || echo "BERSIH"
echo "--- Review harus TETAP ada ---"
grep -c "playCorrectSound" src/pages/Review.jsx
```
Expected:
```
--- sisa import sfx ---
src/pages/Review.jsx:8:import { playCorrectSound, playWrongSound } from "../utils/sfx";
src/features/effects/EffectContext.jsx:...:import { playCorrectSound, playWrongSound, playStreakSound } from '../../utils/sfx';
--- sisa di quiz files ---
BERSIH
--- Review ---
1
```

---

### Task 6 — Build & lint

```bash
cd /c/Users/maddo/Documents/japanese-quiz
npm run build 2>&1 | grep -E "✓ built|error|Error|PARSE"
npm run lint 2>&1 | grep -iE "EffectContext|sfx|Practice|Quiz" || echo "OK: tidak ada isu baru"
```
Expected:
- Build: `✓ built in ...`, tanpa error.
- Lint: hanya warning `react(only-export-components)` (pre-existing).

---

### Task 7 — E2E headless (bukti nyata)

Karena browser tool tidak tersedia, pakai pola CDP yang sudah terbukti di sesi sebelumnya (Chrome headless + WebSocket). Skrip ini **membuktikan** angka sigil berubah 3→4→5 (bukan macet) dan reset saat salah.

Tulis ke `.tmp_verify/streak.mjs` lalu jalankan (dev server di `http://127.0.0.1:5173/`):

```js
// Ringkas: buka Practice → A ROW → Start Quiz → jawab benar 4x → baca angka di sigil.
// Deteksi: cari <span> yang cocok /^\d+連$/ di dalam layer efek.
```

Perintah:
```bash
cd /c/Users/maddo/Documents/japanese-quiz
npx vite --port 5173 --host 127.0.0.1 &   # atau background=true
sleep 5
node .tmp_verify/streak.mjs "http://127.0.0.1:5173/"
```
Expected (angka naik mengikuti streak asli):
```
q1 char=う benar → hanko (正), angka: -
q2 char=い benar → hanko (正), angka: -
q3 char=お benar → sigil, angka: 3連
q4 char=え benar → sigil, angka: 4連      ← BUKTI revisi #1 (bukan "3連" macet)
q5 char=あ salah → hanko, angka: -
q6 ...            → angka: 3連 setelah 3 benar lagi
```

**Catatan:** angka `3連` harus **berubah jadi `4連`** di q4. Kalau masih `3連`, Task 2 belum benar.

---

### Task 8 — Bersihkan & verifikasi akhir

```bash
cd /c/Users/maddo/Documents/japanese-quiz
rm -rf .tmp_verify
powershell -NoProfile -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"
npm run build 2>&1 | grep -E "✓ built|error"
git status --short | head -5
```
Expected: build sukses, **tidak ada commit/push** (git HEAD tidak berubah).

---

## 5. Tests / Validation

Repo tidak punya test runner → **jangan** tambah vitest (YAGNI).

| # | Uji | Perintah | Expected |
|---|---|---|---|
| T1 | Lapisan suara per level | `node -e "const S=(l)=>l<=0?1:l<=2?2:l<=6?3:6; console.log([0,1,2,3,6,7,12].map(S).join(','))"` | `1,2,2,3,3,6,6` |
| T2 | `resolveStreak` tetap benar | `node -e "const M=[3,5,10,20,30,40,50,60,70,80,90,100];const r=(s)=>{let l=0;for(let i=0;i<M.length;i++)if(s>=M[i])l=i+1;return l};console.log([3,4,9,10,19,20,50,100].map(r).join(','))"` | `1,1,2,3,3,4,7,12` |
| T3 | Tidak ada sisa import sfx di quiz | `grep -rn "utils/sfx" src/pages/Practice.jsx src/features/quiz/*.jsx` | kosong |
| T4 | `streak` diteruskan ke sigil | `grep -n "streak={fx.streak}" src/features/effects/EffectContext.jsx` | 1 baris |
| T5 | Build | `npm run build` | `✓ built in ...` |
| T6 | E2E angka naik (Task 7) | lihat Task 7 | `3連` → `4連` |

---

## 6. Risks, Tradeoffs, and Open Questions

**Risiko:**

| Risiko | Dampak | Mitigasi |
|---|---|---|
| **`playStreakSound` clipping** saat chord penuh (6 osilator + noise) | Suara pecah | Peak dibagi `Math.sqrt(layers)`; bisa diturunkan ke `peak / layers` bila masih keras. |
| **Autoplay diblokir browser** | Suara tidak bunyi di klik pertama | Sudah ada `ctx.resume()`; `AudioContext` dibuat saat interaksi pertama. |
| **Dobel suara** kalau ada pemanggil `playCorrectSound` yang terlewat | Chime + gong bareng | Task 5 memverifikasi dengan grep; hanya `Review.jsx` yang boleh menyisakan. |
| **Font angka panjang meluber** (`100連`) | Teks keluar cincin | `kanjiSize` dibagi faktor panjang teks (Task 2b); verifikasi visual di 100. |
| **`Review.jsx` tidak dapat tier** | Suara di Review tetap datar | Disengaja (tidak ada effect layer). Lihat open question #2. |
| **`streakRef` lintas quiz** | Streak nyangkut antar sesi | Sudah ditangani `resetEffectStreak()` di 5 call site (tidak diubah). |

**Tradeoff:**

- **Suara pindah ke `EffectContext`** menghilangkan masalah urutan & DRY (satu tempat tahu streak + suara), tapi **mengubah 3 file quiz**. Alternatifnya (menyinkronkan tier lewat variabel modul + reorder) lebih rapuh karena state bisa basi antar sesi.
- **Milestone tetap dipakai** untuk signature 50/100 & ambang getar — tidak dihapus, hanya tidak lagi dipakai untuk teks.

**Pertanyaan terbuka → SEMUA TERJAWAB (keputusan user 2026-09-21):**

1. **Badge `金` (50) & `百` (100)** → **dipertahankan**. Angka aktual (`50連`) + badge 金/百 tetap dirender di sampingnya.
2. **`Review.jsx`** → **tidak** ikut tier. Tetap `playCorrectSound()`/`playWrongSound()` chime biasa (tidak disentuh).
3. **Ambang getar** → **tetap** `fx.level >= 5` (streak ≥ 30).
4. **Nada dasar gong** → **tetap** `base = 150 - layers * 8` (makin tinggi tier makin rendah/dalam, karakter gong besar).
5. **Setelah streak 100** → **terus naik**: `101連`, `102連`, … Angka **tidak di-cap**; `intensityFor(level)` tetap cap di level 12 (chord penuh) — jadi angka naik terus tapi intensitas visual/suara mentok di puncak. Sudah otomatis benar di Task 1 & 2 (lihat catatan di Task 2b).

Tidak ada pertanyaan yang menggantung — plan siap eksekusi apa adanya.

---

## 7. Ringkasan Urutan Eksekusi

| Task | File | Estimasi |
|---|---|---|
| 1 | `EffectContext.jsx` — kirim `streak` di `fx` | 2 mnt |
| 2 | `EffectContext.jsx` — angka aktual + font adaptif | 3 mnt |
| 3 | `utils/sfx.js` — `playStreakSound(level)` | 4 mnt |
| 4 | `EffectContext.jsx` — panggil suara dari `triggerEffect` | 3 mnt |
| 5 | `Practice.jsx`, `MondaiQuiz.jsx`, `Quiz.jsx` — hapus suara | 3 mnt |
| 6 | Build + lint | 2 mnt |
| 7 | E2E headless (bukti angka naik) | 4 mnt |
| 8 | Bersihkan + verifikasi akhir | 1 mnt |

**Tidak ada commit/push** — tunggu perintah eksplisit user.
