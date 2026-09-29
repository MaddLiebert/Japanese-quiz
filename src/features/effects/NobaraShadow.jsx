import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  NOBARA_ULT_THRESHOLD, NOBARA_ULT_TIMELINE, NOBARA_ORANGE, NOBARA_LIGHT, NOBARA_RED,
  NOBARA_CORE, NOBARA_DARK, nobaraUltNails,
} from './nobaraFx';

// ─────────────────────────────────────────────────────────────────────────────
// 芻霊呪法 · 全弾爆発 — bar 呪力 (じゅりょく · juryoku) 20 slot untuk pack_08
// (visual 'nobara'). Ultimate `common` = ONE-SHOT, TANPA Domain Expansion &
// tanpa state mekanik (beda dari rare Megumi yang summon 30 dtk).
//   • NobaraCurseBar → 20 slot (pola JJK konsisten); tap saat penuh = 全弾爆発
//     (ぜんだんばくはつ · zendan bakuhatsu = semua meledak).
// Filosofi (spec Nobara.md §6): Nobara = LEDAKAN. Sekali tekan, semua meledak —
// bukan kontrol (Gojo), bukan penghancuran bertahap (Yuji), bukan ketahanan
// (Megumi). Simpel & langsung, cocok rarity `common`.
// reduced-motion: bar tetap tampil & terbaca; hanya denyut yang dimatikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function NobaraCurseBar({ charge = 0, ready = false, onCast, casting = false }) {
  const [reduced] = useState(prefersReduced);

  // 20 slot: 2 baris × 10 kolom (pola Megumi — mudah dibaca di layar sempit).
  const slots = Array.from({ length: NOBARA_ULT_THRESHOLD });
  return (
    <div
      data-nobara-cursebar
      className="pointer-events-none fixed right-2.5 top-[6vh] sm:top-1/2 sm:-translate-y-1/2 z-[125] flex flex-col items-center gap-1.5"
    >
      <div className="flex h-14 items-center justify-center">
        {ready && !casting && (
          <motion.span
            key="ready-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#fff7ed', writingMode: 'vertical-rl', textShadow: `0 0 12px ${NOBARA_ORANGE}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={reduced ? { opacity: 1, y: 0 } : { opacity: [0.65, 1, 0.65], y: 0 }}
            transition={reduced ? { duration: 0 } : { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            芻霊呪法
          </motion.span>
        )}
        {casting && (
          <motion.span
            key="cast-label"
            className="font-serif font-black tracking-[0.3em] text-[10px]"
            style={{ color: '#fff7ed', writingMode: 'vertical-rl', textShadow: `0 0 14px ${NOBARA_RED}` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
          >
            全弾爆発
          </motion.span>
        )}
      </div>

      <motion.button
        type="button"
        onClick={ready && !casting ? onCast : undefined}
        aria-label="呪力 — 全弾爆発"
        disabled={!ready || casting}
        className={`relative rounded-[4px] border-[2px] p-[4px] ${
          (ready || casting) ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
        }`}
        style={{
          borderColor: (ready || casting) ? NOBARA_ORANGE : 'rgba(249,115,22,0.4)',
          background: 'rgba(12,7,3,0.68)',
          boxShadow: (ready || casting)
            ? `0 0 18px 3px ${NOBARA_ORANGE}cc, inset 0 0 10px ${NOBARA_ORANGE}55`
            : '0 0 8px 1px rgba(249,115,22,0.3)',
        }}
        animate={ready && !reduced && !casting ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={ready && !reduced && !casting ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        <div className="grid grid-cols-10 gap-[2px]">
          {slots.map((_, i) => {
            const lit = casting ? true : i < Math.round(charge);
            return (
              <div
                key={i}
                className="relative h-[9px] w-[9px] overflow-hidden rounded-[2px]"
                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.28)' }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${NOBARA_LIGHT}, ${NOBARA_ORANGE})`,
                    boxShadow: `0 0 7px ${NOBARA_ORANGE}aa`,
                  }}
                  initial={false}
                  animate={{ opacity: lit ? 1 : 0, scale: lit ? 1 : 0.6 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                />
              </div>
            );
          })}
        </div>
      </motion.button>

      <span
        className="font-mono font-black text-[10px] tracking-widest"
        style={{ color: (ready || casting) ? '#fff7ed' : 'rgba(255,247,237,0.6)' }}
      >
        {casting ? '爆発中' : `${charge}/${NOBARA_ULT_THRESHOLD}`}
      </span>
    </div>
  );
}

// ── 全弾爆発 (zendan bakuhatsu) — cinematic ONE-SHOT 2.2s ────────────────────
// Timeline (NOBARA_ULT_TIMELINE, detik):
//   0.00 veil gelap turun · 0.15 12 paku muncul dari tepi (stagger 40ms) ·
//   0.50 semua tancap + getar · 0.65 core flash putih 1 frame · 0.70 LEDAKAN
//   BESAR + shake · 1.00 opsi salah meledak satu-satu (stagger 80ms, cut DOM) ·
//   1.60 kanji 共鳴り・魂 · 2.20 veil naik & settle.
// Semua elemen di lapisan BELAKANG konten (z di bawah kuis) atau di kartu —
// TIDAK menutupi soal. reduced-motion → tanpa veil/shake, kanji & burst tetap.
export function NobaraUltCine({ seed = 1, cutIds = [] }) {
  const [reduced] = useState(prefersReduced);
  const T = NOBARA_ULT_TIMELINE;
  return (
    <>
      {/* veil gelap (z-124 — di bawah bar 呪力 125, di atas konten 100) */}
      {!reduced && (
        <motion.div
          data-nobara-ult-veil
          className="fixed inset-0 z-[124] pointer-events-none"
          style={{ background: 'radial-gradient(120% 100% at 50% 50%, rgba(2,6,23,0.35), rgba(2,6,23,0.72) 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: T.settleAt, times: [0, 0.09, 0.86, 1], ease: 'easeInOut' }}
        />
      )}

      {/* core flash putih 1 frame di t=0.65 */}
      {!reduced && (
        <motion.div
          className="fixed inset-0 z-[132] pointer-events-none"
          style={{ background: '#fff' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.16, delay: T.flashAt, ease: 'linear' }}
        />
      )}

      {/* 12 paku dari 4 tepi layar → menuju tengah (stagger 40ms) */}
      <div className="fixed inset-0 z-[128] pointer-events-none overflow-hidden" aria-hidden="true">
        {nobaraUltNails(seed, 12).map((n) => {
          const from = n.edge === 0 ? { x: `${n.t * 100}%`, y: '-4%' }
            : n.edge === 1 ? { x: '104%', y: `${n.t * 100}%` }
              : n.edge === 2 ? { x: `${n.t * 100}%`, y: '104%' }
                : { x: '-4%', y: `${n.t * 100}%` };
          return (
            <motion.div
              key={n.id}
              className="absolute"
              style={{ left: from.x, top: from.y, width: 3.5, height: 46, borderRadius: 2, rotate: n.rot }}
              initial={{ opacity: 0, scaleY: 0.4 }}
              animate={reduced ? { opacity: 0 } : {
                opacity: [0, 1, 1, 0],
                x: [0, `${n.dx}vmin`],
                y: [0, `${n.dy}vmin`],
                scaleY: [0.4, 1, 1, 0.8],
              }}
              transition={{ duration: 0.62, delay: T.nailsAt + n.delay, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className="w-full h-full" style={{
                background: `linear-gradient(180deg, ${NOBARA_CORE}, ${NOBARA_ORANGE} 60%, ${NOBARA_DARK})`,
                boxShadow: `0 0 10px ${NOBARA_ORANGE}cc`,
              }} />
            </motion.div>
          );
        })}
      </div>

      {/* LEDAKAN BESAR di tengah layar (di bawah konten kuis z-100? TIDAK —
          burst di kartu jawaban; ini hanya kilau pusat ringan) */}
      <motion.div
        className="fixed left-1/2 top-1/2 z-[122] pointer-events-none"
        style={{ width: 10, height: 10, marginLeft: -5, marginTop: -5 }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.5, scale: 18 } : { opacity: [0, 0.85, 0], scale: [1, 26, 30] }}
        transition={{ duration: 0.7, delay: T.boomAt, ease: [0.55, 0, 1, 0.45] }}
      >
        <div className="w-full h-full rounded-full" style={{
          background: `radial-gradient(circle, ${NOBARA_CORE} 0%, ${NOBARA_ORANGE} 40%, ${NOBARA_RED}00 70%)`,
        }} />
      </motion.div>

      {/* opsi salah meledak satu-satu (marker di atas tombol yang di-cut) */}
      {cutIds.map((id, i) => (
        <NobaraCutMarker key={id} id={id} reduced={reduced} delay={T.cutAt + i * T.cutStagger} />
      ))}

      {/* kanji 共鳴り・魂 (ともなり・たましい) — momen puncak */}
      <motion.span
        data-nobara-ult-kanji
        className="fixed left-1/2 z-[133] font-serif font-black select-none pointer-events-none"
        style={{
          top: '18%', x: '-50%',
          fontSize: 'clamp(38px, 9vmin, 84px)',
          color: NOBARA_CORE,
          WebkitTextStroke: `2px ${NOBARA_RED}`,
          textShadow: `0 0 18px ${NOBARA_ORANGE}, 0 0 52px ${NOBARA_RED}aa`,
          willChange: 'transform, opacity',
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={reduced ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0.92], scale: [0.6, 1.16, 1, 1.02] }}
        transition={{ duration: reduced ? 0 : 0.72, delay: reduced ? 0 : T.kanjiAt, ease: [0.34, 1.56, 0.64, 1] }}
      >
        共鳴り・魂
      </motion.span>
    </>
  );
}

// Marker ledakan kecil di atas tombol opsi yang di-cut (bukan menutupi teks —
// hanya ring oranye yang berdenyut lalu memudar bersama tombol yang disabled).
function NobaraCutMarker({ id, reduced, delay }) {
  const [pos, setPos] = useState(null);
  // Cari tombol dengan data-nobara-cut-target={id} (di-set Practice) → posisikan.
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
      className="fixed z-[126] pointer-events-none"
      style={{ left: pos.x, top: pos.y, width: pos.w, height: pos.h, borderRadius: 2 }}
      initial={{ opacity: 0 }}
      animate={reduced ? { opacity: 0.8 } : { opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      <div className="w-full h-full" style={{
        border: `2px solid ${NOBARA_ORANGE}`,
        boxShadow: `0 0 16px 4px ${NOBARA_ORANGE}aa, inset 0 0 12px ${NOBARA_RED}66`,
        background: `radial-gradient(circle at 50% 50%, ${NOBARA_CORE}22, transparent 70%)`,
      }} />
    </motion.div>
  );
}

export default NobaraCurseBar;
