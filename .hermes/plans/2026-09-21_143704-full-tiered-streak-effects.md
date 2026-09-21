# Plan — Efek Streak Bertingkat Penuh (3 → 100, dengan Puncak di 50 & 100)

**Tanggal:** 2026-09-21
**Workspace:** `C:\Users\maddo\Documents\japanese-quiz`
**Status:** ✅ **SUDAH DIEKSEKUSI** (2026-09-21) — build `✓ built in 2.48s`, tes logika level lolos semua, lint hanya warning pre-existing
**File utama:** `src/features/effects/EffectContext.jsx` (satu-satunya file yang diubah)

---

## Goal

Jawaban benar beruntun memicu efek tinta yang **makin intens secara bertahap di setiap milestone (3, 5, 10, 20, 30, … 90, 100)**, dengan **puncak paling dahsyat di streak 50 & 100**, dan **satu jawaban salah langsung mereset streak ke 0**.

---

## Current Context / Assumptions

- Fitur Kotodama Burst sudah jalan. Seluruh kode efek terkurung di **satu file**: `src/features/effects/EffectContext.jsx` (345 baris).
- Struktur sekarang:
  - `STREAK_THRESHOLD = 3` (baris 25) — satu ambang.
  - `streakRef` (baris 47) — `+1` tiap `'correct'`, `= 0` tiap `'wrong'` (baris 88-89). **Aturan reset sudah benar, dipertahankan.**
  - `triggerEffect(type)` (baris 86-104) — `kind = 'streak'` bila `streakRef >= 3`.
  - `spawnInk(kind)` (baris 58-84) — jumlah/sebaran tetesan.
  - `EffectLayer` (baris 117-201) — peta `wash`/`ink` + routing komponen.
  - Komponen visual: `HankoStamp` (correct, 203-240), `BrushSlash` (wrong, 242-293), `EnsoRing` (streak, 295-345).
- **Masalah:** streak 3 s/d tak terhingga semuanya memicu `EnsoRing` yang identik. Tidak ada eskalasi, apalagi puncak.
- Call site `triggerEffect('correct'|'wrong')` di 3 file — **TIDAK DISENTUH**:
  - `src/pages/Practice.jsx` baris 157, 160, 173, 176
  - `src/features/quiz/MondaiQuiz.jsx` baris 50, 54
  - `src/features/quiz/Quiz.jsx` baris 47, 51
- `resetEffectStreak()` dipanggil di: `Practice.jsx` 253, 264; `MondaiQuiz.jsx` 26, 101; `Quiz.jsx` 22 — **tidak diubah**.
- Stack: React 19, `motion` v13, Tailwind v4. **Tidak ada test runner** (no vitest/jest) → verifikasi = `npm run build` + `npm run lint` + tes logika `node -e` + E2E manual. **Jangan tambah dependency.**

### Keputusan desain (dari user)

1. **Milestone:** 3, 5, dan **setiap kelipatan 10** → 10, 20, 30, 40, 50, 60, 70, 80, 90, 100. (Total 12 milestone.)
2. **Pendekatan hybrid:** intensitas naik **otomatis/parametrik** sesuai level, PLUS **efek "signature" khusus di 50 & 100**.
3. **Di antara milestone:** pakai **level terakhir yang dicapai** (streak 4 → level 1; streak 6-9 → level 2; streak 21-29 → level 4). Jadi setiap jawaban benar saat streak aktif tetap menampilkan efek level tertinggi.
4. **Efek milestone menimpa (replace)** cap hanko — di streak ≥ 3 yang tampil sigil, bukan hanko.
5. **Salah sekali → streak = 0** (sudah berjalan; dipertegas + dibuktikan tes).

---

## Architecture / Proposed Approach

Ubah dari "satu ambang" jadi **sistem level berbasis milestone**:
- `MILESTONES = [3,5,10,20,...,100]`; `resolveStreak(streak)` mengembalikan `{ level, milestone, signature }` (level = indeks milestone tertinggi yang dilewati).
- `intensityFor(level)` menghitung **drops / spread / hold / rings / size** secara parametrik → intensitas naik mulus dari level 1 ke 12.
- `signature` bernilai `'gold50'` atau `'zenith100'` → memicu elemen ekstra (kilatan penuh layar, badge hanko 金 / 百).
- Satu komponen parametrik **`StreakSigil`** menggambar N cincin ensō (jumlah & arah dari level) + kanji/angka milestone (`連` → `連続` → `10連` → `20連` → … → `100連`). Menggantikan `EnsoRing`.

Semua tetap terkurung di `EffectContext.jsx`. Call site quiz nol perubahan.

