// ─────────────────────────────────────────────────────────────────────────────
// Pita senam ritmik Hina Chono — mengikat kartu jawaban kuis.
// Modul PURE (tanpa React) → bisa dites `node --test`.
//
// Depth: pita = SATU jalur menerus yang dipotong di satu titik.
//   front → digambar DI DEPAN kartu (z-20)
//   back  → digambar DI BELAKANG kartu (z-0, tertutup badan kartu)
// Akhir `front` == awal `back` (titik potong ±x=250) → pita tampak menembus kartu.
//   bow   → simpul pita (di depan).
// Koordinat mengikuti HINA_RIBBON_VIEWBOX (0..400). Gaya `streak` lebih megah.
// ─────────────────────────────────────────────────────────────────────────────

export const HINA_RIBBON_KINDS = ['correct', 'wrong', 'streak'];

// Palet pink Hina (selaras hinaFx.js) + highlight & tepi.
export const HINA_RIBBON_COLORS = {
  correct: { base: '#ff4d94', light: '#ffd0e4', edge: '#c92f6f' },
  wrong:   { base: '#e0568f', light: '#f6c9da', edge: '#a83a66' },
  streak:  { base: '#ff4d94', light: '#ffe0ee', edge: '#d4af37' }, // megah: aksen emas
};

export const hinaRibbonColors = (kind) => HINA_RIBBON_COLORS[kind] || HINA_RIBBON_COLORS.correct;

export const HINA_RIBBON_VIEWBOX = '0 0 400 400';
export const HINA_RIBBON_STROKE = { width: 14, highlight: 4, shadow: 16 };

const SEGMENTS = {
  correct: {
    front: 'M -20 70 C 90 24, 190 34, 250 96',
    back:  'M 250 96 C 300 150, 330 200, 420 300',
    bow:   'M -20 70 C 26 104, 66 58, 104 88 C 132 110, 116 152, 78 146 C 44 140, 16 112, -20 122',
  },
  wrong: {
    front: 'M -20 40 C 80 58, 170 108, 236 176',
    back:  'M 236 176 C 270 214, 300 280, 420 400',
    bow:   'M -20 40 C 22 74, 60 36, 96 64 C 120 84, 106 122, 70 116 C 38 110, 12 84, -20 92',
  },
  streak: {
    // lebih megah: naik dulu, simpul lebih besar, lengkung lebih panjang
    front: 'M -20 120 C 60 10, 200 10, 250 92',
    back:  'M 250 92 C 305 150, 345 240, 420 350',
    bow:   'M -20 120 C 10 168, 70 96, 116 128 C 152 154, 132 208, 86 198 C 44 188, 12 152, -20 164',
  },
};

export const hinaRibbonSegments = (kind) => SEGMENTS[kind] || SEGMENTS.correct;
