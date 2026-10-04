// ─────────────────────────────────────────────────────────────────────────────
// SceneLayer — satu lapisan scene dengan opacity/scale yang DIKENDALIKAN motion
// value (bukan state React). Ini kunci "mulus":
//   • Tidak ada re-render per frame → animasi tidak patah-patah.
//   • Opacity diturunkan dari jam (clock) → dua scene benar-benar saling
//     menembus (cross-fade), bukan cut keras.
//   • Slow zoom (Ken Burns) sangat halus sepanjang hidup scene → terasa filmis.
//
// Komponen ini murni presentasional: menerima `clock` (MotionValue detik absolut)
// dan indeks scene. Scene di dalamnya merender visualnya sendiri.
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';
import { HEIAN_SCENES } from '../data/scenes';
import { sceneStartTimes, sceneOpacityAt } from '../../timeline';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function SceneLayer({ index, clock, View, reduced = false, portrait = false, scenes = HEIAN_SCENES, fade = 1.7 }) {
  const starts = sceneStartTimes(scenes);
  const start = starts[index];
  const duration = scenes[index].duration;

  // Opasitas dari jam — cross-fade di-center pada batas scene.
  const opacity = useTransform(clock, (t) => (reduced ? (t >= start && t < start + duration ? 1 : 0) : sceneOpacityAt(scenes, index, t, fade)));

  // Zoom sinematik (Ken Burns). Di HP zoom diperkecil drastis: layar sudah sempit,
  // zoom besar justru memotong komposisi sampai tak terbaca. Landscape: 1.04→1.0,
  // portrait: 1.015→1.0.
  const zoomAmt = portrait ? 0.015 : 0.04;
  const scale = useTransform(clock, (t) => {
    if (reduced) return 1;
    const age = clamp01((t - start) / duration);
    return 1 + zoomAmt - zoomAmt * age;
  });

  // Geser vertikal sangat halus (parallax ringan) — scene terasa "hidup".
  const parallax = portrait ? 6 : 12;
  const y = useTransform(clock, (t) => {
    if (reduced) return 0;
    const age = clamp01((t - start) / duration);
    return (1 - age) * parallax;
  });

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity, scale, y, willChange: 'opacity, transform' }}
      aria-hidden={opacity ? undefined : true}
    >
      <View scene={scenes[index]} reduced={reduced} clock={clock} sceneStart={start} portrait={portrait} />
    </motion.div>
  );
}

export default SceneLayer;
