import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  MEGUMI_STYLE, MEGUMI_INK, MEGUMI_SILVER, MEGUMI_INDIGO,
  MEGUMI_ULT_THRESHOLD, MEGUMI_SUMMON_DURATION_S, MEGUMI_SUMMON_TIMELINE,
  MEGUMI_CAST_VOICE, MEGUMI_WHEEL_NOTCHES, megumiWheelNotchPlan, megumiShadowMotes,
} from './megumiFx';
import { MEGUMI_GIFS } from './megumiGifs';
import { playDomainBoom, playWheelCreak, playGiantStep, playMakoraRoar } from '../../utils/sfx';

// ─────────────────────────────────────────────────────────────────────────────
// 魔虚羅 · 適応 — bar 呪力 20 slot + roda 八握剣 8 takik + cinematic summon
// (pack_10, visual 'megumi'). Ultimate `rare` = ONE-SHOT, TANPA Domain Expansion.
//   • MegumiCurseBar   → 20 slot (pola JJK konsisten); tap saat penuh = summon;
//                        saat summon hidup → bar jadi TIMER 30s + RODA 8 takik
//                        (meter 適応) + status 八握剣 saat roda penuh.
//   • MegumiSummonCine → sync klip chant 4.959s (MEGUMI_SUMMON_TIMELINE):
//                        veil → genangan menyebar → 布瑠部由良由良 per-karakter →
//                        roda 八握剣 → siluet raksasa bangkit → 魔虚羅 → shake →
//                        FLASH + BOOM → settle (roda kecil persist).
//   • MegumiAura       → persist 30s: genangan + aura 影 (bara hitam naik) +
//                        roda kecil di belakang kuis (portal z-6).
// Filosofi (spec §6): Megumi = KETAHANAN. 適応 = asuransi yang snowball jadi
// kekuatan (makin salah makin kebal & ngebantu); bayarannya risiko 輪砕け.
// Beda dari Sukuna yang menyerang (必中) — Megumi BERTAHAN.
// reduced-motion: kanji/siluet/roda TETAP tampil (informasi kanon), shake/flash
// /aliran disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Roda 八握剣 (Dharma wheel): 8 jari + 8 takik adaptasi. TANPA mata. ───────
// `notches` = takik yang sudah terisi (0..8). `small` = versi persist kecil.
function AdaptWheel({ notches = 0, reduced = false, size = '46vmin', spin = true, glow = 0.75 }) {
  const plan = megumiWheelNotchPlan(notches);
  const spokes = Array.from({ length: MEGUMI_WHEEL_NOTCHES }, (_, i) => (i / MEGUMI_WHEEL_NOTCHES) * 360);
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="h-auto"
      style={{ width: size }}
      aria-label={`八握剣 roda adaptasi ${notches}/${MEGUMI_WHEEL_NOTCHES}`}
      initial={{ rotate: -18, opacity: 0, scale: 0.82 }}
      animate={reduced
        ? { rotate: 0, opacity: 1, scale: 1 }
        : { rotate: 360, opacity: [0, glow, glow * 0.9], scale: [0.82, 1, 1] }}
      transition={reduced
        ? { duration: 0 }
        : { rotate: { duration: spin ? 26 : 0, repeat: spin ? Infinity : 0, ease: 'linear' }, opacity: { duration: 0.8 }, scale: { duration: 0.8 } }}
    >
      <defs>
        <radialGradient id="megWheelGlow" cx="50%" cy="50%" r="58%">
          <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#4338ca" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#4338ca" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#megWheelGlow)" />
      {/* Cincin luar + dalam */}
      <circle cx="50" cy="50" r="36" fill="none" stroke="#6d28d9" strokeWidth="1.6" strokeOpacity="0.9" />
      <circle cx="50" cy="50" r="31" fill="none" stroke={MEGUMI_INDIGO} strokeWidth="0.7" strokeOpacity="0.7" />
      <circle cx="50" cy="50" r="9" fill="#0a0a0a" stroke="#6d28d9" strokeWidth="1.2" />
      {/* 8 jari-jari + handle (bola) + takik adaptasi */}
      {spokes.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x2 = 50 + Math.cos(rad) * 36;
        const y2 = 50 + Math.sin(rad) * 36;
        const hx = 50 + Math.cos(rad) * 38.5;
        const hy = 50 + Math.sin(rad) * 38.5;
        const on = plan[i]?.on;
        return (
          <g key={i}>
            <line x1="50" y1="50" x2={x2} y2={y2} stroke={MEGUMI_SILVER} strokeWidth="0.7" strokeLinecap="round" strokeOpacity="0.75" />
            <circle cx={hx} cy={hy} r={on ? 2.6 : 1.8} fill={on ? '#8b5cf6' : '#12121c'} stroke={on ? '#c4b5fd' : MEGUMI_SILVER} strokeWidth="0.7" />
            {/* Takik 適応: garis kecil di pangkal jari saat sudah diadaptasi */}
            {on && (
              <motion.line
                x1={50 + Math.cos(rad) * 20} y1={50 + Math.sin(rad) * 20}
                x2={50 + Math.cos(rad) * 26} y2={50 + Math.sin(rad) * 26}
                stroke="#a78bfa" strokeWidth="1.6" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.3, ease: 'easeOut' }}
              />
            )}
          </g>
        );
      })}
    </motion.svg>
  );
}

