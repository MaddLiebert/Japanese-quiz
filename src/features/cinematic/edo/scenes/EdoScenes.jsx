// ─────────────────────────────────────────────────────────────────────────────
// Scene visual era Edo 江戸 — 5 babak cinematic (PRD docs/tema/edo.md §10).
// Semua view menerima { clock, sceneStart, reduced, portrait } dan MENGENDALIKAN
// dirinya dari jam (motion value) — tanpa re-render per frame.
//
//   map      → peta Tōkaidō tergelar (kayu bergesek)
//   capital  → 日本橋, kerumunan pagi, ikan di pasar
//   print    → blok kayu diukir, tinta ditekan, kertas tercetak
//   night    → 提灯 menyala di jalan malam
//   change   → peta menutup + segel 極
//
// BAHASA RUPA = UKIYO-E, bukan web/brutalist:
//   • bokashi  — gradien disapu tangan (langit indigo→terang, air) — tanda
//                tangan Hokusai/Hiroshige. BUKAN blok warna datar.
//   • garis ukir hidup — ketebalan bervariasi, ujung membulat, bukan stroke
//                seragam matematis.
//   • misregistrasi (色ズレ) — pelat warna bergeser sedikit: indigo & vermilion
//                BERGESER dari tinta. BUKAN bayangan hitam 6px 6px 0 0.
//   • lapisan gunung / gelombang / cakram matahari — motif ikonik ukiyo-e.
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useTransform } from 'motion/react';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (p) => 1 - Math.pow(1 - clamp01(p), 3);

// Misregistrasi pelat warna: lapisan indigo & vermilion bergeser dari tinta.
// Dipakai sebagai "bayangan" kartu — berwarna, bukan hitam brutalist.
const REG = 'drop-shadow(1.5px 1.5px 0 rgba(30,79,121,0.28)) drop-shadow(3px 3px 0 rgba(192,57,43,0.18))';

