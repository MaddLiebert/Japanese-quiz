// ─────────────────────────────────────────────────────────────────────────────
// Logika murni efek Megumi Fushiguro (pack_10, visual 'megumi') — 十種影法術.
// Sumber desain: obsidian-mind/brain/Efek JJK/Megumi.md (🔒 spec pack).
// Tanpa DOM / React / import JSON → dites `node --test` (pola gojoFx/yujiFx/
// sukunaFx). Komponen (MegumiBurst/MegumiShadow) & EffectContext HANYA baca
// dari sini.
//
// Identitas visual: BAYANGAN (影) — genangan hitam yang mengalir & menelan;
// siluet shikigami BANGKIT dari genangan (bukan plasma/api/tebasan).
// Warna: tinta hitam + highlight perak + aksen 藍 indigo.
//
// Filosofi ultimate (spec §6): Megumi = KETAHANAN. 適応 (adaptasi) = asuransi
// yang snowball jadi kekuatan — makin sering salah makin kebal (streak TIDAK
// hangus) & makin ngebantu (opsi salah dihapus). Bayarannya = risiko 輪砕け
// (salah ke-9 saat roda penuh → roda pecah, summon bubar, streak HANGUS).
// Beda dari Sukuna yang menyerang (必中) — Megumi BERTAHAN.
// ─────────────────────────────────────────────────────────────────────────────

// Milestone = sama persis Gojo/Yuji/Sukuna (keputusan desain: konsisten JJK).
export const MEGUMI_MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const isMegumiMilestone = (streak) => MEGUMI_MILESTONES.includes(streak);

// ── Palet Megumi: tinta hitam + perak + 藍 indigo + ungu-bayangan (ultimate) ──
export const MEGUMI_INK = '#0a0a0a';
export const MEGUMI_SILVER = '#cbd5e1';
export const MEGUMI_INDIGO = '#4338ca';

export const MEGUMI_STYLE = {
  gyokuken: { kanji: '玉犬',   color: MEGUMI_SILVER, label: '玉犬 · Divine Dogs' },
  nue:      { kanji: '鵺',     color: MEGUMI_INDIGO, label: '鵺 · Nue' },
  orochi:   { kanji: '大蛇',   color: '#14b8a6',     label: '大蛇 · Great Serpent' },
  bansou:   { kanji: '満象',   color: '#38bdf8',     label: '満象 · Max Elephant', gif: '/effects/megumi_bansou.gif' },
  kosou:    { kanji: '虎葬',   color: '#f59e0b',     label: '虎葬 · Tiger Funeral' },
  // 魔虚羅: versi KECIL/terbatas/切札 milik Megumi (anti-nabrak: Sukuna = raksasa/
  // terkontrol/Meguna). GIF cut-in kanon milik Megumi sendiri.
  mahoraga: { kanji: '魔虚羅', color: '#6d28d9',     label: '布瑠部由良由良 → 魔虚羅', gif: '/effects/megumi_mahoraga.gif' },
  // 適応: momen "belajar" — roda +1 takik, streak tidak hangus.
  adapt:    { kanji: '適応',   color: '#8b5cf6',     label: '適応 · Adaptation' },
  // 八握剣 dicabut: roda penuh → sisa durasi SEMUA opsi salah terpotong.
  sword:    { kanji: '八握剣', color: '#e2e8f0',     label: '八握剣 · Sword Drawn' },
  // 輪砕け: backlash 切札 — roda pecah, summon bubar, streak hangus.
  shatter:  { kanji: '輪砕け', color: '#ef4444',     label: '輪砕け · Wheel Shatter' },
};

// ── Ladder jurus per streak (spec §Ringkasan cepat) ──────────────────────────
// Non-streak = ROTASI deterministik 玉犬 ↔ 鵺 (bukan acak — pola Sukuna v3).
// Momen: 10 大蛇 · 20 満象 · 30+ 虎葬 (jurus puncak: tetap dipakai selama
// streak ≥ 30 — spec tabel menulis "30+", bukan sekali lewat).
export const MEGUMI_LADDER = { 10: 'orochi', 20: 'bansou' };
export const MEGUMI_TOP_STREAK = 30;
export const MEGUMI_NON_STREAK_CYCLE = ['gyokuken', 'nue'];

