// ─────────────────────────────────────────────────────────────────────────────
// Logika murni efek Yuji Itadori (pack_09, visual 'yuji').
// Sumber desain: obsidian-mind/brain/Efek JJK/Yuji Itadori.md.
// Tanpa DOM / React / import JSON → dites `node --test` (pola gojoFx.js).
// Komponen (YujiBurst/YujiTakeover) & EffectContext HANYA membaca dari sini.
// ─────────────────────────────────────────────────────────────────────────────

// Milestone = sama persis Gojo (keputusan desain: konsisten antar pack JJK).
export const YUJI_MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const isYujiMilestone = (streak) => YUJI_MILESTONES.includes(streak);

// ── Warna: biru -> hitam -> merah darah -> hitam-ungu -> api ────────────────
export const YUJI_INK = '#0a0a0a';
export const YUJI_FLASH = '#ffffff';
// ── Wajah kerasukan Sukuna (kanon) ───────────────────────────────────────
// Kanon (wiki JJK): saat Sukuna menguasai badan Yuji → (1) sepasang mata KEDUA
// terbuka DI BAWAH mata normal, (2) mata menyempit jadi celah dengan pupil
// ganda, (3) tato hitam: mahkota di dahi + garis batang hidung + tato pipi.
// Koordinat di bidang 0..100 (viewBox) supaya bisa dipakai <svg> apa pun.
// Pasangan ATAS  = mata Yuji SENDIRI, tetap normal (sklera putih, pupil hitam).
// Pasangan BAWAH = mata Sukuna, MERAH, muncul belakangan (kanon: sepasang mata
// kedua terbuka di bawah mata normal saat Sukuna menguasai badan).
export const YUJI_SUKUNA_EYES = [
  // Ukuran dikecilkan (user: "mata kegedean, kecilin dikit") — tetap celah
  // menyempit (ry < rx) & pasangan Sukuna tetap di bawah + lebih kecil.
  { id: 'upper-l', kind: 'yuji',   cx: 33, cy: 45, rx: 9.8,  ry: 3.5,  pupil: 2.55 },
  { id: 'upper-r', kind: 'yuji',   cx: 67, cy: 45, rx: 9.8,  ry: 3.5,  pupil: 2.55 },
  { id: 'lower-l', kind: 'sukuna', cx: 35, cy: 58, rx: 5.8,  ry: 2.0,  pupil: 1.45 },
  { id: 'lower-r', kind: 'sukuna', cx: 65, cy: 58, rx: 5.8,  ry: 2.0,  pupil: 1.45 },
];

// Gaya mata: Yuji = putih + hitam (NORMAL, tidak berubah); Sukuna = merah menyala.
export const YUJI_EYE_STYLE = {
  yuji:   { sclera: '#f4f4f6', pupil: '#0a0a0c', iris: null },
  sukuna: { sclera: '#1a0505', pupil: '#12060a', iris: '#e0241a' },
};

export const YUJI_SUKUNA_MARKINGS = [
  // Mahkota di tengah dahi (kanon: crown-like symbol).
  { id: 'crown', d: 'M50 16 L42 30 M50 16 L50 32 M50 16 L58 30 M50 16 L34 26 M50 16 L66 26' },
  // Garis horizontal di batang hidung (kanon).
  { id: 'nose', d: 'M38 40 L62 40' },
  // Tato pipi kiri/kanan (kanon: spread from cheekbones). Digeser ke LUAR
  // supaya tidak menembus mata (user: "mata nya nyangkut").
  { id: 'cheek-l', d: 'M18 50 L26 62 M16 58 L24 68 M24 44 L32 52' },
  { id: 'cheek-r', d: 'M82 50 L74 62 M84 58 L76 68 M76 44 L68 52' },
];

export const YUJI_STYLE = {
  keiteiken: { kanji: '逕庭拳', color: '#00b0ff', label: '逕庭拳 · Keiteiken' },
  manjigeri: { kanji: '卍蹴り', color: '#00b0ff', label: '卍蹴り · Manji-geri' },
  kokusen:   { kanji: '黒閃',   color: '#e0241a', label: '黒閃 · Kokusen' },
  senketsu:  { kanji: '穿血',   color: '#8b0000', label: '穿血 · Senketsu' },
  kai:       { kanji: '解',     color: '#e8e0ff', label: '解 · Kai' },
  hachi:     { kanji: '捌',     color: '#e8e0ff', label: '捌 · Hachi' },
  fuga:      { kanji: '開',     color: '#e0241a', label: '開 · Fūga' },
  takeover:  { kanji: '宿儺の器', color: '#6d28d9', label: '宿儺の器 · Sukuna no Utsuwa' },
  wrong:     { kanji: '失敗',   color: '#6b7280', label: '失敗 · Shippai (gagal)' },
};

