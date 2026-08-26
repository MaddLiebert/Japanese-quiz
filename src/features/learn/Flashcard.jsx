import { useState } from "react";
import { motion } from "motion/react";
import { Volume2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { playDramaticAudio } from "../../utils/audio";
import { useLanguage } from "../../context/LanguageContext";

export function Flashcard({ kana, isMastered, onToggleMastery }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { language } = useLanguage();
  const isKotoba = kana.type === 'kotoba';
  const isGrammar = kana.type === 'grammar';
  const isKanji = kana.type === 'kanji';
  // Resolve meaning: prefer meaning_id when language is 'id' and it exists
  const displayMeaning = (language === 'id' && kana.meaning_id) ? kana.meaning_id : kana.meaning;

  return (
    <div 
      className="w-full max-w-sm aspect-[3/4] cursor-pointer mx-auto"
      style={{ perspective: 1000 }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* ── Front ─────────────────────────────────────────────────────────── */}
        <div 
          className="absolute inset-0 bg-kinari rounded-xl border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] flex flex-col items-center justify-center overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="absolute inset-0 bg-asanoha opacity-5 pointer-events-none"></div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const textToSpeak = isGrammar ? kana.char.replace('___', kana.answer) : kana.char;
              playDramaticAudio(textToSpeak);
            }}
            className="absolute top-6 left-6 w-10 h-10 rounded-full border-[3px] border-sumi text-sumi flex items-center justify-center bg-kinari-light/80 shadow-[2px_2px_0_0_#1a1a1a] z-20 hover:bg-sumi hover:text-kinari-light hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <Volume2 size={20} />
          </button>

          {isGrammar ? (
            /* Grammar front: full sentence + answer */
            <>
              <div className="text-[8px] uppercase tracking-[0.4em] font-bold text-sumi/40 mb-4 z-10">{kana.category}</div>
              <h2 className="text-4xl sm:text-5xl font-serif text-sumi leading-normal z-10 select-none text-center px-4 mb-6">
                {kana.char}
              </h2>
              <div className="text-xl font-bold text-ai z-10 tracking-widest">Answer: {kana.answer}</div>
            </>
          ) : isKotoba || isKanji ? (
            /* Kotoba/Kanji front: char + category badge */
            <>
              <div className="text-[8px] uppercase tracking-[0.4em] font-bold text-sumi/40 mb-4 z-10">{kana.category}</div>
              <h2 className="text-5xl sm:text-6xl font-serif text-sumi leading-tight z-10 select-none text-center px-4">
                {kana.char}
              </h2>
              {isKotoba && <p className="text-sm tracking-[0.2em] text-sumi/50 font-bold uppercase mt-4 z-10">{kana.romaji}</p>}
              {isKanji && (
                <p className="text-xs tracking-[0.15em] text-sumi/40 font-bold uppercase mt-2 z-10 text-center">
                  {language === 'id' ? 'Tap untuk lihat arti' : 'Tap to reveal meaning'}
                </p>
              )}
            </>
          ) : (
            /* Kana front: giant single character */
            <h2 className="text-7xl sm:text-9xl md:text-[11rem] font-serif text-sumi leading-none z-10 select-none text-center break-words max-w-full">
              {kana.char}
            </h2>
          )}

          {isMastered && (
            <div className="absolute top-6 right-6 w-10 h-10 rounded-full border-[3px] border-shu text-shu flex items-center justify-center font-bold text-sm bg-kinari-light/80 shadow-sm z-20">
              熟
            </div>
          )}
        </div>

        {/* ── Back ──────────────────────────────────────────────────────────── */}
        <div 
          className="absolute inset-0 bg-kinari-light rounded-xl border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] flex flex-col items-center justify-center p-8"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,currentColor_2px,transparent_2px)] bg-[length:8px_8px] text-sumi/5 opacity-50 pointer-events-none"></div>

          {kana.meaning ? (
            /* Kotoba/Grammar/Kanji back: meaning prominent */
            <>
              <div className="text-xs uppercase tracking-[0.5em] font-bold text-sumi/50 mb-4 relative z-10">
                {language === 'id' ? 'Arti' : 'Meaning'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif text-sumi mb-4 font-black text-center leading-tight relative z-10 px-4">
                {displayMeaning}
              </h2>
              {isKanji ? (
                /* Kanji back: show onyomi + kunyomi instead of romaji */
                <div className="border-t-[2px] border-sumi/10 pt-4 mt-2 flex flex-wrap justify-center gap-3 relative z-10 w-full">
                  <div className="flex flex-col items-center px-4 py-2 border-[2px] border-sumi/20 bg-kinari">
                    <span className="text-[9px] font-black tracking-[0.3em] uppercase text-sumi/40 mb-1">On-yomi</span>
                    <span className="text-base font-bold text-sumi font-serif">{kana.onyomi}</span>
                  </div>
                  <div className="flex flex-col items-center px-4 py-2 border-[2px] border-ai/30 bg-kinari">
                    <span className="text-[9px] font-black tracking-[0.3em] uppercase text-ai/60 mb-1">Kun-yomi</span>
                    <span className="text-base font-bold text-ai font-serif">{kana.kunyomi}</span>
                  </div>
                </div>
              ) : kana.romaji ? (
                <div className="border-t-[2px] border-sumi/10 pt-4 mt-2 text-center relative z-10 w-full">
                  <div className="text-[10px] uppercase tracking-[0.4em] font-bold text-sumi/40 mb-1">Romaji</div>
                  <p className="text-xl font-bold tracking-widest text-sumi/70">{kana.romaji}</p>
                </div>
              ) : null}
            </>
          ) : (
            /* Kana back: romaji large */
            <>
              <div className="text-xs uppercase tracking-[0.5em] font-bold text-sumi/50 mb-6 relative z-10">Romaji</div>
              <h2 className="text-6xl sm:text-7xl font-serif text-sumi mb-10 font-black tracking-widest relative z-10">{kana.romaji}</h2>
            </>
          )}
          
          <div className="relative z-10 w-full mt-auto">
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleMastery();
              }}
              className={`w-full uppercase tracking-widest font-bold text-sm py-4 border-[3px] border-sumi shadow-[4px_4px_0_0_#1a1a1a] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a] rounded-none ${isMastered ? '!bg-ai !text-kinari-light' : '!bg-kinari !text-sumi hover:!bg-kinari-light'}`}
            >
              {isMastered 
                ? (language === 'id' ? 'Dikuasai' : 'Mastered') 
                : (language === 'id' ? 'Tandai Dikuasai' : 'Mark as Mastered')
              }
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
