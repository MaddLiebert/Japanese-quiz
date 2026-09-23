import { createContext, useContext, useState, useCallback, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUserStats } from '../progress/ProgressContext';
import { playCorrectSound, playWrongSound, playStreakSound, answerFeedbackKind, hinaGifHoldMs } from '../../utils/sfx';
import { getPack } from '../packs/packs';
import { getVisual } from './visuals';
import { hinaGifForAnswer } from './hinaGifs';
import { hinaSparkles, hinaAnswerText, hinaTextColor, hinaSparkleCount, hinaGlow, HINA_POP_EASE } from './hinaFx';

// ─────────────────────────────────────────────────────────────────────────────
// Efek tinta washi (visual 'ink') — dipakai pack Sumi Taiko.
//
// Prinsip supaya tidak "kaku":
//  1. Tepi tinta tidak pernah lurus → semua bentuk digambar SVG lalu dilewatkan
//     filter feTurbulence + feDisplacementMap (jadi bergerigi organik).
//  2. Tinta "basah" → ada halo bleed yang mengembang & mengendap, bukan fade polos.
//  3. Gerak pakai easing tinta (cepat keluar, melambat) + spring, bukan linear.
//  4. Splash punya ARAH (memanjang searah lemparan) + gravitasi, bukan lingkaran.
//  5. Tiap trigger dapat seed/acak baru → tidak pernah tampak sama persis.
// ─────────────────────────────────────────────────────────────────────────────

const EffectContext = createContext(null);
export const useEffectLayer = () => {
  const ctx = useContext(EffectContext);
  if (!ctx) throw new Error('useEffectLayer must be used within an EffectProvider');
  return ctx;
};

// Milestone streak: 3, 5, lalu setiap kelipatan 10 sampai 100.
// Level = indeks milestone tertinggi yang sudah dilewati (1..12).
const MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// Level dari streak. null = belum mencapai milestone apa pun.
function resolveStreak(streak) {
  let level = 0;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (streak >= MILESTONES[i]) level = i + 1;
  }
  if (level === 0) return null;
  const milestone = MILESTONES[level - 1];
  const signature = milestone === 50 ? 'gold50'
    : milestone === 100 ? 'zenith100'
      : null;
  return { level, milestone, signature };
}

// Level kontinu (boleh pecahan) dari streak, selaras MILESTONES.
// Dipakai untuk suara: tiap jawaban benar menggeser level sedikit → gong
// makin intens bertahap, bukan lompat tiap milestone.
function streakSoundLevel(streak) {
  if (streak < MILESTONES[0]) return 0;
  let level = 1;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (streak >= MILESTONES[i]) level = i + 1;
  }
  if (level < MILESTONES.length) {
    const cur = MILESTONES[level - 1];
    const next = MILESTONES[level];
    const frac = (streak - cur) / (next - cur);
    return level + Math.min(frac, 0.999);
  }
  return level; // sudah di puncak (100)
}

// Intensitas parametrik: naik mulus sesuai level (hybrid).
function intensityFor(level) {
  const L = Math.max(1, level);
  return {
    drops: 26 + L * 5,
    spread: 230 + L * 16,
    hold: 1150 + L * 110,
    gravity: 26 + L * 1.6,
    rings: Math.min(L, 6),
    size: 264 + L * 14,
  };
}

// Intensitas untuk efek dasar (bukan streak).
const BASE_INTENSITY = {
  correct: { drops: 14, spread: 195, hold: 880, gravity: 26 },
  wrong: { drops: 22, spread: 195, hold: 880, gravity: 26 },
};

// Teardrop tinta (menunjuk ke +x, diputar searah lemparan lalu diregangkan).
const TEARDROP = 'M0,6 C6,0.4 12,2.2 15,6 C12,9.8 6,11.6 0,6 Z';

// Satu sapuan kuas: tipis di ujung, menebal di tengah, menirus di ujung lain.
const BRUSH_STROKE =
  'M3,32 C46,15 104,7 176,8 C258,9 344,17 401,27 ' +
  'C342,31 300,35 250,37 C168,41 92,43 30,39 C12,38 3,35 3,32 Z';