// ── Teknik per streak ───────────────────────────────────────────────────────
// 1 = 逕庭拳 · 2 = 卍蹴り (gantian) · 3..59 = 黒閃 · >=60 = 穿血.
// TIDAK PERNAH mengembalikan domain/takeover — takeover dari BAR (指), bukan streak.
export const yujiTechniqueFor = (kind, streak = 0) => {
  if (kind === 'wrong') return null;
  if (!Number.isFinite(streak) || streak <= 0) return 'keiteiken';
  if (streak >= 60) return 'senketsu';
  if (streak >= 3) return 'kokusen';
  return streak === 1 ? 'keiteiken' : 'manjigeri';
};

// ── Bar 指 (jari Sukuna): 20 benar beruntun = penuh -> tap = 宿儺の器 ─────────
export const YUJI_ULT_THRESHOLD = 20;
export const yujiCurseCharge = (streak) =>
  (Number.isFinite(streak) && streak > 0) ? Math.min(YUJI_ULT_THRESHOLD, Math.floor(streak)) : 0;
export const yujiUltReady = (streak) =>
  Number.isFinite(streak) && streak >= YUJI_ULT_THRESHOLD;

// ── 宿儺の器: state 30 dtk, TIMER JALAN (beda dari domain Gojo yang membekukan) ─
export const YUJI_TAKEOVER_DURATION_S = 30;
export const yujiTakeoverLeft = (endsAt, now = Date.now()) => {
  if (!Number.isFinite(endsAt) || !Number.isFinite(now)) return 0;
  const left = Math.ceil((endsAt - now) / 1000);
  if (!Number.isFinite(left) || left <= 0) return 0;
  return Math.min(YUJI_TAKEOVER_DURATION_S, left);
};

// Timeline cinematic cast 宿儺の器 (detik). 宿儺の器 = TEKS DOANG (tanpa klip
// voice); suara Sukuna masuk lewat combo 解/捌/開.
export const YUJI_TAKEOVER_TIMELINE = {
  tattooStart: 0.0,   // aura biru naik, tato merayap
  fireAt: 0.15,       // API naik dari bawah (cinematic, sebelum mata Sukuna)
  eyesAt: 0.4,        // mata Yuji tetap normal; mata Sukuna (merah) terbuka DI BAWAH
  kanjiAt: 0.8,       // kanji 宿儺の器 muncul
  kanjiHold: 1.5,     // lama kanji tampil
  voiceAt: 1.2,       // possessWhoosh (SFX, bukan klip voice)
  flashAt: 2.05,      // kilatan merah tepat sebelum veil tersingkap
  settleStart: 2.3,   // veil tersingkap
  settleDur: 0.6,
};

// Hitung mundur mulai SETELAH cinematic settle -> 30 dtk itu waktu main penuh.
export const yujiTakeoverStartDelayMs = () => {
  const t = YUJI_TAKEOVER_TIMELINE;
  return Math.round((t.settleStart + t.settleDur) * 1000);
};

// ── Combo takeover 解->捌->開 (kanon: 解/捌 dulu, baru 開) ────────────────────
// level 0 = belum, 1 = 解, 2 = 捌, 3 = 開 (finisher). Cap di 3.
export const yujiComboNext = (level) =>
  Math.min(3, (Number.isFinite(level) && level > 0 ? Math.floor(level) : 0) + 1);
export const YUJI_COMBO_CLIPS = ['/voices/yuji/kai.mp3', '/voices/yuji/hachi.mp3', '/voices/yuji/fuga.mp3'];
export const YUJI_COMBO_KANJI = ['解', '捌', '開'];
export const yujiComboClip = (level) => {
  const lvl = Math.floor(Number(level));
  return (lvl >= 1 && lvl <= 3) ? YUJI_COMBO_CLIPS[lvl - 1] : null;
};
export const yujiComboKanji = (level) => {
  const lvl = Math.floor(Number(level));
  return (lvl >= 1 && lvl <= 3) ? YUJI_COMBO_KANJI[lvl - 1] : null;
};

// ── 開 (finisher): bakar 2 opsi SALAH soal berikutnya (50/50) + XP dobel ────
export const YUJI_FINISHER_XP_MULT = 2;