**Tangga intensitas yang dihasilkan:**

| Level | Streak | Drops | Cincin | Ukuran | Hold | Kanji | Signature |
|---|---|---|---|---|---|---|---|
| 1 | 3-4 | 31 | 1 | 278 | 1260ms | 連 | — |
| 2 | 5-9 | 36 | 2 | 292 | 1370ms | 連続 | — |
| 3 | 10-19 | 41 | 3 | 306 | 1480ms | 10連 | — |
| 4 | 20-29 | 46 | 4 | 320 | 1590ms | 20連 | — |
| 5 | 30-39 | 51 | 5 | 334 | 1700ms | 30連 | — |
| 6 | 40-49 | 56 | 6 | 348 | 1810ms | 40連 | — |
| **7** | **50-59** | 61 | 6 | 362 | 1920ms | 50連 | **金 gold50** |
| 8 | 60-69 | 66 | 6 | 376 | 2030ms | 60連 | — |
| 9 | 70-79 | 71 | 6 | 390 | 2140ms | 70連 | — |
| 10 | 80-89 | 76 | 6 | 404 | 2250ms | 80連 | — |
| 11 | 90-99 | 81 | 6 | 418 | 2360ms | 90連 | — |
| **12** | **100+** | 86 | 6 | 432 | 2470ms | 100連 | **百 zenith100** |

---

## Step-by-Step Tasks

Semua di `src/features/effects/EffectContext.jsx` kecuali disebut lain.

### Task 1 — Ganti konstanta ambang jadi milestone + resolver + intensitas

Hapus baris 25 (`const STREAK_THRESHOLD = 3;`).

Sisipkan blok berikut **setelah** baris `export const EFFECT_ID = 'kotodama_burst';` (yaitu sebelum komentar `// Teardrop tinta`):

```js
// Milestone streak: 3, 5, lalu setiap kelipatan 10 sampai 100.
// Level = indeks milestone tertinggi yang sudah dilewati (1..12).
const MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// Level dari streak. null = belum mencapai milestone apa pun.
function resolveStreak(streak) {
  let level = 0;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (streak >= MILESTONES[i]) level = i + 1;
  }
  if (level === 0) return null;
  const milestone = MILESTONES[level - 1];
  const signature = milestone === 50 ? 'gold50'
    : milestone === 100 ? 'zenith100'
      : null;
  return { level, milestone, signature };
}

// Intensitas parametrik: naik mulus sesuai level (hybrid).
function intensityFor(level) {
  const L = Math.max(1, level);
  return {
    drops: 26 + L * 5,
    spread: 230 + L * 16,
    hold: 1150 + L * 110,
    gravity: 26 + L * 1.6,
    rings: Math.min(L, 6),
    size: 264 + L * 14,
  };
}

// Intensitas untuk efek dasar (bukan streak).
const BASE_INTENSITY = {
  correct: { drops: 14, spread: 195, hold: 880, gravity: 26 },
  wrong: { drops: 22, spread: 195, hold: 880, gravity: 26 },
};
```

**Verifikasi Task 1:**
```bash
cd /c/Users/maddo/Documents/japanese-quiz
grep -n "STREAK_THRESHOLD" src/features/effects/EffectContext.jsx   # harus kosong
grep -c "MILESTONES\|resolveStreak\|intensityFor" src/features/effects/EffectContext.jsx   # > 0
```

---

### Task 2 — `triggerEffect`: hitung level + signature

Ganti seluruh isi `triggerEffect` (baris 86-104) menjadi:

```js
  const triggerEffect = useCallback((type) => {
    if (!active) return;

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

    setFx({
      kind,
      id: ++seq,
      seed: Math.floor(Math.random() * 900) + 1,
      angle: -14 - Math.random() * 12,
      y: 50 + (Math.random() * 16 - 8),
      level: info ? info.level : 0,
      milestone: info ? info.milestone : 0,
      signature: info ? info.signature : null,
      onMilestone,
    });
    spawnInk(kind, cfg);
    const t = setTimeout(() => setFx(null), cfg.hold);
    timersRef.current.push(t);
  }, [active, spawnInk]);
```

