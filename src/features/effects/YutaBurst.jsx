import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  YUTA_STYLE, YUTA_DOMAIN, yutaKatana, yutaRipples, yutaCopyRings,
} from './yutaFx';

// ─────────────────────────────────────────────────────────────────────────────
// Yuta Okkotsu (visual 'yuta') — efek jawaban, 真贋相愛 · 模倣 (しんがんそうあい・
// もほう). Kanon: Yuta spesial grade; kekuatannya 模倣 (Copy) lewat 里香/Rika;
// domain 真贋相愛 = 荒廃した地 + 無数の刀 (lautan pedang tertancap), tiap pedang
// berisi 1 teknik copy — sekali pakai lalu hancur.
//   • non-streak → 太刀 (たち · katana, tebasan bilah tunggal melintang naik) ↔
//     呪力 (じゅりょく · jurioku, gelombang cincin energi) — rotasi deterministik.
//   • 10 → 反転術式 (はんてんじゅつしき · RCT, cincin pink memulihkan) ·
//     20 → 模倣 (もほう · Copy, dua cincin berlawanan mengunci) ·
//     30+ → 真贋相愛 (領域展開 · ult).
//   • salah → wash merah darah redup + kanji 「しまった」.
// Palet KANON dari domain.gif user: merah darah (#dc2626) + langit merah gelap +
// bilah baja + ungu gelap (bayangan). ⚠️ BUKAN ungu-violet (koreksi user).
// Anti-slop: easing beda per peran; kanji hard-text (stroke gelap) bukan neon;
// efek TIDAK nutupin soal (pointer-events-none; kanji di band bawah).
// reduced-motion → bentuk & kanji akhir tetap tampil, gerakan disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const EASE_LINE = [0.33, 1, 0.68, 1];      // power2.out — tebasan presisi
const EASE_REVEAL = [0.16, 1, 0.3, 1];     // expo.out — reveal cincin

// ── Anchor kartu jawaban yang dipencet (pola Toji/Megumi) ───────────────────
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

