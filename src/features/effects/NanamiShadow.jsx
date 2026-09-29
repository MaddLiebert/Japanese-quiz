import { useState } from 'react';
import { motion } from 'motion/react';
import {
  NANAMI_ULT_THRESHOLD, NANAMI_GOLD, NANAMI_GOLD_DEEP,
} from './nanamiFx';

// ─────────────────────────────────────────────────────────────────────────────
// 十劃呪法 — bar 呪力 (じゅりょく · juryoku) 20 slot untuk pack_11 (visual
// 'nanami'). Ultimate `rare` 時間外労働・全開 = cinematic 2.4 dtk → STATE
// lembur 30 dtk (pola Megumi: timer JALAN). Mekanik 瓦落瓦落・連鎖 (beda dari
// Megumi yang bertahan): benar → +1 puing; soal berikutnya puing menghancurkan
// opsi salah; salah → kontrak batal (縛り破棄). Cinematic + mekanik menyusul
// T3 — komponen ini menyediakan bar + hook cast-nya.
//   • NanamiCurseBar → 20 slot (pola JJK konsisten); tap saat penuh = 全開.
// Filosofi (spec §6): Nanami = PRESISI + KERJA BERBUAH. Charge dari jawaban
// benar beruntun; tap tepat waktu = lembur yang menghancurkan rintangan.
// reduced-motion: bar tetap tampil & terbaca; hanya denyut yang dimatikan.
// ─────────────────────────────────────────────────────────────────────────────

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Bar 呪力 Nanami: 20 slot (2 baris × 10 kolom, pola Megumi/Nobara) ───────
// Emas (#F59E0B/#B45309) = aura lembur (identitas 黄金); navy di border tombol
// non-ready = suit korporat. `casting` disiapkan untuk state 全開 (T3).
export function NanamiCurseBar({ charge = 0, ready = false, onCast, casting = false }) {
  const [reduced] = useState(prefersReduced);

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
        {!casting && ready && (
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
        onClick={ready && !casting ? onCast : undefined}
        aria-label="呪力 — 時間外労働・全開"
        disabled={!ready || casting}
        className={`relative rounded-[4px] border-[2px] p-[4px] ${
          (ready || casting) ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
        }`}
        style={{
          borderColor: (ready || casting) ? NANAMI_GOLD : 'rgba(180,83,9,0.45)',
          background: 'rgba(10,10,10,0.66)',
          boxShadow: (ready || casting)
            ? `0 0 18px 3px ${NANAMI_GOLD}cc, inset 0 0 10px ${NANAMI_GOLD}55`
            : '0 0 8px 1px rgba(180,83,9,0.3)',
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
                style={{ background: 'rgba(180,83,9,0.12)', border: '1px solid rgba(180,83,9,0.28)' }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${NANAMI_GOLD}, ${NANAMI_GOLD_DEEP})`,
                    boxShadow: `0 0 7px ${NANAMI_GOLD}aa`,
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
        style={{ color: (ready || casting) ? '#fffbeb' : 'rgba(255,251,235,0.6)' }}
      >
        {casting ? '全開中' : `${charge}/${NANAMI_ULT_THRESHOLD}`}
      </span>
    </div>
  );
}

export default NanamiCurseBar;
