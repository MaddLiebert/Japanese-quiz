import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  NANAMI_STYLE, NANAMI_WHITE, NANAMI_GOLD, NANAMI_GOLD_DEEP, NANAMI_NAVY, NANAMI_BLACK, NANAMI_RED,
  NANAMI_STAGGER, nanamiRatioLine, nanamiRubble, nanamiAura, nanamiCracks,
} from './nanamiFx';

// ─────────────────────────────────────────────────────────────────────────────
// Nanami Kento (visual 'nanami') — efek jawaban, 十劃呪法 (とおかくじゅほう ·
// toogaku juhou). Aturan main (spec Nanami Kento.md, 🔒 FINAL):
//   • non-streak → 七三 (しちさん · shichisan, garis 7:3 + tebasan presisi) ↔
//     大鉈 (おおなた · oonata, golok ber-呪符 menyapu) — rotasi deterministik.
//   • 10 → 瓦落瓦落 (がらがら · garagara, dinding retak → puing menghantam kartu)
//     · 20 → 黒閃 (こくせん · kokusen, distorsi hitam → ledakan hitam-merah)
//     · 30+ → 時間外労働 (じかんがいろうどう · jikangai, dasi lepas + jam +
//     aura emas naik).
//   • salah → wash navy redup + kanji 「残念ですが」 (klip kalah #1).
// Identitas visual 7:3 と黄金 (garis rasio presisi + emas korporat):
//   3 lapis tiap efek — core putih (flash critical) → body emas (#F59E0B /
//   #B45309) → edge navy (#1E3A8A); 黒閃 = hitam #0a0a0a + merah #dc2626.
// Anti-slop (dari plan, query ui-ux-pro-max):
//   • easing BEDA per peran: garis power2.out (presisi, bukan bounce), impact
//     back.out (overshoot kecil = "kena"), keluar power2.in, reveal expo.out
//   • STAGGER garis 0ms → titik 120ms → tebasan 200ms → percikan 280ms → puing 360ms
//   • puing meluncur RADIAL dari titik hancur + rotasi SEARAH luncuran (fisika)
//   • aura = partikel naik BERGELOMBANG (sin), bukan glow statis
// Aturan warisan Megumi v2.5: efek TIDAK boleh nutupin soal — burst muncul DI
// KARTU yang dipencet (anchor rect kartu, clip ke bentuknya); jam jikangai di
// SAYAP soal (gap ≥12px, stage anchor pola Megumi); retakan dinding di sekitar
// kartu (lubang evenodd = kartu tetap terlihat). reduced-motion → kanji & bentuk
// akhir tetap tampil (informasi kanon), gerakan/flash/shake disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Easing per peran (NANAMI_MOTION di nanamiFx — token gsap ui-ux-pro-max).
const EASE_LINE = [0.33, 1, 0.68, 1];      // power2.out — presisi
const EASE_IMPACT = [0.34, 1.56, 0.64, 1]; // back.out — impact "kena"
const EASE_EXIT = [0.55, 0, 1, 0.45];      // power2.in — keluar cepat
const EASE_REVEAL = [0.16, 1, 0.3, 1];     // expo.out — reveal

// ── Anchor: rect kartu jawaban yang dipencet (pola Nobara/Megumi ClawTrap) ──
// Semua efek menempel di KARTU → tidak pernah menutupi karakter soal. Kartu
// ikut hentakan [data-nanami-hit] → recompute beberapa frame.
function usePickedRect(active = true, holdMs = 900) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;
    const el = document.querySelector('button[data-picked]');
    if (!el) return undefined;
    let raf = 0;
    const t0 = performance.now();
    const track = () => {
      const r = el.getBoundingClientRect();
      setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
      if (performance.now() - t0 < holdMs) raf = requestAnimationFrame(track);
    };
    track();
    return () => cancelAnimationFrame(raf);
  }, [active, holdMs]);
  return rect;
}

// ── Stage anchor (pola Megumi v2.5): rect soal + band vertikal aman ─────────
// Dipakai jam 時間外労働 di SAYAP soal (kiri), gap ≥12px dari karakter soal.
// Halaman tanpa [data-quiz-shell] → anchor = tengah layar; sayap sempit →
// komponen fallback ke atas kartu (bukan tepi layar).
function useStageAnchor() {
  const [m, setM] = useState(null);
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const measure = () => {
      const vp = { w: window.innerWidth, h: window.innerHeight };
      const shell = document.querySelector('[data-quiz-shell]');
      const qEl = (shell && shell.querySelector('h2')) || document.querySelector('canvas');
      let qRect = null;
      if (qEl) {
        const r = qEl.getBoundingClientRect();
        if (r.width > 4 && r.height > 4) {
          qRect = { x: r.left, y: r.top, w: r.width, h: r.height };
        }
      }
      if (!qRect) qRect = { x: vp.w / 2 - 40, y: vp.h * 0.26, w: 80, h: 80 };
      const header = shell && shell.querySelector('header');
      const grid = shell && shell.querySelector('.grid');
      const hb = header ? header.getBoundingClientRect().bottom : 0;
      const gt = grid ? grid.getBoundingClientRect().top : vp.h;
      const bounds = { top: Math.max(56, hb + 8), bottom: Math.min(vp.h - 72, gt - 8) };
      setM({ vp, qRect, bounds });
    };
    measure();
    window.addEventListener('resize', measure);
    const t = setTimeout(measure, 150);   // setelah font/layout settle
    return () => { window.removeEventListener('resize', measure); clearTimeout(t); };
  }, []);
  return m;
}

