import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import mondaiChaptersData from "../../data/mondai-chapters.json";
import Quiz from "./Quiz";
import { useLanguage } from "../../context/LanguageContext";

const MondaiChapterFlow = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [view, setView] = useState("selector"); // selector, intro, quiz
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterProgress, setChapterProgress] = useState({});

  // Load chapter progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem("chapterProgress");
    if (savedProgress) {
      setChapterProgress(JSON.parse(savedProgress));
    }
  }, []);

  const chapters = mondaiChaptersData.chapters;

  const handleSelectChapter = (chapter) => {
    setSelectedChapter(chapter);
    setView("intro");
  };

  const handleStartQuiz = () => {
    setView("quiz");
  };

  const handleQuizComplete = (score, totalQuestions) => {
    if (selectedChapter) {
      const newProgress = {
        ...chapterProgress,
        [selectedChapter.id]: {
          score,
          totalQuestions,
          completed: true,
          timestamp: Date.now(),
        },
      };
      setChapterProgress(newProgress);
      localStorage.setItem("chapterProgress", JSON.stringify(newProgress));
    }
    setView("selector");
    setSelectedChapter(null);
  };

  // ── Chapter Selector View (Kurikulum MNN Pattern) ───────────────────────────
  if (view === "selector") {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
        <button 
          onClick={() => navigate(-1)}
          className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali' : 'Back'}
        </button>
        <header className="mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-seigaiha opacity-[0.05] pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>
          <h1 className="text-4xl sm:text-7xl md:text-8xl font-serif font-black text-sumi tracking-tighter relative z-10">
            {language === 'id' ? 'Latihan' : 'Practice'} <span className="text-shu">Mondai</span>
          </h1>
          <p className="text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-sumi/60 mt-4 sm:mt-6 relative z-10">
            {language === 'id' ? 'Pilih bab untuk mulai latihan' : 'Select a chapter to begin your practice session'}
          </p>
        </header>

        <div className="flex flex-col gap-4 sm:gap-6">
          {chapters.map((chapter) => {
            const chapterData = chapterProgress[chapter.id];
            const isCompleted = chapterData?.completed;
            const score = chapterData?.score || 0;
            const totalQuestions = chapterData?.totalQuestions || 87;
            const progress = isCompleted ? Math.round((score / totalQuestions) * 100) : 0;

            return (
              <motion.div
                key={chapter.chapter}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectChapter(chapter)}
                className="bg-kinari border-[3px] border-sumi shadow-[6px_6px_0_0_rgba(26,26,26,1)] hover:shadow-[2px_2px_0_0_rgba(26,26,26,1)] transition-all cursor-pointer p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between relative overflow-hidden group gap-4"
              >
                <div className="absolute inset-0 bg-seigaiha opacity-[0.03] group-hover:opacity-10 transition-opacity"></div>
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase text-shu bg-shu/10 px-3 py-1 w-fit border-[2px] border-shu/20">
                    {language === 'id' ? 'Bab' : 'Chapter'} {chapter.chapter}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-sumi">
                    {chapter.title}
                  </h2>
                  <p className="text-sm font-medium text-sumi/70">
                    {language === 'id' ? chapter.description_id : chapter.description_en}
                  </p>
                </div>
                <div className="relative z-10 flex flex-col sm:items-end gap-2 mt-4 sm:mt-0">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-sumi/40 whitespace-nowrap">
                    {chapter.grammar_ids.length} {language === 'id' ? 'Tata Bahasa' : 'Grammar'} • {chapter.kotoba_ids.length} {language === 'id' ? 'Kosakata' : 'Kotoba'}
                  </div>
                  {isCompleted && (
                    <div className="flex items-center gap-2">
                      <div className="text-[9px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                        {language === 'id' ? 'Skor' : 'Score'}
                      </div>
                      <div className="text-[10px] font-bold text-sumi font-serif">
                        {score}/{totalQuestions}
                      </div>
                      <div className="w-16 h-[4px] bg-sumi/10 rounded-full overflow-hidden">
                        <div className="h-full bg-ai transition-all duration-500" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Chapter Intro View (Kurikulum MNN Pattern) ──────────────────────────────
  if (view === "intro" && selectedChapter) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col">
        <button 
          onClick={() => setView("selector")}
          className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali' : 'Back'}
        </button>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl bg-kinari border-[4px] border-sumi shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] relative p-8 sm:p-12 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-seigaiha opacity-[0.03] pointer-events-none"></div>
            <span className="block text-5xl font-black text-sumi mb-4 relative z-10">
              {selectedChapter.chapter.toString().padStart(2, '0')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-sumi mb-6 relative z-10">
              {selectedChapter.title}
            </h2>
            
            <div className="text-left mb-8 bg-kinari-light/50 p-5 rounded-none border-[3px] border-sumi/20 relative z-10">
              <h3 className="font-bold text-sumi mb-3 text-lg relative z-10">
                {language === 'id' ? 'Tujuan Belajar:' : 'Learning Objectives:'}
              </h3>
              <ul className="space-y-2">
                {selectedChapter.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start relative z-10">
                    <span className="mr-2 mt-1 text-sumi relative z-10">•</span>
                    <span className="text-sumi relative z-10">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 relative z-10">
              <button
                onClick={handleStartQuiz}
                className="w-full py-4 sm:py-6 px-6 rounded-none bg-sumi text-kinari-light font-bold text-xl sm:text-2xl shadow-[8px_8px_0_0_rgba(26,26,26,1)] hover:shadow-[4px_4px_0_0_rgba(26,26,26,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] active:shadow-[0_0_0_0_rgba(26,26,26,1)] active:translate-x-0 active:translate-y-0 transition-all uppercase tracking-[0.2em]"
              >
                {language === 'id' ? 'Mulai Quiz' : 'Start Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz View ───────────────────────────────────────────────────────────────
  if (view === "quiz" && selectedChapter) {
    return (
      <div className="min-h-screen bg-kinari-light flex flex-col">
        <Quiz
          chapter={selectedChapter}
          onComplete={handleQuizComplete}
        />
      </div>
    );
  }

  return null;
};

export default MondaiChapterFlow;
