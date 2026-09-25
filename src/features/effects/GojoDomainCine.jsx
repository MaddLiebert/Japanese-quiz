import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GOJO_STYLE, GOJO_BALL_BREAKPOINT, GOJO_ULT_THRESHOLD,
  gojoDomainTimeline,
} from './gojoFx';
import { playDomainBoom } from '../../utils/sfx';

// ─────────────────────────────────────────────────────────────────────────────
// 領域展開・無量空処 — CINEMATIC ULTIMATE (bar energi kutukan, persist sampai salah).
//   0. BAR       → 呪力 bar vertikal tepi KANAN, keisi naik tiap benar (aura di garis isi)
//   1. GELAP     → layar hitam kecuali area kuis (spotlight [data-quiz-area])
//   2. TEKS      → 領域展開 → 無量空処 muncul PER-KARAKTER (berurutan)
//   3. SIX EYES  → mata di ATAS teks, nutup → kebuka
//   4. BIGBANG   → di tengah + bercak ruang angkasa di PINGGIR kuis
//   5. SETTLE    → blok mata+teks naik ke atas & mengecil → kartu soal kebaca
//   6. PERSIST   → tetap hidup sampai jawaban SALAH (dikontrol EffectProvider)
// Semua overlay pointer-events-none → quiz tetap bisa dijawab (bar-nya sendiri yang klikable).
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isMobile = () =>
  typeof window !== 'undefined' && window.innerWidth < GOJO_BALL_BREAKPOINT;

void isMobile;   // dipakai fase bintang/nebula (Task 8)

// ── Bar energi kutukan 呪力 (tepinya KANAN, isi naik dari bawah) ─────────────
// Visual: jalur gelap + isi ungu dengan glow; tiap +1 benar memicu "letupan aura"
// (satu kilau yang naik di garis isi, remount via key=charge); saat penuh → label
// 領域展開 + denyut; tap bar = cast.
export function GojoCurseBar({ charge = 0, ready = false, onCast }) {
  const [reduced] = useState(prefersReduced);
  const pct = Math.max(0, Math.min(100, (charge / GOJO_ULT_THRESHOLD) * 100));
  const purple = GOJO_STYLE.domain.color;

  return (
    <div
      data-gojo-cursebar
      className="pointer-events-none fixed right-2.5 top-1/2 -translate-y-1/2 z-[125] flex flex-col items-center gap-2"
    >
      {/* Label 領域展開 saat penuh */}
      <AnimatePresence>
        {ready && (
          <motion.span
            key="ready-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#e8e0ff', writingMode: 'vertical-rl', textShadow: `0 0 12px ${purple}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: reduced ? 1 : [0.65, 1, 0.65], y: 0 }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            領域展開
          </motion.span>
        )}
      </AnimatePresence>

      {/* Bar-nya (tap = cast saat penuh) */}
      <motion.button
        type="button"
        onClick={ready ? onCast : undefined}
        aria-label="呪力"
        disabled={!ready}
        className={`relative w-[14px] h-[46vh] max-h-[380px] min-h-[200px] rounded-full border-[2px] overflow-hidden ${
          ready ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
        }`}
        style={{
          borderColor: ready ? purple : 'rgba(124,77,255,0.45)',
          background: 'rgba(10,4,20,0.55)',
          boxShadow: ready
            ? `0 0 18px 3px ${purple}cc, inset 0 0 10px ${purple}55`
            : `0 0 8px 1px ${purple}33`,
        }}
        animate={ready && !reduced ? { scaleX: [1, 1.25, 1] } : { scaleX: 1 }}
        transition={ready && !reduced ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        {/* Isi: naik dari bawah ke atas */}
        <motion.div
          className="absolute left-0 right-0 bottom-0"
          style={{
            background: `linear-gradient(to top, ${purple}, #c4b5fd)`,
            boxShadow: `0 0 12px 2px ${purple}aa`,
          }}
          initial={false}
          animate={{ height: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
        {/* Letupan aura tiap +1 benar (remount tiap charge berubah) */}
        {charge > 0 && (
          <motion.div
            key={`aura-${charge}`}
            className="absolute left-0 right-0"
            style={{ bottom: `${Math.max(0, pct - 6)}%`, height: 16, background: `radial-gradient(ellipse at 50% 50%, #ffffffcc, ${purple}00 70%)` }}
            initial={{ opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: [0, 1, 0], scaleY: [0.4, 1.6, 1] }}
            transition={{ duration: reduced ? 0 : 0.55, ease: 'easeOut' }}
          />
        )}
      </motion.button>

      {/* Angka charge */}
      <span
        className="font-mono font-black text-[10px] tracking-widest"
        style={{ color: ready ? '#e8e0ff' : 'rgba(232,224,255,0.6)' }}
      >
        {charge}/{GOJO_ULT_THRESHOLD}
      </span>
    </div>
  );
}

// ── Cinematic domain ────────────────────────────────────────────────────────
export function GojoDomainCine({ seed = 1 }) {
  void seed;   // dipakai fase bintang/nebula (Task 8)
  const [reduced] = useState(prefersReduced);
  const t = gojoDomainTimeline();

  // Spotlight: ukur area kuis ([data-quiz-area]); fallback = full gelap.
  const [rect, setRect] = useState(null);
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector('[data-quiz-area]');
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect(r.width > 0 && r.height > 0
        ? { left: r.left, top: r.top, width: r.width, height: r.height }
        : null);
    };
    measure();
    window.addEventListener('resize', measure);
    const id = setTimeout(measure, 400);   // setelah animasi kartu selesai
    return () => { window.removeEventListener('resize', measure); clearTimeout(id); };
  }, []);

  // Dentuman bigbang (cast sudah dibunyikan EffectProvider).
  useEffect(() => {
    if (reduced) return undefined;
    const id = setTimeout(() => playDomainBoom('bang'), t.bangStart * 1000);
    return () => clearTimeout(id);
  }, [reduced, t.bangStart]);

  return (
    <motion.div
      data-gojo-domain
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.6 } }}
    >
      {/* Placeholder gelap — detail fase menyusul Task 6–8 */}
      <div
        className="absolute inset-0"
        style={rect
          ? {
            left: rect.left, top: rect.top, width: rect.width, height: rect.height,
            boxShadow: '0 0 0 100vmax rgba(2,2,6,0.94)',
          }
          : { background: 'rgba(2,2,6,0.94)' }}
      />
    </motion.div>
  );
}

export default GojoDomainCine;
