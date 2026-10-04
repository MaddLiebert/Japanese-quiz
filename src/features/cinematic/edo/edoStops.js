// ─────────────────────────────────────────────────────────────────────────────
// edoStops.js — Peta Edo 江戸: 8 PERHENTIAN rute naratif tema.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Titik awal 日本橋 (五街道の起点), keliling kota, keluar lewat Tōkaidō sampai
// 箱根関所. Lihat PRD docs/tema/edo.md §7.
//
// Tiap perhentian = DATA (bukan halaman baru) → mudah ditambah/dites.
// `feature` = fitur app yang terhubung (gacha/dark mode/checkpoint/shop/…).
// `last`    = perhentian terakhir = CHECKPOINT naik era (箱根関所).
// ─────────────────────────────────────────────────────────────────────────────

export const EDO_STOPS = [
  {
    n: 0,
    id: 'nihonbashi',
    jp: '日本橋',
    romaji: 'Nihonbashi',
    theme: 'すべての道の起点',
    theme_id: 'Titik awal semua jalan',
    lesson_jp: '挨拶 · 数字',
    lesson_id: 'Sapaan (aisatsu) · Angka (sūji)',
    moment: '「ここから、旅は始まる。」',
    moment_id: '“Dari sini, perjalanan dimulai.”',
    vibe: 'Ramai, pedagang, ikan segar pagi-pagi.',
    feature: 'nav',
  },
  {
    n: 1,
    id: 'asakusa',
    jp: '浅草寺',
    romaji: 'Asakusa-dera',
    theme: '雷門の町',
    theme_id: 'Kota Gerbang Kaminari',
    lesson_jp: '買い物 · 食べ物',
    lesson_id: 'Belanja (kaimono) · Makanan (tabemono)',
    moment: '「見て！お団子いっぱい！」',
    moment_id: '“Lihat! Banyak dango!”',
    vibe: 'Pasar kuil, dango, omikuji, ramai.',
    feature: 'shop',
  },
  {
    n: 2,
    id: 'ryogoku',
    jp: '両国',
    romaji: 'Ryōgoku',
    theme: '花火と相撲の町',
    theme_id: 'Kota Kembang Api & Sumo',
    lesson_jp: '祭り · 数え方',
    lesson_id: 'Festival (matsuri) · Cara menghitung',
    moment: '「音が大きい。だが、きれいだ。」',
    moment_id: '“Suaranya keras. Tapi, indah.”',
    vibe: 'Malam musim panas, cahaya, sorak orang.',
    feature: 'event',
  },
  {
    n: 3,
    id: 'ueno',
    jp: '上野',
    romaji: 'Ueno',
    theme: '桜の丘',
    theme_id: 'Bukit Sakura',
    lesson_jp: '自然 · 季節',
    lesson_id: 'Alam (shizen) · Musim (kisetsu)',
    moment: '花見 — 静かな間。',
    moment_id: 'Hanami — jeda yang tenang.',
    vibe: 'Damai, kelopak jatuh, mono no aware.',
    feature: 'rest',
  },
  {
    n: 4,
    id: 'fukagawa',
    jp: '深川',
    romaji: 'Fukagawa',
    theme: '富くじの町',
    theme_id: 'Kota Lotre Tomikuji',
    lesson_jp: '運 · 願い事',
    lesson_id: 'Keberuntungan (un) · Permohonan',
    moment: '富箱から、木札を引く。',
    moment_id: 'Tarik 木札 dari kotak 富.',
    vibe: 'Tegang-berharap, orang antre, teriakan penjaja.',
    feature: 'gacha',
  },
  {
    n: 5,
    id: 'yomise',
    jp: '吉原・夜市',
    romaji: 'Yoshiwara / Yomise',
    theme: '夜の灯',
    theme_id: 'Cahaya Malam',
    lesson_jp: '夜 · 灯り',
    lesson_id: 'Malam (yoru) · Cahaya (akari)',
    moment: '提灯が、ともる。',
    moment_id: 'Lentera 提灯 menyala.',
    vibe: 'Misterius, indah, sedikit berbahaya.',
    feature: 'dark',
  },
  {
    n: 6,
    id: 'shinagawa',
    jp: '品川宿',
    romaji: 'Shinagawa-juku',
    theme: '最初の宿場',
    theme_id: 'Pos Peristirahatan Pertama',
    lesson_jp: '旅 · 宿',
    lesson_id: 'Perjalanan (tabi) · Penginapan (yado)',
    moment: '町を出て、街道へ。',
    moment_id: 'Tinggalkan kota, masuk jalan raya.',
    vibe: 'Gerbang kota, ramai pelancong, kuda, kuli.',
    feature: 'transition',
  },
  {
    n: 7,
    id: 'hakone',
    jp: '箱根関所',
    romaji: 'Hakone Sekisho',
    theme: '江戸の果て',
    theme_id: 'Ujung Edo',
    lesson_jp: '関所 · 峠',
    lesson_id: 'Pos pemeriksaan (sekisho) · Lembah gunung (tōge)',
    moment: '関所を通れば、新たな時代へ。',
    moment_id: 'Lewati pos pemeriksaan → zaman baru.',
    vibe: 'Sunyi, berkabut, gunung, 芦ノ湖 + Fuji di kejauhan.',
    feature: 'checkpoint',
    last: true,
  },
];

// Perhentian terakhir (checkpoint naik era).
export const EDO_LAST_STOP = EDO_STOPS[EDO_STOPS.length - 1];

export const edoStopById = (id) => EDO_STOPS.find((s) => s.id === id) || null;

// Perhentian yang terhubung ke sebuah fitur app (mis. 'gacha').
export const edoStopByFeature = (feature) => EDO_STOPS.find((s) => s.feature === feature) || null;

// Validasi ringan untuk tes: nomor berurutan 0..n-1, id unik, field wajib ada,
// tepat satu checkpoint di akhir.
export const validateStops = (stops = EDO_STOPS) => {
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
