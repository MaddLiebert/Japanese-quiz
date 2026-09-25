import { useState } from 'react';
import { motion } from 'motion/react';
import {
  gojoTechniqueFor, GOJO_STYLE, gojoParticles, gojoCrackCount,
  gojoBolts, GOJO_RIM,
  GOJO_INK, GOJO_FLASH, gojoImpactFocus, gojoImpactStar,
  gojoSpeedLines, gojoHalftone, gojoOno,
  gojoMurasakiBurst,
} from './gojoFx';

// ─────────────────────────────────────────────────────────────────────────────
// Gojo Satoru (visual 'gojo') — LEDAKAN anime (murasaki & domain).
//
// Konsep (user): bola ao/aka TIDAK meledak — mereka PERSIST & muter di pinggir,
// ditangani komponen GojoSpheres. GojoBurst hanya muncul untuk:
//   • murasaki (bener #3 & tiap milestone) → kedua bola ke tengah lalu MELEDAK
//     (domain 領域展開 kini punya cinematic sendiri: GojoDomainCine)
//   • GIF (aset user): salah → meme "Gojo kalah"; murasaki → GIF teknik 茈.
//     Muncul di TENGAH dengan bingkai tinta, di atas efek ledakan.
//
//   Layer 5  TEKS TEKNIK      茈 (stroke tinta)
//   Layer 4  RETAK            HANYA streak
//   Layer 2e オノマトペ        teks bunyi (ズドン / ゴゴゴ)
//   Layer 2d SCREENTONE       titik halftone (shading manga)
//   Layer 2c IMPACT STAR      bintang ledakan anime
//   Layer 3b PETIR HITAM      zigzag dari tepi (TIDAK ke tengah)
//   Layer 3a 集中線           garis tinta dari titik fokus
//   Layer 2b BINTANG 無量空処  domain saja
//   Layer 2  SERPIHAN TINTA   partikel hard-edge (bukan blur)
//   Layer 1  WASH + SHAKE     cel-shade hard-stop + getar
//   Layer 0  FLASH            kilat putih 1-frame
//
// Aturan performa:
//   - animasi HANYA transform + opacity (+ pathLength untuk reveal garis)
//   - outline pakai ring keras (box-shadow blur 0) / stroke, BUKAN blur
//   - prefers-reduced-motion → efek langsung "selesai" tanpa animasi
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// GIF reaksi Gojo (aset user) — bingkai tinta ala panel manga, di tengah layar.
// Dua mode GIF:
//   salah (meme "kalah") → panel berbingkai di TENGAH (tetap).
//   茈 (murasaki)        → CUT-IN landscape TANPA bingkai di bagian ATAS layar.
// Keluhan user: GIF 茈 di tengah menutupi ledakan plasma ("kek ketutup sama gif")
// → GIF naik ke atas (cut-in ala anime), plasma tetap megah di tengah, kanji 茈
//   turun ke bawah. Munculnya digeser (delay) supaya sinkron dengan tabrakan.
function GojoGifLayer({ src, reduced, wrong = false, delay = 0 }) {
  if (!src) return null;
  if (wrong) {
    return (
      <motion.div
        data-gojo-gif
        className="absolute left-1/2 top-1/2 z-10"
        style={{ marginLeft: '-19vh', marginTop: '-17vh' }}
        initial={{ opacity: 0, scale: 0.92, rotate: 2.5 }}
        animate={{ opacity: 1, scale: 1, rotate: -1.5, x: reduced ? 0 : [0, -9, 8, -5, 3, 0] }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: reduced ? 0 : 0.34, ease: 'easeOut' }}
      >
        <div className="w-[38vh] h-[38vh] border-[3px] border-sumi bg-kinari shadow-[8px_8px_0_0_rgba(26,26,26,0.32)] overflow-hidden">
          <img
            src={src}
            alt="Gojo"
            decoding="sync"
            loading="eager"
            className="w-full h-full object-contain select-none"
            draggable={false}
          />
        </div>
      </motion.div>
    );
  }
  return (
    <div
      className="absolute left-1/2 top-1/2 z-10"
      style={{ transform: 'translateX(-50%)', marginTop: '-42vh' }}
    >
      {/* Dudukan gelap lembut (vignette, tanpa tepi) di BELAKANG GIF: menyerap
          kotak GIF saat fade-in & jadi latar gelap untuk blend screen → tepi
          GIF melebur bahkan di tema terang. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          inset: '-26% -22%',
          background: 'radial-gradient(closest-side, rgba(4,2,10,0.96), rgba(4,2,10,0.7) 52%, transparent 100%)',
        }}
      />
      <motion.div
        data-gojo-gif
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: reduced ? 0 : 0.42, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src={src}
          alt="Gojo — 茈"
          decoding="sync"
          loading="eager"
          className="select-none"
          style={{
            width: 'min(42vh, 86vw)',
            height: 'auto',
            // Latar hitam bawaan GIF dilebur ke dudukan gelap (screen) + tepi
            // di-mask → cut-in tanpa kotak, bagian terang tetap menyala.
            mixBlendMode: 'screen',
            WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 40%, rgba(0,0,0,0.45) 68%, transparent 94%)',
            maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 40%, rgba(0,0,0,0.45) 68%, transparent 94%)',
          }}
          draggable={false}
        />
      </motion.div>
    </div>
  );
}

export function GojoBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const streak = fx?.streak || 0;
  const seed = fx?.id || 1;
  const technique = gojoTechniqueFor(kind, streak);

  const [particles] = useState(() => (technique ? gojoParticles(technique, seed) : []));
  const [bolts] = useState(() => (technique ? gojoBolts(technique, seed) : []));
  const [speedLines] = useState(() => (technique ? gojoSpeedLines(technique, seed) : []));
  const [halftone] = useState(() => (technique ? gojoHalftone(seed) : []));
  const [impactStar] = useState(() => (technique ? gojoImpactStar(seed) : null));

  // Salah: wash merah, TANPA retak / impact (bukan teknik). GIF "kalah" di tengah.
  if (!technique) {
    return (
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.16 } }}
      >
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: reduced ? 0.5 : [0, 0.5, 0] }}
          transition={{ duration: reduced ? 0 : 0.6, ease: 'easeOut' }}
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(229,57,53,0.28), transparent 70%)',
          }}
        />
        <GojoGifLayer src={fx?.gifSrc} reduced={reduced} wrong />
      </motion.div>
    );
  }

  // ao/aka: TIDAK meledak. Bola ditangani GojoSpheres (persist, muter di pinggir).
  if (technique === 'ao' || technique === 'aka') return null;

  const st = GOJO_STYLE[technique];
  const isStreak = kind === 'streak';
  const cracks = isStreak ? gojoCrackCount(streak) : 0;
  const shake = isStreak;
  const focus = gojoImpactFocus(technique);
  const ono = gojoOno(technique);
  // murasaki: parameter ledakan TEBAL (bola plasma, shockwave, garis).
  const mura = technique === 'murasaki' ? gojoMurasakiBurst() : null;
  // murasaki: tunda ledakan sampai kedua bola tiba di tengah (slide 0.42s).
  const d0 = technique === 'murasaki' ? 0.42 : 0;

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.16 } }}
      style={{ willChange: 'transform, opacity' }}
    >
      {/* ── Layer 1a — WASH (cel-shade hard-stop, bukan blur) ─────────────── */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.4 : [0, 0.4, 0] }}
        transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : d0, ease: 'easeOut' }}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${st.color} 0 18%, ${st.color}88 18% 32%, transparent 32%)`,
        }}
      />

      {/* ── Layer 0 — FLASH (kilat putih 1-frame, khas anime) ─────────────── */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.18 : [0, 0.85, 0] }}
        transition={{ duration: reduced ? 0 : 0.28, delay: reduced ? 0 : d0, times: [0, 0.15, 1], ease: 'easeOut' }}
        style={{ background: GOJO_FLASH }}
      />

      {/* ── Layer 1b — SHAKE (streak/domain) + pembungkus layer 2–5 ────────── */}
      <motion.div
        className="absolute inset-0"
        animate={
          reduced || !shake
            ? { x: 0, y: 0 }
            : { x: [0, -10, 9, -6, 4, 0], y: [0, -6, 5, -4, 3, 0] }
        }
        transition={{ duration: 0.5, delay: reduced ? 0 : d0, ease: 'easeOut' }}
      >
        {/* ── Layer 3a — 集中線 (garis tinta dari fokus) ────────────────────── */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {speedLines.map((l) => (
            <motion.line
              key={l.id}
              x1={l.from[0]}
              y1={l.from[1]}
              x2={l.to[0]}
              y2={l.to[1]}
              stroke={GOJO_INK}
              strokeWidth={l.width * (mura ? mura.speedLineScale : 1)}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={reduced
                ? { pathLength: 1, opacity: 0.8 }
                : { pathLength: 1, opacity: [0, 0.95, 0.4, 0.85, 0.5] }}
              transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : d0 + l.delay, ease: 'easeOut' }}
            />
          ))}
        </svg>

        {/* ── Layer 3b — PETIR HITAM (zigzag dari tepi, tidak ke tengah) ────── */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {bolts.map((b) => {
            const d = 'M' + b.points.map((pt) => pt.join(',')).join(' L');
            return (
              <g key={b.id}>
                <motion.path
                  d={d}
                  fill="none"
                  stroke={GOJO_INK}
                  strokeWidth={mura ? mura.boltInk : 3.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={reduced
                    ? { pathLength: 1, opacity: 0.95 }
                    : { pathLength: 1, opacity: [0, 1, 0.3, 1, 0.6] }}
                  transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : d0, ease: 'easeOut' }}
                />
                <motion.path
                  d={d}
                  fill="none"
                  stroke={GOJO_RIM}
                  strokeWidth={mura ? mura.boltRim : 1}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={reduced
                    ? { pathLength: 1, opacity: 0.5 }
                    : { pathLength: 1, opacity: [0, 0.9, 0.15, 0.8, 0.35] }}
                  transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : d0, ease: 'easeOut' }}
                />
              </g>
            );
          })}
        </svg>

        {/* ── IMPACT (star + screentone + オノマトペ) di titik fokus ─────────── */}
        <motion.div
          className="absolute left-1/2 top-1/2"
          style={{ x: `${focus.xVw}vw` }}
        >
          {/* Layer 2c — IMPACT STAR (bintang ledakan anime) */}
          {impactStar && (
            <motion.svg
              className="absolute"
              style={{
                width: 320, height: 320,
                marginLeft: -160, marginTop: -160,
                overflow: 'visible',
              }}
              viewBox="0 0 100 100"
              aria-hidden="true"
              initial={{ scale: 0, opacity: 0, rotate: -20 }}
              animate={reduced
                ? { scale: 1, opacity: 0.9, rotate: 0 }
                : { scale: [0, 1.15, 1, 0.9], opacity: [0, 1, 0.95, 0], rotate: [0, 0, -6, -12] }}
              transition={{ duration: reduced ? 0 : 0.75, delay: reduced ? 0 : d0, times: [0, 0.2, 0.6, 1], ease: 'easeOut' }}
            >
              <polygon
                points={impactStar.points}
                fill={GOJO_FLASH}
                stroke={GOJO_INK}
                strokeWidth={mura ? mura.starStroke : 2.4}
                strokeLinejoin="round"
              />
            </motion.svg>
          )}

          {/* Layer 2d — SCREENTONE (titik halftone, shading manga) */}
          <svg
            className="absolute"
            style={{ width: 300, height: 300, marginLeft: -150, marginTop: -150, overflow: 'visible' }}
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            {halftone.map((d) => (
              <motion.circle
                key={d.id}
                cx={d.x}
                cy={d.y}
                r={d.size}
                fill={GOJO_INK}
                initial={{ opacity: 0, scale: 0 }}
                animate={reduced ? { opacity: 0.5, scale: 1 } : { opacity: [0, 0.7, 0.45], scale: [0, 1, 1] }}
                transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : d0 + d.delay, ease: 'easeOut' }}
              />
            ))}
          </svg>

          {/* Layer 2e — オノマトペ (teks bunyi anime) */}
          {ono && (
            <motion.span
              className="absolute font-serif font-black select-none whitespace-nowrap"
              style={{
                left: 0, top: 0,
                fontSize: 'clamp(40px, 7vw, 96px)',
                color: st.color,
                WebkitTextStroke: `3px ${GOJO_INK}`,
                textShadow: `4px 4px 0 ${GOJO_INK}`,
                willChange: 'transform, opacity',
              }}
              initial={{ opacity: 0, scale: 0.4, rotate: -12, x: '-50%', y: '-50%' }}
              animate={reduced
                ? { opacity: 1, scale: 1, rotate: -8, x: '-50%', y: '-50%' }
                : { opacity: [0, 1, 1, 0], scale: [0.4, 1.2, 1, 1.05], rotate: [-12, -8, -6, -4], x: '-50%', y: '-50%' }}
              transition={{ duration: reduced ? 0 : 0.85, delay: reduced ? 0 : d0, times: [0, 0.18, 0.7, 1], ease: 'easeOut' }}
            >
              {ono}
            </motion.span>
          )}
        </motion.div>

        {/* ── Tabrakan 茈: ledakan plasma ungu + shockwave (TEBAL) ───────────── */}
        {mura && (
          <>
            <motion.div
              key={`mura-core-${fx.id}`}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: mura.core.size,
                height: mura.core.size,
                marginLeft: -mura.core.size / 2,
                marginTop: -mura.core.size / 2,
                background: mura.core.background,
                boxShadow: mura.core.boxShadow,
                willChange: 'transform, opacity',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={reduced ? { scale: 1, opacity: 1 } : { scale: [0, 0, 1.5, 2.1], opacity: [0, 0, 1, 0] }}
              transition={{ duration: reduced ? 0 : mura.coreDur, delay: reduced ? 0 : d0, times: [0, 0.5, 0.66, 1], ease: 'easeOut' }}
            />
            <motion.div
              key={`mura-ring-${fx.id}`}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: mura.ring.size,
                height: mura.ring.size,
                marginLeft: -mura.ring.size / 2,
                marginTop: -mura.ring.size / 2,
                border: mura.ring.border,
                boxShadow: mura.ring.boxShadow,
                willChange: 'transform, opacity',
              }}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={reduced ? { scale: 0.4, opacity: 0 } : { scale: [0.4, 0.4, 4], opacity: [0, 0, 0.9, 0] }}
              transition={{ duration: reduced ? 0 : mura.ringDur, delay: reduced ? 0 : d0, times: [0, 0.5, 0.62, 1], ease: 'easeOut' }}
            />
          </>
        )}

        {/* ── GIF teknik 茈 (aset user) — cut-in atas, sinkron dgn ledakan ─── */}
        <GojoGifLayer src={fx?.gifSrc} reduced={reduced} delay={d0} />

        {/* ── Layer 2 — SERPIHAN TINTA (partikel hard-edge, bukan blur) ─────── */}
        {particles.map((p) => {
          const dx = Math.cos(p.angle) * p.dist;
          const dy = Math.sin(p.angle) * p.dist;
          const startOut = p.out || p.spiral;
          const pk = mura ? mura.particleScale : 1;   // murasaki: serpihan lebih tebal
          return (
            <motion.span
              key={p.id}
              className="absolute left-1/2 top-1/2"
              style={{
                width: p.size * pk,
                height: p.len * pk,
                marginLeft: -(p.size * pk) / 2,
                marginTop: -(p.len * pk) / 2,
                background: st.color,
                border: `${2 * pk}px solid ${GOJO_INK}`,
                willChange: 'transform, opacity',
              }}
              initial={{
                x: startOut ? 0 : dx,
                y: startOut ? 0 : dy,
                opacity: 1,
                scale: 0.5,
                rotate: (p.angle * 180) / Math.PI,
              }}
              animate={{
                x: startOut ? dx : 0,
                y: startOut ? dy : 0,
                opacity: 0,
                scale: 1,
                rotate: (p.angle * 180) / Math.PI + p.spin,
              }}
              transition={{
                duration: reduced ? 0 : p.dur,
                delay: reduced ? 0 : d0 + p.delay,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          );
        })}

        {/* ── Layer 4 — RETAK (HANYA streak; garis tinta tegas) ───────────── */}
        {isStreak && !reduced && (
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {Array.from({ length: cracks }).map((_, i) => {
              const a = (i / cracks) * Math.PI * 2;
              const x2 = 50 + Math.cos(a) * 46;
              const y2 = 50 + Math.sin(a) * 46;
              return (
                <motion.line
                  key={i}
                  x1="50"
                  y1="50"
                  x2={x2}
                  y2={y2}
                  stroke={GOJO_INK}
                  strokeWidth="0.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 0.95, 0.7] }}
                  transition={{ duration: 0.4, delay: d0 + i * 0.05, ease: 'easeOut' }}
                />
              );
            })}
          </svg>
        )}

        {/* ── Layer 5 — TEKS TEKNIK (stroke tinta, gaya manga) — di BAWAH,
            supaya tidak bentrok dengan GIF cut-in 茈 di atas ───────────────── */}
        <div className="absolute left-0 right-0 flex justify-center" style={{ bottom: '8%' }}>
          <motion.span
            className="font-serif font-black select-none"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: reduced ? 0 : d0 + 0.15,
              duration: reduced ? 0 : 0.35,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            style={{
              fontSize: 'clamp(56px, 10vw, 140px)',
              color: st.color,
              WebkitTextStroke: `3px ${GOJO_INK}`,
              textShadow: `5px 5px 0 ${GOJO_INK}`,
              willChange: 'transform, opacity',
            }}
          >
            {st.kanji}
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default GojoBurst;
