// Params kuis tulis — murni & dites (node --test). Semua angka tune ada di sini.
// Dipakai StrokeCanvas.jsx saat memanggil writer.quiz(writeQuizOptions(level, handlers)).

export const WRITE_COLORS = {
  strokeColor: '#1a1a1a',   // goresan contoh (sumi)
  outlineColor: '#c9c4b6',  // garis bayangan (kertas)
  highlightColor: '#182b49',// kilau saat goresan benar (ai)
  drawingColor: '#d3382f',  // coretan user (shu)
};

// 3 level kesulitan. Naik level = lebih sedikit bantuan + XP lebih besar.
//   trace  → jiplak bayangan (ramah pemula)
//   memory → lihat animasi SEKALI, lalu tulis tanpa bayangan
//   blind  → langsung tulis tanpa bayangan & tanpa hint
export const WRITE_LEVELS = {
  trace: {
    showOutline: true,
    preview: false,
    xp: { kana: 10, kanji: 15 },
    quiz: {
      leniency: 1.4,
      showHintAfterMisses: 3,
      highlightOnComplete: true,
      acceptBackwardsStrokes: true,
      markStrokeCorrectAfterMisses: false,
      quizStartStrokeNum: 0,
    },
  },
  memory: {
    showOutline: false,
    preview: true,
    xp: { kana: 15, kanji: 20 },
    quiz: {
      leniency: 1.1,
      showHintAfterMisses: 5,
      highlightOnComplete: true,
      acceptBackwardsStrokes: true,
      markStrokeCorrectAfterMisses: false,
      quizStartStrokeNum: 0,
    },
  },
  blind: {
    showOutline: false,
    preview: false,
    xp: { kana: 25, kanji: 35 },
    quiz: {
      leniency: 0.85,
      showHintAfterMisses: false,
      highlightOnComplete: true,
      acceptBackwardsStrokes: false,
      markStrokeCorrectAfterMisses: false,
      quizStartStrokeNum: 0,
    },
  },
};

export const DEFAULT_WRITE_LEVEL = 'trace';

// Normalisasi level tak dikenal → trace (biar UI tidak pernah crash).
export const writeLevel = (level) => WRITE_LEVELS[level] || WRITE_LEVELS[DEFAULT_WRITE_LEVEL];

// Ukuran canvas: clamp 220..360 px berdasar lebar layar.
export const writeCanvasSize = (viewportWidth = 360) => {
  const raw = Math.round(Number(viewportWidth) * 0.72);
  if (!Number.isFinite(raw)) return 260;
  return Math.max(220, Math.min(360, raw));
};

// Opsi lengkap untuk writer.quiz(). Handlers wajib dikirim supaya bisa
// disambungkan ke progress/SFX oleh komponen.
export const writeQuizOptions = (level = DEFAULT_WRITE_LEVEL, handlers = {}) => {
  const base = writeLevel(level).quiz;
  return {
    ...base,
    onCorrectStroke: handlers.onCorrectStroke || (() => {}),
    onMistake: handlers.onMistake || (() => {}),
    onComplete: handlers.onComplete || (() => {}),
  };
};
