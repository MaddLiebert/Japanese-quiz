import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useEra } from '../features/theme/EraContext';
import { streakUnit } from '../features/progress/streak';
import { streakCopy } from '../features/progress/streakCopy';
import { StreakCandle } from './StreakCandle';

// Kartu streak belajar. Era Heian 平安: 和蝋燭 (lilin Jepang) di cangkir
// kuningan — MENYALA 灯 tiap hari belajar, PADAM 消 (berasap) kalau bolong.
// Era lain: segel kotak 炎/灰 + teks ID/EN (tidak diubah).
export const StreakIndicator = ({ count = 0, isActive = false }) => {
  const { language } = useLanguage();
  const { era } = useEra();
  const T = streakCopy(era, language);
  const unit = T.unit ?? streakUnit(count, language);
  const heian = !!T.candleLit;   // penanda era Heian (kartu lilin)

  return (
    <div className="flex items-end gap-2">
      <motion.span
        className="font-serif font-black text-3xl sm:text-4xl text-sumi leading-none"
        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        {count}
      </motion.span>
      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-sumi/60 pb-1">
        {unit}
      </span>

      <div className="relative flex items-center justify-center">
        {heian ? (
          // 和蝋燭 — nyala/padam. label ARIA ikut bahasa UI (status = informasi).
          <StreakCandle
            lit={isActive}
            size={44}
            label={isActive ? T.candleLit : T.candleOut}
          />
        ) : isActive ? (
          // Nyala — 炎 (era lain). Api berdenyut + percikan.
          <motion.div
            className="relative flex items-center justify-center"
            animate={{
              scale: [1, 1.15, 0.95, 1.1, 1],
              rotate: [-2, 3, -3, 2, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              ease: "easeInOut"
            }}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-shu border-[2.5px] border-sumi shadow-[2px_2px_0_0_#1a1a1a] flex items-center justify-center font-serif font-black text-kinari text-sm sm:text-base transform -rotate-3 select-none">
              {T.sigilOn}
            </div>
            {/* Percikan di sekitar api yang menyala */}
            <motion.span
              className="absolute -top-1 -right-1 w-2 h-2 bg-shu border border-sumi"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
            />
            <motion.span
              className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-shu border border-sumi"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
            />
          </motion.div>
        ) : (
          // Padam — 灰 (era lain). Segel hanko pudar, tanpa denyut.
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-kinari-light/60 border-[2px] border-sumi/30 border-dashed flex items-center justify-center font-serif font-bold text-sumi/40 text-sm sm:text-base select-none">
            {T.sigilOff}
          </div>
        )}
      </div>
    </div>
  );
};
