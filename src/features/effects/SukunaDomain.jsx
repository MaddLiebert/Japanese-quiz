import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  SUKUNA_STYLE, SUKUNA_INK, SUKUNA_BLOOD,
  SUKUNA_ULT_THRESHOLD, SUKUNA_ARMS, SUKUNA_NOTCHES_PER_ARM,
  SUKUNA_DOMAIN_DURATION_S, SUKUNA_DOMAIN_TIMELINE,
  SUKUNA_QUIZ_SKILLS, sukunaSlashRain, sukunaEmbers,
} from './sukunaFx';
import { SUKUNA_GIFS } from './sukunaGifs';
import { playDomainBoom, playSukunaBell, playDomainCue } from '../../utils/sfx';

// ─────────────────────────────────────────────────────────────────────────────
// 領域展開・伏魔御廚子 — bar 4 lengan + cinematic + KUIL DI BELAKANG quiz (pack_14).
//   • SukunaCurseBar   → 4 lengan (kolom) × 5 takik = 20; tap saat penuh = cast;
//                        + tombol SKILL QUIZ (龍鱗・反発 @30, 世界を断つ斬撃 @50)
//   • SukunaDomainCine → sync klip 3.48s: dread → 領域展開 (GIF 掌印 ryoiki —
//                        tangan jelas) → JEDA (mata+senyum 1.23–2.25) → 伏魔御廚子
//                        → flash/boom 3.28 → settle. TIDAK ada kuil di depan.
//   • SukunaAura       → persist 30s: ambience gelap-merah (hujan tebasan + bara +
//                        mata/senyum kecil) + KUIL BESAR di BELAKANG layar quiz
//                        (portal z-6; konten quiz z-10 tetap di atasnya).
// Redesign 28/09 (kritik user): "gif nya gak usah di taro di belakang ... maksud
// gw kuil nya di taro di belakang, dan ganti design nya" → TANPA GIF di latar;
// kuil SVG baru sesuai referensi (gerbang beratap lengkung + pilar vermilion +
// layar emas + pantulan air; TANPA hewan/tengkorak lama), gede, di belakang quiz.
// reduced-motion: kanji/mata/senyum/kuil TETAP tampil (informasi kanon),
// shake/hujan/flash/disorsi disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Bar 呪力 Sukuna: 4 lengan × 5 takik tebasan + skill quiz ────────────────
export function SukunaCurseBar({
  charge = 0, ready = false, onCast, domainOn = false, domainLeft = 0,
  skills = [], onSkill,
}) {
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

      {/* ── SKILL QUIZ (unlock streak 30 & 50, sesuai lore) ─────────────────── */}
      {skills.length > 0 && (
        <div data-sukuna-skills className="mt-1 flex flex-col items-center gap-1.5">
          {skills.map((s) => {
            const armed = (s.left || 0) > 0;
            return (
              <motion.button
                key={s.id}
                type="button"
                onClick={() => onSkill?.(s.id)}
                title={s.desc}
                aria-label={s.label}
                className={`pointer-events-auto cursor-pointer rounded-[3px] border-[2px] px-1.5 py-1 font-serif font-black leading-tight ${
                  armed ? 'opacity-100' : 'opacity-60'
                }`}
                style={{
                  writingMode: 'vertical-rl',
                  fontSize: 11,
                  color: armed ? '#ffe4e0' : 'rgba(255,228,224,0.75)',
                  borderColor: armed ? blood : 'rgba(224,36,26,0.5)',
                  background: 'rgba(20,4,4,0.72)',
                  boxShadow: armed ? `0 0 12px 2px ${blood}aa` : 'none',
                }}
                animate={armed && !reduced ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={armed && !reduced ? { repeat: Infinity, duration: 1.8, ease: 'easeInOut' } : { duration: 0.2 }}
              >
                {s.label}
                {armed && <span className="ml-1 font-mono text-[9px]">×{s.left}</span>}
              </motion.button>
            );
          })}
        </div>
      )}
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

// ── KUIL (referensi user 28/09): gerbang beratap lengkung di atas air — merah/
//    hitam di atas, pantulan dingin di bawah. TANPA hewan/tengkorak (kritik:
//    "itu hewan apaan"). Ditaruh di BELAKANG layar quiz oleh SukunaAura.
function Shrine({ className = '', style }) {
  return (
    <div data-sukuna-shrine className={`flex justify-center ${className}`} style={style}>
      <svg viewBox="0 0 400 490" className="w-full h-auto" role="img" aria-label="伏魔御廚子 — kuil">
        <defs>
          <radialGradient id="sukunaShrineGlow" cx="50%" cy="42%" r="58%">
            <stop offset="0%" stopColor="#e0241a" stopOpacity="0.32" />
            <stop offset="55%" stopColor="#7f1d1d" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sukunaReflFade" x1="0" y1="254" x2="0" y2="490" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sukunaWaterTint" x1="0" y1="254" x2="0" y2="490" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1b6b7a" stopOpacity="0.5" />
            <stop offset="1" stopColor="#0a2a3a" stopOpacity="0.22" />
          </linearGradient>
          <mask id="sukunaReflMask">
            <rect x="0" y="254" width="400" height="236" fill="url(#sukunaReflFade)" />
          </mask>
        </defs>

        {/* Glow merah hangat di belakang gerbang — bikin siluet kuil pop
            dari latar gelap tanpa mengganggu teks quiz. */}
        <ellipse cx="200" cy="170" rx="150" ry="120" fill="url(#sukunaShrineGlow)" />

        {/* ── Struktur kuil ─────────────────────────────────────────────────── */}
        <g id="sukunaShrineStruct">
          {/* Atap utama (ujung melengkung naik) + trim emas */}
          <path d="M 36,100 C 110,62 150,50 200,50 C 250,50 290,62 364,100 C 320,86 260,78 200,78 C 140,78 80,86 36,100 Z" fill="#12121c" stroke="#05050a" strokeWidth="1.5" />
          <path d="M 36,100 C 80,86 140,78 200,78 C 260,78 320,86 364,100" fill="none" stroke="#c9a227" strokeWidth="3" strokeLinecap="round" />
          <path d="M 36,100 C 26,96 22,88 26,80" fill="none" stroke="#c9a227" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M 364,100 C 374,96 378,88 374,80" fill="none" stroke="#c9a227" strokeWidth="2.4" strokeLinecap="round" />
          {/* Balok ridge + finial hōju */}
          <rect x="150" y="43" width="100" height="8" rx="2" fill="#16161f" stroke="#c9a227" strokeWidth="1.2" />
          <circle cx="150" cy="47" r="4" fill="#c9a227" />
          <circle cx="250" cy="47" r="4" fill="#c9a227" />
          <path d="M 200,26 L 205,41 L 195,41 Z" fill="#d4882a" stroke="#7b241c" strokeWidth="0.8" />
          <circle cx="200" cy="24" r="3.4" fill="#c9a227" stroke="#7b241c" strokeWidth="0.8" />
          {/* Ornamen tiga kelopak di ujung atap (nyatu ke ujung lengkung) */}
          <g fill="#c0392b" stroke="#7b241c" strokeWidth="0.8">
            <circle cx="29" cy="96" r="3.2" /><circle cx="34" cy="101" r="3.2" /><circle cx="39" cy="96" r="3.2" />
            <circle cx="361" cy="96" r="3.2" /><circle cx="366" cy="101" r="3.2" /><circle cx="371" cy="96" r="3.2" />
          </g>
          {/* Tier atap kedua + trim emas */}
          <path d="M 78,118 C 130,98 160,92 200,92 C 240,92 270,98 322,118 C 280,108 240,102 200,102 C 160,102 120,108 78,118 Z" fill="#0e0e18" stroke="#05050a" strokeWidth="1.2" />
          <path d="M 78,118 C 120,108 160,102 200,102 C 240,102 280,108 322,118" fill="none" stroke="#c9a227" strokeWidth="2.2" strokeLinecap="round" />
          {/* Balok silang di atas pilar */}
          <rect x="110" y="112" width="180" height="10" fill="#14141c" stroke="#c9a227" strokeWidth="1.4" />
          {/* Pilar vermilion kiri-kanan (dengan bayangan + highlight) */}
          <g>
            <rect x="118" y="122" width="26" height="100" fill="#c0392b" />
            <rect x="118" y="122" width="9" height="100" fill="#7b241c" opacity="0.85" />
            <rect x="138" y="122" width="3" height="100" fill="#e05a4a" opacity="0.5" />
            <rect x="256" y="122" width="26" height="100" fill="#c0392b" />
            <rect x="256" y="122" width="9" height="100" fill="#7b241c" opacity="0.85" />
            <rect x="276" y="122" width="3" height="100" fill="#e05a4a" opacity="0.5" />
          </g>
          {/* Layar dalam: kubah + panel + kisi + emblem */}
          <path d="M 146,140 Q 200,112 254,140 Z" fill="#160a14" stroke="#c9a227" strokeWidth="1.6" />
          <rect x="146" y="138" width="108" height="84" fill="#10060e" stroke="#c9a227" strokeWidth="1.8" />
          <g stroke="#c9a227" strokeWidth="1" opacity="0.35">
            <line x1="173" y1="140" x2="173" y2="222" />
            <line x1="200" y1="140" x2="200" y2="222" />
            <line x1="227" y1="140" x2="227" y2="222" />
            <line x1="146" y1="180" x2="254" y2="180" />
          </g>
          {/* Empat mata Sukuna kecil di layar (aksen) */}
          <g fill="#e0241a" opacity="0.85">
            <ellipse cx="188" cy="160" rx="6" ry="2.6" />
            <ellipse cx="212" cy="160" rx="6" ry="2.6" />
            <ellipse cx="194" cy="170" rx="4.4" ry="2" />
            <ellipse cx="206" cy="170" rx="4.4" ry="2" />
          </g>
          <circle cx="200" cy="132" r="6" fill="#f5e6d3" stroke="#c9a227" strokeWidth="1.2" />
          <circle cx="200" cy="132" r="2.4" fill="#e0241a" />
          {/* Tassel merah di sisi layar */}
          <g stroke="#c0392b" strokeWidth="2.6" strokeLinecap="round">
            <line x1="140" y1="122" x2="140" y2="146" />
            <line x1="260" y1="122" x2="260" y2="146" />
          </g>
          <ellipse cx="140" cy="151" rx="3.2" ry="6" fill="#c0392b" stroke="#7b241c" strokeWidth="0.8" />
          <ellipse cx="260" cy="151" rx="3.2" ry="6" fill="#c0392b" stroke="#7b241c" strokeWidth="0.8" />
          {/* Pondasi bertingkat (menyentuh air di y=254) */}
          <rect x="104" y="222" width="192" height="14" fill="#4a1f16" stroke="#c9a227" strokeWidth="1.6" />
          <circle cx="200" cy="229" r="6" fill="#c9a227" stroke="#7b241c" strokeWidth="0.9" />
          <circle cx="200" cy="229" r="2.2" fill="#e0241a" />
          <rect x="92" y="236" width="216" height="10" fill="#241416" stroke="#7b241c" strokeWidth="1" />
          <rect x="80" y="246" width="240" height="8" fill="#170d10" stroke="#7b241c" strokeWidth="0.8" />
          <rect x="98" y="222" width="8" height="26" fill="#2a1216" stroke="#7b241c" strokeWidth="0.8" />
          <rect x="294" y="222" width="8" height="26" fill="#2a1216" stroke="#7b241c" strokeWidth="0.8" />
        </g>

        {/* ── Air: pantulan dingin + riak halus (transisi organik) ──────────── */}
        <defs>
          <linearGradient id="sukunaWaterLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a9f0ee" stopOpacity="0" />
            <stop offset="0.5" stopColor="#a9f0ee" stopOpacity="0.42" />
            <stop offset="1" stopColor="#a9f0ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="244" width="400" height="20" fill="url(#sukunaWaterLine)" />
        <g mask="url(#sukunaReflMask)" style={{ filter: 'brightness(0.62) saturate(0.85) hue-rotate(150deg)' }}>
          <use href="#sukunaShrineStruct" transform="matrix(1 0 0 -1 0 508)" />
        </g>
        <rect x="0" y="254" width="400" height="236" fill="url(#sukunaWaterTint)" opacity="0.3" style={{ mixBlendMode: 'screen' }} />
        <g stroke="#7fe3e3" strokeWidth="1">
          <line x1="24" y1="286" x2="376" y2="286" opacity="0.1" />
          <line x1="40" y1="318" x2="360" y2="318" opacity="0.08" />
          <line x1="60" y1="356" x2="340" y2="356" opacity="0.06" />
          <line x1="84" y1="400" x2="316" y2="400" opacity="0.04" />
        </g>
      </svg>
    </div>
  );
}

// ── GIF kanon 掌印 (ryoiki) — pengganti SVG "tangan gak jelas". Muncul saat
//    領域展開 (frasa 1) lalu HABIS sebelum JEDA dramatis (mata+senyum 1.23).
//    BUKAN latar belakang — hanya overlay cinematic.
function CastGif({ reduced, start, fadeAt }) {
  const dur = Math.max(0.5, fadeAt - start);
  return (
    <motion.div
      data-sukuna-gif
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={reduced
        ? { opacity: 0.9, scale: 1 }
        : { opacity: [0, 0.9, 0.9, 0], scale: [0.92, 1, 1.02, 1.05] }
      }
      transition={reduced
        ? { duration: 0 }
        : { duration: dur, delay: start, times: [0, 0.12, 0.8, 1], ease: 'easeOut' }
      }
    >
      <img
        src={SUKUNA_GIFS.ryoiki[0]}
        alt="領域展開 — 掌印"
        decoding="sync"
        loading="eager"
        draggable={false}
        className="select-none"
        style={{
          width: 'min(72vh, 92vw)',
          height: 'auto',
          mixBlendMode: 'screen',
          WebkitMaskImage: 'radial-gradient(ellipse 54% 54% at 50% 50%, #000 44%, rgba(0,0,0,0.5) 70%, transparent 94%)',
          maskImage: 'radial-gradient(ellipse 54% 54% at 50% 50%, #000 44%, rgba(0,0,0,0.5) 70%, transparent 94%)',
        }}
      />
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

      {/* Energi kutukan naik dari bawah saat 領域展開 (0.10) — pengganti 掌印 SVG */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[58vh]"
        style={{ background: 'radial-gradient(80% 100% at 50% 100%, rgba(224,36,26,0.55), rgba(120,10,10,0.25) 48%, transparent 78%)' }}
        initial={{ opacity: 0, y: '22%' }}
        animate={reduced ? { opacity: 0.6, y: 0 } : { opacity: [0, 0.9, 0.7], y: ['22%', 0] }}
        transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : t.handAt, ease: [0.16, 1, 0.3, 1] }}
      />

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

      {/* GIF kanon 掌印 (ryoiki): muncul saat 領域展開 (0.10) → memudar saat JEDA
          dramatis (1.23) supaya tidak nabrak mata+senyum. BUKAN latar belakang. */}
      <CastGif reduced={reduced} start={t.handAt} fadeAt={t.gapStart} />

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

// ── Persist 30 dtk: KUIL di BELAKANG layar quiz (gede) + ambience hujan tebasan ──
// Kritik user 28/09: "gif nya gak usah di taro di belakang, gw gak pernah nyuruh
// ... maksud gw kuil nya di taro di belakang, dan ganti design nya gw udah kasih
// referensi". → TANPA GIF di latar; kuil SVG baru (gerbang beratap lengkung +
// pilar vermilion + layar emas + pantulan air, referensi user) gede di belakang
// quiz (portal z-6; konten quiz z-10 tetap di atasnya).
export function SukunaAura({ seed = 1 }) {
  const [reduced] = useState(prefersReduced);
  const [slashes] = useState(() => sukunaSlashRain(seed, reduced ? 6 : 12));
  const [embers] = useState(() => sukunaEmbers(seed + 41, 6));
  const t = SUKUNA_DOMAIN_TIMELINE;

  return createPortal(
    <motion.div
      data-sukuna-aura
      className="pointer-events-none fixed inset-0 z-[6] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : t.settleAt, ease: 'easeOut' }}
    >
      {/* Latar kuil gelap-merah */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 50% 0%, #1a0505 0%, #0d0202 46%, #050101 100%)' }}
      />

      {/* KUIL di BELAKANG layar quiz — komposisi pra-GIF yang user bilang bagus
          (naik dari bawah), design BARU sesuai referensi (gerbang beratap
          lengkung + pilar vermilion + layar emas + pantulan air), gede tapi
          utuh: lebar 58vh → tinggi = 58 × 490/400 ≈ 71vh, tidak nabrak
          mata/senyum di atas. Napas halus + fade tepi biar organik. */}
      <motion.div
        data-sukuna-shrine-bg
        className="absolute inset-x-0 bottom-0 flex justify-center"
        initial={{ opacity: 0, scale: reduced ? 1 : 1.04 }}
        animate={reduced
          ? { opacity: 0.68, scale: 1 }
          : { opacity: [0, 0.8, 0.88], scale: [1.04, 1, 1.012], y: [0, -10, 0] }
        }
        transition={reduced
          ? { duration: 0 }
          : { opacity: { duration: 1.3, delay: 0.15 }, scale: { duration: 1.3, delay: 0.15 }, y: { duration: 8, repeat: Infinity, ease: 'easeInOut' } }
        }
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 5%, #000 88%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, #000 5%, #000 88%, transparent 100%)',
        }}
      >
        <Shrine className="w-[min(58vh,90vw)] max-w-none" />
      </motion.div>

      {/* Napas merah (aura domain) */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(90% 70% at 50% 46%, rgba(224,36,26,0.16), transparent 74%)' }}
        animate={reduced ? { opacity: 0.5 } : { opacity: [0.35, 0.75, 0.35] }}
        transition={reduced ? { duration: 0 } : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      />

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

export { SUKUNA_QUIZ_SKILLS };
export default SukunaDomainCine;
