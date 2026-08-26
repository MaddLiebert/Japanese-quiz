import { motion } from "motion/react";
import { Button } from "../components/ui/Button";
import { useProgress } from "../features/progress/ProgressContext";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

// Hanko Stamp component — reused for level and achievements
const HankoStamp = ({ text, label, delay = 0.5 }) => (
  <motion.div
    initial={{ scale: 2, opacity: 0, rotate: 15 }}
    animate={{ scale: 1, opacity: 1, rotate: -5 }}
    transition={{ type: "spring", stiffness: 150, damping: 10, delay }}
    className="relative flex flex-col items-center justify-center w-20 h-20 rounded-full border-[4px] border-shu text-shu overflow-hidden bg-kinari-light shadow-sm"
  >
    <div className="absolute inset-0 border-[2px] border-shu opacity-60 m-1 rounded-full"></div>
    <span className="text-[10px] uppercase font-bold tracking-[0.2em] mt-2 mb-0.5">{label}</span>
    <span className="text-3xl font-serif font-black leading-none">{text}</span>
  </motion.div>
);

// Achievement stamp component
const AchievementStamp = ({ id, meta, index }) => (
  <motion.div
    initial={{ scale: 2, opacity: 0, rotate: 15 }}
    animate={{ scale: 1, opacity: 1, rotate: (index % 2 === 0 ? -6 : 4) }}
    transition={{ type: "spring", stiffness: 160, damping: 10, delay: 0.1 * index }}
    className="flex flex-col items-center gap-3"
  >
    <div className="relative flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full border-[5px] border-shu text-shu overflow-hidden bg-kinari-light shadow-md">
      <div className="absolute inset-0 border-[2px] border-shu opacity-50 m-1.5 rounded-full"></div>
      <span className="text-3xl sm:text-4xl font-serif font-black leading-none z-10">{meta.label}</span>
    </div>
    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-sumi/60 text-center max-w-[5rem]">{meta.title}</span>
  </motion.div>
);

