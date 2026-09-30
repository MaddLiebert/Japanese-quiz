import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  TOJI_STYLE, TOJI_FLASH, TOJI_STEEL, TOJI_GUNMETAL, TOJI_VOID, TOJI_BLOOD, TOJI_WORM,
  TOJI_STAGGER, tojiBlade, tojiChain, tojiSoulSplit, tojiWorm,
} from './tojiFx';

// ─────────────────────────────────────────────────────────────────────────────
// Toji Fushiguro (visual 'toji') — efek jawaban, 天与呪縛・術師殺し (てんよじゅばく・
// じゅつしごろし · Tenyo Jubaku · Jutsushi Goroshi). Aturan main (spec Toji.md, 🔒 FINAL):
//   • non-streak → 釈魂刀 (しゃっこんとう · shakkontou, kilau bilah diagonal →
//     flash putih 1 frame → opsi terbelah 2 soul-cut) ↔ 万里ノ鎖 (ばんりのくさり ·
//     banri no kusari, rantai dari luar layar → nyangkut → diseret keluar) — rotasi deterministik.
//   • 10 → 天逆鉾 (あまのさかほこ · amanosakahoko, belati tusuk → gelombang
//     pembatalan desaturasi → bilah ditarik + pecahan)
//     · 20 → 遊雲 (ゆううん · yuuyun, tongkat 3 ruas menyapu grid → shockwave + debu)
//     · 30+ → 武器庫呪霊 (ぶきこじゅれい · bukiko jurei, 呪霊 ulat → muntahkan senjata → hantam tombol).
//   • salah → wash hitam-merah redup + kanji 「化け物が」 (klip kalah utama).
// Identitas visual 冷たい鋼 (つめたいはがね · tsumetai hagane = baja dingin):
//   TIDAK ADA GLOW 呪力 (じゅりょくゼロ) — semua efek FISIK: kilau bilah, rantai,
//   debu, darah. Beda dari 6 pack lain yang bercahaya. 3 lapis tiap efek:
//   core putih #FFFFFF (flash 1 frame) → body baja #CBD5E1 → edge gunmetal #3F3F46;
//   武器庫呪霊 = satu-satunya elemen "kutukan" (ungu gelap #5B21B6).
// Anti-slop (dari plan + spec, query ui-ux-pro-max):
//   • easing BEDA per peran: line power2.out (bilah presisi), impact back.out
//     (overshoot kecil = "kena"), exit power2.in, reveal expo.out (stagger rail)
//   • STAGGER bilah 0 → flash 100ms → belah 180ms → percikan 260ms → debu 340ms
//   • rantai = rantai NYATA (links mengecil ke ujung) yang MENYERET, bukan partikel
// Aturan warisan Megumi v2.5: efek TIDAK boleh nutupin soal — burst menempel DI
// KARTU yang dipencet (anchor rect kartu, clip ke bentuknya); bilah/rantai boleh
// melintasi tepi kartu tapi tidak menutupi karakter soal (stage anchor, gap ≥12px).
// reduced-motion → bentuk & kanji akhir tetap tampil (informasi kanon), gerakan/
// flash/shake disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Easing per peran (TOJI_MOTION di tojiFx — token gsap ui-ux-pro-max).
const EASE_LINE = [0.33, 1, 0.68, 1];      // power2.out — bilah presisi
const EASE_IMPACT = [0.34, 1.56, 0.64, 1]; // back.out — impact "kena"
const EASE_EXIT = [0.55, 0, 1, 0.45];      // power2.in — keluar cepat
const EASE_REVEAL = [0.16, 1, 0.3, 1];     // expo.out — reveal

// ── Anchor: rect kartu jawaban yang dipencet (pola Nobara/Megumi/Nanami) ────
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
    const t = setTimeout(measure, 150);
    return () => { window.removeEventListener('resize', measure); clearTimeout(t); };
  }, []);
  return m;
}

