// ─────────────────────────────────────────────────────────────────────────────
// Pixel-art chibi Hina Chono — digambar 100% dari data kode (tanpa aset).
// Modul PURE → bisa dites `node --test`. '.' = transparan.
// ─────────────────────────────────────────────────────────────────────────────

export const HINA_CHIBI_PALETTE = {
  '.': null,      // transparan
  H: '#ff4d94',   // rambut pink (terang)
  h: '#e0568f',   // rambut pink (gelap)
  S: '#ffe3c2',   // kulit
  E: '#3a2a2a',   // mata
  M: '#d94a86',   // pipi/mulut
  W: '#fdfcf9',   // putih (baju)
  B: '#182b49',   // aksen seragam
};

// 12 kolom × 14 baris (boleh diubah selama tes tetap lolos).
export const HINA_CHIBI_PIXELS = [
  '....HHHH....',
  '..HHHHHHHH..',
  '.HHhHHHHhHH.',
  '.HHSSSSSSHH.',
  '.HHSESSESHH.',
  '.HHSSMMSSHH.',
  '..HSSSSSSH..',
  '...HSSSSH...',
  '..WWWWWWWW..',
  '.WWBBBBBBWW.',
  '.WWBBBBBBWW.',
  '..WWWWWWWW..',
  '...WW..WW...',
  '..SS....SS..',
];

export const HINA_CHIBI_PX = 6;
export const HINA_CHIBI_ROWS = HINA_CHIBI_PIXELS.length;
export const HINA_CHIBI_COLS = HINA_CHIBI_PIXELS[0].length;
export const HINA_CHIBI_W = HINA_CHIBI_COLS * HINA_CHIBI_PX;
export const HINA_CHIBI_H = HINA_CHIBI_ROWS * HINA_CHIBI_PX;

export const hinaChibiRects = () => {
  const out = [];
  HINA_CHIBI_PIXELS.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = HINA_CHIBI_PALETTE[ch];
      if (!color) return;
      out.push({ x: x * HINA_CHIBI_PX, y: y * HINA_CHIBI_PX, w: HINA_CHIBI_PX, h: HINA_CHIBI_PX, color });
    });
  });
  return out;
};