// Jawaban benar NON-momen ke berapa streak ini (1-based). Murni dari angka
// streak (tanpa state) → stabil antar render, gampang dites.
export const megumiNonStreakIndex = (streak) => {
  if (!Number.isFinite(streak) || streak <= 0) return 0;
  const s = Math.floor(streak);
  const passed = Object.keys(MEGUMI_LADDER).filter((m) => s >= Number(m)).length;
  return s - passed;
};

export const megumiTechniqueFor = (kind, streak = 0) => {
  if (kind === 'wrong') return null;
  if (!Number.isFinite(streak) || streak <= 0) return null;
  const s = Math.floor(streak);
  if (s >= MEGUMI_TOP_STREAK) return 'kosou';
  if (MEGUMI_LADDER[s]) return MEGUMI_LADDER[s];
  const idx = megumiNonStreakIndex(s);
  if (idx <= 0) return null;
  return MEGUMI_NON_STREAK_CYCLE[(idx - 1) % MEGUMI_NON_STREAK_CYCLE.length];
};

// ── Bar 呪力: 20 slot (pola JJK konsisten) ───────────────────────────────────
export const MEGUMI_ULT_THRESHOLD = 20;
export const megumiCurseCharge = (streak) =>
  (Number.isFinite(streak) && streak > 0) ? Math.min(MEGUMI_ULT_THRESHOLD, Math.floor(streak)) : 0;
export const megumiUltReady = (streak) =>
  Number.isFinite(streak) && streak >= MEGUMI_ULT_THRESHOLD;

// ── 魔虚羅 summon: state 30 dtk, TIMER JALAN (pola `rare`: Yuji/Sukuna) ──────
export const MEGUMI_SUMMON_DURATION_S = 30;
export const megumiSummonLeft = (endsAt, now = Date.now()) => {
  if (!Number.isFinite(endsAt) || !Number.isFinite(now)) return 0;
  const left = Math.ceil((endsAt - now) / 1000);
  if (!Number.isFinite(left) || left <= 0) return 0;
  return Math.min(MEGUMI_SUMMON_DURATION_S, left);
};

// ── Segmen klip chant (hasil ukur RMS 29/09 — JANGAN ditebak) ────────────────
// 布瑠部 ≈0.32–0.67 · 由良由良 ≈1.14–1.66 · segmen pendek ≈2.60–2.82 (ekor
// frasa; penanda siluet bangkit) · 魔虚羅 ≈3.01–4.71 · total 4.959s.
export const MEGUMI_CAST_VOICE = {
  furubeStart: 0.32, furubeEnd: 0.67,
  yuraStart: 1.14,   yuraEnd: 1.66,
  midStart: 2.60,    midEnd: 2.82,
  mahoragaStart: 3.01, mahoragaEnd: 4.71,
  dur: 4.959,
};

// Timeline cinematic cast (detik) — SEMUA sync ke klip 4.959s (spec §6):
// veil → genangan menyebar → chant per-karakter → roda 八握剣 → siluet bangkit
// → kanji 魔虚羅 → shake → FLASH + BOOM → settle (roda kecil persist).
export const MEGUMI_SUMMON_TIMELINE = {
  veilAt: 0.0,        // veil gelap total + dread
  poolAt: 0.10,       // genangan bayangan menyebar dari TENGAH ke lantai
  kanji1At: 0.32,     // 布瑠部 per-karakter (sync frasa 1)
  kanji1Per: 0.12,    // ≈0.12s/kanji (3 karakter dalam 0.35s)
  kanji2At: 1.14,     // 由良由良 per-karakter (sync frasa 2)
  kanji2Per: 0.13,    // ≈0.13s/kanji (4 karakter dalam 0.52s)
  wheelAt: 1.80,      // roda 八握剣 muncul di atas, muter (8 jari-jari)
  riseAt: 2.60,       // siluet raksasa 魔虚羅 bangkit dari bayangan (sync segmen mid)
  kanji3At: 3.01,     // 魔虚羅 raksasa muncul 1× glow ungu-bayangan
  shakeAt: 3.30,      // SHAKE layar + aura 影 + bara hitam naik
  flashAt: 4.72,      // FLASH (setelah frasa 魔虚羅 selesai 4.71)
  boomAt: 4.72,       // BOOM (playDomainBoom('bang') + playMakoraRoar)
  settleAt: 4.85,     // settle: siluet+kanji naik & mengecil → roda kecil persist
  settleDur: 0.6,
};

