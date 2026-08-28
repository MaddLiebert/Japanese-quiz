import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Volume2 } from "lucide-react";
import { playDramaticAudio } from "../utils/audio";
import { playCorrectSound, playWrongSound } from "../utils/sfx";
import { useLanguage } from "../context/LanguageContext";
import hiraganaData from "../data/hiragana.json";
import katakanaData from "../data/katakana.json";
import kotobaData from "../data/kotoba.json";
import grammarData from "../data/grammar.json";
import kanjiData from "../data/kanji.json";
import { useQuizSession } from "../features/quiz/useQuizSession";
import { Button } from "../components/ui/Button";
import { categoryTranslations } from "../utils/translations";

// ─── Editorial Kana Type Toggle ──────────────────────────────────────────────
function KanaTypeToggle({ active, onChange }) {
  const tabs = [
    { id: 'hiragana', label: 'Hiragana', jp: 'ひらがな' },
    { id: 'katakana', label: 'Katakana', jp: 'カタカナ' },
    { id: 'kotoba', label: 'Kotoba', jp: '言葉' },
    { id: 'kanji', label: 'Kanji', jp: '漢字' },
    { id: 'grammar', label: 'Grammar', jp: '文法' },
    { id: 'mixed', label: 'Mixed', jp: '混合' }
  ];
  return (
    <div className="flex items-end gap-4 sm:gap-8 border-b-[2px] border-sumi/10 pb-0 mb-8 sm:mb-12 overflow-x-auto no-scrollbar flex-nowrap">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`pb-4 flex flex-col items-start gap-1 transition-colors border-b-[4px] -mb-[2px] shrink-0 ${active === tab.id
            ? 'border-ai text-ai'
            : 'border-transparent text-sumi/40 hover:text-sumi/70'
            }`}
        >
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase">{tab.label}</span>
          <span className="text-lg font-serif font-black">{tab.jp}</span>
        </button>
      ))}
    </div>
  );
}

