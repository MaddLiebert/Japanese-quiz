// ─────────────────────────────────────────────────────────────────────────────
// animeStops.js — Peta 多元: 8 PERHENTIAN rute naratif tema (「8つの世界」).
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Tur "8 dunia": 開幕 → 冒険 → 日常 → 青春 → 魔法 → 怪談 → 異世界 → 最終回.
// Lihat PRD docs/tema/anime.md §7.
//
// Tiap perhentian = DATA (bukan halaman baru). `feature` = fitur app yang
// terhubung (nav/onoma/register/slang/loanwords/dark/isekai/checkpoint).
// `last` = perhentian terakhir = CHECKPOINT naik era (最終回).
// ─────────────────────────────────────────────────────────────────────────────

export const ANIME_STOPS = [
  {
    n: 0,
    id: 'kaimaku',
    jp: '開幕',
    romaji: 'Kaimaku',
    theme: '頁が裂ける',
    theme_id: 'Halaman Terbelah',
    lesson_jp: '挨拶 pop · やばい・マジ',
    lesson_id: 'Sapaan gaya pop · やばい・マジ',
    moment: '「…ここは、時代じゃない。世界だ。」',
    moment_id: '“…ini bukan zaman. Ini dunia.”',
    vibe: 'Halaman putih pecah jadi panel-panel, cahaya keluar.',
    feature: 'nav',
  },
  {
    n: 1,
    id: 'boken',
    jp: '冒険',
    romaji: 'Bōken',
    theme: '少年の世界',
    theme_id: 'Dunia Petualangan (shōnen)',
    lesson_jp: 'オノマトペ · ドキドキ・バン',
    lesson_id: 'Kata bunyi (onoma) · ドキドキ・バン',
    moment: '「ドキドキする…！」',
    moment_id: '“Jantungku berdebar…!”',
    vibe: 'Garis kecepatan, ledakan, langit biru terang.',
    feature: 'onoma',
  },
  {
    n: 2,
    id: 'nichijo',
    jp: '日常',
    romaji: 'Nichijō',
    theme: '学校の世界',
    theme_id: 'Dunia Sekolah',
    lesson_jp: 'タメ口 vs 敬語 · 家族・友達',
    lesson_id: 'Santai vs Hormat · Keluarga・Teman',
    moment: '「おはよー！」 vs 「おはようございます。」',
    moment_id: '“Ohayō!” vs “Ohayō gozaimasu.”',
    vibe: 'Kelas, koridor, atap sekolah, sore.',
    feature: 'register',
  },
  {
    n: 3,
    id: 'seishun',
    jp: '青春',
    romaji: 'Seishun',
    theme: '部活の世界',
    theme_id: 'Dunia Klub/Olahraga',
    lesson_jp: '若者言葉 · スラング',
    lesson_id: 'Slang muda (wakamono kotoba)',
    moment: '「エモい…！」',
    moment_id: '“Menyentuh banget…!”',
    vibe: 'Lapangan, matahari terbenam, sorak.',
    feature: 'slang',
  },
  {
    n: 4,
    id: 'maho',
    jp: '魔法',
    romaji: 'Mahō',
    theme: '幻想の世界',
    theme_id: 'Dunia Fantasi',
    lesson_jp: 'カタカナ loanwords · 呪文',
    lesson_id: 'Kata serapan (katakana) · Mantra',
    moment: '「魔法、かけてみて。」',
    moment_id: '“Coba sihirnya.”',
    vibe: 'Menara, kristal bercahaya, bintang.',
    feature: 'loanwords',
  },
  {
    n: 5,
    id: 'kaidan',
    jp: '怪談',
    romaji: 'Kaidan',
    theme: '闇の世界',
    theme_id: 'Dunia Gelap',
    lesson_jp: '恐怖 vocab · 声の描写',
    lesson_id: 'Kosakata takut · Deskripsi suara',
    moment: '「…だれか、いる。」',
    moment_id: '“…ada seseorang.”',
    vibe: 'Gelap, satu lampu, bayangan, 深夜アニメ (dark mode).',
    feature: 'dark',
  },
  {
    n: 6,
    id: 'isekai',
    jp: '異世界',
    romaji: 'Isekai',
    theme: '遠い世界',
    theme_id: 'Dunia Terjauh',
    lesson_jp: '敬語 fantasi · 冒険 vocab',
    lesson_id: 'Hormat fantasi · Kosakata petualangan',
    moment: '「ここは、別の世界。」',
    moment_id: '“Ini dunia yang lain.”',
    vibe: 'Portal, dunia aneh, langit dua bulan.',
    feature: 'isekai',
  },
  {
    n: 7,
    id: 'saishukai',
    jp: '最終回',
    romaji: 'Saishūkai',
    theme: '最後の頁',
    theme_id: 'Halaman Terakhir',
    lesson_jp: '総復習 · register pop',
    lesson_id: 'Sintesis semua register pop',
    moment: '「次は…最後の世界だ。」',
    moment_id: '“Berikutnya… dunia terakhir.”',
    vibe: 'Episode terakhir, kredit berjalan, 寂しい — persis sebelum pulang.',
    feature: 'checkpoint',
    last: true,
  },
];

// Perhentian terakhir = CHECKPOINT naik era (最終回 · sintesis register pop).
export const ANIME_LAST_STOP = ANIME_STOPS[ANIME_STOPS.length - 1];

export const animeStopById = (id) => ANIME_STOPS.find((s) => s.id === id) || null;
export const animeStopByFeature = (feature) => ANIME_STOPS.find((s) => s.feature === feature) || null;

// Validasi ringan untuk tes: nomor berurutan, id unik, field lengkap, 1 checkpoint.
export const validateAnimeStops = (stops = ANIME_STOPS) => {
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
  if (checkpoints.length === 1 && !checkpoints[0].last) errors.push('checkpoint harus ditandai last:true');
  if (checkpoints.length === 1 && checkpoints[0].n !== stops.length - 1) {
    errors.push('checkpoint harus perhentian TERAKHIR');
  }
  return errors;
};
