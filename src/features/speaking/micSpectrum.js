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

// Energi puncak dari satu set bar (0..1) — dipakai untuk denyut ikon mic.
export const peakLevel = (bars) => {
  if (!Array.isArray(bars) || !bars.length) return 0;
  let m = 0;
  for (const v of bars) {
    const n = Number(v) || 0;
    if (n > m) m = n;
  }
  return Math.min(1, m);
};

// Level keseluruhan (RMS semua bin frekuensi, 0..1). Beda dengan peakLevel yang
// melihat puncak satu band; ini rata-rata energi — lebih stabil untuk indikator.
export const euclideanLevel = (freqData) => {
  const len = freqData?.length || 0;
  if (!len) return 0;
  let sum = 0;
  for (let i = 0; i < len; i++) {
    const v = (Number(freqData[i]) || 0) / 255;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / len));
};

// Bar sintetis dari SATU level skalar (0..1) — dipakai saat perangkat tidak boleh
// membuka stream getUserMedia kedua (HP: rebutan mic). Tiap bar punya bobot tetap
// (busur tengah + riak sinus) sehingga deret terlihat seperti spektrum, dan
// TINGGINYA ikut naik-turun mengikuti suara. Deterministik → bisa dites.
export const synthBars = (level, barCount = MIC_BAR_COUNT) => {
  const n = Math.max(1, Math.floor(barCount) || 1);
  const lv = Math.max(0, Math.min(1, Number(level) || 0));
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const center = n > 1 ? 1 - Math.abs((i - (n - 1) / 2) / ((n - 1) / 2)) : 1;
    const ripple = 0.5 + 0.5 * Math.sin(i * 1.7 + lv * 6);
    out[i] = Math.min(1, lv * (0.45 + 0.35 * center + 0.2 * ripple));
  }
  return out;
};
