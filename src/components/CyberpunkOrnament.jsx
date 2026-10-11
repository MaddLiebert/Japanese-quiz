// ─────────────────────────────────────────────────────────────────────────────
// CyberpunkOrnament — hiasan khas era 電脳 CYBERPUNK di Home (日本語学園).
//
// PRD docs/tema/cyberpunk.md §1/§6: 「常夜 = 光だけが残った時代」 — zaman yang
// hanya menyisakan CAHAYA. Satu-satunya era yang bahannya KACA & CAHAYA (lawan
// 多元 yang putih/kertas). Tanda tangan era: hairline + glow + grid + glitch —
// BUKAN beton/offset keras (itu DNA Shōwa).
//
// Tiga sosok jadi hiasan (bukan tempelan generik), sejajar era lain:
//   • 光ファイバーケーブル hikari-faibā kēburu (CyberCable, KINETIK) — kabel
//     serat optik neon menjuntai dari tiang & BERGAYANG ikut momentum scroll.
//     Ini analog LANGSUNG 提灯 (Edo) / 瓦斯灯 (Meiji) / 電柱 (Shōwa) /
//     フィルム (多元) — benda gantung yang berayun — tapi medianya CAHAYA.
//     Ayunan paling DINGIN & presisi (spring kaku, rotasi ≤2.2°).
//   • ホログラム HUD (CyberHud, PANEL) — papan holografik: segel 電脳 + bar
//     telemetri + readout. Sejajar 看板 (Shōwa) / 文選 (Meiji) / コマ割り (多元):
//     panel statis ber-kanji yang menandai "jalan kota".
//   • 電脳塔 dennō-tō (CyberSpire, HERO) — menara antena transmisi 常夜:
//     rangka kisi + dish + cincin gelombang + beacon merah. Berdiri di panel
//     hero. Sejajar 東京タワー (Shōwa) / 多世界の扉 (多元).
//
// HANYA tampil di era 電脳 (di-gate CSS: .cyber-ornament). Era lain tak
// tersentuh. Dekoratif → aria-hidden + pointer-events:none. Reduced-motion →
// kabel diam.
//
// ⚠️ Perf (§6.3/§14): ornamen ini STATIS kecuali rotasi kabel (transform, murah).
//    TIDAK ada animasi background-position. Glow = box-shadow/text-shadow, bukan
//    filter blur full-screen.
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

