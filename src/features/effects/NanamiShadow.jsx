import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  NANAMI_ULT_THRESHOLD, NANAMI_GOLD, NANAMI_GOLD_DEEP, NANAMI_NAVY,
  NANAMI_TIMELINE, NANAMI_QUOTE, NANAMI_OVERTIME_S, NANAMI_RUBBLE_MAX,
  nanamiRatioLine, nanamiAura,
} from './nanamiFx';

// ─────────────────────────────────────────────────────────────────────────────
// 十劃呪法 — bar 呪力 (じゅりょく · juryoku) 20 slot + cinematic 時間外労働・全開
// + state lembur 30 dtk (pack_11, visual 'nanami'). Ultimate `rare`:
//   • NanamiCurseBar    → 20 slot (pola JJK konsisten); tap saat penuh = 全開;
//                         saat lembur hidup → bar jadi TIMER 30s + counter 瓦 ×N.
//   • NanamiUltCine     → sync NANAMI_TIMELINE (2.4 dtk): veil → jam dilihat
//                         (2 jarum berputar cepat) → dasi lepas → kanji quote
//                         per-frasa → aura emas meledak → garis 7:3 raksasa → settle.
//   • NanamiOvertimeAura→ persist 30 dtk: aura emas naik bergelombang (z-6) +
//                         jam kecil & counter puing 瓦 (z-11, zona aman).
// Mekanik 瓦落瓦落・連鎖 (FINAL B): benar selama lembur → +1 puing (cap 3);
// soal berikutnya puing menghancurkan opsi salah (selalu sisa ≥1); salah →
// kontrak batal (縛り破棄) + streak hangus. Filosofi: KERJA BERBUAH.
// reduced-motion: kanji/jam/counter TETAP tampil (informasi kanon), gerakan
// veil/shake/partikel disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Jam tangan 2 jarum (motif waktu — ultah 7/3, stress 残業) ───────────────
// `fast` = jarum berputar cepat (momen "jam dilihat" di cinematic).
function WatchFace({ size = 96, fast = false, reduced = false, label = false }) {
  const hand = (deg, len, w, color) => (
    <line
      x1="50" y1="50"
      x2={50 + Math.sin((deg * Math.PI) / 180) * len}
      y2={50 - Math.cos((deg * Math.PI) / 180) * len}
      stroke={color} strokeWidth={w} strokeLinecap="round"
    />
  );
  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }} aria-label="腕時計">
      <circle cx="50" cy="50" r="46" fill="rgba(10,10,10,0.72)" stroke={NANAMI_GOLD} strokeWidth="2.4" />
      <circle cx="50" cy="50" r="39" fill="none" stroke={NANAMI_GOLD_DEEP} strokeWidth="0.8" strokeOpacity="0.8" />
      {/* 12 takik menit */}
      {Array.from({ length: 12 }).map((_, i) => {
        const rad = ((i / 12) * 360 * Math.PI) / 180;
        return (
          <line key={i}
            x1={50 + Math.sin(rad) * 41} y1={50 - Math.cos(rad) * 41}
            x2={50 + Math.sin(rad) * 45} y2={50 - Math.cos(rad) * 45}
            stroke={NANAMI_GOLD_DEEP} strokeWidth="1" strokeOpacity="0.85" />
        );
      })}
      {/* 7:3 di dial — dua jarum TEPAT di posisi 7 & 3 saat settle */}
      <motion.g
        initial={{ rotate: 0 }}
        animate={reduced ? { rotate: 0 } : { rotate: fast ? 720 : 0 }}
        transition={reduced ? { duration: 0 } : { duration: fast ? 1.15 : 0.6, ease: [0.33, 1, 0.68, 1] }}
        style={{ transformOrigin: '50px 50px' }}
      >
        {hand(210, 26, 2.6, '#fffbeb')}
      </motion.g>
      <motion.g
        initial={{ rotate: 0 }}
        animate={reduced ? { rotate: 0 } : { rotate: fast ? -540 : 0 }}
        transition={reduced ? { duration: 0 } : { duration: fast ? 1.15 : 0.6, ease: [0.33, 1, 0.68, 1] }}
        style={{ transformOrigin: '50px 50px' }}
      >
        {hand(90, 34, 1.8, NANAMI_GOLD)}
      </motion.g>
      <circle cx="50" cy="50" r="3" fill={NANAMI_GOLD} />
      {label && (
        <text x="50" y="72" textAnchor="middle" fontSize="11" fontWeight="900"
          fill="#fffbeb" fontFamily="ui-serif, serif" letterSpacing="2">残業</text>
      )}
    </svg>
  );
}

