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
  // kumo_no_ito: inWeb → jaring muncul DI KARTU jawaban yang dipencet (bukan overlay
  // layar penuh). Kritik user 28/09: "pas muncul jaring bagusnya pas kita pencet card
  // langsung muncul disana aja, kek buat ngejerat jawaban yang di pilih".
  kumo_no_ito:   { kanji: '蜘蛛の糸', color: '#e8f4ff', label: '蜘蛛の糸 · Kumo no Ito', inWeb: true },
  nue:           { kanji: '鵺',       color: '#7c3aed', label: '鵺 · Nue' },
  // furube: gif kanon Mahoraga (roda adaptasi 8 handle, TANPA mata) — kritik user:
  // "mahoraga nya apaan item, harus lore accurate ... wheelnya juga jangan ada mata".
  furube:        { kanji: '魔虚羅',    color: '#a855f7', label: '布瑠部由良由良 → 魔虚羅', gif: '/effects/mahoraga.gif' },
  ryuurin:       { kanji: '龍鱗・反発・番いの流星', color: '#e0241a', label: '龍鱗・反発・番いの流星' },
  sekai_zangeki: { kanji: '世界を断つ斬撃', color: '#ffffff', label: '世界を断つ斬撃 · World Cut' },
  domain:        { kanji: '伏魔御廚子', color: '#e0241a', label: '領域展開・伏魔御廚子' },
  // wrong: jawaban salah = kanji 馬鹿な + GIF kalah. SEMUA efek lain dibuang
  // (kritik user: "pas salah si efekna ilangin aja cuma pake kata2 kanji sama gif").
  wrong:         { kanji: '馬鹿な',    color: '#e0241a', label: '馬鹿な (gagal)' },
};

// ── Fitur skill yang GUNA buat quiz (unlock di streak 30 & 50) ───────────────
// Kritik user 28/09: "streak 30 sama 50 adain fitur skill yang guna buat quiz,
// sesuai sama lore nya". Lore:
//   30 → 龍鱗・反発 (ryuurin): "反発" = memantulkan serangan → pecah SATU opsi salah
//        (pantulan menyisihkan satu kemungkinan) untuk soal BERIKUTNYA.
//   50 → 世界を断つ斬撃 (sekai_zangeki): memotong dunia/ruang → SEMUA opsi salah
//        terbelah untuk soal BERIKUTNYA (tinggal jawaban benar).
// Efek praktis berlaku ke soal berikutnya (soal sekarang sudah dijawab) — di-arm
// saat streak tepat menyentuh angka itu, dikonsumsi saat opsi soal baru terpasang.
export const SUKUNA_QUIZ_SKILLS = {
  30: { id: 'ryuurin', at: 30, label: '龍鱗・反発', desc: '反発 — pantulan memecah 1 opsi salah', cut: 1 },
  50: { id: 'sekai_zangeki', at: 50, label: '世界を断つ斬撃', desc: 'memotong semua opsi salah', cut: 'all' },
};

// Cooldown skill quiz: setelah dipakai, skill baru bisa dipakai lagi setelah
// pemain menambah N jawaban benar. Anti-overpower — tanpa ini, streak ≥30 bisa
// memotong 1 opsi di SETIAP soal → kuis jadi 2 pilihan terus.
export const SUKUNA_SKILL_COOLDOWN = 3;

// Skill yang di-unlock TEPAT di streak ini (angka lain → null).
export const sukunaQuizSkillAt = (streak) =>
  (Number.isFinite(streak) && SUKUNA_QUIZ_SKILLS[streak]) ? SUKUNA_QUIZ_SKILLS[streak] : null;

// Opsi salah yang dipotong skill quiz. Deterministik (urutan array, bukan acak)
// supaya stabil antar render. Jawaban benar TIDAK pernah masuk. skillId:
//   'ryuurin' (cut 1)   → opsi salah pertama
//   'sekai_zangeki' (all) → semua opsi salah
export const sukunaSkillCut = (options = [], correctId = null, skillId = null) => {
  const ids = (Array.isArray(options) ? options : [])
    .map((o) => (o && typeof o === 'object' ? o.id : o))
    .filter((id) => id != null && id !== correctId);
  if (ids.length === 0 || !skillId) return [];
  const skill = Object.values(SUKUNA_QUIZ_SKILLS).find((s) => s.id === skillId);
  if (!skill) return [];
  return skill.cut === 'all' ? ids : ids.slice(0, Math.max(0, Math.floor(skill.cut) || 0));
};

