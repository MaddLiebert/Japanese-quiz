// ─────────────────────────────────────────────────────────────────────────────
// AnimeOrnament — hiasan khas era 多元 ANIME MULTIVERSE di Home (日本語学園).
//
// PRD docs/tema/anime.md §6: "時代ではなく、世界。" 多元 bukan zaman — ia KANVAS.
// Tiga sosok jadi hiasan (bukan tempelan generik), semua ORISINAL (§6.4):
//   • フィルム＋セル画 AnimeFilm (KINETIK) — strip film + 1 sel berwarna yang
//     BERGAYANG ikut momentum scroll. Ini analog LANGSUNG 提灯 (Edo) / 瓦斯灯
//     (Meiji) / 電柱 (Shōwa) — benda gantung yang berayun — tapi medianya FILM &
//     SEL ANIMASI. Ayunan paling CERIA (spring 180, rotasi ≤7°; 提灯 11°,
//     電柱 4°). Malam 深夜アニメ: sel bercahaya, perforasi jadi siluet terang.
//   • コマ割り題字 AnimePanel (PANEL) — grid panel manga + kanji 多元 + balon
//     KOSONG 「（　）」. Ini "kanvas kosong" (白紙の頁): halaman menunggu diisi.
//     Sejajar 暖簾 (Edo) / 文選 (Meiji) / 看板 (Shōwa) — panel statis ber-kanji.
//   • 多世界の扉 AnimeGate (HERO) — gerbang dari panel bertumpuk, tiap panel
//     menampilkan SILUET dunia berbeda (gunung / robot / kota / gedung). Menandai
//     "banyak dunia". Sejajar 東京タワー (Shōwa) / 瓦斯灯 (Meiji) — berdiri di hero.
//
// HANYA tampil di era 多元 (di-gate CSS: .anime-ornament). Era lain tak tersentuh.
// Dekoratif → aria-hidden + pointer-events:none. Reduced-motion → film diam.
//
// ⚠️ HAK CIPUTA (§6.4): siluet GENERIK (bukan desain tokoh ikonik), tanpa nama
//    IP nyata. 機神/忍者/魔法 = kata trope umum, bukan merek.
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

// フィルム＋セル画 — strip film vertikal + perforasi (lubang sproket) + 1 sel
// berwarna. Bergoyang ikut momentum scroll seperti benda gantung era lain.
export function AnimeFilm({ className = '' }) {
  const reduced = usePrefersReducedMotion();
  const glowId = `anime-film-glow-${useId().replace(/:/g, '')}`;
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  // Strip film = ringan & CERIA (paling cepat berayun dari semua ornamen):
  // spring kaku + massa sedang → goyangan energik, bukan berat ala beton.
  const smooth = useSpring(velocity, { stiffness: 180, damping: 16, mass: 1.2 });
  const rotate = useTransform(smooth, (v) => {
    if (reduced) return 0;
    const t = Math.max(-1, Math.min(1, v / 1700));
    return t * 7;   // ≤7° — paling energik (提灯 11°, 電柱 4°)
  });

  // Deretan kotak frame di sepanjang strip (kotak ke-3 = sel berwarna).
  const FRAMES = [8, 30, 52, 74, 96, 118, 140];
  const CEL_INDEX = 3;

  return (
    <div className={`anime-ornament anime-film ${className}`} aria-hidden="true">
      <motion.svg
        viewBox="0 0 64 170"
        role="presentation"
        focusable="false"
        style={{ rotate, transformOrigin: '50% 0%' }}
      >
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(120,190,255,0.55)" />
            <stop offset="60%" stopColor="rgba(90,160,240,0.22)" />
            <stop offset="100%" stopColor="rgba(90,160,240,0)" />
          </radialGradient>
        </defs>

        {/* Halo sel — menyala hanya saat malam 深夜アニメ (di-gate CSS). */}
        <circle className="anime-film-glow" cx="32" cy="70" r="34" fill={`url(#${glowId})`} />

        {/* Strip film */}
        <rect className="anime-film-strip" x="10" y="0" width="44" height="170" rx="2" />

        {/* Perforasi (lubang sproket) di kedua tepi — siang: gelap; malam: terang. */}
        {[4, 20, 36, 52, 68, 84, 100, 116, 132, 148, 162].map((y) => (
          <g key={`perf-${y}`}>
            <rect className="anime-film-perf" x="13" y={y} width="4" height="6" rx="1" />
            <rect className="anime-film-perf" x="47" y={y} width="4" height="6" rx="1" />
          </g>
        ))}

        {/* Kotak-kotak frame; satu di antaranya = sel berwarna (cel-shade). */}
        {FRAMES.map((y, i) => (
          <rect
            key={`frame-${y}`}
            className={i === CEL_INDEX ? 'anime-film-cel' : 'anime-film-frame'}
            x="20"
            y={y}
            width="24"
            height="18"
            rx="1"
          />
        ))}
      </motion.svg>
    </div>
  );
}

