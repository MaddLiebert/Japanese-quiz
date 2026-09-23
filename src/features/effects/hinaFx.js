// ─────────────────────────────────────────────────────────────────────────────
// Vibe Hina Chono — efek jawaban bergaya anime ceria (kilau + teks reaksi).
// Murni & deterministik (rng bisa di-inject) supaya bisa dites di node.
// ─────────────────────────────────────────────────────────────────────────────

// Teks reaksi ala anime. correct = Hina diam (tanpa GIF) → tetap ada efek.
export const HINA_ANSWER_TEXT = {
  correct: '正解！',
  wrong: 'ドンマイ！',
  streak: '連続正解！',
};

export const hinaAnswerText = (kind) => HINA_ANSWER_TEXT[kind] || '';

// Partikel kilau (bintang/hati/sakura) yang melesat keluar lalu memudar.
export const hinaSparkles = (seed = 1, count = 14, rng = Math.random) => {
  const out = [];
  const chars = ['✦', '✧', '★', '♡', '❀'];
  const hues = ['#ff8fb1', '#ffd166', '#7ee0ff', '#ff6f91', '#c8a2ff'];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 70 + rng() * 150;
    out.push({
      id: `${seed}-${i}`,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 30,          // sedikit ke atas → terasa "meledak"
      rot: (rng() * 2 - 1) * 180,
      size: 12 + rng() * 22,
      delay: rng() * 0.12,
      dur: 0.6 + rng() * 0.5,
      char: chars[Math.floor(rng() * chars.length)],
      hue: hues[Math.floor(rng() * hues.length)],
    });
  }
  return out;
};
