import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  YUTA_STYLE, YUTA_DOMAIN, yutaKatana, yutaRipples, yutaCopyRings,
  yutaSparks, yutaCracks, yutaMotes, yutaRingDiameters,
} from './yutaFx';

// ─────────────────────────────────────────────────────────────────────────────
// Yuta Okkotsu (visual 'yuta') — efek jawaban, 真贋相愛 · 模倣 (しんがんそうあい・
// もほう). Kanon: Yuta spesial grade; kekuatannya 模倣 (Copy) lewat 里香/Rika;
// domain 真贋相愛 = 荒廃した地 + 無数の刀 (lautan pedang tertancap), tiap pedang
// berisi 1 teknik copy — sekali pakai lalu hancur.
//   • non-streak → 太刀 (たち · katana, tebasan bilah melintang naik) ↔
//     呪力 (じゅりょく · jurioku, gelombang cincin energi) — rotasi deterministik.
//   • 10 → 反転術式 (はんてんじゅつしき · RCT, cincin pink memulihkan) ·
//     20 → 模倣 (もほう · Copy, dua cincin berlawanan mengunci) ·
//     30+ → 真贋相愛 (領域展開 · ult).
//   • salah → wash merah darah redup + kanji 「しまった」.
// Palet KANON dari domain.gif user: merah darah (#dc2626) + langit merah gelap +
// bilah baja + ungu gelap (bayangan). ⚠️ BUKAN ungu-violet (koreksi user).
// Anti-slop (setara NobaraBurst — tiap jurus 3 lapis, bukan garis tipis):
//   • bentuk berlapis: core terang → badan → tepi gelap
//   • percikan radial KONSISTEN (8 arah dari titik, bukan random)
//   • retakan bercabang & menirus, punya AKHIR (dur terbatas, tanpa loop)
//   • partikel 呪力 naik bergelombang (bukan glow statis)
//   • easing BEDA per peran; STAGGER 60-90ms; efek TIDAK nutupin soal (clip ke kartu)
// reduced-motion → bentuk & kanji akhir tetap tampil, gerakan disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const EASE_LINE = [0.33, 1, 0.68, 1];      // power2.out — tebasan presisi
const EASE_REVEAL = [0.16, 1, 0.3, 1];     // expo.out — reveal cincin
const EASE_BACK = [0.34, 1.56, 0.64, 1];   // back.out — burst menyentak
const EASE_IN = [0.55, 0, 1, 0.45];        // power2.in — partikel melesat

// ── Anchor kartu jawaban yang dipencet (pola Toji/Nobara) ───────────────────
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

// ── Kanji jurus — band bawah (konsisten JJK). Hard text (stroke gelap + glow) ──
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
        textShadow: `0 0 12px ${style.color}cc, 0 0 34px ${style.color}66, 0 2px 0 ${YUTA_DOMAIN.ground}`,
        willChange: 'transform, opacity',
      }}
      initial={{ opacity: 0, scale: 0.72 }}
      animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0.94], scale: [0.72, 1.12, 1, 1.01] }}
      transition={{ duration: reduced ? 0 : 0.66, delay: reduced ? 0 : delay, ease: 'easeOut' }}
    >
      {style.kanji}
    </motion.span>
  );
}

// ── Percikan radial: 8 arah KONSISTEN dari pusat (bukan random) — 3 lapis ────
function Sparks({ seed, reduced, delay = 0, scale = 1, color = YUTA_DOMAIN.steel }) {
  const [sparks] = useState(() => yutaSparks(seed, 8));
  return (
    <>
      {sparks.map((s) => (
        <motion.div
          key={s.id}
          className="absolute left-1/2 top-1/2"
          style={{ width: s.size * scale, height: s.size * scale, marginLeft: -s.size * scale / 2, marginTop: -s.size * scale / 2 }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={reduced ? { x: s.dx * scale * 0.6, y: s.dy * scale * 0.6, opacity: 0.85 }
            : { x: [0, s.dx * scale], y: [0, s.dy * scale], opacity: [0, 1, 0] }}
          transition={{ duration: reduced ? 0 : s.dur, delay: reduced ? 0 : delay + s.delay, ease: EASE_IN }}
        >
          {/* ekor percikan (garis, bukan titik) */}
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `linear-gradient(180deg, ${YUTA_DOMAIN.mizuhiki}, ${color})`,
              boxShadow: `0 0 6px ${color}aa`,
            }}
          />
        </motion.div>
      ))}
    </>
  );
}

