// Params kuis tulis — murni & dites (node --test). Semua angka tune ada di sini.
// Dipakai StrokeCanvas.jsx saat memanggil writer.quiz(writeQuizOptions(mode, handlers)).

export const WRITE_COLORS = {
  strokeColor: '#1a1a1a',   // goresan contoh (sumi)
  outlineColor: '#c9c4b6',  // garis bayangan (kertas)
  highlightColor: '#182b49',// kilau saat goresan benar (ai)
  drawingColor: '#d3382f',  // coretan user (shu)
};

const LIGHT = {
  leniency: 1.4,
  showHintAfterMisses: 3,
  highlightOnComplete: true,
  acceptBackwardsStrokes: true,
  markStrokeCorrectAfterMisses: false,
  quizStartStrokeNum: 0,
};

const STRICT = {
  leniency: 0.9,
  showHintAfterMisses: false,
  highlightOnComplete: true,
  acceptBackwardsStrokes: false,
  markStrokeCorrectAfterMisses: false,
  quizStartStrokeNum: 0,
};

// Ukuran canvas: clamp 220..360 px berdasar lebar layar.
export const writeCanvasSize = (viewportWidth = 360) => {
  const raw = Math.round(Number(viewportWidth) * 0.72);
  if (!Number.isFinite(raw)) return 260;
  return Math.max(220, Math.min(360, raw));
};

// Opsi lengkap untuk writer.quiz(). Handlers wajib dikirim supaya bisa
// disambungkan ke progress/SFX oleh komponen.
export const writeQuizOptions = (mode = 'light', handlers = {}) => {
  const base = mode === 'strict' ? STRICT : LIGHT;
  return {
    ...base,
    onCorrectStroke: handlers.onCorrectStroke || (() => {}),
    onMistake: handlers.onMistake || (() => {}),
    onComplete: handlers.onComplete || (() => {}),
  };
};