export function Home() {
  const { progress, weakItems, achievements, ACHIEVEMENT_META } = useProgress();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const progressPercentage = (progress.xp % 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">

      {/* Outer Editorial Frame (Magazine Spread Concept) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="border-[4px] border-sumi bg-kinari-light relative overflow-hidden shadow-[12px_12px_0_0_rgba(26,26,26,0.1)]"
      >

        {/* Background Decorative Kanji */}
        <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/4 text-[30rem] font-serif text-sumi opacity-[0.04] pointer-events-none select-none leading-none z-0">
          語
        </div>

        {/* --- HEADER --- */}
        <header className="grid grid-cols-1 sm:grid-cols-12 border-b-[4px] border-sumi relative z-10">
          <div className="sm:col-span-8 p-6 sm:p-12 flex flex-col justify-between border-b-[4px] sm:border-b-0 sm:border-r-[4px] border-sumi bg-seigaiha relative">
            <div className="absolute inset-0 bg-gradient-to-br from-kinari-light/80 to-transparent pointer-events-none"></div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4 mb-16 relative z-10"
            >
              <div className="w-12 h-12 bg-sumi text-kinari-light flex items-center justify-center font-serif text-2xl rotate-3 shadow-[4px_4px_0_0_#d3382f]">
                学
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.4em] font-bold text-sumi">
                  {language === 'id' ? 'Kuis Bahasa Jepang' : 'Japanese Language Quiz'}
                </span>
                <span className="text-[10px] text-sumi/60 uppercase tracking-widest mt-0.5">
                  {language === 'id' ? 'Kursus Dasar N5' : 'N5 Foundation Course'}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative z-10"
            >
              <h1 className="text-6xl sm:text-8xl md:text-9xl font-serif font-black text-sumi tracking-tighter leading-[0.9]">
                日本語<br />
                <span className="text-shu">基礎</span>
              </h1>
            </motion.div>
          </div>

          <div className="sm:col-span-4 p-8 flex flex-col items-center justify-center bg-kinari relative">
            <div className="absolute top-6 right-6 text-[10px] font-bold uppercase tracking-[0.3em] text-sumi/40 writing-vertical-rl">
              {language === 'id' ? 'Status Kamu' : 'Current Status'}
            </div>
            <HankoStamp label={language === 'id' ? 'Level' : 'Level'} text={progress.level} />

            {/* Level Progress Bar */}
            <div className="w-full mt-5 px-2">
              <div className="w-full h-2 border-2 border-sumi bg-kinari overflow-hidden rounded-full">
                <motion.div
                  className="h-full bg-ai rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-sumi/40">Lv. {progress.level}</span>
                <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-sumi/40">Lv. {progress.level + 1}</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <div className="text-sm uppercase tracking-[0.3em] font-bold text-sumi border-b-[2px] border-sumi pb-1 mb-2 inline-block">
                {language === 'id' ? 'Pemula' : 'Apprentice'}
              </div>
              <p className="text-xs text-sumi/60 uppercase tracking-widest font-bold">
                {progress.xp.toLocaleString()} {language === 'id' ? 'Total XP' : 'Total XP'}
              </p>
            </div>
          </div>
        </header>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-12 relative z-10">

          {/* LEFT COL: Up Next (Focal Point) */}
          <div className="sm:col-span-7 border-b-[4px] sm:border-b-0 sm:border-r-[4px] border-sumi p-6 sm:p-12 bg-kinari-light relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-asanoha opacity-30 transform translate-x-1/2 -translate-y-1/4 pointer-events-none"></div>

            <div className="flex items-start justify-between mb-12 sm:mb-20">
              <div className="writing-vertical-rl text-xs uppercase tracking-[0.5em] font-black text-sumi/50">
                {language === 'id' ? 'Pelajaran Berikutnya' : 'Next Lesson'}
              </div>
              <div className="bg-sumi text-kinari-light text-[10px] uppercase tracking-[0.3em] px-4 py-2 font-bold shadow-[4px_4px_0_0_#182b49] transform rotate-2">
                Module 04
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 items-end relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="relative z-10"
              >
                <h2 className="text-[7rem] sm:text-[9rem] font-serif leading-none text-sumi -ml-4 group-hover:text-ai transition-colors duration-500 drop-shadow-md tracking-tight">合格</h2>
                <div className="absolute bottom-4 -right-4 w-16 h-16 rounded-full border-[3px] border-shu text-shu flex items-center justify-center transform rotate-12 bg-kinari-light/90 shadow-sm">
                  <span className="font-serif font-black text-xl">N5</span>
                </div>
              </motion.div>

              <div className="flex flex-col gap-4 pb-6 sm:pb-8 relative z-10">
                <div>
                  <h3 className="text-3xl sm:text-4xl font-bold text-sumi font-serif leading-tight">JLPT N5<br/>Mastery</h3>
                  <p className="text-xs text-sumi/70 mt-3 uppercase tracking-[0.2em] font-bold">
                    {language === 'id'
                      ? 'Kuasai 800+ Kosakata, Tata Bahasa, dan Kanji.'
                      : '800+ Vocab, Grammar & Kanji'}
                  </p>
                </div>
                <Button onClick={() => navigate('/learn')} className="w-max shadow-[6px_6px_0_0_#1a1a1a] hover:shadow-[2px_2px_0_0_#1a1a1a] hover:translate-x-[4px] hover:translate-y-[4px] transition-all bg-ai text-kinari-light rounded-none border-[3px] border-sumi text-sm px-8 py-4 uppercase font-bold tracking-widest mt-6">
                  {language === 'id' ? 'Mulai Latihan' : 'Start Learning'}
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT COL: Stats & Actions */}
          <div className="sm:col-span-5 flex flex-col">

            {/* Stats */}
            <div className="flex-1 grid grid-cols-2 border-b-[4px] border-sumi">
              <div className="p-6 sm:p-8 border-r-[4px] border-sumi flex flex-col justify-center bg-ichimatsu">
                <h4 className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold mb-3">
                  {language === 'id' ? 'Total XP' : 'Total XP'}
                </h4>
                <div className="text-4xl sm:text-5xl font-serif text-sumi font-bold">{progress.xp.toLocaleString()}</div>
                <div className="w-full h-[3px] bg-sumi mt-5 relative">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-matcha"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
                  />
                </div>
                <div className="text-[9px] uppercase text-sumi/50 mt-2 text-right tracking-[0.2em] font-bold">
                  Lv. {progress.level + 1} {language === 'id' ? 'Hampir Naik' : 'Approaching'}
                </div>
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-center bg-kinari relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[radial-gradient(circle,currentColor_2px,transparent_2px)] bg-[length:8px_8px] text-sumi/10"></div>
                <h4 className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold mb-3">
                  {language === 'id' ? 'Streak Belajar' : 'Study Streak'}
                </h4>
                <div className="text-4xl sm:text-5xl font-serif text-sumi font-bold flex items-center gap-2">
                  {progress.streak} <span className="text-2xl sm:text-3xl">🔥</span>
                </div>
                <div className="mt-4 text-[9px] font-bold tracking-[0.2em] uppercase px-2 py-1 bg-sumi text-kinari-light inline-block w-max">
                  {language === 'id' ? '+5% Bonus Aktif' : '+5% Bonus Active'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex-1 grid grid-rows-2">
              <motion.div onClick={() => navigate('/practice')} whileHover={{ backgroundColor: "rgba(24, 43, 73, 0.05)" }} className="p-6 sm:p-8 border-b-[4px] border-sumi cursor-pointer flex items-center justify-between group transition-colors">
                <div className="flex flex-col gap-2">
                  <h4 className="text-xl sm:text-2xl font-serif font-bold text-sumi group-hover:text-ai transition-colors">
                    {language === 'id' ? 'Kuis Latihan' : 'Practice Quiz'}
                  </h4>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                    {language === 'id' ? 'Latihan Berulang' : 'Configurable Repetition'}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full border-[3px] border-sumi flex items-center justify-center group-hover:bg-ai group-hover:border-ai group-hover:text-kinari-light transition-all flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
              </motion.div>

              <motion.div onClick={() => navigate('/review')} whileHover={{ backgroundColor: "rgba(211, 56, 47, 0.05)" }} className="p-6 sm:p-8 cursor-pointer flex items-center justify-between group transition-colors relative overflow-hidden bg-kinari-light">
                <div className="absolute right-0 top-0 w-24 h-full bg-shu/5 transform skew-x-12 group-hover:scale-[3] transition-transform duration-700 ease-out z-0"></div>
                <div className="flex flex-col gap-2 relative z-10">
                  <h4 className="text-xl sm:text-2xl font-serif font-bold text-sumi flex items-center gap-3 group-hover:text-shu transition-colors">
                    {language === 'id' ? 'Ulang Soal Lemah' : 'Review Weak'}
                    {weakItems.length > 0 && (
                      <span className="bg-shu text-kinari-light text-[11px] px-2 py-0.5 rounded-full animate-pulse shadow-sm font-sans">{weakItems.length}</span>
                    )}
                  </h4>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                    {language === 'id' ? 'Fokus Terarah' : 'Targeted Focus'}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full border-[3px] border-shu text-shu flex items-center justify-center group-hover:bg-shu group-hover:text-kinari-light transition-all relative z-10 flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
              </motion.div>
            </div>

          </div>
        </div>

        {/* --- ACHIEVEMENTS SECTION --- */}
        <div className="border-t-[4px] border-sumi relative z-10 p-6 sm:p-12 bg-kinari">
          <div className="absolute top-0 right-0 w-48 h-48 bg-asanoha opacity-[0.06] pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-sumi tracking-tight">
              {language === 'id' ? 'Cap Pencapaian' : 'Earned Stamps'}
            </h3>
            <div className="h-[3px] flex-1 bg-sumi/10"></div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40">印章</span>
          </div>

          {achievements.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs sm:text-sm tracking-[0.3em] uppercase font-bold text-sumi/40 py-4 relative z-10"
            >
              {language === 'id' ? 'Selesaikan kuis untuk mendapatkan cap.' : 'Complete quizzes to earn stamps.'}
            </motion.p>
          ) : (
            <div className="flex flex-wrap gap-8 sm:gap-12 relative z-10">
              {achievements.map((id, index) => (
                ACHIEVEMENT_META[id] && (
                  <AchievementStamp key={id} id={id} meta={ACHIEVEMENT_META[id]} index={index} />
                )
              ))}
            </div>
          )}
        </div>

      </motion.div>

      {/* Subtle Settings Link */}
      <div className="flex justify-end mt-6 px-1">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/30 hover:text-sumi/60 transition-colors group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-45 transition-transform duration-300"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          {language === 'id' ? 'Pengaturan' : 'Settings'}
        </button>
      </div>
    </div>
  );
}
