// ─────────────────────────────────────────────────────────────────────────────
// Scene visual era 電脳 — 5 babak cinematic (PRD docs/tema/cyberpunk.md §10).
// Tema 「常夜」: puncak peradaban, malam tanpa akhir.
//
// Semua view menerima { clock, sceneStart, reduced, portrait } dan
// MENGENDALIKAN dirinya dari jam (motion value) — tanpa re-render per frame.
//
//   gate    → 門: gelap → satu titik neon → GLITCH → kota tersingkap
//   city    → 街: jalan neon, hujan, papan kanji, hologram, drone
//   peak    → 頂: PUNCAK PERADABAN — menara cahaya menembus langit, data naik
//   endless → 終: MALAM TANPA AKHIR — daya turun, kota padam, malam tak usai
//   home    → 家: satu jendela tetap menyala → segel 家 + 題字 電脳
//
// BAHASA RUPA = NEON / KACA / HOLOGRAM, bukan manga (多元), beton (Shōwa),
// letterpress (Meiji), ukiyo-e (Edo), kuas (Heian):
//   • KEDALAMAN   — 3 lapis siluet gedung (jauh/tengah/dekat) → kota terasa luas.
//   • PAPAN NEON  — kanji bercahaya (filter glow) + tabung ganda (tube).
//   • JALAN BASAH — refleksi vertikal gedung di aspal (malam hujan).
//   • HOLOGRAM    — panel/figur tembus pandang + scanline.
//   • GLITCH      — bar RGB-split yang melompat (steps), mereda setelah momen.
// Palet token cinematic --cy-* (night, panel, cyan, ice, kin, shu, haze).
// Semua geometri DETERMINISTIK (tanpa Math.random) → tampilan stabil & dites.
// ⚠️ Nol backdrop-filter. Gerak = transform/opacity saja (murah).
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (p) => 1 - Math.pow(1 - clamp01(p), 3);

// RNG deterministik (LCG) — siluet kota sama tiap render, tanpa Math.random.
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const CYAN = 'var(--cy-cyan)';
const KIN = 'var(--cy-kin)';
const SHU = 'var(--cy-shu)';

// ── Definisi bersama: pola jendela, glow, gradien (id dipakai bersama; browser
//    memakai definisi pertama — sama seperti pola ToneDefs era 多元) ───────────
function CyberDefs() {
  return (
    <defs>
      {/* Jendela gedung: grid kecil, sebagian menyala (cyan) */}
      <pattern id="cy-win" width="14" height="20" patternUnits="userSpaceOnUse">
        <rect x="2" y="3" width="4" height="6" fill={CYAN} opacity="0.55" />
        <rect x="9" y="3" width="3" height="6" fill={KIN} opacity="0.35" />
        <rect x="2" y="12" width="4" height="5" fill={CYAN} opacity="0.3" />
      </pattern>
      {/* Refleksi jalan: garis vertikal tipis (siluet terbalik) */}
      <linearGradient id="cy-street" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.10" />
        <stop offset="45%" stopColor="#00F0FF" stopOpacity="0.03" />
        <stop offset="100%" stopColor="#04050A" stopOpacity="0" />
      </linearGradient>
      {/* Glow neon (filter) */}
      <filter id="cy-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="3.2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="cy-glow-lg" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="7" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Glow TEKS neon — blur rapat supaya goresan kanji tetap tajam (bukan bloby) */}
      <filter id="cy-glow-text" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Kabut horizon — perspektif atmosferik (lapis jauh memudar) */}
      <linearGradient id="cy-fog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#00F0FF" stopOpacity="0" />
        <stop offset="55%" stopColor="#0A1830" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

// Hujan dalam-scene (jelas): garis miring turun, loop posisi (transform-only).
function RainStreaks({ clock, reduced = false, count = 130, opacity = 0.34 }) {
  const y = useTransform(clock, (t) => (reduced ? 0 : (t * 280) % 220));
  return (
    <motion.g style={{ y }} opacity={opacity} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const x = ((i * 173) % 1600) - 80;
        const yy = ((i * 97) % 960) - 140;
        return <line key={i} x1={x} y1={yy} x2={x - 14} y2={yy + 48} stroke={CYAN} strokeWidth={i % 5 === 0 ? 1.7 : 0.9} opacity="0.55" />;
      })}
    </motion.g>
  );
}

