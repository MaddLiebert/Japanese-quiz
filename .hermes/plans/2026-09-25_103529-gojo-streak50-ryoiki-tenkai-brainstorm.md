# Gojo Streak 50 — Brainstorm 領域展開・無量空処 (Ryoiki Tenkai)

> Dokumen ini **brainstorm dulu**, lalu rencana implementasi dari arah yang dipilih.
> Semua angka ada di SATU tempat (`gojoDomainBurst()` di `gojoFx.js`) → gampang di-tune
> ulang tanpa bongkar komponen. Prinsip: **domain ≠ ledakan**. Murasaki = tabrakan
> 2 bola yang MELEDAK; domain = RUANG yang MENELAN layar. Dua identitas beda.

## Goal

Di streak **50** (`domain`) dan **100** (`domain_zenith`), efek Gojo terasa seperti
**ruang 無量空処 yang membuka & menelan layar** (void + cincin batas + aliran
informasi tak terbatas + kaligrafi), bukan sekadar pengulangan ledakan murasaki —
dengan satu titik tune parameter, tetap senyap (tanpa suara), dan murasaki tidak berubah.

## Current context / assumptions

### Kondisi repo saat plan ditulis

- Branch: `feat/gojo-pack7-dummy`. Commit terakhir: `c352311 feat(dev): preview efek
  Gojo tanpa quiz - tombol 茈 #3/#10, 無量空処 #50, Zenith #100 di DevPanel`.
- **Aturan user: JANGAN PUSH.** Semua commit lokal saja (origin cuma punya `main`).
- `npm test` → **161 pass / 0 fail** (59 test di `gojoFx.test.js`). Lint 0 error.
- Dev server: `http://localhost:5173` (juga 5175). Preview dev sudah ada:
  Settings → panel Developer → tombol **🟪 Domain #50** dan **💫 Zenith #100** —
  dipakai untuk verifikasi tanpa quiz.

### File yang terlibat

| File | Peran |
|---|---|
| `src/features/effects/gojoFx.js` | logika murni. `gojoStars` (baris ~378), `gojoSpeedLines` (~251), `gojoMurasakiBurst` (~463), `gojoDomainBurst` → **BARU** (taruh setelah `gojoMurasakiBurst`), `GOJO_INFO_POOL` + `gojoInfoStreams` → **BARU** (taruh setelah `gojoStars`), `GOJO_BALL_BREAKPOINT` (525) |
| `src/features/effects/gojoFx.test.js` | test murni. Import di baris 3–15; test baru disisipkan setelah blok "Preview dev" (~baris 70) |
| `src/features/effects/GojoBurst.jsx` | render ledakan. Layer domain baru disisipkan setelah WASH, sebelum FLASH (baris ~105) |
| `src/features/effects/EffectContext.jsx` | `holdMs` (baris ~198–202) & blok bola gojo (baris ~225) — durasi overlay domain |

### Efek domain SEKARANG (streak 50) — apa adanya

Urutan layer di `GojoBurst.jsx`: WASH (cel-shade ungu, alpha 0.55, 0.6s) → FLASH putih
1-frame → SHAKE → 集中線 (garis, maxLen 60) → 5 petir hitam dari tepi → **64 bintang
`gojoStars`** (titik cahaya) → impact star → screentone 18 titik → オノマトペ ゴゴゴ →
14 serpihan tinta → retak (`gojoCrackCount`) → teks **無量空処** (clamp 40–92px) +
**領域展開** (clamp 14–30px, top 26%).

Masalah: semua elemen itu **sama dengan murasaki** (yang baru dipertebal), plus bintang
& teks. Tidak ada "ruang" — tidak ada void, tidak ada batas domain, tidak ada
informasi tak terbatas. Durasinya pun ikut `Math.max(cfg.hold, 2200)` yang sama
dengan murasaki → tidak ada "napas" khas domain.

### Yang TIDAK berubah (jangan disentuh)

- `gojoMurasakiBurst()` dan semua wiring murasaki (test-nya sudah mengunci angka 5.5/2/10/dst).
- Suara: pack Gojo **SENYAP total** (permintaan user) — jangan tambah audio.
- `gojoStars`, `gojoBolts`, `gojoSpeedLines`, `gojoHalftone`, retak — dipakai ulang apa adanya.
- Desktop & HP: efek ini full-screen `fixed inset-0 z-[100] pointer-events-none`,
  jadi tidak ada masalah layout bola (44px @ y145) — cukup pastikan teks tetap kebaca
  dan jumlah elemen di HP lebih hemat.

