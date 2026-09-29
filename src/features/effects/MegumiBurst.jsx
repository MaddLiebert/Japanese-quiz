import { useState } from 'react';
import { motion } from 'motion/react';
import {
  MEGUMI_STYLE, MEGUMI_INK, MEGUMI_SILVER, MEGUMI_INDIGO,
  megumiPoolBlobs, megumiWolfRise, megumiClawMarks, megumiShadowBolts,
  megumiWingSpread, megumiSerpentCoils, megumiScales, megumiCracks,
  megumiWaterJet, megumiRipples, megumiTigerLeap, megumiAmberClaws,
  megumiFangCracks,
} from './megumiFx';

// ─────────────────────────────────────────────────────────────────────────────
// Megumi Fushiguro (visual 'megumi') — efek jawaban, 十種影法術. Aturan main
// (spec Megumi.md, 🔒):
//   • Semua jurus = siluet shikigami BANGKIT dari GENANGAN BAYANGAN di lantai
//     (bukan plasma/api/tebasan). Bahasa visual: bayangan cair (影).
//   • non-streak → 玉犬 (2 serigala + 3 goresan cakar) ↔ 鵺 (burung 人面 + petir
//     ungu dari ATAS + sayap melebar) — rotasi deterministik, bukan acak.
//   • 10 大蛇 (ular nglilit + sisik perak + lantai retak) · 20 満象 (gajah +
//     semburan air + riak; GIF cut-in) · 30+ 虎葬 (harimau menerkam + cakar amber
//     + retak taring).
//   • salah → GIF kalah (3 pilihan) + wash gelap; SEMUA jurus lain dibuang.
// Warna: tinta hitam + highlight perak + aksen 藍 indigo. Semua animasi hanya
// transform + opacity (no layout thrash). reduced-motion → kanji & siluet tetap
// tampil (informasi kanon), gerakan/flash disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Kanji teknik di band bawah — warna mengikuti jurus (konsisten Yuji/Sukuna).
function TechKanji({ style, reduced, delay = 0, size = 'clamp(30px, 6vw, 76px)' }) {
  if (!style) return null;
  return (
    <motion.span
      data-megumi-kanji
      className="absolute font-serif font-black select-none pointer-events-none"
      style={{
        left: '50%', bottom: '12%', x: '-50%',
        fontSize: size,
        color: style.color,
        WebkitTextStroke: `1.5px ${MEGUMI_INK}`,
        textShadow: `0 0 14px ${style.color}aa, 0 0 34px ${style.color}55`,
        willChange: 'transform, opacity',
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0.92], scale: [0.7, 1.1, 1, 1.01] }}
      transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : delay, ease: 'easeOut' }}
    >
      {style.kanji}
    </motion.span>
  );
}

// ── GIF layer Megumi (pola SukunaGifLayer):
//   salah → panel berbingkai di TENGAH (bayangan nelan)
//   bansou → cut-in atas tanpa bingkai, blend screen
function MegumiGifLayer({ src, reduced, wrong = false, delay = 0 }) {
  if (!src) return null;
  if (wrong) {
    return (
      <motion.div
        data-megumi-gif
        className="absolute left-1/2 top-1/2 z-10"
        style={{ marginLeft: '-19vh', marginTop: '-17vh' }}
        initial={{ opacity: 0, scale: 0.92, rotate: 2 }}
        animate={{ opacity: 1, scale: 1, rotate: -1.5, x: reduced ? 0 : [0, -7, 6, -4, 3, 0] }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: reduced ? 0 : 0.34, ease: 'easeOut' }}
      >
        <div className="w-[38vh] h-[38vh] border-[3px] border-[#4338ca] bg-[#050508] shadow-[8px_8px_0_0_rgba(67,56,202,0.3)] overflow-hidden">
          <img
            src={src}
            alt="Megumi"
            decoding="sync"
            loading="eager"
            className="w-full h-full object-contain select-none"
            draggable={false}
          />
        </div>
      </motion.div>
    );
  }
  return (
    <div className="absolute left-1/2 top-1/2 z-10" style={{ transform: 'translateX(-50%)', marginTop: '-42vh' }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          inset: '-26% -22%',
          background: 'radial-gradient(closest-side, rgba(4,6,16,0.96), rgba(4,6,16,0.7) 52%, transparent 100%)',
        }}
      />
      <motion.div
        data-megumi-gif
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: reduced ? 0 : 0.42, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src={src}
          alt="Megumi — 満象"
          decoding="sync"
          loading="eager"
          className="select-none"
          style={{
            width: 'min(42vh, 86vw)',
            height: 'auto',
            mixBlendMode: 'screen',
            WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 42%, rgba(0,0,0,0.5) 70%, transparent 94%)',
            maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 42%, rgba(0,0,0,0.5) 70%, transparent 94%)',
          }}
          draggable={false}
        />
      </motion.div>
    </div>
  );
}