// Garis "dry brush" (kuas kering) supaya ada tekstur serat.
const DRY_STREAKS = [
  'M22,31 C90,20 190,17 330,24',
  'M40,34 C120,29 240,29 356,31',
  'M60,28 C150,22 260,21 300,23',
];

let seq = 0;

export function EffectProvider({ children }) {
  const { progress } = useUserStats();
  const [fx, setFx] = useState(null); // { kind, id, seed, angle, y } | null
  const [drops, setDrops] = useState([]);
  const streakRef = useRef(0);
  const timersRef = useRef([]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Visual aktif hanya kalau activePack punya visual yang terdaftar.
  const activePack = getPack(progress.activePack);
  const activeVisual = activePack?.visual || null;
  const active = Boolean(getVisual(activeVisual));

  // Splash: tinta terlempar ke luar, memanjang searah gerak, lalu jatuh.
  const spawnInk = useCallback((kind, cfg = BASE_INTENSITY.correct) => {
    const count = cfg.drops;
    const spread = cfg.spread;
    const batch = Array.from({ length: count }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 26 + Math.pow(Math.random(), 0.7) * spread;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist + cfg.gravity + Math.random() * (cfg.gravity * 1.8);
      const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      const size = 4 + Math.random() * 20;
      return {
        id: ++seq,
        dx, dy, deg,
        size,
        stretch: 1.3 + Math.random() * 1.5,
        delay: Math.random() * 0.05,
        dur: 0.5 + Math.random() * 0.42,
        soft: size < 9, // tetesan kecil agak blur (kedalaman)
      };
    });
    setDrops(prev => [...prev, ...batch]);
    const t = setTimeout(() => {
      const ids = new Set(batch.map(b => b.id));
      setDrops(prev => prev.filter(p => !ids.has(p.id)));
    }, 2600);
    timersRef.current.push(t);
  }, []);

  const triggerEffect = useCallback((type) => {
    // Efek tidak aktif → tetap bunyi suara dasar (perilaku lama), lalu berhenti.
    if (!active) {
      if (type === 'correct') playCorrectSound();
      else playWrongSound();
      return;
    }

    // Satu salah → streak hangus total.
    if (type === 'correct') streakRef.current += 1;
    else if (type === 'wrong') streakRef.current = 0;

    // Tentukan efek berdasarkan level milestone tertinggi.
    let kind = type;
    let info = null;
    if (type === 'correct') {
      info = resolveStreak(streakRef.current);
      if (info) kind = 'streak';
    }

    const cfg = info ? intensityFor(info.level) : BASE_INTENSITY[type];
    const onMilestone = info ? streakRef.current === info.milestone : false;

    // GIF Hina: hanya saat suara Hina bunyi (salah / tepat milestone). Benar biasa → null.
    const gifSrc = hinaGifForAnswer(type, onMilestone);

    // Suara (keputusan desain):
    //  - jawaban salah  → wronganswer.mp3 + voice Hina wrong (tiap salah)
    //  - milestone streak (3,5,10,…,100) → MURNI klip voice Hina streak (tanpa base)
    //  - jawaban benar biasa → rightanswer.mp3 saja (Hina diam)
    // Dipanggil di sini karena hanya EffectContext yang tahu streak barunya
    // (call site memanggil triggerEffect SEBELUM streak naik).
    // play*Sound mengembalikan durasi klip (ms) → GIF Hina tampil selama suaranya.
    const feedback = answerFeedbackKind(type, onMilestone);
    const clipMs = feedback === 'streak' ? playStreakSound(streakSoundLevel(streakRef.current))
      : feedback === 'wrong' ? playWrongSound()
        : playCorrectSound();

    // Lama tampil: pack 'hina' → ikuti durasi klip suara (min. 1.2s agar kilau/teks
    // terlihat); pack lain (ink/dummy) → hold efek aslinya.
    const holdMs = activeVisual === 'hina'
      ? hinaGifHoldMs(kind === 'streak' ? 'streak' : type, clipMs)
      : cfg.hold;
    const gifHoldMs = holdMs;   // dipakai komponen GIF sebagai referensi (informatif)

    setFx({
      kind,
      gifSrc,                                    // null = tanpa GIF (Hina diam)
      gifHoldMs,
      id: ++seq,
      seed: Math.floor(Math.random() * 900) + 1,
      angle: -14 - Math.random() * 12,          // sapuan tidak pernah sama
      y: 50 + (Math.random() * 16 - 8),          // posisi vertikal (persen)
      level: info ? info.level : 0,
      milestone: info ? info.milestone : 0,
      streak: type === 'correct' ? streakRef.current : 0,   // angka streak aktual
      signature: info ? info.signature : null,
      onMilestone,
    });
    spawnInk(kind, cfg);
    const t = setTimeout(() => setFx(null), holdMs);
    timersRef.current.push(t);
  }, [active, spawnInk]);

  const resetEffectStreak = useCallback(() => { streakRef.current = 0; }, []);

  return (
    <EffectContext.Provider value={{ triggerEffect, resetEffectStreak, active }}>
      {children}
      <EffectLayer fx={fx} drops={drops} visual={activeVisual} />
    </EffectContext.Provider>
  );
}

