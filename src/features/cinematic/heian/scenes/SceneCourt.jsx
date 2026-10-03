// ─────────────────────────────────────────────────────────────────────────────
// SCENE 2 — 貴族たちは、宮廷に文化を咲かせた。 (Kaum bangsawan & budaya istana)
// Visual: istana shinden-zukuri di atas awan Yamato-e, bulan 月, awan bergerak
// sangat lambat. Tidak ramai — banyak "ma" (ruang kosong).
//
// `portrait` → istana digambar ulang untuk viewBox 400×850 (bangunan di tengah,
// sayap dirapatkan) supaya tidak terpotong di HP.
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';
import { CloudBand } from '../components/CloudBand';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (p) => 1 - Math.pow(1 - clamp01(p), 3);

// ── Jalur istana versi LANDSCAPE (viewBox 1440×620) ──────────────────────────
const L = {
  viewBox: '0 0 1440 620',
  main: { sw: 3.2, o: 0.74, paths: [
    ['M520 400 Q720 306 920 400', 3.2, 0.74],
    ['M498 400 Q720 292 942 400', 2.2, 0.5],
    ['M556 400 L556 452 M884 400 L884 452', 3.2, 0.74],
    ['M620 406 L620 452 M820 406 L820 452', 2, 0.5],
  ] },
  wings: { sw: 2.8, o: 0.6, paths: [
    ['M330 442 Q430 388 530 442', 2.8, 0.6],
    ['M910 442 Q1010 388 1110 442', 2.8, 0.6],
    ['M370 442 L370 480 M490 446 L490 480', 1.8, 0.5],
    ['M950 446 L950 480 M1070 442 L1070 480', 1.8, 0.5],
  ] },
  gate: { sw: 2, o: 0.48, paths: [
    ['M690 452 L690 500 M750 452 L750 500', 2, 0.48],
    ['M660 500 L780 500', 2, 0.48],
  ] },
  pine: { sw: 2.6, o: 0.5, paths: [
    ['M180 620 L180 470', 2.6, 0.5],
    ['M180 500 Q152 486 128 492', 2.6, 0.5],
    ['M180 470 Q162 452 140 450', 2.6, 0.5],
    ['M180 470 Q200 452 224 450', 2.6, 0.5],
    ['M180 530 Q158 518 138 522', 2.6, 0.5],
  ] },
  grass: { sw: 1.8, o: 0.26, paths: [
    ['M420 620 Q414 596 400 588', 1.8, 0.26],
    ['M432 620 Q438 594 452 586', 1.8, 0.26],
    ['M1000 620 Q994 598 980 590', 1.8, 0.26],
  ] },
};

// ── Jalur istana versi PORTRAIT (viewBox 400×850) — bangunan di tengah ────────
const P = {
  viewBox: '0 0 400 850',
  main: { sw: 2.8, o: 0.74, paths: [
    ['M110 470 Q200 372 290 470', 2.8, 0.74],
    ['M96 470 Q200 356 304 470', 2, 0.5],
    ['M132 470 L132 522 M268 470 L268 522', 2.8, 0.74],
    ['M162 476 L162 522 M238 476 L238 522', 1.8, 0.5],
  ] },
  wings: { sw: 2.4, o: 0.58, paths: [
    ['M56 522 Q110 470 168 522', 2.4, 0.58],
    ['M232 522 Q290 470 344 522', 2.4, 0.58],
    ['M78 522 L78 560 M146 526 L146 560', 1.6, 0.48],
    ['M254 526 L254 560 M322 522 L322 560', 1.6, 0.48],
  ] },
  gate: { sw: 1.8, o: 0.48, paths: [
    ['M182 522 L182 572 M218 522 L218 572', 1.8, 0.48],
    ['M160 572 L240 572', 1.8, 0.48],
  ] },
  pine: { sw: 2.4, o: 0.46, paths: [
    ['M52 850 L52 700', 2.4, 0.46],
    ['M52 730 Q30 718 12 724', 2.4, 0.46],
    ['M52 700 Q36 684 18 682', 2.4, 0.46],
    ['M52 700 Q68 684 88 682', 2.4, 0.46],
    ['M52 762 Q34 750 16 754', 2.4, 0.46],
  ] },
  grass: { sw: 1.6, o: 0.24, paths: [
    ['M150 850 Q146 826 134 818', 1.6, 0.24],
    ['M162 850 Q168 824 180 816', 1.6, 0.24],
    ['M250 850 Q246 830 236 822', 1.6, 0.24],
  ] },
};

function Group({ cfg, style }) {
  return (
    <motion.g style={style} stroke="var(--emk-ink)" fill="none" strokeLinecap="round">
      {cfg.paths.map(([d, sw, o], i) => (
        <path key={i} d={d} strokeWidth={sw} opacity={o} />
      ))}
    </motion.g>
  );
}

export function SceneCourt({ clock, sceneStart = 0, reduced = false, portrait = false }) {
  const cfg = portrait ? P : L;

  // Bulan terbit pelan (2.6s).
  const moonOp = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart) / 2.6)));
  const moonY = useTransform(clock, (t) => (reduced ? 0 : (1 - easeOut(clamp01((t - sceneStart) / 2.6))) * 22));
  const moonScale = useTransform(clock, (t) => (reduced ? 1 : 0.94 + 0.06 * easeOut(clamp01((t - sceneStart) / 2.6))));
  const moonGlow = useTransform(clock, (t) => (reduced ? 0.35 : 0.3 + 0.05 * (1 + Math.sin((t / 9) * Math.PI * 2))));
  const moonShadow = useTransform(moonGlow, (v) => `0 0 ${40 + v * 60}px rgba(176,138,30,${v})`);

  // Istana naik halus (mulai 1.0s).
  const courtOp = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 1.0) / 2.4)));
  const courtY = useTransform(clock, (t) => (reduced ? 0 : (1 - easeOut(clamp01((t - sceneStart - 1.0) / 2.4))) * 20));
  const pineOp = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 1.6) / 2.0)));
  const grassOp = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 1.9) / 1.6)));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Bulan 月 — muncul pelan di kanan atas */}
      <motion.div
        className="absolute right-[14%] top-[13%] rounded-full"
        style={{
          width: 'clamp(80px,16vw,190px)',
          height: 'clamp(80px,16vw,190px)',
          background: 'radial-gradient(circle at 42% 38%, var(--emk-gold-bright) 0%, var(--emk-gold) 62%, color-mix(in srgb, var(--emk-gold) 70%, transparent) 100%)',
          opacity: moonOp,
          y: moonY,
          scale: moonScale,
          boxShadow: moonShadow,
        }}
      />

      {/* Awan Yamato-e bergerak perlahan (terus-menerus) */}
      <CloudBand clock={clock} reduced={reduced} opacity={0.9} portrait={portrait} />

      {/* Istana shinden-zukuri — atap melengkung berlapis */}
      <svg viewBox={cfg.viewBox} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <Group cfg={cfg.main} style={{ opacity: courtOp, y: courtY }} />
        <Group cfg={cfg.wings} style={{ opacity: courtOp, y: courtY }} />
        <Group cfg={cfg.gate} style={{ opacity: courtOp, y: courtY }} />
        <Group cfg={cfg.pine} style={{ opacity: pineOp }} />
        <Group cfg={cfg.grass} style={{ opacity: grassOp }} />
      </svg>
    </div>
  );
}

export default SceneCourt;
