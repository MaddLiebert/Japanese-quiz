# Plan — Rombak Efek Gojo: Plasma + Petir Hitam (dari Pinggir)

Sumber: brainstorm user sesi ini. Keluhan: **"efeknya terlalu generik, pinggirnya terlalu ngotak, bolanya terlalu polos."**

---

## 1. Goal

Ganti primitif efek Gojo yang generik (braket HUD kotak, bola kaca polos, partikel titik, gelombang domain) menjadi **asap 呪力 + petir hitam dari tepi layar**, **bola plasma berputar** yang diselimuti petir hitam, **bara 呪力** sebagai partikel, dan **bintang 無量空処** untuk domain — dengan aturan **petir/asap tidak boleh masuk ke tengah**.

---

## 2. Current context / assumptions

Repo: `C:\Users\maddo\Documents\japanese-quiz`. Branch `feat/gojo-pack7-dummy`, **ahead 77, JANGAN push** (aturan user). Gojo saat ini **senyap** (sound sudah dihapus) — **jangan sentuh suara**, ini murni visual.

**File yang diubah (hanya 3):**
- `src/features/effects/gojoFx.js` — logika murni (dites node)
- `src/features/effects/gojoFx.test.js` — test
- `src/features/effects/GojoBurst.jsx` — komponen render

**Kondisi kode sekarang (yang mau dibuang):**
| Bagian | Sekarang | Masalah |
|---|---|---|
| `CORNERS` (GojoBurst baris 29–152) | 4 braket L `border 10px` solid + garis dalam + titik | "ngotak" = viewfinder kamera/HUD |
| `gojoSpheres` + render baris 158–187 | 1 `radial-gradient` + `boxShadow` | "polos" = bola kaca statis |
| `gojoParticles` | titik bulat | generik |
| Wash domain (baris 83–85) | `repeating-radial-gradient` | generik |

**Aturan yang WAJIB dipatuhi (dari pelajaran efek Hina):**
- Animasi **hanya `transform` + `opacity`**. Pengecualian yang SUDAH ada & diterima: `pathLength` (reveal garis SVG, dipakai layer retak) — boleh dipakai untuk petir.
- Teks besar pakai `text-shadow`, **BUKAN** `filter: drop-shadow`.
- Hormati `prefers-reduced-motion` → efek langsung selesai, tanpa animasi.
- `will-change` hanya saat aktif.

**Palet tema (PENTING — `src/index.css`):** terang bg `#f3f0e8`, gelap bg `#141517`. Petir **hitam pekat tidak kelihatan di tema gelap** → dipakai `#1a0a1a` (hitam keunguan) + rim terang `#ece6ff` (keputusan user).

---

## 3. Spec FINAL (keputusan user, terkunci)

| Aspek | Keputusan |
|---|---|
| Pinggir | Buang braket HUD → **asap 呪力 + petir hitam**, ngerayap dari 4 tepi |
| Petir hitam | Warna `#1a0a1a` + **rim glow** `#ece6ff` tipis → kebaca di tema terang & gelap |
| Bola | **Plasma muter** (`conic-gradient` berputar) + **diselimutin petir hitam** + inti terang + void hitam |
| Gerak bola | **ao & aka DIAM di pinggir** (tidak ke tengah) · **murasaki TETAP tabrakan di tengah** |
| Momen bola | Tetap di jawaban benar (ao/aka/murasaki) — cuma tampilan yang dirombak |
| Partikel | Titik bulat → **bara 呪力** (percikan memanjang) |
| Domain (50/100) | Gelombang radial → **bintang 無量空処** (titik cahaya tak-hingga) |
| Batas | Asap & petir **tidak boleh lewat 34vw dari tepi** (tengah di 50vw) |

**Konstanta kunci:** `GOJO_VOID = '#1a0a1a'` · `GOJO_RIM = '#ece6ff'` · `GOJO_EDGE_BAND_VW = 34` · `GOJO_EDGE_ANCHOR_VW = 32`.

---

## 4. Architecture / approach

`gojoFx.js` tetap jadi satu-satunya tempat logika (pure, deterministik, dites di node). Tambah 5 fungsi murni baru: `gojoSmoke`, `gojoBolts`, `gojoBoltPath`, `gojoSphereBolts`, `gojoStars`; ubah `gojoSpheres` (semantik `toVw` → `anchorVw`); tambah `len` ke `gojoParticles`. `GojoBurst.jsx` hanya jadi "perender" dari data itu — layer braket dibuang, diganti layer asap + petir, bola jadi plasma multi-lapis.

---

## 5. Step-by-step tasks

> Semua perintah dari `C:\Users\maddo\Documents\japanese-quiz` (bash). **Commit tiap fase, JANGAN push.**

### Phase 0 — Baseline