// ── Bar 呪力 Megumi: 20 slot + roda 8 takik + status ────────────────────────
export function MegumiCurseBar({
  charge = 0, ready = false, onCast, summonOn = false, summonLeft = 0,
  notches = 0, swordReady = false,
}) {
  const [reduced] = useState(prefersReduced);
  const pct = summonOn
    ? Math.max(0, Math.min(100, (summonLeft / MEGUMI_SUMMON_DURATION_S) * 100))
    : Math.max(0, Math.min(100, (charge / MEGUMI_ULT_THRESHOLD) * 100));
  const urgent = summonOn && summonLeft <= 5;
  const accent = swordReady ? '#e2e8f0' : MEGUMI_INDIGO;
  const fill = urgent ? '#c4b5fd' : accent;

  // 20 slot: 2 baris × 10 kolom (mudah dibaca di layar sempit).
  const slots = Array.from({ length: MEGUMI_ULT_THRESHOLD });
  return (
    <div
      data-megumi-cursebar
      className="pointer-events-none fixed right-2.5 top-[6vh] sm:top-1/2 sm:-translate-y-1/2 z-[125] flex flex-col items-center gap-1.5"
    >
      <div className="flex h-14 items-center justify-center">
        {summonOn && (
          <motion.span
            key="summon-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#e9e9f2', writingMode: 'vertical-rl', textShadow: `0 0 12px ${MEGUMI_INDIGO}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: reduced ? 1 : [0.55, 1, 0.55], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          >
            魔虚羅
          </motion.span>
        )}
        {!summonOn && ready && (
          <motion.span
            key="ready-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#e9e9f2', writingMode: 'vertical-rl', textShadow: `0 0 12px ${MEGUMI_INDIGO}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: reduced ? 1 : [0.65, 1, 0.65], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            十種影法術
          </motion.span>
        )}
      </div>

      <motion.button
        type="button"
        onClick={ready ? onCast : undefined}
        aria-label="呪力 — 魔虚羅"
        disabled={!ready}
        className={`relative rounded-[4px] border-[2px] p-[4px] ${
          ready ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
        }`}
        style={{
          borderColor: (ready || summonOn) ? (urgent ? '#c4b5fd' : accent) : 'rgba(67,56,202,0.45)',
          background: 'rgba(6,6,14,0.66)',
          boxShadow: (ready || summonOn)
            ? `0 0 18px 3px ${fill}cc, inset 0 0 10px ${fill}55`
            : '0 0 8px 1px rgba(67,56,202,0.3)',
        }}
        animate={ready && !reduced ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={ready && !reduced ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        <div className="grid grid-cols-10 gap-[2px]">
          {slots.map((_, i) => {
            // Isi: charge (atau timer summon → SEMUA penuh lalu menyusut per kolom).
            const lit = summonOn
              ? i < Math.ceil((pct / 100) * MEGUMI_ULT_THRESHOLD)
              : i < Math.round(charge);
            return (
              <div
                key={i}
                className="relative h-[9px] w-[9px] overflow-hidden rounded-[2px]"
                style={{ background: 'rgba(67,56,202,0.12)', border: '1px solid rgba(67,56,202,0.28)' }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${fill}, ${urgent ? '#e9e9f2' : '#6d28d9'})`,
                    boxShadow: `0 0 7px ${fill}aa`,
                  }}
                  initial={false}
                  animate={{ opacity: lit ? 1 : 0, scale: lit ? 1 : 0.6 }}
                  transition={summonOn ? { duration: 0.25, ease: 'linear' } : { type: 'spring', stiffness: 140, damping: 18 }}
                />
              </div>
            );
          })}
        </div>

        {/* Roda 八握剣 KECIL di dalam tombol saat summon (meter 適応 ringkas) */}
        {summonOn && (
          <div className="pointer-events-none absolute -right-[52px] top-1/2 -translate-y-1/2">
            <AdaptWheel notches={notches} reduced={reduced} size="44px" spin={false} glow={0.9} />
          </div>
        )}
      </motion.button>

      <span
        className={`font-mono font-black text-[10px] tracking-widest ${urgent && !reduced ? 'animate-pulse' : ''}`}
        style={{ color: summonOn ? (urgent ? '#c4b5fd' : '#e9e9f2') : ready ? '#e9e9f2' : 'rgba(233,233,242,0.6)' }}
      >
        {summonOn ? `${summonLeft}s` : `${charge}/${MEGUMI_ULT_THRESHOLD}`}
      </span>

      {/* Status roda: 八握剣 (pedang tercabut) saat penuh — mini-必中 aktif */}
      {summonOn && (
        <motion.span
          data-megumi-wheel-status
          className="font-serif font-black text-[10px] tracking-[0.25em]"
          style={{ writingMode: 'vertical-rl', color: swordReady ? '#e2e8f0' : '#c4b5fd', textShadow: `0 0 10px ${accent}` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: reduced ? 0.95 : [0.6, 1, 0.6] }}
          transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: swordReady ? 1.2 : 2.2, ease: 'easeInOut' }}
        >
          {swordReady ? '八握剣' : `適応 ${notches}/${MEGUMI_WHEEL_NOTCHES}`}
        </motion.span>
      )}
    </div>
  );
}

// ── Teks per-karakter (sync frasa chant) ─────────────────────────────────────
function SequentialChars({ text, start, perChar, reduced, className, style }) {
  const chars = [...String(text || '')];
  return (
    <span className={className} style={style} aria-label={text}>
      {chars.map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, scale: 1.4, filter: 'blur(6px)' }}
          animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1], scale: [1.4, 1, 1], filter: ['blur(6px)', 'blur(0px)', 'blur(0px)'] }}
          transition={{ duration: reduced ? 0 : 0.24, delay: reduced ? 0 : start + i * perChar, ease: 'easeOut' }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

// ── Siluet raksasa 魔虚羅: badan hitam + kepala ular + roda 八握剣 di punggung ──
// Versi Megumi = KECIL/terbatas/切札 (anti-nabrak: Sukuna = raksasa/Meguna).
// REDESIGN v2: (a) leher TEBAL nyambung kepala↔bahu, (b) roda di belakang bahu
// KANAN (mengambang, poking keluar), (c) backlight ungu → kontras di tema gelap,
// (d) siluet MEMUDAR saat settle (dulu nangkring 30 dtk nutupin kuis).
function MakoraSilhouette({ reduced, start, settleAt = 4.85, settleDur = 0.6, seed = 1 }) {
  const total = Math.max(0.6, settleAt + settleDur - start);
  const tRise = Math.min(0.9, 1.1 / total);            // fraksi waktu fase bangkit
  const tSettle = Math.max(tRise + 0.05, (settleAt - start) / total);
  const times = [0, tRise, tSettle, 1];
  return (
    <motion.div
      data-megumi-makora
      className="absolute inset-x-0 bottom-[6%] flex justify-center"
      initial={{ opacity: 0, y: '16vh', scaleY: 0.72 }}
      animate={reduced
        ? { opacity: [1, 1, 0], y: 0, scaleY: 1 }
        : { opacity: [0, 1, 1, 0], y: ['16vh', '0vh', '0vh', '-16vh'], scaleY: [0.72, 1, 1, 0.92] }}
      transition={reduced
        ? { duration: total, delay: start, times: [0, tSettle, 1], ease: 'easeOut' }
        : { duration: total, delay: start, times, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative">
        {/* Backlight ungu — misahin siluet dari background gelap (redesign v2) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[14%]"
          style={{ background: 'radial-gradient(50% 46% at 50% 56%, rgba(109,40,217,0.30), rgba(67,56,202,0.12) 55%, transparent 78%)' }}
        />
        <svg viewBox="0 0 300 340" className="relative w-[min(62vh,88vw)] h-auto" aria-label="魔虚羅">
        <defs>
          <linearGradient id={`makora-${seed}`} x1="0" y1="1" x2="0" y2="0">
            {/* REDESIGN v2: kontras dinaikkan (#0d0d18 → #2a2a44) supaya siluet
                kebaca di tema gelap (dulu #050508 nyatu sama background). */}
            <stop offset="0%" stopColor="#0d0d18" />
            <stop offset="58%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#2a2a44" />
          </linearGradient>
          <radialGradient id={`makoraEye-${seed}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="60%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#4338ca" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* Roda 八握剣 di PUNGGUNG — render DULUAN (di belakang badan, kanon:
            roda mengambang di belakang bahu, bukan di leher). Redesign v2. */}
        <g opacity="0.95">
          <circle cx="228" cy="180" r="30" fill="none" stroke="#6d28d9" strokeWidth="1.6" strokeOpacity="0.9" />
          <circle cx="228" cy="180" r="24" fill="none" stroke={MEGUMI_INDIGO} strokeWidth="0.7" strokeOpacity="0.7" />
          {Array.from({ length: 8 }).map((_, i) => {
            const rad = ((i / 8) * 360 * Math.PI) / 180;
            return <line key={i} x1="228" y1="180" x2={228 + Math.cos(rad) * 30} y2={180 + Math.sin(rad) * 30}
              stroke={MEGUMI_SILVER} strokeWidth="0.9" strokeOpacity="0.75" />;
          })}
        </g>

        {/* Kaki & badan (raksasa, sedikit membungkuk) — stroke dipertegas */}
        <path
          d="M74,340 L68,236 C64,196 82,166 112,156 L188,156 C218,166 236,196 232,236 L226,340 L196,340 L192,250 L176,340 L124,340 L108,250 L104,340 Z"
          fill={`url(#makora-${seed})`} stroke={MEGUMI_SILVER} strokeWidth="1.8" strokeOpacity="0.95"
        />
        {/* Lengan panjang + cakar */}
        <path d="M112,166 C86,178 70,206 68,236 C82,222 96,210 108,204" fill="none" stroke="#14141f" strokeWidth="16" strokeLinecap="round" />
        <path d="M188,166 C214,178 230,206 232,236 C218,222 204,210 192,204" fill="none" stroke="#14141f" strokeWidth="16" strokeLinecap="round" />
        {[0, 1, 2].map((i) => (
          <path key={`cl${i}`} d={`M${66 + i * 6},238 L${60 + i * 7},262 M${232 - i * 6},238 L${238 - i * 7},262`}
            stroke={MEGUMI_SILVER} strokeWidth="1.6" strokeOpacity="0.55" strokeLinecap="round" fill="none" />
        ))}
        {/* LEHER: satu siluet lebar nyambung bahu ↔ kepala (redesign v2 —
            dulu dua path terpisah → kepala kelihatan "nempel"). */}
        <path d="M110,160 C112,128 124,106 138,98 L162,98 C176,106 188,128 190,160 Z"
          fill={`url(#makora-${seed})`} stroke={MEGUMI_SILVER} strokeWidth="1.4" strokeOpacity="0.75" />
        <path d="M136,100 C140,86 145,76 150,70 C155,76 160,86 164,100 Z"
          fill={`url(#makora-${seed})`} stroke={MEGUMI_SILVER} strokeWidth="1.1" strokeOpacity="0.55" />
        {/* Kepala ular (tanpa mata manusia) — pangkal kepala di y=72, overlap leher */}
        <path d="M150,74 C146,56 150,38 158,28 C166,18 178,18 184,26 C190,36 184,50 174,60 C166,68 158,72 150,74 Z"
          fill="#14142a" stroke={MEGUMI_INDIGO} strokeWidth="1.4" strokeOpacity="0.9" />
        {/* Mata menyala (2 titik ungu-bayangan, bukan mata manusia) — posisi ikut kepala baru */}
        <motion.circle cx="164" cy="32" r="3.4" fill={`url(#makoraEye-${seed})`}
          initial={{ opacity: 0 }} animate={reduced ? { opacity: 1 } : { opacity: [0, 1, 0.85] }}
          transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : start + 0.5 }} />
        <motion.circle cx="177" cy="34" r="3.4" fill={`url(#makoraEye-${seed})`}
          initial={{ opacity: 0 }} animate={reduced ? { opacity: 1 } : { opacity: [0, 1, 0.85] }}
          transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : start + 0.56 }} />
        </svg>
      </div>
    </motion.div>
  );
}

// ── Cinematic summon — SEMUA sync ke klip chant 4.959s (MEGUMI_SUMMON_TIMELINE) ──
export function MegumiSummonCine() {
  const [reduced] = useState(prefersReduced);
  const t = MEGUMI_SUMMON_TIMELINE;
  const v = MEGUMI_CAST_VOICE;

  // Aksen SFX saat roda muncul & saat boom (chant + dread dari provider).
  useEffect(() => {
    if (reduced) return undefined;
    const id = setTimeout(() => { playWheelCreak(); playGiantStep(); }, t.wheelAt * 1000);
    return () => clearTimeout(id);
  }, [reduced, t.wheelAt]);

  useEffect(() => {
    if (reduced) return undefined;
    const id = setTimeout(() => { playDomainBoom('bang'); playMakoraRoar(); }, t.boomAt * 1000);
    return () => clearTimeout(id);
  }, [reduced, t.boomAt]);

  return (
    <motion.div
      data-megumi-summon
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Veil gelap total saat cast → memudar mulai settle */}
      <motion.div
        data-megumi-veil
        className="absolute inset-0"
        style={{ background: 'rgba(2,2,6,0.97)' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: t.settleAt, duration: reduced ? 0.3 : t.settleDur, ease: 'easeInOut' }}
      />

      {/* Genangan bayangan menyebar dari TENGAH ke seluruh lantai (0.10) —
          REDESIGN v2: ikut MEMUDAR saat settle (dulu nangkring 30 dtk nutupin kuis). */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[62vh]"
        style={{ background: 'radial-gradient(84% 100% at 50% 100%, rgba(10,10,14,0.96), rgba(6,6,10,0.6) 52%, transparent 82%)' }}
        initial={{ opacity: 0, scaleY: 0.3 }}
        animate={reduced
          ? { opacity: [0.9, 0.9, 0], scaleY: 1 }
          : { opacity: [0, 1, 0.92, 0], scaleY: [0.3, 1.05, 1, 1] }}
        transition={reduced
          ? { duration: Math.max(0.6, t.settleAt + t.settleDur - t.poolAt), delay: t.poolAt, times: [0, (t.settleAt - t.poolAt) / Math.max(0.6, t.settleAt + t.settleDur - t.poolAt), 1], ease: 'easeOut' }
          : { duration: t.settleAt + t.settleDur - t.poolAt, delay: t.poolAt, times: [0, 0.9 / (t.settleAt + t.settleDur - t.poolAt), (t.settleAt - t.poolAt) / (t.settleAt + t.settleDur - t.poolAt), 1], ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Roda 八握剣 muncul di atas, muter 8 jari-jari (1.80) — REDESIGN v2:
          memudar saat settle (roda kecil persist diambil alih MegumiAura). */}
      <motion.div
        className="absolute inset-x-0 top-[4vh] flex justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={reduced
          ? { opacity: [0.9, 0.9, 0], scale: 1 }
          : { opacity: [0, 0.95, 0.85, 0], scale: [0.8, 1, 1, 1] }}
        transition={reduced
          ? { duration: Math.max(0.6, t.settleAt + t.settleDur - t.wheelAt), delay: t.wheelAt, times: [0, (t.settleAt - t.wheelAt) / Math.max(0.6, t.settleAt + t.settleDur - t.wheelAt), 1], ease: 'easeOut' }
          : { duration: t.settleAt + t.settleDur - t.wheelAt, delay: t.wheelAt, times: [0, 0.9 / (t.settleAt + t.settleDur - t.wheelAt), (t.settleAt - t.wheelAt) / (t.settleAt + t.settleDur - t.wheelAt), 1], ease: [0.16, 1, 0.3, 1] }}
      >
        <AdaptWheel notches={0} reduced={reduced} size="min(30vh, 52vw)" spin glow={0.85} />
      </motion.div>

      {/* Siluet raksasa 魔虚羅 bangkit dari bayangan (2.60) → memudar saat settle */}
      <MakoraSilhouette reduced={reduced} start={t.riseAt} settleAt={t.settleAt} settleDur={t.settleDur} seed={7} />

      {/* Blok teks: 布瑠部由良由良 (per-karakter) + 魔虚羅; naik & mengecil saat settle */}
      <motion.div
        data-megumi-text
        className="absolute inset-0 flex flex-col items-center justify-center gap-[2.2vmin]"
        initial={{ y: 0, scale: 1, opacity: 1 }}
        animate={reduced ? { opacity: 0 } : { y: '-28vh', scale: 0.38, opacity: 0 }}
        transition={{ delay: t.settleAt, duration: reduced ? 0.3 : t.settleDur, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* 布瑠部 (frasa 1) — sync segmen 0.32–0.67 */}
        <SequentialChars
          text="布瑠部"
          start={t.kanji1At}
          perChar={t.kanji1Per}
          reduced={reduced}
          className="font-serif font-black tracking-[0.3em] text-[#e9e9f2]"
          style={{ fontSize: 'clamp(22px, 3.6vw, 42px)', WebkitTextStroke: `1.6px ${MEGUMI_INK}`, textShadow: '0 0 18px rgba(139,92,246,0.8)' }}
        />
        {/* 由良由良 (frasa 2) — sync segmen 1.14–1.66 */}
        <SequentialChars
          text="由良由良"
          start={t.kanji2At}
          perChar={t.kanji2Per}
          reduced={reduced}
          className="font-serif font-black tracking-[0.3em] text-[#e9e9f2]"
          style={{ fontSize: 'clamp(22px, 3.6vw, 42px)', WebkitTextStroke: `1.6px ${MEGUMI_INK}`, textShadow: '0 0 18px rgba(139,92,246,0.8)' }}
        />
        {/* 魔虚羅 raksasa — sync frasa 3.01–4.71 */}
        <SequentialChars
          text="魔虚羅"
          start={t.kanji3At}
          perChar={0.34}
          reduced={reduced}
          className="font-serif font-black tracking-[0.2em]"
          style={{
            fontSize: 'clamp(46px, 9vw, 124px)',
            color: MEGUMI_STYLE.mahoraga.color,
            WebkitTextStroke: `3px ${MEGUMI_INK}`,
            textShadow: `6px 6px 0 ${MEGUMI_INK}, 0 0 64px ${MEGUMI_STYLE.mahoraga.color}cc`,
          }}
        />
      </motion.div>

      {/* SHAKE layar + aura 影 saat raksasa bangkit (3.30) */}
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          animate={{ x: [0, -8, 7, -5, 3, 0], y: [0, 3, -3, 2, -1, 0] }}
          transition={{ duration: 0.6, delay: t.shakeAt, ease: 'easeOut' }}
        />
      )}

      {/* FLASH + BOOM (4.72, setelah frasa 魔虚羅 4.71 selesai) */}
      <motion.div
        data-megumi-flash
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.4 } : { opacity: [0, 0, 0.96, 0] }}
        transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : t.flashAt - 0.1, times: [0, 0.3, 0.5, 1], ease: 'easeOut' }}
      />

      {/* Cut-in GIF 魔虚羅 saat boom (redesign v2) — kecil (max 26vh), blend
          screen, muncul 0.5s pas FLASH. Aset 220×147px → JANGAN dibesarkan. */}
      {!reduced && (
        <motion.div
          data-megumi-gif-cutin
          className="absolute left-1/2 top-1/2 z-20"
          style={{ x: '-50%', y: '-50%', mixBlendMode: 'screen' }}
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.86, 1, 1, 1.04] }}
          transition={{ duration: 0.9, delay: t.boomAt, times: [0, 0.18, 0.7, 1], ease: 'easeOut' }}
        >
          <img
            src={MEGUMI_GIFS.mahoraga[0]}
            alt=""
            decoding="sync"
            loading="eager"
            draggable={false}
            className="select-none"
            style={{
              width: 'min(26vh, 44vw)',
              height: 'auto',
              WebkitMaskImage: 'radial-gradient(ellipse 52% 52% at 50% 50%, #000 40%, rgba(0,0,0,0.5) 68%, transparent 92%)',
              maskImage: 'radial-gradient(ellipse 52% 52% at 50% 50%, #000 40%, rgba(0,0,0,0.5) 68%, transparent 92%)',
            }}
          />
        </motion.div>
      )}

      {/* Penanda segmen (aria) — durasi chant utuh */}
      <span className="sr-only">布瑠部由良由良 魔虚羅 — {v.dur}s</span>
    </motion.div>
  );
}

