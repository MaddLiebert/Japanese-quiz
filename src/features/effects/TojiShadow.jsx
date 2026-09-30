import { useState } from 'react';
import { motion } from 'motion/react';
import {
  TOJI_ULT_THRESHOLD, TOJI_FLASH, TOJI_STEEL, TOJI_GUNMETAL, TOJI_VOID, TOJI_BLOOD,
  TOJI_TIMELINE, TOJI_QUOTE, TOJI_STATE_S, TOJI_AMMO_MAX, TOJI_WORM, tojiWorm,
} from './tojiFx';

// ─────────────────────────────────────────────────────────────────────────────
// 天与呪縛・術師殺し — bar + cinematic + state (pack_13, visual 'toji').
// IDENTITAS #1: 呪力ゼロ (じゅりょくゼロ) — Toji punya NOL tenaga kutukan, jadi
// bar-nya BUKAN bar 呪力 bercahaya seperti pack lain. Ini **武器庫レール (armory
// rail)**: 20 slot baja kosong yang TERISI pelat-pelat senjata — logam, bukan
// neon. Tidak ada glow: yang "menyala" = pantulan baja (TOJI_STEEL) + slot penuh
// bertepi blood red saat siap 全開.
//   • TojiCurseBar → 20 slot (pola JJK konsisten, tapi material baja); tap saat
//                    penuh = 天与呪縛・全開; saat state hidup → label 一撃離脱 +
//                    slot jadi TIMER 30 dtk + rail amunisi (cap 3) + counter.
//   • TojiUltCine  → sync TOJI_TIMELINE (4,54 dtk = durasi cast.mp3 TERUKUR):
//                    veil 黒 → 武器庫呪霊 masuk → 釈魂刀 dicabut (jeda dramatis
//                    1,86–3,04s) → quote per-frasa 「禪院じゃねぇのか」(0,06s) ·
//                    「よかったな」(3,04s) → tebasan silang X + shake + debu
//                    (4,1s) → settle (4,54s) → state 30 dtk.
// Semua elemen di lapisan BELAKANG konten (z ≤ 124) kecuali quote & slash di
// tepi. reduced-motion: bentuk & kanji akhir tetap tampil (informasi kanon),
// gerakan/flash/shake disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Bar 武器庫 Toji: 20 slot baja (TANPA glow — material logam) ─────────────
// Slot kosong = rongga gunmetal; slot terisi = pelat baja dengan garis kilau
// diagonal tipis (bukan radial glow). Saat penuh → tepi blood red + label 全開.
// Saat state 全開 hidup → slot jadi TIMER (30 → 0) + rail amunisi di bawah.
export function TojiCurseBar({
  charge = 0, ready = false, onCast, casting = false,
  stateOn = false, stateLeft = 0, ammo = 0,
}) {
  const [reduced] = useState(prefersReduced);
  const pct = stateOn
    ? Math.max(0, Math.min(100, (stateLeft / TOJI_STATE_S) * 100))
    : Math.max(0, Math.min(100, (charge / TOJI_ULT_THRESHOLD) * 100));
  const urgent = stateOn && stateLeft <= 5;
  const active = ready || casting || stateOn;
  const accent = stateOn ? (urgent ? TOJI_FLASH : TOJI_STEEL) : (active ? TOJI_BLOOD : TOJI_STEEL);

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
        {!casting && stateOn && (
          <motion.span
            key="state-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: TOJI_FLASH, writingMode: 'vertical-rl', textShadow: `0 0 10px ${TOJI_BLOOD}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={reduced ? { opacity: 1, y: 0 } : { opacity: [0.55, 1, 0.55], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          >
            一撃離脱
          </motion.span>
        )}
        {!casting && !stateOn && ready && (
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
        onClick={ready && !casting && !stateOn ? onCast : undefined}
        aria-label="武器庫 — 天与呪縛・全開"
        disabled={!ready || casting || stateOn}
        className={`relative rounded-[4px] border-[2px] p-[4px] ${
          active ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
        }`}
        style={{
          borderColor: active ? accent : 'rgba(63,63,70,0.75)',
          background: 'rgba(12,12,12,0.78)',
          // 呪力ゼロ: TANPA glow radial — hanya bayangan padat + tepi logam.
          boxShadow: active
            ? `0 0 0 1px ${accent}88, 4px 4px 0 0 rgba(12,12,12,0.6)`
            : '2px 2px 0 0 rgba(12,12,12,0.5)',
        }}
        animate={ready && !reduced && !casting && !stateOn ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={ready && !reduced && !casting && !stateOn ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        <div className="grid grid-cols-10 gap-[2px]">
          {slots.map((_, i) => {
            const lit = casting
              ? true
              : stateOn
                ? i < Math.ceil((pct / 100) * TOJI_ULT_THRESHOLD)
                : i < Math.round(charge);
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
                  transition={stateOn ? { duration: 0.25, ease: 'linear' } : { type: 'spring', stiffness: 160, damping: 20 }}
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
        className={`font-mono font-black text-[10px] tracking-widest ${urgent && !reduced ? 'animate-pulse' : ''}`}
        style={{ color: active ? TOJI_FLASH : 'rgba(203,213,225,0.65)' }}
      >
        {casting ? '全開中' : stateOn ? `${stateLeft}s` : `${charge}/${TOJI_ULT_THRESHOLD}`}
      </span>

      {/* Rail amunisi 武器 ×N — ekonomi 一撃離脱 (benar +1 cap 3; salah bayar 1) */}
      {stateOn && (
        <div data-toji-ammo-rail className="flex items-center gap-1">
          {Array.from({ length: TOJI_AMMO_MAX }).map((_, i) => (
            <div
              key={i}
              className="relative h-[16px] w-[7px] overflow-hidden rounded-[1px]"
              style={{ background: 'rgba(63,63,70,0.22)', border: '1px solid rgba(63,63,70,0.5)' }}
            >
              <motion.div
                className="absolute inset-0"
                style={{ background: `linear-gradient(180deg, ${TOJI_FLASH} 0%, ${TOJI_STEEL} 45%, ${TOJI_GUNMETAL} 100%)` }}
                initial={false}
                animate={{ opacity: i < ammo ? 1 : 0, scaleY: i < ammo ? 1 : 0.5 }}
                transition={{ type: 'spring', stiffness: 170, damping: 20 }}
              />
            </div>
          ))}
        </div>
      )}
      {stateOn && (
        <motion.span
          data-toji-ammo-count
          className="font-serif font-black text-[10px] tracking-[0.2em]"
          style={{ color: ammo > 0 ? TOJI_FLASH : 'rgba(203,213,225,0.55)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: reduced ? 0.95 : [0.6, 1, 0.6] }}
          transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: ammo > 0 ? 1.8 : 2.6, ease: 'easeInOut' }}
        >
          武器 ×{ammo}
        </motion.span>
      )}
    </div>
  );
}

// ── Cinematic 天与呪縛・全開 — sync TOJI_TIMELINE (4,54 dtk = klip TERUKUR) ───
// 0 veil (siluet 黒 + hening 呪力ゼロ) · 1,2 武器庫呪霊 masuk (mulut menganga)
// · 2,4 釈魂刀 dicabut di jeda dramatis · 0,06/3,04 quote per-frasa (merah darah,
// TANPA glow — hard text) · 4,1 tebasan silang X seluruh layar + shake + debu
// · 4,54 settle → state. reduced-motion → tanpa veil/gerak/flash, quote & X tetap.
export function TojiUltCine({ seed = 1 }) {
  const [reduced] = useState(prefersReduced);
  const t = TOJI_TIMELINE;
  const [worm] = useState(() => tojiWorm(seed, 9));

  return (
    <>
      {/* veil: layar meredup ke siluet 黒 (z-124 — di bawah bar 125, atas konten) */}
      {!reduced && (
        <motion.div
          data-toji-ult-veil
          className="fixed inset-0 z-[124] pointer-events-none"
          style={{ background: 'radial-gradient(120% 100% at 50% 50%, rgba(12,12,12,0.5), rgba(12,12,12,0.86) 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: t.settleAt + 0.3, times: [0, 0.06, 0.92, 1], ease: 'easeInOut' }}
        />
      )}

      {/* 武器庫呪霊: masuk dari tepi, mulut menganga (t=1,2) — siluet ungu gelap,
          BUKAN glow 呪力 (identitas #1). */}
      <motion.div
        data-toji-ult-worm
        className="fixed left-1/2 bottom-[10%] z-[128] pointer-events-none"
        style={{ x: '-50%', width: 'min(560px, 82vw)', height: 118 }}
        initial={{ opacity: 0, x: '-78%' }}
        animate={reduced
          ? { opacity: 0.45, x: '-50%' }
          : { opacity: [0, 1, 1, 0.92], x: ['-78%', '-50%', '-50%', '-50%'] }}
        transition={reduced ? { duration: 0 } : { duration: t.slashAt - t.wormAt, delay: t.wormAt, times: [0, 0.22, 0.86, 1], ease: [0.16, 1, 0.3, 1] }}
      >
        <svg viewBox="0 0 560 118" width="100%" height="100%" className="block" aria-hidden="true">
          {worm.segments.map((sg, i) => (
            <circle
              key={sg.id}
              cx={(sg.x / 100) * 560} cy={(sg.y / 100) * 118} r={sg.size * 2.1}
              fill={i === 0 ? TOJI_WORM : `rgba(91,33,182,${0.75 - i * 0.06})`}
              stroke={TOJI_VOID} strokeWidth="1.4"
            />
          ))}
          {/* mulut menganga (kepala) */}
          <ellipse
            cx={(worm.head.x / 100) * 560 + worm.head.r * 2.1 * 0.55} cy={(worm.head.y / 100) * 118}
            rx={worm.head.r * 2.1 * 0.6} ry={worm.head.r * 2.1 * 0.75}
            fill={TOJI_VOID} stroke={TOJI_BLOOD} strokeWidth="1.6" opacity="0.85"
          />
        </svg>
      </motion.div>

      {/* 釈魂刀 dicabut (t=2,4 — di jeda dramatis klip): bilah + kilau baja
          BERJALAN di bilah (bukan glow). */}
      <motion.div
        data-toji-ult-draw
        className="fixed left-1/2 bottom-[12%] z-[129] pointer-events-none"
        style={{ x: '-50%' }}
        initial={{ opacity: 0, y: 26, rotate: -8 }}
        animate={reduced
          ? { opacity: 0.7, y: 0, rotate: -8 }
          : { opacity: [0, 1, 1, 0], y: [26, 0, -6, -18], rotate: [-8, -8, -6, -4] }}
        transition={reduced ? { duration: 0 } : { duration: 1.7, delay: t.drawAt, times: [0, 0.18, 0.8, 1], ease: [0.33, 1, 0.68, 1] }}
      >
        <svg viewBox="0 0 34 210" width="30" height="186" className="block" aria-hidden="true">
          <path d="M17 2 L24 40 L20 150 L14 150 L10 40 Z" fill={TOJI_STEEL} stroke={TOJI_GUNMETAL} strokeWidth="1.4" />
          <path d="M17 2 L20 40 L17 150 L14 40 Z" fill={TOJI_FLASH} opacity="0.5" />
          <rect x="11" y="150" width="12" height="26" rx="2" fill={TOJI_VOID} stroke={TOJI_GUNMETAL} strokeWidth="1.2" />
          <rect x="9" y="176" width="16" height="30" rx="2" fill={TOJI_GUNMETAL} stroke={TOJI_VOID} strokeWidth="1" />
          {!reduced && (
            <motion.rect
              x="12" y="0" width="10" height="26" fill={TOJI_FLASH} opacity="0.85"
              initial={{ y: 10 }} animate={{ y: [10, 140] }}
              transition={{ duration: 0.7, delay: t.drawAt + 0.35, ease: 'easeInOut' }}
            />
          )}
        </svg>
      </motion.div>

      {/* Quote per-frasa — SYNC ke segmen klip TERUKUR (phrase1 0,06–1,86s ·
          phrase2 3,04–3,92s). Merah darah, TANPA glow: hard text + bayangan
          padat (identitas 冷たい鋼). */}
      <div className="fixed inset-x-0 top-[12%] z-[133] pointer-events-none flex flex-col items-center gap-[0.9vmin]">
        {TOJI_QUOTE.map((frase, i) => {
          const at = i === 0 ? t.quote1At : t.quote2At;
          const last = i === TOJI_QUOTE.length - 1;
          const dur = i === 0 ? 1.84 : 1.5;
          return (
            <motion.span
              key={frase}
              data-toji-quote
              className="font-serif font-black select-none"
              style={{
                fontSize: last ? 'clamp(30px, 6.8vmin, 64px)' : 'clamp(20px, 4.4vmin, 42px)',
                color: TOJI_BLOOD,
                WebkitTextStroke: `1.4px ${TOJI_VOID}`,
                textShadow: `0 3px 0 ${TOJI_VOID}`,
                willChange: 'transform, opacity',
              }}
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={reduced
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: [0, 1, 1, last ? 1 : 0], y: [10, 0, 0, 0], scale: [0.94, 1.03, 1, 1] }}
              transition={reduced ? { duration: 0 } : { duration: dur, delay: at, times: [0, 0.14, 0.86, 1], ease: [0.16, 1, 0.3, 1] }}
            >
              {frase}
            </motion.span>
          );
        })}
      </div>

      {/* Tebasan silang X seluruh layar + shake + debu (t=4,1) */}
      <motion.div
        data-toji-ult-slash
        className="fixed inset-0 z-[131] pointer-events-none"
        animate={reduced ? {} : { x: [0, -10, 10, -6, 4, 0], y: [0, 7, -6, 3, -2, 0] }}
        transition={{ duration: 0.34, delay: t.slashAt, ease: 'easeOut' }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
          <motion.line
            x1="-4" y1="18" x2="104" y2="84" stroke={TOJI_STEEL} strokeWidth="1.1" vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }} animate={reduced ? { pathLength: 1 } : { pathLength: [0, 1, 1] }}
            transition={reduced ? { duration: 0 } : { duration: 0.22, delay: t.slashAt, times: [0, 0.5, 1], ease: 'easeOut' }}
          />
          <motion.line
            x1="6" y1="88" x2="98" y2="12" stroke={TOJI_FLASH} strokeWidth="0.8" vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }} animate={reduced ? { pathLength: 1 } : { pathLength: [0, 1, 1] }}
            transition={reduced ? { duration: 0 } : { duration: 0.22, delay: t.slashAt + 0.07, times: [0, 0.5, 1], ease: 'easeOut' }}
          />
        </svg>
      </motion.div>

      {/* flash putih 1 frame saat tebasan mendarat */}
      {!reduced && (
        <motion.div
          className="fixed inset-0 z-[132] pointer-events-none"
          style={{ background: TOJI_FLASH }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.2, delay: t.slashAt, ease: 'linear' }}
        />
      )}

      {/* debu terangkat (t=4,1) */}
      {!reduced && Array.from({ length: 5 }).map((_, i) => (
        <motion.span
          key={`toji-ult-dust-${i}`}
          className="fixed rounded-full"
          style={{
            left: `${18 + i * 16}%`, bottom: '8%',
            width: 5 + (i % 3) * 2, height: 5 + (i % 3) * 2,
            background: TOJI_GUNMETAL,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.7, 0], y: [0, -26 - i * 4] }}
          transition={{ duration: 0.6, delay: t.slashAt + 0.08, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

export default TojiCurseBar;
