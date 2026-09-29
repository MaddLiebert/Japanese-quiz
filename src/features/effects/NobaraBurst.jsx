import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  NOBARA_STYLE, NOBARA_CORE, NOBARA_ORANGE, NOBARA_LIGHT, NOBARA_RED, NOBARA_DARK, NOBARA_STRAW,
  nobaraNails, nobaraBurst, nobaraSparks, nobaraCracks, nobaraStrawDoll,
} from './nobaraFx';

// ─────────────────────────────────────────────────────────────────────────────
// Nobara Kugisaki (visual 'nobara') — efek jawaban, 芻霊呪法 (すうれいじゅほう ·
// suurei juhou). Aturan main (spec Nobara.md, 🔒 FINAL):
//   • non-streak → 簪 (かんざし · kanzashi, 1 paku + ledakan) ↔ 簪・連 (かんざし・れん
//     · kanzashi-ren, 3 paku beruntun) — rotasi deterministik, bukan acak.
//   • 10 → 簪・時限 (かんざし・じげん · kanzashi-jigen, 5 paku tancap → jeda →
//     meledak serentak) · 20 → 共鳴り (ともなり · tomonari, boneka jerami 藁人形
//     (わらにんぎょう · waraningyou) + palu → riak resonansi) · 30+ → 黒閃
//     (こくせん · kokusen, layar dim → flash → burs besar).
//   • salah → burst PADAM (asap kelabu, bukan ledakan) + wash gelap.
// Identitas visual 釘と爆発 (くぎとばくはつ · kugi to bakuhatsu = paku & ledakan):
//   3 lapis tiap efek — core putih-panas (#fef3c7) → oranye (#f97316) → merah
//   (#dc2626). Bentuk: paku = GARIS (bukan titik), ledakan = burs BERGERIGI
//   (bukan lingkaran halus), retakan = bercabang & menirus, resonansi = riak
//   ELIPS (khas getaran).
// Anti-slop (dari plan, query ui-ux-pro-max):
//   • easing BEDA per peran: masuk back.out, keluar power2.in, retakan power1.out
//   • STAGGER: paku 70ms, ult 40ms, cut 80ms — bukan semua bareng
//   • partikel arah KONSISTEN (radial dari titik tancap), bukan random
//   • 1-2 elemen utama per view; retakan selalu punya AKHIR (tanpa loop)
// Aturan warisan Megumi v2.5: efek TIDAK boleh nutupin soal — burst muncul DI
// KARTU yang dipencet (anchor rect kartu, clip ke bentuknya), retakan kecil di
// dalam kartu, riak/veil di lapisan belakang (z-index di bawah konten kuis).
// reduced-motion → kanji & bentuk akhir tetap tampil (informasi kanon), gerakan
// /flash/shake disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Anchor: rect kartu jawaban yang dipencet (pola ClawTrap Megumi) ─────────
// Semua efek Nobara menempel di KARTU (bukan tepi layar) → tidak pernah
// menutupi karakter soal. Kartu ikut hentakan [data-nobara-hit] → recompute
// beberapa frame supaya efek tetap menempel.
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

// ── Kanji jurus — band bawah (pola Megumi/Yuji, konsisten JJK) ──────────────
function TechKanji({ style, reduced, delay = 0, size = 'clamp(30px, 7vmin, 58px)', anchor = 'bottom' }) {
  if (!style) return null;
  return (
    <motion.span
      data-nobara-kanji
      className="absolute font-serif font-black select-none pointer-events-none"
      style={{
        left: '50%',
        ...(anchor === 'top' ? { top: '20%' } : { bottom: '13%' }),
        x: '-50%',
        fontSize: size,
        color: style.color,
        WebkitTextStroke: `1px ${NOBARA_DARK}`,
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

// ── Burs bergerigi: polygon polygon (bukan lingkaran) + 3 lapis warna ───────
// size dalam px (skala dari kartu). SEMUA lapis deterministik dari nobaraBurst.
function BurstShape({ seed, size = 96, delay = 0, reduced, color = NOBARA_ORANGE, dark = NOBARA_RED }) {
  const [b] = useState(() => nobaraBurst(seed, 1));
  const R = size / 2;
  const pts = b.pts.map(([x, y]) => `${(x * (R / 26)).toFixed(1)},${(y * (R / 26)).toFixed(1)}`).join(' ');
  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ marginLeft: -R, marginTop: -R, width: size, height: size }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0.92], scale: [0.3, 1.14, 1, 1.02] }}
      transition={{ duration: reduced ? 0 : b.dur, delay: reduced ? 0 : delay, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* tepi merah (bentuk penuh) */}
      <svg viewBox={`${-R} ${-R} ${size} ${size}`} width={size} height={size} className="absolute inset-0 block">
        <polygon points={pts} fill={dark} opacity="0.92" />
      </svg>
      {/* badan oranye (72% skala) */}
      <svg viewBox={`${-R} ${-R} ${size} ${size}`} width={size} height={size}
        className="absolute inset-0 block" style={{ transform: 'scale(0.72)' }}>
        <polygon points={pts} fill={color} />
      </svg>
      {/* core putih-panas (34% skala) */}
      <svg viewBox={`${-R} ${-R} ${size} ${size}`} width={size} height={size}
        className="absolute inset-0 block" style={{ transform: 'scale(0.34)' }}>
        <polygon points={pts} fill={NOBARA_CORE} />
      </svg>
    </motion.div>
  );
}