// ── Poligon tak beraturan deterministik (puing) — tanpa rng ─────────────────
function polyPts(sides = 6, size = 9, j = 0) {
  const pts = [];
  for (let k = 0; k < sides; k++) {
    const a = ((k * 360) / sides + ((k * 53 + j * 31) % 17) - 8) * (Math.PI / 180);
    const r = size * (k % 2 ? 0.78 : 1);
    pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
}

// ── Burs bergerigi deterministik (黒閃) — bintang tak beraturan 12 sisi ─────
function jagPts(n = 12, r1 = 30, r2 = 19, j = 0) {
  const pts = [];
  for (let k = 0; k < n; k++) {
    const wob = ((k * 37 + j * 11) % 13) / 13 * 3 - 1.5;
    const a = ((k * 360) / n) * (Math.PI / 180);
    const r = (k % 2 ? r2 : r1) + wob;
    pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
}

// ── Kanji jurus — band bawah (pola Megumi/Yuji/Nobara, konsisten JJK) ───────
function TechKanji({ style, reduced, delay = 0, size = 'clamp(30px, 7vmin, 58px)', anchor = 'bottom' }) {
  if (!style) return null;
  return (
    <motion.span
      data-nanami-kanji
      className="absolute font-serif font-black select-none pointer-events-none"
      style={{
        left: '50%',
        ...(anchor === 'top' ? { top: '20%' } : { bottom: '13%' }),
        x: '-50%',
        fontSize: size,
        color: style.color,
        WebkitTextStroke: `1px ${NANAMI_NAVY}`,
        textShadow: `0 0 12px ${style.color}cc, 0 0 34px ${style.color}66`,
        willChange: 'transform, opacity',
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0.94], scale: [0.7, 1.12, 1, 1.01] }}
      transition={{ duration: reduced ? 0 : 0.72, delay: reduced ? 0 : delay, ease: 'easeOut' }}
    >
      {style.kanji}
    </motion.span>
  );
}

// ── 七三 (shichisan): garis 7:3 tumbuh → titik nyala → tebasan DI titik itu ─
// Semua di DALAM bentuk kartu (clip): garis tumbuh dari tepi kiri dan BERHENTI
// di titik 7:3 (growTo 0.7) — tebasan "memilih" titik, bukan acak.
function ShichisanCore({ seed, reduced, rect }) {
  const [line] = useState(() => nanamiRatioLine(seed));
  const x0 = (line.x0 * rect.w) / 100;
  const y0 = (line.y0 * rect.h) / 100;
  const x1 = (line.x1 * rect.w) / 100;
  const y1 = (line.y1 * rect.h) / 100;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
  const px = (line.px * rect.w) / 100;
  const py = (line.py * rect.h) / 100;
  const slashLen = Math.max(40, rect.w * 0.44);
  const S = NANAMI_STAGGER;
  return (
    <>
      {/* Garis 7:3 — tumbuh dari tepi, berhenti DI titik (growTo) */}
      <motion.div
        data-nanami-ratio
        className="absolute origin-left"
        style={{ left: x0, top: y0, width: len, height: 2.4, rotate: ang, borderRadius: 2 }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={reduced ? { scaleX: line.growTo, opacity: 1 } : { scaleX: [0, line.growTo], opacity: [0, 1] }}
        transition={{ duration: reduced ? 0 : line.dur, delay: reduced ? 0 : S.line, ease: EASE_LINE }}
      >
        {/* edge navy (bayangan garis) → body emas */}
        <div className="absolute inset-0" style={{
          background: `linear-gradient(90deg, ${NANAMI_NAVY}, ${NANAMI_GOLD_DEEP} 55%, ${NANAMI_GOLD})`,
          boxShadow: `0 0 8px ${NANAMI_GOLD_DEEP}99, 0 1px 0 ${NANAMI_NAVY}cc`,
        }} />
      </motion.div>

      {/* Notch penanda rasio 7:3 — dua takik kecil presisi di titik */}
      <motion.div
        className="absolute"
        style={{ left: px, top: py, rotate: ang + 90 }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={reduced ? { opacity: 0.9, scale: 1 } : { opacity: [0, 0.95, 0.85], scale: [0.4, 1.15, 1] }}
        transition={{ duration: reduced ? 0 : 0.18, delay: reduced ? 0 : S.point, ease: EASE_IMPACT }}
      >
        <div style={{ position: 'absolute', left: -0.6, top: -(line.notch.gap + line.notch.len), width: line.notch.w, height: line.notch.len, background: NANAMI_WHITE, opacity: 0.85 }} />
        <div style={{ position: 'absolute', left: -0.6, top: line.notch.gap, width: line.notch.w, height: line.notch.len, background: NANAMI_WHITE, opacity: 0.85 }} />
      </motion.div>

      {/* Titik 7:3 nyala */}
      <motion.div
        className="absolute"
        style={{ left: px, top: py, width: 12, height: 12, marginLeft: -6, marginTop: -6 }}
        initial={{ opacity: 0, scale: 0.2 }}
        animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 0.9], scale: [0.2, 1.25, 1] }}
        transition={{ duration: reduced ? 0 : 0.2, delay: reduced ? 0 : S.point, ease: EASE_IMPACT }}
      >
        <div className="w-full h-full rounded-full" style={{
          background: `radial-gradient(circle, ${NANAMI_WHITE} 0%, ${NANAMI_GOLD} 45%, transparent 72%)`,
          boxShadow: `0 0 14px ${NANAMI_GOLD}cc`,
        }} />
      </motion.div>

      {/* Tebasan presisi — mendarat TEPAT di titik (sepanjang garis) */}
      <motion.div
        data-nanami-slash
        className="absolute"
        style={{ left: px, top: py, width: slashLen, height: 3, marginLeft: -slashLen / 2, marginTop: -1.5, rotate: ang }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={reduced ? { scaleX: 1, opacity: 1 } : { scaleX: [0, 1], opacity: [0, 1] }}
        transition={{ duration: reduced ? 0 : 0.16, delay: reduced ? 0 : S.slash, ease: EASE_IMPACT }}
      >
        <div className="absolute inset-0" style={{
          background: `linear-gradient(90deg, transparent, ${NANAMI_NAVY} 12%, ${NANAMI_GOLD} 50%, ${NANAMI_NAVY} 88%, transparent)`,
          borderRadius: 2,
        }} />
        <div className="absolute" style={{
          left: '18%', right: '18%', top: '50%', height: 1.2, marginTop: -0.6,
          background: NANAMI_WHITE, borderRadius: 1, boxShadow: `0 0 6px ${NANAMI_WHITE}`,
        }} />
      </motion.div>

      {/* Flash putih tipis di titik (core) — 90ms */}
      {!reduced && (
        <motion.div
          className="absolute"
          style={{ left: px, top: py, width: 26, height: 26, marginLeft: -13, marginTop: -13 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.95, 0] }}
          transition={{ duration: 0.09, delay: S.slash, ease: 'linear' }}
        >
          <div className="w-full h-full rounded-full" style={{ background: `radial-gradient(circle, ${NANAMI_WHITE} 0%, ${NANAMI_WHITE}00 70%)` }} />
        </motion.div>
      )}
    </>
  );
}