// Hitung mundur mulai SETELAH cinematic settle → 30 dtk itu waktu main penuh.
export const megumiSummonStartDelayMs = () => {
  const t = MEGUMI_SUMMON_TIMELINE;
  return Math.round((t.settleAt + t.settleDur) * 1000);
};

// ── Mekanik 適応 (Adaptation) — inti ultimate ────────────────────────────────
export const MEGUMI_WHEEL_NOTCHES = 8;   // 八握剣 = 8 takik
export const MEGUMI_ADAPT_CUT = 1;       // 適応: 1 opsi salah dihapus / salah
// Jeda sebelum potongan 適応 mendarat di soal berikutnya (pola SUKUNA_HITSUME_DELAY_MS,
// tapi lebih pelan: Megumi BERTAHAN — bayangan menelan opsi pelan, bukan tebasan).
export const MEGUMI_ADAPT_DELAY_MS = 1100;
// Jeda 八握剣 (必中 mini): roda penuh → pedang dicabut → opsi salah dipotong.
// Lebih cepat dari 適応 karena momen "pedang tercabut" harus kerasa responsif.
export const MEGUMI_SWORD_DELAY_MS = 700;

// Roda penuh → Mahoraga cabut 八握剣 → 必中 mini (SEMUA opsi salah terpotong).
export const megumiSwordReady = (notches, max = MEGUMI_WHEEL_NOTCHES) => {
  const n = Number.isFinite(notches) && notches > 0 ? Math.floor(notches) : 0;
  const m = Number.isFinite(max) && max > 0 ? Math.floor(max) : MEGUMI_WHEEL_NOTCHES;
  return n >= m;
};

// Salah SELAMA summon. Roda belum penuh → 適応 (roda +1, streak aman).
// Roda sudah penuh (salah ke-9) → 輪砕け (summon bubar + streak HANGUS).
export const megumiWrongOutcome = (notches, max = MEGUMI_WHEEL_NOTCHES) => {
  const m = Number.isFinite(max) && max > 0 ? Math.floor(max) : MEGUMI_WHEEL_NOTCHES;
  const n = Number.isFinite(notches) && notches > 0 ? Math.floor(notches) : 0;
  if (n >= m) return { notches: m, outcome: 'shatter' };
  return { notches: n + 1, outcome: 'adapt' };
};

// Opsi salah yang dihapus 適応: deterministik (urutan array, bukan acak) →
// stabil antar render. Jawaban benar TIDAK pernah masuk.
export const megumiAdaptCut = (options = [], correctId = null, count = MEGUMI_ADAPT_CUT) => {
  const ids = (Array.isArray(options) ? options : [])
    .map((o) => (o && typeof o === 'object' ? o.id : o))
    .filter((id) => id != null && id !== correctId);
  const n = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  return ids.slice(0, n);
};

// Opsi salah yang terpotong 八握剣 (必中 mini): SEMUA opsi salah, benar aman.
export const megumiSwordCut = (options = [], correctId = null) =>
  (Array.isArray(options) ? options : [])
    .map((o) => (o && typeof o === 'object' ? o.id : o))
    .filter((id) => id != null && id !== correctId);

