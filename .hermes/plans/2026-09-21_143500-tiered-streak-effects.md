# Plan — Efek Streak Bertingkat (3 / 5 / 10) + Reset saat Salah

**Tanggal:** 2026-09-21
**Workspace:** `C:\Users\maddo\Documents\japanese-quiz`
**Status:** PLAN (belum dieksekusi)
**File utama:** `src/features/effects/EffectContext.jsx`

---

## Goal

Mengubah efek Kotodama Burst supaya jawaban benar beruntun memicu **efek berbeda & makin intens di streak 3, 5, dan 10**, dengan aturan: **satu jawaban salah → streak kembali ke 0**.

---

## Current Context / Assumptions

- Fitur "Kotodama Burst" sudah ada & jalan. Semua kode efek terkumpul di **satu file**: `src/features/effects/EffectContext.jsx` (345 baris).
- Struktur sekarang:
  - `STREAK_THRESHOLD = 3` (baris 25) — satu ambang saja.
  - `streakRef` (baris 47) — counter streak internal, `+1` tiap `'correct'`, `= 0` tiap `'wrong'` (baris 88-89).
  - `triggerEffect(type)` (baris 86-104) — menghitung `kind`: `'streak'` kalau `streakRef >= 3`, selain itu `'correct'`/`'wrong'`.
  - `spawnInk(kind)` (baris 58-84) — jumlah & sebaran tetesan; sekarang hanya membedakan `'streak'` vs lainnya.
  - `EffectLayer` (baris 117-201) — peta `wash` (gradien) & `ink` (warna) per `kind`, lalu merender komponen: `HankoStamp` (correct), `BrushSlash` (wrong), `EnsoRing` (streak).
- **Masalah sekarang:** streak 3, 4, 5, 6, … semuanya memicu `kind === 'streak'` yang SAMA → `EnsoRing` identik. Tidak ada eskalasi.
- Call site `triggerEffect('correct' | 'wrong')` ada di 3 file (tidak perlu diubah sama sekali):
  - `src/pages/Practice.jsx` baris 157, 160, 173, 176
  - `src/features/quiz/MondaiQuiz.jsx` baris 50, 54
  - `src/features/quiz/Quiz.jsx` baris 47, 51
- `resetEffectStreak()` dipanggil di: `Practice.jsx` 253, 264; `MondaiQuiz.jsx` 26, 101; `Quiz.jsx` 22.
- Stack: React 19, `motion` v13 (`motion/react`), Tailwind v4. **Tidak ada test runner** (tidak ada vitest/jest) → verifikasi = `npm run build` + `npm run lint` + cek manual. Jangan tambah dependency (YAGNI).

### Keputusan desain (dari user)

1. **Di antara milestone** (streak 4, 6, 7, 8, 9): pakai **tier terakhir yang sudah dicapai**. Artinya streak 4 → efek tier-1, streak 6-9 → efek tier-2. (Bukan balik ke efek dasar.)
2. **Setelah streak > 10** (11, 12, …): **tier-3 terus nyala** tiap jawaban benar — konsisten dengan aturan (1). *(Asumsi default; Q2 timeout. Lihat Open Questions.)*
3. **Efek milestone menimpa (replace)** efek dasar — di streak ≥ 3 yang tampil efek tier, bukan cap hanko biasa. Konsisten dengan aturan (1) yang bilang "streak 4 → efek tier-1". *(Asumsi default; Q3 timeout. Lihat Open Questions.)*
4. **Salah sekali → streak = 0** (sudah berjalan; dipertahankan & dipertegas).

---

## Architecture / Proposed Approach

Ganti konsep "satu ambang streak" jadi **tabel tier** (`STREAK_TIERS`) + **tabel intensitas** (`INTENSITY`). `triggerEffect` menghitung `kind` bertingkat (`'streak1' | 'streak2' | 'streak3'`) berdasarkan `streakRef` tertinggi yang dilewati; `spawnInk` & `EffectLayer` membaca tabel itu sehingga intensitas naik otomatis (jumlah tetesan, sebaran, durasi). Tiap tier punya komponen visual sendiri: **EnsoRing** (tier-1, sudah ada), **DoubleEnso** (tier-2, baru), **GrandEnso** (tier-3, baru). Call site quiz **tidak disentuh** — semua logika tetap terkurung di `EffectContext.jsx`.

---

## Step-by-Step Tasks

Semua perubahan ada di **`src/features/effects/EffectContext.jsx`** kecuali disebut lain.

### Task 1 — Ganti konstanta ambang jadi tabel tier + intensitas

**File:** `src/features/effects/EffectContext.jsx`