**Verifikasi Task 2 — tes logika level (tanpa React):**
```bash
node -e "
const M=[3,5,10,20,30,40,50,60,70,80,90,100];
const resolve=(s)=>{let l=0;for(let i=0;i<M.length;i++){if(s>=M[i])l=i+1;}
  if(l===0)return null;const m=M[l-1];
  return {level:l,milestone:m,signature:m===50?'gold50':m===100?'zenith100':null};};
function run(seq){let s=0,out=[];for(const t of seq){if(t==='correct')s++;else s=0;
  const r=t==='correct'?resolve(s):null;
  out.push(r?('L'+r.level+(r.signature?'/'+r.signature:'')):t);}return out;}
console.log('A',run(['correct','correct','correct','correct']).join(' '));
console.log('B',run(['correct','correct','wrong','correct','correct','correct']).join(' '));
console.log('C',run(Array(10).fill('correct')).join(' '));
console.log('D',run(Array(50).fill('correct')).slice(-3).join(' '));
console.log('E',run(Array(100).fill('correct')).slice(-3).join(' '));
console.log('F',run(Array(100).fill('correct').concat(['wrong'])).slice(-2).join(' '));
"
```
Expected:
```
A correct correct L1 L1
B correct correct wrong correct correct L1
C correct correct L1 L1 L2 L2 L2 L2 L2 L3
D L7/gold50 L7/gold50 L7/gold50
E L12/zenith100 L12/zenith100 L12/zenith100
F L12/zenith100 wrong
```
Membuktikan: (A) streak 4 tetap level 1; (B) **salah mereset** → 3 benar lagi baru level 1; (C) naik 3→5→10; (D) streak 50 = signature gold50; (E) 100 = zenith100; (F) salah setelah 100 → balik ke efek dasar.

---

### Task 3 — `spawnInk`: terima config intensitas

Ganti baris 58-61 dari:
```js
  const spawnInk = useCallback((kind) => {
    const count = kind === 'streak' ? 26 : kind === 'correct' ? 14 : 22;
    const spread = kind === 'streak' ? 240 : 195;
```
menjadi:
```js
  const spawnInk = useCallback((kind, cfg = BASE_INTENSITY.correct) => {
    const count = cfg.drops;
    const spread = cfg.spread;
```

Ganti baris 65 dari:
```js
      const dy = Math.sin(angle) * dist + 26 + Math.random() * 46; // gravitasi
```
menjadi:
```js
      const dy = Math.sin(angle) * dist + cfg.gravity + Math.random() * (cfg.gravity * 1.8);
```

Ganti durasi pembersihan (baris 79-82) dari `}, 1050);` menjadi `}, 2600);` (agar tetesan level tinggi tidak terpotong).

**Verifikasi Task 3:**
```bash
grep -n "cfg.drops\|cfg.spread\|cfg.gravity\|}, 2600);" src/features/effects/EffectContext.jsx
```
Expected: 4 baris ditemukan.

---

### Task 4 — `EffectLayer`: wash, ink, shake, routing

**4a. Wash** — ganti peta `wash` (baris 123-127) menjadi:
```js
  const wash =
    kind === 'wrong' ? 'radial-gradient(circle at 50% 50%, rgba(211,56,47,0.22), rgba(211,56,47,0.04) 55%, transparent 72%)'
      : kind === 'streak' ? `radial-gradient(circle at 50% 50%, rgba(184,144,31,${0.2 + (fx?.level || 1) * 0.02}), rgba(211,56,47,${0.03 + (fx?.level || 1) * 0.008}) 52%, transparent 78%)`
        : kind === 'correct' ? 'radial-gradient(circle at 50% 50%, rgba(125,143,105,0.18), rgba(125,143,105,0.03) 58%, transparent 74%)'
          : 'transparent';
```

**4b. Ink** — ganti peta `ink` (baris 129-131) menjadi:
```js
  const ink = kind === 'wrong' ? 'var(--sumi-val)'
    : kind === 'correct' ? 'var(--shu-val)'
      : '#b8901f'; // semua tier streak = emas
```

**4c. Shake** — ganti blok `animate` (baris 150-152) menjadi:
```js
        animate={
          kind === 'wrong'
            ? { x: [0, -11, 9, -6, 4, 0], y: [0, 3, -3, 2, -1, 0] }
            : fx?.signature === 'zenith100'
              ? { x: [0, -16, 14, -10, 8, -4, 0], y: [0, -8, 7, -6, 5, -3, 0] }
              : (kind === 'streak' && fx?.onMilestone && fx.level >= 5)
                ? { x: [0, -7, 6, -4, 3, 0], y: [0, -4, 4, -3, 2, 0] }
                : { x: 0, y: 0 }
        }
        transition={{ duration: fx?.signature === 'zenith100' ? 0.7 : 0.5, ease: 'easeOut' }}
```

