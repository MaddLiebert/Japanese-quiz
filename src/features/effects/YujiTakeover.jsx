import { useState, useEffect, useId } from 'react';
import { motion } from 'motion/react';
import {
  YUJI_ULT_THRESHOLD, YUJI_TAKEOVER_DURATION_S, YUJI_TAKEOVER_TIMELINE,
  YUJI_INK, YUJI_STYLE, YUJI_SUKUNA_EYES, YUJI_SUKUNA_MARKINGS,
  YUJI_EYE_STYLE, YUJI_FIRE_COLORS, yujiFlames, yujiEmbers,
} from './yujiFx';
import { yujiTakeoverGif } from './yujiGifs';

// ─────────────────────────────────────────────────────────────────────────────
// 宿儺の器 — ULTIMATE Yuji (bar 指, tap = cast). BUKAN domain expansion.
//   1. BAR   → deretan jari Sukuna vertikal di tepi KANAN; tiap benar = 1 jari
//              nyala (biru → ungu); penuh = label 宿儺の器 + denyut (tap = cast).
//   2. CINE  → aura naik + tato merayap + kanji 宿儺の器 (1x) + veil gelap +
//              API NAIK dari DASAR LAYAR + wajah kerasukan, lalu SEMUA elemen
//              cinematic padam saat veil tersingkap — yang persist hanya AURA.
//              (Dulu wajah + api nyangkut menutupi layar sepanjang 30 dtk.)
//   3. AURA  → persist selama takeover (vignette hitam-ungu + garis tato halus).
// Timer JALAN TERUS (beda dari domain Gojo) — waktu kuis TIDAK dibekukan.
// Semua overlay pointer-events-none; hanya bar yang klikable.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Bar 指 (jari Sukuna) — isi naik tiap benar; saat takeover jadi timer drain ──
export function YujiCurseBar({ charge = 0, combo = 0, ready = false, onCast, takeoverOn = false, takeoverLeft = 0 }) {
  const [reduced] = useState(prefersReduced);
  const slots = YUJI_ULT_THRESHOLD;
  const pct = takeoverOn
    ? Math.max(0, Math.min(100, (takeoverLeft / YUJI_TAKEOVER_DURATION_S) * 100))
    : Math.max(0, Math.min(100, (charge / slots) * 100));
  const urgent = takeoverOn && takeoverLeft <= 5;
  const lit = takeoverOn ? Math.round((pct / 100) * slots) : charge;
  const purple = YUJI_STYLE.takeover.color;

  return (
    <div
      data-yuji-cursebar
      className="pointer-events-none fixed right-2.5 top-[6vh] sm:top-1/2 sm:-translate-y-1/2 z-[125] flex flex-col items-center gap-1.5"
    >
      {/* Slot label (tinggi tetap) → bar tidak bergeser */}
      <div className="flex h-14 items-center justify-center">
        {/* Tanpa AnimatePresence: label harus hilang SEKETIKA saat bar tidak penuh
            lagi (exit-animation + repeat: Infinity pernah bikin elemen nyangkut). */}
        {takeoverOn && (
          <motion.span
            key="takeover-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#e8e0ff', writingMode: 'vertical-rl', textShadow: `0 0 12px ${purple}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: reduced ? 1 : [0.55, 1, 0.55], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          >
            宿儺の器
          </motion.span>
        )}
        {ready && (
          <motion.span
            key="ready-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#e8e0ff', writingMode: 'vertical-rl', textShadow: `0 0 12px ${purple}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: reduced ? 1 : [0.65, 1, 0.65], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            宿儺の器
          </motion.span>
        )}
      </div>

      {/* Deretan jari — tap = cast saat penuh */}
      <motion.button
        type="button"
        onClick={ready ? onCast : undefined}
        aria-label="指"
        disabled={!ready}
        className={`relative rounded-full border-[2px] p-[3px] ${
          ready ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
        }`}
        style={{
          borderColor: ready || takeoverOn ? (urgent ? '#ef4444' : purple) : 'rgba(124,77,255,0.45)',
          background: 'rgba(10,4,20,0.55)',
          boxShadow: ready || takeoverOn
            ? `0 0 18px 3px ${urgent ? '#ef4444' : purple}cc, inset 0 0 10px ${purple}55`
            : `0 0 8px 1px ${purple}33`,
        }}
        animate={ready && !reduced ? { scaleX: [1, 1.25, 1] } : { scaleX: 1 }}
        transition={ready && !reduced ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        <div className="flex flex-col-reverse gap-[3px]">
          {Array.from({ length: slots }).map((_, i) => {
            const on = i < lit;
            const color = on ? (i < 10 ? '#00b0ff' : purple) : 'rgba(124,77,255,0.18)';
            return (
              <motion.div
                key={i}
                className="w-[14px] rounded-[3px]"
                style={{
                  height: '1.4vh',
                  minHeight: 6,
                  background: color,
                  boxShadow: on ? `0 0 6px ${color}` : 'none',
                  borderBottom: '1px solid rgba(10,10,10,0.55)',
                }}
                initial={false}
                animate={on ? { opacity: [0.6, 1, 1] } : { opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.35, ease: 'easeOut' }}
              />
            );
          })}
        </div>
      </motion.button>

      {/* Angka: charge / sisa durasi takeover */}
      <span
        className={`font-mono font-black text-[10px] tracking-widest ${urgent && !reduced ? 'animate-pulse' : ''}`}
        style={{ color: takeoverOn ? (urgent ? '#fca5a5' : '#e8e0ff') : ready ? '#e8e0ff' : 'rgba(232,224,255,0.6)' }}
      >
        {takeoverOn ? `${takeoverLeft}s` : `${charge}/${slots}`}
      </span>

      {/* Combo 解 → 捌 → 開 (nyala sesuai tingkat) */}
      {takeoverOn && (
        <div className="flex flex-col items-center gap-0.5">
          {['解', '捌', '開'].map((k, i) => (
            <span
              key={k}
              className="font-serif font-black text-[10px]"
              style={{
                color: i < combo ? '#ffd166' : 'rgba(255,255,255,0.35)',
                textShadow: i < combo ? '0 0 8px #ff8c1a' : 'none',
              }}
            >
              {k}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Api cinematic: glow lembut naik dari DASAR LAYAR. TANPA clip-path —
// semua bentuk = radial-gradient + blur (api asli tidak punya tepi keras).
// Band dasar kontinu (tanpa celah antar-kolom) + lidah api tumpang-tindih
// yang naik-turun → organik, menyatu dengan latar (blend screen).
// Hidup HANYA selama cinematic, padam saat veil tersingkap (tidak persist).
function TakeoverFire({ reduced, start, end }) {
  const [flames] = useState(() => yujiFlames(7, 11));
  const [embers] = useState(() => yujiEmbers(7, 9));
  const [c0, c1, c2] = YUJI_FIRE_COLORS;
  if (reduced) return null;
  const span = Math.max(0.4, end - start);
  return (
    <motion.div
      data-yuji-fire
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ delay: start, duration: span, times: [0, 0.12, 0.82, 1], ease: 'easeOut' }}
    >
      {/* Band dasar kontinu: satu massa api tanpa celah di tepi bawah layar */}
      <div
        className="absolute"
        style={{
          left: '-6%', right: '-6%', bottom: '-4%', height: '30%',
          background: `linear-gradient(to top, ${c2} 0%, ${c1} 42%, ${c1}26 72%, transparent 100%)`,
          filter: 'blur(24px)',
          mixBlendMode: 'screen',
          opacity: 0.9,
        }}
      />
      {/* Glow hangat lebar (menerangi layar, menyatu dengan latar) */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '46%',
          background: `linear-gradient(to top, ${c1}3d, ${c2}1a 55%, transparent 100%)`,
          filter: 'blur(30px)',
          mixBlendMode: 'screen',
        }}
      />
      {/* Lidah api: ellipse radial-gradient lembut, tumpang-tindih, naik-turun */}
      {flames.map((f, i) => (
        <motion.div
          key={f.id}
          className="absolute"
          style={{
            left: `${Math.min(95, Math.max(5, f.x))}%`,
            bottom: '-3%',
            width: `${f.w * 2.4}%`,
            height: `${f.h * 1.35}%`,
            marginLeft: `-${f.w * 1.2}%`,
            transformOrigin: '50% 100%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse 50% 80% at 50% 100%, #fff6d8 0%, ${c0} 18%, ${c1} 44%, ${c2} 68%, transparent 92%)`,
            filter: `blur(${9 + (i % 3) * 4}px)`,
            mixBlendMode: 'screen',
            willChange: 'transform, opacity',
          }}
          initial={{ opacity: 0, scaleY: 0.3 }}
          animate={{
            opacity: [0, 0.9, 0.66, 0.88, 0.72, 0.84, 0],
            scaleY: [0.3, 1, 0.8, 1.08, 0.88, 1, 0.66],
            scaleX: [0.9, 1.04, 0.94, 1.06, 0.96, 1.02, 0.92],
            x: [0, 6, -7, 8, -5, 4, 0],
          }}
          transition={{
            delay: start + f.delay * 0.5,
            duration: f.dur + 0.7,
            times: [0, 0.18, 0.36, 0.54, 0.72, 0.88, 1],
            ease: 'easeInOut',
          }}
        />
      ))}
      {/* Wisps: lidah api tipis yang MENJULANG naik lalu memudar (motion
          vertikal → api kerasa hidup, bukan cuma band gradient). */}
      {flames.filter((_, i) => i % 2 === 0).map((f, i) => (
        <motion.div
          key={`${f.id}-wisp`}
          className="absolute"
          style={{
            left: `${Math.min(95, Math.max(5, f.x + (i % 2 ? 3 : -3)))}%`,
            bottom: '0%',
            width: `${Math.max(2.4, f.w * 0.7)}%`,
            height: `${f.h * 1.5}%`,
            marginLeft: `-${Math.max(1.2, f.w * 0.35)}%`,
            borderRadius: '50% 50% 42% 42% / 64% 64% 36% 36%',
            background: `radial-gradient(ellipse 46% 72% at 50% 100%, ${c0}b3 0%, ${c1}8c 42%, ${c2}33 72%, transparent 94%)`,
            filter: 'blur(10px)',
            mixBlendMode: 'screen',
            willChange: 'transform, opacity',
          }}
          initial={{ opacity: 0, y: '0%', scaleY: 0.5 }}
          animate={{
            opacity: [0, 0.75, 0.5, 0.65, 0],
            y: ['0%', '-34%', '-52%', '-64%', '-78%'],
            scaleY: [0.5, 1, 0.86, 1.02, 0.7],
            x: [0, i % 2 ? 14 : -14, i % 2 ? -8 : 8, i % 2 ? 10 : -10, 0],
          }}
          transition={{
            delay: start + 0.3 + i * 0.24,
            duration: 1.5 + (i % 3) * 0.3,
            repeat: Math.max(1, Math.floor(span / 1.6)),
            repeatDelay: 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
      {/* Bara naik */}
      {embers.map((e) => (
        <motion.span
          key={e.id}
          className="absolute rounded-full"
          style={{
            left: `${e.x}%`, bottom: '3%', width: e.size, height: e.size,
            background: c0, boxShadow: `0 0 10px ${c1}`,
            mixBlendMode: 'screen',
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: [0, e.drift * 2.6] }}
          transition={{ delay: start + e.delay, duration: e.dur + 0.7, ease: 'easeOut' }}
        />
      ))}
    </motion.div>
  );
}

// ── Wajah kerasukan (kanon) — 4 mata (2 pasang, pasangan kedua di BAWAH) +
// marka Sukuna (mahkota dahi, batang hidung, tato pipi). Muncul di eyesAt,
// lalu IKUT TERSINGKAP saat veil tersingkap (tidak nyangkut menutupi kuis).
function SukunaFace({ reduced, start, end }) {
  const gid = 'sukunaIris' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const span = Math.max(0.4, end - start);
  return (
    <motion.div
      data-yuji-face
      aria-hidden="true"
      className="absolute inset-x-0 top-[6vh] bottom-[34%] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={reduced ? { opacity: [0, 1, 0] } : { opacity: [0, 1, 1, 0] }}
      transition={reduced
        ? { delay: start, duration: span, times: [0, 0.12, 1], ease: 'easeOut' }
        : { delay: start, duration: span, times: [0, 0.1, 0.8, 1], ease: 'easeOut' }}
    >
      {/* Guncangan singkat saat mata terbuka (dipisah dari fade) */}
      <motion.div
        animate={reduced ? { x: 0, y: 0 } : { x: [0, 0, -4, 4, -3, 2, 0], y: [0, 0, 2, -2, 2, -1, 0] }}
        transition={reduced
          ? { duration: 0 }
          : { delay: start, duration: 0.75, times: [0, 0.12, 0.26, 0.42, 0.58, 0.76, 1], ease: 'easeOut' }}
      >
        <svg viewBox="0 0 100 100" style={{ width: 'min(29vh, 54vw)', height: 'auto', overflow: 'visible' }}>
          <defs>
            <radialGradient id={`${gid}`} cx="50%" cy="50%" r="62%">
              <stop offset="0%" stopColor="#ffe9e9" />
              <stop offset="55%" stopColor="#e0241a" />
              <stop offset="100%" stopColor="#7a0b06" />
            </radialGradient>
          </defs>

          {/* Marka Sukuna: mahkota dahi + batang hidung + tato pipi */}
          {YUJI_SUKUNA_MARKINGS.map((m, i) => (
            <motion.path
              key={m.id}
              d={m.d}
              fill="none"
              stroke={YUJI_INK}
              strokeWidth={m.id === 'crown' ? 2.4 : 1.9}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={reduced ? { pathLength: 1, opacity: 0.92 } : { pathLength: 1, opacity: 0.92 }}
              transition={{ delay: reduced ? 0 : start + 0.08 * i, duration: reduced ? 0 : 0.32, ease: 'easeOut' }}
            />
          ))}

          {/* 4 mata: pasangan ATAS = mata Yuji NORMAL (putih+hitam, tidak berubah);
              pasangan BAWAH = mata Sukuna MERAH (kanon: terbuka di bawah, menyempit).
              Ukuran sudah dikecilkan supaya tidak "kegedean"/nyangkut. */}
          {YUJI_SUKUNA_EYES.map((e, i) => {
            const st = YUJI_EYE_STYLE[e.kind] || YUJI_EYE_STYLE.yuji;
            const isSukuna = e.kind === 'sukuna';
            return (
              <g key={e.id} data-eye={e.kind}>
                <motion.ellipse
                  cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry}
                  fill={st.sclera} stroke={isSukuna ? '#e0241a' : '#e8e0ff'} strokeWidth="1.6" vectorEffect="non-scaling-stroke"
                  initial={{ opacity: 0, scaleY: reduced ? 1 : 0.05 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  style={{ transformOrigin: `${e.cx}px ${e.cy}px` }}
                  transition={{ delay: reduced ? 0 : start + (isSukuna ? 0.24 : 0.1) + i * 0.05, duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
                {/* pupil: Yuji = hitam bulat; Sukuna = iris MERAH menyala + pupil ganda */}
                <circle
                  cx={e.cx} cy={e.cy} r={e.pupil}
                  fill={isSukuna ? `url(#${gid})` : st.pupil}
                  style={isSukuna ? { filter: 'drop-shadow(0 0 3px #e0241a)' } : undefined}
                />
                {isSukuna && (
                  <>
                    <circle cx={e.cx - e.pupil * 0.42} cy={e.cy} r={e.pupil * 0.34} fill="#12060a" opacity="0.85" />
                    <circle cx={e.cx + e.pupil * 0.42} cy={e.cy} r={e.pupil * 0.34} fill="#12060a" opacity="0.85" />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </motion.div>
    </motion.div>
  );
}

// ── Cinematic cast 宿儺の器 (sekali per cast) ─────────────────────────────────
// Seluruh elemen cine (GIF, api, wajah, kanji, tato) DI-UNMOUNT setelah
// cinematic selesai — hanya AURA yang persist. Mencegah elemen nyangkut
// menutupi layar sepanjang 30 dtk takeover.
export function YujiTakeoverCine() {
  const [reduced] = useState(prefersReduced);
  const [castGif] = useState(yujiTakeoverGif);   // GIF sukuna transform
  const [done, setDone] = useState(false);
  const t = YUJI_TAKEOVER_TIMELINE;
  const cineEnd = t.settleStart + t.settleDur;   // veil tersingkap penuh

  useEffect(() => {
    const id = setTimeout(() => setDone(true), Math.round((cineEnd + 0.05) * 1000));
    return () => clearTimeout(id);
  }, [cineEnd]);

  if (done) return null;

  return (
    <motion.div
      data-yuji-takeover
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Veil: layar gelap penuh saat cast → tersingkap mulai settle */}
      <motion.div
        data-yuji-veil
        className="absolute inset-0"
        style={{ background: 'rgba(3,2,8,0.96)' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: t.settleStart, duration: reduced ? 0.3 : t.settleDur, ease: 'easeInOut' }}
      />

      {/* GIF Sukuna — cut-in atas, blend screen (tanpa kotak) */}
      {castGif && (
        <motion.div
          data-yuji-castgif
          className="absolute left-1/2 top-[10vh]"
          style={{ marginLeft: 'calc(min(34vh, 84vw) / -2)' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.97] }}
          transition={{
            delay: reduced ? 0 : 0.1,
            duration: reduced ? 0 : t.settleStart + t.settleDur - 0.1,
            times: [0, 0.12, 0.85, 1],
            ease: 'easeOut',
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{
              inset: '-26% -22%',
              background: 'radial-gradient(closest-side, rgba(3,2,8,0.97), rgba(3,2,8,0.72) 52%, transparent 100%)',
            }}
          />
          <img
            src={castGif}
            alt="宿儺の器"
            decoding="sync"
            loading="eager"
            className="select-none"
            style={{
              width: 'min(34vh, 84vw)',
              height: 'auto',
              mixBlendMode: 'screen',
              WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 40%, rgba(0,0,0,0.45) 68%, transparent 94%)',
              maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 40%, rgba(0,0,0,0.45) 68%, transparent 94%)',
            }}
            draggable={false}
          />
        </motion.div>
      )}

      {/* Api naik dari dasar layar — padam saat veil tersingkap (tidak persist) */}
      <TakeoverFire reduced={reduced} start={t.fireAt} end={cineEnd} />

      {/* Wajah kerasukan: mata Yuji normal + mata Sukuna MERAH di bawahnya +
          marka Sukuna; ikut tersingkap bersama veil (tidak menutupi kuis) */}
      <SukunaFace reduced={reduced} start={t.eyesAt} end={cineEnd} />

      {/* Kilatan merah tepat sebelum veil tersingkap (punch cinematic) */}
      {!reduced && (
        <motion.div
          data-yuji-flash
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(circle at 50% 46%, rgba(255,255,255,0.92), rgba(224,36,26,0.5) 34%, transparent 72%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: t.flashAt, duration: 0.42, times: [0, 0.16, 1], ease: 'easeOut' }}
        />
      )}

      {/* Kanji 宿儺の器 (1x, ~1,5 dtk) — TEKS DOANG, tanpa voice */}
      <motion.div
        data-yuji-kanji
        className="absolute inset-x-0 bottom-[13%] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{
          delay: reduced ? 0 : t.kanjiAt,
          duration: reduced ? 0.3 : t.kanjiHold,
          times: [0, 0.15, 0.8, 1],
          ease: 'easeOut',
        }}
      >
        <span
          className="font-serif font-black select-none"
          style={{
            fontSize: 'clamp(40px, 8vw, 120px)',
            color: '#e8e0ff',
            WebkitTextStroke: `3px ${YUJI_INK}`,
            textShadow: `0 0 30px #6d28d9, 6px 6px 0 ${YUJI_INK}`,
          }}
        >
          宿儺の器
        </span>
      </motion.div>

      {/* Tato merayap (garis diagonal dari tepi) — HANYA di area ATAS/SAMPING.
          Dua mask di-intersect: (1) fade habis sebelum area api bawah,
          (2) bolong di tengah (area wajah/kanji). Dulu tato ikut ter-render
          di area api → kelihatan seperti kisi gelap yang memotong api. */}
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0.5, 0] }}
          transition={{ delay: t.tattooStart, duration: t.settleStart + t.settleDur, times: [0, 0.3, 0.7, 1] }}
          style={{
            background: 'repeating-linear-gradient(115deg, transparent 0 26px, rgba(10,10,10,0.85) 26px 28px, transparent 28px 54px)',
            maskImage: 'linear-gradient(to bottom, #000 0%, #000 44%, transparent 66%), radial-gradient(ellipse 66% 52% at 50% 30%, transparent 40%, #000 82%)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 44%, transparent 66%), radial-gradient(ellipse 66% 52% at 50% 30%, transparent 40%, #000 82%)',
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
        />
      )}
    </motion.div>
  );
}

// ── Aura persist selama takeover (vignette hitam-ungu + garis tato mengalir) ──
export function YujiAura() {
  const [reduced] = useState(prefersReduced);
  if (reduced) return null;
  return (
    <motion.div
      data-yuji-aura
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(109,40,217,0.22) 78%, rgba(8,4,16,0.5) 100%)' }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(115deg, transparent 0 40px, rgba(10,10,10,0.5) 40px 41.5px, transparent 41.5px 82px)',
          // Garis tato aura hanya di tepi kiri/kanan (fade ke tengah) — tidak
          // menutupi area api di bawah supaya api tetap bersih.
          maskImage: 'linear-gradient(90deg, #000, transparent 12%, transparent 88%, #000), linear-gradient(to bottom, #000 0%, #000 62%, transparent 84%)',
          WebkitMaskImage: 'linear-gradient(90deg, #000, transparent 12%, transparent 88%, #000), linear-gradient(to bottom, #000 0%, #000 62%, transparent 84%)',
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
        }}
        animate={{ backgroundPositionX: ['0px', '82px'] }}
        transition={{ repeat: Infinity, duration: 9, ease: 'linear' }}
      />
    </motion.div>
  );
}

export default YujiTakeoverCine;
