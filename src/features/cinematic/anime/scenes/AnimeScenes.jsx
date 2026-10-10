// ─────────────────────────────────────────────────────────────────────────────
// Scene visual era 多元 — 5 babak cinematic (PRD docs/tema/anime.md §10).
// Semua view menerima { clock, sceneStart, reduced, portrait } dan MENGENDALIKAN
// dirinya dari jam (motion value) — tanpa re-render per frame.
//
//   tear    → 開幕: halaman 絵巻 dibuka, lalu SOBEK (celah cahaya)
//   burst   → panel keluar dari sobekan: banyak dunia sekaligus, キラキラ
//   montage → 冒険 → 日常 → 青春 → 魔法 (4 panel muncul berurutan)
//   worlds  → 怪談 (gelap) → 異世界 (portal) → panel menyatu
//   finale  → semua panel menutup jadi satu 題字 多元 + segel 印
//
// BAHASA RUPA = MANGA / CEL-SHADE, bukan beton (Shōwa), bukan letterpress
// (Meiji), bukan ukiyo-e (Edo), bukan kuas (Heian):
//   • OUTLINE TINTA — garis hitam 3px (bukan garis tipis 1px era lain).
//   • CEL-SHADE    — warna sel datar + bayangan keras 5px 5px 0 0.
//   • SCREENTONE   — bintik cel halftone.
//   • SPEEDLINE    — garis kecepatan (manga action).
// Palet token cinematic --an-* (shiro, sumi, shu, sora, sakura, gold).
// ⚠️ §6.4: semua dunia/karakter ORISINAL — siluet generik, tanpa detail IP.
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (p) => 1 - Math.pow(1 - clamp01(p), 3);

// Bayangan keras cel (offset tebal, sudut agak membulat — bahasa manga).
const CEL = 'drop-shadow(5px 5px 0 rgba(20,20,18,0.85))';

