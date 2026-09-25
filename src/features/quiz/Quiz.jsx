import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Furigana } from "../../components/Furigana";
import { AudioPlayer } from "../../components/MondaiComponents";
import { useItemProgress, useUserStats } from "../progress/ProgressContext";
import { useLanguage } from "../../context/LanguageContext";
import { useEffectLayer } from "../effects/EffectContext";

const Quiz = ({ chapter, onComplete, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const { recordAnswer } = useItemProgress();
  const { completeQuiz } = useUserStats();
  const { language } = useLanguage();
  const { triggerEffect, resetEffectStreak, endQuizSession } = useEffectLayer();

  useEffect(() => { resetEffectStreak(); }, [resetEffectStreak]);

  // Keluar dari kuis (chapter /mondai) → bar energi kutukan ikut hilang.
  useEffect(() => () => endQuizSession(), [endQuizSession]);

  const questions = chapter.questions;
  const currentQuestion = questions[currentQuestionIndex];

  const handlePlayAudio = () => {
    setIsPlaying(true);
  };

  const handlePauseAudio = () => {
    setIsPlaying(false);
  };

  const handleSelectOption = (index) => {
    if (isAnswered || isPlaying) return;

    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQuestion.correctIndex;
    recordAnswer(currentQuestion.id, isCorrect, 15);
    const newScore = isCorrect ? score + 1 : score;

    if (isCorrect) {
      triggerEffect('correct');
      setScore(newScore);
    } else {
      triggerEffect('wrong');
      setWrongAnswers((prev) => [...prev, currentQuestion.id]);
    }

    if (currentQuestionIndex === questions.length - 1) {
      const total = questions.length;
      const wrongCount = total - newScore;
      const isWin = newScore >= Math.ceil(total / 2);
      completeQuiz(isWin, 'medium', chapter.chapter || 1, wrongCount, total);
    }
  };

  const handleNext = () => {
    setIsPlaying(false);
    setSelectedOption(null);
    setIsAnswered(false);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      onComplete(score, questions.length);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  // Progress bar
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (!currentQuestion) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-seigaiha opacity-[0.03] pointer-events-none"></div>

      {onBack && (
        <button
          onClick={onBack}
          className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20 w-fit cursor-pointer"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali' : 'Back'}
        </button>
      )}

      {/* Header */}
      <div className="mb-8 relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-[4px] border-sumi pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-shu bg-shu/10 px-3 py-1 w-fit border-[2px] border-shu/20 inline-block mb-2">
            {language === 'id' ? 'Bab' : 'Chapter'} {chapter.chapter}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-sumi">
            {chapter.title}
          </h2>
        </div>
        <div className="text-sm font-bold tracking-[0.3em] text-sumi bg-kinari border-[3px] border-sumi px-6 py-2 shadow-[4px_4px_0_0_rgba(26,26,26,1)]">
          <span className="text-ai">{currentQuestionIndex + 1}</span> / {questions.length}
        </div>
      </div>

      {/* Question Card */}
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        data-quiz-area
        className="border-[4px] border-sumi bg-kinari-light p-6 sm:p-12 shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] relative z-10 flex-1 flex flex-col justify-between"
      >
        <div>
          {/* Audio Section */}
          <div className="mb-8">
            <AudioPlayer
              audioSrc={currentQuestion.audio}
              onPlay={handlePlayAudio}
              onPause={handlePauseAudio}
            />
          </div>

          {/* Question Text */}
          <h3 className="text-xl sm:text-2xl font-bold text-sumi mb-8">
            <Furigana text={currentQuestion.questionText} />
          </h3>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrect = index === currentQuestion.correctIndex;
              const showResult = isAnswered;

              let buttonClass = "bg-kinari-light border-sumi text-sumi hover:bg-sumi/5 ";
              let icon = "";

              if (showResult) {
                if (isCorrect) {
                  buttonClass = "bg-matcha/10 border-matcha text-matcha font-bold ";
                  icon = "✓ ";
                } else if (isSelected && !isCorrect) {
                  buttonClass = "bg-shu/10 border-shu text-shu font-bold ";
                  icon = "✕ ";
                } else {
                  buttonClass = "bg-sumi/5 border-sumi/20 text-sumi/40 opacity-50 ";
                }
              } else if (isSelected) {
                buttonClass = "bg-shu/10 border-shu text-shu font-bold ";
              }

              return (
                <motion.button
                  key={index}
                  whileHover={!isAnswered ? { scale: 1.01 } : {}}
                  whileTap={!isAnswered ? { scale: 0.99 } : {}}
                  onClick={() => handleSelectOption(index)}
                  data-correct={isCorrect || undefined}
                  disabled={isAnswered || isPlaying}
                  className={`
                    p-4 sm:p-6 text-left font-bold transition-all
                    border-[3px] shadow-[4px_4px_0_0_rgba(26,26,26,1)] hover:shadow-[2px_2px_0_0_rgba(26,26,26,1)] active:translate-x-[2px] active:translate-y-[2px] rounded-none
                    ${buttonClass}
                  `}
                >
                  <span className="font-mono text-sumi/60 mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="mr-2">{icon}</span>
                  <Furigana text={option} />
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-6 p-6 bg-kinari border-[3px] border-sumi/20"
            >
              <span className="font-bold text-sumi uppercase tracking-widest text-xs block mb-2">
                {language === 'id' ? 'Penjelasan:' : 'Explanation:'}
              </span>
              <p className="text-sumi/80 font-medium">{currentQuestion.explanation}</p>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 pt-6 border-t-[2px] border-sumi/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className={`
              w-full sm:w-auto px-6 py-3.5 font-bold uppercase tracking-widest text-xs transition-all border-[3px] rounded-none flex items-center justify-center
              ${currentQuestionIndex === 0 
                ? "opacity-30 cursor-not-allowed bg-kinari border-sumi/20 text-sumi/40" 
                : "bg-kinari border-sumi text-sumi shadow-[4px_4px_0_0_rgba(26,26,26,1)] hover:shadow-[2px_2px_0_0_rgba(26,26,26,1)] active:translate-x-[2px] active:translate-y-[2px]"
              }
            `}
          >
            {language === 'id' ? '← Sebelumnya' : '← Previous'}
          </button>

          <button
            onClick={handleNext}
            disabled={!isAnswered}
            className={`
              w-full sm:w-auto px-6 py-3.5 font-bold uppercase tracking-widest text-xs transition-all border-[3px] rounded-none flex items-center justify-center
              ${!isAnswered
                ? "opacity-30 cursor-not-allowed bg-kinari border-sumi/20 text-sumi/40" 
                : "bg-sumi border-sumi text-kinari-light shadow-[4px_4px_0_0_rgba(26,26,26,1)] hover:shadow-[2px_2px_0_0_rgba(26,26,26,1)] active:translate-x-[2px] active:translate-y-[2px]"
              }
            `}
          >
            {currentQuestionIndex === questions.length - 1 
              ? (language === 'id' ? 'Selesai' : 'Finish') 
              : (language === 'id' ? 'Selanjutnya →' : 'Next →')
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Quiz;
