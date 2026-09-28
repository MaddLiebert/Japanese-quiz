// ─────────────────────────────────────────────────────────────────────────────
// Logika murni efek Ryomen Sukuna (pack_14, visual 'sukuna').
// Sumber desain: obsidian-mind/brain/Efek JJK/Sukuna.md.
// Tanpa DOM / React / import JSON → dites `node --test` (pola gojoFx/yujiFx).
// Komponen (SukunaBurst/SukunaDomain) & EffectContext HANYA membaca dari sini.
// ─────────────────────────────────────────────────────────────────────────────

// Milestone = sama persis Gojo/Yuji (keputusan desain: konsisten antar pack JJK).
export const SUKUNA_MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const isSukunaMilestone = (streak) => SUKUNA_MILESTONES.includes(streak);

// ── Palet Sukuna: putih-bening → ungu → ungu menyala → merah-oranye → void putih ──
export const SUKUNA_INK = '#0a0a0a';
export const SUKUNA_FLASH = '#ffffff';
export const SUKUNA_BLOOD = '#e0241a';   // merah darah (bar domain + iris mata)

export const SUKUNA_STYLE = {
  kumo_no_ito:   { kanji: '蜘蛛の糸', color: '#e8f4ff', label: '蜘蛛の糸 · Kumo no Ito' },
  nue:           { kanji: '鵺',       color: '#7c3aed', label: '鵺 · Nue' },
  furube:        { kanji: '魔虚羅',    color: '#a855f7', label: '布瑠部由良由良 → 魔虚羅' },
  ryuurin:       { kanji: '龍鱗・反発・番いの流星', color: '#e0241a', label: '龍鱗・反発・番いの流星' },
  sekai_zangeki: { kanji: '世界を断つ斬撃', color: '#ffffff', label: '世界を断つ斬撃 · World Cut' },
  domain:        { kanji: '伏魔御廚子', color: '#e0241a', label: '領域展開・伏魔御廚子' },
  wrong:         { kanji: '馬鹿な',    color: '#6b7280', label: '馬鹿な (gagal)' },
};

// ── Ladder jurus per streak (spec §Mapping) ─────────────────────────────────
// 1–2 蜘蛛の糸 · 3–19 鵺 · 20 布瑠部由良由良 (summon 魔虚羅) · 21–49 龍鱗反発
// (chant) · 50+ 世界を断つ斬撃. TIDAK PERNAH domain (domain dari BAR, bukan streak).
export const sukunaTechniqueFor = (kind, streak = 0) => {
  if (kind === 'wrong') return null;
  if (!Number.isFinite(streak) || streak <= 0) return 'kumo_no_ito';
  if (streak >= 50) return 'sekai_zangeki';
  if (streak >= 21) return 'ryuurin';
  if (streak >= 20) return 'furube';
  if (streak >= 3) return 'nue';
  return 'kumo_no_ito';
};

// ── Bar 呪力: 4 lengan Sukuna × 5 takik tebasan = 20 ────────────────────────
export const SUKUNA_ULT_THRESHOLD = 20;
export const SUKUNA_ARMS = 4;
export const SUKUNA_NOTCHES_PER_ARM = 5;
export const sukunaCurseCharge = (streak) =>
  (Number.isFinite(streak) && streak > 0) ? Math.min(SUKUNA_ULT_THRESHOLD, Math.floor(streak)) : 0;
export const sukunaUltReady = (streak) =>
  Number.isFinite(streak) && streak >= SUKUNA_ULT_THRESHOLD;

// ── 領域展開・伏魔御廚子: state 30 dtk, TIMER JALAN (beda Gojo yang beku) ────
export const SUKUNA_DOMAIN_DURATION_S = 30;
export const sukunaDomainLeft = (endsAt, now = Date.now()) => {
  if (!Number.isFinite(endsAt) || !Number.isFinite(now)) return 0;
  const left = Math.ceil((endsAt - now) / 1000);
  if (!Number.isFinite(left) || left <= 0) return 0;
  return Math.min(SUKUNA_DOMAIN_DURATION_S, left);
};

