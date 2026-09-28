import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  SUKUNA_STYLE, SUKUNA_INK, SUKUNA_FLASH,
  sukunaWebLines, sukunaThunderBolts,
  sukunaChantLines, sukunaMantraRing, sukunaEmbers,
} from './sukunaFx';

// ─────────────────────────────────────────────────────────────────────────────
// Ryomen Sukuna (visual 'sukuna') — efek jawaban. Aturan main (redesign 28/09):
//   • kumo_no_ito   → JARING DI KARTU yang dipencet (ngejerat jawaban terpilih),
//                     BUKAN overlay layar penuh. Cuma muncul di streak 1–2.
//   • nue           → 影絵 burung 人面 hidup: sayap mengepak, swoop, petir dari
//                     atas, bulu jatuh — bukan siluet polos nempel. Streak 3–19.
//   • furube        → GIF kanon Mahoraga (roda adaptasi 8 handle, TANPA mata) +
//                     aura + mantra ring + shake. Streak 20.
//   • ryuurin       → 3 baris chant terbakar + mantra ring (streak 21–49).
//   • sekai_zangeki → 2 tebasan silang viewport + celah ruang + gelap (50+).
//   • wrong         → HANYA kanji 馬鹿な + GIF kalah. Semua efek lain dibuang.
// Semua animasi hanya transform + opacity (no layout thrash). reduced-motion →
// informasi kanon tetap tampil (kanji/GIF), gerakan/shake/flash disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Kanji teknik di band bawah — warna mengikuti efek (konsisten dgn Yuji).
function TechKanji({ style, reduced, delay = 0, size = 'clamp(30px, 6vw, 76px)' }) {
  if (!style) return null;
  return (
    <motion.span
      data-sukuna-kanji
      className="absolute font-serif font-black select-none pointer-events-none"
      style={{
        left: '50%', bottom: '12%', x: '-50%',
        fontSize: size,
        color: style.color,
        WebkitTextStroke: `1.5px ${SUKUNA_INK}`,
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

// ── GIF layer Sukuna (pola YujiGifLayer):
//   salah (kalah 馬鹿な) → panel berbingkai di TENGAH
//   furube (mahoraga)   → CUT-IN atas tanpa bingkai, blend screen
function SukunaGifLayer({ src, reduced, wrong = false, delay = 0 }) {
  if (!src) return null;
  if (wrong) {
    return (
      <motion.div
        data-sukuna-gif
        className="absolute left-1/2 top-1/2 z-10"
        style={{ marginLeft: '-19vh', marginTop: '-17vh' }}
        initial={{ opacity: 0, scale: 0.92, rotate: 2.5 }}
        animate={{ opacity: 1, scale: 1, rotate: -1.5, x: reduced ? 0 : [0, -9, 8, -5, 3, 0] }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: reduced ? 0 : 0.34, ease: 'easeOut' }}
      >
        <div className="w-[38vh] h-[38vh] border-[3px] border-[#e0241a] bg-[#140404] shadow-[8px_8px_0_0_rgba(224,36,26,0.28)] overflow-hidden">
          <img
            src={src}
            alt="Sukuna"
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
          background: 'radial-gradient(closest-side, rgba(10,2,16,0.96), rgba(10,2,16,0.7) 52%, transparent 100%)',
        }}
      />
      <motion.div
        data-sukuna-gif
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: reduced ? 0 : 0.42, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src={src}
          alt="Sukuna — 魔虚羅"
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

// ── 蜘蛛の糸: jaring NGEJERAT di kartu jawaban yang dipencet ─────────────────
// Kritik user 28/09: "pas muncul jaring bagusnya pas kita pencet card langsung
// muncul disana aja, kek buat ngejerat jawaban yang di pilih". Kartu ditandai
// `data-picked` (markYujiPicked) → portal fixed menutupi kartu itu; jaring
// menggambar radial + cincin lalu MENYUSUT (jerat mengencang).
function WebTrap({ seed, reduced }) {
  const [rect, setRect] = useState(null);
  const [spokes] = useState(() => sukunaWebLines(seed, 10));
  const [rings] = useState(() => [22, 34, 46]);

  // Ikuti posisi kartu (kartu ikut shake saat kena tebasan → recompute beberapa
  // frame supaya jaring tetap menempel di atasnya).
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const el = document.querySelector('button[data-picked]');
    if (!el) return undefined;
    let raf = 0;
    const t0 = performance.now();
    const track = () => {
      const r = el.getBoundingClientRect();
      setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
      if (performance.now() - t0 < 700) raf = requestAnimationFrame(track);
    };
    track();
    return () => cancelAnimationFrame(raf);
  }, []);

  const nodes = useMemo(
    () => createWebNodes(spokes, rings),
    [spokes, rings],
  );

  if (!rect) return null;
  const pad = 10;
  return createPortal(
    <motion.div
      data-sukuna-web
      className="pointer-events-none fixed z-[130]"
      style={{
        left: rect.x - pad, top: rect.y - pad,
        width: rect.w + pad * 2, height: rect.h + pad * 2,
      }}
      initial={{ opacity: 0, scale: 1.5 }}
      animate={reduced ? { opacity: 0.95, scale: 1 } : { opacity: [0, 1, 1, 0.9], scale: [1.5, 1.06, 0.98, 0.96] }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: reduced ? 0 : 0.62, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          <radialGradient id={`sw-${seed}`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#dbeafe" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.35" />
          </radialGradient>
        </defs>
        {/* Radial (jari-jari jaring) */}
        {spokes.map((l) => {
          const x2 = 50 + Math.cos(l.angle) * 62;
          const y2 = 50 + Math.sin(l.angle) * 62;
          return (
            <motion.line
              key={l.id}
              x1="50" y1="50" x2={x2} y2={y2}
              stroke={`url(#sw-${seed})`} strokeWidth={0.9} strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.24, ease: 'easeOut' }}
            />
          );
        })}
        {/* Cincin penghubung antar jari-jari (pola jaring laba-laba) */}
        {nodes.map((d, i) => (
          <motion.path
            key={`ring-${i}`}
            d={d} fill="none" stroke={`url(#sw-${seed})`} strokeWidth={0.7} strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.95 }}
            transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.12 + i * 0.06, ease: 'easeOut' }}
          />
        ))}
        {/* Simpul jerat: 2 garis silang yang mengencang */}
        {!reduced && (
          <>
            <motion.line
              x1="6" y1="6" x2="94" y2="94" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 1, 0.5] }}
              transition={{ duration: 0.4, delay: 0.24, ease: 'easeOut' }}
            />
            <motion.line
              x1="94" y1="6" x2="6" y2="94" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 1, 0.5] }}
              transition={{ duration: 0.4, delay: 0.32, ease: 'easeOut' }}
            />
          </>
        )}
      </svg>
      {/* Glow bening di tepi kartu (jerat kekencangan) */}
      <motion.div
        className="absolute -inset-[3px]"
        style={{ boxShadow: '0 0 18px 2px rgba(219,234,254,0.55), inset 0 0 14px rgba(255,255,255,0.35)', borderRadius: 2 }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.6 } : { opacity: [0, 1, 0.55] }}
        transition={{ duration: reduced ? 0 : 0.5, ease: 'easeOut' }}
      />
    </motion.div>,
    document.body,
  );
}

