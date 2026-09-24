import { useState } from 'react';
import { motion } from 'motion/react';
import {
  gojoTechniqueFor, GOJO_STYLE, gojoParticles, gojoCrackCount, gojoSpheres,
  gojoSmoke, gojoBolts, gojoSphereBolts, gojoStars, GOJO_VOID, GOJO_RIM,
} from './gojoFx';

// ─────────────────────────────────────────────────────────────────────────────
// Gojo Satoru (visual 'gojo') — efek berlapis v2 (rombak):
//   Layer 5  TEKS TEKNIK      蒼 / 赫 / 茈 / 領域展開・無量空処
//   Layer 4  RETAK            HANYA streak
//   Layer 3b PETIR HITAM      zigzag dari 4 tepi (TIDAK ke tengah)
//   Layer 3a ASAP 呪力        gumpalan asap dari tepi (TIDAK ke tengah)
//   Layer 2b BINTANG 無量空処  domain saja (titik cahaya tak-hingga)
//   Layer 2a BOLA PLASMA      conic muter + petir membelit + void hitam
//   Layer 2  BARA 呪力        partikel memanjang
//   Layer 1  WASH + SHAKE     warna dasar + getar
//
// Aturan performa (pelajaran dari efek Hina):
//   - animasi HANYA transform + opacity (+ pathLength untuk reveal garis, spt retak)
//   - teks besar pakai text-shadow, BUKAN filter: drop-shadow
//   - prefers-reduced-motion → efek langsung "selesai" tanpa animasi
//   - will-change hanya saat aktif
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// edge (0 atas,1 kanan,2 bawah,3 kiri) → posisi % layar + arah masuk (px).
function edgeToXY(edge, along, reachVw) {
  const vw = (typeof window !== 'undefined' ? window.innerWidth : 1200) / 100;
  const reachPx = reachVw * vw;
  const j = (along - 0.5) * 100;   // -50..50 sepanjang tepi
  if (edge === 0) return { left: 50 + j, top: 0,     dx: 0,        dy: reachPx };
  if (edge === 1) return { left: 100,    top: 50 + j, dx: -reachPx, dy: 0 };
  if (edge === 2) return { left: 50 + j, top: 100,   dx: 0,        dy: -reachPx };
  return { left: 0, top: 50 + j, dx: reachPx, dy: 0 };
}

