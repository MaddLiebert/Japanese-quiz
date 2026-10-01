import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUserStats } from '../progress/ProgressContext';
import { useLanguage } from '../../context/LanguageContext';
import { questBoard, weekBoard, dateKey, weekKey } from './quests';
import { Glyph } from "../../components/icons/Glyph";

// Satu kartu misi — dipakai bersama oleh tier Harian & Mingguan.
// accent: 'ai' (biru, harian) | 'shu' (merah, mingguan).
function QuestCard({ q, id, accent, onClaim }) {
  const pct = Math.round((q.current / q.target) * 100);
  const done = q.done;
  const claimCls = accent === 'shu'
    ? 'bg-shu text-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
    : 'bg-ai text-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]';

  return (
    <div className="border-[3px] border-sumi bg-kinari p-4 shadow-[4px_4px_0_0_#1a1a1a] flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 border-[3px] border-sumi flex items-center justify-center shrink-0 ${accent === 'shu' ? 'bg-shu/10 text-shu' : 'text-sumi'}`}>
          <Glyph name={q.emblem} size={20} />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-serif font-black text-sumi truncate">{id ? q.name : q.name_en}</h4>
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-sumi/50">{id ? q.desc : q.desc_en}</p>
        </div>
      </div>

      <div className="h-3 border-[2px] border-sumi bg-kinari-light overflow-hidden">
        <div className={`h-full transition-all ${accent === 'shu' ? 'bg-shu' : 'bg-ai'}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black text-sumi/60">{q.current}/{q.target}</span>
        <span className="text-[10px] font-black text-sumi/60">+{q.xp} EXP · +{q.medaru} <Glyph name="coin" className="ml-0.5" /></span>
      </div>

      {q.claimed ? (
        <div className="text-center text-[11px] font-black uppercase tracking-widest text-sumi/40 py-2 border-[3px] border-dashed border-sumi/20">
          {id ? 'Selesai ✓' : 'Claimed ✓'}
        </div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!done}
          onClick={() => onClaim(q.id)}
          className={`w-full border-[3px] border-sumi py-2 text-[11px] font-black uppercase tracking-widest transition-all ${
            done ? claimCls : 'bg-sumi/10 text-sumi/30 cursor-not-allowed'
          }`}
        >
          {done ? (id ? 'Klaim' : 'Claim') : (id ? 'Belum Selesai' : 'In Progress')}
        </motion.button>
      )}
    </div>
  );
}

// Toast "Klaim Berhasil" — muncul sebentar lalu hilang sendiri (2.8 dtk).
// Neo-brutalis: border tebal + hard shadow, strip warna sesuai tier.
function ClaimToast({ toast, id }) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.seq}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className={`border-[3px] border-sumi bg-kinari-light shadow-[6px_6px_0_0_#1a1a1a] pl-3 pr-5 py-3 flex items-center gap-3 border-l-[10px] ${
              toast.accent === 'shu' ? 'border-l-shu' : 'border-l-ai'
            }`}
          >
            <Glyph name="celebrate" className="text-2xl" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] font-black text-sumi/45">
                {id ? 'Klaim Berhasil' : 'Claimed'}
              </p>
              <p className="text-sm font-serif font-black text-sumi leading-tight">
                <Glyph name={toast.emblem} className="mr-1" />{toast.name}
              </p>
              <p className="text-xs font-black text-sumi/70">+{toast.xp} EXP · +{toast.medaru} <Glyph name="coin" className="ml-0.5" /></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Panel Misi Harian 日課 + Mingguan 週課 — tampil di Home. Gaya neo-brutalis.
export function DailyQuestPanel() {
  const { progress, claimQuest, claimWeeklyQuest } = useUserStats();
  const { language } = useLanguage();
  const id = language === 'id';
  const daily = questBoard(progress.quests, dateKey());
  const weekly = weekBoard(progress.weekly, weekKey());

  // Toast state + auto-dismiss timer (dibersihkan saat unmount).
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const seqRef = useRef(0);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // Bungkus fungsi klaim: tampilkan toast HANYA kalau klaim sukses.
  const makeClaim = (claimFn, accent) => (qid) => {
    const q = [...daily, ...weekly].find((x) => x.id === qid);
    const res = claimFn(qid);
    if (!res?.ok || !q) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    seqRef.current += 1;
    setToast({ seq: seqRef.current, accent, emblem: q.emblem, name: id ? q.name : q.name_en, xp: res.xp, medaru: res.medaru });
    timerRef.current = setTimeout(() => setToast(null), 2800);
  };

  return (
    <>
      {/* ── Tier Harian 日課 ───────────────────────────────────────────── */}
      <div className="border-t-[4px] border-sumi relative z-10 p-6 sm:p-12 bg-kinari-light">
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <h3 className="text-2xl sm:text-3xl font-serif font-black text-sumi tracking-tight">
            {id ? 'Misi Harian' : 'Daily Quests'}
          </h3>
          <div className="h-[3px] flex-1 bg-sumi/10" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40">日課</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {daily.map((q) => (
            <QuestCard key={q.id} q={q} id={id} accent="ai" onClaim={makeClaim(claimQuest, 'ai')} />
          ))}
        </div>
      </div>

      {/* ── Tier Mingguan 週課 (hadiah lebih gede) ──────────────────────── */}
      <div className="border-t-[4px] border-sumi relative z-10 p-6 sm:p-12 bg-kinari">
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <h3 className="text-2xl sm:text-3xl font-serif font-black text-sumi tracking-tight">
            {id ? 'Misi Mingguan' : 'Weekly Quests'}
          </h3>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-shu border-[2px] border-shu px-2 py-0.5">
            {id ? 'Hadiah Besar' : 'Big Reward'}
          </span>
          <div className="h-[3px] flex-1 bg-sumi/10" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40">週課</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {weekly.map((q) => (
            <QuestCard key={q.id} q={q} id={id} accent="shu" onClaim={makeClaim(claimWeeklyQuest, 'shu')} />
          ))}
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/40 relative z-10">
          {id ? 'Reset tiap Senin' : 'Resets every Monday'}
        </p>
      </div>

      {/* Toast klaim (fixed di bawah layar) */}
      <ClaimToast toast={toast} id={id} />
    </>
  );
}
