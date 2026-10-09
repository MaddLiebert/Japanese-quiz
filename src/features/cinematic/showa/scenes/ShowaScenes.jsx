// ─────────────────────────────────────────────────────────────────────────────
// Scene visual era Shōwa 昭和 — 5 babak cinematic (PRD docs/tema/showa.md §10).
// Semua view menerima { clock, sceneStart, reduced, portrait } dan MENGENDALIKAN
// dirinya dari jam (motion value) — tanpa re-render per frame.
//
//   ruins   → 焼け跡: kota rata jadi abu, horizon kosong, tiang listrik roboh
//   yamichi → 闇市: lampu bohlam gantung, tenda, orang bertahan
//   build   → beton dituang: 団地 berbaris naik, derek, cetakan (formwork)
//   tower   → 東京タワー berdiri → 新幹線 melintas → siluet 太陽の塔
//   change  → kota beton → segel 昭 + 昭和 — 灰からの町
//
// BAHASA RUPA = BETON / BRUTALIS, bukan ukiyo-e (Edo), bukan letterpress
// (Meiji), bukan kuas (Heian):
//   • BLOK DATAR   — massa beton sudut tajam (rect), bukan garis aturan.
//   • BAYANGAN KERAS— offset gelap 2–3px (echo --era-shadow base Shōwa), bukan
//                     misprint tipis (Meiji) maupun tanpa bayangan.
//   • 団地グリッド — jendela seragam berulang; sebagian menyala sodium.
//   • 電柱＋架線   — tiang + kabel catenary (echo hero, bukan salinan).
// Palet token cinematic --sk-* (beton, tinta, sodium, shu, kinari).
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (p) => 1 - Math.pow(1 - clamp01(p), 3);

// Bayangan keras khas beton Shōwa (offset gelap, sudut tajam).
const HARD = 'drop-shadow(3px 3px 0 rgba(20,20,18,0.42))';