// Siluet kota 3 lapis (deterministik). baseY = garis tanah.
// Tiap gedung diberi ATAP bervariasi (antena / setback bertingkat / tangki air /
// atap miring) supaya siluet terasa kota nyata, bukan deret persegi (bar chart).
function Skyline({ seed, baseY = 560, color = '#05090F', win = 0.9, rim = CYAN, count = 16, minH = 120, maxH = 380, inset = 0 }) {
  const r = rng(seed);
  const out = [];
  let x = -inset;
  const total = 1440 + inset * 2;
  for (let i = 0; i < count; i += 1) {
    const w = 46 + r() * 84;
    const h = minH + r() * (maxH - minH);
    if (x > total) break;
    out.push({
      x: Math.round(x), w: Math.round(w), h: Math.round(h),
      top: Math.floor(r() * 4),        // 0 polos · 1 antena · 2 setback · 3 tangki/miring
      winTone: 0.32 + r() * 0.38,       // kerapatan jendela berbeda tiap gedung
    });
    x += w + 6 + r() * 14;
  }
  return (
    <g>
      {out.map((b, i) => {
        const bx = b.x; const bw = b.w; const by = baseY - b.h;
        return (
          <g key={i} opacity={win}>
            {/* badan gedung */}
            <rect x={bx} y={by} width={bw} height={b.h} fill={color} stroke="rgba(0,240,255,0.12)" strokeWidth="1" />
            {/* jendela (kepadatan beda → variasi) */}
            <rect x={bx} y={by} width={bw} height={b.h} fill="url(#cy-win)" opacity={b.winTone} />
            {/* garis atap neon */}
            <rect x={bx} y={by} width={bw} height="2" fill={rim} opacity="0.55" />

            {/* ── ATAP bervariasi (siluet kota, bukan batang) ── */}
            {b.top === 1 && (
              <g>
                <line x1={bx + bw / 2} y1={by} x2={bx + bw / 2} y2={by - 26 - (b.h % 20)} stroke={rim} strokeWidth="1.4" opacity="0.7" />
                <circle cx={bx + bw / 2} cy={by - 28 - (b.h % 20)} r="2" fill={SHU} opacity="0.9" />
              </g>
            )}
            {b.top === 2 && (
              <g>
                <rect x={bx + bw * 0.22} y={by - 22} width={bw * 0.56} height="22" fill={color} stroke="rgba(0,240,255,0.12)" strokeWidth="1" />
                <rect x={bx + bw * 0.22} y={by - 22} width={bw * 0.56} height="2" fill={rim} opacity="0.5" />
                <rect x={bx + bw * 0.4} y={by - 36} width={bw * 0.2} height="14" fill={color} stroke="rgba(0,240,255,0.1)" strokeWidth="1" />
              </g>
            )}
            {b.top === 3 && (
              <g>
                {/* tangki air / struktur atap */}
                <rect x={bx + bw * 0.3} y={by - 16} width={bw * 0.26} height="16" fill="#03060B" stroke="rgba(0,240,255,0.14)" strokeWidth="1" />
                <line x1={bx + bw * 0.43} y1={by - 16} x2={bx + bw * 0.43} y2={by - 30} stroke={rim} strokeWidth="1.2" opacity="0.6" />
                <rect x={bx + bw * 0.62} y={by - 8} width={bw * 0.2} height="8" fill={color} stroke="rgba(0,240,255,0.1)" strokeWidth="1" />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

// Papan neon kanji: tabung ganda (outline + inti terang) + glow.
// `vertical` → tiap aksara ditumpuk (writingMode CSS tak andal di SVG text).
// Glow pakai cy-glow-text (blur rapat) supaya goresan kanji tetap terbaca.
function NeonSign({ x, y, kanji, color = CYAN, size = 40, vertical = false, glow = 'cy-glow-text' }) {
  const chars = vertical ? Array.from(kanji) : [kanji];
  const step = size * 1.12;
  return (
    <g filter={`url(#${glow})`}>
      {chars.map((ch, i) => {
        const cy = vertical ? y + i * step : y;
        return (
          <g key={i}>
            <text x={x} y={cy} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round"
              style={{ fontFamily: 'var(--font-display)', fontSize: size, fontWeight: 800 }} textAnchor="middle">
              {ch}
            </text>
            <text x={x} y={cy} fill={color}
              style={{ fontFamily: 'var(--font-display)', fontSize: size, fontWeight: 800 }} textAnchor="middle">
              {ch}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// Gelombang cincin dari satu titik (komponen anak → hook di luar .map).
function Ripple({ ignite, k }) {
  const r = useTransform(ignite, (p) => p * (120 + k * 150));
  return <motion.circle cx="720" cy="360" fill="none" stroke={CYAN} strokeWidth="1" opacity="0.35" style={{ r }} />;
}

// Bar glitch RGB-split yang melompat (steps) — muncul saat momen, lalu mereda.
function GlitchBars({ clock, sceneStart, at, dur = 0.6, reduced = false, opacity = 0.9 }) {
  const bars = [
    { y: 210, h: 16, x: -30, w: 620, c: SHU },
    { y: 300, h: 10, x: 380, w: 720, c: CYAN },
    { y: 430, h: 20, x: 120, w: 520, c: CYAN },
    { y: 520, h: 12, x: 640, w: 640, c: SHU },
  ];
  const op = useTransform(clock, (t) => {
    if (reduced) return 0;
    const local = t - sceneStart - at;
    if (local < 0 || local > dur) return 0;
    // kedip: mati-hidup tiap ~0.08s (steps) lalu mereda di ujung
    const step = Math.floor(local / 0.08) % 2 === 0 ? 1 : 0.15;
    return step * (1 - local / dur) * opacity;
  });
  const jitter = useTransform(clock, (t) => {
    if (reduced) return 0;
    const local = t - sceneStart - at;
    if (local < 0 || local > dur) return 0;
    return (Math.floor(local / 0.08) % 3 - 1) * 16;
  });
  return (
    <motion.g style={{ opacity: op, x: jitter }} aria-hidden="true">
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x + 6} y={b.y} width={b.w} height={b.h} fill={SHU} opacity="0.5" mixBlendMode="screen" />
          <rect x={b.x - 6} y={b.y} width={b.w} height={b.h} fill={CYAN} opacity="0.5" mixBlendMode="screen" />
        </g>
      ))}
    </motion.g>
  );
}

// Drone kecil melintas (transform-only).
function Drone({ clock, sceneStart, fromX, fromY, toX, toY, at = 0, dur = 8, color = SHU }) {
  const x = useTransform(clock, (t) => {
    const local = t - sceneStart - at;
    if (local < 0) return fromX;
    if (local > dur) return toX;
    return fromX + (toX - fromX) * easeOut(local / dur);
  });
  const y = useTransform(clock, (t) => {
    const local = t - sceneStart - at;
    if (local < 0) return fromY;
    if (local > dur) return toY;
    return fromY + (toY - fromY) * easeOut(local / dur);
  });
  return (
    <motion.g style={{ x, y }} aria-hidden="true">
      <circle r="3.4" fill={color} />
      <circle r="9" fill="none" stroke={color} strokeWidth="1" opacity="0.4" />
      <line x1="-9" y1="0" x2="9" y2="0" stroke={color} strokeWidth="0.8" opacity="0.5" />
    </motion.g>
  );
}

// Label kanji babak (HUD, bukan kuas) — sudut, mono-ish.
function CyberMark({ text, color = CYAN }) {
  return (
    <div className="absolute left-1/2 top-[8%] -translate-x-1/2 flex items-center gap-3" aria-hidden="true">
      <span style={{ width: 26, height: 1, background: color, opacity: 0.6 }} />
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem,3.2vw,1.9rem)', color, opacity: 0.85, letterSpacing: '0.34em', textShadow: `0 0 12px ${color}` }}>
        {text}
      </span>
      <span style={{ width: 26, height: 1, background: color, opacity: 0.6 }} />
    </div>
  );
}

// Jalan basah: aspal + refleksi vertikal siluet + garis neon horizon.
// `reflections` → pilar cahaya neon memanjang di aspal (basah memantulkan papan).
// `perspective` → garis jalan konvergen ke titik hilang (kedalaman nyata).
function WetStreet({ clock, sceneStart: _sceneStart = 0, reduced = false, strength = 1, reflections = [], perspective = false }) {
  const shimmer = useTransform(clock, (t) => (reduced ? 0 : Math.sin(t * 0.7) * 3));
  return (
    <g aria-hidden="true">
      <rect x="0" y="560" width="1440" height="160" fill="#03060C" />
      {/* refleksi neon memanjang di aspal */}
      <motion.rect x="0" y="560" width="1440" height="160" fill="url(#cy-street)" style={{ opacity: strength, x: shimmer }} />
      {/* garis jalan KONVERGEN ke titik hilang (720,560) — kedalaman */}
      {perspective && Array.from({ length: 15 }, (_, i) => {
        const fx = (i - 7) * 320; // titik bawah menyebar jauh
        return <line key={`p${i}`} x1={fx} y1="720" x2="720" y2="560" stroke={CYAN} strokeWidth="1" opacity={0.16 * strength} />;
      })}
      {/* pilar refleksi papan neon (basah → memanjang ke bawah, makin pudar) */}
      {reflections.map((rf, i) => (
        <g key={i} opacity={0.5 * strength}>
          <rect x={rf.x - 22} y="560" width="44" height="140" fill={rf.c} opacity="0.12" />
          <rect x={rf.x - 6} y="560" width="12" height="150" fill={rf.c} opacity="0.22" />
        </g>
      ))}
      {Array.from({ length: 22 }, (_, i) => {
        const x = 30 + i * 64;
        return <line key={i} x1={x} y1="560" x2={x + 8} y2="720" stroke={CYAN} strokeWidth="1" opacity={0.10 * strength} />;
      })}
      {/* garis horizon neon (jalan basah memantulkan kota) */}
      <rect x="0" y="558" width="1440" height="2" fill={CYAN} opacity={0.35 * strength} />
    </g>
  );
}

// ── 1. 門 — gerbang kota: gelap → satu titik neon → GLITCH → kota tersingkap ──
export function SceneGate({ clock, sceneStart = 0, reduced = false }) {
  const ignite = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.9) / 1.6)));
  const glitch = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 2.8) / 1.0)));
  const reveal = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 4.4) / 2.4)));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <svg viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <CyberDefs />
        {/* kota tersingkap dari gelap (siluet jauh → dekat) */}
        <motion.g style={{ opacity: reveal }}>
          <Skyline seed={11} baseY={560} color="#050A12" win={0.5} rim={CYAN} count={18} minH={110} maxH={300} />
          <Skyline seed={29} baseY={600} color="#04070E" win={0.75} rim={CYAN} count={14} minH={150} maxH={420} />
          <WetStreet clock={clock} sceneStart={sceneStart} reduced={reduced} strength={0.7} />
          {/* papan neon jauh */}
          <NeonSign x={300} y={430} kanji="電脳" color={CYAN} size={38} />
          <NeonSign x={1130} y={470} kanji="常夜" color={SHU} size={34} />
        </motion.g>

        {/* satu titik neon yang menyala (gerbang) */}
        <motion.g style={{ opacity: ignite }}>
          <circle cx="720" cy="360" r={40 * 1} fill="none" stroke={CYAN} strokeWidth="1.6" opacity="0.5" />
          <motion.circle cx="720" cy="360" r="8" fill={CYAN} style={{ opacity: ignite }} />
          {/* gelombang kota dari titik */}
          {[1, 2, 3].map((k) => <Ripple key={k} ignite={ignite} k={k} />)}
        </motion.g>

        {/* GLITCH masuk — bar RGB-split */}
        <motion.g style={{ opacity: glitch }}>
          <GlitchBars clock={clock} sceneStart={sceneStart} at={2.8} dur={0.9} reduced={reduced} />
        </motion.g>

        {/* hujan mulai */}
        <motion.g style={{ opacity: reveal }}>
          <Drone clock={clock} sceneStart={sceneStart} fromX={-60} fromY={180} toX={1500} toY={150} at={3.4} dur={9} color={SHU} />
          <Drone clock={clock} sceneStart={sceneStart} fromX={1500} fromY={250} toX={-60} toY={220} at={4.0} dur={11} color={CYAN} />
        </motion.g>
      </svg>
      <CyberMark text="門" />
    </div>
  );
}

