// ─────────────────────────────────────────────────────────────────────────────
// MeijiOrnament — hiasan khas era Meiji 明治 di Home (bagian 日本語学園).
//
// Sejarah (docs/tema/meiji.md): "明治 = 活字の時代" — zaman huruf logam. Kota
// baru 銀座 menyala oleh 瓦斯灯 lampu gas; surat kabar dicetak dari 活字 huruf
// lepas. Dua sosok paling khas zaman itu dijadikan hiasan, bukan tempelan generik:
//   • 瓦斯灯 gaslight (MeijiGaslight) — lampu gas jalan Ginza. Berayun seperti
//     BANDUL saat scroll (lebih berat dari 提灯 Edo → amplitudo lebih kecil).
//     Malam 瓦斯灯の夜 menyala hangat (flame + halo amber); siang kaca padam.
//     Ini analog langsung 提灯 chochin milik Edo — lentera gantung, tapi zaman
//     gas, bukan lilin.
//   • 文選 bunsen (MeijiBunsen) — palung penyusun huruf logam: blok 活字
//     ber-kanji di rak kayu. Tanda "zaman huruf cetak".
//
// HANYA tampil di era Meiji (di-gate CSS: .meiji-ornament). Era lain tak
// tersentuh. Dekoratif → aria-hidden + pointer-events:none. Reduced-motion →
// lampu diam.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useId, useState } from 'react';
import { motion, useScroll, useVelocity, useSpring, useTransform } from 'motion/react';

// Hormati prefers-reduced-motion (WCAG 2.1): tanpa ini, hiasan bergerak terus.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduced;
}

// 瓦斯灯 — lampu gas dinding yang berayun mengikuti momentum scroll.
export function MeijiGaslight({ className = '' }) {
  const reduced = usePrefersReducedMotion();
  const glowId = `meiji-gasglow-${useId().replace(/:/g, '')}`;
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  // Lampu gas = logam, lebih berat dari kertas 提灯 → ayunan lebih kecil/redam.
  const smooth = useSpring(velocity, { stiffness: 90, damping: 16, mass: 1.2 });
  const rotate = useTransform(smooth, (v) => {
    if (reduced) return 0;
    const t = Math.max(-1, Math.min(1, v / 1600));
    return t * 6;
  });

  return (
    <div className={`meiji-ornament meiji-gaslight ${className}`} aria-hidden="true">
      <motion.svg
        viewBox="0 0 64 128"
        role="presentation"
        focusable="false"
        style={{ rotate, transformOrigin: '8% 0%' }}
      >
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,210,120,0.55)" />
            <stop offset="60%" stopColor="rgba(240,200,90,0.22)" />
            <stop offset="100%" stopColor="rgba(240,200,90,0)" />
          </radialGradient>
        </defs>

        {/* Halo hangat — menyala hanya saat malam 瓦斯灯の夜 (di-gate CSS). */}
        <circle className="meiji-gaslight-glow" cx="34" cy="60" r="34" fill={`url(#${glowId})`} />

        {/* Braket dinding + lengan besi */}
        <rect className="meiji-gaslight-plate" x="4" y="28" width="6" height="28" rx="1" />
        <path className="meiji-gaslight-arm" d="M10 40 C 20 40 22 34 30 34" />

        {/* Kepala lampu gas */}
        <circle className="meiji-gaslight-finial" cx="34" cy="29" r="2.4" />
        <rect className="meiji-gaslight-crown" x="25" y="32" width="18" height="7" rx="1.5" />

        {/* Rumah kaca segi enam */}
        <path className="meiji-gaslight-glass" d="M28 39 L40 39 L37 80 L31 80 Z" />
        <g className="meiji-gaslight-facets">
          <line x1="34" y1="39" x2="34" y2="80" />
          <line x1="30.5" y1="39" x2="32" y2="80" />
          <line x1="37.5" y1="39" x2="36" y2="80" />
        </g>

        {/* Nyala api gas (siang padam) */}
        <path className="meiji-gaslight-flame" d="M34 52 C 31 58 31 62 34 65 C 37 62 37 58 34 52 Z" />

        {/* Dasar logam */}
        <rect className="meiji-gaslight-base" x="28" y="80" width="12" height="6" rx="1.5" />
        <path className="meiji-gaslight-foot" d="M30 86 L38 86 L40 92 L28 92 Z" />
      </motion.svg>
    </div>
  );
}

// 文選 — palung penyusun huruf logam: blok 活字 di rak kayu.
export function MeijiBunsen({ className = '' }) {
  const GLYPHS = ['明', '治', '活', '字'];
  return (
    <div className={`meiji-ornament meiji-bunsen ${className}`} aria-hidden="true">
      <svg viewBox="0 0 92 60" role="presentation" focusable="false">
        {/* Palung kayu 文選箱 */}
        <rect className="meiji-bunsen-box" x="1" y="1" width="90" height="58" rx="2" />
        <rect className="meiji-bunsen-rail" x="1" y="18" width="90" height="1.4" />
        <rect className="meiji-bunsen-rail" x="1" y="39" width="90" height="1.4" />
        {/* Blok huruf logam (2 baris) */}
        {GLYPHS.map((k, i) => (
          <g key={`a-${k}`}>
            <rect className="meiji-bunsen-type" x={8 + i * 21} y="5" width="18" height="12" rx="1" />
            <text className="meiji-bunsen-kanji" x={17 + i * 21} y="11.5" textAnchor="middle" dominantBaseline="central">{k}</text>
          </g>
        ))}
        {GLYPHS.map((k, i) => (
          <g key={`b-${k}`}>
            <rect className="meiji-bunsen-type" x={8 + i * 21} y="26" width="18" height="12" rx="1" />
            <text className="meiji-bunsen-kanji" x={17 + i * 21} y="32.5" textAnchor="middle" dominantBaseline="central">{'印活字号'[i]}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default MeijiGaslight;