// Panel dasar: blok beton dengan bintik aggregate (pola isian).
function Sheet({ from, to, opacity = 1 }) {
  return <div className="absolute inset-0" style={{ opacity, background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)` }} />;
}

// Label kanji scene (grotesk tebal, bayangan keras) — tanda tiap babak.
function SceneMark({ text, color = 'var(--sk-sumi)' }) {
  return (
    <div className="absolute left-1/2 top-[11%] -translate-x-1/2"
         style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem,4vw,2.4rem)', color, opacity: 0.6, letterSpacing: '0.34em', filter: HARD }}>
      {text}
    </div>
  );
}

// ── 1. 焼け跡 — kota rata jadi abu, horizon kosong, tiang roboh ──────────────
export function SceneRuins({ clock, sceneStart = 0, reduced = false }) {
  const rise = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.5) / 3.0)));
  const dust = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 1.6) / 3.0)));
  const dustDrift = useTransform(clock, (t) => (reduced ? 0 : (t - sceneStart) * 5));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(70,70,66,0.22)" to="rgba(180,176,166,0)" />
      <svg viewBox="0 0 1440 620" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {/* horizon abu — garis rata (tanpa siluet gunung) */}
        <line x1="0" y1="430" x2="1440" y2="430" stroke="var(--sk-sumi)" strokeWidth="2" opacity="0.4" />
        {/* puing: blok-blok rata rendah di kejauhan */}
        <motion.g style={{ opacity: rise }}>
          {[80, 300, 520, 760, 980, 1220].map((x, i) => (
            <g key={i}>
              <rect x={x} y={392 + (i % 3) * 12} width={140 + (i % 2) * 40} height={40 - (i % 3) * 8} fill="var(--sk-sumi)" opacity="0.2" />
              <rect x={x} y={392 + (i % 3) * 12} width={140 + (i % 2) * 40} height="3" fill="var(--sk-sumi)" opacity="0.34" />
            </g>
          ))}
        </motion.g>
        {/* tiang listrik ROBOH — miring menancap ke tanah (elektrik yang mati) */}
        <motion.g style={{ opacity: rise }} transform="rotate(62 1040 430)">
          <rect x="1032" y="150" width="14" height="280" fill="var(--sk-sumi)" opacity="0.5" />
          <rect x="1006" y="176" width="66" height="6" fill="var(--sk-sumi)" opacity="0.5" />
          <rect x="1012" y="200" width="54" height="5" fill="var(--sk-sumi)" opacity="0.42" />
        </motion.g>
        {/* satu tiang masih berdiri (harapan tipis) */}
        <g opacity="0.5">
          <rect x="236" y="230" width="12" height="200" fill="var(--sk-sumi)" />
          <rect x="214" y="252" width="56" height="5" fill="var(--sk-sumi)" />
        </g>
        {/* kabel putus menggantung */}
        <path d="M242 258 C 400 320, 520 330, 620 300" fill="none" stroke="var(--sk-sumi)" strokeWidth="1.6" opacity="0.4" />
        {/* debu naik dari tanah */}
        <motion.g style={{ x: dustDrift, opacity: dust }}>
          {[[520, 400, 60], [560, 356, 78], [610, 300, 96], [680, 250, 112]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="var(--sk-dust)" opacity={0.18 - i * 0.03} />
          ))}
        </motion.g>
        {/* tanah rata (abu) */}
        <rect x="0" y="430" width="1440" height="190" fill="var(--sk-dust)" opacity="0.14" />
      </svg>
      {/* babak 1 tanpa teks — hanya label sunyi */}
      <SceneMark text="焼け跡" color="var(--sk-sumi)" />
    </div>
  );
}

// ── 2. 闇市 — lampu bohlam gantung, tenda, orang bertahan ───────────────────
export function SceneYamichi({ clock, sceneStart = 0, reduced = false }) {
  const tents = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.4) / 2.6)));
  const bulbs = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 1.4) / 3.0)));
  const flick = useTransform(clock, (t) => (reduced ? 1 : 0.88 + Math.sin(t * 2.6) * 0.06 + Math.sin(t * 6.1) * 0.04));
  const glow = useTransform([bulbs, flick], ([p, f]) => p * f);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(30,24,16,0.30)" to="rgba(120,104,78,0)" />
      <svg viewBox="0 0 1440 620" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {/* deretan tenda pasar malam — blok gelap + atap miring */}
        <motion.g style={{ opacity: tents }}>
          {[40, 300, 560, 820, 1080].map((x, i) => (
            <g key={i}>
              <rect x={x} y="300" width="220" height="150" fill="var(--sk-sumi)" opacity="0.5" />
              <path d={`M${x} 300 L${x + 110} 250 L${x + 220} 300 Z`} fill="var(--sk-sumi)" opacity="0.34" />
              {/* meja/barang jualan */}
              <rect x={x + 30} y="378" width="160" height="26" fill="var(--sk-sumi)" opacity="0.4" />
            </g>
          ))}
        </motion.g>
        {/* tiang kayu + kabel tempat bohlam menggantung */}
        <g opacity="0.6">
          {[20, 1420].map((x, i) => <rect key={i} x={x} y="120" width="8" height="360" fill="var(--sk-sumi)" />)}
          <path d="M28 150 Q 720 220 1412 150" fill="none" stroke="var(--sk-sumi)" strokeWidth="2" />
        </g>
        {/* 白熱球 bohlam menggantung — menyala hangat */}
        {[200, 420, 640, 860, 1080, 1260].map((x, i) => (
          <g key={i}>
            <line x1={x} y1={148 + Math.sin(i) * 8} x2={x} y2={200} stroke="var(--sk-sumi)" strokeWidth="1.4" opacity="0.6" />
            <motion.circle cx={x} cy="210" r="46" fill="rgba(240,190,90,0.16)" style={{ opacity: glow }} />
            <motion.circle cx={x} cy="210" r="20" fill="rgba(245,205,120,0.30)" style={{ opacity: glow }} />
            <motion.circle cx={x} cy="208" r="7" fill="var(--sk-sodium)" style={{ opacity: glow }} />
          </g>
        ))}
        {/* orang (siluet sederhana) — berdiri di depan tenda */}
        <g fill="var(--sk-sumi)" opacity="0.55">
          {[120, 380, 700, 960, 1180].map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={430 - (i % 2) * 6} r="11" />
              <rect x={x - 9} y={442 - (i % 2) * 6} width="18" height="46" rx="3" />
            </g>
          ))}
        </g>
        <rect x="0" y="500" width="1440" height="120" fill="var(--sk-sumi)" opacity="0.16" />
      </svg>
      <SceneMark text="闇市" color="var(--sk-sodium)" />
    </div>
  );
}

// ── 3. コンクリート — beton dituang, 団地 berbaris naik ──────────────────────
export function SceneBuild({ clock, sceneStart = 0, reduced = false }) {
  const pour = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.4) / 3.4)));
  const rise = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 1.8) / 3.6)));
  const crane = useTransform(clock, (t) => (reduced ? 0 : Math.sin((t - sceneStart) * 0.7) * 40));

  // 団地: grid jendela seragam (blok beton berulang).
  const BLOCKS = [
    { x: 120, y: 250, w: 180, h: 200, rows: 5, cols: 4 },
    { x: 340, y: 200, w: 180, h: 250, rows: 6, cols: 4 },
    { x: 560, y: 270, w: 180, h: 180, rows: 4, cols: 4 },
    { x: 780, y: 180, w: 200, h: 270, rows: 7, cols: 5 },
    { x: 1020, y: 250, w: 180, h: 200, rows: 5, cols: 4 },
    { x: 1240, y: 300, w: 160, h: 150, rows: 4, cols: 4 },
  ];

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(120,120,116,0.14)" to="rgba(196,192,182,0)" />
      <svg viewBox="0 0 1440 620" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {/* garis tanah */}
        <line x1="0" y1="450" x2="1440" y2="450" stroke="var(--sk-sumi)" strokeWidth="2" opacity="0.45" />
        {/* 団地 berbaris — tumbuh dari bawah (rise) */}
        <motion.g style={{ opacity: rise }}>
          {BLOCKS.map((b, i) => (
            <g key={i}>
              {/* massa beton (blok datar, sudut tajam) */}
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="var(--sk-concrete)" stroke="var(--sk-sumi)" strokeWidth="1.6" />
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="var(--sk-sumi)" opacity="0.05" />
              {/* 団地グリッド — jendela seragam */}
              {Array.from({ length: b.rows }, (_, r) =>
                Array.from({ length: b.cols }, (_, c) => (
                  <rect key={`${r}-${c}`} x={b.x + 16 + c * 38} y={b.y + 16 + r * 32} width="24" height="18"
                        fill="var(--sk-gin)" opacity="0.7" stroke="var(--sk-sumi)" strokeWidth="0.7" />
                )))}
            </g>
          ))}
        </motion.g>
        {/* derek クレーン — lengan bergerak pelan (kota sedang dibangun) */}
        <motion.g style={{ x: crane }} opacity="0.7">
          <rect x="880" y="60" width="8" height="390" fill="var(--sk-sumi)" />
          <rect x="700" y="60" width="360" height="7" fill="var(--sk-sumi)" />
          <line x1="880" y1="60" x2="1050" y2="60" stroke="var(--sk-sumi)" strokeWidth="3" />
          <line x1="1000" y1="67" x2="1000" y2="150" stroke="var(--sk-sumi)" strokeWidth="1.6" />
          <rect x="992" y="150" width="16" height="20" fill="var(--sk-sodium)" opacity="0.7" />
        </motion.g>
        {/* beton dituang dari corong (formwork) */}
        <motion.g style={{ opacity: pour }}>
          <path d="M300 120 L420 120 L390 190 L330 190 Z" fill="var(--sk-concrete)" stroke="var(--sk-sumi)" strokeWidth="1.6" />
          <rect x="345" y="190" width="30" height="90" fill="var(--sk-concrete)" opacity="0.85" stroke="var(--sk-sumi)" strokeWidth="1.2" />
        </motion.g>
        {/* permukaan beton dituang (formwork marks) */}
        <rect x="0" y="450" width="1440" height="170" fill="var(--sk-concrete)" opacity="0.5" />
      </svg>
      <SceneMark text="コンクリート" color="var(--sk-sumi)" />
    </div>
  );
}

// ── 4. 東京タワー → 新幹線 → 太陽の塔 ────────────────────────────────────────
export function SceneTower({ clock, sceneStart = 0, reduced = false }) {
  const tower = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.4) / 2.6)));
  const train = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 3.4) / 2.2)));
  const trainX = useTransform(clock, (t) => (reduced ? 0 : (1 - easeOut((t - sceneStart - 3.4) / 2.6)) * 520));
  const sunTower = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 6.2) / 2.4)));
  const beacon = useTransform(clock, (t) => (reduced ? 1 : 0.6 + Math.sin(t * 3.4) * 0.4));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(200,150,70,0.12)" to="rgba(210,200,180,0)" />
      <svg viewBox="0 0 1440 620" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {/* kota di kejauhan — siluet blok */}
        <g fill="var(--sk-sumi)" opacity="0.16">
          {[40, 200, 360, 560, 720, 900, 1080, 1260, 1380].map((x, i) => (
            <rect key={i} x={x} y={360 - (i % 3) * 26} width={110} height={120 + (i % 3) * 26} />
          ))}
        </g>
        {/* 東京タワー — rangka merah-putih, berdiri di tengah-kiri */}
        <motion.g style={{ opacity: tower }}>
          {/* kaki 4 menyilang */}
          <path d="M470 460 L392 470" stroke="var(--sk-sumi)" strokeWidth="4" />
          <path d="M470 460 L548 470" stroke="var(--sk-sumi)" strokeWidth="4" />
          <path d="M470 460 L430 470" stroke="var(--sk-sumi)" strokeWidth="3" opacity="0.7" />
          <path d="M470 460 L510 470" stroke="var(--sk-sumi)" strokeWidth="3" opacity="0.7" />
          {/* bracing */}
          {[200, 250, 300, 350, 400].map((y, i) => (
            <g key={i}>
              <line x1={470 - (40 - i * 6)} y1={y} x2={470 + (40 - i * 6)} y2={y} stroke="var(--sk-sumi)" strokeWidth="2" />
              <line x1={470 - (40 - i * 6)} y1={y} x2={470 + (40 - i * 6)} y2={y + 50} stroke="var(--sk-sumi)" strokeWidth="1.4" opacity="0.7" />
            </g>
          ))}
          {/* badan menara + pita merah-putih */}
          <path d="M470 120 L486 400 L454 400 Z" fill="var(--sk-kinari)" stroke="var(--sk-sumi)" strokeWidth="1.6" />
          {[150, 190, 230, 270, 310, 350].map((y, i) => (
            <rect key={i} x={466 - (i * 0.5)} y={y} width={8 + i} height="10" fill="var(--sk-shu)" opacity="0.9" />
          ))}
          {/* dek observasi + antena */}
          <rect x="448" y="392" width="44" height="8" fill="var(--sk-shu)" />
          <rect x="452" y="300" width="36" height="6" fill="var(--sk-shu)" />
          <rect x="468" y="96" width="4" height="26" fill="var(--sk-sumi)" />
          <motion.circle cx="470" cy="96" r="4" fill="var(--sk-shu)" style={{ opacity: beacon }} />
        </motion.g>
        {/* 新幹線 — melintas di jalur layang (kecepatan) */}
        <g>
          <rect x="0" y="500" width="1440" height="10" fill="var(--sk-concrete)" stroke="var(--sk-sumi)" strokeWidth="1" />
          {[200, 620, 1040].map((x, i) => <rect key={i} x={x} y="510" width="14" height="60" fill="var(--sk-concrete)" opacity="0.7" />)}
        </g>
        <motion.g style={{ x: trainX, opacity: train }}>
          <path d="M540 486 H980 C1030 486 1050 492 1062 498 L540 498 Z" fill="var(--sk-kinari)" stroke="var(--sk-sumi)" strokeWidth="1.6" />
          <path d="M544 492 H1040 C1048 492 1054 495 1058 497 L544 497 Z" fill="var(--sk-shu)" opacity="0.9" />
          <rect x="560" y="488" width="440" height="4" fill="var(--sk-sumi)" opacity="0.5" />
          <circle cx="1056" cy="496" r="3" fill="var(--sk-sodium)" />
        </motion.g>
        {/* 太陽の塔 — SILUET saja (hak cipta Okamoto Tarō: JANGAN detail) */}
        <motion.g style={{ opacity: sunTower }}>
          <path d="M1210 470 L1210 300 C1210 250 1250 210 1290 210 C1330 210 1370 250 1370 300 L1370 470 Z"
                fill="var(--sk-sumi)" opacity="0.7" />
          {/* lengan siluet */}
          <path d="M1210 320 L1150 280" stroke="var(--sk-sumi)" strokeWidth="14" opacity="0.7" strokeLinecap="round" />
          <path d="M1370 330 L1430 290" stroke="var(--sk-sumi)" strokeWidth="14" opacity="0.7" strokeLinecap="round" />
          {/* muka (lingkaran) — hanya bentuk, tanpa detail */}
          <circle cx="1290" cy="300" r="26" fill="var(--sk-sodium)" opacity="0.5" />
        </motion.g>
        {/* langit matahari sore */}
        <circle cx="1290" cy="180" r="60" fill="var(--sk-sodium)" opacity="0.16" />
      </svg>
      <SceneMark text="塔" color="var(--sk-shu)" />
    </div>
  );
}

// ── 5. 昭和 — kota beton → segel 昭 + 灰からの町 ──────────────────────────────
export function SceneChange({ clock, sceneStart = 0, reduced = false }) {
  const close = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.4) / 2.4)));
  const seal = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 4.6) / 1.2)));
  const sealRot = useTransform(clock, (t) => (reduced ? -4 : (1 - clamp01((t - sceneStart - 4.6) / 1.2)) * 18 - 4));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(216,120,90,0.12)" to="rgba(226,216,196,0)" />
      {/* tirai beton menutup dari kiri & kanan — blok datar + garis formwork */}
      <motion.div className="absolute inset-y-0 left-0" style={{
        width: '50%',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.10), transparent), var(--sk-concrete)',
        borderRight: '2px solid var(--sk-sumi)',
        x: useTransform(close, (p) => `${-100 * (1 - p)}%`),
      }} />
      <motion.div className="absolute inset-y-0 right-0" style={{
        width: '50%',
        background: 'linear-gradient(270deg, rgba(255,255,255,0.10), transparent), var(--sk-concrete)',
        borderLeft: '2px solid var(--sk-sumi)',
        x: useTransform(close, (p) => `${100 * (1 - p)}%`),
      }} />

      {/* segel 昭 — kotak merah beton-tebal, kanji grotesk, bayangan keras */}
      <motion.div
        className="absolute left-1/2 top-1/2 flex items-center justify-center"
        style={{
          width: 'clamp(88px,17vw,158px)', height: 'clamp(88px,17vw,158px)',
          translateX: '-50%', translateY: '-50%',
          background: 'linear-gradient(160deg, #d34a3c 0%, var(--sk-shu) 58%, #8e2f26 100%)',
          color: 'var(--sk-kinari)',
          border: '2px solid var(--sk-sumi)',
          borderRadius: 0,
          filter: 'drop-shadow(4px 4px 0 rgba(20,20,18,0.5))',
          rotate: sealRot, opacity: seal,
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.6rem,8vw,4.6rem)', lineHeight: 1 }}>昭</span>
      </motion.div>
    </div>
  );
}

export default SceneRuins;
