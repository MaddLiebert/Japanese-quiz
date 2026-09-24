import { useState } from 'react';
import { motion } from 'motion/react';
import {
  gojoTechniqueFor, GOJO_STYLE, gojoParticles, gojoCrackCount, gojoSpheres,
  gojoBolts, gojoStars, GOJO_VOID, GOJO_RIM,
  GOJO_INK, GOJO_FLASH, gojoImpactFocus, gojoImpactStar,
  gojoSpeedLines, gojoHalftone, gojoOno,
  GOJO_CORE, gojoOrbitRings, gojoRibbons, gojoTendrils, gojoHalo,
} from './gojoFx';

// ─────────────────────────────────────────────────────────────────────────────
// Gojo Satoru (visual 'gojo') — efek berlapis v4: BAHASA ANIME + BOLA PLASMA.
// (impact star / 集中線 / screentone / オノマトペ = bahasa anime; bola = plasma
//  menyala mengikuti referensi JJK: inti PUTIH-panas + tepi lembut, tanpa tinta.)
//
//   Layer 5  TEKS TEKNIK      蒼 / 赫 / 茈 / 領域展開・無量空処 (stroke tinta)
//   Layer 4  RETAK            HANYA streak
//   Layer 2e オノマトペ        teks bunyi di titik impact (ドン/ゴッ/ズドン)
//   Layer 2d SCREENTONE       titik halftone (shading manga) di titik impact
//   Layer 2c IMPACT STAR      bintang ledakan anime di titik impact
//   Layer 3b PETIR HITAM      zigzag dari 4 tepi (TIDAK ke tengah)
//   Layer 3a 集中線           garis tinta dari titik fokus (ao/aka tetap di tepi)
//   Layer 2b BINTANG 無量空処  domain saja (titik cahaya tak-hingga)
//   Layer 2a BOLA PLASMA      inti putih + tepi lembut + rings/ribbons/tendrils
//   Layer 2  SERPIHAN TINTA   partikel hard-edge (bukan blur)
//   Layer 1  WASH + SHAKE     cel-shade hard-stop + getar
//   Layer 0  FLASH            kilat putih 1-frame
//
// Aturan performa:
//   - animasi HANYA transform + opacity (+ pathLength untuk reveal garis)
//   - outline pakai ring keras (box-shadow blur 0) / stroke, BUKAN blur
//   - teks besar pakai -webkit-text-stroke + text-shadow keras, bukan drop-shadow
//   - prefers-reduced-motion → efek langsung "selesai" tanpa animasi
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function GojoBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const streak = fx?.streak || 0;
  const seed = fx?.id || 1;
  const technique = gojoTechniqueFor(kind, streak);

  const [particles] = useState(() => (technique ? gojoParticles(technique, seed) : []));
  const [bolts] = useState(() => (technique ? gojoBolts(technique, seed) : []));
  const [speedLines] = useState(() => (technique ? gojoSpeedLines(technique, seed) : []));
  const [halftone] = useState(() => (technique ? gojoHalftone(seed) : []));
  const spheres = technique ? gojoSpheres(technique) : [];
  const [rings] = useState(() => (technique ? gojoOrbitRings(technique, seed) : []));
  const [ribbons] = useState(() => (technique ? gojoRibbons(technique, seed) : []));
  const [tendrils] = useState(() => (technique ? gojoTendrils(technique, seed) : []));
  const [halos] = useState(() => (technique ? gojoHalo(technique, seed) : []));
  const [impactStar] = useState(() => (technique ? gojoImpactStar(seed) : null));
  const [stars] = useState(() =>
    (technique === 'domain' || technique === 'domain_zenith') ? gojoStars(seed) : []
  );

  // Salah: wash merah, TANPA retak / impact (bukan teknik).
  if (!technique) {
    return (
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.5 : [0, 0.5, 0] }}
        transition={{ duration: reduced ? 0 : 0.6, ease: 'easeOut' }}
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(229,57,53,0.28), transparent 70%)',
        }}
      />
    );
  }

  const st = GOJO_STYLE[technique];
  const isDomain = technique === 'domain' || technique === 'domain_zenith';
  const zenith = technique === 'domain_zenith';
  const isStreak = kind === 'streak';
  const cracks = isStreak ? gojoCrackCount(streak) : 0;
  const shake = isDomain || isStreak;
  const focus = gojoImpactFocus(technique);
  const ono = gojoOno(technique);

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
        animate={{ opacity: reduced ? 0.4 : [0, isDomain ? 0.55 : 0.4, 0] }}
        transition={{ duration: reduced ? 0 : zenith ? 1.1 : 0.6, ease: 'easeOut' }}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${st.color} 0 18%, ${st.color}88 18% 32%, transparent 32%)`,
        }}
      />

      {/* ── Layer 0 — FLASH (kilat putih 1-frame, khas anime) ─────────────── */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.18 : [0, 0.85, 0] }}
        transition={{ duration: reduced ? 0 : 0.28, times: [0, 0.15, 1], ease: 'easeOut' }}
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
        transition={{ duration: zenith ? 0.8 : 0.5, ease: 'easeOut' }}
      >
        {/* ── Layer 3a — 集中線 (garis tinta dari fokus; ao/aka di band tepi) ── */}
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
              strokeWidth={l.width}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={reduced
                ? { pathLength: 1, opacity: 0.8 }
                : { pathLength: 1, opacity: [0, 0.95, 0.4, 0.85, 0.5] }}
              transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : l.delay, ease: 'easeOut' }}
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
                  strokeWidth={3.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={reduced
                    ? { pathLength: 1, opacity: 0.95 }
                    : { pathLength: 1, opacity: [0, 1, 0.3, 1, 0.6] }}
                  transition={{ duration: reduced ? 0 : 0.45, ease: 'easeOut' }}
                />
                <motion.path
                  d={d}
                  fill="none"
                  stroke={GOJO_RIM}
                  strokeWidth={1}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={reduced
                    ? { pathLength: 1, opacity: 0.5 }
                    : { pathLength: 1, opacity: [0, 0.9, 0.15, 0.8, 0.35] }}
                  transition={{ duration: reduced ? 0 : 0.45, ease: 'easeOut' }}
                />
              </g>
            );
          })}
        </svg>

        {/* ── Layer 2b — BINTANG 無量空処 (domain saja) ─────────────────────── */}
        {isDomain && stars.map((s) => (
          <motion.span
            key={s.id}
            className="absolute"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: '#ffffff',
              outline: `1px solid ${GOJO_INK}`,
            }}
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 0.85 } : { opacity: [0, 0.95, 0.35, 0.85, 0.3] }}
            transition={{ duration: reduced ? 0 : s.dur, delay: reduced ? 0 : s.delay, ease: 'easeOut' }}
          />
        ))}

        {/* ── Layer 2a — BOLA PLASMA (mengikuti referensi JJK) ──────────────
            ao  : bola BIRU dari KANAN, DIAM di pinggir (tidak ke tengah) + orbit rings
            aka : bola MERAH dari KIRI, DIAM di pinggir + pita vortex
            茈  : dua bola TABRAKAN di tengah + cabang tendril + halo besar
            Inti PUTIH-panas, tepi LEMBUT (tanpa garis tinta). */}
        {spheres.map((b) => (
          <motion.div
            key={`sphere-${b.id}`}
            className="absolute left-1/2 top-1/2"
            style={{
              width: b.size,
              height: b.size,
              marginLeft: -b.size / 2,
              marginTop: -b.size / 2,
              zIndex: 3,          // bola = fokus, di ATAS impact star (star di belakang)
              willChange: 'transform, opacity',
            }}
            initial={reduced
              ? { x: `${b.anchorVw}vw`, opacity: 1 }
              : { x: `${b.fromVw}vw`, opacity: 0, scale: 0.6 }}
            animate={reduced
              ? { x: `${b.anchorVw}vw`, opacity: 0 }
              : { x: `${b.anchorVw}vw`, opacity: [0, 1, 1, 0], scale: [0.6, 1, 1.06, 1.15] }}
            transition={reduced ? { duration: 0 } : {
              x: { duration: b.dur, delay: b.delay, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: b.dur + 0.5, delay: b.delay, times: [0, 0.1, 0.7, 1], ease: 'easeOut' },
              scale: { duration: b.dur + 0.5, delay: b.delay, times: [0, 0.12, 0.6, 1], ease: 'easeOut' },
            }}
          >
            {/* halo lembut menyala (bukan garis) */}
            <div
              className="absolute rounded-full"
              style={{
                inset: -b.size * 0.4,
                background: `radial-gradient(circle, ${b.color}66, transparent 68%)`,
              }}
            />
            {/* badan plasma: inti PUTIH-panas → warna → tepi lembut (tanpa ring tinta) */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${GOJO_CORE} 0 7%, ${b.color} 7% 30%, ${b.color}aa 30% 50%, ${b.color}33 50% 66%, transparent 72%)`,
              }}
            />
            {/* pusaran plasma (conic lembut, screen blend) */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${b.color}99 18%, transparent 38%, ${b.color}99 58%, transparent 78%, ${b.color}99)`,
                mixBlendMode: 'screen',
                willChange: 'transform',
              }}
              animate={reduced ? {} : { rotate: 360 }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'linear' }}
            />
            {/* inti putih terang */}
            <div
              className="absolute rounded-full"
              style={{
                inset: b.size * 0.3,
                background: `radial-gradient(circle, ${GOJO_CORE} 0 40%, ${b.color} 62%, transparent 82%)`,
              }}
            />
            {/* orbit rings / ribbons / tendrils / halo (sesuai teknik) */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
              {halos.map((h) => (
                <motion.ellipse
                  key={h.id}
                  cx="50" cy="50" rx={h.rx} ry={h.ry}
                  fill="none" stroke={b.color} strokeWidth={h.width} opacity={0.6}
                  style={{ transformOrigin: '50% 50%', rotate: `${h.rot}deg` }}
                  animate={reduced ? {} : { rotate: [h.rot, h.rot + 360] }}
                  transition={{ duration: h.dur, repeat: Infinity, ease: 'linear' }}
                />
              ))}
              {rings.map((r) => (
                <motion.ellipse
                  key={r.id}
                  cx="50" cy="50" rx={r.rx} ry={r.ry}
                  fill="none" stroke={b.color} strokeWidth={r.width} opacity={0.85}
                  style={{ transformOrigin: '50% 50%', rotate: `${r.rot}deg` }}
                  animate={reduced ? {} : { rotate: [r.rot, r.rot + 360] }}
                  transition={{ duration: r.dur, repeat: Infinity, ease: 'linear', delay: r.delay }}
                />
              ))}
              {ribbons.map((r) => (
                <motion.ellipse
                  key={r.id}
                  cx="50" cy="50" rx={r.rx} ry={r.ry}
                  fill="none" stroke={b.color} strokeWidth={r.width} strokeLinecap="round"
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
                  fill="none" stroke={b.color} strokeWidth={t.width}
                  strokeLinecap="round" strokeLinejoin="round"
                  initial={{ opacity: 0 }}
                  animate={reduced ? { opacity: 0.8 } : { opacity: [0, 1, 0.3, 0.9, 0.4] }}
                  transition={{ duration: 0.6, repeat: reduced ? 0 : Infinity, repeatDelay: 0.3, delay: t.delay }}
                />
              ))}
            </svg>
          </motion.div>
        ))}

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
              transition={{ duration: reduced ? 0 : 0.75, times: [0, 0.2, 0.6, 1], ease: 'easeOut' }}
            >
              <polygon
                points={impactStar.points}
                fill={GOJO_FLASH}
                stroke={GOJO_INK}
                strokeWidth={2.4}
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
                transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : d.delay, ease: 'easeOut' }}
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
              transition={{ duration: reduced ? 0 : 0.85, times: [0, 0.18, 0.7, 1], ease: 'easeOut' }}
            >
              {ono}
            </motion.span>
          )}
        </motion.div>

        {/* ── Tabrakan 茈: ledakan plasma ungu + shockwave ───────────────────── */}
        {technique === 'murasaki' && (
          <>
            <motion.div
              key={`mura-core-${fx.id}`}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: 132,
                height: 132,
                marginLeft: -66,
                marginTop: -66,
                background: `radial-gradient(circle, ${GOJO_CORE} 0 14%, ${GOJO_STYLE.murasaki.color} 14% 46%, ${GOJO_STYLE.murasaki.color}55 46% 70%, transparent 82%)`,
                boxShadow: `0 0 60px 18px ${GOJO_STYLE.murasaki.color}66`,
                willChange: 'transform, opacity',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={reduced ? { scale: 1, opacity: 1 } : { scale: [0, 0, 1.5, 2.1], opacity: [0, 0, 1, 0] }}
              transition={{ duration: reduced ? 0 : 1.0, times: [0, 0.5, 0.66, 1], ease: 'easeOut' }}
            />
            <motion.div
              key={`mura-ring-${fx.id}`}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: 132,
                height: 132,
                marginLeft: -66,
                marginTop: -66,
                border: `5px solid ${GOJO_STYLE.murasaki.color}`,
                boxShadow: `0 0 34px 8px ${GOJO_STYLE.murasaki.color}88`,
                willChange: 'transform, opacity',
              }}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={reduced ? { scale: 0.4, opacity: 0 } : { scale: [0.4, 0.4, 4], opacity: [0, 0, 0.9, 0] }}
              transition={{ duration: reduced ? 0 : 1.15, times: [0, 0.5, 0.62, 1], ease: 'easeOut' }}
            />
          </>
        )}

        {/* ── Layer 2 — SERPIHAN TINTA (partikel hard-edge, bukan blur) ─────── */}
        {particles.map((p) => {
          const dx = Math.cos(p.angle) * p.dist;
          const dy = Math.sin(p.angle) * p.dist;
          const startOut = p.out || p.spiral;
          return (
            <motion.span
              key={p.id}
              className="absolute left-1/2 top-1/2"
              style={{
                width: p.size,
                height: p.len,
                marginLeft: -p.size / 2,
                marginTop: -p.len / 2,
                background: st.color,
                border: `2px solid ${GOJO_INK}`,
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
                delay: reduced ? 0 : p.delay,
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
                  transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
                />
              );
            })}
          </svg>
        )}

        {/* ── Layer 5 — TEKS TEKNIK (stroke tinta, gaya manga) ─────────────── */}
        <div className="absolute left-0 right-0 flex justify-center" style={{ top: '9%' }}>
          <motion.span
            className="font-serif font-black select-none"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: reduced ? 0 : 0.15,
              duration: reduced ? 0 : 0.35,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            style={{
              fontSize: isDomain ? 'clamp(40px, 7vw, 92px)' : 'clamp(56px, 10vw, 140px)',
              color: st.color,
              WebkitTextStroke: `3px ${GOJO_INK}`,
              textShadow: `5px 5px 0 ${GOJO_INK}`,
              willChange: 'transform, opacity',
            }}
          >
            {st.kanji}
          </motion.span>
        </div>

        {/* Teks kecil 領域展開 saat domain */}
        {isDomain && (
          <motion.div
            className="absolute left-0 right-0 flex justify-center"
            style={{ top: '26%' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.35, duration: reduced ? 0 : 0.4 }}
          >
            <span
              className="font-serif font-black tracking-[0.3em]"
              style={{
                fontSize: 'clamp(14px, 3vw, 30px)',
                color: GOJO_RIM,
                WebkitTextStroke: `2px ${GOJO_INK}`,
              }}
            >
              領域展開
            </span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default GojoBurst;
