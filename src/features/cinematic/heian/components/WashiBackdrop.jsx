// ─────────────────────────────────────────────────────────────────────────────
// WashiBackdrop — kertas washi + noda tinta (ink wash) + vignette.
// Dipakai SEMUA scene sebagai dasar, lalu tiap scene menambah lapisan sendiri.
// Warna pakai token cinematic --emk-* (kertas tetap terang di kedua tema, karena
// gulungan adalah benda fisik). `mood` menggeser kepekatan: 'calm' | 'court' |
// 'kana' | 'dark' (scene 4 jadi lebih gelap).
//
// Noda tinta "bernafas" sangat pelan (skala + geser dari `clock`) supaya kertas
// terasa hidup, bukan gambar diam.
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const MOOD = {
  calm: { wash: 0.10, vignette: 0.34 },
  court: { wash: 0.08, vignette: 0.30 },
  kana: { wash: 0.06, vignette: 0.26 },
  dark: { wash: 0.22, vignette: 0.58 },
};

export function WashiBackdrop({ mood = 'calm', clock, reduced = false }) {
  const m = MOOD[mood] || MOOD.calm;

  // Napas pelan: skala 1.0 ↔ 1.035 dan geser halus (periode ~24 dtk).
  const washScale = useTransform(clock, (t) => {
    if (reduced) return 1;
    return 1 + 0.0175 * (1 + Math.sin((t / 24) * Math.PI * 2));
  });
  const washX = useTransform(clock, (t) => (reduced ? 0 : Math.sin((t / 30) * Math.PI * 2) * 12));
  const washY = useTransform(clock, (t) => (reduced ? 0 : Math.cos((t / 26) * Math.PI * 2) * 8));

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Kertas washi — serat halus */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'var(--emk-paper)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23f)' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Noda tinta (ink wash) — melebar pelan seperti tinta diserap kertas */}
      <motion.div
        className="absolute"
        style={{
          inset: '-15%',
          x: washX,
          y: washY,
          scale: washScale,
          background: `radial-gradient(60% 55% at 32% 38%, color-mix(in srgb, var(--emk-ink) ${Math.round(m.wash * 100)}%, transparent) 0%, transparent 70%),
                       radial-gradient(55% 60% at 74% 68%, color-mix(in srgb, var(--emk-ink) ${Math.round(m.wash * 70)}%, transparent) 0%, transparent 72%)`,
        }}
      />

      {/* Rona menua di sudut (emas samar) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 10% 4%, rgba(196,164,90,0.13) 0%, transparent 46%), radial-gradient(100% 70% at 92% 98%, rgba(154,124,56,0.11) 0%, transparent 50%)',
        }}
      />

      {/* Vignette — fokus ke tengah, nuansa sinematik */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 42%, rgba(20,17,12,${m.vignette}) 100%)`,
        }}
      />

      {/* Tepi sobek / gelap di sisi (bingkai layar) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(20,17,12,0.30) 0%, transparent 12%, transparent 88%, rgba(20,17,12,0.30) 100%)',
        }}
      />
    </div>
  );
}

export default WashiBackdrop;