export function GojoBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const streak = fx?.streak || 0;
  const seed = fx?.id || 1;
  const technique = gojoTechniqueFor(kind, streak);

  const [particles] = useState(() => (technique ? gojoParticles(technique, seed) : []));
  const [smoke] = useState(() => (technique ? gojoSmoke(technique, seed) : []));
  const [bolts] = useState(() => (technique ? gojoBolts(technique, seed) : []));
  const spheres = technique ? gojoSpheres(technique) : [];
  const [sphereBolts] = useState(() => spheres.map(() => gojoSphereBolts(3)));
  const [stars] = useState(() =>
    (technique === 'domain' || technique === 'domain_zenith') ? gojoStars(seed) : []
  );

  // Salah: wash merah lembut, TANPA retak (retak = ciri streak saja).
  if (!technique) {
    return (
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.5 : [0, 0.5, 0] }}
        transition={{ duration: reduced ? 0 : 0.6, ease: 'easeOut' }}
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(229,57,53,0.28), transparent 70%)',
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

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.16 } }}
      style={{ willChange: 'transform, opacity' }}
    >
      {/* ── Layer 1a — WASH (domain = nebula lembut + vignette hampa) ──────── */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.35 : [0, isDomain ? 0.5 : 0.35, 0] }}
        transition={{ duration: reduced ? 0 : zenith ? 1.1 : 0.7, ease: 'easeOut' }}
        style={{
          background: isDomain
            ? `radial-gradient(circle at 50% 50%, ${st.color}33, transparent 62%), radial-gradient(circle at 50% 50%, transparent 42%, ${GOJO_VOID}66 100%)`
            : `radial-gradient(circle at 50% 50%, ${st.color}55, transparent 70%)`,
        }}
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
        {/* ── Layer 3a — ASAP 呪力 (dari tepi, tidak ke tengah) ────────────── */}
        {smoke.map((s) => {
          const p = edgeToXY(s.edge, s.along, s.reach);
          return (
            <motion.div
              key={s.id}
              className="absolute rounded-full"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: s.size,
                height: s.size,
                marginLeft: -s.size / 2,
                marginTop: -s.size / 2,
                background: `radial-gradient(circle, ${GOJO_VOID} 0%, ${s.color}44 45%, transparent 72%)`,
                willChange: 'transform, opacity',
              }}
              initial={{ opacity: 0, x: p.dx * 0.35, y: p.dy * 0.35, scale: 0.7 }}
              animate={{ opacity: reduced ? 0.45 : [0, 0.7, 0.45], x: p.dx, y: p.dy, scale: 1 }}
              transition={{ duration: reduced ? 0 : s.dur, delay: reduced ? 0 : s.delay, ease: 'easeOut' }}
            />
          );
        })}

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
                {/* inti petir hitam */}
                <motion.path
                  d={d}
                  fill="none"
                  stroke={GOJO_VOID}
                  strokeWidth={3}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={reduced
                    ? { pathLength: 1, opacity: 0.9 }
                    : { pathLength: 1, opacity: [0, 1, 0.25, 1, 0.55] }}
                  transition={{ duration: reduced ? 0 : 0.5, ease: 'easeOut' }}
                />
                {/* rim terang tipis (biar kebaca di tema gelap) */}
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
                  transition={{ duration: reduced ? 0 : 0.5, ease: 'easeOut' }}
                />
              </g>
            );
          })}
        </svg>

        {/* ── Layer 2b — BINTANG 無量空処 (domain saja) ─────────────────────── */}
        {isDomain && stars.map((s) => (
          <motion.span
            key={s.id}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: '#ffffff',
              boxShadow: `0 0 ${s.size * 3}px ${st.color}`,
            }}
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 0.8 } : { opacity: [0, 0.95, 0.35, 0.85, 0.3] }}
            transition={{ duration: reduced ? 0 : s.dur, delay: reduced ? 0 : s.delay, ease: 'easeOut' }}
          />
        ))}

        {/* ── Layer 2a — BOLA PLASMA ────────────────────────────────────────
            ao  : bola BIRU muncul dari KANAN, DIAM di pinggir
            aka : bola MERAH muncul dari KIRI, DIAM di pinggir
            茈  : dua bola meluncur & TABRAKAN di tengah → inti ungu + shockwave */}
        {spheres.map((b, si) => (
          <motion.div
            key={`sphere-${b.id}`}
            className="absolute left-1/2 top-1/2"
            style={{
              width: b.size,
              height: b.size,
              marginLeft: -b.size / 2,
              marginTop: -b.size / 2,
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
            {/* halo luar */}
            <div
              className="absolute rounded-full"
              style={{
                inset: -b.size * 0.35,
                background: `radial-gradient(circle, ${b.color}55, transparent 70%)`,
              }}
            />
            {/* plasma muter (conic berputar) */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${b.color}, ${GOJO_VOID} 30%, ${b.color}cc 50%, ${GOJO_VOID} 75%, ${b.color})`,
                willChange: 'transform',
              }}
              animate={reduced ? {} : { rotate: 360 }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
            />
            {/* inti terang */}
            <div
              className="absolute rounded-full"
              style={{
                inset: b.size * 0.2,
                background: `radial-gradient(circle at 38% 32%, #ffffff, ${b.color} 55%, transparent 82%)`,
              }}
            />
            {/* void hitam (khas 茈) */}
            <div
              className="absolute rounded-full"
              style={{
                inset: b.size * 0.36,
                background: `radial-gradient(circle, ${GOJO_VOID} 45%, transparent 78%)`,
              }}
            />
            {/* petir hitam membelit bola */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
              {(sphereBolts[si] || []).map((pts, i) => (
                <motion.polyline
                  key={i}
                  points={pts}
                  fill="none"
                  stroke={GOJO_VOID}
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={reduced ? { opacity: 0.7 } : { opacity: [0, 0.95, 0.2, 0.85, 0.3] }}
                  transition={{ duration: 0.6, repeat: reduced ? 0 : Infinity, repeatDelay: 0.35, delay: i * 0.12 }}
                />
              ))}
            </svg>
          </motion.div>
        ))}

        {/* ── Tabrakan 茈: ledakan bola ungu + shockwave di titik tabrakan ── */}
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
                background: `radial-gradient(circle at 40% 35%, #ffffff 0%, ${GOJO_STYLE.murasaki.color} 42%, ${GOJO_VOID} 82%, #000000 100%)`,
                boxShadow: `0 0 70px ${GOJO_STYLE.murasaki.color}, 0 0 140px ${GOJO_STYLE.murasaki.color}88`,
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
                willChange: 'transform, opacity',
              }}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={reduced ? { scale: 0.4, opacity: 0 } : { scale: [0.4, 0.4, 4], opacity: [0, 0, 0.9, 0] }}
              transition={{ duration: reduced ? 0 : 1.15, times: [0, 0.5, 0.62, 1], ease: 'easeOut' }}
            />
          </>
        )}

        {/* ── Layer 2 — BARA 呪力 (partikel memanjang) ─────────────────────── */}
        {particles.map((p) => {
          const dx = Math.cos(p.angle) * p.dist;
          const dy = Math.sin(p.angle) * p.dist;
          const startOut = p.out || p.spiral; // aka & murasaki mulai dari pusat lalu keluar
          return (
            <motion.span
              key={p.id}
              className="absolute left-1/2 top-1/2"
              style={{
                width: p.size,
                height: p.len,
                marginLeft: -p.size / 2,
                marginTop: -p.len / 2,
                borderRadius: 9999,
                background: `linear-gradient(${p.angle}rad, ${st.color}, transparent)`,
                boxShadow: `0 0 8px ${st.color}`,
                willChange: 'transform, opacity',
              }}
              initial={{
                x: startOut ? 0 : dx,
                y: startOut ? 0 : dy,
                opacity: 0.9,
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

        {/* ── Layer 4 — RETAK (HANYA streak; makin gila per level) ────────── */}
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
                  stroke={st.color}
                  strokeWidth="0.35"
                  strokeLinecap="round"
                  pathLength={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 0.95, 0.6] }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
                />
              );
            })}
          </svg>
        )}

        {/* ── Layer 5 — TEKS TEKNIK (chromatic aberration via text-shadow) ──
            Dikecilkan & digeser ke ATAS supaya BOLA di tengah (titik tabrakan 茈)
            jadi bintang utamanya — bola tidak boleh ketutup teks. */}
        <div
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: '9%' }}
        >
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
              fontSize: isDomain
                ? 'clamp(40px, 7vw, 92px)'
                : 'clamp(56px, 10vw, 140px)',
              color: st.color,
              // Chromatic aberration (khas Gojo) + glow. text-shadow, bukan drop-shadow.
              textShadow: `2px 0 #ff1744, -2px 0 #2979ff, 0 0 18px ${st.color}`,
              willChange: 'transform, opacity',
            }}
          >
            {st.kanji}
          </motion.span>
        </div>

        {/* Teks kecil 領域展開 saat domain (di bawah, tidak ganggu bola) */}
        {isDomain && (
          <motion.div
            className="absolute left-0 right-0 flex justify-center"
            style={{ top: '26%', color: GOJO_RIM }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.35, duration: reduced ? 0 : 0.4 }}
          >
            <span
              className="font-serif font-black tracking-[0.3em]"
              style={{ fontSize: 'clamp(14px, 3vw, 30px)' }}
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
