// ─────────────────────────────────────────────────────────────────────────────
// ShowaBackdrop — BETON 打ちっぱなし + grain + halftone + kabut debu.
// Dipakai SEMUA scene Shōwa sebagai dasar; tiap scene menambah lapisan sendiri.
// Warna pakai token cinematic --sk-* (beton, tinta, sodium, shu, kinari).
// `mood` menggeser kepekatan & rona: 'ruins' | 'yamichi' | 'danchi' | 'city' | 'expo'.
//
// BAHASA RUPA = BETON & ABU, bukan ukiyo-e (Edo), bukan letterpress (Meiji),
// bukan washi (Heian):
//   • BETON   — permukaan rata dengan bintik aggregate + garis bekas cetakan
//               (formwork) → 打ちっぱなし. Sudut tajam, TANPA glossy.
//   • DEBU    — kabut abu tipis di horizon (kota pasca-perang), bukan bokashi kuas.
//   • HALFTONE— bintik cetak (warisan Meiji, benang merah cetak) di atas blok.
//   • GRAIN   — bintik beton (aggregate) menyeluruh, sudut keras.
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const MOOD = {
  // 焼け跡: rata jadi abu — paling kelam, abu dingin, debu tebal.
  ruins:  { vignette: 0.66, wash: 0.14, tint: 'rgba(58,58,54,0.34)',   haze: 0.30, mist: 'rgba(150,146,136,0.22)' },
  // 闇市: malam pasar gelap — hangat samar (bohlam), gelap.
  yamichi:{ vignette: 0.58, wash: 0.12, tint: 'rgba(38,30,22,0.30)',   haze: 0.20, mist: 'rgba(120,104,78,0.20)' },
  // 団地: siang beton terang — bersih, abu netral, sedikit sodium.
  danchi: { vignette: 0.30, wash: 0.08, tint: 'rgba(120,120,116,0.08)',haze: 0.12, mist: 'rgba(196,192,182,0.26)' },
  // city 東京: kota tumbuh — terang, sedikit hangat (sore).
  city:   { vignette: 0.34, wash: 0.10, tint: 'rgba(200,150,70,0.07)', haze: 0.14, mist: 'rgba(210,200,180,0.26)' },
  // expo 万博: masa depan 1970 — paling terang, sentuhan warna (harapan).
  expo:   { vignette: 0.28, wash: 0.12, tint: 'rgba(216,120,90,0.08)', haze: 0.12, mist: 'rgba(226,216,196,0.28)' },
};

// 打ちっぱなし: bintik aggregate beton (dua lapis: halus + kasar).
const CONCRETE_FINE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='c'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23c)' opacity='0.12'/%3E%3C/svg%3E")`;
const CONCRETE_COARSE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='k'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.05 0.09' numOctaves='2' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23k)' opacity='0.07'/%3E%3C/svg%3E")`;

// Halftone: bintik cetak (radial-gradient berulang) — tanda khas cetak.
const HALFTONE = 'radial-gradient(rgba(20,20,20,0.5) 0.6px, transparent 1.1px)';

export function ShowaBackdrop({ mood = 'danchi', clock, reduced = false }) {
  const m = MOOD[mood] || MOOD.danchi;

  // Geser SANGAT tipis blok beton (permukaan tak pernah benar-benar diam).
  const regX = useTransform(clock, (t) => (reduced ? 0 : Math.sin((t / 27) * Math.PI * 2) * 2.6));
  const regY = useTransform(clock, (t) => (reduced ? 0 : Math.cos((t / 31) * Math.PI * 2) * 1.8));
  const dustX = useTransform(clock, (t) => (reduced ? 0 : Math.sin((t / 36) * Math.PI * 2) * 14));

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Beton 打ちっぱなし — dasar abu + bintik aggregate */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--sk-concrete)', backgroundImage: `${CONCRETE_FINE}, ${CONCRETE_COARSE}` }}
      />
      {/* Garis bekas cetakan (formwork) horizontal — struktur beton, bukan bayangan */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(180deg, rgba(20,20,20,0.06) 0 1px, transparent 1px 54px)',
          opacity: 0.55,
        }}
      />
      {/* Sedikit lebih gelap di tepi atas/bawah (beton terkena cahaya dari tengah) */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(20,20,18,0.10) 0%, transparent 22%, transparent 78%, rgba(20,20,18,0.12) 100%)' }}
      />

      {/* KABUT DEBU: garis horizon beton + debu tipis (kota pasca-perang) */}
      <motion.div className="absolute inset-x-0 bottom-0" style={{ height: '54%', x: dustX }}>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${m.mist} 62%, ${m.mist} 100%)`,
            maskImage: 'linear-gradient(180deg, transparent 0%, #000 34%)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 34%)',
          }}
        />
        <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 w-full" style={{ height: '60%' }}>
          {[64, 112, 160].map((y, i) => (
            <line key={i} x1="0" y1={y} x2="1440" y2={y}
                  stroke="var(--sk-sumi)" strokeWidth={i === 0 ? 1 : 2} opacity={m.haze * (0.4 + i * 0.28)} />
          ))}
        </svg>
      </motion.div>

      {/* Blok rona bergeser tipis (sodium / abu / harapan) */}
      <motion.div
        className="absolute"
        style={{
          inset: '-8%',
          x: regX,
          y: regY,
          background: `radial-gradient(56% 52% at 28% 32%, color-mix(in srgb, var(--sk-sodium) ${Math.round(m.wash * 100)}%, transparent) 0%, transparent 70%),
                       radial-gradient(54% 56% at 78% 70%, color-mix(in srgb, var(--sk-sumi) ${Math.round(m.wash * 60)}%, transparent) 0%, transparent 72%)`,
        }}
      />

      {/* Rona mood */}
      <div className="absolute inset-0" style={{ background: m.tint }} />

      {/* 闇市: kolam cahaya bohlam hangat + langit gelap */}
      {mood === 'yamichi' && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(30% 26% at 26% 44%, rgba(240,190,90,0.24) 0%, transparent 74%),' +
              'radial-gradient(26% 26% at 62% 40%, rgba(240,190,90,0.18) 0%, transparent 76%),' +
              'radial-gradient(40% 38% at 50% 92%, rgba(210,120,70,0.12) 0%, transparent 76%),' +
              'linear-gradient(180deg, rgba(14,12,10,0.40) 0%, rgba(12,10,8,0.12) 58%, rgba(10,9,7,0.46) 100%)',
          }}
        />
      )}

      {/* 焼け跡: langit abu dingin + horizon kosong */}
      {mood === 'ruins' && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(96,96,92,0.30) 0%, rgba(140,138,130,0.10) 46%, rgba(60,58,54,0.22) 100%)',
          }}
        />
      )}

      {/* HALFTONE — bintik cetak di atas blok warna */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: HALFTONE,
          backgroundSize: '6px 6px',
          opacity: mood === 'ruins' || mood === 'yamichi' ? 0.14 : 0.20,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Grain beton (aggregate) */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.38,
          mixBlendMode: 'multiply',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)' opacity='0.16'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette — fokus ke tengah */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, transparent 40%, rgba(14,13,11,${m.vignette}) 100%)` }} />

      {/* Tepi gelap (bingkai layar) */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(14,13,11,0.32) 0%, transparent 12%, transparent 88%, rgba(14,13,11,0.32) 100%)' }} />
    </div>
  );
}

export default ShowaBackdrop;
