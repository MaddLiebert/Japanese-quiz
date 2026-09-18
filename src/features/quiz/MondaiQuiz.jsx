import { useState } from "react";
import { motion } from "motion/react";
import { QuizHeader, AudioPlayer, ExplanationBox, MondaiQuizResult } from "../../components/MondaiComponents";
import { playCorrectSound, playWrongSound } from "../../utils/sfx";
import { useUserStats } from "../progress/ProgressContext";
import mondaiData from "../../data/mondai.json";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

export function MondaiQuiz() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const { addXp, incrementStreak, progress } = useUserStats();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const currentItem = mondaiData[currentIndex];

  const handlePlayAudio = () => {
    setIsPlaying(true);
  };

  const handlePauseAudio = () => {
    setIsPlaying(false);
  };

  const handleSelectOption = (index) => {
    if (isAnswered) return;

    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentItem.correctIndex) {
      playCorrectSound();
      addXp(15);
      incrementStreak();
      setScore((prev) => prev + 1);
    } else {
      playWrongSound();
      setWrongAnswers((prev) => [...prev, currentIndex]);
    }
  };

  const handleNext = () => {
    setIsPlaying(false);

    if (currentIndex < mondaiData.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsPlaying(false);
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

  if (!currentItem) return null;

  if (isFinished) {
    return (
      <MondaiQuizResult
        score={score}
        totalQuestions={mondaiData.length}
        wrongAnswers={wrongAnswers}
        mondaiData={mondaiData}
        onPlayAgain={() => {
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
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-[4px] border-sumi bg-kinari-light p-6 sm:p-10 shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] relative"
      >
        <QuizHeader
          chapter={currentItem.chapter}
          chapterTitle={currentItem.title}
          currentStep={currentIndex + 1}
          totalSteps={mondaiData.length}
          streak={progress.streak}
          xp={progress.xp}
        />

        {/* Back to Home Button */}
        <button
          onClick={() => navigate("/")}
          className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
        </button>

        <h2 className="text-lg sm:text-xl font-serif font-bold text-sumi mb-6 text-center">
          {currentItem.questionText}
        </h2>

        <AudioPlayer
          key={currentIndex}
          audioSrc={currentItem.audio}
          duration="0:30"
          isPlaying={isPlaying}
          onPlay={handlePlayAudio}
          onPause={handlePauseAudio}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {currentItem.options.map((option, idx) => {
            let buttonStyle = "bg-kinari text-sumi border-sumi hover:bg-kinari-light";
            if (isAnswered) {
              if (idx === currentItem.correctIndex) buttonStyle = "bg-matcha text-sumi border-sumi font-bold";
              else if (idx === selectedOption) buttonStyle = "bg-shu text-kinari-light border-sumi font-bold";
              else buttonStyle = "bg-kinari/50 text-sumi/40 border-sumi/40";
            }
            return (
              <motion.button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                whileHover={!isAnswered ? { y: -2 } : {}}
                className={`p-4 border-[3px] text-left text-sm sm:text-base font-serif font-bold transition-all shadow-[4px_4px_0_0_#1a1a1a] ${buttonStyle}`}
              >
                <span className="inline-block w-6 text-xs font-sans text-sumi/60 mr-2">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {option}
              </motion.button>
            );
          })}
        </div>

        {isAnswered && (
          <ExplanationBox
            dialogScript={currentItem.dialogScript}
            explanation={currentItem.explanation}
            isCorrect={selectedOption === currentItem.correctIndex}
            onNext={handleNext}
            onRetry={handleRetry}
            isPlaying={isPlaying}
          />
        )}
      </motion.div>
    </div>
  );
}