## Brainstorm — arah yang dipertimbangkan

Konsep rasa yang dituju: **"ruang lain terbuka"**, bukan "ledakan kedua". Domain
Gojo di anime = void + informasi tak terbatas + kaligrafi, bukan gelombang kejut.

| # | Ide | Penilaian | Alasan |
|---|---|---|---|
| 1 | **Void takeover** — latar menggelap jadi ruang hitam-ungu (radial `GOJO_VOID`), fade-in → tahan → fade-out | ✅ **DIPILIH** | 1 `<div>`, transform/opacity saja; sekaligus menyelesaikan masalah tema terang (semua elemen ungu/putih jadi kontras) |
| 2 | **Cincin batas domain** — cincin tebal mengembang dari tengah sampai lewat tepi layar (scale 12×) | ✅ **DIPILIH** | 1 `<div>`; bacaan "domain TERBUKA" instan; beda dari shockwave murasaki (kecil, 148px) |
| 3 | **Aliran informasi** — kolom kana turun/naik (informasi tak terbatas 無量空処) | ✅ **DIPILIH** | Signatur paling khas Unlimited Void; **1 span per kolom** (teks bertumpuk `\n`) → murah, bukan 100+ elemen |
| 4 | Kaligrafi brush reveal (kanji "menulis sendiri" pakai stroke-dashoffset) | △ disederhanakan | Butuh SVG path per kanji → mahal & rapuh. Ganti: **glow punch** + ukuran zenith (sudah ada teksnya) |
| 5 | Hand seal 印を結ぶ (tangan Gojo) | ❌ | Kompleks (SVG detail), off-brand untuk overlay kuis |
| 6 | Void putih / inversi layar (kanon anime versi terang) | ❌ v1 | Bentrok tema terang + mencuci teks ungu; simpan sebagai opsi (lihat Open Questions) |
| 7 | Semua elemen tertarik ke tengah lalu ledak | ❌ | Itu identitas murasaki; domain harus terasa RUANG, bukan ledakan |
| 8 | Grid perspektif melengkung (void 3D) | ❌ v1 | Keren tapi berat (SVG path panjang), bisa nyusul kalau user mau |

**Paket terpilih (v1): 1 + 2 + 3 + poles kaligrafi + durasi bernapas (2.8s / 3.2s zenith).**
zenith (#100) = **boost angka yang sama**, bukan efek terpisah (void lebih pekat,
cincin dobel & lebih tebal, aliran lebih ramai, teks lebih besar, tahan lebih lama).

## Architecture / proposed approach

Tambah 2 fungsi murni di `gojoFx.js` (pola sama seperti `gojoMurasakiBurst`):
`gojoInfoStreams(seed, count, rng)` (data kolom kana, deterministik) dan
`gojoDomainBurst(zenith)` (semua angka domain: void/cincin/aliran/kaligrafi/durasi).
`GojoBurst.jsx` merender 3 layer baru (void → aliran → cincin, sebelum FLASH) hanya
saat `isDomain`, dan `EffectContext.jsx` memakai `gojoDomainBurst(...).holdMs` untuk
durasi overlay (2.8s domain / 3.2s zenith) menggantikan `max(cfg.hold, 2200)`.

## Step-by-step tasks

Semua perintah dijalankan dari root repo: `C:\Users\maddo\Documents\japanese-quiz`.
TDD per task: test dulu (RED) → implement (GREEN) → commit.

### Task 0 — Baseline

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"
```

Harapan: `ℹ pass 161` dan `ℹ fail 0`. Kalau tidak, STOP — perbaiki dulu.

---

### Task 1 — TDD: `gojoInfoStreams` + `GOJO_INFO_POOL` (data aliran informasi)

**1a. RED — tambah import & test di `src/features/effects/gojoFx.test.js`.**

Ubah blok import (baris 3–15) — tambahkan 3 nama setelah `gojoMurasakiBurst,`:

```js
  gojoMurasakiBurst,
  gojoInfoStreams, GOJO_INFO_POOL, gojoDomainBurst,
} from './gojoFx.js';
```

Sisipkan test berikut **setelah test `gojoPreviewStreak: input tak valid...`** (sekitar baris 70):

```js
// ── Domain 無量空処 (streak 50) — aliran informasi & parameter domain ────────

