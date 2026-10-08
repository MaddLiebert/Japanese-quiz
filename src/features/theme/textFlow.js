// textFlow.js — M6 縦→横 (progresi arah teks). Modul MURNI.
// Meiji memindahkan tulisan tegak (縦) → datar (横). Sepanjang era, sebagian
// teks berputar saat naik perhentian. CSS: writing-mode + transisi.
// Spec: docs/tema/meiji-mekanik.md §M6.

// perhentian 0..7 → progresi 0..1 (0 = tegak penuh, 1 = datar penuh).
export const flowAtStop = (stopIndex) => {
  const i = Number(stopIndex) || 0;
  return Math.min(1, Math.max(0, i / 7));
};

// Ambang 0.5: di bawah → tegak, di atas → datar.
export const writingMode = (t) => ((Number(t) || 0) < 0.5 ? 'vertical-rl' : 'horizontal-tb');

// CSS custom property siap-pakai.
export const textFlowCss = (stopIndex) => {
  const t = flowAtStop(stopIndex);
  return { '--text-flow': String(t), writingMode: writingMode(t) };
};

export default flowAtStop;
