// ─────────────────────────────────────────────────────────────────────────────
// CloudBand — awan Yamato-e (kumo 雲) yang mengalir TERUS-MENERUS.
//
// Gerak diturunkan dari `clock` (MotionValue detik absolut), bukan animasi loop
// yang di-restart → benar-benar mulus tanpa "pop" saat siklus mengulang, dan
// tiap pita punya kecepatan/fase sendiri (parallax berlapis).
//
// `portrait` → viewBox diringkas (360×640) supaya awan TIDAK ter-zoom keluar
// layar di HP (lihat useIsPortrait). `reduced` → awan diam.
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

// Bentuk awan versi LANDSCAPE (viewBox 1440×620).
const BANDS_L = [
  { d: 'M-160 150 Q120 92 340 150 T800 150 T1280 150 T1760 150 T2160 150', w: 3.4, o: 0.30, speed: 10, phase: 0 },
  { d: 'M-160 250 Q160 198 400 250 T860 250 T1340 250 T1800 250 T2200 250', w: 2.4, o: 0.22, speed: 15, phase: 40 },
  { d: 'M-160 360 Q140 314 380 360 T840 360 T1320 360 T1780 360 T2180 360', w: 3.0, o: 0.17, speed: 7, phase: 80 },
  { d: 'M-160 470 Q180 428 420 470 T880 470 T1360 470 T1820 470 T2220 470', w: 2.0, o: 0.13, speed: 20, phase: 120 },
];

// Bentuk awan versi PORTRAIT (viewBox 360×640) — pola 220 lebar, pita lebih pendek.
const BANDS_P = [
  { d: 'M-40 150 Q60 110 140 150 T320 150 T500 150 T680 150', w: 3.2, o: 0.30, speed: 6, phase: 0 },
  { d: 'M-40 280 Q70 244 160 280 T340 280 T520 280 T700 280', w: 2.3, o: 0.22, speed: 9, phase: 40 },
  { d: 'M-40 410 Q60 372 150 410 T330 410 T510 410 T690 410', w: 2.8, o: 0.17, speed: 4.5, phase: 80 },
  { d: 'M-40 540 Q70 506 160 540 T340 540 T520 540 T700 540', w: 1.9, o: 0.13, speed: 12, phase: 120 },
];

// Geser horizontal tanpa batas (modulo lebar pola) → loop mulus.
function useDriftX(clock, speed, phase, reduced, period) {
  return useTransform(clock, (t) => {
    if (reduced) return 0;
    const per = period / speed;              // detik per siklus
    const p = ((t / per + phase / 360) % 1 + 1) % 1;
    return -period + p * period;
  });
}

function Band({ band, clock, reduced, period }) {
  const x = useDriftX(clock, band.speed, band.phase, reduced, period);
  return (
    <motion.path
      d={band.d}
      fill="none"
      stroke="url(#hb-cloud)"
      strokeWidth={band.w}
      strokeLinecap="round"
      opacity={band.o}
      style={{ x }}
    />
  );
}

export function CloudBand({ clock, reduced = false, opacity = 1, portrait = false }) {
  const bands = portrait ? BANDS_P : BANDS_L;
  const period = portrait ? 220 : 720;
  return (
    <svg
      viewBox={portrait ? '0 0 360 640' : '0 0 1440 620'}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hb-cloud" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--emk-ink)" stopOpacity="0" />
          <stop offset="18%" stopColor="var(--emk-ink)" stopOpacity="0.9" />
          <stop offset="82%" stopColor="var(--emk-ink)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--emk-ink)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {bands.map((b, i) => (
        <Band key={i} band={b} clock={clock} reduced={reduced} period={period} />
      ))}
    </svg>
  );
}

export default CloudBand;