// ── Percikan emas dari titik 7:3 (lapisan terbuka — boleh lewat tepi kartu) ─
function ShichisanSparks({ seed, reduced, rect }) {
  const [line] = useState(() => nanamiRatioLine(seed));
  const px = (line.px * rect.w) / 100;
  const py = (line.py * rect.h) / 100;
  const dirs = [-42, 38];   // dua arah menyilang dari garis (deterministik)
  return (
    <>
      {dirs.map((d, i) => {
        const a = ((line.angle + d) * Math.PI) / 180;
        const dist = 30 + i * 8;
        const dx = Math.cos(a) * dist;
        const dy = Math.sin(a) * dist;
        return (
          <motion.div
            key={d}
            className="absolute"
            style={{ left: px, top: py, width: 14, height: 2.4, marginTop: -1.2, borderRadius: 2, rotate: line.angle + d, originX: 0 }}
            initial={{ scaleX: 0, opacity: 0, x: 0, y: 0 }}
            animate={reduced
              ? { scaleX: 0.8, opacity: 0.85, x: dx * 0.6, y: dy * 0.6 }
              : { scaleX: [0, 1, 0.6], opacity: [0, 1, 0], x: [0, dx], y: [0, dy] }}
            transition={{ duration: reduced ? 0 : 0.34, delay: reduced ? 0 : NANAMI_STAGGER.spark + i * 0.03, ease: EASE_EXIT }}
          >
            <div className="w-full h-full" style={{ background: `linear-gradient(90deg, ${NANAMI_WHITE}, ${NANAMI_GOLD})`, boxShadow: `0 0 6px ${NANAMI_GOLD}` }} />
          </motion.div>
        );
      })}
    </>
  );
}

// ── 大鉈 (oonata): siluet golok ber-呪符 menyapu dari samping ───────────────
// Bilah menyapu kiri→kanan MELEWATI kartu (lapisan terbuka — masuk/keluar tepi),
// meninggalkan goresan lebar di kartu + 呪符 berterbangan.
function OonataBlade({ reduced, rect }) {
  const bladeW = Math.max(150, rect.w * 1.15);
  const bladeH = bladeW * 0.3;
  return (
    <motion.div
      data-nanami-blade
      className="absolute"
      style={{ left: -bladeW * 0.55, top: rect.h * 0.5 - bladeH / 2, width: bladeW, height: bladeH }}
      initial={{ x: 0, y: 0, rotate: -14, opacity: 0 }}
      animate={reduced
        ? { x: rect.w * 0.62, y: -rect.h * 0.12, rotate: 5, opacity: 0.95 }
        : { x: [0, rect.w * 0.62], y: [0, -rect.h * 0.12], rotate: [-14, 5], opacity: [0, 1, 1, 0.85] }}
      transition={{ duration: reduced ? 0 : 0.42, ease: EASE_REVEAL }}
    >
      <svg viewBox="0 0 150 44" width="100%" height="100%" className="block" aria-hidden="true">
        {/* bilah golok: badan navy, mata emas */}
        <path d="M2,16 L118,2 L146,22 L26,40 Z" fill={NANAMI_NAVY} stroke={NANAMI_GOLD_DEEP} strokeWidth="1.6" />
        <path d="M118,2 L146,22" fill="none" stroke={NANAMI_GOLD} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M4,17 L112,5" fill="none" stroke={NANAMI_WHITE} strokeWidth="1" opacity="0.5" />
        {/* gagang */}
        <rect x="-2" y="14" width="16" height="10" rx="2" fill={NANAMI_BLACK} stroke={NANAMI_GOLD_DEEP} strokeWidth="1.2" />
        {/* 呪符 dibalut di pangkal bilah */}
        <rect x="22" y="10" width="9" height="22" fill={NANAMI_WHITE} opacity="0.92" transform="rotate(-9 26 21)" />
        <rect x="36" y="9" width="9" height="22" fill={NANAMI_WHITE} opacity="0.86" transform="rotate(-9 40 20)" />
        <line x1="26.5" y1="12" x2="26.5" y2="30" stroke={NANAMI_RED} strokeWidth="1.4" opacity="0.8" transform="rotate(-9 26 21)" />
        <line x1="40.5" y1="11" x2="40.5" y2="29" stroke={NANAMI_RED} strokeWidth="1.4" opacity="0.7" transform="rotate(-9 40 20)" />
      </svg>
    </motion.div>
  );
}