**1a.** Hapus baris 25:
```js
const STREAK_THRESHOLD = 3;
```

**1b.** Ganti dengan tabel tier & intensitas (taruh tepat setelah baris `export const EFFECT_ID = 'kotodama_burst';`):

```js
// Tier streak: ambang tertinggi yang dilewati menentukan efeknya.
// streak 3-4 → streak1 | 5-9 → streak2 | 10+ → streak3
const STREAK_TIERS = [
  { at: 10, kind: 'streak3' },
  { at: 5, kind: 'streak2' },
  { at: 3, kind: 'streak1' },
];

// Intensitas per jenis efek: makin tinggi tier, makin ramai & lama.
const INTENSITY = {
  correct: { drops: 14, spread: 195, hold: 880, gravity: 26 },
  wrong: { drops: 22, spread: 195, hold: 880, gravity: 26 },
  streak1: { drops: 26, spread: 240, hold: 1150, gravity: 26 },
  streak2: { drops: 44, spread: 305, hold: 1500, gravity: 30 },
  streak3: { drops: 68, spread: 385, hold: 2050, gravity: 34 },
};
```

**Verifikasi Task 1:**
```bash
cd /c/Users/maddo/Documents/japanese-quiz
grep -n "STREAK_THRESHOLD" src/features/effects/EffectContext.jsx
```
Expected: **tidak ada output** (konstanta lama sudah hilang).

---

### Task 2 — `triggerEffect`: hitung kind bertingkat

**File:** `src/features/effects/EffectContext.jsx`

Ganti seluruh isi `triggerEffect` (baris 86-104) dengan:

```js
  const triggerEffect = useCallback((type) => {
    if (!active) return;

    // Satu salah → streak hangus total.
    if (type === 'correct') streakRef.current += 1;
    else if (type === 'wrong') streakRef.current = 0;

    // Tentukan efek: ambil tier TERTINGGI yang sudah dilewati.
    let kind = type;
    if (type === 'correct') {
      const hit = STREAK_TIERS.find(t => streakRef.current >= t.at);
      if (hit) kind = hit.kind;
    }

    const cfg = INTENSITY[kind] || INTENSITY.correct;

    setFx({
      kind,
      id: ++seq,
      seed: Math.floor(Math.random() * 900) + 1,
      angle: -14 - Math.random() * 12,
      y: 50 + (Math.random() * 16 - 8),
    });
    spawnInk(kind, cfg);
    const t = setTimeout(() => setFx(null), cfg.hold);
    timersRef.current.push(t);
  }, [active, spawnInk]);
```

> Catatan: `STREAK_TIERS.find` bergantung pada urutan array dari `at` terbesar ke terkecil (Task 1b) — jangan diurutkan ulang, atau `.find` akan selalu mengembalikan tier terkecil.

**Verifikasi Task 2:** lihat Task 7 (build). Sekaligus cek logika tier tanpa React:
```bash
node -e "
const STREAK_TIERS=[{at:10,kind:'streak3'},{at:5,kind:'streak2'},{at:3,kind:'streak1'}];
const pick=(s)=>{const h=STREAK_TIERS.find(t=>s>=t.at);return h?h.kind:'correct';};
console.log([1,2,3,4,5,6,9,10,11,20].map(s=>s+':'+pick(s)).join('  '));
"
```
Expected output:
```
1:correct  2:correct  3:streak1  4:streak1  5:streak2  6:streak2  9:streak2  10:streak3  11:streak3  20:streak3
```

---

### Task 3 — `spawnInk`: terima config intensitas

**File:** `src/features/effects/EffectContext.jsx`

Ganti signature & bagian atas `spawnInk` (baris 58-61). Dari:

```js
  const spawnInk = useCallback((kind) => {
    const count = kind === 'streak' ? 26 : kind === 'correct' ? 14 : 22;
    const spread = kind === 'streak' ? 240 : 195;
```

Menjadi:

```js
  const spawnInk = useCallback((kind, cfg = INTENSITY.correct) => {
    const count = cfg.drops;
    const spread = cfg.spread;
```

Lalu pada pembuatan `dy` (baris 65), ganti konstanta gravitasi `26` & `46` supaya ikut config. Dari:

```js
      const dy = Math.sin(angle) * dist + 26 + Math.random() * 46; // gravitasi
```

Menjadi:

```js
      const dy = Math.sin(angle) * dist + cfg.gravity + Math.random() * (cfg.gravity * 1.8);
```

Terakhir, pada `setTimeout` pembersihan (baris 79-82), durasi tetap `1050`; naikkan agar tier tinggi tidak terpotong:

