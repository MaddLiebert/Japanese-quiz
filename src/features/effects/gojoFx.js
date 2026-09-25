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
// 50 & 100 TIDAK lagi memicu domain — domain hanya dari bar energi kutukan.
const techniqueForStreak = (streak) => {
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

// ── Energi kutukan 呪力 (bar ultimate, dipicu tap — bukan streak) ────────────
// Charge penuh = 20 jawaban benar beruntun. Bar muncul selama sesi kuis,
// keisi naik dari bawah ke atas; tap saat penuh = cast 領域展開.
export const GOJO_ULT_THRESHOLD = 20;

// Charge bar dari streak sekarang: 0..20 (clamp — bar berhenti di penuh).
export const gojoCurseCharge = (streak) =>
  (Number.isFinite(streak) && streak > 0)
    ? Math.min(GOJO_ULT_THRESHOLD, Math.floor(streak))
    : 0;

export const gojoUltReady = (streak) =>
  Number.isFinite(streak) && streak >= GOJO_ULT_THRESHOLD;

// ── Timeline cinematic 領域展開 (semua waktu di SATU tempat) ────────────────
// Fase: gelap → teks 領域展開 per-karakter → teks 無量空処 per-karakter (mata
// membuka bersamaan) → bigbang → settle (teks mengecil ke atas) → persist.
export const gojoDomainTimeline = () => ({
  darkDur: 0.5,        // fade-in gelap (spotlight)
  text1Start: 0.35,    // 領域展開 mulai
  text1Char: 0.28,     // jeda per karakter
  text2Start: 1.5,     // 無量空処 mulai (setelah teks 1 selesai)
  text2Char: 0.32,
  eyesStart: 0.9,      // Six Eyes muncul (barengan teks 1)
  eyesOpenDur: 1.2,    // nutup → kebuka
  bangStart: 2.9,      // bigbang di tengah (setelah "ngomong" selesai)
  bangDur: 0.7,
  nebulaStart: 3.0,    // bercak ruang angkasa pinggir mulai
  settleStart: 3.7,    // blok mata+teks naik & mengecil
  settleDur: 0.7,
});

// Pecah teks jadi karakter dengan delay bertambah (ms) → dipakai komponen untuk
// memunculkan teks satu-per-satu. Murni & deterministik.
export const gojoSequentialChars = (text, start = 0, perChar = 0.25) => {
  const chars = [...String(text || '')];
  return chars.map((ch, i) => ({ ch, delayMs: Math.round((start + i * perChar) * 1000) }));
};

// ── Preview dev (dipakai DevPanel) ──────────────────────────────────────────
// Untuk "melompat" ke streak tertentu tanpa quiz: set streakRef ke target-1,
// lalu satu jawaban benar mendarat TEPAT di target → teknik/milestone asli
// (murasaki/domain/zenith) berjalan lewat pipeline yang sama dengan quiz.
// Input dari <input> berupa string; nilai tak valid / < 2 → 0 (aman, mulai awal).
export const gojoPreviewStreak = (target) => {
  const n = Math.floor(Number(target));
  return Number.isFinite(n) && n > 1 ? n - 1 : 0;
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
    return [{ id: 'ao', color: GOJO_STYLE.ao.color, fromVw: R, anchorVw: A, size: 128, dur: 0.9, delay: 0 }];
  }
  if (technique === 'aka') {
    return [{ id: 'aka', color: GOJO_STYLE.aka.color, fromVw: -R, anchorVw: -A, size: 128, dur: 0.9, delay: 0 }];
  }
  if (technique === 'murasaki') {
    return [
      { id: 'ao',  color: GOJO_STYLE.ao.color,  fromVw: R,  anchorVw: 0, size: 96, dur: 0.75, delay: 0 },
      { id: 'aka', color: GOJO_STYLE.aka.color, fromVw: -R, anchorVw: 0, size: 96, dur: 0.75, delay: 0 },
    ];
  }
  return [];
};