test('GOJO_INFO_POOL: kana + kanji kunci, tanpa spasi', () => {
  assert.ok(GOJO_INFO_POOL.length >= 40);
  assert.ok(GOJO_INFO_POOL.includes('無'));
  assert.ok(!/\s/.test(GOJO_INFO_POOL), 'tanpa spasi/newline');
});

test('gojoInfoStreams: deterministik, jumlah, kolom & arah valid', () => {
  const a = gojoInfoStreams(1, 12, () => 0.5);
  const b = gojoInfoStreams(1, 12, () => 0.5);
  assert.deepEqual(a, b);
  assert.equal(a.length, 12);
  for (const s of a) {
    assert.ok(s.x >= 3 && s.x <= 97, `kolom x=${s.x} di dalam layar`);
    assert.ok(s.chars.length >= 10, 'kolom punya cukup karakter');
    assert.ok(s.dur > 0 && s.dur <= 2.2, 'durasi kolom ≤ hold domain (2.8s)');
    assert.ok(s.delay >= 0 && s.delay <= 0.4);
    assert.ok(s.dir === 1 || s.dir === -1, 'arah turun (1) / naik (-1)');
    assert.ok(s.size > 0 && s.opacity > 0);
  }
});
```

Jalankan:

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)|does not provide"
```

Harapan RED: `does not provide an export named 'gojoInfoStreams'` + `ℹ fail 1`.

**1b. GREEN — implement di `src/features/effects/gojoFx.js`.**

Sisipkan **tepat setelah fungsi `gojoStars`** (setelah baris `};` ~391):

```js
// ── Aliran informasi 無量空処 (domain) ──────────────────────────────────────
// Konsep: domain Gojo = "informasi tak terbatas" membanjiri ruang. Satu kolom =
// SATU span berisi kana bertumpuk (\n) → ringan di HP (bukan ratusan elemen).
// Deterministik lewat rng ter-inject (pola sama dengan gojoStars).
export const GOJO_INFO_POOL =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
  + 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほ'
  + '無量空処情報';

export const gojoInfoStreams = (seed = 1, count = 12, rng = Math.random) => {
  const out = [];
  for (let i = 0; i < count; i++) {
    const len = 10 + Math.floor(rng() * 6);            // 10..15 karakter
    let chars = '';
    for (let c = 0; c < len; c++) {
      chars += GOJO_INFO_POOL[Math.floor(rng() * GOJO_INFO_POOL.length)];
      if (c < len - 1) chars += '\n';                  // tumpuk vertikal
    }
    const x = Math.min(97, Math.max(3, ((i + 0.5) / count) * 100 + (rng() * 2 - 1) * 4));
    out.push({
      id: `${seed}-stream-${i}`,
      x,
      chars,
      dir: rng() < 0.5 ? 1 : -1,                       // 1 = turun, -1 = naik
      dur: 1.4 + rng() * 0.8,                          // ≤ 2.2s (aman < hold 2.8s)
      delay: rng() * 0.4,
      size: 11 + rng() * 4,
      opacity: 0.14 + rng() * 0.18,
    });
  }
  return out;
};
```

Jalankan:

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"
```

Harapan GREEN: `ℹ pass 163`, `ℹ fail 0`.

**1c. Commit:**

```bash
git add src/features/effects/gojoFx.js src/features/effects/gojoFx.test.js
git commit -m "feat(gojo): aliran informasi 無量空処 (gojoInfoStreams + pool kana) - deterministik, 1 span per kolom"
```

---

### Task 2 — TDD: `gojoDomainBurst(zenith)` (semua angka domain di satu tempat)

**2a. RED — tambah test di `gojoFx.test.js`** (setelah test Task 1):

```js
test('gojoDomainBurst: deterministik & void cukup pekat untuk tema terang', () => {
  assert.deepEqual(gojoDomainBurst(false), gojoDomainBurst(false));
  const d = gojoDomainBurst(false);
  assert.ok(d.void.alpha >= 0.6, 'void harus gelap agar teks kebaca di tema terang');
  assert.ok(d.ring.borderWidth >= 8, 'cincin batas tebal');
  assert.ok(d.streams.count >= 8 && d.streams.mobileCount <= d.streams.count);
  assert.ok(d.holdMs >= 2400, 'domain butuh napas, bukan kilat');
});