// Rencana takik roda untuk UI (persist selama summon): array { id, on }.
export const megumiWheelNotchPlan = (notches, max = MEGUMI_WHEEL_NOTCHES) => {
  const m = Number.isFinite(max) && max > 0 ? Math.floor(max) : MEGUMI_WHEEL_NOTCHES;
  const n = Math.min(m, Number.isFinite(notches) && notches > 0 ? Math.floor(notches) : 0);
  return Array.from({ length: m }, (_, i) => ({ id: `notch-${i}`, on: i < n }));
};

// ── Generator partikel murni (rng injectable; dipakai MegumiBurst/MegumiShadow) ──
const r2 = (v) => +v.toFixed(2);

// Genangan bayangan: blob mengalir di lantai — pola TETAP (redesign v2.1:
// dulu rng → tiap kali beda). Semua di band lantai bawah.
export const megumiPoolBlobs = (seed = 1, count = 7) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-pb${i}`,
    x: r2(6 + i * 13),                // persen horizontal — merata
    w: r2(18 + (i % 4) * 4),          // lebar (persen)
    h: r2(6 + (i % 3) * 1.6),         // tinggi genangan (persen)
    dur: r2(0.5 + (i % 4) * 0.12),
    delay: r2((i % 5) * 0.05),
  }));

// 玉犬: 2 siluet serigala BANGKIT dari genangan di TEPI kiri & kanan — posisi
// TETAP (redesign v2.1: dulu x/scale/tilt acak → terasa random; user minta
// "penempatan di pinggir, jangan random"). Komponen menempelkan side ke tepi.
export const megumiWolfRise = (seed = 1) =>
  ['left', 'right'].map((side, i) => ({
    id: `${seed}-w${i}`,
    side,
    tilt: side === 'left' ? 4 : -4,   // condong halus ke tengah (bingkai)
    delay: r2(i * 0.08),
  }));

// ── Slot "PENJAGA SOAL" (v2.5): hewan berdiri di SAYAP karakter soal ─────────
// Kritik user 29/09 (screenshot HP): 鵺 nempel tepi kiri-bawah & nabrak banner
// "✓ Correct!" — "ini kenapa nue disini? sama hewan2 yang lain nya? gw mau ga
// di pinggir si ini tapi jangan halangin". Jadi hewan TIDAK di tepi layar:
// ditempatkan di sayap kiri/kanan karakter soal (rapat ke SOAL, bukan ke tepi),
// sejajar tengah soal. Kalau sayap sempit (soal grammar lebar) → null: hewan
// TIDAK digambar (lebih baik tidak muncul daripada halangin konten).
// vp { w, h } · qRect { x, y, w, h } hasil getBoundingClientRect (WAJIB —
// tanpa ukuran soal tak bisa dijamin aman) · side 'left'|'right' ·
// opts { aspect (w/h), maxH (fraksi vh), inset (jaga tepi layar), gap (jaga
// jarak dari soal), minW/minH (batas bawah biar tidak kerdil), bounds { top,
// bottom } px (mis. bawah header & atas grid jawaban — hewan tidak boleh
// masuk area konten) }.
export const megumiFlankSlot = (vp, qRect, side, opts = {}) => {
  if (!vp || !(vp.w > 0) || !(vp.h > 0)) return null;
  if (side !== 'left' && side !== 'right') return null;
  if (!qRect || ![qRect.x, qRect.y, qRect.w, qRect.h].every((v) => Number.isFinite(v))) return null;
  const inset = Number.isFinite(opts.inset) ? opts.inset : 12;
  const gap = Number.isFinite(opts.gap) ? opts.gap : 10;
  const aspect = Number.isFinite(opts.aspect) && opts.aspect > 0 ? opts.aspect : 1;
  const minW = Number.isFinite(opts.minW) ? opts.minW : 48;
  const minH = Number.isFinite(opts.minH) ? opts.minH : 56;
  const maxH = Number.isFinite(opts.maxH) ? opts.maxH : 0.30;
  // Zona sayap: dari tepi aman layar sampai GAP sebelum karakter soal.
  const zoneX0 = side === 'left' ? inset : qRect.x + qRect.w + gap;
  const zoneX1 = side === 'left' ? qRect.x - gap : vp.w - inset;
  const zw = zoneX1 - zoneX0;
  if (!(zw > 0)) return null;                       // sayap sempit → jangan gambar
  // Band vertikal aman: di dalam tepi layar DAN di dalam bounds konten.
  const bTop = opts.bounds && Number.isFinite(opts.bounds.top) ? opts.bounds.top : -Infinity;
  const bBot = opts.bounds && Number.isFinite(opts.bounds.bottom) ? opts.bounds.bottom : Infinity;
  const availTop = Math.max(inset, bTop);
  const availBottom = Math.min(vp.h - inset, bBot);
  const availH = availBottom - availTop;
  if (!(availH > 0)) return null;                   // tak ada ruang vertikal aman
  // Kotak hewan: sebesar mungkin di dalam zona; tinggi ≤ maxH·vh, ≤ 3× soal,
  // ≤ band aman; lebar ≤ maxWf·zona (sisakan NAPAS dari tepi layar — kritik
  // user: "gw mau ga di pinggir").
  const maxWf = Number.isFinite(opts.maxWf) ? opts.maxWf : 0.78;
  const hMax = Math.min(vp.h * maxH, Math.max(qRect.h * 3, vp.h * 0.16), availH);
  let h = hMax, w = h * aspect;
  if (w > zw * maxWf) { w = zw * maxWf; h = w / aspect; }
  if (w < minW || h < minH) return null;
  // Vertikal: sejajar TENGAH soal, di-clamp ke band aman.
  const cy = qRect.y + qRect.h / 2;
  const top = Math.max(availTop, Math.min(availBottom - h, cy - h / 2));
  // Rapat ke SOAL (sisi dalam zona) — bukan rapat ke tepi layar.
  const left = side === 'left' ? zoneX1 - w : zoneX0;
  const r1 = (v) => +v.toFixed(1);
  return { left: r1(left), top: r1(top), w: r1(w), h: r1(h) };
};

// 玉犬/虎葬: goresan cakar ORGANIK di kartu jawaban yg dipencet (v2.3).
// Kritik user 29/09: "jaring laba2 bukan cakaran", "kek png dikasih animasi",
// "gw maunya organik". Jaring radial+cincin (v2.2) DIBUANG TOTAL.
// Kritik lanjutan (review visual): "glowing decal", "too smooth, no trench" →
// sekarang goresan = ALUR LUKA (gouge), bukan pita menyala:
//   - MENGIPAS: 3 goresan utama konvergen di kiri (asal cakar) lalu melebar
//     ke kanan — kemiringan jauh beda, bukan paralel;
//   - CHATTER: jalur & lebar digetarkan frekuensi tinggi (kuku nyangkut-nyangkut);
//   - lebar naik-turun (bukan lensa simetris rapi) + taper (masuk > keluar);
//   - `wobble` = goyangan besar (S); `phase` = fase chatter (beda tiap goresan).
// Koordinat dinormalisasi 0-100 (x = lebar kartu, y = tinggi kartu).
// Goresan TIPIS (4-6% tinggi kartu = ~3px di kartu HP) & DIAGONAL turun ke
// kanan (bukan horizontal — horizontal kebaca kayak strikethrough/barcode);
// 3 goresan utama (sapuan satu kaki, sedikit mengipas) + 2 flick pendek.
// Tepi kasar dibuat oleh feTurbulence di komponen.
export const megumiClawSlashes = (seed = 1) =>
  [
    // 3 goresan utama — NEMBUS tepi kartu (masuk dari luar kiri-atas, keluar
    // kanan-bawah) = sapuan satu kaki yang melewati kartu, bukan garis rapi
    // di dalam kotak. Kemiringan & lengkung beda-beda (tidak sejajar).
    { x0: -4, y0: 6, x1: 104, y1: 64, bow: -15, thick: 5, skew: 0.14, wobble: 0.45, phase: 0.7, rough: 0.9, dur: 0.14, delay: 0.02 },
    { x0: -6, y0: 24, x1: 106, y1: 82, bow: -11, thick: 6.5, skew: 0.05, wobble: -0.35, phase: 2.3, rough: 0.55, dur: 0.17, delay: 0.07 },
    { x0: 2, y0: 46, x1: 98, y1: 100, bow: -8, thick: 4.5, skew: -0.06, wobble: 0.3, phase: 4.1, rough: 0.75, dur: 0.15, delay: 0.13 },
    // 2 flick pendek (kuku terakhir lepas) — menyilang sapuan = chaos organik
    { x0: 38, y0: -2, x1: 64, y1: 26, bow: -4, thick: 3, skew: 0.2, wobble: 0.5, phase: 5.2, rough: 1.0, dur: 0.1, delay: 0.18 },
    { x0: 40, y0: 58, x1: 66, y1: 86, bow: -3, thick: 2.5, skew: -0.12, wobble: -0.45, phase: 1.4, rough: 0.7, dur: 0.09, delay: 0.22 },
  ].map((s, i) => ({ id: `${seed}-cs${i}`, ...s }));

// Path ALUR LUKA: jalur tengah (bezier + wobble + chatter) disapu jadi poligon
// dengan setengah-lebar variabel (lensa × chatter × taper) — goresan beneran
// tidak pernah lurus & lebarnya naik-turun karena kuku nyangkut.
// w/h = ukuran kartu dalam px (dari getBoundingClientRect).
// Mengembalikan { trench, lit, core } — lapisan untuk KEDALAMAN:
//   trench = alur penuh (gelap) — dasar luka
//   lit    = pita TIPIS di dinding bawah (logam kena cahaya) — bukan glow penuh
//   core   = garis tajam di bibir atas (catchlight)
// Dinding atas tetap gelap → terbaca sebagai alur masuk ke dalam kartu (3D).
export const megumiClawPath = (s, w, h) => {
  const X0 = (s.x0 * w) / 100, Y0 = (s.y0 * h) / 100;
  const X1 = (s.x1 * w) / 100, Y1 = (s.y1 * h) / 100;
  const dx = X1 - X0, dy = Y1 - Y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;         // normal satuan (px)
  const sk = Number.isFinite(s.skew) ? s.skew : 0;
  const wb = Number.isFinite(s.wobble) ? s.wobble : 0;
  const ph = Number.isFinite(s.phase) ? s.phase : 0.7;
  const rg = Number.isFinite(s.rough) ? s.rough : 0.6;
  const bx = X0 + dx * (0.5 + sk), by = Y0 + dy * (0.5 + sk);   // bulge (digeser)
  const off = (s.bow * h) / 100;
  const th = (s.thick * h) / 100;
  const r = (v) => +v.toFixed(1);

  const N = 40;
  // titik tengah jalur di u: bezier kuadratik (bow) + wobble S + chatter kuku
  // (dua frekuensi = kuku nyangkut & tersentak, bukan gelombang rapi)
  const center = (u) => {
    const cx = bx + nx * off, cy = by + ny * off;
    const a = (1 - u) * (1 - u), b2 = 2 * u * (1 - u), c = u * u;
    const px = a * X0 + b2 * cx + c * X1;
    const py = a * Y0 + b2 * cy + c * Y1;
    const chat = Math.sin(u * 7.3 + ph * 4.1) * 0.72 + Math.sin(u * 15.7 + ph * 9.3) * 0.34;
    const g = wb * th * Math.sin(u * Math.PI)     // goyangan besar (S)
      + th * 0.24 * rg * chat;                     // chatter (getaran kuku)
    return [px + nx * g, py + ny * g];
  };
  // setengah-lebar di u: lensa × chatter × taper × modulasi lambat
  // (lebar naik-turun drastis — kuku menekan lalu terangkat)
  const half = (u) => {
    const lens = Math.pow(Math.sin(Math.max(0.001, u) * Math.PI), 0.7);
    const chat = 1 + rg * 0.45 * Math.sin(u * 13.4 + ph * 7.1) + rg * 0.22 * Math.sin(u * 27.9 + ph * 3.7);
    const taper = 1 - 0.4 * u;
    const slow = 1 + rg * 0.22 * Math.sin(u * 4.2 + ph * 2.2);
    return Math.max(0.35, th * 0.5 * lens * chat * taper * slow);
  };
  // tepi k: 0 = sisi atas, 1 = sisi bawah. Tiap tepi punya mikro-robekan
  // sendiri (frekuensi beda) → tepi luka TIDAK paralel/mulus.
  const edgeTear = (u, side) => {
    const f = side === 0 ? 31.7 : 24.3;
    const o = side === 0 ? 1.9 : 4.6;
    const f2 = side === 0 ? 57.1 : 43.7;
    return rg * th * (0.1 * Math.sin(u * f + ph * 5.1 + o) + 0.055 * Math.sin(u * f2 + ph * 8.8));
  };
  const pt = (u, k) => {
    const [px, py] = center(u);
    const hw = half(u) * (1 - 2 * k) + edgeTear(u, k < 0.5 ? 0 : 1);
    return [r(px + nx * hw), r(py + ny * hw)];
  };
  // pita tertutup dari kedalaman kA → kB di sepanjang u
  const strip = (kA, kB, u0 = 0, u1 = 1) => {
    const a = [], b = [];
    for (let i = 0; i <= N; i++) {
      const u = u0 + (u1 - u0) * (i / N);
      a.push(pt(u, kA)); b.push(pt(u, kB));
    }
    const p = [...a, ...b.reverse()].map(([x, y]) => `${x},${y}`);
    return `M${p.join('L')}Z`;
  };
  const line = (k, u0 = 0.02, u1 = 0.98) => {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const u = u0 + (u1 - u0) * (i / N);
      pts.push(pt(u, k));
    }
    return `M${pts.map(([x, y]) => `${x},${y}`).join('L')}`;
  };
  return {
    trench: strip(0, 1),                // alur gelap penuh — dinding luka
    sub: strip(0.28, 0.72),             // material dalam kartu (kebuka) — terang di tengah
    lit: strip(0, 0.16, 0.16, 0.72),    // glint PENDEK di dinding atas (bukan full-length)
    core: line(0.04, 0.3, 0.62),        // catchlight pendek (kilau sesaat)
  };
};

// 鵺: petir ungu nyamber dari ATAS (beda Gojo: dari tepi) — 3 sambaran.
// REDESIGN v2: petir BERHENTI di atas soal (y ≤ 32%) — dulu turun sampai y=100
// (nembus karakter soal & tombol jawaban). Zona aman HP: soal 33-41%.
export const megumiShadowBolts = (seed = 1, count = 3, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => {
    const x0 = 18 + (i / Math.max(1, count - 1)) * 64;   // kiri → tengah → kanan
    const segments = 4 + Math.floor(rng() * 2);
    const pts = [[r2(x0 + (rng() - 0.5) * 6), -4]];
    let x = pts[0][0];
    for (let s = 1; s <= segments; s++) {
      const y = (-4 + 36 * (s / segments));              // -4% → 32% (atas soal)
      x = Math.max(2, Math.min(98, x + (rng() - 0.5) * 16));
      pts.push([r2(x), r2(y)]);
    }
    return {
      id: `${seed}-sb${i}`,
      pts,
      width: r2(1 + rng() * 1.4),
      dur: r2(0.34 + rng() * 0.3),
      delay: r2(i * 0.22 + rng() * 0.1),
    };
  });

// 鵺: gust sayap gelap — kilatan di belakang burung (TEPI KANAN, posisi tetap).
export const megumiWingSpread = (seed = 1) => ({
  id: `${seed}-wg`,
  span: 46,                            // persen lebar bentangan
  y: 16,                               // jarak dari bawah (%)
  dur: 0.34,
  delay: 0.16,
});

// 大蛇: cincin lilitan ular raksasa (nglilit) + sisik perak berkilau.
// REDESIGN v2.1: SEMUA nilai FIX (dulu rng → tiap kali beda = terasa random);
// radius dipisah + cy naik pelan → spiral yang konsisten.
export const megumiSerpentCoils = (seed = 1, count = 5) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-sc${i}`,
    r: r2(15 + i * 8.5),              // radius viewBox 0..100 (jarak antar coil > 6)
    cy: r2(56 - i * 2.2),             // naik pelan tiap lilitan → spiral
    tilt: r2(-18 + i * 7),
    width: r2(1.6 + (i % 3) * 0.5),
    dur: r2(0.5 + (i % 3) * 0.14),
    delay: r2(i * 0.09),
  }));

