// ─────────────────────────────────────────────────────────────────────────────
// MeijiBackdrop — KERTAS KORAN (newsprint) + halftone + misprint registrasi.
// Dipakai SEMUA scene Meiji sebagai dasar; tiap scene menambah lapisan sendiri.
// Warna pakai token cinematic --mdk-* (kertas = benda fisik di tiap tema).
// `mood` menggeser kepekatan & rona: 'port' | 'city' | 'press' | 'school' | 'diet'.
//
// BAHASA RUPA = LETTERPRESS / SURAT KABAR, bukan ukiyo-e, bukan blok datar:
//   • KERTAS KORAN — serat halus + grain tinta (abu-krem, bukan washi hangat).
//   • HALFTONE      — bintik cetak (dot) di atas blok warna = tanda koran.
//   • MISREGISTRASI — pelat renga & ai bergeser TIPIS dari tinta (chromatic
//                     misprint), bukan drop-shadow. Ini satu-satunya "offset".
//   • GARIS ATURAN  — horizon dibentuk garis aturan (rule), bukan siluet gunung.
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const MOOD = {
  port:   { vignette: 0.34, wash: 0.07, tint: 'rgba(47,79,107,0.06)',  haze: 0.16, mist: 'rgba(231,226,212,0.34)' },
  city:   { vignette: 0.30, wash: 0.08, tint: 'rgba(155,74,60,0.07)',  haze: 0.12, mist: 'rgba(231,226,212,0.30)' },
  press:  { vignette: 0.28, wash: 0.11, tint: 'rgba(20,20,20,0.05)',   haze: 0.10, mist: 'rgba(231,226,212,0.28)' },
  /* Gaslight 瓦斯灯の夜: latar gelap hangat + kolam cahaya amber. */
  night:  { vignette: 0.62, wash: 0.16, tint: 'rgba(12,13,10,0.42)',   haze: 0.28, mist: 'rgba(120,110,90,0.18)' },
  school: { vignette: 0.26, wash: 0.07, tint: 'rgba(79,107,70,0.06)',  haze: 0.10, mist: 'rgba(231,226,212,0.30)' },
  diet:   { vignette: 0.42, wash: 0.12, tint: 'rgba(155,74,60,0.10)',  haze: 0.18, mist: 'rgba(226,214,196,0.26)' },
};

// Serat kertas koran: garis serat halus + grain tinta (dua lapis).
const PAPER_FIBER = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='fib'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.014 0.5' numOctaves='3' seed='11' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='320' height='320' filter='url(%23fib)' opacity='0.09'/%3E%3C/svg%3E")`;
const PAPER_GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='170' height='170'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='170' height='170' filter='url(%23f)' opacity='0.06'/%3E%3C/svg%3E")`;

// Halftone: bintik cetak (radial-gradient berulang) — tanda khas koran.
const HALFTONE = 'radial-gradient(rgba(20,20,20,0.5) 0.6px, transparent 1.1px)';

export function MeijiBackdrop({ mood = 'city', clock, reduced = false }) {
  const m = MOOD[mood] || MOOD.city;

  // Misregistrasi cetak: pelat warna bergeser SANGAT tipis (chromatic misprint).
  const regX = useTransform(clock, (t) => (reduced ? 0 : Math.sin((t / 24) * Math.PI * 2) * 3.2));
  const regY = useTransform(clock, (t) => (reduced ? 0 : Math.cos((t / 29) * Math.PI * 2) * 2.2));
  const mistX = useTransform(clock, (t) => (reduced ? 0 : Math.sin((t / 34) * Math.PI * 2) * 12));

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Kertas koran — serat + grain */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--mdk-paper)', backgroundImage: `${PAPER_FIBER}, ${PAPER_GRAIN}` }}
      />
      {/* Garis aturan tipis horizontal (kolom koran) — struktur, bukan bayangan */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(180deg, rgba(20,20,20,0.05) 0 1px, transparent 1px 26px)',
          opacity: 0.5,
        }}
      />
      {/* Bokashi tepi: sedikit lebih gelap di atas/bawah (sapuan tipis) */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(20,20,20,0.06) 0%, transparent 20%, transparent 80%, rgba(120,86,44,0.07) 100%)' }}
      />

      {/* KABUT KEDALAMAN: garis aturan horizon + kabut tipis (bukan siluet gunung) */}
      <motion.div className="absolute inset-x-0 bottom-0" style={{ height: '52%', x: mistX }}>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${m.mist} 64%, ${m.mist} 100%)`,
            maskImage: 'linear-gradient(180deg, transparent 0%, #000 32%)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 32%)',
          }}
        />
        <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 w-full" style={{ height: '62%' }}>
          {[70, 120, 168].map((y, i) => (
            <line key={i} x1="0" y1={y} x2="1440" y2={y}
                  stroke="var(--mdk-ai)" strokeWidth={i === 0 ? 1 : 2} opacity={m.haze * (0.5 + i * 0.3)} />
          ))}
        </svg>
      </motion.div>

      {/* Blok warna datar bergeser (misprint renga & ai dari tinta) */}
      <motion.div
        className="absolute"
        style={{
          inset: '-8%',
          x: regX,
          y: regY,
          background: `radial-gradient(58% 54% at 30% 34%, color-mix(in srgb, var(--mdk-renga) ${Math.round(m.wash * 100)}%, transparent) 0%, transparent 70%),
                       radial-gradient(56% 58% at 76% 70%, color-mix(in srgb, var(--mdk-ai) ${Math.round(m.wash * 90)}%, transparent) 0%, transparent 72%)`,
        }}
      />

      {/* Rona mood (renga bata / gelap / hijau sekolah) */}
      <div className="absolute inset-0" style={{ background: m.tint }} />

      {/* Malam 瓦斯灯の夜: kolam cahaya gaslight amber + langit gelap hangat */}
      {mood === 'night' && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(36% 32% at 28% 32%, rgba(240,200,90,0.22) 0%, transparent 72%),' +
              'radial-gradient(30% 30% at 72% 26%, rgba(240,200,90,0.17) 0%, transparent 74%),' +
              'radial-gradient(46% 40% at 50% 88%, rgba(199,107,88,0.14) 0%, transparent 76%),' +
              'linear-gradient(180deg, rgba(12,13,10,0.34) 0%, rgba(10,11,8,0.10) 60%, rgba(10,11,8,0.42) 100%)',
          }}
        />
      )}

      {/* HALFTONE — bintik cetak koran di atas blok warna */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: HALFTONE,
          backgroundSize: '6px 6px',
          opacity: mood === 'night' ? 0.14 : 0.22,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Grain cetakan (bintik tinta) */}
      <div
        className="absolute inset-0"
        style={{
          opacity: mood === 'night' ? 0.28 : 0.40,
          mixBlendMode: 'multiply',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='170' height='170'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='170' height='170' filter='url(%23g)' opacity='0.16'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette — fokus ke tengah */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, transparent 42%, rgba(12,10,8,${m.vignette}) 100%)` }} />

      {/* Tepi gelap (bingkai layar) */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(12,10,8,0.30) 0%, transparent 12%, transparent 88%, rgba(12,10,8,0.30) 100%)' }} />
    </div>
  );
}

export default MeijiBackdrop;