// Titik-titik cincin jaring: tiap cincin menghubungkan 2 jari-jari berdekatan
// (polyline kecil) → pola jaring laba-laba klasik.
function createWebNodes(spokes, rings) {
  const paths = [];
  for (const r of rings) {
    for (let i = 0; i < spokes.length; i++) {
      const a = spokes[i];
      const b = spokes[(i + 1) % spokes.length];
      const rr = r + (i % 2 ? 3 : 0);
      const x1 = 50 + Math.cos(a.angle) * rr;
      const y1 = 50 + Math.sin(a.angle) * rr;
      const x2 = 50 + Math.cos(b.angle) * rr;
      const y2 = 50 + Math.sin(b.angle) * rr;
      paths.push(`M${x1.toFixed(2)},${y1.toFixed(2)} Q50,50 ${x2.toFixed(2)},${y2.toFixed(2)}`);
    }
  }
  return paths;
}

// ── 鵺: 影絵 burung 人面 HIDUP — swoop + sayap mengepak + petir + bulu jatuh ──
// Kanon: 鵺 = shikigami kegelapan (bukan api). Warna: indigo-gelap + rim ungu +
// muka tulang pucat + mata kuning menyala (referensi user). BUKAN siluet polos.
function Nue({ seed, reduced }) {
  const [bolts] = useState(() => sukunaThunderBolts(seed, 3));
  const [feathers] = useState(() => Array.from({ length: 9 }, (_, i) => ({
    id: `${seed}-f${i}`,
    x: 6 + ((i * 11.3) % 88),
    delay: +(i * 0.09).toFixed(2),
    dur: +(1.5 + (i % 4) * 0.35).toFixed(2),
    rot: -40 + (i % 5) * 18,
    size: 12 + (i % 3) * 6,
  })));

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 影絵: kegelapan menyelimuti layar (鵺 = shikigami bayangan) */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(70% 60% at 50% 44%, rgba(18,8,34,0.86), rgba(6,2,14,0.94) 70%, rgba(2,1,6,0.98))' }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.85 } : { opacity: [0, 1, 0.92] }}
        transition={{ duration: reduced ? 0 : 0.34, ease: 'easeOut' }}
      />

      {/* Petir dari ATAS (beda dari Gojo yang dari tepi) */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {bolts.map((b) => (
          <motion.polyline
            key={b.id}
            points={b.pts.map((p) => p.join(',')).join(' ')}
            fill="none" stroke="#c4b5fd" strokeWidth={b.width} strokeLinejoin="round" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={reduced ? { pathLength: 1, opacity: 0.8 } : { pathLength: 1, opacity: [0, 1, 0.15, 0.9, 0] }}
            transition={{ duration: reduced ? 0 : b.dur, delay: reduced ? 0 : b.delay, ease: 'easeOut' }}
          />
        ))}
      </svg>

      {/* Burung 人面: swoop dari kiri-atas ke tengah + sayap mengepak */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ x: '-58vw', y: '-16vh', scale: 0.86, opacity: 0 }}
          animate={reduced
            ? { x: 0, y: 0, scale: 1, opacity: 1 }
            : { x: ['-58vw', '0vw', '2vw'], y: ['-16vh', '0vh', '-2vh'], scale: [0.86, 1.04, 1], opacity: [0, 1, 0.96] }}
          transition={{ duration: reduced ? 0 : 0.72, ease: [0.16, 1, 0.3, 1] }}
        >
          <svg viewBox="0 0 260 170" className="w-[62vmin] h-auto" aria-label="鵺">
            <defs>
              <linearGradient id={`nue-body-${seed}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2a1548" />
                <stop offset="58%" stopColor="#160a2a" />
                <stop offset="100%" stopColor="#0a0416" />
              </linearGradient>
              <linearGradient id={`nue-wing-${seed}`} x1="0" y1="0" x2="1" y2="0.4">
                <stop offset="0%" stopColor="#3b1d5e" />
                <stop offset="70%" stopColor="#1b0c30" />
                <stop offset="100%" stopColor="#7c2d12" />
              </linearGradient>
              <radialGradient id={`nue-face-${seed}`} cx="50%" cy="42%" r="62%">
                <stop offset="0%" stopColor="#f4ead6" />
                <stop offset="72%" stopColor="#d8c9ab" />
                <stop offset="100%" stopColor="#a89577" />
              </radialGradient>
              <filter id={`nue-glow-${seed}`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Sayap kiri — mengepak (rotate di pangkal sayap) */}
            <motion.g
              style={{ transformOrigin: '118px 74px', transformBox: 'fill-box' }}
              animate={reduced ? { rotate: -14 } : { rotate: [-30, -6, -30] }}
              transition={reduced ? { duration: 0 } : { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path d="M118,74 C86,40 46,26 6,40 C34,52 52,64 70,82 C86,74 102,72 118,74 Z"
                fill={`url(#nue-wing-${seed})`} stroke="#a855f7" strokeWidth="1.3" strokeOpacity="0.85" />
              {/* Bulu sayap (garis-garis) */}
              {[0, 1, 2, 3, 4].map((i) => (
                <path key={`wl${i}`} d={`M${18 + i * 18},${44 + i * 5} L${52 + i * 14},${74 + i * 2}`}
                  stroke="#c4b5fd" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
              ))}
            </motion.g>

            {/* Sayap kanan — mengepak (fase berlawanan) */}
            <motion.g
              style={{ transformOrigin: '142px 74px', transformBox: 'fill-box' }}
              animate={reduced ? { rotate: 14 } : { rotate: [30, 6, 30] }}
              transition={reduced ? { duration: 0 } : { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path d="M142,74 C174,40 214,26 254,40 C226,52 208,64 190,82 C174,74 158,72 142,74 Z"
                fill={`url(#nue-wing-${seed})`} stroke="#a855f7" strokeWidth="1.3" strokeOpacity="0.85" />
              {[0, 1, 2, 3, 4].map((i) => (
                <path key={`wr${i}`} d={`M${242 - i * 18},${44 + i * 5} L${208 - i * 14},${74 + i * 2}`}
                  stroke="#c4b5fd" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
              ))}
            </motion.g>

            {/* Badan + ekor */}
            <ellipse cx="130" cy="92" rx="26" ry="34" fill={`url(#nue-body-${seed})`} stroke="#7c3aed" strokeWidth="1.2" />
            <path d="M130,120 C124,142 116,156 104,168 L130,158 L156,168 C144,156 136,142 130,120 Z"
              fill="#120a22" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.7" />

            {/* Kepala + MUKA MANUSIA (ciri 鵺): tulang pucat, mata kuning menyala */}
            <g filter={`url(#nue-glow-${seed})`}>
              <ellipse cx="130" cy="56" rx="26" ry="30" fill={`url(#nue-face-${seed})`} stroke="#3b1d5e" strokeWidth="1.4" />
              {/* Alis kerut (marah/kesakitan) */}
              <path d="M112,44 L122,50 M148,44 L138,50" stroke="#4a3a24" strokeWidth="1.6" strokeLinecap="round" />
              {/* Mata kuning besar */}
              <ellipse cx="119" cy="56" rx="6.2" ry="5" fill="#fde047" stroke="#3a2a06" strokeWidth="1" />
              <ellipse cx="141" cy="56" rx="6.2" ry="5" fill="#fde047" stroke="#3a2a06" strokeWidth="1" />
              <circle cx="119" cy="56" r="1.9" fill="#1a1206" />
              <circle cx="141" cy="56" r="1.9" fill="#1a1206" />
              {/* Mulut menganga + gigi bergerigi */}
              <path d="M114,72 C124,84 138,84 146,72 C140,78 122,78 114,72 Z" fill="#2a0a10" stroke="#5b2a2a" strokeWidth="1" />
              {[0, 1, 2, 3, 4].map((i) => (
                <path key={`t${i}`} d={`M${116 + i * 7},${73 + Math.abs(i - 2) * 0.6} L${119 + i * 7},${78} L${122 + i * 7},${73}`}
                  fill="#f5e6d3" stroke="none" />
              ))}
              {/* Kerutan pipi (kulit tua) */}
              <path d="M108,66 C104,70 104,74 108,78 M152,66 C156,70 156,74 152,78" stroke="#8a7a5c" strokeWidth="0.9" fill="none" />
            </g>

            {/* Cakar/ tangan manusia menggenggam (referensi) */}
            <g fill="#d8c9ab" stroke="#3a2a14" strokeWidth="1.1">
              <path d="M104,104 C96,108 90,116 92,124 C98,120 104,114 108,108 Z" />
              <path d="M156,104 C164,108 170,116 168,124 C162,120 156,114 152,108 Z" />
            </g>
          </svg>
        </motion.div>
      </div>

      {/* Bulu jatuh (bulu besar berbentuk daun — referensi user) */}
      {feathers.map((f) => (
        <motion.span
          key={f.id}
          className="absolute"
          style={{ left: `${f.x}%`, top: '-12%', width: f.size, height: f.size * 1.5, rotate: `${f.rot}deg` }}
          initial={{ opacity: 0, y: 0 }}
          animate={reduced ? { opacity: 0.35 } : { opacity: [0, 0.9, 0.75, 0], y: '118vh', rotate: `${f.rot + 160}deg` }}
          transition={{ duration: reduced ? 0 : f.dur + 1.1, delay: reduced ? 0 : f.delay, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 20 30" className="w-full h-full">
            <path d="M10,0 C16,8 18,18 10,30 C2,18 4,8 10,0 Z" fill="#2b1440" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.6" />
            <path d="M10,3 L10,27" stroke="#c4b5fd" strokeWidth="0.8" strokeOpacity="0.5" />
          </svg>
        </motion.span>
      ))}
    </div>
  );
}

// ── 布瑠部由良由良 → 魔虚羅: GIF kanon + aura + mantra ring + shake ──────────
// Kritik user: "mahoraga nya apaan item, harus lore accurate ... wheelnya juga
// jangan ada mata". GIF = Mahoraga kanon (roda adaptasi 8 handle TANPA mata).
function Furube({ seed, reduced }) {
  const [embers] = useState(() => sukunaEmbers(seed + 13, 7));
  const [ring] = useState(() => sukunaMantraRing(20));
  const [spokes] = useState(() => Array.from({ length: 8 }, (_, i) => (i / 8) * 360));

  return (
    <div className="absolute inset-0">
      {/* Aura ungu + bara hitam (adaptasi = energi kegelapan) */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 62%, rgba(168,85,247,0.34), rgba(18,10,30,0.55) 58%, transparent 82%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.5 : [0, 0.9, 0.7] }}
        transition={{ duration: reduced ? 0 : 0.7, ease: 'easeOut' }}
      />
      {embers.map((e) => (
        <motion.span
          key={e.id}
          className="absolute rounded-full"
          style={{ left: `${e.x}%`, bottom: '12%', width: e.size, height: e.size, background: '#2a1240', boxShadow: '0 0 10px rgba(168,85,247,0.6)' }}
          initial={{ opacity: 0, y: 0 }}
          animate={reduced ? { opacity: 0.5 } : { opacity: [0, 0.9, 0], y: e.drift }}
          transition={{ duration: reduced ? 0 : e.dur, delay: reduced ? 0 : e.delay, ease: 'easeOut' }}
        />
      ))}

      {/* Lingkaran mantra di belakang GIF (roda adaptasi: 8 jari, TANPA mata) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.svg viewBox="0 0 100 100" className="w-[58vmin] h-auto"
          initial={{ rotate: 0, opacity: 0, scale: 0.8 }}
          animate={reduced ? { rotate: 0, opacity: 0.85, scale: 1 } : { rotate: 220, opacity: [0, 0.9, 0.75], scale: [0.8, 1, 1] }}
          transition={{ duration: reduced ? 0 : 1.1, ease: 'easeOut' }}
        >
          <circle cx="50" cy="50" r="34" fill="none" stroke="#a855f7" strokeWidth="1.4" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#a855f7" strokeWidth="0.6" strokeOpacity="0.6" />
          {spokes.map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <g key={i}>
                <line x1="50" y1="50" x2={50 + Math.cos(rad) * 34} y2={50 + Math.sin(rad) * 34}
                  stroke="#c4b5fd" strokeWidth="0.7" strokeLinecap="round" strokeOpacity="0.8" />
                {/* Handle roda (bola kecil di ujung) — kanon 8 handle, tanpa mata */}
                <circle cx={50 + Math.cos(rad) * 35.5} cy={50 + Math.sin(rad) * 35.5} r="1.7"
                  fill="#1a0a2a" stroke="#c4b5fd" strokeWidth="0.7" />
              </g>
            );
          })}
        </motion.svg>
      </div>

      {/* Lingkaran mantra berputar pelan */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="rounded-full"
          style={{ width: '62vmin', height: '62vmin', border: '1.5px dashed rgba(168,85,247,0.5)', borderRadius: '50%' }}
          animate={reduced ? { rotate: 0 } : { rotate: 360 }}
          transition={{ duration: ring.speed * 2, repeat: reduced ? 0 : Infinity, ease: 'linear' }}
        />
      </div>

      {/* Shake seluruh layer saat raksasa bangkit */}
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          animate={{ x: [0, -7, 6, -4, 3, 0], y: [0, 3, -3, 2, -1, 0] }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        />
      )}

      {/* Kanji 魔虚羅 glow ungu di atas GIF */}
      <motion.span
        className="absolute left-1/2 font-serif font-black select-none"
        style={{
          top: '8%', x: '-50%', fontSize: 'clamp(34px, 8vw, 96px)',
          color: '#c4b5fd', WebkitTextStroke: `2px ${SUKUNA_INK}`,
          textShadow: '0 0 18px rgba(168,85,247,0.9), 0 0 48px rgba(168,85,247,0.5)',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 0.96], scale: [0.8, 1.04, 1] }}
        transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.45, ease: 'easeOut' }}
      >
        魔虚羅
      </motion.span>
    </div>
  );
}