// ── Overlay layer ────────────────────────────────────────────────────────────
function EffectLayer({ fx, drops, visual }) {
  const rawId = useId();
  const fid = 'ink' + rawId.replace(/[^a-zA-Z0-9]/g, '');
  const kind = fx?.kind || null;

  // Wash: radial (tinta meresap ke serat kertas), bukan blok warna rata.
  const wash =
    kind === 'wrong' ? 'radial-gradient(circle at 50% 50%, rgba(211,56,47,0.22), rgba(211,56,47,0.04) 55%, transparent 72%)'
      : kind === 'streak' ? `radial-gradient(circle at 50% 50%, rgba(184,144,31,${0.2 + (fx?.level || 1) * 0.02}), rgba(211,56,47,${0.03 + (fx?.level || 1) * 0.008}) 52%, transparent 78%)`
        : kind === 'correct' ? 'radial-gradient(circle at 50% 50%, rgba(125,143,105,0.18), rgba(125,143,105,0.03) 58%, transparent 74%)'
          : 'transparent';

  const ink = kind === 'wrong' ? 'var(--sumi-val)'
    : kind === 'correct' ? 'var(--shu-val)'
      : '#b8901f'; // semua tier streak = emas

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* Visual tinta (pack 'ink') */}
      {visual === 'ink' && (
        <>
          {/* Filter tinta — tepi bergerigi organik */}
          <svg width="0" height="0" className="absolute" aria-hidden="true">
            <defs>
              <filter id={`${fid}-rough`} x="-25%" y="-35%" width="150%" height="170%">
                <feTurbulence type="fractalNoise" baseFrequency="0.022 0.06" numOctaves="3" seed={fx?.seed || 7} result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <filter id={`${fid}-bleed`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4.2" />
              </filter>
            </defs>
          </svg>

          {/* Efek tinta (wash + splash + hanko/kuas) */}
          <motion.div
            className="absolute inset-0"
            animate={
              kind === 'wrong'
                ? { x: [0, -11, 9, -6, 4, 0], y: [0, 3, -3, 2, -1, 0] }
                : fx?.signature === 'zenith100'
                  ? { x: [0, -16, 14, -10, 8, -4, 0], y: [0, -8, 7, -6, 5, -3, 0] }
                  : (kind === 'streak' && fx?.onMilestone && fx.level >= 5)
                    ? { x: [0, -7, 6, -4, 3, 0], y: [0, -4, 4, -3, 2, 0] }
                    : { x: 0, y: 0 }
            }
            transition={{ duration: fx?.signature === 'zenith100' ? 0.7 : 0.5, ease: 'easeOut' }}
          >
            {/* Wash tint (radial, lembut) */}
            <AnimatePresence>
              {kind && (
                <motion.div
                  key={`wash-${fx.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.34, ease: 'easeOut' }}
                  className="absolute inset-0"
                  style={{ background: wash }}
                />
              )}
            </AnimatePresence>

            {/* Ink splash */}
            {drops.map(d => (
              <motion.div
                key={d.id}
                className="absolute left-1/2 top-1/2"
                initial={{ x: 0, y: 0, opacity: 0.95 }}
                animate={{ x: d.dx, y: d.dy, opacity: 0 }}
                transition={{ duration: d.dur, ease: [0.06, 0.72, 0.14, 1], delay: d.delay }}
                style={{
                  width: d.size,
                  height: d.size,
                  marginLeft: -d.size / 2,
                  marginTop: -d.size / 2,
                  filter: d.soft ? 'blur(1.1px)' : undefined,
                }}
              >
                <svg width={d.size} height={d.size} viewBox="0 0 16 12"
                  style={{ transform: `rotate(${d.deg}deg) scaleX(${d.stretch})`, transformOrigin: '0% 50%' }}>
                  <path d={TEARDROP} style={{ fill: ink }} />
                </svg>
              </motion.div>
            ))}
          </motion.div>

          <AnimatePresence>
            {kind === 'correct' && <HankoStamp key={`h-${fx.id}`} fid={fid} />}
            {kind === 'wrong' && <BrushSlash key={`b-${fx.id}`} fid={fid} angle={fx.angle} y={fx.y} />}
          </AnimatePresence>

          {/* Sigil streak (ensō emas + angka) — HANYA pack 'ink'.
              Di pack 'hina' efek streak diganti GIF Hina. */}
          <AnimatePresence>
            {kind === 'streak' && (
              <StreakSigil
                key={`s-${fx.id}`}
                fid={fid}
                level={fx.level}
                milestone={fx.milestone}
                signature={fx.signature}
                streak={fx.streak}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── Vibe Hina Chono (pack 'hina') ──────────────────────────────────────
          Kilau + teks reaksi anime muncul di SETIAP jawaban (benar maupun salah);
          GIF Hina menyusul hanya saat suara Hina bunyi (salah / milestone). */}
      {visual === 'hina' && (
        <AnimatePresence>
          {fx && <HinaBurst key={`hb-${fx.id}`} fx={fx} kind={kind} />}
        </AnimatePresence>
      )}

      {/* Visual dummy (pack placeholder) — kanji 仮 samar */}
      {visual === 'dummy' && fx && (
        <motion.div
          key={`dummy-${fx.id}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.9, 1.05, 1] }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-[18vw] font-serif font-black text-sumi/25 select-none">仮</span>
        </motion.div>
      )}
    </div>
  );
}