```js
    const t = setTimeout(() => {
      const ids = new Set(batch.map(b => b.id));
      setDrops(prev => prev.filter(p => !ids.has(p.id)));
    }, 1600);
```

**Verifikasi Task 3:**
```bash
grep -n "cfg.drops\|cfg.spread\|cfg.gravity" src/features/effects/EffectContext.jsx
```
Expected: 3 baris ditemukan.

---

### Task 4 — `EffectLayer`: peta wash/ink & routing komponen

**File:** `src/features/effects/EffectContext.jsx`

**4a.** Ganti peta `wash` (baris 123-127) supaya mengenal 3 tier. `streak1` = emas, `streak2` = emas + merah, `streak3` = emas + merah lebih pekat:

```js
  const wash =
    kind === 'wrong' ? 'radial-gradient(circle at 50% 50%, rgba(211,56,47,0.22), rgba(211,56,47,0.04) 55%, transparent 72%)'
      : kind === 'streak3' ? 'radial-gradient(circle at 50% 50%, rgba(184,144,31,0.34), rgba(211,56,47,0.12) 46%, transparent 78%)'
        : kind === 'streak2' ? 'radial-gradient(circle at 50% 50%, rgba(184,144,31,0.28), rgba(184,144,31,0.06) 55%, transparent 76%)'
          : kind === 'streak1' ? 'radial-gradient(circle at 50% 50%, rgba(201,162,39,0.24), rgba(201,162,39,0.05) 58%, transparent 75%)'
            : kind === 'correct' ? 'radial-gradient(circle at 50% 50%, rgba(125,143,105,0.18), rgba(125,143,105,0.03) 58%, transparent 74%)'
              : 'transparent';
```

**4b.** Ganti peta `ink` (baris 129-131):

```js
  const ink = kind === 'wrong' ? 'var(--sumi-val)'
    : kind === 'correct' ? 'var(--shu-val)'
      : '#b8901f'; // semua tier streak = emas
```

**4c.** Perkuat getaran layar untuk tier tinggi. Ganti blok `animate` shake (baris 150-152) menjadi:

```js
        animate={kind === 'wrong'
          ? { x: [0, -11, 9, -6, 4, 0], y: [0, 3, -3, 2, -1, 0] }
          : kind === 'streak3'
            ? { x: [0, -8, 8, -5, 5, 0], y: [0, -5, 4, -3, 2, 0] }
            : { x: 0, y: 0 }}
```

**4d.** Ganti blok `AnimatePresence` routing komponen (baris 194-198) menjadi:

```jsx
      <AnimatePresence>
        {kind === 'correct' && <HankoStamp key={`h-${fx.id}`} fid={fid} />}
        {kind === 'wrong' && <BrushSlash key={`b-${fx.id}`} fid={fid} angle={fx.angle} y={fx.y} />}
        {kind === 'streak1' && <EnsoRing key={`e1-${fx.id}`} fid={fid} />}
        {kind === 'streak2' && <DoubleEnso key={`e2-${fx.id}`} fid={fid} />}
        {kind === 'streak3' && <GrandEnso key={`e3-${fx.id}`} fid={fid} />}
      </AnimatePresence>
```

**Verifikasi Task 4:**
```bash
grep -n "streak1\|streak2\|streak3" src/features/effects/EffectContext.jsx | head
```
Expected: banyak baris (wash, ink, routing, shake).

---

### Task 5 — Komponen tier-1: rapikan `EnsoRing` (streak 3)

**File:** `src/features/effects/EffectContext.jsx`

`EnsoRing` sudah ada (baris 296-345) dan tampilannya pas untuk tier-1. **Tidak perlu diubah** — hanya pastikan komentarnya diperbarui:

Ganti baris 295:
```js
// ── Streak 3×: ensō (円相) tergambar + 連 mengendap ───────────────────────────
```
menjadi:
```js
// ── Streak 3+ (tier-1): ensō (円相) tergambar + 連 mengendap ──────────────────
```

**Verifikasi Task 5:**
```bash
grep -n "tier-1" src/features/effects/EffectContext.jsx
```
Expected: 1 baris.

---

### Task 6 — Komponen tier-2 (`DoubleEnso`) & tier-3 (`GrandEnso`)

**File:** `src/features/effects/EffectContext.jsx`

Tambahkan **di akhir file** (setelah `EnsoRing`, sebelum penutup file):