test('gojoDomainBurst: zenith = boost angka yang sama, bukan efek baru', () => {
  const d = gojoDomainBurst(false);
  const z = gojoDomainBurst(true);
  assert.ok(z.void.alpha > d.void.alpha, 'zenith lebih pekat');
  assert.ok(z.streams.count > d.streams.count, 'zenith lebih ramai');
  assert.ok(z.ring.borderWidth > d.ring.borderWidth, 'zenith lebih tebal');
  assert.ok(z.holdMs > d.holdMs, 'zenith lebih lama');
  assert.equal(z.ring.double, true);
  assert.equal(d.ring.double, false);
});
```

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)|does not provide"
```

Harapan RED: `does not provide an export named 'gojoDomainBurst'` + `ℹ fail 1`.

**2b. GREEN — implement di `gojoFx.js`**, sisipkan **tepat setelah `gojoMurasakiBurst`** (setelah `};` ~488):

```js
// ── Domain 領域展開・無量空処 (streak 50 / zenith 100) ──────────────────────
// Paket brainstorm yang dipilih (lihat plan 2026-09-25_103529):
//   1. VOID TAKEOVER    → ruang gelap 無量空処 menelan layar (latar menggelap)
//   2. CINCIN BATAS     → cincin raksasa mengembang = "domain terbuka"
//   3. ALIRAN INFORMASI → kolom kana (gojoInfoStreams) = informasi tak terbatas
//   4. KALIGRAFI        → 無量空処 + 領域展開 (sudah ada, dipoles glow-nya)
// zenith = boost angka yang SAMA (bukan efek terpisah). Murasaki TIDAK memakai ini.
export const gojoDomainBurst = (zenith = false) => {
  const color = GOJO_STYLE.domain.color;               // #7c4dff
  return {
    holdMs: zenith ? 3200 : 2800,                      // durasi overlay penuh
    void: {
      alpha: zenith ? 0.9 : 0.72,                      // cukup gelap → tema terang aman
      color: GOJO_VOID,                                // #1a0a1a (hitam keunguan)
      center: `${color}${zenith ? '3d' : '26'}`,       // pusat agak ungu (alpha hex)
      edge: '#05020a',
      inFrac: 0.15,                                    // times: fade-in selesai
      outFrac: 0.78,                                   // times: mulai fade-out
    },
    ring: {
      borderWidth: zenith ? 14 : 10,
      color,
      glow: zenith ? 90 : 64,
      dur: zenith ? 0.65 : 0.55,
      delay: 0.05,
      double: zenith,                                  // zenith: cincin kedua (delay +0.12)
    },
    streams: {
      count: zenith ? 16 : 12,
      mobileCount: zenith ? 10 : 8,                    // HP lebih hemat elemen
      color: '#e8e0ff',                                // lavender terang
    },
    calligraphy: {
      mainSize: zenith ? 'clamp(48px, 8vw, 108px)' : 'clamp(40px, 7vw, 92px)',
      glow: zenith ? 96 : 72,                          // px blur glow teks
    },
  };
};
```

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"
```

Harapan GREEN: `ℹ pass 165`, `ℹ fail 0`.

**2c. Commit:**

```bash
git add src/features/effects/gojoFx.js src/features/effects/gojoFx.test.js
git commit -m "feat(gojo): parameter domain gojoDomainBurst (void/cincin/aliran/kaligrafi) + boost zenith"
```

---

### Task 3 — Wiring: hoist `isDomain`/`zenith`, render VOID + ALIRAN + CINCIN

**3a. `src/features/effects/GojoBurst.jsx` — import (baris 3–9).** Tambahkan:

```js
import {
  gojoTechniqueFor, GOJO_STYLE, gojoParticles, gojoCrackCount,
  gojoBolts, gojoStars, GOJO_RIM,
  GOJO_INK, GOJO_FLASH, gojoImpactFocus, gojoImpactStar,
  gojoSpeedLines, gojoHalftone, gojoOno,
  gojoMurasakiBurst,
  gojoDomainBurst, gojoInfoStreams, GOJO_BALL_BREAKPOINT,
} from './gojoFx';
```

**3b. Hoist `isDomain`/`zenith` + tambah state (sebelum early-return!).**

Ganti blok awal fungsi (baris ~42–55) supaya jadi:

```js
export function GojoBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const streak = fx?.streak || 0;
  const seed = fx?.id || 1;
  const technique = gojoTechniqueFor(kind, streak);
  const isDomain = technique === 'domain' || technique === 'domain_zenith';
  const zenith = technique === 'domain_zenith';
  const dom = isDomain ? gojoDomainBurst(zenith) : null;

  const [particles] = useState(() => (technique ? gojoParticles(technique, seed) : []));
  const [bolts] = useState(() => (technique ? gojoBolts(technique, seed) : []));
  const [speedLines] = useState(() => (technique ? gojoSpeedLines(technique, seed) : []));
  const [halftone] = useState(() => (technique ? gojoHalftone(seed) : []));
  const [impactStar] = useState(() => (technique ? gojoImpactStar(seed) : null));
  const [stars] = useState(() =>
    (technique === 'domain' || technique === 'domain_zenith') ? gojoStars(seed) : []
  );
  const [mobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < GOJO_BALL_BREAKPOINT
  );
  const [streams] = useState(() =>
    isDomain ? gojoInfoStreams(seed, mobile ? dom.streams.mobileCount : dom.streams.count) : []
  );