**0.1** Cek bersih & hijau:
```bash
git status --short
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Harapan: status kosong; `ℹ tests 118 / pass 118 / fail 0`.

---

### Phase 1 — TDD: fungsi murni baru di `gojoFx.js`

**1.1 (RED)** Ganti seluruh isi `src/features/effects/gojoFx.test.js` dengan versi ini:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gojoTechniqueFor, isGojoMilestone, gojoCrackCount, gojoParticles, GOJO_STYLE,
  gojoSpheres, gojoSmoke, gojoBolts, gojoBoltPath, gojoStars,
  GOJO_VOID, GOJO_RIM, GOJO_EDGE_BAND_VW,
} from './gojoFx.js';

// ── Teknik per jawaban (tidak berubah) ──────────────────────────────────────
test('gojoTechniqueFor: benar#1 = ao, benar#2 = aka', () => {
  assert.equal(gojoTechniqueFor('correct', 1), 'ao');
  assert.equal(gojoTechniqueFor('correct', 2), 'aka');
});
test('gojoTechniqueFor: streak 3 = murasaki', () => {
  assert.equal(gojoTechniqueFor('streak', 3), 'murasaki');
});
test('gojoTechniqueFor: milestone = murasaki', () => {
  for (const m of [5, 10, 20, 30, 40, 60, 70, 80, 90]) {
    assert.equal(gojoTechniqueFor('streak', m), 'murasaki', `milestone ${m}`);
  }
});
test('gojoTechniqueFor: non-milestone setelah 3 = ao/aka selang-seling', () => {
  assert.equal(gojoTechniqueFor('streak', 4), 'ao');
  assert.equal(gojoTechniqueFor('streak', 6), 'aka');
  assert.equal(gojoTechniqueFor('streak', 7), 'ao');
  assert.equal(gojoTechniqueFor('streak', 8), 'aka');
});
test('gojoTechniqueFor: 50 = domain, 100 = domain_zenith', () => {
  assert.equal(gojoTechniqueFor('streak', 50), 'domain');
  assert.equal(gojoTechniqueFor('streak', 100), 'domain_zenith');
});
test('gojoTechniqueFor: salah = null', () => {
  assert.equal(gojoTechniqueFor('wrong', 0), null);
  assert.equal(gojoTechniqueFor('wrong', 7), null);
});

// ── Milestone & retak ───────────────────────────────────────────────────────
test('isGojoMilestone: cocok MILESTONES app', () => {
  for (const m of [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) assert.equal(isGojoMilestone(m), true);
  for (const n of [0, 1, 2, 4, 6, 7, 9, 11, 99]) assert.equal(isGojoMilestone(n), false);
});
test('gojoCrackCount: naik per level, ada batas', () => {
  assert.ok(gojoCrackCount(3) < gojoCrackCount(20));
  assert.ok(gojoCrackCount(100) <= 14);
  assert.ok(gojoCrackCount(3) >= 3);
});

// ── Style + warna petir hitam ───────────────────────────────────────────────
test('GOJO_STYLE punya warna & kanji tiap teknik', () => {
  for (const t of ['ao', 'aka', 'murasaki', 'domain', 'domain_zenith']) {
    assert.ok(GOJO_STYLE[t].color, `${t} tanpa warna`);
    assert.ok(GOJO_STYLE[t].kanji, `${t} tanpa kanji`);
  }
  assert.equal(GOJO_STYLE.ao.kanji, '蒼');
  assert.equal(GOJO_STYLE.aka.kanji, '赫');
  assert.equal(GOJO_STYLE.murasaki.kanji, '茈');
  assert.equal(GOJO_STYLE.domain.kanji, '無量空処');
});
test('GOJO_VOID & GOJO_RIM = hex valid (petir hitam + rim kebaca 2 tema)', () => {
  assert.match(GOJO_VOID, /^#[0-9a-f]{6}$/i);
  assert.match(GOJO_RIM, /^#[0-9a-f]{6}$/i);
  assert.notEqual(GOJO_VOID.toLowerCase(), '#000000', 'jangan hitam pekat (tak kebaca di tema gelap)');
});

// ── Bola (REVISI: ao/aka diam di pinggir, murasaki tabrakan di tengah) ──────
test('gojoSpheres: ao = dari KANAN, DIAM di pinggir (tidak ke tengah)', () => {
  const s = gojoSpheres('ao');
  assert.equal(s.length, 1);
  assert.ok(s[0].fromVw > 0, 'mulai dari kanan');
  assert.ok(s[0].anchorVw > 0, 'berhenti di pinggir kanan, bukan tengah');
  assert.ok(s[0].anchorVw >= 20, 'anchor cukup ke pinggir');
});
test('gojoSpheres: aka = dari KIRI, DIAM di pinggir', () => {
  const s = gojoSpheres('aka');
  assert.equal(s.length, 1);
  assert.ok(s[0].fromVw < 0, 'mulai dari kiri');
  assert.ok(s[0].anchorVw < 0, 'berhenti di pinggir kiri');
  assert.ok(s[0].anchorVw <= -20, 'anchor cukup ke pinggir');
});
test('gojoSpheres: murasaki = DUA bola tabrakan di TENGAH', () => {
  const s = gojoSpheres('murasaki');
  assert.equal(s.length, 2);
  assert.equal(s.filter((b) => b.fromVw > 0).length, 1, 'satu dari kanan');
  assert.equal(s.filter((b) => b.fromVw < 0).length, 1, 'satu dari kiri');
  for (const b of s) assert.equal(b.anchorVw, 0, 'semua berakhir di tengah');
});
test('gojoSpheres: warna = kanon, domain tanpa bola', () => {
  assert.equal(gojoSpheres('ao')[0].color, GOJO_STYLE.ao.color);
  assert.equal(gojoSpheres('aka')[0].color, GOJO_STYLE.aka.color);
  assert.deepEqual(gojoSpheres('domain'), []);
  assert.deepEqual(gojoSpheres(null), []);
});

// ── Partikel = bara memanjang ───────────────────────────────────────────────
test('gojoParticles: tiap bara punya panjang (len) & deterministik', () => {
  const a = gojoParticles('ao', 1, () => 0.5);
  const b = gojoParticles('ao', 1, () => 0.5);
  assert.deepEqual(a, b);
  assert.ok(a.length >= 12 && a.length <= 30);
  for (const p of a) assert.ok(p.len > 0, 'bara harus punya panjang');
});
test('gojoParticles: murasaki spiral, aka keluar, ao hisap', () => {
  assert.equal(gojoParticles('ao', 1, () => 0.5)[0].out, false);
  assert.equal(gojoParticles('aka', 1, () => 0.5)[0].out, true);
  assert.equal(gojoParticles('murasaki', 1, () => 0.5)[0].spiral, true);
});

// ── Asap 呪力 (dari tepi, tidak ke tengah) ─────────────────────────────────
test('gojoSmoke: deterministik, dari tepi, tidak lewat band tepi', () => {
  const a = gojoSmoke('ao', 1, () => 0.5);
  const b = gojoSmoke('ao', 1, () => 0.5);
  assert.deepEqual(a, b);
  assert.ok(a.length >= 4, 'minimal 4 gumpalan asap');
  for (const s of a) {
    assert.ok(s.reach > 0 && s.reach <= GOJO_EDGE_BAND_VW, `reach ${s.reach} harus di dalam band tepi`);
    assert.ok(s.edge >= 0 && s.edge <= 3, 'edge 0..3');
    assert.ok(s.size > 0);
  }
});

// ── Petir hitam (dari tepi, TIDAK sampai tengah) ───────────────────────────
test('gojoBolts: semua titik jauh dari tengah (jangan ke tengah)', () => {
  for (const t of ['ao', 'aka', 'murasaki']) {
    const bolts = gojoBolts(t, 1, () => 0.5);
    assert.ok(bolts.length >= 3, `${t}: minimal 3 petir`);
    for (const b of bolts) {
      for (const [x, y] of b.points) {
        const dist = Math.hypot(x - 50, y - 50);
        assert.ok(dist >= 16, `${t}: titik petir (${x},${y}) terlalu dekat tengah`);
      }
    }
  }
});
test('gojoBoltPath: polyline valid di ruang 0..100, nempel di tepi bola', () => {
  const pts = gojoBoltPath(() => 0.5).split(' ').map((s) => s.split(',').map(Number));
  assert.ok(pts.length >= 4, 'minimal 4 titik');
  for (const [x, y] of pts) {
    assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100, `titik (${x},${y}) di luar 0..100`);
    const r = Math.hypot(x - 50, y - 50);
    assert.ok(r >= 30, `titik harus di pinggir bola (r=${r.toFixed(1)})`);
  }
});

// ── Bintang 無量空処 (domain) ──────────────────────────────────────────────
test('gojoStars: deterministik & jumlah sesuai', () => {
  const a = gojoStars(1, 40, () => 0.5);
  const b = gojoStars(1, 40, () => 0.5);
  assert.deepEqual(a, b);
  assert.equal(a.length, 40);
  for (const s of a) {
    assert.ok(s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100, 'bintang di dalam layar');
    assert.ok(s.size > 0);
  }
});
```