// ── Retakan: bercabang, menirus, sudut tajam (bukan glow blob) — clip ke kartu ─
function CrackLines({ seed, count = 3, reduced, w, h, color = YUTA_DOMAIN.blood, delay = 0.1 }) {
  const [cracks] = useState(() => yutaCracks(seed, count));
  const cx = w / 2, cy = h / 2;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 block" aria-hidden="true">
      {cracks.map((c) => {
        const rad = (c.ang * Math.PI) / 180;
        const x2 = cx + Math.cos(rad) * (c.len * w) / 100;
        const y2 = cy + Math.sin(rad) * (c.len * h) / 100;
        const mx = cx + Math.cos(rad) * (c.len * w) / 200;
        const my = cy + Math.sin(rad) * (c.len * h) / 200;
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
            {c.branch.map((b, j) => {
              const br = (b.ang * Math.PI) / 180;
              return (
                <motion.path
                  key={`${c.id}-b${j}`}
                  d={`M${mx},${my} L${mx + Math.cos(br) * (b.len * w) / 100},${my + Math.sin(br) * (b.len * h) / 100}`}
                  fill="none" stroke={color} strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={reduced ? { pathLength: 1, opacity: 0.7 } : { pathLength: [0, 1], opacity: [0, 0.8] }}
                  transition={{ duration: reduced ? 0 : c.dur * 0.7, delay: reduced ? 0 : delay + c.delay + 0.06, ease: [0.22, 1, 0.36, 1] }}
                  strokeWidth={Math.max(0.8, c.w1 * (h / 100))}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ── Partikel 呪力 naik bergelombang (layer layar, bukan di kartu) ────────────
function Motes({ seed, reduced, color = YUTA_DOMAIN.steel, count = 10 }) {
  const [motes] = useState(() => yutaMotes(seed, count));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {motes.map((m) => (
        <motion.span
          key={m.id}
          className="absolute rounded-full"
          style={{
            left: `${m.x}%`, bottom: '6%',
            width: m.size, height: m.size,
            background: `radial-gradient(circle, ${YUTA_DOMAIN.mizuhiki}, ${color})`,
            boxShadow: `0 0 8px ${color}88`,
          }}
          initial={{ opacity: 0 }}
          animate={reduced ? { opacity: 0.5, y: -m.rise * 0.4 }
            : { opacity: [0, 0.85, 0], y: [0, -m.rise], x: [0, Math.sin(m.phase) * m.sway] }}
          transition={{ duration: reduced ? 0 : m.dur, delay: reduced ? 0 : m.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ── 太刀 (katana): tebasan bilah 3 lapis + kilau berjalan + percikan + retakan ─
function KatanaSlash({ seed, reduced, rect }) {
  const [blade] = useState(() => yutaKatana(seed));
  const scale = Math.min(rect.w, rect.h) / 70;
  return (
    <>
      {/* bilah: 3 lapis (tepi darah → baja → core putih) melintang naik */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <motion.line
          x1="-6" y1="76" x2="106" y2="24" stroke={YUTA_DOMAIN.blood} strokeWidth="3.2"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }} animate={reduced ? { pathLength: 1 } : { pathLength: [0, 1, 1] }}
          transition={{ duration: reduced ? 0 : blade.dur, times: [0, 0.6, 1], ease: EASE_LINE }}
        />
        <motion.line
          x1="-6" y1="76" x2="106" y2="24" stroke={YUTA_DOMAIN.steel} strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }} animate={reduced ? { pathLength: 1 } : { pathLength: [0, 1, 1] }}
          transition={{ duration: reduced ? 0 : blade.dur, delay: reduced ? 0 : 0.03, times: [0, 0.6, 1], ease: EASE_LINE }}
        />
        <motion.line
          x1="-6" y1="74" x2="106" y2="22" stroke={YUTA_DOMAIN.mizuhiki} strokeWidth="0.7"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }} animate={reduced ? { pathLength: 1 } : { pathLength: [0, 1, 1] }}
          transition={{ duration: reduced ? 0 : blade.dur, delay: reduced ? 0 : 0.06, times: [0, 0.6, 1], ease: EASE_LINE }}
        />
      </svg>
      {/* kilau bilah BERJALAN (baja menangkap cahaya, bukan glow) */}
      {blade.glints.map((g) => (
        <motion.span
          key={g.id}
          className="absolute rounded-full"
          style={{
            left: `${g.at * 88 + 4}%`, top: `${74 - g.at * 50}%`,
            width: g.size, height: g.size, background: YUTA_DOMAIN.mizuhiki,
            boxShadow: `0 0 ${g.size * 2.4}px ${YUTA_DOMAIN.steel}cc`,
          }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={reduced ? { opacity: 0.9, scale: 1 } : { opacity: [0, 1, 0], scale: [0.4, 1.3, 0.6] }}
          transition={{ duration: reduced ? 0 : 0.16, delay: reduced ? 0 : 0.1 + g.at * 0.12, ease: EASE_LINE }}
        />
      ))}
      {/* percikan di sepanjang tebasan */}
      <Sparks seed={seed + 7} reduced={reduced} delay={blade.dur * 0.5} scale={scale} color={YUTA_DOMAIN.steel} />
      {/* retakan pendek di kartu */}
      <CrackLines seed={seed + 8} count={2} reduced={reduced} w={rect.w} h={rect.h} delay={blade.dur * 0.6} />
      {/* flash putih 1 frame di ujung tebasan */}
      {!reduced && (
        <motion.div
          className="absolute inset-0" style={{ background: YUTA_DOMAIN.mizuhiki }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 0.2, delay: blade.dur * 0.7, ease: 'linear' }}
        />
      )}
    </>
  );
}

// ── 呪力 / 反転術式 / 模倣 / 真贋相愛: cincin gelombang + percikan + retakan ───
// ⚠️ Diameter dalam px RELATIF kartu (bukan `vmin`): kalau pakai vmin, cincin jauh
// lebih besar dari kartu yang meng-clip-nya → lingkaran di luar area → TAK terlihat.
function RippleRings({ color, rings, dur = 0.9, reduced, rect }) {
  const base = Math.max(64, Math.min(rect.w, rect.h));
  const diams = yutaRingDiameters(base, rings.length);
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      {rings.map((r, i) => {
        const d = diams[i];
        return (
          <motion.span
            key={r.id}
            className="absolute rounded-full"
            style={{
              width: d, height: d,
              border: `${Math.max(1.4, r.width * 1.6)}px solid ${color}`,
              boxShadow: `0 0 16px ${color}77, inset 0 0 12px ${color}44`,
            }}
            initial={{ opacity: 0, scale: 0.25 }}
            animate={reduced
              ? { opacity: 0.7, scale: 1 }
              : { opacity: [0, 0.95, 0], scale: [0.25, 1, 1.2] }}
            transition={{ duration: reduced ? 0 : dur + i * 0.12, delay: reduced ? 0 : i * 0.07, ease: EASE_REVEAL }}
          />
        );
      })}
    </div>
  );
}

// ── 真贋相愛 / 模倣: dua cincin berlawanan arah (asli ↔ palsu saling mengunci) ─
function CopyRings({ seed, reduced, rect }) {
  const [rings] = useState(() => yutaCopyRings(seed));
  const base = Math.max(72, Math.min(rect.w, rect.h) * 1.25);
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      {rings.map((c) => {
        const d = base * (0.72 + c.r / 60);
        return (
          <motion.span
            key={c.id}
            className="absolute rounded-full"
            style={{
              width: d, height: d,
              border: `${Math.max(1.4, c.width * 1.4)}px solid ${YUTA_DOMAIN.blood}`,
              borderTopColor: YUTA_DOMAIN.steel,
              boxShadow: `0 0 18px ${YUTA_DOMAIN.blood}55`,
            }}
            initial={{ opacity: 0, rotate: 0, scale: 0.3 }}
            animate={reduced
              ? { opacity: 0.7, rotate: c.dir * 20, scale: 1 }
              : { opacity: [0, 0.95, 0.72], rotate: c.dir * 220, scale: [0.3, 1.02, 1] }}
            transition={{ duration: reduced ? 0 : c.dur, ease: 'linear' }}
          />
        );
      })}
    </div>
  );
}

// ── 反転術式 (RCT): salib pemulihan + percikan naik (pink, bukan agresif) ─────
function ReversalCross({ reduced, rect }) {
  const s = Math.max(40, Math.min(rect.w, rect.h) * 0.5);
  return (
    <motion.div
      data-yuta-reversal-cross
      className="absolute left-1/2 top-1/2 pointer-events-none"
      style={{ width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2 }}
      initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
      animate={reduced ? { opacity: 0.9, scale: 1, rotate: 0 }
        : { opacity: [0, 0.95, 0.8], scale: [0.6, 1.06, 1], rotate: [-8, 0, 0] }}
      transition={{ duration: reduced ? 0 : 0.5, ease: EASE_BACK }}
    >
      <div className="absolute left-1/2 top-0 h-full w-[16%] -translate-x-1/2 rounded-sm"
        style={{ background: `linear-gradient(180deg, ${YUTA_DOMAIN.mizuhiki}, ${YUTA_STYLE.reversal.color})`, boxShadow: `0 0 14px ${YUTA_STYLE.reversal.color}aa` }} />
      <div className="absolute top-1/2 left-0 w-full h-[16%] -translate-y-1/2 rounded-sm"
        style={{ background: `linear-gradient(90deg, ${YUTA_DOMAIN.mizuhiki}, ${YUTA_STYLE.reversal.color})`, boxShadow: `0 0 14px ${YUTA_STYLE.reversal.color}aa` }} />
    </motion.div>
  );
}

// ── 模倣 (Copy): gema kartu (duplikat hantu offset) + cincin mengunci ─────────
function MimicEcho({ reduced, rect }) {
  const off = Math.max(6, Math.min(rect.w, rect.h) * 0.09);
  return (
    <motion.div
      data-yuta-mimic-echo
      className="absolute pointer-events-none"
      style={{
        left: 0, top: 0, width: rect.w, height: rect.h,
        border: `2px solid ${YUTA_STYLE.mimic.color}`,
        borderRadius: 2,
      }}
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={reduced ? { opacity: 0.6, x: -off, y: off }
        : { opacity: [0, 0.85, 0.5], x: [0, -off], y: [0, off] }}
      transition={{ duration: reduced ? 0 : 0.5, ease: EASE_REVEAL }}
    />
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
          style={{ background: `radial-gradient(120% 100% at 50% 50%, rgba(220,38,38,0.08), rgba(11,5,8,0.6) 100%)` }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.78] }}
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

// ── GIF kalah Yuta (gomenasai) — bingkai kanon (tepi baja + wash merah) ──────
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

      {/* partikel 呪力 naik — layer layar (di luar kartu) */}
      {!wrong && (tech === 'ripples' || tech === 'reversal' || tech === 'mimic' || tech === 'ult') && (
        <Motes seed={seed + 3} reduced={reduced}
          color={style?.color || YUTA_DOMAIN.steel}
          count={tech === 'ult' ? 14 : 9} />
      )}

      {!wrong && rect && (
        // Layer DI KARTU: clip ke bentuk kartu → tidak ada elemen nyembur keluar.
        <div
          className="fixed z-[130] pointer-events-none overflow-hidden"
          style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: 2 }}
        >
          {tech === 'katana' && (
            <>
              <KatanaSlash seed={seed} reduced={reduced} rect={rect} />
              <RippleRings color={YUTA_DOMAIN.steel} rings={yutaRipples(seed, 3)} dur={0.7} reduced={reduced} rect={rect} />
            </>
          )}

          {tech === 'ripples' && (
            <>
              <RippleRings color={style?.color || YUTA_DOMAIN.blood} rings={yutaRipples(seed)} dur={0.9} reduced={reduced} rect={rect} />
              <Sparks seed={seed + 11} reduced={reduced} delay={0.14} scale={Math.min(rect.w, rect.h) / 70} color={style?.color} />
            </>
          )}

          {tech === 'reversal' && (
            <>
              <ReversalCross reduced={reduced} rect={rect} />
              <RippleRings color={style?.color || YUTA_DOMAIN.blood} rings={yutaRipples(seed, 3)} dur={0.8} reduced={reduced} rect={rect} />
              <Sparks seed={seed + 12} reduced={reduced} delay={0.12} scale={Math.min(rect.w, rect.h) / 72} color={style?.color} />
            </>
          )}

          {tech === 'mimic' && (
            <>
              <MimicEcho reduced={reduced} rect={rect} />
              <CopyRings seed={seed} reduced={reduced} rect={rect} />
              <Sparks seed={seed + 13} reduced={reduced} delay={0.18} scale={Math.min(rect.w, rect.h) / 68} color={style?.color} />
              <CrackLines seed={seed + 14} count={2} reduced={reduced} w={rect.w} h={rect.h} delay={0.22} />
            </>
          )}

          {tech === 'ult' && (
            <>
              {/* flash + veil 1 frame (真贋相愛: layar dim → flash) */}
              {!reduced && (
                <motion.div className="absolute inset-0" style={{ background: YUTA_DOMAIN.blood }}
                  initial={{ opacity: 0 }} animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 0.26, ease: 'linear' }} />
              )}
              <RippleRings color={style?.color || YUTA_DOMAIN.blood} rings={yutaRipples(seed)} dur={1.2} reduced={reduced} rect={rect} />
              <CopyRings seed={seed} reduced={reduced} rect={rect} />
              <Sparks seed={seed + 15} reduced={reduced} delay={0.2} scale={Math.min(rect.w, rect.h) / 56} color={YUTA_DOMAIN.steel} />
              <Sparks seed={seed + 16} reduced={reduced} delay={0.26} scale={Math.min(rect.w, rect.h) / 70} color={YUTA_DOMAIN.blood} />
              <CrackLines seed={seed + 17} count={4} reduced={reduced} w={rect.w} h={rect.h} delay={0.24} />
              <CrackLines seed={seed + 18} count={3} reduced={reduced} w={rect.w} h={rect.h} color={YUTA_DOMAIN.steelD} delay={0.3} />
            </>
          )}
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
