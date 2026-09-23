import { motion } from 'motion/react';
import { useUserStats } from '../progress/ProgressContext';
import { getPack } from '../packs/packs';
import { useEffectLayer } from './EffectContext';
import {
  hinaRibbonColors, hinaRibbonSegments,
  HINA_RIBBON_VIEWBOX, HINA_RIBBON_STROKE,
} from './hinaRibbon';
import { HinaChibi } from './HinaChibi';

// Bungkus kartu jawaban: pita Hina SELALU mengikat kartu (pack Hina aktif) +
// chibi duduk di pojok kartu. Struktur wrapper SELALU sama → tanpa layout shift.
//   z-0  = pita `back`  (tertutup badan kartu → menembus belakang)
//   children = kartu (WAJIB `relative z-10`)
//   z-20 = pita `front` + `bow`
//   z-30 = chibi di pojok KIRI-ATAS (seolah duduk di sudut kartu)
const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Ribbon({ d, color, width, opacity = 1, delay = 0, shadow = false, reduce = false }) {
  return (
    <>
      {shadow && (
        <motion.path
          d={d} fill="none" stroke="rgba(26,26,26,0.22)" strokeWidth={HINA_RIBBON_STROKE.shadow}
          strokeLinecap="round" vectorEffect="non-scaling-stroke" transform="translate(3 4)"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
      <motion.path
        d={d} fill="none" stroke={color} strokeWidth={width} opacity={opacity}
        strokeLinecap="round" vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      />
    </>
  );
}

export function HinaCardFrame({ className = '', children }) {
  const { progress } = useUserStats();
  const { fxKind } = useEffectLayer();
  const isHina = getPack(progress.activePack)?.visual === 'hina';
  const reduce = prefersReduced();

  const kind = fxKind || 'correct';
  const c = hinaRibbonColors(kind);
  const seg = hinaRibbonSegments(kind);
  const svgProps = {
    viewBox: HINA_RIBBON_VIEWBOX,
    preserveAspectRatio: 'none',
    className: 'absolute inset-0 w-full h-full overflow-visible',
  };

  return (
    <div className={`relative isolate ${className}`}>
      {isHina && (
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <svg {...svgProps}>
            <Ribbon d={seg.back} color={c.base} width={HINA_RIBBON_STROKE.width} reduce={reduce} />
          </svg>
        </div>
      )}

      {children /* kartu WAJIB relative z-10 */}

      {isHina && (
        <div className="absolute inset-0 z-20 pointer-events-none" aria-hidden="true">
          <svg {...svgProps}>
            <Ribbon d={seg.front} color={c.base} width={HINA_RIBBON_STROKE.width} shadow reduce={reduce} />
            <Ribbon d={seg.front} color={c.light} width={HINA_RIBBON_STROKE.highlight} opacity={0.85} delay={0.05} reduce={reduce} />
            <Ribbon d={seg.bow} color={c.base} width={HINA_RIBBON_STROKE.width} shadow reduce={reduce} />
            <Ribbon d={seg.bow} color={c.light} width={HINA_RIBBON_STROKE.highlight} opacity={0.85} delay={0.05} reduce={reduce} />
          </svg>
        </div>
      )}

      {isHina && (
        <div className="absolute -top-6 -left-4 z-30 pointer-events-none" aria-hidden="true">
          <HinaChibi kind={kind} />
        </div>
      )}
    </div>
  );
}
