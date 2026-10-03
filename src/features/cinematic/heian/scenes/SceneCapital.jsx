// ─────────────────────────────────────────────────────────────────────────────
// SCENE 1 — 794年 / 都は、平安京へ。  (Ibu kota pindah ke Heian-kyō)
// Visual: kertas + sapuan tinta besar yang menyapu masuk dari kiri, lalu
// mengendap jadi "gunung/lembah" samar (Heian-kyō di antara bukit).
//
// `portrait` → viewBox 400×850 + jalur versi tegak supaya sapuan TIDAK ter-zoom
// keluar layar di HP (masalah utama: viewBox landscape 1440×620 di-slice ke layar
// tegak → hanya ~20% lebar terlihat).
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (p) => 1 - Math.pow(1 - clamp01(p), 3);

// Jalur versi LANDSCAPE (viewBox 1440×620).
const L = {
  viewBox: '0 0 1440 620',
  sweep1: 'M-60 340 Q260 250 560 320 Q860 392 1160 300 Q1320 254 1520 300',
  sweep2: 'M-40 420 Q300 380 600 420 Q900 460 1200 410 Q1400 372 1560 410',
  hills: [
    { d: 'M-40 620 Q160 500 340 560 Q500 612 660 548 L660 620 Z', o: 0.30 },
    { d: 'M780 620 Q960 508 1140 566 Q1300 616 1480 556 L1480 620 Z', o: 0.26 },
  ],
  sw1: 26, sw2: 12,
};

// Jalur versi PORTRAIT (viewBox 400×850) — sapuan di tengah, bukit di bawah.
const P = {
  viewBox: '0 0 400 850',
  sweep1: 'M-30 430 Q110 355 200 415 Q292 476 430 405',
  sweep2: 'M-30 540 Q130 496 210 538 Q292 580 430 528',
  hills: [
    { d: 'M-30 850 Q110 730 205 800 Q300 858 430 786 L430 850 Z', o: 0.30 },
    { d: 'M-30 850 Q80 792 165 826 Q255 862 430 818 L430 850 Z', o: 0.24 },
  ],
  sw1: 20, sw2: 10,
};

export function SceneCapital({ clock, sceneStart = 0, reduced = false, portrait = false }) {
  const cfg = portrait ? P : L;
  // Sapuan utama tumbuh 0→1 dalam 3.6s mulai detik 0.1.
  const sweep1 = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.1) / 3.6)));
  const sweep2 = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 1.0) / 3.0)));
  // Bukit muncul setelah sapuan (2.4s).
  const hillOpacity = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 2.4) / 2.0)));
  const hillY = useTransform(clock, (t) => (reduced ? 0 : (1 - clamp01((t - sceneStart - 2.4) / 2.0)) * 16));
  // Tetes tinta di sudut.
  const dropScale = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.2) / 1.4)));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Sapuan tinta besar (brush sweep) */}
      <svg viewBox={cfg.viewBox} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="hb-s1-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--emk-ink)" stopOpacity="0" />
            <stop offset="30%" stopColor="var(--emk-ink)" stopOpacity="0.85" />
            <stop offset="70%" stopColor="var(--emk-ink)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--emk-ink)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <motion.path
          d={cfg.sweep1}
          fill="none"
          stroke="url(#hb-s1-stroke)"
          strokeWidth={cfg.sw1}
          strokeLinecap="round"
          /* TANPA filter feTurbulence/feDisplacementMap: sapuan ini tumbuh tiap
             frame (pathLength) DI DALAM lapisan yang di-zoom (Ken Burns), jadi
             filter akan di-raster ulang tiap frame → cinematic patah-patah.
             Ukur: med 33ms → 16.7ms (≈ idle) setelah filter dilepas. */
          style={{ pathLength: sweep1 }}
        />
        <motion.path
          d={cfg.sweep2}
          fill="none"
          stroke="url(#hb-s1-stroke)"
          strokeWidth={cfg.sw2}
          strokeLinecap="round"
          opacity="0.55"
          style={{ pathLength: sweep2 }}
        />

        {/* Bukit samar 山 (Heian-kyō di lembah) */}
        <motion.g style={{ opacity: hillOpacity, y: hillY }} fill="var(--emk-ink)">
          {cfg.hills.map((h, i) => (
            <path key={i} d={h.d} opacity={h.o} />
          ))}
        </motion.g>
      </svg>

      {/* Titik tinta "tetes" (ink drop) di sudut kiri-atas */}
      <motion.div
        className="absolute left-[8%] top-[14%] rounded-full"
        style={{
          width: 'clamp(10px,2.4vw,22px)',
          height: 'clamp(10px,2.4vw,22px)',
          background: 'var(--emk-ink)',
          opacity: 0.5,
          filter: 'blur(0.5px)',
          scale: dropScale,
        }}
      />
    </div>
  );
}

export default SceneCapital;
