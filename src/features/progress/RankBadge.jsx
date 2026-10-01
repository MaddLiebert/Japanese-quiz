// RankBadge.jsx — lencana pangkat 位階. Dua bentuk:
//   variant="chip" → pil ringkas (header Shop/Inventory/Profil) — ukuran lama.
//   variant="hero" → seal besar + nama + tagline (kartu status Home/Profil).
//
// Rank PUNCAK (将軍/Shogun) dapat perlakuan HERO: aura emas 金 + kilau menyapu +
// cincin berputar + percikan ✦ (kelas `.rank-top` di index.css). Rank bawah
// tetap chip datar → kontras "biasa vs puncak" makin terasa. Semua angka/ikon
// dari modul murni features/progress/rank.js (satu sumber kebenaran).
import { motion } from 'motion/react';
import { Glyph } from '../../components/icons/Glyph';
import { useLanguage } from '../../context/LanguageContext';
import { getRankInfo, isTopRank, rankProgress } from './rank';

// Percikan dekoratif khusus rank puncak (posisi deterministik).
const Sparks = () => (
  <>
    <span className="rank-spark" style={{ top: -6, right: 8 }} aria-hidden="true">✦</span>
    <span className="rank-spark" style={{ bottom: -6, left: 8, animationDelay: '0.8s' }} aria-hidden="true">✦</span>
    <span className="rank-spark" style={{ top: '50%', left: -8, animationDelay: '1.2s' }} aria-hidden="true">✦</span>
  </>
);

export function RankBadge({ xp = 0, variant = 'chip', showProgress = false, className = '' }) {
  const { language } = useLanguage();
  const id = language === 'id';
  const info = getRankInfo(xp);
  const top = isTopRank(xp);
  const prog = rankProgress(xp);

  // ── chip: pil ringkas ────────────────────────────────────────────────────
  if (variant === 'chip') {
    return (
      <span
        data-rank={info.key}
        data-top={top ? 'true' : undefined}
        className={`relative inline-flex items-center gap-1.5 border-[2px] px-3 py-1.5 text-xs font-black uppercase tracking-wider ${
          top
            ? 'rank-top border-kin text-kin bg-sumi'
            : 'border-sumi bg-shu text-kinari-light'
        } ${className}`}
      >
        {top && <span className="rank-ring" aria-hidden="true" />}
        {top && <Sparks />}
        <Glyph name={info.glyph} size={14} className="relative" />
        <span className="relative">{info.key}</span>
      </span>
    );
  }

  // ── hero: seal besar + nama + tagline (+ progres menuju pangkat berikut) ──
  return (
    <div data-rank={info.key} data-top={top ? 'true' : undefined} className={`flex flex-col items-center text-center ${className}`}>
      <div className="relative">
        <motion.div
          className={`rank-seal-top relative flex items-center justify-center w-24 h-24 border-[4px] font-serif font-black leading-none select-none ${
            top
              ? 'rank-top bg-sumi text-kin border-kin'
              : 'border-sumi bg-kinari-light text-sumi'
          }`}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14 }}
        >
          {top && <span className="rank-ring" aria-hidden="true" />}
          <span className="absolute inset-[6px] border-[2px] border-current opacity-40" aria-hidden="true" />
          <span className="relative text-4xl">{info.kanji}</span>
        </motion.div>
        {top && <Sparks />}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Glyph name={info.glyph} size={16} className={top ? 'text-kin' : 'text-sumi/60'} />
        <span className={`font-serif font-black text-xl tracking-tight ${top ? 'text-kin' : 'text-sumi'}`}>{info.key}</span>
      </div>

      {top && (
        <span className="mt-1.5 inline-block bg-sumi text-kin border-[2px] border-kin px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.3em]">
          {id ? 'Pangkat Puncak' : 'Top Rank'}
        </span>
      )}

      <p className="mt-2 max-w-[16rem] text-[10px] uppercase tracking-[0.15em] font-bold text-sumi/50 leading-relaxed">
        {id ? info.tagline : info.tagline_en}
      </p>

      {showProgress && (
        <div className="w-full mt-3">
          {prog.isMax ? (
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-kin">
              <span>✦</span> {id ? 'Puncak Tertinggi' : 'Highest Peak'} <span>✦</span>
            </div>
          ) : (
            <>
              <div className="w-full h-2 border-2 border-sumi bg-kinari-light overflow-hidden">
                <motion.div
                  className={`h-full ${top ? 'bg-kin' : 'bg-ai'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${prog.pct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-sumi/40">
                <span>{prog.current.key}</span>
                <span>{prog.remaining.toLocaleString()} XP → {prog.next.key}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default RankBadge;
