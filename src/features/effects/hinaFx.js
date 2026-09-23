// ─────────────────────────────────────────────────────────────────────────────
// Vibe Hina Chono — efek jawaban bergaya anime ceria (kilau + teks reaksi).
// Palet warna mengikuti Hina (pink rambutnya). Murni & deterministik supaya
// bisa dites di node (rng bisa di-inject).
// ─────────────────────────────────────────────────────────────────────────────

// Teks reaksi ala anime. correct = Hina diam (tanpa GIF) → tetap ada efek.
export const HINA_ANSWER_TEXT = {
  correct: '正解！',
  wrong: 'ドンマイ！',
  streak: '連続正解！',
};

export const hinaAnswerText = (kind) => HINA_ANSWER_TEXT[kind] || '';

// Warna teks — pink khas Hina. Salah sedikit lebih pekat (rose) biar beda nada.
export const HINA_TEXT_COLOR = {
  correct: '#ff4d94',
  wrong: '#e0568f',
  streak: '#ff4d94',
};

export const hinaTextColor = (kind) => HINA_TEXT_COLOR[kind] || '#ff4d94';

// Jumlah kilau per jenis: benar & streak paling ramai (biar jelas terlihat).
export const HINA_SPARKLE_COUNT = { correct: 20, wrong: 10, streak: 24 };

export const hinaSparkleCount = (kind) => HINA_SPARKLE_COUNT[kind] ?? 14;

// Partikel kilau (bintang/hati/sakura) yang melesat keluar lalu memudar.
// Palet dibatasi pink / gold / putih supaya senada dengan Hina.
export const HINA_SPARKLE_CHARS = ['✦', '✧', '★', '♡', '❀'];
export const HINA_SPARKLE_HUES = ['#ff4d94', '#ff8fb1', '#ffd166', '#ffffff', '#ffb3d1'];

export const hinaSparkles = (seed = 1, count = 14, rng = Math.random) => {
  const out = [];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 80 + rng() * 170;
    out.push({
      id: `${seed}-${i}`,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 30,          // sedikit ke atas → terasa "meledak"
      rot: (rng() * 2 - 1) * 180,
      size: 14 + rng() * 26,
      delay: rng() * 0.12,
      dur: 0.6 + rng() * 0.5,
      char: HINA_SPARKLE_CHARS[Math.floor(rng() * HINA_SPARKLE_CHARS.length)],
      hue: HINA_SPARKLE_HUES[Math.floor(rng() * HINA_SPARKLE_HUES.length)],
    });
  }
  return out;
};
