import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Volume2 } from "lucide-react";
import { useProgress } from "../features/progress/ProgressContext";
import { useLanguage } from "../context/LanguageContext";
import { playDramaticAudio } from "../utils/audio";
import { playCorrectSound, playWrongSound } from "../utils/sfx";

import hiraganaData from "../data/hiragana.json";
import katakanaData from "../data/katakana.json";
import kotobaData from "../data/kotoba.json";
import grammarData from "../data/grammar.json";
import kanjiData from "../data/kanji.json";

import { Button } from "../components/ui/Button";

const allData = [
  ...hiraganaData,
  ...katakanaData,
  ...kotobaData,
  ...grammarData,
  ...kanjiData
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function Review() {
  const { weakItems, setWeakItems } = useProgress();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Map weakItems (IDs) to actual character objects
  const weakCharacters = weakItems
    .map(id => allData.find(item => item.id === id))
    .filter(Boolean);

  const currentWeakChar = weakCharacters[currentIndex];

  useEffect(() => {
    if (isReviewing && currentWeakChar) {
      let pool = [];
      if (currentWeakChar.type === 'hiragana') pool = hiraganaData;
      else if (currentWeakChar.type === 'katakana') pool = katakanaData;
      else if (currentWeakChar.type === 'kotoba') pool = kotobaData;
      else if (currentWeakChar.type === 'grammar') pool = grammarData;
      else if (currentWeakChar.type === 'kanji') pool = kanjiData;

      const distractorsRaw = pool.filter(item => item.id !== currentWeakChar.id);
      
      // Try to get same category distractors if possible
      let distractors = [];
      if (currentWeakChar.category) {
        const sameCat = distractorsRaw.filter(d => d.category === currentWeakChar.category);
        const others = distractorsRaw.filter(d => d.category !== currentWeakChar.category);
        distractors = shuffle([...shuffle(sameCat), ...shuffle(others)]).slice(0, 3);
      } else {
        distractors = shuffle(distractorsRaw).slice(0, 3);
      }

      const newOptions = shuffle([currentWeakChar, ...distractors]);
      setOptions(newOptions);
      setIsAnswered(false);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  }, [isReviewing, currentIndex, currentWeakChar]);

  const handleOptionClick = (option) => {
    if (isAnswered) return;
    
    const correct = option.id === currentWeakChar.id;
    setSelectedOption(option.id);
    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
    
    // For kana, auto-advance. For others, let them click Next.
    const isKana = currentWeakChar.type === 'hiragana' || currentWeakChar.type === 'katakana';
    
    if (isKana) {
      setTimeout(() => {
        handleNextQuestion(correct);
      }, 800);
    }
  };

  const handleNextQuestion = (wasCorrect = isCorrect) => {
    if (wasCorrect) {
      // Remove from global weakItems. The array shifts, bringing the next item to currentIndex.
      setWeakItems(prev => prev.filter(id => id !== currentWeakChar.id));
    } else {
      // Leave it in the array, move to next index.
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Check end of review session
  useEffect(() => {
    if (isReviewing && currentIndex >= weakCharacters.length) {
      setIsReviewing(false);
      setCurrentIndex(0);
    }
  }, [isReviewing, currentIndex, weakCharacters.length]);

  // View 1: Empty State
  if (!isReviewing && weakCharacters.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col items-center justify-center relative">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-seigaiha opacity-[0.03] pointer-events-none rounded-full blur-xl"></div>
        <div className="text-center relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-[4px] border-sumi/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-sumi/40 text-2xl font-serif">無</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif text-sumi mb-6 font-bold tracking-tight">
            {language === 'id' ? 'Pikiranmu jernih.' : 'Your mind is clear.'}
          </h2>
          <p className="text-xs sm:text-sm tracking-[0.2em] font-bold uppercase text-sumi/60 mb-12">
            {language === 'id' ? 'Tidak ada materi lemah yang perlu diulang saat ini.' : 'You have no weak characters to review right now.'}
          </p>
          <Button 
            onClick={() => navigate('/')}
            className="!bg-kinari !text-sumi border-[3px] border-sumi uppercase tracking-widest font-bold shadow-[4px_4px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a] transition-all rounded-none px-8 py-4"
          >
            {language === 'id' ? 'Kembali ke Beranda' : 'Return Home'}
          </Button>
        </div>
      </div>
    );
  }

  // View 2: Pre-Review List
  if (!isReviewing && weakCharacters.length > 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen">
        <header className="mb-12 border-b-[4px] border-sumi pb-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-asanoha opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>
          <h1 className="text-5xl sm:text-7xl font-serif font-black text-sumi tracking-tighter relative z-10 flex flex-wrap items-center gap-4">
            {language === 'id' ? 'Target' : 'Targeted'} <span className="text-shu">Review</span>
            <span className="bg-shu text-kinari-light text-2xl px-4 py-1 rounded-full shadow-sm ml-2 mt-2">{weakCharacters.length}</span>
          </h1>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-sumi/60 mt-4 relative z-10">
            {language === 'id' ? 'Taklukkan titik lemahmu' : 'Conquer your weak points'}
          </p>
        </header>

        <div className="bg-kinari p-8 sm:p-12 border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] mb-16 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,currentColor_2px,transparent_2px)] bg-[length:8px_8px] text-sumi/10 opacity-50 pointer-events-none"></div>
          
          <div className="flex flex-wrap gap-4 relative z-10">
            {weakCharacters.map((item, idx) => (
              <div key={idx} className="flex items-baseline gap-2 bg-kinari-light px-5 py-3 border-[3px] border-sumi/10 shadow-sm">
                <span className={`font-serif text-shu font-black ${item.type === 'grammar' ? 'text-xl' : 'text-3xl'}`}>{item.char}</span>
                <span className="text-xs text-sumi/60 font-bold uppercase tracking-widest">
                  {item.type === 'grammar' ? item.answer : item.type === 'kotoba' || item.type === 'kanji' ? item.meaning : item.romaji}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={() => {
              setCurrentIndex(0);
              setIsReviewing(true);
            }}
            className="w-full sm:w-auto px-16 py-6 sm:py-8 text-xl sm:text-2xl tracking-[0.3em] font-black uppercase border-[4px] border-sumi rounded-none shadow-[8px_8px_0_0_#1a1a1a] transition-all !bg-shu !text-kinari-light hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0_0_#1a1a1a]"
          >
            {language === 'id' ? 'Mulai Review' : 'Start Review'}
          </Button>
        </div>
      </div>
    );
  }

  // View 3: Active Review Session
  if (isReviewing && currentWeakChar) {
    const isKotoba = currentWeakChar.type === 'kotoba';
    const isKanji = currentWeakChar.type === 'kanji';
    const isGrammar = currentWeakChar.type === 'grammar';
    const isKana = !isKotoba && !isKanji && !isGrammar;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-seigaiha opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>
        
        <header className="flex justify-between items-end mb-12 border-b-[4px] border-sumi pb-6 relative z-10">
          <div className="text-xs sm:text-sm uppercase tracking-[0.3em] font-bold text-sumi/60">
            Reviewing <span className="text-shu text-lg sm:text-xl">{currentIndex + 1}</span> {language === 'id' ? 'dari' : 'of'} {weakCharacters.length + currentIndex}
          </div>
          <button 
            onClick={() => {
              setIsReviewing(false);
              setCurrentIndex(0);
            }}
            className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40 hover:text-shu transition-colors"
          >
            {language === 'id' ? 'Akhiri Review' : 'End Review'}
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center relative z-10 pb-16">
          <motion.div 
            key={currentWeakChar.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className={`w-full max-w-lg mb-8 ${isKana ? 'flex flex-col items-center' : ''}`}
          >
            {isKana ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); playDramaticAudio(currentWeakChar.char); }}
                  className="w-10 h-10 rounded-full border-[3px] border-sumi text-sumi flex items-center justify-center bg-kinari-light/80 shadow-[2px_2px_0_0_#1a1a1a] z-20 hover:bg-sumi hover:text-kinari-light hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all mb-6"
                >
                  <Volume2 size={20} />
                </button>
                <h2 className="text-[10rem] sm:text-[14rem] font-serif font-black text-shu leading-none select-none drop-shadow-sm">
                  {currentWeakChar.char}
                </h2>
              </>
            ) : (
              <div className="bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] p-8 sm:p-12 flex flex-col items-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle,currentColor_1.5px,transparent_1.5px)] bg-[length:14px_14px] text-sumi/[0.03] pointer-events-none"></div>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const textToSpeak = isGrammar ? currentWeakChar.char.replace('___', currentWeakChar.answer) : currentWeakChar.char;
                    playDramaticAudio(textToSpeak); 
                  }}
                  className="w-9 h-9 rounded-full border-[3px] border-sumi text-sumi flex items-center justify-center bg-kinari-light/80 shadow-[2px_2px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all self-end relative z-10"
                >
                  <Volume2 size={18} />
                </button>

                {isGrammar ? (
                  <h2 className="text-3xl sm:text-4xl font-serif font-black text-sumi leading-normal select-none relative z-10 px-2 text-center">
                    {currentWeakChar.char}
                  </h2>
                ) : (
                  <h2 className="text-[7rem] sm:text-[9rem] font-serif font-black text-sumi leading-none select-none relative z-10">
                    {currentWeakChar.char}
                  </h2>
                )}

                {isAnswered && !isGrammar && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-1 border-t-[2px] border-sumi/10 pt-4 mt-2 relative z-10 w-full"
                  >
                    {!isKanji && (
                      <span className="text-base sm:text-lg font-bold tracking-widest text-sumi/50 uppercase">
                        {currentWeakChar.romaji}
                      </span>
                    )}
                    {isKanji && (
                      <div className="flex flex-wrap justify-center gap-3 mb-2">
                        <div className="flex flex-col items-center px-4 py-2 border-[2px] border-sumi/20 bg-kinari-light">
                          <span className="text-[9px] font-black tracking-[0.3em] uppercase text-sumi/40 mb-1">On-yomi</span>
                          <span className="text-base font-bold text-sumi font-serif">{currentWeakChar.onyomi}</span>
                        </div>
                        <div className="flex flex-col items-center px-4 py-2 border-[2px] border-ai/30 bg-kinari-light">
                          <span className="text-[9px] font-black tracking-[0.3em] uppercase text-ai/60 mb-1">Kun-yomi</span>
                          <span className="text-base font-bold text-ai font-serif">{currentWeakChar.kunyomi}</span>
                        </div>
                      </div>
                    )}
                    <span className="text-lg sm:text-xl font-serif font-bold text-sumi">
                      {currentWeakChar.meaning}
                    </span>
                    {currentWeakChar.meaning_id && (
                      <span className="text-sm text-sumi/60 font-medium">
                        {currentWeakChar.meaning_id}
                      </span>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-lg">
            {options.map((option) => {
              const isThisSelected = selectedOption === option.id;
              const isThisCorrect = option.id === currentWeakChar.id;
              const showCorrect = isAnswered && isThisCorrect;
              const showWrong = isThisSelected && !isCorrect;

              let btnClass = "bg-kinari border-[4px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] transition-all p-4 sm:p-6 font-bold text-sumi flex items-center justify-center rounded-none ";
              
              if (isGrammar) {
                btnClass += " text-3xl sm:text-4xl font-serif tracking-wider";
              } else if (!isKana) {
                btnClass += " text-sm sm:text-base leading-snug min-h-[70px]";
              } else {
                btnClass += " text-2xl sm:text-3xl tracking-widest";
              }
              
              if (!isAnswered) {
                 btnClass += " hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] hover:bg-kinari-light active:bg-ai active:text-kinari-light active:translate-x-[6px] active:translate-y-[6px] active:shadow-none cursor-pointer";
              } else {
                 if (showCorrect) {
                   btnClass += " !bg-matcha !text-white translate-x-[2px] translate-y-[2px] !shadow-[4px_4px_0_0_#1a1a1a]";
                 } else if (showWrong) {
                   btnClass += " !bg-shu !text-white translate-x-[2px] translate-y-[2px] !shadow-[4px_4px_0_0_#1a1a1a]";
                 } else {
                   btnClass += " opacity-50 cursor-not-allowed";
                 }
              }

              const displayContent = isGrammar ? option.answer : 
                                    (!isKana ? ((language === 'id' && option.meaning_id) ? option.meaning_id : option.meaning) : option.romaji);

              return (
                <motion.button
                  key={option.id}
                  onClick={() => handleOptionClick(option)}
                  animate={
                    showCorrect && isThisSelected ? { scale: [1, 1.05, 1] } 
                    : showWrong ? { x: [0, -10, 10, -10, 10, 0] } 
                    : {}
                  }
                  transition={{ duration: 0.4 }}
                  className={btnClass}
                  disabled={isAnswered}
                >
                  <span className={!isKana ? "text-center font-serif" : ""}>
                    {displayContent}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Next Button for non-Kana items */}
          {isAnswered && !isKana && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg mt-6"
            >
              <div className={`w-full mb-4 py-3 text-center font-bold text-sm uppercase tracking-widest border-[3px] ${
                isCorrect
                  ? 'bg-matcha/10 border-matcha text-matcha'
                  : 'bg-shu/10 border-shu text-shu'
              }`}>
                {isCorrect
                  ? (language === 'id' ? '✓ Benar!' : '✓ Correct!')
                  : (language === 'id' ? '✗ Salah — lihat jawaban yang benar di atas' : '✗ Wrong — the correct answer is highlighted')
                }
              </div>
              <Button
                onClick={() => handleNextQuestion()}
                className="w-full !bg-sumi !text-kinari-light border-[4px] border-sumi uppercase tracking-[0.2em] font-black shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] transition-all rounded-none py-5 text-lg"
              >
                {language === 'id' ? 'Selanjutnya →' : 'Next →'}
              </Button>
            </motion.div>
          )}

        </div>
      </div>
    );
  }

  return null;
}
