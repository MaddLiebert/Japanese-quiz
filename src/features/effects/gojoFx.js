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
// Semua titik di pinggir lingkaran (r 39..51 dari pusat 50,50) → tidak nembus inti.
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
