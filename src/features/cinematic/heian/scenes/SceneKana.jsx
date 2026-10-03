// ─────────────────────────────────────────────────────────────────────────────
// SCENE 3 — かなは、日本の言葉を記す新たな道を開いた。 (Kana membuka jalan baru)
// Visual: atmosfer menulis — sapuan kuas, tinta mengalir. Lalu deret hiragana
// あ → か → さ → た muncul satu-satu seperti baru ditulis (atmosferik, BUKAN kuis).
//
// `portrait` → garis kertas & sapuan kuas dipetakan ke viewBox 400×850 supaya
// tetap terlihat di HP. Deret kana sendiri HTML (flex) → sudah aman di semua layar.
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (p) => 1 - Math.pow(1 - clamp01(p), 3);

// Satu kana: tersingkap seperti tarikan kuas (clip kiri→kanan) + tetes tinta.
function KanaStroke({ char, delay, clock, sceneStart, reduced, size }) {
  const p = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - delay) / 1.1)));
  const clip = useTransform(p, (v) => `inset(0 ${(1 - v) * 100}% 0 0%)`);
  const op = useTransform(p, (v) => (reduced ? 0.9 : 0.2 + 0.8 * v));
  const y = useTransform(p, (v) => (reduced ? 0 : (1 - v) * 6));

  return (
    <motion.span
      className="relative inline-block"
      style={{
        fontFamily: 'var(--font-kana)',
        fontSize: size,
        color: 'var(--emk-ink)',
        lineHeight: 1,
        clipPath: clip,
        opacity: op,
        y,
      }}
    >
      {char}
    </motion.span>
  );
}

// Jalur garis/sapuan — versi landscape (1440×620) & portrait (400×850).
const L = {
  viewBox: '0 0 1440 620',
  line1: 'M120 300 Q720 288 1320 300',
  line2: 'M120 470 Q720 460 1320 470',
  sweep: 'M80 400 Q240 340 380 402 Q300 430 200 428',
};
const P = {
  viewBox: '0 0 400 850',
  line1: 'M40 400 Q200 388 360 400',
  line2: 'M40 560 Q200 548 360 560',
  sweep: 'M40 470 Q130 408 220 470 Q160 500 90 498',
};

export function SceneKana({ scene, clock, sceneStart = 0, reduced = false, portrait = false }) {
  const cfg = portrait ? P : L;
  const kana = scene?.kana;
  const glyphs = kana?.glyphs || [];
  const base = kana?.at || 5;
  const gap = kana?.gap || 0.5;

  // Garis kertas tumbuh + sapuan kuas besar.
  const line1 = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart) / 2.2)));
  const line2 = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.4) / 2.4)));
  const sweep = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart) / 1.8)));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Garis tinta horizontal samar (kertas tulis / genkō yōshi) */}
      <svg viewBox={cfg.viewBox} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <g stroke="var(--emk-ink)" fill="none" strokeLinecap="round">
          <motion.path d={cfg.line1} strokeWidth="2" opacity="0.16" style={{ pathLength: line1 }} />
          <motion.path d={cfg.line2} strokeWidth="2" opacity="0.13" style={{ pathLength: line2 }} />
          {/* Sapuan kuas besar (nuansa menulis) */}
          <motion.path
            d={cfg.sweep}
            stroke="var(--emk-ink)"
            strokeWidth="10"
            opacity="0.28"
            /* Tanpa filter: sapuan tumbuh tiap frame di dalam lapisan Ken Burns
               → filter SVG (feTurbulence/feDisplacementMap) di-raster ulang tiap
               frame dan jadi biang patah-patah. Lihat SceneCapital.jsx. */
            style={{ pathLength: sweep }}
          />
        </g>
      </svg>

      {/* Deret hiragana — muncul satu-satu seperti baru ditulis */}
      <div className="absolute inset-x-0 bottom-[26%] z-20 flex items-end justify-center gap-[4vw]">
        {glyphs.map((ch, i) => (
          <KanaStroke
            key={ch}
            char={ch}
            delay={base + i * gap}
            clock={clock}
            sceneStart={sceneStart}
            reduced={reduced}
            size="clamp(2rem, 7vw, 4rem)"
          />
        ))}
      </div>
    </div>
  );
}

export default SceneKana;