// Bokashi: gradien vertikal bergaya sapuan kuas (indigo pekat → pucat).
function BokashiSky({ from, to, opacity = 1 }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        opacity,
        background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)`,
      }}
    />
  );
}

// ── 1. 東海道 — peta tergelar (bokashi langit + jalan berkelok) ──────────────
export function SceneMap({ clock, sceneStart = 0, reduced = false }) {
  const unroll = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.3) / 2.8)));
  const roadOpacity = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 2.2) / 2.0)));
  const sun = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 0.2) / 2.0)));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Bokashi langit fajar: indigo pucat → krem kertas */}
      <BokashiSky from="rgba(30,79,121,0.22)" to="rgba(230,220,194,0)" />
      {/* Cakram matahari 日の丸 redup, muncul perlahan */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: '16%', top: '16%', width: 'min(18vw,180px)', height: 'min(18vw,180px)',
          background: 'radial-gradient(circle, var(--edk-shu) 58%, rgba(192,57,43,0) 72%)',
          opacity: useTransform(sun, (p) => p * 0.7),
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 'min(78vw, 720px)',
          height: 'min(48vh, 380px)',
          /* Kertas gulung: serat washi + bokashi tepi, BUKAN blok datar */
          background: `linear-gradient(160deg, rgba(255,255,255,0.35) 0%, transparent 44%), var(--edk-paper-2)`,
          border: '1px solid var(--edk-ink)',
          filter: REG,
          scaleX: unroll,
          transformOrigin: 'center',
        }}
      >
        <svg viewBox="0 0 720 380" className="h-full w-full">
          {/* gunung berlapis (siluet) — kedalaman ukiyo-e */}
          <g opacity="0.5">
            <path d="M0 300 L110 220 L190 268 L300 190 L410 262 L520 206 L620 258 L720 214 L720 380 L0 380 Z"
                  fill="rgba(30,79,121,0.28)" />
            <path d="M0 330 L140 258 L250 300 L370 246 L500 296 L640 250 L720 292 L720 380 L0 380 Z"
                  fill="rgba(30,79,121,0.42)" />
          </g>
          {/* Jalan 東海道 — garis ukir hidup, ujung membulat */}
          <motion.g style={{ opacity: roadOpacity }} stroke="var(--edk-ink)" strokeWidth="2.6"
                       fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M60 320 Q200 260 300 300 Q420 344 540 270 Q620 224 680 250" />
          </motion.g>
          <motion.g style={{ opacity: roadOpacity }} stroke="var(--edk-shu)" strokeWidth="2"
                       fill="none" strokeLinecap="round">
            <path d="M300 300 Q320 210 360 150 Q392 100 420 70" />
          </motion.g>
          {/* stasiun 宿場 — titik tinta + cincin misregistrasi */}
          <motion.g style={{ opacity: roadOpacity }}>
            {[[60, 320], [300, 300], [540, 270], [680, 250]].map(([x, y], i) => (
              <g key={i}>
                <circle cx={x + 1.5} cy={y + 1.5} r="6" fill="var(--edk-ai)" opacity="0.45" />
                <circle cx={x} cy={y} r="5" fill="var(--edk-ink)" />
              </g>
            ))}
          </motion.g>
          <text x="360" y="352" textAnchor="middle" fontFamily="var(--font-display)" fontSize="20"
                fill="var(--edk-ink)" opacity="0.5">東海道</text>
        </svg>
      </motion.div>
    </div>
  );
}

// ── 2. 日本橋 — jembatan lengkung + pasar pagi + air berbokashi ──────────────
export function SceneCapital({ clock, sceneStart = 0, reduced = false }) {
  const bridge = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.2) / 2.4)));
  const crowd = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 1.6) / 2.2)));
  const water = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 0.1) / 1.8)));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Langit bokashi pagi */}
      <BokashiSky from="rgba(192,57,43,0.10)" to="rgba(30,79,121,0.06)" />
      <svg viewBox="0 0 1440 620" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          {/* Bokashi air: indigo pekat di horizon → pucat di depan (sapuan tangan) */}
          <linearGradient id="edkWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--edk-ai)" stopOpacity="0.52" />
            <stop offset="55%" stopColor="var(--edk-ai)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="var(--edk-ai)" stopOpacity="0.12" />
          </linearGradient>
          {/* Bokashi Fuji: puncak terang → kaki pucat (kedalaman) */}
          <linearGradient id="edkFuji" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--edk-paper)" stopOpacity="0.95" />
            <stop offset="42%" stopColor="var(--edk-ai)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="var(--edk-ai)" stopOpacity="0.14" />
          </linearGradient>
        </defs>

        {/* ── BACKGROUND jauh: 富士 Fuji + atap kota berlapis (kedalaman ukiyo-e) ── */}
        <motion.g style={{ opacity: water }}>
          {/* gunung Fuji di horizon */}
          <path d="M980 300 L1090 168 L1130 200 L1170 176 L1290 300 Z" fill="url(#edkFuji)" />
          <path d="M1080 184 L1090 168 L1104 190 L1096 188 L1090 196 L1082 188 Z" fill="var(--edk-paper)" opacity="0.9" />
          {/* baris atap kota jauh (siluet bergerigi) */}
          <path d="M0 330 L60 316 L60 330 L120 330 L120 308 L180 308 L180 330 L250 330 L250 300 L320 300 L320 330 L400 330 L400 314 L470 314 L470 330 L560 330 L560 296 L640 296 L640 330 L720 330 L720 312 L800 312 L800 330 L880 330 L880 304 L950 304 L950 330 L1440 330 L1440 380 L0 380 Z"
                fill="var(--edk-ink)" opacity="0.20" />
          <path d="M0 352 L80 340 L80 352 L160 352 L160 332 L240 332 L240 352 L340 352 L340 326 L430 326 L430 352 L540 352 L540 336 L640 336 L640 352 L760 352 L760 330 L870 330 L870 352 L990 352 L990 338 L1100 338 L1100 352 L1440 352 L1440 400 L0 400 Z"
                fill="var(--edk-ink)" opacity="0.30" />
          {/* kabut pemisah horizon (makin jauh makin pucat) */}
          <rect x="0" y="330" width="1440" height="52" fill="var(--edk-paper)" opacity="0.30" />
        </motion.g>

        {/* air 川 berbokashi */}
        <motion.rect x="0" y="420" width="1440" height="200" fill="url(#edkWater)" style={{ opacity: water }} />
        {/* riak air — garis ukir tipis bergelombang, tidak seragam */}
        <motion.g style={{ opacity: water }} stroke="var(--edk-paper)" strokeWidth="1.6"
                     fill="none" strokeLinecap="round" opacity="0.5">
          {[448, 482, 520, 560, 600].map((y, i) => (
            <path key={i} d={`M${40 + i * 30} ${y} q 60 -8 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0`} />
          ))}
        </motion.g>
        {/* perahu 舟 — memberi MIDGROUND, bukan air kosong */}
        <motion.g style={{ opacity: water }}>
          {[[220, 470], [520, 508], [900, 486], [1180, 520]].map(([x, y], i) => (
            <g key={i}>
              <path d={`M${x - 34} ${y} q 34 16 68 0 l -8 10 q -26 10 -52 0 Z`}
                    fill="var(--edk-ink)" opacity="0.62" />
              <line x1={x} y1={y - 4} x2={x} y2={y - 30} stroke="var(--edk-ink)" strokeWidth="2" opacity="0.5" />
            </g>
          ))}
        </motion.g>
        {/* jembatan lengkung — garis ukir hidup */}
        <motion.g style={{ opacity: bridge }} stroke="var(--edk-ink)" strokeWidth="9"
                     fill="none" strokeLinecap="round">
          <path d="M120 470 Q720 300 1320 470" />
          <path d="M120 470 Q720 300 1320 470" stroke="var(--edk-shu)" strokeWidth="2" strokeDasharray="1 26" />
        </motion.g>
        <motion.g style={{ opacity: bridge }} stroke="var(--edk-ink)" strokeWidth="5"
                     fill="none" strokeLinecap="round">
          <path d="M300 420 L300 470 M600 366 L600 452 M840 366 L840 452 M1140 420 L1140 470" />
        </motion.g>
        {/* kerumunan 人々 — figur kecil berjubah, bukan blok persegi */}
        <motion.g style={{ opacity: crowd }}>
          {Array.from({ length: 16 }, (_, i) => {
            const x = 150 + i * 72;
            const base = 432 - (i % 3) * 10;
            const h = 30 + (i % 3) * 9;
            return (
              <g key={i} opacity="0.62">
                {/* kepala + jubah kerucut (khas figur ukiyo-e) */}
                <circle cx={x} cy={base - h} r="4.5" fill="var(--edk-ink)" />
                <path d={`M${x} ${base - h + 4} L${x - 7} ${base} L${x + 7} ${base} Z`}
                      fill={i % 4 === 0 ? 'var(--edk-shu)' : 'var(--edk-ink)'} opacity="0.8" />
              </g>
            );
          })}
        </motion.g>
      </svg>
      <div className="absolute left-1/2 top-[15%] -translate-x-1/2"
           style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem,4vw,2.4rem)',
                    color: 'var(--edk-ink)', opacity: 0.6, letterSpacing: '0.34em',
                    filter: 'drop-shadow(2px 2px 0 rgba(192,57,43,0.22))' }}>
        日本橋
      </div>
    </div>
  );
}

// ── 3. 浮世絵 — blok kayu diukir, tinta ditekan, kertas tercetak ─────────────
export function ScenePrint({ clock, sceneStart = 0, reduced = false }) {
  const carve = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.4) / 2.2)));
  const press = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 2.6) / 1.6)));
  const sheetY = useTransform(clock, (t) => (reduced ? 0 : (1 - clamp01((t - sceneStart - 2.6) / 1.6)) * 44));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <BokashiSky from="rgba(30,79,121,0.10)" to="rgba(230,220,194,0)" />
      {/* blok kayu 版木 — serat kayu terlihat, sudut nyaris tajam */}
      <motion.div
        className="absolute left-[8%] top-1/2 -translate-y-1/2 overflow-hidden"
        style={{
          width: 'min(38vw, 340px)', height: 'min(52vh, 420px)',
          background:
            `repeating-linear-gradient(92deg, rgba(120,86,44,0.22) 0px, rgba(120,86,44,0.22) 1px, transparent 1px, transparent 7px),
             linear-gradient(160deg, #d8b078 0%, #b98d54 100%)`,
          border: '1px solid var(--edk-ink)',
          filter: REG,
        }}
      >
        <svg viewBox="0 0 340 420" className="h-full w-full">
          <motion.g stroke="var(--edk-ink)" strokeWidth="2.4" fill="none" strokeLinecap="round"
                    style={{ pathLength: carve, opacity: carve }}>
            {/* garis ukir: gelombang seigaiha */}
            <path d="M40 300 Q90 250 140 300 T240 300 T340 300" />
            <path d="M20 350 Q70 300 120 350 T220 350 T320 350" />
            <path d="M60 120 Q110 70 160 120 T260 120" />
          </motion.g>
        </svg>
      </motion.div>

      {/* kertas tercetak — bokashi hasil cetak + gunung + matahari */}
      <motion.div
        className="absolute right-[10%] top-1/2"
        style={{
          width: 'min(34vw, 300px)', height: 'min(46vh, 380px)',
          background: 'var(--edk-paper)',
          border: '1px solid var(--edk-ink)',
          filter: REG,
          y: sheetY, opacity: press,
        }}
      >
        <svg viewBox="0 0 300 380" className="h-full w-full">
          <defs>
            <linearGradient id="edkPrintSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--edk-ai)" stopOpacity="0.30" />
              <stop offset="100%" stopColor="var(--edk-ai)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="300" height="380" fill="url(#edkPrintSky)" />
          {/* matahari vermilion dengan misregistrasi indigo */}
          <circle cx="203" cy="123" r="52" fill="var(--edk-ai)" opacity="0.28" />
          <circle cx="200" cy="120" r="52" fill="var(--edk-shu)" opacity="0.88" />
          {/* gunung berlapis */}
          <path d="M0 250 L80 190 L140 232 L210 176 L280 226 L300 206 L300 380 L0 380 Z"
                fill="rgba(30,79,121,0.24)" />
          {/* gelombang berlapis, stroke hidup */}
          <g stroke="var(--edk-ai)" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.9">
            <path d="M20 268 Q70 218 120 268 T220 268 T300 268" />
            <path d="M10 308 Q60 258 110 308 T210 308 T300 308" />
            <path d="M20 348 Q70 298 120 348 T220 348 T300 348" />
          </g>
        </svg>
      </motion.div>
    </div>
  );
}

