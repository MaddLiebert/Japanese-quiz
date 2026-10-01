import { motion } from 'motion/react';
import { useUserStats } from '../progress/ProgressContext';
import { useLanguage } from '../../context/LanguageContext';
import { questBoard, dateKey } from './quests';

// Panel Misi Harian 日課 — tampil di Home. Gaya neo-brutalis (match repo).
export function DailyQuestPanel() {
  const { progress, claimQuest } = useUserStats();
  const { language } = useLanguage();
  const id = language === 'id';
  const board = questBoard(progress.quests, dateKey());

  return (
    <div className="border-t-[4px] border-sumi relative z-10 p-6 sm:p-12 bg-kinari-light">
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <h3 className="text-2xl sm:text-3xl font-serif font-black text-sumi tracking-tight">
          {id ? 'Misi Harian' : 'Daily Quests'}
        </h3>
        <div className="h-[3px] flex-1 bg-sumi/10" />
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40">日課</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {board.map((q) => {
          const pct = Math.round((q.current / q.target) * 100);
          return (
            <div key={q.id} className="border-[3px] border-sumi bg-kinari p-4 shadow-[4px_4px_0_0_#1a1a1a] flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border-[3px] border-sumi flex items-center justify-center font-serif text-lg font-black text-sumi shrink-0">
                  {q.emblem}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-serif font-black text-sumi truncate">{id ? q.name : q.name_en}</h4>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-sumi/50">{id ? q.desc : q.desc_en}</p>
                </div>
              </div>

              <div className="h-3 border-[2px] border-sumi bg-kinari-light overflow-hidden">
                <div className="h-full bg-ai transition-all" style={{ width: `${pct}%` }} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-sumi/60">{q.current}/{q.target}</span>
                <span className="text-[10px] font-black text-sumi/60">+{q.xp} EXP · +{q.medaru} 🪙</span>
              </div>

              {q.claimed ? (
                <div className="text-center text-[11px] font-black uppercase tracking-widest text-sumi/40 py-2 border-[3px] border-dashed border-sumi/20">
                  {id ? 'Selesai ✓' : 'Claimed ✓'}
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={!q.done}
                  onClick={() => claimQuest(q.id)}
                  className={`w-full border-[3px] border-sumi py-2 text-[11px] font-black uppercase tracking-widest transition-all ${
                    q.done
                      ? 'bg-ai text-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
                      : 'bg-sumi/10 text-sumi/30 cursor-not-allowed'
                  }`}
                >
                  {q.done ? (id ? 'Klaim' : 'Claim') : (id ? 'Belum Selesai' : 'In Progress')}
                </motion.button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