// ── Kanji jurus — band bawah (pola Megumi/Yuji/Nobara/Nanami, konsisten JJK) ─
// 冷たい鋼: TANPA glow 呪力 — hard text (stroke gunmetal + bayangan padat),
// bukan neon. Salah 「化け物が」 = merah darah redup.
function TechKanji({ style, reduced, delay = 0, size = 'clamp(30px, 7vmin, 58px)', anchor = 'bottom' }) {
  if (!style) return null;
  return (
    <motion.span
      data-toji-kanji
      className="absolute font-serif font-black select-none pointer-events-none"
      style={{
        left: '50%',
        ...(anchor === 'top' ? { top: '20%' } : { bottom: '13%' }),
        x: '-50%',
        fontSize: size,
        color: style.color,
        WebkitTextStroke: `1px ${TOJI_VOID}`,
        textShadow: `0 2px 0 ${TOJI_VOID}, 0 0 10px rgba(12,12,12,0.8)`,
        willChange: 'transform, opacity',
      }}
      initial={{ opacity: 0, scale: 0.72 }}
      animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0.94], scale: [0.72, 1.1, 1, 1.01] }}
      transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : delay, ease: 'easeOut' }}
    >
      {style.kanji}
    </motion.span>
  );
}

// ── 釈魂刀 (shakkontou): kilau bilah diagonal → flash 1 frame → belahan jiwa ─
// Bilah melintang naik dari luar kiri ke luar kanan (BLADE di tojiFx, ≈26,57°).
// Glints BERJALAN di bilah (3 titik, stagger) — baja menangkap cahaya, bukan
// glow. Menebas 魂 (たましい · jiwa) → belahan putih baja + tepi hitam.
function ShakkontouBlade({ seed, reduced, rect }) {
  const [blade] = useState(() => tojiBlade(seed));
  const w = Math.max(160, rect.w * 1.3);
  const h = w * 0.36;
  return (
    <motion.div
      data-toji-blade
      className="absolute"
      style={{ left: -w * 0.3, top: rect.h * 0.5 - h / 2, width: w, height: h, transform: `rotate(${-blade.angle * 0.35}deg)` }}
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={reduced ? { x: w * 0.55, opacity: 0.95 } : { x: [0, w * 0.62], opacity: [0, 1, 1, 0.9] }}
      transition={{ duration: reduced ? 0 : blade.dur, ease: EASE_LINE }}
    >
      <svg viewBox="0 0 130 44" width="100%" height="100%" className="block" aria-hidden="true">
        {/* bilah baja menipis ke ujung (w0 2.6 → w1 0.6) */}
        <path d="M4,20 L116,8 L128,22 L14,38 Z" fill={TOJI_STEEL} stroke={TOJI_GUNMETAL} strokeWidth="1.6" />
        <path d="M4,20 L116,8" fill="none" stroke={TOJI_FLASH} strokeWidth="1.4" opacity="0.85" />
        <path d="M8,24 L120,14" fill="none" stroke={TOJI_GUNMETAL} strokeWidth="2" opacity="0.7" />
        {/* gagang hitam + 鍔 (つば tsuba) */}
        <rect x="-4" y="18" width="18" height="8" rx="1.5" fill={TOJI_VOID} stroke={TOJI_GUNMETAL} strokeWidth="1" />
        <rect x="12" y="14" width="5" height="16" rx="1" fill={TOJI_GUNMETAL} />
      </svg>
      {/* glints berjalan di bilah (deterministik dari tojiBlade) */}
      {blade.glints.map((g) => (
        <motion.span
          key={g.id}
          className="absolute rounded-full"
          style={{
            left: `${g.at * 78 + 6}%`, top: '42%', width: g.size, height: g.size,
            background: TOJI_FLASH, boxShadow: `0 0 ${g.size * 2}px ${TOJI_FLASH}cc`,
          }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={reduced ? { opacity: 0.9, scale: 1 } : { opacity: [0, 1, 0], scale: [0.4, 1.25, 0.6] }}
          transition={reduced ? { duration: 0 } : { duration: 0.16, delay: g.delay, ease: EASE_LINE }}
        />
      ))}
    </motion.div>
  );
}

// Flash putih 1 frame (≤80ms) + belahan jiwa: opsi terbelah 2, belahan putih
// baja + tepi hitam, meluncur misah + TEPAT 2 percikan (spec). Clip ke kartu.
function SoulSplit({ seed, reduced }) {
  const [split] = useState(() => tojiSoulSplit(seed));
  return (
    <>
      {/* flash putih 1 frame — core impact (bukan glow, sinar kilat bilah) */}
      {!reduced && (
        <motion.div
          data-toji-flash
          className="absolute inset-0"
          style={{ background: TOJI_FLASH }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0] }}
          transition={{ duration: split.dur * 0.35, delay: TOJI_STAGGER.flash, ease: 'linear' }}
        />
      )}
      {/* belahan jiwa: 2 separuh kartu meluncur misah sepanjang sudut bilah */}
      {[1, -1].map((dir) => (
        <motion.div
          key={dir}
          data-toji-split
          className="absolute"
          style={{
            left: 0, right: 0, top: '50%', height: '58%',
            transformOrigin: '50% 0%',
            background: `linear-gradient(${dir > 0 ? '180deg' : '0deg'}, rgba(203,213,225,0.28), rgba(12,12,12,0.22))`,
            borderTop: dir > 0 ? `2.2px solid ${TOJI_FLASH}` : 'none',
            borderBottom: dir < 0 ? `2.2px solid ${TOJI_FLASH}` : 'none',
            boxShadow: dir > 0 ? `0 -1.4px 0 ${TOJI_GUNMETAL}` : `0 1.4px 0 ${TOJI_GUNMETAL}`,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={reduced
            ? { y: dir * split.slide * 0.4, opacity: 0.9 }
            : { y: dir * split.slide, opacity: [0, 0.95, 0.85] }}
          transition={{ duration: reduced ? 0 : 0.24, delay: reduced ? 0 : TOJI_STAGGER.split, ease: EASE_LINE }}
        />
      ))}
      {/* TEPAT 2 percikan baja (spec) — dari garis belahan */}
      {split.sparks.map((s) => (
        <motion.span
          key={s.id}
          className="absolute"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
          animate={reduced
            ? { x: Math.cos((s.ang * Math.PI) / 180) * 14, y: Math.sin((s.ang * Math.PI) / 180) * 14, opacity: 0.85, rotate: 40 }
            : {
              x: [0, Math.cos((s.ang * Math.PI) / 180) * 34],
              y: [0, Math.sin((s.ang * Math.PI) / 180) * 34 + 10],
              opacity: [0, 1, 0], rotate: [0, 120],
            }}
          transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : TOJI_STAGGER.spark, ease: EASE_EXIT }}
        >
          <span className="block w-full h-full" style={{ background: TOJI_FLASH, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
        </motion.span>
      ))}
    </>
  );
}

// ── 万里ノ鎖 (banri no kusari): rantai dari luar layar → nyangkut di opsi →
// DISERET keluar + debu + goresan lantai. Rantai NYATA: links (7) mengecil ke
// ujung; ujung jauh "dimakan" 武器庫呪霊 → memanjang tak terbatas (kanon ch.75).
function BanriChain({ seed, reduced, rect }) {
  const [chain] = useState(() => tojiChain(seed));
  const w = Math.max(190, rect.w * 1.6);
  const h = Math.max(120, rect.h * 1.1);
  const px = (v) => (v / 100) * w;
  const py = (v) => (v / 100) * h;
  return (
    <>
      {/* rantai: masuk dari kanan → nyangkut di tengah → diseret keluar kiri */}
      <motion.div
        data-toji-chain
        className="absolute"
        style={{ left: -w * 0.32, top: -h * 0.2, width: w, height: h }}
        initial={{ x: 0, y: 0, opacity: 0 }}
        animate={reduced
          ? { x: 0, y: 0, opacity: 0.9 }
          : { x: [0, 0, -w * 0.5], y: [0, 0, h * 0.06], opacity: [0, 1, 1, 0] }}
        transition={{ duration: reduced ? 0 : chain.dur, times: [0, 0.36, 0.62, 1], ease: [EASE_IMPACT[0], EASE_IMPACT[1], EASE_IMPACT[2], EASE_IMPACT[3]] }}
      >
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" className="block" aria-hidden="true">
          {/* rantai: links mengecil ke ujung (hook) */}
          {chain.links.map((lk) => (
            <rect
              key={lk.id}
              x={px(lk.x) - lk.size / 2} y={py(lk.y) - lk.size * 0.62}
              width={lk.size} height={lk.size * 1.24} rx={lk.size * 0.42}
              fill="none" stroke={TOJI_GUNMETAL} strokeWidth={Math.max(1.4, lk.size * 0.28)}
              transform={`rotate(${lk.rot} ${px(lk.x)} ${py(lk.y)})`}
            />
          ))}
          {/* bilah kait di ujung rantai (nyangkut di opsi) */}
          <path
            d={`M${px(chain.hook.x)},${py(chain.hook.y)} l-10,-12 l3,-2 l9,11 z`}
            fill={TOJI_STEEL} stroke={TOJI_GUNMETAL} strokeWidth="1"
          />
        </svg>
      </motion.div>
      {/* debu + goresan lantai saat diseret */}
      {!reduced && (
        <>
          {chain.dust.map((d) => (
            <motion.span
              key={d.id}
              className="absolute rounded-full"
              style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size * 0.7, background: 'rgba(148,163,184,0.55)' }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0.4, 2.2, 2.8] }}
              transition={{ duration: 0.4, delay: 0.3 + d.delay, ease: EASE_EXIT }}
            />
          ))}
          {chain.scratches.map((s) => (
            <motion.span
              key={s.id}
              className="absolute"
              style={{ left: '4%', top: `${s.y}%`, height: 1.6, background: TOJI_GUNMETAL, opacity: 0.75 }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${s.len}%`, opacity: [0, 0.8, 0.5] }}
              transition={{ duration: 0.26, delay: 0.32 + s.delay, ease: EASE_LINE }}
            />
          ))}
        </>
      )}
    </>
  );
}

// ── 天逆鉾 (amanosakahoko) @10: belati ditusukkan ke KARTU SOAL → gelombang
// "pembatalan" (kartu desaturasi 0,4 dtk = jurus dimatikan) → bilah ditarik +
// pecahan. Ini satu-satunya efek yang menyasar KARTU SOAL (kanon: membatalkan
// 無下限呪術 Gojo) — tetap di dalam bentuk kartu, tidak menutupi karakter soal.
function Amanosakahoko({ reduced, rect, stage }) {
  // Kartu soal: sayap kiri (gap ≥12px dari soal); tanpa ruang → atas kartu opsi.
  let pos = null;
  if (stage && stage.qRect.x >= 90) {
    const size = Math.max(54, stage.qRect.h * 0.5);
    const cy = Math.max(
      stage.bounds.top + size / 2,
      Math.min(stage.bounds.bottom - size / 2, stage.qRect.y + stage.qRect.h / 2),
    );
    pos = { x: stage.qRect.x / 2 - size / 2, y: cy - size / 2, size, anchor: 'wing' };
  } else {
    const size = Math.max(44, rect.w * 0.3);
    pos = { x: rect.w * 0.5 - size / 2, y: -size * 0.72, size, anchor: 'top' };
  }
  return (
    <>
      {/* gelombang pembatalan: kartu opsi mendesaturasi 0,4 dtk */}
      {!reduced && (
        <motion.div
          data-toji-cancel
          className="absolute inset-0"
          style={{ backdropFilter: 'saturate(0.15) contrast(1.04)', background: 'rgba(12,12,12,0.16)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.4, delay: 0.12, ease: 'linear' }}
        />
      )}
      {/* belati 天逆鉾: tusuk ke bawah → tahan → tarik + pecahan */}
      <motion.div
        data-toji-spear
        className="fixed z-[131] pointer-events-none"
        style={{ left: pos.x, top: pos.y, width: pos.size, height: pos.size }}
        initial={{ opacity: 0, y: -pos.size * 0.6, rotate: -6 }}
        animate={reduced
          ? { opacity: 0.95, y: 0, rotate: 0 }
          : { opacity: [0, 1, 1, 0.9], y: [-pos.size * 0.6, 0, 0, pos.size * 0.28], rotate: [-6, 2, 0, 8] }}
        transition={reduced ? { duration: 0 } : { duration: 0.42, times: [0, 0.3, 0.62, 1], ease: EASE_IMPACT }}
      >
        <svg viewBox="0 0 60 60" width={pos.size} height={pos.size} className="block" aria-hidden="true">
          {/* belati 特級: mata ganda (kanon 天逆鉾) + bilah pendek lebar */}
          <path d="M30,4 L36,18 L33,40 L27,40 L24,18 Z" fill={TOJI_STEEL} stroke={TOJI_GUNMETAL} strokeWidth="1.4" />
          <path d="M30,4 L33,16 L30,40 L27,16 Z" fill={TOJI_FLASH} opacity="0.5" />
          <path d="M20,16 L30,8 L40,16 L36,20 L30,15 L24,20 Z" fill={TOJI_GUNMETAL} />
          <rect x="28" y="40" width="4" height="14" fill={TOJI_VOID} stroke={TOJI_GUNMETAL} strokeWidth="1" />
          {/* pecahan saat ditarik */}
        </svg>
      </motion.div>
      {/* pecahan bilah (3 serpihan) saat ditarik */}
      {!reduced && [0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ left: `${38 + i * 12}%`, top: '40%', width: 4, height: 7, background: TOJI_STEEL, opacity: 0.9 }}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
          animate={{ x: (i - 1) * 22, y: 26 + i * 8, opacity: [0, 1, 0], rotate: (i - 1) * 140 }}
          transition={{ duration: 0.3, delay: 0.34 + i * 0.04, ease: EASE_EXIT }}
        />
      ))}
    </>
  );
}

// ── 遊雲 (yuuyun) @20: tongkat 3 ruas (三節棍) berputar menyapu SELURUH grid
// opsi (arc baja lebar) → shockwave dorong + debu + tepi retak. Sapuan lewat
// ATAS grid — tidak menutupi soal (band aman stage anchor).
function YuuyunSweep({ reduced, rect }) {
  const spanW = Math.max(rect.w * 2.4, 320);
  const barY = rect.h * 0.5;
  return (
    <>
      {/* tongkat 3 ruas menyapu horizontal (rotasi penuh di ujung) */}
      <motion.div
        data-toji-staff
        className="absolute"
        style={{ left: -spanW, top: barY - 9, width: spanW, height: 18 }}
        initial={{ x: 0, opacity: 0 }}
        animate={reduced
          ? { x: rect.w * 1.1, opacity: 0.95 }
          : { x: [0, rect.w * 1.15], opacity: [0, 1, 1, 0.9] }}
        transition={{ duration: reduced ? 0 : 0.34, ease: EASE_LINE }}
      >
        <svg viewBox="0 0 200 20" width="100%" height="100%" className="block" aria-hidden="true" preserveAspectRatio="none">
          {/* 3 ruas baja + engsel hitam (三節棍) */}
          <rect x="2" y="6" width="62" height="8" rx="2" fill={TOJI_STEEL} stroke={TOJI_GUNMETAL} strokeWidth="1.2" />
          <rect x="70" y="6" width="58" height="8" rx="2" fill={TOJI_STEEL} stroke={TOJI_GUNMETAL} strokeWidth="1.2" />
          <rect x="134" y="6" width="62" height="8" rx="2" fill={TOJI_STEEL} stroke={TOJI_GUNMETAL} strokeWidth="1.2" />
          <circle cx="67" cy="10" r="3.4" fill={TOJI_VOID} stroke={TOJI_GUNMETAL} strokeWidth="1" />
          <circle cx="131" cy="10" r="3.4" fill={TOJI_VOID} stroke={TOJI_GUNMETAL} strokeWidth="1" />
          <line x1="6" y1="8" x2="62" y2="8" stroke={TOJI_FLASH} strokeWidth="1" opacity="0.6" />
        </svg>
        {/* ujung tongkat berputar (arc) — motion streak baja, bukan partikel */}
        <motion.span
          className="absolute rounded-full"
          style={{ right: -4, top: 3, width: 12, height: 12, border: `2px solid ${TOJI_STEEL}`, borderTopColor: 'transparent', borderLeftColor: 'transparent' }}
          initial={{ rotate: 0 }}
          animate={reduced ? { rotate: 180 } : { rotate: 540 }}
          transition={reduced ? { duration: 0 } : { duration: 0.34, ease: 'linear' }}
        />
      </motion.div>
      {/* shockwave dorong (ring baja) + debu */}
      {!reduced && (
        <>
          <motion.div
            data-toji-shock
            className="absolute rounded-full"
            style={{ left: rect.w * 0.5, top: rect.h * 0.5, width: 26, height: 26, marginLeft: -13, marginTop: -13, border: `2.4px solid ${TOJI_STEEL}` }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 0.85, 0], scale: [0.3, 3.4, 4] }}
            transition={{ duration: 0.4, delay: 0.16, ease: EASE_EXIT }}
          />
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{ left: `${20 + i * 30}%`, top: '66%', width: 14, height: 9, background: 'rgba(148,163,184,0.5)' }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.55, 0], scale: [0.5, 2.4, 2.9] }}
              transition={{ duration: 0.44, delay: 0.24 + i * 0.06, ease: EASE_EXIT }}
            />
          ))}
        </>
      )}
    </>
  );
}

// ── 武器庫呪霊 (bukiko jurei) @30: 呪霊 ulat melintas di atas kartu →
// memuntahkan senjata (rotasi deterministik 大鉈→槍→刀→銃) → hantam tombol +
// bayangan (影). Satu-satunya elemen "kutukan" (ungu gelap #5B21B6).
function BukikoJurei({ seed, reduced, rect, stage }) {
  const [worm] = useState(() => tojiWorm(seed, 8));
  // Posisi: atas kartu opsi (dalam band aman); sayap sempit → tetap di atas kartu.
  const top = stage ? Math.max(stage.bounds.top - 4, rect.y - 88) : rect.y - 88;
  const w = Math.max(220, rect.w * 1.5);
  const h = 92;
  const px = (v) => (v / 100) * w;
  const py = (v) => (v / 100) * h;
  return (
    <>
      <motion.div
        data-toji-worm
        className="fixed z-[130] pointer-events-none"
        style={{ left: rect.x + rect.w / 2 - w / 2, top, width: w, height: h }}
        initial={{ opacity: 0, x: -w * 0.4 }}
        animate={reduced
          ? { opacity: 0.95, x: 0 }
          : { opacity: [0, 1, 1, 1], x: [-w * 0.4, 0, 0, w * 0.16] }}
        transition={reduced ? { duration: 0 } : { duration: 0.72, times: [0, 0.3, 0.78, 1], ease: EASE_REVEAL }}
      >
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block" aria-hidden="true">
          {/* segmen badan (gelombang, kepala terbesar) */}
          {worm.segments.map((sg, i) => (
            <circle
              key={sg.id}
              cx={px(sg.x)} cy={py(sg.y)} r={sg.size}
              fill={i === 0 ? TOJI_WORM : `rgba(91,33,182,${0.82 - i * 0.07})`}
              stroke={TOJI_VOID} strokeWidth="1.2"
            />
          ))}
          {/* mulut menganga (kepala) — bukaan hitam */}
          <ellipse cx={px(worm.head.x) + worm.head.r * 0.55} cy={py(worm.head.y)} rx={worm.head.r * 0.62} ry={worm.head.r * 0.72} fill={TOJI_VOID} />
          <ellipse cx={px(worm.head.x) + worm.head.r * 0.55} cy={py(worm.head.y)} rx={worm.head.r * 0.62} ry={worm.head.r * 0.72} fill="none" stroke={TOJI_BLOOD} strokeWidth="1.4" opacity="0.8" />
          {/* mata kecil */}
          <circle cx={px(worm.head.x) - 3} cy={py(worm.head.y) - 8} r="2.2" fill={TOJI_BLOOD} />
        </svg>
      </motion.div>
      {/* senjata dimuntahkan BERURUTAN (stagger) → hantam tombol (bayangan) */}
      {worm.weapons.map((wp, i) => (
        <motion.span
          key={wp.id}
          data-toji-weapon
          className="absolute"
          style={{ left: '50%', top: '46%', width: 26, height: 8, marginLeft: -13 }}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
          animate={reduced
            ? { x: (i - 1.5) * 34, y: rect.h * 0.5, opacity: 0.9, rotate: wp.ang * 0.4 }
            : {
              x: [(i - 1.5) * 10, (i - 1.5) * 38],
              y: [0, rect.h * 0.52 + i * 6],
              opacity: [0, 1, 0.9],
              rotate: [wp.ang * 0.3, wp.ang * 1.6],
            }}
          transition={reduced ? { duration: 0 } : { duration: 0.4, delay: 0.3 + wp.delay, ease: EASE_IMPACT }}
        >
          {/* 4 bentuk senjata: 大鉈(0) 槍(1) 刀(2) 銃(3) */}
          <svg viewBox="0 0 30 10" width="26" height="9" className="block" aria-hidden="true">
            {i === 0 && <path d="M1,5 L22,1 L29,5 L22,9 Z" fill={TOJI_STEEL} stroke={TOJI_GUNMETAL} strokeWidth="0.8" />}
            {i === 1 && <><rect x="1" y="4" width="24" height="2" fill={TOJI_GUNMETAL} /><path d="M24,1 L30,5 L24,9 Z" fill={TOJI_FLASH} /></>}
            {i === 2 && <path d="M2,5 Q14,1 28,4 L28,6 Q14,9 2,5 Z" fill={TOJI_STEEL} stroke={TOJI_GUNMETAL} strokeWidth="0.6" />}
            {i === 3 && <><rect x="2" y="2" width="16" height="6" rx="1" fill={TOJI_VOID} stroke={TOJI_GUNMETAL} strokeWidth="0.8" /><rect x="18" y="4" width="9" height="2" fill={TOJI_GUNMETAL} /></>}
          </svg>
        </motion.span>
      ))}
      {/* bayangan (影) hantaman di tombol */}
      {!reduced && (
        <motion.div
          data-toji-shadow
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 58%, rgba(12,12,12,0.5), transparent 62%)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.75, 0.5] }}
          transition={{ duration: 0.34, delay: 0.52, ease: EASE_IMPACT }}
        />
      )}
    </>
  );
}

// ── Salah: wash hitam-merah redup (冷たい鋼 — bukan ledakan) ────────────────
function TojiWrong({ reduced }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 104% at 50% 50%, transparent 0%, transparent 46%, rgba(12,12,12,0.4) 74%, rgba(12,12,12,0.68) 100%)' }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.6 } : { opacity: [0, 0.95, 0.82] }}
        transition={{ duration: reduced ? 0 : 0.32, ease: 'easeOut' }}
      />
      {/* 残穢 (ざんえ) — jejak merah tipis (Toji jago membaca jejak) */}
      <motion.span
        className="absolute"
        style={{ left: '18%', right: '22%', top: '58%', height: 2, background: TOJI_BLOOD, opacity: 0.5 }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={reduced ? { scaleX: 1, opacity: 0.45 } : { scaleX: [0, 1], opacity: [0, 0.55, 0.35] }}
        transition={{ duration: reduced ? 0 : 0.42, delay: reduced ? 0 : 0.1, ease: EASE_EXIT }}
      />
    </div>
  );
}

// ── 術師殺し (jutsushi goroshi) — soal DIBUNUH saat state 全開 (mekanik
// 武器庫・一撃離脱): amunisi dibayar 1 → seluruh opsi soal itu tertebas. Bukan
// reveal benar/salah — soal mati total lalu di-skip. 5 tebasan staggered
// menyilang + 残穢 blood red + bayangan gunmetal (冷たい鋼, TANPA glow).
function JutsushiGoroshi({ reduced }) {
  const cuts = Array.from({ length: 5 });
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 残穢 — jejak merah tipis menyilang kartu (bukan wash besar) */}
      <motion.div
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, transparent 32%, rgba(220,38,38,0.16) 50%, transparent 68%)` }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.7 } : { opacity: [0, 0.85, 0.55] }}
        transition={{ duration: reduced ? 0 : 0.4, ease: 'easeOut' }}
      />
      {cuts.map((_, i) => {
        const ang = -34 + i * 17;   // kipas tebasan menyilang
        const y = 14 + i * 18;
        return (
          <motion.span
            key={`kill-${i}`}
            data-toji-kill
            className="absolute"
            style={{
              left: '-12%', right: '-12%', top: `${y}%`, height: i % 2 ? 1.6 : 2.4,
              background: `linear-gradient(90deg, transparent, ${i % 2 ? TOJI_BLOOD : TOJI_STEEL} 18%, ${TOJI_FLASH} 50%, ${i % 2 ? TOJI_BLOOD : TOJI_STEEL} 82%, transparent)`,
              transform: `rotate(${ang}deg)`,
              transformOrigin: 'center',
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={reduced
              ? { scaleX: 1, opacity: 0.85 }
              : { scaleX: [0, 1, 1], opacity: [0, 1, 0.9] }}
            transition={reduced ? { duration: 0 } : { duration: 0.3, delay: i * 0.075, times: [0, 0.55, 1], ease: EASE_LINE }}
          />
        );
      })}
      {/* bilah penutup (釈魂刀) melintas terakhir — diagonal besar */}
      {!reduced && (
        <motion.span
          className="absolute"
          style={{
            left: '-16%', right: '-16%', top: '52%', height: 3,
            background: `linear-gradient(90deg, transparent, ${TOJI_STEEL} 22%, ${TOJI_FLASH} 50%, ${TOJI_STEEL} 78%, transparent)`,
            transform: 'rotate(-27deg)', transformOrigin: 'center',
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 0.34, delay: 0.38, times: [0, 0.6, 1], ease: EASE_EXIT }}
        />
      )}
      {/* kilatan putih 1 frame di ujung tebasan */}
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          style={{ background: TOJI_FLASH }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 0.22, delay: 0.42, ease: 'linear' }}
        />
      )}
    </div>
  );
}

