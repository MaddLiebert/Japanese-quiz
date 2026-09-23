import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useUserStats } from '../progress/ProgressContext';
import { getPack } from '../packs/packs';
import { hinaResultGif } from './hinaGifs';
import {
  HINA_CHEER_TEXT, HINA_CHEER_ROMAJI, HINA_CHEER_SOUND, isHinaCheerScore,
} from './hinaResultCheer';
import { hinaGlow } from './hinaFx';
import { playClipFile } from '../../utils/sfx';

// Stiker Hina di layar HASIL KUIS — hanya muncul kalau pack aktif pakai visual
// 'hina' (pack Hina Chono). GIF dipilih sekali dari nilai akhir:
//   nilai bagus (>=80%) → Hina senang (GIF benar) + sorakan 「すごいすごい！」
//   nilai kurang        → Hina menyemangati (GIF salah), tanpa sorakan
// Teks sorakan DISAMAKAN dengan klip suara yang diputar (streak_2.mp3).
// Dipakai di Practice (QuizResult) & Mondai (MondaiQuizResult) biar konsisten.
export function HinaResultSticker({ score = 0, total = 0, className = '' }) {
  const { progress } = useUserStats();
  const pack = getPack(progress.activePack);
  const isHina = pack?.visual === 'hina';
  // Pilih SEKALI saat mount → GIF tidak berubah-ubah tiap render.
  const [src] = useState(() => (isHina ? hinaResultGif(score, total) : null));
  const cheer = isHina && isHinaCheerScore(score, total);

  // Sorakan hanya untuk nilai bagus. Elemen <audio> di-cache per path (sfx.js),
  // jadi panggilan ganda cuma me-restart klip yang sama → tidak dobel-echo.
  // Guard ref: React StrictMode (dev) menjalankan effect 2× → tanpa ini klip
  // sorakan di-play 2× (terdengar seperti "suara sama dua kali").
  const cheeredRef = useRef(false);
  useEffect(() => {
    if (!cheer || cheeredRef.current) return;
    cheeredRef.current = true;
    playClipFile(HINA_CHEER_SOUND);
  }, [cheer]);

  if (!src) return null;

  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -14 }}
        animate={{ scale: 1, opacity: 1, rotate: 6 }}
        transition={{ type: 'spring', stiffness: 250, damping: 17, delay: 0.45 }}
        className="w-20 h-20 sm:w-28 sm:h-28 border-[3px] border-sumi bg-kinari overflow-hidden shadow-[5px_5px_0_0_rgba(26,26,26,0.3)]"
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

      {cheer && (
        <motion.div
          initial={{ scale: 0.4, opacity: 0, y: -8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.5 }}
          className="absolute top-full right-0 mt-1 whitespace-nowrap text-right font-serif font-black leading-none"
          style={{
            color: '#ff4d94',
            textShadow: hinaGlow('#ff4d94'),
            fontSize: 'clamp(0.9rem, 3vw, 1.5rem)',
          }}
        >
          {HINA_CHEER_TEXT}
          <span
            className="mt-0.5 block font-sans font-bold tracking-[0.2em]"
            style={{ color: '#ff8fb1', fontSize: '0.5em', textShadow: 'none' }}
          >
            {HINA_CHEER_ROMAJI}
          </span>
        </motion.div>
      )}
    </div>
  );
}