// ── Timing bola: muncul PERLAHAN, tahan lama (bukan pop-in instan) ──────────
// Keluhan user: "terlalu cepet munculnya". Sebelumnya opacity penuh dalam 0.1
// durasi → kelihatan nge-pop. Sekarang naik bertahap (keyframe 0 → 0.25 → 0.65
// → 1) dan seluruh efek ditahan lebih lama sebelum di-unmount.
export const gojoSphereAnim = (technique) => {
  if (!technique || technique === 'domain' || technique === 'domain_zenith') return null;
  // times: kapan tiap keyframe opacity/scale terjadi (fraksi durasi)
  // opacity: 0 → 0.25 → 0.65 → 1 → 0  (perlahan masuk, perlahan pergi)
  const times = [0, 0.2, 0.5, 0.8, 1];
  const opacity = [0, 0.25, 0.65, 1, 0];
  const scale = technique === 'murasaki'
    ? [0.5, 0.72, 0.92, 1.06, 1.16]
    : [0.55, 0.76, 0.94, 1.04, 1.14];
  const dur = technique === 'murasaki' ? 1.7 : 1.9;   // detik (opacity + scale)
  return {
    dur,
    times,
    opacity,
    scale,
    travelMs: Math.round((technique === 'murasaki' ? 0.75 : 0.9) * 1000),
    fadeInMs: Math.round(dur * 1000 * 0.8),  // saat opacity pertama mencapai 1
    fadeOutMs: Math.round(dur * 1000 * 0.2),
    holdMs: 2000,                             // efek ditahan >= 2s sebelum hilang
  };
};

// ── Bola PERSIST antar jawaban (konsep user) ────────────────────────────────
// Bola TIDAK meledak tiap jawaban: ao muncul & muter diam di kanan, lalu aka
// muncul & muter di kiri TANPA menghilangkan ao. Saat murasaki (bener #3 &
// tiap milestone), kedua bola meluncur ke tengah lalu MELEDAK → reset kosong.
//   technique: 'ao' | 'aka' | 'murasaki' | null | 'domain' | 'domain_zenith'
export const GOJO_BALLS_EMPTY = { ao: false, aka: false };

export const nextGojoBalls = (current, technique) => {
  const cur = current || GOJO_BALLS_EMPTY;
  if (technique === 'ao') return { ao: true, aka: cur.aka };
  if (technique === 'aka') return { ao: cur.ao, aka: true };
  // murasaki (茈 = 蒼 + 赫): PAKSA kedua bola ada, walau baru satu yang muncul.
  if (technique === 'murasaki') return { ao: true, aka: true };
  // salah / domain / lainnya → reset (bener berikutnya mulai dari kosong).
  return { ao: false, aka: false };
};

// ── Inti bola: putih-panas (bukan void hitam) ───────────────────────────────
export const GOJO_CORE = '#ffffff';

// ── Bentuk bola per teknik (mengikuti referensi JJK) ────────────────────────
//   ao       → orbit rings (2–3 cincin elips nyelimutin)
//   aka      → pita vortex (ribbon tebal membelit)
//   murasaki → cabang petir (tendril) + halo besar
export const gojoSphereShape = (technique) => {
  if (technique === 'ao') return { rings: 3, ribbons: 0, tendrils: 0, halo: 0 };
  if (technique === 'aka') return { rings: 0, ribbons: 4, tendrils: 0, halo: 0 };
  if (technique === 'murasaki') return { rings: 0, ribbons: 0, tendrils: 6, halo: 1 };
  return { rings: 0, ribbons: 0, tendrils: 0, halo: 0 };
};

// Orbit rings (ellipse miring) — ruang 0..100, pusat 50,50.
export const gojoOrbitRings = (technique, seed = 1, rng = Math.random) => {
  const n = gojoSphereShape(technique).rings;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: `${seed}-ring-${i}`,
      rx: 52 + rng() * 16,
      ry: 14 + rng() * 12,        // rx > ry → terlihat miring
      rot: Math.round(rng() * 180),
      width: 1.6 + rng() * 1.4,
      dur: 2.2 + rng() * 1.6,
      delay: rng() * 0.2,
    });
  }
  return out;
};

