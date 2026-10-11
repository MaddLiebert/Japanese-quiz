// ─────────────────────────────────────────────────────────────────────────────
// CyberBackdrop — dasar 「常夜」: malam abadi + grid neon + scanline + hujan +
// cahaya kota dari jauh. Dipakai SEMUA scene 電脳 sebagai alas; tiap scene
// menambah lapisan sendiri.
//
// BAHASA RUPA = NEON/KACA/HOLOGRAM, bukan kertas manga (多元), bukan beton
// (Shōwa), bukan letterpress (Meiji), bukan ukiyo-e (Edo), bukan washi (Heian):
//   • 常夜   — hitam biru dalam, BUKAN putih. Langit tanpa bintang terang.
//   • GRID   — grid cyan hairline (kota digital).
//   • SCANLINE— garis horizontal tipis (layar CRT) — STATIS, transform-only.
//   • HUJAN  — garis miring tipis bergerak (transform, bukan background-pos).
//   • GLOW   — cahaya kota dari bawah cakrawala (kota besar = langit menyala).
// Semua token cinematic --cy-* (night, panel, cyan, kin, shu, haze, steel).
//
// `mood` menggeser rona & kepekatan: neon | peak | endless.
// ⚠️ Nol backdrop-filter; semua gerak pakai transform/opacity (murah).
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const MOOD = {
  // neon: kota hidup malam — paling "menyala", cyan dominan.
  neon:    { vignette: 0.55, haze: 0.16, glow: 'rgba(0,240,255,0.16)', kin: 0.05, rain: 0.5, grid: 0.5 },
  // peak 頂: puncak peradaban — paling terang & padat, hologram di mana-mana.
  peak:    { vignette: 0.42, haze: 0.22, glow: 'rgba(0,240,255,0.24)', kin: 0.10, rain: 0.35, grid: 0.62 },
  // endless 終: daya turun — paling gelap & lapang, hampir padam.
  endless: { vignette: 0.78, haze: 0.10, glow: 'rgba(0,240,255,0.06)', kin: 0.02, rain: 0.7, grid: 0.32 },
};

const GRID =
  'linear-gradient(rgba(0,240,255,0.05) 1px, transparent 1px),' +
  'linear-gradient(90deg, rgba(0,240,255,0.05) 1px, transparent 1px)';

const SCANLINE = 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 1px, transparent 1px 3px)';

export function CyberBackdrop({ mood = 'neon', clock, reduced = false }) {
  const m = MOOD[mood] || MOOD.neon;

  // Geser sangat tipis (kota tak pernah benar-benar diam) — transform only.
  const driftX = useTransform(clock, (t) => (reduced ? 0 : Math.sin((t / 31) * Math.PI * 2) * 3));
  const driftY = useTransform(clock, (t) => (reduced ? 0 : Math.cos((t / 37) * Math.PI * 2) * 2));
  // Hujan: turun terus (loop posisi via modulo waktu) — satu layer, translate3d.
  const rainY = useTransform(clock, (t) => (reduced ? 0 : ((t * 220) % 720)));

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* 常夜 — hitam biru dalam (BUKAN kertas putih) */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #04050A 0%, #060B16 45%, #0A1424 100%)' }} />

      {/* Cahaya kota dari bawah cakrawala (kota besar → langit menyala) */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: '52%', background: `radial-gradient(120% 100% at 50% 100%, ${m.glow} 0%, transparent 68%)` }}
      />

      {/* GRID kota digital — STATIS (transform-only kalau perlu gerak) */}
      <motion.div
        className="absolute"
        style={{ inset: '-8%', x: driftX, y: driftY, backgroundImage: GRID, backgroundSize: '46px 46px', opacity: m.grid }}
      />

      {/* Hujan neon — garis miring tipis, bergerak turun */}
      <motion.svg
        viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full" style={{ opacity: 0.22 * m.rain, y: rainY }}
      >
        {Array.from({ length: 90 }, (_, i) => {
          const x = (i * 137) % 1440;
          const y = (i * 91) % 720;
          return <line key={i} x1={x} y1={y} x2={x - 12} y2={y + 40} stroke="var(--cy-cyan)" strokeWidth={i % 4 === 0 ? 1.6 : 0.9} opacity={0.5} />;
        })}
      </motion.svg>

      {/* Haze cyan di horizon (kedalaman kota) */}
      <div className="absolute inset-x-0" style={{ top: '38%', height: '26%', background: `linear-gradient(180deg, transparent, rgba(0,240,255,${m.haze}) 55%, transparent)` }} />

      {/* Kin 黄 — pantulan papan reklame hangat (kontras dingin) */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(38% 30% at 78% 62%, rgba(255,226,58,${m.kin}) 0%, transparent 72%)` }} />

      {/* SCANLINE layar CRT — STATIS */}
      <div className="absolute inset-0" style={{ backgroundImage: SCANLINE, opacity: 0.5 }} />

      {/* Vignette dalam (malam menelan pinggir) */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(120% 100% at 50% 46%, transparent 42%, rgba(2,3,6,${m.vignette}) 100%)` }} />
    </div>
  );
}

export default CyberBackdrop;
