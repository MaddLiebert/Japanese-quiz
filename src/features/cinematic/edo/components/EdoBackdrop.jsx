// ─────────────────────────────────────────────────────────────────────────────
// EdoBackdrop — KERTAS WASHI (ukiyo-e) + bokashi + kabut kedalaman + grain.
// Dipakai SEMUA scene Edo sebagai dasar; tiap scene menambah lapisan sendiri.
// Warna pakai token cinematic --edk-* (kertas tetap "benda fisik" di kedua tema).
// `mood` menggeser kepekatan & rona: 'market' | 'print' | 'night' | 'festival'.
//
// BAHASA RUPA = UKIYO-E, bukan "blok datar + noise":
//   • SERAT WASHI  — garis serat kertas terlihat (bukan cuma noise halus), warna
//                    kertas hangat, sedikit tidak rata.
//   • BOKASHI      — gradien disapu tangan di langit/tepi (tanda tangan Hokusai).
//   • KABUT LAPIS  — siluet gunung jauh + kabut tipis memberi KEDALAMAN
//                    (foreground/middle/background), bukan horizon kosong.
//   • MISREGISTRASI — pelat indigo & vermilion bergeser pelan dari tinta.
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const MOOD = {
  market:   { vignette: 0.30, wash: 0.06, tint: 'rgba(30,79,121,0.06)',  haze: 0.16, mist: 'rgba(244,236,216,0.34)' },
  print:    { vignette: 0.28, wash: 0.10, tint: 'rgba(28,27,26,0.05)',  haze: 0.12, mist: 'rgba(244,236,216,0.30)' },
  /* Malam 夜市: indigo pekat + kolam cahaya 提灯 HANGAT (bukan abu dingin). */
  night:    { vignette: 0.62, wash: 0.16, tint: 'rgba(10,15,30,0.42)',  haze: 0.30, mist: 'rgba(120,140,180,0.18)' },
  festival: { vignette: 0.46, wash: 0.14, tint: 'rgba(192,57,43,0.10)', haze: 0.20, mist: 'rgba(244,220,200,0.26)' },
};

// Serat washi: garis serat halus + noise. Dua lapis → kertas terasa "berserat",
// bukan bidang polos. (baseFrequency rendah = serat panjang; tinggi = bintik.)
const WASHI_FIBER = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='fib'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012 0.42' numOctaves='3' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23fib)' opacity='0.10'/%3E%3C/svg%3E")`;
const WASHI_GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23f)' opacity='0.05'/%3E%3C/svg%3E")`;

export function EdoBackdrop({ mood = 'market', clock, reduced = false }) {
  const m = MOOD[mood] || MOOD.market;

  // Registrasi cetak: pelat warna bergeser sangat pelan (offset kecil, bolak-balik).
  const regX = useTransform(clock, (t) => (reduced ? 0 : Math.sin((t / 22) * Math.PI * 2) * 7));
  const regY = useTransform(clock, (t) => (reduced ? 0 : Math.cos((t / 27) * Math.PI * 2) * 5));
  // Kabut kedalaman bergeser lebih lambat (parallax) → terasa jauh.
  const mistX = useTransform(clock, (t) => (reduced ? 0 : Math.sin((t / 34) * Math.PI * 2) * 14));

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Kertas washi — SERAT + grain (dua lapis) supaya terasa berserat, bukan polos */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'var(--edk-paper)',
          backgroundImage: `${WASHI_FIBER}, ${WASHI_GRAIN}`,
        }}
      />
      {/* Bokashi dasar: tepi lebih gelap, tengah terang (sapuan tangan) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(30,79,121,0.10) 0%, transparent 22%, transparent 78%, rgba(120,86,44,0.10) 100%)',
        }}
      />

      {/* KABUT KEDALAMAN: siluet gunung jauh (bokashi indigo) + kabut tipis.
          Memberi lapisan background → horizon tidak kosong. */}
      <motion.div className="absolute inset-x-0 bottom-0" style={{ height: '58%', x: mistX }}>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${m.mist} 62%, ${m.mist} 100%)`,
            maskImage: 'linear-gradient(180deg, transparent 0%, #000 30%)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 30%)',
          }}
        />
        {/* dua baris siluet gunung, makin jauh makin pucat (kedalaman) */}
        <svg viewBox="0 0 1440 300" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 w-full" style={{ height: '70%' }}>
          <path
            d="M0 190 L150 110 L280 168 L420 96 L560 172 L700 120 L860 186 L1010 118 L1160 178 L1300 130 L1440 190 L1440 300 L0 300 Z"
            fill="var(--edk-ai)" opacity={m.haze * 0.7}
          />
          <path
            d="M0 232 L170 176 L330 220 L500 164 L660 224 L820 178 L980 228 L1140 180 L1300 226 L1440 190 L1440 300 L0 300 Z"
            fill="var(--edk-ai)" opacity={m.haze}
          />
        </svg>
      </motion.div>

      {/* Blok warna datar bergeser (registrasi cetak) */}
      <motion.div
        className="absolute"
        style={{
          inset: '-10%',
          x: regX,
          y: regY,
          background: `radial-gradient(60% 55% at 30% 36%, color-mix(in srgb, var(--edk-ink) ${Math.round(m.wash * 100)}%, transparent) 0%, transparent 70%),
                       radial-gradient(58% 60% at 76% 70%, color-mix(in srgb, var(--edk-ai) ${Math.round(m.wash * 90)}%, transparent) 0%, transparent 72%)`,
        }}
      />

      {/* Rona mood (indigo pasar / gelap malam / merah festival) */}
      <div className="absolute inset-0" style={{ background: m.tint }} />

      {/* Malam 夜市: kolam cahaya 提灯 hangat dari beberapa titik + langit indigo.
          Inilah yang membuat "malam Edo" — bukan sekadar menurunkan kecerahan. */}
      {mood === 'night' && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(38% 34% at 26% 30%, rgba(240,190,78,0.22) 0%, transparent 72%),' +
              'radial-gradient(30% 30% at 72% 24%, rgba(240,190,78,0.17) 0%, transparent 74%),' +
              'radial-gradient(46% 40% at 50% 88%, rgba(232,100,63,0.14) 0%, transparent 76%),' +
              'linear-gradient(180deg, rgba(10,15,30,0.34) 0%, rgba(8,11,20,0.10) 60%, rgba(8,11,20,0.42) 100%)',
          }}
        />
      )}

      {/* Grain cetakan (bintik tinta) — tanda khas ukiyo-e */}
      <div
        className="absolute inset-0"
        style={{
          opacity: mood === 'night' ? 0.30 : 0.44,
          mixBlendMode: 'multiply',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='170' height='170'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='170' height='170' filter='url(%23g)' opacity='0.16'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette — fokus ke tengah, nuansa sinematik */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at center, transparent 42%, rgba(14,12,10,${m.vignette}) 100%)` }}
      />

      {/* Tepi gelap (bingkai layar) */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(14,12,10,0.30) 0%, transparent 12%, transparent 88%, rgba(14,12,10,0.30) 100%)' }}
      />
    </div>
  );
}

export default EdoBackdrop;