// ── Benar: cap hanko 正 — impresi tinta, bukan sticker yang nge-zoom ──────────
function HankoStamp({ fid }) {
  return (
    <div className="absolute left-1/2 top-1/2" style={{ marginLeft: -58, marginTop: -58 }}>
      {/* Halo tinta yang meresap ke kertas */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 0.86 }}
        animate={{ opacity: [0, 0.55, 0], scale: [0.86, 1.12, 1.26] }}
        transition={{ duration: 0.85, ease: 'easeOut' }}
        style={{ filter: `url(#${fid}-bleed)` }}
      >
        <div className="w-[116px] h-[116px] bg-shu" />
      </motion.div>

      {/* Cap: menghantam lalu mengendap (spring), langsung pekat saat menyentuh */}
      <motion.div
        initial={{ scale: 1.55, opacity: 0, rotate: -17 }}
        animate={{ scale: 1, opacity: 1, rotate: -6 }}
        exit={{ opacity: 0, scale: 1.04 }}
        transition={{ type: 'spring', stiffness: 500, damping: 17, mass: 0.7 }}
      >
        <svg width="116" height="116" viewBox="0 0 116 116" style={{ filter: `url(#${fid}-rough)` }}>
          <rect x="9" y="9" width="98" height="98" rx="9" style={{ fill: 'var(--shu-val)' }} />
          <rect x="19" y="19" width="78" height="78" rx="5" fill="none"
            style={{ stroke: 'var(--kinari-light-val)' }} strokeWidth="3" strokeOpacity="0.72" />
        </svg>
        {/* Karakter digambar terpisah supaya tidak ikut terdistorsi berat */}
        <span
          className="absolute inset-0 flex items-center justify-center font-serif font-black leading-none text-kinari-light"
          style={{ fontSize: 46, filter: `url(#${fid}-rough)`, opacity: 0.96 }}
        >
          正
        </span>
      </motion.div>
    </div>
  );
}

