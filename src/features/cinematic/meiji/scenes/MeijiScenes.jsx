// ─────────────────────────────────────────────────────────────────────────────
// Scene visual era Meiji 明治 — 5 babak cinematic (PRD docs/tema/meiji.md §10).
// Semua view menerima { clock, sceneStart, reduced, portrait } dan MENGENDALIKAN
// dirinya dari jam (motion value) — tanpa re-render per frame.
//
//   port    → kapal uap hitam masuk teluk, asap
//   ginza   → jalan bata 煉瓦 + lampu gas 瓦斯灯 menyala
//   print   → mesin cetak: huruf logam 活字 disusun & ditekan
//   rail    → kereta uap 汽車 + tiang telegraf 電信 membentang
//   change  → kota berubah → segel 明 + 文明開化
//
// BAHASA RUPA = LETTERPRESS / KORAN, bukan web/brutalist, bukan ukiyo-e:
//   • GARIS ATURAN — struktur dibentuk hairline & rule-double (bukan blok).
//   • MISREGISTRASI (色ズレ) — pelat renga & ai bergeser TIPIS dari tinta,
//                 sebagai \"bayangan\" berwarna. TIDAK ADA bayangan hitam offset.
//   • HALFTONE — bintik cetak di blok warna.
//   • 活字 — blok huruf logam tersusun kolom (bentuk = isi tema).
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (p) => 1 - Math.pow(1 - clamp01(p), 3);

// Misprint pelat warna: renga & ai bergeser tipis dari tinta (BUKAN drop-shadow hitam).
const REG = 'drop-shadow(1.5px 1.5px 0 rgba(155,74,60,0.30)) drop-shadow(3px 3px 0 rgba(47,79,107,0.16))';

