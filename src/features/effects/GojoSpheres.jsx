import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  GOJO_STYLE, GOJO_CORE, GOJO_INK,
  gojoOrbitRings, gojoRibbons, gojoTendrils, gojoHalo,
  gojoBallLabel, gojoBallAura, gojoTensionLines, gojoCharge, gojoBallVignette,
  gojoBallWash, gojoBallLayout,
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

const GOJO_SPHERE_OFFSCREEN_VW = 62;

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Satu bola plasma yang muter terus di tempatnya.
function GojoBall({ tech, seed, reduced, explode, layout }) {
  const color = GOJO_STYLE[tech].color;
  const size = layout.size;
  const decoK = Math.min(1, size / 84);   // deco kanji di-tune utk bola 84px → mengecil proporsional
  const [rings] = useState(() => gojoOrbitRings(tech, seed));
  const [ribbons] = useState(() => gojoRibbons(tech, seed));
  const [tendrils] = useState(() => gojoTendrils(tech, seed));
  const [halos] = useState(() => gojoHalo(tech, seed));
  const label = gojoBallLabel(tech);
  const charge = gojoCharge(tech);
  const aura = gojoBallAura(tech, size, layout.mobile);

  const anchorXVw = layout.anchorXVw;
  const anchorYVh = layout.anchorYVh;
  const fromVw = tech === 'ao' ? GOJO_SPHERE_OFFSCREEN_VW : -GOJO_SPHERE_OFFSCREEN_VW;

  return (
    <motion.div
      data-gojo-ball={tech}
      className="absolute left-1/2 top-1/2"
      style={{
        width: size, height: size,
        marginLeft: -size / 2, marginTop: -size / 2,
        zIndex: 3,                       // bola = fokus, di atas impact star
        willChange: 'transform, opacity',
      }}
      initial={{ x: `${fromVw}vw`, y: `${anchorYVh}vh`, opacity: 0, scale: 0.7 }}
      animate={explode
        // meluncur ke tengah lalu MEMUDAR ke dalam ledakan
        ? { x: '0vw', y: '0vh', opacity: [1, 1, 0], scale: [1, 1.12, 1.35] }
        // muncul PERLAHAN lalu muter tenang di pinggir/sudut
        : { x: `${anchorXVw}vw`, y: `${anchorYVh}vh`, opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0 } : (explode
        ? {
          x: { duration: 0.42, ease: [0.55, 0, 0.85, 0.4] },
          y: { duration: 0.42, ease: [0.55, 0, 0.85, 0.4] },
          opacity: { duration: 0.6, times: [0, 0.62, 1], ease: 'easeIn' },
          scale: { duration: 0.6, times: [0, 0.62, 1], ease: 'easeIn' },
        }
        : {
          x: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
          y: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 1.5, ease: 'easeInOut' },
          scale: { duration: 1.5, ease: 'easeInOut' },
        })}
    >
      {/* aura menyala BERDENYUT (mencekam, bukan glow pasif) */}
      {aura && (
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: aura.inset,
            background: aura.background,
            willChange: 'transform, opacity',
          }}
          animate={reduced ? { opacity: 0.7 } : { opacity: [0.55, 0.95, 0.55], scale: [1, 1.09, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {/* charge ring — mengembang lalu hilang (kekuatan terkumpul) */}
      {charge && (
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: 0,
            border: `${charge.ringWidth}px solid ${color}`,
            boxShadow: `0 0 18px 2px ${color}88`,
            willChange: 'transform, opacity',
          }}
          initial={{ scale: 1, opacity: 0.85 }}
          animate={reduced ? { opacity: 0 } : { scale: [1, charge.ringScale], opacity: [0.85, 0] }}
          transition={{ duration: charge.ringDur, repeat: reduced ? 0 : Infinity, ease: 'easeOut' }}
        />
      )}
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
      {/* TEKS KANJI teknik (蒼 / 赫) — gaya manga GREGET: bloom warna + stroke
          tinta tebal + denyut napas. Muncul dengan punch (pop) lalu idle. */}
      {label && (
        <>
          {/* bloom warna di belakang teks */}
          <motion.span
            className="absolute left-1/2 top-1/2 font-serif font-black select-none pointer-events-none"
            style={{
              x: '-50%', y: '-50%',
              fontSize: size * label.fontScale,
              color,
              filter: `blur(${14 * decoK}px)`,
              willChange: 'transform, opacity',
            }}
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 0.9 } : { opacity: [0, 1, 0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: reduced ? 0 : Infinity, ease: 'easeInOut' }}
          >
            {label.kanji}
          </motion.span>
          <motion.span
            className="absolute left-1/2 top-1/2 font-serif font-black select-none"
            style={{
              x: '-50%', y: '-50%',
              fontSize: size * label.fontScale,
              color: GOJO_CORE,
              WebkitTextStroke: `${label.strokeWidth * decoK}px ${GOJO_INK}`,
              textShadow: `0 0 ${18 * decoK}px ${color}, 0 0 ${40 * decoK}px ${color}, 0 0 ${70 * decoK}px ${color}`,
              paintOrder: 'stroke fill',
              willChange: 'transform, opacity',
            }}
            initial={{ opacity: 0, scale: 0.3, rotate: -14 }}
            animate={reduced
              ? { opacity: 1, scale: 1, rotate: -6 }
              : { opacity: [0, 1, 1], scale: [0.3, 1.18, 1.04], rotate: [-14, -6, -6] }}
            transition={reduced ? { duration: 0 } : { duration: 0.7, times: [0, 0.55, 1], ease: [0.34, 1.56, 0.64, 1] }}
          >
            {label.kanji}
          </motion.span>
        </>
      )}
    </motion.div>
  );
}

