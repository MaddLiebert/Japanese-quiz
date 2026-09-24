import { useState } from 'react';
import { motion } from 'motion/react';
import {
  gojoTechniqueFor, GOJO_STYLE, gojoParticles, gojoCrackCount, gojoSpheres,
} from './gojoFx';

// ─────────────────────────────────────────────────────────────────────────────
// Gojo Satoru (visual 'gojo') — efek berlapis:
//   Layer 5  TEKS TEKNIK      蒼 / 赫 / 茈 / 領域展開・無量空処
//   Layer 4  RETAK            HANYA streak, makin gila per level
//   Layer 3  BINGKAI SUDUT    frame 4 ujung layar + glow
//   Layer 2  PARTIKEL         hisap (ao) / ledak (aka) / spiral (murasaki)
//   Layer 1  WASH + SHAKE     warna dasar + getar (domain = gelombang transparan)
//
// Aturan performa (pelajaran dari efek Hina):
//   - animasi HANYA transform + opacity (JANGAN width/height/filter)
//   - teks besar pakai text-shadow, BUKAN filter: drop-shadow
//   - prefers-reduced-motion → efek langsung "selesai" tanpa animasi
//   - will-change hanya saat aktif
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Sudut bingkai (layer 3). Tiap sudut: kelas posisi, arah slide-in (dari luar
// layar), dan titik tumbuh (transform-origin) di sudutnya masing-masing.
const CORNERS = [
  { pos: 'top-0 left-0',       from: { x: -70, y: -70 }, origin: 'top left' },
  { pos: 'top-0 right-0',      from: { x: 70,  y: -70 }, origin: 'top right' },
  { pos: 'bottom-0 left-0',    from: { x: -70, y: 70 },  origin: 'bottom left' },
  { pos: 'bottom-0 right-0',   from: { x: 70,  y: 70 },  origin: 'bottom right' },
];

export function GojoBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const streak = fx?.streak || 0;
  const technique = gojoTechniqueFor(kind, streak);
  const [particles] = useState(() =>
    technique ? gojoParticles(technique, fx?.id || 1) : []
  );
  const spheres = technique ? gojoSpheres(technique) : [];

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
      className="absolute inset-0"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.16 } }}
      style={{ willChange: 'transform, opacity' }}
    >
      {/* ── Layer 1a — WASH (warna dasar; domain = gelombang transparan) ───── */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.35 : [0, isDomain ? 0.5 : 0.35, 0] }}
        transition={{ duration: reduced ? 0 : zenith ? 1.1 : 0.7, ease: 'easeOut' }}
        style={{
          background: isDomain
            ? `repeating-radial-gradient(circle at 50% 50%, ${st.color}22 0px, transparent 18px, transparent 40px)`
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
        {/* ── Layer 3 — BINGKAI SUDUT (frame 4 ujung, tebal & tegas) ───────── */}
        {CORNERS.map((c, i) => (
          <motion.div
            key={c.pos}
            className={`absolute ${c.pos} w-[14vw] h-[14vw]`}
            initial={{ opacity: 0, x: c.from.x, y: c.from.y, scale: 0.9 }}
            animate={{ opacity: reduced ? 0.95 : 1, x: 0, y: 0, scale: 1 }}
            transition={{
              duration: reduced ? 0 : 0.4,
              delay: reduced ? 0 : i * 0.07,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ transformOrigin: c.origin }}
          >
            {/* Siku luar — border tebal 10px */}
            <div
              className="absolute inset-0"
              style={{
                borderTopWidth: 10,
                borderLeftWidth: c.pos.includes('left') ? 10 : 0,
                borderRightWidth: c.pos.includes('right') ? 10 : 0,
                borderBottomWidth: c.pos.includes('bottom') ? 10 : 0,
                borderStyle: 'solid',
                borderColor: st.color,
                filter: `drop-shadow(0 0 10px ${st.color})`,
              }}
            />
            {/* Garis dalam tipis (double frame) — biar terasa disengaja */}
            <div
              className="absolute"
              style={{
                inset: 16,
                borderTopWidth: 3,
                borderLeftWidth: c.pos.includes('left') ? 3 : 0,
                borderRightWidth: c.pos.includes('right') ? 3 : 0,
                borderBottomWidth: c.pos.includes('bottom') ? 3 : 0,
                borderStyle: 'solid',
                borderColor: `${st.color}aa`,
              }}
            />
            {/* Titik solid di sudut (aksen) */}
            <div
              className="absolute w-[16px] h-[16px] rounded-full"
              style={{
                background: st.color,
                top: c.pos.includes('top') ? 6 : undefined,
                bottom: c.pos.includes('bottom') ? 6 : undefined,
                left: c.pos.includes('left') ? 6 : undefined,
                right: c.pos.includes('right') ? 6 : undefined,
                boxShadow: `0 0 14px ${st.color}`,
              }}
            />
          </motion.div>
        ))}

        {/* ── Layer 2a — BOLA TEKNIK ────────────────────────────────────────
            ao  : bola BIRU melesat dari KANAN ke tengah
            aka : bola MERAH melesat dari KIRI ke tengah
            茈  : dua bola (biru kanan + merah kiri) TABRAKAN di tengah → ungu */}
        {spheres.map((b) => (
          <motion.div
            key={`sphere-${b.id}`}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: b.size,
              height: b.size,
              marginLeft: -b.size / 2,
              marginTop: -b.size / 2,
              background: `radial-gradient(circle at 34% 28%, #ffffff 0%, ${b.color} 38%, ${b.color} 66%, rgba(0,0,0,0.9) 100%)`,
              boxShadow: `0 0 36px ${b.color}, 0 0 72px ${b.color}77`,
              willChange: 'transform, opacity',
            }}
            initial={reduced ? { x: 0, opacity: 1 } : { x: `${b.fromVw}vw`, opacity: 0, scale: 0.55 }}
            animate={
              reduced
                ? { x: 0, opacity: 0 }
                : { x: 0, opacity: [0, 1, 1, 0], scale: [0.55, 1, 1, 1.15] }
            }
            transition={
              reduced
                ? { duration: 0 }
                : {
                  x: { duration: b.dur, delay: b.delay, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: b.dur, delay: b.delay, times: [0, 0.12, 0.72, 1], ease: 'easeOut' },
                  scale: { duration: b.dur, delay: b.delay, times: [0, 0.12, 0.72, 1], ease: 'easeOut' },
                }
            }
          />
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
                background: `radial-gradient(circle at 40% 35%, #ffffff 0%, ${GOJO_STYLE.murasaki.color} 42%, #4a0072 78%, #000000 100%)`,
                boxShadow: `0 0 70px ${GOJO_STYLE.murasaki.color}, 0 0 140px ${GOJO_STYLE.murasaki.color}88`,
                willChange: 'transform, opacity',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={
                reduced
                  ? { scale: 1, opacity: 1 }
                  : { scale: [0, 0, 1.5, 2.1], opacity: [0, 0, 1, 0] }
              }
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
              animate={
                reduced
                  ? { scale: 0.4, opacity: 0 }
                  : { scale: [0.4, 0.4, 4], opacity: [0, 0, 0.9, 0] }
              }
              transition={{ duration: reduced ? 0 : 1.15, times: [0, 0.5, 0.62, 1], ease: 'easeOut' }}
            />
          </>
        )}

        {/* ── Layer 2 — PARTIKEL (hisap / ledak / spiral) ─────────────────── */}
        {particles.map((p) => {
          const dx = Math.cos(p.angle) * p.dist;
          const dy = Math.sin(p.angle) * p.dist;
          const startOut = p.out || p.spiral; // aka & murasaki mulai dari pusat lalu keluar
          return (
            <motion.span
              key={p.id}
              className="absolute left-1/2 top-1/2 rounded-full"
              initial={{
                x: startOut ? 0 : dx,
                y: startOut ? 0 : dy,
                opacity: 0.9,
                scale: 0.5,
              }}
              animate={{
                x: startOut ? dx : 0,
                y: startOut ? dy : 0,
                opacity: 0,
                scale: 1,
                rotate: p.spin,
              }}
              transition={{
                duration: reduced ? 0 : p.dur,
                delay: reduced ? 0 : p.delay,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                width: p.size,
                height: p.size,
                marginLeft: -p.size / 2,
                marginTop: -p.size / 2,
                background: st.color,
                boxShadow: `0 0 10px ${st.color}`,
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
            className="absolute left-0 right-0 flex justify-center text-kinari-light"
            style={{ top: '26%' }}
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