// ── 2. 街 — jalan neon: papan kanji, hologram, hujan, drone ──────────────────
export function SceneCity({ clock, sceneStart = 0, reduced = false }) {
  const inFar = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 1.2) / 2.2)));
  const in1 = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.3) / 2.0)));
  const holo = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 4.2) / 2.2)));
  const holoY = useTransform(clock, (t) => (reduced ? 0 : Math.sin(t * 0.9) * 6));
  const neonPulse = useTransform(clock, (t) => (reduced ? 1 : 0.75 + 0.25 * Math.abs(Math.sin(t * 1.7))));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <svg viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <CyberDefs />

        {/* lapis 1 — kota paling jauh, ditelan kabut (kedalaman) */}
        <motion.g style={{ opacity: inFar }}>
          <Skyline seed={7} baseY={470} color="#060C18" win={0.35} rim={CYAN} count={22} minH={70} maxH={200} />
          <rect x="0" y="340" width="1440" height="220" fill="url(#cy-fog)" opacity="0.9" />
        </motion.g>

        {/* lapis 2 — kota tengah */}
        <motion.g style={{ opacity: in1 }}>
          <Skyline seed={53} baseY={520} color="#04070E" win={0.5} rim={CYAN} count={18} minH={100} maxH={280} />
        </motion.g>

        {/* lapis 3 — gedung dekat kiri & kanan (bingkai jalan, tergelap) */}
        <motion.g style={{ opacity: in1 }}>
          <rect x="-60" y="60" width="330" height="540" fill="#03060B" stroke="rgba(0,240,255,0.14)" strokeWidth="1" />
          <rect x="-60" y="60" width="330" height="540" fill="url(#cy-win)" opacity="0.55" />
          <rect x="1170" y="30" width="340" height="570" fill="#03060B" stroke="rgba(0,240,255,0.14)" strokeWidth="1" />
          <rect x="1170" y="30" width="340" height="570" fill="url(#cy-win)" opacity="0.55" />
          {/* kabel menggantung */}
          <path d="M270 130 Q720 215 1170 120" fill="none" stroke={CYAN} strokeWidth="1.2" opacity="0.35" />
          <path d="M270 175 Q720 255 1170 168" fill="none" stroke={SHU} strokeWidth="1" opacity="0.3" />
        </motion.g>

        {/* papan neon kanji — DI DALAM frame (tak terpotong crop slice) — berdenyut */}
        <motion.g style={{ opacity: neonPulse }}>
          <NeonSign x={250} y={286} kanji="闇市" color={SHU} size={54} vertical />
          <NeonSign x={372} y={438} kanji="データ" color={CYAN} size={34} />
          <NeonSign x={1190} y={286} kanji="常夜" color={CYAN} size={54} vertical />
          <NeonSign x={1078} y={446} kanji="電脳" color={KIN} size={34} />
          {/* pilar neon fokus (kiri-tengah) — titik mata babak 街 */}
          <rect x="452" y="110" width="2" height="440" fill={KIN} opacity="0.30" />
          <NeonSign x={462} y={150} kanji="電脳" color={KIN} size={58} vertical />
        </motion.g>

        {/* hologram billboard di tengah jalan */}
        <motion.g style={{ opacity: holo, y: holoY }}>
          <rect x="560" y="250" width="320" height="180" fill="rgba(0,240,255,0.06)" stroke={CYAN} strokeWidth="1.4" />
          <rect x="560" y="250" width="320" height="180" fill="url(#cy-win)" opacity="0.25" />
          {/* garis scanline hologram */}
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1="560" y1={258 + i * 15} x2="880" y2={258 + i * 15} stroke={CYAN} strokeWidth="0.7" opacity="0.25" />
          ))}
          {/* figur hologram (siluet tembus pandang) */}
          <circle cx="720" cy="330" r="26" fill={CYAN} opacity="0.18" />
          <rect x="700" y="358" width="40" height="58" rx="6" fill={CYAN} opacity="0.16" />
          <NeonSign x={720} y={252} kanji="電脳" color={CYAN} size={22} />
        </motion.g>

        {/* jalan basah + refleksi neon + perspektif */}
        <WetStreet clock={clock} sceneStart={sceneStart} reduced={reduced} strength={1} perspective reflections={[
          { x: 250, c: SHU }, { x: 372, c: CYAN }, { x: 462, c: KIN }, { x: 1190, c: CYAN }, { x: 1078, c: KIN },
        ]} />

        {/* hujan (jelas) */}
        <RainStreaks clock={clock} reduced={reduced} />

        {/* lapis depan — pagar jalan + dua sosok siluet (kedalaman nyata) */}
        <motion.g style={{ opacity: in1 }} aria-hidden="true">
          {/* pagar pembatas jalan (garis depan gelap) */}
          <rect x="0" y="690" width="1440" height="30" fill="#02040A" />
          {Array.from({ length: 30 }, (_, i) => (
            <rect key={i} x={i * 48 + 6} y="672" width="3" height="26" fill="#050A14" stroke="rgba(0,240,255,0.10)" strokeWidth="0.6" />
          ))}
          <rect x="0" y="670" width="1440" height="3" fill="#050A14" stroke="rgba(0,240,255,0.12)" strokeWidth="0.6" />
          {/* dua sosok berdiri (siluet hitam + rim cyan) menghadap kota */}
          <g transform="translate(600 600)">
            <circle cx="0" cy="0" r="13" fill="#02040A" stroke="rgba(0,240,255,0.35)" strokeWidth="1" />
            <path d="M-11 14 L-9 66 L9 66 L11 14 Z" fill="#02040A" stroke="rgba(0,240,255,0.28)" strokeWidth="1" />
            <line x1="11" y1="20" x2="22" y2="40" stroke="rgba(0,240,255,0.25)" strokeWidth="1" />
          </g>
          <g transform="translate(650 596)">
            <circle cx="0" cy="0" r="12" fill="#02040A" stroke="rgba(255,46,76,0.30)" strokeWidth="1" />
            <path d="M-10 13 L-8 64 L8 64 L10 13 Z" fill="#02040A" stroke="rgba(255,46,76,0.24)" strokeWidth="1" />
          </g>
        </motion.g>

        {/* drone */}
        <Drone clock={clock} sceneStart={sceneStart} fromX={-60} fromY={160} toX={1520} toY={140} at={1.2} dur={8} color={SHU} />
        <Drone clock={clock} sceneStart={sceneStart} fromX={1520} fromY={300} toX={-60} toY={280} at={6.0} dur={9} color={CYAN} />

        <GlitchBars clock={clock} sceneStart={sceneStart} at={3.2} dur={0.5} reduced={reduced} opacity={0.7} />
        <GlitchBars clock={clock} sceneStart={sceneStart} at={11.2} dur={0.5} reduced={reduced} opacity={0.7} />
      </svg>
      <CyberMark text="街" color={CYAN} />
    </div>
  );
}