**1.2 (RED — verifikasi gagal)**:
```bash
node --test src/features/effects/gojoFx.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)|does not provide"
```
Harapan: **GAGAL** — `does not provide an export named 'gojoSmoke'` (dan `anchorVw` undefined). Bukti test benar-benar menguji.

**1.3 (GREEN)** Ganti seluruh isi `src/features/effects/gojoFx.js` dengan ini:
```js
// ─────────────────────────────────────────────────────────────────────────────
// Logika murni efek Gojo Satoru (visual 'gojo'). Tanpa React/DOM → dites di node.
// Kanon: 蒼 (Ao) → 赫 (Aka) → 茈 (Murasaki = Ao+Aka) → 領域展開・無量空処 (Domain).
//
// Rombak (permintaan user): buang primitif generik → asap 呪力 + petir hitam
// dari tepi, bola plasma berputar, bara 呪力, bintang 無量空処.
//   - ao/aka DIAM di pinggir (tidak ke tengah); murasaki tabrakan di tengah
//   - petir & asap TIDAK boleh masuk ke tengah (batas GOJO_EDGE_BAND_VW)
//   - salah → null (tanpa teknik, tanpa retak)
// ─────────────────────────────────────────────────────────────────────────────

export const GOJO_MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const isGojoMilestone = (streak) => GOJO_MILESTONES.includes(streak);

// ── Warna khas "petir hitam" Gojo ───────────────────────────────────────────
// VOID = hitam keunguan (bukan #000 pekat, biar kebaca di tema gelap #141517).
// RIM  = garis terang tipis di atas petir (kontras di tema terang & gelap).
export const GOJO_VOID = '#1a0a1a';
export const GOJO_RIM = '#ece6ff';

// Pinggir: asap & petir tidak boleh lewat band ini dari tepi (vw).
export const GOJO_EDGE_BAND_VW = 34;

// Teknik untuk satu streak. streak = jumlah jawaban benar beruntun.
const techniqueForStreak = (streak) => {
  if (streak >= 100) return 'domain_zenith';
  if (streak === 50) return 'domain';
  if (isGojoMilestone(streak)) return 'murasaki';
  if (streak === 1) return 'ao';
  if (streak === 2) return 'aka';
  const msInRange = GOJO_MILESTONES.filter((m) => m >= 4 && m <= streak).length;
  const idx = (streak - 3) - msInRange - 1;
  return idx % 2 === 0 ? 'ao' : 'aka';
};

export const gojoTechniqueFor = (kind, streak = 0) => {
  if (kind === 'wrong') return null;
  if (!Number.isFinite(streak) || streak <= 0) return 'ao';
  return techniqueForStreak(streak);
};

export const GOJO_STYLE = {
  ao:            { kanji: '蒼',       color: '#00b0ff', label: '蒼 · Ao' },
  aka:           { kanji: '赫',       color: '#e53935', label: '赫 · Aka' },
  murasaki:      { kanji: '茈',       color: '#9c27b0', label: '茈 · Murasaki' },
  domain:        { kanji: '無量空処', color: '#7c4dff', label: '領域展開・無量空処' },
  domain_zenith: { kanji: '無量空処', color: '#b388ff', label: '領域展開・無量空処' },
};

export const gojoCrackCount = (streak = 0) => Math.min(3 + Math.floor(streak / 2), 14);

// ── Bola teknik (revisi) ────────────────────────────────────────────────────
//   ao  → bola BIRU muncul dari tepi KANAN, lalu DIAM di pinggir (tidak ke tengah)
//   aka → bola MERAH muncul dari tepi KIRI, lalu DIAM di pinggir
//   茈  → dua bola meluncur dari tepi & TABRAKAN di TENGAH (tetap)
// fromVw   = titik awal (di luar layar), satuan vw dari tengah
// anchorVw = posisi berhenti (vw dari tengah); 0 = tengah
export const GOJO_SPHERE_OFFSCREEN_VW = 62;
export const GOJO_EDGE_ANCHOR_VW = 32;

export const gojoSpheres = (technique) => {
  const R = GOJO_SPHERE_OFFSCREEN_VW;
  const A = GOJO_EDGE_ANCHOR_VW;
  if (technique === 'ao') {
    return [{ id: 'ao', color: GOJO_STYLE.ao.color, fromVw: R, anchorVw: A, size: 128, dur: 0.5, delay: 0 }];
  }
  if (technique === 'aka') {
    return [{ id: 'aka', color: GOJO_STYLE.aka.color, fromVw: -R, anchorVw: -A, size: 128, dur: 0.5, delay: 0 }];
  }
  if (technique === 'murasaki') {
    return [
      { id: 'ao',  color: GOJO_STYLE.ao.color,  fromVw: R,  anchorVw: 0, size: 96, dur: 0.5, delay: 0 },
      { id: 'aka', color: GOJO_STYLE.aka.color, fromVw: -R, anchorVw: 0, size: 96, dur: 0.5, delay: 0 },
    ];
  }
  return [];
};

// ── Bara 呪力 (partikel memanjang, bukan titik) ─────────────────────────────
export const gojoParticles = (technique, seed = 1, rng = Math.random) => {
  const spiral = technique === 'murasaki';
  const out = technique === 'aka';
  const count = spiral ? 20 : 14;
  const list = [];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 70 + rng() * 230;
    list.push({
      id: `${seed}-${i}`,
      angle,
      dist,
      size: 4 + rng() * 8,
      len: 14 + rng() * 30,          // panjang bara (percikan memanjang)
      delay: rng() * 0.18,
      dur: 0.5 + rng() * 0.5,
      spin: spiral ? (rng() * 2 - 1) * 260 : 0,
      out,
      spiral,
    });
  }
  return list;
};

// ── Asap 呪力 (dari tepi, tidak ke tengah) ──────────────────────────────────
// edge: 0 atas, 1 kanan, 2 bawah, 3 kiri. along = posisi sepanjang tepi (0..1).
export const gojoSmoke = (technique, seed = 1, rng = Math.random) => {
  const color = (GOJO_STYLE[technique] || GOJO_STYLE.murasaki).color;
  const count = 8;
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      id: `${seed}-smoke-${i}`,
      edge: i % 4,
      along: 0.08 + rng() * 0.84,
      reach: 10 + rng() * (GOJO_EDGE_BAND_VW - 14),   // 10..~30 vw (aman dari tengah)
      size: 90 + rng() * 150,
      delay: rng() * 0.25,
      dur: 0.9 + rng() * 0.7,
      drift: (rng() * 2 - 1) * 22,
      color,
    });
  }
  return list;
};

// ── Petir hitam tepi (zigzag dari tepi, TIDAK sampai tengah) ────────────────
// Kembalikan { id, edge, points:[[x,y],...] } dalam ruang viewBox 0..100.
const clamp100 = (v) => Math.min(100, Math.max(0, v));

export const gojoBolts = (technique, seed = 1, rng = Math.random) => {
  const count = 5;
  const out = [];
  for (let i = 0; i < count; i++) {
    const edge = i % 4;
    const along = 10 + rng() * 80;          // posisi sepanjang tepi
    const reach = 14 + rng() * 16;          // masuk sejauh ini dari tepi (max 30 < 50)
    const steps = 4;
    const pts = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const jit = (s === 0 || s === steps) ? 0 : (rng() * 2 - 1) * 8;
      const d = t * reach;
      if (edge === 0) pts.push([Math.round(clamp100(along + jit)), Math.round(d)]);
      else if (edge === 1) pts.push([Math.round(100 - d), Math.round(clamp100(along + jit))]);
      else if (edge === 2) pts.push([Math.round(clamp100(along + jit)), Math.round(100 - d)]);
      else pts.push([Math.round(d), Math.round(clamp100(along + jit))]);
    }
    out.push({ id: `${seed}-bolt-${i}`, edge, points: pts });
  }
  return out;
};

// Satu bolt zigzag lokal (untuk MEMBELIT bola). String "x,y x,y ..." ruang 0..100.
// Semua titik di pinggir lingkaran (r 40..52 dari pusat 50,50) → tidak nembus inti.
export const gojoBoltPath = (rng = Math.random, steps = 5) => {
  const startA = rng() * Math.PI * 2;
  const endA = startA + (0.7 + rng() * 0.9) * (rng() < 0.5 ? 1 : -1);
  const baseR = 45;
  const pts = [];
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const a = startA + (endA - startA) * t;
    const rr = baseR + (rng() * 2 - 1) * 6;
    pts.push(`${Math.round(50 + Math.cos(a) * rr)},${Math.round(50 + Math.sin(a) * rr)}`);
  }
  return pts.join(' ');
};

export const gojoSphereBolts = (count = 3, rng = Math.random) => {
  const out = [];
  for (let i = 0; i < count; i++) out.push(gojoBoltPath(rng));
  return out;
};

// ── Bintang 無量空処 (domain = titik cahaya tak-hingga, bukan gelombang) ────
export const gojoStars = (seed = 1, count = 64, rng = Math.random) => {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: `${seed}-star-${i}`,
      x: rng() * 100,
      y: rng() * 100,
      size: 1 + rng() * 2.5,
      delay: rng() * 0.6,
      dur: 0.6 + rng() * 1.0,
    });
  }
  return out;
};
```

