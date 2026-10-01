import { useState } from 'react';
import { motion } from 'motion/react';
import {
  YUTA_STYLE, YUTA_DOMAIN, YUTA_ULT_THRESHOLD, YUTA_DOMAIN_DURATION_S,
  yutaCopyMeta, yutaSwordField,
} from './yutaFx';

// ─────────────────────────────────────────────────────────────────────────────
// 真贋相愛 · 模倣 — bar 呪力 + picker 3 katana + domain (pack_12, visual 'yuta').
// Kanon: 真贋相愛 (しんがんそうあい) = 荒廃した地 + 無数の刀 (lautan pedang tertancap)
// + あわじ結び mizuhiki 紅白 (tali merah-putih) + 血の色の空 (langit merah darah).
// Tiap pedang berisi 1 teknik copy — sekali pakai lalu hancur.
//   • YutaCurseBar      → bar 呪力 20 slot (pola JJK); tap saat penuh = cast
//                          真贋相愛 → cinematic → picker 3 katana → pilih 1 →
//                          domain hidup 30 dtk (bar jadi TIMER + label kanji copy).
//   • YutaKatanaPicker  → 3 bilah naik dari lautan pedang; kanji + blurb tiap
//                          ultimate; warna = meta.color (tiap karakter beda).
//   • YutaDomainCine    → cinematic 領域展開 → 真贋相愛 (per-kanji) → 3 katana
//                          menghujam; sync durasi cast.mp3 user (4,86s).
//   • YutaDomainField   → lautan pedang (yutaSwordField) redup selama 30 dtk,
//                          tint warna sesuai copy; mizuhiki 紅白 di langit.
// Palet KANON dari domain.gif user: merah darah + langit merah gelap + baja.
// reduced-motion → bentuk & kanji akhir tetap tampil, gerakan disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Durasi cinematic cast = durasi klip user domain yutta.mp3 (4,86s). Timer 30 dtk
// baru mulai SETELAH settle ini (supaya waktu main penuh).
export const YUTA_CAST_SETTLE_MS = 4860;
const YUTA_CAST_SETTLE_S = YUTA_CAST_SETTLE_MS / 1000;

const KANJI_ULT = YUTA_STYLE.ult.kanji.split(''); // 真 贋 相 愛

