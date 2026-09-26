// useMicLevel.js — level suara mikrofon real-time untuk popup mic (hook browser).
// getUserMedia → AnalyserNode → rAF → spectrumBars. Return: number[] 0..1,
// atau null kalau level suara tidak tersedia (izin ditolak / tidak didukung) —
// pemanggil memakai fallback animasi CSS.
import { useEffect, useState } from 'react';
import { MIC_BAR_COUNT, spectrumBars } from './micSpectrum';

export function useMicLevel({ active = false, barCount = MIC_BAR_COUNT } = {}) {
  const [bars, setBars] = useState(null);

  useEffect(() => {
    if (!active) {
      setBars(null);
      return undefined;
    }
    const media = typeof navigator !== 'undefined' ? navigator.mediaDevices : null;
    const AudioCtor = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
    if (!media?.getUserMedia || !AudioCtor) {
      setBars(null);
      return undefined;
    }

    let cancelled = false;
    let stream = null;
    let ctx = null;
    let analyser = null;
    let data = null;
    let raf = 0;
    let last = 0;

    const tick = (ts) => {
      if (cancelled) return;
      if (ts - last >= 33) {   // ~30fps: cukup halus, hemat render
        last = ts;
        analyser.getByteFrequencyData(data);
        setBars(spectrumBars(data, barCount));
      }
      raf = requestAnimationFrame(tick);
    };

    media.getUserMedia({ audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        ctx = new AudioCtor();
        // AudioContext dibuat di luar gesture click → bisa 'suspended';
        // user sudah klik tombol mic (sticky activation) jadi resume() jalan.
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
          const p = ctx.resume();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
        const source = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 64;                 // 32 bin frekuensi
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        data = new Uint8Array(analyser.frequencyBinCount);
        raf = requestAnimationFrame(tick);
      })
      .catch(() => { if (!cancelled) setBars(null); });

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {});
    };
  }, [active, barCount]);

  return bars;
}

export default useMicLevel;
