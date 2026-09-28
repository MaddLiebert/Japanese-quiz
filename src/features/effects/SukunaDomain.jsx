import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  SUKUNA_STYLE, SUKUNA_INK, SUKUNA_BLOOD,
  SUKUNA_ULT_THRESHOLD, SUKUNA_ARMS, SUKUNA_NOTCHES_PER_ARM,
  SUKUNA_DOMAIN_DURATION_S, SUKUNA_DOMAIN_TIMELINE, SUKUNA_CAST_VOICE,
  sukunaSlashRain, sukunaEmbers,
} from './sukunaFx';
import { playDomainBoom, playSukunaBell, playDomainCue } from '../../utils/sfx';

// ─────────────────────────────────────────────────────────────────────────────
// 領域展開・伏魔御廚子 — bar 4 lengan + cinematic + kuil persist (Sukuna pack_14).
//   • SukunaCurseBar   → 4 lengan (kolom) × 5 takik = 20; tap saat penuh = cast
//   • SukunaDomainCine → sync klip 3.48s: dread → 掌印 → 領域展開 → JEDA (mata+
//                        senyum 1.23–2.25) → 伏魔御廚子 → kuil → flash/boom 3.28
//   • SukunaAura       → persist 30s: kuil + hujan tebasan + mata/senyum kecil
// reduced-motion: kanji/mata/senyum/掌印 TETAP tampil (informasi kanon),
// shake/hujan/flash/distorsi disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Bar 呪力 Sukuna: 4 lengan × 5 takik tebasan ─────────────────────────────
export function SukunaCurseBar({ charge = 0, ready = false, onCast, domainOn = false, domainLeft = 0 }) {
  const [reduced] = useState(prefersReduced);
  const pct = domainOn
    ? Math.max(0, Math.min(100, (domainLeft / SUKUNA_DOMAIN_DURATION_S) * 100))
    : Math.max(0, Math.min(100, (charge / SUKUNA_ULT_THRESHOLD) * 100));
  const urgent = domainOn && domainLeft <= 5;
  const blood = SUKUNA_BLOOD;
  const fillColor = urgent ? '#fca5a5' : blood;

  return (
    <div
      data-sukuna-cursebar
      className="pointer-events-none fixed right-2.5 top-[6vh] sm:top-1/2 sm:-translate-y-1/2 z-[125] flex flex-col items-center gap-1.5"
    >
      <div className="flex h-14 items-center justify-center">
        {domainOn && (
          <motion.span
            key="domain-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#ffe4e0', writingMode: 'vertical-rl', textShadow: `0 0 12px ${blood}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: reduced ? 1 : [0.55, 1, 0.55], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          >
            伏魔御廚子
          </motion.span>
        )}
        {ready && (
          <motion.span
            key="ready-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#ffe4e0', writingMode: 'vertical-rl', textShadow: `0 0 12px ${blood}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: reduced ? 1 : [0.65, 1, 0.65], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            領域展開
          </motion.span>
        )}
      </div>

      {/* 4 lengan (kolom) — tiap lengan 5 takik; isi naik dari bawah. */}
      <motion.button
        type="button"
        onClick={ready ? onCast : undefined}
        aria-label="呪力"
        disabled={!ready}
        className={`relative flex flex-row gap-[3px] rounded-[4px] border-[2px] p-[4px] ${
          ready ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
        }`}
        style={{
          borderColor: ready || domainOn ? (urgent ? '#fca5a5' : blood) : 'rgba(224,36,26,0.45)',
          background: 'rgba(20,4,4,0.6)',
          boxShadow: ready || domainOn
            ? `0 0 18px 3px ${fillColor}cc, inset 0 0 10px ${fillColor}55`
            : '0 0 8px 1px rgba(224,36,26,0.3)',
        }}
        animate={ready && !reduced ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={ready && !reduced ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        {Array.from({ length: SUKUNA_ARMS }).map((_, arm) => {
          // Lengan ke-0 = paling kiri. Isi mengisi lengan 0..3 berurutan.
          const armStart = arm * SUKUNA_NOTCHES_PER_ARM;
          const litInArm = Math.max(0, Math.min(SUKUNA_NOTCHES_PER_ARM, charge - armStart));
          const armPct = domainOn ? Math.max(0, pct - arm * 25) / 25 * 100 : (litInArm / SUKUNA_NOTCHES_PER_ARM) * 100;
          return (
            <div
              key={arm}
              className="relative w-[9px] h-[26vh] max-h-[300px] min-h-[150px] sm:h-[40vh] overflow-hidden rounded-[2px]"
              style={{ background: 'rgba(224,36,26,0.10)', border: '1px solid rgba(224,36,26,0.25)' }}
            >
              {/* Isi lengan (naik dari bawah) */}
              <motion.div
                className="absolute left-0 right-0 bottom-0"
                style={{
                  background: `linear-gradient(to top, ${fillColor}, ${urgent ? '#ffe4e0' : '#ff8c72'})`,
                  boxShadow: `0 0 10px 1px ${fillColor}aa`,
                }}
                initial={false}
                animate={{ height: `${Math.max(0, Math.min(100, armPct))}%` }}
                transition={domainOn ? { duration: 0.3, ease: 'linear' } : { type: 'spring', stiffness: 120, damping: 18 }}
              />
              {/* 5 takik tebasan (garis-garis horizontal) */}
              <div className="absolute inset-0 flex flex-col-reverse justify-between">
                {Array.from({ length: SUKUNA_NOTCHES_PER_ARM }).map((_, n) => (
                  <div
                    key={n}
                    className="w-full"
                    style={{ height: 2, background: 'rgba(10,10,10,0.6)' }}
                  />
                ))}
              </div>
              {/* Ujung atas: tebasan menyilang saat takik penuh */}
              {litInArm >= SUKUNA_NOTCHES_PER_ARM && !domainOn && (
                <motion.div
                  className="absolute inset-x-0 top-0 h-[8px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${blood}, transparent)`, boxShadow: `0 0 10px ${blood}` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.7] }}
                  transition={{ duration: reduced ? 0 : 0.5, ease: 'easeOut' }}
                />
              )}
            </div>
          );
        })}
      </motion.button>

      <span
        className={`font-mono font-black text-[10px] tracking-widest ${urgent && !reduced ? 'animate-pulse' : ''}`}
        style={{ color: domainOn ? (urgent ? '#fca5a5' : '#ffe4e0') : ready ? '#ffe4e0' : 'rgba(255,228,224,0.6)' }}
      >
        {domainOn ? `${domainLeft}s` : `${charge}/${SUKUNA_ULT_THRESHOLD}`}
      </span>
    </div>
  );
}

// ── Teks per-karakter (sync frasa klip) ─────────────────────────────────────
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

// ── 掌印: tangan naik membentuk mudra ────────────────────────────────────────
function PalmSeal({ reduced, start }) {
  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 flex justify-center"
      initial={{ y: '52%', opacity: 0 }}
      animate={reduced ? { y: '16%', opacity: 0.92 } : { y: '16%', opacity: [0, 1, 0.95] }}
      transition={{ duration: reduced ? 0 : 0.75, delay: reduced ? 0 : start, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg viewBox="0 0 160 200" className="w-[46vmin] h-auto">
        <g fill="#0b0810" stroke="#e0241a" strokeWidth="1.4">
          {/* Lengan bawah */}
          <path d="M60,200 L64,120 L96,120 L100,200 Z" />
          {/* Telapak */}
          <path d="M58,124 C56,96 62,78 80,72 C98,78 104,96 102,124 Z" />
          {/* Jari-jari mudra (kelingking–telunjuk menyilang) */}
          <path d="M66,80 C58,62 60,46 68,40 C74,48 74,64 72,78 Z" />
          <path d="M78,72 C74,50 78,34 86,28 C92,38 90,58 86,72 Z" />
          <path d="M92,74 C96,54 104,42 112,42 C112,54 104,66 98,78 Z" />
          {/* Ibu jari */}
          <path d="M58,108 C44,104 36,94 38,84 C48,84 56,94 60,104 Z" />
        </g>
      </svg>
    </motion.div>
  );
}

// ── Lingkaran mantra di sekeliling tangan ───────────────────────────────────
function MantraCircle({ reduced, start }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        className="rounded-full"
        style={{
          width: '58vmin', height: '58vmin',
          border: '2px dashed rgba(224,36,26,0.6)',
          borderRadius: '50%',
        }}
        initial={{ opacity: 0, scale: 0.7, rotate: 0 }}
        animate={reduced ? { opacity: 0.8, scale: 1, rotate: 0 } : { opacity: [0, 0.95, 0.85], scale: [0.7, 1, 1], rotate: 140 }}
        transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : start, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '50vmin', height: '50vmin',
          border: '1px solid rgba(224,36,26,0.35)',
          borderRadius: '50%',
        }}
        animate={reduced ? { rotate: 0 } : { rotate: -360 }}
        transition={{ duration: 14, repeat: reduced ? 0 : Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ── MATA SUKUNA: 4 mata (2 pasang), slit merah ───────────────────────────────
function SukunaEyes({ reduced, start }) {
  const eyes = [
    { x: 38, y: 30, s: 1 }, { x: 62, y: 30, s: 1 },      // pasang atas
    { x: 44, y: 42, s: 0.8 }, { x: 56, y: 42, s: 0.8 },  // pasang bawah
  ];
  return (
    <svg viewBox="0 0 100 60" className="w-[52vmin] h-auto" aria-label="Mata Sukuna">
      {eyes.map((e, i) => (
        <g key={i}>
          {/* Kelopak gelap */}
          <ellipse cx={e.x} cy={e.y} rx={9 * e.s} ry={5 * e.s} fill="#0a0a0a" stroke="#3a0a08" strokeWidth="1" />
          {/* Iris merah slit */}
          <motion.ellipse
            cx={e.x} cy={e.y} rx={2.6 * e.s} ry={4.2 * e.s}
            fill="#e0241a"
            initial={{ scaleY: 0.1, opacity: 0 }}
            animate={reduced ? { scaleY: 1, opacity: 1 } : { scaleY: [0.1, 1, 1], opacity: [0, 1, 1] }}
            transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : start + i * 0.07, ease: 'easeOut' }}
            style={{ transformOrigin: `${e.x}px ${e.y}px`, transformBox: 'fill-box' }}
          />
          {/* Pupil hitam */}
          <circle cx={e.x} cy={e.y} r={1.1 * e.s} fill="#1a0000" />
        </g>
      ))}
    </svg>
  );
}

// ── SENYUM Sukuna (grin) ─────────────────────────────────────────────────────
function SukunaSmile({ reduced, start }) {
  return (
    <svg viewBox="0 0 100 40" className="w-[46vmin] h-auto" aria-label="Senyum Sukuna">
      <motion.path
        d="M14,14 C32,34 68,34 86,14 C74,26 60,30 50,30 C40,30 26,26 14,14 Z"
        fill="#0a0a0a" stroke="#e0241a" strokeWidth="1.2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={reduced ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: [0, 1, 1] }}
        transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : start, ease: 'easeOut' }}
      />
      {/* Gigi (deret vertikal) */}
      {Array.from({ length: 11 }).map((_, i) => (
        <motion.line
          key={i}
          x1={22 + i * 5.6} y1={17 + Math.sin((i / 10) * Math.PI) * 1.5}
          x2={22 + i * 5.6} y2={26 + Math.sin((i / 10) * Math.PI) * 3}
          stroke="#f5e6d3" strokeWidth="1.4" strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: reduced ? 0.9 : [0, 0.95, 0.9] }}
          transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : start + 0.12 + i * 0.02 }}
        />
      ))}
    </svg>
  );
}