// ── GIF kalah Toji — bingkai baja dingin (TANPA glow 呪力), band ATAS zona aman.
//    Tanpa GIF: TojiWrong (wash + 残穢) yang bicara. Dengan GIF: bingkai di atas,
//    kanji 「化け物が」 tetap di bawah (dekat kartu) — tidak tumpuk.
function TojiGifLayer({ src, reduced }) {
  if (!src) return null;
  return (
    <div className="absolute left-1/2 top-[3%] z-10 -translate-x-1/2">
      <motion.div
        data-toji-gif
        initial={{ opacity: 0, scale: 0.92, rotate: 2 }}
        animate={{ opacity: 1, scale: 1, rotate: -1.5, x: reduced ? 0 : [0, -7, 6, -4, 3, 0] }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: reduced ? 0 : 0.34, ease: 'easeOut' }}
      >
        {/* Bingkai baja: bg hitam pekat + border gunmetal + bayangan keras
            (tanpa glow — identitas 冷たい鋼). */}
        <div className="w-[30vh] h-[30vh] max-w-[46vw] max-h-[46vw] border-[3px] border-[#3F3F46] bg-[#0C0C0C] shadow-[8px_8px_0_0_rgba(12,12,12,0.55)] overflow-hidden">
          <img
            src={src}
            alt="Toji — 化け物が"
            decoding="sync"
            loading="eager"
            className="w-full h-full object-contain select-none"
            draggable={false}
          />
        </div>
      </motion.div>
    </div>
  );
}

