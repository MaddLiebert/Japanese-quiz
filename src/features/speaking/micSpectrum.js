// micSpectrum.js — pengolahan data spektrum mikrofon (murni: tanpa DOM/Web Audio).
// Dipakai hook useMicLevel: byte frequency data (0..255) → tinggi bar 0..1
// untuk indikator spectrum di popup mic.

export const MIC_BAR_COUNT = 20;

// Bagi bin frekuensi menjadi `barCount` band sama lebar; tiap bar = rata-rata
// band dibagi 255 (0..1). Data kosong/null → semua nol; barCount tak wajar
// (0, negatif, NaN) → minimal 1 bar.
export const spectrumBars = (freqData, barCount = MIC_BAR_COUNT) => {
  const n = Math.max(1, Math.floor(barCount) || 1);
  const out = new Array(n).fill(0);
  const len = freqData?.length || 0;
  if (!len) return out;
  for (let b = 0; b < n; b++) {
    const start = Math.floor((b * len) / n);
    const end = Math.max(start + 1, Math.floor(((b + 1) * len) / n));
    let sum = 0;
    let count = 0;
    for (let i = start; i < end && i < len; i++) {
      sum += freqData[i];
      count += 1;
    }
    out[b] = count ? Math.min(1, sum / count / 255) : 0;
  }
  return out;
};

// Tinggi bar dalam persen (0..100) dengan minimum `minPct` supaya deret tetap
// terlihat saat senyap. bars bukan array → [] (pemanggil pakai fallback animasi).
export const displayHeights = (bars, minPct = 6) => {
  if (!Array.isArray(bars)) return [];
  const min = Math.max(0, Math.min(100, Number(minPct) || 0));
  return bars.map((v) => Math.max(min, Math.min(100, Math.round((Number(v) || 0) * 100))));
};