// ── KUIL: torii + mulut raksasa + tengkorak kerbau ───────────────────────────
function Shrine({ reduced, start, persist = false }) {
  return (
    <motion.div
      data-sukuna-shrine
      className="absolute inset-x-0 bottom-0 flex justify-center"
      initial={{ y: '30%', opacity: 0 }}
      animate={reduced ? { y: 0, opacity: persist ? 0.85 : 0.9 } : { y: 0, opacity: [0, 1, persist ? 0.85 : 0.95] }}
      transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : start, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg viewBox="0 0 320 200" className="w-[86vmin] max-w-none h-auto">
        <g fill="#0b0810" stroke="#7f1d1d" strokeWidth="1.6">
          {/* Torii */}
          <rect x="30" y="46" width="260" height="10" />
          <rect x="44" y="62" width="232" height="7" />
          <rect x="66" y="56" width="12" height="120" />
          <rect x="242" y="56" width="12" height="120" />
          {/* Mulut raksasa (gerbang kuil) */}
          <path d="M96,132 C110,102 210,102 224,132 C226,158 216,178 160,186 C104,178 94,158 96,132 Z" fill="#160303" />
        </g>
        {/* Gigi mulut */}
        <g fill="#f5e6d3">
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={`t${i}`} d={`M${112 + i * 12},132 L${118 + i * 12},146 L${124 + i * 12},132 Z`} />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <path key={`b${i}`} d={`M${124 + i * 12},176 L${130 + i * 12},164 L${136 + i * 12},176 Z`} />
          ))}
        </g>
        {/* Tengkorak kerbau di puncak mulut */}
        <g fill="#e8ddc8" stroke="#3a0a08" strokeWidth="1.2">
          <ellipse cx="160" cy="106" rx="26" ry="17" />
          <path d="M136,100 C120,92 108,94 100,102 C112,100 124,102 134,106 Z" />
          <path d="M184,100 C200,92 212,94 220,102 C208,100 196,102 186,106 Z" />
          {/* Mata tengkorak (merah) */}
          <circle cx="150" cy="104" r="3" fill="#e0241a" stroke="none" />
          <circle cx="170" cy="104" r="3" fill="#e0241a" stroke="none" />
          {/* Moncong */}
          <path d="M152,116 L160,124 L168,116 Z" fill="#0b0810" stroke="none" />
        </g>
      </svg>
    </motion.div>
  );
}