// Bokashi: gradien vertikal halus (kertas koran), bukan sapuan kuas tebal.
function Sheet({ from, to, opacity = 1 }) {
  return <div className="absolute inset-0" style={{ opacity, background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)` }} />;
}

// ── 1. 横浜港 — pelabuhan dibuka: kapal uap + asap + gudang ──────────────────
export function ScenePort({ clock, sceneStart = 0, reduced = false }) {
  const ship = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.4) / 3.0)));
  const smoke = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 1.2) / 2.4)));
  const smokeDrift = useTransform(clock, (t) => (reduced ? 0 : (t - sceneStart) * 6));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(47,79,107,0.16)" to="rgba(231,226,212,0)" />
      <svg viewBox="0 0 1440 620" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="mdkSea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--mdk-ai)" stopOpacity="0.44" />
            <stop offset="100%" stopColor="var(--mdk-ai)" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {/* dermaga gudang — garis aturan & blok datar */}
        <g opacity="0.9">
          {[0, 260, 520, 780, 1040, 1300].map((x, i) => (
            <g key={i}>
              <rect x={x + 20} y="300" width="200" height="90" fill="var(--mdk-ink)" opacity="0.14" />
              <line x1={x + 20} y1="300" x2={x + 220} y2="300" stroke="var(--mdk-ink)" strokeWidth="2" opacity="0.5" />
            </g>
          ))}
        </g>
        {/* laut 海 — garis aturan bergelombang tipis */}
        <motion.rect x="0" y="392" width="1440" height="228" fill="url(#mdkSea)" style={{ opacity: ship }} />
        <motion.g style={{ opacity: ship }} stroke="var(--mdk-paper)" strokeWidth="1.4" fill="none" opacity="0.5" strokeLinecap="round">
          {[430, 470, 512, 556].map((y, i) => (
            <path key={i} d={`M${30 + i * 20} ${y} q 70 -7 140 0 t 140 0 t 140 0 t 140 0 t 140 0 t 140 0 t 140 0 t 140 0 t 140 0`} />
          ))}
        </motion.g>
        {/* kapal uap hitam — lambung + cerobong + asap */}
        <motion.g style={{ x: useTransform(ship, (p) => (1 - p) * -220), opacity: ship }}>
          <rect x="560" y="330" width="330" height="62" fill="var(--mdk-ink)" opacity="0.92" />
          <rect x="560" y="392" width="330" height="16" fill="var(--mdk-renga)" opacity="0.85" />
          <rect x="700" y="256" width="46" height="80" fill="var(--mdk-ink)" />
          <rect x="694" y="250" width="58" height="12" fill="var(--mdk-renga)" />
          <rect x="620" y="300" width="30" height="34" fill="var(--mdk-ink)" opacity="0.7" />
          <rect x="840" y="300" width="30" height="34" fill="var(--mdk-ink)" opacity="0.7" />
        </motion.g>
        {/* asap — lingkaran kabut bergerak naik */}
        <motion.g style={{ x: smokeDrift, opacity: smoke }}>
          {[[723, 210, 46], [745, 168, 60], [770, 120, 74], [800, 74, 88]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="var(--mdk-paper)" opacity={0.32 - i * 0.05} />
          ))}
        </motion.g>
        {/* bendera asing (Barat) — 洋, gerbang dibuka */}
        <motion.g style={{ opacity: ship }}>
          <line x1="1090" y1="250" x2="1090" y2="392" stroke="var(--mdk-ink)" strokeWidth="3" />
          <path d="M1090 252 L1160 264 L1090 276 Z" fill="var(--mdk-shu)" opacity="0.9" />
        </motion.g>
      </svg>
      <div className="absolute left-1/2 top-[12%] -translate-x-1/2"
           style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem,4vw,2.4rem)', color: 'var(--mdk-ink)', opacity: 0.55, letterSpacing: '0.34em', filter: REG }}>
        横浜港
      </div>
    </div>
  );
}

// ── 2. 銀座 — jalan bata 煉瓦 + lampu gas 瓦斯灯 ──────────────────────────────
export function SceneGinza({ clock, sceneStart = 0, reduced = false }) {
  const brick = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.3) / 2.4)));
  const lamps = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 1.6) / 3.0)));
  const flick = useTransform(clock, (t) => (reduced ? 1 : 0.9 + Math.sin(t * 2.2) * 0.05 + Math.sin(t * 5.1) * 0.03));
  // Satu transform glow (dipanggil SEKALI — bukan di dalam .map, agar patuh
  // rules-of-hooks). Dipakai ulang semua halo lampu gas.
  const glow = useTransform([lamps, flick], ([p, f]) => p * f);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(155,74,60,0.10)" to="rgba(231,226,212,0)" />
      <svg viewBox="0 0 1440 620" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {/* pola bata 煉瓦 — garis susun bata (renga) */}
        <motion.g style={{ opacity: brick }}>
          <defs>
            <pattern id="mdkBrick" width="120" height="48" patternUnits="userSpaceOnUse">
              <rect width="120" height="48" fill="none" />
              <line x1="0" y1="24" x2="120" y2="24" stroke="var(--mdk-renga)" strokeWidth="1.4" opacity="0.6" />
              <line x1="0" y1="0" x2="0" y2="24" stroke="var(--mdk-renga)" strokeWidth="1.4" opacity="0.6" />
              <line x1="60" y1="24" x2="60" y2="48" stroke="var(--mdk-renga)" strokeWidth="1.4" opacity="0.6" />
              <line x1="120" y1="0" x2="120" y2="24" stroke="var(--mdk-renga)" strokeWidth="1.4" opacity="0.6" />
            </pattern>
          </defs>
          <rect x="0" y="330" width="1440" height="290" fill="url(#mdkBrick)" opacity="0.5" />
        </motion.g>
        {/* bangunan 2 lantai bergaya Barat (洋風) — blok + garis aturan */}
        <motion.g style={{ opacity: brick }}>
          {[80, 520, 960, 1320].map((x, i) => (
            <g key={i}>
              <rect x={x} y="150" width="200" height="180" fill="var(--mdk-paper)" stroke="var(--mdk-ink)" strokeWidth="1.6" />
              <rect x={x} y="150" width="200" height="180" fill="var(--mdk-ink)" opacity="0.05" />
              {/* jendela kisi */}
              {[0, 1, 2].map((c) => [0, 1].map((r) => (
                <rect key={`${c}-${r}`} x={x + 24 + c * 54} y={178 + r * 70} width="38" height="48" fill="var(--mdk-ai)" opacity="0.18" stroke="var(--mdk-ink)" strokeWidth="1" />
              )))}
            </g>
          ))}
        </motion.g>
        {/* lampu gas 瓦斯灯 — tiang + cahaya amber berlapis */}
        {[300, 700, 1100].map((x, i) => (
          <g key={i}>
            <line x1={x} y1="330" x2={x} y2="180" stroke="var(--mdk-ink)" strokeWidth="3" />
            <line x1={x - 16} y1="182" x2={x + 16} y2="182" stroke="var(--mdk-ink)" strokeWidth="3" />
            <motion.circle cx={x} cy="176" r="52" fill="rgba(217,164,65,0.18)" style={{ opacity: glow }} />
            <motion.circle cx={x} cy="176" r="30" fill="rgba(217,164,65,0.26)" style={{ opacity: glow }} />
            <motion.rect x={x - 12} y="162" width="24" height="30" fill="var(--mdk-gas)" stroke="var(--mdk-ink)" strokeWidth="1.4" style={{ opacity: lamps }} />
          </g>
        ))}
      </svg>
      {/* kolam cahaya gas — kota yang terang di malam hari */}
      <motion.div className="absolute inset-0" style={{
        opacity: lamps,
        background: 'radial-gradient(30% 30% at 21% 30%, rgba(217,164,65,0.24) 0%, transparent 72%),' +
                    'radial-gradient(30% 30% at 49% 30%, rgba(217,164,65,0.24) 0%, transparent 72%),' +
                    'radial-gradient(30% 30% at 76% 30%, rgba(217,164,65,0.22) 0%, transparent 72%)',
      }} />
      <div className="absolute left-1/2 top-[12%] -translate-x-1/2"
           style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem,4vw,2.4rem)', color: 'var(--mdk-ink)', opacity: 0.6, letterSpacing: '0.34em', filter: REG }}>
        銀座
      </div>
    </div>
  );
}

// ── 3. 活字 — mesin cetak: huruf logam disusun & ditekan ─────────────────────
export function ScenePrint({ clock, sceneStart = 0, reduced = false }) {
  const set = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.4) / 2.2)));
  const press = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 2.8) / 1.6)));
  const sheetY = useTransform(clock, (t) => (reduced ? 0 : (1 - clamp01((t - sceneStart - 2.8) / 1.6)) * 40));

  const GLYPHS = ['明', '治', '活', '字', '新', '聞', '文', '明'];

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(20,20,20,0.08)" to="rgba(231,226,212,0)" />
      {/* kompors 文選 — blok huruf logam tersusun kolom */}
      <motion.div
        className="absolute left-[8%] top-1/2 -translate-y-1/2"
        style={{ opacity: set }}
      >
        <div className="grid grid-cols-4 gap-[3px] p-2"
             style={{ border: '1.5px solid var(--mdk-ink)', background: 'color-mix(in srgb, var(--mdk-paper) 60%, transparent)', filter: REG }}>
          {GLYPHS.map((g, i) => (
            <div key={i} className="flex items-center justify-center"
                 style={{
                   width: 'min(9vw,64px)', height: 'min(9vw,64px)',
                   border: '1px solid var(--mdk-ink)',
                   background: 'color-mix(in srgb, var(--mdk-renga) 8%, transparent)',
                   fontFamily: 'var(--font-display)', fontSize: 'min(5vw,34px)', color: 'var(--mdk-ink)',
                 }}>
              {g}
            </div>
          ))}
        </div>
      </motion.div>

      {/* mesin cetak (press) — rangka + roda gigi 歯車 */}
      <motion.div className="absolute right-[8%] top-1/2 -translate-y-1/2" style={{ opacity: press }}>
        <svg viewBox="0 0 360 400" style={{ width: 'min(34vw,320px)', height: 'min(50vh,400px)' }}>
          <rect x="40" y="120" width="280" height="220" fill="none" stroke="var(--mdk-ink)" strokeWidth="3" />
          <rect x="40" y="120" width="280" height="220" fill="var(--mdk-ink)" opacity="0.06" />
          <line x1="40" y1="200" x2="320" y2="200" stroke="var(--mdk-ink)" strokeWidth="2" />
          {/* roda gigi */}
          <circle cx="120" cy="290" r="42" fill="none" stroke="var(--mdk-ink)" strokeWidth="3" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={120 + Math.cos(a) * 42} y1={290 + Math.sin(a) * 42}
                         x2={120 + Math.cos(a) * 54} y2={290 + Math.sin(a) * 54} stroke="var(--mdk-ink)" strokeWidth="4" />;
          })}
          <circle cx="120" cy="290" r="14" fill="var(--mdk-renga)" opacity="0.8" />
          <circle cx="240" cy="290" r="30" fill="none" stroke="var(--mdk-ink)" strokeWidth="3" />
          {/* tuas tekan */}
          <line x1="180" y1="120" x2="180" y2="40" stroke="var(--mdk-ink)" strokeWidth="5" strokeLinecap="round" />
          <circle cx="180" cy="40" r="12" fill="var(--mdk-shu)" />
        </svg>
      </motion.div>

      {/* kertas tercetak 新聞 — halaman koran (garis aturan + halftone) */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2"
        style={{ width: 'min(40vw,360px)', height: 'min(52vh,420px)', background: 'var(--mdk-paper)', border: '1.5px solid var(--mdk-ink)', filter: REG, y: sheetY, opacity: press, translateX: '-50%' }}
      >
        <svg viewBox="0 0 360 420" className="h-full w-full">
          {/* masthead 明治新聞 */}
          <rect x="0" y="0" width="360" height="64" fill="var(--mdk-ink)" opacity="0.08" />
          <line x1="0" y1="64" x2="360" y2="64" stroke="var(--mdk-ink)" strokeWidth="3" />
          <line x1="0" y1="70" x2="360" y2="70" stroke="var(--mdk-ink)" strokeWidth="1" />
          <text x="180" y="44" textAnchor="middle" fontFamily="var(--font-display)" fontSize="30" fill="var(--mdk-ink)" letterSpacing="4">明治新聞</text>
          {/* kolom teks — garis aturan */}
          {[100, 150, 200, 250, 300, 350].map((y, i) => (
            <g key={i} opacity="0.55">
              <line x1="24" y1={y} x2="168" y2={y} stroke="var(--mdk-ink)" strokeWidth="2" />
              <line x1="192" y1={y} x2="336" y2={y} stroke="var(--mdk-ink)" strokeWidth="2" />
            </g>
          ))}
          <line x1="180" y1="92" x2="180" y2="380" stroke="var(--mdk-ink)" strokeWidth="1" opacity="0.4" />
        </svg>
      </motion.div>
    </div>
  );
}

// ── 4. 鉄道 — kereta uap 汽車 + tiang telegraf 電信 ──────────────────────────
export function SceneRail({ clock, sceneStart = 0, reduced = false }) {
  const train = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.4) / 3.2)));
  const smoke = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 1.0) / 2.2)));
  const wires = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 1.8) / 2.6)));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(47,79,107,0.12)" to="rgba(231,226,212,0)" />
      <svg viewBox="0 0 1440 620" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {/* rel 線路 — dua garis + bantalan */}
        <line x1="0" y1="470" x2="1440" y2="470" stroke="var(--mdk-ink)" strokeWidth="3" />
        <line x1="0" y1="492" x2="1440" y2="492" stroke="var(--mdk-ink)" strokeWidth="3" />
        {Array.from({ length: 24 }, (_, i) => (
          <line key={i} x1={i * 62} y1="468" x2={i * 62} y2="494" stroke="var(--mdk-ink)" strokeWidth="4" opacity="0.5" />
        ))}
        {/* tiang telegraf 電信 — berjajar + kabel melengkung */}
        <motion.g style={{ opacity: wires }}>
          {[120, 420, 720, 1020, 1320].map((x, i) => (
            <g key={i}>
              <line x1={x} y1="180" x2={x} y2="470" stroke="var(--mdk-ink)" strokeWidth="4" />
              <line x1={x - 26} y1="204" x2={x + 26} y2="204" stroke="var(--mdk-ink)" strokeWidth="3" />
              <line x1={x - 20} y1="230" x2={x + 20} y2="230" stroke="var(--mdk-ink)" strokeWidth="3" />
            </g>
          ))}
          {[196, 222].map((y, j) => (
            <path key={j} d={`M120 ${y} Q 270 ${y + 40} 420 ${y} Q 570 ${y + 40} 720 ${y} Q 870 ${y + 40} 1020 ${y} Q 1170 ${y + 40} 1320 ${y}`}
                  fill="none" stroke="var(--mdk-ink)" strokeWidth="1.6" opacity="0.6" />
          ))}
        </motion.g>
        {/* kereta uap — lokomotif + gerbong, bergerak dari kiri */}
        <motion.g style={{ x: useTransform(train, (p) => (1 - p) * -260), opacity: train }}>
          <rect x="560" y="330" width="120" height="140" fill="var(--mdk-ink)" />
          <rect x="600" y="300" width="40" height="30" fill="var(--mdk-ink)" />
          <circle cx="600" cy="474" r="20" fill="none" stroke="var(--mdk-ink)" strokeWidth="4" />
          <circle cx="660" cy="474" r="26" fill="none" stroke="var(--mdk-ink)" strokeWidth="4" />
          <rect x="700" y="360" width="150" height="110" fill="var(--mdk-renga)" opacity="0.9" />
          <rect x="700" y="360" width="150" height="110" fill="none" stroke="var(--mdk-ink)" strokeWidth="2" />
          {[724, 774, 824].map((x, i) => (
            <rect key={i} x={x} y="378" width="34" height="30" fill="var(--mdk-paper)" opacity="0.8" />
          ))}
          <circle cx="730" cy="474" r="18" fill="none" stroke="var(--mdk-ink)" strokeWidth="4" />
          <circle cx="820" cy="474" r="18" fill="none" stroke="var(--mdk-ink)" strokeWidth="4" />
        </motion.g>
        {/* asap kereta */}
        <motion.g style={{ opacity: smoke }}>
          {[[585, 262, 30], [560, 224, 40], [540, 180, 52]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="var(--mdk-paper)" opacity={0.3 - i * 0.06} />
          ))}
        </motion.g>
      </svg>
      <div className="absolute left-1/2 top-[12%] -translate-x-1/2"
           style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem,4vw,2.4rem)', color: 'var(--mdk-ink)', opacity: 0.55, letterSpacing: '0.34em', filter: REG }}>
        鉄道
      </div>
    </div>
  );
}

// ── 5. 明治 — kota berubah → segel 明 + 文明開化 ──────────────────────────────
export function SceneChange({ clock, sceneStart = 0, reduced = false }) {
  const close = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.4) / 2.4)));
  const seal = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 4.6) / 1.2)));
  const sealRot = useTransform(clock, (t) => (reduced ? -5 : (1 - clamp01((t - sceneStart - 4.6) / 1.2)) * 20 - 5));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(155,74,60,0.14)" to="rgba(231,226,212,0)" />
      {/* tirai koran menutup dari kiri & kanan — garis aturan + masthead */}
      <motion.div className="absolute inset-y-0 left-0" style={{
        width: '50%',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.22), transparent), var(--mdk-paper-2)',
        borderRight: '2px solid var(--mdk-ink)',
        x: useTransform(close, (p) => `${-100 * (1 - p)}%`),
      }} />
      <motion.div className="absolute inset-y-0 right-0" style={{
        width: '50%',
        background: 'linear-gradient(270deg, rgba(255,255,255,0.22), transparent), var(--mdk-paper-2)',
        borderLeft: '2px solid var(--mdk-ink)',
        x: useTransform(close, (p) => `${100 * (1 - p)}%`),
      }} />

      {/* segel 明 — kotak renga, huruf logam, misprint tipis (bukan blok hitam) */}
      <motion.div
        className="absolute left-1/2 top-1/2 flex items-center justify-center"
        style={{
          width: 'clamp(84px,16vw,150px)', height: 'clamp(84px,16vw,150px)',
          translateX: '-50%', translateY: '-50%',
          background: 'radial-gradient(circle at 38% 32%, #b45a48 0%, var(--mdk-renga) 62%, #6f3328 100%)',
          color: 'var(--mdk-paper)',
          border: '2px solid var(--mdk-ink)',
          borderRadius: '2px',
          filter: 'drop-shadow(2px 2px 0 rgba(47,79,107,0.32))',
          rotate: sealRot, opacity: seal,
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.6rem,8vw,4.6rem)', lineHeight: 1 }}>明</span>
      </motion.div>
    </div>
  );
}

export default ScenePort;