function QuizResult({ score, totalQuestions, wrongAnswers, onPlayAgain, onGoHome }) {
  const { language } = useLanguage();

  const percentage = (score / totalQuestions) * 100;
  let grade = 'C';
  if (percentage === 100) grade = 'S';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 60) grade = 'B';

  const allData = [...hiraganaData, ...katakanaData, ...kotobaData, ...grammarData, ...kanjiData];
  const wrongItems = wrongAnswers.map(id => allData.find(item => item.id === id)).filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col items-center justify-center">
      <h2 className="text-4xl sm:text-5xl font-serif text-sumi mb-12 font-black tracking-tight">
        {language === 'id' ? 'Hasil Kuis' : 'Quiz Results'}
      </h2>

      <motion.div
        initial={{ scale: 2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, rotate: -5 }}
        transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
        className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-[8px] border-shu text-shu flex flex-col items-center justify-center bg-kinari-light shadow-sm mb-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 border-[3px] border-shu opacity-60 m-2 rounded-full pointer-events-none"></div>
        <span className="text-sm sm:text-base font-bold tracking-[0.3em] uppercase mb-2 mt-4">
          {language === 'id' ? 'Nilai' : 'Grade'}
        </span>
        <span className="text-8xl sm:text-9xl font-serif font-black leading-none">{grade}</span>
      </motion.div>

      <div className="text-2xl sm:text-3xl font-serif text-sumi mb-12 font-bold tracking-widest border-b-[4px] border-sumi pb-4">
        {language === 'id' ? 'Benar' : 'Correct'}: <span className="text-ai">{score}</span> / {totalQuestions}
      </div>

      {wrongItems.length > 0 && (
        <div className="w-full max-w-lg bg-kinari p-8 sm:p-10 border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] mb-16 relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle,currentColor_2px,transparent_2px)] bg-[length:8px_8px] text-sumi/10 opacity-50 pointer-events-none"></div>
          <h3 className="text-sm uppercase tracking-[0.3em] font-bold text-sumi/60 mb-6 border-b-[2px] border-sumi/20 pb-2 relative z-10">
            {language === 'id' ? 'Perlu Latihan Lagi' : 'Needs Review'}
          </h3>
          <div className="flex flex-wrap gap-4 relative z-10">
            {wrongItems.map((item, idx) => (
              <div key={idx} className="flex items-baseline gap-2 bg-kinari-light px-4 py-2 border-[3px] border-sumi/10">
                <span className={`font-serif text-shu font-black ${item.type === 'grammar' ? 'text-lg' : 'text-3xl'}`}>{item.char}</span>
                <span className="text-xs text-sumi/60 font-bold uppercase tracking-widest">
                  {item.type === 'grammar' ? item.answer : item.type === 'kotoba' ? item.meaning : item.romaji}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
        <Button
          onClick={onPlayAgain}
          className="flex-1 !bg-kinari !text-sumi border-[4px] border-sumi uppercase tracking-[0.2em] font-bold shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] transition-all rounded-none py-4"
        >
          {language === 'id' ? 'Main Lagi' : 'Play Again'}
        </Button>
        <Button
          onClick={onGoHome}
          className="flex-1 !bg-sumi !text-kinari-light border-[4px] border-sumi uppercase tracking-[0.2em] font-bold shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] transition-all rounded-none hover:bg-sumi/90 py-4"
        >
          {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
        </Button>
      </div>
    </div>
  );
}

export function Practice() {
  const [selectedRows, setSelectedRows] = useState([]);
  const [difficulty, setDifficulty] = useState('Medium');
  const [quizStarted, setQuizStarted] = useState(false);
  const [activeKanaType, setActiveKanaType] = useState('hiragana');
  const [mixedPools, setMixedPools] = useState(['hiragana', 'katakana', 'kotoba', 'grammar', 'kanji']);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // Ini penangkal petirnya: kalau komponen mati, timer dibunuh!
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const { language } = useLanguage();

  const getTranslatedRow = (row) => {
    return (language === 'id' && categoryTranslations[row]) ? categoryTranslations[row] : row;
  };

  const activeData = activeKanaType === 'hiragana'
    ? hiraganaData
    : activeKanaType === 'katakana'
      ? katakanaData
      : activeKanaType === 'kanji'
        ? kanjiData
        : activeKanaType === 'grammar'
          ? grammarData
          : kotobaData;



  const {
    initializeQuiz,
    currentQuestion,
    options,
    answerQuestion,
    selectAnswer,
    advanceQuestion,
    answeredId,
    isAnswered,
    isCurrentAnswerCorrect,
    isFinished,
    score,
    totalQuestions,
    wrongAnswers,
    currentIndex
  } = useQuizSession();

  // Kana mode: auto-advance after 800ms (legacy)
  const handleKanaOptionClick = (option) => {
    if (isAnswered) return;

    const correct = option.id === currentQuestion.id;
    if (correct) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    answerQuestion(option.id);
  };

  // Kotoba / Grammar mode: click selects, Next button advances
  const handleKotobaOptionClick = (option) => {
    if (isAnswered) return;
    const correct = option.id === currentQuestion.id;

    if (correct) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
    selectAnswer(option.id);
  };

  const handleNext = () => {
    advanceQuestion();
  };

  const allRows = (activeKanaType === 'kotoba' || activeKanaType === 'grammar' || activeKanaType === 'kanji')
    ? [...new Set(activeData.map(item => item.category))]
    : [...new Set(activeData.map(item => item.row))];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  const handleKanaTypeChange = (type) => {
    setActiveKanaType(type);
    setSelectedRows([]); // reset selection when switching type
  };

  const toggleRow = (row) => {
    setSelectedRows(prev =>
      prev.includes(row)
        ? prev.filter(r => r !== row)
        : [...prev, row]
    );
  };

  const toggleMixedPool = (pool) => {
    setMixedPools(prev =>
      prev.includes(pool)
        ? prev.filter(p => p !== pool)
        : [...prev, pool]
    );
  };

  const handleStartQuiz = () => {
    if (activeKanaType === 'mixed') {
      if (mixedPools.length === 0) return;
      initializeQuiz({ mode: 'mixed', pools: mixedPools, difficulty });
    } else {
      if (selectedRows.length === 0) return;
      initializeQuiz({ rows: selectedRows, difficulty, sourceData: activeData });
    }
    setQuizStarted(true);
  };

  const handleFullChallenge = () => {
    if (activeKanaType === 'mixed') {
      setMixedPools(['hiragana', 'katakana', 'kotoba', 'grammar', 'kanji']);
      setDifficulty('Hard');
      initializeQuiz({ mode: 'mixed', pools: ['hiragana', 'katakana', 'kotoba', 'grammar', 'kanji'], difficulty: 'Hard' });
    } else {
      const allRowNames = (activeKanaType === 'kotoba' || activeKanaType === 'kanji')
        ? [...new Set(activeData.map(item => item.category))]
        : [...new Set(activeData.map(item => item.row))];
      setSelectedRows(allRowNames);
      setDifficulty('Hard');
      initializeQuiz({ rows: allRowNames, difficulty: 'Hard', sourceData: activeData });
    }
    setQuizStarted(true);
  };

  if (quizStarted) {
    if (isFinished) {
      return (
        <QuizResult
          score={score}
          totalQuestions={totalQuestions}
          wrongAnswers={wrongAnswers}
          onPlayAgain={() => setQuizStarted(false)}
          onGoHome={() => navigate('/')}
        />
      );
    }

    if (currentQuestion) {
      const isKotobaMode = currentQuestion.type === 'kotoba';
      const isKanjiMode = currentQuestion.type === 'kanji';
      const isGrammarMode = currentQuestion.type === 'grammar';
      const isKanaMode = !isKotobaMode && !isKanjiMode && !isGrammarMode;

      // ── Kanji Quiz UI ────────────────────────────────────────────────────────
      if (isKanjiMode) {
        return (
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-seigaiha opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>

            <button
              onClick={() => setQuizStarted(false)}
              className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20 w-fit"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali' : 'Back'}
            </button>
            <header className="flex justify-between items-end mb-12 border-b-[4px] border-sumi pb-6 relative z-10">
              <div className="text-xs sm:text-sm uppercase tracking-[0.3em] font-bold text-sumi/60">
                {language === 'id' ? 'Soal' : 'Question'} <span className="text-ai text-lg sm:text-xl">{currentIndex + 1}</span> {language === 'id' ? 'dari' : 'of'} {totalQuestions}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold tracking-widest uppercase text-sumi/40">
                  {language === 'id' ? 'Skor' : 'Score'}: <span className="text-ai">{score}</span>
                </span>
              </div>
            </header>

            <div className="flex-1 flex flex-col items-center relative z-10">
              {/* Progress bar */}
              <div className="w-full max-w-lg mb-10 h-1.5 bg-sumi/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ai transition-all duration-500"
                  style={{ width: `${(currentIndex / totalQuestions) * 100}%` }}
                />
              </div>

              {/* Kanji question card */}
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                className="w-full max-w-lg mb-8"
              >
                <div className="bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] p-8 sm:p-12 flex flex-col items-center gap-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle,currentColor_1.5px,transparent_1.5px)] bg-[length:14px_14px] text-sumi/[0.03] pointer-events-none"></div>
                  {/* TTS */}
                  <button
                    onClick={(e) => { e.stopPropagation(); playDramaticAudio(currentQuestion.char); }}
                    className="w-9 h-9 rounded-full border-[3px] border-sumi text-sumi flex items-center justify-center bg-kinari-light/80 shadow-[2px_2px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all self-end relative z-10"
                  >
                    <Volume2 size={18} />
                  </button>

                  {/* Kanji character — extra large */}
                  <h2 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-serif font-black text-sumi leading-none select-none relative z-10 text-center break-words max-w-full">
                    {currentQuestion.char}
                  </h2>

                  {/* Prompt label */}
                  {!isAnswered && (
                    <p className="text-xs font-bold tracking-[0.25em] uppercase text-sumi/40 relative z-10">
                      {language === 'id' ? '↓ Pilih artinya' : '↓ Choose the meaning'}
                    </p>
                  )}

                  {/* Feedback reveal: onyomi + kunyomi + meaning */}
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-3 border-t-[2px] border-sumi/10 pt-5 mt-2 relative z-10 w-full"
                    >
                      <div className="flex flex-wrap justify-center gap-3">
                        <div className="flex flex-col items-center px-4 py-2 border-[2px] border-sumi/20 bg-kinari-light">
                          <span className="text-[9px] font-black tracking-[0.3em] uppercase text-sumi/40 mb-1">
                            {language === 'id' ? 'On-yomi' : 'On-yomi'}
                          </span>
                          <span className="text-base font-bold text-sumi font-serif">
                            {currentQuestion.onyomi}
                          </span>
                        </div>
                        <div className="flex flex-col items-center px-4 py-2 border-[2px] border-ai/30 bg-kinari-light">
                          <span className="text-[9px] font-black tracking-[0.3em] uppercase text-ai/60 mb-1">
                            {language === 'id' ? 'Kun-yomi' : 'Kun-yomi'}
                          </span>
                          <span className="text-base font-bold text-ai font-serif">
                            {currentQuestion.kunyomi}
                          </span>
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-serif font-bold text-sumi">
                        {currentQuestion.meaning}
                      </span>
                      {currentQuestion.meaning_id && (
                        <span className="text-sm text-sumi/60 font-medium">
                          {currentQuestion.meaning_id}
                        </span>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Meaning choice options */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-lg">
                {options.map((option) => {
                  const isThisClicked = answeredId === option.id;
                  const isThisCorrect = option.id === currentQuestion.id;
                  const showGreen = isAnswered && isThisCorrect;
                  const showRed = isThisClicked && !isThisCorrect;

                  let btnClass = "border-[3px] border-sumi shadow-[5px_5px_0_0_#1a1a1a] transition-all p-4 sm:p-5 font-bold text-sumi flex flex-col items-center justify-center rounded-none text-sm sm:text-base leading-snug min-h-[70px] ";
                  if (!isAnswered) {
                    btnClass += "bg-kinari hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_0_#1a1a1a] hover:bg-kinari-light cursor-pointer";
                  } else if (showGreen) {
                    btnClass += "!bg-matcha !text-white !border-matcha translate-x-[2px] translate-y-[2px] !shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]";
                  } else if (showRed) {
                    btnClass += "!bg-shu !text-white !border-shu translate-x-[2px] translate-y-[2px] !shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]";
                  } else {
                    btnClass += "bg-kinari opacity-40 cursor-not-allowed";
                  }

                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => handleKotobaOptionClick(option)}
                      animate={
                        showGreen && isThisClicked ? { scale: [1, 1.04, 1] }
                          : showRed ? { x: [0, -8, 8, -8, 8, 0] }
                            : {}
                      }
                      transition={{ duration: 0.35 }}
                      className={btnClass}
                      disabled={isAnswered}
                    >
                      <span className="text-center font-serif">
                        {(language === 'id' && option.meaning_id) ? option.meaning_id : option.meaning}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Next button */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-lg mt-6"
                >
                  <div className={`w-full mb-4 py-3 text-center font-bold text-sm uppercase tracking-widest border-[3px] ${isCurrentAnswerCorrect
                    ? 'bg-matcha/10 border-matcha text-matcha'
                    : 'bg-shu/10 border-shu text-shu'
                    }`}>
                    {isCurrentAnswerCorrect
                      ? (language === 'id' ? '✓ Benar!' : '✓ Correct!')
                      : (language === 'id' ? '✗ Salah — lihat jawaban yang benar di atas' : '✗ Wrong — the correct answer is highlighted')
                    }
                  </div>
                  <Button
                    onClick={handleNext}
                    className="w-full !bg-sumi !text-kinari-light border-[4px] border-sumi uppercase tracking-[0.2em] font-black shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] transition-all rounded-none py-5 text-lg"
                  >
                    {currentIndex + 1 >= totalQuestions
                      ? (language === 'id' ? 'Lihat Hasil →' : 'See Results →')
                      : (language === 'id' ? 'Soal Berikutnya →' : 'Next Question →')
                    }
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        );
      }

      // ── Kotoba Quiz UI ───────────────────────────────────────────────────────
      if (isKotobaMode) {

        return (
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-seigaiha opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>

            <button
              onClick={() => setQuizStarted(false)}
              className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20 w-fit"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali' : 'Back'}
            </button>
            <header className="flex justify-between items-end mb-12 border-b-[4px] border-sumi pb-6 relative z-10">
              <div className="text-xs sm:text-sm uppercase tracking-[0.3em] font-bold text-sumi/60">
                {language === 'id' ? 'Soal' : 'Question'} <span className="text-ai text-lg sm:text-xl">{currentIndex + 1}</span> {language === 'id' ? 'dari' : 'of'} {totalQuestions}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold tracking-widest uppercase text-sumi/40">
                  {language === 'id' ? 'Skor' : 'Score'}: <span className="text-ai">{score}</span>
                </span>
              </div>
            </header>

            <div className="flex-1 flex flex-col items-center relative z-10">
              {/* Progress bar */}
              <div className="w-full max-w-lg mb-10 h-1.5 bg-sumi/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ai transition-all duration-500"
                  style={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
                />
              </div>

              {/* Question card */}
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                className="w-full max-w-lg mb-8"
              >
                <div className="bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] p-8 sm:p-12 flex flex-col items-center gap-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle,currentColor_1.5px,transparent_1.5px)] bg-[length:14px_14px] text-sumi/[0.03] pointer-events-none"></div>
                  {/* TTS button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); playDramaticAudio(currentQuestion.char); }}
                    className="w-9 h-9 rounded-full border-[3px] border-sumi text-sumi flex items-center justify-center bg-kinari-light/80 shadow-[2px_2px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all self-end relative z-10"
                  >
                    <Volume2 size={18} />
                  </button>

                  {/* Japanese character */}
                  <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-black text-sumi leading-tight select-none relative z-10 text-center break-words max-w-full">
                    {currentQuestion.char}
                  </h2>

                  {/* Feedback reveal after answering */}
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-1 border-t-[2px] border-sumi/10 pt-4 mt-2 relative z-10 w-full"
                    >
                      <span className="text-base sm:text-lg font-bold tracking-widest text-sumi/50 uppercase">
                        {currentQuestion.romaji}
                      </span>
                      <span className="text-lg sm:text-xl font-serif font-bold text-sumi">
                        {currentQuestion.meaning}
                      </span>
                      {currentQuestion.meaning_id && (
                        <span className="text-sm text-sumi/60 font-medium">
                          {currentQuestion.meaning_id}
                        </span>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Answer options */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-lg">
                {options.map((option) => {
                  const isThisClicked = answeredId === option.id;
                  const isThisCorrect = option.id === currentQuestion.id;
                  const showGreen = isAnswered && isThisCorrect;
                  const showRed = isThisClicked && !isThisCorrect;

                  let btnClass = "border-[3px] border-sumi shadow-[5px_5px_0_0_#1a1a1a] transition-all p-4 sm:p-5 font-bold text-sumi flex flex-col items-center justify-center rounded-none text-sm sm:text-base leading-snug min-h-[70px] ";

                  if (!isAnswered) {
                    btnClass += "bg-kinari hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_0_#1a1a1a] hover:bg-kinari-light cursor-pointer";
                  } else if (showGreen) {
                    btnClass += "!bg-matcha !text-white !border-matcha translate-x-[2px] translate-y-[2px] !shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]";
                  } else if (showRed) {
                    btnClass += "!bg-shu !text-white !border-shu translate-x-[2px] translate-y-[2px] !shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]";
                  } else {
                    btnClass += "bg-kinari opacity-40 cursor-not-allowed";
                  }

                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => handleKotobaOptionClick(option)}
                      animate={
                        showGreen && isThisClicked ? { scale: [1, 1.04, 1] }
                          : showRed ? { x: [0, -8, 8, -8, 8, 0] }
                            : {}
                      }
                      transition={{ duration: 0.35 }}
                      className={btnClass}
                      disabled={isAnswered}
                    >
                      <span className="text-center font-serif">
                        {(language === 'id' && option.meaning_id) ? option.meaning_id : option.meaning}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Next button - appears after answering */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-lg mt-6"
                >
                  <div className={`w-full mb-4 py-3 text-center font-bold text-sm uppercase tracking-widest border-[3px] ${isCurrentAnswerCorrect
                    ? 'bg-matcha/10 border-matcha text-matcha'
                    : 'bg-shu/10 border-shu text-shu'
                    }`}>
                    {isCurrentAnswerCorrect
                      ? (language === 'id' ? '✓ Benar!' : '✓ Correct!')
                      : (language === 'id' ? '✗ Salah — lihat jawaban yang benar di atas' : '✗ Wrong — the correct answer is highlighted')
                    }
                  </div>
                  <Button
                    onClick={handleNext}
                    className="w-full !bg-sumi !text-kinari-light border-[4px] border-sumi uppercase tracking-[0.2em] font-black shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] transition-all rounded-none py-5 text-lg"
                  >
                    {currentIndex + 1 >= totalQuestions
                      ? (language === 'id' ? 'Lihat Hasil →' : 'See Results →')
                      : (language === 'id' ? 'Soal Berikutnya →' : 'Next Question →')
                    }
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        );
      }

      // ── Kana / Grammar Quiz UI (existing) ────────────────────────────────────
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-seigaiha opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>

          <button
            onClick={() => setQuizStarted(false)}
            className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20 w-fit"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali' : 'Back'}
          </button>
          <header className="flex justify-between items-end mb-16 border-b-[4px] border-sumi pb-6 relative z-10">
            <div className="text-xs sm:text-sm uppercase tracking-[0.3em] font-bold text-sumi/60">
              {language === 'id' ? 'Soal' : 'Question'} <span className="text-ai text-lg sm:text-xl">{currentIndex + 1}</span> {language === 'id' ? 'dari' : 'of'} {totalQuestions}
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
                    onClick={() => handleKanaOptionClick(option)}
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
          </div>
        </div>
      );
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali' : 'Back'}
      </button>
      <header className="mb-12 sm:mb-16 border-b-[4px] border-sumi pb-6 sm:pb-8 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-asanoha opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black text-sumi tracking-tighter relative z-10">
          {language === 'id' ? 'Sesi' : 'Practice'} <span className="text-ai">{language === 'id' ? 'Latihan' : 'Session'}</span>
        </h1>
        <p className="text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-sumi/60 mt-3 sm:mt-4 relative z-10">
          {language === 'id' ? 'Atur pengaturan kuis kamu di sini' : 'Configure your quiz parameters'}
        </p>
      </header>

      <div className="space-y-16">
        {/* Kana Type Toggle */}
        <KanaTypeToggle active={activeKanaType} onChange={handleKanaTypeChange} />

        {/* Row Selection / Mixed Pool Selection */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-serif font-bold text-sumi">
              {activeKanaType === 'mixed'
                ? (language === 'id' ? 'Pilih Konten' : 'Include Content')
                : (language === 'id' ? 'Pilih Target' : `Target ${activeKanaType === 'kotoba' || activeKanaType === 'grammar' ? 'Categories' : 'Rows'}`)}
            </h2>
            <div className="h-[2px] flex-1 bg-sumi/10"></div>
          </div>

          {activeKanaType === 'mixed' ? (
            <div className="flex flex-wrap gap-4">
              {['hiragana', 'katakana', 'kotoba', 'grammar', 'kanji'].map(pool => {
                const isSelected = mixedPools.includes(pool);
                return (
                  <button
                    key={pool}
                    onClick={() => toggleMixedPool(pool)}
                    className={`px-8 py-4 border-[3px] border-sumi font-bold text-sm tracking-widest uppercase transition-all shadow-[4px_4px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a] ${isSelected
                      ? 'bg-sumi text-kinari-light translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0_0_#1a1a1a]'
                      : 'bg-kinari text-sumi hover:bg-kinari-light'
                      }`}
                  >
                    {pool}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {allRows.map(row => {
                const isSelected = selectedRows.includes(row);
                return (
                  <button
                    key={row}
                    onClick={() => toggleRow(row)}
                    className={`px-8 py-4 border-[3px] border-sumi font-bold text-sm tracking-widest uppercase transition-all shadow-[4px_4px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a] ${isSelected
                      ? 'bg-sumi text-kinari-light translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0_0_#1a1a1a]'
                      : 'bg-kinari text-sumi hover:bg-kinari-light'
                      }`}
                  >
                    {getTranslatedRow(row)} {(activeKanaType === 'kotoba' || activeKanaType === 'grammar' || activeKanaType === 'kanji') ? '' : (language === 'id' ? 'Baris' : 'Row')}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Difficulty Selection */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-serif font-bold text-sumi">
              {language === 'id' ? 'Tingkat Kesulitan' : 'Difficulty'}
            </h2>
            <div className="h-[2px] flex-1 bg-sumi/10"></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {difficulties.map(diff => {
              const isSelected = difficulty === diff;
              return (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`flex-1 py-4 border-[3px] border-sumi font-bold text-sm tracking-widest uppercase transition-all shadow-[4px_4px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a] ${isSelected
                    ? 'bg-ai text-kinari-light translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0_0_#1a1a1a]'
                    : 'bg-kinari text-sumi hover:bg-kinari-light'
                    }`}
                >
                  {language === 'id'
                    ? (diff === 'Easy' ? 'Gampang' : diff === 'Medium' ? 'Lumayan' : 'Susah')
                    : diff
                  }
                </button>
              );
            })}
          </div>
        </section>

        {/* Start Button */}
        <div className="pt-8">
          <Button
            onClick={handleStartQuiz}
            disabled={activeKanaType === 'mixed' ? mixedPools.length === 0 : selectedRows.length === 0}
            className={`w-full py-6 sm:py-8 text-xl sm:text-2xl tracking-[0.3em] font-black uppercase border-[4px] border-sumi rounded-none shadow-[8px_8px_0_0_#1a1a1a] transition-all ${(activeKanaType === 'mixed' ? mixedPools.length === 0 : selectedRows.length === 0)
              ? '!bg-kinari !text-sumi/30 cursor-not-allowed !shadow-none !border-sumi/30 hover:translate-x-0 hover:translate-y-0'
              : '!bg-shu !text-kinari-light hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0_0_#1a1a1a]'
              }`}
          >
            {language === 'id' ? 'Mulai Kuis' : 'Start Quiz'}
          </Button>
        </div>

        {/* Full Hiragana Challenge */}
        <div className="border-t-[4px] border-sumi pt-12 mt-4 relative">
          <div className="absolute inset-0 bg-seigaiha opacity-[0.025] pointer-events-none rounded-sm"></div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-shu">
              {language === 'id' ? 'Level Bos' : 'Boss Level'}
            </span>
            <div className="h-[2px] flex-1 bg-shu/20"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-shu">全文字</span>
          </div>
          <div className="relative z-10 bg-sumi p-8 sm:p-10 border-[4px] border-sumi shadow-[12px_12px_0_0_rgba(211,56,47,0.4)] relative overflow-hidden group cursor-pointer hover:shadow-[8px_8px_0_0_rgba(211,56,47,0.6)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
            onClick={handleFullChallenge}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] bg-[length:12px_12px] text-kinari-light/5 pointer-events-none"></div>
            <div className="absolute -right-8 -top-8 text-[14rem] font-serif text-kinari-light opacity-[0.04] pointer-events-none select-none leading-none">全</div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold tracking-[0.4em] uppercase text-shu mb-3">
                  {language === 'id'
                    ? `Mode Sulit · Semua ${(activeKanaType === 'kotoba' || activeKanaType === 'kanji') ? 'Kategori' : 'Baris'} · ${activeData.length} ${activeKanaType === 'kotoba' ? 'Kata' : activeKanaType === 'kanji' ? 'Kanji' : 'Karakter'}`
                    : `Hard Mode · All ${(activeKanaType === 'kotoba' || activeKanaType === 'kanji') ? 'Categories' : 'Rows'} · ${activeData.length} ${activeKanaType === 'kotoba' ? 'Words' : activeKanaType === 'kanji' ? 'Kanji' : 'Characters'}`
                  }
                </div>
                <h3 className="text-3xl sm:text-4xl font-serif font-black text-kinari-light leading-tight tracking-tight">
                  Full {activeKanaType === 'kotoba' ? 'Kotoba' : activeKanaType === 'kanji' ? '漢字 Kanji' : activeKanaType === 'hiragana' ? 'Hiragana' : 'Katakana'}<br />
                  <span className="text-shu">{language === 'id' ? 'Tantangan Penuh' : 'Challenge'}</span>
                </h3>
              </div>
              <div className="w-16 h-16 rounded-full border-[3px] border-shu text-shu flex items-center justify-center group-hover:bg-shu group-hover:text-kinari-light transition-all flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}