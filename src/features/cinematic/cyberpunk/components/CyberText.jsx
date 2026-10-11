// ─────────────────────────────────────────────────────────────────────────────
// CyberText — teks scene 電脳, DIKENDALIKAN jam (motion value), dgn REVEAL GLITCH
// (bukan sapuan kuas Heian, bukan fade manga 多元).
//
// Kenapa clock-driven: sama seperti SceneText era lain — semua baris DI-MOUNT,
// opasitas/clip/offset dihitung dari `clock` via useTransform → tidak ada
// re-render per frame, animasi mulus & timing pas dengan audio.
//
// Bahasa rupa teks 電脳:
//   • RGB-SPLIT — teks Jepang muncul dengan dua hantu (merah + cyan) yang
//     MENYEMPIT ke 0 → terasa "tersinkron ulang" seperti sinyal.
//   • SLICE     — potongan horizontal menjatuhkan potongan teks (clip-path),
//     khas transmisi rusak. Berhenti setelah ~1s (teks jadi stabil).
//   • SCRAMBLE  — baris muncul dari terang (glow) lalu menenang.
//   • Mono telemetri untuk sub-label (mis. "DENNŌ · ENDLESS NIGHT").
//
// `clock` = MotionValue detik absolut; `sceneStart` = detik mulai scene ini.
// `reduced` → teks langsung tampil penuh (info tetap terbaca tanpa animasi).
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Gaya per `kind`.
const KIND = {
  year:     { jp: 'clamp(3rem, 11vw, 7rem)',   weight: 800, spacing: '0.06em', color: 'var(--cy-cyan)' },
  sentence: { jp: 'clamp(1.3rem, 4vw, 2.5rem)', weight: 700, spacing: '0.03em', color: 'var(--cy-ice)' },
  title:    { jp: 'clamp(2.2rem, 8.4vw, 5.6rem)', weight: 800, spacing: '0.08em', color: 'var(--cy-ice)' },
  welcome:  { jp: 'clamp(1.7rem, 5.6vw, 3.4rem)', weight: 800, spacing: '0.06em', color: 'var(--cy-kin)' },
};

const REVEAL = 0.95;   // durasi sinkron-ulang sinyal (dtk)