// ── Cinematic cast — SEMUA sync ke klip 3.48s (SUKUNA_DOMAIN_TIMELINE) ───────
export function SukunaDomainCine() {
  const [reduced] = useState(prefersReduced);
  const t = SUKUNA_DOMAIN_TIMELINE;

  // Aksen SFX saat mata membuka & saat boom (voice + dread sudah dari provider).
  useEffect(() => {
    if (reduced) return undefined;
    const id = setTimeout(() => playDomainCue('eyes'), t.eyesAt * 1000);
    return () => clearTimeout(id);
  }, [reduced, t.eyesAt]);

  useEffect(() => {
    if (reduced) return undefined;
    const id = setTimeout(() => { playDomainBoom('bang'); playSukunaBell(); }, t.boomAt * 1000);
    return () => clearTimeout(id);
  }, [reduced, t.boomAt]);

  return (
    <motion.div
      data-sukuna-domain
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Veil gelap total saat cast → memudar mulai settle */}
      <motion.div
        data-sukuna-veil
        className="absolute inset-0"
        style={{ background: 'rgba(6,1,1,0.97)' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: t.settleAt, duration: reduced ? 0.3 : t.settleDur, ease: 'easeInOut' }}
      />

      {/* 掌印 + lingkaran mantra */}
      <PalmSeal reduced={reduced} start={t.handAt} />
      <MantraCircle reduced={reduced} start={t.mantraAt} />

      {/* Blok tengah: 領域展開 → (JEDA) → 伏魔御廚子; naik & mengecil saat settle */}
      <motion.div
        data-sukuna-text
        className="absolute inset-0 flex flex-col items-center justify-center gap-[2.4vmin]"
        initial={{ y: 0, scale: 1, opacity: 1 }}
        animate={reduced ? { opacity: 0 } : { y: '-30vh', scale: 0.36, opacity: 0 }}
        transition={{ delay: t.settleAt, duration: reduced ? 0.3 : t.settleDur, ease: [0.22, 1, 0.36, 1] }}
      >
        <SequentialChars
          text="領域展開"
          start={t.kanji1At}
          perChar={t.kanji1Per}
          reduced={reduced}
          className="font-serif font-black tracking-[0.35em] text-[#ffe4e0]"
          style={{ fontSize: 'clamp(20px, 3.4vw, 40px)', WebkitTextStroke: `2px ${SUKUNA_INK}` }}
        />
        <SequentialChars
          text="伏魔御廚子"
          start={t.kanji2At}
          perChar={t.kanji2Per}
          reduced={reduced}
          className="font-serif font-black tracking-[0.22em]"
          style={{
            fontSize: 'clamp(44px, 8.5vw, 118px)',
            color: SUKUNA_STYLE.domain.color,
            WebkitTextStroke: `3px ${SUKUNA_INK}`,
            textShadow: `6px 6px 0 ${SUKUNA_INK}, 0 0 60px ${SUKUNA_STYLE.domain.color}cc`,
          }}
        />
      </motion.div>

      {/* JEDA DRAMATIS 1.23–2.25: MATA + SENYUM (ciri khas Sukuna menikmati) */}
      <motion.div
        data-sukuna-eyes
        className="absolute inset-x-0 top-[6vh] flex justify-center"
        initial={{ y: 0, opacity: 1 }}
        animate={reduced ? { opacity: 0 } : { y: '-9vh', opacity: 0 }}
        transition={{ delay: t.settleAt, duration: reduced ? 0.3 : t.settleDur, ease: [0.22, 1, 0.36, 1] }}
      >
        <SukunaEyes reduced={reduced} start={t.eyesAt} />
      </motion.div>
      <motion.div
        data-sukuna-smile
        className="absolute inset-x-0 top-[24vh] flex justify-center"
        initial={{ y: 0, opacity: 1 }}
        animate={reduced ? { opacity: 0 } : { y: '-7vh', opacity: 0 }}
        transition={{ delay: t.settleAt, duration: reduced ? 0.3 : t.settleDur, ease: [0.22, 1, 0.36, 1] }}
      >
        <SukunaSmile reduced={reduced} start={t.smileAt} />
      </motion.div>

      {/* Shake halus saat senyum muncul (reduced: tidak ada) */}
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          animate={{ x: [0, -6, 5, -3, 2, 0], y: [0, 2, -2, 1, 0, 0] }}
          transition={{ duration: 0.5, delay: t.shakeAt, ease: 'easeOut' }}
        />
      )}

      {/* KUIL muncul (2.60) */}
      <Shrine reduced={reduced} start={t.shrineAt} />

      {/* FLASH penuh (3.28) */}
      <motion.div
        data-sukuna-flash
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.4 } : { opacity: [0, 0, 0.96, 0] }}
        transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : t.flashAt - 0.1, times: [0, 0.3, 0.5, 1], ease: 'easeOut' }}
      />
    </motion.div>
  );
}