// ── Ladder jurus per streak (spec §Mapping; revisi kritik user 28/09 v3) ─────
// Momen GEDE tetap di streak pasti: 20 布瑠部由良由良 (summon 魔虚羅) ·
// 30 龍鱗反発 (chant) · 50 世界を断つ斬撃 (World Cut).
// Semua jawaban benar NON-momen = ROTASI non-streak: ke-1 蜘蛛の糸, ke-2 鵺,
// ke-3 蜘蛛の糸, … Kritik user 28/09: "non streak 1 kumo no ito, kdua nue, gitu
// terus buat non streak" + "kadang pake suara default" (dulu null → chime default).
// TIDAK PERNAH domain (domain dari BAR, bukan streak).
export const SUKUNA_LADDER = { 20: 'furube', 30: 'ryuurin', 50: 'sekai_zangeki' };

// Siklus jurus non-streak — deterministik (bukan acak): kumo → nue → kumo → …
export const SUKUNA_NON_STREAK_CYCLE = ['kumo_no_ito', 'nue'];

// Jawaban benar NON-momen ke berapa streak ini (1-based). Murni dari angka
// streak (tanpa state) → stabil antar render, gampang dites, tidak "nyangkut".
export const sukunaNonStreakIndex = (streak) => {
  if (!Number.isFinite(streak) || streak <= 0) return 0;
  const s = Math.floor(streak);
  const ladders = Object.keys(SUKUNA_LADDER).filter((m) => s >= Number(m)).length;
  return s - ladders;
};

export const sukunaTechniqueFor = (kind, streak = 0) => {
  if (kind === 'wrong') return null;
  if (!Number.isFinite(streak) || streak <= 0) return null;
  const s = Math.floor(streak);
  if (SUKUNA_LADDER[s]) return SUKUNA_LADDER[s];
  const idx = sukunaNonStreakIndex(s);
  if (idx <= 0) return null;
  return SUKUNA_NON_STREAK_CYCLE[(idx - 1) % SUKUNA_NON_STREAK_CYCLE.length];
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
  shrineAt: 2.60,    // penanda urutan; kuil TIDAK di depan — muncul di BELAKANG
                     // layar quiz via SukunaAura setelah settle (kritik user 28/09)
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

// ── 必中 (hitsume): SATU tebasan membabat SEMUA opsi salah sekaligus ────────
// Kritik user 28/09: "pas kena tebasan langsung aja cepet sisain 1 jawaban bener,
// berulang di quiz berikutnya sampe waktu abis" — jadi BUKAN 1 opsi / 4 dtk
// (versi lama: 3 opsi salah = 12 dtk, kelamaan). Begitu tebasan jatuh → semua
// opsi salah terbelah, tinggal jawaban benar; berulang tiap soal baru selama
// domain hidup. Penjadwalan kapan tebasan jatuh ada di EffectContext (provider).

// Jeda sebelum tebasan jatuh di tiap soal baru (ms). Cepat — user minta
// "langsung aja cepet", tapi tetap kelihatan tebasannya (bukan instan).
export const SUKUNA_HITSUME_DELAY_MS = 1200;

// Opsi yang terbabat satu tebasan 必中: SEMUA opsi salah, jawaban benar AMAN.
// Deterministik (urutan array) → stabil antar render.
export const sukunaHitsumeCut = (options = [], correctId = null) => {
  return (Array.isArray(options) ? options : [])
    .map((o) => (o && typeof o === 'object' ? o.id : o))
    .filter((id) => id != null && id !== correctId);
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

// 布瑠部由良由良: roda Dharma — 8 jari-jari berputar (dipakai mantra ring, BUKAN
// roda bermata — roda kanon Mahoraga = 8 handle tanpa mata, di GIF).
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