// ── Genangan bayangan: dasar SEMUA jurus — blob mengalir di lantai ───────────
// (spec: "bayangan cair mengalir & menelan; siluet shikigami bangkit dari
// genangan di lantai"). Tepi organik via radial-gradient bertumpuk.
function ShadowPool({ seed, reduced, count = 7, strong = false }) {
  const [blobs] = useState(() => megumiPoolBlobs(seed, count));
  return (
    <div className="absolute inset-x-0 bottom-0 h-[46%] overflow-hidden pointer-events-none">
      {blobs.map((b) => (
        <motion.div
          key={b.id}
          className="absolute rounded-[50%]"
          style={{
            left: `${b.x}%`, bottom: `${4 + (b.h / 2)}%`,
            width: `${b.w}%`, height: `${b.h * 2.2}%`,
            background: `radial-gradient(ellipse at 50% 60%, rgba(10,10,10,${strong ? 0.94 : 0.82}), rgba(10,10,10,0.5) 62%, transparent 100%)`,
            filter: 'blur(6px)',
            willChange: 'transform, opacity',
          }}
          initial={{ opacity: 0, scaleY: 0.4, y: 18 }}
          animate={reduced
            ? { opacity: 0.75, scaleY: 1, y: 0 }
            : { opacity: [0, 0.95, 0.85], scaleY: [0.4, 1.06, 1], y: [18, 0, 0], x: [0, b.w * 0.12, 0] }}
          transition={{ duration: reduced ? 0 : b.dur + 0.5, delay: reduced ? 0 : b.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
      {/* Rim indigo tipis di garis lantai (biar kebaca di tema gelap) */}
      <motion.div
        className="absolute left-0 right-0"
        style={{ bottom: '6%', height: 1.5, background: `linear-gradient(90deg, transparent, ${MEGUMI_INDIGO}cc, transparent)` }}
        initial={{ opacity: 0, scaleX: 0.4 }}
        animate={reduced ? { opacity: 0.5, scaleX: 1 } : { opacity: [0, 0.85, 0.6], scaleX: [0.4, 1.02, 1] }}
        transition={{ duration: reduced ? 0 : 0.55, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── 玉犬: 2 siluet serigala bangkit dari genangan + 3 goresan cakar ──────────
function Gyokuken({ seed, reduced }) {
  const [wolves] = useState(() => megumiWolfRise(seed));
  const [claws] = useState(() => megumiClawMarks(seed + 5));
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Wash bayangan (serigala = shikigami bayangan) */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(64% 58% at 50% 66%, rgba(10,10,10,0.66), rgba(4,4,8,0.86) 74%, transparent 96%)' }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.72 } : { opacity: [0, 0.9, 0.8] }}
        transition={{ duration: reduced ? 0 : 0.3, ease: 'easeOut' }}
      />
      <ShadowPool seed={seed} reduced={reduced} count={6} />

      {/* 2 siluet serigala — bangkit dari genangan (kiri & kanan) */}
      {wolves.map((w) => (
        <motion.div
          key={w.id}
          className="absolute bottom-[10%]"
          style={{ left: `${w.x}%`, width: '26vmin', transform: 'translateX(-50%)', willChange: 'transform, opacity' }}
          initial={{ opacity: 0, y: '9vh', scaleY: 0.7 }}
          animate={reduced
            ? { opacity: 1, y: 0, scaleY: 1 }
            : { opacity: [0, 1, 0.97], y: ['9vh', '-2vh', '0vh'], scaleY: [0.7, 1.08, 1], rotate: [w.tilt * 0.4, w.tilt, w.tilt] }}
          transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : w.delay, ease: [0.16, 1, 0.3, 1] }}
        >
          <svg viewBox="0 0 120 150" className="w-full h-auto" aria-label="玉犬">
            <defs>
              <linearGradient id={`wolf-${seed}-${w.side}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#0a0a0a" />
                <stop offset="70%" stopColor="#141419" />
                <stop offset="100%" stopColor="#1f2030" />
              </linearGradient>
            </defs>
            {/* Badan + kaki */}
            <path
              d="M22,150 L20,96 C20,70 34,54 60,52 C86,54 100,70 100,96 L98,150 L82,150 L80,104 L74,150 L64,150 L60,106 L56,150 L46,150 L40,104 L38,150 Z"
              fill={`url(#wolf-${seed}-${w.side})`}
              stroke={MEGUMI_SILVER} strokeWidth="1.1" strokeOpacity="0.75"
            />
            {/* Kepala + moncong + kuping */}
            <path
              d="M42,52 L38,20 L52,34 L60,26 L68,34 L82,20 L78,52 C72,62 48,62 42,52 Z"
              fill={`url(#wolf-${seed}-${w.side})`}
              stroke={MEGUMI_SILVER} strokeWidth="1.1" strokeOpacity="0.8"
            />
            {/* Mata menyala (indigo) */}
            <motion.circle cx="52" cy="42" r="2.6" fill={MEGUMI_INDIGO}
              animate={reduced ? { opacity: 0.9 } : { opacity: [0, 1, 0.85] }}
              transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : w.delay + 0.15 }} />
            <motion.circle cx="68" cy="42" r="2.6" fill={MEGUMI_INDIGO}
              animate={reduced ? { opacity: 0.9 } : { opacity: [0, 1, 0.85] }}
              transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : w.delay + 0.15 }} />
            {/* Taring */}
            <path d="M54,52 L57,58 L60,52 M60,52 L63,58 L66,52" fill="none" stroke={MEGUMI_SILVER} strokeWidth="0.9" strokeOpacity="0.6" />
          </svg>
        </motion.div>
      ))}

      {/* 3 goresan cakar melintang (garis bayangan tajam + rim perak) */}
      {claws.map((c) => (
        <motion.div
          key={c.id}
          className="absolute left-0 right-0"
          style={{ top: `${c.y}%`, height: 2, willChange: 'transform, opacity' }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={reduced ? { opacity: 0.6, scaleX: 1 } : { opacity: [0, 1, 0.85, 0], scaleX: [0, 1, 1.02, 1] }}
          transition={{ duration: reduced ? 0 : c.dur + 0.25, delay: reduced ? 0 : c.delay, ease: 'easeOut' }}
        >
          <div
            className="h-full"
            style={{
              marginLeft: `${(100 - c.len) / 2}%`, width: `${c.len}%`,
              transform: `rotate(${c.angle}deg)`,
              background: `linear-gradient(90deg, transparent, ${MEGUMI_SILVER}, transparent)`,
              boxShadow: `0 0 12px 1px ${MEGUMI_SILVER}66`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ── 鵺: siluet burung 人面 bangkit + petir ungu dari ATAS + sayap melebar ────
// Kanon Megumi: 鵺 = shikigami kegelapan (bukan api). Beda dari Gojo (petir dari
// tepi) — di sini petir NYAMBER DARI ATAS, 3 sambaran kiri-tengah-kanan.
function Nue({ seed, reduced }) {
  const [bolts] = useState(() => megumiShadowBolts(seed, 3));
  const [wing] = useState(() => megumiWingSpread(seed + 7));
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(70% 60% at 50% 44%, rgba(12,10,30,0.88), rgba(4,4,10,0.94) 70%, rgba(2,2,6,0.98))' }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.85 } : { opacity: [0, 1, 0.92] }}
        transition={{ duration: reduced ? 0 : 0.34, ease: 'easeOut' }}
      />
      <ShadowPool seed={seed} reduced={reduced} count={5} strong />

      {/* Petir ungu dari ATAS (3 sambaran) */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {bolts.map((b) => (
          <motion.polyline
            key={b.id}
            points={b.pts.map((p) => p.join(',')).join(' ')}
            fill="none" stroke="#a5b4fc" strokeWidth={b.width} strokeLinejoin="round" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={reduced ? { pathLength: 1, opacity: 0.8 } : { pathLength: 1, opacity: [0, 1, 0.15, 0.9, 0] }}
            transition={{ duration: reduced ? 0 : b.dur, delay: reduced ? 0 : b.delay, ease: 'easeOut' }}
          />
        ))}
      </svg>

      {/* Siluet burung 人面: swoop dari kiri-atas + sayap mengepak */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ x: '-52vw', y: '-14vh', scale: 0.86, opacity: 0 }}
          animate={reduced
            ? { x: 0, y: 0, scale: 1, opacity: 1 }
            : { x: ['-52vw', '0vw', '2vw'], y: ['-14vh', '0vh', '-2vh'], scale: [0.86, 1.04, 1], opacity: [0, 1, 0.96] }}
          transition={{ duration: reduced ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <svg viewBox="0 0 260 170" className="w-[60vmin] h-auto" aria-label="鵺">
            <defs>
              <linearGradient id={`nue-body-${seed}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1c1c28" />
                <stop offset="58%" stopColor="#101018" />
                <stop offset="100%" stopColor="#08080e" />
              </linearGradient>
              <linearGradient id={`nue-wing-${seed}`} x1="0" y1="0" x2="1" y2="0.4">
                <stop offset="0%" stopColor="#26264a" />
                <stop offset="70%" stopColor="#14142a" />
                <stop offset="100%" stopColor="#4338ca" />
              </linearGradient>
              <radialGradient id={`nue-face-${seed}`} cx="50%" cy="42%" r="62%">
                <stop offset="0%" stopColor="#e8e8f0" />
                <stop offset="72%" stopColor="#c9c9d8" />
                <stop offset="100%" stopColor="#9a9aae" />
              </radialGradient>
            </defs>

            {/* Sayap kiri (mengepak, fase berlawanan dgn kanan) */}
            <motion.g
              style={{ transformOrigin: '118px 74px', transformBox: 'fill-box' }}
              animate={reduced ? { rotate: -12 } : { rotate: [-26, -5, -26] }}
              transition={reduced ? { duration: 0 } : { duration: 0.52, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path d="M118,74 C86,40 46,26 6,40 C34,52 52,64 70,82 C86,74 102,72 118,74 Z"
                fill={`url(#nue-wing-${seed})`} stroke={MEGUMI_INDIGO} strokeWidth="1.3" strokeOpacity="0.9" />
              {[0, 1, 2, 3, 4].map((i) => (
                <path key={`wl${i}`} d={`M${18 + i * 18},${44 + i * 5} L${52 + i * 14},${74 + i * 2}`}
                  stroke={MEGUMI_SILVER} strokeWidth="0.8" strokeOpacity="0.45" fill="none" />
              ))}
            </motion.g>
            {/* Sayap kanan */}
            <motion.g
              style={{ transformOrigin: '142px 74px', transformBox: 'fill-box' }}
              animate={reduced ? { rotate: 12 } : { rotate: [26, 5, 26] }}
              transition={reduced ? { duration: 0 } : { duration: 0.52, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path d="M142,74 C174,40 214,26 254,40 C226,52 208,64 190,82 C174,74 158,72 142,74 Z"
                fill={`url(#nue-wing-${seed})`} stroke={MEGUMI_INDIGO} strokeWidth="1.3" strokeOpacity="0.9" />
              {[0, 1, 2, 3, 4].map((i) => (
                <path key={`wr${i}`} d={`M${242 - i * 18},${44 + i * 5} L${208 - i * 14},${74 + i * 2}`}
                  stroke={MEGUMI_SILVER} strokeWidth="0.8" strokeOpacity="0.45" fill="none" />
              ))}
            </motion.g>

            {/* Badan + ekor */}
            <ellipse cx="130" cy="92" rx="26" ry="34" fill={`url(#nue-body-${seed})`} stroke={MEGUMI_INDIGO} strokeWidth="1.2" />
            <path d="M130,120 C124,142 116,156 104,168 L130,158 L156,168 C144,156 136,142 130,120 Z"
              fill="#0c0c16" stroke={MEGUMI_INDIGO} strokeWidth="1" strokeOpacity="0.7" />

            {/* Kepala + MUKA MANUSIA (ciri 鵺): pucat, mata indigo menyala */}
            <ellipse cx="130" cy="56" rx="26" ry="30" fill={`url(#nue-face-${seed})`} stroke="#26264a" strokeWidth="1.4" />
            <path d="M112,44 L122,50 M148,44 L138,50" stroke="#3a3a4a" strokeWidth="1.6" strokeLinecap="round" />
            <ellipse cx="119" cy="56" rx="6.2" ry="5" fill="#4338ca" stroke="#12121c" strokeWidth="1" />
            <ellipse cx="141" cy="56" rx="6.2" ry="5" fill="#4338ca" stroke="#12121c" strokeWidth="1" />
            <circle cx="119" cy="56" r="1.9" fill="#e8e8f0" />
            <circle cx="141" cy="56" r="1.9" fill="#e8e8f0" />
            <path d="M114,72 C124,84 138,84 146,72 C140,78 122,78 114,72 Z" fill="#16161f" stroke="#3a3a4a" strokeWidth="1" />
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={`t${i}`} d={`M${116 + i * 7},${73 + Math.abs(i - 2) * 0.6} L${119 + i * 7},${78} L${122 + i * 7},${73}`}
                fill="#e8e8f0" stroke="none" />
            ))}
          </svg>
        </motion.div>
      </div>

      {/* Bulu/sayap bayangan melebar menutupi layar 0.3s lalu hilang */}
      <motion.div
        className="absolute left-1/2"
        style={{
          top: `${wing.y}%`, width: `${wing.span}%`, height: '26vmin', x: '-50%',
          background: `radial-gradient(ellipse at 50% 50%, rgba(8,8,16,0.9), rgba(8,8,16,0.4) 58%, transparent 84%)`,
          filter: 'blur(5px)',
        }}
        initial={{ opacity: 0, scaleX: 0.5 }}
        animate={reduced ? { opacity: 0.6, scaleX: 1 } : { opacity: [0, 0.92, 0], scaleX: [0.5, 1.1, 1.3] }}
        transition={{ duration: reduced ? 0 : wing.dur + 0.4, delay: reduced ? 0 : wing.delay, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── 大蛇: ular raksasa nyembul & nglilit + sisik perak + lantai retak ────────
function Orochi({ seed, reduced }) {
  const [coils] = useState(() => megumiSerpentCoils(seed, 5));
  const [scales] = useState(() => megumiScales(seed + 11, 9));
  const [cracks] = useState(() => megumiCracks(seed + 23, 5));
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(66% 60% at 50% 56%, rgba(6,20,20,0.86), rgba(3,8,10,0.94) 72%, transparent 96%)' }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.82 } : { opacity: [0, 1, 0.9] }}
        transition={{ duration: reduced ? 0 : 0.36, ease: 'easeOut' }}
      />
      <ShadowPool seed={seed} reduced={reduced} count={6} strong />

      {/* Cincin lilitan ular (ellipse miring bertumpuk = nglilit) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-[74vmin] h-auto" aria-label="大蛇">
          <defs>
            <linearGradient id={`serp-${seed}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0d1f1e" />
              <stop offset="55%" stopColor="#123330" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          {coils.map((c, i) => (
            <motion.ellipse
              key={c.id}
              cx="50" cy="54" rx={c.r} ry={c.r * 0.42}
              fill="none" stroke={`url(#serp-${seed})`} strokeWidth={c.width}
              transform={`rotate(${c.tilt} 50 54)`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={reduced
                ? { opacity: 0.9, scale: 1 }
                : { opacity: [0, 0.95, 0.8], scale: [0.7, 1.04, 1], rotate: [c.tilt, c.tilt + (i % 2 ? 6 : -6), c.tilt] }}
              transition={{ duration: reduced ? 0 : c.dur + 0.5, delay: reduced ? 0 : c.delay, ease: 'easeOut' }}
            />
          ))}
          {/* Kepala ular naik dari tengah lilitan */}
          <motion.path
            d="M50,54 C48,38 44,28 46,18 C50,10 58,10 60,18 C62,26 58,34 54,42"
            fill="none" stroke={`url(#serp-${seed})`} strokeWidth="4.2" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={reduced ? { pathLength: 1, opacity: 0.9 } : { pathLength: 1, opacity: [0, 1, 0.9] }}
            transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.2, ease: 'easeOut' }}
          />
          <motion.circle cx="53" cy="16" r="3.4" fill="#14b8a6"
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 0.85 } : { opacity: [0, 1, 0.8] }}
            transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.4 }} />
        </svg>
      </div>

      {/* Sisik perak berkilau */}
      {scales.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size * 0.7, background: MEGUMI_SILVER, boxShadow: `0 0 8px ${MEGUMI_SILVER}99` }}
          initial={{ opacity: 0 }}
          animate={reduced ? { opacity: 0.4 } : { opacity: [0, 0.9, 0], scale: [0.7, 1.15, 0.9] }}
          transition={{ duration: reduced ? 0 : s.dur + 0.5, delay: reduced ? 0 : s.delay, ease: 'easeOut' }}
        />
      ))}

      {/* Lantai retak (garis gelap) */}
      {cracks.map((c) => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{
            left: `${c.x}%`, top: `${c.y}%`, width: c.len, height: 1.6,
            transform: `rotate(${c.angle}deg)`, transformOrigin: 'left center',
            background: `linear-gradient(90deg, ${MEGUMI_INK}, rgba(20,20,26,0.4))`,
            boxShadow: '0 0 6px rgba(0,0,0,0.8)',
          }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={reduced ? { opacity: 0.55, scaleX: 1 } : { opacity: [0, 0.9, 0.6], scaleX: [0, 1, 1] }}
          transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : c.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ── 満象: gajah bayangan bangkit + semburan air belalai + riak lantai ────────
function Bansou({ seed, reduced }) {
  const [jet] = useState(() => megumiWaterJet(seed));
  const [ripples] = useState(() => megumiRipples(seed + 13, 4));
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(66% 60% at 50% 58%, rgba(8,18,32,0.84), rgba(3,6,12,0.94) 74%, transparent 96%)' }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.8 } : { opacity: [0, 1, 0.88] }}
        transition={{ duration: reduced ? 0 : 0.34, ease: 'easeOut' }}
      />
      <ShadowPool seed={seed} reduced={reduced} count={6} />

      {/* Siluet gajah bangkit */}
      <motion.div
        className="absolute bottom-[12%] left-1/2"
        style={{ width: '46vmin', x: '-50%', willChange: 'transform, opacity' }}
        initial={{ opacity: 0, y: '10vh', scaleY: 0.72 }}
        animate={reduced
          ? { opacity: 1, y: 0, scaleY: 1 }
          : { opacity: [0, 1, 0.96], y: ['10vh', '-1vh', '0vh'], scaleY: [0.72, 1.06, 1] }}
        transition={{ duration: reduced ? 0 : 0.62, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg viewBox="0 0 240 170" className="w-full h-auto" aria-label="満象">
          <defs>
            <linearGradient id={`ele-${seed}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#0a0a0a" />
              <stop offset="70%" stopColor="#141824" />
              <stop offset="100%" stopColor="#1e2a3c" />
            </linearGradient>
          </defs>
          {/* Badan */}
          <path d="M40,150 C28,120 30,84 54,64 C78,44 138,42 168,60 C196,76 206,108 198,150 L170,150 L166,112 L150,150 L124,150 L122,108 L104,150 L78,150 L74,112 L60,150 Z"
            fill={`url(#ele-${seed})`} stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.55" />
          {/* Kepala + kuping besar */}
          <path d="M54,64 C40,50 30,30 44,18 C58,28 62,44 64,56 Z" fill={`url(#ele-${seed})`} stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" />
          <path d="M168,60 C182,46 194,28 182,16 C166,26 162,44 160,56 Z" fill={`url(#ele-${seed})`} stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" />
          {/* Belalai naik */}
          <path d="M96,64 C88,44 96,26 112,20 C126,16 136,24 132,36" fill="none" stroke="#1e2a3c" strokeWidth="7" strokeLinecap="round" />
          {/* Mata */}
          <motion.circle cx="86" cy="52" r="2.6" fill="#38bdf8"
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 0.9 } : { opacity: [0, 1, 0.8] }}
            transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.25 }} />
        </svg>
      </motion.div>

      {/* Semburan air dari belalai (gradient biru, BUKAN api) */}
      <motion.div
        className="absolute"
        style={{
          left: '48%', top: '26%', width: jet.width * 2, height: `${jet.len}vmin`,
          transformOrigin: 'top center',
          background: 'linear-gradient(180deg, rgba(56,189,248,0.85), rgba(56,189,248,0.35) 62%, transparent)',
          filter: 'blur(3px)', borderRadius: '40% 40% 60% 60% / 12% 12% 88% 88%',
          willChange: 'transform, opacity',
        }}
        initial={{ opacity: 0, scaleY: 0.3, rotate: 0 }}
        animate={reduced
          ? { opacity: 0.7, scaleY: 1, rotate: jet.angle }
          : { opacity: [0, 0.92, 0.75, 0], scaleY: [0.3, 1.1, 1, 1], rotate: [jet.angle * 0.4, jet.angle, jet.angle * 0.8, jet.angle * 0.6] }}
        transition={{ duration: reduced ? 0 : jet.dur + 0.4, ease: 'easeOut' }}
      />

      {/* Riak air menyebar di lantai */}
      {ripples.map((r) => (
        <motion.div
          key={r.id}
          className="absolute rounded-[50%]"
          style={{
            left: `${r.x}%`, top: `${r.y}%`, x: '-50%', y: '-50%',
            width: r.r1 * 2, height: r.r1 * 0.9,
            border: '1.5px solid rgba(56,189,248,0.65)',
          }}
          initial={{ opacity: 0, scale: r.r0 / r.r1 }}
          animate={reduced ? { opacity: 0.5, scale: 1 } : { opacity: [0, 0.85, 0], scale: [r.r0 / r.r1, 1, 1.12] }}
          transition={{ duration: reduced ? 0 : r.dur + 0.4, delay: reduced ? 0 : r.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ── 虎葬: harimau menerkam dari sisi + cakar amber + lantai retak taring ─────
function Kosou({ seed, reduced }) {
  const [tiger] = useState(() => megumiTigerLeap(seed));
  const [claws] = useState(() => megumiAmberClaws(seed + 17));
  const [fangs] = useState(() => megumiFangCracks(seed + 29, 6));
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(68% 62% at 46% 58%, rgba(28,16,4,0.86), rgba(8,5,2,0.94) 74%, transparent 96%)' }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.82 } : { opacity: [0, 1, 0.9] }}
        transition={{ duration: reduced ? 0 : 0.32, ease: 'easeOut' }}
      />
      <ShadowPool seed={seed} reduced={reduced} count={7} strong />

      {/* Harimau bayangan menerkam kiri → kanan */}
      <motion.div
        className="absolute"
        style={{ top: `${tiger.y}%`, width: '52vmin', willChange: 'transform, opacity' }}
        initial={{ opacity: 0, x: `${tiger.fromX}vw`, scale: 0.9 }}
        animate={reduced
          ? { opacity: 1, x: `${tiger.toX / 3}vw`, scale: 1 }
          : { opacity: [0, 1, 1, 0.9], x: [`${tiger.fromX}vw`, `${tiger.toX}vw`, `${tiger.toX + 3}vw`], scale: [0.9, tiger.scale + 0.06, tiger.scale] }}
        transition={{ duration: reduced ? 0 : tiger.dur + 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg viewBox="0 0 220 150" className="w-full h-auto" aria-label="虎葬">
          <defs>
            <linearGradient id={`tig-${seed}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#120c04" />
              <stop offset="60%" stopColor="#1c1206" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          {/* Badan menerkam (memanjang horizontal) */}
          <path d="M18,96 C34,62 74,46 122,48 C168,50 196,66 208,88 C196,104 168,116 126,116 C80,116 40,110 18,96 Z"
            fill={`url(#tig-${seed})`} stroke="#f59e0b" strokeWidth="1.3" strokeOpacity="0.6" />
          {/* Kepala + kuping */}
          <path d="M196,88 C204,74 216,66 220,76 C214,84 208,90 204,94 Z" fill="#1c1206" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.5" />
          {/* Belang */}
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${58 + i * 34},${56 + (i % 2) * 6} C${64 + i * 34},${70} ${64 + i * 34},${88} ${58 + i * 34},${104 + (i % 2) * 4}`}
              fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeOpacity="0.35" />
          ))}
          {/* Mata amber */}
          <motion.circle cx="180" cy="72" r="2.8" fill="#fbbf24"
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 0.95 } : { opacity: [0, 1, 0.85] }}
            transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.2 }} />
          {/* Mulut + taring */}
          <path d="M198,90 L206,96 L198,100" fill="none" stroke="#f5e6d3" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </motion.div>

      {/* Cakar raksasa amber (3 goresan) */}
      {claws.map((c) => (
        <motion.div
          key={c.id}
          className="absolute inset-y-[18%] left-1/2"
          style={{ width: '64vmin', x: '-50%', transform: `rotate(${c.angle}deg) translateY(${c.offset}%)`, willChange: 'transform, opacity' }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={reduced ? { opacity: 0.6, scaleX: 1 } : { opacity: [0, 1, 0.9, 0], scaleX: [0, 1.04, 1] }}
          transition={{ duration: reduced ? 0 : c.dur + 0.3, delay: reduced ? 0 : c.delay, ease: 'easeOut' }}
        >
          <div
            className="h-[2.6px] w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #f59e0b, #fbbf24, transparent)',
              boxShadow: '0 0 16px 2px rgba(245,158,11,0.7)',
            }}
          />
        </motion.div>
      ))}

      {/* Lantai retak pola taring (zigzag) */}
      {fangs.map((f) => (
        <motion.div
          key={f.id}
          className="absolute"
          style={{
            left: `${f.x}%`, top: `${f.y}%`, width: f.len, height: 1.6,
            transform: `rotate(${f.angle}deg)`, transformOrigin: 'left center',
            background: 'linear-gradient(90deg, #f59e0b99, rgba(20,12,4,0.5))',
            boxShadow: '0 0 6px rgba(245,158,11,0.35)',
          }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={reduced ? { opacity: 0.5, scaleX: 1 } : { opacity: [0, 0.9, 0.55], scaleX: [0, 1, 1] }}
          transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : f.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ── Salah: wash gelap + GIF kalah (bayangan nelan tombol yang dipencet) ──────
function MegumiWrong({ reduced }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(70% 60% at 50% 60%, rgba(6,6,10,0.72), rgba(2,2,4,0.9) 80%)' }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.5 } : { opacity: [0, 0.95, 0.82] }}
        transition={{ duration: reduced ? 0 : 0.36, ease: 'easeOut' }}
      />
      {/* Bayangan "nelan" dari bawah */}
      <motion.div
        className="absolute inset-x-0 bottom-0"
        style={{ height: '52%', background: 'linear-gradient(0deg, rgba(2,2,4,0.95), transparent)' }}
        initial={{ opacity: 0, y: '8vh' }}
        animate={reduced ? { opacity: 0.6, y: 0 } : { opacity: [0, 0.9, 0.7], y: ['8vh', '0vh', '1vh'] }}
        transition={{ duration: reduced ? 0 : 0.5, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── Dispatcher ───────────────────────────────────────────────────────────────
export function MegumiBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const tech = fx?.tech;
  const seed = fx?.seed || 1;
  const style = tech ? MEGUMI_STYLE[tech] : null;
  const gifSrc = fx?.gifSrc || style?.gif || null;
  const wrong = kind === 'wrong';

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
    >
      {wrong && <MegumiWrong reduced={reduced} />}
      {tech === 'gyokuken' && <Gyokuken seed={seed} reduced={reduced} />}
      {tech === 'nue' && <Nue seed={seed} reduced={reduced} />}
      {tech === 'orochi' && <Orochi seed={seed} reduced={reduced} />}
      {tech === 'bansou' && <Bansou seed={seed} reduced={reduced} />}
      {tech === 'kosou' && <Kosou seed={seed} reduced={reduced} />}
      {/* GIF: salah = kalah (3 pilihan) · bansou = cut-in 満象 */}
      <MegumiGifLayer src={gifSrc} reduced={reduced} wrong={wrong} delay={tech === 'bansou' ? 0.22 : 0} />
      <TechKanji
        style={style || (wrong ? { kanji: '外したか', color: '#94a3b8' } : null)}
        reduced={reduced}
        delay={tech === 'kosou' ? 0.3 : 0.22}
      />
    </motion.div>
  );
}

export default MegumiBurst;
