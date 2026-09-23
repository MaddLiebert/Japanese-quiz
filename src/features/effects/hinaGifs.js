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

// GIF HANYA muncul saat suara Hina bunyi:
//   - salah           → Hina wrong bunyi → GIF wrong
//   - benar MILESTONE → Hina streak bunyi → GIF correct
//   - benar biasa     → Hina DIAM → null (tanpa GIF)
export const hinaGifForAnswer = (type, onMilestone = false, rng = Math.random) => {
  if (type === 'wrong') return pickHinaGif('wrong', rng);
  if (type === 'correct' && onMilestone) return pickHinaGif('correct', rng);
  return null;
};