// ── 3. 頂 — PUNCAK PERADABAN: menara cahaya menembus langit + data naik ──────
export function ScenePeak({ clock, sceneStart = 0, reduced = false }) {
  const rise = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.4) / 2.6)));
  const beam = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 3.6) / 2.4)));
  const dataY = useTransform(clock, (t) => (reduced ? 0 : -((t - sceneStart) * 60 % 720)));
  const ringSpin = useTransform(clock, (t) => (reduced ? 0 : (t - sceneStart) * 16));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <svg viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <CyberDefs />
        {/* kota paling padat (puncak peradaban) */}
        <motion.g style={{ opacity: rise }}>
          <Skyline seed={71} baseY={500} color="#04070E" win={0.4} rim={CYAN} count={24} minH={80} maxH={230} />
          <Skyline seed={97} baseY={560} color="#050A12" win={0.6} rim={CYAN} count={18} minH={130} maxH={340} />
        </motion.g>

        {/* aliran data naik (streak cyan) */}
        <motion.g style={{ opacity: beam, y: dataY }}>
          {Array.from({ length: 26 }, (_, i) => {
            const x = 40 + i * 54;
            const h = 60 + (i % 5) * 40;
            return <line key={i} x1={x} y1={720} x2={x} y2={720 - h} stroke={CYAN} strokeWidth={i % 3 === 0 ? 2 : 1} opacity="0.4" />;
          })}
        </motion.g>

        {/* MENARA CAHAYA (pusat puncak peradaban) */}
        <motion.g style={{ opacity: rise }}>
          {/* badan menara */}
          <polygon points="700,150 740,150 760,560 680,560" fill="#070D18" stroke={CYAN} strokeWidth="1.6" />
          {Array.from({ length: 14 }, (_, i) => (
            <line key={i} x1="690" y1={180 + i * 26} x2="750" y2={180 + i * 26} stroke={CYAN} strokeWidth="0.8" opacity="0.35" />
          ))}
          {/* puncak menyala */}
          <circle cx="720" cy="146" r="7" fill={KIN} />
          {/* berkas cahaya menembus langit */}
          <motion.polygon points="720,146 640,0 800,0" fill={CYAN} style={{ opacity: beam }} filter="url(#cy-glow-lg)" />
          {/* cincin hologram berputar mengelilingi menara */}
          <motion.g style={{ rotate: ringSpin }} transform="translate(720 300)">
            {[120, 165, 210].map((r, i) => (
              <ellipse key={i} rx={r} ry={r * 0.28} fill="none" stroke={i === 1 ? KIN : CYAN} strokeWidth={i === 1 ? 2 : 1.2}
                strokeDasharray={i === 0 ? '16 12' : i === 2 ? '8 14' : 'none'} opacity="0.75" />
            ))}
          </motion.g>
        </motion.g>

        {/* papan hologram menjulang (puncak = paling terang) */}
        <motion.g style={{ opacity: beam }}>
          <NeonSign x={220} y={300} kanji="文明" color={CYAN} size={42} vertical />
          <NeonSign x={1230} y={300} kanji="頂" color={KIN} size={52} vertical />
          <NeonSign x={420} y={200} kanji="光" color={CYAN} size={30} />
          <NeonSign x={1030} y={210} kanji="塔" color={SHU} size={30} />
        </motion.g>

        <WetStreet clock={clock} sceneStart={sceneStart} reduced={reduced} strength={1.15} />
        <Drone clock={clock} sceneStart={sceneStart} fromX={-60} fromY={120} toX={1520} toY={100} at={0.8} dur={7} color={KIN} />
        <Drone clock={clock} sceneStart={sceneStart} fromX={1520} fromY={360} toX={-60} toY={340} at={5.0} dur={8} color={CYAN} />

        <GlitchBars clock={clock} sceneStart={sceneStart} at={4.0} dur={0.5} reduced={reduced} opacity={0.8} />
        <GlitchBars clock={clock} sceneStart={sceneStart} at={9.6} dur={0.5} reduced={reduced} opacity={0.8} />
      </svg>
      <CyberMark text="頂" color={KIN} />
    </div>
  );
}