// Pita vortex (aka): busur elips tebal yang melilit bola.
export const gojoRibbons = (technique, seed = 1, rng = Math.random) => {
  const n = gojoSphereShape(technique).ribbons;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: `${seed}-ribbon-${i}`,
      rx: 46 + rng() * 14,
      ry: 20 + rng() * 18,
      rot: Math.round(rng() * 180),
      width: 3 + rng() * 3,
      dur: 1.8 + rng() * 1.4,
      delay: rng() * 0.15,
      dir: rng() < 0.5 ? 1 : -1,
    });
  }
  return out;
};

// Cabang petir (murasaki): polyline bercabang keluar dari tepi bola.
export const gojoTendrils = (technique, seed = 1, rng = Math.random) => {
  const n = gojoSphereShape(technique).tendrils;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const len = 20 + rng() * 25;
    const steps = 4;
    const pts = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const r = 38 + t * len;
      const jit = (rng() * 2 - 1) * 7;
      const aa = a + (rng() * 2 - 1) * 0.5 * t;
      pts.push([clamp100(50 + Math.cos(aa) * (r + jit)), clamp100(50 + Math.sin(aa) * (r + jit))]);
    }
    out.push({ id: `${seed}-tendril-${i}`, points: pts, width: 1.2 + rng() * 1.4, delay: rng() * 0.15 });
  }
  return out;
};

// Halo besar (murasaki): 1 cincin lebar mengelilingi bola.
export const gojoHalo = (technique, seed = 1, rng = Math.random) => {
  const n = gojoSphereShape(technique).halo;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: `${seed}-halo-${i}`,
      rx: 74 + rng() * 10,
      ry: 26 + rng() * 10,
      rot: Math.round(rng() * 40 - 20),
      width: 3 + rng() * 2,
      dur: 3.2 + rng() * 1.4,
    });
  }
  return out;
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

// ── Bercak ruang angkasa (persist di pinggir kuis saat domain aktif) ────────
// Dipilih dari 4 sisi bergantian supaya selalu "di pinggir", tidak menutupi
// kartu soal. Warna = palet nebula ungu/biru/magenta. Deterministik via rng.
export const GOJO_NEBULA_COLORS = ['#7c4dff', '#38bdf8', '#c026d3', '#818cf8'];

export const gojoNebulaSpots = (seed = 1, count = 8, rng = Math.random) => {
  const out = [];
  for (let i = 0; i < count; i++) {
    const edge = i % 4;                        // 0 atas · 1 kanan · 2 bawah · 3 kiri
    const along = 6 + rng() * 88;              // posisi sepanjang sisi (%)
    const depth = 4 + rng() * 15;              // jarak dari tepi (%)
    let x; let y;
    if (edge === 0) { x = along; y = depth; }
    else if (edge === 1) { x = 100 - depth; y = along; }
    else if (edge === 2) { x = along; y = 100 - depth; }
    else { x = depth; y = along; }
    out.push({
      id: `${seed}-neb-${i}`,
      x, y,
      size: 110 + rng() * 130,                 // px (blob lembut)
      opacity: 0.2 + rng() * 0.25,
      color: GOJO_NEBULA_COLORS[Math.floor(rng() * GOJO_NEBULA_COLORS.length)],
      delay: rng() * 0.6,
    });
  }
  return out;
};

// ── DRAMA bola persist (ao/aka) ─────────────────────────────────────────────
// Keluhan user: bola ao/aka kelihatan "kosong / gak mencekam" dan teks 蒼/赫
// hilang saat jadi mode bola. Tiga penopang drama, TANPA ledakan (tetap persist):
//   1. label kanji teknik (蒼 / 赫) menempel di sisi bola
//   2. 集中線 (garis ketegangan) memancarkan dari sisi bola
//   3. charge ring berdenyut mengembang lalu mengecil (kekuatan terkumpul)

