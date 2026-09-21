import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Furigana } from "../../components/Furigana";
import { QuizHeader, AudioPlayer, ExplanationBox, MondaiQuizResult } from "../../components/MondaiComponents";
import { useUserStats, useItemProgress } from "../progress/ProgressContext";
import mondaiData from "../../data/mondai.json";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useEffectLayer } from "../effects/EffectContext";

export function MondaiQuiz() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const { progress, completeQuiz } = useUserStats();
  const { recordAnswer } = useItemProgress();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { triggerEffect, resetEffectStreak } = useEffectLayer();

  useEffect(() => { resetEffectStreak(); }, [resetEffectStreak]);

  const currentItem = mondaiData[currentIndex];

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

    const isCorrect = index === currentItem.correctIndex;
    recordAnswer(currentItem.id, isCorrect, 15);
    const newScore = isCorrect ? score + 1 : score;

    if (isCorrect) {
      triggerEffect('correct');
      setScore(newScore);
    } else {
      triggerEffect('wrong');
      setWrongAnswers((prev) => [...prev, currentIndex]);
    }

    if (currentIndex === mondaiData.length - 1) {
      const total = mondaiData.length;
      const wrongCount = total - newScore;
      const isWin = newScore >= Math.ceil(total / 2);
      completeQuiz(isWin, 'medium', currentItem.chapter || 1, wrongCount, total);
    }
  };

  const handleNext = () => {
    setIsPlaying(false);
    setSelectedOption(null);
    setIsAnswered(false);

    if (currentIndex < mondaiData.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRetry = () => {
    setIsPlaying(false);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsPlaying(false);
  };

  const handleBack = () => {
    navigate("/");
  };

  const isCorrect = selectedOption === currentItem.correctIndex;

  if (!currentItem) return null;

  if (isFinished) {
    return (
      <MondaiQuizResult
        score={score}
        totalQuestions={mondaiData.length}
        wrongAnswers={wrongAnswers}
        mondaiData={mondaiData}
        onPlayAgain={() => {
          resetEffectStreak();
          setCurrentIndex(0);
          setScore(0);
          setWrongAnswers([]);
          setIsFinished(false);
          setSelectedOption(null);
          setIsAnswered(false);
          setIsPlaying(false);
        }}
        onGoHome={() => navigate("/")}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-seigaiha opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>

      <button
        onClick={handleBack}
        className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20 w-fit"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali' : 'Back'}
      </button>
      <header className="flex justify-between items-end mb-16 border-b-[4px] border-sumi pb-6 relative z-10">
        <div className="text-xs sm:text-sm uppercase tracking-[0.3em] font-bold text-sumi/60">
          {language === 'id' ? 'Soal' : 'Question'} <span className="text-ai text-lg sm:text-xl">{currentIndex + 1}</span> {language === 'id' ? 'dari' : 'of'} {mondaiData.length}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold tracking-widest uppercase text-sumi/40">
            {language === 'id' ? 'Skor' : 'Score'}: <span className="text-ai">{score}</span>
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 pb-16">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mb-16 sm:mb-24 flex flex-col items-center gap-6 w-full"
        >
          <h2 className="text-lg sm:text-xl font-serif font-bold text-sumi mb-6 text-center">
            <Furigana text={currentItem.questionText} />
          </h2>

          <AudioPlayer
            key={currentIndex}
            audioSrc={currentItem.audio}
            duration="0:30"
            isPlaying={isPlaying}
            onPlay={handlePlayAudio}
            onPause={handlePauseAudio}
          />
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-lg">
          {currentItem.options.map((option, idx) => {
            const isThisSelected = selectedOption === idx;
            const isThisCorrect = idx === currentItem.correctIndex;
            const showCorrect = isAnswered && isThisCorrect;
            const showWrong = isAnswered && isThisSelected && !isCorrect;
            let btnClass = "bg-kinari border-[4px] border-sumi shadow-[6px_6px_0_0_rgba(26,26,26,1)] transition-all p-4 sm:p-6 font-bold text-sumi flex items-center justify-center rounded-none text-sm sm:text-base tracking-wider";

            if (!isAnswered) {
              btnClass += " hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_rgba(26,26,26,1)] hover:bg-kinari-light active:bg-ai active:text-kinari-light active:translate-x-[6px] active:translate-y-[6px] active:shadow-none cursor-pointer";
            } else {
              if (showCorrect) {
                btnClass += " !bg-matcha !text-white translate-x-[2px] translate-y-[2px] !shadow-[4px_4px_0_0_rgba(26,26,26,1)]";
              } else if (showWrong) {
                btnClass += " !bg-shu !text-white translate-x-[2px] translate-y-[2px] !shadow-[4px_4px_0_0_rgba(26,26,26,1)]";
              } else {
                btnClass += " opacity-50";
              }
            }

            const isLocked = isAnswered || isPlaying;
            return (
              <motion.button
                key={idx}
                disabled={isLocked}
                onClick={() => handleSelectOption(idx)}
                animate={
                  showCorrect && isThisSelected ? { scale: [1, 1.05, 1] }
                    : showWrong ? { x: [0, -10, 10, -10, 10, 0] }
                      : {}
                }
                transition={{ duration: 0.4 }}
                className={btnClass}
              >
                <span className="inline-block w-6 text-xs font-sans text-sumi/60 mr-2">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <Furigana text={option} />
              </motion.button>
            );
          })}
        </div>

        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg mt-6"
          >
            <div className={`w-full py-3 text-center font-bold text-sm uppercase tracking-widest border-[3px] ${isCorrect
              ? 'bg-matcha/10 border-matcha text-matcha'
              : 'bg-shu/10 border-shu text-shu'
              }`}>
              {isCorrect
                ? (language === 'id' ? '✓ Benar!' : '✓ Correct!')
                : (language === 'id'
                  ? `✗ Salah — Jawaban: ${String.fromCharCode(65 + currentItem.correctIndex)} ${currentItem.options[currentItem.correctIndex]}`
                  : `✗ Wrong — Answer: ${String.fromCharCode(65 + currentItem.correctIndex)} ${currentItem.options[currentItem.correctIndex]}`)
              }
            </div>
          </motion.div>
        )}
      </div>

      {isAnswered && (
        <ExplanationBox
          dialogScript={currentItem.dialogScript}
          explanation={currentItem.explanation}
          isCorrect={isCorrect}
          onNext={handleNext}
          onRetry={handleRetry}
          isPlaying={isPlaying}
        />
      )}
    </div>
  );
}