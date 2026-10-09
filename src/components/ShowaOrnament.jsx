// ─────────────────────────────────────────────────────────────────────────────
// ShowaOrnament — hiasan khas era Shōwa 昭和 di Home (bagian 日本語学園).
//
// Sejarah (docs/tema/showa.md §6): "昭和 = コンクリートの時代" — zaman beton.
// Kota pasca-perang dicor ulang dari abu; langitnya penuh 架線 kabel menggantung.
// Tiga sosok paling khas zaman itu jadi hiasan, bukan tempelan generik:
//   • 電柱＋架線 denchū (ShowaDenchu) — tiang beton + kabel menggantung. KINETIK:
//     kabel bergoyang ikut momentum scroll. Ini analog LANGSUNG 提灯 (Edo) /
//     瓦斯灯 (Meiji) — benda gantung yang berayun — tapi medianya LISTRIK & BETON.
//     Tangga material: lilin → gas → listrik. Ayunan PALING BERAT (spring kaku,
//     rotasi ≤4°; 提灯 11°, 瓦斯灯 6°). Malam 夜の団地 lampu sodium menyala.
//   • 看板 kanban (ShowaKanban) — papan toko 商店街: plat logam, huruf grotesk
//     tebal (Inter 900), bukan serif ukir. Tanda "jalan belanja pasca-perang".
//   • 東京タワー Tōkyō Tawā (ShowaTower) — menara 1958, siluet rangka merah-putih.
//     Simbol pemulihan. Struktur/bangunan → aman digambar (bukan karya seni).
//
// HANYA tampil di era Shōwa (di-gate CSS: .showa-ornament). Era lain tak
// tersentuh. Dekoratif → aria-hidden + pointer-events:none. Reduced-motion →
// kabel diam.
//
// ⚠️ HAK CIPTA (docs/tema/showa.md §6.4): 太陽の塔 (Okamoto Tarō) TIDAK dipakai
//    di sini — hanya siluet di scene 万博. Gōjira (Tōhō) DILARANG.
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

// 電柱＋架線 — tiang beton TINGGI (berdiri di tanah, tak ngapung) + kabel
// panjang menjuntai menyeberang hero sampai dekat logo 学. Kabel bergoyang ikut
// scroll. Kabel = kurva catenary (melengkung karena berat sendiri), bukan lurus.
export function ShowaDenchu({ className = '' }) {
  const reduced = usePrefersReducedMotion();
  const glowId = `showa-denchu-glow-${useId().replace(/:/g, '')}`;
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  // Tiang beton = paling berat dari semua ornamen (提灯 120, 瓦斯灯 90) → spring kaku.
  const smooth = useSpring(velocity, { stiffness: 140, damping: 20, mass: 1.6 });
  // Hanya KABEL yang berayun (tiang diam, berdiri di tanah). Origin = puncak
  // tiang → kabel bergoyang seperti kabel nyata yang terikat di tiang.
  // Amplitudo dijaga kecil (≤1.6°) supaya ujung kiri kabel — yang diikat ke
  // kotak 学 — tidak lepas dari logo saat bergoyang.
  const rotate = useTransform(smooth, (v) => {
    if (reduced) return 0;
    const t = Math.max(-1, Math.min(1, v / 1800));
    return t * 1.6;   // ≤1.6° — paling redam (kabel beton, bukan kertas)
  });

  return (
    <div className={`showa-ornament showa-denchu ${className}`} aria-hidden="true">
      <motion.svg
        viewBox="0 0 1440 560"
        role="presentation"
        focusable="false"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,214,130,0.5)" />
            <stop offset="60%" stopColor="rgba(224,176,80,0.2)" />
            <stop offset="100%" stopColor="rgba(224,176,80,0)" />
          </radialGradient>
        </defs>

        {/* Halo lampu sodium — menyala hanya saat malam 夜の団地 (di-gate CSS). */}
        <circle className="showa-denchu-glow" cx="1430" cy="74" r="30" fill={`url(#${glowId})`} />

        {/* 架線 kabel panjang — menjuntai dari tiang (kanan) menyeberang hero
            dan BERPANGKAL di dalam kotak logo 学 (kiri), bukan menggantung di
            ruang kosong. Ujung kiri sengaja ditanam SEDIKIT MASUK ke dalam kotak
            logo (kotak logo z-20 > kabel z-15) → kabel seolah keluar dari logo
            dan tetap "nyambung" walau kabel bergoyang (ayun ≤1.0°, lihat rotate). */}
        <motion.g className="showa-denchu-cables" style={{ rotate, transformOrigin: '1397px 62px' }}>
          <path className="showa-denchu-cable" vectorEffect="non-scaling-stroke" d="M1332 62 C 900 226, 360 230, 132 90" />
          <path className="showa-denchu-cable" vectorEffect="non-scaling-stroke" d="M1348 94 C 980 262, 400 266, 140 96" />
          <path className="showa-denchu-cable" vectorEffect="non-scaling-stroke" d="M1402 60 C 1080 184, 680 196, 148 102" />
        </motion.g>

        {/* Tiang beton — TINGGI & berdiri di tanah (sampai tepi bawah hero). */}
        <path className="showa-denchu-pole" d="M1387 0 L1407 0 L1413 560 L1381 560 Z" />

        {/* Dua palang 腕金 (crossarm) + insulator */}
        <rect className="showa-denchu-arm" x="1330" y="60" width="108" height="5" />
        <rect className="showa-denchu-arm" x="1346" y="92" width="74" height="4" />
        <circle className="showa-denchu-insulator" cx="1334" cy="62.5" r="2" />
        <circle className="showa-denchu-insulator" cx="1434" cy="62.5" r="2" />
        <circle className="showa-denchu-insulator" cx="1350" cy="94" r="2" />

        {/* Lampu jalan sodium di ujung palang */}
        <path className="showa-denchu-lamp-arm" vectorEffect="non-scaling-stroke" d="M1420 62 L1430 70" />
        <rect className="showa-denchu-lamp" x="1422" y="70" width="16" height="9" rx="1" />
        <rect className="showa-denchu-lamp-glass" x="1424" y="79" width="12" height="3.5" rx="0.5" />
      </motion.svg>
    </div>
  );
}

