import { useState } from 'react';
import { motion } from 'motion/react';
import { useUserStats } from '../progress/ProgressContext';
import { getPack } from '../packs/packs';
import { hinaResultGif } from './hinaGifs';

// Stiker Hina di layar HASIL KUIS — hanya muncul kalau pack aktif pakai visual
// 'hina' (Kotodama Burst). GIF dipilih sekali dari nilai akhir:
//   nilai bagus (>=80%) → Hina senang (GIF benar)
//   nilai kurang        → Hina menyemangati (GIF salah)
// Dipakai di Practice (QuizResult) & Mondai (MondaiQuizResult) biar konsisten.
export function HinaResultSticker({ score = 0, total = 0, className = '' }) {
  const { progress } = useUserStats();
  const pack = getPack(progress.activePack);
  // Pilih SEKALI saat mount → GIF tidak berubah-ubah tiap render.
  const [src] = useState(() => (pack?.visual === 'hina' ? hinaResultGif(score, total) : null));

  if (!src) return null;

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, rotate: -14 }}
      animate={{ scale: 1, opacity: 1, rotate: 6 }}
      transition={{ type: 'spring', stiffness: 250, damping: 17, delay: 0.45 }}
      className={`w-20 h-20 sm:w-28 sm:h-28 border-[3px] border-sumi bg-kinari overflow-hidden shadow-[5px_5px_0_0_rgba(26,26,26,0.3)] pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <img
        src={src}
        alt=""
        decoding="sync"
        loading="eager"
        className="w-full h-full object-contain"
        draggable={false}
      />
    </motion.div>
  );
}
