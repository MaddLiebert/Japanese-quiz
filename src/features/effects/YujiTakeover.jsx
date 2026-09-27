import { useState } from 'react';
import { motion } from 'motion/react';
import {
  YUJI_ULT_THRESHOLD, YUJI_TAKEOVER_DURATION_S, YUJI_TAKEOVER_TIMELINE,
  YUJI_INK, YUJI_STYLE,
} from './yujiFx';
import { yujiTakeoverGif } from './yujiGifs';

// ─────────────────────────────────────────────────────────────────────────────
// 宿儺の器 — ULTIMATE Yuji (bar 指, tap = cast). BUKAN domain expansion.
//   1. BAR   → deretan jari Sukuna vertikal di tepi KANAN; tiap benar = 1 jari
//              nyala (biru → ungu); penuh = label 宿儺の器 + denyut (tap = cast).
//   2. CINE  → aura naik + tato merayap + kanji 宿儺の器 (1x) + veil gelap,
//              lalu tersingkap (state 30 dtk mulai setelah settle).
//   3. AURA  → persist selama takeover (vignette hitam-ungu + garis tato halus).
// Timer JALAN TERUS (beda dari domain Gojo) — waktu kuis TIDAK dibekukan.
// Semua overlay pointer-events-none; hanya bar yang klikable.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Bar 指 (jari Sukuna) — isi naik tiap benar; saat takeover jadi timer drain ──
export function YujiCurseBar({ charge = 0, combo = 0, ready = false, onCast, takeoverOn = false, takeoverLeft = 0 }) {
  const [reduced] = useState(prefersReduced);
  const slots = YUJI_ULT_THRESHOLD;
  const pct = takeoverOn
    ? Math.max(0, Math.min(100, (takeoverLeft / YUJI_TAKEOVER_DURATION_S) * 100))
    : Math.max(0, Math.min(100, (charge / slots) * 100));
  const urgent = takeoverOn && takeoverLeft <= 5;
  const lit = takeoverOn ? Math.round((pct / 100) * slots) : charge;
  const purple = YUJI_STYLE.takeover.color;

  return (
    <div
      data-yuji-cursebar
      className="pointer-events-none fixed right-2.5 top-[6vh] sm:top-1/2 sm:-translate-y-1/2 z-[125] flex flex-col items-center gap-1.5"
    >
      {/* Slot label (tinggi tetap) → bar tidak bergeser */}
      <div className="flex h-14 items-center justify-center">
        {/* Tanpa AnimatePresence: label harus hilang SEKETIKA saat bar tidak penuh
            lagi (exit-animation + repeat: Infinity pernah bikin elemen nyangkut). */}
        {takeoverOn && (
          <motion.span
            key="takeover-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#e8e0ff', writingMode: 'vertical-rl', textShadow: `0 0 12px ${purple}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: reduced ? 1 : [0.55, 1, 0.55], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          >
            宿儺の器
          </motion.span>
        )}
        {ready && (
          <motion.span
            key="ready-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#e8e0ff', writingMode: 'vertical-rl', textShadow: `0 0 12px ${purple}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: reduced ? 1 : [0.65, 1, 0.65], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            宿儺の器
          </motion.span>
        )}
      </div>

      {/* Deretan jari — tap = cast saat penuh */}
      <motion.button
        type="button"
        onClick={ready ? onCast : undefined}
        aria-label="指"
        disabled={!ready}
        className={`relative rounded-full border-[2px] p-[3px] ${
          ready ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
        }`}
        style={{
          borderColor: ready || takeoverOn ? (urgent ? '#ef4444' : purple) : 'rgba(124,77,255,0.45)',
          background: 'rgba(10,4,20,0.55)',
          boxShadow: ready || takeoverOn
            ? `0 0 18px 3px ${urgent ? '#ef4444' : purple}cc, inset 0 0 10px ${purple}55`
            : `0 0 8px 1px ${purple}33`,
        }}
        animate={ready && !reduced ? { scaleX: [1, 1.25, 1] } : { scaleX: 1 }}
        transition={ready && !reduced ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        <div className="flex flex-col-reverse gap-[3px]">
          {Array.from({ length: slots }).map((_, i) => {
            const on = i < lit;
            const color = on ? (i < 10 ? '#00b0ff' : purple) : 'rgba(124,77,255,0.18)';
            return (
              <motion.div
                key={i}
                className="w-[14px] rounded-[3px]"
                style={{
                  height: '1.4vh',
                  minHeight: 6,
                  background: color,
                  boxShadow: on ? `0 0 6px ${color}` : 'none',
                  borderBottom: '1px solid rgba(10,10,10,0.55)',
                }}
                initial={false}
                animate={on ? { opacity: [0.6, 1, 1] } : { opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.35, ease: 'easeOut' }}
              />
            );
          })}
        </div>
      </motion.button>

      {/* Angka: charge / sisa durasi takeover */}
      <span
        className={`font-mono font-black text-[10px] tracking-widest ${urgent && !reduced ? 'animate-pulse' : ''}`}
        style={{ color: takeoverOn ? (urgent ? '#fca5a5' : '#e8e0ff') : ready ? '#e8e0ff' : 'rgba(232,224,255,0.6)' }}
      >
        {takeoverOn ? `${takeoverLeft}s` : `${charge}/${slots}`}
      </span>

      {/* Combo 解 → 捌 → 開 (nyala sesuai tingkat) */}
      {takeoverOn && (
        <div className="flex flex-col items-center gap-0.5">
          {['解', '捌', '開'].map((k, i) => (
            <span
              key={k}
              className="font-serif font-black text-[10px]"
              style={{
                color: i < combo ? '#ffd166' : 'rgba(255,255,255,0.35)',
                textShadow: i < combo ? '0 0 8px #ff8c1a' : 'none',
              }}
            >
              {k}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cinematic cast 宿儺の器 (sekali per cast; unmount instan saat padam) ─────
export function YujiTakeoverCine() {
  const [reduced] = useState(prefersReduced);
  const [castGif] = useState(yujiTakeoverGif);   // GIF sukuna transform
  const t = YUJI_TAKEOVER_TIMELINE;

  return (
    <motion.div
      data-yuji-takeover
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Veil: layar gelap penuh saat cast → tersingkap mulai settle */}
      <motion.div
        data-yuji-veil
        className="absolute inset-0"
        style={{ background: 'rgba(3,2,8,0.96)' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: t.settleStart, duration: reduced ? 0.3 : t.settleDur, ease: 'easeInOut' }}
      />

      {/* GIF Sukuna — cut-in atas, blend screen (tanpa kotak) */}
      {castGif && (
        <motion.div
          data-yuji-castgif
          className="absolute left-1/2 top-[10vh]"
          style={{ marginLeft: 'calc(min(34vh, 84vw) / -2)' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.97] }}
          transition={{
            delay: reduced ? 0 : 0.1,
            duration: reduced ? 0 : t.settleStart + t.settleDur - 0.1,
            times: [0, 0.12, 0.85, 1],
            ease: 'easeOut',
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{
              inset: '-26% -22%',
              background: 'radial-gradient(closest-side, rgba(3,2,8,0.97), rgba(3,2,8,0.72) 52%, transparent 100%)',
            }}
          />
          <img
            src={castGif}
            alt="宿儺の器"
            decoding="sync"
            loading="eager"
            className="select-none"
            style={{
              width: 'min(34vh, 84vw)',
              height: 'auto',
              mixBlendMode: 'screen',
              WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 40%, rgba(0,0,0,0.45) 68%, transparent 94%)',
              maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 40%, rgba(0,0,0,0.45) 68%, transparent 94%)',
            }}
            draggable={false}
          />
        </motion.div>
      )}

      {/* Kanji 宿儺の器 (1x, ~1,5 dtk) — TEKS DOANG, tanpa voice */}
      <motion.div
        data-yuji-kanji
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{
          delay: reduced ? 0 : t.kanjiAt,
          duration: reduced ? 0.3 : t.kanjiHold,
          times: [0, 0.15, 0.8, 1],
          ease: 'easeOut',
        }}
      >
        <span
          className="font-serif font-black select-none"
          style={{
            fontSize: 'clamp(40px, 8vw, 120px)',
            color: '#e8e0ff',
            WebkitTextStroke: `3px ${YUJI_INK}`,
            textShadow: `0 0 30px #6d28d9, 6px 6px 0 ${YUJI_INK}`,
          }}
        >
          宿儺の器
        </span>
      </motion.div>

      {/* Tato merayap (garis diagonal dari tepi) */}
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0.5, 0] }}
          transition={{ delay: t.tattooStart, duration: t.settleStart + t.settleDur, times: [0, 0.3, 0.7, 1] }}
          style={{
            background: 'repeating-linear-gradient(115deg, transparent 0 26px, rgba(10,10,10,0.85) 26px 28px, transparent 28px 54px)',
            maskImage: 'radial-gradient(ellipse at 50% 50%, transparent 30%, #000 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, transparent 30%, #000 75%)',
          }}
        />
      )}
    </motion.div>
  );
}

// ── Aura persist selama takeover (vignette hitam-ungu + garis tato mengalir) ──
export function YujiAura() {
  const [reduced] = useState(prefersReduced);
  if (reduced) return null;
  return (
    <motion.div
      data-yuji-aura
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(109,40,217,0.22) 78%, rgba(8,4,16,0.5) 100%)' }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(115deg, transparent 0 40px, rgba(10,10,10,0.5) 40px 41.5px, transparent 41.5px 82px)',
          maskImage: 'linear-gradient(90deg, #000, transparent 22%, transparent 78%, #000)',
          WebkitMaskImage: 'linear-gradient(90deg, #000, transparent 22%, transparent 78%, #000)',
        }}
        animate={{ backgroundPositionX: ['0px', '82px'] }}
        transition={{ repeat: Infinity, duration: 9, ease: 'linear' }}
      />
    </motion.div>
  );
}

export default YujiTakeoverCine;