function Line({ line, clock, sceneStart, reduced }) {
  const g = KIND[line.kind] || KIND.sentence;
  const reveal = line.kind === 'title' || line.kind === 'year' ? 1.25 : REVEAL;

  // Kemajuan reveal 0→1 (untuk semua efek di bawah).
  const p = (t) => clamp01((t - sceneStart - line.at) / reveal);

  // Opasitas teks Jepang.
  const jpOpacity = useTransform(clock, (t) => {
    const local = t - sceneStart - line.at;
    if (local < 0) return 0;
    return reduced ? 1 : clamp01(local / 0.28);
  });

  // RGB-split: dua hantu menyempit ke 0 saat reveal selesai.
  const splitX = useTransform(clock, (t) => (reduced ? 0 : (1 - p(t)) * 9));
  const ghostOpacity = useTransform(clock, (t) => (reduced ? 0 : (1 - p(t)) * 0.85));

  // SLICE: potongan horizontal bergeser, mereda setelah reveal.
  const sliceAmt = useTransform(clock, (t) => (reduced ? 0 : (1 - p(t)) * 14));
  const sliceClip = useTransform(clock, (t) => {
    if (reduced) return 'inset(0 0% 0 0%)';
    const local = t - sceneStart - line.at;
    if (local < 0) return 'inset(0 100% 0 0%)';
    const q = p(t);
    if (q >= 1) return 'inset(0 0% 0 0%)';
    // sapuan kiri→kanan + gigi potongan (bukan garis lurus).
    const edge = q * 100;
    return `inset(0 ${(100 - edge)}% 0 0%)`;
  });

  // Glow yang mereda (teks "menyala" saat muncul, lalu tenang).
  const glow = useTransform(clock, (t) => (reduced ? 0.5 : 0.5 + (1 - p(t)) * 1.6));

  // Sub-label muncul setelah teks utama.
  const subOpacity = useTransform(clock, (t) => {
    const local = t - sceneStart - line.at - 1.1;
    if (local < 0) return 0;
    return reduced ? 1 : clamp01(local / 0.8);
  });

  // Terjemahan Indonesia menyusul.
  const trOpacity = useTransform(clock, (t) => {
    if (line.translationAt == null) return 0;
    const local = t - sceneStart - line.translationAt;
    if (local < 0) return 0;
    return reduced ? 1 : clamp01(local / 0.8);
  });
  const trY = useTransform(clock, (t) => {
    if (reduced || line.translationAt == null) return 0;
    const local = t - sceneStart - line.translationAt;
    if (local < 0) return 8;
    return (1 - clamp01(local / 0.9)) * 8;
  });
  const trBlur = useTransform(clock, (t) => {
    if (reduced || line.translationAt == null) return 'blur(0px)';
    const local = t - sceneStart - line.translationAt;
    if (local < 0) return 'blur(3px)';
    return `blur(${(1 - clamp01(local / 0.9)) * 3}px)`;
  });

  const textStyle = {
    fontFamily: 'var(--font-display)',
    fontWeight: g.weight,
    fontSize: g.jp,
    letterSpacing: g.spacing,
    lineHeight: 1.25,
  };

  return (
    <div className="relative flex flex-col items-center text-center">
      <motion.div className="relative" style={{ opacity: jpOpacity }}>
        {/* Hantu RED (RGB-split) */}
        <motion.span
          className="pointer-events-none absolute inset-0 block"
          aria-hidden="true"
          style={{ ...textStyle, color: '#FF2E4C', x: useTransform(splitX, (v) => -v), y: sliceAmt, opacity: ghostOpacity, mixBlendMode: 'screen' }}
        >
          {line.jp}
        </motion.span>
        {/* Hantu CYAN (RGB-split) */}
        <motion.span
          className="pointer-events-none absolute inset-0 block"
          aria-hidden="true"
          style={{ ...textStyle, color: '#00F0FF', x: splitX, y: useTransform(sliceAmt, (v) => -v), opacity: ghostOpacity, mixBlendMode: 'screen' }}
        >
          {line.jp}
        </motion.span>
        {/* Teks utama */}
        <motion.span
          className="relative block"
          style={{ ...textStyle, color: g.color, clipPath: sliceClip, textShadow: useTransform(glow, (v) => `0 0 ${6 * v}px rgba(0,240,255,${0.35 * v}), 0 0 ${18 * v}px rgba(0,240,255,${0.18 * v})`) }}
        >
          {line.jp}
        </motion.span>
      </motion.div>

      {/* Sub-label mono (telemetri) */}
      {line.sub && (
        <motion.span
          className="mt-2 block font-mono font-bold uppercase"
          style={{ opacity: subOpacity, color: 'var(--cy-kin)', fontSize: 'clamp(0.6rem, 1.9vw, 0.9rem)', letterSpacing: '0.42em' }}
        >
          {line.sub}
        </motion.span>
      )}

      {/* Terjemahan Indonesia */}
      {line.translation && (
        <motion.p
          className="mt-3 max-w-[34ch] font-sans font-semibold"
          style={{
            opacity: trOpacity,
            y: trY,
            filter: trBlur,
            color: 'rgba(180,205,225,0.82)',
            fontSize: 'clamp(0.82rem, 2.3vw, 1.08rem)',
            lineHeight: 1.6,
          }}
        >
          {line.translation}
        </motion.p>
      )}
    </div>
  );
}

export function CyberText({ scene, clock, sceneStart = 0, reduced = false }) {
  return (
    <div className="relative z-20 flex flex-col items-center gap-[3.5vh] px-6">
      {scene.lines.map((line) => (
        <Line key={line.id} line={line} clock={clock} sceneStart={sceneStart} reduced={reduced} />
      ))}
    </div>
  );
}

export default CyberText;