**1.4 (GREEN — verifikasi lulus)**:
```bash
node --test src/features/effects/gojoFx.test.js 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Harapan: semua pass (18 test), `fail 0`.

**1.5** Commit:
```bash
git add src/features/effects/gojoFx.js src/features/effects/gojoFx.test.js
git commit -m "feat(gojo): logika asap/petir-hitam/bara/bintang + bola diam di pinggir (ao/aka)"
```

---

### Phase 2 — Render: rombak `GojoBurst.jsx`

**2.1** Ganti seluruh isi `src/features/effects/GojoBurst.jsx` dengan ini:
```jsx
import { useState } from 'react';
import { motion } from 'motion/react';
import {
  gojoTechniqueFor, GOJO_STYLE, gojoParticles, gojoCrackCount, gojoSpheres,
  gojoSmoke, gojoBolts, gojoSphereBolts, gojoStars, GOJO_VOID, GOJO_RIM,
} from './gojoFx';

// ─────────────────────────────────────────────────────────────────────────────
// Gojo Satoru (visual 'gojo') — efek berlapis v2 (rombak):
//   Layer 5  TEKS TEKNIK      蒼 / 赫 / 茈 / 領域展開・無量空処
//   Layer 4  RETAK            HANYA streak
//   Layer 3b PETIR HITAM      zigzag dari 4 tepi (TIDAK ke tengah)
//   Layer 3a ASAP 呪力        gumpalan asap dari tepi (TIDAK ke tengah)
//   Layer 2b BINTANG 無量空処  domain saja (titik cahaya tak-hingga)
//   Layer 2a BOLA PLASMA      conic muter + petir membelit + void hitam
//   Layer 2  BARA 呪力        partikel memanjang
//   Layer 1  WASH + SHAKE     warna dasar + getar
//
// Aturan performa:
//   - animasi HANYA transform + opacity (+ pathLength untuk reveal garis, spt retak)
//   - teks besar pakai text-shadow, BUKAN filter: drop-shadow
//   - prefers-reduced-motion → efek langsung "selesai"
//   - will-change hanya saat aktif
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// edge (0 atas,1 kanan,2 bawah,3 kiri) → posisi % layar + arah masuk (px).
function edgeToXY(edge, along, reachVw) {
  const vw = (typeof window !== 'undefined' ? window.innerWidth : 1200) / 100;
  const reachPx = reachVw * vw;
  const j = (along - 0.5) * 100;   // -50..50 sepanjang tepi
  if (edge === 0) return { left: 50 + j, top: 0,   dx: 0,       dy: reachPx };
  if (edge === 1) return { left: 100,    top: 50 + j, dx: -reachPx, dy: 0 };
  if (edge === 2) return { left: 50 + j, top: 100, dx: 0,       dy: -reachPx };
  return { left: 0, top: 50 + j, dx: reachPx, dy: 0 };
}