// ── 4. 提灯 — lentera menyala di jalan malam ────────────────────────────────
export function SceneNight({ clock, sceneStart = 0, reduced = false }) {
  const glow = useTransform(clock, (t) => (reduced ? 1 : clamp01((t - sceneStart - 0.4) / 2.4)));
  // Kelap-kelip lembut tiap lentera (fase beda) — cahaya hidup, bukan statis.
  const flick = useTransform(clock, (t) => (reduced ? 1 : 0.9 + Math.sin(t * 2.1) * 0.05 + Math.sin(t * 5.3) * 0.03));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Langit malam bokashi: indigo pekat di atas → lebih terang di kaki langit */}
      <BokashiSky from="rgba(8,11,20,0.94)" to="rgba(20,32,58,0.72)" />
      <svg viewBox="0 0 1440 620" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <line x1="0" y1="90" x2="1440" y2="90" stroke="var(--edk-ink)" strokeWidth="3" opacity="0.4" />
        {[180, 420, 720, 1020, 1260].map((x, i) => (
          <g key={i}>
            <line x1={x} y1="90" x2={x} y2="140" stroke="var(--edk-ink)" strokeWidth="2" opacity="0.45" />
            {/* cahaya tembus kertas 提灯 — halo hangat berlapis */}
            <motion.circle cx={x} cy="205" r="96" fill="rgba(240,190,78,0.16)"
                           style={{ opacity: glow }} />
            <motion.circle cx={x} cy="205" r="58" fill="rgba(240,190,78,0.22)"
                           style={{ opacity: glow }} />
            {/* badan lentera: bokashi hangat, bukan blok merah rata */}
            <motion.ellipse cx={x} cy="205" rx="46" ry="58" fill="var(--edk-shu)"
                            style={{ opacity: glow }} />
            <motion.ellipse cx={x} cy="205" rx="46" ry="58" fill="none"
                            stroke="var(--edk-ink)" strokeWidth="1.6" style={{ opacity: glow }} />
            {/* rusuk lentera (anyaman bambu) */}
            <motion.g style={{ opacity: glow }} stroke="var(--edk-ink)" strokeWidth="1" opacity="0.35">
              {[178, 190, 205, 220, 232].map((y, j) => (
                <line key={j} x1={x - 44} y1={y} x2={x + 44} y2={y} />
              ))}
            </motion.g>
            <motion.text x={x} y="217" textAnchor="middle" fontFamily="var(--font-display)"
                         fontSize="32" fill="var(--edk-paper)" style={{ opacity: glow }}>灯</motion.text>
          </g>
        ))}
      </svg>
      {/* Kolam cahaya hangat dari lentera — inilah "malam Edo", bukan mode gelap */}
      <motion.div className="absolute inset-0" style={{
        opacity: glow,
        background:
          'radial-gradient(46% 42% at 50% 33%, rgba(240,190,78,0.30) 0%, transparent 72%),' +
          'radial-gradient(30% 26% at 18% 34%, rgba(240,190,78,0.20) 0%, transparent 74%),' +
          'radial-gradient(30% 26% at 82% 34%, rgba(232,100,63,0.16) 0%, transparent 74%)',
      }} />
    </div>
  );
}

