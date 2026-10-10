// ─────────────────────────────────────────────────────────────────────────────
// A14 打ち切り (Sisi gelap industri pop) — MURNI: tanpa React, tanpa DOM.
// 多元 bukan cuma keceriaan — ada HARGA di balik layar. Disajikan OPSIONAL &
// DATAR (tanpa drama). Nada: 「照明は見せない」 — lampu panggung tidak diperlihatkan.
// Spec: docs/tema/anime-mekanik.md §A14 · PRD docs/tema/anime.md §19.

// headline pendek, tanpa emoji/dramatisasi. stop = perhentian terkait.
export const DARK_PAGES = [
  { id: 'karoshi',  jp: '過労',     headline_jp: '制作現場、また徹夜。',     headline_id: 'Produksi lembur lagi.',        stop: 'seishun' },
  { id: 'enjo',     jp: '炎上',     headline_jp: '一言で、燃え広がる。',     headline_id: 'Satu ucapan, membakar luas.',  stop: 'daily' },
  { id: 'haikakin', jp: '廃課金',   headline_jp: '気づけば、財布が空。',     headline_id: 'Sadar-sadar, dompet kosong.',  stop: 'magic' },
  { id: 'chusho',   jp: '誹謗中傷', headline_jp: '言葉が、人を刺す。',       headline_id: 'Kata-kata menusuk orang.',     stop: 'kaidan' },
  { id: 'uchikiri', jp: '打ち切り', headline_jp: 'その話は、打ち切られた。', headline_id: 'Cerita itu dipotong.',         stop: 'saishukai' },
];

// Halaman gelap untuk 1 perhentian; perhentian tanpa halaman → [].
export const darkPagesForStop = (stopId) => DARK_PAGES.filter((p) => p.stop === stopId);

// Halaman berdasarkan id; tak dikenal → null (UI tidak pernah crash).
export const darkPageById = (id) => DARK_PAGES.find((p) => p.id === id) || null;

// Tidak ada emoji/dramatisasi (nada datar). Cek rentang emoji umum.
const HAS_EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

// Validasi bank (dipakai test & editor konten).
export const validateDarkPages = (bank = DARK_PAGES) => {
  const errors = [];
  const ids = bank.map((p) => p?.id);
  if (new Set(ids).size !== ids.length) errors.push('ada id duplikat');
  for (const p of bank) {
    const tag = p?.id || '?';
    if (!p?.id) errors.push('halaman tanpa id');
    if (!p?.jp) errors.push(`${tag}: jp kosong`);
    if (!p?.headline_jp) errors.push(`${tag}: headline_jp kosong`);
    if (!p?.headline_id) errors.push(`${tag}: headline_id kosong`);
    if (!p?.stop) errors.push(`${tag}: stop kosong`);
    if (HAS_EMOJI.test(`${p?.headline_jp || ''}${p?.headline_id || ''}`)) errors.push(`${tag}: ada emoji (nada harus datar)`);
  }
  return errors;
};

export default DARK_PAGES;
