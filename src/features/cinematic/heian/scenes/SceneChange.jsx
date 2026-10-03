// ─────────────────────────────────────────────────────────────────────────────
// SCENE 4 — そして、時代は変わる。 / 平安時代 794 — 1185 / ようこそ、平安へ。
// Visual: suasana berubah lebih GELAP (mood 'dark'), awan menebal, lalu judul
// era 平安時代 muncul sebagai "segel" dan diakhiri sambutan hangat.
//
// Gerak dari `clock`: kegelapan menebal perlahan, awan mengalir terus, cincin
// segel mengembang mulus, partikel emas naik (loop dari clock → tanpa "pop").
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';
import { CloudBand } from '../components/CloudBand';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (p) => 1 - Math.pow(1 - clamp01(p), 3);

// Partikel emas naik — posisi diturunkan dari clock (loop mulus, tanpa restart).
function Ember({ i, clock, sceneStart, reduced }) {
  const span = 7 + (i % 4);          // detik per siklus
  const delay = 4 + i * 0.4;
  const yPct = useTransform(clock, (t) => {
    if (reduced) return 0;
    const local = t - sceneStart - delay;
    if (local < 0) return 0;
    const p = ((local / span) % 1 + 1) % 1;
    return -p * 46;                   // vh
  });
  const y = useTransform(yPct, (v) => `${v}vh`);
  const op = useTransform(clock, (t) => {
    if (reduced) return 0;
    const local = t - sceneStart - delay;
    if (local < 0) return 0;
    const p = ((local / span) % 1 + 1) % 1;
    return Math.sin(p * Math.PI) * 0.6;
  });
  return (
    <motion.span
      className="absolute rounded-full"
      style={{
        left: `${12 + i * 9}%`,
        bottom: '8%',
        width: 3 + (i % 3),
        height: 3 + (i % 3),
        background: 'var(--emk-gold)',
        y,
        opacity: op,
      }}
    />
  );
}

export function SceneChange({ clock, sceneStart = 0, reduced = false, portrait = false }) {
  // Kegelapan menebal (0→1 dalam 3s).
  const darkOp = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart) / 3.0)));
  // Cincin "segel era" 平安時代 — mengembang pelan (mulai 3.6s).
  const ringOp = useTransform(clock, (t) => (reduced ? 0.5 : clamp01((t - sceneStart - 3.6) / 3.2) * 0.5));
  const ringScale = useTransform(clock, (t) => {
    if (reduced) return 1;
    return 0.9 + 0.1 * easeOut((t - sceneStart - 3.6) / 3.2);
  });

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Lapisan gelap yang menebal (perubahan zaman) */}
      <motion.div
        className="absolute inset-0"
        style={{ opacity: darkOp, background: 'radial-gradient(ellipse at center, rgba(18,14,10,0.30) 0%, rgba(12,9,6,0.62) 100%)' }}
      />

      {/* Awan menebal & mengalir (menutupi, transisi zaman) */}
      <CloudBand clock={clock} reduced={reduced} opacity={0.55} portrait={portrait} />

      {/* Cincin "segel era" 平安時代 — mengembang pelan sebagai penanda */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 'clamp(240px, 54vw, 620px)',
          height: 'clamp(240px, 54vw, 620px)',
          border: '1.5px solid color-mix(in srgb, var(--emk-gold) 60%, transparent)',
          opacity: ringOp,
          scale: ringScale,
        }}
      />

      {/* Partikel tinta halus naik (menandai akhir) */}
      {!reduced &&
        Array.from({ length: 9 }).map((_, i) => (
          <Ember key={i} i={i} clock={clock} sceneStart={sceneStart} reduced={reduced} />
        ))}
    </div>
  );
}

export default SceneChange;