// ── 5. 江戸 — peta menutup + segel 極 ───────────────────────────────────────
export function SceneChange({ clock, sceneStart = 0, reduced = false }) {
  const close = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 0.4) / 2.4)));
  const seal = useTransform(clock, (t) => (reduced ? 1 : easeOut((t - sceneStart - 4.6) / 1.2)));
  const sealRot = useTransform(clock, (t) => (reduced ? -6 : (1 - clamp01((t - sceneStart - 4.6) / 1.2)) * 20 - 6));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <BokashiSky from="rgba(30,79,121,0.14)" to="rgba(230,220,194,0)" />
      {/* peta menutup — kertas berbokashi, garis ukir tipis */}
      <motion.div className="absolute inset-y-0 left-0" style={{
        width: '50%',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.28), transparent), var(--edk-paper-2)',
        borderRight: '1px solid var(--edk-ink)',
        x: useTransform(close, (p) => `${-100 * (1 - p)}%`),
      }} />
      <motion.div className="absolute inset-y-0 right-0" style={{
        width: '50%',
        background: 'linear-gradient(270deg, rgba(255,255,255,0.28), transparent), var(--edk-paper-2)',
        borderLeft: '1px solid var(--edk-ink)',
        x: useTransform(close, (p) => `${100 * (1 - p)}%`),
      }} />

      {/* segel 極 — cap vermilion: kotak tinta dengan misregistrasi, bukan blok hitam */}
      <motion.div
        className="absolute left-1/2 top-1/2 flex items-center justify-center"
        style={{
          width: 'clamp(84px,16vw,150px)', height: 'clamp(84px,16vw,150px)',
          translateX: '-50%', translateY: '-50%',
          background: 'radial-gradient(circle at 38% 32%, #d6503a 0%, var(--edk-shu) 62%, #8f2f1f 100%)',
          color: 'var(--edk-paper)',
          border: '2px solid var(--edk-ink)',
          borderRadius: '3px',
          filter: 'drop-shadow(3px 3px 0 rgba(30,79,121,0.30))',
          rotate: sealRot, opacity: seal,
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.6rem,8vw,4.6rem)', lineHeight: 1 }}>極</span>
      </motion.div>
    </div>
  );
}

export default SceneMap;