// ── Kanji jurus — band bawah (konsisten JJK). Hard text (stroke gelap + shadow
//    padat), bukan neon. Salah 「しまった」 redup. ──────────────────────────────
function TechKanji({ style, reduced, delay = 0, size = 'clamp(30px, 7vmin, 58px)' }) {
  if (!style) return null;
  return (
    <motion.span
      data-yuta-kanji
      className="absolute font-serif font-black select-none pointer-events-none"
      style={{
        left: '50%', bottom: '13%', x: '-50%', fontSize: size,
        color: style.color,
        WebkitTextStroke: `1px ${YUTA_DOMAIN.ground}`,
        textShadow: `0 2px 0 ${YUTA_DOMAIN.ground}, 0 0 10px rgba(11,5,8,0.8)`,
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

// ── 太刀 (katana): tebasan bilah tunggal melintang naik + kilau 3 titik ──────
function KatanaSlash({ seed, reduced }) {
  const [blade] = useState(() => yutaKatana(seed));
  return (
    <motion.div
      data-yuta-katana
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.12 }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <motion.line
          x1="-6" y1="76" x2="106" y2="24" stroke={YUTA_DOMAIN.steel} strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }} animate={reduced ? { pathLength: 1 } : { pathLength: [0, 1, 1] }}
          transition={{ duration: reduced ? 0 : blade.dur, times: [0, 0.6, 1], ease: EASE_LINE }}
        />
        <motion.line
          x1="-6" y1="80" x2="106" y2="28" stroke={YUTA_DOMAIN.blood} strokeWidth="0.7"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }} animate={reduced ? { pathLength: 1 } : { pathLength: [0, 1, 1] }}
          transition={{ duration: reduced ? 0 : blade.dur, delay: reduced ? 0 : 0.04, times: [0, 0.6, 1], ease: EASE_LINE }}
        />
      </svg>
      {/* kilau bilah BERJALAN (baja menangkap cahaya, bukan glow) */}
      {blade.glints.map((g) => (
        <motion.span
          key={g.id}
          className="absolute rounded-full"
          style={{
            left: `${g.at * 88 + 4}%`, top: `${74 - g.at * 50}%`,
            width: g.size, height: g.size, background: YUTA_DOMAIN.steel,
            boxShadow: `0 0 ${g.size * 2}px ${YUTA_DOMAIN.steel}cc`,
          }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={reduced ? { opacity: 0.9, scale: 1 } : { opacity: [0, 1, 0], scale: [0.4, 1.3, 0.6] }}
          transition={{ duration: reduced ? 0 : 0.16, delay: reduced ? 0 : 0.1 + g.at * 0.12, ease: EASE_LINE }}
        />
      ))}
      {/* flash putih 1 frame di ujung tebasan */}
      {!reduced && (
        <motion.div
          className="absolute inset-0" style={{ background: YUTA_DOMAIN.steel }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 0.35, 0] }}
          transition={{ duration: 0.2, delay: blade.dur * 0.7, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}

// ── 呪力 / 模倣 / 反転術式 / 真贋相愛: cincin gelombang (opacity/scale stagger) ─
function RippleRings({ color, rings, dur = 0.9, reduced }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      {rings.map((r, i) => (
        <motion.span
          key={r.id}
          className="absolute rounded-full"
          style={{
            width: `${r.r * 2}vmin`, height: `${r.r * 2}vmin`,
            border: `${Math.max(1, r.width)}px solid ${color}`,
            boxShadow: `0 0 14px ${color}66, inset 0 0 10px ${color}33`,
          }}
          initial={{ opacity: 0, scale: 0.2 }}
          animate={reduced
            ? { opacity: 0.5, scale: 1 }
            : { opacity: [0, 0.85, 0], scale: [0.2, 1, 1.15] }}
          transition={{ duration: reduced ? 0 : dur + i * 0.12, delay: reduced ? 0 : i * 0.08, ease: EASE_REVEAL }}
        />
      ))}
    </div>
  );
}

// ── 真贋相愛: dua cincin berlawanan arah (asli ↔ palsu saling mengunci) ──────
function CopyRings({ seed, reduced }) {
  const [rings] = useState(() => yutaCopyRings(seed));
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      {rings.map((c) => (
        <motion.span
          key={c.id}
          className="absolute rounded-full"
          style={{
            width: `${c.r * 2}vmin`, height: `${c.r * 2}vmin`,
            border: `${Math.max(1, c.width)}px solid ${YUTA_DOMAIN.blood}`,
            borderTopColor: YUTA_DOMAIN.steel,
            boxShadow: `0 0 18px ${YUTA_DOMAIN.blood}55`,
          }}
          initial={{ opacity: 0, rotate: 0, scale: 0.3 }}
          animate={reduced
            ? { opacity: 0.6, rotate: c.dir * 20, scale: 1 }
            : { opacity: [0, 0.9, 0.7], rotate: c.dir * 220, scale: [0.3, 1.02, 1] }}
          transition={{ duration: reduced ? 0 : c.dur, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// ── Wash salah: merah darah redup dari tepi (bukan neon) ────────────────────
function YutaWrong({ reduced }) {
  return (
    <>
      {!reduced && (
        <motion.div
          data-yuta-wrong-wash
          className="absolute inset-0"
          style={{ background: `radial-gradient(120% 100% at 50% 50%, rgba(220,38,38,0.06), rgba(11,5,8,0.55) 100%)` }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.75] }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, transparent, ${YUTA_DOMAIN.blood}, transparent)` }}
        initial={{ opacity: 0 }} animate={{ opacity: reduced ? 0.6 : [0, 0.9, 0.4] }}
        transition={{ duration: reduced ? 0 : 0.6, ease: 'easeOut' }}
      />
    </>
  );
}

// ── GIF kalah Yuta (gomenasai) — bingkai kanon (tepi baja + wash merah) ─────
function YutaGifLayer({ src, reduced }) {
  if (!src) return null;
  return (
    <div className="absolute left-1/2 top-[3%] z-10 -translate-x-1/2">
      <motion.div
        data-yuta-gif
        initial={{ opacity: 0, scale: 0.92, rotate: 2 }}
        animate={{ opacity: 1, scale: 1, rotate: -1.5, x: reduced ? 0 : [0, -7, 6, -4, 3, 0] }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: reduced ? 0 : 0.34, ease: 'easeOut' }}
      >
        <div className="w-[30vh] h-[30vh] max-w-[46vw] max-h-[46vw] border-[3px] border-[#7f1d1d] bg-[#0b0508] shadow-[8px_8px_0_0_rgba(11,5,8,0.6)] overflow-hidden">
          <img
            src={src}
            alt="Yuta — しまった"
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
export function YutaBurst({ fx, kind }) {
  const [reduced] = useState(prefersReduced);
  const tech = fx?.tech;
  const seed = fx?.seed || fx?.id || 1;
  const style = tech ? YUTA_STYLE[tech] : null;
  const wrong = kind === 'wrong';
  const rect = usePickedRect(!wrong, 900);

  return (
    <motion.div
      data-yuta-burst
      data-yuta-tech={tech || 'wrong'}
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
    >
      {wrong && <YutaWrong reduced={reduced} />}
      {wrong && <YutaGifLayer src={fx?.gifSrc} reduced={reduced} />}

      {!wrong && rect && (
        <div
          className="fixed z-[130] pointer-events-none"
          style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
        >
          {tech === 'katana' && <KatanaSlash seed={seed} reduced={reduced} />}
          {(tech === 'ripples' || tech === 'reversal' || tech === 'mimic' || tech === 'ult') && (
            <RippleRings
              seed={seed}
              color={style?.color || YUTA_DOMAIN.blood}
              rings={yutaRipples(seed)}
              dur={tech === 'ult' ? 1.2 : 0.9}
              reduced={reduced}
            />
          )}
          {tech === 'ult' && <CopyRings seed={seed} reduced={reduced} />}
        </div>
      )}

      <TechKanji
        style={style || (wrong ? YUTA_STYLE.wrong : null)}
        reduced={reduced}
        delay={tech === 'ult' ? 0.42 : tech === 'katana' ? 0.2 : 0.28}
        size={tech === 'ult' ? 'clamp(34px, 8vmin, 66px)' : 'clamp(30px, 7vmin, 58px)'}
      />
    </motion.div>
  );
}

export default YutaBurst;
