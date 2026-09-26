import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import { StrokeCanvas } from '../features/writing/StrokeCanvas';
import { writingGroups, isWritable, writeXpFor } from '../features/writing/writing';
import { WRITE_LEVELS, DEFAULT_WRITE_LEVEL } from '../features/writing/writeQuiz';
import { useItemProgress, useUserStats } from '../features/progress/ProgressContext';
import { useEffectLayer } from '../features/effects/EffectContext';
import { playDramaticAudio } from '../utils/audio';
import { categoryTranslations } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import hiraganaData from '../data/hiragana.json';
import katakanaData from '../data/katakana.json';
import kanjiData from '../data/kanji.json';

const SCRIPT_LABEL = { hiragana: 'Hiragana ひらがな', katakana: 'Katakana カタカナ', kanji: 'Kanji 漢字' };

export function Writing() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { recordAnswer, forceMasterItem, itemProgress } = useItemProgress();
  const { progress } = useUserStats();
  const { triggerEffect } = useEffectLayer();

  const groups = useMemo(
    () => writingGroups({ hiragana: hiraganaData, katakana: katakanaData, kanji: kanjiData }),
    [],
  );
  const [activeScript, setActiveScript] = useState('hiragana');
  const [activeGroupKey, setActiveGroupKey] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState('animate');       // 'animate' | 'quiz'
  const [level, setLevel] = useState(DEFAULT_WRITE_LEVEL);  // 'trace' | 'memory' | 'blind'
  const [playKey, setPlayKey] = useState(0);
  const [strokeTotal, setStrokeTotal] = useState(0);
  const [correctStrokes, setCorrectStrokes] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);

  const scriptGroups = groups.filter((g) => g.script === activeScript);
  const group = groups.find((g) => g.key === activeGroupKey) || null;
  const item = group ? group.items[activeIndex] : null;
  const isMastered = item ? itemProgress[item.id]?.status === 'mastered' : false;

  const id = language === 'id';
  const label = (row) => (id && categoryTranslations[row] ? categoryTranslations[row] : row);

  const resetSession = () => {
    setPlayKey((k) => k + 1);
    setStrokeTotal(0);
    setCorrectStrokes(0);
    setMistakes(0);
    setFinished(false);
  };

  const handleComplete = () => {
    setFinished(true);
    if (!item) return;
    recordAnswer(item.id, true, writeXpFor(item, level));
    triggerEffect('correct');
  };

  // ── View 1: pilih grup ─────────────────────────────────────────────────────
  if (!group) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
        <button
          onClick={() => navigate(-1)}
          className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> {id ? 'Kembali' : 'Back'}
        </button>

        <header className="mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-seigaiha opacity-[0.05] pointer-events-none transform translate-x-1/4 -translate-y-1/4" />
          <h1 className="text-4xl sm:text-7xl md:text-8xl font-serif font-black text-sumi tracking-tighter relative z-10">
            書 <span className="text-shu">{id ? 'Latihan Menulis' : 'Writing'}</span>
          </h1>
          <p className="text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-sumi/60 mt-4 sm:mt-6 relative z-10">
            {id ? 'Urutan goresan & kuis tulis — Hiragana, Katakana, Kanji' : 'Stroke order & writing quiz — Hiragana, Katakana, Kanji'}
          </p>
        </header>

        {/* Script tabs */}
        <div className="flex items-end gap-4 sm:gap-8 border-b-[2px] border-sumi/10 mb-8 sm:mb-12 overflow-x-auto no-scrollbar">
          {Object.entries(SCRIPT_LABEL).map(([key, text]) => (
            <button
              key={key}
              onClick={() => { setActiveScript(key); setActiveGroupKey(null); }}
              className={`pb-4 text-[10px] font-bold tracking-[0.3em] uppercase border-b-[4px] -mb-[2px] shrink-0 transition-colors ${
                activeScript === key ? 'border-ai text-ai' : 'border-transparent text-sumi/40 hover:text-sumi/70'
              }`}
            >
              {text}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 sm:gap-6">
          {scriptGroups.map((g) => {
            const mastered = g.items.filter((it) => itemProgress[it.id]?.status === 'mastered').length;
            return (
              <motion.div
                key={g.key}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveGroupKey(g.key); setActiveIndex(0); resetSession(); }}
                className="bg-kinari border-[3px] border-sumi shadow-[6px_6px_0_0_rgba(var(--sumi-val),1)] hover:shadow-[2px_2px_0_0_rgba(var(--sumi-val),1)] transition-all cursor-pointer p-8 flex flex-col relative overflow-hidden group min-h-[180px]"
              >
                <div className="absolute inset-0 bg-seigaiha opacity-[0.03] group-hover:opacity-10 transition-opacity" />
                <div className="relative z-10 flex items-start justify-between w-full mb-6">
                  <h2 className="text-3xl font-serif text-sumi font-bold leading-tight">
                    {activeScript === 'kanji' ? label(g.row) : `${g.row} 行`}
                  </h2>
                  <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-sumi/50 bg-kinari-light border-2 border-sumi/20 px-2 py-1 shrink-0 ml-4">
                    {g.items.length} {activeScript === 'kanji' ? 'Kanji' : 'Char'}
                  </div>
                </div>
                <div className="relative z-10 mt-auto w-full">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                      {id ? 'Dikuasai' : 'Mastered'}
                    </span>
                    <span className="text-[10px] font-bold text-sumi font-serif">{mastered}/{g.items.length}</span>
                  </div>
                  <div className="w-full h-[4px] bg-sumi/10">
                    <div className="h-full bg-ai transition-all duration-500" style={{ width: `${(mastered / g.items.length) * 100}%` }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── View 2: latihan 1 karakter ─────────────────────────────────────────────
  const writable = isWritable(item);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen flex flex-col">
      <button
        onClick={() => setActiveGroupKey(null)}
        className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group w-fit"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> {id ? 'Kembali ke Kategori' : 'Back to Rows'}
      </button>

      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8 border-b-[4px] border-sumi pb-6">
        <h1 className="text-3xl sm:text-5xl font-serif font-black text-sumi">
          {activeScript === 'kanji' ? label(group.row) : `${group.row} 行`}
        </h1>
        <div className="text-sm font-bold tracking-[0.3em] text-sumi bg-kinari border-[3px] border-sumi px-6 py-2 shadow-[4px_4px_0_0_rgba(var(--sumi-val),1)]">
          <span className="text-ai">{activeIndex + 1}</span> / {group.items.length}
        </div>
      </header>

      {/* Character picker */}
      <div className="flex flex-wrap gap-2 mb-8">
        {group.items.map((it, idx) => (
          <button
            key={it.id}
            onClick={() => { setActiveIndex(idx); resetSession(); }}
            className={`w-11 h-11 border-[2px] font-serif text-lg transition-all ${
              idx === activeIndex
                ? 'bg-sumi text-kinari-light border-sumi'
                : 'bg-kinari-light text-sumi/70 border-sumi/20 hover:border-sumi/60'
            }`}
          >
            {it.char}
          </button>
        ))}
      </div>

      {/* Tab: Animasi / Kuis */}
      <div className="flex gap-3 mb-6">
        {[
          { key: 'animate', text: id ? 'Lihat Urutan' : 'Stroke Order' },
          { key: 'quiz', text: id ? 'Kuis Tulis' : 'Writing Quiz' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); resetSession(); }}
            className={`px-6 py-3 border-[3px] border-sumi text-[11px] font-black uppercase tracking-widest transition-all ${
              tab === t.key ? 'bg-ai text-kinari-light shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)]' : 'bg-kinari text-sumi/60'
            }`}
          >
            {t.text}
          </button>
        ))}
      </div>

      {/* Level kuis (hanya di tab kuis) */}
      {tab === 'quiz' && (
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'trace', text: id ? '1 · Jiplak' : '1 · Trace', sub: id ? 'bayangan tampak' : 'outline shown' },
            { key: 'memory', text: id ? '2 · Ingat' : '2 · Memory', sub: id ? 'lihat sekali' : 'peek once' },
            { key: 'blind', text: id ? '3 · Buta' : '3 · Blind', sub: id ? 'tanpa bantuan' : 'no help' },
          ].map((l) => (
            <button
              key={l.key}
              onClick={() => { setLevel(l.key); resetSession(); }}
              className={`px-4 py-2 border-[3px] text-left transition-all ${
                level === l.key
                  ? 'bg-shu text-kinari-light border-sumi shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)]'
                  : 'bg-kinari text-sumi/60 border-sumi/30 hover:border-sumi'
              }`}
            >
              <div className="text-[11px] font-black uppercase tracking-widest">{l.text}</div>
              <div className={`text-[9px] font-bold uppercase tracking-wider ${level === l.key ? 'text-kinari-light/70' : 'text-sumi/40'}`}>
                {l.sub} · +{WRITE_LEVELS[l.key].xp[item?.type === 'kanji' ? 'kanji' : 'kana']} XP
              </div>
            </button>
          ))}
        </div>
      )}

      {!writable ? (
        <div className="bg-kinari border-[3px] border-sumi/30 p-8 text-center text-sumi/60 font-bold uppercase tracking-widest text-sm">
          {id ? 'Karakter ini 2 huruf — latihan baca dulu, tulis menyusul.' : 'This is a 2-character combo — read it first, writing comes later.'}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8">
          <StrokeCanvas
            key={`${item.id}-${tab}-${level}`}
            char={item.char}
            mode={tab}
            level={level}
            playKey={playKey}
            onStrokeCount={setStrokeTotal}
            handlers={{
              onCorrectStroke: () => { setCorrectStrokes((n) => n + 1); },
              onMistake: () => { setMistakes((n) => n + 1); },
              onComplete: handleComplete,
            }}
          />

          {/* Info bar */}
          <div className="w-full max-w-md flex flex-col gap-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/60">
              <span>{item.romaji || item.meaning_id || item.meaning}</span>
              <span>{strokeTotal > 0 ? `${correctStrokes}/${strokeTotal} ${id ? 'goresan' : 'strokes'}` : ''}</span>
            </div>

            {tab === 'quiz' && (
              <div className={`w-full py-3 text-center font-bold text-sm uppercase tracking-widest border-[3px] ${
                finished ? 'bg-matcha/10 border-matcha text-matcha'
                  : mistakes > 0 ? 'bg-shu/10 border-shu text-shu'
                  : 'bg-kinari border-sumi/20 text-sumi/50'
              }`}>
                {finished
                  ? (id ? `✓ Selesai! +${writeXpFor(item, level)} XP` : `✓ Complete! +${writeXpFor(item, level)} XP`)
                  : mistakes > 0
                    ? (id ? `✗ ${mistakes}× meleset — coba lagi` : `✗ ${mistakes} miss — try again`)
                    : level === 'trace'
                      ? (id ? 'Tulis mengikuti bayangan' : 'Trace the outline')
                      : level === 'memory'
                        ? (id ? 'Ingat bentuknya — tanpa bayangan' : 'From memory — no outline')
                        : (id ? 'Buta — tanpa bantuan' : 'Blind — no help')}
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => setPlayKey((k) => k + 1)}
                className="!bg-kinari !text-sumi border-[3px] border-sumi uppercase tracking-widest font-bold text-xs shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)] rounded-none"
              >
                {tab === 'animate' ? (id ? '↻ Putar Ulang' : '↻ Replay') : (id ? '↻ Ulangi Kuis' : '↻ Restart Quiz')}
              </Button>

              {tab === 'animate' && (
                <Button
                  onClick={() => playDramaticAudio(item.char)}
                  className="!bg-kinari !text-sumi border-[3px] border-sumi uppercase tracking-widest font-bold text-xs shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)] rounded-none"
                >
                  <Volume2 size={14} className="inline mr-1" /> {id ? 'Dengar' : 'Listen'}
                </Button>
              )}

              <Button
                onClick={() => forceMasterItem(item.id)}
                className={`uppercase tracking-widest font-bold text-xs border-[3px] border-sumi shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)] rounded-none ${
                  isMastered ? '!bg-ai !text-kinari-light' : '!bg-kinari !text-sumi'
                }`}
              >
                {isMastered ? (id ? '✓ Dikuasai' : '✓ Mastered') : (id ? 'Tandai Dikuasai' : 'Mark Mastered')}
              </Button>

              <Button
                onClick={() => { setActiveIndex((i) => Math.min(i + 1, group.items.length - 1)); resetSession(); }}
                disabled={activeIndex >= group.items.length - 1}
                className={`uppercase tracking-widest font-bold text-xs border-[3px] border-sumi rounded-none ${
                  activeIndex >= group.items.length - 1 ? 'opacity-30 !bg-kinari !text-sumi' : '!bg-sumi !text-kinari-light shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)]'
                }`}
              >
                {id ? 'Berikutnya →' : 'Next →'}
              </Button>
            </div>

            <div className="text-center text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/40">
              Level {progress.level} · {progress.xp.toLocaleString()} XP
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Writing;
