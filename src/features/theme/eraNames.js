// eraNames.js — nama UI per-era. Modul MURNI (tanpa React/DOM) → mudah dites.
// Heian memakai istilah klasik (市 pasar, 貝合わせ kai-awase, 文 mon, …).
// Era lain = nama sekarang (fallback diberikan pemanggil).
// Lihat PRD: docs/tema/heian.md §11.
const ERA_NAMES = {
  heian: {
    shop: '市',        // pasar
    gacha: '貝合わせ',  // permainan mencocokkan kerang
    medaru: '文',      // koin kuno
    inventory: '箪笥',  // lemari penyimpanan
    profile: '系図',    // silsilah/daftar keluarga
    quest: '日課',      // tugas harian
    rank: '位',        // peringkat istana (位階)
  },
  // Edo 江戸 — kota cetak: pedagang & perajin (chōnin), bukan istana.
  // Lihat PRD: docs/tema/edo.md §8.
  edo: {
    shop: '問屋',       // toiya — pedagang besar/grosir
    gacha: '富くじ',     // tomikuji — lotre 木札 dari 富箱
    medaru: '両',       // ryō — mata uang Edo
    inventory: '風呂敷',  // furoshiki — kain pembungkus barang
    profile: '人別帳',   // ninbetsuchō — daftar penduduk
    quest: '奉公',       // hōkō — pengabdian/kerja
    rank: '番付',       // banzuke — daftar peringkat (sumo)
  },
  // Meiji 明治 — kota surat kabar: 文明開化, istilah zaman modern.
  // Lihat PRD: docs/tema/meiji.md §16.
  meiji: {
    shop: '商店',       // shōten — toko modern
    gacha: '福引',      // fukubiki — undian berhadiah (berputar)
    medaru: '円',       // en — mata uang Meiji (1871)
    inventory: '鞄',    // kaban — tas (barang modern)
    profile: '戸籍',    // koseki — catatan keluarga (sistem Meiji 1871)
    quest: '課業',      // kagyō — pelajaran/tugas sekolah
    rank: '階級',       // kaikyū — kelas/peringkat sosial baru
  },
  // Shōwa 昭和 — kota beton & ujian: pasca-perang, gachapon, 偏差値.
  // Lihat PRD: docs/tema/showa.md §8. Pemain Lv 100 sudah mahir → kanji penuh.
  showa: {
    shop: '商店街',      // shōtengai — jalan belanja pasca-perang
    gacha: 'ガチャガチャ', // gachagacha — mesin kapsul (lahir 1965)
    medaru: '円',       // en — yen bertahan (新円 1946)
    inventory: 'ランドセル', // randoseru — tas sekolah Shōwa
    profile: '履歴書',    // rirekisho — CV/résumé, dokumen Shōwa
    quest: '宿題',       // shukudai — PR sekolah
    rank: '偏差値',      // hensachi — skor ujian (inti tema)
  },
  // 多元 Anime Multiverse — era KANVAS: budaya pop (オノマトペ, 推し活, arcade).
  // Lihat PRD: docs/tema/anime.md §8. Pemain Lv 150 sudah lewat N5 → kanji +
  // KATAKANA + romaji campur (bahasa pop). Satu-satunya era dengan 3 lapis
  // (ERA → FRANCHISE → KARAKTER) — nama UI di bawah = kanvas/dunia.
  anime: {
    shop: '物販',        // butsuhan — booth jual merch di konvensi
    gacha: 'クレーンゲーム', // crane game — UFO catcher arcade
    medaru: 'コイン',     // koin — mata uang arcade
    inventory: 'リュック',  // rikku — ransel pop
    profile: '名刺',      // meishi — kartu tukar (推し活)
    quest: 'デイリー',     // daily — misi harian = episode
    rank: '戦闘力',       // sentōryoku — "power level" (trope anime)
  },
  // 電脳 Cyberpunk — era TERAKHIR, paling MAJU: malam abadi 「常夜」, rumah
  // Nacht & Saku (AI). Paling banyak KATAKANA (kata serapan = zaman paling
  // modern). Lihat PRD: docs/tema/cyberpunk.md §8.1.
  cyberpunk: {
    shop: '闇市',        // yamiichi — pasar gelap
    gacha: 'ハック',      // hakku — membobol data (undian)
    medaru: 'クレジット',  // kurejitto — kredit (mata uang)
    inventory: 'アーカイブ', // ākaibu — arsip data
    profile: '電脳ID',    // dennō ID — identitas digital
    quest: '任務',        // ninmu — misi
    rank: '権限',         // kengen — hak akses
  },
};

// Kembalikan nama era untuk `key`, atau `fallback` bila era/key tak punya nama.
export function eraName(key, eraId, fallback = '') {
  const table = eraId ? ERA_NAMES[eraId] : null;
  return (table && table[key]) || fallback;
}
