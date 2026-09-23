// ─────────────────────────────────────────────────────────────────────────────
// Pita senam ritmik Hina Chono — mengikat kartu jawaban kuis.
// Modul PURE (tanpa React) → bisa dites `node --test`.
//
// Depth: pita = SATU band yang dilewatkan DI BELAKANG kartu.
//   frontA → STUB PENDEK di DEPAN, menempel tepi KIRI (cuma nyembul sedikit)
//   back   → band DI BELAKANG kartu (tertutup badan kartu → tak terlihat)
//   frontB → STUB PENDEK di DEPAN, menempel tepi KANAN
//   bow    → simpul kecil di ujung stub KIRI (di luar kartu)
//
// Kunci agar terbaca "satu pita menembus belakang kartu":
//   - kedua stub di TINGGI SAMA (y sama) → mata menyambungnya lewat belakang kartu
//   - stub PENDEK (cuma nyembul ±35 unit) → tidak terbaca seperti coretan panjang
//   - tidak ada bagian pita yang menutupi konten (hanya di area tepi/padding)
//
// Koordinat mengikuti HINA_RIBBON_VIEWBOX (0..400 = tepi kartu kiri..kanan).
// x<0 / x>400 = di luar kartu (masih terlihat karena SVG overflow-visible).
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
// Lebar pita (kartu bisa 800px+; 24 unit ≈ 50px di kartu 832px → tegas, bukan coretan).
export const HINA_RIBBON_STROKE = { width: 24, highlight: 7, shadow: 28 };

const SEGMENTS = {
  // Stub kiri & kanan di TINGGI SAMA + simpul di ujung stub kiri.
  // Ketiga jenis pakai tinggi konstan (rata) → mata menyambung lewat belakang kartu.
  correct: {
    frontA: 'M -38 92 C -24 90, -8 90, 8 92',
    back:   'M 8 92 C 140 96, 260 96, 392 92',
    frontB: 'M 392 92 C 408 90, 424 92, 438 96',
    bow:    'M -38 92 C -74 74, -84 42, -56 32 C -30 24, -8 48, -24 74 C -30 84, -35 90, -38 92',
  },
  wrong: {
    frontA: 'M -38 146 C -24 144, -8 144, 8 146',
    back:   'M 8 146 C 140 150, 260 150, 392 146',
    frontB: 'M 392 146 C 408 144, 424 146, 438 150',
    bow:    'M -38 146 C -74 128, -84 96, -56 86 C -30 78, -8 102, -24 128 C -30 138, -35 144, -38 146',
  },
  streak: {
    // lebih megah: stub lebih panjang + simpul lebih besar
    frontA: 'M -48 74 C -28 72, -8 72, 12 74',
    back:   'M 12 74 C 140 78, 260 78, 388 74',
    frontB: 'M 388 74 C 408 72, 428 74, 448 78',
    bow:    'M -48 74 C -96 52, -110 8, -72 -6 C -36 -18, -4 14, -26 50 C -34 64, -44 70, -48 74',
  },
};

export const hinaRibbonSegments = (kind) => SEGMENTS[kind] || SEGMENTS.correct;