// Segmen klip cast (hasil ukur RMS 28/09) — JANGAN ditebak.
// 領域展開 ≈0.18–1.23 · JEDA DRAMATIS 1.23–2.25 (mata+senyum!) · 伏魔御廚子 ≈2.25–3.18
export const SUKUNA_CAST_VOICE = {
  seg1Start: 0.18, seg1End: 1.23,   // 「領域展開」
  seg2Start: 2.25, seg2End: 3.18,   // 「伏魔御廚子」
  dur: 3.48,
};

// Timeline cinematic cast (detik) — SEMUA sync ke klip 3.48s (spec §6).
export const SUKUNA_DOMAIN_TIMELINE = {
  dreadAt: 0.0,      // veil gelap total + dread (playSukunaDread)
  handAt: 0.10,      // 掌印: tangan naik dari bawah, jari membentuk mudra
  mantraAt: 0.35,    // lingkaran mantra nyala di sekeliling tangan
  kanji1At: 0.18,    // 領域展開 per-karakter (sync frasa 1)
  kanji1Per: 0.26,   // ≈0.26s/kanji
  gapStart: 1.23,    // ── JEDA DRAMATIS (1.02s) ──
  gapEnd: 2.25,
  eyesAt: 1.30,      // MATA SUKUNA (4 mata, slit merah) membuka
  smileAt: 1.55,     // SENYUM (grin) muncul
  shakeAt: 1.55,     // shake halus bareng senyum
  kanji2At: 2.25,    // 伏魔御廚子 per-karakter (sync frasa 2)
  kanji2Per: 0.19,   // ≈0.19s/kanji
  shrineAt: 2.60,    // KUIL muncul: torii + mulut raksasa + tengkorak kerbau
  flashAt: 3.28,     // FLASH
  boomAt: 3.28,      // BOOM (playDomainBoom('bang') + playSukunaBell)
  settleAt: 3.40,    // settle: blok mata+senyum+kanji naik & mengecil → kuil jadi LATAR
  settleDur: 0.6,
};

// Hitung mundur mulai SETELAH cinematic settle → 30 dtk itu waktu main penuh.
export const sukunaDomainStartDelayMs = () => {
  const t = SUKUNA_DOMAIN_TIMELINE;
  return Math.round((t.settleAt + t.settleDur) * 1000);
};

// ── 必中 (hitsume): tiap ~4 dtk satu opsi salah kena slash sendiri ──────────
export const SUKUNA_HITSUME_INTERVAL_MS = 4000;

// Berapa opsi salah yang bakal kena (3 opsi salah ≈ 12 dtk) — clamp aman.
export const sukunaHitsumeCount = (wrongCount) =>
  (Number.isFinite(wrongCount) && wrongCount > 0) ? Math.floor(wrongCount) : 0;

// 必中 versi UI: opsi salah mana yang SUDAH kena slash setelah `elapsedS` detik.
// Deterministik & stabil antar render (urutan array, bukan acak) — kalau diacak
// per render, set opsi yang terbelah berubah-ubah tiap tick (bug).
// count = floor(elapsedS / 4); berhenti otomatis saat tinggal jawaban benar.
export const sukunaHitsumeCut = (options = [], correctId = null, elapsedS = 0, intervalMs = SUKUNA_HITSUME_INTERVAL_MS) => {
  const ids = (Array.isArray(options) ? options : [])
    .map((o) => (o && typeof o === 'object' ? o.id : o))
    .filter((id) => id != null && id !== correctId);
  if (!Number.isFinite(elapsedS) || elapsedS <= 0) return [];
  const step = Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : SUKUNA_HITSUME_INTERVAL_MS;
  const count = Math.min(ids.length, Math.floor((elapsedS * 1000) / step));
  return count > 0 ? ids.slice(0, count) : [];
};

// Urutan opsi salah yang kena slash (deterministik dgn rng injectable).
// Tidak memutasi input; jawaban benar TIDAK pernah masuk.
export const sukunaHitsumeOrder = (options = [], correctId = null, rng = Math.random) => {
  const ids = (Array.isArray(options) ? options : [])
    .map((o) => (o && typeof o === 'object' ? o.id : o))
    .filter((id) => id != null && id !== correctId);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
};

// ── Generator partikel murni (rng injectable; dipakai SukunaBurst/SukunaDomain) ──