// ── 龍鱗・反発・番いの流星: 3 baris chant terukir terbakar kiri→kanan ────────
function Ryuurin({ seed, reduced }) {
  const [lines] = useState(() => sukunaChantLines(seed, 3));
  const [ring] = useState(() => sukunaMantraRing(30));
  const [embers] = useState(() => sukunaEmbers(seed + 29, 6));
  return (
    <div className="absolute inset-0">
      {/* Lingkaran mantra berputar makin cepat */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="rounded-full"
          style={{ width: '62vmin', height: '62vmin', border: `2px solid rgba(224,36,26,0.35)`, borderTopColor: 'rgba(224,36,26,0.85)' }}
          animate={reduced ? { rotate: 0 } : { rotate: 360 }}
          transition={{ duration: ring.speed, repeat: reduced ? 0 : Infinity, ease: 'linear' }}
        />
      </div>

      {/* 3 baris chant terukir — tiap baris "terbakar" kiri→kanan */}
      {lines.map((l) => (
        <div key={l.id} className="absolute left-0 right-0 flex justify-center" style={{ top: `${l.y}%` }}>
          <div className="relative">
            <span
              className="font-serif font-black select-none"
              style={{
                fontSize: 'clamp(30px, 6.4vw, 84px)',
                color: '#3a0a08',
                WebkitTextStroke: `1.6px rgba(224,36,26,0.9)`,
                letterSpacing: '0.06em',
              }}
            >
              {l.text}
            </span>
            {/* Lapisan "terbakar" (merah menyala) menutupi kiri→kanan via clip */}
            <motion.span
              className="absolute inset-0 font-serif font-black select-none"
              style={{
                fontSize: 'clamp(30px, 6.4vw, 84px)',
                color: '#ff5a3c',
                WebkitTextStroke: `1.6px #ffd7c2`,
                letterSpacing: '0.06em',
                textShadow: '0 0 16px rgba(255,90,60,0.85), 0 0 40px rgba(224,36,26,0.55)',
                clipPath: 'inset(0 100% 0 0)',
              }}
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              animate={{ clipPath: 'inset(0 0% 0 0)' }}
              transition={{ duration: reduced ? 0 : l.dur, delay: reduced ? 0 : l.at, ease: 'easeInOut' }}
            >
              {l.text}
            </motion.span>
            {/* Bara di ujung "penulisan" */}
            {!reduced && (
              <motion.span
                className="absolute top-1/2 w-4 h-4 rounded-full"
                style={{ background: '#ffb199', boxShadow: '0 0 22px 8px rgba(255,120,60,0.75)' }}
                initial={{ left: '0%', opacity: 0 }}
                animate={{ left: '100%', opacity: [0, 1, 0] }}
                transition={{ duration: l.dur, delay: l.at, ease: 'easeInOut' }}
              />
            )}
          </div>
        </div>
      ))}

      {embers.map((e) => (
        <motion.span
          key={e.id}
          className="absolute rounded-full"
          style={{ left: `${e.x}%`, bottom: '10%', width: e.size, height: e.size, background: '#ff5a3c', boxShadow: '0 0 12px rgba(224,36,26,0.8)' }}
          initial={{ opacity: 0, y: 0 }}
          animate={reduced ? { opacity: 0.4 } : { opacity: [0, 0.9, 0], y: e.drift }}
          transition={{ duration: reduced ? 0 : e.dur + 0.4, delay: reduced ? 0 : e.delay + 0.2, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ── 世界を断つ斬撃: 2 tebasan silang + celah ruang + distorsi + gelap ───────
function SekaiZangeki({ reduced }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Tebasan 1: horizontal seluruh viewport */}
      <motion.div
        className="absolute left-0 right-0"
        style={{ top: '46%', height: 3, background: `linear-gradient(90deg, transparent, ${SUKUNA_FLASH}, transparent)`, boxShadow: `0 0 26px 4px ${SUKUNA_FLASH}cc` }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={reduced ? { scaleX: 1, opacity: 0.7 } : { scaleX: 1, opacity: [0, 1, 0.9, 0] }}
        transition={{ duration: reduced ? 0 : 0.4, ease: 'easeOut' }}
      />
      {/* Tebasan 2: vertikal */}
      <motion.div
        className="absolute top-0 bottom-0"
        style={{ left: '48%', width: 3, background: `linear-gradient(180deg, transparent, ${SUKUNA_FLASH}, transparent)`, boxShadow: `0 0 26px 4px ${SUKUNA_FLASH}cc` }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={reduced ? { scaleY: 1, opacity: 0.7 } : { scaleY: 1, opacity: [0, 1, 0.9, 0] }}
        transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.16, ease: 'easeOut' }}
      />

      {/* Celah ruang putih tebal di garis silang */}
      <motion.div
        className="absolute"
        style={{ left: '50%', top: '46%', width: '110vmax', height: 10, x: '-50%', y: '-50%', background: SUKUNA_FLASH, filter: 'blur(1px)' }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={reduced ? { opacity: 0.5, scaleY: 1 } : { opacity: [0, 1, 0], scaleY: [0, 1.4, 2.2] }}
        transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.18, ease: 'easeOut' }}
      />

      {/* Distorsi geser 0.5s (hanya kalau bukan reduced) */}
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          style={{ backdropFilter: 'blur(0.5px)' }}
          animate={{ x: [0, -18, 14, -8, 5, 0], skewX: [0, 1.6, -1.4, 0.8, -0.4, 0] }}
          transition={{ duration: 0.5, delay: 0.14, ease: 'easeOut' }}
        />
      )}

      {/* Gelap total 0.3s setelah tebasan */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.25 } : { opacity: [0, 0, 0.96, 0] }}
        transition={{ duration: reduced ? 0 : 0.9, times: [0, 0.4, 0.62, 1], ease: 'easeOut' }}
      />

      {/* Kanji melintang di garis */}
      <motion.span
        className="absolute left-1/2 font-serif font-black select-none"
        style={{
          top: '52%', x: '-50%', fontSize: 'clamp(34px, 8vw, 96px)',
          color: SUKUNA_FLASH, WebkitTextStroke: `2px ${SUKUNA_INK}`,
          textShadow: `0 0 22px rgba(255,255,255,0.9), 0 0 60px rgba(224,36,26,0.5)`,
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0.94], scale: [0.9, 1.06, 1, 1] }}
        transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 0.3, ease: 'easeOut' }}
      >
        世界を断つ斬撃
      </motion.span>
    </div>
  );
}