// 看板 — papan toko 商店街: plat logam, huruf grotesk tebal.
export function ShowaKanban({ label = '商店街', className = '' }) {
  // Kanji ditaruh sebagai array supaya bisa 2 baris bila perlu.
  const glyphs = [...label].slice(0, 3);
  return (
    <div className={`showa-ornament showa-kanban ${className}`} aria-hidden="true">
      <svg viewBox="0 0 96 56" role="presentation" focusable="false">
        {/* Plat logam (sudut tajam, bukan kayu ukir) */}
        <rect className="showa-kanban-plate" x="1" y="1" width="94" height="54" rx="1" />
        {/* Bingkai dalam (garis tipis) */}
        <rect className="showa-kanban-frame" x="6" y="6" width="84" height="44" rx="0.5" />
        {/* Baut sudut */}
        <circle className="showa-kanban-bolt" cx="10" cy="10" r="1.4" />
        <circle className="showa-kanban-bolt" cx="86" cy="10" r="1.4" />
        <circle className="showa-kanban-bolt" cx="10" cy="46" r="1.4" />
        <circle className="showa-kanban-bolt" cx="86" cy="46" r="1.4" />
        {/* Kanji besar — grotesk tebal, spasi lebar seperti papan reklame */}
        {glyphs.map((k, i) => (
          <text
            key={k}
            className="showa-kanban-text"
            x={48 + (i - (glyphs.length - 1) / 2) * 26}
            y="30"
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

// 東京タワー — menara 1958, siluet rangka merah-putih. Berdiri di panel hero.
export function ShowaTower({ className = '' }) {
  const bandId = `showa-tower-body-${useId().replace(/:/g, '')}`;
  // Pita merah-putih khas 東京タワー (selang-seling horizontal).
  const bands = [18, 34, 50, 66, 82];
  return (
    <div className={`showa-ornament showa-tower ${className}`} aria-hidden="true">
      <svg viewBox="0 0 80 210" role="presentation" focusable="false">
        <defs>
          <clipPath id={bandId}>
            <path d="M40 12 L47 104 L33 104 Z" />
          </clipPath>
        </defs>
        {/* Kaki 4 menyilang (rangka bawah) */}
        <path className="showa-tower-leg" d="M40 100 L6 204" />
        <path className="showa-tower-leg" d="M40 100 L74 204" />
        <path className="showa-tower-leg" d="M40 100 L18 204" />
        <path className="showa-tower-leg" d="M40 100 L62 204" />
        {/* Silang pengaku (bracing) */}
        <path className="showa-tower-brace" d="M12 186 L68 156" />
        <path className="showa-tower-brace" d="M68 186 L12 156" />
        <path className="showa-tower-brace" d="M20 148 L60 124" />
        <path className="showa-tower-brace" d="M60 148 L20 124" />
        <path className="showa-tower-brace" d="M26 118 L54 100" />
        <path className="showa-tower-brace" d="M54 118 L26 100" />
        {/* Badan menara (meruncing) + pita merah-putih */}
        <path className="showa-tower-body" d="M40 12 L47 104 L33 104 Z" />
        <g clipPath={`url(#${bandId})`}>
          {bands.map((y) => (
            <rect key={y} className="showa-tower-band" x="30" y={y} width="20" height="6" />
          ))}
        </g>
        {/* Dek observasi (2 tingkat) */}
        <rect className="showa-tower-deck" x="27" y="96" width="26" height="5" rx="0.5" />
        <rect className="showa-tower-deck" x="32" y="72" width="16" height="4" rx="0.5" />
        {/* Antena puncak */}
        <rect className="showa-tower-mast" x="39" y="0" width="2" height="14" />
        <circle className="showa-tower-beacon" cx="40" cy="0" r="1.8" />
      </svg>
    </div>
  );
}

export default ShowaDenchu;
