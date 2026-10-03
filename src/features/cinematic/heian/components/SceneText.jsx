// ─────────────────────────────────────────────────────────────────────────────
// SceneText — merender baris teks sebuah scene, DIKENDALIKAN jam (motion value).
//
// Kenapa clock-driven: dulu tiap baris muncul lewat re-render React (`elapsed`
// state) → animasi patah & timing meleset dari jadwal audio. Sekarang semua
// baris DI-MOUNT dan opasitas/clip-nya dihitung dari `clock` via useTransform:
//   • Teks Jepang = elemen UTAMA (font brush), tersingkap seperti ditulis kuas
//     (clip-path kiri→kanan) — bukan fade biasa.
//   • Terjemahan Indonesia menyusul (delay terpisah), font sans, lebih terbaca.
//   • Tidak semua teks tampil sekaligus: tiap baris punya `at` & `translationAt`.
//
// `clock` = MotionValue detik absolut; `sceneStart` = detik mulai scene ini.
// `reduced` → teks langsung tampil penuh (info tetap terbaca tanpa animasi).
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Gaya per `kind`.
const KIND = {
  year: { jp: 'clamp(3rem, 11vw, 7rem)', weight: 900, spacing: '0.12em', color: 'var(--emk-ink)' },
  sentence: { jp: 'clamp(1.35rem, 4.2vw, 2.6rem)', weight: 700, spacing: '0.08em', color: 'var(--emk-ink)' },
  title: { jp: 'clamp(2.4rem, 9vw, 6rem)', weight: 900, spacing: '0.2em', color: 'var(--emk-ink)' },
  welcome: { jp: 'clamp(1.8rem, 6vw, 3.6rem)', weight: 900, spacing: '0.14em', color: 'var(--emk-ink)' },
};

const REVEAL = 1.4;   // durasi sapuan kuas (dtk)

function Line({ line, clock, sceneStart, reduced }) {
  const g = KIND[line.kind] || KIND.sentence;
  const reveal = line.kind === 'year' || line.kind === 'title' ? 1.9 : REVEAL;

  // Opasitas & clip teks Jepang (muncul seperti ditulis kuas).
  const jpOpacity = useTransform(clock, (t) => {
    const local = t - sceneStart - line.at;
    if (local < 0) return 0;
    return reduced ? 1 : clamp01(local / 0.7);
  });
  const jpClip = useTransform(clock, (t) => {
    if (reduced) return 'inset(0 0% 0 0%)';
    const local = t - sceneStart - line.at;
    if (local < 0) return 'inset(0 100% 0 0%)';
    const p = clamp01(local / reveal);
    return `inset(0 ${(1 - p) * 100}% 0 0%)`;
  });
  const jpBlur = useTransform(clock, (t) => {
    if (reduced) return 'blur(0px)';
    const local = t - sceneStart - line.at;
    if (local < 0) return 'blur(2px)';
    return `blur(${(1 - clamp01(local / 0.9)) * 2}px)`;
  });

  // Ujung kuas yang menyapu (garis tinta tipis).
  const brushLeft = useTransform(clock, (t) => {
    if (reduced) return '100%';
    const local = t - sceneStart - line.at;
    return `${clamp01(local / reveal) * 100}%`;
  });
  const brushOpacity = useTransform(clock, (t) => {
    if (reduced) return 0;
    const local = t - sceneStart - line.at;
    if (local < 0 || local > reveal) return 0;
    return 0.5;
  });

  // Sub-label (mis. "794 — 1185") — muncul setelah teks utama.
  const subOpacity = useTransform(clock, (t) => {
    const local = t - sceneStart - line.at - 1.2;
    if (local < 0) return 0;
    return reduced ? 1 : clamp01(local / 0.9);
  });

  // Terjemahan Indonesia — menyusul, font sans, lebih terbaca.
  const trOpacity = useTransform(clock, (t) => {
    if (line.translationAt == null) return 0;
    const local = t - sceneStart - line.translationAt;
    if (local < 0) return 0;
    return reduced ? 1 : clamp01(local / 0.9);
  });
  const trY = useTransform(clock, (t) => {
    if (reduced || line.translationAt == null) return 0;
    const local = t - sceneStart - line.translationAt;
    if (local < 0) return 8;
    return (1 - clamp01(local / 1.0)) * 8;
  });
  const trBlur = useTransform(clock, (t) => {
    if (reduced || line.translationAt == null) return 'blur(0px)';
    const local = t - sceneStart - line.translationAt;
    if (local < 0) return 'blur(3px)';
    return `blur(${(1 - clamp01(local / 1.0)) * 3}px)`;
  });

  return (
    <div className="relative flex flex-col items-center text-center">
      <motion.div className="relative" style={{ opacity: jpOpacity }}>
        <motion.span
          className="block"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: g.weight,
            fontSize: g.jp,
            letterSpacing: g.spacing,
            lineHeight: 1.25,
            color: g.color,
            textShadow: '0 1px 0 rgba(169,130,28,0.18)',
            clipPath: jpClip,
            filter: jpBlur,
          }}
        >
          {line.jp}
        </motion.span>
        {/* Ujung kuas */}
        <motion.span
          className="pointer-events-none absolute top-0 bottom-0 w-[3px]"
          style={{
            left: brushLeft,
            opacity: brushOpacity,
            background: 'linear-gradient(180deg, transparent, var(--emk-ink), transparent)',
          }}
          aria-hidden="true"
        />
      </motion.div>

      {/* Sub-label */}
      {line.sub && (
        <motion.span
          className="mt-2 block font-sans font-bold tracking-[0.4em]"
          style={{ opacity: subOpacity, color: 'var(--emk-gold)', fontSize: 'clamp(0.62rem, 2vw, 0.95rem)' }}
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
            color: 'color-mix(in srgb, var(--emk-ink) 72%, transparent)',
            fontSize: 'clamp(0.82rem, 2.3vw, 1.1rem)',
            lineHeight: 1.6,
          }}
        >
          {line.translation}
        </motion.p>
      )}
    </div>
  );
}

export function SceneText({ scene, clock, sceneStart = 0, reduced = false }) {
  return (
    <div className="relative z-20 flex flex-col items-center gap-[3.5vh] px-6">
      {scene.lines.map((line) => (
        <Line key={line.id} line={line} clock={clock} sceneStart={sceneStart} reduced={reduced} />
      ))}
    </div>
  );
}

export default SceneText;
