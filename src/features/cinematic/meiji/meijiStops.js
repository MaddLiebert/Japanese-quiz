// ─────────────────────────────────────────────────────────────────────────────
// meijiStops.js — Peta Meiji 明治: 8 PERHENTIAN rute naratif tema.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Tur "kota yang berubah": pelabuhan dibuka → kota → pers → masyarakat → rel →
// sekolah → pameran → parlemen. Lihat PRD docs/tema/meiji.md §7.
//
// Tiap perhentian = DATA (bukan halaman baru) → mudah ditambah/dites.
// `feature` = fitur app yang terhubung (nav/dark/reading/social/transit/grammar/
// shop/checkpoint). `last` = perhentian terakhir = CHECKPOINT naik era (国会).
// ─────────────────────────────────────────────────────────────────────────────

export const MEIJI_STOPS = [
  {
    n: 0,
    id: 'yokohama',
    jp: '横浜港',
    romaji: 'Yokohama-kō',
    theme: '開国の港',
    theme_id: 'Pelabuhan Gerbang Dibuka',
    lesson_jp: '挨拶 · 新しい',
    lesson_id: 'Sapaan (aisatsu) · Kata sifat baru (新しい)',
    moment: '「ここから、新しい日本が始まる。」',
    moment_id: '“Dari sini, Jepang baru dimulai.”',
    vibe: 'Asap kapal uap, gudang, bahasa campur, bendera asing.',
    feature: 'nav',
  },
  {
    n: 1,
    id: 'ginza',
    jp: '銀座',
    romaji: 'Ginza',
    theme: '煉瓦とガスの町',
    theme_id: 'Kota Bata & Lampu Gas',
    lesson_jp: '買い物 · 数',
    lesson_id: 'Belanja (kaimono) · Angka (sūji)',
    moment: '「見て、ガス灯！夜でも明るい！」',
    moment_id: '“Lihat, lampu gas! Malam pun terang!”',
    vibe: 'Sore hari, jalan bata, lampu gas menyala satu per satu.',
    feature: 'dark',
  },
  {
    n: 2,
    id: 'shimbunsha',
    jp: '新聞社',
    romaji: 'Shimbunsha',
    theme: '活字の町',
    theme_id: 'Kota Huruf Lepas',
    lesson_jp: '読む · ニュース',
    lesson_id: 'Membaca (yomu) · Kosakata berita',
    moment: '活字を組んで、刷る。',
    moment_id: 'Huruf lepas disusun, dicetak.',
    vibe: 'Mesin cetak berdenyut, tinta, kertas bertumpuk.',
    feature: 'reading',
  },
  {
    n: 3,
    id: 'rokumeikan',
    jp: '鹿鳴館',
    romaji: 'Rokumeikan',
    theme: '洋装の社交',
    theme_id: 'Pergaulan Berpakaian Barat',
    lesson_jp: '社交 · 服装',
    lesson_id: 'Pergaulan (shakō) · Pakaian (fukusō)',
    moment: 'Nacht tenang, Saku menikmati dansa.',
    moment_id: 'Nacht canggung, Saku menikmati dansa.',
    vibe: 'Lampu gantung, musik waltz, cermin, gaun & jas.',
    feature: 'social',
  },
  {
    n: 4,
    id: 'tetsudo',
    jp: '鉄道',
    romaji: 'Tetsudō',
    theme: '煙と電信',
    theme_id: 'Asap & Telegraf',
    lesson_jp: '旅 · 時間 · 方向',
    lesson_id: 'Perjalanan (tabi) · Waktu (jikan) · Arah (hōkō)',
    moment: '時間と距離が、縮む。',
    moment_id: 'Waktu & jarak menyusut.',
    vibe: 'Uap, peluit, tiang telegraf membentang ke cakrawala.',
    feature: 'transit',
  },
  {
    n: 5,
    id: 'shogakko',
    jp: '小学校',
    romaji: 'Shōgakkō',
    theme: '学制の町',
    theme_id: 'Kota Sistem Sekolah',
    lesson_jp: '学ぶ · 文法',
    lesson_id: 'Belajar (manabu) · Tata bahasa',
    moment: '席に座り、黒板に書く。',
    moment_id: 'Duduk di bangku, menulis di papan tulis.',
    vibe: 'Ruang kelas terang, kapur, lonceng sekolah.',
    feature: 'grammar',
  },
  {
    n: 6,
    id: 'hakurankai',
    jp: '博覧会',
    romaji: 'Hakurankai',
    theme: '展示の町',
    theme_id: 'Kota Pameran',
    lesson_jp: '展示 · 比べる',
    lesson_id: 'Pameran (tenji) · Membandingkan (kuraberu)',
    moment: '品々が、並ぶ。',
    moment_id: 'Barang-barang dipajang berjajar.',
    vibe: 'Tenda besar, spanduk, kerumunan mengagumi mesin.',
    feature: 'shop',
  },
  {
    n: 7,
    id: 'kokkai',
    jp: '国会',
    romaji: 'Kokkai',
    theme: '憲法の町',
    theme_id: 'Kota Konstitusi',
    lesson_jp: '文法 + 読解',
    lesson_id: 'Sintesis Grammar + Reading',
    moment: 'ここを通れば、新しい時代へ。',
    moment_id: 'Lewati gerbang ini → zaman baru.',
    vibe: 'Ruang sidang, podium, koran melaporkan (憲法 1889 · Diet 1890).',
    feature: 'checkpoint',
    last: true,
  },
];

// Perhentian terakhir (checkpoint naik era).
export const MEIJI_LAST_STOP = MEIJI_STOPS[MEIJI_STOPS.length - 1];

export const meijiStopById = (id) => MEIJI_STOPS.find((s) => s.id === id) || null;

// Perhentian yang terhubung ke sebuah fitur app (mis. 'shop').
export const meijiStopByFeature = (feature) => MEIJI_STOPS.find((s) => s.feature === feature) || null;

// Validasi ringan untuk tes: nomor berurutan 0..n-1, id unik, field wajib ada,
// tepat satu checkpoint di akhir.
export const validateStops = (stops = MEIJI_STOPS) => {
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