// 光ファイバーケーブル — kabel serat optik TINGGI menjuntai dari tiang (kanan)
// menyeberang hero sampai dekat logo 学 (kiri). Bergoyang ikut scroll. Kabel =
// kurva catenary (melengkung karena berat sendiri), bukan lurus. Ujung kiri
// ditanam sedikit masuk ke kotak logo → tetap "nyambung" saat bergoyang.
export function CyberCable({ className = '' }) {
  const reduced = usePrefersReducedMotion();
  const glowId = `cyber-cable-glow-${useId().replace(/:/g, '')}`;
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  // Kabel serat optik = gelas, ringan; kota 常夜 = presisi → spring kaku,
  // amplitudo KECIL (≤2.2°) supaya ujung kiri tak lepas dari logo 学.
  const smooth = useSpring(velocity, { stiffness: 150, damping: 18, mass: 1.3 });
  const rotate = useTransform(smooth, (v) => {
    if (reduced) return 0;
    const t = Math.max(-1, Math.min(1, v / 1800));
    return t * 2.2;
  });

  return (
    <div className={`cyber-ornament cyber-cable ${className}`} aria-hidden="true">
      <motion.svg
        viewBox="0 0 1440 560"
        role="presentation"
        focusable="false"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gradien cahaya: cyan (dekat tiang) → kuning (menuju logo). */}
          <linearGradient id={glowId} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(0,240,255,0.85)" />
            <stop offset="55%" stopColor="rgba(0,240,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,226,58,0.45)" />
          </linearGradient>
        </defs>

        {/* Kabel — hanya KABEL yang berayun (tiang diam). Origin = puncak tiang. */}
        <motion.g className="cyber-cable-wires" style={{ rotate, transformOrigin: '1396px 26px' }}>
          {/* Lapis glow lebar (cahaya) + inti terang (serat). */}
          <path className="cyber-cable-glowline" vectorEffect="non-scaling-stroke" d="M1330 30 C 900 214, 360 224, 126 92" />
          <path className="cyber-cable-core"     vectorEffect="non-scaling-stroke" d="M1330 30 C 900 214, 360 224, 126 92" />
          <path className="cyber-cable-glowline" vectorEffect="non-scaling-stroke" d="M1352 62 C 980 250, 400 258, 140 100" />
          <path className="cyber-cable-core"     vectorEffect="non-scaling-stroke" d="M1352 62 C 980 250, 400 258, 140 100" />
          <path className="cyber-cable-glowline" vectorEffect="non-scaling-stroke" d="M1404 30 C 1080 168, 680 180, 150 106" />
          <path className="cyber-cable-core"     vectorEffect="non-scaling-stroke" d="M1404 30 C 1080 168, 680 180, 150 106" />
        </motion.g>

        {/* Node konektor di ujung kiri kabel (di tepi logo) — titik cahaya. */}
        <circle className="cyber-cable-node" cx="132" cy="93" r="3" />
        <circle className="cyber-cable-node" cx="146" cy="101" r="3" />
        <circle className="cyber-cable-node" cx="156" cy="107" r="3" />

        {/* Tiang 電脳塔 (kanan) — rangka kisi, berdiri di tanah. */}
        <path className="cyber-cable-mast" d="M1388 0 L1404 0 L1412 560 L1380 560 Z" />
        <g className="cyber-cable-brace" strokeWidth="1.4">
          <line x1="1392" y1="70" x2="1408" y2="130" />
          <line x1="1408" y1="70" x2="1392" y2="130" />
          <line x1="1392" y1="130" x2="1408" y2="190" />
          <line x1="1408" y1="130" x2="1392" y2="190" />
          <line x1="1392" y1="190" x2="1408" y2="250" />
          <line x1="1408" y1="190" x2="1392" y2="250" />
        </g>

        {/* Dua palang 腕金 + insulator serat. */}
        <rect className="cyber-cable-arm" x="1326" y="26" width="110" height="4" />
        <rect className="cyber-cable-arm" x="1348" y="58" width="72" height="4" />
        <circle className="cyber-cable-insulator" cx="1330" cy="28" r="2" />
        <circle className="cyber-cable-insulator" cx="1432" cy="28" r="2" />
        <circle className="cyber-cable-insulator" cx="1352" cy="60" r="2" />

        {/* Lampu 常夜 di ujung palang (menyala penuh di 真夜中). */}
        <path className="cyber-cable-lamp-arm" vectorEffect="non-scaling-stroke" d="M1420 28 L1430 36" />
        <rect className="cyber-cable-lamp" x="1421" y="36" width="17" height="10" />
        <rect className="cyber-cable-lamp-glass" x="1423" y="46" width="13" height="4" />
        <circle className="cyber-cable-glow" cx="1429" cy="41" r="34" fill={`url(#${glowId})`} />
      </motion.svg>
    </div>
  );
}