```

Lalu **hapus** dua baris lama setelah early-return (yang menduplikasi):

```js
  const isDomain = technique === 'domain' || technique === 'domain_zenith';
  const zenith = technique === 'domain_zenith';
```

**3c. Render 3 layer baru** — sisipkan **setelah blok WASH** (`motion.div` wash, berakhir ~baris 105) dan **sebelum blok FLASH**:

```jsx
      {/* ── Domain — VOID TAKEOVER (ruang 無量空処 menelan layar) ──────────── */}
      {isDomain && dom && (
        <motion.div
          data-gojo-void
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={reduced
            ? { opacity: dom.void.alpha * 0.7 }
            : { opacity: [0, dom.void.alpha, dom.void.alpha, 0] }}
          transition={reduced ? { duration: 0 } : {
            duration: dom.holdMs / 1000,
            times: [0, dom.void.inFrac, dom.void.outFrac, 1],
            ease: 'easeOut',
          }}
          style={{
            background: `radial-gradient(circle at 50% 42%, ${dom.void.center} 0 18%, ${dom.void.color} 55%, ${dom.void.edge} 100%)`,
          }}
        />
      )}

      {/* ── Domain — ALIRAN INFORMASI (kolom kana turun/naik) ─────────────── */}
      {isDomain && dom && (
        <div className="absolute inset-0 overflow-hidden">
          {streams.map((s) => (
            <motion.span
              key={s.id}
              data-gojo-stream
              className="absolute font-mono font-bold select-none"
              style={{
                left: `${s.x}%`,
                top: s.dir === 1 ? '-30vh' : '120vh',
                whiteSpace: 'pre-line',
                lineHeight: 1.15,
                fontSize: s.size,
                color: dom.streams.color,
                opacity: s.opacity,
                willChange: 'transform, opacity',
              }}
              initial={{ y: 0 }}
              animate={reduced ? { y: 0 } : { y: s.dir === 1 ? '150vh' : '-150vh' }}
              transition={{ duration: reduced ? 0 : s.dur, delay: reduced ? 0 : s.delay, ease: 'linear' }}
            >
              {s.chars}
            </motion.span>
          ))}
        </div>
      )}

      {/* ── Domain — CINCIN BATAS (domain terbuka; zenith = dobel) ─────────── */}
      {isDomain && dom && [0, ...(dom.ring.double ? [1] : [])].map((k) => (
        <motion.div
          key={`dom-ring-${k}`}
          data-gojo-ring
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: '10vmax',
            height: '10vmax',
            marginLeft: '-5vmax',
            marginTop: '-5vmax',
            border: `${dom.ring.borderWidth - k * 4}px solid ${dom.ring.color}`,
            boxShadow: `0 0 ${dom.ring.glow - k * 20}px ${(dom.ring.glow - k * 20) / 2}px ${dom.ring.color}66`,
            willChange: 'transform, opacity',
          }}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={reduced ? { scale: 1, opacity: 0.5 } : { scale: [0.2, 12], opacity: [0, 0.9, 0] }}
          transition={{
            duration: reduced ? 0 : dom.ring.dur,
            delay: reduced ? 0 : dom.ring.delay + k * 0.12,
            ease: 'easeOut',
          }}
        />
      ))}
```

**3d. Turunkan WASH domain** (biar tidak dobel gelap dengan void) — cari baris:

```js
        animate={{ opacity: reduced ? 0.4 : [0, isDomain ? 0.55 : 0.4, 0] }}
