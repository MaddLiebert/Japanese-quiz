// micSpectrum.js — pengolahan data spektrum mikrofon (murni: tanpa DOM/Web Audio).
// CATATAN: sejak perbaikan deteksi suara di HP, MicOverlay memakai animasi CSS
// murni (tanpa getUserMedia) supaya tidak merebut mikrofon dari
// SpeechRecognition. Helper di sini tetap dipakai untuk pemrosesan sinyal
// (dan test-nya), tersedia bila meter real dibutuhkan lagi (mis. di desktop
// dengan izin mic terpisah).

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
