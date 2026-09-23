import { motion } from 'motion/react';
import { hinaChibiRects, HINA_CHIBI_W, HINA_CHIBI_H } from './hinaChibi';

// Pixel chibi Hina. Gating pack dilakukan oleh HinaCardFrame (bukan di sini).
//   kind='correct' → lompat kecil; kind='wrong' → goyang; kind='streak' → lompat besar
export function HinaChibi({ kind = 'correct', className = '' }) {
  const rects = hinaChibiRects();
  const wrong = kind === 'wrong';
  const grand = kind === 'streak';

  return (
    <motion.svg
      viewBox={`0 0 ${HINA_CHIBI_W} ${HINA_CHIBI_H}`}
      width={HINA_CHIBI_W}
      height={HINA_CHIBI_H}
      shapeRendering="crispEdges"
      className={`select-none pointer-events-none ${className}`}
      style={{ willChange: 'transform' }}
      aria-hidden="true"
      animate={
        wrong
          ? { rotate: [0, -9, 9, -6, 0], y: 0 }
          : { y: grand ? [0, -14, 0] : [0, -8, 0], scale: grand ? [1, 1.14, 1] : [1, 1.06, 1] }
      }
      transition={
        wrong
          ? { duration: 0.5, ease: 'easeOut' }
          : { duration: grand ? 0.7 : 0.55, ease: [0.34, 1.56, 0.64, 1] }
      }
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.color} />
      ))}
    </motion.svg>
  );
}