// Panel dasar: kertas shiro.
function Sheet({ from, to, opacity = 1 }) {
  return <div className="absolute inset-0" style={{ opacity, background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)` }} />;
}

// Label kanji babak (display tebal, outline tinta).
function SceneMark({ text, color = 'var(--an-sumi)' }) {
  return (
    <div className="absolute left-1/2 top-[9%] -translate-x-1/2"
         style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem,3.6vw,2.2rem)', color, opacity: 0.7, letterSpacing: '0.34em', filter: CEL }}>
      {text}
    </div>
  );
}

// Panel kotak dengan outline tinta + screentone — blok dasar bahasa manga.
function Panel({ x, y, w, h, fill = 'var(--an-shiro)', opacity = 1, style }) {
  return (
    <motion.g style={style} opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} fill={fill} stroke="var(--an-sumi)" strokeWidth="3" />
      <rect x={x} y={y} width={w} height={h} fill="url(#an-screentone)" opacity="0.5" />
    </motion.g>
  );
}

// Definisi pola screentone (dipakai semua scene) — ditaruh sekali per SVG.
function ToneDefs() {
  return (
    <defs>
      <pattern id="an-screentone" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="1.4" cy="1.4" r="0.9" fill="var(--an-sumi)" opacity="0.5" />
      </pattern>
    </defs>
  );
}

// ── 1. 開幕 — halaman dibuka, lalu SOBEK ────────────────────────────────────
export function SceneTear({ clock, sceneStart = 0, reduced = false }) {
  const open = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.3) / 2.2)));
  const tear = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 3.2) / 1.4)));
  const light = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 4.0) / 2.6)));
  const jag = useTransform(clock, (t) => (reduced ? 0 : (1 - tear) * 40));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(255,255,255,0.20)" to="rgba(240,240,236,0)" />
      <svg viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <ToneDefs />
        {/* halaman 絵巻 terbuka — panel-panel rapi */}
        <motion.g style={{ opacity: open }}>
          <Panel x="180" y="150" w="330" h="200" />
          <Panel x="530" y="150" w="380" h="200" />
          <Panel x="930" y="150" w="330" h="200" />
          <Panel x="180" y="370" w="440" h="210" />
          <Panel x="640" y="370" w="620" h="210" />
        </motion.g>
        {/* celah SOBEK — poligon bergerigi di tengah halaman */}
        <motion.g style={{ opacity: tear }}>
          <path
            d="M700 120 L742 200 L706 250 L756 330 L712 392 L768 470 L724 540 L780 620 L700 620 L660 540 L704 470 L650 392 L696 330 L646 250 L690 200 Z"
            fill="var(--an-shiro)" stroke="var(--an-sumi)" strokeWidth="3"
            style={{ x: jag }}
          />
          {/* cahaya keluar dari celah */}
          <motion.rect x="690" y="120" width="70" height="500" fill="var(--an-gold)" opacity="0.55" style={{ opacity: light }} />
        </motion.g>
        {/* garis kecepatan radial dari celah */}
        <motion.g style={{ opacity: light }}>
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2;
            const x1 = 720 + Math.cos(a) * 120;
            const y1 = 360 + Math.sin(a) * 120;
            const x2 = 720 + Math.cos(a) * 700;
            const y2 = 360 + Math.sin(a) * 700;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--an-sumi)" strokeWidth="2" opacity="0.5" />;
          })}
        </motion.g>
      </svg>
      <SceneMark text="開幕" color="var(--an-sumi)" />
    </div>
  );
}

// Panel dunia yang terbang keluar — komponen anak supaya hook (useTransform)
// TIDAK dipanggil di dalam .map() (patuh Rules of Hooks).
function BurstPanel({ out, dx, dy, w, h, fill, tilt, reduced }) {
  const x = useTransform(out, (o) => dx * o);
  const y = useTransform(out, (o) => dy * o);
  const rotate = useTransform(out, (o) => (reduced ? 0 : tilt * (1 - o)));
  return (
    <motion.g style={{ x, y, rotate }} opacity={0.92}>
      <rect x={720 - w / 2} y={360 - h / 2} width={w} height={h} fill={fill} stroke="var(--an-sumi)" strokeWidth="3" />
      <rect x={720 - w / 2} y={360 - h / 2} width={w} height={h} fill="url(#an-screentone)" opacity="0.45" />
      {/* siluet generik di dalam panel (tanpa detail IP) */}
      <circle cx={720} cy={360 - h / 2 + h * 0.42} r={h * 0.14} fill="var(--an-shiro)" opacity="0.85" />
      <rect x={720 - w * 0.14} y={360 - h / 2 + h * 0.56} width={w * 0.28} height={h * 0.26} fill="var(--an-shiro)" opacity="0.85" rx="4" />
    </motion.g>
  );
}

// ── 2. 頁 — panel keluar dari sobekan, banyak dunia sekaligus ────────────────
export function SceneBurst({ clock, sceneStart = 0, reduced = false }) {
  const out = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.3) / 2.6)));

  // Panel-panel dunia terbang keluar dari pusat (masing-masing rona berbeda).
  const PANELS = [
    { dx: -430, dy: -220, w: 260, h: 170, fill: '#2b6cb0', tilt: -8 },
    { dx: 300, dy: -250, w: 240, h: 160, fill: '#f0c862', tilt: 8 },
    { dx: -470, dy: 120, w: 250, h: 180, fill: '#6b4fa0', tilt: 7 },
    { dx: 420, dy: 90, w: 260, h: 170, fill: '#3a5a40', tilt: -7 },
    { dx: -160, dy: 260, w: 230, h: 150, fill: '#d94f3d', tilt: 9 },
    { dx: 200, dy: 250, w: 240, h: 160, fill: '#f18bb0', tilt: -9 },
  ];

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(240,200,98,0.10)" to="rgba(255,255,255,0)" />
      <svg viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <ToneDefs />
        {/* sumber: celah cahaya di tengah */}
        <circle cx="720" cy="360" r="70" fill="var(--an-gold)" opacity="0.5" />
        {/* panel dunia terbang keluar */}
        {PANELS.map((p, i) => (
          <BurstPanel key={i} out={out} {...p} reduced={reduced} />
        ))}
        {/* キラキラ — kilau bintang kecil */}
        {[[300, 200], [1120, 180], [260, 520], [1160, 540], [720, 130]].map(([x, y], i) => (
          <motion.path key={i} d={`M${x} ${y - 18} L${x + 5} ${y - 5} L${x + 18} ${y} L${x + 5} ${y + 5} L${x} ${y + 18} L${x - 5} ${y + 5} L${x - 18} ${y} L${x - 5} ${y - 5} Z`}
            fill="var(--an-gold)" style={{ opacity: out }} />
        ))}
      </svg>
      <SceneMark text="頁" color="var(--an-sora)" />
    </div>
  );
}

// ── 3. 物語 — montase 4 dunia: 冒険 → 日常 → 青春 → 魔法 ─────────────────────
export function SceneMontage({ clock, sceneStart = 0, reduced = false }) {
  // 4 panel muncul berurutan.
  const p0 = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.6) / 1.4)));
  const p1 = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 4.0) / 1.4)));
  const p2 = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 7.4) / 1.4)));
  const p3 = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 10.8) / 1.4)));
  const ops = [p0, p1, p2, p3];

  // 4 dunia (kanji label + rona). Semua ORISINAL.
  const WORLDS = [
    { jp: '冒険', fill: '#2b6cb0', kind: 'adventure' },
    { jp: '日常', fill: '#f0c862', kind: 'daily' },
    { jp: '青春', fill: '#d94f3d', kind: 'youth' },
    { jp: '魔法', fill: '#6b4fa0', kind: 'magic' },
  ];
  const POS = [
    { x: 150, y: 190, w: 520, h: 340 },
    { x: 770, y: 190, w: 520, h: 340 },
    { x: 150, y: 570, w: 520, h: 0 },   // placeholder (di bawah, clip)
    { x: 770, y: 570, w: 520, h: 0 },
  ];

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(43,108,176,0.08)" to="rgba(255,255,255,0)" />
      <svg viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <ToneDefs />
        {/* panel kiri-atas: 冒険 */}
        <motion.g style={{ opacity: p0 }}>
          <rect x="140" y="170" width="540" height="330" fill="#2b6cb0" stroke="var(--an-sumi)" strokeWidth="3" />
          <rect x="140" y="170" width="540" height="330" fill="url(#an-screentone)" opacity="0.4" />
          {/* garis kecepatan shōnen */}
          {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={200 + i * 90} y1="500" x2={260 + i * 90} y2="200" stroke="var(--an-shiro)" strokeWidth="3" opacity="0.4" />)}
          <circle cx="300" cy="300" r="46" fill="var(--an-shiro)" opacity="0.9" />
          <rect x="264" y="356" width="72" height="110" fill="var(--an-shiro)" opacity="0.9" rx="6" />
        </motion.g>
        {/* panel kanan-atas: 日常 */}
        <motion.g style={{ opacity: p1 }}>
          <rect x="760" y="170" width="540" height="330" fill="#f0c862" stroke="var(--an-sumi)" strokeWidth="3" />
          <rect x="760" y="170" width="540" height="330" fill="url(#an-screentone)" opacity="0.4" />
          <rect x="800" y="380" width="460" height="14" fill="var(--an-sumi)" opacity="0.5" />
          <circle cx="920" cy="320" r="40" fill="var(--an-sumi)" opacity="0.8" />
          <circle cx="1140" cy="330" r="36" fill="var(--an-sumi)" opacity="0.7" />
        </motion.g>
        {/* panel kiri-bawah: 青春 */}
        <motion.g style={{ opacity: p2 }}>
          <rect x="140" y="530" width="540" height="330" fill="#d94f3d" stroke="var(--an-sumi)" strokeWidth="3" />
          <rect x="140" y="530" width="540" height="330" fill="url(#an-screentone)" opacity="0.4" />
          <circle cx="820" cy="470" r="70" fill="var(--an-gold)" opacity="0.5" />
          {[0, 1, 2].map((i) => <rect key={i} x={250 + i * 130} y="700" width="26" height="120" fill="var(--an-sumi)" opacity="0.7" />)}
        </motion.g>
        {/* panel kanan-bawah: 魔法 */}
        <motion.g style={{ opacity: p3 }}>
          <rect x="760" y="530" width="540" height="330" fill="#6b4fa0" stroke="var(--an-sumi)" strokeWidth="3" />
          <rect x="760" y="530" width="540" height="330" fill="url(#an-screentone)" opacity="0.4" />
          {[[980, 700], [1080, 640], [1180, 720]].map(([x, y], i) => (
            <motion.path key={i} d={`M${x} ${y - 40} L${x + 18} ${y} L${x} ${y + 40} L${x - 18} ${y} Z`} fill="var(--an-sakura)" opacity="0.9" />
          ))}
        </motion.g>
      </svg>
      {/* label dunia (HTML agar font display tajam) */}
      <div className="absolute inset-0 grid grid-cols-2 gap-4 px-[10%] py-[24%]" aria-hidden="true">
        {WORLDS.map((w, i) => (
          <motion.span key={w.jp} className="self-center justify-self-center"
            style={{ opacity: ops[i], fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem,4.4vw,3rem)', fontWeight: 900, color: 'var(--an-shiro)', letterSpacing: '0.2em', filter: CEL }}>
            {w.jp}
          </motion.span>
        ))}
      </div>
      <SceneMark text="物語" color="var(--an-sora)" />
    </div>
  );
}

// ── 4. 世界 — 怪談 (gelap) → 異世界 (portal) → panel menyatu ────────────────
export function SceneWorlds({ clock, sceneStart = 0, reduced = false }) {
  const dark = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 0.4) / 2.4)));
  const portal = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 6.6) / 2.4)));
  const merge = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 11.0) / 2.6)));
  const portalSpin = useTransform(clock, (t) => (reduced ? 0 : (t - sceneStart) * 22));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(20,22,30,0.20)" to="rgba(20,22,30,0)" />
      <svg viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <ToneDefs />
        {/* 怪談: panel gelap + satu lampu + bayangan */}
        <motion.g style={{ opacity: dark }}>
          <rect x="180" y="140" width="1080" height="440" fill="#14161e" stroke="var(--an-sumi)" strokeWidth="3" />
          <rect x="180" y="140" width="1080" height="440" fill="url(#an-screentone)" opacity="0.6" />
          {/* satu lampu */}
          <circle cx="720" cy="240" r="60" fill="rgba(220,220,235,0.16)" />
          <circle cx="720" cy="240" r="16" fill="rgba(235,235,245,0.5)" />
          {/* siluet samar (bukan detail) */}
          <ellipse cx="720" cy="470" rx="60" ry="90" fill="var(--an-sumi)" opacity="0.6" />
        </motion.g>
        {/* 異世界: portal cincin berputar */}
        <motion.g style={{ opacity: portal }} transform="translate(720 360)">
          <motion.g style={{ rotate: portalSpin }}>
            {[70, 100, 130].map((r, i) => (
              <circle key={i} r={r} fill="none" stroke={i === 1 ? 'var(--an-sakura)' : 'var(--an-sora)'} strokeWidth={i === 1 ? 5 : 3} strokeDasharray={i === 0 ? '18 12' : i === 2 ? '10 16' : 'none'} opacity="0.85" />
            ))}
          </motion.g>
          <circle r="46" fill="var(--an-gold)" opacity="0.4" />
          {/* dua bulan (dunia lain) */}
          <circle cx="-260" cy="-220" r="30" fill="var(--an-shiro)" opacity="0.5" />
          <circle cx="-200" cy="-250" r="18" fill="var(--an-shiro)" opacity="0.4" />
        </motion.g>
        {/* panel menyatu: bingkai menutup */}
        <motion.g style={{ opacity: merge }}>
          {[[100, 80], [1340, 80], [100, 640], [1340, 640]].map(([x, y], i) => (
            <rect key={i} x={x - 120} y={y - 60} width="240" height="120" fill="var(--an-shiro)" stroke="var(--an-sumi)" strokeWidth="3" opacity="0.9" />
          ))}
        </motion.g>
      </svg>
      <SceneMark text="世界" color="var(--an-sakura)" />
    </div>
  );
}

// ── 5. 最終回 — panel menutup jadi satu 題字 多元 + segel 印 ─────────────────
export function SceneFinale({ clock, sceneStart = 0, reduced = false }) {
  const close = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.4) / 2.4)));
  const title = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 4.6) / 1.4)));
  const seal = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 6.4) / 1.2)));
  const sealRot = useTransform(clock, (t) => (reduced ? -6 : (1 - clamp01((t - sceneStart - 6.4) / 1.2)) * 20 - 6));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Sheet from="rgba(107,79,160,0.12)" to="rgba(240,200,98,0)" />
      {/* tirai panel menutup dari kiri & kanan — blok shiro + outline tinta */}
      <motion.div className="absolute inset-y-0 left-0" style={{
        width: '50%',
        background: 'linear-gradient(90deg, rgba(0,0,0,0.04), transparent), var(--an-shiro)',
        borderRight: '3px solid var(--an-sumi)',
        x: useTransform(close, (p) => `${-100 * (1 - p)}%`),
      }} />
      <motion.div className="absolute inset-y-0 right-0" style={{
        width: '50%',
        background: 'linear-gradient(270deg, rgba(0,0,0,0.04), transparent), var(--an-shiro)',
        borderLeft: '3px solid var(--an-sumi)',
        x: useTransform(close, (p) => `${100 * (1 - p)}%`),
      }} />

      {/* 題字 多元 — di tengah */}
      <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center" style={{ opacity: title }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem,13vw,8rem)', fontWeight: 900, color: 'var(--an-sumi)', letterSpacing: '0.16em', filter: CEL }}>
          多元
        </span>
        <p className="mt-2 font-sans font-black tracking-[0.5em]" style={{ color: 'var(--an-shu)', fontSize: 'clamp(0.6rem,2vw,0.9rem)' }}>
          TAGEN · MULTIVERSE
        </p>
      </motion.div>

      {/* segel 印 — kotak shu, kanji display, bayangan keras */}
      <motion.div
        className="absolute right-[12%] bottom-[16%] flex items-center justify-center"
        style={{
          width: 'clamp(70px,13vw,120px)', height: 'clamp(70px,13vw,120px)',
          background: 'linear-gradient(160deg, #d34a3c 0%, var(--an-shu) 60%, #8e2f26 100%)',
          color: 'var(--an-shiro)',
          border: '3px solid var(--an-sumi)',
          borderRadius: 6,
          filter: 'drop-shadow(5px 5px 0 rgba(20,20,18,0.5))',
          rotate: sealRot, opacity: seal,
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,6vw,3.2rem)', lineHeight: 1 }}>印</span>
      </motion.div>
    </div>
  );
}

export default SceneTear;