// 蜘蛛の糸: garis tebasan radial membentuk pola jaring laba-laba.
export const sukunaWebLines = (seed = 1, count = 8, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-w${i}`,
    angle: (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.3,
    len: 34 + rng() * 22,           // satuan viewBox 0..100
    width: +(0.5 + rng() * 0.5).toFixed(2),
    dur: +(0.28 + rng() * 0.22).toFixed(2),
    delay: +(rng() * 0.12).toFixed(2),
  }));

// 鵺: petir dari ATAS layar (beda dari Gojo yang dari tepi) — 3 sambaran.
export const sukunaThunderBolts = (seed = 1, count = 3, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => {
    const x0 = 18 + (i / Math.max(1, count - 1)) * 64;   // kiri → tengah → kanan
    const segments = 5 + Math.floor(rng() * 3);
    const pts = [[+(x0 + (rng() - 0.5) * 6).toFixed(2), -4]];
    let x = pts[0][0];
    for (let s = 1; s <= segments; s++) {
      const y = (100 / segments) * s;
      x = Math.max(2, Math.min(98, x + (rng() - 0.5) * 16));
      pts.push([+x.toFixed(2), +y.toFixed(2)]);
    }
    return {
      id: `${seed}-t${i}`,
      pts,
      width: +(1 + rng() * 1.4).toFixed(2),
      dur: +(0.34 + rng() * 0.3).toFixed(2),
      delay: +(i * 0.22 + rng() * 0.1).toFixed(2),
    };
  });

// 布瑠部由良由良: roda Dharma — 8 jari-jari berputar.
export const sukunaWheelSpokes = (seed = 1, count = 8, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-sp${i}`,
    angle: (i / count) * 360 + rng() * 6,
    len: 30 + rng() * 8,            // satuan viewBox 0..100 (radius roda)
    width: +(0.6 + rng() * 0.5).toFixed(2),
  }));

// 龍鱗 反発 番いの流星: 3 baris chant — tiap baris "terbakar" kiri→kanan.
// `at` = waktu nyala (detik) = awal frasa klip (hasil ukur): 0.18 / 1.41 / 2.61.
export const sukunaChantLines = (seed = 1, count = 3, rng = Math.random) => {
  const texts = ['龍鱗', '反発', '番いの流星'];
  const at = [0.18, 1.41, 2.61];
  return Array.from({ length: Math.min(count, 3) }, (_, i) => ({
    id: `${seed}-c${i}`,
    text: texts[i],
    at: at[i],
    y: 30 + i * 14,                  // persen vertikal (atas → bawah)
    dur: +(0.55 + rng() * 0.25).toFixed(2),   // lama "terbakar" per baris
  }));
};

// Lingkaran mantra di belakang chant — makin cepat tiap streak naik.
export const sukunaMantraRing = (streak = 0, rng = Math.random) => {
  const s = Number.isFinite(streak) && streak > 0 ? streak : 0;
  return {
    id: `ring-${s}`,
    r: +(30 + rng() * 6).toFixed(2),            // radius viewBox 0..100
    speed: +(6 - Math.min(3.6, s * 0.08)).toFixed(2),   // detik/putaran — makin cepat
    dur: +(0.8 + rng() * 0.4).toFixed(2),
  };
};

// 世界を断つ斬撃: hujan tebasan jatuh dari atas (persist selama domain).
export const sukunaSlashRain = (seed = 1, count = 10, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-sr${i}`,
    x: rng() * 100,                  // persen horizontal
    len: 12 + rng() * 26,            // panjang garis (persen tinggi)
    tilt: -22 + rng() * 14,          // derajat (slash miring khas tebasan)
    dur: +(0.5 + rng() * 0.6).toFixed(2),
    delay: +(rng() * 1.6).toFixed(2),
    loop: +(0.9 + rng() * 1.4).toFixed(2),   // jeda antar jatuh (loop)
  }));

// Bara hitam (aura ungu gelap saat furube/domain) — naik, drift negatif.
export const sukunaEmbers = (seed = 1, count = 7, rng = Math.random) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${seed}-e${i}`,
    x: 10 + rng() * 80,
    size: 3 + rng() * 5,
    dur: +(0.9 + rng() * 0.9).toFixed(2),
    delay: +(rng() * 0.8).toFixed(2),
    drift: -30 - rng() * 60,        // px, negatif = naik
  }));