// ── Paku melesat: GARIS tebal miring, dari luar kartu → tancap di dalam ─────
// Koordinat 0-100 relatif KARTU; clip ke bentuk kartu supaya tidak menyembur.
function NailStrike({ seed, i = 0, reduced, clipW, clipH }) {
  const [nails] = useState(() => nobaraNails(seed, 3));
  const n = nails[i % nails.length];
  const x0 = (n.x0 * clipW) / 100, y0 = (n.y0 * clipH) / 100;
  const x1 = (n.x1 * clipW) / 100, y1 = (n.y1 * clipH) / 100;
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <motion.div
      className="absolute origin-left"
      style={{ left: x0, top: y0, width: len, height: 3.5, rotate: ang, borderRadius: 2 }}
      initial={{ scaleX: 0, opacity: 0 }}
      animate={reduced ? { scaleX: 1, opacity: 1 } : { scaleX: [0, 1, 1], opacity: [0, 1, 1] }}
      transition={{ duration: reduced ? 0 : n.dur, delay: reduced ? 0 : n.delay, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* badan paku: gradasi logam gelap → oranye (panas) */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(90deg, ${NOBARA_DARK}, ${NOBARA_ORANGE} 68%, ${NOBARA_CORE})`,
        boxShadow: `0 0 8px ${NOBARA_ORANGE}aa`,
        borderRadius: 2,
      }} />
      {/* kepala paku (di ujung tancap) */}
      <div className="absolute right-[-3px] top-1/2 -translate-y-1/2" style={{
        width: 7, height: 7, borderRadius: 1.5,
        background: NOBARA_LIGHT, boxShadow: `0 0 10px ${NOBARA_ORANGE}`,
      }} />
    </motion.div>
  );
}

// ── Percikan radial: 8 arah KONSISTEN dari titik tancap (bukan random) ──────
function Sparks({ seed, reduced, delay = 0, scale = 1 }) {
  const [sparks] = useState(() => nobaraSparks(seed, 8));
  return (
    <>
      {sparks.map((s) => (
        <motion.div
          key={s.id}
          className="absolute left-1/2 top-1/2"
          style={{ width: 2.5 * scale, height: 2.5 * scale, marginLeft: -1.25 * scale, marginTop: -1.25 * scale }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={reduced ? { x: s.dx * scale * 0.6, y: s.dy * scale * 0.6, opacity: 0.85 }
            : { x: [0, s.dx * scale], y: [0, s.dy * scale], opacity: [0, 1, 0] }}
          transition={{ duration: reduced ? 0 : s.dur, delay: reduced ? 0 : delay + s.delay, ease: [0.55, 0, 1, 0.45] }}
        >
          <div className="w-full h-full rounded-full" style={{
            background: `linear-gradient(180deg, ${NOBARA_CORE}, ${NOBARA_ORANGE})`,
            boxShadow: `0 0 6px ${NOBARA_ORANGE}`,
          }} />
        </motion.div>
      ))}
    </>
  );
}

// ── Retakan: bercabang, menirus, sudut tajam (bukan glow blob) ──────────────
// Digambar sebagai SVG stroke polyline di dalam bentuk kartu (clip).
function CrackLines({ seed, count = 3, reduced, w, h, color = NOBARA_RED, delay = 0.1 }) {
  const [cracks] = useState(() => nobaraCracks(seed, count));
  const cx = w / 2, cy = h / 2;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 block" aria-hidden="true">
      {cracks.map((c) => {
        const rad = (c.ang * Math.PI) / 180;
        const x2 = cx + Math.cos(rad) * (c.len * w) / 100;
        const y2 = cy + Math.sin(rad) * (c.len * h) / 100;
        const mx = cx + Math.cos(rad) * (c.len * w) / 200;
        const my = cy + Math.sin(rad) * (c.len * h) / 200;
        // cabang dari tengah retakan utama
        const branches = c.branch.map((b) => {
          const br = (b.ang * Math.PI) / 180;
          return {
            x: mx + Math.cos(br) * (b.len * w) / 100,
            y: my + Math.sin(br) * (b.len * h) / 100,
          };
        });
        return (
          <g key={c.id}>
            <motion.path
              d={`M${cx},${cy} Q${mx + (y2 - cy) * 0.12},${my - (x2 - cx) * 0.12} ${x2},${y2}`}
              fill="none" stroke={color} strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={reduced ? { pathLength: 1, opacity: 0.9 } : { pathLength: [0, 1, 1], opacity: [0, 0.95, 0.72] }}
              transition={{ duration: reduced ? 0 : c.dur, delay: reduced ? 0 : delay + c.delay, ease: [0.22, 1, 0.36, 1] }}
              strokeWidth={Math.max(1, c.w0 * (h / 100))}
            />
            {branches.map((b, j) => (
              <motion.path
                key={`${c.id}-b${j}`}
                d={`M${mx},${my} L${b.x},${b.y}`}
                fill="none" stroke={color} strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={reduced ? { pathLength: 1, opacity: 0.7 } : { pathLength: [0, 1], opacity: [0, 0.8] }}
                transition={{ duration: reduced ? 0 : c.dur * 0.7, delay: reduced ? 0 : delay + c.delay + 0.06, ease: [0.22, 1, 0.36, 1] }}
                strokeWidth={Math.max(0.8, c.w1 * (h / 100))}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ── Paku tertancap getar (簪・時限: tancap dulu, jeda, baru meledak) ─────────
function NailsStuck({ seed, count = 5, reduced }) {
  const [nails] = useState(() => nobaraNails(seed, count));
  return (
    <>
      {nails.map((n, i) => (
        <motion.div
          key={n.id}
          className="absolute left-1/2 top-1/2"
          style={{ width: 4, height: 4, marginLeft: -2, marginTop: -2, borderRadius: 2 }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={reduced ? { x: n.x1 * 2, y: n.y1 * 2, opacity: 1 }
            : { x: n.x1 * 2, y: n.y1 * 2, opacity: 1, rotate: [0, -6, 6, -3, 0] }}
          transition={{
            duration: reduced ? 0 : 0.3,
            delay: reduced ? 0 : i * 0.12,
            rotate: { duration: 0.34, delay: 0.42 + i * 0.1, ease: 'easeInOut' },
          }}
        >
          <div className="w-full h-full" style={{
            background: NOBARA_LIGHT,
            boxShadow: `0 0 8px ${NOBARA_ORANGE}, 0 0 16px ${NOBARA_ORANGE}77`,
            transform: 'rotate(-38deg) scaleY(3)',
          }} />
        </motion.div>
      ))}
    </>
  );
}

// ── 簪 (kanzashi): 1 paku + burs kecil + retakan pendek ─────────────────────
function Kanzashi({ seed, reduced, rect }) {
  const size = Math.max(72, Math.min(rect.w, rect.h) * 1.15);
  return (
    <>
      <NailStrike seed={seed} i={0} reduced={reduced} clipW={rect.w} clipH={rect.h} />
      <BurstShape seed={seed} size={size} delay={0.14} reduced={reduced} />
      <Sparks seed={seed} reduced={reduced} delay={0.16} scale={Math.min(rect.w, rect.h) / 70} />
      <CrackLines seed={seed} count={2} reduced={reduced} w={rect.w} h={rect.h} delay={0.18} />
    </>
  );
}

// ── 簪・連 (kanzashi-ren): 3 paku stagger 70ms, burs menyusul ───────────────
function KanzashiRen({ seed, reduced, rect }) {
  const size = Math.max(58, Math.min(rect.w, rect.h) * 0.86);
  return (
    <>
      {[0, 1, 2].map((i) => (
        <NailStrike key={i} seed={seed + i} i={i} reduced={reduced} clipW={rect.w} clipH={rect.h} />
      ))}
      {[0, 1, 2].map((i) => (
        <BurstShape key={`b${i}`} seed={seed + i + 10} size={size * (1 - i * 0.12)}
          delay={0.16 + i * 0.09} reduced={reduced} />
      ))}
      <CrackLines seed={seed} count={3} reduced={reduced} w={rect.w} h={rect.h} delay={0.24} />
    </>
  );
}

// ── 簪・時限 (kanzashi-jigen): 5 paku TANCAP dulu → jeda → meledak serentak ─
function KanzashiJigen({ seed, reduced, rect }) {
  const size = Math.max(84, Math.min(rect.w, rect.h) * 1.3);
  return (
    <>
      <NailsStuck seed={seed} count={5} reduced={reduced} />
      {/* jeda "tuk" 420ms lalu SEMUA meledak serentak */}
      <BurstShape seed={seed + 30} size={size} delay={0.52} reduced={reduced} />
      <BurstShape seed={seed + 31} size={size * 0.7} delay={0.56} reduced={reduced}
        color={NOBARA_LIGHT} dark={NOBARA_ORANGE} />
      <Sparks seed={seed + 32} reduced={reduced} delay={0.55} scale={Math.min(rect.w, rect.h) / 60} />
      <CrackLines seed={seed + 33} count={4} reduced={reduced} w={rect.w} h={rect.h} delay={0.58} />
    </>
  );
}

// ── 共鳴り (tomonari): boneka jerami + palu → riak resonansi elips ──────────
function Tomonari({ seed, reduced, rect }) {
  const [doll] = useState(() => nobaraStrawDoll(seed));
  const size = Math.max(80, Math.min(rect.w, rect.h) * 1.2);
  const dollW = Math.max(46, Math.min(72, rect.w * 0.32));
  const dollH = dollW * 1.5;
  return (
    <>
      {/* boneka jerami di SAYAP KIRI kartu (rapat ke kartu, bukan tepi layar) */}
      <motion.div
        data-nobara-doll
        className="absolute pointer-events-none"
        style={{ left: -dollW - 10, top: '50%', marginTop: -dollH / 2, width: dollW, height: dollH, rotate: doll.tilt }}
        initial={{ opacity: 0, x: -14, scale: 0.86 }}
        animate={reduced ? { opacity: 0.95, x: 0, scale: 1 } : { opacity: [0, 1, 1, 0.9], x: [-14, 0, 0, 0], scale: [0.86, 1, 1, 1] }}
        transition={{ duration: reduced ? 0 : 0.42, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <svg viewBox="0 0 40 60" width="100%" height="100%" className="block" aria-hidden="true">
          {/* badan jerami: helai-helai */}
          {Array.from({ length: doll.strands }).map((_, i) => (
            <line key={i} x1={20 + (i - 2) * 2} y1={22} x2={20 + (i - 2) * 3.4} y2={54}
              stroke={NOBARA_STRAW} strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
          ))}
          {/* tali ikat */}
          <rect x="13" y="33" width="14" height="2.4" fill={NOBARA_RED} opacity="0.85" />
          <rect x="14" y="42" width="12" height="2.2" fill={NOBARA_RED} opacity="0.7" />
          {/* kepala */}
          <circle cx="20" cy="14" r="9" fill={NOBARA_STRAW} />
          <circle cx="20" cy="14" r="9" fill="none" stroke={NOBARA_RED} strokeWidth="1.4" opacity="0.8" />
          {/* paku nempel di dada boneka (kanon: bagian target) */}
          <line x1="20" y1="20" x2="20" y2="30" stroke={NOBARA_ORANGE} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </motion.div>

      {/* palu naik → HANTAM (delay 0.35s) */}
      <motion.div
        className="absolute left-1/2 top-1/2 pointer-events-none"
        style={{ width: 34, height: 34, marginLeft: -17, marginTop: -17 }}
        initial={{ x: 30, y: -40, rotate: 40, opacity: 0 }}
        animate={reduced ? { x: 6, y: -6, rotate: 0, opacity: 1 }
          : { x: [30, 8, 6], y: [-40, -10, -6], rotate: [40, 8, 0], opacity: [0, 1, 1] }}
        transition={{ duration: 0.42, delay: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <svg viewBox="0 0 34 34" width="34" height="34" aria-hidden="true">
          <rect x="4" y="4" width="26" height="12" rx="2" fill={NOBARA_DARK} stroke={NOBARA_ORANGE} strokeWidth="1.6" />
          <rect x="14.6" y="14" width="4.8" height="18" rx="1.6" fill={NOBARA_STRAW} />
        </svg>
      </motion.div>

      {/* riak resonansi: ELIPS membesar (khas getaran) + burs kecil */}
      <BurstShape seed={seed + 40} size={size * 0.8} delay={0.5} reduced={reduced} />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`rp${i}`}
          className="absolute left-1/2 top-1/2"
          style={{
            width: 10, height: 10, marginLeft: -5, marginTop: -5,
            border: `2px solid ${i === 1 ? NOBARA_RED : NOBARA_ORANGE}`,
            borderRadius: '50%',
          }}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={reduced ? { scale: 4 + i * 2, opacity: 0.6 }
            : { scale: [0.4, 4 + i * 2.4], opacity: [0, 0.85, 0] }}
          transition={{ duration: reduced ? 0 : 0.6 + i * 0.14, delay: reduced ? 0 : 0.52 + i * 0.13, ease: [0.22, 1, 0.36, 1] }}
          // elips: skala Y lebih kecil (getaran, bukan lingkaran penuh)
        >
          <div className="w-full h-full rounded-full" style={{ transform: 'scaleY(0.55)', border: 'inherit' }} />
        </motion.div>
      ))}
      <CrackLines seed={seed + 41} count={3} reduced={reduced} w={rect.w} h={rect.h} delay={0.56} />
    </>
  );
}

// ── 黒閃 (kokusen): layar dim → flash → burs BESAR + shake ──────────────────
function Kokusen({ seed, reduced, rect }) {
  const size = Math.max(120, Math.min(rect.w, rect.h) * 1.75);
  return (
    <>
      {/* layar dim 120ms (1 frame) */}
      {!reduced && (
        <motion.div
          className="fixed inset-0 z-[129] pointer-events-none"
          style={{ background: 'rgba(2,6,23,0.72)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.24, times: [0, 0.4, 1], ease: 'linear' }}
        />
      )}
      {/* flash putih 1 frame (core) */}
      {!reduced && (
        <motion.div
          className="fixed inset-0 z-[131] pointer-events-none"
          style={{ background: '#fff' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0] }}
          transition={{ duration: 0.14, delay: 0.14, ease: 'linear' }}
        />
      )}
      <BurstShape seed={seed + 50} size={size} delay={0.18} reduced={reduced} />
      <BurstShape seed={seed + 51} size={size * 0.62} delay={0.2} reduced={reduced}
        color={NOBARA_CORE} dark={NOBARA_LIGHT} />
      <Sparks seed={seed + 52} reduced={reduced} delay={0.2} scale={Math.min(rect.w, rect.h) / 48} />
      <CrackLines seed={seed + 53} count={4} reduced={reduced} w={rect.w} h={rect.h}
        color={NOBARA_DARK} delay={0.22} />
      <CrackLines seed={seed + 54} count={3} reduced={reduced} w={rect.w} h={rect.h} delay={0.26} />
    </>
  );
}

// ── Salah: burst PADAM (asap kelabu, bukan ledakan) + wash gelap ────────────
function NobaraWrong({ reduced }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 104% at 50% 50%, transparent 0%, transparent 48%, rgba(15,23,42,0.42) 76%, rgba(2,6,23,0.78) 100%)' }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.55 } : { opacity: [0, 0.95, 0.8] }}
        transition={{ duration: reduced ? 0 : 0.34, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── Dispatcher ───────────────────────────────────────────────────────────────
export function NobaraBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const tech = fx?.tech;
  const seed = fx?.seed || 1;
  const style = tech ? NOBARA_STYLE[tech] : null;
  const wrong = kind === 'wrong';
  // Rect kartu yang dipencet — semua jurus menempel DI KARTU (aturan Megumi v2.5).
  const rect = usePickedRect(!wrong, 900);

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
    >
      {wrong && <NobaraWrong reduced={reduced} />}
      {rect && tech && !wrong && (
        // Layer DI KARTU: clip ke bentuk kartu → tidak ada elemen nyembur keluar.
        <div
          className="fixed z-[130] pointer-events-none overflow-hidden"
          style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: 2 }}
        >
          {tech === 'kanzashi' && <Kanzashi seed={seed} reduced={reduced} rect={rect} />}
          {tech === 'ren' && <KanzashiRen seed={seed} reduced={reduced} rect={rect} />}
          {tech === 'jigen' && <KanzashiJigen seed={seed} reduced={reduced} rect={rect} />}
          {tech === 'tomonari' && <Tomonari seed={seed} reduced={reduced} rect={rect} />}
          {tech === 'kokusen' && <Kokusen seed={seed} reduced={reduced} rect={rect} />}
        </div>
      )}
      {/* Kanji: teknik di bawah (dekat kartu), salah di bawah juga */}
      <TechKanji
        style={style || (wrong ? { kanji: '外したわ', color: '#94a3b8' } : null)}
        reduced={reduced}
        delay={tech === 'kokusen' ? 0.3 : tech === 'jigen' ? 0.62 : tech === 'tomonari' ? 0.66 : 0.22}
        anchor="bottom"
      />
    </motion.div>
  );
}

export default NobaraBurst;