// ── Salah: satu sapuan kuas menyeberang (menirus + serat kering) ──────────────
function BrushSlash({ fid, angle, y }) {
  return (
    <motion.div
      className="absolute"
      style={{ left: '50%', top: `${y}%` }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.42, delay: 0.42, ease: 'easeIn' }}
    >
      <motion.div
        initial={{ x: '-52%', y: '-50%', rotate: angle - 6, scale: 0.94 }}
        animate={{ x: '-50%', y: '-50%', rotate: angle, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg width="470" height="120" viewBox="0 0 470 120" overflow="visible">
          <defs>
            <clipPath id={`${fid}-reveal`}>
              {/* Kuas "ditarik" dari kiri ke kanan */}
              <motion.rect
                x="0" y="0" height="120"
                initial={{ width: 0 }}
                animate={{ width: 470 }}
                transition={{ duration: 0.26, ease: [0.2, 0.9, 0.25, 1] }}
              />
            </clipPath>
          </defs>
          <g clipPath={`url(#${fid}-reveal)`} style={{ filter: `url(#${fid}-rough)` }}>
            {/* Badan sapuan */}
            <path d={BRUSH_STROKE} style={{ fill: 'var(--sumi-val)' }} />
            {/* Serat kuas kering */}
            {DRY_STREAKS.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="var(--sumi-val)"
                strokeWidth={i === 1 ? 2.4 : 1.3} strokeOpacity="0.5" strokeLinecap="round" />
            ))}
          </g>
          {/* Cipratan di ujung kuas */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.4, delay: 0.14 }}
            style={{ filter: `url(#${fid}-rough)` }}
          >
            <path d={TEARDROP} style={{ fill: 'var(--sumi-val)' }} transform="translate(392,14) rotate(18) scale(1.5)" />
            <path d={TEARDROP} style={{ fill: 'var(--sumi-val)' }} transform="translate(360,74) rotate(160) scale(1.1)" />
            <path d={TEARDROP} style={{ fill: 'var(--sumi-val)' }} transform="translate(430,44) rotate(-30) scale(0.9)" />
          </motion.g>
        </svg>
      </motion.div>
    </motion.div>
  );
}