**4d. Routing** — ganti blok `AnimatePresence` (baris 194-198) menjadi:
```jsx
      <AnimatePresence>
        {kind === 'correct' && <HankoStamp key={`h-${fx.id}`} fid={fid} />}
        {kind === 'wrong' && <BrushSlash key={`b-${fx.id}`} fid={fid} angle={fx.angle} y={fx.y} />}
        {kind === 'streak' && (
          <StreakSigil
            key={`s-${fx.id}`}
            fid={fid}
            level={fx.level}
            milestone={fx.milestone}
            signature={fx.signature}
          />
        )}
      </AnimatePresence>
```

**Verifikasi Task 4:**
```bash
grep -n "StreakSigil\|zenith100\|onMilestone" src/features/effects/EffectContext.jsx | head
```

---

### Task 5 — Ganti `EnsoRing` dengan `StreakSigil` parametrik

Hapus seluruh fungsi `EnsoRing` (baris 295-345, termasuk komentar `// ── Streak 3×: ensō...`).

Tambahkan **di akhir file**:

```jsx
// ── Streak milestone: sigil ensō parametrik (level 1..12) ─────────────────────
// Cincin & intensitas naik sesuai level; kanji berubah: 連 → 連続 → 10連 → … → 100連.
// Signature 50 (金) & 100 (百) menambah kilatan penuh layar + badge hanko.
function StreakSigil({ fid, level, milestone, signature }) {
  const L = Math.max(1, level);
  const rings = Math.min(L, 6);
  const size = 264 + L * 14;
  const half = size / 2;
  const kanji = L === 1 ? '連' : L === 2 ? '連続' : `${milestone}連`;
  const kanjiSize = Math.min(46 + L * 4, 104);
  const ringColors = ['#b8901f', 'var(--shu-val)', 'var(--sumi-val)'];
  const isSignature = !!signature;
  const zenith = signature === 'zenith100';

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 1.16 }}
      transition={{ duration: 0.38, ease: 'easeOut' }}
      style={{ marginLeft: -half, marginTop: -half }}
    >
      {/* Kilatan penuh layar (signature saja; 100 paling terang) */}
      {isSignature && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: zenith ? [0, 0.95, 0] : [0, 0.6, 0] }}
          transition={{ duration: zenith ? 0.75 : 0.55, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            background: zenith
              ? 'radial-gradient(circle at 50% 50%, rgba(255,244,214,0.95), rgba(184,144,31,0.5) 45%, rgba(211,56,47,0.2) 70%, transparent 88%)'
              : 'radial-gradient(circle at 50% 50%, rgba(184,144,31,0.6), rgba(211,56,47,0.2) 55%, transparent 80%)',
          }}
        />
      )}

      {/* Halo tinta */}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: [0, 0.6, 0], scale: [0.72, 1.14, 1.34] }}
        transition={{ duration: 0.95 + L * 0.03, ease: 'easeOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(184,144,31,0.5), rgba(211,56,47,0.14) 48%, transparent 68%)',
          filter: `url(#${fid}-bleed)`,
        }}
      />

      {/* Cincin ensō — jumlah & arah naik sesuai level */}
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `url(#${fid}-rough)` }}>
        {Array.from({ length: rings }).map((_, i) => {
          const r = 46 - i * 7;
          const dir = i % 2 === 0 ? 90 : -90;
          return (
            <motion.circle
              key={i}
              cx="50" cy="50" r={r} fill="none"
              strokeWidth={Math.max(1, 4.4 - i * 0.6)} strokeLinecap="round" pathLength={1}
              style={{ stroke: ringColors[i % ringColors.length], rotate: dir, transformOrigin: '50px 50px' }}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 0.94 - i * 0.03, opacity: i === 0 ? 1 : Math.max(0.28, 0.95 - i * 0.14) }}
              transition={{ duration: 0.8 + L * 0.04, ease: [0.33, 1, 0.68, 1], delay: i * 0.08 }}
            />
          );
        })}
      </svg>

      {/* Kanji / angka milestone */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.45, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 220, damping: 17 }}
          className="font-serif font-black text-sumi leading-none"
          style={{ fontSize: kanjiSize }}
        >
          {kanji}
        </motion.span>
      </div>

      {/* Badge signature 50 (金) / 100 (百) */}
      {isSignature && (
        <motion.div
          className="absolute left-1/2 top-1/2"
          initial={{ scale: 2.4, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: -8 }}
          transition={{ delay: 0.42, type: 'spring', stiffness: 380, damping: 15 }}
          style={{ marginLeft: -40, marginTop: half - 26 }}
        >
          <div className={`w-[80px] h-[80px] border-[3px] border-sumi flex items-center justify-center shadow-[4px_4px_0_0_rgba(26,26,26,0.3)] ${zenith ? 'bg-shu' : 'bg-[#d4af37]'}`}>
            <span className="font-serif font-black text-kinari-light text-4xl leading-none">
              {zenith ? '百' : '金'}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
```

**Verifikasi Task 5:**
```bash
grep -n "function EnsoRing" src/features/effects/EffectContext.jsx   # harus KOSONG
grep -n "function StreakSigil" src/features/effects/EffectContext.jsx  # ada 1
```

---

### Task 6 — Build & lint

```bash
cd /c/Users/maddo/Documents/japanese-quiz
npm run build 2>&1 | grep -E "✓ built|error|Error|PARSE"
npm run lint 2>&1 | grep -iE "EffectContext"
```
Expected:
- Build: `✓ built in ...` tanpa `error`/`PARSE`.
- Lint: hanya warning `react(only-export-components)` (pre-existing). Tidak ada error baru.

---

### Task 7 — Verifikasi E2E manual

```bash
npm run dev
```
Lalu: buka `/settings` → panel **Developer** → klik **♻️ Reset + Cheat Ulang** → masuk Practice.

1. Jawab benar 1-2× → cap hanko 正 (efek dasar).
2. Benar ke-3 → ensō 1 cincin + **連** (level 1). Benar ke-4 → **masih level 1** (bukan balik ke hanko).
3. Benar ke-5 → 2 cincin berlawanan + **連続** (level 2).
4. Benar ke-10 → 3 cincin + **10連** (level 3).
5. **Salah 1×** → sapuan kuas merah/hitam, lalu benar 1× → **kembali cap hanko** (bukan langsung level 1). Ini bukti reset.
6. Untuk menguji 50 & 100 dengan cepat, tambahkan sementara di console (browser) sebelum menjawab:
   ```js
   // bukan bagian kode app — hanya untuk memancing streak tinggi saat tes
   ```
   atau jawab berulang. Saat streak **50** → badge **金** + kilatan emas; saat **100** → badge **百** + kilatan putih-emas penuh layar + getar besar.

---

## Tests / Validation

Repo tidak punya test runner → **jangan** tambah vitest (YAGNI). Validasi:

1. **Tes logika level** (Task 2) — membuktikan aturan 3/5/10/…/100, signature 50 & 100, dan reset saat salah. Ini test utama dan bisa dijalankan tanpa React.
2. **Build + lint gate** (Task 6).
3. **E2E manual** (Task 7) — membuktikan efek visual benar-benar naik & reset.

---

## Risks, Tradeoffs, dan Open Questions

**Risks / tradeoffs:**
- **Beban render di level tinggi.** Level 12 = 86 tetesan + 6 cincin SVG ber-filter `feTurbulence`, plus kilatan penuh layar. Dibatasi oleh `hold` 2470ms lalu dibersihkan. Di HP low-end bisa berat saat streak 100. Mitigasi: turunkan `intensityFor` (mis. `drops: 26 + L * 4`) atau `rings: Math.min(L, 4)`.
- **Getar layar.** Sengaja dibatasi: hanya saat `onMilestone` di level ≥ 5, plus signature 100. Tidak getar tiap jawaban (biar tidak mual). Kalau user mau getar tiap milestone dari level 3, ubah `fx.level >= 5` → `fx.level >= 3`.
- **`streakRef` lintas quiz.** Sudah ditangani `resetEffectStreak()` di 5 call site (tidak diubah). Risiko tepi tetap ada bila user menekan Back di tengah streak.
- **Efek tampil tiap jawaban benar saat streak aktif** (level terakhir dipertahankan). Ini konsekuensi keputusan #3 — bisa terasa "rame" pada streak panjang. Alternatif: efek hanya tepat di milestone, di antaranya hanko biasa.
- **Aksesibilitas:** belum ada `prefers-reduced-motion`. Di luar cakupan.
- **Konsistensi urutan:** `resolveStreak` melakukan loop penuh (bukan `.find`) sehingga **tidak sensitif urutan** array `MILESTONES`.

**Open Questions:**
1. **Angka di kanji** (`10連`, `20連`, … `100連`) — pakai angka Arab, atau angka kanji (`十連`, `二十連`, `百連`)? Default plan: **angka Arab** (lebih terbaca jelas & terbukti naik).
2. **Badge 金 di streak 50** — pakai `金` (emas) atau `五十` (50)? Default: `金`.
3. **Getar mulai level berapa?** Default plan: **level ≥ 5** + signature. Bisa diubah ke level ≥ 3.
4. **Setelah 100** — tetap level 12 (paling intens) tiap jawaban benar, atau turun ke level 11? Default plan: **tetap 12**.