// Pilih <=2 id opsi salah. rng injectable -> deterministik di tes. Tidak
// memutasi input (map() bikin salinan dulu).
// 開 (finisher): SEMUA opsi salah dibakar; jawaban benar dibiarkan UTUH.
// (Versi lama membakar 2 — user minta "sisa yang bener utuh", jadi semua salah kena.)
export const yujiBurnedIds = (options = [], correctId = null) => {
  return (Array.isArray(options) ? options : [])
    .map((o) => (o && typeof o === 'object' ? o.id : o))
    .filter((id) => id != null && id !== correctId);
};

// ── Petir merah kokusen (黒閃) — user minta aura petir merah ────────────────
// Tiap bolt = polyline yang MENJALAR KELUAR dari pusat (50,50) dengan cabang.
export const yujiBolts = (seed = 1, count = 9, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => {
    const baseAngle = (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.4;
    const segments = 4 + Math.floor(rng() * 3);
    const len = 26 + rng() * 26;
    const pts = [[50, 50]];
    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const jitter = (rng() - 0.5) * 7 * (1 - t * 0.4);
      const a = baseAngle + jitter * 0.05;
      pts.push([+(50 + Math.cos(a) * len * t).toFixed(2), +(50 + Math.sin(a) * len * t).toFixed(2)]);
    }
    return {
      id: `${seed}-b${i}`,
      pts,
      width: +(1.1 + rng() * 1.3).toFixed(2),
      dur: +(0.3 + rng() * 0.35).toFixed(2),
      delay: +(rng() * 0.14).toFixed(2),
    };
  });

// ── Leading silence per klip (detik) — diukur via Web Audio (RMS). ──────────
// fuga.mp3 punya 0.46 s diam di depan (klip lain 0.15-0.25 s) -> suara 開
// kerasa telat setengah detik. playFile() melewati offset ini saat memutar.
export const YUJI_FUGA_LEAD_S = 0.46;
export const YUJI_CLIP_LEAD_S = { fuga: YUJI_FUGA_LEAD_S };
export const yujiClipLeadS = (technique) => YUJI_CLIP_LEAD_S[technique] || 0;

// ── Generator partikel murni (rng injectable; dipakai YujiBurst) ────────────
export const yujiSparks = (seed = 1, count = 16, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + rng() * 0.5;
    return {
      id: `${seed}-s${i}`,
      angle: a,
      dist: 40 + rng() * 150,
      size: 2 + rng() * 5,
      dur: 0.35 + rng() * 0.35,
      delay: rng() * 0.12,
    };
  });

export const yujiCracks = (seed = 1, count = 8, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-c${i}`,
    angle: (i / count) * Math.PI * 2 + rng() * 0.35,
    len: 30 + rng() * 20,          // satuan viewBox 0..100
    delay: i * 0.04,
  }));

export const yujiEmbers = (seed = 1, count = 7, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-e${i}`,
    x: 12 + rng() * 76,            // persen horizontal
    size: 3 + rng() * 5,
    dur: 0.9 + rng() * 0.9,
    delay: rng() * 0.7,
    drift: -30 - rng() * 60,       // px, negatif = naik
  }));

// ── 開 (Fuga): PANAH API — terbang dari kanji 開 ke tombol jawaban SALAH ────
// (permintaan user: "adain efek api/panah api, jawaban salah kena panah api
//  terus ada efek kebakar"). Semua murni + rng-free → deterministik di tes.
export const FUGA_FLIGHT_MIN_MS = 220;
export const FUGA_FLIGHT_MAX_MS = 520;
export const FUGA_ARROW_LEAD_S = 0.12;   // jeda sebelum panah pertama lepas
export const FUGA_ARROW_STAGGER_S = 0.09; // jeda waktu MENDARAT antar panah

// Kapan panah tiba di tombol (detik dari awal fx) — dipakai impact + ignite
// supaya ledakan & nyala tombol PERSIS pas panahnya nempel.
export const fugaArrowImpactS = (shot = {}) =>
  +((FUGA_ARROW_LEAD_S + (Number(shot.delay) || 0) + (Number(shot.dur) || 0)).toFixed(3));

// Vektor terbang dari titik spawn ke titik target (derajat, 0 = kanan).
export const fugaArrowSpec = (from = {}, to = {}) => {
  const dx = +((to.x || 0) - (from.x || 0)).toFixed(2);
  const dy = +((to.y || 0) - (from.y || 0)).toFixed(2);
  const dist = +Math.hypot(dx, dy).toFixed(2);
  const angle = +(Math.atan2(dy, dx) * 180 / Math.PI).toFixed(2);
  return { dx, dy, dist, angle };
};