// Gelapkan hex: kalikan tiap kanal dengan faktor (1 = warna sama, 0 = hitam).
export const darkenHex = (hex, factor = 0.5) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex));
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const f = Math.min(1, Math.max(0, factor));
  const ch = (v) => Math.round(v * f);
  const r = ch((n >> 16) & 255), g = ch((n >> 8) & 255), b = ch(n & 255);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
};

// Label teknik untuk bola: kanji + sisi + warna + parameter "greget".
// Selain ao/aka → null.
export const gojoBallLabel = (technique) => {
  if (technique === 'ao') {
    return {
      kanji: GOJO_STYLE.ao.kanji, side: 'right', color: GOJO_STYLE.ao.color,
      fontScale: 0.66, strokeWidth: 5, glow: '0 0 20px, 0 0 44px',
    };
  }
  if (technique === 'aka') {
    return {
      kanji: GOJO_STYLE.aka.kanji, side: 'left', color: GOJO_STYLE.aka.color,
      fontScale: 0.66, strokeWidth: 5, glow: '0 0 20px, 0 0 44px',
    };
  }
  return null;
};

// Vignette latar: layar menggelap dengan warna LEBIH GELAP dari bola saat
// ao/aka muncul. dark = versi gelap warna bola; side = dari sisi mana fokus.
export const gojoBallVignette = (technique) => {
  const label = gojoBallLabel(technique);
  if (!label) return null;
  return { dark: darkenHex(label.color, 0.26), side: label.side, color: label.color };
};

// Aura menyala di sekeliling bola (halo berdenyut).
//   desktop → parameter lama: melebar (inset -size*0.55) + tail redup (…22).
//   HP      → lebih RAPAT (sedikit lebih besar dari bola, inset -size*0.34)
//             + lebih TERANG, karena di HP latar terang & vignette tidak
//             dirender → aura lama nyaris tak terlihat di bola 44px.
// `size` = diameter bola (px); `mobile` = layout HP (gojoBallLayout.mobile).
export const gojoBallAura = (technique, size, mobile = false) => {
  const label = gojoBallLabel(technique);
  if (!label) return null;
  const color = label.color;
  if (!mobile) {
    return {
      inset: -size * 0.55,
      background: `radial-gradient(circle, ${color}99 0 16%, ${color}55 32%, ${color}22 52%, transparent 72%)`,
    };
  }
  return {
    inset: -size * 0.34,
    background: `radial-gradient(circle, ${color}e6 0 26%, ${color}b3 40%, ${color}80 52%, ${color}40 62%, transparent 72%)`,
  };
};

// ── Ledakan 茈 (murasaki) — parameter TEBAL ─────────────────────────────────
// Permintaan user: "efek meledak si murasaki nya kurang masih tipis, gw pengen
// lebih tebel". Semua ketebalan ledakan dikumpulkan di sini → di-tune sekali,
// diuji lewat unit test. Domain TIDAK memakai ini (tetap seperti semula).
export const gojoMurasakiBurst = () => {
  const color = GOJO_STYLE.murasaki.color;
  const size = 148;                              // bola plasma (lama 132)
  const borderWidth = 10;                        // shockwave (lama 5)
  return {
    // bola plasma pusat: inti putih lebih besar + glow lebih kuat
    core: {
      size,
      background: `radial-gradient(circle, ${GOJO_CORE} 0 22%, ${color} 22% 52%, ${color}66 52% 76%, transparent 88%)`,
      boxShadow: `0 0 90px 30px ${color}77`,
    },
    // shockwave ring: border tebal + glow besar
    ring: {
      size,
      borderWidth,
      border: `${borderWidth}px solid ${color}`,
      boxShadow: `0 0 46px 16px ${color}99`,
    },
    // ketebalan garis lain saat ledakan murasaki
    boltInk: 5.5,        // petir hitam (lama 3.5)
    boltRim: 2,          // rim terang petir (lama 1)
    starStroke: 4,       // bintang impact (lama 2.4)
    speedLineScale: 2,   // 集中線 (lama 1x)
    particleScale: 1.6,  // serpihan tinta (lama 1x)
  };
};

