// newsPages.js — M3 第二面 (halaman belakang koran: harga yang dibayar).
// Modul MURNI (tanpa React/DOM). Nada: 「新聞は叫ばない」 — koran tidak
// berteriak; ditulis datar, tanpa drama. SELALU OPSIONAL.
// Spec: docs/tema/meiji-mekanik.md §M3.

// headline pendek + tahun, tanpa emoji/dramatisasi. stop = perhentian terkait.
export const SECOND_PAGE = [
  { id: 'chiso', year: 1873, jp: '地租改正', headline_jp: '農民一揆、各地で続く。',
    headline_id: 'Pemberontakan petani berlanjut di berbagai tempat.', stop: 'shogakko' },
  { id: 'chouhei', year: 1873, jp: '徴兵令', headline_jp: '村を出る若者、後を絶たず。',
    headline_id: 'Pemuda meninggalkan desa, tiada henti.', stop: 'tetsudo' },
  { id: 'seinan', year: 1877, jp: '西南戦争', headline_jp: '士族の乱、終わる。',
    headline_id: 'Pemberontakan samurai berakhir.', stop: 'kokkai' },
  { id: 'jiyuu', year: 1880, jp: '自由民権運動', headline_jp: '演説会、また中止に。',
    headline_id: 'Rapat pidato kembali dibatalkan.', stop: 'shimbunsha' },
  { id: 'korea', year: 1910, jp: '韓国併合', headline_jp: '半島、帝国に編入さる。',
    headline_id: 'Semenanjung dianeksasi ke kekaisaran.', stop: 'kokkai' },
];

export const pagesForStop = (stopId) => SECOND_PAGE.filter((p) => p.stop === stopId);

export const pageById = (id) => SECOND_PAGE.find((p) => p.id === id) || null;

export default SECOND_PAGE;
