// ─────────────────────────────────────────────────────────────────────────────
// Logika murni efek Gojo Satoru (visual 'gojo'). Tanpa React/DOM → dites di node.
// Kanon: 蒼 (Ao) → 赫 (Aka) → 茈 (Murasaki = Ao+Aka) → 領域展開・無量空処 (Domain).
//
// Gaya v3 (permintaan user): BAHASA ANIME/MANGA, bukan motion-graphics.
//   - garis tinta tegas (outline), warna rata cel-shade (hard-stop), impact star,
//     集中線 (speed lines), screentone halftone, オノマトペ (teks bunyi)
//   - ao/aka DIAM di pinggir (tidak ke tengah); murasaki tabrakan di tengah
//   - petir & 集中線 TIDAK boleh masuk ke tengah
//   - salah → null (tanpa teknik, tanpa retak)
// ─────────────────────────────────────────────────────────────────────────────

export const GOJO_MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const isGojoMilestone = (streak) => GOJO_MILESTONES.includes(streak);

const clamp100 = (v) => Math.min(100, Math.max(0, v));

// ── Warna khas "petir hitam" Gojo ───────────────────────────────────────────
// VOID = hitam keunguan (bukan #000 pekat, biar kebaca di tema gelap #141517).
// RIM  = garis terang tipis di atas petir (kontras di tema terang & gelap).
export const GOJO_VOID = '#1a0a1a';
export const GOJO_RIM = '#ece6ff';

// ── Bahasa anime: tinta & flash ─────────────────────────────────────────────
export const GOJO_INK = '#0a0a0a';    // outline tinta (ring keras, bukan blur)
export const GOJO_FLASH = '#ffffff';  // flash frame 1-frame

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

// ── Bola teknik ─────────────────────────────────────────────────────────────
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

// ── Titik fokus impact (vw dari tengah) ─────────────────────────────────────
//   ao → kanan · aka → kiri · murasaki/domain → tengah
export const gojoImpactFocus = (technique) => {
  if (technique === 'ao') return { xVw: GOJO_EDGE_ANCHOR_VW, yVw: 0 };
  if (technique === 'aka') return { xVw: -GOJO_EDGE_ANCHOR_VW, yVw: 0 };
  return { xVw: 0, yVw: 0 };
};

// ── Impact star (bintang ledakan anime) — polygon lokal 0..100, pusat 50,50 ──
export const gojoImpactStar = (seed = 1, rng = Math.random, spikes = 8) => {
  const pts = [];
  const rot = rng() * Math.PI * 2;
  for (let i = 0; i < spikes * 2; i++) {
    const a = rot + (i / (spikes * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 46 + rng() * 4 : 16 + rng() * 8;  // spike luar / dalam
    pts.push(`${Math.round(50 + Math.cos(a) * r)},${Math.round(50 + Math.sin(a) * r)}`);
  }
  return { id: `${seed}-star`, spikes, points: pts.join(' ') };
};

// ── 集中線: garis tinta memancar dari fokus ─────────────────────────────────
// ao/aka: garis pendek di band tepi (tidak lewat tengah). murasaki: panjang.
export const gojoSpeedLines = (technique, seed = 1, rng = Math.random, count = 14) => {
  const focus = technique === 'ao' ? { x: 82, y: 50 }
    : technique === 'aka' ? { x: 18, y: 50 }
      : { x: 50, y: 50 };
  const maxLen = technique === 'murasaki' ? 60 : 18;   // ao/aka pendek → tidak ke tengah
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const len = maxLen * (0.55 + rng() * 0.45);
    const inner = 6 + rng() * 4;
    const from = [focus.x + Math.cos(a) * inner, focus.y + Math.sin(a) * inner];
    const to = [focus.x + Math.cos(a) * (inner + len), focus.y + Math.sin(a) * (inner + len)];
    // Jaminan: ao tetap di kanan (>=52), aka tetap di kiri (<=48) → tidak lewat tengah.
    if (technique === 'ao') to[0] = Math.max(to[0], 52);
    else if (technique === 'aka') to[0] = Math.min(to[0], 48);
    out.push({
      id: `${seed}-sl-${i}`,
      from: [clamp100(from[0]), clamp100(from[1])],
      to: [clamp100(to[0]), clamp100(to[1])],
      width: 0.6 + rng() * 1.4,
      delay: rng() * 0.12,
    });
  }
  return out;
};

// ── Screentone: titik halftone (shading manga) di sekitar fokus ─────────────
export const gojoHalftone = (seed = 1, rng = Math.random, count = 18) => {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: `${seed}-ht-${i}`,
      x: 50 + (rng() * 2 - 1) * 40,
      y: 50 + (rng() * 2 - 1) * 40,
      size: 0.6 + rng() * 1.4,
      delay: rng() * 0.2,
    });
  }
  return out;
};

// ── オノマトペ (teks bunyi anime) ───────────────────────────────────────────
export const gojoOno = (technique) => {
  switch (technique) {
    case 'ao': return 'ドン';
    case 'aka': return 'ゴッ';
    case 'murasaki': return 'ズドン';
    case 'domain': return 'ゴゴゴ';
    case 'domain_zenith': return 'ゴゴゴゴ';
    default: return '';
  }
};

// ── Serpihan tinta (partikel anime, hard-edge bukan blur) ───────────────────
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
      len: 14 + rng() * 30,          // panjang serpihan
      delay: rng() * 0.18,
      dur: 0.5 + rng() * 0.5,
      spin: spiral ? (rng() * 2 - 1) * 260 : 0,
      out,
      spiral,
      hard: true,                    // hard-edge (bahasa anime, bukan blur)
    });
  }
  return list;
};

// ── Petir hitam tepi (zigzag dari tepi, TIDAK sampai tengah) ────────────────
// Kembalikan { id, edge, points:[[x,y],...] } dalam ruang viewBox 0..100.
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