// ── 4. 終 — MALAM TANPA AKHIR: daya turun, kota padam, malam tak usai ────────
export function SceneEndless({ clock, sceneStart = 0, reduced = false }) {
  const blackout = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 0.6) / 5.0)));
  // lampu mati bertahap: opacity kota = 1 - blackout
  const cityOp = useTransform(blackout, (p) => 1 - p * 0.88);
  const flicker = useTransform(clock, (t) => {
    if (reduced) return 1;
    const local = t - sceneStart - 4.0;
    if (local < 0) return 1;
    // kedip makin jarang (kota sekarat)
    const k = Math.floor(local * 3) % 4;
    return k === 0 ? 0.25 : 1;
  });
  const vast = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 3.0) / 4.0)));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <svg viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <CyberDefs />
        {/* langit makin luas & kosong (malam menelan kota) */}
        <motion.rect x="0" y="0" width="1440" height="720" fill="#020305" style={{ opacity: vast }} />

        {/* kota padam bertahap */}
        <motion.g style={{ opacity: cityOp }}>
          <Skyline seed={131} baseY={520} color="#03060C" win={0.35} rim={CYAN} count={20} minH={90} maxH={260} />
          <Skyline seed={163} baseY={580} color="#04070E" win={0.5} rim={CYAN} count={16} minH={120} maxH={330} />
          <WetStreet clock={clock} sceneStart={sceneStart} reduced={reduced} strength={0.5} />
        </motion.g>

        {/* beberapa papan neon yang masih berkedip (sekarat) */}
        <motion.g style={{ opacity: flicker }}>
          <NeonSign x={240} y={340} kanji="終" color={SHU} size={54} vertical />
          <NeonSign x={1200} y={360} kanji="夜" color={CYAN} size={44} vertical />
        </motion.g>

        {/* hujan tinggal — satu-satunya yang hidup */}
        <g opacity="0.5" aria-hidden="true">
          {Array.from({ length: 70 }, (_, i) => {
            const x = (i * 211) % 1440;
            const y = (i * 137) % 720;
            return <line key={i} x1={x} y1={y} x2={x - 10} y2={y + 34} stroke={CYAN} strokeWidth="0.9" opacity="0.35" />;
          })}
        </g>

        <GlitchBars clock={clock} sceneStart={sceneStart} at={6.4} dur={0.5} reduced={reduced} opacity={0.7} />
        <GlitchBars clock={clock} sceneStart={sceneStart} at={11.0} dur={0.5} reduced={reduced} opacity={0.7} />
      </svg>
      <CyberMark text="終" color={SHU} />
    </div>
  );
}