// ── Dispatcher ───────────────────────────────────────────────────────────────
export function TojiBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const tech = fx?.tech;
  const seed = fx?.seed || 1;
  const style = tech ? TOJI_STYLE[tech] : null;
  const wrong = kind === 'wrong';
  const kill = tech === 'kill';
  // Rect kartu yang dipencet — semua jurus menempel DI KARTU (aturan Megumi v2.5).
  // Kill: tebasan seluruh layar (tidak butuh anchor kartu).
  const rect = usePickedRect(!wrong && !kill, 900);
  const stage = useStageAnchor();

  return (
    <motion.div
      data-toji-burst
      data-toji-tech={tech || 'wrong'}
      className="absolute inset-0"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
    >
      {wrong && <TojiWrong reduced={reduced} />}
      {/* GIF kalah (2 klip, acak) — bingkai baja di band atas */}
      {wrong && <TojiGifLayer src={fx?.gifSrc} reduced={reduced} />}
      {/* Kill 術師殺し: tebasan seluruh layar (soal mati total) */}
      {kill && (
        <div className="fixed inset-0 z-[130] pointer-events-none">
          <JutsushiGoroshi reduced={reduced} />
        </div>
      )}
      {rect && tech && !wrong && !kill && (
        <>
          {/* Lapisan KARTU: clip ke bentuk kartu → tidak ada elemen nyembur keluar */}
          <div
            className="fixed z-[130] pointer-events-none overflow-hidden"
            style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: 2 }}
          >
            {tech === 'shakkontou' && <SoulSplit seed={seed} reduced={reduced} />}
            {tech === 'amanosakahoko' && <Amanosakahoko reduced={reduced} rect={rect} stage={stage} />}
            {tech === 'yuuyun' && <YuuyunSweep reduced={reduced} rect={rect} />}
            {tech === 'bukiko_jurei' && <BukikoJurei seed={seed} reduced={reduced} rect={rect} stage={stage} />}
          </div>

          {/* Lapisan TERBUKA: elemen yang boleh melintasi tepi kartu */}
          <div
            className="fixed z-[130] pointer-events-none"
            style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
          >
            {tech === 'shakkontou' && <ShakkontouBlade seed={seed} reduced={reduced} rect={rect} />}
            {tech === 'banri_no_kusari' && <BanriChain seed={seed} reduced={reduced} rect={rect} />}
          </div>
        </>
      )}
      {/* Kanji: teknik di bawah (dekat kartu); salah 「化け物が」 redup;
          kill 「術師殺し」 blood red (soal dibunuh — mekanik 一撃離脱). */}
      <TechKanji
        style={style || (kill ? TOJI_STYLE.kill : (wrong ? { kanji: '化け物が', color: TOJI_BLOOD } : null))}
        reduced={reduced}
        delay={kill ? 0.42 : tech === 'bukiko_jurei' ? 0.5 : tech === 'yuuyun' ? 0.34 : tech === 'amanosakahoko' ? 0.4 : 0.24}
        anchor="bottom"
      />
    </motion.div>
  );
}

export default TojiBurst;