export function GojoBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const streak = fx?.streak || 0;
  const seed = fx?.id || 1;
  const technique = gojoTechniqueFor(kind, streak);

  const [particles] = useState(() => (technique ? gojoParticles(technique, seed) : []));
  const [smoke] = useState(() => (technique ? gojoSmoke(technique, seed) : []));
  const [bolts] = useState(() => (technique ? gojoBolts(technique, seed) : []));
  const spheres = technique ? gojoSpheres(technique) : [];
  const [sphereBolts] = useState(() => spheres.map(() => gojoSphereBolts(3)));
  const [stars] = useState(() =>
    (technique === 'domain' || technique === 'domain_zenith') ? gojoStars(seed) : []
  );

  // Salah: wash merah lembut, TANPA retak.
  if (!technique) {
    return (
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.5 : [0, 0.5, 0] }}
        transition={{ duration: reduced ? 0 : 0.6, ease: 'easeOut' }}
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(229,57,53,0.28), transparent 70%)' }}
      />
    );
  }

  const st = GOJO_STYLE[technique];
  const isDomain = technique === 'domain' || technique === 'domain_zenith';
  const zenith = technique === 'domain_zenith';
  const isStreak = kind === 'streak';
  const cracks = isStreak ? gojoCrackCount(streak) : 0;
  const shake = isDomain || isStreak;

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.16 } }}
      style={{ willChange: 'transform, opacity' }}
    >
      {/* ── Layer 1a — WASH (domain = nebula lembut + vignette hampa) ──────── */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.35 : [0, isDomain ? 0.5 : 0.35, 0] }}
        transition={{ duration: reduced ? 0 : zenith ? 1.1 : 0.7, ease: 'easeOut' }}
        style={{
          background: isDomain
            ? `radial-gradient(circle at 50% 50%, ${st.color}33, transparent 62%), radial-gradient(circle at 50% 50%, transparent 42%, ${GOJO_VOID}66 100%)`
            : `radial-gradient(circle at 50% 50%, ${st.color}55, transparent 70%)`,
        }}
      />

      {/* ── Layer 1b — SHAKE + pembungkus layer 2–5 ────────────────────────── */}
      <motion.div
        className="absolute inset-0"
        animate={reduced || !shake ? { x: 0, y: 0 } : { x: [0, -10, 9, -6, 4, 0], y: [0, -6, 5, -4, 3, 0] }}
        transition={{ duration: zenith ? 0.8 : 0.5, ease: 'easeOut' }}
      >
        {/* ── Layer 3a — ASAP 呪力 (dari tepi, tidak ke tengah) ────────────── */}
        {smoke.map((s) => {
          const p = edgeToXY(s.edge, s.along, s.reach);
          return (
            <motion.div
              key={s.id}
              className="absolute rounded-full"
              style={{
                left: `${p.left}%`, top: `${p.top}%`,
                width: s.size, height: s.size,
                marginLeft: -s.size / 2, marginTop: -s.size / 2,
                background: `radial-gradient(circle, ${GOJO_VOID} 0%, ${s.color}44 45%, transparent 72%)`,
                willChange: 'transform, opacity',
              }}
              initial={{ opacity: 0, x: p.dx * 0.35, y: p.dy * 0.35, scale: 0.7 }}
              animate={{ opacity: reduced ? 0.45 : [0, 0.7, 0.45], x: p.dx, y: p.dy, scale: 1 }}
              transition={{ duration: reduced ? 0 : s.dur, delay: reduced ? 0 : s.delay, ease: 'easeOut' }}
            />
          );
        })}

        {/* ── Layer 3b — PETIR HITAM (zigzag dari tepi, tidak ke tengah) ────── */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {bolts.map((b) => {
            const d = 'M' + b.points.map((p) => p.join(',')).join(' L');
            return (
              <g key={b.id}>
                <motion.path
                  d={d} fill="none" stroke={GOJO_VOID} strokeWidth={3}
                  strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={reduced ? { pathLength: 1, opacity: 0.9 } : { pathLength: 1, opacity: [0, 1, 0.25, 1, 0.55] }}
                  transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : b.delay, ease: 'easeOut' }}
                />
                <motion.path
                  d={d} fill="none" stroke={GOJO_RIM} strokeWidth={1}
                  strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={reduced ? { pathLength: 1, opacity: 0.5 } : { pathLength: 1, opacity: [0, 0.9, 0.15, 0.8, 0.35] }}
                  transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : b.delay, ease: 'easeOut' }}
                />
              </g>
            );
          })}
        </svg>

        {/* ── Layer 2b — BINTANG 無量空処 (domain saja) ─────────────────────── */}
        {isDomain && stars.map((s) => (
          <motion.span
            key={s.id}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              width: s.size, height: s.size,
              background: '#ffffff',
              boxShadow: `0 0 ${s.size * 3}px ${st.color}`,
            }}
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 0.8 } : { opacity: [0, 0.95, 0.35, 0.85, 0.3] }}
            transition={{ duration: reduced ? 0 : s.dur, delay: reduced ? 0 : s.delay, ease: 'easeOut' }}
          />
        ))}

        {/* ── Layer 2a — BOLA PLASMA ────────────────────────────────────────
            ao  : bola BIRU muncul dari KANAN, DIAM di pinggir
            aka : bola MERAH muncul dari KIRI, DIAM di pinggir
            茈  : dua bola meluncur & TABRAKAN di tengah → inti ungu + shockwave */}
        {spheres.map((b, si) => (
          <motion.div
            key={`sphere-${b.id}`}
            className="absolute left-1/2 top-1/2"
            style={{
              width: b.size, height: b.size,
              marginLeft: -b.size / 2, marginTop: -b.size / 2,
              willChange: 'transform, opacity',
            }}
            initial={reduced ? { x: `${b.anchorVw}vw`, opacity: 1 } : { x: `${b.fromVw}vw`, opacity: 0, scale: 0.6 }}
            animate={reduced
              ? { x: `${b.anchorVw}vw`, opacity: 0 }
              : { x: `${b.anchorVw}vw`, opacity: [0, 1, 1, 0], scale: [0.6, 1, 1.06, 1.15] }}
            transition={reduced ? { duration: 0 } : {
              x: { duration: b.dur, delay: b.delay, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: b.dur + 0.5, delay: b.delay, times: [0, 0.1, 0.7, 1], ease: 'easeOut' },
              scale: { duration: b.dur + 0.5, delay: b.delay, times: [0, 0.12, 0.6, 1], ease: 'easeOut' },
            }}
          >
            {/* halo luar */}
            <div className="absolute rounded-full" style={{
              inset: -b.size * 0.35,
              background: `radial-gradient(circle, ${b.color}55, transparent 70%)`,
            }} />
            {/* plasma muter (conic berputar) */}
            <motion.div className="absolute inset-0 rounded-full" style={{
              background: `conic-gradient(from 0deg, ${b.color}, ${GOJO_VOID} 30%, ${b.color}cc 50%, ${GOJO_VOID} 75%, ${b.color})`,
              willChange: 'transform',
            }}
              animate={reduced ? {} : { rotate: 360 }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
            />
            {/* inti terang */}
            <div className="absolute rounded-full" style={{
              inset: b.size * 0.2,
              background: `radial-gradient(circle at 38% 32%, #ffffff, ${b.color} 55%, transparent 82%)`,
            }} />
            {/* void hitam (khas 茈) */}
            <div className="absolute rounded-full" style={{
              inset: b.size * 0.36,
              background: `radial-gradient(circle, ${GOJO_VOID} 45%, transparent 78%)`,
            }} />
            {/* petir membelit bola */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
              {(sphereBolts[si] || []).map((pts, i) => (
                <motion.polyline
                  key={i} points={pts} fill="none"
                  stroke={GOJO_VOID} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={reduced ? { opacity: 0.7 } : { opacity: [0, 0.95, 0.2, 0.85, 0.3] }}
                  transition={{ duration: 0.6, repeat: reduced ? 0 : Infinity, repeatDelay: 0.35, delay: i * 0.12 }}
                />
              ))}
            </svg>
          </motion.div>
        ))}

        {/* ── Tabrakan 茈: ledakan + shockwave di tengah ────────────────────── */}
        {technique === 'murasaki' && (
          <>
            <motion.div
              key={`mura-core-${fx.id}`}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: 132, height: 132, marginLeft: -66, marginTop: -66,
                background: `radial-gradient(circle at 40% 35%, #ffffff 0%, ${GOJO_STYLE.murasaki.color} 42%, ${GOJO_VOID} 82%, #000000 100%)`,
                boxShadow: `0 0 70px ${GOJO_STYLE.murasaki.color}, 0 0 140px ${GOJO_STYLE.murasaki.color}88`,
                willChange: 'transform, opacity',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={reduced ? { scale: 1, opacity: 1 } : { scale: [0, 0, 1.5, 2.1], opacity: [0, 0, 1, 0] }}
              transition={{ duration: reduced ? 0 : 1.0, times: [0, 0.5, 0.66, 1], ease: 'easeOut' }}
            />
            <motion.div
              key={`mura-ring-${fx.id}`}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: 132, height: 132, marginLeft: -66, marginTop: -66,
                border: `5px solid ${GOJO_STYLE.murasaki.color}`,
                willChange: 'transform, opacity',
              }}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={reduced ? { scale: 0.4, opacity: 0 } : { scale: [0.4, 0.4, 4], opacity: [0, 0, 0.9, 0] }}
              transition={{ duration: reduced ? 0 : 1.15, times: [0, 0.5, 0.62, 1], ease: 'easeOut' }}
            />
          </>
        )}

        {/* ── Layer 2 — BARA 呪力 (partikel memanjang) ──────────────────────── */}
        {particles.map((p) => {
          const dx = Math.cos(p.angle) * p.dist;
          const dy = Math.sin(p.angle) * p.dist;
          const startOut = p.out || p.spiral;
          return (
            <motion.span
              key={p.id}
              className="absolute left-1/2 top-1/2"
              style={{
                width: p.size, height: p.len,
                marginLeft: -p.size / 2, marginTop: -p.len / 2,
                borderRadius: 9999,
                background: `linear-gradient(${p.angle}rad, ${st.color}, transparent)`,
                boxShadow: `0 0 8px ${st.color}`,
                willChange: 'transform, opacity',
              }}
              initial={{ x: startOut ? 0 : dx, y: startOut ? 0 : dy, opacity: 0.9, scale: 0.5, rotate: (p.angle * 180) / Math.PI }}
              animate={{ x: startOut ? dx : 0, y: startOut ? dy : 0, opacity: 0, scale: 1, rotate: (p.angle * 180) / Math.PI + p.spin }}
              transition={{ duration: reduced ? 0 : p.dur, delay: reduced ? 0 : p.delay, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}

        {/* ── Layer 4 — RETAK (HANYA streak) ────────────────────────────────── */}
        {isStreak && !reduced && (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {Array.from({ length: cracks }).map((_, i) => {
              const a = (i / cracks) * Math.PI * 2;
              const x2 = 50 + Math.cos(a) * 46;
              const y2 = 50 + Math.sin(a) * 46;
              return (
                <motion.line
                  key={i} x1="50" y1="50" x2={x2} y2={y2}
                  stroke={st.color} strokeWidth="0.35" strokeLinecap="round" pathLength={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 0.95, 0.6] }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
                />
              );
            })}
          </svg>
        )}

        {/* ── Layer 5 — TEKS TEKNIK (chromatic aberration) ──────────────────── */}
        <div className="absolute left-0 right-0 flex justify-center" style={{ top: '9%' }}>
          <motion.span
            className="font-serif font-black select-none"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduced ? 0 : 0.15, duration: reduced ? 0 : 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              fontSize: isDomain ? 'clamp(40px, 7vw, 92px)' : 'clamp(56px, 10vw, 140px)',
              color: st.color,
              textShadow: `2px 0 #ff1744, -2px 0 #2979ff, 0 0 18px ${st.color}`,
              willChange: 'transform, opacity',
            }}
          >
            {st.kanji}
          </motion.span>
        </div>

        {/* Teks kecil 領域展開 saat domain */}
        {isDomain && (
          <motion.div
            className="absolute left-0 right-0 flex justify-center text-kinari-light"
            style={{ top: '26%' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.35, duration: reduced ? 0 : 0.4 }}
          >
            <span className="font-serif font-black tracking-[0.3em]" style={{ fontSize: 'clamp(14px, 3vw, 30px)' }}>
              領域展開
            </span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default GojoBurst;
```

**2.2** Verifikasi:
```bash
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm run lint >/dev/null 2>&1; echo "lint exit=$?"
npm run build 2>&1 | grep -E "built in|error" | tail -2
```
Harapan: `pass 118+`, `lint exit=0`, `✓ built in ...`.

**2.3** Commit:
```bash
git add src/features/effects/GojoBurst.jsx
git commit -m "feat(gojo): render v2 — asap+petir hitam dari tepi, bola plasma muter, bara, bintang domain"
```

---

### Phase 3 — Verifikasi di browser (port 5174, JANGAN sentuh 5173)

**3.1** Jalankan dev server (background) + cek siap:
```bash
npm run dev -- --port 5174 --strictPort
curl -s -o /dev/null -w "%{http_code}" http://localhost:5174/
```
Harapan: `200`.

**3.2** Equip Gojo (Console browser, setelah halaman app terbuka):
```js
const p = JSON.parse(localStorage.getItem('user_progress_v2') || '{}');
p.medaru = 999999; p.ownedPacks = ['pack_07']; p.activePack = 'pack_07';
localStorage.setItem('user_progress_v2', JSON.stringify(p));
location.reload();
```

**3.3** Cek struktur DOM tiap teknik (SSR-ish via DOM setelah jawaban). Jalankan di Console:
```js
// setelah menjawab #1 (ao): harus ada bola + petir, TIDAK ada braket sudut
const svgs = document.querySelectorAll('svg path[stroke="#1a0a1a"]');
console.log('petir hitam:', svgs.length);                 // harapan >= 5
const balls = [...document.querySelectorAll('div')].filter(d => {
  const s = getComputedStyle(d);
  return s.backgroundImage.includes('conic-gradient');
});
console.log('bola plasma:', balls.length);                // harapan >= 1
```
Harapan: `petir hitam >= 5`, `bola plasma >= 1`.

**3.4** Buktikan bola **diam di pinggir** (bukan ke tengah) untuk ao:
```js
// jawab #1 lalu cepat ukur posisi bola plasma
await new Promise(r => setTimeout(r, 400));
const ball = [...document.querySelectorAll('div')].find(d => getComputedStyle(d).backgroundImage.includes('conic-gradient'));
const rect = ball.getBoundingClientRect();
const cx = rect.left + rect.width / 2;
console.log('pusat bola x =', Math.round(cx), 'viewport cx =', Math.round(innerWidth / 2));
// harapan: |cx - innerWidth/2| > 200 (jauh dari tengah, di pinggir kanan)
```

**3.5** Buktikan murasaki **tetap tabrakan di tengah**: jawab 3 benar beruntun, lalu ukur 2 bola plasma → keduanya harus dekat `innerWidth/2` (dalam ±120px) saat tabrakan.

**3.6** Cek petir/asap **tidak masuk tengah**. Ambil semua titik `<path>` petir, pastikan tidak ada yang berada < 16% dari tengah (sesuai aturan). Cek juga `document.body.scrollWidth <= innerWidth` (tidak overflow).

**3.7** Cek **0 console error** + efek tetap jalan di tema **gelap** (toggle dark mode, ulangi 1 jawaban, pastikan petir hitam masih kelihatan karena rim terang).

**3.8** Verifikasi manual (mata user): jawab beberapa kali, pastikan terasa "Gojo" (asap + petir dari tepi, bola plasma muter), bukan lagi HUD kotak.

**3.9** Matikan dev server 5174 setelah selesai.

---

## 6. Tests / validation

- **TDD**: Phase 1 tulis test dulu (RED) → implementasi (GREEN). Phase 2 render.
- Gerbang: `npm test` (≥118 pass / 0 fail), `npm run lint` (0 error), `npm run build` (✓).
- Test mengunci: `anchorVw` bola (ao/aka pinggir, murasaki tengah), `reach ≤ 34vw` asap, jarak titik petir ≥ 16 dari tengah, `len > 0` bara, `gojoStars` deterministik, `GOJO_VOID` bukan `#000000`.
- Verifikasi browser: struktur DOM (3.3), bola diam di pinggir (3.4), tabrakan tengah (3.5), tidak ke tengah (3.6), 0 error + tema gelap (3.7).
- **Commit per fase (1 & 2), JANGAN push.**

---

## 7. Risks, tradeoffs, open questions

- **`pathLength` bukan `transform`/`opacity`.** Reveal petir pakai `pathLength` (stroke-dashoffset). Ini pola yang SUDAH dipakai layer retak & diterima. Alternatif (transform-only) tidak bisa "menumbuhkan garis", jadi sengaja dipertahankan.
- **Domain "ruang hampa" vs overlay transparan.** Overlay harus tetap transparan (konten di belakang kelihatan) — user 9/23 pernah tolak "blok hitam pekat". Jadi "hampa" dibuat dari vignette `GOJO_VOID66` (semi-transparan) + bintang, BUKAN layar hitam. Kalau terasa kurang "hampa", tune alpha vignette.
- **`conic-gradient` muter terus** = 1 animasi transform infinite per bola. Aman (GPU), tapi kalau banyak bola + device lemah, bisa ditinjau. Batas 2 bola.
- **Ukuran bola pakai px** (`size: 128`), bukan vw → di layar sangat kecil/sangat besar proporsinya berubah. Kalau perlu responsif, ganti ke `clamp()`/vw (tuning lanjutan).
- **`edgeToXY` baca `window.innerWidth`** saat render → smoke px dihitung sekali; resize saat efek aktif tidak re-layout. Dampak kecil (efek < 1.5s).
- **Perf di tema/mesin lemah**: 8 asap + 5 petir + 20 bara + bintang 64 + bola = banyak elemen. Semua transform/opacity; kalau ada jank, turunkan `gojoStars` count (64 → 40) atau asap (8 → 6).
- **Open question:** posisi pinggir bola `GOJO_EDGE_ANCHOR_VW = 32` — kalau di layar HP terasa terlalu masuk/keluar, tinggal ubah 1 konstanta.