```jsx
// ── Streak 5+ (tier-2): dua ensō berlawanan arah + 連続 ───────────────────────
function DoubleEnso({ fid }) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.14 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ marginLeft: -150, marginTop: -150 }}
    >
      {/* Halo emas ganda */}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: [0, 0.6, 0], scale: [0.75, 1.12, 1.3] }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
        style={{ background: 'radial-gradient(circle, rgba(184,144,31,0.5), rgba(211,56,47,0.14) 48%, transparent 66%)', filter: `url(#${fid}-bleed)` }}
      />
      <svg width="300" height="300" viewBox="0 0 100 100" style={{ filter: `url(#${fid}-rough)` }}>
        {/* Cincin luar — searah jarum jam */}
        <motion.circle
          cx="50" cy="50" r="45" fill="none"
          strokeWidth="3.6" strokeLinecap="round" pathLength={1}
          style={{ stroke: '#b8901f', rotate: 90, transformOrigin: '50px 50px' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 0.9, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1] }}
        />
        {/* Cincin dalam — berlawanan arah */}
        <motion.circle
          cx="50" cy="50" r="34" fill="none"
          strokeWidth="2.2" strokeLinecap="round" pathLength={1}
          style={{ stroke: 'var(--shu-val)', rotate: -90, transformOrigin: '50px 50px' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 0.86, opacity: 0.92 }}
          transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1], delay: 0.1 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ delay: 0.32, type: 'spring', stiffness: 230, damping: 17 }}
          className="font-serif font-black text-6xl text-sumi leading-none"
        >
          連続
        </motion.span>
      </div>
    </motion.div>
  );
}

