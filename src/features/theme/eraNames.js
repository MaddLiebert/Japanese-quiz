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
};

// Kembalikan nama era untuk `key`, atau `fallback` bila era/key tak punya nama.
export function eraName(key, eraId, fallback = '') {
  const table = eraId ? ERA_NAMES[eraId] : null;
  return (table && table[key]) || fallback;
}
