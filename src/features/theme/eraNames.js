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
};

// Kembalikan nama era untuk `key`, atau `fallback` bila era/key tak punya nama.
export function eraName(key, eraId, fallback = '') {
  const table = eraId ? ERA_NAMES[eraId] : null;
  return (table && table[key]) || fallback;
}
