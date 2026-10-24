import { motion, AnimatePresence } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { playDramaticAudio } from '../../utils/audio';
import { EraPaper } from '../../components/EraPaper';
import { Button } from '../../components/ui/Button';
import { MODE_JP } from './scramble';

// ─────────────────────────────────────────────────────────────────────────────
// ScrambleBoard — papan susun balok untuk soal grammar.
// Atas: slot jawaban (klik balok untuk mengembalikan ke kolam).
// Bawah: kolam balok (klik untuk memasang ke slot berikutnya).
// ─────────────────────────────────────────────────────────────────────────────
const BLOCK_BASE =
  'border-[3px] border-sumi font-serif leading-none rounded-none transition-all ' +
  'shadow-[4px_4px_0_0_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] ' +
  'active:shadow-none select-none';

function jpBlock(text) {
  return text.length <= 2;
}

export function ScrambleBoard({
  question, placed, checked, isCorrect, language,
  onPlace, onRemove, onClear, onCheck, onNext, onBack,
  index, total, score,
}) {
  if (!question) return null;

  const isJpMode = question.mode === MODE_JP;
  const byKey = new Map(question.blocks.map((b) => [b.key, b]));
  const placedBlocks = placed.map((k) => byKey.get(k)).filter(Boolean);
  const poolLeft = question.blocks.filter((b) => !placed.includes(b.key));

  const canCheck = placed.length === question.answerKeys.length && !checked;
  const allPlaced = placed.length === question.answerKeys.length;

  const t = (id, en) => (language === 'id' ? id : en);

  return (
    <div data-quiz-shell className="relative max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col">
      <EraPaper />

      <button
        onClick={onBack}
        className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20 w-fit"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> {t('Kembali', 'Back')}
      </button>

      <header className="flex justify-between items-end mb-10 border-b-[4px] border-sumi pb-6 relative z-10">
        <div className="text-xs sm:text-sm uppercase tracking-[0.3em] font-bold text-sumi/60">
          {t('Soal', 'Question')} <span className="text-ai text-lg sm:text-xl">{index + 1}</span> {t('dari', 'of')} {total}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-shu border-[2px] border-shu/30 px-2 py-1">
            {isJpMode ? t('Susun Jepang', 'Build Japanese') : t('Susun Arti', 'Build Meaning')}
          </span>
          <span className="text-xs font-bold tracking-widest uppercase text-sumi/40">
            {t('Skor', 'Score')}: <span className="text-ai">{score}</span>
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center relative z-10">
        {/* Prompt */}
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="w-full max-w-2xl mb-8 bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] p-6 sm:p-10 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle,currentColor_1.5px,transparent_1.5px)] bg-[length:14px_14px] text-sumi/[0.03] pointer-events-none"></div>
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/40 mb-3 relative z-10">
            {isJpMode ? t('Susun kalimat Jepang dari arti ini', 'Build the Japanese sentence') : t('Susun arti dari kalimat Jepang ini', 'Build the meaning of this sentence')}
          </p>
          <h2 className={`relative z-10 font-serif font-black text-sumi leading-snug break-words ${isJpMode ? 'text-xl sm:text-3xl' : 'text-2xl sm:text-4xl'}`}>
            {question.prompt}
          </h2>
          {question.promptRomaji && (
            <p className="relative z-10 text-xs sm:text-sm font-bold tracking-widest text-sumi/50 uppercase mt-3">
              {question.promptRomaji}
            </p>
          )}
          {question.promptRomaji && (
            <button
              onClick={(e) => { e.stopPropagation(); playDramaticAudio(question.prompt); }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full border-[3px] border-sumi text-sumi flex items-center justify-center bg-kinari-light/80 hover:bg-sumi hover:text-kinari-light transition-all z-20"
              title={t('Dengarkan', 'Listen')}
            >
              <Volume2 size={16} />
            </button>
          )}
        </motion.div>

        {/* Slot jawaban */}
        <div
          className={`w-full max-w-2xl min-h-[110px] border-[3px] border-sumi bg-kinari-light p-3 flex flex-wrap items-center gap-2 mb-6 ${
            checked ? (isCorrect ? 'ring-4 ring-matcha' : 'ring-4 ring-shu') : ''
          }`}
        >
          {placedBlocks.length === 0 && (
            <span className="text-[11px] uppercase tracking-[0.28em] text-sumi/30 font-bold px-2">
              {t('Klik balok di bawah untuk menyusun →', 'Click the blocks below to build →')}
            </span>
          )}
          <AnimatePresence>
            {placedBlocks.map((b) => (
              <motion.button
                key={b.key}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.12 }}
                onClick={() => !checked && onRemove(b.key)}
                disabled={checked}
                className={`${BLOCK_BASE} ${
                  checked
                    ? (isCorrect ? 'bg-matcha text-kinari-light' : 'bg-shu/15 text-sumi')
                    : 'bg-kinari hover:bg-kinari-light'
                } ${jpBlock(b.text) && isJpMode ? 'px-3 py-2 text-lg' : 'px-4 py-2.5 text-base sm:text-lg'}`}
              >
                {b.text}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Kolam balok */}
        <div className="w-full max-w-2xl flex flex-wrap gap-2 mb-8 min-h-[64px]">
          <AnimatePresence>
            {poolLeft.map((b) => (
              <motion.button
                key={b.key}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.12 }}
                onClick={() => onPlace(b.key)}
                disabled={checked}
                className={`${BLOCK_BASE} bg-kinari hover:bg-kinari-light disabled:opacity-40 ${
                  jpBlock(b.text) && isJpMode ? 'px-3 py-2 text-lg' : 'px-4 py-2.5 text-base sm:text-lg'
                }`}
              >
                {b.text}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Aksi */}
        {!checked ? (
          <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onClear}
              disabled={placed.length === 0}
              className="flex-1 !bg-kinari !text-sumi border-[4px] border-sumi uppercase tracking-[0.2em] font-bold shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] transition-all rounded-none py-4 disabled:opacity-40 disabled:shadow-none"
            >
              {t('Ulangi', 'Reset')}
            </Button>
            <Button
              onClick={onCheck}
              disabled={!canCheck}
              className="flex-[2] !bg-sumi !text-kinari-light border-[4px] border-sumi uppercase tracking-[0.2em] font-black shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] transition-all rounded-none py-4 disabled:opacity-40 disabled:shadow-none"
            >
              {allPlaced ? t('Periksa Jawaban', 'Check Answer') : t('Susun semua balok dulu', 'Place all blocks first')}
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl"
          >
            <div className={`w-full mb-4 py-3 text-center font-bold text-sm uppercase tracking-widest border-[3px] ${
              isCorrect ? 'bg-matcha/10 border-matcha text-matcha' : 'bg-shu/10 border-shu text-shu'
            }`}>
              {isCorrect ? t('✓ Benar!', '✓ Correct!') : t('✗ Salah', '✗ Wrong')}
            </div>
            <div className="w-full mb-4 bg-kinari border-[3px] border-sumi p-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-sumi/40 mb-2">
                {t('Jawaban benar', 'Correct answer')}
              </p>
              <p className="font-serif text-base sm:text-xl text-sumi leading-snug break-words">
                {question.display}
              </p>
              {isJpMode && question.romaji && (
                <p className="text-[11px] font-bold tracking-widest text-sumi/50 uppercase mt-2">
                  {question.romaji}
                </p>
              )}
            </div>
            <Button
              onClick={onNext}
              className="w-full !bg-sumi !text-kinari-light border-[4px] border-sumi uppercase tracking-[0.2em] font-black shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] transition-all rounded-none py-5 text-lg"
            >
              {index + 1 >= total ? t('Lihat Hasil →', 'See Results →') : t('Soal Berikutnya →', 'Next Question →')}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