```

ganti jadi:

```js
        animate={{ opacity: reduced ? 0.4 : [0, isDomain ? 0.3 : 0.4, 0] }}
```

**3e. Cek cepat:**

```bash
npm run lint 2>&1 | grep -cE "error"
```

Harapan: `0`.

**3f. Commit:**

```bash
git add src/features/effects/GojoBurst.jsx
git commit -m "feat(gojo): domain streak 50 - void takeover + aliran informasi + cincin batas (zenith dobel)"
```

---

### Task 4 — Kaligrafi dipoles + durasi overlay domain di `EffectContext.jsx`

**4a. `GojoBurst.jsx` — poles teks 無量空処** (Layer 5, ~baris 419–424). Ganti `style` span:

```js
            style={{
              fontSize: isDomain ? dom.calligraphy.mainSize : 'clamp(56px, 10vw, 140px)',
              color: st.color,
              WebkitTextStroke: `3px ${GOJO_INK}`,
              textShadow: isDomain
                ? `5px 5px 0 ${GOJO_INK}, 0 0 ${dom.calligraphy.glow}px ${st.color}cc, 0 0 ${dom.calligraphy.glow * 1.6}px ${st.color}55`
                : `5px 5px 0 ${GOJO_INK}`,
              willChange: 'transform, opacity',
            }}
```

**4b. `EffectContext.jsx` — import** (baris 11). Ganti jadi:

```js
import { nextGojoBalls, GOJO_BALLS_EMPTY, gojoTechniqueFor, gojoPreviewStreak, gojoDomainBurst } from './gojoFx';
```

**4c. Hoist teknik gojo & pakai durasi domain.** Ganti blok `holdMs` (baris ~198–202) jadi:

```js
    // Teknik gojo jawaban ini — dihitung SEKALI (dipakai durasi overlay & bola).
    const gojoTech = activeVisual === 'gojo'
      ? gojoTechniqueFor(kind, type === 'correct' ? streakRef.current : 0)
      : null;

    // Lama tampil: pack 'hina' → ikuti durasi klip suara; pack 'gojo' → tahan lebih
    // lama (bola plasma butuh waktu). Domain (#50/#100) dapat "napas" 2.8s/3.2s.
    const holdMs = activeVisual === 'hina'
      ? hinaGifHoldMs(kind === 'streak' ? 'streak' : type, clipMs)
      : activeVisual === 'gojo'
        ? (gojoTech === 'domain' || gojoTech === 'domain_zenith'
          ? gojoDomainBurst(gojoTech === 'domain_zenith').holdMs
          : Math.max(cfg.hold, 2200))
        : cfg.hold;
```

Lalu di blok bola gojo (baris ~225), ganti:

```js
      const tech = gojoTechniqueFor(kind, type === 'correct' ? streakRef.current : 0);
```

jadi:

```js
      const tech = gojoTech;   // sudah dihitung di atas (DRY)
```

**4d. Gates:**

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"
npm run lint 2>&1 | grep -cE "error"
```

Harapan: `pass 165` / `fail 0` / `0`.

**4e. Commit:**

```bash
git add src/features/effects/GojoBurst.jsx src/features/effects/EffectContext.jsx
git commit -m "feat(gojo): kaligrafi domain glow + durasi overlay domain 2.8s/3.2s (zenith)"
```

---

### Task 5 — Verifikasi browser (wajib; test murni tidak merender komponen)

Pakai browser helper (dev server 5173 sudah jalan; kalau mati: `npm run dev`).

**5a. Desktop — klik preview Domain #50, cek layer & screenshot:**

```python
import time, json
new_tab("http://localhost:5173/settings")
wait_for_load()
js("""(() => { const b=[...document.querySelectorAll('button')].find(x=>/#50/i.test(x.textContent)); b.click(); return b.textContent.trim(); })()""")
time.sleep(0.7)
print(js("""(() => ({
  void: document.querySelectorAll('[data-gojo-void]').length,
  ring: document.querySelectorAll('[data-gojo-ring]').length,
  streams: document.querySelectorAll('[data-gojo-stream]').length,
  text: /無量空処/.test(document.body.innerText)
}))()"""))
# Harapan: {'void': 1, 'ring': 1, 'streams': 12, 'text': True}
```