// 集中線 ketegangan: garis pendek memancar dari titik fokus (sisi bola), tetap
// di sisinya (ao x>=50, aka x<=50) → TIDAK menyilang tengah (jaga konsep persist).
// focus opsional { x, y } (ruang 0..100) untuk HP (bola di sudut atas).
// maxY opsional: batasi semua titik agar tetap di atas (tidak kena kartu jawaban).
export const gojoTensionLines = (technique, seed = 1, rng = Math.random, count = 24, focus = null, maxY = null) => {
  const label = gojoBallLabel(technique);
  if (!label) return [];
  const fx = focus ? focus.x : (technique === 'ao' ? 80 : 20);
  const fy = focus ? focus.y : 50;
  const capY = (v) => (maxY == null ? v : Math.min(v, maxY));
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const inner = 10 + rng() * 6;
    const len = 12 + rng() * 22;
    const from = [fx + Math.cos(a) * inner, fy + Math.sin(a) * inner * 1.15];
    const to = [fx + Math.cos(a) * (inner + len), fy + Math.sin(a) * (inner + len) * 1.15];
    // Jaminan: garis tidak menyeberang ke sisi lain.
    if (technique === 'ao') { to[0] = Math.max(to[0], 50); from[0] = Math.max(from[0], 50); }
    else { to[0] = Math.min(to[0], 50); from[0] = Math.min(from[0], 50); }
    out.push({
      id: `${seed}-tension-${i}`,
      from: [clamp100(from[0]), clamp100(capY(from[1]))],
      to: [clamp100(to[0]), clamp100(capY(to[1]))],
      width: 0.5 + rng() * 1.6,
      delay: rng() * 0.9,          // denyut tidak serempak → hidup
    });
  }
  return out;
};

// ── Layout bola responsif ───────────────────────────────────────────────────
// Di HP (layar sempit) kartu jawaban hampir selebar layar → bola di samping
// PASTI nabrak kartu. Solusi: bola DIKECILKAN + TURUN ke bawah border header
// (tidak nempel tombol kontrol atas), di atas progress bar & kartu jawaban.
export const GOJO_BALL_BREAKPOINT = 768;   // < 768px = HP/sempit

// Kembalikan { mobile, size, anchorXVw, anchorYVh } untuk satu teknik bola.
// anchorX/Y dalam satuan vw/vh dari TENGAH layar (negatif = atas/kiri).
export const gojoBallLayout = (technique, vw = 1280, vh = 800) => {
  const label = gojoBallLabel(technique);
  if (!label) return null;
  const mobile = vw < GOJO_BALL_BREAKPOINT;
  const dir = label.side === 'right' ? 1 : -1;   // ao = kanan (+), aka = kiri (−)
  if (!mobile) {
    return { mobile: false, size: 128, anchorXVw: dir * 32, anchorYVh: 0 };
  }
  // HP: kecilkan + TURUNKAN ke bawah border header (jangan nempel tombol atas).
  const size = 44;
  const margin = 10;                             // jarak dari tepi (px)
  // Tepi ATAS bola (px dari atas layar). 145 = tepat di bawah border header
  // (terukur berakhir y≈143) & di atas progress bar kotoba/kanji (y≈191).
  const topGap = 145;
  // pusat X: nempel tepi (size/2 + margin dari tepi) → aman walau kartu lebar.
  const cx = dir > 0 ? vw - (size / 2 + margin) : (size / 2 + margin);
  // pusat Y: di bawah header, di atas progress bar.
  const cy = topGap + size / 2;
  return {
    mobile: true,
    size,
    anchorXVw: ((cx - vw / 2) / vw) * 100,
    anchorYVh: ((cy - vh / 2) / vh) * 100,
  };
};

// Charge ring: cincin berdenyut (kekuatan terkumpul) di sekeliling bola.
// ringScale > 1 = melebar; ringDur = periode denyut (detik).
export const gojoCharge = (technique) => {
  if (technique === 'ao' || technique === 'aka') {
    return { ringDur: 1.6, ringScale: 1.9, ringWidth: 3, pulseDur: 1.2 };
  }
  return null;
};