// ── Salah: CUMA kanji 馬鹿な (TechKanji) + GIF kalah — semua efek lain dibuang ─
function SukunaWrong({ reduced }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Kilatan gelap tipis biar transisi tidak "jomplang" (bukan veil berat) */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.18 } : { opacity: [0, 0.3, 0.16] }}
        transition={{ duration: reduced ? 0 : 0.35, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── Dispatcher ───────────────────────────────────────────────────────────────
export function SukunaBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const tech = fx?.tech;
  const seed = fx?.seed || 1;
  const style = tech ? SUKUNA_STYLE[tech] : null;
  const gifSrc = fx?.gifSrc || style?.gif || null;
  const wrong = kind === 'wrong';

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
    >
      {wrong && <SukunaWrong reduced={reduced} />}
      {tech === 'kumo_no_ito' && <WebTrap seed={seed} reduced={reduced} />}
      {tech === 'nue' && <Nue seed={seed} reduced={reduced} />}
      {tech === 'furube' && <Furube seed={seed} reduced={reduced} />}
      {tech === 'ryuurin' && <Ryuurin seed={seed} reduced={reduced} />}
      {tech === 'sekai_zangeki' && <SekaiZangeki reduced={reduced} />}
      {/* GIF: salah = kalah (馬鹿な) · furube = Mahoraga kanon */}
      <SukunaGifLayer src={gifSrc} reduced={reduced} wrong={wrong} delay={tech === 'furube' ? 0.25 : 0} />
      <TechKanji
        style={style || (wrong ? SUKUNA_STYLE.wrong : null)}
        reduced={reduced}
        delay={tech === 'ryuurin' ? 0.4 : 0.22}
      />
    </motion.div>
  );
}

export default SukunaBurst;