// ── Bar 呪力 Nanami: 20 slot + mode TIMER saat lembur (pola MegumiCurseBar) ──
export function NanamiCurseBar({
  charge = 0, ready = false, onCast, casting = false,
  overtimeOn = false, overtimeLeft = 0, piles = 0,
}) {
  const [reduced] = useState(prefersReduced);
  const pct = overtimeOn
    ? Math.max(0, Math.min(100, (overtimeLeft / NANAMI_OVERTIME_S) * 100))
    : Math.max(0, Math.min(100, (charge / NANAMI_ULT_THRESHOLD) * 100));
  const urgent = overtimeOn && overtimeLeft <= 5;
  const accent = urgent ? '#fffbeb' : NANAMI_GOLD;

  // 20 slot: 2 baris × 10 kolom (mudah dibaca di layar sempit).
  const slots = Array.from({ length: NANAMI_ULT_THRESHOLD });
  return (
    <div
      data-nanami-cursebar
      className="pointer-events-none fixed right-2.5 top-[6vh] sm:top-1/2 sm:-translate-y-1/2 z-[125] flex flex-col items-center gap-1.5"
    >
      <div className="flex h-14 items-center justify-center">
        {casting && (
          <motion.span
            key="cast-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#fffbeb', writingMode: 'vertical-rl', textShadow: `0 0 14px ${NANAMI_GOLD}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
          >
            全開
          </motion.span>
        )}
        {!casting && overtimeOn && (
          <motion.span
            key="overtime-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#fffbeb', writingMode: 'vertical-rl', textShadow: `0 0 12px ${NANAMI_GOLD}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={reduced ? { opacity: 1, y: 0 } : { opacity: [0.55, 1, 0.55], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          >
            残業中
          </motion.span>
        )}
        {!casting && !overtimeOn && ready && (
          <motion.span
            key="ready-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#fffbeb', writingMode: 'vertical-rl', textShadow: `0 0 12px ${NANAMI_GOLD}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={reduced ? { opacity: 1, y: 0 } : { opacity: [0.65, 1, 0.65], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            時間外労働
          </motion.span>
        )}
      </div>

      <motion.button
        type="button"
        onClick={ready && !casting && !overtimeOn ? onCast : undefined}
        aria-label="呪力 — 時間外労働・全開"
        disabled={!ready || casting || overtimeOn}
        className={`relative rounded-[4px] border-[2px] p-[4px] ${
          (ready || casting || overtimeOn) ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
        }`}
        style={{
          borderColor: (ready || casting || overtimeOn) ? accent : 'rgba(180,83,9,0.45)',
          background: 'rgba(10,10,10,0.66)',
          boxShadow: (ready || casting || overtimeOn)
            ? `0 0 18px 3px ${accent}cc, inset 0 0 10px ${accent}55`
            : '0 0 8px 1px rgba(180,83,9,0.3)',
        }}
        animate={ready && !reduced && !casting && !overtimeOn ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={ready && !reduced && !casting && !overtimeOn ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        <div className="grid grid-cols-10 gap-[2px]">
          {slots.map((_, i) => {
            const lit = casting
              ? true
              : overtimeOn
                ? i < Math.ceil((pct / 100) * NANAMI_ULT_THRESHOLD)
                : i < Math.round(charge);
            return (
              <div
                key={i}
                className="relative h-[9px] w-[9px] overflow-hidden rounded-[2px]"
                style={{ background: 'rgba(180,83,9,0.12)', border: '1px solid rgba(180,83,9,0.28)' }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${NANAMI_GOLD_DEEP})`,
                    boxShadow: `0 0 7px ${accent}aa`,
                  }}
                  initial={false}
                  animate={{ opacity: lit ? 1 : 0, scale: lit ? 1 : 0.6 }}
                  transition={overtimeOn ? { duration: 0.25, ease: 'linear' } : { type: 'spring', stiffness: 140, damping: 18 }}
                />
              </div>
            );
          })}
        </div>

        {/* Jam kecil di dalam tombol saat lembur (pola roda Megumi kecil) */}
        {overtimeOn && (
          <div className="pointer-events-none absolute -right-[54px] top-1/2 -translate-y-1/2">
            <WatchFace size={46} fast={false} reduced={reduced} />
          </div>
        )}
      </motion.button>

      <span
        className={`font-mono font-black text-[10px] tracking-widest ${urgent && !reduced ? 'animate-pulse' : ''}`}
        style={{ color: (ready || casting || overtimeOn) ? '#fffbeb' : 'rgba(255,251,235,0.6)' }}
      >
        {casting ? '全開中' : overtimeOn ? `${overtimeLeft}s` : `${charge}/${NANAMI_ULT_THRESHOLD}`}
      </span>

      {/* Counter puing 瓦 ×N — indikator state 連鎖 (ux: progress indicator) */}
      {overtimeOn && (
        <motion.span
          data-nanami-piles
          className="font-serif font-black text-[11px] tracking-[0.25em]"
          style={{ writingMode: 'vertical-rl', color: piles > 0 ? NANAMI_GOLD : 'rgba(255,251,235,0.5)', textShadow: `0 0 10px ${NANAMI_GOLD}` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: reduced ? 0.95 : [0.6, 1, 0.6] }}
          transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: piles > 0 ? 1.6 : 2.6, ease: 'easeInOut' }}
        >
          {piles > 0 ? `瓦 ×${piles}` : `瓦 0/${NANAMI_RUBBLE_MAX}`}
        </motion.span>
      )}
    </div>
  );
}

// ── Cinematic 時間外労働・全開 — sync NANAMI_TIMELINE (2.4 dtk) ──────────────
// 0 veil · 0.15 jam (2 jarum muter cepat) · 0.4 dasi lepas · 0.7 quote per-frasa
// · 1.4 aura meledak · 1.8 garis 7:3 raksasa · 2.4 settle (state lembur).
// Semua di lapisan BELAKANG konten (z ≤ 124) kecuali kanji/garis (di tepi) —
// TIDAK menutupi soal. reduced-motion → tanpa veil/partikel, kanji & bentuk tetap.
export function NanamiUltCine({ seed = 1 }) {
  const [reduced] = useState(prefersReduced);
  const t = NANAMI_TIMELINE;
  const [line] = useState(() => nanamiRatioLine(seed));
  const [motes] = useState(() => nanamiAura(seed, reduced ? 6 : 14));

  return (
    <>
      {/* veil gelap (z-124 — di bawah bar 125, di atas konten 100) */}
      {!reduced && (
        <motion.div
          data-nanami-ult-veil
          className="fixed inset-0 z-[124] pointer-events-none"
          style={{ background: 'radial-gradient(120% 100% at 50% 50%, rgba(2,6,23,0.4), rgba(10,10,10,0.78) 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: t.settleAt + 0.3, times: [0, 0.08, 0.9, 1], ease: 'easeInOut' }}
        />
      )}

      {/* flash putih tipis saat garis raksasa mendarat (t=1.8) */}
      {!reduced && (
        <motion.div
          className="fixed inset-0 z-[132] pointer-events-none"
          style={{ background: '#fff' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.55, 0] }}
          transition={{ duration: 0.2, delay: t.lineAt, ease: 'linear' }}
        />
      )}

      {/* Jam dilihat — 2 jarum berputar cepat (t=0.15) */}
      <motion.div
        data-nanami-ult-watch
        className="fixed left-1/2 top-[30%] z-[128] pointer-events-none"
        style={{ x: '-50%' }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={reduced
          ? { opacity: [0, 1, 1, 0], scale: 1 }
          : { opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 1.08] }}
        transition={{ duration: 0.9, delay: t.watchAt, times: [0, 0.16, 0.82, 1], ease: [0.34, 1.56, 0.64, 1] }}
      >
        <WatchFace size={132} fast reduced={reduced} />
      </motion.div>

      {/* Dasi lepas + kain berkibar (t=0.4) */}
      <motion.div
        data-nanami-ult-tie
        className="fixed left-1/2 top-[46%] z-[128] pointer-events-none"
        style={{ x: '-50%' }}
        initial={{ opacity: 0, y: -14, rotate: 0 }}
        animate={reduced
          ? { opacity: [0, 1, 0], y: 0, rotate: 0 }
          : { opacity: [0, 1, 1, 0], y: [-14, 10, 26, 40], rotate: [0, -10, 8, 16] }}
        transition={{ duration: 1.05, delay: t.tieAt, times: [0, 0.25, 0.7, 1], ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 60 84" width="54" height="76" aria-label="ネクタイ">
          <path d="M30 0 L44 12 L36 22 L36 34 L24 34 L24 22 L16 12 Z" fill={NANAMI_NAVY} stroke="#0f172a" strokeWidth="1.6" />
          <path d="M24 34 L36 34 L42 62 L30 84 L18 62 Z" fill={NANAMI_NAVY} stroke="#0f172a" strokeWidth="1.6" />
          <line x1="26" y1="42" x2="34" y2="52" stroke={NANAMI_GOLD_DEEP} strokeWidth="1.4" strokeOpacity="0.9" />
          <line x1="24" y1="54" x2="36" y2="46" stroke={NANAMI_GOLD_DEEP} strokeWidth="1.2" strokeOpacity="0.75" />
        </svg>
      </motion.div>

      {/* Kanji quote 「残念ですがここからは時間外労働です」 per-frasa (t=0.7) */}
      <div className="fixed inset-x-0 top-[12%] z-[133] pointer-events-none flex flex-col items-center gap-[0.8vmin]">
        {NANAMI_QUOTE.map((frase, i) => (
          <motion.span
            key={frase}
            data-nanami-quote
            className="font-serif font-black select-none"
            style={{
              fontSize: i === NANAMI_QUOTE.length - 1 ? 'clamp(30px, 6.6vmin, 62px)' : 'clamp(20px, 4.2vmin, 40px)',
              color: '#fffbeb',
              WebkitTextStroke: `1.4px ${NANAMI_GOLD_DEEP}`,
              textShadow: `0 0 18px ${NANAMI_GOLD}, 0 0 52px ${NANAMI_GOLD_DEEP}aa`,
              willChange: 'transform, opacity',
            }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={reduced
              ? { opacity: [0, 1, 1], scale: 1 }
              : { opacity: [0, 1, 1], scale: [0.7, 1.1, 1] }}
            transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : t.quoteAt + i * t.quotePer, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {frase}
          </motion.span>
        ))}
      </div>

      {/* Aura emas meledak — partikel naik BERGELOMBANG (sin), t=1.4 */}
      {!reduced && (
        <div className="fixed inset-0 z-[127] pointer-events-none overflow-hidden" aria-hidden="true">
          {motes.map((m) => (
            <motion.span
              key={m.id}
              className="absolute rounded-full"
              style={{
                left: `${m.x}%`, bottom: '2%',
                width: m.size, height: m.size,
                background: `radial-gradient(circle, #fffbeb, ${NANAMI_GOLD})`,
                boxShadow: `0 0 10px ${NANAMI_GOLD}cc`,
              }}
              initial={{ opacity: 0, y: 0 }}
              animate={{
                opacity: [0, 0.95, 0],
                y: [0, -m.rise * 1.6],
                x: [0, Math.sin(m.phase) * m.sway],
              }}
              transition={{ duration: 1.15, delay: t.auraAt + m.delay, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </div>
      )}

      {/* Garis 7:3 RAKSASA melintang seluruh layar + titik nyala (t=1.8) */}
      <motion.div
        data-nanami-ult-line
        className="fixed left-1/2 top-1/2 z-[129] pointer-events-none"
        style={{ x: '-50%', y: '-50%', rotate: line.angle }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: [0, 1, 0.92] } : { opacity: [0, 1, 1, 0.9] }}
        transition={{ duration: 0.55, delay: t.lineAt, ease: [0.33, 1, 0.68, 1] }}
      >
        <div style={{ position: 'relative', width: '150vw', height: 3 }}>
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${NANAMI_GOLD_DEEP} 8%, ${NANAMI_GOLD} 45%, #fffbeb 70%, ${NANAMI_GOLD} 74%, ${NANAMI_GOLD_DEEP} 92%, transparent 100%)`,
              boxShadow: `0 0 18px ${NANAMI_GOLD}cc, 0 0 42px ${NANAMI_GOLD_DEEP}88`,
              transformOrigin: 'left',
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.42, delay: t.lineAt, ease: [0.33, 1, 0.68, 1] }}
          />
          {/* titik 7:3 nyala — DI posisi 70% garis (identitas presisi) */}
          <motion.div
            className="absolute"
            style={{ left: '70%', top: '50%', width: 12, height: 12, marginLeft: -6, marginTop: -6 }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 0.85], scale: [0.4, 1.6, 1.2] }}
            transition={{ duration: 0.4, delay: t.lineAt + 0.22, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="w-full h-full rounded-full" style={{ background: '#fffbeb', boxShadow: `0 0 16px 4px ${NANAMI_GOLD}` }} />
          </motion.div>
        </div>
      </motion.div>

      {/* Kanji 全開 momen puncak */}
      <motion.span
        data-nanami-ult-kanji
        className="fixed left-1/2 z-[133] font-serif font-black select-none pointer-events-none"
        style={{
          top: '62%', x: '-50%',
          fontSize: 'clamp(38px, 9vmin, 84px)',
          color: '#fffbeb',
          WebkitTextStroke: `2px ${NANAMI_GOLD_DEEP}`,
          textShadow: `0 0 18px ${NANAMI_GOLD}, 0 0 52px ${NANAMI_GOLD_DEEP}aa`,
          willChange: 'transform, opacity',
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0.92], scale: [0.6, 1.16, 1, 1.02] }}
        transition={{ duration: reduced ? 0 : 0.72, delay: reduced ? 0 : t.lineAt + 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      >
        時間外労働・全開
      </motion.span>
    </>
  );
}

// ── Persist 30 dtk: aura emas + PENANDA lembur (pola MegumiAura split 2 layer) ─
//   • z-6  : atmosfer (wash emas tipis + partikel naik bergelombang) — DI BELAKANG.
//   • z-11 : PENANDA (vignette tepi + jam kecil + kanji 残業中) — zona aman tepi.
export function NanamiOvertimeAura({ seed = 1 }) {
  const [reduced] = useState(prefersReduced);
  const [motes] = useState(() => nanamiAura(seed, reduced ? 5 : 10));

  return createPortal(
    <>
      {/* ── Layer belakang: atmosfer ── */}
      <motion.div
        data-nanami-overtime-aura
        className="pointer-events-none fixed inset-0 z-[6] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.7, ease: 'easeOut' }}
      >
        {/* Wash emas korporat tipis (identitas 黄金 — bukan merah/kutukan) */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 92% at 50% 100%, rgba(180,83,9,0.16) 0%, rgba(10,10,10,0.05) 52%, transparent 100%)' }} />

        {/* Napas aura emas */}
        <motion.div
          className="absolute inset-0"
          style={{ background: `radial-gradient(88% 70% at 50% 78%, ${NANAMI_GOLD}1f, transparent 74%)` }}
          animate={reduced ? { opacity: 0.5 } : { opacity: [0.3, 0.7, 0.3] }}
          transition={reduced ? { duration: 0 } : { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Partikel emas naik bergelombang (bukan glow statis — anti-slop #3) */}
        {motes.map((m) => (
          <motion.span
            key={m.id}
            className="absolute rounded-full"
            style={{
              left: `${m.x}%`, bottom: '4%',
              width: m.size, height: m.size,
              background: `radial-gradient(circle, #fffbeb, ${NANAMI_GOLD})`,
              boxShadow: `0 0 10px ${NANAMI_GOLD}88`,
            }}
            animate={reduced ? { opacity: 0.4 } : { opacity: [0, 0.8, 0], y: [0, -m.rise], x: [0, Math.sin(m.phase) * m.sway] }}
            transition={{ duration: reduced ? 0 : m.dur + 1.6, delay: reduced ? 0 : m.delay, repeat: reduced ? 0 : Infinity, repeatDelay: m.dur, ease: 'easeOut' }}
          />
        ))}
      </motion.div>

      {/* ── Layer depan: PENANDA lembur (di atas konten, zona aman) ── */}
      <motion.div
        data-nanami-overtime-front
        className="pointer-events-none fixed inset-0 z-[11] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.7, ease: 'easeOut' }}
      >
        {/* Vignette tepi tipis — tengah transparan (soal tetap kebaca) */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(130% 112% at 50% 50%, transparent 58%, rgba(120,53,15,0.32) 100%)' }} />

        {/* Jam kecil persist (kiri atas — penanda lembur aktif) */}
        <div className="absolute left-[4vw] top-[7vh] opacity-80">
          <WatchFace size={64} fast={false} reduced={reduced} />
        </div>

        {/* Kanji 時間外労働 persist (bawah jam, kecil & samar) */}
        <motion.span
          data-nanami-overtime-kanji
          className="absolute left-[4vw] top-[calc(7vh+68px+1vh)] font-serif font-black select-none pointer-events-none"
          style={{
            fontSize: 'clamp(15px, 2.4vw, 26px)',
            color: NANAMI_GOLD,
            WebkitTextStroke: `1px ${NANAMI_GOLD_DEEP}`,
            textShadow: `0 0 16px ${NANAMI_GOLD}88`,
            writingMode: 'vertical-rl',
          }}
          initial={{ opacity: 0 }}
          animate={reduced ? { opacity: 0.6 } : { opacity: [0, 0.75, 0.6] }}
          transition={{ duration: reduced ? 0 : 0.9, ease: 'easeOut' }}
        >
          時間外労働
        </motion.span>
      </motion.div>
    </>,
    document.body,
  );
}

// ── Marker puing menghantam opsi yang dihancurkan (pola NobaraCutMarker) ─────
// Puing emas 瓦 menghantam kartu opsi → ring emas berdenyut lalu memudar.
export function NanamiRubbleMarker({ id, reduced, delay = 0 }) {
  const [pos, setPos] = useState(null);
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const el = document.querySelector(`button[data-option-id="${CSS.escape(id)}"]`);
    if (!el) return undefined;
    const r = el.getBoundingClientRect();
    setPos({ x: r.left, y: r.top, w: r.width, h: r.height });
    return undefined;
  }, [id]);
  if (!pos) return null;
  return (
    <motion.div
      data-nanami-rubble-marker
      className="fixed z-[126] pointer-events-none"
      style={{ left: pos.x, top: pos.y, width: pos.w, height: pos.h, borderRadius: 2 }}
      initial={{ opacity: 0 }}
      animate={reduced ? { opacity: 0.8 } : { opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
    >
      <div className="w-full h-full" style={{
        border: `2px solid ${NANAMI_GOLD}`,
        boxShadow: `0 0 16px 4px ${NANAMI_GOLD}aa, inset 0 0 12px ${NANAMI_GOLD_DEEP}66`,
        background: `radial-gradient(circle at 50% 50%, ${NANAMI_GOLD}22, transparent 70%)`,
      }} />
    </motion.div>
  );
}

export default NanamiCurseBar;