// ── Streak 10+ (tier-3): ledakan tinta penuh layar + ensō raksasa ─────────────
function GrandEnso({ fid }) {
  return (
    <>
      {/* Kilatan emas penuh layar */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.75, 0] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(184,144,31,0.55), rgba(211,56,47,0.18) 55%, transparent 80%)' }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2"
        initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 1.2 }}
        transition={{ type: 'spring', stiffness: 190, damping: 16 }}
        style={{ marginLeft: -190, marginTop: -190 }}
      >
        {/* Halo */}
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: [0, 0.7, 0], scale: [0.7, 1.18, 1.4] }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
          style={{ background: 'radial-gradient(circle, rgba(184,144,31,0.6), rgba(211,56,47,0.2) 50%, transparent 70%)', filter: `url(#${fid}-bleed)` }}
        />
        <svg width="380" height="380" viewBox="0 0 100 100" style={{ filter: `url(#${fid}-rough)` }}>
          <motion.circle
            cx="50" cy="50" r="46" fill="none"
            strokeWidth="4.4" strokeLinecap="round" pathLength={1}
            style={{ stroke: '#b8901f', rotate: 90, transformOrigin: '50px 50px' }}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 0.94, opacity: 1 }}
            transition={{ duration: 1.05, ease: [0.33, 1, 0.68, 1] }}
          />
          <motion.circle
            cx="50" cy="50" r="37" fill="none"
            strokeWidth="2.4" strokeLinecap="round" pathLength={1}
            style={{ stroke: 'var(--shu-val)', rotate: -90, transformOrigin: '50px 50px' }}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 0.88, opacity: 0.95 }}
            transition={{ duration: 1.05, ease: [0.33, 1, 0.68, 1], delay: 0.12 }}
          />
          <motion.circle
            cx="50" cy="50" r="28" fill="none"
            strokeWidth="1.2" strokeLinecap="round" pathLength={1}
            style={{ stroke: 'var(--sumi-val)', rotate: 90, transformOrigin: '50px 50px' }}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 0.8, opacity: 0.32 }}
            transition={{ duration: 1.05, ease: [0.33, 1, 0.68, 1], delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.4, filter: 'blur(12px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 16 }}
            className="font-serif font-black text-8xl text-sumi leading-none"
          >
            連続
          </motion.span>
        </div>
      </motion.div>
    </>
  );
}
```

**Verifikasi Task 6:**
```bash
grep -n "function DoubleEnso\|function GrandEnso" src/features/effects/EffectContext.jsx
```
Expected:
```
<baris>:function DoubleEnso({ fid }) {
<baris>:function GrandEnso({ fid }) {
```

---

### Task 7 — Build & lint

```bash
cd /c/Users/maddo/Documents/japanese-quiz
npm run build 2>&1 | grep -E "✓ built|error|Error|PARSE"
npm run lint 2>&1 | grep -iE "EffectContext"
```
Expected:
- Build: `✓ built in ...` (tanpa `error`/`PARSE`).
- Lint: hanya warning `react(only-export-components)` (pre-existing). Tidak ada error baru.

---

## Tests / Validation

Repo **tidak punya test runner** — jangan tambah vitest untuk efek visual ini (YAGNI). Validasi:

1. **Unit logika tier (tanpa React)** — bukti aturan 3/5/10 + reset saat salah:
```bash
node -e "
const STREAK_TIERS=[{at:10,kind:'streak3'},{at:5,kind:'streak2'},{at:3,kind:'streak1'}];
function run(seq){
  let s=0, out=[];
  for(const t of seq){
    if(t==='correct') s+=1; else s=0;
    let kind=t;
    if(t==='correct'){const h=STREAK_TIERS.find(x=>s>=x.at); if(h) kind=h.kind;}
    out.push(kind);
  }
  return out;
}
console.log('A', run(['correct','correct','correct','correct']).join(','));
console.log('B', run(['correct','correct','wrong','correct','correct','correct']).join(','));
console.log('C', run(Array(10).fill('correct')).join(','));
console.log('D', run(Array(11).fill('correct')).join(','));
"
```
Expected:
```
A correct,correct,streak1,streak1
B correct,correct,wrong,correct,correct,streak1
C correct,correct,streak1,streak1,streak2,streak2,streak2,streak2,streak2,streak3
D correct,correct,streak1,streak1,streak2,streak2,streak2,streak2,streak2,streak3,streak3
```
Kunci yang dibuktikan: (A) streak 4 tetap tier-1; (B) **salah mereset ke 0** → 3 benar lagi baru dapat tier-1; (C) naik 3→5→10; (D) 11 tetap tier-3.

2. **Build & lint gate** — Task 7.

3. **Manual E2E** (`npm run dev` → `/settings` → DevPanel → "♻️ Reset + Cheat Ulang" → main quiz):
   - Jawab benar 3× → ensō + 連 (tier-1).
   - Lanjut benar (total 4) → masih tier-1 (bukan balik ke hanko).
   - Sampai benar 5× → dua ensō + 連続 (tier-2), terasa lebih ramai.
   - Sampai benar 10× → kilatan emas penuh + ensō raksasa + getar (tier-3).
   - **Salah 1× di tengah** → efek merah, lalu benar 1× → kembali efek dasar (bukan langsung tier-1). Bukti reset.

---

## Risks, Tradeoffs, dan Open Questions

**Risks / tradeoffs:**
- **`STREAK_TIERS.find` sensitif urutan.** Array harus dari `at` terbesar → terkecil. Kalau ada yang mengurutkan ulang, `.find` akan selalu mengembalikan tier terkecil. Sudah diberi komentar peringatan di Task 2.
- **Tier-3 "nyala terus" setelah 10** bisa terasa berlebihan kalau user benar puluhan kali berturut (efek besar tiap jawaban). Kalau mengganggu, alternatifnya: nyala tepat di kelipatan 10 saja (lihat Open Questions Q2).
- **`streakRef` lintas quiz.** Sudah ditangani `resetEffectStreak()` di 5 titik call site (tidak diubah di plan ini). Risiko tepi tetap ada kalau user menekan Back di tengah streak.
- **Performa:** tier-3 memunculkan 68 tetesan + 3 cincin SVG ber-filter `feTurbulence`. Semua dibersihkan dalam 1600 ms. Masih aman untuk desktop; di HP low-end mungkin agak berat. Bisa diturunkan lewat `INTENSITY.streak3.drops` kalau perlu.
- **Nimpa vs tumpuk:** plan ini memilih **nimpa** (tier menggantikan hanko). Kalau user mau hanko tetap muncul + efek tier di atasnya, ubah routing di Task 4d agar `kind === 'correct' || kind.startsWith('streak')` merender `HankoStamp` juga.
- **Aksesibilitas:** belum menangani `prefers-reduced-motion`. Di luar cakupan permintaan ini.

**Open Questions (Q2 & Q3 timeout — dipakai default; konfirmasi sebelum/saat eksekusi):**
1. **Q2 — Setelah streak > 10:** default plan = **tier-3 terus nyala tiap jawaban benar**. Alternatif: (a) nyala sekali tepat di 10, setelahnya efek dasar; (b) tiap kelipatan 10 (10, 20, 30) nyala lagi, di antaranya efek dasar.
2. **Q3 — Nimpa atau tumpuk:** default plan = **nimpa** (di streak ≥ 3 hanya efek tier yang tampil). Alternatif: tumpuk (cap hanko tetap muncul di bawah efek tier).
3. Apakah **teks tier-2/tier-3** pakai `連続` (artinya "berkelanjutan/berturut-turut")? Alternatif: tier-2 `連`, tier-3 `連続` supaya ada eskalasi karakter juga. (Default: keduanya `連続`, dibedakan oleh jumlah cincin & ukuran.)