// Goresan lebar (di dalam kartu) — lensa emas + core putih, tumbuh dari kiri.
function OonataGash({ reduced, rect }) {
  const gy = rect.h * 0.46;
  const gh = Math.max(8, rect.h * 0.13);
  return (
    <>
      <motion.div
        data-nanami-gash
        className="absolute"
        style={{
          left: 0, top: gy - gh / 2, width: rect.w, height: gh, borderRadius: '50% / 42%', originX: 0,
          background: `linear-gradient(180deg, ${NANAMI_GOLD_DEEP}, ${NANAMI_GOLD})`,
          boxShadow: `0 0 10px ${NANAMI_GOLD_DEEP}aa`,
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={reduced ? { scaleX: 1, opacity: 0.9 } : { scaleX: [0, 1], opacity: [0, 0.95] }}
        transition={{ duration: reduced ? 0 : 0.2, delay: reduced ? 0 : 0.3, ease: EASE_LINE }}
      />
      <motion.div
        className="absolute"
        style={{
          left: '4%', right: '4%', top: gy - gh * 0.18, height: gh * 0.36, borderRadius: '50% / 50%', originX: 0,
          background: NANAMI_WHITE, opacity: 0.9, boxShadow: `0 0 8px ${NANAMI_WHITE}aa`,
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={reduced ? { scaleX: 1, opacity: 0.9 } : { scaleX: [0, 1], opacity: [0, 0.92] }}
        transition={{ duration: reduced ? 0 : 0.18, delay: reduced ? 0 : 0.33, ease: EASE_LINE }}
      />
    </>
  );
}

// 呪符 berterbangan dari garis goresan (stagger 50ms).
function JufuFlutter({ reduced, rect }) {
  const jufu = [
    { x: 0.18, dr: -64, dy: -34, rot: -38 },
    { x: 0.42, dr: 26, dy: -48, rot: 24 },
    { x: 0.64, dr: -18, dy: -56, rot: -52 },
    { x: 0.82, dr: 58, dy: -30, rot: 44 },
  ];
  const gy = rect.h * 0.46;
  return (
    <>
      {jufu.map((j, i) => (
        <motion.div
          key={j.x}
          className="absolute"
          style={{ left: rect.w * j.x, top: gy - 12, width: 10, height: 26 }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
          animate={reduced
            ? { x: j.dr * 0.5, y: j.dy * 0.5, rotate: j.rot * 0.6, opacity: 0.9 }
            : { x: [0, j.dr], y: [0, j.dy], rotate: [0, j.rot], opacity: [0, 1, 1, 0] }}
          transition={{ duration: reduced ? 0 : 0.52, delay: reduced ? 0 : 0.36 + i * 0.05, ease: EASE_EXIT }}
        >
          <div className="w-full h-full flex items-center justify-center" style={{
            background: NANAMI_WHITE, border: `1px solid ${NANAMI_GOLD_DEEP}`,
            boxShadow: `0 0 6px ${NANAMI_GOLD}66`,
          }}>
            <div style={{ width: 1.6, height: '70%', background: NANAMI_RED, opacity: 0.75 }} />
          </div>
        </motion.div>
      ))}
    </>
  );
}

// ── 瓦落瓦落 (garagara): dinding retak DI SEKITAR kartu → meledak → puing ───
// Dinding digambar sebagai panel dengan LUBANG persis bentuk kartu (fillRule
// evenodd) → kartu tetap terlihat penuh; retakan mengalir dari balik kartu
// (clipped ke dinding). Lalu puing meluncur radial menghantam kartu + debu.
function GaragaraWall({ seed, reduced, rect }) {
  const padW = Math.max(28, rect.w * 0.16);
  const padH = Math.max(20, rect.h * 0.6);
  const w = rect.w + padW * 2;
  const h = rect.h + padH * 2;
  const [cracks] = useState(() => nanamiCracks(seed, 4));
  const cx = rect.w / 2 + padW;
  const cy = rect.h / 2 + padH;
  const frame = `M0,0 H${w} V${h} H0 Z`;
  const hole = `M${padW},${padH} h${rect.w} v${rect.h} h${-rect.w} Z`;
  return (
    <motion.div
      data-nanami-wall
      className="fixed z-[129] pointer-events-none"
      style={{ left: rect.x - padW, top: rect.y - padH, width: w, height: h }}
      initial={{ opacity: 0 }}
      animate={reduced ? { opacity: 0.9 } : { opacity: [0, 0.92, 0.92, 0] }}
      transition={reduced ? { duration: 0 } : { duration: 0.62, times: [0, 0.08, 0.62, 0.72], ease: 'linear' }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 block" aria-hidden="true">
        <defs>
          <clipPath id={`nw-${seed}`}>
            <path d={`${frame} ${hole}`} clipRule="evenodd" />
          </clipPath>
        </defs>
        {/* dinding: panel gelap dengan lubang kartu */}
        <path d={`${frame} ${hole}`} fillRule="evenodd" fill="rgba(15,23,42,0.62)" stroke={`${NANAMI_NAVY}88`} strokeWidth="1.4" />
        {/* retakan mengalir dari pusat kartu — terlihat hanya di dinding */}
        <g clipPath={`url(#nw-${seed})`}>
          {cracks.map((c) => {
            const rad = (c.ang * Math.PI) / 180;
            const x2 = cx + (Math.cos(rad) * c.len * w) / 100;
            const y2 = cy + (Math.sin(rad) * c.len * h) / 100;
            const mx = cx + (Math.cos(rad) * c.len * w) / 200;
            const my = cy + (Math.sin(rad) * c.len * h) / 200;
            return (
              <g key={c.id}>
                <motion.path
                  d={`M${cx},${cy} Q${mx + (y2 - cy) * 0.14},${my - (x2 - cx) * 0.14} ${x2},${y2}`}
                  fill="none" stroke="#cbd5e1" strokeLinecap="round" strokeWidth={Math.max(1, c.w0 * 1.1)}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={reduced ? { pathLength: 1, opacity: 0.9 } : { pathLength: [0, 1, 1], opacity: [0, 0.95, 0.8] }}
                  transition={{ duration: reduced ? 0 : c.dur + 0.06, delay: reduced ? 0 : 0.06 + c.delay, ease: EASE_LINE }}
                />
                {c.branch.map((b) => {
                  const br = (b.ang * Math.PI) / 180;
                  return (
                    <motion.path
                      key={b.id}
                      d={`M${mx},${my} L${mx + (Math.cos(br) * b.len * w) / 100},${my + (Math.sin(br) * b.len * h) / 100}`}
                      fill="none" stroke="#cbd5e1" strokeLinecap="round" strokeWidth={Math.max(0.8, c.w1 * 1.2)}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={reduced ? { pathLength: 1, opacity: 0.75 } : { pathLength: [0, 1], opacity: [0, 0.8] }}
                      transition={{ duration: reduced ? 0 : c.dur, delay: reduced ? 0 : 0.12 + c.delay, ease: EASE_LINE }}
                    />
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>
    </motion.div>
  );
}

// Ledakan + puing meluncur radial + debu (lapisan terbuka, di atas kartu).
function GaragaraBurst({ seed, reduced, rect }) {
  const [pieces] = useState(() => nanamiRubble(seed, 6));
  const cx = rect.w / 2;
  const cy = rect.h / 2;
  return (
    <>
      {/* kilau pecah di pusat (bukan flash layar — skala kartu) */}
      {!reduced && (
        <motion.div
          className="absolute"
          style={{ left: cx, top: cy, width: 30, height: 30, marginLeft: -15, marginTop: -15 }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 0.95, 0], scale: [0.3, 2.4, 2.8] }}
          transition={{ duration: 0.3, delay: 0.34, ease: EASE_EXIT }}
        >
          <div className="w-full h-full rounded-full" style={{ background: `radial-gradient(circle, ${NANAMI_WHITE} 0%, ${NANAMI_GOLD} 40%, transparent 70%)` }} />
        </motion.div>
      )}
      {pieces.map((p, i) => {
        const tx = ((p.dx * rect.w) / 100) * 1.15;
        const ty = ((p.dy * rect.h) / 100) * 1.5;
        const s = Math.max(7, (p.size * rect.h) / 90);
        return (
          <motion.div
            key={p.id}
            className="absolute"
            style={{ left: cx, top: cy, width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2 }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
            animate={reduced
              ? { x: tx * 0.6, y: ty * 0.6, rotate: p.spin * 0.5, opacity: 0.85 }
              : { x: [0, tx], y: [0, ty], rotate: [0, p.spin], opacity: [0, 1, 1, 0.85] }}
            transition={{ duration: reduced ? 0 : p.dur, delay: reduced ? 0 : p.delay, ease: EASE_LINE }}
          >
            <svg viewBox="-10 -10 20 20" width="100%" height="100%" className="block" aria-hidden="true">
              <polygon points={polyPts(p.sides, 9, i)} fill="#334155" stroke={NANAMI_GOLD_DEEP} strokeWidth="0.8" strokeOpacity="0.8" />
            </svg>
          </motion.div>
        );
      })}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`dust${i}`}
          className="absolute"
          style={{
            left: cx + (i - 1) * rect.w * 0.2, top: cy + (i % 2 ? 8 : -6),
            width: 18, height: 12, marginLeft: -9, marginTop: -6, borderRadius: '50%',
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={reduced ? { opacity: 0.3, scale: 1.6 } : { opacity: [0, 0.5, 0], scale: [0.5, 2.1, 2.6] }}
          transition={{ duration: reduced ? 0 : 0.46, delay: reduced ? 0 : 0.42 + i * 0.06, ease: EASE_EXIT }}
        >
          <div className="w-full h-full" style={{ background: 'radial-gradient(circle, rgba(148,163,184,0.6), transparent 70%)' }} />
        </motion.div>
      ))}
    </>
  );
}

// ── 黒閃 (kokusen): distorsi hitam di titik 7:3 → ledakan hitam-merah ───────
// Screen dim 1 frame (bukan flash putih — identitas 黒) + distorsi + burs hitam
// bermata merah + kilat hitam bercabang + retakan merah di kartu.
function KokusenDim({ reduced }) {
  if (reduced) return null;
  return (
    <motion.div
      data-nanami-kokusen-dim
      className="fixed inset-0 z-[128] pointer-events-none"
      style={{ background: 'rgba(2,6,23,0.72)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 0.26, times: [0, 0.45, 1], ease: 'linear' }}
    />
  );
}

function KokusenBurst({ seed, reduced, rect }) {
  const [line] = useState(() => nanamiRatioLine(seed));
  const px = (line.px * rect.w) / 100;
  const py = (line.py * rect.h) / 100;
  const size = Math.max(120, Math.min(rect.w, rect.h) * 1.7);
  const R = size / 2;
  const bolts = [-155, -25, 105];
  const boltLen = Math.max(60, rect.w * 0.42);
  return (
    <>
      {/* distorsi hitam di titik 7:3 (bola gelap mengembang) */}
      <motion.div
        data-nanami-distort
        className="absolute"
        style={{ left: px, top: py, width: size * 0.66, height: size * 0.66, marginLeft: -size * 0.33, marginTop: -size * 0.33 }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={reduced ? { opacity: 0.85, scale: 1 } : { opacity: [0, 1, 0.85], scale: [0.3, 1.5, 1.05] }}
        transition={{ duration: reduced ? 0 : 0.18, delay: reduced ? 0 : 0.04, ease: EASE_IMPACT }}
      >
        <div className="w-full h-full rounded-full" style={{ background: `radial-gradient(circle, ${NANAMI_BLACK} 0%, ${NANAMI_BLACK}dd 42%, transparent 72%)` }} />
      </motion.div>

      {/* cincin merah (distorsi) */}
      {!reduced && (
        <motion.div
          className="absolute"
          style={{ left: px, top: py, width: 22, height: 22, marginLeft: -11, marginTop: -11, border: `2px solid ${NANAMI_RED}`, borderRadius: '50%' }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.3, 2.6] }}
          transition={{ duration: 0.34, delay: 0.14, ease: EASE_EXIT }}
        />
      )}

      {/* burs hitam-merah bergerigi (3 lapis: merah → hitam → core putih) */}
      <motion.div
        data-nanami-kokusen-burst
        className="absolute"
        style={{ left: px, top: py, marginLeft: -R, marginTop: -R, width: size, height: size }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0.92], scale: [0.3, 1.14, 1, 1.02] }}
        transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.14, ease: EASE_IMPACT }}
      >
        <svg viewBox={`${-R} ${-R} ${size} ${size}`} width={size} height={size} className="absolute inset-0 block">
          <polygon points={jagPts(12, 30, 19, seed)} fill={NANAMI_RED} opacity="0.92" />
        </svg>
        <svg viewBox={`${-R} ${-R} ${size} ${size}`} width={size} height={size}
          className="absolute inset-0 block" style={{ transform: 'scale(0.72)' }}>
          <polygon points={jagPts(12, 30, 19, seed)} fill={NANAMI_BLACK} />
        </svg>
        <svg viewBox={`${-R} ${-R} ${size} ${size}`} width={size} height={size}
          className="absolute inset-0 block" style={{ transform: 'scale(0.3)' }}>
          <polygon points={jagPts(12, 30, 19, seed)} fill={NANAMI_WHITE} />
        </svg>
      </motion.div>

      {/* kilat hitam bercabang dari titik (deterministik, 3 arah) */}
      {!reduced && (
        <svg className="absolute pointer-events-none" style={{ left: 0, top: 0, width: rect.w, height: rect.h, overflow: 'visible' }} aria-hidden="true">
          {bolts.map((deg, i) => {
            const pts = [];
            for (let k = 0; k <= 5; k++) {
              const wob = ((k * 29 + seed + i * 7) % 14) - 7;
              const a = ((deg + wob) * Math.PI) / 180;
              const r = (boltLen * k) / 5;
              pts.push(`${(px + Math.cos(a) * r).toFixed(1)},${(py + Math.sin(a) * r).toFixed(1)}`);
            }
            return (
              <motion.polyline
                key={deg}
                points={pts.join(' ')}
                fill="none" stroke={NANAMI_BLACK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 6px ${NANAMI_RED}aa)` }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1], opacity: [0, 1, 0.85] }}
                transition={{ duration: 0.14, delay: 0.12 + i * 0.04, ease: 'linear' }}
              />
            );
          })}
        </svg>
      )}

      {/* flash core putih 1 frame di titik */}
      {!reduced && (
        <motion.div
          className="absolute"
          style={{ left: px, top: py, width: 30, height: 30, marginLeft: -15, marginTop: -15 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.95, 0] }}
          transition={{ duration: 0.08, delay: 0.13, ease: 'linear' }}
        >
          <div className="w-full h-full rounded-full" style={{ background: `radial-gradient(circle, ${NANAMI_WHITE} 0%, ${NANAMI_WHITE}00 70%)` }} />
        </motion.div>
      )}
    </>
  );
}

// Retakan merah di kartu (di dalam clip kartu).
function KokusenCracks({ seed, reduced, rect }) {
  const [cracks] = useState(() => nanamiCracks(seed + 3, 3));
  const cx = rect.w / 2;
  const cy = rect.h / 2;
  return (
    <svg width={rect.w} height={rect.h} viewBox={`0 0 ${rect.w} ${rect.h}`} className="absolute inset-0 block" aria-hidden="true">
      {cracks.map((c) => {
        const rad = (c.ang * Math.PI) / 180;
        const x2 = cx + (Math.cos(rad) * c.len * rect.w) / 100;
        const y2 = cy + (Math.sin(rad) * c.len * rect.h) / 100;
        const mx = cx + (Math.cos(rad) * c.len * rect.w) / 200;
        const my = cy + (Math.sin(rad) * c.len * rect.h) / 200;
        return (
          <g key={c.id}>
            <motion.path
              d={`M${cx},${cy} Q${mx + (y2 - cy) * 0.14},${my - (x2 - cx) * 0.14} ${x2},${y2}`}
              fill="none" stroke={NANAMI_RED} strokeLinecap="round" strokeWidth={Math.max(1, c.w0 * (rect.h / 100))}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={reduced ? { pathLength: 1, opacity: 0.9 } : { pathLength: [0, 1, 1], opacity: [0, 0.95, 0.75] }}
              transition={{ duration: reduced ? 0 : c.dur, delay: reduced ? 0 : 0.2 + c.delay, ease: EASE_LINE }}
            />
            {c.branch.map((b) => {
              const br = (b.ang * Math.PI) / 180;
              return (
                <motion.path
                  key={b.id}
                  d={`M${mx},${my} L${mx + (Math.cos(br) * b.len * rect.w) / 100},${my + (Math.sin(br) * b.len * rect.h) / 100}`}
                  fill="none" stroke={NANAMI_BLACK} strokeLinecap="round" strokeWidth={Math.max(0.8, c.w1 * (rect.h / 100))}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={reduced ? { pathLength: 1, opacity: 0.8 } : { pathLength: [0, 1], opacity: [0, 0.85] }}
                  transition={{ duration: reduced ? 0 : c.dur * 0.8, delay: reduced ? 0 : 0.26 + c.delay, ease: EASE_LINE }}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ── 時間外労働 (jikangai): dasi lepas + jam berdetak + aura emas naik ───────
// Jam di SAYAP soal (stage anchor; gap ≥12px) — fallback di atas kartu.
function JikangaiWatch({ reduced, pos }) {
  const size = pos.size;
  return (
    <motion.div
      data-nanami-watch
      className="fixed z-[131] pointer-events-none"
      style={{ left: pos.x, top: pos.y, width: size, height: size }}
      initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
      animate={reduced
        ? { opacity: 0.95, scale: 1, rotate: 0 }
        : { opacity: [0, 1, 1, 0.92], scale: [0.7, 1.08, 1, 1], rotate: [-8, 0, 0, 0] }}
      transition={{ duration: reduced ? 0 : 0.34, delay: reduced ? 0 : 0.05, ease: EASE_IMPACT }}
    >
      <svg viewBox="0 0 46 46" width={size} height={size} className="block" aria-hidden="true">
        {/* tali jam */}
        <rect x="18" y="0" width="10" height="9" rx="2" fill={NANAMI_NAVY} />
        <rect x="18" y="37" width="10" height="9" rx="2" fill={NANAMI_NAVY} />
        {/* muka jam */}
        <circle cx="23" cy="23" r="15.5" fill="#0f172a" stroke={NANAMI_GOLD} strokeWidth="2.2" />
        {[0, 90, 180, 270].map((a) => (
          <line key={a} x1="23" y1="10" x2="23" y2="12.4" stroke={NANAMI_GOLD} strokeWidth="1.4" transform={`rotate(${a} 23 23)`} />
        ))}
        <line x1="23" y1="23" x2="23" y2="15.5" stroke={NANAMI_WHITE} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="23" y1="23" x2="29" y2="23" stroke={NANAMI_WHITE} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="23" cy="23" r="1.4" fill={NANAMI_GOLD} />
      </svg>
      {/* jarum detik — berdetak (sweep 1 putaran) */}
      <motion.div
        className="absolute"
        style={{ left: size / 2 - 1, top: size * 0.22, width: 2, height: size * 0.28, originY: 1, background: NANAMI_RED, borderRadius: 1 }}
        initial={{ rotate: 0 }}
        animate={reduced ? { rotate: 120 } : { rotate: 360 }}
        transition={reduced ? { duration: 0 } : { duration: 0.9, delay: 0.1, ease: 'linear' }}
      />
    </motion.div>
  );
}

// Dasi mulai lepas (knot turun + bilah miring) — di tepi atas kartu.
function JikangaiTie({ reduced, rect }) {
  const w = 24;
  const h = 56;
  return (
    <motion.div
      data-nanami-tie
      className="absolute"
      style={{ left: rect.w * 0.12, top: -h * 0.55, width: w, height: h }}
      initial={{ opacity: 0, y: -6, rotate: 0 }}
      animate={reduced
        ? { opacity: 0.95, y: 8, rotate: 10 }
        : { opacity: [0, 1, 1, 0.95], y: [-6, 4, 8], rotate: [0, 6, 11] }}
      transition={{ duration: reduced ? 0 : 0.5, ease: EASE_IMPACT }}
    >
      <svg viewBox="0 0 24 56" width={w} height={h} className="block" aria-hidden="true">
        <path d="M9,0 L15,0 L17,7 L7,7 Z" fill={NANAMI_NAVY} stroke={NANAMI_GOLD_DEEP} strokeWidth="0.8" />
        <path d="M8,8 L16,8 L19,52 L12,56 L5,52 Z" fill={NANAMI_NAVY} stroke={NANAMI_GOLD_DEEP} strokeWidth="0.8" />
        <path d="M8.5,10 L15.5,10 L13.2,30 L12,31.5 L10.8,30 Z" fill={NANAMI_GOLD_DEEP} opacity="0.85" />
      </svg>
    </motion.div>
  );
}

// Kerah terbuka — dua flap di kiri/kanan dasi.
function JikangaiCollar({ reduced, rect }) {
  const h = 16;
  const left = rect.w * 0.12 + 12;
  return (
    <>
      <motion.div
        className="absolute"
        style={{ left: left - 22, top: -h * 0.32, width: 15, height: h, originX: 1 }}
        initial={{ opacity: 0, rotate: 0 }}
        animate={reduced ? { opacity: 0.9, rotate: -16 } : { opacity: [0, 0.95], rotate: [0, -16] }}
        transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.16, ease: EASE_IMPACT }}
      >
        <div className="w-full h-full" style={{ background: NANAMI_WHITE, border: `1px solid ${NANAMI_NAVY}`, borderRadius: '2px 6px 2px 8px', opacity: 0.92 }} />
      </motion.div>
      <motion.div
        className="absolute"
        style={{ left: left + 7, top: -h * 0.32, width: 15, height: h, originX: 0 }}
        initial={{ opacity: 0, rotate: 0 }}
        animate={reduced ? { opacity: 0.9, rotate: 16 } : { opacity: [0, 0.95], rotate: [0, 16] }}
        transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : 0.18, ease: EASE_IMPACT }}
      >
        <div className="w-full h-full" style={{ background: NANAMI_WHITE, border: `1px solid ${NANAMI_NAVY}`, borderRadius: '6px 2px 8px 2px', opacity: 0.92 }} />
      </motion.div>
    </>
  );
}

// Aura emas tipis — partikel naik BERGELOMBANG (sin), dari bawah kartu.
function JikangaiAura({ seed, reduced, rect }) {
  const [wisps] = useState(() => nanamiAura(seed, 10));
  return (
    <>
      {wisps.map((p) => {
        const x = (p.x * rect.w) / 100;
        const rise = Math.max(30, p.rise * 1.7);
        const sway = p.sway * 1.6;
        return (
          <motion.div
            key={p.id}
            className="absolute"
            style={{
              left: x, top: rect.h + 8, width: p.size, height: Math.max(10, p.size * 6),
              marginLeft: -p.size / 2,
            }}
            initial={{ y: 0, x: 0, opacity: 0 }}
            animate={reduced
              ? { y: -rise * 0.8, x: 0, opacity: 0.5 }
              : { y: [0, -rise], x: [0, sway, -sway * 0.6, sway * 0.3, 0], opacity: [0, 0.85, 0.7, 0.4, 0] }}
            transition={{ duration: reduced ? 0 : p.dur + 0.4, delay: reduced ? 0 : 0.12 + p.delay, ease: 'easeOut' }}
          >
            <div className="w-full h-full" style={{
              background: `linear-gradient(180deg, transparent, ${NANAMI_GOLD}cc 45%, transparent)`,
              borderRadius: 2, boxShadow: `0 0 6px ${NANAMI_GOLD}66`,
            }} />
          </motion.div>
        );
      })}
    </>
  );
}

// ── Salah: wash navy redup (bukan ledakan — kontrak belum batal) ────────────
function NanamiWrong({ reduced }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 104% at 50% 50%, transparent 0%, transparent 46%, rgba(30,58,138,0.34) 74%, rgba(2,6,23,0.6) 100%)' }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.6 } : { opacity: [0, 0.95, 0.82] }}
        transition={{ duration: reduced ? 0 : 0.32, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── Dispatcher ───────────────────────────────────────────────────────────────
export function NanamiBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const tech = fx?.tech;
  const seed = fx?.seed || 1;
  const style = tech ? NANAMI_STYLE[tech] : null;
  const wrong = kind === 'wrong';
  // Rect kartu yang dipencet — semua jurus menempel DI KARTU (aturan Megumi v2.5).
  const rect = usePickedRect(!wrong, 900);
  const stage = useStageAnchor();

  // Jam 時間外労働: sayap kiri soal (gap ≥12px dari soal); tanpa ruang → atas kartu.
  let watchPos = null;
  if (rect && tech === 'jikangai' && !wrong) {
    if (stage && stage.qRect.x >= 90) {
      const size = 46;
      const cy = Math.max(
        stage.bounds.top + size / 2,
        Math.min(stage.bounds.bottom - size / 2, stage.qRect.y + stage.qRect.h / 2),
      );
      watchPos = { x: stage.qRect.x / 2 - size / 2, y: cy - size / 2, size };
    } else {
      const size = 42;
      watchPos = { x: rect.x + rect.w - size - 6, y: rect.y - size - 8, size };
    }
  }

  return (
    <motion.div
      data-nanami-burst
      data-nanami-tech={tech || 'wrong'}
      className="absolute inset-0"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
    >
      {wrong && <NanamiWrong reduced={reduced} />}
      {tech === 'kokusen' && !wrong && <KokusenDim reduced={reduced} />}
      {rect && tech && !wrong && (
        <>
          {/* dinding 瓦落瓦落 — di sekitar kartu (z-129, di bawah lapisan kartu) */}
          {tech === 'garagara' && <GaragaraWall seed={seed} reduced={reduced} rect={rect} />}

          {/* Lapisan KARTU: clip ke bentuk kartu → tidak ada elemen nyembur keluar */}
          <div
            className="fixed z-[130] pointer-events-none overflow-hidden"
            style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: 2 }}
          >
            {tech === 'shichisan' && <ShichisanCore seed={seed} reduced={reduced} rect={rect} />}
            {tech === 'oonata' && <OonataGash reduced={reduced} rect={rect} />}
            {tech === 'kokusen' && <KokusenCracks seed={seed} reduced={reduced} rect={rect} />}
          </div>

          {/* Lapisan TERBUKA: elemen yang boleh melintasi tepi kartu */}
          <div
            className="fixed z-[130] pointer-events-none"
            style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
          >
            {tech === 'shichisan' && <ShichisanSparks seed={seed} reduced={reduced} rect={rect} />}
            {tech === 'oonata' && (
              <>
                <OonataBlade reduced={reduced} rect={rect} />
                <JufuFlutter reduced={reduced} rect={rect} />
              </>
            )}
            {tech === 'garagara' && <GaragaraBurst seed={seed} reduced={reduced} rect={rect} />}
            {tech === 'kokusen' && <KokusenBurst seed={seed} reduced={reduced} rect={rect} />}
            {tech === 'jikangai' && (
              <>
                {watchPos && <JikangaiWatch reduced={reduced} pos={watchPos} />}
                <JikangaiTie reduced={reduced} rect={rect} />
                <JikangaiCollar reduced={reduced} rect={rect} />
                <JikangaiAura seed={seed} reduced={reduced} rect={rect} />
              </>
            )}
          </div>
        </>
      )}
      {/* Kanji: teknik di bawah (dekat kartu); salah 「残念ですが」 redup */}
      <TechKanji
        style={style || (wrong ? { kanji: '残念ですが', color: '#94a3b8' } : null)}
        reduced={reduced}
        delay={tech === 'kokusen' ? 0.3 : tech === 'garagara' ? 0.5 : tech === 'jikangai' ? 0.3 : tech === 'oonata' ? 0.4 : 0.24}
        anchor="bottom"
      />
    </motion.div>
  );
}

export default NanamiBurst;
