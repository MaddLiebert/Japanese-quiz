// ─────────────────────────────────────────────────────────────────────────────
// cyberpunkStops.js — Peta 電脳 「家」: 5 TITIK (bukan 8 perhentian).
//
// Era lain punya peta 8 perhentian (perjalanan yang MEMBENTANG). 電脳 tidak —
// sumbunya MENYEMPIT jadi SATU titik: rumah Nacht & Saku di kota neon, dilihat
// dari beberapa sudut. Karena itu 5 titik saja, dan yang TERAKHIR (別れ) bukan
// checkpoint, melainkan PENUTUP (TAMAT) — gerbang 終 justru di TENGAH (扉).
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Lihat PRD docs/tema/cyberpunk.md §7.
//
// `feature` = fitur app yang terhubung (gate/street/checkpoint/story/end).
// `last` = penutup (別れ · TAMAT). Checkpoint 終 ada di 扉 (n:2), bukan terakhir.
// ─────────────────────────────────────────────────────────────────────────────

export const CYBERPUNK_STOPS = [
  {
    n: 0,
    id: 'mon',
    jp: '門',
    romaji: 'Mon',
    theme: '街の入口',
    theme_id: 'Gerbang Kota',
    lesson_jp: '文字 · かな',
    lesson_id: 'Huruf (moji) · Kana',
    moment: '「ここが、最後の街か。」',
    moment_id: '“Jadi ini kota terakhir.”',
    vibe: 'Gerbang baja, hujan neon, kota menyala sejauh mata memandang.',
    feature: 'gate',
  },
  {
    n: 1,
    id: 'machi',
    jp: '街',
    romaji: 'Machi',
    theme: 'ネオン街',
    theme_id: 'Jalan Neon',
    lesson_jp: '語彙 · 単語',
    lesson_id: 'Kosakata (goi) · Kata (tango)',
    moment: '「看板の文字、全部読める。」',
    moment_id: '“Tulisan di papan itu, kubaca semuanya.”',
    vibe: 'Papan iklan kanji berkedip, hujan, jejak kaki di aspal basah.',
    feature: 'street',
  },
  {
    n: 2,
    id: 'tobira',
    jp: '扉',
    romaji: 'Tobira',
    theme: '最後の扉',
    theme_id: 'Pintu Terakhir',
    lesson_jp: '総復習 · 試験',
    lesson_id: 'Sintesis semua (kana + kotoba + kanji + grammar + mondai)',
    moment: '「この扉の向こうが、家だ。」',
    moment_id: '“Di balik pintu ini, rumah.”',
    vibe: 'Pintu tanpa gagang, satu lampu kuning, sunyi sebelum ujian 終.',
    feature: 'checkpoint',
  },
  {
    n: 3,
    id: 'uchi',
    jp: '内',
    romaji: 'Uchi',
    theme: '家の中',
    theme_id: 'Di Dalam',
    lesson_jp: '文法 · 文',
    lesson_id: 'Tata bahasa (bunpō) · Kalimat (bun)',
    moment: '「…ただいま。」',
    moment_id: '“…aku pulang.”',
    vibe: 'Ruang kecil, dua kursi, cahaya hangat — kontras dari neon luar.',
    feature: 'story',
  },
  {
    n: 4,
    id: 'wakare',
    jp: '別れ',
    romaji: 'Wakare',
    theme: '別れの朝',
    theme_id: 'Perpisahan',
    lesson_jp: '総復習 · 別れ',
    lesson_id: 'Sintesis terakhir · Selamat jalan',
    moment: '「また、いつか。」',
    moment_id: '“Sampai jumpa, suatu hari.”',
    vibe: 'Fajar pertama 常夜, dua siluet, satu pergi — TAMAT.',
    feature: 'end',
    last: true,
  },
];

// Penutup (別れ · TAMAT) = perhentian terakhir.
export const CYBERPUNK_LAST_STOP = CYBERPUNK_STOPS[CYBERPUNK_STOPS.length - 1];

// Checkpoint 終 = 扉 (gerbang naik/tutup era), bukan perhentian terakhir.
export const CYBERPUNK_CHECKPOINT_STOP = CYBERPUNK_STOPS.find((s) => s.feature === 'checkpoint') || null;

export const cyberpunkStopById = (id) => CYBERPUNK_STOPS.find((s) => s.id === id) || null;
export const cyberpunkStopByFeature = (feature) => CYBERPUNK_STOPS.find((s) => s.feature === feature) || null;

// Validasi ringan untuk tes: nomor berurutan, id unik, field lengkap,
// tepat 1 checkpoint, tepat 1 penutup (last) — dan penutup ≠ checkpoint.
export const validateCyberpunkStops = (stops = CYBERPUNK_STOPS) => {
  const errors = [];
  const ids = new Set();
  stops.forEach((s, i) => {
    if (s.n !== i) errors.push(`perhentian[${i}] nomor ${s.n} harus ${i}`);
    if (!s.id) errors.push(`perhentian[${i}] tanpa id`);
    if (ids.has(s.id)) errors.push(`id perhentian duplikat: ${s.id}`);
    ids.add(s.id);
    for (const k of ['jp', 'romaji', 'theme', 'theme_id', 'lesson_jp', 'lesson_id', 'moment', 'moment_id', 'vibe', 'feature']) {
      if (!s[k]) errors.push(`perhentian ${s.id} tanpa ${k}`);
    }
  });
  const checkpoints = stops.filter((s) => s.feature === 'checkpoint');
  if (checkpoints.length !== 1) errors.push('harus ada tepat 1 perhentian checkpoint');
  const lasts = stops.filter((s) => s.last);
  if (lasts.length !== 1) errors.push('harus ada tepat 1 perhentian penutup (last:true)');
  if (lasts.length === 1 && lasts[0].n !== stops.length - 1) {
    errors.push('penutup (last) harus perhentian TERAKHIR');
  }
  // 電脳 KHAS: penutup bukan checkpoint (beda dari era lain) — 終 ada di tengah.
  if (lasts.length === 1 && lasts[0].feature === 'checkpoint') {
    errors.push('penutup 別れ TIDAK boleh jadi checkpoint (終 ada di 扉, bukan di akhir)');
  }
  return errors;
};