// ── Persist 30 dtk: genangan + aura 影 + PENANDA summon aktif ────────────────
// REDESIGN v2: split 2 layer (dulu semua di z-6 → ketutup main z-10, penanda
// roda+kanji TIDAK PERNAH kelihatan):
//   • z-6  : atmosfer (wash, genangan, napas indigo, bara) — di BELAKANG konten
//   • z-11 : PENANDA (vignette tepi + roda kecil + kanji 魔虚羅) — di ATAS konten,
//            tapi cuma di zona aman (tepi/atas) supaya soal & jawaban tetap kebaca.
export function MegumiAura({ seed = 1 }) {
  const [reduced] = useState(prefersReduced);
  const [motes] = useState(() => megumiShadowMotes(seed, reduced ? 5 : 9));
  const t = MEGUMI_SUMMON_TIMELINE;

  return createPortal(
    <>
      {/* ── Layer belakang: atmosfer ── */}
      <motion.div
        data-megumi-aura
        className="pointer-events-none fixed inset-0 z-[6] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : t.settleAt, ease: 'easeOut' }}
      >
        {/* Latar bayangan (gelap, bukan merah — identitas Megumi) */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 92% at 50% 8%, #0b0b16 0%, #06060c 48%, #020204 100%)' }} />

        {/* Genangan bayangan besar di lantai (persist) */}
        <motion.div
          className="absolute inset-x-0 bottom-0 h-[54vh]"
          style={{ background: 'radial-gradient(90% 100% at 50% 100%, rgba(10,10,16,0.94), rgba(6,6,10,0.5) 54%, transparent 84%)' }}
          initial={{ opacity: 0, scaleY: 0.6 }}
          animate={reduced ? { opacity: 0.8, scaleY: 1 } : { opacity: [0, 0.9, 0.8], scaleY: [0.6, 1, 1], y: [0, -6, 0] }}
          transition={reduced
            ? { duration: 0 }
            : { opacity: { duration: 1.2, delay: 0.1 }, scaleY: { duration: 1.2, delay: 0.1 }, y: { duration: 7, repeat: Infinity, ease: 'easeInOut' } }
          }
        />

        {/* Napas indigo (aura summon) */}
        <motion.div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(88% 70% at 50% 50%, rgba(67,56,202,0.14), transparent 74%)' }}
          animate={reduced ? { opacity: 0.5 } : { opacity: [0.32, 0.72, 0.32] }}
          transition={reduced ? { duration: 0 } : { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Bara/bayangan naik (aura 影) */}
        {motes.map((m) => (
          <motion.span
            key={m.id}
            className="absolute rounded-full"
            style={{ left: `${m.x}%`, bottom: '6%', width: m.size, height: m.size, background: '#12121e', boxShadow: `0 0 10px ${MEGUMI_INDIGO}88` }}
            animate={reduced ? { opacity: 0.4 } : { opacity: [0, 0.85, 0], y: m.drift }}
            transition={{ duration: reduced ? 0 : m.dur + 1.4, delay: reduced ? 0 : m.delay, repeat: reduced ? 0 : Infinity, repeatDelay: m.dur, ease: 'easeOut' }}
          />
        ))}
      </motion.div>

      {/* ── Layer depan: PENANDA summon aktif (di atas konten, zona aman) ── */}
      <motion.div
        data-megumi-aura-front
        className="pointer-events-none fixed inset-0 z-[11] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : t.settleAt, ease: 'easeOut' }}
      >
        {/* Vignette tepi tipis — tengah transparan (soal tetap kebaca) */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(130% 112% at 50% 50%, transparent 58%, rgba(6,6,12,0.42) 100%)' }} />

        {/* Roda 八握剣 KECIL persist (penanda Mahoraga aktif) */}
        <div className="absolute inset-x-0 top-[5vh] flex justify-center opacity-80">
          <AdaptWheel notches={0} reduced={reduced} size="min(20vh, 34vw)" spin glow={0.6} />
        </div>

        {/* Kanji 魔虚羅 persist (redesign v2) — penanda summon aktif, kecil & samar
            di bawah roda. Sebelumnya kanji hilang total setelah settle. */}
        <motion.span
          data-megumi-makora-kanji
          className="absolute inset-x-0 top-[calc(5vh+min(20vh,34vw)+1.2vh)] text-center font-serif font-black select-none pointer-events-none"
          style={{
            fontSize: 'clamp(18px, 3vw, 34px)',
            color: MEGUMI_STYLE.mahoraga.color,
            opacity: 0.55,
            WebkitTextStroke: `1px ${MEGUMI_INK}`,
            textShadow: `0 0 18px ${MEGUMI_STYLE.mahoraga.color}88`,
          }}
          initial={{ opacity: 0 }}
          animate={reduced ? { opacity: 0.55 } : { opacity: [0, 0.7, 0.55] }}
          transition={{ duration: reduced ? 0 : 0.9, ease: 'easeOut' }}
        >
          魔虚羅
        </motion.span>
      </motion.div>
    </>,
    document.body,
  );
}

export { MEGUMI_GIFS };
export default MegumiSummonCine;