// ── Persist 30 dtk: kuil latar + hujan tebasan + mata/senyum kecil ──────────
export function SukunaAura({ seed = 1 }) {
  const [reduced] = useState(prefersReduced);
  const [slashes] = useState(() => sukunaSlashRain(seed, reduced ? 6 : 12));
  const [embers] = useState(() => sukunaEmbers(seed + 41, 6));

  return createPortal(
    <motion.div
      data-sukuna-aura
      className="pointer-events-none fixed inset-0 z-[6] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.8, ease: 'easeOut' }}
    >
      {/* Latar kuil gelap-merah */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 50% 0%, #1a0505 0%, #0d0202 46%, #050101 100%)' }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[46vh] opacity-90">
        <Shrine reduced={reduced} start={0} persist />
      </div>

      {/* Hujan tebasan jatuh terus (ambience visual) */}
      {slashes.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{
            left: `${s.x}%`, top: '-30%',
            width: 2, height: `${s.len}%`,
            background: `linear-gradient(to bottom, transparent, ${SUKUNA_BLOOD}, transparent)`,
            rotate: `${s.tilt}deg`,
            boxShadow: `0 0 8px ${SUKUNA_BLOOD}aa`,
          }}
          animate={reduced ? { opacity: 0.25 } : { y: ['0vh', '140vh'], opacity: [0, 0.9, 0] }}
          transition={{ duration: reduced ? 0 : s.dur + 1.2, delay: reduced ? 0 : s.delay, repeat: reduced ? 0 : Infinity, repeatDelay: s.loop, ease: 'easeIn' }}
        />
      ))}

      {/* Bara hitam naik */}
      {embers.map((e) => (
        <motion.span
          key={e.id}
          className="absolute rounded-full"
          style={{ left: `${e.x}%`, bottom: '8%', width: e.size, height: e.size, background: '#2a0a0a', boxShadow: '0 0 10px rgba(224,36,26,0.5)' }}
          animate={reduced ? { opacity: 0.4 } : { opacity: [0, 0.85, 0], y: e.drift }}
          transition={{ duration: reduced ? 0 : e.dur + 1.4, delay: reduced ? 0 : e.delay, repeat: reduced ? 0 : Infinity, repeatDelay: e.dur, ease: 'easeOut' }}
        />
      ))}

      {/* Mata + senyum persist kecil di atas layar */}
      <div className="absolute inset-x-0 top-[3vh] flex flex-col items-center gap-1 opacity-90">
        <div className="w-[26vmin]">
          <SukunaEyes reduced start={0} />
        </div>
        <div className="w-[22vmin] -mt-2">
          <SukunaSmile reduced start={0} />
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}

export default SukunaDomainCine;
