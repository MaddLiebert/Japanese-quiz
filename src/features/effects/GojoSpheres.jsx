import { useState } from 'react';
import { motion } from 'motion/react';
import {
  GOJO_STYLE, GOJO_CORE,
  gojoOrbitRings, gojoRibbons, gojoTendrils, gojoHalo,
} from './gojoFx';

// ─────────────────────────────────────────────────────────────────────────────
// Bola Gojo yang PERSIST antar jawaban (konsep user):
//   benar#1 (ao)  → bola BIRU muncul, lalu MUTER DIAM di kanan (tidak meledak)
//   benar#2 (aka) → bola MERAH muncul di kiri; bola BIRU masih ada
//   benar#3 (茈)  → kedua bola MELUNCUR ke tengah lalu MELEDAK (fade) → reset
//
// Komponen ini hidup di EffectProvider (BUKAN di dalam GojoBurst yang di-mount
// per jawaban), supaya bola bisa "nempel" antar jawaban.
//
// Bola = plasma: inti PUTIH-panas + tepi LEMBUT (tanpa garis tinta) + bentuk
// khas per teknik (ao = orbit rings · aka = pita vortex).
// ─────────────────────────────────────────────────────────────────────────────

const GOJO_EDGE_ANCHOR_VW = 32;   // posisi parkir di pinggir (vw dari tengah)
const GOJO_SPHERE_OFFSCREEN_VW = 62;
const BALL_SIZE = 128;

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Satu bola plasma yang muter terus di tempatnya.
function GojoBall({ tech, seed, reduced, explode }) {
  const color = GOJO_STYLE[tech].color;
  const size = BALL_SIZE;
  const [rings] = useState(() => gojoOrbitRings(tech, seed));
  const [ribbons] = useState(() => gojoRibbons(tech, seed));
  const [tendrils] = useState(() => gojoTendrils(tech, seed));
  const [halos] = useState(() => gojoHalo(tech, seed));

  const anchorVw = tech === 'ao' ? GOJO_EDGE_ANCHOR_VW : -GOJO_EDGE_ANCHOR_VW;
  const fromVw = tech === 'ao' ? GOJO_SPHERE_OFFSCREEN_VW : -GOJO_SPHERE_OFFSCREEN_VW;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{
        width: size, height: size,
        marginLeft: -size / 2, marginTop: -size / 2,
        zIndex: 3,                       // bola = fokus, di atas impact star
        willChange: 'transform, opacity',
      }}
      initial={{ x: `${fromVw}vw`, opacity: 0, scale: 0.7 }}
      animate={explode
        // meluncur ke tengah lalu MEMUDAR ke dalam ledakan
        ? { x: '0vw', opacity: [1, 1, 0], scale: [1, 1.12, 1.35] }
        // muncul PERLAHAN lalu muter tenang di pinggir
        : { x: `${anchorVw}vw`, opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0 } : (explode
        ? {
          x: { duration: 0.42, ease: [0.55, 0, 0.85, 0.4] },
          opacity: { duration: 0.6, times: [0, 0.62, 1], ease: 'easeIn' },
          scale: { duration: 0.6, times: [0, 0.62, 1], ease: 'easeIn' },
        }
        : {
          x: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 1.5, ease: 'easeInOut' },
          scale: { duration: 1.5, ease: 'easeInOut' },
        })}
    >
      {/* halo lembut menyala (bukan garis) */}
      <div
        className="absolute rounded-full"
        style={{ inset: -size * 0.4, background: `radial-gradient(circle, ${color}66, transparent 68%)` }}
      />
      {/* badan plasma: inti PUTIH-panas → warna → tepi lembut (tanpa ring tinta) */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${GOJO_CORE} 0 7%, ${color} 7% 30%, ${color}aa 30% 50%, ${color}33 50% 66%, transparent 72%)` }}
      />
      {/* pusaran plasma (conic lembut, screen blend) — MUTER TERUS */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, transparent, ${color}99 18%, transparent 38%, ${color}99 58%, transparent 78%, ${color}99)`,
          mixBlendMode: 'screen',
          willChange: 'transform',
        }}
        animate={reduced ? {} : { rotate: 360 }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'linear' }}
      />
      {/* inti putih terang */}
      <div
        className="absolute rounded-full"
        style={{ inset: size * 0.3, background: `radial-gradient(circle, ${GOJO_CORE} 0 40%, ${color} 62%, transparent 82%)` }}
      />
      {/* orbit rings (ao) / pita vortex (aka) — muter nyelimutin bola */}
      <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
        {halos.map((h) => (
          <motion.ellipse
            key={h.id}
            cx="50" cy="50" rx={h.rx} ry={h.ry}
            fill="none" stroke={color} strokeWidth={h.width} opacity={0.6}
            style={{ transformOrigin: '50% 50%', rotate: `${h.rot}deg` }}
            animate={reduced ? {} : { rotate: [h.rot, h.rot + 360] }}
            transition={{ duration: h.dur, repeat: Infinity, ease: 'linear' }}
          />
        ))}
        {rings.map((r) => (
          <motion.ellipse
            key={r.id}
            cx="50" cy="50" rx={r.rx} ry={r.ry}
            fill="none" stroke={color} strokeWidth={r.width} opacity={0.85}
            style={{ transformOrigin: '50% 50%', rotate: `${r.rot}deg` }}
            animate={reduced ? {} : { rotate: [r.rot, r.rot + 360] }}
            transition={{ duration: r.dur, repeat: Infinity, ease: 'linear', delay: r.delay }}
          />
        ))}
        {ribbons.map((r) => (
          <motion.ellipse
            key={r.id}
            cx="50" cy="50" rx={r.rx} ry={r.ry}
            fill="none" stroke={color} strokeWidth={r.width} strokeLinecap="round"
            strokeDasharray="44 60" opacity={0.9}
            style={{ transformOrigin: '50% 50%', rotate: `${r.rot}deg` }}
            animate={reduced ? {} : { rotate: [r.rot, r.rot + 360 * r.dir] }}
            transition={{ duration: r.dur, repeat: Infinity, ease: 'linear', delay: r.delay }}
          />
        ))}
        {tendrils.map((t) => (
          <motion.polyline
            key={t.id}
            points={t.points.map((p) => p.join(',')).join(' ')}
            fill="none" stroke={color} strokeWidth={t.width}
            strokeLinecap="round" strokeLinejoin="round"
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 0.8 } : { opacity: [0, 1, 0.3, 0.9, 0.4] }}
            transition={{ duration: 0.6, repeat: reduced ? 0 : Infinity, repeatDelay: 0.3, delay: t.delay }}
          />
        ))}
      </svg>
    </motion.div>
  );
}

// Lapisan bola persist. balls = { ao, aka }; explode = true saat murasaki.
export function GojoSpheres({ balls, explode = false, seed = 1, reduced }) {
  const [autoReduced] = useState(prefersReduced);
  const red = reduced === undefined ? autoReduced : reduced;
  if (!balls) return null;
  return (
    <div className="absolute inset-0 overflow-hidden">
      {balls.ao && <GojoBall key="ao" tech="ao" seed={seed} reduced={red} explode={explode} />}
      {balls.aka && <GojoBall key="aka" tech="aka" seed={seed + 7} reduced={red} explode={explode} />}
    </div>
  );
}

export default GojoSpheres;