export const megumiScales = (seed = 1, count = 9) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-scl${i}`,
    x: r2(14 + (i % 5) * 17),                     // pola tetap (bukan acak)
    y: r2(26 + Math.floor(i / 5) * 24 + (i % 5) * 3),
    size: r2(3.4 + (i % 3) * 1.2),
    dur: r2(0.4 + (i % 4) * 0.12),
    delay: r2((i % 5) * 0.1),
  }));

// 大蛇/虎葬: garis retak lantai (gelap) — pecahan tanah.
export const megumiCracks = (seed = 1, count = 5) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-ck${i}`,
    x: r2(12 + i * 18),
    y: r2(80 + (i % 3) * 3),          // band BAWAH (zona aman HP)
    len: r2(24 + (i % 3) * 8),
    angle: r2(-32 + i * 16),
    delay: r2(i * 0.07),
  }));

// 満象: semburan air dari belalai (gradient biru, BUKAN api) + riak menyebar.
export const megumiWaterJet = (seed = 1) => ({
  id: `${seed}-wj`,
  angle: -27,                         // derajat (naik lalu jatuh) — FIX
  len: 52,
  width: 9,
  dur: 0.9,
});

export const megumiRipples = (seed = 1, count = 4) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-rp${i}`,
    x: r2(26 + i * 16),
    y: r2(82 + (i % 2) * 4),          // band BAWAH (zona aman HP)
    r0: 6,
    r1: r2(26 + i * 4),
    dur: r2(0.6 + i * 0.1),
    delay: r2(i * 0.12),
  }));

// 虎葬: harimau bayangan — BANGKIT dari genangan di TEPI KIRI lalu menerkam
// maju sedikit. REDESIGN v2.1: jalur & nilai TETAP (dulu acak + melintas
// kiri→kanan; user minta "muncul dari lumpur ke atas, di pinggir, jangan random").
export const megumiTigerLeap = (seed = 1) => ({
  id: `${seed}-tl`,
  y: 78,                              // band BAWAH (zona aman: di bawah tombol jawaban)
  tilt: -11,
  scale: 1,
  dur: 0.66,
  lunge: 3,                           // vw — maju sedikit setelah bangkit
});

// 虎葬: lantai retak membentuk pola taring (zigzag gigi) — pola TETAP.
export const megumiFangCracks = (seed = 1, count = 6) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-fc${i}`,
    x: r2(12 + i * 13),
    y: r2(80 + (i % 3) * 3),          // band BAWAH (zona aman HP)
    len: r2(16 + (i % 3) * 6),
    angle: r2(50 + (i % 3) * 13),     // miring membentuk taring
    delay: r2(i * 0.05),
  }));

// Aura 影 (summon persist): bara hitam naik + drift — pola TETAP.
export const megumiShadowMotes = (seed = 1, count = 8) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-sm${i}`,
    x: r2(8 + (i % 8) * 11),
    size: r2(3.4 + (i % 4) * 1.1),
    dur: r2(1.0 + (i % 5) * 0.2),
    delay: r2((i % 6) * 0.15),
    drift: r2(-34 - (i % 5) * 9),     // px, negatif = naik
  }));
