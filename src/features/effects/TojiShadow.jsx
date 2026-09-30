import { useState } from 'react';
import { motion } from 'motion/react';
import {
  TOJI_ULT_THRESHOLD, TOJI_FLASH, TOJI_STEEL, TOJI_GUNMETAL, TOJI_VOID, TOJI_BLOOD,
} from './tojiFx';

// ─────────────────────────────────────────────────────────────────────────────
// 天与呪縛・術師殺し — bar + cinematic + state (pack_13, visual 'toji').
// IDENTITAS #1: 呪力ゼロ (じゅりょくゼロ) — Toji punya NOL tenaga kutukan, jadi
// bar-nya BUKAN bar 呪力 bercahaya seperti pack lain. Ini **武器庫レール (armory
// rail)**: 20 slot baja kosong yang TERISI pelat-pelat senjata — logam, bukan
// neon. Tidak ada glow: yang "menyala" = pantulan baja (TOJI_STEEL) + slot penuh
// bertepi blood red saat siap 全開.
//   • TojiCurseBar → 20 slot (pola JJK konsisten, tapi material baja); tap saat
//                    penuh = 天与呪縛・全開; saat state hidup → rail amunisi (T3).
// T2 = bar dasar (charge/ready/cast). Cinematic 全開 + rail amunisi + counter
// state 30 dtk menyusul di T3 (pola NanamiShadow T2 → T3).
// reduced-motion: label & bentuk akhir tetap tampil, animasi pulse dimatikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Bar 武器庫 Toji: 20 slot baja (TANPA glow — material logam) ─────────────
// Slot kosong = rongga gunmetal; slot terisi = pelat baja dengan garis kilau
// diagonal tipis (bukan radial glow). Saat penuh → tepi blood red + label 全開.
export function TojiCurseBar({
  charge = 0, ready = false, onCast, casting = false,
}) {
  const [reduced] = useState(prefersReduced);
  const pct = Math.max(0, Math.min(100, (charge / TOJI_ULT_THRESHOLD) * 100));
  const active = ready || casting;
  const accent = active ? TOJI_BLOOD : TOJI_STEEL;

  // 20 slot: 2 baris × 10 kolom (pola Nanami — mudah dibaca di layar sempit).
  const slots = Array.from({ length: TOJI_ULT_THRESHOLD });
  return (
    <div
      data-toji-cursebar
      className="pointer-events-none fixed right-2.5 top-[6vh] sm:top-1/2 sm:-translate-y-1/2 z-[125] flex flex-col items-center gap-1.5"
    >
      <div className="flex h-14 items-center justify-center">
        {casting && (
          <motion.span
            key="cast-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: TOJI_FLASH, writingMode: 'vertical-rl', textShadow: `0 0 12px ${TOJI_BLOOD}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
          >
            全開
          </motion.span>
        )}
        {!casting && ready && (
          <motion.span
            key="ready-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: TOJI_FLASH, writingMode: 'vertical-rl', textShadow: `0 0 10px ${TOJI_BLOOD}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={reduced ? { opacity: 1, y: 0 } : { opacity: [0.65, 1, 0.65], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            天与呪縛
          </motion.span>
        )}
      </div>

      <motion.button
        type="button"
        onClick={ready && !casting ? onCast : undefined}
        aria-label="武器庫 — 天与呪縛・全開"
        disabled={!ready || casting}
        className={`relative rounded-[4px] border-[2px] p-[4px] ${
          active ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
        }`}
        style={{
          borderColor: active ? accent : 'rgba(63,63,70,0.75)',
          background: 'rgba(12,12,12,0.78)',
          // 呪力ゼロ: TANPA glow radial — hanya bayangan padat + tepi logam.
          boxShadow: active
            ? `0 0 0 1px ${TOJI_BLOOD}88, 4px 4px 0 0 rgba(12,12,12,0.6)`
            : '2px 2px 0 0 rgba(12,12,12,0.5)',
        }}
        animate={ready && !reduced && !casting ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={ready && !reduced && !casting ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        <div className="grid grid-cols-10 gap-[2px]">
          {slots.map((_, i) => {
            const lit = casting ? true : i < Math.round(charge);
            return (
              <div
                key={i}
                className="relative h-[9px] w-[9px] overflow-hidden rounded-[1px]"
                style={{ background: 'rgba(63,63,70,0.22)', border: '1px solid rgba(63,63,70,0.5)' }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{
                    // pelat baja: gradien lurus + garis kilau diagonal (bukan glow)
                    background: `linear-gradient(135deg, ${TOJI_STEEL} 0%, #94a3b8 55%, ${TOJI_GUNMETAL} 100%)`,
                    boxShadow: 'inset 0 0 0 0.5px rgba(12,12,12,0.5)',
                  }}
                  initial={false}
                  animate={{ opacity: lit ? 1 : 0, scale: lit ? 1 : 0.7 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 20 }}
                />
              </div>
            );
          })}
        </div>

        {/* 刃 (やいば) — bilah kecil di sisi tombol saat penuh (bukan aura) */}
        {active && (
          <span
            className="pointer-events-none absolute -right-[30px] top-1/2 -translate-y-1/2"
            aria-hidden="true"
          >
            <svg viewBox="0 0 26 40" width="26" height="40" className="block">
              <path d="M13,2 L17,16 L15,30 L11,30 L9,16 Z" fill={TOJI_STEEL} stroke={TOJI_GUNMETAL} strokeWidth="1" />
              <path d="M13,2 L15,16 L13,30 L11,16 Z" fill={TOJI_FLASH} opacity="0.45" />
              <rect x="10" y="30" width="6" height="8" rx="1" fill={TOJI_VOID} stroke={TOJI_GUNMETAL} strokeWidth="0.8" />
            </svg>
          </span>
        )}
      </motion.button>

      <span
        className={`font-mono font-black text-[10px] tracking-widest ${ready && !reduced && !casting ? 'animate-pulse' : ''}`}
        style={{ color: active ? TOJI_FLASH : 'rgba(203,213,225,0.65)' }}
      >
        {casting ? '全開中' : `${charge}/${TOJI_ULT_THRESHOLD}`}
      </span>
    </div>
  );
}