// Vignette latar: gelap dengan warna lebih gelap dari bola, HANYA di sisi bola
// (dari tepi layar, memudar sebelum tengah) → tidak menutupi quiz yang di tengah.
// Geometri dari gojoBallWash(tech, vw, vh): desktop = formula lama (radius
// berhenti ±300px sebelum tengah); HP = ellipse di sudut bola (formula desktop
// menghasilkan 0px di layar 390px → wash tidak tampil; user: "efek di hp cuma
// bola2 doang... kaya di pc kan ada aura2 ungu sama merah gitu").
function GojoVignette({ tech, explode, reduced, layout, vw, vh }) {
  const v = gojoBallVignette(tech);
  const w = gojoBallWash(tech, vw, vh);
  if (!v || !w) return null;
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: w.background,
        willChange: 'opacity',
      }}
      initial={{ opacity: 0 }}
      animate={explode ? { opacity: [1, 1, 0] } : { opacity: 0.95 }}
      transition={reduced ? { duration: 0 } : (explode
        ? { duration: 0.6, times: [0, 0.62, 1], ease: 'easeIn' }
        : { duration: 1.5, ease: 'easeInOut' })}
    />
  );
}

// 集中線 ketegangan memancar dari sisi bola (ao kanan / aka kiri).
// Digambar di layer (bukan di dalam bola) supaya garis bisa keluar dari bola.
// focus = posisi bola (0..100); di HP fokusnya di sudut atas.
// maxY = batas bawah garis (0..100) supaya tidak turun ke area kartu jawaban.
function GojoTension({ tech, seed, reduced, focus, maxY }) {
  const [lines] = useState(() => gojoTensionLines(tech, seed, Math.random, 24, focus, maxY));
  if (!lines.length) return null;
  const color = GOJO_STYLE[tech].color;
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {lines.map((l) => (
        <motion.line
          key={l.id}
          x1={l.from[0]}
          y1={l.from[1]}
          x2={l.to[0]}
          y2={l.to[1]}
          stroke={color}
          strokeWidth={l.width}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ opacity: 0 }}
          animate={reduced ? { opacity: 0.35 } : { opacity: [0, 0.7, 0.25, 0.6, 0.3] }}
          transition={{ duration: 0.7, repeat: reduced ? 0 : Infinity, repeatDelay: 0.4, delay: l.delay }}
        />
      ))}
    </svg>
  );
}

// Lapisan bola persist. balls = { ao, aka }; explode = true saat murasaki.
// Layout responsif: desktop = tepi tengah; HP (sempit) = sudut atas + lebih kecil
// supaya kartu jawaban di tengah tidak ketutupan.
export function GojoSpheres({ balls, explode = false, seed = 1, reduced }) {
  const [autoReduced] = useState(prefersReduced);
  const red = reduced === undefined ? autoReduced : reduced;
  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  if (!balls) return null;

  const layoutAo = gojoBallLayout('ao', vp.w, vp.h);
  const layoutAka = gojoBallLayout('aka', vp.w, vp.h);
  // Titik fokus 集中線 (ruang 0..100 viewport) = posisi bola sebenarnya.
  const focusOf = (layout) => ({ x: 50 + layout.anchorXVw, y: 50 + layout.anchorYVh });
  // Di HP: batasi garis agar tetap di area atas (tidak turun ke kartu jawaban).
  const maxY = layoutAo.mobile ? 24 : null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* latar menggelap (paling belakang) — warna lebih gelap dari bola */}
      {balls.ao && <GojoVignette key="v-ao" tech="ao" explode={explode} reduced={red} layout={layoutAo} vw={vp.w} vh={vp.h} />}
      {balls.aka && <GojoVignette key="v-aka" tech="aka" explode={explode} reduced={red} layout={layoutAka} vw={vp.w} vh={vp.h} />}
      {balls.ao && <GojoTension key="t-ao" tech="ao" seed={seed} reduced={red} focus={focusOf(layoutAo)} maxY={maxY} />}
      {balls.aka && <GojoTension key="t-aka" tech="aka" seed={seed + 7} reduced={red} focus={focusOf(layoutAka)} maxY={maxY} />}
      {balls.ao && <GojoBall key="ao" tech="ao" seed={seed} reduced={red} explode={explode} layout={layoutAo} />}
      {balls.aka && <GojoBall key="aka" tech="aka" seed={seed + 7} reduced={red} explode={explode} layout={layoutAka} />}
    </div>
  );
}

export default GojoSpheres;
