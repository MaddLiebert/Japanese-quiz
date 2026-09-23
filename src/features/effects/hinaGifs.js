// Registry GIF reaksi Hina Chono untuk efek jawaban (pack kotodama_burst).
export const HINA_GIFS = {
  correct: [
    '/effects/HinaRight.gif',
    '/effects/HinaRight1.gif',
    '/effects/HinaRight2.gif',
    '/effects/HinaRight3.gif',
  ],
  wrong: [
    '/effects/HinaWrong.gif',
    '/effects/HinaWrong1.gif',
    '/effects/HinaWrong2.webp',
    '/effects/HinaWrong3.gif',   // ⚠️ dari belakang (tanpa muka) — hapus baris ini kalau tak mau
  ],
};

// Pilih satu GIF acak untuk kind ('correct' | 'wrong'). null kalau kind lain.
export const pickHinaGif = (kind, rng = Math.random) => {
  const list = HINA_GIFS[kind];
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(rng() * list.length)];
};

// Semua path GIF Hina (flat, unik) → dipakai untuk preload/predecode.
export const hinaGifPaths = () => {
  const out = [];
  for (const list of Object.values(HINA_GIFS)) {
    if (Array.isArray(list)) for (const p of list) if (p && !out.includes(p)) out.push(p);
  }
  return out;
};

// Preload + DECODE semua GIF Hina ke cache browser, supaya saat jawaban muncul
// GIF langsung tampil di frame pertama (tanpa jeda decode ~100-300ms yang bikin
// efek terasa telat dari suaranya). Aman dipanggil berulang.
// loader injectable untuk test; default: elemen Image.
let gifPreloaded = false;
export const preloadHinaGifs = (loader) => {
  const paths = hinaGifPaths();
  if (typeof window === 'undefined' && !loader) return paths.length;
  if (gifPreloaded && !loader) return paths.length;   // sekali saja per sesi
  gifPreloaded = true;
  const make = loader || (() => new Image());
  for (const p of paths) {
    try {
      const img = make();
      img.decoding = 'sync';        // minta decode sinkron → frame 1 siap
      img.src = p;
      if (typeof img.decode === 'function') img.decode().catch(() => {});
    } catch { /* preload gagal → abaikan, GIF tetap dimuat saat tampil */ }
  }
  return paths.length;
};


// GIF HANYA muncul saat suara Hina bunyi:
//   - salah           → Hina wrong bunyi → GIF wrong
//   - benar MILESTONE → Hina streak bunyi → GIF correct
//   - benar biasa     → Hina DIAM → null (tanpa GIF)
export const hinaGifForAnswer = (type, onMilestone = false, rng = Math.random) => {
  if (type === 'wrong') return pickHinaGif('wrong', rng);
  if (type === 'correct' && onMilestone) return pickHinaGif('correct', rng);
  return null;
};