// ── Streak milestone: sigil ensō parametrik (level 1..12) ─────────────────────
// Cincin & intensitas naik sesuai level; angka menampilkan streak AKTUAL
// (3連, 4連, … 19連, … 100連, 101連 — tidak di-cap).
// Signature 50 (金) & 100 (百) menambah kilatan penuh layar + badge hanko.
function StreakSigil({ fid, level, milestone, signature, streak }) {
  const L = Math.max(1, level);
  const rings = Math.min(L, 6);
  const size = 264 + L * 14;
  const half = size / 2;
  // Angka mengikuti streak asli (keputusan user #1 & #11), bukan milestone.
  const shown = Math.max(streak || milestone || 1, 1);
  const kanji = `${shown}連`;
  // Font adaptif: "連" (1 char) bisa besar, "100連" (4 char) harus mengecil
  // supaya tidak meluber keluar cincin.
  const baseSize = Math.min(46 + L * 4, 104);
  const len = String(kanji).length;
  const kanjiSize = Math.round(baseSize / (1 + Math.max(0, len - 1) * 0.34));
  const ringColors = ['#b8901f', 'var(--shu-val)', 'var(--sumi-val)'];
  const isSignature = !!signature;
  const zenith = signature === 'zenith100';

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 1.16 }}
      transition={{ duration: 0.38, ease: 'easeOut' }}
      style={{ marginLeft: -half, marginTop: -half }}
    >
      {/* Kilatan penuh layar (signature saja; 100 paling terang) */}
      {isSignature && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: zenith ? [0, 0.95, 0] : [0, 0.6, 0] }}
          transition={{ duration: zenith ? 0.75 : 0.55, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            background: zenith
              ? 'radial-gradient(circle at 50% 50%, rgba(255,244,214,0.95), rgba(184,144,31,0.5) 45%, rgba(211,56,47,0.2) 70%, transparent 88%)'
              : 'radial-gradient(circle at 50% 50%, rgba(184,144,31,0.6), rgba(211,56,47,0.2) 55%, transparent 80%)',
          }}
        />
      )}

      {/* Halo tinta */}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: [0, 0.6, 0], scale: [0.72, 1.14, 1.34] }}
        transition={{ duration: 0.95 + L * 0.03, ease: 'easeOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(184,144,31,0.5), rgba(211,56,47,0.14) 48%, transparent 68%)',
          filter: `url(#${fid}-bleed)`,
        }}
      />

      {/* Cincin ensō — jumlah & arah naik sesuai level */}
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `url(#${fid}-rough)` }}>
        {Array.from({ length: rings }).map((_, i) => {
          const r = 46 - i * 7;
          const dir = i % 2 === 0 ? 90 : -90;
          return (
            <motion.circle
              key={i}
              cx="50" cy="50" r={r} fill="none"
              strokeWidth={Math.max(1, 4.4 - i * 0.6)} strokeLinecap="round" pathLength={1}
              style={{ stroke: ringColors[i % ringColors.length], rotate: dir, transformOrigin: '50px 50px' }}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 0.94 - i * 0.03, opacity: i === 0 ? 1 : Math.max(0.28, 0.95 - i * 0.14) }}
              transition={{ duration: 0.8 + L * 0.04, ease: [0.33, 1, 0.68, 1], delay: i * 0.08 }}
            />
          );
        })}
      </svg>

      {/* Kanji / angka milestone */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.45, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 220, damping: 17 }}
          className="font-serif font-black text-sumi leading-none"
          style={{ fontSize: kanjiSize }}
        >
          {kanji}
        </motion.span>
      </div>

      {/* Badge signature 50 (金) / 100 (百) */}
      {isSignature && (
        <motion.div
          className="absolute left-1/2 top-1/2"
          initial={{ scale: 2.4, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: -8 }}
          transition={{ delay: 0.42, type: 'spring', stiffness: 380, damping: 15 }}
          style={{ marginLeft: -40, marginTop: half - 26 }}
        >
          <div className={`w-[80px] h-[80px] border-[3px] border-sumi flex items-center justify-center shadow-[4px_4px_0_0_rgba(26,26,26,0.3)] ${zenith ? 'bg-shu' : 'bg-[#d4af37]'}`}>
            <span className="font-serif font-black text-kinari-light text-4xl leading-none">
              {zenith ? '百' : '金'}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Vibe Hina Chono (pack 'hina') ────────────────────────────────────────────
// Muncul di SETIAP jawaban:
//   • kilau pink (✦ ★ ♡ ❀) melesat keluar  → selalu
//   • teks reaksi anime pink 正解！/ドンマイ！/連続正解！ → selalu
//   • GIF Hina (HinaRight* / HinaWrong*) → HANYA saat suara Hina bunyi
//     (salah / milestone streak) — fx.gifSrc diisi oleh hinaGifForAnswer.
//
// Tata letak anti-tumpuk: kalau ada GIF, teks naik ke atas (top 8vh) & GIF di
// tengah; kalau tidak ada GIF (benar biasa), teks di tengah & dibuat besar +
// glow + ring pulse supaya jawaban BENAR tetap jelas terlihat.
function HinaBurst({ fx, kind }) {
  const wrong = kind === 'wrong';
  const hasGif = Boolean(fx.gifSrc);
  const [sparks] = useState(() => hinaSparkles(fx.id, hinaSparkleCount(kind)));
  const label = hinaAnswerText(kind);
  const color = hinaTextColor(kind);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.16, ease: 'easeOut' } }}
    >
      {/* Kilau melesat keluar dari tengah — stagger + putaran biar hidup */}
      {sparks.map(s => (
        <motion.span
          key={s.id}
          className="absolute select-none"
          style={{ fontSize: s.size, color: s.hue, textShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.3, rotate: 0 }}
          animate={{ opacity: [0, 1, 1, 0], x: s.dx, y: s.dy, scale: 1, rotate: s.rot + s.spin }}
          transition={{ duration: s.dur, delay: s.delay, ease: [0.22, 1, 0.36, 1] }}
        >
          {s.char}
        </motion.span>
      ))}

      {/* Teks reaksi anime pink (selalu ada, walau Hina diam) */}
      {label && (
        <motion.div
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: hasGif ? '8vh' : '50%', transform: hasGif ? 'none' : 'translateY(-50%)' }}
        >
          {/* Ring pulse — tipis & lembut, menegaskan momen tanpa berisik */}
          <motion.span
            className="absolute rounded-full"
            style={{ border: `2px solid ${color}`, width: 150, height: 150 }}
            initial={{ opacity: 0.4, scale: 0.5 }}
            animate={{ opacity: 0, scale: hasGif ? 1.5 : 2.1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.span
            className="relative font-serif font-black select-none"
            style={{
              fontSize: hasGif ? 'clamp(40px, 8vw, 84px)' : 'clamp(52px, 12vw, 132px)',
              color,
              WebkitTextStroke: '2px var(--kinari-light-val)',
              paintOrder: 'stroke fill',
              textShadow: hinaGlow(color),
              willChange: 'transform, opacity',
            }}
            initial={{ opacity: 0.3, scale: 0.72 }}
            animate={wrong ? { opacity: [0, 1, 1, 0], scale: 1 } : { opacity: 1, scale: 1 }}
            transition={wrong
              ? {
                scale: { duration: 0.42, ease: HINA_POP_EASE },
                opacity: { duration: 1.2, times: [0, 0.12, 0.72, 1], ease: 'easeOut' },
              }
              : {
                scale: { duration: 0.36, ease: HINA_POP_EASE },
                opacity: { duration: 0.16, ease: 'easeOut' },
              }}
          >
            {label}
          </motion.span>
        </motion.div>
      )}

      {/* GIF Hina — hanya saat suara Hina bunyi (di tengah, teks sudah pindah ke atas) */}
      {hasGif && (
        <motion.div
          className="absolute left-1/2 top-1/2"
          style={{ marginLeft: '-18vh', marginTop: '-16vh' }}
          initial={{ opacity: 1, scale: 0.94, rotate: wrong ? 2.5 : -2 }}
          animate={
            wrong
              ? { opacity: 1, scale: 1, rotate: -1.5, x: [0, -9, 8, -5, 3, 0] }
              : { opacity: 1, scale: 1, rotate: 1.5, x: 0 }
          }
          exit={{ opacity: 0, scale: 0.96 }}
          transition={
            wrong
              ? { duration: 0.34, ease: 'easeOut' }
              : { duration: 0.18, ease: 'easeOut' }
          }
        >
          <div
            className="w-[36vh] h-[36vh] border-[3px] border-sumi bg-kinari shadow-[8px_8px_0_0_rgba(26,26,26,0.32)] overflow-hidden"
          >
            <img
              src={fx.gifSrc}
              alt="Hina Chono"
              decoding="sync"
              loading="eager"
              className="w-full h-full object-contain select-none"
              draggable={false}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