// ── 5. 家 — satu jendela tetap menyala → segel 家 + 題字 電脳 ─────────────────
export function SceneHome({ clock, sceneStart = 0, reduced = false }) {
  const dark = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 0.4) / 1.6)));
  const lit = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 1.6) / 1.6)));
  const litGlow = useTransform(clock, (t) => (reduced ? 1 : 0.6 + 0.4 * Math.abs(Math.sin(t * 1.3))));
  const seal = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 4.6) / 1.2)));
  const sealRot = useTransform(clock, (t) => (reduced ? -4 : (1 - clamp01((t - sceneStart - 4.6) / 1.2)) * 16 - 4));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <svg viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <CyberDefs />
        {/* kota gelap (malam sudah menang) */}
        <motion.g style={{ opacity: dark }}>
          <Skyline seed={199} baseY={540} color="#03060C" win={0.28} rim={CYAN} count={22} minH={90} maxH={300} />
          <Skyline seed={233} baseY={600} color="#04070E" win={0.4} rim={CYAN} count={16} minH={130} maxH={360} />
          <WetStreet clock={clock} sceneStart={sceneStart} reduced={reduced} strength={0.45} />
        </motion.g>

        {/* SATU JENDELA MENYALA — rumah Nacht & Saku (kontras tunggal) */}
        <motion.g style={{ opacity: lit }}>
          {/* gedung kecil tempat jendela itu */}
          <rect x="640" y="330" width="170" height="270" fill="#05090F" stroke="rgba(0,240,255,0.2)" strokeWidth="1.2" />
          <rect x="640" y="330" width="170" height="270" fill="url(#cy-win)" opacity="0.25" />
          {/* jendela hangat (kin) — satu-satunya cahaya hidup */}
          <motion.rect x="700" y="400" width="52" height="46" fill={KIN} style={{ opacity: litGlow }} filter="url(#cy-glow-lg)" />
          <rect x="700" y="400" width="52" height="46" fill="none" stroke={KIN} strokeWidth="1.4" />
          <line x1="726" y1="400" x2="726" y2="446" stroke="#05090F" strokeWidth="1.6" />
          <line x1="700" y1="423" x2="752" y2="423" stroke="#05090F" strokeWidth="1.6" />
          {/* berkas hangat jatuh ke aspal */}
          <polygon points="700,446 752,446 800,720 640,720" fill={KIN} opacity="0.06" />
        </motion.g>

        {/* segel 家 — hanko holo (border kin + dashed inset + glow) */}
        <motion.g style={{ opacity: seal, rotate: sealRot }} transform="translate(1130 200)">
          <rect x="-58" y="-58" width="116" height="116" fill="rgba(255,226,58,0.06)" stroke={KIN} strokeWidth="2.4" filter="url(#cy-glow)" />
          <rect x="-46" y="-46" width="92" height="92" fill="none" stroke={KIN} strokeWidth="1" strokeDasharray="6 5" opacity="0.8" />
          <text x="0" y="20" fill={KIN} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 800 }}>
            家
          </text>
        </motion.g>

        <Drone clock={clock} sceneStart={sceneStart} fromX={-60} fromY={200} toX={1520} toY={180} at={2.0} dur={9} color={CYAN} />
        <GlitchBars clock={clock} sceneStart={sceneStart} at={12.4} dur={0.5} reduced={reduced} opacity={0.6} />
      </svg>
      <CyberMark text="家" color={KIN} />
    </div>
  );
}

export default SceneGate;