// Makin jauh makin lama terbangnya (dibatas supaya tetap responsif).
export const fugaArrowFlightMs = (dist) => {
  const d = Number.isFinite(dist) && dist > 0 ? dist : 0;
  return Math.round(Math.min(FUGA_FLIGHT_MAX_MS, Math.max(FUGA_FLIGHT_MIN_MS, 220 + d * 0.35)));
};

// Target cadangan (preview DevPanel tanpa DOM quiz) — kiri & kanan bawah-tengah,
// kira-kira tempat grid opsi jawaban.
export const FUGA_FALLBACK_TARGETS = [
  { xf: 0.74, yf: 0.62 },
  { xf: 0.26, yf: 0.66 },
];

// rects = getBoundingClientRect() tombol [data-burned] dalam KOORDINAT layer fx.
// Kosong → pakai fallback. Maks 6 panah (soal Medium 6 opsi → 5 salah + jaga-jaga).
// DESAIN IMPACT: waktu mendarat panah ke-i dijamin berurutan (i * STAGGER)
// sehingga ledakan di tombol tidak saling menimpa, terlepas dari jarak terbangnya.
export const fugaArrowTargets = (rects = [], vw = 1280, vh = 720) => {
  const w = Number.isFinite(vw) && vw > 0 ? vw : 1280;
  const h = Number.isFinite(vh) && vh > 0 ? vh : 720;
  const pts = (Array.isArray(rects) ? rects : [])
    .filter((r) => r && Number.isFinite(r.left) && Number.isFinite(r.top))
    .slice(0, 6)
    .map((r) => ({
      x: r.left + (Number.isFinite(r.width) ? r.width : 0) / 2,
      y: r.top + (Number.isFinite(r.height) ? r.height : 0) / 2,
    }));
  const targets = pts.length ? pts : FUGA_FALLBACK_TARGETS.map((t) => ({ x: w * t.xf, y: h * t.yf }));

  const raw = targets.map((to, i) => {
    const from = { x: w * 0.5, y: h * 0.42 + (i % 2 ? 16 : -12) };
    const spec = fugaArrowSpec(from, to);
    const ms = fugaArrowFlightMs(spec.dist);
    return { from, to, ...spec, ms, dur: +(ms / 1000).toFixed(3) };
  });

  // Tentukan waktu mendarat target: panah ke-i mendarat di (baseImpact + i * STAGGER).
  // baseImpact harus cukup besar agar delay panah terpanjang >= 0.
  const maxDur = raw.reduce((m, s) => Math.max(m, s.dur), 0);
  const baseImpact = maxDur;

  return raw.map((s, i) => {
    const targetImpact = baseImpact + i * FUGA_ARROW_STAGGER_S;
    const delay = +(Math.max(0, targetImpact - s.dur)).toFixed(3);
    return {
      id: i, from: s.from, to: s.to,
      dx: s.dx, dy: s.dy, dist: s.dist, angle: s.angle,
      delay,
      dur: s.dur,
      ms: s.ms,
    };
  });
};

// ── Api takeover (permintaan user: "lebih cinematic, adain efek api") ───────
// Palet api JJK: kuning-terang inti -> jingga -> merah -> merah gelap di tepi.
export const YUJI_FIRE_COLORS = ['#ffd166', '#ff8c1a', '#e0241a', '#7a0b06'];

// Lidah api naik dari bawah layar. x persen, w/h persen, dur & delay detik.
export const yujiFlames = (seed = 1, count = 11, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-f${i}`,
    x: (i / Math.max(1, count - 1)) * 100 + (rng() - 0.5) * 6,
    w: 5 + rng() * 9,
    h: 16 + rng() * 30,
    dur: 0.9 + rng() * 1.1,
    delay: rng() * 1.6,
    hue: YUJI_FIRE_COLORS[Math.floor(rng() * YUJI_FIRE_COLORS.length) % YUJI_FIRE_COLORS.length],
  }));

export const yujiBeam = (seed = 1, rng = Math.random) => ({
  id: `${seed}-beam`,
  y: 44 + rng() * 12,              // posisi vertikal (persen)
  thickness: 2 + rng() * 2,
  dur: 0.5,
});

export const yujiWindLines = (seed = 1, count = 12, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-w${i}`,
    x: 8 + rng() * 84,
    len: 18 + rng() * 40,
    dur: 0.3 + rng() * 0.25,
    delay: rng() * 0.2,
  }));

// Garis putus-putus 御廚子 versi Yuji (解/捌) — nyebar kayak gunting, lalu SNIP.
export const yujiScissorLines = (seed = 1, count = 7, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-k${i}`,
    angle: rng() * Math.PI,        // radian
    offset: -30 + rng() * 60,      // geser vertikal di viewBox
    delay: i * 0.05,
  }));
