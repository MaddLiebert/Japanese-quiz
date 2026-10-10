// ─────────────────────────────────────────────────────────────────────────────
// AnimeBackdrop — HALAMAN MANGA 白紙 + grid panel + screentone + garis kecepatan.
// Dipakai SEMUA scene 多元 sebagai dasar; tiap scene menambah lapisan sendiri.
// Warna pakai token cinematic --an-* (shiro, sumi, shu, sora, sakura, gold).
// `mood` menggeser rona & kepekatan:
//   burst | adventure | youth | horror | finale.
//
// BAHASA RUPA = MANGA / CEL-SHADE, bukan beton (Shōwa), bukan letterpress
// (Meiji), bukan ukiyo-e (Edo), bukan washi (Heian):
//   • SHIRO    — kertas halaman manga, lebih putih dari semua era.
//   • PANEL    — grid kotak panel (garis tinta tebal) → bahasa komik.
//   • SCREENTONE— titik halftone cel (bintik cel-shade), bukan halftone cetak.
//   • SPEEDLINE— garis kecepatan radial (manga action).
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const MOOD = {
  // burst 開幕: halaman pecah — terang, bersih, celah cahaya.
  burst:     { vignette: 0.34, wash: 0.10, tint: 'rgba(255,255,255,0.04)',   glow: 'rgba(240,200,98,0.10)', tone: 0.16 },
  // adventure 冒険: dunia shōnen — paling terang & hidup (langit biru).
  adventure: { vignette: 0.28, wash: 0.12, tint: 'rgba(43,108,176,0.06)',    glow: 'rgba(240,200,98,0.12)', tone: 0.14 },
  // youth 青春: olahraga/remaja — hangat (sore), energik.
  youth:     { vignette: 0.30, wash: 0.10, tint: 'rgba(216,120,90,0.07)',    glow: 'rgba(241,139,176,0.10)', tone: 0.16 },
  // horror 怪談: dunia paling gelap — 深夜アニメ, satu lampu.
  horror:    { vignette: 0.62, wash: 0.10, tint: 'rgba(20,22,30,0.34)',      glow: 'rgba(120,140,200,0.08)', tone: 0.26 },
  // finale 最終回: episode terakhir — hangat lalu sepi (senja).
  finale:    { vignette: 0.42, wash: 0.12, tint: 'rgba(107,79,160,0.08)',    glow: 'rgba(240,200,98,0.12)', tone: 0.20 },
};

// Screentone: bintik cel (radial-gradient berulang) — tanda cel-shade.
const SCREENTONE = 'radial-gradient(rgba(20,20,18,0.55) 0.7px, transparent 1.2px)';

// Grid panel: garis tinta tebal (bahasa komik).
const PANEL_GRID =
  'linear-gradient(90deg, rgba(20,20,18,0.10) 0 2px, transparent 2px 100%),' +
  'linear-gradient(0deg, rgba(20,20,18,0.10) 0 2px, transparent 2px 100%)';

export function AnimeBackdrop({ mood = 'burst', clock, reduced = false }) {
  const m = MOOD[mood] || MOOD.burst;

  // Geser SANGAT tipis halaman (kertas tak pernah benar-benar diam).
  const driftX = useTransform(clock, (t) => (reduced ? 0 : Math.sin((t / 29) * Math.PI * 2) * 2.2));
  const driftY = useTransform(clock, (t) => (reduced ? 0 : Math.cos((t / 33) * Math.PI * 2) * 1.6));
  const speedSpin = useTransform(clock, (t) => (reduced ? 0 : (t / 60) * 6));

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* 白紙 shiro — halaman manga (lebih putih dari semua era) */}
      <div className="absolute inset-0" style={{ backgroundColor: 'var(--an-shiro)' }} />

      {/* Grid panel — garis tinta tebal (bahasa komik) */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: PANEL_GRID, backgroundSize: '220px 220px', opacity: 0.5 }}
      />

      {/* Blok rona bergeser tipis (sora / sakura / gold) */}
      <motion.div
        className="absolute"
        style={{
          inset: '-8%',
          x: driftX,
          y: driftY,
          background: `radial-gradient(56% 52% at 26% 30%, ${m.glow} 0%, transparent 70%),
                       radial-gradient(54% 56% at 78% 72%, color-mix(in srgb, var(--an-sora) ${Math.round(m.wash * 100)}%, transparent) 0%, transparent 72%)`,
        }}
      />

      {/* Garis kecepatan radial (manga action) — halus, berputar sangat pelan */}
      <motion.svg
        viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        style={{ opacity: 0.10, rotate: speedSpin }}
      >
        {Array.from({ length: 48 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2;
          const x1 = 720 + Math.cos(a) * 420;
          const y1 = 360 + Math.sin(a) * 420;
          const x2 = 720 + Math.cos(a) * 780;
          const y2 = 360 + Math.sin(a) * 780;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--an-sumi)" strokeWidth={i % 3 === 0 ? 3 : 1.4} />;
        })}
      </motion.svg>

      {/* Rona mood */}
      <div className="absolute inset-0" style={{ background: m.tint }} />

      {/* 怪談: kolam cahaya satu lampu + gelap menyeluruh */}
      {mood === 'horror' && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(26% 30% at 50% 42%, rgba(220,220,235,0.16) 0%, transparent 72%),' +
              'linear-gradient(180deg, rgba(12,12,18,0.46) 0%, rgba(12,12,18,0.20) 52%, rgba(10,10,16,0.52) 100%)',
          }}
        />
      )}

      {/* SCREENTONE — bintik cel di atas blok warna */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: SCREENTONE,
          backgroundSize: '6px 6px',
          opacity: m.tone,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Grain kertas ringan */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.24,
          mixBlendMode: 'multiply',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)' opacity='0.14'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette — fokus ke tengah */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, transparent 42%, rgba(16,16,20,${m.vignette}) 100%)` }} />

      {/* Tepi (bingkai halaman) */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(16,16,20,0.20) 0%, transparent 10%, transparent 90%, rgba(16,16,20,0.20) 100%)' }} />
    </div>
  );
}

export default AnimeBackdrop;
