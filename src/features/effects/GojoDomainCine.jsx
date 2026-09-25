import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  GOJO_STYLE, GOJO_INK, GOJO_BALL_BREAKPOINT, GOJO_ULT_THRESHOLD,
  GOJO_DOMAIN_DURATION_S,
  gojoDomainTimeline, gojoSequentialChars, gojoNebulaSpots, gojoStars,
} from './gojoFx';
import { playDomainBoom } from '../../utils/sfx';
import { gojoCastGif } from './gojoGifs';

// ─────────────────────────────────────────────────────────────────────────────
// 領域展開・無量空処 — CINEMATIC ULTIMATE (bar energi kutukan, persist sampai salah).
//   0. BAR       → 呪力 bar vertikal tepi KANAN, keisi naik tiap benar (aura di garis isi)
//   1. RUANG     → ruang angkasa (gelap + nebula + bintang) DI BELAKANG kuis;
//                  kuis "terkurung" di dalamnya — kartu & opsi tetap terbaca (portal z-5)
//   2. VEIL      → saat cast layar ditutup penuh; tersingkap saat settle (setelah bigbang)
//   3. TEKS      → 領域展開 → 無量空処 muncul PER-KARAKTER (berurutan)
//   4. SIX EYES  → mata di ATAS teks, nutup → kebuka
//   5. BIGBANG   → di tengah (flash + ring mengembang)
//   6. SETTLE    → blok mata+teks naik, mengecil, lalu memudar → kuis kebaca
//   7. PERSIST   → ruang hidup sampai jawaban SALAH atau DURASI habis (30 dtk);
//                  selama hidup, bar 呪力 jadi timer hitung mundur + waktu kuis BEKU
// Semua overlay pointer-events-none → quiz tetap bisa dijawab (bar-nya sendiri yang klikable).
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isMobile = () =>
  typeof window !== 'undefined' && window.innerWidth < GOJO_BALL_BREAKPOINT;