Ambil screenshot saat puncak (~0.8–1.2s setelah klik) → `vision_analyze`:
"Apakah terlihat void gelap, cincin mengembang, kolom kana, teks 無量空処 besar?
Apakah terbaca di tema terang?" — Harapan: YA, teks kebaca (berkat void).

**5b. Zenith #100:** klik tombol `💫 Zenith #100`, cek ulang →
`{'ring': 2, 'streams': 16}` + teks ゴゴゴゴ/無量空処 ada.

**5c. Tema gelap:** nyalakan Dark (tombol ☀️/🌙 di halaman Settings), ulangi 5a →
vision: void tetap enak dilihat, tidak "kotor".

**5d. HP 390×844:**

```python
cdp('Emulation.setDeviceMetricsOverride', width=390, height=844, deviceScaleFactor=3, mobile=True)
# klik Domain #50 lagi, tunggu 0.7s
print(js("""(() => document.querySelectorAll('[data-gojo-stream]').length)()"""))
# Harapan: 8 (mobileCount), ring: 1, void: 1
cdp('Emulation.clearDeviceMetricsOverride')
```

Screenshot + vision: "Apakah teks 無量空処 muat di layar HP? Kolom kana tidak menutupi teks?"

**5e. Regresi murasaki:** klik `茈 #3` → cek petir tetap `stroke-width 5.5`, ring murasaki
tetap `border 10px` (jangan sampai domain mengubah murasaki):

```python
print(js("""(() => ({
  bolt: document.querySelector('svg path[stroke-width="5.5"]') ? 5.5 : null
}))()"""))
```

---

### Task 6 — Gates akhir + commit

```bash
npm test 2>&1 | grep -E "^ℹ (pass|fail)"
npm run lint 2>&1 | grep -cE "error"
npm run build 2>&1 | tail -2
git status --short
```

Harapan: `pass 165` / `fail 0` / `0` / build sukses (`dist/index.html` ada).

Kalau semua hijau:

```bash
git add -A -- src/
git commit -m "chore(gojo): verifikasi domain 領域展開 - desktop/HP, tema terang/gelap, regresi murasaki OK"  # hanya jika masih ada perubahan tersisa
git ls-remote --heads origin   # PASTIKAN origin cuma punya refs/heads/main (tidak ada push)
```

## Tests / validation

- Unit (node --test): 4 test baru → total **165 pass / 0 fail**. Semua test lama
  (termasuk murasaki tebal & preview streak) harus tetap hijau.
- Kontrak test: `gojoInfoStreams` deterministik + bounds; `gojoDomainBurst` deterministik,
  void alpha ≥ 0.6, zenith > domain di semua metrik, `ring.double` flag.
- Browser (ground truth): hitungan elemen `data-gojo-*` di DOM, screenshot + vision
  di 4 kombinasi (desktop/HP × terang/gelap), regresi murasaki.
- Lint 0 error; build produksi sukses. Commit lokal, **tidak push**.

## Risks, tradeoffs, and open questions

- **Performa HP**: +1 void +1–2 cincin +8–10 kolom (1 span/kolom) ≈ +12 elemen,
  semua animasi transform/opacity. Kalau tetap janky: turunkan `mobileCount` (8→6)
  atau `count` — cukup ubah 1 angka di `gojoDomainBurst()`.
- **Tema terang**: void alpha 0.72 yang bikin teks ungu kebaca. Kalau vision bilang
  kurang gelap → naikkan ke 0.78; kalau terlalu gelap → 0.66. Satu angka.
- **Overlay menutup UI 2.8s/3.2s**: ini momen milestone (jarang), `pointer-events-none`
  jadi kuis tetap bisa diklik. Kalau user rasa kelamaan → `holdMs` di `gojoDomainBurst()`.
- **Reduced motion**: void tampil statis (alpha ×0.7), cincin statis, kolom diam —
  tanpa kilatan (aman fotosensitivitas).
- **Tradeoff zenith**: dipilih "boost angka" (bukan efek baru) supaya DRY & satu titik tune;
  kalau user mau zenith benar-benar beda (mis. void putih), itu perubahan lanjutan.

**Open questions (bisa dijawab sambil jalan, tidak memblokir implementasi):**

1. Void **gelap** (dipilih, aman di tema terang) vs void **putih** ala anime? — default gelap.
2. Kepadatan aliran informasi: 12 kolom desktop / 8 HP (dipilih) — bisa 20 kalau mau lebih "Matrix".
3. Zenith: boost (dipilih) vs efek berbeda? — default boost.