// ホログラム HUD — papan holografik: segel 電脳 + bar telemetri + readout.
// Panel statis ber-kanji (analog 看板/文選/コマ割り題字), bukan gantung.
export function CyberHud({ className = '' }) {
  // 3 bar telemetri; yang ke-2 menyala (kuning) = "sinyal aktif".
  const meters = [
    { y: 34, w: 70 },
    { y: 46, w: 92 },
    { y: 58, w: 54 },
  ];
  const LIT = 1;
  return (
    <div className={`cyber-ornament cyber-hud ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 84" role="presentation" focusable="false">
        {/* Frame hairline (sudut mati, bukan tinta tebal). */}
        <rect className="cyber-hud-frame" x="1" y="1" width="118" height="82" />
        {/* Sudut siku HUD (4 sudut) — bahasa bentuk 電脳. */}
        <g className="cyber-hud-corner" strokeWidth="2">
          <path d="M1 12 L1 1 L12 1" />
          <path d="M108 1 L119 1 L119 12" />
          <path d="M119 72 L119 83 L108 83" />
          <path d="M12 83 L1 83 L1 72" />
        </g>

        {/* Header bar + segel 電脳. */}
        <rect className="cyber-hud-bar" x="8" y="8" width="104" height="14" />
        <text className="cyber-hud-title" x="14" y="18">電脳</text>
        <text className="cyber-hud-code" x="112" y="18" textAnchor="end">300</text>

        {/* Bar telemetri (hairline + fill glow). */}
        {meters.map((m, i) => (
          <g key={`m-${m.y}`}>
            <rect className="cyber-hud-meter-track" x="8" y={m.y} width="104" height="6" />
            <rect
              className={i === LIT ? 'cyber-hud-meter-fill cyber-hud-meter-fill--lit' : 'cyber-hud-meter-fill'}
              x="8"
              y={m.y}
              width={m.w}
              height="6"
            />
          </g>
        ))}

        {/* Grid kecil + readout (garis data). */}
        <g className="cyber-hud-gridline">
          <line x1="8" y1="70" x2="112" y2="70" />
          <line x1="30" y1="70" x2="30" y2="78" />
          <line x1="52" y1="70" x2="52" y2="78" />
          <line x1="74" y1="70" x2="74" y2="78" />
          <line x1="96" y1="70" x2="96" y2="78" />
        </g>
      </svg>
    </div>
  );
}

// 電脳塔 — menara antena transmisi 常夜: rangka kisi + dish + cincin gelombang
// + beacon merah. Berdiri di panel hero (bukan gantung).
export function CyberSpire({ className = '' }) {
  const ringId = `cyber-spire-ring-${useId().replace(/:/g, '')}`;
  return (
    <div className={`cyber-ornament cyber-spire ${className}`} aria-hidden="true">
      <svg viewBox="0 0 80 220" role="presentation" focusable="false">
        <defs>
          <radialGradient id={ringId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,240,255,0.5)" />
            <stop offset="100%" stopColor="rgba(0,240,255,0)" />
          </radialGradient>
        </defs>

        {/* Cincin gelombang memancar dari puncak (常夜 = sinyal abadi). */}
        <circle className="cyber-spire-wave" cx="40" cy="26" r="24" fill={`url(#${ringId})`} />

        {/* Rangka kisi menara (meruncing ke atas). */}
        <path className="cyber-spire-mast" d="M40 20 L48 120 L32 120 Z" />
        <path className="cyber-spire-frame" d="M40 120 L8 208" />
        <path className="cyber-spire-frame" d="M40 120 L72 208" />
        <path className="cyber-spire-frame" d="M40 120 L22 208" />
        <path className="cyber-spire-frame" d="M40 120 L58 208" />
        <g className="cyber-spire-brace">
          <line x1="14" y1="190" x2="66" y2="162" />
          <line x1="66" y1="190" x2="14" y2="162" />
          <line x1="22" y1="152" x2="58" y2="128" />
          <line x1="58" y1="152" x2="22" y2="128" />
          <line x1="28" y1="120" x2="52" y2="100" />
          <line x1="52" y1="120" x2="28" y2="100" />
        </g>

        {/* Dish antena (parabola) di puncak. */}
        <path className="cyber-spire-dish" d="M26 44 Q40 30 54 44 Q40 52 26 44 Z" />
        <line className="cyber-spire-feed" x1="40" y1="44" x2="40" y2="34" />

        {/* Jarum antena + beacon merah (berdenyut di malam). */}
        <rect className="cyber-spire-needle" x="39" y="6" width="2" height="16" />
        <circle className="cyber-spire-beacon" cx="40" cy="6" r="2.6" />

        {/* Landasan beton-kaca di tanah. */}
        <rect className="cyber-spire-base" x="6" y="208" width="68" height="8" />
      </svg>
    </div>
  );
}

export default CyberCable;