// ── Bar energi kutukan 呪力 (tepinya KANAN, isi naik dari bawah) ─────────────
// Visual: jalur gelap + isi ungu dengan glow; tiap +1 benar memicu "letupan aura"
// (satu kilau yang naik di garis isi, remount via key=charge); saat penuh → label
// 領域展開 + denyut; tap bar = cast.
export function GojoCurseBar({ charge = 0, ready = false, onCast, domainOn = false, domainLeft = 0 }) {
  const [reduced] = useState(prefersReduced);
  // Saat domain hidup bar berubah fungsi: bukan isi charge, tapi DRAIN durasi
  // (30 dtk → 0). Habis = domain padam sendiri (dikontrol EffectProvider).
  const pct = domainOn
    ? Math.max(0, Math.min(100, (domainLeft / GOJO_DOMAIN_DURATION_S) * 100))
    : Math.max(0, Math.min(100, (charge / GOJO_ULT_THRESHOLD) * 100));
  const urgent = domainOn && domainLeft <= 5;   // sisa <=5 dtk → merah & denyut
  const purple = GOJO_STYLE.domain.color;
  const fillColor = urgent ? '#ef4444' : purple;

  return (
    <div
      data-gojo-cursebar
      className="pointer-events-none fixed right-2.5 top-[6vh] sm:top-1/2 sm:-translate-y-1/2 z-[125] flex flex-col items-center gap-1.5"
    >
      {/* Slot label (tinggi tetap) → bar tidak bergeser saat label muncul.
          Di HP bar ditambatkan ke ATAS agar tidak menutupi opsi jawaban di bawah. */}
      <div className="flex h-14 items-center justify-center">
        {/* Tanpa AnimatePresence: label harus hilang SEKETIKA saat bar tidak penuh
            lagi (exit-animation + repeat: Infinity pernah bikin elemen nyangkut). */}
        {domainOn && (
          <motion.span
            key="domain-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#e8e0ff', writingMode: 'vertical-rl', textShadow: `0 0 12px ${purple}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: reduced ? 1 : [0.55, 1, 0.55], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          >
            無量空処
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
            領域展開
          </motion.span>
        )}
      </div>

      {/* Bar-nya (tap = cast saat penuh) */}
      <motion.button
        type="button"
        onClick={ready ? onCast : undefined}
        aria-label="呪力"
        disabled={!ready}
        className={`relative w-[14px] h-[30vh] max-h-[380px] min-h-[170px] sm:h-[46vh] sm:min-h-[200px] rounded-full border-[2px] overflow-hidden ${
          ready ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
        }`}
        style={{
          borderColor: ready || domainOn ? (urgent ? '#ef4444' : purple) : 'rgba(124,77,255,0.45)',
          background: 'rgba(10,4,20,0.55)',
          boxShadow: ready || domainOn
            ? `0 0 18px 3px ${fillColor}cc, inset 0 0 10px ${fillColor}55`
            : `0 0 8px 1px ${purple}33`,
        }}
        animate={ready && !reduced ? { scaleX: [1, 1.25, 1] } : { scaleX: 1 }}
        transition={ready && !reduced ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        {/* Isi: charge naik dari bawah ke atas / durasi domain menDRAIN ke bawah */}
        <motion.div
          className="absolute left-0 right-0 bottom-0"
          style={{
            background: `linear-gradient(to top, ${fillColor}, ${urgent ? '#fca5a5' : '#c4b5fd'})`,
            boxShadow: `0 0 12px 2px ${fillColor}aa`,
          }}
          initial={false}
          animate={{ height: `${pct}%` }}
          transition={domainOn ? { duration: 0.3, ease: 'linear' } : { type: 'spring', stiffness: 120, damping: 18 }}
        />
        {/* Letupan aura tiap +1 benar (remount tiap charge berubah) */}
        {charge > 0 && (
          <motion.div
            key={`aura-${charge}`}
            className="absolute left-0 right-0"
            style={{ bottom: `${Math.max(0, pct - 6)}%`, height: 16, background: `radial-gradient(ellipse at 50% 50%, #ffffffcc, ${purple}00 70%)` }}
            initial={{ opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: [0, 1, 0], scaleY: [0.4, 1.6, 1] }}
            transition={{ duration: reduced ? 0 : 0.55, ease: 'easeOut' }}
          />
        )}
      </motion.button>

      {/* Angka charge / sisa durasi domain */}
      <span
        className={`font-mono font-black text-[10px] tracking-widest ${urgent && !reduced ? 'animate-pulse' : ''}`}
        style={{ color: domainOn ? (urgent ? '#fca5a5' : '#e8e0ff') : ready ? '#e8e0ff' : 'rgba(232,224,255,0.6)' }}
      >
        {domainOn ? `${domainLeft}s` : `${charge}/${GOJO_ULT_THRESHOLD}`}
      </span>
    </div>
  );
}

// ── Cinematic domain ────────────────────────────────────────────────────────

// Teks muncul PER-KARAKTER berurutan (menggantikan "suara Gojo" sampai aset ada).
function SequentialChars({ text, start, perChar, reduced, className, style }) {
  const items = gojoSequentialChars(text, start, perChar);
  return (
    <span className={className} style={style} aria-label={text}>
      {items.map((it, i) => (
        <motion.span
          key={`${it.ch}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, y: 16, scale: 0.6 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: reduced ? 0 : it.delayMs / 1000,
            duration: reduced ? 0 : 0.32,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {it.ch}
        </motion.span>
      ))}
    </span>
  );
}

// Six Eyes 六眼 — sepasang mata di ATAS teks. Animasi "membuka" = scaleY dari
// garis tipis (0.05) ke penuh; iris biru langit → ungu dengan glow.
function SixEyes({ reduced, start, openDur }) {
  const gid = 'gojoIris' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const open = {
    delay: reduced ? 0 : start,
    duration: reduced ? 0 : openDur,
    ease: [0.22, 1, 0.36, 1],
  };
  return (
    <motion.div
      data-gojo-eyes
      className="flex items-center gap-[7vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: reduced ? 0 : start, duration: reduced ? 0 : 0.25 }}
    >
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="relative"
          style={{ width: 96, height: 52, transformOrigin: '50% 50%', filter: 'drop-shadow(0 0 18px #38bdf8aa)' }}
          initial={{ scaleY: reduced ? 1 : 0.05 }}
          animate={{ scaleY: 1 }}
          transition={open}
        >
          <svg viewBox="0 0 100 56" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
            <defs>
              <radialGradient id={`${gid}-${i}`} cx="50%" cy="45%" r="62%">
                <stop offset="0%" stopColor="#e0f7ff" />
                <stop offset="55%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#7c4dff" />
              </radialGradient>
            </defs>
            <path d="M2,28 Q50,-4 98,28 Q50,60 2,28 Z" fill="#07030d" stroke="#e8e0ff" strokeWidth="2.5" />
            <circle cx="50" cy="28" r="14" fill={`url(#${gid}-${i})`} />
            <circle cx="50" cy="28" r="6" fill="#07030d" />
            <circle cx="45" cy="22" r="2.6" fill="#ffffff" opacity="0.85" />
          </svg>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Bigbang di TENGAH (flash + ring mengembang, memudar habis) — lalu ruang
// "tenang": bercak nebula di pinggir + bintang berkelip (persist).
function GojoBigBang({ reduced, start, dur }) {
  return (
    <div
      data-gojo-bang
      className="absolute left-1/2 top-1/2"
      style={{ width: 380, height: 380, marginLeft: -190, marginTop: -190, pointerEvents: 'none' }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={reduced ? { scale: 1, opacity: 0.35 } : { scale: [0, 0.3, 2.7], opacity: [0, 1, 0] }}
        transition={{ delay: reduced ? 0 : start, duration: reduced ? 0 : dur, times: [0, 0.18, 1], ease: 'easeOut' }}
        style={{ background: 'radial-gradient(circle, #ffffff 0 10%, #c4b5fd 32%, rgba(124,77,255,0) 72%)' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: '6px solid #c4b5fd' }}
        initial={{ scale: 0.1, opacity: 0 }}
        animate={reduced ? { scale: 1, opacity: 0.25 } : { scale: [0.1, 3.6], opacity: [0, 0.85, 0] }}
        transition={{ delay: reduced ? 0 : start + 0.05, duration: reduced ? 0 : dur * 1.15, ease: 'easeOut' }}
      />
    </div>
  );
}

// Ruang angkasa DI BELAKANG konten (portal ke <body>, z-5 di bawah <main> z-10):
// kuis "terkurung" di dalam domain — kartu & opsi tetap terbaca di atasnya.
// SENGAJA tanpa AnimatePresence/exit: portal + exit-animation bisa nyangkut
// (AnimatePresence tak bisa menyelesaikan exit di luar tree-nya) → domain padam
// harus menghapus ruang SEGERA. Fade-in saja (via CSS transition).
export function GojoSpacePortal({ seed = 1 }) {
  const [reduced] = useState(prefersReduced);
  const [mobile] = useState(isMobile);
  const t = gojoDomainTimeline();
  const [spots] = useState(() => gojoNebulaSpots(seed, mobile ? 5 : 8));
  const [allStars] = useState(() => gojoStars(seed, mobile ? 36 : 64));
  // Bintang hanya yang di pinggir (x/y di luar 18%/82%) → bagian tengah layar tetap bersih.
  const edgeStars = allStars.filter((s) => s.x <= 18 || s.x >= 82 || s.y <= 14 || s.y >= 86);

  return createPortal(
    <motion.div
      data-gojo-space
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.6, ease: 'easeOut' }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 50% 10%, #0d0720 0%, #05030f 48%, #020206 100%)' }}
      />

      {/* Bercak ruang angkasa (persist, denyut pelan) */}
      {spots.map((s) => (
        <motion.div
          key={s.id}
          data-gojo-nebula
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            marginLeft: -s.size / 2,
            marginTop: -s.size / 2,
            background: `radial-gradient(circle, ${s.color} 0 16%, ${s.color}66 44%, transparent 72%)`,
            filter: 'blur(14px)',
            willChange: 'transform, opacity',
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={reduced
            ? { opacity: s.opacity, scale: 1 }
            : { opacity: [0, s.opacity, s.opacity * 0.7, s.opacity], scale: [0.6, 1, 1.08, 1] }}
          transition={{
            delay: reduced ? 0 : t.nebulaStart + s.delay,
            duration: reduced ? 0 : 6,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Bintang hanya di PINGGIR (biar bagian tengah tetap bersih) */}
      {edgeStars.map((st) => (
        <motion.span
          key={st.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.size, height: st.size }}
          initial={{ opacity: 0 }}
          animate={reduced ? { opacity: 0.7 } : { opacity: [0, 0.85, 0.3, 0.75] }}
          transition={{
            delay: reduced ? 0 : t.nebulaStart + st.delay,
            duration: reduced ? 0 : 4,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>,
    document.body,
  );
}

// Lapisan ATAS: veil gelap saat cast (tersingkap saat settle) + teks + bigbang.
// Di-render kondisional tanpa AnimatePresence (lihat catatan di EffectContext):
// saat domain padam, lapisan ini harus lenyap seketika — setelah settle semua
// elemennya memang sudah transparan, jadi tak ada yang terlihat hilang mendadak.
export function GojoDomainCine() {
  const [reduced] = useState(prefersReduced);
  const [castGif] = useState(gojoCastGif);   // GIF Gojo clasped-hands saat cast
  const t = gojoDomainTimeline();

  // Dentuman bigbang (cast sudah dibunyikan EffectProvider).
  useEffect(() => {
    if (reduced) return undefined;
    const id = setTimeout(() => playDomainBoom('bang'), t.bangStart * 1000);
    return () => clearTimeout(id);
  }, [reduced, t.bangStart]);

  return (
    <>
      <motion.div
        data-gojo-domain
        className="absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Veil: layar gelap penuh saat cast → memudar mulai settle */}
        <motion.div
          data-gojo-veil
          className="absolute inset-0"
          style={{ background: 'rgba(2,2,6,0.97)' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: t.settleStart, duration: reduced ? 0.3 : t.settleDur, ease: 'easeInOut' }}
        />

        {/* GIF Gojo (ryoiki tenkai) — muncul saat cast, DI ATAS teks, ikut naik
            saat settle (satu blok dengan teks supaya tidak tertinggal). */}
        {castGif && (
          <motion.div
            data-gojo-castgif
            className="absolute left-1/2 top-1/2"
            style={{ marginLeft: '-16vh', marginTop: '-34vh' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.96] }}
            transition={{
              delay: reduced ? 0 : t.text1Start,
              duration: reduced ? 0 : t.settleStart + t.settleDur - t.text1Start,
              times: [0, 0.08, 0.82, 1],
              ease: 'easeOut',
            }}
          >
            <div className="w-[32vh] h-[32vh] flex items-center justify-center">
              <img
                src={castGif}
                alt="Gojo — 領域展開"
                decoding="sync"
                loading="eager"
                className="w-full h-full object-contain select-none"
                draggable={false}
              />
            </div>
          </motion.div>
        )}

        {/* Blok tengah: [mata] → [領域展開] → [無量空処]; naik, mengecil, lalu memudar */}
        <motion.div
          data-gojo-text
          className="absolute inset-0 flex flex-col items-center justify-center gap-[2.2vmin]"
          initial={{ y: 0, scale: 1, opacity: 1 }}
          animate={reduced ? { opacity: 0 } : { y: '-31vh', scale: 0.34, opacity: 0 }}
          transition={{ delay: t.settleStart, duration: reduced ? 0.3 : t.settleDur, ease: [0.22, 1, 0.36, 1] }}
        >
          <SixEyes reduced={reduced} start={t.eyesStart} openDur={t.eyesOpenDur} />
          <SequentialChars
            text="領域展開"
            start={t.text1Start}
            perChar={t.text1Char}
            reduced={reduced}
            className="font-serif font-black tracking-[0.35em] text-[#e8e0ff]"
            style={{ fontSize: 'clamp(20px, 3.4vw, 40px)', WebkitTextStroke: `2px ${GOJO_INK}` }}
          />
          <SequentialChars
            text="無量空処"
            start={t.text2Start}
            perChar={t.text2Char}
            reduced={reduced}
            className="font-serif font-black tracking-[0.22em]"
            style={{
              fontSize: 'clamp(44px, 8.5vw, 118px)',
              color: GOJO_STYLE.domain.color,
              WebkitTextStroke: `3px ${GOJO_INK}`,
              textShadow: `6px 6px 0 ${GOJO_INK}, 0 0 60px ${GOJO_STYLE.domain.color}cc`,
            }}
          />
        </motion.div>

        {/* BIGBANG di tengah */}
        <GojoBigBang reduced={reduced} start={t.bangStart} dur={t.bangDur} />
      </motion.div>
    </>
  );
}

export default GojoDomainCine;
