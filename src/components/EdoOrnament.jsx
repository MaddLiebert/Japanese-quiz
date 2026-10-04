// ─────────────────────────────────────────────────────────────────────────────
// EdoOrnament — hiasan khas era Edo 江戸 di Home (bagian 日本語学園).
//
// Sejarah (docs/tema/edo.md §1): "昼は市、夜は提灯" — siang pasar, malam lentera.
// Dua sosok paling mencolok zaman Edo dijadikan hiasan, bukan tempelan generik:
//   • 提灯 chochin (EdoLantern) — lentera gantung. Berayun seperti BANDUL saat
//     scroll: kecepatan scroll → useSpring → rotasi kecil di titik gantung tali.
//     Geraknya jadi ber-momentum & mereda sendiri (bandul nyata), bukan animasi
//     lucu yang "slop". Malam 夜市 menyala hangat (glow 金); siang kertas polos.
//   • 暖簾 noren (EdoNoren) — tirai toko chōnin: tanda "siang pasar". Panel kain
//     indigo 藍 ber-kanji 江戸市.
//
// HANYA tampil di era Edo (di-gate CSS: .edo-ornament). Era lain tak tersentuh.
// Dekoratif → aria-hidden + pointer-events:none. Reduced-motion → lentera diam.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useId, useState } from 'react';
import { motion, useScroll, useVelocity, useSpring, useTransform } from 'motion/react';

// Hormati prefers-reduced-motion (WCAG 2.1): tanpa ini, hiasan bergerak terus
// di pengguna yang minta gerak minimal.
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

// Bentuk badan lentera (barrel 提灯) — dipakai badan + clip rusuk bambu.
const CHOCIN_BODY = 'M21 24 C9 39 9 86 21 100 L39 100 C51 86 51 39 39 24 Z';

// 提灯 — lentera gantung yang berayun mengikuti momentum scroll.
export function EdoLantern({ kanji = '学', className = '' }) {
  const reduced = usePrefersReducedMotion();
  // useId() bisa memuat ':' (tak sah untuk url(#id)) → bersihkan.
  const clipId = `edo-chochin-${useId().replace(/:/g, '')}`;
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  // Spring → ayunan mereda sendiri seperti bandul, bukan ikut berhenti mendadak.
  const smooth = useSpring(velocity, { stiffness: 120, damping: 14, mass: 1 });
  const rotate = useTransform(smooth, (v) => {
    if (reduced) return 0;
    const t = Math.max(-1, Math.min(1, v / 1400));
    return t * 11;
  });

  const ribs = Array.from({ length: 14 }, (_, i) => 30 + i * 5);

  return (
    <div className={`edo-ornament edo-lantern ${className}`} aria-hidden="true">
      <motion.svg
        viewBox="0 0 60 116"
        role="presentation"
        focusable="false"
        style={{ rotate, transformOrigin: '50% 0%' }}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={CHOCIN_BODY} />
          </clipPath>
        </defs>

        {/* Halo hangat — menyala hanya saat malam 夜市 (di-gate CSS). */}
        <ellipse className="edo-lantern-glow" cx="30" cy="64" rx="29" ry="45" />

        {/* Tali gantung */}
        <line className="edo-lantern-rope" x1="30" y1="0" x2="30" y2="18" />

        {/* Penutup atas (kayu) */}
        <rect className="edo-lantern-cap" x="19" y="16" width="22" height="7" rx="1.5" />

        {/* Badan lentera + rusuk bambu */}
        <path className="edo-lantern-body" d={CHOCIN_BODY} />
        <g clipPath={`url(#${clipId})`}>
          {ribs.map((y) => (
            <line key={y} className="edo-lantern-rib" x1="4" y1={y} x2="56" y2={y} />
          ))}
        </g>

        {/* Kanji 朱 */}
        <text className="edo-lantern-kanji" x="30" y="64" textAnchor="middle" dominantBaseline="central">
          {kanji}
        </text>

        {/* Penutup bawah (kayu) */}
        <rect className="edo-lantern-cap" x="19" y="100" width="22" height="7" rx="1.5" />
      </motion.svg>
    </div>
  );
}

// 暖簾 — tirai toko chōnin: tanda "siang pasar".
export function EdoNoren({ className = '' }) {
  const panels = ['江', '戸', '市'];
  return (
    <div className={`edo-ornament edo-noren ${className}`} aria-hidden="true">
      <svg viewBox="0 0 96 68" role="presentation" focusable="false">
        {/* Batang gantung */}
        <rect className="edo-noren-rod" x="0" y="2" width="96" height="4" rx="2" />
        {/* Panel kain indigo */}
        {panels.map((k, i) => (
          <rect key={k} className="edo-noren-panel" x={2 + i * 31} y="7" width="29" height="58" rx="1" />
        ))}
        {/* Kanji krem */}
        {panels.map((k, i) => (
          <text
            key={k}
            className="edo-noren-kanji"
            x={16.5 + i * 31}
            y="40"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {k}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default EdoLantern;