// ── Bar 呪力 20 slot (pola JJK konsisten) → saat domain hidup jadi TIMER ────
export function YutaCurseBar({
  charge = 0, ready = false, onCast, casting = false,
  domainOn = false, domainLeft = 0, copyId = null,
}) {
  const [reduced] = useState(prefersReduced);
  const pct = domainOn
    ? Math.max(0, Math.min(100, (domainLeft / YUTA_DOMAIN_DURATION_S) * 100))
    : Math.max(0, Math.min(100, (charge / YUTA_ULT_THRESHOLD) * 100));
  const urgent = domainOn && domainLeft <= 5;
  const active = ready || casting || domainOn;
  const meta = copyId ? yutaCopyMeta(copyId) : null;
  const accent = urgent ? YUTA_DOMAIN.steel : (meta?.color || YUTA_DOMAIN.blood);

  const slots = Array.from({ length: YUTA_ULT_THRESHOLD });
  return (
    <div
      data-yuta-cursebar
      className="pointer-events-none fixed right-2.5 top-[6vh] sm:top-1/2 sm:-translate-y-1/2 z-[125] flex flex-col items-center gap-1.5"
    >
      <div className="flex h-14 items-center justify-center">
        {casting && (
          <motion.span
            key="cast-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: YUTA_DOMAIN.steel, writingMode: 'vertical-rl', textShadow: `0 0 12px ${YUTA_DOMAIN.blood}` }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}
          >
            領域展開
          </motion.span>
        )}
        {!casting && domainOn && meta && (
          <motion.span
            key="domain-label"
            className="font-serif font-black tracking-[0.2em] text-[10px]"
            style={{ color: YUTA_DOMAIN.steel, writingMode: 'vertical-rl', textShadow: `0 0 10px ${meta.color}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={reduced ? { opacity: 1, y: 0 } : { opacity: [0.55, 1, 0.55], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          >
            {meta.kanji}
          </motion.span>
        )}
        {!casting && !domainOn && ready && (
          <motion.span
            key="ready-label"
            className="font-serif font-black tracking-[0.25em] text-[10px]"
            style={{ color: YUTA_DOMAIN.steel, writingMode: 'vertical-rl', textShadow: `0 0 10px ${YUTA_DOMAIN.blood}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={reduced ? { opacity: 1, y: 0 } : { opacity: [0.65, 1, 0.65], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            真贋相愛
          </motion.span>
        )}
      </div>

      <motion.button
        type="button"
        onClick={ready && !casting && !domainOn ? onCast : undefined}
        aria-label="呪力 — 領域展開・真贋相愛"
        disabled={!ready || casting || domainOn}
        className={`relative rounded-[4px] border-[2px] p-[4px] ${
          active ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
        }`}
        style={{
          borderColor: active ? accent : 'rgba(127,29,29,0.6)',
          background: 'rgba(11,5,8,0.82)',
          boxShadow: active
            ? `0 0 0 1px ${accent}88, 0 0 16px ${accent}55, 4px 4px 0 0 rgba(11,5,8,0.6)`
            : '2px 2px 0 0 rgba(11,5,8,0.5)',
        }}
        animate={ready && !reduced && !casting && !domainOn ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={ready && !reduced && !casting && !domainOn ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        <div className="grid grid-cols-10 gap-[2px]">
          {slots.map((_, i) => {
            const lit = casting || (domainOn ? i < Math.ceil((pct / 100) * YUTA_ULT_THRESHOLD) : i < Math.round(charge));
            return (
              <div
                key={i}
                className="relative h-[9px] w-[9px] overflow-hidden rounded-[1px]"
                style={{ background: 'rgba(127,29,29,0.22)', border: '1px solid rgba(127,29,29,0.5)' }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(135deg, ${accent} 0%, #b91c1c 55%, #7f1d1d 100%)`, boxShadow: 'inset 0 0 0 0.5px rgba(11,5,8,0.6)' }}
                  initial={false}
                  animate={{ opacity: lit ? 1 : 0, scale: lit ? 1 : 0.7 }}
                  transition={domainOn ? { duration: 0.25, ease: 'linear' } : { type: 'spring', stiffness: 160, damping: 20 }}
                />
              </div>
            );
          })}
        </div>

        {/* 刀 (katana kecil) di sisi tombol saat aktif */}
        {active && (
          <span className="pointer-events-none absolute -right-[30px] top-1/2 -translate-y-1/2" aria-hidden="true">
            <svg viewBox="0 0 26 40" width="26" height="40" className="block">
              <path d="M13,2 L16,18 L15,30 L11,30 L10,18 Z" fill={YUTA_DOMAIN.steel} stroke={YUTA_DOMAIN.ground} strokeWidth="1" />
              <path d="M13,2 L15,18 L13,30 L11,18 Z" fill={YUTA_DOMAIN.mizuhiki} opacity="0.5" />
              <rect x="10" y="30" width="6" height="8" rx="1" fill={YUTA_DOMAIN.ground} stroke={YUTA_DOMAIN.bloodD} strokeWidth="0.8" />
            </svg>
          </span>
        )}
      </motion.button>

      <span
        className={`font-mono font-black text-[10px] tracking-widest ${urgent && !reduced ? 'animate-pulse' : ''}`}
        style={{ color: active ? YUTA_DOMAIN.steel : 'rgba(203,213,225,0.65)' }}
      >
        {casting ? '展開中' : domainOn ? `${domainLeft}s` : `${charge}/${YUTA_ULT_THRESHOLD}`}
      </span>
    </div>
  );
}

// ── Picker 3 katana — 3 bilah naik dari lautan pedang; kanji + blurb copy ────
export function YutaKatanaPicker({ katanas = [], onPick, onCancel }) {
  const [reduced] = useState(prefersReduced);
  return (
    <motion.div
      data-yuta-picker
      className="fixed inset-0 z-[140] flex flex-col items-center justify-center gap-4 bg-[rgba(11,5,8,0.72)] px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.24 }}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="font-serif font-black tracking-[0.4em] text-[11px]" style={{ color: YUTA_DOMAIN.mizuhiki }}>
          模倣
        </span>
        <span className="font-serif font-black text-lg sm:text-xl" style={{ color: YUTA_DOMAIN.steel, textShadow: `0 0 14px ${YUTA_DOMAIN.blood}` }}>
          PILIH SATU KATANA
        </span>
        <span className="font-mono text-[10px] tracking-widest" style={{ color: 'rgba(203,213,225,0.6)' }}>
          真贋相愛 — 3 の刀 · pilih 1 ultimate
        </span>
      </div>

      <div className="flex w-full max-w-3xl items-stretch justify-center gap-2 sm:gap-4">
        {katanas.map((id, i) => {
          const meta = yutaCopyMeta(id);
          if (!meta) return null;
          return (
            <motion.button
              key={id}
              type="button"
              data-yuta-pick={id}
              onClick={() => onPick?.(id)}
              className="group relative flex flex-1 flex-col items-center gap-2 rounded-[4px] border-[2px] px-2 py-3 sm:px-3 sm:py-4"
              style={{ borderColor: `${meta.color}aa`, background: 'rgba(11,5,8,0.9)', boxShadow: `0 0 18px ${meta.color}44, 4px 4px 0 0 rgba(11,5,8,0.6)` }}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 40 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
              whileHover={reduced ? undefined : { y: -6, scale: 1.03 }}
              whileTap={reduced ? undefined : { scale: 0.97 }}
            >
              {/* bilah katana naik */}
              <svg viewBox="0 0 20 92" width="26" height="88" className="block" aria-hidden="true">
                <path d="M10,2 L14,20 L12,74 L8,74 L6,20 Z" fill={YUTA_DOMAIN.steel} stroke={YUTA_DOMAIN.ground} strokeWidth="1" />
                <path d="M10,2 L12,20 L10,74 L8,20 Z" fill={YUTA_DOMAIN.mizuhiki} opacity="0.55" />
                <rect x="4" y="20" width="12" height="3" rx="1" fill={meta.color} />
                <rect x="7" y="74" width="6" height="16" rx="1" fill={YUTA_DOMAIN.ground} stroke={meta.color} strokeWidth="0.8" />
              </svg>
              <span className="font-serif font-black text-center leading-tight text-[13px] sm:text-[15px]" style={{ color: meta.color, textShadow: `0 0 10px ${meta.color}66` }}>
                {meta.kanji}
              </span>
              <span className="text-center text-[9px] sm:text-[10px] leading-tight" style={{ color: 'rgba(226,232,240,0.85)' }}>
                {meta.blurb}
              </span>
            </motion.button>
          );
        })}
      </div>

      <button
        type="button"
        data-yuta-picker-cancel
        onClick={onCancel}
        className="rounded-[3px] border px-3 py-1 font-mono text-[10px] tracking-widest"
        style={{ borderColor: 'rgba(203,213,225,0.35)', color: 'rgba(203,213,225,0.75)' }}
      >
        やめる (batal)
      </button>
    </motion.div>
  );
}

// ── Cinematic cast 領域展開・真贋相愛 — sync klip user (4,86s) ────────────────
export function YutaDomainCine({ copyId = null }) {
  const [reduced] = useState(prefersReduced);
  const t = YUTA_CAST_SETTLE_S;
  const meta = copyId ? yutaCopyMeta(copyId) : null;
  const field = yutaSwordField(7, 18);

  return (
    <>
      {/* veil: layar meredup ke langit merah darah */}
      <motion.div
        data-yuta-cast-veil
        className="fixed inset-0 z-[124] pointer-events-none"
        style={{ background: `radial-gradient(120% 100% at 50% 60%, rgba(26,5,5,0.62), rgba(11,5,8,0.94) 100%)` }}
        initial={{ opacity: 0 }} animate={{ opacity: reduced ? 0.9 : [0, 1, 1, 0.92] }}
        transition={reduced ? { duration: 0 } : { duration: t, times: [0, 0.06, 0.9, 1], ease: 'easeInOut' }}
      />

      {/* lautan pedang menghujam (siluet, muncul di paruh akhir) */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-[126] pointer-events-none"
        style={{ height: '42vh' }}
        initial={{ opacity: 0, y: 30 }}
        animate={reduced ? { opacity: 0.6, y: 0 } : { opacity: [0, 0, 0.85], y: [30, 30, 0] }}
        transition={reduced ? { duration: 0 } : { duration: t, times: [0, 0.55, 1], ease: 'easeOut' }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
          {field.map((s) => (
            <line
              key={s.id} x1={s.x} y1={100} x2={s.x + Math.sin((s.rot * Math.PI) / 180) * s.h * 0.4} y2={100 - s.h}
              stroke={YUTA_DOMAIN.steelD} strokeWidth={s.w * 0.5} vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </motion.div>

      {/* 領域展開 kecil muncul dulu (sinkron klip) */}
      <motion.div
        data-yuta-cast-open
        className="fixed inset-x-0 top-[16%] z-[133] flex justify-center pointer-events-none"
        initial={{ opacity: 0, y: 10 }}
        animate={reduced ? { opacity: 1, y: 0 } : { opacity: [0, 1, 1, 0], y: [10, 0, 0, 0] }}
        transition={reduced ? { duration: 0 } : { duration: 1.5, times: [0, 0.2, 0.8, 1], ease: 'easeOut' }}
      >
        <span className="font-serif font-black tracking-[0.5em] text-[13px] sm:text-base" style={{ color: YUTA_DOMAIN.mizuhiki, textShadow: `0 0 12px ${YUTA_DOMAIN.blood}` }}>
          領域展開
        </span>
      </motion.div>

      {/* 真贋相愛 per-kanji (inti nama domain) */}
      <div className="fixed inset-x-0 top-[30%] z-[134] flex items-center justify-center gap-[1.2vmin] pointer-events-none">
        {KANJI_ULT.map((ch, i) => (
          <motion.span
            key={`${ch}-${i}`}
            data-yuta-cast-kanji
            className="font-serif font-black select-none"
            style={{
              fontSize: 'clamp(42px, 11vmin, 108px)', color: YUTA_DOMAIN.blood,
              WebkitTextStroke: `1.6px ${YUTA_DOMAIN.ground}`,
              textShadow: `0 4px 0 ${YUTA_DOMAIN.ground}, 0 0 26px ${YUTA_DOMAIN.blood}88`,
            }}
            initial={{ opacity: 0, scale: 0.7, y: 14 }}
            animate={reduced
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: [0, 1, 1], scale: [0.7, 1.06, 1], y: [14, 0, 0] }}
            transition={reduced ? { duration: 0 } : { duration: 0.7, delay: 0.9 + i * 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {ch}
          </motion.span>
        ))}
      </div>

      {/* echo kanji copy yang bakal dipakai (kalau sudah dipilih) */}
      {meta && (
        <motion.div
          data-yuta-cast-copy
          className="fixed inset-x-0 bottom-[16%] z-[134] flex justify-center pointer-events-none"
          initial={{ opacity: 0, y: 12 }}
          animate={reduced ? { opacity: 0.95, y: 0 } : { opacity: [0, 0.95, 0.85], y: [12, 0, 0] }}
          transition={reduced ? { duration: 0 } : { duration: 0.6, delay: t * 0.72, ease: 'easeOut' }}
        >
          <span className="font-serif font-black tracking-[0.3em] text-[15px] sm:text-lg" style={{ color: meta.color, textShadow: `0 0 16px ${meta.color}88` }}>
            {meta.kanji}
          </span>
        </motion.div>
      )}

      {/* mizuhiki 紅白 — 2 untaian tali (akurat, tidak rame) */}
      {!reduced && (
        <svg className="fixed inset-x-0 top-0 z-[127] w-full pointer-events-none" height="120" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
          {[0, 1].map((i) => (
            <motion.path
              key={i}
              d={`M-4,${6 + i * 7} C 26,${2 + i * 7} 74,${12 + i * 7} 104,${6 + i * 7}`}
              fill="none"
              stroke={i === 0 ? YUTA_DOMAIN.mizuhiki : YUTA_DOMAIN.mizuhikiRed}
              strokeWidth="1.4"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.9, 0.5] }}
              transition={{ duration: 1.2, delay: 0.3 + i * 0.16, ease: 'easeInOut' }}
            />
          ))}
        </svg>
      )}

      {/* flash merah 1 frame saat 3 katana menghujam (paruh akhir) */}
      {!reduced && (
        <motion.div
          className="fixed inset-0 z-[132] pointer-events-none"
          style={{ background: YUTA_DOMAIN.blood }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 0.42, 0] }}
          transition={{ duration: 0.26, delay: t * 0.62, ease: 'linear' }}
        />
      )}
    </>
  );
}

// ── Domain hidup 30 dtk: lautan pedang redup + mizuhiki + tint copy ─────────
export function YutaDomainField({ seed = 1, copyId = null }) {
  const [reduced] = useState(prefersReduced);
  const meta = copyId ? yutaCopyMeta(copyId) : null;
  const tint = meta?.color || YUTA_DOMAIN.blood;
  const field = yutaSwordField(seed, 24);

  return (
    <motion.div
      data-yuta-domain-field
      className="fixed inset-0 z-[123] pointer-events-none"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.6 }}
    >
      {/* langit merah darah → hitam */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(130% 90% at 50% 78%, ${tint}22 0%, rgba(26,5,5,0.35) 42%, rgba(11,5,8,0.66) 100%)` }}
      />

      {/* mizuhiki 紅白 di langit */}
      {!reduced && (
        <svg className="absolute inset-x-0 top-0 w-full" height="90" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
          {[0, 1].map((i) => (
            <path
              key={i}
              d={`M-4,${6 + i * 7} C 26,${2 + i * 7} 74,${12 + i * 7} 104,${6 + i * 7}`}
              fill="none" stroke={i === 0 ? YUTA_DOMAIN.mizuhiki : YUTA_DOMAIN.mizuhikiRed}
              strokeWidth="1.2" vectorEffect="non-scaling-stroke" opacity="0.5"
            />
          ))}
        </svg>
      )}

      {/* lautan pedang tertancap (redup, deterministik) */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 w-full h-[46vh]" aria-hidden="true">
        {field.map((s) => {
          const tipX = s.x + Math.sin((s.rot * Math.PI) / 180) * s.h * 0.42;
          const tipY = 100 - s.h * (0.7 + s.scale * 0.5);
          return (
            <g key={s.id} opacity={0.32 + s.scale * 0.14}>
              <line x1={s.x} y1={100} x2={tipX} y2={tipY} stroke={YUTA_DOMAIN.steelD} strokeWidth={s.w * 0.6} vectorEffect="non-scaling-stroke" />
              <line x1={s.x} y1={100} x2={tipX} y2={tipY} stroke={YUTA_DOMAIN.steel} strokeWidth={s.w * 0.22} vectorEffect="non-scaling-stroke" opacity="0.5" />
            </g>
          );
        })}
      </svg>

      {/* tanah retak (garis gelap di dasar) */}
      <div className="absolute inset-x-0 bottom-0 h-[16vh]" style={{ background: `linear-gradient(180deg, transparent, ${YUTA_DOMAIN.ground} 70%)` }} />
    </motion.div>
  );
}

export default YutaCurseBar;
