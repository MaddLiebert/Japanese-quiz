// ─────────────────────────────────────────────────────────────────────────────
// showaStops.js — Peta Shōwa 昭和: 8 PERHENTIAN rute naratif tema.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Tur "dari abu ke menara": 焼け跡 → 闇市 → 団地 → 東京タワー → 新幹線 →
// オリンピック → 万博 → 卒業. Lihat PRD docs/tema/showa.md §7.
//
// Tiap perhentian = DATA (bukan halaman baru) → mudah ditambah/dites.
// `feature` = fitur app yang terhubung (nav/dark/reading/social/transit/grammar/
// shop/checkpoint). `last` = perhentian terakhir = CHECKPOINT naik era (卒業/N5).
// ─────────────────────────────────────────────────────────────────────────────

export const SHOWA_STOPS = [
  {
    n: 0,
    id: 'yakeato',
    jp: '焼け跡',
    romaji: 'Yakeato',
    theme: '灰からの出発',
    theme_id: 'Berangkat dari Abu',
    lesson_jp: '挨拶 · 復興',
    lesson_id: 'Sapaan (aisatsu) · Pemulihan (fukkō)',
    moment: '「ここから、また始める。」',
    moment_id: '“Dari sini, kita mulai lagi.”',
    vibe: 'Sunyi, abu, langit luas, orang berdiri di tanah rata.',
    feature: 'nav',
  },
  {
    n: 1,
    id: 'yamichi',
    jp: '闇市',
    romaji: 'Yamichi',
    theme: '生き延びる町',
    theme_id: 'Kota yang Bertahan Hidup',
    lesson_jp: '食べ物 · 売る/買う',
    lesson_id: 'Makanan (tabemono) · Menjual/Membeli',
    moment: '「あたたかい…。」',
    moment_id: '“…Hangat.”',
    vibe: 'Lampu bohlam gantung, asap, kerumunan, hidup keras.',
    feature: 'reading',
  },
  {
    n: 2,
    id: 'danchi',
    jp: '団地',
    romaji: 'Danchi',
    theme: 'コンクリートの家',
    theme_id: 'Rumah Beton',
    lesson_jp: '家族 · 部屋',
    lesson_id: 'Keluarga (kazoku) · Kamar (heya)',
    moment: '「ここが、私たちの家。」',
    moment_id: '“Ini rumah kita.”',
    vibe: 'Koridor beton, jendela seragam, cucian di balkon.',
    feature: 'grammar',
  },
  {
    n: 3,
    id: 'tokyo-tower',
    jp: '東京タワー',
    romaji: 'Tōkyō Tawā',
    theme: '1958 · 復興の塔',
    theme_id: '1958 · Menara Pemulihan',
    lesson_jp: '高い · 上',
    lesson_id: 'Tinggi (takai) · Naik (agaru)',
    moment: '「街が、こんなに大きくなった。」',
    moment_id: '“Kota ini sudah sebesar ini.”',
    vibe: 'Sore, merah-putih, kota terbentang dari dek observasi.',
    feature: 'dark',
  },
  {
    n: 4,
    id: 'shinkansen',
    jp: '新幹線',
    romaji: 'Shinkansen',
    theme: '1964 · 速さ',
    theme_id: '1964 · Kecepatan',
    lesson_jp: '速い · 時間',
    lesson_id: 'Cepat (hayai) · Waktu (jikan)',
    moment: '「時間と距離が、縮む。」',
    moment_id: '“Waktu dan jarak menyusut.”',
    vibe: 'Hidung biru-putih, peron, peluit, kecepatan.',
    feature: 'transit',
  },
  {
    n: 5,
    id: 'orinpikku',
    jp: 'オリンピック',
    romaji: 'Orinpikku',
    theme: '1964 · 誇り',
    theme_id: '1964 · Kebanggaan Nasional',
    lesson_jp: 'スポーツ · 勝つ',
    lesson_id: 'Olahraga · Menang (katsu)',
    moment: '「世界が、ここに来た。」',
    moment_id: '“Dunia datang ke sini.”',
    vibe: 'Stadion penuh, bendera, massa penonton di tribun beton.',
    feature: 'social',
  },
  {
    n: 6,
    id: 'banpaku',
    jp: '万博',
    romaji: 'Banpaku',
    theme: '1970 · 未来',
    theme_id: '1970 · Masa Depan',
    lesson_jp: '未来 · 夢',
    lesson_id: 'Masa depan (mirai) · Mimpi (yume)',
    moment: '「未来は、すぐそこにある。」',
    moment_id: '“Masa depan ada di depan mata.”',
    vibe: 'Tenda besar, monorel, 太陽の塔 (siluet) bermuka tiga.',
    feature: 'shop',
  },
  {
    n: 7,
    id: 'sotsugyo',
    jp: '卒業',
    romaji: 'Sotsugyō',
    theme: '試験の町',
    theme_id: 'Kota Ujian',
    lesson_jp: '総復習 · N5',
    lesson_id: 'Sintesis semua (kana + kotoba + kanji + grammar + reading)',
    moment: '「ここまで、来たね。」',
    moment_id: '“Kita sudah sampai sejauh ini, ya.”',
    vibe: 'Ruang ujian sunyi, jam dinding, 蛍の光 saat lulus.',
    feature: 'checkpoint',
    last: true,
  },
];

// Perhentian terakhir = CHECKPOINT naik era (卒業 · ujian N5).
export const SHOWA_LAST_STOP = SHOWA_STOPS[SHOWA_STOPS.length - 1];

export const showaStopById = (id) => SHOWA_STOPS.find((s) => s.id === id) || null;
export const showaStopByFeature = (feature) => SHOWA_STOPS.find((s) => s.feature === feature) || null;

// Validasi ringan untuk tes: nomor berurutan, id unik, field lengkap, 1 checkpoint.
export const validateStops = (stops = SHOWA_STOPS) => {
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
