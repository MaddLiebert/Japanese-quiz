import { motion } from "motion/react";
import { Volume2 } from "lucide-react";
import { playDramaticAudio } from "../../utils/audio";
import { useLanguage } from "../../context/LanguageContext";

export function KanaQuiz({
  currentQuestion,
  currentIndex,
  totalQuestions,
  difficulty,
  timeLeft,
  score,
  options,
  answeredId,
  isAnswered,
  isCurrentAnswerCorrect,
  onOptionClick,
  onBack,
  isGrammarMode = false,
}) {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-seigaiha opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>

      <button
        onClick={onBack}
        className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20 w-fit"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali' : 'Back'}
      </button>
      <header className="flex justify-between items-end mb-16 border-b-[4px] border-sumi pb-6 relative z-10">
        <div className="text-xs sm:text-sm uppercase tracking-[0.3em] font-bold text-sumi/60">
          {language === 'id' ? 'Soal' : 'Question'} <span className="text-ai text-lg sm:text-xl">{currentIndex + 1}</span> {language === 'id' ? 'dari' : 'of'} {totalQuestions}
        </div>
        <div className="flex items-center gap-4">
          {difficulty === 'Hard' && timeLeft !== null && (
            <span className="text-xs font-bold tracking-widest uppercase text-shu">
              {language === 'id' ? 'Waktu' : 'Time'}: <span className="text-xl">{timeLeft}s</span>
            </span>
          )}
          <span className="text-xs font-bold tracking-widest uppercase text-sumi/40">
            {language === 'id' ? 'Skor' : 'Score'}: <span className="text-ai">{score}</span>
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 pb-16">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mb-16 sm:mb-24 flex flex-col items-center gap-6"
        >
          {difficulty === 'Easy' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const textToSpeak = isGrammarMode
                  ? (currentQuestion.question || currentQuestion.char).replace('___', currentQuestion.char)
                  : currentQuestion.char;
                playDramaticAudio(textToSpeak);
              }}
              className="w-10 h-10 rounded-full border-[3px] border-sumi text-sumi flex items-center justify-center bg-kinari-light/80 shadow-[2px_2px_0_0_#1a1a1a] z-20 hover:bg-sumi hover:text-kinari-light hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              <Volume2 size={20} />
            </button>
          )}
          {isGrammarMode ? (
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-sumi leading-normal select-none drop-shadow-sm px-2 sm:px-4 text-center break-words max-w-full">
              {currentQuestion.question}
            </h2>
          ) : (
            <h2 className="text-7xl sm:text-9xl md:text-[11rem] lg:text-[13rem] font-serif font-black text-sumi leading-none select-none drop-shadow-sm text-center break-words max-w-full">
              {currentQuestion.char}
            </h2>
          )}
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-lg">
          {options.map((option) => {
            const isThisSelected = answeredId === option.id;
            const isThisCorrect = option.id === currentQuestion.id;
            const showCorrect = isAnswered && isThisCorrect;
            const showWrong = isThisSelected && !isCurrentAnswerCorrect;

            let btnClass = "bg-kinari border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] transition-all p-4 sm:p-6 font-bold text-sumi flex items-center justify-center rounded-none ";
            if (isGrammarMode) {
              btnClass += " text-3xl sm:text-4xl font-serif tracking-wider";
            } else {
              btnClass += " tracking-widest text-2xl sm:text-3xl";
            }

            if (!isAnswered) {
              btnClass += " hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] hover:bg-kinari-light active:bg-ai active:text-kinari-light active:translate-x-[6px] active:translate-y-[6px] active:shadow-none cursor-pointer";
            } else {
              if (showCorrect) {
                btnClass += " !bg-matcha !text-white translate-x-[2px] translate-y-[2px] !shadow-[4px_4px_0_0_#1a1a1a]";
              } else if (showWrong) {
                btnClass += " !bg-shu !text-white translate-x-[2px] translate-y-[2px] !shadow-[4px_4px_0_0_#1a1a1a]";
              } else {
                btnClass += " opacity-50";
              }
            }

            return (
              <motion.button
                key={option.id}
                onClick={() => onOptionClick(option)}
                animate={
                  showCorrect && isThisSelected ? { scale: [1, 1.05, 1] }
                    : showWrong ? { x: [0, -10, 10, -10, 10, 0] }
                      : {}
                }
                transition={{ duration: 0.4 }}
                className={btnClass}
                disabled={isAnswered}
              >
                {isGrammarMode ? option.char : option.romaji}
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
            <div className={`w-full py-3 text-center font-bold text-sm uppercase tracking-widest border-[3px] ${isCurrentAnswerCorrect
              ? 'bg-matcha/10 border-matcha text-matcha'
              : 'bg-shu/10 border-shu text-shu'
              }`}>
              {isCurrentAnswerCorrect
                ? (language === 'id' ? '✓ Benar!' : '✓ Correct!')
                : (language === 'id'
                  ? `✗ Salah — Jawaban: ${isGrammarMode ? currentQuestion.char : currentQuestion.romaji}`
                  : `✗ Wrong — Answer: ${isGrammarMode ? currentQuestion.char : currentQuestion.romaji}`)
              }
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