// コマ割り題字 — grid panel manga + kanji 多元 + balon KOSONG 「（　）」.
// Ini "kanvas kosong" (白紙の頁): halaman menunggu diisi, tampil sengaja.
export function AnimePanel({ className = '' }) {
  return (
    <div className={`anime-ornament anime-panel ${className}`} aria-hidden="true">
      <svg viewBox="0 0 104 76" role="presentation" focusable="false">
        {/* Grid panel manga (3 panel asimetris) */}
        <rect className="anime-panel-cell" x="1" y="1" width="60" height="44" rx="2" />
        <rect className="anime-panel-cell" x="63" y="1" width="40" height="26" rx="2" />
        <rect className="anime-panel-cell" x="63" y="29" width="40" height="46" rx="2" />
        <rect className="anime-panel-cell" x="1" y="47" width="60" height="28" rx="2" />

        {/* 題字 多元 — judul blok tebal ala judul anime. */}
        <text className="anime-panel-title" x="31" y="26" textAnchor="middle" dominantBaseline="central">
          多元
        </text>

        {/* Balon KOSONG 「（　）」 — placeholder kanvas menunggu diisi. */}
        <path
          className="anime-panel-balloon"
          d="M6 52 L52 52 Q58 52 58 58 L58 66 Q58 72 52 72 L26 72 L22 76 L22 72 L6 72 Q1 72 1 66 L1 58 Q1 52 6 52 Z"
        />
        <text className="anime-panel-balloon-text" x="29" y="62" textAnchor="middle" dominantBaseline="central">
          （　）
        </text>

        {/* 印 — segel merah di sudut (benang merah Edo/Meiji/Shōwa). */}
        <rect className="anime-panel-seal" x="90" y="62" width="12" height="12" rx="2" />
        <text className="anime-panel-seal-text" x="96" y="68" textAnchor="middle" dominantBaseline="central">印</text>
      </svg>
    </div>
  );
}

// 多世界の扉 — gerbang dari panel bertumpuk; tiap panel menampilkan SILUET
// dunia berbeda. Berdiri di panel hero (bukan gantung), seperti torii komik.
export function AnimeGate({ className = '' }) {
  return (
    <div className={`anime-ornament anime-gate ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 190" role="presentation" focusable="false">
        {/* Panel belakang (dunia 4 — gedung kota) */}
        <g className="anime-gate-world">
          <rect className="anime-gate-frame" x="2" y="4" width="116" height="182" rx="3" />
          <rect className="anime-gate-sky" x="8" y="10" width="104" height="170" rx="2" />
          <rect className="anime-gate-bldg" x="16" y="120" width="16" height="56" />
          <rect className="anime-gate-bldg" x="36" y="96" width="20" height="80" />
          <rect className="anime-gate-bldg" x="60" y="132" width="18" height="44" />
          <rect className="anime-gate-bldg" x="82" y="110" width="20" height="66" />
        </g>

        {/* Panel tengah (dunia 3 — siluet robot/機神, generik) */}
        <g className="anime-gate-world">
          <rect className="anime-gate-frame" x="14" y="18" width="92" height="150" rx="3" />
          <rect className="anime-gate-sky" x="19" y="23" width="82" height="140" rx="2" />
          <rect className="anime-gate-mech-head" x="48" y="52" width="24" height="20" rx="2" />
          <rect className="anime-gate-mech-body" x="44" y="74" width="32" height="48" rx="2" />
          <rect className="anime-gate-mech-arm" x="30" y="78" width="12" height="40" rx="2" />
          <rect className="anime-gate-mech-arm" x="78" y="78" width="12" height="40" rx="2" />
          <rect className="anime-gate-mech-leg" x="46" y="124" width="12" height="34" rx="2" />
          <rect className="anime-gate-mech-leg" x="62" y="124" width="12" height="34" rx="2" />
        </g>

        {/* Panel depan (dunia 1 — gunung 冒険, siluet generik) */}
        <g className="anime-gate-world">
          <rect className="anime-gate-frame" x="26" y="32" width="68" height="120" rx="3" />
          <rect className="anime-gate-sky" x="31" y="37" width="58" height="110" rx="2" />
          <path className="anime-gate-mountain" d="M31 118 L52 74 L66 96 L78 68 L89 118 Z" />
          <circle className="anime-gate-sun" cx="78" cy="54" r="7" />
        </g>
      </svg>
    </div>
  );
}

export default AnimeFilm;
