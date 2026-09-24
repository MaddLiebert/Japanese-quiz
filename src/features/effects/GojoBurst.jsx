import { useState } from 'react';
import { motion } from 'motion/react';
import {
  gojoTechniqueFor, GOJO_STYLE, gojoParticles, gojoCrackCount,
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

// Sudut bingkai (layer 3).
const CORNERS = [
  'top-0 left-0 border-t-[6px] border-l-[6px]',
  'top-0 right-0 border-t-[6px] border-r-[6px]',
  'bottom-0 left-0 border-b-[6px] border-l-[6px]',
  'bottom-0 right-0 border-b-[6px] border-r-[6px]',
];

export function GojoBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const streak = fx?.streak || 0;
  const technique = gojoTechniqueFor(kind, streak);
  const [particles] = useState(() =>
    technique ? gojoParticles(technique, fx?.id || 1) : []
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
        {/* ── Layer 3 — BINGKAI SUDUT (frame 4 ujung + glow) ──────────────── */}
        {CORNERS.map((pos, i) => (
          <motion.div
            key={pos}
            className={`absolute ${pos} w-[12vw] h-[12vw]`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: reduced ? 0.9 : [0, 0.9, 0.7], scale: 1 }}
            transition={{
              duration: reduced ? 0 : 0.5,
              delay: reduced ? 0 : i * 0.06,
              ease: 'easeOut',
            }}
            style={{ borderColor: st.color, boxShadow: `0 0 24px ${st.color}88` }}
          />
        ))}

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

        {/* ── Layer 5 — TEKS TEKNIK (chromatic aberration via text-shadow) ── */}
        <div
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: isDomain ? '40%' : '46%' }}
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
                ? 'clamp(48px, 11vw, 132px)'
                : 'clamp(64px, 15vw, 190px)',
              color: st.color,
              // Chromatic aberration (khas Gojo) + glow. text-shadow, bukan drop-shadow.
              textShadow: `2px 0 #ff1744, -2px 0 #2979ff, 0 0 18px ${st.color}`,
              willChange: 'transform, opacity',
            }}
          >
            {st.kanji}
          </motion.span>
        </div>

        {/* Teks kecil 領域展開 saat domain (mengunci ke 無量空処 di atas) */}
        {isDomain && (
          <motion.div
            className="absolute left-0 right-0 flex justify-center text-kinari-light"
            style={{ top: '28%' }}
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
